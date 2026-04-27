const CACHE_NAME = 'outmeets-shell-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  // Skip API requests and Chrome extension URLs
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return;
  if (url.protocol === 'chrome-extension:') return;
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'OutMeets', body: event.data.text() };
  }
  const title = data.title || 'OutMeets';
  const body = data.body || '';
  const url = data.url || '/';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'outmeets-notification',
      renotify: true,
    })
  );
});

// Deep-link: focus existing tab or open new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to find an existing OutMeets tab and navigate it
      for (const client of windowClients) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            return client.focus().then((focused) => {
              if (focused) {
                // postMessage lets the React app navigate via React Router.
                // This is more reliable than WindowClient.navigate() on iOS PWA,
                // which can silently fail or navigate to the wrong URL.
                focused.postMessage({ type: 'SW_NAVIGATE', url: targetUrl });
              }
              return focused;
            });
          }
        } catch (e) {
          // ignore malformed URLs
        }
      }
      // No existing tab found — open a new one
      return clients.openWindow(targetUrl);
    })
  );
});
