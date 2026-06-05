'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-client';

interface Q {
  id: string;
  option_a: string;
  option_b: string;
  count_a: number;
  count_b: number;
  voters_a: string[];
  voters_b: string[];
}

export default function TuPreferesAdminPage() {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  async function load() {
    const res = await adminFetch('/api/admin/tupreferes');
    const json = await res.json();
    setQuestions(json.questions ?? []);
    setTotal(json.total_votes ?? 0);
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 8000); // rafraîchit toutes les 8 s
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Tu préfères — Réponses</h1>
      <p className="mb-4 text-sm text-white/50">{total} vote(s) au total · mise à jour automatique. Touche une ligne pour voir qui a voté quoi.</p>

      <div className="space-y-2">
        {questions.map((q) => {
          const tot = q.count_a + q.count_b;
          const pa = tot ? Math.round((q.count_a / tot) * 100) : 0;
          const pb = tot ? 100 - pa : 0;
          const isOpen = open === q.id;
          return (
            <div key={q.id} className="card p-3">
              <button onClick={() => setOpen(isOpen ? null : q.id)} className="w-full text-left">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex-1 font-medium">{q.option_a}</span>
                  <span className="text-white/30">vs</span>
                  <span className="flex-1 text-right font-medium">{q.option_b}</span>
                </div>
                <div className="mt-2 flex h-6 overflow-hidden rounded-lg bg-white/10 text-[11px] font-bold">
                  <div className="flex items-center justify-start bg-magic-600 px-2 text-white" style={{ width: `${pa}%` }}>
                    {q.count_a > 0 && `${q.count_a} · ${pa}%`}
                  </div>
                  <div className="flex flex-1 items-center justify-end bg-candy-600 px-2 text-white">
                    {q.count_b > 0 && `${pb}% · ${q.count_b}`}
                  </div>
                </div>
              </button>
              {isOpen && tot > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/60">
                  <div>
                    <div className="font-semibold text-magic-300">A</div>
                    {q.voters_a.map((v, i) => <div key={i}>{v}</div>)}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-candy-300">B</div>
                    {q.voters_b.map((v, i) => <div key={i}>{v}</div>)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
