'use client';

import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { useLeaderboard } from '@/hooks/useLeaderboard';

const tiles = [
  { href: '/missions', icon: '🎯', label: 'Missions', desc: 'Défis photo & aventures' },
  { href: '/quiz', icon: '🧠', label: 'Quiz Disney', desc: '100 questions, 5 niveaux' },
  { href: '/mystery', icon: '🖼️', label: 'Image Mystère', desc: 'Devinez le film · 500 pts' },
  { href: '/leaderboard', icon: '🏆', label: 'Classement', desc: 'Le score en direct' },
];

export default function HomePage() {
  const { session } = useSession();
  const { scores } = useLeaderboard();

  const me = scores.find((s) => s.family_id === session?.family_id);
  const rank = me ? scores.findIndex((s) => s.family_id === me.family_id) + 1 : null;
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank ?? '—'}`;

  return (
    <AppShell title="Bienvenue">
      <section className="card animate-pop-in overflow-hidden p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-4xl">
            {session?.family_avatar}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-white/50">Votre famille</div>
            <div className="text-xl font-bold">{session?.family_name}</div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-gold-500/20 to-transparent p-4">
            <div className="text-xs text-white/60">Score actuel</div>
            <div className="text-3xl font-extrabold text-gold-400">{me?.total_points ?? 0}</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-magic-500/20 to-transparent p-4">
            <div className="text-xs text-white/60">Classement</div>
            <div className="text-3xl font-extrabold">{medal}</div>
          </div>
        </div>
      </section>

      <h2 className="mb-3 mt-7 px-1 text-sm font-semibold uppercase tracking-wide text-white/50">
        Activités
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="card p-4 transition hover:bg-white/10 active:scale-95">
            <div className="text-3xl">{t.icon}</div>
            <div className="mt-2 font-semibold">{t.label}</div>
            <div className="text-xs text-white/50">{t.desc}</div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
