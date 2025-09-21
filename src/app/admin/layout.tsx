import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - AIPOD.STYLE',
  description: 'Admin dashboard for AIPOD.STYLE',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <section>{children}</section>;
}
