/* SNUXI Service Worker */

self.addEventListener('install', (_event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// 백엔드에서 Web Push를 보낼 때 처리 (향후 VAPID 연동 시 사용)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'SNUXI', body: event.data.text() };
  }

  const title = data.title || 'SNUXI';
  const options = {
    body: data.body || '새로운 알림이 있습니다.',
    icon: '/snuxi-logo.png',
    badge: '/snuxi-logo.png',
    tag: data.tag || 'snuxi-notification',
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 시 앱 창 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
