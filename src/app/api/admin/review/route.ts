import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// POST { submission_id, approve, comment?, type? }
// type = 'mission' (défaut) | 'secret'
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { submission_id, approve, comment, type = 'mission' } = await req.json();
  const supabase = createAdminClient();

  if (type === 'secret') {
    const { data, error } = await supabase
      .from('secret_missions')
      .update({ status: approve ? 'approved' : 'rejected' })
      .eq('id', submission_id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data });
  }

  // Mission classique → RPC qui attribue les points
  const { data, error } = await supabase.rpc('review_submission', {
    p_submission_id: submission_id,
    p_approve: approve,
    p_comment: comment ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
