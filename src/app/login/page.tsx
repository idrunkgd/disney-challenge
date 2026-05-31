'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { Html5Qrcode } from 'html5-qrcode';

function LoginInner() {
  const { session, login } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Connexion auto si ?token=... présent dans l'URL (lien du QR code)
  useEffect(() => {
    const t = params.get('token');
    if (t && !session) setToken(t);
  }, [params, session]);

  useEffect(() => {
    if (session) router.replace('/');
  }, [session, router]);

  async function doLogin(tk: string) {
    setBusy(true);
    setError('');
    try {
      await login(tk.trim(), name.trim() || 'Participant');
      router.replace('/');
    } catch (e: any) {
      // On affiche la vraie cause pour faciliter le diagnostic.
      console.error('[login] échec connexion :', e);
      const msg = e?.message || String(e);
      if (msg.includes('INVALID_TOKEN')) {
        setError("Ce code famille n'existe pas. Vérifiez le QR code auprès de l'organisateur.");
      } else if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        setError("Connexion à Supabase impossible : vérifiez NEXT_PUBLIC_SUPABASE_URL et la clé anon dans .env.local.");
      } else if (msg.toLowerCase().includes('jwt') || msg.toLowerCase().includes('api key') || msg.includes('401')) {
        setError("Clé Supabase invalide : vérifiez NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local.");
      } else {
        setError(`Erreur : ${msg}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function startScan() {
    setScanning(true);
    setError('');
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          // Le QR contient une URL ...?token=XXX ou directement le jeton
          let tk = decoded;
          try {
            const u = new URL(decoded);
            tk = u.searchParams.get('token') ?? decoded;
          } catch {
            /* pas une URL, on garde la valeur brute */
          }
          stopScan();
          doLogin(tk);
        },
        () => {}
      );
    } catch {
      setError("Impossible d'accéder à la caméra. Saisissez le code manuellement.");
      setScanning(false);
    }
  }

  function stopScan() {
    scannerRef.current?.stop().catch(() => {});
    scannerRef.current?.clear();
    setScanning(false);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10">
      <div className="animate-float text-6xl">🏰</div>
      <h1 className="title-magic mt-4 text-center text-3xl">DASOLABS<br />DISNEY CHALLENGE</h1>
      <p className="mt-2 text-center text-sm text-white/60">
        Scannez le QR code de votre famille pour rejoindre l'aventure.
      </p>

      <div className="card mt-8 w-full max-w-sm space-y-4 p-6">
        <label className="block text-sm font-medium">
          Votre prénom (optionnel)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Gérald"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-magic-400"
          />
        </label>

        {scanning ? (
          <div className="space-y-3">
            <div id="qr-reader" className="overflow-hidden rounded-xl" />
            <button onClick={stopScan} className="btn-ghost w-full">
              Annuler le scan
            </button>
          </div>
        ) : (
          <button onClick={startScan} className="btn-primary w-full">
            📷 Scanner le QR code
          </button>
        )}

        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="h-px flex-1 bg-white/10" /> ou <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex gap-2">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Code famille"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-magic-400"
          />
          <button onClick={() => doLogin(token)} disabled={busy || !token} className="btn-gold">
            {busy ? '…' : 'Go'}
          </button>
        </div>

        {error && <p className="text-sm text-candy-400">{error}</p>}
      </div>

      <p className="mt-6 text-center text-xs text-white/40">
        Démo : codes <code>demo-mickey-token</code> ou <code>demo-stitch-token</code>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white/50">Chargement…</div>}>
      <LoginInner />
    </Suspense>
  );
}
