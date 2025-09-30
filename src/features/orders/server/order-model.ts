import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import type { Order } from '@/lib/types';

export const paymentSummarySchema = z.object({
  tokenId: z.string(),
  brand: z.string(),
  last4: z.string().min(4).max(4),
  gateway: z.enum(['stripe', 'paypal', 'mock']),
  status: z.enum(['requires_action', 'pending', 'succeeded', 'failed']),
});

export const orderStatusEventSchema = z.object({
  status: z.enum(['Processing', 'Shipped', 'Delivered', 'Cancelled']),
  occurredAt: z.instanceof(Timestamp),
  note: z.string().optional(),
});

export const orderDataSchema = z.object({
  userId: z.string(),
  creationId: z.string(),
  modelUri: z.string(),
  category: z.string(),
  size: z.string(),
  colorName: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  shippingInfo: z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string().email().optional(),
  }),
  // Make paymentSummary optional with default values for backward compatibility
  paymentSummary: paymentSummarySchema.optional().default({
    tokenId: '',
    brand: 'mock',
    last4: '0000',
    gateway: 'mock',
    status: 'pending',
  }),
  createdAt: z.instanceof(Timestamp),
  status: z.enum(['Processing', 'Shipped', 'Delivered', 'Cancelled']),
  statusHistory: z.array(orderStatusEventSchema).default([]),
});

export type OrderDocument = z.infer<typeof orderDataSchema>;

export const toOrder = (id: string, data: OrderDocument): Order => ({
  id,
  userId: data.userId,
  creationId: data.creationId,
  modelUri: data.modelUri,
  category: data.category,
  size: data.size,
  colorName: data.colorName,
  quantity: data.quantity,
  price: data.price,
  shippingInfo: data.shippingInfo,
  paymentSummary: data.paymentSummary,
  createdAt: data.createdAt.toDate().toISOString(),
  status: data.status,
  statusHistory: data.statusHistory.map((event) => ({
    status: event.status,
    occurredAt: event.occurredAt.toDate().toISOString(),
    note: event.note,
  })),
});

export const nowTimestamp = () => Timestamp.fromDate(new Date());
