import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { OrderSummary } from './order-model';
import { findOrderById } from './order-repository';

export const getOrderById = cache(async (orderId: string): Promise<OrderSummary | null> => {
  return findOrderById(orderId);
});

export const requireOrderById = async (orderId: string): Promise<OrderSummary> => {
  const order = await getOrderById(orderId);
  if (!order) {
    notFound();
  }
  return order;
};
