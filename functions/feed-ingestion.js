const ENGAGEMENT_WEIGHT = 0.55;
const RECENCY_WEIGHT = 0.3;
const PERSONALIZATION_WEIGHT = 0.15;
const MS_IN_HOUR = 3_600_000;
const RECENCY_HALF_LIFE_HOURS = 48;

const coerceNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
};

const buildEngagementSignals = (creation) => ({
  likeCount: coerceNumber(creation.likeCount),
  favoriteCount: coerceNumber(creation.favoriteCount),
  shareCount: coerceNumber(creation.shareCount),
  commentCount: coerceNumber(creation.commentCount),
  remakeCount: coerceNumber(creation.remakeCount),
  orderCount: coerceNumber(creation.orderCount),
});

const computeEngagementScore = (signals, overrideScore) => {
  if (typeof overrideScore === 'number') {
    return coerceNumber(overrideScore, 0);
  }

  const weightedEngagement =
    signals.likeCount * 1 +
    signals.favoriteCount * 1.2 +
    signals.shareCount * 1.6 +
    signals.commentCount * 1.3 +
    signals.remakeCount * 2.2 +
    signals.orderCount * 2.8;

  return Math.max(0, Math.log10(weightedEngagement + 1));
};

const computeRecencyComponent = (createdAt, now) => {
  if (!createdAt) return 0;

  let createdDate;
  if (createdAt instanceof Date) {
    createdDate = createdAt;
  } else if (createdAt.toDate && typeof createdAt.toDate === 'function') {
    createdDate = createdAt.toDate();
  } else {
    createdDate = new Date(createdAt);
  }

  if (Number.isNaN(createdDate?.getTime?.())) {
    return 0;
  }

  const ageHours = Math.max(0, (now.getTime() - createdDate.getTime()) / MS_IN_HOUR);
  const decay = Math.exp(-ageHours / RECENCY_HALF_LIFE_HOURS);
  return Number.isFinite(decay) ? decay : 0;
};

const computePersonalizationComponent = (rankingSignals = {}) => {
  const personal = coerceNumber(rankingSignals.personalBoost ?? rankingSignals.personalization);
  const affinity = coerceNumber(rankingSignals.personaAffinity);
  const penalty = coerceNumber(rankingSignals.diversityPenalty);
  const score = personal + affinity - penalty;
  return Math.max(0, score);
};

const calculateRanking = ({ creation, rankingSignals = {}, now = new Date() }) => {
  const signals = buildEngagementSignals(creation);
  const engagement = computeEngagementScore(signals, rankingSignals.engagementScore);
  const recency = computeRecencyComponent(creation.createdAt, now);
  const personalization = computePersonalizationComponent(rankingSignals);

  const score =
    engagement * ENGAGEMENT_WEIGHT +
    recency * RECENCY_WEIGHT +
    personalization * PERSONALIZATION_WEIGHT;

  return {
    score,
    breakdown: { engagement, recency, personalization },
    signals: {
      ...signals,
      engagementScore: engagement,
      recency,
      personalization,
      personalBoost: coerceNumber(rankingSignals.personalBoost),
      personaAffinity: coerceNumber(rankingSignals.personaAffinity),
      diversityPenalty: coerceNumber(rankingSignals.diversityPenalty),
    },
  };
};

const buildCacheEntry = ({
  creation,
  region = 'global',
  locale = creation.locale ?? null,
  rankingSignals = {},
  now = new Date(),
}) => {
  const ranking = calculateRanking({ creation, rankingSignals, now });

  return {
    creationId: creation.id,
    region,
    locale,
    personaVector: Array.isArray(rankingSignals.personaVector) ? rankingSignals.personaVector : [],
    rankingSignals: {
      ...ranking.signals,
      score: ranking.score,
    },
    updatedAt: now.toISOString(),
  };
};

const buildFeedEntryDocument = ({ creation, cacheEntry, now = new Date() }) => ({
  creationId: creation.id,
  region: cacheEntry.region,
  locale: cacheEntry.locale,
  rankingSignals: cacheEntry.rankingSignals,
  personaVector: cacheEntry.personaVector,
  updatedAt: cacheEntry.updatedAt || now.toISOString(),
  creationSnapshot: {
    id: creation.id,
    userId: creation.userId,
    prompt: creation.prompt ?? null,
    summary: creation.summary ?? null,
    patternUri: creation.patternUri ?? null,
    previewPatternUri: creation.previewPatternUri ?? null,
    style: creation.style ?? null,
    createdAt: creation.createdAt ?? now.toISOString(),
    likeCount: coerceNumber(creation.likeCount),
    favoriteCount: coerceNumber(creation.favoriteCount),
    shareCount: coerceNumber(creation.shareCount),
    commentCount: coerceNumber(creation.commentCount),
    remakeCount: coerceNumber(creation.remakeCount),
    orderCount: coerceNumber(creation.orderCount),
  },
});

module.exports = {
  buildCacheEntry,
  buildFeedEntryDocument,
  calculateRanking,
};
