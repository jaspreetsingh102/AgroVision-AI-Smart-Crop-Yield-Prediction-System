const CACHE_NAME = 'agromarket-pwa-v6';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './seller-login.html',
  './seller-dashboard.html',
  './seller-products.html',
  './seller-orders.html',
  './seller-analytics.html',
  './seller-profile.html',
  './css/dashboard.css',
  './css/main.css',
  './css/seller-auth.css',
  './js/seller-products.js',
  './js/seller-analytics.js',
  './js/supabase-config.js',
  './js/auth.js',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Add activate event to clear out the old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
