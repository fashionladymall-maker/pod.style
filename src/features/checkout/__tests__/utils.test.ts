import { calculateItemSubtotal, calculateShippingTotals, getShippingPriceByMethod } from '../utils';
import type { CartItem } from '@/features/cart/types';

const buildCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'line-1',
  sku: 'sku_123',
  name: 'Test Tee',
  image: undefined,
  variants: { size: 'M', color: 'Black', material: 'Cotton' },
  quantity: 2,
  price: 129,
  currency: 'usd',
  shippingPrice: 10,
  shippingMethod: 'standard',
  metadata: {
    expressShippingPrice: 25,
    standardShippingPrice: 10,
  },
  ...overrides,
});

describe('checkout utils', () => {
  it('returns standard shipping price by default', () => {
    const item = buildCartItem();
    expect(getShippingPriceByMethod(item, 'standard')).toBe(10);
  });

  it('prefers express metadata when available', () => {
    const item = buildCartItem();
    expect(getShippingPriceByMethod(item, 'express')).toBe(25);
  });

  it('falls back to base shipping price when express metadata missing', () => {
    const item = buildCartItem({ metadata: {}, shippingPrice: 12 });
    expect(getShippingPriceByMethod(item, 'express')).toBe(12);
  });

  it('calculates aggregated shipping totals', () => {
    const items = [buildCartItem(), buildCartItem({ id: 'line-2', shippingPrice: 8, metadata: { expressShippingPrice: 20, standardShippingPrice: 8 } })];
    expect(calculateShippingTotals(items, 'standard')).toBe(18);
    expect(calculateShippingTotals(items, 'express')).toBe(45);
  });

  it('computes item subtotal including quantities', () => {
    const items = [buildCartItem(), buildCartItem({ id: 'line-2', quantity: 1, price: 59 })];
    expect(calculateItemSubtotal(items)).toBe(129 * 2 + 59 * 1);
  });
});
