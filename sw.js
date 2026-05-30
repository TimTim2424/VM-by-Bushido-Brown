const CACHE_NAME = 'vmtips-2026-v1';

// Filer att cacha för offline-stöd
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/bakgrund.png',
  '/pokal.png',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap'
];

// Installera service worker och cacha statiska filer
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Kunde inte cacha alla filer:', err);
      });
    })
  );
  self.skipWaiting();
});

// Aktivera och rensa gamla cacher
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Hämta filer – nätverk först, cache som backup
self.addEventListener('fetch', (event) => {
  // Skippa Firebase-anrop (de ska alltid gå via nätverk)
  if (event.request.url.includes('firestore') ||
      event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis.com/identitytoolkit')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Spara en kopia i cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Om nätverk saknas, använd cache
        return caches.match(event.request);
      })
  );
});
