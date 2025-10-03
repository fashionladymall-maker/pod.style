'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/features/cart/context/cart-context';

interface RoutesProvidersProps {
  children: ReactNode;
}

export function RoutesProviders({ children }: RoutesProvidersProps) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
