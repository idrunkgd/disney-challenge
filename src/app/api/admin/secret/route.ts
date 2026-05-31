import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// Pool de missions secrètes tirées au sort
const POOL = [
  { title: 'Faire rire un inconnu', description: "Déclenchez le rire d'un parfait inconnu et capturez l'instant." },
  { title: 'La poussette rose', description: 'Obtenez une photo (avec accord) à côté d\'une poussette rose.' },
  { title: 'Né le même mois', description: 'Trouvez une personne née le même mois qu\'un membre de la famille.' },
  { title: 'Le chapeau le plus original', description: 'Photographiez le couvre-chef le plus fou du parc.' },
  { title: 'Pose de statue', description: 'Toute la famille imite une statue pendant 10 secondes.' },
  { title: 'High-five international', description: 'Tapez dans la main de quelqu\'un parlant une autre langue.' },
];

// POST { family_id } → assigne une mission secrète aléatoire à une famille
// POST {} (sans family_id) → assigne à TOUTES les familles qui n'en ont pas
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const supabase = createAdminClient();
  const body = await req.json().catch(() => ({}));

  let families: { id: string }[] = [];
  if (body.family_id) {
    families = [{ id: body.family_id }];
  } else {
    const { data } = await supabase.from('families').select('id');
    families = (data as { id: string }[]) ?? [];
  }

  const created: any[] = [];
  for (const f of families) {
    const { data: existing } = await supabase
      .from('secret_missions')
      .select('id')
      .eq('family_id', f.id)
      .maybeSingle();
    if (existing && !body.force) continue;
    const pick = POOL[Math.floor(Math.random() * POOL.length)];
    const { data } = await supabase
      .from('secret_missions')
      .insert({ family_id: f.id, title: pick.title, description: pick.description, points: 50 })
      .select()
      .single();
    if (data) created.push(data);
  }
  return NextResponse.json({ ok: true, created });
}
