import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { prepareRenderTask, enqueueRenderTask } from '@/features/orders/server/order-rendering';
import { getDb } from '@/server/firebase/admin';
import { logger } from '@/utils/logger';

const requestSchema = z.object({
  paymentIntentId: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().min(1),
  shipping: z.object({
    method: z.enum(['standard', 'express']),
    cost: z.number().nonnegative(),
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
    address: z.string().min(1),
  }),
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        designId: z.string().min(1),
        name: z.string().optional(),
        variants: z.record(z.string().min(1)),
        quantity: z.number().int().positive(),
        price: z.number().nonnegative(),
      }),
    )
    .nonempty(),
  userId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await request.json());
  } catch (error) {
    logger.warn('orders.place.invalid_payload', { error });
    return NextResponse.json({ error: '请求参数不合法' }, { status: 400 });
  }

  try {
    const db = getDb();
    const docRef = db.collection('orders').doc();
    const now = Timestamp.now();

    await docRef.set({
      user: payload.userId ?? 'anonymous',
      status: 'paid',
      items: payload.items,
      shipping: {
        ...payload.shipping,
        cost: payload.shipping.cost,
      },
      payment: {
        method: 'stripe',
        amount: payload.amount,
        currency: payload.currency,
        stripePaymentIntentId: payload.paymentIntentId,
        paidAt: now,
      },
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          status: 'paid',
          occurredAt: now,
          source: 'system',
        },
      ],
      metadata: {
        shippingMethod: payload.shipping.method,
      },
    });

    logger.info('orders.place.created', {
      orderId: docRef.id,
      paymentIntentId: payload.paymentIntentId,
    });

    for (const item of payload.items) {
      const lineItemId = randomUUID();
      const lineItemRef = docRef.collection('items').doc(lineItemId);

      await lineItemRef.set({
        lineItemId,
        sku: item.sku,
        designId: item.designId,
        name: item.name ?? null,
        variants: item.variants,
        quantity: item.quantity,
        price: item.price,
        ownerUid: payload.userId ?? 'anonymous',
        renderStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      });

      try {
        const renderConfig = await prepareRenderTask({
          designId: item.designId,
          sku: item.sku,
          orderId: docRef.id,
          lineItemId,
        });

        await lineItemRef.set(
          {
            renderStatus: 'queued',
            renderSpec: renderConfig.printSpec,
            renderSafeArea: renderConfig.safeArea,
            renderSource: renderConfig.source,
            designOwner: renderConfig.designOwner ?? null,
            designChecksum: renderConfig.designChecksum ?? null,
            updatedAt: Timestamp.now(),
          },
          { merge: true },
        );

        await enqueueRenderTask(renderConfig.payload);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'render_task_failed';
        logger.error('orders.render.enqueue_failed', {
          orderId: docRef.id,
          lineItemId,
          designId: item.designId,
          error: message,
        });

        await lineItemRef.set(
          {
            renderStatus: 'failed',
            renderError: message,
            updatedAt: Timestamp.now(),
          },
          { merge: true },
        );
      }
    }

    return NextResponse.json({ orderId: docRef.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    logger.error('orders.place.failed', { error: message });
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
  }
}
