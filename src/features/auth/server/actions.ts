"use server";

import { z } from 'zod';
import { isFirebaseAdminConfigured, getDb } from '@/server/firebase/admin';
import { getCollectionRef as getCreationsCollection } from '@/features/creations/server/creation-repository';
import { getCollectionRef as getOrdersCollection } from '@/features/orders/server/order-repository';

const ensureFirestore = () => {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Firebase Admin SDK is not configured.');
  }
};

const migrationSchema = z.object({
  anonymousUid: z.string(),
  permanentUid: z.string(),
});

export const migrateAnonymousDataAction = async (anonymousUid: string, permanentUid: string) => {
  ensureFirestore();
  const payload = migrationSchema.parse({ anonymousUid, permanentUid });
  if (payload.anonymousUid === payload.permanentUid) {
    return { success: false, error: 'duplicate-uids' } as const;
  }

  const db = getDb();
  const creationsSnapshot = await getCreationsCollection()
    .where('userId', '==', payload.anonymousUid)
    .get();
  const ordersSnapshot = await getOrdersCollection()
    .where('userId', '==', payload.anonymousUid)
    .get();

  if (creationsSnapshot.empty && ordersSnapshot.empty) {
    return { success: true } as const;
  }

  const batch = db.batch();
  creationsSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { userId: payload.permanentUid });
  });
  ordersSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { userId: payload.permanentUid });
  });

  await batch.commit();
  return { success: true } as const;
};
