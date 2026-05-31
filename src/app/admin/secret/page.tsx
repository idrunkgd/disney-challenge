'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Family, SecretMission } from '@/lib/types';

export default function SecretAdminPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [missions, setMissions] = useState<Record<string, SecretMission>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = getSupabaseBrowser();
    const [{ data: fa }, { data: sm }] = await Promise.all([
      supabase.from('families').select('*').order('created_at'),
      supabase.from('secret_missions').select('*'),
    ]);
    setFamilies((fa as Family[]) ?? []);
    const map: Record<string, SecretMission> = {};
    (sm as SecretMission[] | null)?.forEach((m) => (map[m.family_id] = m));
    setMissions(map);
  }
  useEffect(() => { load(); }, []);

  async function assignAll() {
    setBusy(true);
    await fetch('/api/admin/secret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    await load();
    setBusy(false);
  }

  async function assignOne(familyId: string) {
    await fetch('/api/admin/secret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ family_id: familyId, force: true }),
    });
    await load();
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Missions secrètes</h1>
      <button onClick={assignAll} disabled={busy} className="btn-gold mb-4">
        🎲 Attribuer aux familles sans mission
      </button>

      <div className="space-y-2">
        {families.map((f) => {
          const m = missions[f.id];
          return (
            <div key={f.id} className="card p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{f.avatar} {f.name}</span>
                <button onClick={() => assignOne(f.id)} className="chip">🎲 Re-tirer</button>
              </div>
              {m ? (
                <div className="mt-1 text-sm text-white/70">
                  {m.title} — <span className={m.status === 'approved' ? 'text-emerald-400' : 'text-gold-400'}>{m.status}</span>
                </div>
              ) : (
                <div className="mt-1 text-sm text-white/40">Aucune mission assignée</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
