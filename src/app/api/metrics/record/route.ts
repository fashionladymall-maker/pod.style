import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb, isFirebaseAdminConfigured } from '@/server/firebase/admin';

export const runtime = 'nodejs';

interface MetricPayload {
  type?: 'web-vital' | 'custom-metric';
  name?: string;
  value?: number;
  id?: string;
  label?: string;
  page?: string;
  navigationType?: string;
  timestamp?: number;
  delta?: number;
  userAgent?: string;
  [key: string]: unknown;
}

const sanitizeMetricPayload = (payload: MetricPayload, request: NextRequest) => {
  const type = payload.type === 'custom-metric' ? 'custom-metric' : 'web-vital';
  const value = typeof payload.value === 'number' ? payload.value : Number(payload.value);

  if (!payload.name || Number.isNaN(value)) {
    return null;
  }

  const safePayload = {
    type,
    name: String(payload.name).slice(0, 120),
    value,
    id: payload.id ? String(payload.id).slice(0, 120) : undefined,
    page: payload.page ? String(payload.page).slice(0, 180) : undefined,
    navigationType: payload.navigationType ? String(payload.navigationType).slice(0, 60) : undefined,
    label: payload.label ? String(payload.label).slice(0, 60) : undefined,
    timestamp: payload.timestamp && Number.isFinite(payload.timestamp) ? payload.timestamp : Date.now(),
    userAgent: payload.userAgent ? String(payload.userAgent).slice(0, 400) : request.headers.get('user-agent')?.slice(0, 400),
    receivedAt: Date.now(),
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
  } as Record<string, unknown>;

  const extraAttributes: Record<string, string> = {};
  Object.entries(payload).forEach(([key, val]) => {
    if (key in safePayload) {
      return;
    }
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      extraAttributes[key] = String(val).slice(0, 120);
    }
  });

  if (Object.keys(extraAttributes).length > 0) {
    safePayload.attributes = extraAttributes;
  }

  return safePayload;
};

export async function POST(request: NextRequest) {
  try {
    const payload = sanitizeMetricPayload((await request.json()) as MetricPayload, request);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid metric payload' }, { status: 400 });
    }

    if (isFirebaseAdminConfigured()) {
      try {
        await getDb().collection('telemetry_web_vitals').add(payload);
      } catch (error) {
        console.error('Failed to persist performance metric', error);
      }
    }

    return NextResponse.json({ ok: true }, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error while recording performance metric', error);
    return NextResponse.json({ error: 'Failed to record metric' }, { status: 500 });
  }
}
