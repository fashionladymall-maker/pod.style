import { jest, describe, it, expect } from '@jest/globals';
import { Timestamp } from 'firebase-admin/firestore';

import { creationDataSchema } from '@/features/creations/server/creation-model';
import type { Creation } from '@/lib/types';

type MockDoc<T = Record<string, unknown>> = {
  id: string;
  data: () => T;
  updateTime?: { toDate: () => Date };
};

interface MockDbConfig {
  cacheDocs?: MockDoc[];
  fallbackDocs?: MockDoc[];
}

interface MockQuery {
  orderBy: (field: string, direction?: 'asc' | 'desc') => MockQuery;
  where: (field: string, op: string, value: unknown) => MockQuery;
  limit: (limit: number) => MockQuery;
  startAfter: (doc: unknown) => MockQuery;
  get: () => Promise<{ docs: MockDoc[] }>;
  doc: (id: string) => { get: () => Promise<{ exists: boolean }> };
}

interface MockDb {
  collection: (name: string) => MockQuery | { withConverter: () => MockQuery };
  settings: (config: unknown) => void;
  _cacheQuery: MockQuery;
  _fallbackQuery: MockQuery;
}

const createQuery = (docs: MockDoc[]): MockQuery => {
  const query: MockQuery = {
    orderBy: () => query,
    where: () => query,
    limit: () => query,
    startAfter: () => query,
    get: async () => ({ docs }),
    doc: (id: string) => ({
      get: async () => ({ exists: docs.some((doc) => doc.id === id) }),
    }),
  };
  return query;
};

const createMockDb = ({ cacheDocs = [], fallbackDocs = [] }: MockDbConfig): MockDb => {
  const cacheQuery = createQuery(cacheDocs);
  const fallbackQuery = createQuery(fallbackDocs);

  return {
    collection: (name: string) => {
      if (name === 'personalized_feed_cache') {
        return cacheQuery;
      }
      if (name === 'creations') {
        return {
          withConverter: () => fallbackQuery,
        };
      }
      throw new Error(`Unexpected collection: ${name}`);
    },
    settings: () => undefined,
    _cacheQuery: cacheQuery,
    _fallbackQuery: fallbackQuery,
  };
};

const makeCreation = (id: string): Creation => ({
  id,
  userId: 'user-1',
  prompt: 'prompt-a',
  style: 'neo',
  summary: 'summary',
  patternUri: 'https://cdn/pattern.png',
  previewPatternUri: 'https://cdn/preview.png',
  models: [],
  createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
  isPublic: true,
  orderCount: 0,
  likeCount: 0,
  likedBy: [],
  favoriteCount: 0,
  favoritedBy: [],
  commentCount: 0,
  shareCount: 0,
  remakeCount: 0,
});

const makeCacheDoc = (id: string, creationId: string): MockDoc => ({
  id,
  data: () => ({
    creationId,
    region: 'us',
    locale: 'en-US',
    rankingSignals: { trending: 0.8 },
    personaVector: [0.1, 0.2],
    updatedAt: { toDate: () => new Date('2025-01-02T00:00:00.000Z') },
  }),
});

const makeFallbackDoc = (id: string): MockDoc => {
  const rawData = {
    userId: 'user-fallback',
    prompt: 'fallback prompt',
    style: 'art-deco',
    patternUri: 'https://cdn/fallback.png',
    createdAt: Timestamp.fromDate(new Date('2025-01-03T00:00:00.000Z')),
    isPublic: true,
  };
  const data = creationDataSchema.parse(rawData);
  return {
    id,
    data: () => data,
    updateTime: { toDate: () => new Date('2025-01-03T01:00:00.000Z') },
  };
};

const encodeCursor = (payload: object) => Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64');

type FeedSource = 'cache' | 'fallback';

interface TestFeedItem {
  id: string;
  creation: Creation;
  source: FeedSource;
  region?: string;
  locale?: string;
  rankingSignals?: Record<string, number>;
  personaVector?: number[];
  updatedAt?: string | null;
  ranking?: {
    score: number;
  };
}

interface TestFeedResponse {
  items: TestFeedItem[];
  nextCursor: string | null;
  source: FeedSource;
}

interface SetupOptions extends MockDbConfig {
  findCreationResult?: Creation | null;
}

interface SetupResult {
  fetchInitialFeed: (options?: Record<string, unknown>) => Promise<TestFeedResponse>;
  fetchMoreFeed: (options?: Record<string, unknown>) => Promise<TestFeedResponse>;
  fetchFeedUpdates: (options?: Record<string, unknown>) => Promise<TestFeedResponse>;
  mockFindCreationById: jest.MockedFunction<(id: string) => Promise<Creation | null>>;
  mockLogger: { debug: jest.Mock; info: jest.Mock; warn: jest.Mock; error: jest.Mock };
}

const setupFeedService = async ({ cacheDocs = [], fallbackDocs = [], findCreationResult = null }: SetupOptions): Promise<SetupResult> => {
  const previousRankingForce = process.env.FEED_RANKING_FORCE;
  process.env.FEED_RANKING_FORCE = 'true';
  jest.resetModules();

  const currentDb = createMockDb({ cacheDocs, fallbackDocs });
  const mockFindCreationById = jest.fn(async (id: string) => {
    void id; // ensure consistent signature while avoiding unused parameter warnings
    return findCreationResult;
  });
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const initializeApp = jest.fn(() => ({}));
  const app = jest.fn(() => ({}));
  const apps: unknown[] = [];
  const credential = {
    cert: jest.fn(() => ({})),
    applicationDefault: jest.fn(() => ({})),
  };

  jest.doMock('firebase-admin', () => ({
    __esModule: true,
    default: {
      initializeApp,
      app,
      apps,
      credential,
    },
    initializeApp,
    app,
    apps,
    credential,
  }));

  jest.doMock('firebase-admin/storage', () => ({
    __esModule: true,
    default: { getStorage: jest.fn(() => ({})) },
    getStorage: jest.fn(() => ({})),
  }));

  jest.doMock('firebase-admin/firestore', () => ({
    __esModule: true,
    Timestamp,
    default: { getFirestore: jest.fn(() => currentDb) },
    getFirestore: jest.fn(() => currentDb),
  }));

  jest.doMock('@/features/creations/server/creation-repository', () => ({
    __esModule: true,
    findCreationById: mockFindCreationById,
  }));

  jest.doMock('@/utils/logger', () => ({
    __esModule: true,
    logger: mockLogger,
  }));

  const feedServiceModule = await import('../server/feed-service');

  process.env.FEED_RANKING_FORCE = previousRankingForce;

  return {
    fetchInitialFeed: feedServiceModule.fetchInitialFeed as SetupResult['fetchInitialFeed'],
    fetchMoreFeed: feedServiceModule.fetchMoreFeed as SetupResult['fetchMoreFeed'],
    fetchFeedUpdates: feedServiceModule.fetchFeedUpdates as SetupResult['fetchFeedUpdates'],
    mockFindCreationById: mockFindCreationById as jest.MockedFunction<(id: string) => Promise<Creation | null>>,
    mockLogger,
  };
};

describe('feed-service', () => {
  it('returns cached items and logs cache hit', async () => {
    const creation = makeCreation('creation-1');
    const cacheDoc = makeCacheDoc('cache-1', creation.id);

    const { fetchInitialFeed, mockFindCreationById, mockLogger } = await setupFeedService({
      cacheDocs: [cacheDoc],
      findCreationResult: creation,
    });

    const response = await fetchInitialFeed({ region: 'us', locale: 'en-US', limit: 5 });

    expect(response.source).toBe('cache');
    expect(response.items).toHaveLength(1);
    expect(response.items[0]?.creation.id).toBe(creation.id);
    expect(response.nextCursor).toEqual(expect.any(String));
    expect(response.items[0]?.ranking).toBeDefined();

    expect(mockFindCreationById).toHaveBeenCalledWith(creation.id);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'feed.service.cache_hit',
      expect.objectContaining({ count: 1, region: 'us', locale: 'en-US' }),
    );
  });

  it('falls back to public creations when cache is empty', async () => {
    const fallbackDoc = makeFallbackDoc('creation-fallback');

    const { fetchInitialFeed, mockLogger } = await setupFeedService({
      cacheDocs: [],
      fallbackDocs: [fallbackDoc],
    });

    const response = await fetchInitialFeed({ limit: 3 });

    expect(response.source).toBe('fallback');
    expect(response.items).toHaveLength(1);
    expect(response.items[0]?.id).toBe('creation-fallback');
    expect(response.items[0]?.ranking).toBeDefined();

    expect(mockLogger.info).toHaveBeenCalledWith(
      'feed.service.fallback',
      expect.objectContaining({ reason: 'empty_cache' }),
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      'feed.service.fallback_used',
      expect.objectContaining({ count: 1, reason: 'empty_cache' }),
    );
  });

  it('continues using cache for paginated requests when cursor source is cache', async () => {
    const creation = makeCreation('creation-2');
    const cacheDoc = makeCacheDoc('cache-2', creation.id);

    const { fetchMoreFeed, mockFindCreationById, mockLogger } = await setupFeedService({
      cacheDocs: [cacheDoc],
      findCreationResult: creation,
    });

    const cursor = encodeCursor({
      source: 'cache',
      docId: 'cache-1',
      region: 'us',
      locale: 'en-US',
    });

    const response = await fetchMoreFeed({ cursor, limit: 5 });

    expect(response.source).toBe('cache');
    expect(response.items).toHaveLength(1);
    expect(response.items[0]?.creation.id).toBe(creation.id);
    expect(response.items[0]?.ranking).toBeDefined();
    expect(mockFindCreationById).toHaveBeenCalledWith(creation.id);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'feed.service.cache_hit',
      expect.objectContaining({ count: 1 }),
    );
  });

  it('uses fallback pagination when cursor source is fallback', async () => {
    const fallbackDoc = makeFallbackDoc('creation-paged');

    const { fetchMoreFeed } = await setupFeedService({
      cacheDocs: [],
      fallbackDocs: [fallbackDoc],
    });

    const cursor = encodeCursor({ source: 'fallback', docId: 'creation-prev' });
    const response = await fetchMoreFeed({ cursor, limit: 2 });

    expect(response.source).toBe('fallback');
    expect(response.items).toHaveLength(1);
    expect(response.items[0]?.id).toBe('creation-paged');
    expect(response.items[0]?.ranking).toBeDefined();
  });

  it('returns only items updated after provided timestamp', async () => {
    const creation = makeCreation('creation-refresh');
    const cacheDoc = makeCacheDoc('cache-refresh', creation.id);

    const { fetchFeedUpdates } = await setupFeedService({
      cacheDocs: [cacheDoc],
      findCreationResult: creation,
    });

    const outdated = await fetchFeedUpdates({ updatedAfter: '2999-01-01T00:00:00.000Z' });
    expect(outdated.items).toHaveLength(0);

    const recent = await fetchFeedUpdates({ updatedAfter: '1999-01-01T00:00:00.000Z' });
    expect(recent.items).toHaveLength(1);
  });
});
