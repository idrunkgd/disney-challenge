'use client';

import { useEffect, useState } from 'react';
import type { Family } from '@/lib/types';
import { adminFetch } from '@/lib/admin-client';

const AVATARS = ['🐭', '👽', '🚀', '🦁', '🏰', '🧚', '🦄', '🐉', '⭐', '🎈'];

type FamilyWithPw = Family & { password: string };

export default function FamiliesAdminPage() {
  const [families, setFamilies] = useState<FamilyWithPw[]>([]);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🏰');
  const [color, setColor] = useState('#6366f1');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [pwEdits, setPwEdits] = useState<Record<string, string>>({});

  async function load() {
    const res = await adminFetch('/api/admin/families');
    const json = await res.json();
    const list: FamilyWithPw[] = json.families ?? [];
    setFamilies(list);
    const edits: Record<string, string> = {};
    list.forEach((f) => (edits[f.id] = f.password));
    setPwEdits(edits);
  }
  useEffect(() => { load(); }, []);

  const [error, setError] = useState('');

  async function create() {
    if (!name || !password) return;
    setBusy(true);
    setError('');
    const res = await adminFetch('/api/admin/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar, color, password }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || `Erreur ${res.status}`);
      setBusy(false);
      return;
    }
    setName('');
    setPassword('');
    await load();
    setBusy(false);
  }

  async function savePassword(id: string) {
    await adminFetch('/api/admin/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password: pwEdits[id] ?? '' }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette famille et toutes ses données ?')) return;
    await adminFetch(`/api/admin/families?id=${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Familles</h1>
      <p className="mb-4 text-sm text-white/50">
        Chaque famille se connecte en la choisissant dans la liste + son mot de passe.
      </p>

      <div className="card mb-5 space-y-3 p-4">
        <div className="font-semibold">Nouvelle famille</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom (ex : Famille Buzz)"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-magic-400"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe à distribuer à la famille"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-magic-400"
        />
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              className={`grid h-10 w-10 place-items-center rounded-lg text-xl ${avatar === a ? 'bg-magic-600' : 'bg-white/10'}`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 rounded" />
          <button onClick={create} disabled={busy || !name || !password} className="btn-primary flex-1">Créer la famille</button>
        </div>
        {error && <p className="text-sm text-candy-400">⚠️ {error}</p>}
      </div>

      <div className="space-y-2">
        {families.map((f) => (
          <div key={f.id} className="card p-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{f.avatar}</span>
              <div className="flex-1 font-semibold">{f.name}</div>
              <span className="h-6 w-6 rounded-full" style={{ background: f.color }} />
              <button onClick={() => remove(f.id)} className="text-candy-400">🗑</button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-white/50">🔑 Mot de passe</span>
              <input
                value={pwEdits[f.id] ?? ''}
                onChange={(e) => setPwEdits((m) => ({ ...m, [f.id]: e.target.value }))}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-magic-400"
              />
              <button onClick={() => savePassword(f.id)} className="chip bg-magic-600 text-white">Enregistrer</button>
            </div>
          </div>
        ))}
        {families.length === 0 && <p className="text-white/50">Aucune famille. Créez-en une ci-dessus.</p>}
      </div>
    </div>
  );
}
