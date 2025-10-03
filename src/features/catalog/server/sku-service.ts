import { cache } from 'react';
import { notFound } from 'next/navigation';
import { findSkuById } from './sku-repository';
import type { Sku } from './sku-model';

export const getSkuById = cache(async (sku: string): Promise<Sku | null> => {
  return findSkuById(sku);
});

export const requireSkuById = async (sku: string): Promise<Sku> => {
  const data = await getSkuById(sku);
  if (!data) {
    notFound();
  }
  return data;
};
