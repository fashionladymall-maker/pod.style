import type { Metadata } from 'next';
import CartPage from '@/features/cart/components/cart-page';

export const metadata: Metadata = {
  title: '购物车',
};

export default function CartRoute() {
  return <CartPage />;
}
