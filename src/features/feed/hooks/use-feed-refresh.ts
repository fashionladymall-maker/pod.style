'use client';

import { useEffect, useRef } from 'react';

interface UseFeedRefreshOptions {
  enabled: boolean;
  baseIntervalMs?: number;
  maxIntervalMs?: number;
  fetchUpdates: () => Promise<number>;
}

interface UseFeedRefreshReturn {
  triggerRefresh: () => void;
}

const DEFAULT_BASE_INTERVAL = 30_000;
const DEFAULT_MAX_INTERVAL = 5 * 60_000;

interface RefreshScheduler {
  start: () => void;
  stop: () => void;
  trigger: () => void;
  setFetchUpdates: (fetchUpdates: () => Promise<number>) => void;
}

export const createFeedRefreshScheduler = ({
  baseIntervalMs = DEFAULT_BASE_INTERVAL,
  maxIntervalMs = DEFAULT_MAX_INTERVAL,
  fetchUpdates,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
}: {
  baseIntervalMs?: number;
  maxIntervalMs?: number;
  fetchUpdates: () => Promise<number>;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
}): RefreshScheduler => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let interval = baseIntervalMs;
  let running = false;
  let fetchRef = fetchUpdates;

  const clearTimer = () => {
    if (timer) {
      clearTimeoutFn(timer);
      timer = null;
    }
  };

  const schedule = () => {
    clearTimer();
    timer = setTimeoutFn(async () => {
      if (running) {
        schedule();
        return;
      }

      running = true;
      try {
        const newItems = await fetchRef();
        interval = baseIntervalMs;
        const nextInterval = newItems > 0 ? baseIntervalMs : interval;
        interval = nextInterval;
      } catch (error) {
        console.error('feed.refresh.error', error);
        interval = Math.min(interval * 2, maxIntervalMs);
      } finally {
        running = false;
        schedule();
      }
    }, interval);
  };

  return {
    start: () => {
      interval = baseIntervalMs;
      schedule();
    },
    stop: () => {
      clearTimer();
    },
    trigger: () => {
      interval = baseIntervalMs;
      schedule();
    },
    setFetchUpdates: (fetchUpdatesFn: () => Promise<number>) => {
      fetchRef = fetchUpdatesFn;
    },
  };
};

export const useFeedRefresh = ({
  enabled,
  baseIntervalMs = DEFAULT_BASE_INTERVAL,
  maxIntervalMs = DEFAULT_MAX_INTERVAL,
  fetchUpdates,
}: UseFeedRefreshOptions): UseFeedRefreshReturn => {
  const schedulerRef = useRef<RefreshScheduler | null>(null);

  if (!schedulerRef.current) {
    schedulerRef.current = createFeedRefreshScheduler({
      baseIntervalMs,
      maxIntervalMs,
      fetchUpdates,
    });
  }

  useEffect(() => {
    schedulerRef.current?.setFetchUpdates(fetchUpdates);
  }, [fetchUpdates]);

  useEffect(() => {
    if (enabled) {
      schedulerRef.current?.start();
      return () => schedulerRef.current?.stop();
    }
    schedulerRef.current?.stop();
    return undefined;
  }, [enabled]);

  return {
    triggerRefresh: () => {
      if (!enabled) return;
      schedulerRef.current?.trigger();
    },
  };
};

export default useFeedRefresh;
