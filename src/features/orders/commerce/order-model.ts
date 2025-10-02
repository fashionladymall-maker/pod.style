import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

export const orderStatusSchema = z.enum(['created', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderItemSchema = z.object({
  sku: z.string(),
  name: z.string().optional(),
  designId: z.string().optional(),
  variants: z.record(z.string()),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
});

export const shippingSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  method: z.enum(['standard', 'express']),
  cost: z.number().nonnegative(),
  email: z.string().email().optional(),
});

export const paymentSchema = z.object({
  method: z.literal('stripe'),
  amount: z.number().nonnegative(),
  currency: z.string().min(1),
  stripePaymentIntentId: z.string(),
  paidAt: z.instanceof(Timestamp).optional(),
});

export const orderDocumentSchema = z.object({
  user: z.string(),
  status: orderStatusSchema,
  items: z.array(orderItemSchema),
  shipping: shippingSchema,
  payment: paymentSchema,
  createdAt: z.union([z.instanceof(Timestamp), z.string().datetime({ offset: true })]),
  updatedAt: z.union([z.instanceof(Timestamp), z.string().datetime({ offset: true })]),
  metadata: z.record(z.unknown()).optional(),
});

export type OrderDocument = z.infer<typeof orderDocumentSchema>;

export interface OrderItem {
  sku: string;
  name?: string;
  designId?: string;
  variants: Record<string, string>;
  quantity: number;
  price: number;
}

export interface OrderPayment {
  method: 'stripe';
  amount: number;
  currency: string;
  stripePaymentIntentId: string;
  paidAt?: string;
}

export interface OrderShipping extends Omit<z.infer<typeof shippingSchema>, 'cost'> {
  cost: number;
}

export interface OrderSummary {
  id: string;
  user: string;
  status: OrderStatus;
  items: OrderItem[];
  shipping: OrderShipping;
  payment: OrderPayment;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export const toOrderSummary = (id: string, data: OrderDocument): OrderSummary => ({
  id,
  user: data.user,
  status: data.status,
  items: data.items,
  shipping: {
    ...data.shipping,
    cost: data.shipping.cost,
  },
  payment: {
    ...data.payment,
    paidAt:
      data.payment.paidAt instanceof Timestamp
        ? data.payment.paidAt.toDate().toISOString()
        : data.payment.paidAt ?? undefined,
  },
  createdAt:
    data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
  updatedAt:
    data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
  metadata: data.metadata,
});
