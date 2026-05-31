import { createClient } from '@supabase/supabase-js';

// Client Supabase "service role" — UNIQUEMENT côté serveur (API routes).
// Contourne la RLS : ne jamais importer dans un composant client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
