'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

interface FamilyOption {
  id: string;
  name: string;
  avatar: string;
}

export default function LoginPage() {
  const { session, login } = useSession();
  const router = useRouter();
  const [families, setFamilies] = useState<FamilyOption[]>([]);
  const [familyId, setFamilyId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) router.replace('/');
  }, [session, router]);

  // Charge la liste des familles pour la droplist (le mot de passe n'est jamais exposé)
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase
      .from('families')
      .select('id, name, avatar')
      .order('name')
      .then(({ data }) => setFamilies((data as FamilyOption[]) ?? []));
  }, []);

  async function doLogin() {
    if (!familyId || !password) {
      setError('Choisissez votre famille et saisissez le mot de passe.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(familyId, password.trim(), name.trim() || 'Participant');
      router.replace('/');
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes('INVALID_PASSWORD')) {
        setError('Mot de passe incorrect pour cette famille.');
      } else if (msg.includes('INVALID_FAMILY')) {
        setError('Famille introuvable.');
      } else if (msg.includes('Load failed') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('Connexion à Supabase impossible (réseau / projet en pause).');
      } else {
        setError(`Erreur : ${msg}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10">
      <Logo className="h-16 w-16 animate-float text-white" />
      <span className="mt-3 font-display text-2xl font-bold lowercase tracking-tight text-white">dasolabs</span>
      <h1 className="title-magic mt-2 text-center text-3xl">DISNEY CHALLENGE</h1>
      <p className="mt-2 text-center text-sm text-white/60">
        Choisissez votre famille et entrez le mot de passe fourni par l'organisateur.
      </p>

      <div className="card mt-8 w-full max-w-sm space-y-4 p-6">
        <label className="block text-sm font-medium">
          Votre famille
          <select
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-magic-900 px-4 py-3 outline-none focus:border-magic-400"
          >
            <option value="">— Sélectionner —</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>{f.avatar} {f.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doLogin()}
            placeholder="Mot de passe de la famille"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-magic-400"
          />
        </label>

        <label className="block text-sm font-medium">
          Votre prénom (optionnel)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Gérald"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-magic-400"
          />
        </label>

        <button onClick={doLogin} disabled={busy || !familyId || !password} className="btn-primary w-full">
          {busy ? 'Connexion…' : 'Rejoindre l\'aventure'}
        </button>

        {error && <p className="text-sm text-candy-400">{error}</p>}
      </div>
    </div>
  );
}
