'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Badge } from '@/lib/types';

// Calcule la progression de chaque badge à partir des stats live de la famille.
export default function BadgesPage() {
  const { session } = useSession();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState({
    explorationApproved: 0,
    attractionApproved: 0,
    photosApproved: 0,
    hasCreative: false,
    quizPoints: 0,
    spiritVotes: 0,
  });

  useEffect(() => {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    (async () => {
      const fid = session.family_id;
      const [{ data: bd }, { data: subs }, { data: creative }, { data: qa }, { data: votes }] =
        await Promise.all([
          supabase.from('badges').select('*'),
          supabase.from('mission_submissions').select('status, mission:missions(category)').eq('family_id', fid),
          supabase.from('creative_attractions').select('id').eq('family_id', fid).maybeSingle(),
          supabase.from('quiz_answers').select('points_awarded').eq('family_id', fid),
          supabase.from('votes').select('id').eq('category', 'team_spirit').eq('target_family_id', fid),
        ]);

      const approved = (subs as any[] | null)?.filter((s) => s.status === 'approved') ?? [];
      setBadges((bd as Badge[]) ?? []);
      setStats({
        explorationApproved: approved.filter((s) => s.mission?.category === 'exploration').length,
        attractionApproved: approved.filter((s) => s.mission?.category === 'attraction').length,
        photosApproved: approved.filter((s) => s.mission?.category === 'photo').length,
        hasCreative: !!creative,
        quizPoints: (qa as { points_awarded: number }[] | null)?.reduce((a, b) => a + b.points_awarded, 0) ?? 0,
        spiritVotes: (votes as any[] | null)?.length ?? 0,
      });
    })();
  }, [session]);

  function progress(code: string): { value: number; target: number; earned: boolean } {
    switch (code) {
      case 'explorer': return p(stats.explorationApproved, 3);
      case 'thrill_king': return p(stats.attractionApproved, 3);
      case 'photographer': return p(stats.photosApproved, 5);
      case 'visionary': return p(stats.hasCreative ? 1 : 0, 1);
      case 'quiz_master': return p(stats.quizPoints, 150);
      case 'spirit': return p(stats.spiritVotes, 1);
      default: return p(0, 1);
    }
  }
  function p(value: number, target: number) {
    return { value: Math.min(value, target), target, earned: value >= target };
  }

  const earnedCount = badges.filter((b) => progress(b.code).earned).length;

  return (
    <AppShell back title="Badges">
      <div className="card mb-4 p-5 text-center">
        <div className="text-4xl">🏅</div>
        <div className="mt-1 text-lg font-bold">{earnedCount} / {badges.length} badges débloqués</div>
        <div className="text-xs text-white/50">Famille {session?.family_name}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {badges.map((b) => {
          const pr = progress(b.code);
          return (
            <div
              key={b.id}
              className={`card p-4 text-center ${pr.earned ? 'shadow-glow-gold ring-1 ring-gold-400' : 'opacity-80'}`}
            >
              <div className={`text-4xl ${pr.earned ? '' : 'grayscale'}`}>{b.icon}</div>
              <div className="mt-2 text-sm font-semibold">{b.name}</div>
              <div className="text-[11px] text-white/50">{b.description}</div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full ${pr.earned ? 'bg-gold-400' : 'bg-magic-500'}`}
                  style={{ width: `${(pr.value / pr.target) * 100}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-white/40">
                {pr.earned ? 'Débloqué ✓' : `${pr.value}/${pr.target}`}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
