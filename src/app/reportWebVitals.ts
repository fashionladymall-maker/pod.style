import type { NextWebVitalsMetric } from 'next/app';
import { sendWebVitalMetric } from '@/lib/performance/web-vitals';

export function reportWebVitals(metric: NextWebVitalsMetric) {
  sendWebVitalMetric(metric);
}
