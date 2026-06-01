import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// GET → image active + propositions des familles (avec nom)
export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const supabase = createAdminClient();
  const [{ data: image }, { data: guesses }] = await Promise.all([
    supabase.from('mystery_image').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('mystery_guesses').select('*, family:families(name, avatar)').order('created_at'),
  ]);
  return NextResponse.json({ image, guesses });
}

// POST multipart : file (image) + answer  → définit la nouvelle image mystère
// POST json : { guess_id, approve }       → valide / refuse une proposition
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const supabase = createAdminClient();
  const ctype = req.headers.get('content-type') || '';

  if (ctype.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const answer = (form.get('answer') as string) || '';
    if (!file) return NextResponse.json({ error: 'Image requise' }, { status: 400 });

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `mystery/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage.from('photos').upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
    });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    const { data: pub } = supabase.storage.from('photos').getPublicUrl(path);

    // Désactive les anciennes, insère la nouvelle active
    await supabase.from('mystery_image').update({ is_active: false }).eq('is_active', true);
    const { data, error } = await supabase
      .from('mystery_image')
      .insert({ image_url: pub.publicUrl, answer, is_active: true })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ image: data });
  }

  // Validation d'une proposition
  const { guess_id, approve } = await req.json();
  const { data, error } = await supabase
    .from('mystery_guesses')
    .update({ status: approve ? 'approved' : 'rejected' })
    .eq('id', guess_id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guess: data });
}
