const createIntentMock = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: createIntentMock,
    },
  }));
});

process.env.STRIPE_SECRET_KEY = 'sk_test_mock_secret';

const loadCreateIntentRoute = async () => {
  const routeModule = await import('./route');
  return routeModule.POST;
};

describe('POST /api/payments/create-intent', () => {
  beforeEach(() => {
    createIntentMock.mockReset();
  });

  it('creates payment intent and returns client secret', async () => {
    const POST = await loadCreateIntentRoute();
    createIntentMock.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'secret_test_123',
    });

    const payload = {
      amount: 2999,
      currency: 'usd',
      items: [
        {
          sku: 'sku_test',
          quantity: 2,
          price: 1499,
        },
      ],
      shipping: {
        method: 'standard' as const,
        cost: 10,
        name: 'Test User',
        phone: '+1-555-0100',
        email: 'test@example.com',
        address: '123 Stripe Street',
      },
      userId: 'user_123',
    };

    const request = new Request('http://localhost/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(createIntentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: payload.amount,
        currency: payload.currency,
      }),
    );

    const data = (await response.json()) as { clientSecret: string; paymentIntentId: string };
    expect(data).toEqual({ clientSecret: 'secret_test_123', paymentIntentId: 'pi_test_123' });
  });

  it('returns 400 when payload validation fails', async () => {
    const POST = await loadCreateIntentRoute();
    const request = new Request('http://localhost/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(createIntentMock).not.toHaveBeenCalled();

    const data = (await response.json()) as { error: string };
    expect(data.error).toBeDefined();
  });

  it('returns 500 when Stripe service fails', async () => {
    const POST = await loadCreateIntentRoute();
    createIntentMock.mockRejectedValue(new Error('stripe failure'));

    const payload = {
      amount: 1099,
      currency: 'usd',
      items: [
        {
          sku: 'sku_test',
          quantity: 1,
          price: 1099,
        },
      ],
      shipping: {
        method: 'express' as const,
        cost: 20,
        name: 'Express User',
        phone: '+1-555-0200',
        email: 'express@example.com',
        address: '987 Fast Lane',
      },
      userId: 'user_456',
    };

    const request = new Request('http://localhost/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBeDefined();
  });
});
