import * as admin from 'firebase-admin';
import type { ModerationRecord, ModerationRecordInput } from './types';
import { truncateForSnapshot } from './utils';

const db = admin.firestore();

export interface CreateRecordOptions {
  textSample?: string | null;
  imageSource?: 'url' | 'base64' | null;
  imageReference?: string | null;
  upsertByHash?: boolean;
}

const DEFAULT_APPEAL_STATUS: ModerationRecord['appealStatus'] = 'none';

export const createModerationRecord = async (
  input: ModerationRecordInput,
  options: CreateRecordOptions = {},
): Promise<ModerationRecord> => {
  const collection = db.collection('moderations');

  let docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
  let existingData: FirebaseFirestore.DocumentData | undefined;

  if (options.upsertByHash) {
    const existing = await collection
      .where('contentHash', '==', input.contentHash)
      .where('context', '==', input.context ?? null)
      .limit(1)
      .get();

    if (!existing.empty) {
      docRef = existing.docs[0].ref;
      existingData = existing.docs[0].data();
    } else {
      docRef = collection.doc();
    }
  } else {
    docRef = collection.doc();
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  const payload: FirebaseFirestore.WithFieldValue<FirebaseFirestore.DocumentData> = {
    recordType: input.recordType,
    status: input.status,
    userId: input.userId ?? null,
    referenceId: input.referenceId ?? null,
    context: input.context ?? null,
    metadata: input.metadata ?? {},
    textResult: input.textResult ?? null,
    imageResult: input.imageResult ?? null,
    contentHash: input.contentHash,
    source: input.source,
    updatedAt: now,
  };

  if (options.textSample !== undefined) {
    payload.textSample = options.textSample ? truncateForSnapshot(options.textSample) : null;
  } else if (existingData?.textSample !== undefined) {
    payload.textSample = existingData.textSample;
  }

  if (options.imageSource !== undefined) {
    payload.imageSource = options.imageSource;
  } else if (existingData?.imageSource !== undefined) {
    payload.imageSource = existingData.imageSource;
  }

  if (options.imageReference !== undefined) {
    payload.imageReference = options.imageReference;
  } else if (existingData?.imageReference !== undefined) {
    payload.imageReference = existingData.imageReference;
  }

  if (!existingData) {
    payload.createdAt = now;
    payload.appealStatus = DEFAULT_APPEAL_STATUS;
  }

  await docRef.set(payload, { merge: true });

  const snapshot = await docRef.get();
  const data = snapshot.data() as ModerationRecordInput & {
    createdAt?: FirebaseFirestore.Timestamp;
    updatedAt?: FirebaseFirestore.Timestamp;
    appealStatus?: ModerationRecord['appealStatus'];
    textSample?: string | null;
    imageSource?: 'url' | 'base64' | null;
    imageReference?: string | null;
  };

  const createdAt = (data.createdAt ?? new admin.firestore.Timestamp(0, 0)).toDate().toISOString();
  const updatedAt = (data.updatedAt ?? new admin.firestore.Timestamp(0, 0)).toDate().toISOString();

  return {
    id: docRef.id,
    recordType: data.recordType ?? input.recordType,
    status: data.status ?? input.status,
    userId: data.userId ?? input.userId ?? null,
    referenceId: data.referenceId ?? input.referenceId ?? null,
    context: data.context ?? input.context ?? null,
    metadata: data.metadata ?? input.metadata ?? {},
    textResult: data.textResult ?? input.textResult,
    imageResult: data.imageResult ?? input.imageResult,
    contentHash: data.contentHash ?? input.contentHash,
    source: data.source ?? input.source,
    createdAt,
    updatedAt,
    appealStatus: data.appealStatus ?? DEFAULT_APPEAL_STATUS,
  };
};

