'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { BingoCard } from '@/lib/types';

// Les 12 lignes du bingo 5×5 (indices 0..24) : 5 rangées, 5 colonnes, 2 diagonales
const LINES: number[][] = [
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
];

export default function BingoPage() {
  const { session } = useSession();
  const [cards, setCards] = useState<BingoCard[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    const [{ data: c }, { data: comp }] = await Promise.all([
      supabase.from('bingo_cards').select('*').eq('is_active', true).order('sort_order').limit(25),
      supabase.from('bingo_completions').select('card_id').eq('family_id', session.family_id),
    ]);
    setCards((c as BingoCard[]) ?? []);
    setDone(new Set((comp as { card_id: string }[] | null)?.map((x) => x.card_id) ?? []));
    setLoading(false);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  async function toggle(card: BingoCard) {
    if (!session) return;
    const isDone = done.has(card.id);
    setDone((s) => {
      const n = new Set(s);
      isDone ? n.delete(card.id) : n.add(card.id);
      return n;
    });
    const supabase = getSupabaseBrowser();
    await supabase.rpc('set_bingo', {
      p_family_id: session.family_id,
      p_card_id: card.id,
      p_user_id: session.user_id,
      p_done: !isDone,
    });
  }

  // Cases d'une ligne complète (pour la mise en valeur) + score
  const { completedLineCells, completedLines, doneCount } = useMemo(() => {
    const cellDone = cards.map((c) => done.has(c.id));
    const lineCells = new Set<number>();
    let lines = 0;
    for (const ln of LINES) {
      if (ln.every((i) => cellDone[i])) {
        lines++;
        ln.forEach((i) => lineCells.add(i));
      }
    }
    return {
      completedLineCells: lineCells,
      completedLines: lines,
      doneCount: cellDone.filter(Boolean).length,
    };
  }, [cards, done]);

  const points = doneCount * 10 + completedLines * 20;

  return (
    <AppShell back title="Bingo Disney">
      <div className="card mb-3 flex items-center justify-between p-4">
        <div>
          <div className="text-sm font-semibold">🎰 Bingo Disney</div>
          <div className="text-xs text-white/50">
            {doneCount}/25 cases · {completedLines} ligne{completedLines > 1 ? 's' : ''} · partagé en famille
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-gold-400">{points}</div>
          <div className="text-[10px] uppercase text-white/40">points</div>
        </div>
      </div>

      <p className="mb-3 px-1 text-xs text-white/50">
        10 pts par case cochée · <span className="text-gold-400">+20 pts</span> par ligne, colonne ou diagonale complète. Touchez une case quand c'est fait !
      </p>

      {loading ? (
        <p className="text-white/50">Chargement…</p>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {cards.map((c, i) => {
            const isDone = done.has(c.id);
            const inLine = completedLineCells.has(i);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c)}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg p-1 text-center text-[8.5px] font-medium leading-tight transition active:scale-95 ${
                  isDone
                    ? inLine
                      ? 'bg-gold-500 text-magic-950 shadow-glow-gold'
                      : 'bg-emerald-600 text-white'
                    : 'bg-magic-900 text-white/80 border border-white/10'
                }`}
              >
                {isDone && <span className="text-sm">{inLine ? '★' : '✓'}</span>}
                <span className="line-clamp-4">{c.title}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex justify-center gap-4 text-[11px] text-white/50">
        <span>✓ Case cochée</span>
        <span className="text-gold-400">★ Ligne complète</span>
      </div>
    </AppShell>
  );
}
