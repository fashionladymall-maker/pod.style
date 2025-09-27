import { getDb } from '@/server/firebase/admin';
import type { Creation } from '@/lib/types';
import { creationDataSchema, nowTimestamp, toCreation, type CreationDocument } from './creation-model';

const COLLECTION = 'creations';

const getCollection = () => getDb().collection(COLLECTION);

const withConverter = (collection: FirebaseFirestore.CollectionReference) =>
  collection.withConverter<CreationDocument>({
    fromFirestore(snapshot) {
      const data = creationDataSchema.parse(snapshot.data());
      return data;
    },
    toFirestore(doc: CreationDocument) {
      return doc;
    },
  });

export const findCreationById = async (id: string): Promise<Creation | null> => {
  const docRef = withConverter(getCollection()).doc(id);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return null;
  }
  return toCreation(snapshot.id, snapshot.data());
};

export const listUserCreations = async (userId: string): Promise<Creation[]> => {
  const snapshot = await withConverter(getCollection())
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map((doc) => toCreation(doc.id, doc.data()));
};

export const listPublicCreations = async (): Promise<Creation[]> => {
  const snapshot = await withConverter(getCollection())
    .where('isPublic', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(120)
    .get();
  return snapshot.docs.map((doc) => toCreation(doc.id, doc.data()));
};

export const createCreation = async (doc: Omit<CreationDocument, 'createdAt'> & { createdAt?: FirebaseFirestore.Timestamp }) => {
  const document: CreationDocument = {
    ...doc,
    createdAt: doc.createdAt ?? nowTimestamp(),
  };
  const ref = await getCollection().add(document);
  const snapshot = await withConverter(getCollection()).doc(ref.id).get();
  if (!snapshot.exists) {
    throw new Error('Failed to create creation document');
  }
  return toCreation(snapshot.id, snapshot.data());
};

export const setCreation = async (id: string, doc: CreationDocument) => {
  await getCollection().doc(id).set(doc, { merge: true });
  const snapshot = await withConverter(getCollection()).doc(id).get();
  if (!snapshot.exists) {
    throw new Error('Creation not found after update');
  }
  return toCreation(snapshot.id, snapshot.data());
};

export const updateCreation = async (id: string, data: Partial<CreationDocument>) => {
  await getCollection().doc(id).set(data, { merge: true });
  const snapshot = await withConverter(getCollection()).doc(id).get();
  if (!snapshot.exists) {
    throw new Error('Creation not found after update');
  }
  return toCreation(snapshot.id, snapshot.data());
};

export const deleteCreation = async (id: string) => {
  await getCollection().doc(id).delete();
};

export const getCollectionRef = () => getCollection();
