'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { PhotoUpload } from '@/components/PhotoUpload';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { SecretMission } from '@/lib/types';

export default function SecretPage() {
  const { session } = useSession();
  const [mission, setMission] = useState<SecretMission | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from('secret_missions')
      .select('*')
      .eq('family_id', session.family_id)
      .maybeSingle();
    setMission((data as SecretMission) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <AppShell back title="Mission secrète">
      <div className="card relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-6 -top-6 text-8xl opacity-10">🕵️</div>
        <span className="chip bg-candy-500/20 text-candy-400">Top secret · +{mission?.points ?? 50} pts</span>
        {loading ? (
          <p className="mt-4 text-white/50">Chargement…</p>
        ) : mission ? (
          <>
            <h1 className="mt-3 text-xl font-bold">{mission.title}</h1>
            <p className="mt-1 text-white/70">{mission.description}</p>
            <p className="mt-2 text-xs text-white/40">
              Visible uniquement par votre famille. Envoyez une preuve photo pour valider.
            </p>
            <div className="mt-5">
              {mission.status === 'pending' && !mission.photo_id ? (
                <PhotoUpload secretMissionId={mission.id} onUploaded={load} label="Envoyer la preuve" />
              ) : mission.status === 'approved' ? (
                <p className="font-semibold text-emerald-400">✅ Mission validée — bonus accordé !</p>
              ) : (
                <p className="font-semibold text-gold-400">⏳ En attente de validation par l'organisateur.</p>
              )}
            </div>
          </>
        ) : (
          <p className="mt-4 text-white/60">
            Aucune mission secrète assignée pour le moment. L'organisateur en attribuera une bientôt !
          </p>
        )}
      </div>
    </AppShell>
  );
}
