import { cartItemDocSchema, computeSubtotal, toCartItem } from '../model';

describe('cart model', () => {
  it('parses Firestore documents into CartItem', () => {
    const doc = cartItemDocSchema.parse({
      sku: 'sku_001',
      name: 'Premium Hoodie',
      image: 'https://example.com/image.jpg',
      variants: { size: 'L', color: 'Navy', material: 'Fleece' },
      quantity: 1,
      price: 199,
      currency: 'usd',
      subtotal: 209,
      shippingPrice: 10,
      shippingMethod: 'standard',
      metadata: { expressShippingPrice: 25 },
      addedAt: '2025-01-01T00:00:00.000Z',
    });

    const item = toCartItem('item-1', doc);
    expect(item).toMatchObject({
      id: 'item-1',
      sku: 'sku_001',
      name: 'Premium Hoodie',
      variants: { size: 'L', color: 'Navy', material: 'Fleece' },
      quantity: 1,
      price: 199,
      currency: 'usd',
      shippingPrice: 10,
      shippingMethod: 'standard',
    });
    expect(item.metadata).toEqual({ expressShippingPrice: 25 });
  });

  it('computes subtotal including shipping when provided', () => {
    const item = {
      id: 'item-1',
      sku: 'sku_001',
      name: 'Premium Hoodie',
      variants: { size: 'L', color: 'Navy', material: 'Fleece' },
      quantity: 2,
      price: 99,
      currency: 'usd',
      shippingPrice: 12,
      shippingMethod: 'standard' as const,
    };

    expect(computeSubtotal(item)).toBe(99 * 2 + 12);
  });
});
