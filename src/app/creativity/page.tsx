'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { CreativeAttraction } from '@/lib/types';

export default function CreativityPage() {
  const { session } = useSession();
  const [form, setForm] = useState({ name: '', description: '', slogan: '' });
  const [existing, setExisting] = useState<CreativeAttraction | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    supabase
      .from('creative_attractions')
      .select('*')
      .eq('family_id', session.family_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExisting(data as CreativeAttraction);
          setForm({ name: data.name, description: data.description, slogan: data.slogan });
        }
      });
  }, [session]);

  async function save() {
    if (!session || !form.name) return;
    setBusy(true);
    const supabase = getSupabaseBrowser();
    if (existing) {
      await supabase.from('creative_attractions').update(form).eq('id', existing.id);
    } else {
      const { data } = await supabase
        .from('creative_attractions')
        .insert({ ...form, family_id: session.family_id })
        .select()
        .single();
      setExisting(data as CreativeAttraction);
    }
    setSaved(true);
    setBusy(false);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <AppShell back title="Défi Créativité">
      <div className="card p-6">
        <div className="text-4xl">💡</div>
        <h1 className="mt-2 text-xl font-bold">Inventez votre attraction</h1>
        <p className="mt-1 text-sm text-white/70">
          « Une attraction Disney sponsorisée par Dasolabs ». Le soir, tout le monde votera pour la meilleure !
        </p>

        <div className="mt-5 space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nom de l'attraction"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-magic-400"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (le concept, les sensations, le thème…)"
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-magic-400"
          />
          <input
            value={form.slogan}
            onChange={(e) => setForm({ ...form, slogan: e.target.value })}
            placeholder="Slogan accrocheur"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-magic-400"
          />
          <button onClick={save} disabled={busy || !form.name} className="btn-primary w-full">
            {busy ? 'Enregistrement…' : existing ? 'Mettre à jour' : 'Soumettre notre attraction'}
          </button>
          {saved && <p className="text-center text-sm text-emerald-400">Enregistré ✓</p>}
        </div>
      </div>
    </AppShell>
  );
}
