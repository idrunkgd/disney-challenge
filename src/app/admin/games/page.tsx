'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-client';

interface GameState { game: string; is_open: boolean }

const LABELS: Record<string, { icon: string; name: string }> = {
  quiz: { icon: '🧠', name: 'Quiz' },
  mystery: { icon: '🖼️', name: 'Image Mystère' },
  pendu: { icon: '🪢', name: 'Le Pendu' },
};

export default function GamesAdminPage() {
  const [games, setGames] = useState<GameState[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await adminFetch('/api/admin/games');
    const json = await res.json();
    setGames(json.games ?? []);
  }
  useEffect(() => { load(); }, []);

  async function toggle(game: string, is_open: boolean) {
    setBusy(game);
    await adminFetch('/api/admin/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, is_open }),
    });
    await load();
    setBusy(null);
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Ouvrir / Clôturer les jeux</h1>
      <p className="mb-4 text-sm text-white/50">
        Quand un jeu est <b>clôturé</b>, les familles ne peuvent plus répondre — les points déjà gagnés restent acquis.
      </p>

      <div className="space-y-2">
        {games.map((g) => {
          const l = LABELS[g.game] ?? { icon: '🎮', name: g.game };
          return (
            <div key={g.game} className="card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{l.icon}</span>
                <div>
                  <div className="font-semibold">{l.name}</div>
                  <div className={`text-xs ${g.is_open ? 'text-emerald-400' : 'text-candy-400'}`}>
                    {g.is_open ? 'Ouvert ✓' : 'Clôturé 🔒'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggle(g.game, !g.is_open)}
                disabled={busy === g.game}
                className={g.is_open ? 'btn-ghost' : 'btn-primary'}
              >
                {busy === g.game ? '…' : g.is_open ? 'Clôturer' : 'Rouvrir'}
              </button>
            </div>
          );
        })}
        {games.length === 0 && (
          <div className="card p-6 text-center text-white/60">
            Lance d'abord le script SQL (table game_state) pour activer ce panneau.
          </div>
        )}
      </div>
    </div>
  );
}
