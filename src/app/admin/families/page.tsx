'use client';

import { useEffect, useState } from 'react';
import type { Family } from '@/lib/types';

const AVATARS = ['🐭', '👽', '🚀', '🦁', '🏰', '🧚', '🦄', '🐉', '⭐', '🎈'];

export default function FamiliesAdminPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🏰');
  const [color, setColor] = useState('#6366f1');
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch('/api/admin/families');
    const json = await res.json();
    setFamilies(json.families ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name) return;
    setBusy(true);
    await fetch('/api/admin/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar, color }),
    });
    setName('');
    await load();
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette famille et toutes ses données ?')) return;
    await fetch(`/api/admin/families?id=${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Familles</h1>

      <div className="card mb-5 space-y-3 p-4">
        <div className="font-semibold">Nouvelle famille</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom (ex : Famille Buzz)"
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
          <button onClick={create} disabled={busy || !name} className="btn-primary flex-1">Créer la famille</button>
        </div>
      </div>

      <div className="space-y-2">
        {families.map((f) => (
          <div key={f.id} className="card flex items-center gap-3 p-3">
            <span className="text-2xl">{f.avatar}</span>
            <div className="flex-1">
              <div className="font-semibold">{f.name}</div>
              <div className="text-xs text-white/40">Code : {f.access_token}</div>
            </div>
            <span className="h-6 w-6 rounded-full" style={{ background: f.color }} />
            <button onClick={() => remove(f.id)} className="text-candy-400">🗑</button>
          </div>
        ))}
        {families.length === 0 && <p className="text-white/50">Aucune famille. Créez-en une ci-dessus.</p>}
      </div>
    </div>
  );
}
