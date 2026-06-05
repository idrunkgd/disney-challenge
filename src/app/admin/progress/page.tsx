'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { FamilyScore } from '@/lib/types';

interface Row extends FamilyScore {
  missionsApproved: number;
  missionsPending: number;
  quizAnswered: number;
  bingoDone: number;
  penduSolved: number;
  mysteryStatus: 'approved' | 'pending' | null;
  wyrVotes: number;
}

export default function ProgressPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tot, setTot] = useState({ missions: 0, quiz: 0, bingo: 25, pendu: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const [
      { data: scores }, { data: subs }, { data: quiz }, { data: bingo },
      { data: pendu }, { data: mystery }, { data: wyr },
      { count: mCount }, { count: qCount }, { count: hCount },
    ] = await Promise.all([
      supabase.from('family_scores').select('*').order('total_points', { ascending: false }),
      supabase.from('mission_submissions').select('family_id, status'),
      supabase.from('quiz_answers').select('family_id'),
      supabase.from('bingo_completions').select('family_id'),
      supabase.from('hangman_solved').select('family_id'),
      supabase.from('mystery_guesses').select('family_id, status'),
      supabase.from('wyr_votes').select('user:users(family_id)'),
      supabase.from('missions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('hangman_words').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    const approved: Record<string, number> = {};
    const pending: Record<string, number> = {};
    (subs as any[] | null)?.forEach((s) => {
      if (s.status === 'approved') approved[s.family_id] = (approved[s.family_id] ?? 0) + 1;
      if (s.status === 'pending') pending[s.family_id] = (pending[s.family_id] ?? 0) + 1;
    });
    const countBy = (arr: any[] | null, key = 'family_id') => {
      const m: Record<string, number> = {};
      arr?.forEach((x) => { const k = x[key]; if (k) m[k] = (m[k] ?? 0) + 1; });
      return m;
    };
    const quizC = countBy(quiz as any[]);
    const bingoC = countBy(bingo as any[]);
    const penduC = countBy(pendu as any[]);
    const wyrC: Record<string, number> = {};
    (wyr as any[] | null)?.forEach((v) => { const f = v.user?.family_id; if (f) wyrC[f] = (wyrC[f] ?? 0) + 1; });
    const myst: Record<string, 'approved' | 'pending'> = {};
    (mystery as any[] | null)?.forEach((g) => { myst[g.family_id] = g.status; });

    setRows(
      ((scores as FamilyScore[]) ?? []).map((s) => ({
        ...s,
        missionsApproved: approved[s.family_id] ?? 0,
        missionsPending: pending[s.family_id] ?? 0,
        quizAnswered: quizC[s.family_id] ?? 0,
        bingoDone: bingoC[s.family_id] ?? 0,
        penduSolved: penduC[s.family_id] ?? 0,
        mysteryStatus: myst[s.family_id] ?? null,
        wyrVotes: wyrC[s.family_id] ?? 0,
      }))
    );
    setTot({ missions: mCount ?? 0, quiz: qCount ?? 0, bingo: 25, pendu: hCount ?? 0 });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const supabase = getSupabaseBrowser();
    const ch = supabase
      .channel('admin-progress')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_submissions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_answers' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mystery_guesses' }, load)
      .subscribe();
    const t = setInterval(load, 12000); // filet de sécurité (bingo/pendu pas en realtime)
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [load]);

  const medals = ['🥇', '🥈', '🥉'];

  function Stat({ icon, label, value, sub, alert }: { icon: string; label: string; value: string; sub?: string; alert?: boolean }) {
    return (
      <div className="rounded-xl bg-white/5 p-2.5">
        <div className="text-xs text-white/60">{icon} {label}</div>
        <div className="text-sm font-bold">{value}</div>
        {sub && <div className={`text-[10px] ${alert ? 'text-gold-400' : 'text-white/40'}`}>{sub}</div>}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Avancement — tous les jeux</h1>
      <p className="mb-4 text-sm text-white/50">{loading ? 'Chargement…' : 'Mise à jour automatique ⚡'}</p>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.family_id} className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 text-center text-lg font-bold">{medals[i] ?? `#${i + 1}`}</span>
                <span className="text-2xl">{r.avatar}</span>
                <span className="font-semibold">{r.name}</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-gold-400">{r.total_points}</div>
                <div className="text-[10px] uppercase text-white/40">points</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Stat icon="📸" label="Photos" value={`${r.missionsApproved}/${tot.missions}`}
                sub={r.missionsPending > 0 ? `${r.missionsPending} à valider` : `${r.mission_points} pts`} alert={r.missionsPending > 0} />
              <Stat icon="🧠" label="Quiz" value={`${r.quizAnswered}/${tot.quiz}`} sub={`${r.quiz_points} pts`} />
              <Stat icon="🎰" label="Bingo" value={`${r.bingoDone}/${tot.bingo}`} sub={`${r.bingo_points} pts`} />
              <Stat icon="🪢" label="Pendu" value={`${r.penduSolved}/${tot.pendu}`} sub={`${r.hangman_points} pts`} />
              <Stat icon="🖼️" label="Mystère"
                value={r.mysteryStatus === 'approved' ? 'Trouvé ✓' : r.mysteryStatus === 'pending' ? 'En attente' : '—'}
                sub={r.mystery_points > 0 ? `${r.mystery_points} pts` : undefined}
                alert={r.mysteryStatus === 'pending'} />
              <Stat icon="🤔" label="Tu préfères" value={`${r.wyrVotes}`} sub="votes" />
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
