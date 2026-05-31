// Service Worker - Hazard Report PWA
// Versi cache — ubah angka ini setiap update aplikasi
const CACHE_NAME = 'hazard-report-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: simpan semua file ke cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first untuk assets, network-first untuk API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Request ke Google Apps Script — selalu pakai network (jangan dicache)
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(fetch(event.request).catch(() => new Response('offline', { status: 503 })));
    return;
  }

  // Untuk assets lokal: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Simpan ke cache jika berhasil
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
