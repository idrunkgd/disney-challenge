import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('blind_tracks').select('*').order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tracks: data });
}

// POST multipart : file (audio), title, options (JSON string), correct_index, points
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const title = form.get('title') as string;
  const options = JSON.parse((form.get('options') as string) || '[]');
  const correct_index = Number(form.get('correct_index') ?? 0);
  const points = Number(form.get('points') ?? 20);

  if (!file || !title) return NextResponse.json({ error: 'Fichier et titre requis' }, { status: 400 });

  const supabase = createAdminClient();
  const ext = file.name.split('.').pop() || 'mp3';
  const path = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from('audio')
    .upload(path, buffer, { contentType: file.type || 'audio/mpeg' });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = supabase.storage.from('audio').getPublicUrl(path);
  const { data, error } = await supabase
    .from('blind_tracks')
    .insert({ title, audio_url: pub.publicUrl, options, correct_index, points })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ track: data });
}

export async function DELETE(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from('blind_tracks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
