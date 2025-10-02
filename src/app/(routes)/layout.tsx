import type { ReactNode } from 'react';
import { RoutesProviders } from './providers';

interface RoutesLayoutProps {
  children: ReactNode;
}

export default function RoutesLayout({ children }: RoutesLayoutProps) {
  return (
    <RoutesProviders>
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        {children}
      </main>
    </RoutesProviders>
  );
}
