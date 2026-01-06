// Service Worker для Messor structor Calendar
const CACHE_NAME = 'messor-calendar-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('🛠️ Service Worker: Установка');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Кэширование файлов');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Активация');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Service Worker: Удаление старого кэша ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Обработка запросов
self.addEventListener('fetch', event => {
  // Пропускаем POST-запросы и запросы не GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем из кэша если есть
        if (response) {
          return response;
        }

        // Иначе загружаем из сети
        return fetch(event.request)
          .then(response => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонируем ответ
            const responseToCache = response.clone();

            // Кэшируем новый ресурс
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Для HTML запросов возвращаем главную страницу
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            // Для других запросов возвращаем заглушку
            return new Response('Оффлайн', {
              status: 200,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          });
      })
  );
});

// Обработка сообщений
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});