import type { DocumentSnapshot } from 'firebase-admin/firestore';
import type { UserFineTunedModel, UserFineTunedModelData } from '@/lib/types';
import { getDb } from '@/server/firebase/admin';
import { toUserFineTunedModel, userFineTunedModelSchema } from './user-model-model';

const COLLECTION_NAME = 'userFineTunedModels';

const collectionRef = () => getDb().collection(COLLECTION_NAME);

const parseDocument = (doc: DocumentSnapshot): UserFineTunedModel => {
  const data = doc.data();
  if (!data) {
    throw new Error('User fine-tuned model document is empty.');
  }
  const parsed = userFineTunedModelSchema.parse(data);
  return toUserFineTunedModel(parsed);
};

export const findUserFineTunedModel = async (userId: string): Promise<UserFineTunedModel | null> => {
  const snapshot = await collectionRef().doc(userId).get();
  if (!snapshot.exists) {
    return null;
  }
  return parseDocument(snapshot);
};

export const createUserFineTunedModel = async (
  data: UserFineTunedModelData
): Promise<UserFineTunedModel> => {
  await collectionRef().doc(data.userId).set(data);
  const snapshot = await collectionRef().doc(data.userId).get();
  return parseDocument(snapshot);
};

export const updateUserFineTunedModel = async (
  userId: string,
  updates: Partial<UserFineTunedModelData>
): Promise<UserFineTunedModel> => {
  await collectionRef().doc(userId).set(updates, { merge: true });
  const snapshot = await collectionRef().doc(userId).get();
  if (!snapshot.exists) {
    throw new Error('User fine-tuned model not found after update.');
  }
  return parseDocument(snapshot);
};
