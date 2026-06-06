'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

// Renvoie true si le jeu est ouvert (par défaut ouvert si la table n'existe pas encore).
export function useGameOpen(game: 'quiz' | 'mystery' | 'pendu') {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const load = () =>
      supabase
        .from('game_state')
        .select('is_open')
        .eq('game', game)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setOpen(data.is_open);
        });
    load();
    const ch = supabase
      .channel(`gamestate-${game}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [game]);

  return open;
}
