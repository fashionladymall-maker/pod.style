import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toaster';

export default function FeedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
        {children}
        <Toaster />
      </div>
    </AuthProvider>
  );
}
