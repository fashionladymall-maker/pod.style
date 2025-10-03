'use client';

import { useEffect } from 'react';

const SERVICE_WORKER_PATH = '/sw.js';
const SERVICE_WORKER_SCOPE = '/';

export const useServiceWorker = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
          scope: SERVICE_WORKER_SCOPE,
        });

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Service worker registration failed', error);
        }
      }
    };

    register();

    return () => {
      registration?.update().catch(() => undefined);
    };
  }, []);
};
