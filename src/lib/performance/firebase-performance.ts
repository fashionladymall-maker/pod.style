'use client';

import type { FirebaseApp } from 'firebase/app';
import type { FirebasePerformance } from 'firebase/performance';
import { app as firebaseApp } from '@/lib/firebase';

let performancePromise: Promise<FirebasePerformance | null> | null = null;

export const initFirebasePerformance = async (): Promise<FirebasePerformance | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!firebaseApp) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Firebase app not initialised. Skipping performance monitoring.');
    }
    return null;
  }

  const app: FirebaseApp = firebaseApp;

  if (!performancePromise) {
    performancePromise = import('firebase/performance')
      .then(async ({ getPerformance, initializePerformance }) => {
        try {
          return initializePerformance(app, {
            dataCollectionEnabled: true,
            instrumentationEnabled: true,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes('already exists')) {
            return getPerformance(app);
          }
          console.warn('Failed to initialise Firebase performance monitoring', error);
          return null;
        }
      })
      .catch((error) => {
        console.warn('Failed to load firebase/performance', error);
        return null;
      });
  }

  return performancePromise;
};

export const recordPerformanceTrace = async (
  name: string,
  metrics?: Record<string, number>,
  attributes?: Record<string, string>,
) => {
  try {
    const perf = await initFirebasePerformance();
    if (!perf) {
      return;
    }

    const { trace } = await import('firebase/performance');
    const performanceTrace = trace(perf, name);
    performanceTrace.start();

    if (metrics) {
      Object.entries(metrics).forEach(([key, value]) => {
        performanceTrace.putMetric(key, Math.round(value));
      });
    }

    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        performanceTrace.putAttribute(key, value);
      });
    }

    performanceTrace.stop();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to record performance trace', error);
    }
  }
};
