'use client';

import Link from 'next/link';
import { useState } from 'react';
import { adminFetch } from '@/lib/admin-client';

const cards = [
  { href: '/admin/progress', icon: '📊', label: 'Avancement', desc: 'Suivi en direct de chaque famille' },
  { href: '/admin/validation', icon: '✅', label: 'Validation photos', desc: 'Accepter / refuser les preuves' },
  { href: '/admin/families', icon: '👨‍👩‍👧', label: 'Familles', desc: 'Créer les équipes et leurs mots de passe' },
  { href: '/admin/missions', icon: '🎯', label: 'Missions', desc: 'Catalogue des défis' },
  { href: '/admin/quiz', icon: '🧠', label: 'Quiz', desc: 'Banque de questions' },
  { href: '/admin/mystery', icon: '🖼️', label: 'Image Mystère', desc: 'Choisir l\'image et valider' },
  { href: '/admin/tupreferes', icon: '🤔', label: 'Tu préfères', desc: 'Voir les réponses' },
];

function ResetZone() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function reset() {
    if (!confirm('Remettre TOUS les scores et l\'avancement à zéro et supprimer TOUTES les photos ?')) return;
    if (!confirm('Action définitive. Confirmer la réinitialisation ?')) return;
    setBusy(true);
    setMsg('');
    const res = await adminFetch('/api/admin/reset', { method: 'POST' });
    const json = await res.json();
    setBusy(false);
    setMsg(res.ok ? `Réinitialisé ✓ (${json.photosDeleted} photo(s) supprimée(s))` : `Erreur : ${json.error}`);
  }

  return (
    <div className="mt-8 rounded-2xl border border-candy-500/40 bg-candy-500/10 p-4">
      <div className="font-semibold text-candy-300">⚠️ Zone de test</div>
      <p className="mt-1 text-sm text-white/60">
        Remet les scores et l'avancement à 0 et supprime toutes les photos. Les familles, missions et
        questions de quiz sont conservées.
      </p>
      <button onClick={reset} disabled={busy} className="btn mt-3 bg-candy-600 text-white hover:bg-candy-500">
        {busy ? 'Réinitialisation…' : '🗑 Tout réinitialiser'}
      </button>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </div>
  );
}

export default function AdminHome() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card p-4 transition hover:bg-white/10">
            <div className="text-3xl">{c.icon}</div>
            <div className="mt-2 font-semibold">{c.label}</div>
            <div className="text-xs text-white/50">{c.desc}</div>
          </Link>
        ))}
      </div>
      <ResetZone />
    </div>
  );
}
