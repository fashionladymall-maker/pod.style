"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getFeatureFlagValue,
  type FeatureFlagSource,
} from "@/lib/experiments";

export interface UseFeatureFlagOptions {
  defaultValue?: boolean;
  initialValue?: boolean;
  initialSource?: FeatureFlagSource;
  refreshIntervalMs?: number;
  forceRefresh?: boolean;
}

export interface UseFeatureFlagResult {
  enabled: boolean;
  loading: boolean;
  source: FeatureFlagSource;
  error?: string;
  refresh: (force?: boolean) => Promise<void>;
}

const DEFAULT_SOURCE: FeatureFlagSource = "default";

export const useFeatureFlag = (
  flagKey: string,
  options?: UseFeatureFlagOptions,
): UseFeatureFlagResult => {
  const defaultValue = options?.defaultValue ?? false;
  const initialValue = options?.initialValue;
  const initialSource = options?.initialSource ?? DEFAULT_SOURCE;
  const refreshIntervalMs = options?.refreshIntervalMs;
  const forceRefresh = options?.forceRefresh;

  const activeRef = useRef(true);
  const [state, setState] = useState<{ enabled: boolean; loading: boolean; source: FeatureFlagSource; error?: string }>(
    () => ({
      enabled: initialValue ?? defaultValue,
      loading: true,
      source: initialValue !== undefined ? initialSource : DEFAULT_SOURCE,
    }),
  );

  const evaluate = useCallback(
    async (force?: boolean) => {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));
      try {
        const evaluation = await getFeatureFlagValue(flagKey, defaultValue, {
          forceRefresh: force ?? forceRefresh,
        });
        if (!activeRef.current) {
          return;
        }
        setState({
          enabled: evaluation.value,
          loading: false,
          source: evaluation.source,
        });
      } catch (error) {
        if (!activeRef.current) {
          return;
        }
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : String(error),
        }));
      }
    },
    [defaultValue, flagKey, forceRefresh],
  );

  useEffect(() => {
    activeRef.current = true;
    void evaluate(forceRefresh);
    return () => {
      activeRef.current = false;
    };
  }, [evaluate, forceRefresh]);

  useEffect(() => {
    if (!refreshIntervalMs) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void evaluate(true);
    }, refreshIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [evaluate, refreshIntervalMs]);

  const refresh = useCallback(
    async (force = true) => {
      await evaluate(force);
    },
    [evaluate],
  );

  return {
    enabled: state.enabled,
    loading: state.loading,
    source: state.source,
    error: state.error,
    refresh,
  };
};

