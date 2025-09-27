"use server";

import { z } from 'zod';
import { isFirebaseAdminConfigured } from '@/server/firebase/admin';
import { placeOrder, getOrdersForUser } from './order-service';
import { paymentSummarySchema } from './order-model';

const ensureFirestore = () => {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Firebase Admin SDK is not configured.');
  }
};

const shippingSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
});

const orderDetailsSchema = z.object({
  color: z.string(),
  colorName: z.string(),
  size: z.string(),
  quantity: z.number().int().positive(),
});

const createOrderSchema = z.object({
  userId: z.string(),
  creationId: z.string(),
  modelUri: z.string().url(),
  category: z.string(),
  price: z.number().nonnegative(),
  orderDetails: orderDetailsSchema,
  shippingInfo: shippingSchema,
  paymentSummary: paymentSummarySchema,
});

export const createOrderAction = async (input: z.infer<typeof createOrderSchema>) => {
  ensureFirestore();
  const payload = createOrderSchema.parse(input);
  return placeOrder({
    userId: payload.userId,
    creationId: payload.creationId,
    modelUri: payload.modelUri,
    category: payload.category,
    orderDetails: payload.orderDetails,
    shippingInfo: payload.shippingInfo,
    paymentSummary: payload.paymentSummary,
    price: payload.price,
  });
};

export const getOrdersAction = async (userId: string) => {
  ensureFirestore();
  return getOrdersForUser(z.string().parse(userId));
};
