"use server";

import { z } from 'zod';
import { isFirebaseAdminConfigured, getDb } from '@/server/firebase/admin';
import { getCollectionRef as getCreationsCollection } from '@/features/creations/server/creation-repository';
import { getCollectionRef as getOrdersCollection } from '@/features/orders/server/order-repository';

type MigrationSkipCode = 'identical-user' | 'no-data';
type MigrationErrorCode = 'admin-not-configured' | 'commit-failed';

type MigrationResult =
  | { success: true; skipped?: MigrationSkipCode }
  | { success: false; error: MigrationErrorCode };

const migrationSchema = z.object({
  anonymousUid: z.string(),
  permanentUid: z.string(),
});

export const migrateAnonymousDataAction = async (
  anonymousUid: string,
  permanentUid: string,
): Promise<MigrationResult> => {
  if (!isFirebaseAdminConfigured()) {
    console.warn(
      '[auth] Firebase Admin SDK is not configured. Skipping anonymous data migration.',
    );
    return { success: false, error: 'admin-not-configured' };
  }

  const payload = migrationSchema.parse({ anonymousUid, permanentUid });
  if (payload.anonymousUid === payload.permanentUid) {
    return { success: true, skipped: 'identical-user' };
  }

  const db = getDb();
  const creationsSnapshot = await getCreationsCollection()
    .where('userId', '==', payload.anonymousUid)
    .get();
  const ordersSnapshot = await getOrdersCollection()
    .where('userId', '==', payload.anonymousUid)
    .get();

  if (creationsSnapshot.empty && ordersSnapshot.empty) {
    return { success: true, skipped: 'no-data' };
  }

  const batch = db.batch();
  creationsSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { userId: payload.permanentUid });
  });
  ordersSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { userId: payload.permanentUid });
  });

  try {
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('[auth] Failed to migrate anonymous data.', error);
    return { success: false, error: 'commit-failed' };
  }
};
