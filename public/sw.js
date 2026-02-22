const CACHE_NAME = 'xcrol-v2';
const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/favicon.ico',
  '/manifest.json',
  '/og-image.png',
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Check if a URL points to a Vite hashed asset (contains content hash in filename)
function isHashedAsset(url) {
  return url.pathname.startsWith('/assets/') && /[-_.][a-zA-Z0-9]{6,}\.\w+$/.test(url.pathname);
}

// Fetch handler with tiered caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Never intercept .well-known paths (NIP-05, etc.) — serve directly from origin
  if (url.pathname.startsWith('/.well-known/')) return;

  // Network-first for API calls (Supabase, edge functions, dynamic data)
  if (
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/functions/') ||
    url.hostname.includes('supabase')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first with immutable treatment for hashed assets (/assets/*)
  // These filenames change on every build, so they're safe to cache forever
  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for unhashed static files (favicon, audio, og-image, etc.)
  // Serve cached version instantly, then update cache in background
  if (
    url.pathname.startsWith('/audio/') ||
    url.pathname.startsWith('/video/') ||
    url.pathname === '/favicon.png' ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/og-image.png' ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: network-first for navigation and other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
