import { Timestamp } from 'firebase-admin/firestore';
import { orderDocumentSchema, toOrderSummary } from '../order-model';

describe('order model', () => {
  it('converts Firestore documents into OrderSummary', () => {
    const now = Timestamp.now();
    const doc = orderDocumentSchema.parse({
      user: 'user-1',
      status: 'paid',
      items: [
        {
          sku: 'sku-001',
          name: 'Test Tee',
          variants: { size: 'M', color: 'Black' },
          quantity: 2,
          price: 129,
        },
      ],
      shipping: {
        method: 'standard',
        cost: 10,
        name: 'Alice',
        phone: '123456789',
        address: 'Test Street 1',
      },
      payment: {
        method: 'stripe',
        amount: 268,
        currency: 'usd',
        stripePaymentIntentId: 'pi_123',
        paidAt: now,
      },
      createdAt: now,
      updatedAt: now,
    });

    const summary = toOrderSummary('order-1', doc);
    expect(summary).toMatchObject({
      id: 'order-1',
      user: 'user-1',
      status: 'paid',
      items: [
        {
          sku: 'sku-001',
          name: 'Test Tee',
          quantity: 2,
          price: 129,
        },
      ],
      payment: {
        method: 'stripe',
        amount: 268,
        currency: 'usd',
        stripePaymentIntentId: 'pi_123',
      },
    });
    expect(summary.payment.paidAt).toBeDefined();
  });
});
