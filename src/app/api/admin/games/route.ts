import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// GET → état ouvert/clôturé de chaque jeu
export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('game_state').select('*').order('game');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ games: data });
}

// POST { game, is_open } → ouvrir / clôturer un jeu
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const { game, is_open } = await req.json();
  if (!game) return NextResponse.json({ error: 'game requis' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('game_state')
    .upsert({ game, is_open: !!is_open }, { onConflict: 'game' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
