'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Accueil', icon: '🏠' },
  { href: '/missions', label: 'Missions', icon: '🎯' },
  { href: '/quiz', label: 'Quiz', icon: '🧠' },
  { href: '/leaderboard', label: 'Classement', icon: '🏆' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-white/10 bg-magic-950/80 backdrop-blur-lg">
      <ul className="flex items-stretch justify-between px-2">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
                  active ? 'text-gold-400' : 'text-white/60 hover:text-white'
                }`}
              >
                <span className={`text-xl ${active ? 'scale-110' : ''} transition`}>{it.icon}</span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
