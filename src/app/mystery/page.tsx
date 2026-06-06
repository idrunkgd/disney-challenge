'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { useGameOpen } from '@/hooks/useGameOpen';
import type { MysteryImage, MysteryGuess } from '@/lib/types';

const GRID = 10; // 10 × 10 = 100 blocs

// Ordre de révélation déterministe (même affichage à chaque chargement)
function seededOrder(n: number, seed: number): number[] {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function MysteryPage() {
  const { session } = useSession();
  const mysteryOpen = useGameOpen('mystery');
  const [image, setImage] = useState<MysteryImage | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [guess, setGuess] = useState<MysteryGuess | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    const [{ data: img }, { data: ans }, { data: g }] = await Promise.all([
      supabase.from('mystery_image').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('quiz_answers').select('is_correct').eq('family_id', session.family_id).eq('is_correct', true),
      supabase.from('mystery_guesses').select('*').eq('family_id', session.family_id).maybeSingle(),
    ]);
    setImage((img as MysteryImage) ?? null);
    setCorrectCount((ans as any[] | null)?.length ?? 0);
    const gg = (g as MysteryGuess) ?? null;
    setGuess(gg);
    if (gg) setDraft(gg.guess);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
    const supabase = getSupabaseBrowser();
    const ch = supabase
      .channel('mystery')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mystery_guesses' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_answers' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const total = GRID * GRID;
  const revealed = Math.min(correctCount, total);
  const order = useMemo(() => seededOrder(total, 1337), [total]);
  const revealedSet = useMemo(() => new Set(order.slice(0, revealed)), [order, revealed]);

  async function submitGuess() {
    if (!session || !draft.trim() || !mysteryOpen) return;
    setBusy(true);
    const supabase = getSupabaseBrowser();
    await supabase.rpc('submit_mystery_guess', { p_family_id: session.family_id, p_guess: draft.trim() });
    await load();
    setBusy(false);
  }

  return (
    <AppShell back title="Image Mystère">
      <div className="mb-3 text-center">
        <h1 className="title-magic text-2xl">🖼️ Image Mystère</h1>
        <p className="text-xs text-white/50">Devinez le dessin animé caché · 500 points</p>
      </div>

      {loading ? (
        <p className="text-white/50">Chargement…</p>
      ) : !image ? (
        <div className="card p-8 text-center text-white/60">
          L'image mystère n'est pas encore disponible. L'organisateur va la préparer ! 🎬
        </div>
      ) : (
        <>
          <div className="card mb-3 flex items-center justify-between p-3">
            <span className="text-sm text-white/70">Blocs révélés</span>
            <span className="font-bold text-gold-400">{revealed} / {total}</span>
          </div>
          <p className="mb-3 px-1 text-xs text-white/50">
            Chaque bonne réponse au quiz fait disparaître un bloc. Plus vous répondez juste, plus l'image se dévoile !
          </p>

          {/* Image + grille de 100 blocs */}
          <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl border border-white/10">
            <img src={image.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)`, gridTemplateRows: `repeat(${GRID}, 1fr)` }}>
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={`transition-opacity duration-500 ${
                    revealedSet.has(i) ? 'opacity-0' : 'bg-magic-800 opacity-100'
                  } border border-magic-950/40`}
                />
              ))}
            </div>
          </div>

          {/* Proposition */}
          <div className="card mt-4 p-4">
            {guess?.status === 'approved' ? (
              <div className="text-center">
                <div className="text-4xl">🏆</div>
                <p className="mt-1 font-semibold text-emerald-400">Bravo ! Bonne réponse validée — +500 points !</p>
                <p className="text-sm text-white/60">« {guess.guess} »</p>
              </div>
            ) : (
              <>
                {!mysteryOpen && (
                  <p className="mb-2 rounded-lg bg-candy-500/10 p-2 text-center text-sm font-medium text-candy-300">
                    🔒 Image Mystère clôturée — vos points sont conservés.
                  </p>
                )}
                <label className="text-sm font-medium">Votre réponse : quel est ce dessin animé ?</label>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Écrivez le nom du film…"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-magic-400"
                />
                <button onClick={submitGuess} disabled={busy || !draft.trim() || !mysteryOpen} className="btn-primary mt-3 w-full">
                  {busy ? 'Envoi…' : guess ? 'Modifier ma réponse' : 'Proposer cette réponse'}
                </button>
                {guess?.status === 'pending' && (
                  <p className="mt-2 text-center text-sm text-gold-400">⏳ En attente de validation par l'organisateur.</p>
                )}
                {guess?.status === 'rejected' && (
                  <p className="mt-2 text-center text-sm text-candy-400">Ce n'était pas ça… réessayez !</p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
