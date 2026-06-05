'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { PetitBacRound } from '@/lib/types';

export default function PetitBacPage() {
  const { session } = useSession();
  const [round, setRound] = useState<PetitBacRound | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    const supabase = getSupabaseBrowser();
    const { data: r } = await supabase
      .from('petitbac_rounds')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setRound((r as PetitBacRound) ?? null);
    if (r) {
      const { data: sub } = await supabase
        .from('petitbac_submissions')
        .select('answers, status, points')
        .eq('round_id', r.id)
        .eq('family_id', session.family_id)
        .maybeSingle();
      if (sub) {
        setAnswers(sub.answers ?? {});
        setStatus(sub.status);
        setPoints(sub.points ?? 0);
      } else {
        setAnswers({});
        setStatus(null);
      }
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
    const supabase = getSupabaseBrowser();
    const ch = supabase
      .channel('petitbac')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'petitbac_submissions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'petitbac_rounds' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  async function submit() {
    if (!session || !round) return;
    setBusy(true);
    const supabase = getSupabaseBrowser();
    await supabase.rpc('submit_petitbac', {
      p_round_id: round.id,
      p_family_id: session.family_id,
      p_answers: answers,
    });
    await load();
    setBusy(false);
  }

  return (
    <AppShell back title="Petit Bac">
      <div className="mb-3 text-center">
        <h1 className="title-magic text-2xl">📝 Petit Bac Disney</h1>
        <p className="text-xs text-white/50">Remplis chaque catégorie avec un mot qui commence par la lettre !</p>
      </div>

      {loading ? (
        <p className="text-white/50">Chargement…</p>
      ) : !round ? (
        <div className="card p-8 text-center text-white/60">Aucune manche en cours. L'organisateur va en lancer une ! 🎬</div>
      ) : (
        <>
          <div className="card mb-4 flex items-center justify-center gap-3 p-5">
            <span className="text-sm text-white/60">La lettre :</span>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-500 text-3xl font-extrabold text-magic-950">
              {round.letter}
            </span>
          </div>

          {status === 'approved' ? (
            <div className="card p-5 text-center">
              <div className="text-3xl">✅</div>
              <p className="mt-1 font-semibold text-emerald-400">Validé — +{points} points !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {round.categories.map((cat) => (
                <div key={cat} className="card p-3">
                  <label className="text-xs text-white/60">{cat}</label>
                  <input
                    value={answers[cat] ?? ''}
                    onChange={(e) => setAnswers({ ...answers, [cat]: e.target.value })}
                    placeholder={`En ${round.letter}…`}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-magic-400"
                  />
                </div>
              ))}
              <button onClick={submit} disabled={busy} className="btn-primary w-full">
                {busy ? 'Envoi…' : status ? 'Modifier ma grille' : 'Envoyer ma grille'}
              </button>
              {status === 'pending' && (
                <p className="text-center text-sm text-gold-400">⏳ En attente de validation par l'organisateur.</p>
              )}
              {status === 'rejected' && (
                <p className="text-center text-sm text-candy-400">Grille refusée — vérifie tes réponses et renvoie.</p>
              )}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
