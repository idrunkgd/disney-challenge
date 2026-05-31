'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Award, Family } from '@/lib/types';

export default function AwardsAdminPage() {
  const [awards, setAwards] = useState<(Award & { family?: Family })[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);

  async function load() {
    const res = await fetch('/api/admin/awards');
    setAwards((await res.json()).awards ?? []);
    const supabase = getSupabaseBrowser();
    const { data } = await supabase.from('families').select('*');
    setFamilies((data as Family[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function update(id: string, patch: Record<string, unknown>) {
    await fetch('/api/admin/awards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    await load();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Disney Awards</h1>
      <p className="mb-4 text-sm text-white/50">
        Désignez le gagnant de chaque catégorie, puis « Révéler » l'affiche en direct sur l'écran soirée.
      </p>

      <div className="space-y-3">
        {awards.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="font-semibold">{a.category}</div>
            {a.description && <div className="text-xs text-white/50">{a.description}</div>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={a.family_id ?? ''}
                onChange={(e) => update(a.id, { family_id: e.target.value || null })}
                className="rounded-xl border border-white/10 bg-magic-900 px-3 py-2 text-sm"
              >
                <option value="">— Choisir une famille —</option>
                {families.map((f) => (
                  <option key={f.id} value={f.id}>{f.avatar} {f.name}</option>
                ))}
              </select>
              <input
                defaultValue={a.winner_name ?? ''}
                onBlur={(e) => update(a.id, { winner_name: e.target.value || null })}
                placeholder="ou nom d'une personne"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <button
                onClick={() => update(a.id, { announced: !a.announced })}
                className={`chip ${a.announced ? 'bg-emerald-500/30 text-emerald-300' : 'bg-gold-500/20 text-gold-400'}`}
              >
                {a.announced ? '✓ Révélé' : '🎬 Révéler'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
