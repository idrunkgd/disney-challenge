'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Award, Family } from '@/lib/types';

export default function AwardsPage() {
  const [awards, setAwards] = useState<(Award & { family?: Family })[]>([]);
  const [reveal, setReveal] = useState(0);

  async function load() {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from('awards')
      .select('*, family:families(*)')
      .order('created_at');
    setAwards((data as any) ?? []);
  }

  useEffect(() => {
    load();
    const supabase = getSupabaseBrowser();
    const ch = supabase
      .channel('awards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'awards' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const announced = awards.filter((a) => a.announced);

  return (
    <AppShell back title="Disney Awards">
      <div className="mb-6 text-center">
        <div className="animate-float text-6xl">🏆</div>
        <h1 className="title-magic mt-2 text-3xl">Disney Awards</h1>
        <p className="text-sm text-white/60">La grande cérémonie Dasolabs</p>
      </div>

      {announced.length === 0 ? (
        <div className="card p-8 text-center text-white/60">
          🎬 La cérémonie n'a pas encore commencé. Rendez-vous ce soir !
        </div>
      ) : (
        <div className="space-y-4">
          {announced.map((a, i) => (
            <div
              key={a.id}
              className="card animate-pop-in overflow-hidden p-6 text-center"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="text-xs uppercase tracking-widest text-gold-400">{a.category}</div>
              <div className="my-2 text-4xl">{a.family?.avatar ?? '⭐'}</div>
              <div className="text-xl font-extrabold">
                {a.family?.name ?? a.winner_name ?? 'À venir'}
              </div>
              {a.description && <p className="mt-1 text-sm text-white/60">{a.description}</p>}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
