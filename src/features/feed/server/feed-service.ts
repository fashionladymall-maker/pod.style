import { Buffer } from 'node:buffer';
import type { QueryDocumentSnapshot, DocumentSnapshot } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getDb } from '@/server/firebase/admin';
import { logger } from '@/utils/logger';
import {
  creationDataSchema,
  toCreation,
  type CreationDocument,
} from '@/features/creations/server/creation-model';
import type { Creation } from '@/lib/types';
import { findCreationById } from '@/features/creations/server/creation-repository';
import { FEED_METRIC_NAMESPACE, FEED_PAGE_SIZE, isFeedRankingEnabled } from '../config';
import { calculateFeedScore, type FeedRankingMetadata } from './ranking';

const FEED_CACHE_COLLECTION = 'personalized_feed_cache';
const CREATIONS_COLLECTION = 'creations';

const feedCacheDocumentSchema = z.object({
  creationId: z.string(),
  region: z.string().optional(),
  locale: z.string().optional(),
  personaVector: z.array(z.number()).optional(),
  rankingSignals: z.record(z.number()).optional(),
  updatedAt: z.any().optional(),
});

type FeedCacheDocument = z.infer<typeof feedCacheDocumentSchema>;

type FeedSource = 'cache' | 'fallback';

export interface FeedItem {
  id: string;
  creation: Creation;
  source: FeedSource;
  region?: string;
  locale?: string;
  rankingSignals?: Record<string, number>;
  personaVector?: number[];
  updatedAt?: string | null;
  ranking?: FeedRankingMetadata;
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
  source: FeedSource;
}

export interface FeedFetchOptions {
  limit?: number;
  region?: string | null;
  locale?: string | null;
  cursor?: string | null;
  updatedAfter?: string | null;
}

interface CacheQueryOptions {
  limit: number;
  region?: string;
  locale?: string;
  cursorDocId?: string;
}

interface FallbackQueryOptions {
  limit: number;
  cursorDocId?: string;
}

interface SerializedCursor {
  source: FeedSource;
  docId: string;
  region?: string;
  locale?: string;
}

interface RankingContext {
  region?: string;
  locale?: string;
  reason?: string;
}

const encodeCursor = (payload: SerializedCursor): string =>
  Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64');

const decodeCursor = (cursor?: string | null): SerializedCursor | null => {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded) as SerializedCursor;
    if (parsed?.source && parsed?.docId) {
      return parsed;
    }
    logger.warn(`${FEED_METRIC_NAMESPACE}.cursor.invalid`, { cursor });
    return null;
  } catch (error) {
    logger.error(`${FEED_METRIC_NAMESPACE}.cursor.decode_error`, { error: (error as Error).message });
    return null;
  }
};

const toIsoString = (value?: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    const maybeDate = value.toDate();
    if (maybeDate instanceof Date && !Number.isNaN(maybeDate.getTime())) {
      return maybeDate.toISOString();
    }
  }
  return null;
};

const mapCacheDocToFeedItem = async (doc: QueryDocumentSnapshot): Promise<FeedItem | null> => {
  const parsed = feedCacheDocumentSchema.safeParse(doc.data());
  if (!parsed.success) {
    logger.warn(`${FEED_METRIC_NAMESPACE}.cache.parse_failure`, {
      id: doc.id,
      issues: parsed.error.flatten(),
    });
    return null;
  }

  const data: FeedCacheDocument = parsed.data;
  const creation = await findCreationIdSafe(data.creationId);
  if (!creation) {
    logger.warn(`${FEED_METRIC_NAMESPACE}.cache.missing_creation`, { cacheId: doc.id, creationId: data.creationId });
    return null;
  }

  return {
    id: doc.id,
    creation,
    source: 'cache',
    region: data.region,
    locale: data.locale,
    rankingSignals: data.rankingSignals,
    personaVector: data.personaVector,
    updatedAt: toIsoString(data.updatedAt),
  };
};

const findCreationIdSafe = async (creationId: string): Promise<Creation | null> => {
  try {
    const creation = await findCreationById(creationId);
    return creation;
  } catch (error) {
    logger.error(`${FEED_METRIC_NAMESPACE}.cache.creation_lookup_failed`, {
      creationId,
      error: (error as Error).message,
    });
    return null;
  }
};

const getCacheQuery = async ({ limit, region, locale, cursorDocId }: CacheQueryOptions) => {
  const db = getDb();
  let query = db.collection(FEED_CACHE_COLLECTION).orderBy('updatedAt', 'desc').limit(limit);
  if (region) {
    query = query.where('region', '==', region);
  }
  if (locale) {
    query = query.where('locale', '==', locale);
  }
  if (cursorDocId) {
    const cursorSnapshot = await db.collection(FEED_CACHE_COLLECTION).doc(cursorDocId).get();
    if (cursorSnapshot.exists) {
      query = query.startAfter(cursorSnapshot);
    }
  }
  return query;
};

const getFallbackQuery = async ({ limit, cursorDocId }: FallbackQueryOptions) => {
  const db = getDb();
  const collection = db.collection(CREATIONS_COLLECTION).withConverter<CreationDocument>({
    fromFirestore(snapshot) {
      const data = creationDataSchema.parse(snapshot.data());
      return data;
    },
    toFirestore(documentData: CreationDocument) {
      return documentData;
    },
  });

  try {
    let query = collection.where('isPublic', '==', true).orderBy('createdAt', 'desc').limit(limit);
    if (cursorDocId) {
      const cursorSnapshot = await collection.doc(cursorDocId).get();
      if (cursorSnapshot.exists) {
        query = query.startAfter(cursorSnapshot as DocumentSnapshot<CreationDocument>);
      }
    }
    return query;
  } catch (error: unknown) {
    // If index is missing, fall back to a simpler query
    const firestoreError = error as { code?: number; message?: string } | undefined;
    if (firestoreError?.code === 9 || firestoreError?.message?.includes('index')) {
      console.warn('Firestore index not ready for feed fallback, using simple query');
      let query = collection.where('isPublic', '==', true).limit(limit);
      if (cursorDocId) {
        const cursorSnapshot = await collection.doc(cursorDocId).get();
        if (cursorSnapshot.exists) {
          query = query.startAfter(cursorSnapshot as DocumentSnapshot<CreationDocument>);
        }
      }
      return query;
    }
    throw error;
  }
};

const measure = async <T,>(operation: () => Promise<T>, meta: Record<string, unknown>) => {
  const startedAt = Date.now();
  try {
    const result = await operation();
    const durationMs = Date.now() - startedAt;
    logger.info(`${FEED_METRIC_NAMESPACE}.latency`, { ...meta, durationMs });
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    logger.error(`${FEED_METRIC_NAMESPACE}.error`, {
      ...meta,
      durationMs,
      error: (error as Error).message,
    });
    throw error;
  }
};

const fetchFromCache = async (options: CacheQueryOptions): Promise<FeedResponse> => {
  const query = await getCacheQuery(options);
  const snapshot = await measure(() => query.get(), {
    source: 'cache',
    region: options.region,
    locale: options.locale,
  });

  const items = (
    await Promise.all(snapshot.docs.map((doc) => mapCacheDocToFeedItem(doc)))
  ).filter((item): item is FeedItem => Boolean(item));

  if (items.length > 0) {
    logger.info(`${FEED_METRIC_NAMESPACE}.cache_hit`, {
      count: items.length,
      region: options.region,
      locale: options.locale,
    });
  } else if (snapshot.docs.length > 0) {
    logger.warn(`${FEED_METRIC_NAMESPACE}.cache_empty_items`, {
      reason: 'missing_creations',
      region: options.region,
      locale: options.locale,
    });
  } else {
    logger.info(`${FEED_METRIC_NAMESPACE}.cache_miss`, {
      region: options.region,
      locale: options.locale,
    });
  }

  const nextCursor = snapshot.docs.length
    ? encodeCursor({
        source: 'cache',
        docId: snapshot.docs[snapshot.docs.length - 1].id,
        region: options.region,
        locale: options.locale,
      })
    : null;

  return {
    items,
    nextCursor,
    source: 'cache',
  };
};

const fetchFromFallback = async (options: FallbackQueryOptions): Promise<FeedResponse> => {
  const query = await getFallbackQuery(options);
  const snapshot = await measure(() => query.get(), { source: 'fallback' });

  const items: FeedItem[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    creation: toCreation(doc.id, doc.data()),
    source: 'fallback',
    updatedAt: toIsoString(doc.updateTime?.toDate?.() ? doc.updateTime.toDate() : undefined),
  }));

  const nextCursor = snapshot.docs.length
    ? encodeCursor({ source: 'fallback', docId: snapshot.docs[snapshot.docs.length - 1].id })
    : null;

  logger.info(`${FEED_METRIC_NAMESPACE}.fallback_used`, {
    count: items.length,
    reason: options.cursorDocId ? 'pagination' : 'empty_cache',
  });

  return {
    items,
    nextCursor,
    source: 'fallback',
  };
};

const attachRankingMetadata = (items: FeedItem[], context: RankingContext) => {
  if (!isFeedRankingEnabled()) {
    return items.map((item) => ({ ...item, ranking: undefined }));
  }

  const rankedItems = items
    .map((item) => ({
      ...item,
      ranking: calculateFeedScore({
        creation: item.creation,
        rankingSignals: item.rankingSignals,
      }),
    }))
    .sort((a, b) => (b.ranking?.score ?? 0) - (a.ranking?.score ?? 0));

  if (rankedItems.length > 0) {
    const scores = rankedItems.map((item) => item.ranking?.score ?? 0);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const sum = scores.reduce((total, score) => total + score, 0);
    const average = sum / scores.length;

    logger.info(`${FEED_METRIC_NAMESPACE}.ranking.score_distribution`, {
      region: context.region,
      locale: context.locale,
      count: rankedItems.length,
      min,
      max,
      average,
      reason: context.reason,
    });
  }

  return rankedItems;
};

const logCacheHitRatio = (result: FeedResponse, requestedLimit: number, fetchedCount: number) => {
  const cacheHits = result.source === 'cache' ? fetchedCount : 0;
  const ratio = requestedLimit > 0 ? cacheHits / requestedLimit : 0;

  logger.info(`${FEED_METRIC_NAMESPACE}.cache.hit_ratio`, {
    requested: requestedLimit,
    returned: result.items.length,
    fetched: fetchedCount,
    cacheHits,
    ratio: Number.isFinite(ratio) ? Number(ratio.toFixed(4)) : 0,
    source: result.source,
  });
};

const logRefreshMetrics = (items: FeedItem[], options: FeedFetchOptions, context: RankingContext, source: FeedSource) => {
  if (!options.updatedAfter) return;

  const sinceDate = new Date(options.updatedAfter);
  logger.info(`${FEED_METRIC_NAMESPACE}.refresh.frequency`, {
    region: context.region,
    locale: context.locale,
    source,
    updatedAfter: options.updatedAfter,
    validSince: Number.isNaN(sinceDate.getTime()) ? undefined : sinceDate.toISOString(),
    items: items.length,
  });

  if (items.length > 0) {
    const newest = items.reduce<string | undefined>((latest, item) => {
      if (!item.updatedAt) return latest;
      return !latest || item.updatedAt > latest ? item.updatedAt : latest;
    }, undefined);

    logger.info(`${FEED_METRIC_NAMESPACE}.refresh.new_items`, {
      region: context.region,
      locale: context.locale,
      count: items.length,
      newestUpdatedAt: newest,
    });
  }
};

const filterByUpdatedAfter = (items: FeedItem[], updatedAfter?: string | null) => {
  if (!updatedAfter) {
    return items;
  }

  const since = new Date(updatedAfter);
  if (Number.isNaN(since.getTime())) {
    return items;
  }

  return items.filter((item) => {
    if (!item.updatedAt) return false;
    const itemDate = new Date(item.updatedAt);
    if (Number.isNaN(itemDate.getTime())) return false;
    return itemDate.getTime() > since.getTime();
  });
};

const buildResponse = (
  result: FeedResponse,
  context: RankingContext,
  options: FeedFetchOptions,
  fetchedCount: number,
) => {
  const rankedItems = attachRankingMetadata(result.items, context);
  const filteredItems = filterByUpdatedAfter(rankedItems, options.updatedAfter);

  logRefreshMetrics(filteredItems, options, context, result.source);

  const finalResponse: FeedResponse = {
    ...result,
    items: filteredItems,
  };

  logCacheHitRatio(finalResponse, Math.max(1, options.limit ?? FEED_PAGE_SIZE), fetchedCount);

  return finalResponse;
};

export const fetchInitialFeed = async (options: FeedFetchOptions = {}): Promise<FeedResponse> => {
  const limit = Math.max(1, options.limit ?? FEED_PAGE_SIZE);
  const region = options.region ?? undefined;
  const locale = options.locale ?? undefined;

  const cacheResult = await fetchFromCache({ limit, region, locale });
  if (cacheResult.items.length > 0) {
    return buildResponse(cacheResult, { region, locale, reason: 'cache_hit' }, { ...options, limit }, cacheResult.items.length);
  }

  logger.info(`${FEED_METRIC_NAMESPACE}.fallback`, { reason: 'empty_cache' });
  const fallbackResult = await fetchFromFallback({ limit });
  return buildResponse(fallbackResult, { region, locale, reason: 'cache_empty' }, { ...options, limit }, fallbackResult.items.length);
};

export const fetchMoreFeed = async (options: FeedFetchOptions = {}): Promise<FeedResponse> => {
  const limit = Math.max(1, options.limit ?? FEED_PAGE_SIZE);
  const decoded = decodeCursor(options.cursor);
  if (!decoded) {
    return fetchInitialFeed({ ...options, limit });
  }

  if (decoded.source === 'cache') {
    const cacheResult = await fetchFromCache({
      limit,
      region: decoded.region,
      locale: decoded.locale,
      cursorDocId: decoded.docId,
    });
    return buildResponse(
      cacheResult,
      {
        region: decoded.region,
        locale: decoded.locale,
        reason: 'cache_pagination',
      },
      { ...options, limit },
      cacheResult.items.length,
    );
  }

  const fallbackResult = await fetchFromFallback({
    limit,
    cursorDocId: decoded.docId,
  });
  return buildResponse(
    fallbackResult,
    {
      reason: 'fallback_pagination',
    },
    { ...options, limit },
    fallbackResult.items.length,
  );
};

export const fetchFeedUpdates = async (options: FeedFetchOptions = {}): Promise<FeedResponse> => {
  const limit = Math.max(1, options.limit ?? FEED_PAGE_SIZE);
  const region = options.region ?? undefined;
  const locale = options.locale ?? undefined;

  const cacheResult = await fetchFromCache({ limit, region, locale });
  if (cacheResult.items.length > 0) {
    return buildResponse(
      cacheResult,
      { region, locale, reason: 'refresh_cache' },
      { ...options, limit },
      cacheResult.items.length,
    );
  }

  logger.info(`${FEED_METRIC_NAMESPACE}.fallback`, { reason: 'refresh_cache_empty' });
  const fallbackResult = await fetchFromFallback({ limit });
  return buildResponse(
    fallbackResult,
    { region, locale, reason: 'refresh_fallback' },
    { ...options, limit },
    fallbackResult.items.length,
  );
};
