'use client';

import { AppShell } from '@/components/AppShell';
import { useSession } from '@/hooks/useSession';
import { useLeaderboard } from '@/hooks/useLeaderboard';

export default function LeaderboardPage() {
  const { session } = useSession();
  const { scores, loading } = useLeaderboard();
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <AppShell title="Classement">
      <div className="mb-4 text-center">
        <h1 className="title-magic text-2xl">Classement en direct</h1>
        <p className="text-xs text-white/50">Mis à jour automatiquement ⚡</p>
      </div>

      {loading && <p className="text-white/50">Chargement…</p>}

      {/* Podium */}
      {scores.length >= 3 && (
        <div className="mb-6 flex items-end justify-center gap-2">
          {[1, 0, 2].map((pos) => {
            const s = scores[pos];
            if (!s) return null;
            // hauteur par rang : 1er (pos 0) le plus haut, puis 2e, puis 3e
            const heights = ['h-28', 'h-20', 'h-16'];
            return (
              <div key={s.family_id} className="flex w-1/3 flex-col items-center">
                <div className="text-2xl">{s.avatar}</div>
                <div className="text-xl">{medals[pos]}</div>
                <div className={`mt-1 w-full rounded-t-xl bg-gradient-to-t from-magic-700 to-magic-500 ${heights[pos]} flex items-end justify-center pb-1 text-sm font-bold`}>
                  {s.total_points}
                </div>
                <div className="mt-1 truncate text-center text-[11px] text-white/70">{s.name}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {scores.map((s, i) => {
          const mine = s.family_id === session?.family_id;
          return (
            <div
              key={s.family_id}
              className={`card flex items-center gap-3 p-3 ${mine ? 'ring-2 ring-gold-400' : ''}`}
            >
              <div className="w-8 text-center text-lg font-bold">{medals[i] ?? i + 1}</div>
              <div className="text-2xl">{s.avatar}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{s.name}</div>
                <div className="text-xs text-white/50">
                  {s.missions_completed} missions · {s.quiz_points} quiz
                </div>
              </div>
              <div className="text-xl font-extrabold text-gold-400">{s.total_points}</div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
