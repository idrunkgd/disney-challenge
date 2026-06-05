'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-client';

interface Round { id: string; letter: string; categories: string[] }
interface Sub {
  id: string;
  answers: Record<string, string>;
  status: string;
  points: number;
  family?: { name: string; avatar: string };
}

export default function PetitBacAdminPage() {
  const [round, setRound] = useState<Round | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [letter, setLetter] = useState('');
  const [pts, setPts] = useState<Record<string, number>>({});

  async function load() {
    const res = await adminFetch('/api/admin/petitbac');
    const json = await res.json();
    setRound(json.round ?? null);
    setSubs(json.submissions ?? []);
    const p: Record<string, number> = {};
    (json.submissions ?? []).forEach((s: Sub) => {
      // suggestion : 5 pts par catégorie remplie
      p[s.id] = s.points || Object.values(s.answers || {}).filter((v) => (v as string)?.trim()).length * 5;
    });
    setPts(p);
  }
  useEffect(() => { load(); }, []);

  async function launch() {
    if (!letter) return;
    await adminFetch('/api/admin/petitbac', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'launch', letter }),
    });
    setLetter('');
    await load();
  }

  async function validate(id: string, approve: boolean) {
    await adminFetch('/api/admin/petitbac', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'validate', submission_id: id, approve, points: pts[id] ?? 0 }),
    });
    await load();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Petit Bac</h1>
      <p className="mb-4 text-sm text-white/50">Lance une lettre, puis valide les grilles (5 pts/bonne réponse conseillé).</p>

      <div className="card mb-5 flex items-end gap-3 p-4">
        <div>
          <label className="text-xs text-white/60">Nouvelle lettre</label>
          <input
            value={letter}
            onChange={(e) => setLetter(e.target.value.toUpperCase().slice(0, 1))}
            placeholder="M"
            className="mt-1 w-20 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-xl font-bold uppercase"
          />
        </div>
        <button onClick={launch} disabled={!letter} className="btn-primary flex-1">🎲 Lancer la manche</button>
      </div>

      {round && (
        <div className="mb-3 text-sm text-white/60">
          Manche en cours — lettre <span className="font-bold text-gold-400">{round.letter}</span>
        </div>
      )}

      <div className="space-y-3">
        {subs.length === 0 && <p className="text-white/50">Aucune grille reçue.</p>}
        {subs.map((s) => (
          <div key={s.id} className="card p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{s.family?.avatar} {s.family?.name}</span>
              <span className={`chip ${s.status === 'approved' ? 'bg-emerald-500/30 text-emerald-300' : s.status === 'rejected' ? 'bg-candy-500/30 text-candy-300' : 'bg-gold-500/20 text-gold-400'}`}>
                {s.status === 'approved' ? `Validé +${s.points}` : s.status === 'rejected' ? 'Refusé' : 'En attente'}
              </span>
            </div>
            <div className="mt-2 space-y-0.5 text-sm">
              {Object.entries(s.answers || {}).map(([cat, val]) => (
                <div key={cat} className="flex justify-between gap-2">
                  <span className="text-white/50">{cat}</span>
                  <span className="font-medium">{val || '—'}</span>
                </div>
              ))}
            </div>
            {s.status !== 'approved' && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  value={pts[s.id] ?? 0}
                  onChange={(e) => setPts({ ...pts, [s.id]: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm"
                />
                <button onClick={() => validate(s.id, true)} className="btn-primary flex-1">Valider</button>
                <button onClick={() => validate(s.id, false)} className="btn-ghost">Refuser</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
