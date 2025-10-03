import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { FieldValue } from 'firebase-admin/firestore';
import type { Request } from 'express';
import { z } from 'zod';

const db = admin.firestore();

const factoryStatusSchema = z.enum(['printing', 'shipped', 'delivered']);

const payloadSchema = z.object({
  orderId: z.string().min(1),
  lineItemId: z.string().min(1).optional(),
  status: factoryStatusSchema,
  notes: z.string().optional(),
});

const statusMap: Record<z.infer<typeof factoryStatusSchema>, string> = {
  printing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
};

const resolveFactoryToken = () => {
  const fromConfig = functions.config().factory?.token as string | undefined;
  return fromConfig ?? process.env.FACTORY_WEBHOOK_TOKEN;
};

const verifyFactoryToken = (req: Request) => {
  const expected = resolveFactoryToken();
  if (!expected) {
    return true;
  }
  const header = req.headers['x-factory-token'];
  const provided = Array.isArray(header) ? header[0] : header;
  return provided === expected;
};

export const factoryStatusCallback = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-Factory-Token');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  if (!verifyFactoryToken(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const parseResult = payloadSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'invalid_payload', details: parseResult.error.flatten() });
    return;
  }

  const { orderId, lineItemId, status, notes } = parseResult.data;
  const mappedStatus = statusMap[status];

  try {
    const orderRef = db.collection('orders').doc(orderId);

    await db.runTransaction(async (txn) => {
      const snapshot = await txn.get(orderRef);
      if (!snapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'Order not found');
      }

      txn.update(orderRef, {
        status: mappedStatus,
        updatedAt: FieldValue.serverTimestamp(),
        statusHistory: FieldValue.arrayUnion({
          status: mappedStatus,
          occurredAt: FieldValue.serverTimestamp(),
          source: 'factory',
          note: notes ?? null,
        }),
      });

      if (lineItemId) {
        const itemRef = orderRef.collection('items').doc(lineItemId);
        txn.set(
          itemRef,
          {
            fulfillmentStatus: status,
            updatedAt: FieldValue.serverTimestamp(),
            fulfillmentEvents: FieldValue.arrayUnion({
              status,
              occurredAt: FieldValue.serverTimestamp(),
              note: notes ?? null,
            }),
          },
          { merge: true },
        );
      }
    });

    functions.logger.info('orders.factory.status_updated', {
      orderId,
      lineItemId: lineItemId ?? null,
      status,
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'internal_error';
    functions.logger.error('orders.factory.update_failed', {
      orderId,
      lineItemId: lineItemId ?? null,
      status,
      error: message,
    });

    if (error instanceof functions.https.HttpsError && error.code === 'not-found') {
      res.status(404).json({ error: 'order_not_found' });
      return;
    }

    res.status(500).json({ error: 'internal_error' });
  }
});
