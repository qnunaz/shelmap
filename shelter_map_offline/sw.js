const CACHE_NAME = 'shelter-map-offline-v1'; // キャッシュ名。更新したらバージョンを上げてください。
const urlsToCache = [
  './', // index.html
  './index.html',
  './mapbox-gl.js',
  './mapbox-gl.css',
  './mapbox-gl-language.js',
  './papaparse.min.js',
  './mapbox-gl-rtl-text.js',
  './hinannjyo.csv',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
  // Mapboxのフォントやスプライト（アイコン画像）はオンラインリソースなのでキャッシュしません。
  // そのため、アイコン画像も表示されない可能性があります。
  // デフォルトのマーカーアイコンやCircleレイヤーで対応。
];

// インストールイベント: アプリケーションのキャッシュを保存
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching all content');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache addAll failed:', error);
      })
  );
});

// フェッチイベント: リクエストをインターセプトし、キャッシュから応答を返す
self.addEventListener('fetch', (event) => {
  // Mapboxのタイルや外部APIへのリクエストはキャッシュしない
  // 例: MapboxのスタイルURLやタイルURL、Geocoding/Directions APIなど
  if (event.request.url.startsWith('https://api.mapbox.com/')) {
    return event.respondWith(fetch(event.request)); // ネットワークから取得を試みる
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあればそれを返す
        if (response) {
          console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
          return response;
        }
        // キャッシュになければネットワークから取得
        console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
        return fetch(event.request);
      })
      .catch((error) => {
        console.error('[Service Worker] Fetch failed:', event.request.url, error);
        // オフラインでキャッシュも失敗した場合の代替レスポンス
        // 例えば、オフラインページを返すことも可能
        return new Response('<h1>オフラインです</h1><p>このページはオフラインでは利用できません。</p>', {
            headers: { 'Content-Type': 'text/html' }
        });
      })
  );
});

// アクティベートイベント: 古いキャッシュをクリーンアップ
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});