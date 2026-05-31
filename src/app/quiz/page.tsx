'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { QuizQuestion } from '@/lib/types';

const TIME_PER_Q = 20; // secondes

interface AnswerInfo {
  chosen_index: number;
  is_correct: boolean;
  points_awarded: number;
}

export default function QuizPage() {
  const { session } = useSession();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerInfo>>({});
  const [loading, setLoading] = useState(true);

  // Question en cours d'affichage (plein écran), null = on est sur le plateau
  const [active, setActive] = useState<QuizQuestion | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [time, setTime] = useState(TIME_PER_Q);

  const load = useCallback(async () => {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    const [{ data: q }, { data: a }] = await Promise.all([
      supabase.from('quiz_questions').select('*').eq('is_active', true).order('created_at'),
      supabase.from('quiz_answers').select('question_id, chosen_index, is_correct, points_awarded').eq('family_id', session.family_id),
    ]);
    setQuestions((q as QuizQuestion[]) ?? []);
    const map: Record<string, AnswerInfo> = {};
    (a as any[] | null)?.forEach((x) => (map[x.question_id] = x));
    setAnswers(map);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  // Timer de la question ouverte
  useEffect(() => {
    if (!active || chosen !== null) return;
    if (time <= 0) {
      void record(-1); // temps écoulé → réponse manquée
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, active, chosen]);

  function openQuestion(q: QuizQuestion) {
    if (answers[q.id]) return; // déjà répondue
    setActive(q);
    setChosen(null);
    setTime(TIME_PER_Q);
  }

  async function record(i: number) {
    if (!session || !active || chosen !== null) return;
    setChosen(i);
    const supabase = getSupabaseBrowser();
    const { data } = await supabase.rpc('answer_quiz', {
      p_question_id: active.id,
      p_family_id: session.family_id,
      p_user_id: session.user_id,
      p_chosen_index: i,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      setAnswers((m) => ({
        ...m,
        [active.id]: { chosen_index: row.chosen_index, is_correct: row.is_correct, points_awarded: row.points_awarded },
      }));
    }
    // Retour automatique au plateau après un court feedback
    setTimeout(() => setActive(null), 1800);
  }

  const totalPoints = Object.values(answers).reduce((s, a) => s + a.points_awarded, 0);
  const answeredCount = Object.keys(answers).length;

  // ── Vue : plateau de questions ────────────────────────────────────────────
  if (!active) {
    return (
      <AppShell back title="Quiz Disney">
        <div className="card mb-4 flex items-center justify-between p-4">
          <div>
            <div className="text-sm font-semibold">Quiz Disney</div>
            <div className="text-xs text-white/50">{answeredCount} / {questions.length} questions jouées</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-gold-400">{totalPoints}</div>
            <div className="text-[10px] uppercase text-white/40">points</div>
          </div>
        </div>

        <p className="mb-3 px-1 text-xs text-white/50">
          Touchez une case pour jouer la question. Vous avez {TIME_PER_Q} s, et chaque question ne se joue qu'une fois.
        </p>

        {loading ? (
          <p className="text-white/50">Chargement…</p>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              const a = answers[q.id];
              let cls = 'bg-magic-600 hover:bg-magic-500 active:scale-95';
              let mark: string | number = i + 1;
              if (a) {
                if (a.is_correct) {
                  cls = 'bg-emerald-500/30 border border-emerald-400 cursor-default';
                  mark = '✓';
                } else {
                  cls = 'bg-candy-500/30 border border-candy-400 cursor-default';
                  mark = '✗';
                }
              }
              return (
                <button
                  key={q.id}
                  onClick={() => openQuestion(q)}
                  disabled={!!a}
                  className={`aspect-square rounded-xl text-lg font-bold transition ${cls}`}
                  aria-label={`Question ${i + 1}`}
                >
                  {mark}
                </button>
              );
            })}
          </div>
        )}

        {answeredCount === questions.length && questions.length > 0 && (
          <div className="card mt-5 p-5 text-center">
            <div className="text-4xl">🎉</div>
            <p className="mt-2 font-semibold">Toutes les questions sont jouées !</p>
            <p className="text-sm text-white/60">Total : {totalPoints} points pour votre famille.</p>
          </div>
        )}
      </AppShell>
    );
  }

  // ── Vue : question ouverte (20 s) ─────────────────────────────────────────
  return (
    <AppShell back title="Quiz Disney">
      <div className="mb-3 flex items-center justify-between text-sm">
        <button onClick={() => setActive(null)} className="text-white/60 hover:text-white">← Plateau</button>
        <span className={`font-bold ${time <= 5 ? 'text-candy-400' : 'text-gold-400'}`}>⏱ {time}s</span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-magic-500 transition-all" style={{ width: `${(time / TIME_PER_Q) * 100}%` }} />
      </div>

      <div className="card p-6">
        <span className="chip mb-3 bg-gold-500/20 text-gold-400">+{10 * active.difficulty} pts</span>
        <h2 className="text-lg font-semibold">{active.question}</h2>
        <div className="mt-4 space-y-2">
          {active.options.map((opt, i) => {
            let cls = 'bg-white/5 hover:bg-white/10';
            if (chosen !== null) {
              if (i === active.correct_index) cls = 'bg-emerald-500/30 border border-emerald-400';
              else if (i === chosen) cls = 'bg-candy-500/30 border border-candy-400';
              else cls = 'bg-white/5 opacity-60';
            }
            return (
              <button
                key={i}
                onClick={() => record(i)}
                disabled={chosen !== null}
                className={`w-full rounded-xl px-4 py-3 text-left font-medium transition ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {chosen !== null && (
          <p className="mt-4 text-center text-sm text-white/60">
            {chosen === active.correct_index ? 'Bonne réponse ! 🎉' : 'Dommage…'} Retour au plateau…
          </p>
        )}
      </div>
    </AppShell>
  );
}
