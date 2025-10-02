import type { Sku } from './server/sku-model';

export interface VariantSelection {
  size: string;
  color: string;
  material: string;
}

export const formatVariantKey = (selection: VariantSelection): string =>
  `${selection.size}-${selection.color}-${selection.material}`;

export const getVariantStock = (sku: Sku, selection: VariantSelection): number => {
  const key = formatVariantKey(selection);
  return sku.stock[key] ?? 0;
};

export const getDefaultSelection = (sku: Sku): VariantSelection => ({
  size: sku.variants.size[0] ?? '',
  color: sku.variants.color[0] ?? '',
  material: sku.variants.material[0] ?? '',
});
