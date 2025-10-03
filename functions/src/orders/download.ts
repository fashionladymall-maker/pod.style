import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { z } from 'zod';

const db = admin.firestore();
const storage = admin.storage();

const querySchema = z.object({
  orderId: z.string().min(1),
  lineItemId: z.string().min(1),
});

const parseToken = (authorization?: string | string[]) => {
  if (!authorization) {
    return null;
  }
  const value = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!value) {
    return null;
  }
  const parts = value.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  return parts[1];
};

const parseGsUrl = (gsUrl: string) => {
  if (gsUrl.startsWith('gs://')) {
    const [, bucket, ...pathParts] = gsUrl.split('/');
    return { bucket, path: pathParts.join('/') };
  }
  const storageHost = 'https://storage.googleapis.com/';
  if (gsUrl.startsWith(storageHost)) {
    const [, bucket, ...pathParts] = gsUrl.replace(storageHost, '').split('/');
    return { bucket, path: pathParts.join('/') };
  }
  throw new Error('print asset URL must be a gs:// or storage.googleapis.com path');
};

export const downloadOrderAsset = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const rawOrderId = req.query.orderId;
  const rawLineItemId = req.query.lineItemId;
  const parseResult = querySchema.safeParse({
    orderId: typeof rawOrderId === 'string' ? rawOrderId : undefined,
    lineItemId: typeof rawLineItemId === 'string' ? rawLineItemId : undefined,
  });

  if (!parseResult.success) {
    res.status(400).json({ error: 'invalid_params', details: parseResult.error.flatten() });
    return;
  }

  const token = parseToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }

  let uid: string;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    uid = decoded.uid;
  } catch (error) {
    functions.logger.warn('orders.download.invalid_token', { error: (error as Error).message });
    res.status(401).json({ error: 'invalid_token' });
    return;
  }

  try {
    const { orderId, lineItemId } = parseResult.data;
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      res.status(404).json({ error: 'order_not_found' });
      return;
    }

    const orderData = orderSnapshot.data() as { user?: string } | undefined;
    if (!orderData) {
      res.status(404).json({ error: 'order_not_found' });
      return;
    }

    const ownerUid = orderData.user ?? null;
    if (!ownerUid || ownerUid !== uid) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const itemSnapshot = await orderRef.collection('items').doc(lineItemId).get();
    if (!itemSnapshot.exists) {
      res.status(404).json({ error: 'line_item_not_found' });
      return;
    }

    const itemData = itemSnapshot.data() as { printAsset?: { url?: string } } | undefined;
    const assetUrl = itemData?.printAsset?.url;
    if (!assetUrl) {
      res.status(409).json({ error: 'print_asset_unavailable' });
      return;
    }

    const { bucket, path } = parseGsUrl(assetUrl);
    const expiresAt = Date.now() + 60 * 60 * 1000;
    const [signedUrl] = await storage
      .bucket(bucket)
      .file(path)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: expiresAt,
      });

    functions.logger.info('orders.download.signed_url_issued', {
      orderId,
      lineItemId,
      bucket,
      path,
      uid,
    });

    res.status(200).json({
      url: signedUrl,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    functions.logger.error('orders.download.failed', {
      error: (error as Error).message,
    });
    res.status(500).json({ error: 'internal_error' });
  }
});

