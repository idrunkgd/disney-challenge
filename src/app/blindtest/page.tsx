'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { BlindTrack } from '@/lib/types';

export default function BlindTestPage() {
  const { session } = useSession();
  const [tracks, setTracks] = useState<BlindTrack[]>([]);
  const [answered, setAnswered] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    const [{ data: t }, { data: a }] = await Promise.all([
      supabase.from('blind_tracks').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('blind_answers').select('track_id, chosen_index').eq('family_id', session.family_id),
    ]);
    setTracks((t as BlindTrack[]) ?? []);
    const map: Record<string, number> = {};
    (a as { track_id: string; chosen_index: number }[] | null)?.forEach((x) => (map[x.track_id] = x.chosen_index));
    setAnswered(map);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function answer(track: BlindTrack, i: number) {
    if (!session || answered[track.id] !== undefined) return;
    setAnswered((m) => ({ ...m, [track.id]: i }));
    const supabase = getSupabaseBrowser();
    await supabase.rpc('answer_blind', {
      p_track_id: track.id,
      p_family_id: session.family_id,
      p_user_id: session.user_id,
      p_chosen_index: i,
    });
  }

  return (
    <AppShell back title="Blind Test">
      <h1 className="title-magic mb-1 text-2xl">🎵 Blind Test Disney</h1>
      <p className="mb-4 text-xs text-white/50">Écoutez l'extrait et devinez le morceau.</p>

      {loading && <p className="text-white/50">Chargement…</p>}
      {!loading && tracks.length === 0 && (
        <div className="card p-6 text-center text-white/60">
          Aucun extrait disponible pour l'instant. L'organisateur les ajoutera depuis l'admin. 🎧
        </div>
      )}

      <div className="space-y-4">
        {tracks.map((t, idx) => {
          const chosen = answered[t.id];
          const isAnswered = chosen !== undefined;
          return (
            <div key={t.id} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">Extrait #{idx + 1}</span>
                <span className="chip bg-gold-500/20 text-gold-400">+{t.points} pts</span>
              </div>
              <audio controls src={t.audio_url} className="w-full" />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {t.options.map((opt, i) => {
                  let cls = 'bg-white/5 hover:bg-white/10';
                  if (isAnswered) {
                    if (i === t.correct_index) cls = 'bg-emerald-500/30 border border-emerald-400';
                    else if (i === chosen) cls = 'bg-candy-500/30 border border-candy-400';
                    else cls = 'bg-white/5 opacity-60';
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => answer(t, i)}
                      disabled={isAnswered}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
