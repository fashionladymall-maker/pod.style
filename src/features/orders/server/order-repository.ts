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
  return toOrder(snapshot.id, snapshot.data());
};

export const listOrdersByUser = async (userId: string): Promise<Order[]> => {
  const snapshot = await withConverter(getCollection())
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map((doc) => toOrder(doc.id, doc.data()));
};

export const getCollectionRef = () => getCollection();
