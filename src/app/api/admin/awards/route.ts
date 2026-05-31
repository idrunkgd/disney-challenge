import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('awards')
    .select('*, family:families(*)')
    .order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ awards: data });
}

// POST { id, family_id?, winner_name?, announced? } → désigne le gagnant / révèle
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const { id, family_id, winner_name, announced } = await req.json();
  const supabase = createAdminClient();
  const patch: Record<string, unknown> = {};
  if (family_id !== undefined) patch.family_id = family_id;
  if (winner_name !== undefined) patch.winner_name = winner_name;
  if (announced !== undefined) patch.announced = announced;
  const { data, error } = await supabase.from('awards').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ award: data });
}
