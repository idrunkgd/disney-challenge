'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { FamilyScore } from '@/lib/types';

interface Row extends FamilyScore {
  missionsApproved: number;
  missionsPending: number;
  quizAnswered: number;
}

export default function ProgressPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totalMissions, setTotalMissions] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const [{ data: scores }, { data: subs }, { data: quiz }, { count: mCount }, { count: qCount }] =
      await Promise.all([
        supabase.from('family_scores').select('*').order('total_points', { ascending: false }),
        supabase.from('mission_submissions').select('family_id, status'),
        supabase.from('quiz_answers').select('family_id'),
        supabase.from('missions').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);

    const approved: Record<string, number> = {};
    const pending: Record<string, number> = {};
    (subs as { family_id: string; status: string }[] | null)?.forEach((s) => {
      if (s.status === 'approved') approved[s.family_id] = (approved[s.family_id] ?? 0) + 1;
      if (s.status === 'pending') pending[s.family_id] = (pending[s.family_id] ?? 0) + 1;
    });
    const quizCount: Record<string, number> = {};
    (quiz as { family_id: string }[] | null)?.forEach((q) => (quizCount[q.family_id] = (quizCount[q.family_id] ?? 0) + 1));

    setRows(
      ((scores as FamilyScore[]) ?? []).map((s) => ({
        ...s,
        missionsApproved: approved[s.family_id] ?? 0,
        missionsPending: pending[s.family_id] ?? 0,
        quizAnswered: quizCount[s.family_id] ?? 0,
      }))
    );
    setTotalMissions(mCount ?? 0);
    setTotalQuestions(qCount ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const supabase = getSupabaseBrowser();
    const ch = supabase
      .channel('admin-progress')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_submissions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_answers' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const medals = ['🥇', '🥈', '🥉'];

  function Bar({ value, total, color }: { value: number; total: number; color: string }) {
    const pct = total ? Math.round((value / total) * 100) : 0;
    return (
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Avancement des familles</h1>
      <p className="mb-4 text-sm text-white/50">
        {loading ? 'Chargement…' : 'Mise à jour automatique en direct ⚡'}
      </p>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.family_id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 text-center text-lg font-bold">{medals[i] ?? `#${i + 1}`}</span>
                <span className="text-2xl">{r.avatar}</span>
                <span className="font-semibold">{r.name}</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-gold-400">{r.total_points}</div>
                <div className="text-[10px] uppercase text-white/40">points</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">🎯 Missions validées</span>
                  <span className="font-medium">{r.missionsApproved}/{totalMissions}</span>
                </div>
                <Bar value={r.missionsApproved} total={totalMissions} color="bg-emerald-400" />
                {r.missionsPending > 0 && (
                  <span className="chip mt-1 bg-gold-500/20 text-gold-400">
                    {r.missionsPending} en attente de validation
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">🧠 Quiz joué</span>
                  <span className="font-medium">{r.quizAnswered}/{totalQuestions}</span>
                </div>
                <Bar value={r.quizAnswered} total={totalQuestions} color="bg-magic-400" />
                <span className="mt-1 text-[11px] text-white/40">{r.quiz_points} pts de quiz</span>
              </div>
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && (
          <div className="card p-8 text-center text-white/60">Aucune famille pour l'instant.</div>
        )}
      </div>
    </div>
  );
}
