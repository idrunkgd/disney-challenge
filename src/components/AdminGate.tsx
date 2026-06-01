'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/admin/progress', label: '📊 Avancement' },
  { href: '/admin/validation', label: '✅ Validation' },
  { href: '/admin/families', label: '👨‍👩‍👧 Familles' },
  { href: '/admin/missions', label: '🎯 Missions' },
  { href: '/admin/quiz', label: '🧠 Quiz' },
  { href: '/admin/mystery', label: '🖼️ Image Mystère' },
  { href: '/admin/agent', label: '🕵️ Agent Secret' },
];

// Vérifie l'accès admin via un endpoint protégé. Affiche le login sinon.
export function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const pathname = usePathname();

  async function check() {
    const res = await fetch('/api/admin/families');
    setAuthed(res.ok);
  }
  useEffect(() => {
    check();
  }, []);

  async function login() {
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setAuthed(true);
    else setError(json.error || 'Mot de passe incorrect');
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  if (authed === null) return <div className="p-10 text-center text-white/50">Chargement…</div>;

  if (!authed) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-6">
        <div className="card w-full max-w-sm space-y-4 p-6">
          <h1 className="title-magic text-2xl">Admin · Disney Challenge</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="Mot de passe administrateur"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-magic-400"
          />
          <button onClick={login} className="btn-primary w-full">Se connecter</button>
          {error && <p className="text-sm text-candy-400">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-3xl px-4 py-4">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/admin" className="title-magic text-xl">Admin</Link>
        <button onClick={logout} className="chip">Déconnexion</button>
      </header>
      <nav className="mb-5 flex flex-wrap gap-2">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`chip ${pathname === n.href ? 'bg-magic-600 text-white' : ''}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
