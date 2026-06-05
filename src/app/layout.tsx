import type { Metadata, Viewport } from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/hooks/useSession';
import { PwaRegister } from '@/components/PwaRegister';

// Typographies de la charte Dasolabs
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Dasolabs Disney Challenge',
  description: 'Le grand jeu Team Building Dasolabs à Disneyland Paris',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Disney Challenge',
  },
};

export const viewport: Viewport = {
  themeColor: '#3434e8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <SessionProvider>
          <main className="mx-auto min-h-[100dvh] w-full max-w-md">{children}</main>
        </SessionProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
