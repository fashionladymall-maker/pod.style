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
  const data = snapshot.data();
  if (!data) {
    throw new Error('Creation document missing data');
  }
  return toCreation(snapshot.id, data);
};

export const listUserCreations = async (userId: string): Promise<Creation[]> => {
  try {
    const snapshot = await withConverter(getCollection())
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => toCreation(doc.id, doc.data()));
  } catch (error: unknown) {
    const firestoreError = error as { code?: number; message?: string } | undefined;
    // If index is missing or building, fall back to a simpler query
    if (firestoreError?.code === 9 || firestoreError?.message?.includes('index')) {
      console.warn('Firestore index not ready for user creations, falling back to simple query');
      const snapshot = await withConverter(getCollection())
        .where('userId', '==', userId)
        .get();
      // Sort in memory since we can't use orderBy without index
      const docs = snapshot.docs.map((doc) => toCreation(doc.id, doc.data()));
      return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    throw error;
  }
};

export const listPublicCreations = async (limit: number = 20): Promise<Creation[]> => {
  try {
    const snapshot = await withConverter(getCollection())
      .where('isPublic', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => toCreation(doc.id, doc.data()));
  } catch (error: unknown) {
    const firestoreError = error as { code?: number; message?: string } | undefined;
    // If index is missing, fall back to a simpler query
    if (firestoreError?.code === 9 || firestoreError?.message?.includes('index')) {
      console.warn('Firestore index not ready, falling back to simple query');
      const snapshot = await withConverter(getCollection())
        .where('isPublic', '==', true)
        .limit(limit)
        .get();
      return snapshot.docs.map((doc) => toCreation(doc.id, doc.data()));
    }
    throw error;
  }
};

export const createCreation = async (doc: Omit<CreationDocument, 'createdAt'> & { createdAt?: FirebaseFirestore.Timestamp }) => {
  // Filter out undefined values to avoid Firestore errors
  const cleanDoc = Object.fromEntries(
    Object.entries(doc).filter(([, value]) => value !== undefined)
  ) as Omit<CreationDocument, 'createdAt'>;

  const document: CreationDocument = {
    ...cleanDoc,
    createdAt: doc.createdAt ?? nowTimestamp(),
    // Ensure optional fields have default values
    previewPatternUri: doc.previewPatternUri || undefined,
    summary: doc.summary || undefined,
  };

  // Remove undefined values from the final document
  const finalDocument = Object.fromEntries(
    Object.entries(document).filter(([, value]) => value !== undefined)
  ) as CreationDocument;

  const ref = await getCollection().add(finalDocument);
  const snapshot = await withConverter(getCollection()).doc(ref.id).get();
  if (!snapshot.exists) {
    throw new Error('Failed to create creation document');
  }
  const creationData = snapshot.data();
  if (!creationData) {
    throw new Error('Creation document missing after creation');
  }
  return toCreation(snapshot.id, creationData);
};

export const setCreation = async (id: string, doc: CreationDocument) => {
  await getCollection().doc(id).set(doc, { merge: true });
  const snapshot = await withConverter(getCollection()).doc(id).get();
  if (!snapshot.exists) {
    throw new Error('Creation not found after update');
  }
  const creationData = snapshot.data();
  if (!creationData) {
    throw new Error('Creation document missing after set');
  }
  return toCreation(snapshot.id, creationData);
};

export const updateCreation = async (id: string, data: Partial<CreationDocument>) => {
  await getCollection()
    .doc(id)
    .set(data as FirebaseFirestore.PartialWithFieldValue<CreationDocument>, { merge: true });
  const snapshot = await withConverter(getCollection()).doc(id).get();
  if (!snapshot.exists) {
    throw new Error('Creation not found after update');
  }
  const creationData = snapshot.data();
  if (!creationData) {
    throw new Error('Creation document missing after update');
  }
  return toCreation(snapshot.id, creationData);
};

export const deleteCreation = async (id: string) => {
  await getCollection().doc(id).delete();
};

export const getCollectionRef = () => getCollection();
