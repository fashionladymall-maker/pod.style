import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';
import type { CartItem } from './types';

export const cartVariantsSchema = z.object({
  size: z.string(),
  color: z.string(),
  material: z.string(),
});

export const cartItemDocSchema = z.object({
  sku: z.string(),
  name: z.string(),
  image: z.string().min(1).optional(),
  designId: z.string().optional(),
  variants: cartVariantsSchema,
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  currency: z.string().min(1),
  shippingPrice: z.number().nonnegative().optional(),
  shippingMethod: z.enum(['standard', 'express']).optional(),
  subtotal: z.number().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional(),
  addedAt: z.union([z.instanceof(Timestamp), z.string().datetime()]).optional(),
});

export type CartItemDocument = z.infer<typeof cartItemDocSchema>;

export const toCartItem = (id: string, data: CartItemDocument): CartItem => ({
  id,
  sku: data.sku,
  name: data.name,
  image: data.image,
  designId: data.designId,
  variants: data.variants,
  quantity: data.quantity,
  price: data.price,
  currency: data.currency,
  shippingPrice: data.shippingPrice,
  shippingMethod: data.shippingMethod,
  subtotal: data.subtotal,
  metadata: data.metadata,
});

export const computeSubtotal = (item: CartItem) => {
  const line = item.price * item.quantity;
  return item.shippingPrice ? line + item.shippingPrice : line;
};
