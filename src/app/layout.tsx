import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const APP_NAME = "POD.STYLE";
const APP_DEFAULT_TITLE = "POD.STYLE - 放飞思想，随心定制";
const APP_TITLE_TEMPLATE = "%s | POD.STYLE";
const APP_DESCRIPTION = "使用AI释放您的创造力！在POD.STYLE上，您可以利用人工智能生成独特的图案，并将其定制在T恤、连帽衫、马克杯等各种商品上。Free Your Mind, Customize Your Way.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  keywords: ["AI设计", "个性化T恤", "定制商品", "POD", "AIGC", "Print on Demand", "创意设计"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1554224155-83e7b01b6a34?q=80&w=1740&auto=format&fit=crop', // Replace with your actual OG image URL
        width: 1740,
        height: 1160,
        alt: 'AI-powered design studio for custom merchandise.',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: ['https://images.unsplash.com/photo-1554224155-83e7b01b6a34?q=80&w=1740&auto=format&fit=crop'], // Replace with your actual Twitter image URL
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex items-center justify-center bg-zinc-900 font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
