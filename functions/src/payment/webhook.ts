import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import Stripe from 'stripe';

const getStripeSecret = () => {
  const configSecret = functions.config().stripe?.secret as string | undefined;
  return configSecret ?? process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_API_KEY;
};

// Lazy initialization to avoid deployment errors
let stripe: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!stripe) {
    const stripeSecret = getStripeSecret();
    if (!stripeSecret) {
      throw new Error('Stripe secret key is not configured.');
    }
    stripe = new Stripe(stripeSecret, {
      apiVersion: '2025-09-30.clover',
    });
  }
  return stripe;
};

const getWebhookSecret = () => {
  return functions.config().stripe?.webhook as string | undefined ?? process.env.STRIPE_WEBHOOK_SECRET;
};

const updateOrderStatus = async (paymentIntentId: string, status: 'paid' | 'failed', paidAt?: Date) => {
  const db = admin.firestore();
  const snapshot = await db
    .collection('orders')
    .where('payment.stripePaymentIntentId', '==', paymentIntentId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return;
  }

  const doc = snapshot.docs[0];
  const updates: Record<string, unknown> = {
    status: status === 'paid' ? 'paid' : 'cancelled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (paidAt) {
    updates['payment.paidAt'] = admin.firestore.Timestamp.fromDate(paidAt);
  }

  await doc.ref.update(updates);
};

export const stripeWebhookHandler = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type,Stripe-Signature');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = getWebhookSecret();
    if (webhookSecret) {
      const signature = req.headers['stripe-signature'];
      if (!signature) {
        res.status(400).send('Missing Stripe signature');
        return;
      }
      const stripeClient = getStripe();
      event = stripeClient.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    } else {
      event = req.body as Stripe.Event;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid_signature';
    functions.logger.error('stripe.webhook.signature_error', message);
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        functions.logger.info('stripe.webhook.payment_succeeded', { id: intent.id });
        await updateOrderStatus(intent.id, 'paid', intent.created ? new Date(intent.created * 1000) : new Date());
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        functions.logger.warn('stripe.webhook.payment_failed', { id: intent.id, error: intent.last_payment_error?.message });
        await updateOrderStatus(intent.id, 'failed');
        break;
      }
      default:
        functions.logger.debug('stripe.webhook.unhandled_event', { type: event.type });
    }

    res.status(200).send({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'webhook_processing_failed';
    functions.logger.error('stripe.webhook.processing_error', message);
    res.status(500).send({ error: message });
  }
});
