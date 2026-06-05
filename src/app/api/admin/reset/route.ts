import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// POST /api/admin/reset
// Remet scores + avancement à zéro et supprime toutes les photos (table + stockage).
// Conserve : familles, missions, questions de quiz, badges.
export async function POST() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const supabase = createAdminClient();
  const ALL = '00000000-0000-0000-0000-000000000000'; // filtre "tout sauf cet id impossible"

  try {
    // 1) Supprimer les fichiers du bucket "photos"
    const { data: photos } = await supabase.from('photos').select('storage_path');
    const paths = (photos as { storage_path: string }[] | null)?.map((p) => p.storage_path) ?? [];
    if (paths.length) {
      await supabase.storage.from('photos').remove(paths);
    }

    // 2) Vider les tables d'avancement (l'ordre évite les soucis de clés étrangères)
    await supabase.from('mission_submissions').delete().neq('id', ALL);
    await supabase.from('quiz_answers').delete().neq('id', ALL);
    await supabase.from('blind_answers').delete().neq('id', ALL);
    await supabase.from('votes').delete().neq('id', ALL);
    await supabase.from('creative_attractions').delete().neq('id', ALL);
    await supabase.from('secret_missions').delete().neq('id', ALL);
    await supabase.from('mystery_guesses').delete().neq('id', ALL);
    await supabase.from('bingo_completions').delete().neq('id', ALL);
    await supabase.from('hangman_solved').delete().neq('id', ALL);
    await supabase.from('wyr_votes').delete().neq('id', ALL);
    await supabase.from('photos').delete().neq('id', ALL);

    return NextResponse.json({ ok: true, photosDeleted: paths.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur réinitialisation' }, { status: 500 });
  }
}
