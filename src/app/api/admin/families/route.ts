import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// GET → liste des familles + leur mot de passe (admin uniquement)
export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const supabase = createAdminClient();
  const [{ data: families, error }, { data: secrets }] = await Promise.all([
    supabase.from('families').select('*').order('created_at'),
    supabase.from('family_secrets').select('family_id, password'),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const pw: Record<string, string> = {};
  (secrets as { family_id: string; password: string }[] | null)?.forEach((s) => (pw[s.family_id] = s.password));
  const merged = (families ?? []).map((f: any) => ({ ...f, password: pw[f.id] ?? '' }));
  return NextResponse.json({ families: merged });
}

// POST :
//   - création : { name, avatar, color, password }
//   - mise à jour mot de passe : { id, password }
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const { id, name, avatar, color, password } = await req.json();
  const supabase = createAdminClient();

  // Mise à jour du mot de passe d'une famille existante
  if (id) {
    const { error } = await supabase
      .from('family_secrets')
      .upsert({ family_id: id, password: password ?? '' }, { onConflict: 'family_id' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Création d'une nouvelle famille
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
  const { data: fam, error } = await supabase
    .from('families')
    .insert({ name, avatar: avatar || '🏰', color: color || '#6366f1' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (password) {
    await supabase.from('family_secrets').insert({ family_id: fam.id, password });
  }
  return NextResponse.json({ family: { ...fam, password: password ?? '' } });
}

// DELETE ?id=... → supprime une famille (le mot de passe part en cascade)
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
