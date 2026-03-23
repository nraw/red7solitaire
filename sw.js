const CACHE_NAME = 'red7-solitaire';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(e.request);
      const fetched = fetch(e.request).then(async response => {
        if (response.ok) {
          const old = await cache.match(e.request);
          await cache.put(e.request, response.clone());
          if (old) {
            const oldBody = await old.text();
            const newBody = await (await cache.match(e.request)).text();
            if (oldBody !== newBody) {
              self.clients.matchAll().then(clients =>
                clients.forEach(c => c.postMessage({ type: 'updated' }))
              );
            }
          }
        }
        return response;
      }).catch(() => {});
      return cached || fetched;
    })
  );
});
