'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { useMemo } from 'react';

let stripePromise: Promise<Stripe | null> | null = null;

const getStripePromise = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured. Stripe will be disabled.');
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(publishableKey);
    }
  }
  return stripePromise;
};

interface StripeProviderProps {
  children: React.ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const stripe = getStripePromise();

  const appearance = useMemo(
    () => ({
      theme: 'night' as const,
      variables: {
        colorPrimary: '#22d3ee',
        colorBackground: '#0a0a0a',
        colorText: '#fafafa',
        colorDanger: '#f87171',
        spacingUnit: '6px',
        borderRadius: '12px',
      },
    }),
    [],
  );

  return (
    <Elements stripe={stripe} options={{ appearance }}>
      {children}
    </Elements>
  );
}
