import { describe, it, expect } from '@jest/globals';
import * as feedIngestion from '../../../../functions/feed-ingestion';

const { buildCacheEntry, buildFeedEntryDocument, calculateRanking } = feedIngestion;

describe('feed-ingestion helpers', () => {
  const baseCreation = {
    id: 'creation-xyz',
    userId: 'user-123',
    prompt: 'neon dragon artwork',
    summary: 'Neon dragon',
    patternUri: 'https://cdn.example/pattern.png',
    previewPatternUri: 'https://cdn.example/preview.png',
    style: 'cyber',
    createdAt: '2025-01-01T00:00:00.000Z',
    likeCount: 25,
    favoriteCount: 10,
    shareCount: 5,
    commentCount: 3,
    remakeCount: 2,
    orderCount: 1,
  };

  it('builds normalized cache entry with ranking signals', () => {
    const cacheEntry = buildCacheEntry({ creation: baseCreation, region: 'us', locale: 'en-US' });

    expect(cacheEntry).toMatchObject({
      creationId: baseCreation.id,
      region: 'us',
      locale: 'en-US',
      personaVector: [],
    });
    expect(cacheEntry.rankingSignals).toMatchObject({
      likeCount: expect.any(Number),
      score: expect.any(Number),
      recency: expect.any(Number),
    });
    expect(typeof cacheEntry.updatedAt).toBe('string');
  });

  it('includes creation snapshot data in feed entry document', () => {
    const cacheEntry = buildCacheEntry({ creation: baseCreation });
    const feedEntry = buildFeedEntryDocument({ creation: baseCreation, cacheEntry });

    expect(feedEntry.creationSnapshot).toMatchObject({
      id: baseCreation.id,
      userId: baseCreation.userId,
      prompt: baseCreation.prompt,
      likeCount: baseCreation.likeCount,
    });
    expect(feedEntry.rankingSignals.score).toBe(cacheEntry.rankingSignals.score);
  });

  it('mirrors ranking score with calculateRanking helper', () => {
    const ranking = calculateRanking({ creation: baseCreation, now: new Date('2025-01-05T00:00:00.000Z') });
    expect(ranking.score).toBeGreaterThan(0);
    expect(ranking.breakdown.engagement).toBeGreaterThan(0);
  });
});
