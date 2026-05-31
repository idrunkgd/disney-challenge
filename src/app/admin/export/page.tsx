'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Award, Family, FamilyScore, Photo } from '@/lib/types';

// Page souvenir imprimable → "Imprimer" puis "Enregistrer en PDF".
export default function ExportPage() {
  const [scores, setScores] = useState<FamilyScore[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [awards, setAwards] = useState<(Award & { family?: Family })[]>([]);
  const [stats, setStats] = useState({ families: 0, photos: 0, missions: 0, votes: 0 });

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const [{ data: sc }, { data: ph }, { data: aw }, { count: subCount }, { count: voteCount }] =
        await Promise.all([
          supabase.from('family_scores').select('*').order('total_points', { ascending: false }),
          supabase.from('photos').select('*').order('created_at', { ascending: false }),
          supabase.from('awards').select('*, family:families(*)').eq('announced', true),
          supabase.from('mission_submissions').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
          supabase.from('votes').select('*', { count: 'exact', head: true }),
        ]);
      const s = (sc as FamilyScore[]) ?? [];
      setScores(s);
      setPhotos((ph as Photo[]) ?? []);
      setAwards((aw as any) ?? []);
      setStats({ families: s.length, photos: (ph?.length ?? 0), missions: subCount ?? 0, votes: voteCount ?? 0 });
    })();
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Export souvenir</h1>
        <button onClick={() => window.print()} className="btn-gold">📄 Générer le PDF (Imprimer → PDF)</button>
      </div>

      {/* Document souvenir */}
      <div className="souvenir mx-auto max-w-2xl rounded-2xl bg-white p-8 text-magic-950">
        <div className="text-center">
          <div className="text-5xl">🏰</div>
          <h2 className="mt-2 text-3xl font-extrabold text-magic-700">DASOLABS DISNEY CHALLENGE</h2>
          <p className="text-magic-500">Livre d'or de la journée · Disneyland Paris</p>
        </div>

        <div className="my-6 grid grid-cols-4 gap-3 text-center">
          {[
            { k: stats.families, l: 'Familles' },
            { k: stats.missions, l: 'Missions validées' },
            { k: stats.photos, l: 'Photos' },
            { k: stats.votes, l: 'Votes' },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-magic-50 p-3">
              <div className="text-2xl font-extrabold text-magic-700">{s.k}</div>
              <div className="text-[10px] uppercase text-magic-400">{s.l}</div>
            </div>
          ))}
        </div>

        <h3 className="mb-2 text-lg font-bold text-magic-700">🏆 Classement final</h3>
        <table className="mb-6 w-full text-sm">
          <tbody>
            {scores.map((s, i) => (
              <tr key={s.family_id} className="border-b border-magic-100">
                <td className="py-1.5 pr-2">{medals[i] ?? `#${i + 1}`}</td>
                <td className="py-1.5">{s.avatar} {s.name}</td>
                <td className="py-1.5 text-right font-bold text-magic-700">{s.total_points} pts</td>
              </tr>
            ))}
          </tbody>
        </table>

        {awards.length > 0 && (
          <>
            <h3 className="mb-2 text-lg font-bold text-magic-700">⭐ Palmarès des Awards</h3>
            <div className="mb-6 grid grid-cols-2 gap-2">
              {awards.map((a) => (
                <div key={a.id} className="rounded-lg bg-gold-400/20 p-3">
                  <div className="text-[10px] uppercase text-magic-400">{a.category}</div>
                  <div className="font-bold">{a.family?.name ?? a.winner_name}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className="mb-2 text-lg font-bold text-magic-700">📸 Souvenirs en images</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {photos.slice(0, 24).map((p) => (
            <img key={p.id} src={p.public_url} alt="" className="aspect-square w-full rounded object-cover" />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-magic-400">
          Généré le {new Date().toLocaleDateString('fr-FR')} · Dasolabs ✨
        </p>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          nav, header, .print\\:hidden { display: none !important; }
          .souvenir { box-shadow: none; max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
