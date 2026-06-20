/* BrandFlow service worker — Web Push (M1.2).
   Mostra o alerta do slot como notificação de sistema e abre /stories ao clicar. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { title: 'BrandFlow', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'BrandFlow';
  const options = {
    body: data.body || '',
    tag: data.data && data.data.story_task_id ? `story-${data.data.story_task_id}` : undefined,
    data: { url: data.url || '/stories' },
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/stories';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
