/* eslint-disable no-undef */
importScripts(
  'https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyDstmPUOdXNOnWGQsjJsS6_M11SZWUtTFQ',
  authDomain: 'snuxi-project.firebaseapp.com',
  projectId: 'snuxi-project',
  storageBucket: 'snuxi-project.firebasestorage.app',
  messagingSenderId: '1079228242208',
  appId: '1:1079228242208:web:9825696d3dbc91daf5df45',
  measurementId: 'G-1XE4QM9YGG',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  const notificationTitle = title || 'SNUXI';
  const notificationOptions = {
    body: body || '새로운 알림이 있습니다.',
    icon: '/snuxi-logo.png',
    badge: '/snuxi-logo.png',
    data: { url: payload.data?.url || '/' },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

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
