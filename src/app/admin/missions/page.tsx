'use client';

import { useEffect, useState } from 'react';
import type { Mission, MissionCategory } from '@/lib/types';
import { adminFetch } from '@/lib/admin-client';

const empty = {
  title: '', description: '', category: 'photo' as MissionCategory,
  points: 10, requires_photo: true, icon: '📸', sort_order: 0, is_active: true,
};

export default function MissionsAdminPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [form, setForm] = useState<any>(empty);

  async function load() {
    const res = await adminFetch('/api/admin/missions');
    setMissions((await res.json()).missions ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title) return;
    await adminFetch('/api/admin/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm(empty);
    await load();
  }
  async function remove(id: string) {
    if (!confirm('Supprimer cette mission ?')) return;
    await adminFetch(`/api/admin/missions?id=${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Missions</h1>

      <div className="card mb-5 grid gap-3 p-4 sm:grid-cols-2">
        <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Icône (emoji)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl border border-white/10 bg-magic-900 px-3 py-2">
          <option value="photo">Photo</option>
          <option value="attraction">Attraction</option>
          <option value="exploration">Exploration</option>
        </select>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:col-span-2" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:col-span-2" />
        <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} placeholder="Points" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} placeholder="Ordre" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        <button onClick={save} disabled={!form.title} className="btn-primary sm:col-span-2">
          {form.id ? 'Mettre à jour' : 'Ajouter la mission'}
        </button>
        {form.id && <button onClick={() => setForm(empty)} className="btn-ghost sm:col-span-2">Annuler l'édition</button>}
      </div>

      <div className="space-y-2">
        {missions.map((m) => (
          <div key={m.id} className="card flex items-center gap-3 p-3">
            <span className="text-2xl">{m.icon}</span>
            <div className="flex-1">
              <div className="font-semibold">{m.title}</div>
              <div className="text-xs text-white/50">{m.category} · +{m.points} pts</div>
            </div>
            <button onClick={() => setForm(m)} className="chip">✏️</button>
            <button onClick={() => remove(m.id)} className="text-candy-400">🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}
