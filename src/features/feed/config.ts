const FEED_BETA_ENV_FLAG = process.env.NEXT_PUBLIC_ENABLE_FEED_BETA;
const FEED_BETA_RUNTIME_FLAG = process.env.FEED_BETA_FORCE;
const FEED_RANKING_ENV_FLAG = process.env.NEXT_PUBLIC_ENABLE_FEED_RANKING;
const FEED_RANKING_RUNTIME_FLAG = process.env.FEED_RANKING_FORCE;
const FEED_REFRESH_ENV_FLAG = process.env.NEXT_PUBLIC_ENABLE_FEED_REFRESH;
const FEED_REFRESH_RUNTIME_FLAG = process.env.FEED_REFRESH_FORCE;

export const isFeedBetaEnabled = (): boolean => {
  if (FEED_BETA_RUNTIME_FLAG === 'true') {
    return true;
  }
  if (FEED_BETA_RUNTIME_FLAG === 'false') {
    return false;
  }
  return FEED_BETA_ENV_FLAG === 'true';
};

export const FEED_PAGE_SIZE = 12;

export const FEED_METRIC_NAMESPACE = 'feed.service';

export const isFeedRankingEnabled = (): boolean => {
  if (FEED_RANKING_RUNTIME_FLAG === 'true') {
    return true;
  }
  if (FEED_RANKING_RUNTIME_FLAG === 'false') {
    return false;
  }
  if (FEED_RANKING_ENV_FLAG === 'true') {
    return true;
  }
  if (FEED_RANKING_ENV_FLAG === 'false') {
    return false;
  }
  return isFeedBetaEnabled();
};

export const isFeedRefreshEnabled = (): boolean => {
  if (FEED_REFRESH_RUNTIME_FLAG === 'true') {
    return true;
  }
  if (FEED_REFRESH_RUNTIME_FLAG === 'false') {
    return false;
  }
  if (FEED_REFRESH_ENV_FLAG === 'true') {
    return true;
  }
  if (FEED_REFRESH_ENV_FLAG === 'false') {
    return false;
  }
  return isFeedBetaEnabled();
};
