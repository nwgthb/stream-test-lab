/**
 * STREAM LAB MATRIX - SERVICE WORKER INFRASTRUCTURE
 * Forces app asset caching to let the dashboard run offline.
 */
const CACHE_NAME = 'stream-lab-matrix-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './main.js',
    './telemetry.js',
    './utilities.js',
    './offline.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Provisioning offline app shelf cache assets...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.waitUntil(
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || fetch(event.request);
            })
        )
    );
});
