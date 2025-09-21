import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - POD.STYLE',
  description: 'Admin dashboard for POD.STYLE',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <section>{children}</section>;
}
