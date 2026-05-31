'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { CreativeAttraction, Family, Photo, VoteCategory } from '@/lib/types';

const categories: { key: VoteCategory; label: string; icon: string }[] = [
  { key: 'funniest_photo', label: 'Photo la plus drôle', icon: '🤣' },
  { key: 'best_attraction', label: 'Meilleure attraction inventée', icon: '🎢' },
  { key: 'team_spirit', label: "Meilleur esprit d'équipe", icon: '💛' },
];

export default function VotePage() {
  const { session } = useSession();
  const [cat, setCat] = useState<VoteCategory>('funniest_photo');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [attractions, setAttractions] = useState<(CreativeAttraction & { family?: Family })[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, boolean>>({});

  async function load() {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    const [{ data: ph }, { data: at }, { data: fa }, { data: mv }] = await Promise.all([
      supabase.from('photos').select('*').order('created_at', { ascending: false }).limit(60),
      supabase.from('creative_attractions').select('*, family:families(*)'),
      supabase.from('families').select('*'),
      supabase.from('votes').select('category').eq('voter_user_id', session.user_id),
    ]);
    setPhotos((ph as Photo[]) ?? []);
    setAttractions((at as any) ?? []);
    setFamilies((fa as Family[]) ?? []);
    const voted: Record<string, boolean> = {};
    (mv as { category: string }[] | null)?.forEach((v) => (voted[v.category] = true));
    setMyVotes(voted);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function vote(payload: { target_family_id?: string; target_photo_id?: string }) {
    if (!session || myVotes[cat]) return;
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from('votes').insert({
      category: cat,
      voter_user_id: session.user_id,
      ...payload,
    });
    if (!error) setMyVotes((m) => ({ ...m, [cat]: true }));
  }

  const alreadyVoted = myVotes[cat];

  return (
    <AppShell back title="Votes">
      <h1 className="title-magic mb-1 text-2xl">Votez !</h1>
      <p className="mb-4 text-xs text-white/50">Votes 100% anonymes · un choix par catégorie.</p>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`chip shrink-0 ${cat === c.key ? 'bg-magic-600 text-white' : ''}`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {alreadyVoted && (
        <div className="card mb-4 p-3 text-center text-sm text-emerald-400">
          Merci, votre vote pour cette catégorie est enregistré ✓
        </div>
      )}

      {cat === 'funniest_photo' && (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              disabled={alreadyVoted}
              onClick={() => vote({ target_photo_id: p.id })}
              className="card overflow-hidden p-0 transition active:scale-95 disabled:opacity-60"
            >
              <img src={p.public_url} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {cat === 'best_attraction' && (
        <div className="space-y-2">
          {attractions.map((a) => (
            <button
              key={a.id}
              disabled={alreadyVoted}
              onClick={() => vote({ target_family_id: a.family_id })}
              className="card w-full p-4 text-left transition active:scale-95 disabled:opacity-60"
            >
              <div className="font-bold">{a.name}</div>
              <div className="text-sm text-white/70">{a.description}</div>
              <div className="mt-1 text-xs italic text-gold-400">« {a.slogan} »</div>
              <div className="mt-1 text-xs text-white/40">par {a.family?.name}</div>
            </button>
          ))}
          {attractions.length === 0 && <p className="text-white/50">Aucune attraction soumise pour l'instant.</p>}
        </div>
      )}

      {cat === 'team_spirit' && (
        <div className="grid grid-cols-2 gap-2">
          {families.map((f) => (
            <button
              key={f.id}
              disabled={alreadyVoted}
              onClick={() => vote({ target_family_id: f.id })}
              className="card flex flex-col items-center p-5 transition active:scale-95 disabled:opacity-60"
            >
              <span className="text-4xl">{f.avatar}</span>
              <span className="mt-2 text-sm font-semibold">{f.name}</span>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}
