// Service worker do curso: precache de todos os assets (offline) + cache-first.
// Bump CACHE quando publicar assets novos.
const CACHE = 'shaders-v1';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const list = await (await fetch('precache.json', { cache: 'no-cache' })).json();
    // inclui o proprio scope ('./') p/ a navegacao raiz funcionar offline
    await cache.addAll(['./', ...list]);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    try {
      return await fetch(e.request);
    } catch {
      // navegacao offline sem cache -> cai na index cacheada
      if (e.request.mode === 'navigate') {
        const idx = await caches.match('./');
        if (idx) return idx;
      }
      throw new Error('offline e fora do cache');
    }
  })());
});
