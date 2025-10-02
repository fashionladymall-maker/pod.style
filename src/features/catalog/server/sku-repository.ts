import { getDb } from '@/server/firebase/admin';
import { skuDocumentSchema, toSku, type Sku } from './sku-model';

const COLLECTION = 'skus';

export const findSkuById = async (sku: string): Promise<Sku | null> => {
  const snapshot = await getDb().collection(COLLECTION).doc(sku).get();
  if (!snapshot.exists) {
    return null;
  }
  const parsed = skuDocumentSchema.parse(snapshot.data());
  return toSku(snapshot.id, parsed);
};

export const listSkus = async (): Promise<Sku[]> => {
  const snapshot = await getDb().collection(COLLECTION).get();
  return snapshot.docs.map((doc) => {
    const parsed = skuDocumentSchema.parse(doc.data());
    return toSku(doc.id, parsed);
  });
};
