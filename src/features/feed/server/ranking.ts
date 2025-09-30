import type { Creation } from '@/lib/types';

const MS_IN_HOUR = 3_600_000;
const RECENCY_HALF_LIFE_HOURS = 48; // two days keeps recent content boosted

const ENGAGEMENT_WEIGHT = 0.55;
const RECENCY_WEIGHT = 0.3;
const PERSONALIZATION_WEIGHT = 0.15;

export interface FeedRankingMetadata {
  score: number;
  breakdown: {
    engagement: number;
    recency: number;
    personalization: number;
  };
  signals: Record<string, number>;
}

export interface RankingInputs {
  creation: Creation;
  rankingSignals?: Record<string, number>;
  now?: Date;
}

const computeEngagementComponent = (
  creation: Creation,
  rankingSignals?: Record<string, number>,
): { value: number; signals: Record<string, number> } => {
  const derivedSignals = {
    likeCount: creation.likeCount ?? 0,
    favoriteCount: creation.favoriteCount ?? 0,
    shareCount: creation.shareCount ?? 0,
    commentCount: creation.commentCount ?? 0,
    remakeCount: creation.remakeCount ?? 0,
    orderCount: creation.orderCount ?? 0,
  };

  const weightedEngagement =
    derivedSignals.likeCount * 1 +
    derivedSignals.favoriteCount * 1.2 +
    derivedSignals.shareCount * 1.6 +
    derivedSignals.commentCount * 1.3 +
    derivedSignals.remakeCount * 2.2 +
    derivedSignals.orderCount * 2.8;

  const externalScore = rankingSignals?.engagementScore;
  const engagementScore = externalScore ?? Math.log10(weightedEngagement + 1);

  return {
    value: Number.isFinite(engagementScore) ? Math.max(0, engagementScore) : 0,
    signals: {
      ...derivedSignals,
      engagementScore,
    },
  };
};

const computeRecencyComponent = (createdAtIso: string, now: Date): number => {
  const createdAt = new Date(createdAtIso);
  if (Number.isNaN(createdAt.getTime())) {
    return 0;
  }

  const ageHours = Math.max(0, (now.getTime() - createdAt.getTime()) / MS_IN_HOUR);
  const decay = Math.exp(-ageHours / RECENCY_HALF_LIFE_HOURS);
  return Number.isFinite(decay) ? decay : 0;
};

const computePersonalizationComponent = (rankingSignals?: Record<string, number>): number => {
  if (!rankingSignals) return 0;

  const direct = rankingSignals.personalBoost ?? rankingSignals.personalization ?? 0;
  const diversityPenalty = rankingSignals.diversityPenalty ?? 0;
  const personaAffinity = rankingSignals.personaAffinity ?? 0;

  const score = direct + personaAffinity - diversityPenalty;
  return Math.max(0, score);
};

export const calculateFeedScore = ({
  creation,
  rankingSignals,
  now = new Date(),
}: RankingInputs): FeedRankingMetadata => {
  const { value: engagement, signals } = computeEngagementComponent(creation, rankingSignals);
  const recency = computeRecencyComponent(creation.createdAt, now);
  const personalization = computePersonalizationComponent(rankingSignals);

  const score =
    engagement * ENGAGEMENT_WEIGHT +
    recency * RECENCY_WEIGHT +
    personalization * PERSONALIZATION_WEIGHT;

  return {
    score,
    breakdown: {
      engagement,
      recency,
      personalization,
    },
    signals: {
      ...signals,
      recency,
      personalization,
    },
  };
};
