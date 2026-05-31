'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

interface Pending {
  id: string;
  type: 'mission' | 'secret';
  title: string;
  points: number;
  familyName: string;
  familyAvatar: string;
  photoUrl: string | null;
}

export default function ValidationPage() {
  const [items, setItems] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const [{ data: subs }, { data: secrets }] = await Promise.all([
      supabase
        .from('mission_submissions')
        .select('id, status, mission:missions(title, points), family:families(name, avatar), photo:photos(public_url)')
        .eq('status', 'pending'),
      supabase
        .from('secret_missions')
        .select('id, status, title, points, photo_id, family:families(name, avatar), photo:photos(public_url)')
        .eq('status', 'pending')
        .not('photo_id', 'is', null),
    ]);

    const list: Pending[] = [];
    (subs as any[] | null)?.forEach((s) =>
      list.push({
        id: s.id,
        type: 'mission',
        title: s.mission?.title ?? 'Mission',
        points: s.mission?.points ?? 0,
        familyName: s.family?.name ?? '',
        familyAvatar: s.family?.avatar ?? '🏰',
        photoUrl: s.photo?.public_url ?? null,
      })
    );
    (secrets as any[] | null)?.forEach((s) =>
      list.push({
        id: s.id,
        type: 'secret',
        title: `🕵️ ${s.title}`,
        points: s.points,
        familyName: s.family?.name ?? '',
        familyAvatar: s.family?.avatar ?? '🏰',
        photoUrl: s.photo?.public_url ?? null,
      })
    );
    setItems(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const supabase = getSupabaseBrowser();
    const ch = supabase
      .channel('admin-validation')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_submissions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'secret_missions' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  async function review(item: Pending, approve: boolean) {
    setBusy(item.id);
    await fetch('/api/admin/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: item.id, approve, type: item.type }),
    });
    setItems((l) => l.filter((i) => i.id !== item.id));
    setBusy(null);
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Validation des photos</h1>
      <p className="mb-4 text-sm text-white/50">
        {loading ? 'Chargement…' : `${items.length} preuve(s) en attente`}
      </p>

      {!loading && items.length === 0 && (
        <div className="card p-8 text-center text-white/60">Tout est validé 🎉</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.id} className="card overflow-hidden">
            {it.photoUrl && <img src={it.photoUrl} alt="" className="h-48 w-full object-cover" />}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{it.title}</span>
                <span className="chip bg-gold-500/20 text-gold-400">+{it.points}</span>
              </div>
              <div className="mt-1 text-sm text-white/60">{it.familyAvatar} {it.familyName}</div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => review(it, true)} disabled={busy === it.id} className="btn-primary flex-1">Accepter</button>
                <button onClick={() => review(it, false)} disabled={busy === it.id} className="btn-ghost flex-1">Refuser</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
