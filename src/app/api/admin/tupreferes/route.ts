import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// GET → chaque dilemme avec le décompte des votes A / B (et le détail par famille)
export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const supabase = createAdminClient();

  const [{ data: questions }, { data: votes }] = await Promise.all([
    supabase.from('wyr_questions').select('*').order('created_at'),
    supabase.from('wyr_votes').select('question_id, choice, user:users(display_name, family:families(name, avatar))'),
  ]);

  const byQ: Record<string, any[]> = {};
  (votes as any[] | null)?.forEach((v) => {
    (byQ[v.question_id] ||= []).push(v);
  });

  const result = (questions as any[] | null)?.map((q) => {
    const list = byQ[q.id] ?? [];
    const a = list.filter((v) => v.choice === 'a');
    const b = list.filter((v) => v.choice === 'b');
    return {
      id: q.id,
      option_a: q.option_a,
      option_b: q.option_b,
      count_a: a.length,
      count_b: b.length,
      voters_a: a.map((v) => v.user?.display_name || 'Joueur'),
      voters_b: b.map((v) => v.user?.display_name || 'Joueur'),
    };
  }) ?? [];

  return NextResponse.json({ questions: result, total_votes: (votes as any[] | null)?.length ?? 0 });
}
