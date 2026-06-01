'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Mission, MissionSubmission } from '@/lib/types';

const categoryLabels: Record<string, string> = {
  photo: '📸 Photos',
  attraction: '🎢 Attractions',
  exploration: '🔍 Exploration',
};

const statusBadge: Record<string, { label: string; cls: string }> = {
  pending: { label: 'En attente de validation', cls: 'bg-gold-500/20 text-gold-400' },
  approved: { label: 'Validée ✓', cls: 'bg-emerald-500/20 text-emerald-400' },
  rejected: { label: 'Refusée', cls: 'bg-candy-500/20 text-candy-400' },
};

export default function MissionsPage() {
  const { session } = useSession();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [subs, setSubs] = useState<Record<string, MissionSubmission>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    (async () => {
      const [{ data: ms }, { data: ss }] = await Promise.all([
        supabase.from('missions').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('mission_submissions').select('*').eq('family_id', session.family_id),
      ]);
      setMissions((ms as Mission[]) ?? []);
      const map: Record<string, MissionSubmission> = {};
      (ss as MissionSubmission[] | null)?.forEach((s) => (map[s.mission_id] = s));
      setSubs(map);
      setLoading(false);
    })();
  }, [session]);

  const grouped = missions.reduce<Record<string, Mission[]>>((acc, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});

  const done = Object.values(subs).filter((s) => s.status === 'approved').length;

  return (
    <AppShell title="Meilleure photo">
      <div className="card mb-4 flex items-center justify-between p-4">
        <div>
          <div className="text-sm font-semibold">Progression</div>
          <div className="text-xs text-white/50">{done} / {missions.length} missions validées</div>
        </div>
        <div className="text-2xl font-extrabold text-gold-400">
          {missions.length ? Math.round((done / missions.length) * 100) : 0}%
        </div>
      </div>

      {loading && <p className="text-white/50">Chargement…</p>}

      {Object.entries(grouped).map(([cat, list]) => (
        <section key={cat} className="mb-6">
          <h2 className="mb-2 px-1 text-sm font-semibold text-white/70">{categoryLabels[cat] ?? cat}</h2>
          <div className="space-y-2">
            {list.map((m) => {
              const sub = subs[m.id];
              return (
                <Link
                  key={m.id}
                  href={`/missions/${m.id}`}
                  className="card flex items-center gap-3 p-3 transition hover:bg-white/10"
                >
                  <span className="text-2xl">{m.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{m.title}</div>
                    {sub ? (
                      <span className={`chip mt-1 ${statusBadge[sub.status].cls}`}>
                        {statusBadge[sub.status].label}
                      </span>
                    ) : (
                      <div className="text-xs text-white/50">Pas encore tentée</div>
                    )}
                  </div>
                  <span className="shrink-0 rounded-lg bg-gold-500/20 px-2 py-1 text-sm font-bold text-gold-400">
                    +{m.points}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
