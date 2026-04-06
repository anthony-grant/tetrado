const CACHE = 'tetrado-v1';
const ASSETS = ['/', '/index.html'];

// Install: cache shell
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first, fall back to cache
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(function (res) {
        var clone = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(e.request, clone); });
        return res;
      })
      .catch(function () {
        return caches.match(e.request);
      })
  );
});

// Daily reminder notification
// Called by the app via postMessage when settings change
self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SCHEDULE_REMINDER') {
    var settings = e.data.settings;
    if (!settings || !settings.enabled) return;
    scheduleReminder(settings);
  }
});

function scheduleReminder(settings) {
  var parts = (settings.time || '09:00').split(':');
  var h = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  var now = new Date();
  var target = new Date();
  target.setHours(h, m, 0, 0);
  // If time already passed today, schedule for tomorrow
  if (now > target) target.setDate(target.getDate() + 1);
  var delay = target.getTime() - now.getTime();
  setTimeout(function () {
    self.registration.showNotification('TETRADO', {
      body: 'Tetrado today?',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'tetrado-daily',
      renotify: false,
    });
  }, delay);
}

// Notification click: focus or open the app
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});
