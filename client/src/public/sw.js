// Deenlearn service worker: the app opens offline, Quran text is kept, and lessons you have opened can be read again.
const VERSION = 'deenlearn-v1';
const SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function cacheFirst(request) {
  return caches.open(VERSION).then((cache) =>
    cache.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
    )
  );
}

// Lessons: always try the network first, keep the last copy for offline reading
function networkFirst(request) {
  return caches.open(VERSION).then((cache) =>
    fetch(request)
      .then((res) => {
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
      .catch(() => cache.match(request))
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Quran text and translation never change: keep them
  if (url.hostname === 'api.alquran.cloud') {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Lessons (content only). Other API data is per user and is never cached here.
  if (url.pathname.startsWith('/api/lessons/') || /^\/api\/courses\/[^/]+\/lessons$/.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.startsWith('/api/')) return;

  // Pages: the app shell when offline
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
    return;
  }
  if (url.pathname.startsWith('/assets/')) event.respondWith(cacheFirst(request));
});
