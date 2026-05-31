import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// POST /api/upload
// FormData : file, family_id, user_id, [mission_id], [secret_mission_id]
// → stocke la photo dans le bucket "photos", crée la ligne photos,
//   puis crée/maj une mission_submission (statut "pending") ou met à jour la mission secrète.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const familyId = form.get('family_id') as string | null;
    const userId = (form.get('user_id') as string) || null;
    const missionId = (form.get('mission_id') as string) || null;
    const secretMissionId = (form.get('secret_mission_id') as string) || null;

    if (!file || !familyId) {
      return NextResponse.json({ error: 'Fichier ou famille manquant' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${familyId}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabase.storage
      .from('photos')
      .upload(path, buffer, { contentType: file.type || 'image/jpeg', upsert: false });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from('photos').getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { data: photo, error: phErr } = await supabase
      .from('photos')
      .insert({
        family_id: familyId,
        user_id: userId,
        mission_id: missionId,
        storage_path: path,
        public_url: publicUrl,
      })
      .select()
      .single();
    if (phErr) throw phErr;

    if (missionId) {
      // upsert sur (mission_id, family_id) — réinitialise en "pending" si refusée auparavant
      await supabase
        .from('mission_submissions')
        .upsert(
          {
            mission_id: missionId,
            family_id: familyId,
            user_id: userId,
            photo_id: photo.id,
            status: 'pending',
            points_awarded: 0,
            comment: null,
            reviewed_at: null,
          },
          { onConflict: 'mission_id,family_id' }
        );
    }

    if (secretMissionId) {
      await supabase
        .from('secret_missions')
        .update({ photo_id: photo.id, status: 'pending' })
        .eq('id', secretMissionId);
    }

    return NextResponse.json({ ok: true, photo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
