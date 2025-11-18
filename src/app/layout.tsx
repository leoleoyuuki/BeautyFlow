
import type { Metadata } from 'next';
import { Alegreya } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';

const alegreya = Alegreya({
  subsets: ['latin'],
  variable: '--font-alegreya',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BeautyFlow',
  description: 'Gerenciador para profissionais da área da beleza',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BeautyFlow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
       <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          alegreya.variable
        )}
      >
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
