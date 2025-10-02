import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

export const shippingTierSchema = z.object({
  days: z.number().int().nonnegative(),
  price: z.number().nonnegative(),
});

export const skuVariantsSchema = z.object({
  size: z.array(z.string().min(1)),
  color: z.array(z.string().min(1)),
  material: z.array(z.string().min(1)),
});

export const skuDocumentSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  basePrice: z.number().nonnegative(),
  currency: z.string().min(1),
  images: z.array(z.string().min(1)).default([]),
  variants: skuVariantsSchema,
  stock: z.record(z.number().int().nonnegative()).default({}),
  shipping: z.object({
    standard: shippingTierSchema,
    express: shippingTierSchema,
  }),
  attributes: z.record(z.unknown()).optional(),
  createdAt: z.union([z.instanceof(Timestamp), z.string().datetime({ offset: true })]).optional(),
  updatedAt: z.union([z.instanceof(Timestamp), z.string().datetime({ offset: true })]).optional(),
});

export type SkuDocument = z.infer<typeof skuDocumentSchema>;

export interface ShippingTier {
  days: number;
  price: number;
}

export interface SkuVariantOptions {
  size: string[];
  color: string[];
  material: string[];
}

export interface Sku {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  currency: string;
  images: string[];
  variants: SkuVariantOptions;
  stock: Record<string, number>;
  shipping: {
    standard: ShippingTier;
    express: ShippingTier;
  };
  attributes?: Record<string, unknown>;
}

export const toSku = (id: string, data: SkuDocument): Sku => ({
  id,
  name: data.name,
  description: data.description,
  basePrice: data.basePrice,
  currency: data.currency,
  images: data.images,
  variants: data.variants,
  stock: data.stock,
  shipping: data.shipping,
  attributes: data.attributes,
});
