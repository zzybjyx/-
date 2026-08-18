const CACHE_NAME = 'saving-workbench-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './saving-workbench-prototype.html',
  './saving-workbench.html',
  './manifest.webmanifest',
  './icon-192.svg',
  './icon-512.svg'
];
const OFFLINE_FALLBACK = './saving-workbench-prototype.html';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS_TO_CACHE);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch {
      const fallback = await caches.match(OFFLINE_FALLBACK);
      return fallback || new Response('离线不可用，请连接网络后再试', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
