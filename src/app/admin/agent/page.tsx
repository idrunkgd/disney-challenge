'use client';

import { useEffect, useState } from 'react';

interface Player {
  user_id: string;
  name: string;
  family?: { name: string; avatar: string };
  current_title: string | null;
  current_done: boolean | null;
  done_count: number;
}
interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
}

const diffLabel: Record<string, string> = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };

export default function AgentAdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [showList, setShowList] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin/agent');
    const json = await res.json();
    setPlayers(json.players ?? []);
    setMissions(json.missions ?? []);
  }
  useEffect(() => { load(); }, []);

  async function assign(userId: string) {
    setBusy(userId);
    await fetch('/api/admin/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    await load();
    setBusy(null);
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Agent Secret</h1>
      <p className="mb-4 text-sm text-white/50">
        Chaque joueur a une mission. Quand il l'a faite, donne-lui-en une nouvelle (les points restent acquis).
      </p>

      <h2 className="mb-2 font-semibold">Joueurs</h2>
      <div className="space-y-2">
        {players.length === 0 && <p className="text-white/50">Aucun joueur connecté pour l'instant.</p>}
        {players.map((p) => (
          <div key={p.user_id} className="card p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm text-white/60">{p.family?.avatar} {p.family?.name} · {p.name}</div>
                <div className="truncate font-medium">
                  {p.current_title ?? <span className="text-white/40">Pas encore de mission</span>}
                </div>
              </div>
              <div className="ml-2 shrink-0 text-right">
                {p.current_done === true && <span className="chip bg-emerald-500/30 text-emerald-300">Faite ✓</span>}
                {p.current_done === false && <span className="chip bg-gold-500/20 text-gold-400">En cours</span>}
                <div className="mt-1 text-[10px] text-white/40">{p.done_count} réussie(s)</div>
              </div>
            </div>
            <button onClick={() => assign(p.user_id)} disabled={busy === p.user_id} className="btn-primary mt-2 w-full">
              {busy === p.user_id ? 'Attribution…' : '🎲 Assigner une nouvelle mission'}
            </button>
          </div>
        ))}
      </div>

      <button onClick={() => setShowList((s) => !s)} className="btn-ghost mt-5 w-full">
        {showList ? 'Masquer' : 'Voir'} la liste des {missions.length} missions
      </button>
      {showList && (
        <div className="mt-3 space-y-1.5">
          {missions.map((m) => (
            <div key={m.id} className="card p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.title}</span>
                <span className="chip">{diffLabel[m.difficulty] ?? m.difficulty} · {m.points} pts</span>
              </div>
              <div className="mt-0.5 text-xs text-white/60">{m.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
