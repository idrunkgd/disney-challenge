'use client';

import { useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/lib/admin-client';

interface Guess {
  id: string;
  guess: string;
  status: string;
  family?: { name: string; avatar: string };
}
interface Img {
  id: string;
  image_url: string;
  answer: string;
}

export default function MysteryAdminPage() {
  const [image, setImage] = useState<Img | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await adminFetch('/api/admin/mystery');
    const json = await res.json();
    setImage(json.image ?? null);
    setGuesses(json.guesses ?? []);
    if (json.image) setAnswer(json.image.answer ?? '');
  }
  useEffect(() => { load(); }, []);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setError('Choisissez une image.');
    setBusy(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    form.append('answer', answer);
    const res = await adminFetch('/api/admin/mystery', { method: 'POST', body: form });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setError(json.error || 'Erreur upload');
    if (fileRef.current) fileRef.current.value = '';
    await load();
  }

  async function validate(id: string, approve: boolean) {
    await adminFetch('/api/admin/mystery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess_id: id, approve }),
    });
    await load();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Image Mystère</h1>
      <p className="mb-4 text-sm text-white/50">
        Choisissez une image difficile à deviner. Elle se dévoile au fil des bonnes réponses au quiz (100 blocs).
      </p>

      <div className="card mb-5 space-y-3 p-4">
        <div className="font-semibold">Définir l'image mystère</div>
        {image && (
          <img src={image.image_url} alt="" className="max-h-48 rounded-xl" />
        )}
        <input type="file" accept="image/*" ref={fileRef} className="text-sm" />
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Réponse de référence (ex : Le Roi Lion) — visible admin uniquement"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2"
        />
        <button onClick={upload} disabled={busy} className="btn-primary w-full">
          {busy ? 'Envoi…' : image ? 'Remplacer l\'image' : 'Définir l\'image'}
        </button>
        {error && <p className="text-sm text-candy-400">⚠️ {error}</p>}
      </div>

      <h2 className="mb-2 font-semibold">Propositions des familles</h2>
      <div className="space-y-2">
        {guesses.length === 0 && <p className="text-white/50">Aucune proposition pour l'instant.</p>}
        {guesses.map((g) => (
          <div key={g.id} className="card p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">{g.family?.avatar} {g.family?.name}</span>
              <span className={`chip ${g.status === 'approved' ? 'bg-emerald-500/30 text-emerald-300' : g.status === 'rejected' ? 'bg-candy-500/30 text-candy-300' : 'bg-gold-500/20 text-gold-400'}`}>
                {g.status === 'approved' ? 'Validée' : g.status === 'rejected' ? 'Refusée' : 'En attente'}
              </span>
            </div>
            <div className="mt-1 text-lg font-semibold">« {g.guess} »</div>
            {g.status !== 'approved' && (
              <div className="mt-2 flex gap-2">
                <button onClick={() => validate(g.id, true)} className="btn-primary flex-1">Valider (+500)</button>
                <button onClick={() => validate(g.id, false)} className="btn-ghost flex-1">Refuser</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
