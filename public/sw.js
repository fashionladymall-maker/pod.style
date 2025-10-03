const STATIC_CACHE = 'pod-style-static-v1';
const DYNAMIC_CACHE = 'pod-style-dynamic-v1';
const PRECACHE_URLS = ['/', '/manifest.json'];
const REMOTE_CACHE_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'lh3.googleusercontent.com',
  'images.unsplash.com',
  'picsum.photos',
  'placehold.co',
]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
              return caches.delete(key);
            }
            return undefined;
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const isStaticAsset = (url) => {
  return /\.(?:js|css|woff2?|ttf|png|jpg|jpeg|gif|svg|webp|avif|ico)$/.test(url.pathname);
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isAllowedRemote = REMOTE_CACHE_HOSTS.has(url.hostname);

  if (!isSameOrigin && !isAllowedRemote) {
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return caches.open(STATIC_CACHE).then((cache) =>
          fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cachedResponse ?? fetch(request)),
        );
      }),
    );
    return;
  }

  const isApiRequest = isSameOrigin && url.pathname.startsWith('/api/');

  if (isApiRequest) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone()).catch(() => undefined);
            }
            return response;
          })
          .catch(() => undefined);

        if (cachedResponse) {
          event.waitUntil(networkFetch);
          return cachedResponse;
        }

        const networkResponse = await networkFetch;
        if (networkResponse) {
          return networkResponse;
        }

        return cachedResponse ?? Response.error();
      }),
    );
    return;
  }

  event.respondWith(
    caches.open(DYNAMIC_CACHE).then((cache) =>
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cache.match(request)),
    ),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
