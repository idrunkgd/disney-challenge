'use client';

// Auth admin côté client : le mot de passe est mémorisé après connexion et envoyé
// dans l'en-tête x-admin-password à chaque appel admin. Robuste (pas de cookie).
const KEY = 'dasolabs_admin_pw';

export function setAdminPw(pw: string) {
  localStorage.setItem(KEY, pw);
}
export function getAdminPw(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(KEY) || '';
}
export function clearAdminPw() {
  localStorage.removeItem(KEY);
}

// fetch avec l'en-tête d'authentification admin
export function adminFetch(url: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers);
  headers.set('x-admin-password', getAdminPw());
  return fetch(url, { ...opts, headers });
}
