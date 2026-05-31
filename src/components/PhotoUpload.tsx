'use client';

import { useRef, useState } from 'react';
import { useSession } from '@/hooks/useSession';

// Composant d'upload de photo : capture/galerie → API /api/upload (stockage Supabase).
export function PhotoUpload({
  missionId,
  secretMissionId,
  onUploaded,
  label = 'Prendre / choisir une photo',
}: {
  missionId?: string;
  secretMissionId?: string;
  onUploaded?: () => void;
  label?: string;
}) {
  const { session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    if (!session) return;
    setBusy(true);
    setError('');
    setPreview(URL.createObjectURL(file));
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('family_id', session.family_id);
      form.append('user_id', session.user_id);
      if (missionId) form.append('mission_id', missionId);
      if (secretMissionId) form.append('secret_mission_id', secretMissionId);

      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur upload');
      setDone(true);
      onUploaded?.();
    } catch (e: any) {
      setError(e.message ?? 'Échec de l\'envoi');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card p-4 text-center">
        {preview && <img src={preview} alt="" className="mx-auto mb-3 max-h-56 rounded-xl" />}
        <p className="font-semibold text-emerald-400">Photo envoyée ✓</p>
        <p className="text-sm text-white/60">En attente de validation par l'organisateur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {preview && <img src={preview} alt="" className="max-h-56 w-full rounded-xl object-cover" />}
      <button onClick={() => inputRef.current?.click()} disabled={busy} className="btn-primary w-full">
        {busy ? 'Envoi…' : `📸 ${label}`}
      </button>
      {error && <p className="text-sm text-candy-400">{error}</p>}
    </div>
  );
}
