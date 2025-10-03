'use client';

import { useEffect } from 'react';
import { initFirebasePerformance } from '@/lib/performance/firebase-performance';

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    void initFirebasePerformance();
  }, []);
};
