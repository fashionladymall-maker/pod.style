import { getDb } from '@/server/firebase/admin';
import { orderDocumentSchema, toOrderSummary, type OrderSummary } from './order-model';

const COLLECTION = 'orders';

export const findOrderById = async (orderId: string): Promise<OrderSummary | null> => {
  const snapshot = await getDb().collection(COLLECTION).doc(orderId).get();
  if (!snapshot.exists) {
    return null;
  }
  const parsed = orderDocumentSchema.parse(snapshot.data());
  return toOrderSummary(snapshot.id, parsed);
};

export const upsertOrder = async (orderId: string, data: unknown): Promise<OrderSummary> => {
  const payload = orderDocumentSchema.parse(data);
  const docRef = getDb().collection(COLLECTION).doc(orderId);
  await docRef.set(payload, { merge: true });
  return toOrderSummary(orderId, payload);
};
