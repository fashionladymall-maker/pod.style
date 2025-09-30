import { describe, it, expect } from '@jest/globals';
import { calculateFeedScore } from '../server/ranking';
import type { Creation } from '@/lib/types';

const baseCreation = (overrides: Partial<Creation> = {}): Creation => ({
  id: overrides.id ?? 'creation-1',
  userId: overrides.userId ?? 'user-1',
  prompt: overrides.prompt ?? 'generate a pattern',
  style: overrides.style ?? 'neo',
  summary: overrides.summary,
  patternUri: overrides.patternUri ?? 'https://example.com/pattern.png',
  previewPatternUri: overrides.previewPatternUri,
  models: overrides.models ?? [],
  createdAt: overrides.createdAt ?? new Date().toISOString(),
  isPublic: overrides.isPublic ?? true,
  orderCount: overrides.orderCount ?? 0,
  likeCount: overrides.likeCount ?? 0,
  likedBy: overrides.likedBy ?? [],
  favoriteCount: overrides.favoriteCount ?? 0,
  favoritedBy: overrides.favoritedBy ?? [],
  commentCount: overrides.commentCount ?? 0,
  shareCount: overrides.shareCount ?? 0,
  remakeCount: overrides.remakeCount ?? 0,
});

describe('calculateFeedScore', () => {
  it('awards higher score to creations with stronger engagement', () => {
    const lowEngagement = calculateFeedScore({
      creation: baseCreation({ id: 'low', likeCount: 2, favoriteCount: 1 }),
    });

    const highEngagement = calculateFeedScore({
      creation: baseCreation({ id: 'high', likeCount: 120, favoriteCount: 35, shareCount: 20, orderCount: 8 }),
    });

    expect(highEngagement.score).toBeGreaterThan(lowEngagement.score);
    expect(highEngagement.breakdown.engagement).toBeGreaterThan(lowEngagement.breakdown.engagement);
  });

  it('boosts newer creations over older ones with identical engagement', () => {
    const now = new Date('2025-01-01T12:00:00.000Z');
    const recent = calculateFeedScore({
      creation: baseCreation({ id: 'recent', createdAt: now.toISOString(), likeCount: 10 }),
      now,
    });
    const older = calculateFeedScore({
      creation: baseCreation({ id: 'older', createdAt: '2024-12-20T12:00:00.000Z', likeCount: 10 }),
      now,
    });

    expect(recent.breakdown.recency).toBeGreaterThan(older.breakdown.recency);
    expect(recent.score).toBeGreaterThan(older.score);
  });

  it('respects personalization boosts even when engagement is lower', () => {
    const highEngagement = calculateFeedScore({
      creation: baseCreation({ id: 'popular', likeCount: 200, favoriteCount: 80, shareCount: 40 }),
    });

    const personalized = calculateFeedScore({
      creation: baseCreation({ id: 'personal', likeCount: 80, favoriteCount: 20 }),
      rankingSignals: {
        personalBoost: 1.5,
        personaAffinity: 0.5,
      },
    });

    expect(personalized.breakdown.personalization).toBeGreaterThan(0);
    expect(personalized.score).toBeGreaterThan(highEngagement.score * 0.5);
  });
});
