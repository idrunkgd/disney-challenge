'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { WyrQuestion } from '@/lib/types';

export default function TuPreferesPage() {
  const { session } = useSession();
  const [questions, setQuestions] = useState<WyrQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [myChoice, setMyChoice] = useState<'a' | 'b' | null>(null);
  const [tally, setTally] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [loading, setLoading] = useState(true);

  const q = questions[idx];

  const loadQuestions = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase.from('wyr_questions').select('*').eq('is_active', true);
    const all = ((data as WyrQuestion[]) ?? []).sort(() => Math.random() - 0.5);
    setQuestions(all);
    setLoading(false);
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // Charge mon vote + le décompte pour la question courante
  const loadVotes = useCallback(async () => {
    if (!q || !session) return;
    const supabase = getSupabaseBrowser();
    const [{ data: all }, { data: mine }] = await Promise.all([
      supabase.from('wyr_votes').select('choice').eq('question_id', q.id),
      supabase.from('wyr_votes').select('choice').eq('question_id', q.id).eq('user_id', session.user_id).maybeSingle(),
    ]);
    const a = (all as { choice: string }[] | null)?.filter((v) => v.choice === 'a').length ?? 0;
    const b = (all as { choice: string }[] | null)?.filter((v) => v.choice === 'b').length ?? 0;
    setTally({ a, b });
    setMyChoice((mine?.choice as 'a' | 'b') ?? null);
  }, [q, session]);

  useEffect(() => { loadVotes(); }, [loadVotes]);

  async function vote(choice: 'a' | 'b') {
    if (!session || !q || myChoice) return;
    setMyChoice(choice);
    const supabase = getSupabaseBrowser();
    await supabase.from('wyr_votes').upsert(
      { user_id: session.user_id, question_id: q.id, choice },
      { onConflict: 'user_id,question_id' }
    );
    loadVotes();
  }

  function next() {
    setMyChoice(null);
    setIdx((i) => (i + 1) % questions.length);
  }

  const total = tally.a + tally.b;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <AppShell back title="Tu préfères ?">
      <div className="mb-4 text-center">
        <h1 className="title-magic text-2xl">🤔 Tu préfères… ?</h1>
        <p className="text-xs text-white/50">Choisis ton camp, sans réfléchir ! (juste pour le fun)</p>
      </div>

      {loading || !q ? (
        <p className="text-white/50">Chargement…</p>
      ) : (
        <>
          <div className="space-y-3">
            {(['a', 'b'] as const).map((side) => {
              const text = side === 'a' ? q.option_a : q.option_b;
              const chosen = myChoice === side;
              return (
                <button
                  key={side}
                  onClick={() => vote(side)}
                  disabled={!!myChoice}
                  className={`relative w-full overflow-hidden rounded-2xl border p-5 text-left transition active:scale-[0.98] ${
                    chosen ? 'border-gold-400 bg-magic-800' : 'border-white/10 bg-magic-900'
                  }`}
                >
                  {myChoice && (
                    <div
                      className="absolute inset-y-0 left-0 bg-magic-600/40 transition-all"
                      style={{ width: `${pct(tally[side])}%` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span className="font-semibold">{text}</span>
                    {myChoice && <span className="text-sm font-bold text-gold-400">{pct(tally[side])}%</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {myChoice && (
            <div className="mt-2 text-center text-xs text-white/40">{total} vote{total > 1 ? 's' : ''}</div>
          )}

          <button onClick={next} className="btn-gold mt-5 w-full">
            {myChoice ? 'Question suivante →' : 'Passer →'}
          </button>
        </>
      )}
    </AppShell>
  );
}
