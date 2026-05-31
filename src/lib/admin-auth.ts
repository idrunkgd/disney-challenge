import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE = 'dasolabs_admin';

// Jeton dérivé du mot de passe (suffisant pour un événement privé d'une journée).
export function adminToken() {
  return Buffer.from(`admin:${process.env.ADMIN_PASSWORD}`).toString('base64');
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE)?.value === adminToken();
}

// À utiliser en tête des routes admin protégées.
export async function requireAdmin(): Promise<NextResponse | null> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  return null;
}

export { COOKIE as ADMIN_COOKIE };
