const prepareRenderTaskMock = jest.fn();
const enqueueRenderTaskMock = jest.fn();

jest.mock('@/features/orders/server/order-rendering', () => ({
  prepareRenderTask: prepareRenderTaskMock,
  enqueueRenderTask: enqueueRenderTaskMock,
}));

const orderSetMock = jest.fn();
const lineSetMock = jest.fn();
const lineDocMock = jest.fn(() => ({ set: lineSetMock }));
const itemsCollectionMock = { doc: lineDocMock };
const orderDocMock = {
  id: 'order_test_id',
  set: orderSetMock,
  collection: jest.fn(() => itemsCollectionMock),
};
const ordersCollectionMock = { doc: jest.fn(() => orderDocMock) };
const dbCollectionMock = jest.fn(() => ordersCollectionMock);

jest.mock('@/server/firebase/admin', () => ({
  getDb: jest.fn(() => ({
    collection: dbCollectionMock,
  })),
}));

const loadOrdersRoute = async () => {
  const routeModule = await import('./route');
  return routeModule.POST;
};

describe('POST /api/orders/place', () => {
  beforeEach(() => {
    orderSetMock.mockClear();
    lineSetMock.mockClear();
    lineDocMock.mockClear();
    ordersCollectionMock.doc.mockClear();
    orderDocMock.collection.mockClear();
    dbCollectionMock.mockClear();
    prepareRenderTaskMock.mockReset().mockImplementation(async ({ orderId, lineItemId, designId }) => ({
      payload: {
        orderId,
        lineItemId,
        designId,
        source: { bucket: 'designs', path: `${designId}/source.png` },
        printSpec: {
          widthMm: 210,
          heightMm: 297,
          dpi: 300,
          bleedMm: 3,
          safeZoneMm: 3,
          outputFormat: 'tiff',
        },
        safeArea: {
          xMm: 3,
          yMm: 3,
          widthMm: 200,
          heightMm: 291,
        },
        metadata: {
          designChecksum: 'checksum',
          queuedAt: new Date().toISOString(),
        },
      },
      printSpec: {
        widthMm: 210,
        heightMm: 297,
        dpi: 300,
        bleedMm: 3,
        safeZoneMm: 3,
        outputFormat: 'tiff',
      },
      safeArea: {
        xMm: 3,
        yMm: 3,
        widthMm: 200,
        heightMm: 291,
      },
      source: { bucket: 'designs', path: `${designId}/source.png` },
      designOwner: 'designer-123',
      designChecksum: 'checksum',
    }));
    enqueueRenderTaskMock.mockReset().mockResolvedValue(undefined);
  });

  it('persists order, line items, and enqueues render tasks', async () => {
    const POST = await loadOrdersRoute();
    const payload = {
      paymentIntentId: 'pi_test_001',
      amount: 4599,
      currency: 'usd',
      shipping: {
        method: 'standard' as const,
        cost: 20,
        name: 'Test Buyer',
        phone: '+1-555-0101',
        email: 'buyer@example.com',
        address: '123 Commerce Road',
      },
      items: [
        {
          sku: 'sku_tshirt_red',
          designId: 'design_xyz',
          name: 'Red Tee',
          variants: { size: 'M', color: 'Red', material: 'Cotton' },
          quantity: 2,
          price: 2199,
        },
      ],
      userId: 'user_789',
    };

    const request = new Request('http://localhost/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = (await response.json()) as { orderId: string };
    expect(data.orderId).toBe('order_test_id');

    expect(dbCollectionMock).toHaveBeenCalledWith('orders');
    expect(ordersCollectionMock.doc).toHaveBeenCalledTimes(1);
    expect(orderSetMock).toHaveBeenCalledTimes(1);
    expect(lineDocMock).toHaveBeenCalledTimes(1);
    expect(lineSetMock).toHaveBeenCalledTimes(2); // initial write + render metadata merge

    const firstLineSetCall = lineSetMock.mock.calls[0][0];
    expect(firstLineSetCall).toMatchObject({
      sku: 'sku_tshirt_red',
      renderStatus: 'pending',
    });

    const secondLineSetCallOptions = lineSetMock.mock.calls[1][1];
    expect(secondLineSetCallOptions).toEqual({ merge: true });

    expect(prepareRenderTaskMock).toHaveBeenCalledTimes(1);
    const prepareArgs = prepareRenderTaskMock.mock.calls[0][0];
    expect(prepareArgs).toMatchObject({
      orderId: 'order_test_id',
      designId: 'design_xyz',
      sku: 'sku_tshirt_red',
    });

    expect(enqueueRenderTaskMock).toHaveBeenCalledTimes(1);
    expect(enqueueRenderTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order_test_id',
        designId: 'design_xyz',
      }),
    );
  });

  it('returns 400 for invalid payload', async () => {
    const POST = await loadOrdersRoute();
    const request = new Request('http://localhost/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId: '',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(orderSetMock).not.toHaveBeenCalled();
    expect(lineSetMock).not.toHaveBeenCalled();
  });
});
