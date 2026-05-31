'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { BottomNav } from './BottomNav';

// Enveloppe les pages participant : redirige vers /login si pas de session,
// affiche l'en-tête famille + la navigation basse.
export function AppShell({
  children,
  title,
  back,
}: {
  children: React.ReactNode;
  title?: string;
  back?: boolean;
}) {
  const { session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace('/login');
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-white/60">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-20">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-magic-950/70 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          {back && (
            <button onClick={() => router.back()} className="text-white/70 hover:text-white" aria-label="Retour">
              ←
            </button>
          )}
          <span className="text-lg">{session.family_avatar}</span>
          <div className="leading-tight">
            <div className="text-xs text-white/50">{title ?? 'Dasolabs Challenge'}</div>
            <div className="text-sm font-semibold">{session.family_name}</div>
          </div>
        </div>
        <Link href="/admin" className="chip" aria-label="Espace admin">
          ⚙️ Admin
        </Link>
      </header>
      <div className="px-4 py-4">{children}</div>
      <BottomNav />
    </div>
  );
}
