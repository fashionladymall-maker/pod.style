import type { CollectionReference } from 'firebase-admin/firestore';
import { getDb } from '@/server/firebase/admin';
import { orderDataSchema, toOrder, type OrderDocument } from './order-model';
import type { Order } from '@/lib/types';

const COLLECTION = 'orders';

const getCollection = () => getDb().collection(COLLECTION);

const withConverter = (collection: CollectionReference) =>
  collection.withConverter<OrderDocument>({
    fromFirestore(snapshot) {
      const data = orderDataSchema.parse(snapshot.data());
      return data;
    },
    toFirestore(doc: OrderDocument) {
      return doc;
    },
  });

export const createOrder = async (data: OrderDocument) => {
  const ref = await getCollection().add(data);
  const snapshot = await withConverter(getCollection()).doc(ref.id).get();
  if (!snapshot.exists) {
    throw new Error('Failed to create order');
  }
  const doc = snapshot.data();
  if (!doc) {
    throw new Error('Order document missing after creation');
  }
  return toOrder(snapshot.id, doc);
};

export const listOrdersByUser = async (userId: string): Promise<Order[]> => {
  try {
    const snapshot = await withConverter(getCollection())
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => toOrder(doc.id, doc.data()));
  } catch (error: unknown) {
    const firestoreError = error as { code?: number; message?: string } | undefined;
    // If index is missing or building, fall back to a simpler query
    if (firestoreError?.code === 9 || firestoreError?.message?.includes('index')) {
      console.warn('Firestore index not ready for user orders, falling back to simple query');
      const snapshot = await withConverter(getCollection())
        .where('userId', '==', userId)
        .get();
      // Sort in memory since we can't use orderBy without index
      const docs = snapshot.docs.map((doc) => toOrder(doc.id, doc.data()));
      return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    throw error;
  }
};

export const getCollectionRef = () => getCollection();
