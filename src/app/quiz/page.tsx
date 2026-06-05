'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { QuizQuestion } from '@/lib/types';

const TIME_PER_Q = 20; // secondes

const LEVELS = [
  { d: 1, label: 'Facile', icon: '🟢' },
  { d: 2, label: 'Moyenne', icon: '🔵' },
  { d: 3, label: 'Difficile', icon: '🟣' },
  { d: 4, label: 'Expert', icon: '🟠' },
  { d: 5, label: 'Impossible', icon: '🔴' },
];

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
  const [level, setLevel] = useState(1);

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
      void record(-1);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, active, chosen]);

  const levelList = (d: number) => questions.filter((q) => q.difficulty === d);

  function openQuestion(q: QuizQuestion) {
    if (answers[q.id]) return;
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
  }

  // Question suivante non répondue dans le même niveau (ou retour au plateau)
  function nextUnanswered(): QuizQuestion | null {
    if (!active) return null;
    const list = levelList(active.difficulty);
    const idx = list.findIndex((x) => x.id === active.id);
    return list.slice(idx + 1).find((x) => !answers[x.id]) ?? null;
  }

  function goNext() {
    const next = nextUnanswered();
    if (next) {
      setActive(next);
      setChosen(null);
      setTime(TIME_PER_Q);
    } else {
      setActive(null);
    }
  }

  const totalPoints = Object.values(answers).reduce((s, a) => s + a.points_awarded, 0);
  const answeredCount = Object.keys(answers).length;

  // ── PLATEAU (par niveau, 20 à la fois) ──────────────────────────────────────
  if (!active) {
    const list = levelList(level);
    const doneInLevel = list.filter((q) => answers[q.id]).length;
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

        {/* Onglets de niveau */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {LEVELS.map((lvl) => {
            const ll = levelList(lvl.d);
            const done = ll.filter((q) => answers[q.id]).length;
            return (
              <button
                key={lvl.d}
                onClick={() => setLevel(lvl.d)}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  level === lvl.d ? 'bg-magic-600 text-white shadow-glow' : 'bg-white/10 text-white/70'
                }`}
              >
                {lvl.icon} {lvl.label}
                <span className="ml-1 text-[10px] opacity-70">{done}/{ll.length}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-3 flex items-center justify-between px-1 text-xs text-white/50">
          <span>{LEVELS[level - 1].icon} {LEVELS[level - 1].label} · {level} pt{level > 1 ? 's' : ''} / bonne réponse</span>
          <span>{doneInLevel}/{list.length} jouées</span>
        </div>

        {loading ? (
          <p className="text-white/50">Chargement…</p>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {list.map((q, i) => {
              const a = answers[q.id];
              let cls = 'bg-magic-600 hover:bg-magic-500 active:scale-95';
              let mark: string | number = i + 1;
              if (a) {
                if (a.is_correct) {
                  cls = 'bg-emerald-600 cursor-default';
                  mark = '✓';
                } else {
                  cls = 'bg-candy-600 cursor-default';
                  mark = '✗';
                }
              }
              return (
                <button
                  key={q.id}
                  onClick={() => openQuestion(q)}
                  disabled={!!a}
                  className={`aspect-square rounded-xl text-base font-bold text-white transition ${cls}`}
                >
                  {mark}
                </button>
              );
            })}
          </div>
        )}
      </AppShell>
    );
  }

  // ── QUESTION OUVERTE ────────────────────────────────────────────────────────
  const answered = chosen !== null;
  const isCorrect = answered && chosen === active.correct_index;
  const hasNext = !!nextUnanswered();

  return (
    <AppShell back title="Quiz Disney">
      <div className="mb-3 flex items-center justify-between text-sm">
        <button onClick={() => setActive(null)} className="text-white/70 hover:text-white">← Plateau</button>
        <span className={`font-bold ${time <= 5 ? 'text-candy-400' : 'text-gold-400'}`}>⏱ {time}s</span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-magic-500 transition-all" style={{ width: `${(time / TIME_PER_Q) * 100}%` }} />
      </div>

      {/* Carte question : fond plein sombre + texte clair pour une lecture nette */}
      <div className="rounded-2xl border border-white/10 bg-magic-900 p-6 shadow-xl">
        <span className="chip mb-3 bg-gold-500/20 text-gold-300">
          {LEVELS[active.difficulty - 1].icon} {LEVELS[active.difficulty - 1].label} · +{active.difficulty} pt{active.difficulty > 1 ? 's' : ''}
        </span>
        <h2 className="text-lg font-semibold text-white">{active.question}</h2>
        <div className="mt-4 space-y-2">
          {active.options.map((opt, i) => {
            let cls = 'bg-magic-800 hover:bg-magic-700 text-white';
            if (answered) {
              if (i === active.correct_index) cls = 'bg-emerald-600 text-white';
              else if (i === chosen) cls = 'bg-candy-600 text-white';
              else cls = 'bg-magic-800/60 text-white/60';
            }
            return (
              <button
                key={i}
                onClick={() => record(i)}
                disabled={answered}
                className={`w-full rounded-xl px-4 py-3 text-left font-medium transition ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <p className="mt-4 text-center text-sm font-medium">
            {isCorrect ? <span className="text-emerald-400">Bonne réponse ! 🎉</span> : <span className="text-candy-400">Dommage…</span>}
          </p>
        )}
      </div>

      {answered && (
        <div className="mt-4 flex gap-2">
          <button onClick={() => setActive(null)} className="btn-ghost flex-1">← Retour au plateau</button>
          {hasNext && <button onClick={goNext} className="btn-gold flex-1">Suivante →</button>}
        </div>
      )}
    </AppShell>
  );
}
