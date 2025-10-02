import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin, db } from '@/server/firebase/admin';

const listQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
});

const submitAppealSchema = z.object({
  recordId: z.string().min(1),
  note: z.string().optional(),
  actor: z.string().optional(),
});

const isAuthorized = (request: Request) => {
  const requiredToken = process.env.MODERATION_ADMIN_TOKEN;
  if (!requiredToken) {
    return true;
  }
  const provided = request.headers.get('x-admin-token');
  return provided === requiredToken;
};

const unauthorized = () => NextResponse.json({ error: 'unauthorized' }, { status: 401 });

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const limit = listQuerySchema.parse({ limit: url.searchParams.get('limit') }).limit ?? 20;

  const snapshot = await db
    .collection('moderations')
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();

  const items = snapshot.docs.map((doc) => {
    const data = doc.data() as {
      status?: string;
      recordType?: string;
      context?: string | null;
      userId?: string | null;
      referenceId?: string | null;
      appealStatus?: string;
      metadata?: Record<string, unknown>;
      textResult?: { matches?: unknown[] } | null;
      imageResult?: { flags?: unknown[] } | null;
      createdAt?: FirebaseFirestore.Timestamp;
      updatedAt?: FirebaseFirestore.Timestamp;
    };

    return {
      id: doc.id,
      status: (data.status ?? 'pass') as 'pass' | 'warn' | 'reject',
      recordType: data.recordType ?? 'text',
      context: data.context ?? null,
      userId: data.userId ?? null,
      referenceId: data.referenceId ?? null,
      appealStatus: (data.appealStatus ?? 'none') as 'none' | 'submitted' | 'in_review' | 'approved' | 'rejected',
      metadata: data.metadata ?? {},
      textMatches: data.textResult?.matches?.length ?? 0,
      imageFlags: data.imageResult?.flags?.length ?? 0,
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
    };
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const body = await request.json();
  const payload = submitAppealSchema.parse(body);

  const docRef = db.collection('moderations').doc(payload.recordId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return NextResponse.json({ error: 'record_not_found' }, { status: 404 });
  }

  await docRef.set(
    {
      appealStatus: 'submitted',
      appealNote: payload.note ?? null,
      appealActor: payload.actor ?? null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true });
}

