import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { adminToken, ADMIN_COOKIE } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// Endpoint de diagnostic (ne révèle aucun secret, juste des booléens + l'URL publique).
// À visiter après s'être connecté à l'admin, pour vérifier l'état de l'authentification.
export async function GET() {
  const store = await cookies();
  const cookieVal = store.get(ADMIN_COOKIE)?.value;
  return NextResponse.json({
    admin_password_configured: !!process.env.ADMIN_PASSWORD,
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    anon_key_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service_role_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    admin_cookie_present: !!cookieVal,
    admin_cookie_matches: cookieVal === adminToken(),
    node_env: process.env.NODE_ENV,
  });
}
