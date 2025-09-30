'use client';

import { useCallback, useEffect, useRef } from 'react';

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

export const useFeedRefresh = ({
  enabled,
  baseIntervalMs = DEFAULT_BASE_INTERVAL,
  maxIntervalMs = DEFAULT_MAX_INTERVAL,
  fetchUpdates,
}: UseFeedRefreshOptions): UseFeedRefreshReturn => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIntervalRef = useRef(baseIntervalMs);
  const isRunningRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(
    (nextInterval?: number) => {
      if (!enabled) {
        clearTimer();
        return;
      }

      const interval = nextInterval ?? currentIntervalRef.current;
      clearTimer();
      timerRef.current = setTimeout(async () => {
        if (isRunningRef.current) {
          scheduleNext(interval);
          return;
        }

        isRunningRef.current = true;
        try {
          const newItems = await fetchUpdates();
          currentIntervalRef.current = baseIntervalMs;
          scheduleNext(newItems > 0 ? baseIntervalMs : interval);
        } catch (error) {
          console.error('feed.refresh.error', error);
          currentIntervalRef.current = Math.min(interval * 2, maxIntervalMs);
          scheduleNext(currentIntervalRef.current);
        } finally {
          isRunningRef.current = false;
        }
      }, interval);
    },
    [enabled, fetchUpdates, clearTimer, baseIntervalMs, maxIntervalMs],
  );

  const triggerRefresh = useCallback(() => {
    if (!enabled) return;
    scheduleNext(baseIntervalMs);
  }, [enabled, baseIntervalMs, scheduleNext]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return () => clearTimer();
    }

    currentIntervalRef.current = baseIntervalMs;
    scheduleNext(baseIntervalMs);

    return () => {
      clearTimer();
    };
  }, [enabled, baseIntervalMs, scheduleNext, clearTimer]);

  return { triggerRefresh };
};

export default useFeedRefresh;
