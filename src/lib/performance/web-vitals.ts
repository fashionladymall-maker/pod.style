'use client';

import type { NextWebVitalsMetric } from 'next/app';
import { initFirebasePerformance, recordPerformanceTrace } from './firebase-performance';

const METRIC_ENDPOINT = '/api/metrics/record';

const sendMetricPayload = (payload: Record<string, unknown>) => {
  try {
    const body = JSON.stringify(payload);
    const blob = new Blob([body], { type: 'application/json' });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(METRIC_ENDPOINT, blob);
    } else {
      void fetch(METRIC_ENDPOINT, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to send performance metric', error);
    }
  }
};

const logWebVitalToFirebase = async (metric: NextWebVitalsMetric) => {
  try {
    await initFirebasePerformance();
    await recordPerformanceTrace(
      `web_vital_${metric.name.toLowerCase()}`,
      { value: metric.value },
      {
        id: metric.id,
        label: metric.label,
        page: window.location.pathname,
      },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to log web vital to Firebase Performance', error);
    }
  }
};

export const sendWebVitalMetric = (metric: NextWebVitalsMetric) => {
  if (typeof window === 'undefined') {
    return;
  }

  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

  const deltaCandidate = (metric as { delta?: number }).delta;
  const normalizedDelta = typeof deltaCandidate === 'number' ? deltaCandidate : metric.value;

  sendMetricPayload({
    type: 'web-vital',
    name: metric.name,
    value: Number(metric.value.toFixed(4)),
    id: metric.id,
    label: metric.label,
    delta: Number(normalizedDelta.toFixed(4)),
    page: window.location.pathname,
    navigationType: navigationEntry?.type ?? 'unknown',
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
  });

  void logWebVitalToFirebase(metric);
};

export const logCustomPerformanceMetric = (
  name: string,
  value: number,
  attributes?: Record<string, string | number>,
) => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedAttributes = attributes
    ? Object.fromEntries(
        Object.entries(attributes).map(([key, attrValue]) => [key, typeof attrValue === 'number' ? attrValue.toString() : attrValue]),
      )
    : undefined;

  sendMetricPayload({
    type: 'custom-metric',
    name,
    value: Number(value.toFixed(4)),
    page: window.location.pathname,
    timestamp: Date.now(),
    ...normalizedAttributes,
  });

  void recordPerformanceTrace(
    `custom_${name}`,
    { value },
    {
      page: window.location.pathname,
      ...(normalizedAttributes ?? {}),
    },
  );
};
