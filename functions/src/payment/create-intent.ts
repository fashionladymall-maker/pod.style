import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { z } from 'zod';

const getStripeSecret = () => {
  const configSecret = functions.config().stripe?.secret as string | undefined;
  return configSecret ?? process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_API_KEY;
};

// Lazy initialization to avoid deployment errors when Stripe key is not set
let stripe: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!stripe) {
    const stripeSecret = getStripeSecret();
    if (!stripeSecret) {
      throw new Error('Stripe secret key is not configured. Set functions config stripe.secret or STRIPE_SECRET_KEY.');
    }
    stripe = new Stripe(stripeSecret, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
};

const payloadSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().min(1),
  items: z
    .array(
      z.object({
        sku: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().nonnegative(),
      }),
    )
    .nonempty(),
  shipping: z.object({
    method: z.enum(['standard', 'express']),
    cost: z.number().nonnegative(),
    name: z.string(),
    phone: z.string(),
    email: z.string().email().optional(),
    address: z.string(),
  }),
  userId: z.string().nullable().optional(),
});

export const createPaymentIntent = async (rawData: unknown) => {
  const data = payloadSchema.parse(rawData);
  const stripeClient = getStripe();
  const intent = await stripeClient.paymentIntents.create({
    amount: data.amount,
    currency: data.currency,
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId: data.userId ?? 'anonymous',
      shippingMethod: data.shipping.method,
      shippingCost: data.shipping.cost.toString(),
      items: JSON.stringify(data.items),
    },
    shipping: {
      name: data.shipping.name,
      phone: data.shipping.phone,
      address: {
        line1: data.shipping.address,
      },
    },
  });

  return {
    id: intent.id,
    clientSecret: intent.client_secret,
  };
};

export const createPaymentIntentHandler = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const result = await createPaymentIntent(req.body);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    functions.logger.error('stripe.create_intent.failed', message);
    res.status(400).json({ error: message });
  }
});
