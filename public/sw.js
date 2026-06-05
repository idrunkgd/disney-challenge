// Service worker minimal pour rendre la PWA installable + cache "app shell"
const CACHE = 'dasolabs-disney-v3';
const APP_SHELL = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stratégie : réseau d'abord, repli sur le cache (pour rester utilisable en faible réseau dans le parc)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;
  // On ne met jamais en cache les appels Supabase (données dynamiques)
  if (request.url.includes('supabase.co')) return;
  // Ni les routes API internes (auth admin, etc.) — toujours réseau, jamais de cache
  try {
    if (new URL(request.url).pathname.startsWith('/api/')) return;
  } catch {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(request))
  );
});
