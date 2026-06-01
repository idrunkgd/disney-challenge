'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { BingoCard } from '@/lib/types';

const CATEGORIES = ['Toutes', 'Attractions', 'Décors', 'Personnages', 'Nourriture', 'Comportements', 'Boutiques', 'Spectacles', 'Détails cachés'];

const diffStyle: Record<string, string> = {
  easy: 'border-emerald-400/40',
  medium: 'border-gold-400/40',
  rare: 'border-candy-400/50',
};
const diffLabel: Record<string, string> = { easy: 'Facile', medium: 'Moyen', rare: 'Rare' };

export default function BingoPage() {
  const { session } = useSession();
  const [cards, setCards] = useState<BingoCard[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [cat, setCat] = useState('Toutes');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    const [{ data: c }, { data: comp }] = await Promise.all([
      supabase.from('bingo_cards').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('bingo_completions').select('card_id').eq('family_id', session.family_id),
    ]);
    setCards((c as BingoCard[]) ?? []);
    setDone(new Set((comp as { card_id: string }[] | null)?.map((x) => x.card_id) ?? []));
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(card: BingoCard) {
    if (!session) return;
    const isDone = done.has(card.id);
    // Optimiste
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

  const filtered = cat === 'Toutes' ? cards : cards.filter((c) => c.category === cat);
  const points = cards.filter((c) => done.has(c.id)).reduce((s, c) => s + c.points, 0);

  return (
    <AppShell back title="Bingo Disney">
      <div className="card mb-4 flex items-center justify-between p-4">
        <div>
          <div className="text-sm font-semibold">🎰 Bingo Disney</div>
          <div className="text-xs text-white/50">{done.size} / {cards.length} cases · partagé en famille</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-gold-400">{points}</div>
          <div className="text-[10px] uppercase text-white/40">points</div>
        </div>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${cat === c ? 'bg-magic-600 text-white' : 'bg-white/10 text-white/70'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-white/50">Chargement…</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filtered.map((c) => {
            const isDone = done.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition active:scale-[0.98] ${
                  isDone ? 'border-emerald-400 bg-emerald-600/20' : `bg-magic-900 ${diffStyle[c.difficulty]}`
                }`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm ${isDone ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'}`}>
                  {isDone ? '✓' : ''}
                </span>
                <span className="flex-1 text-sm font-medium text-white">{c.title}</span>
                <span className="shrink-0 text-[10px] text-white/40">{diffLabel[c.difficulty]} · +{c.points}</span>
              </button>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
