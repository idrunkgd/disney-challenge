'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { FamilyScore } from '@/lib/types';

// Classement en temps réel : lit la vue family_scores et se rafraîchit
// à chaque changement sur les tables qui impactent le score (Realtime).
export function useLeaderboard() {
  const [scores, setScores] = useState<FamilyScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from('family_scores')
      .select('*')
      .order('total_points', { ascending: false });
    setScores((data as FamilyScore[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchScores();
    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_submissions' }, fetchScores)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_answers' }, fetchScores)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'secret_missions' }, fetchScores)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchScores]);

  return { scores, loading, refresh: fetchScores };
}
