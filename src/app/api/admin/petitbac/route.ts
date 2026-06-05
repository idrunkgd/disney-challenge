import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// GET → manche active + soumissions des familles
export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const supabase = createAdminClient();
  const { data: round } = await supabase
    .from('petitbac_rounds')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let subs: any[] = [];
  if (round) {
    const { data } = await supabase
      .from('petitbac_submissions')
      .select('*, family:families(name, avatar)')
      .eq('round_id', round.id)
      .order('created_at');
    subs = data ?? [];
  }
  return NextResponse.json({ round, submissions: subs });
}

// POST { action: 'launch', letter } → nouvelle manche active
// POST { action: 'validate', submission_id, approve, points } → valide une grille
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const body = await req.json();
  const supabase = createAdminClient();

  if (body.action === 'launch') {
    const letter = (body.letter || 'A').toString().toUpperCase().slice(0, 1);
    await supabase.from('petitbac_rounds').update({ is_active: false }).eq('is_active', true);
    const { data, error } = await supabase
      .from('petitbac_rounds')
      .insert({ letter, is_active: true })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ round: data });
  }

  if (body.action === 'validate') {
    const { submission_id, approve, points } = body;
    const { error } = await supabase
      .from('petitbac_submissions')
      .update({ status: approve ? 'approved' : 'rejected', points: approve ? Number(points) || 0 : 0 })
      .eq('id', submission_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
