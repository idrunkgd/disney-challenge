import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// GET → liste des familles
export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('families').select('*').order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ families: data });
}

// POST { name, avatar, color } → crée une famille (jeton QR auto)
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const { name, avatar, color } = await req.json();
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('families')
    .insert({ name, avatar: avatar || '🏰', color: color || '#6366f1' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ family: data });
}

// DELETE ?id=... → supprime une famille
export async function DELETE(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from('families').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
