import { NextRequest, NextResponse } from 'next/server';
import { adminToken, ADMIN_COOKIE } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// POST { password } → pose le cookie admin si le mot de passe correspond.
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD n'est pas configuré sur le serveur (variable d'environnement Vercel manquante)." },
      { status: 500 }
    );
  }
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
  });
  return res;
}

// DELETE → déconnexion
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
