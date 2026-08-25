// Service worker mínimo dedicado a Web Push (evz_core.push del backend).
// No cachea nada de la app — solo escucha push/notificationclick. Vite lo
// sirve tal cual desde /push-sw.js porque vive en public/.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'FVJ Remodelaciones', body: event.data.text(), link: '/' };
  }

  const title = payload.title || 'FVJ Remodelaciones';
  const options = {
    body: payload.body || '',
    // Agrupa por tipo: un segundo aviso del mismo tipo reemplaza al anterior
    // en vez de apilar notificaciones repetidas.
    tag: payload.notif_type || 'evz-notification',
    renotify: true,
    data: { link: payload.link || '/', notificationId: payload.notification_id },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // El frontend no tiene router de URLs propio (SPA de un solo estado, sin
  // rutas): al hacer click se enfoca/abre la app en la raíz y es la propia
  // app la que, ya abierta, resuelve a dónde ir desde la campana in-app.
  const targetUrl = self.location.origin + '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
