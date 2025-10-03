import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { logger } from '@/utils/logger';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

const requestSchema = z.object({
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

export async function POST(request: Request) {
  if (!stripe) {
    logger.error('stripe.payment_intent.missing_secret');
    return NextResponse.json({ error: 'Stripe 未配置' }, { status: 500 });
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    const json = await request.json();
    payload = requestSchema.parse(json);
  } catch (error) {
    logger.warn('stripe.payment_intent.invalid_payload', { error });
    return NextResponse.json({ error: '请求参数不合法' }, { status: 400 });
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: payload.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: payload.userId ?? 'anonymous',
        shippingMethod: payload.shipping.method,
        shippingCost: payload.shipping.cost.toString(),
        items: JSON.stringify(payload.items),
      },
      shipping: {
        name: payload.shipping.name,
        phone: payload.shipping.phone,
        address: {
          line1: payload.shipping.address,
        },
      },
    });

    logger.info('stripe.payment_intent.created', {
      paymentIntentId: intent.id,
      amount: payload.amount,
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    logger.error('stripe.payment_intent.failed', {
      error: message,
    });
    return NextResponse.json({ error: '创建支付意图失败' }, { status: 500 });
  }
}
