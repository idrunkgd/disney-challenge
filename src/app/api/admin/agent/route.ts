import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// GET → liste des 100 missions + état par joueur (mission courante, fait/en cours, nb réussies)
export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const supabase = createAdminClient();

  const [{ data: missions }, { data: users }, { data: assigns }] = await Promise.all([
    supabase.from('agent_missions').select('*').order('points').order('title'),
    supabase.from('users').select('id, display_name, family:families(name, avatar)'),
    supabase
      .from('agent_assignments')
      .select('user_id, done, created_at, mission:agent_missions(title, points)')
      .order('created_at', { ascending: false }),
  ]);

  const byUser: Record<string, any[]> = {};
  (assigns as any[] | null)?.forEach((a) => {
    (byUser[a.user_id] ||= []).push(a);
  });

  const players = (users as any[] | null)?.map((u) => {
    const list = byUser[u.id] ?? [];
    const current = list[0] ?? null; // le plus récent
    const doneCount = list.filter((a) => a.done).length;
    return {
      user_id: u.id,
      name: u.display_name,
      family: u.family,
      current_title: current?.mission?.title ?? null,
      current_done: current?.done ?? null,
      done_count: doneCount,
    };
  }) ?? [];

  return NextResponse.json({ missions, players });
}

// POST { user_id } → assigne une nouvelle mission au joueur
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: 'user_id requis' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.rpc('admin_assign_agent', { p_user_id: user_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
