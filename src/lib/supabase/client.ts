'use client';

import { createBrowserClient } from '@supabase/ssr';

// Client Supabase côté navigateur (clé anonyme publique).
// Utilisé pour les lectures temps réel et le flux participant.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Instance partagée pour les composants client
let browserClient: ReturnType<typeof createClient> | null = null;
export function getSupabaseBrowser() {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}
