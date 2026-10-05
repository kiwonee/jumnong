// ============================================================
// 우리 농구단 앱 - 서비스 워커
// 앱 설치(홈 화면 추가)가 가능하려면 이 파일이 꼭 있어야 해요.
// 항상 '최신 버전 먼저' 불러오기 때문에 index.html을 수정하면
// 이미 설치한 사람도 다음에 앱을 열 때 바로 새 버전이 보여요.
// ============================================================
const CACHE_NAME = 'hoops-app-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 데이터 서버(Apps Script)와 외부 라이브러리 요청은 건드리지 않음
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req)
          .then((cached) => cached || caches.match('./'))
          .then((fallback) => fallback || Response.error())
      )
  );
});
