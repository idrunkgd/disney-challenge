'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { HangmanWord } from '@/lib/types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_ERRORS = 7;
const HANGED = ['😀', '🙂', '😐', '😟', '😨', '😰', '😱', '💀'];

// Normalise (enlève accents, majuscule) pour comparer les lettres
const norm = (s: string) => s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function PenduPage() {
  const { session } = useSession();
  const [words, setWords] = useState<HangmanWord[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [word, setWord] = useState<HangmanWord | null>(null);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    const [{ data: w }, { data: s }] = await Promise.all([
      supabase.from('hangman_words').select('*').eq('is_active', true),
      supabase.from('hangman_solved').select('word_id').eq('family_id', session.family_id),
    ]);
    setWords((w as HangmanWord[]) ?? []);
    setSolvedIds(new Set((s as { word_id: string }[] | null)?.map((x) => x.word_id) ?? []));
    setLoading(false);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  function newWord() {
    const pool = words.filter((w) => !solvedIds.has(w.id));
    if (pool.length === 0) { setWord(null); return; }
    setWord(pool[Math.floor(Math.random() * pool.length)]);
    setGuessed(new Set());
  }

  // état de la manche
  const letters = useMemo(() => (word ? norm(word.answer).split('') : []), [word]);
  const errors = word ? [...guessed].filter((g) => !letters.includes(g)).length : 0;
  const won = word ? letters.every((l) => l === ' ' || !/[A-Z]/.test(l) || guessed.has(l)) : false;
  const lost = errors >= MAX_ERRORS;

  useEffect(() => {
    if (won && word && session) {
      const supabase = getSupabaseBrowser();
      supabase
        .rpc('solve_hangman', { p_family_id: session.family_id, p_word_id: word.id, p_user_id: session.user_id })
        .then(() => setSolvedIds((s) => new Set(s).add(word.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  function guess(l: string) {
    if (won || lost) return;
    setGuessed((g) => new Set(g).add(l));
  }

  const remaining = words.length - solvedIds.size;

  return (
    <AppShell back title="Le Pendu">
      <div className="card mb-4 flex items-center justify-between p-4">
        <div>
          <div className="text-sm font-semibold">🪢 Le Pendu Disney</div>
          <div className="text-xs text-white/50">{solvedIds.size}/{words.length} mots trouvés</div>
        </div>
        <div className="text-right">
          <div className="text-2xl">{word ? HANGED[Math.min(errors, MAX_ERRORS)] : '🎬'}</div>
          {word && !won && !lost && (
            <div className="text-[11px] font-medium text-white/60">
              {MAX_ERRORS - errors} essai{MAX_ERRORS - errors > 1 ? 's' : ''} restant{MAX_ERRORS - errors > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-white/50">Chargement…</p>
      ) : !word ? (
        <div className="card p-6 text-center">
          {remaining === 0 ? (
            <>
              <div className="text-4xl">🏆</div>
              <p className="mt-2 font-semibold">Tous les mots sont trouvés, bravo !</p>
            </>
          ) : (
            <>
              <div className="text-4xl">🪢</div>
              <p className="mt-2 text-white/70">Devine le mot avant d'être pendu ! {MAX_ERRORS} erreurs max.</p>
              <button onClick={newWord} className="btn-primary mt-4 w-full">Nouveau mot</button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="card p-6 text-center">
            <span className="chip bg-magic-700">{word.hint} · +{word.points} pts</span>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {letters.map((l, i) =>
                l === ' ' ? (
                  <span key={i} className="w-3" />
                ) : (
                  <span key={i} className="grid h-9 w-7 place-items-center rounded border-b-2 border-white/40 text-lg font-bold">
                    {!/[A-Z]/.test(l) ? l : guessed.has(l) || won || lost ? l : ''}
                  </span>
                )
              )}
            </div>

            {won && <p className="mt-4 font-semibold text-emerald-400">Gagné ! +{word.points} points 🎉</p>}
            {lost && <p className="mt-4 font-semibold text-candy-400">Pendu ! La réponse était « {word.answer} ».</p>}
          </div>

          {!won && !lost && (
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {ALPHABET.map((l) => {
                const used = guessed.has(l);
                const good = used && letters.includes(l);
                return (
                  <button
                    key={l}
                    onClick={() => guess(l)}
                    disabled={used}
                    className={`aspect-square rounded-lg text-sm font-bold transition ${
                      !used ? 'bg-magic-700 hover:bg-magic-600' : good ? 'bg-emerald-600' : 'bg-candy-700 opacity-60'
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          )}

          {(won || lost) && (
            <button onClick={newWord} className="btn-gold mt-4 w-full">Mot suivant →</button>
          )}
        </>
      )}
    </AppShell>
  );
}
