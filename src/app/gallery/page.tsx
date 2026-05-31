'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Family, Mission, Photo } from '@/lib/types';

export default function GalleryPage() {
  const [photos, setPhotos] = useState<(Photo & { family?: Family; mission?: Mission })[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [familyFilter, setFamilyFilter] = useState('');
  const [missionFilter, setMissionFilter] = useState('');
  const [selected, setSelected] = useState<Photo | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    (async () => {
      const [{ data: ph }, { data: fa }, { data: ms }] = await Promise.all([
        supabase
          .from('photos')
          .select('*, family:families(*), mission:missions(*)')
          .order('created_at', { ascending: false }),
        supabase.from('families').select('*'),
        supabase.from('missions').select('*').order('sort_order'),
      ]);
      setPhotos((ph as any) ?? []);
      setFamilies((fa as Family[]) ?? []);
      setMissions((ms as Mission[]) ?? []);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      photos.filter(
        (p) =>
          (!familyFilter || p.family_id === familyFilter) &&
          (!missionFilter || p.mission_id === missionFilter)
      ),
    [photos, familyFilter, missionFilter]
  );

  return (
    <AppShell title="Galerie">
      <h1 className="title-magic mb-3 text-2xl">Mur de souvenirs</h1>

      <div className="mb-4 flex gap-2">
        <select
          value={familyFilter}
          onChange={(e) => setFamilyFilter(e.target.value)}
          className="flex-1 rounded-xl border border-white/10 bg-magic-900 px-3 py-2 text-sm"
        >
          <option value="">Toutes les familles</option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>{f.avatar} {f.name}</option>
          ))}
        </select>
        <select
          value={missionFilter}
          onChange={(e) => setMissionFilter(e.target.value)}
          className="flex-1 rounded-xl border border-white/10 bg-magic-900 px-3 py-2 text-sm"
        >
          <option value="">Toutes les missions</option>
          {missions.map((m) => (
            <option key={m.id} value={m.id}>{m.icon} {m.title}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-white/50">Aucune photo pour ce filtre.</p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} className="overflow-hidden rounded-lg">
              <img src={p.public_url} alt="" className="aspect-square w-full object-cover transition hover:scale-105" />
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setSelected(null)}
        >
          <img src={selected.public_url} alt="" className="max-h-[70vh] rounded-xl" />
          <a
            href={selected.public_url}
            download
            onClick={(e) => e.stopPropagation()}
            className="btn-gold mt-4"
          >
            ⬇️ Télécharger
          </a>
        </div>
      )}
    </AppShell>
  );
}
