'use client';

import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js';
import { StripeProvider } from '@/features/payment/stripe-provider';
import { PaymentForm } from '@/features/payment/payment-form';
import CheckoutPage from './checkout-page';
import { useCart } from '@/features/cart/hooks/use-cart';
import { calculateItemSubtotal, calculateShippingTotals } from '../utils';
import type { CheckoutFormValues } from '../schema/checkout-schema';
import { AuthContext } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

const cents = (value: number) => Math.round(value * 100);

const CheckoutWorkflow = () => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { toast } = useToast();
  const { items, totals, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  const currency = totals?.currency?.toLowerCase() ?? 'usd';

  const handleCardChange = (event: StripeCardElementChangeEvent) => {
    setCardError(event.error?.message ?? null);
  };

  const handleCheckout = async (values: CheckoutFormValues) => {
    if (!stripe || !elements) {
      setPaymentError('支付模块尚未初始化，请稍后再试。');
      return;
    }
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError('支付表单尚未加载完成。');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const itemSubtotal = calculateItemSubtotal(items);
      const shippingCost = calculateShippingTotals(items, values.method);
      const amountMajor = itemSubtotal + shippingCost;
      const amountCents = cents(amountMajor);

      const intentResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountCents,
          currency,
          items: items.map((item) => ({
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
          })),
          shipping: {
            method: values.method,
            cost: shippingCost,
            name: values.name,
            phone: values.phone,
            email: values.email,
            address: values.address,
          },
          userId: user?.uid ?? null,
        }),
      });

      if (!intentResponse.ok) {
        const message = await intentResponse.text();
        throw new Error(message || '创建支付意图失败');
      }

      const { clientSecret, paymentIntentId } = (await intentResponse.json()) as {
        clientSecret: string;
        paymentIntentId: string;
      };

      const confirmation = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: values.name,
            email: values.email ?? undefined,
            phone: values.phone,
          },
        },
        receipt_email: values.email ?? undefined,
      });

      if (confirmation.error || !confirmation.paymentIntent) {
        throw new Error(confirmation.error?.message ?? '支付未完成');
      }

      setCardError(null);

      const orderResponse = await fetch('/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          amount: amountMajor,
          currency,
          shipping: {
            method: values.method,
            cost: shippingCost,
            name: values.name,
            phone: values.phone,
            email: values.email,
            address: values.address,
          },
          items: items.map((item) => ({
            sku: item.sku,
            name: item.name,
            variants: item.variants,
            quantity: item.quantity,
            price: item.price,
          })),
          userId: user?.uid ?? null,
        }),
      });

      if (!orderResponse.ok) {
        const message = await orderResponse.text();
        throw new Error(message || '创建订单失败');
      }

      const { orderId } = (await orderResponse.json()) as { orderId: string };
      await clearCart();
      toast({
        title: '支付成功',
        description: '我们已收到您的订单，感谢选购。',
      });
      router.push(`/orders/${orderId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '结算失败，请稍后再试。';
      setPaymentError(message);
      console.error('Checkout failed', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CheckoutPage
      onSubmit={handleCheckout}
      isProcessing={isProcessing}
      paymentSection={<PaymentForm onChange={handleCardChange} disabled={isProcessing} error={cardError} />}
      error={paymentError}
    />
  );
};

export const CheckoutContainer = () => (
  <StripeProvider>
    <CheckoutWorkflow />
  </StripeProvider>
);

export default CheckoutContainer;
