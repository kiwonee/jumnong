// ============================================================
// 우리 농구단 앱 - 서비스 워커
// 앱 설치(홈 화면 추가)가 가능하려면 이 파일이 꼭 있어야 해요.
// 열 때마다 서버에 "바뀐 게 있나요?"를 먼저 확인하기 때문에,
// GitHub 배포가 끝나면 다음에 앱을 열 때 바로 새 버전이 보여요.
// ============================================================
const CACHE_NAME = 'hoops-app-v2';

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

// 브라우저에 저장된 예전 파일을 그대로 쓰지 않고, 항상 서버에 최신 여부를 확인하는 요청으로 바꿔요.
// 파일이 안 바뀌었으면 서버가 "그대로예요"라고만 답해서 데이터도 거의 안 써요.
function freshRequest(req) {
  // 페이지 이동 요청은 원래 요청을 그대로 복사할 수 없어서 주소로 새로 만들어요
  if (req.mode === 'navigate') {
    return new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' });
  }
  return new Request(req, { cache: 'no-cache' });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 데이터 서버(Apps Script)와 외부 라이브러리 요청은 건드리지 않음
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(freshRequest(req));
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      } catch (e) {
        // 인터넷이 끊겼을 때만 저장해둔 파일 사용
        const cached = await caches.match(req);
        if (cached) return cached;
        const home = await caches.match('./');
        return home || Response.error();
      }
    })()
  );
});
