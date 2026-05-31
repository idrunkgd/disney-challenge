'use client';

import { useEffect, useRef, useState } from 'react';
import type { BlindTrack } from '@/lib/types';

export default function BlindAdminPage() {
  const [tracks, setTracks] = useState<BlindTrack[]>([]);
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [points, setPoints] = useState(20);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch('/api/admin/blind');
    setTracks((await res.json()).tracks ?? []);
  }
  useEffect(() => { load(); }, []);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !title) return alert('Titre et fichier audio requis');
    setBusy(true);
    const form = new FormData();
    form.append('file', file);
    form.append('title', title);
    form.append('options', JSON.stringify(options.filter(Boolean)));
    form.append('correct_index', String(correct));
    form.append('points', String(points));
    await fetch('/api/admin/blind', { method: 'POST', body: form });
    setTitle('');
    setOptions(['', '', '', '']);
    if (fileRef.current) fileRef.current.value = '';
    await load();
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cet extrait ?')) return;
    await fetch(`/api/admin/blind?id=${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Blind Test</h1>

      <div className="card mb-5 space-y-3 p-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre / bonne réponse" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" checked={correct === i} onChange={() => setCorrect(i)} />
            <input value={o} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} placeholder={`Choix ${i + 1}`} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          </div>
        ))}
        <div className="flex items-center gap-3">
          <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          <input ref={fileRef} type="file" accept="audio/*" className="flex-1 text-sm" />
        </div>
        <button onClick={upload} disabled={busy} className="btn-primary w-full">{busy ? 'Envoi…' : 'Ajouter l\'extrait'}</button>
      </div>

      <div className="space-y-2">
        {tracks.map((t) => (
          <div key={t.id} className="card p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t.title}</span>
              <button onClick={() => remove(t.id)} className="text-candy-400">🗑</button>
            </div>
            <audio controls src={t.audio_url} className="mt-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
