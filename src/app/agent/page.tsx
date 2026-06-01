'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { AgentMissionAssignment } from '@/lib/types';

const diffLabel: Record<string, string> = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };

export default function AgentPage() {
  const { session } = useSession();
  const [mission, setMission] = useState<AgentMissionAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    // Attribue (une seule fois) une mission au joueur et la renvoie
    const { data } = await supabase.rpc('assign_agent_mission', {
      p_user_id: session.user_id,
      p_family_id: session.family_id,
    });
    const row = Array.isArray(data) ? data[0] : data;
    setMission((row as AgentMissionAssignment) ?? null);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function setDone(done: boolean) {
    if (!session || !mission) return;
    setBusy(true);
    setMission({ ...mission, done });
    const supabase = getSupabaseBrowser();
    await supabase.rpc('complete_agent', { p_user_id: session.user_id, p_done: done });
    setBusy(false);
  }

  return (
    <AppShell back title="Agent Secret">
      <div className="mb-3 text-center">
        <div className="animate-float text-5xl">🕵️</div>
        <h1 className="title-magic mt-1 text-2xl">Agent Secret</h1>
        <p className="text-xs text-white/50">Ta mission, rien qu'à toi. Personne ne doit deviner !</p>
      </div>

      {loading ? (
        <p className="text-white/50">Attribution de ta mission…</p>
      ) : !mission ? (
        <div className="card p-8 text-center text-white/60">Aucune mission disponible pour le moment.</div>
      ) : (
        <div className="card relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-6 -top-6 text-8xl opacity-10">🤫</div>
          <span className="chip bg-candy-500/20 text-candy-300">
            {diffLabel[mission.difficulty] ?? mission.difficulty} · +{mission.points} pts
          </span>
          <h2 className="mt-3 text-xl font-bold">{mission.title}</h2>
          <p className="mt-2 text-white/80">{mission.description}</p>

          <div className="mt-6">
            {mission.done ? (
              <div className="text-center">
                <p className="font-semibold text-emerald-400">✅ Mission accomplie — points gagnés !</p>
                <button onClick={() => setDone(false)} disabled={busy} className="btn-ghost mt-3">
                  Annuler
                </button>
              </div>
            ) : (
              <button onClick={() => setDone(true)} disabled={busy} className="btn-gold w-full">
                🎯 Mission accomplie !
              </button>
            )}
          </div>
          <p className="mt-4 text-center text-[11px] text-white/40">
            Reste discret : c'est plus drôle si les autres ne savent pas 😉
          </p>
        </div>
      )}
    </AppShell>
  );
}
