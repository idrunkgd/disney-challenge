'use client';

import Link from 'next/link';

const cards = [
  { href: '/admin/progress', icon: '📊', label: 'Avancement', desc: 'Suivi en direct de chaque famille' },
  { href: '/admin/validation', icon: '✅', label: 'Validation photos', desc: 'Accepter / refuser les preuves' },
  { href: '/admin/families', icon: '👨‍👩‍👧', label: 'Familles', desc: 'Créer et gérer les équipes' },
  { href: '/admin/qrcodes', icon: '🔳', label: 'QR Codes', desc: 'Générer les codes de connexion' },
  { href: '/admin/missions', icon: '🎯', label: 'Missions', desc: 'Catalogue des défis' },
  { href: '/admin/quiz', icon: '🧠', label: 'Quiz', desc: 'Banque de questions' },
];

export default function AdminHome() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <Link key={c.href} href={c.href} className="card p-4 transition hover:bg-white/10">
          <div className="text-3xl">{c.icon}</div>
          <div className="mt-2 font-semibold">{c.label}</div>
          <div className="text-xs text-white/50">{c.desc}</div>
        </Link>
      ))}
    </div>
  );
}
