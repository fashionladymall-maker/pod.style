import type { Metadata } from 'next';
import { CheckoutContainer } from '@/features/checkout/components/checkout-container';

export const metadata: Metadata = {
  title: '结算',
};

export default function CheckoutRoute() {
  return <CheckoutContainer />;
}
