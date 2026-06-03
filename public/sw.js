const CACHE_PREFIX = 'viagogo';
const STATIC_CACHE = `${CACHE_PREFIX}-static`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images`;
const API_CACHE = `${CACHE_PREFIX}-api`;
const PAGE_CACHE = `${CACHE_PREFIX}-pages`;

const PRECACHE_URLS = [
  '/',
  '/login',
  '/secure/myaccount/tickets',
  '/secure/myaccount/transfers',
  '/secure/myaccount/manage',
  '/secure/myaccount/personal-details',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url).then((res) => { if (res.ok) cache.put(url, res); }).catch(() => {})
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_PREFIX))
            .map((k) => caches.delete(k))
        )
      ),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) return;

  if (url.href.includes('script.google.com') || url.href.includes('googleusercontent.com')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|woff2?|ttf|svg|ico)(\?.*)?$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp)(\?.*)?$/) ||
    url.pathname.startsWith('/splash-') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname.startsWith('/favicon')
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithCache(request, PAGE_CACHE));
    return;
  }

  event.respondWith(networkFirstWithCache(request, `${CACHE_PREFIX}-default`));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.open(cacheName).then((c) => c.match(request));
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaqueredirect') {
      const c = await caches.open(cacheName);
      c.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithCache(request, cacheName) {
  const isGet = request.method === 'GET';
  try {
    const response = await fetch(request);
    if (isGet && (response.ok || response.type === 'opaqueredirect')) {
      const c = await caches.open(cacheName);
      c.put(request, response.clone());
    }
    return response;
  } catch {
    if (isGet) {
      const cached = await caches.open(cacheName).then((c) => c.match(request));
      if (cached) return cached;
    }
    if (request.mode === 'navigate') {
      const fallback = await caches.open(PAGE_CACHE).then((c) => c.match('/login'));
      if (fallback) return fallback;
    }
    return new Response(JSON.stringify({ error: 'No internet connection', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
