'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Family } from '@/lib/types';

export default function QrCodesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [qrs, setQrs] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/families');
      const json = await res.json();
      const list: Family[] = json.families ?? [];
      setFamilies(list);
      const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const map: Record<string, string> = {};
      for (const f of list) {
        const url = `${base}/login?token=${encodeURIComponent(f.access_token)}`;
        map[f.id] = await QRCode.toDataURL(url, { width: 320, margin: 2 });
      }
      setQrs(map);
    })();
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">QR Codes de connexion</h1>
        <button onClick={() => window.print()} className="btn-gold">🖨 Imprimer</button>
      </div>
      <p className="mb-4 text-sm text-white/50 print:hidden">
        Chaque famille scanne son QR pour se connecter automatiquement (sans mot de passe).
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {families.map((f) => (
          <div key={f.id} className="card flex flex-col items-center p-6 text-center">
            <div className="text-3xl">{f.avatar}</div>
            <div className="mt-1 text-lg font-bold">{f.name}</div>
            {qrs[f.id] ? (
              <img src={qrs[f.id]} alt={`QR ${f.name}`} className="mt-3 rounded-lg bg-white p-2" />
            ) : (
              <div className="mt-3 h-40 w-40 animate-pulse rounded-lg bg-white/10" />
            )}
            <div className="mt-2 break-all text-[10px] text-white/40">{f.access_token}</div>
          </div>
        ))}
      </div>
      {families.length === 0 && <p className="text-white/50">Créez d'abord des familles.</p>}
    </div>
  );
}
