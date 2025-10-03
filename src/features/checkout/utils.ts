import type { CartItem } from '@/features/cart/types';
import type { CheckoutFormValues } from './schema/checkout-schema';

export type ShippingMethod = CheckoutFormValues['method'];

export const getShippingPriceByMethod = (item: CartItem, method: ShippingMethod): number => {
  if (method === 'express') {
    const express = item.metadata?.expressShippingPrice;
    if (typeof express === 'number') {
      return express;
    }
  }
  if (typeof item.shippingPrice === 'number') {
    return item.shippingPrice;
  }
  const standard = item.metadata?.standardShippingPrice;
  return typeof standard === 'number' ? standard : 0;
};

export const calculateShippingTotals = (items: CartItem[], method: ShippingMethod) =>
  items.reduce((sum, item) => sum + getShippingPriceByMethod(item, method), 0);

export const calculateItemSubtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);
