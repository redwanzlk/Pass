// Service worker de Planning PASS.
// IMPORTANT : incrémente CACHE_NAME (ex. 'planning-pass-v2') à chaque fois que tu
// republies une nouvelle version d'index.html, sinon les visiteurs risquent de
// continuer à voir une version mise en cache pendant un moment.
const CACHE_NAME = 'planning-pass-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stratégie : on sert le cache immédiatement si dispo (rapide, marche hors-ligne),
// tout en revalidant en arrière-plan avec le réseau pour la prochaine visite.
// Les requêtes vers d'autres origines (ex. Google Fonts) ne sont pas interceptées :
// elles partent directement au réseau, sans jamais faire planter l'appli hors-ligne.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
