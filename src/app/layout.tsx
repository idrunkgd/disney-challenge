import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/hooks/useSession';
import { PwaRegister } from '@/components/PwaRegister';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
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
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={poppins.variable}>
      <body>
        <SessionProvider>
          <main className="mx-auto min-h-[100dvh] w-full max-w-md">{children}</main>
        </SessionProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
