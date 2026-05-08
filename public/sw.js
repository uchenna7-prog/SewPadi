import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

// ── Workbox precache (injected by vite-plugin-pwa at build time) ──
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ── Push: show notification when a push event arrives ────────
self.addEventListener('push', e => {
  let data = { title: 'SewPadi', body: 'You have a new notification.' }
  try { data = e.data?.json() || data } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/icons/icon192.png',
      badge:   '/icons/icon192.png',
      vibrate: [200, 100, 200],
      tag:     data.title,
    })
  )
})

// ── Notification click: open/focus the app ───────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) return list[0].focus()
      return clients.openWindow('/')
    })
  )
})
