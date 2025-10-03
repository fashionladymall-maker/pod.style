import { computeLatestUpdatedAt } from '@/components/screens/feed-helpers';
import { formatNumber } from '@/components/omg/omg-feed-card';
import type { FeedItem } from '@/features/feed/server/feed-service';

const baseFeedItem = (overrides: Partial<FeedItem>): FeedItem => {
  const defaultCreation = {
    id: 'creation-id',
    userId: 'user',
    prompt: 'prompt',
    style: 'style',
    patternUri: 'https://example.com/foo.png',
    models: [],
    createdAt: new Date().toISOString(),
    isPublic: true,
    orderCount: 0,
    likeCount: 0,
    likedBy: [],
    favoriteCount: 0,
    favoritedBy: [],
    commentCount: 0,
    shareCount: 0,
    remakeCount: 0,
  };

  const hasUpdatedAt = Object.prototype.hasOwnProperty.call(overrides, 'updatedAt');
  const updatedAtValue = hasUpdatedAt ? overrides.updatedAt ?? null : new Date().toISOString();

  return {
    id: overrides.id ?? 'feed-id',
    creation: { ...defaultCreation, ...(overrides.creation ?? {}) },
    source: overrides.source ?? 'cache',
    rankingSignals: overrides.rankingSignals,
    personaVector: overrides.personaVector,
    region: overrides.region,
    locale: overrides.locale,
    updatedAt: updatedAtValue,
    ranking: overrides.ranking,
  } as FeedItem;
};

describe('computeLatestUpdatedAt', () => {
  it('returns the latest ISO timestamp', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const older = new Date(now.getTime() - 60_000).toISOString();
    const newer = new Date(now.getTime() + 60_000).toISOString();

    const items: FeedItem[] = [
      baseFeedItem({ id: 'a', updatedAt: older }),
      baseFeedItem({ id: 'b', updatedAt: newer }),
      baseFeedItem({ id: 'c', updatedAt: older }),
    ];

    expect(computeLatestUpdatedAt(items)).toEqual(newer);
  });

  it('ignores items without updatedAt', () => {
    const iso = new Date('2024-02-02T02:02:02Z').toISOString();

    const items: FeedItem[] = [
      baseFeedItem({ id: 'a', updatedAt: null }),
      baseFeedItem({ id: 'b', updatedAt: undefined }),
      baseFeedItem({ id: 'c', updatedAt: iso }),
    ];

    expect(computeLatestUpdatedAt(items)).toEqual(iso);
  });

  it('returns null when no timestamps are present', () => {
    const items: FeedItem[] = [
      baseFeedItem({ id: 'a', updatedAt: null }),
      baseFeedItem({ id: 'b', updatedAt: undefined }),
    ];

    expect(computeLatestUpdatedAt(items)).toBeNull();
  });
});

describe('formatNumber', () => {
  it.each([
    [0, '0'],
    [9, '9'],
    [1_200, '1.2k'],
    [15_600, '15.6k'],
    [2_450_000, '2.5m'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatNumber(input as number)).toBe(expected);
  });
});
