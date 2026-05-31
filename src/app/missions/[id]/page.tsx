'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { PhotoUpload } from '@/components/PhotoUpload';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Mission, MissionSubmission, Photo } from '@/lib/types';

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const [mission, setMission] = useState<Mission | null>(null);
  const [sub, setSub] = useState<MissionSubmission | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    const { data: m } = await supabase.from('missions').select('*').eq('id', id).single();
    setMission(m as Mission);
    const { data: s } = await supabase
      .from('mission_submissions')
      .select('*')
      .eq('mission_id', id)
      .eq('family_id', session.family_id)
      .maybeSingle();
    setSub((s as MissionSubmission) ?? null);
    if (s?.photo_id) {
      const { data: p } = await supabase.from('photos').select('*').eq('id', s.photo_id).single();
      setPhoto(p as Photo);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, session]);

  if (loading) return <AppShell back title="Mission">Chargement…</AppShell>;
  if (!mission) return <AppShell back title="Mission">Mission introuvable.</AppShell>;

  const statusText = {
    pending: '⏳ En attente de validation',
    approved: '✅ Validée — points ajoutés !',
    rejected: '❌ Refusée — vous pouvez réessayer',
  };

  return (
    <AppShell back title="Mission">
      <div className="card p-6">
        <div className="text-5xl">{mission.icon}</div>
        <h1 className="mt-3 text-xl font-bold">{mission.title}</h1>
        <p className="mt-1 text-white/70">{mission.description}</p>
        <span className="chip mt-3 bg-gold-500/20 text-gold-400">+{mission.points} points</span>
      </div>

      <div className="mt-5">
        {sub && sub.status !== 'rejected' ? (
          <div className="card p-5 text-center">
            {photo && <img src={photo.public_url} alt="" className="mx-auto mb-3 max-h-60 rounded-xl" />}
            <p className="font-semibold">{statusText[sub.status]}</p>
            {sub.comment && <p className="mt-1 text-sm text-white/60">« {sub.comment} »</p>}
          </div>
        ) : (
          <PhotoUpload missionId={mission.id} onUploaded={load} />
        )}
      </div>
    </AppShell>
  );
}
