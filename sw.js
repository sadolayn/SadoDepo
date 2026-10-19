// Sadolayn — çevrimdışı yedek. Önce internetten alır (güncellemeler hemen gelir).
// İnternet yoksa ya da sunucu hata verirse en son başarılı kopyayı gösterir.
// Önbellek anahtarı "?t=..." gibi ekler olmadan tutulur; her istek ayrı kopya olarak birikmez.
const CACHE = "sadolayn-v5";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./img/icon.png"]).catch(() => {}))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
function yedek(key, navigate) {
  return caches.match(key, { ignoreSearch: true }).then((m) => {
    if (!m && navigate) m = caches.match("./index.html");
    return Promise.resolve(m).then((m) => {
      if (!m) return null;
      const h = new Headers(m.headers); h.set("x-ortak-yedek", "1");
      return m.blob().then((b) => new Response(b, { status: 200, statusText: "OK", headers: h }));
    });
  });
}
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  const key = u.origin + u.pathname;
  e.respondWith(fetch(r).then((res) => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(key, cp)); return res; }
    return yedek(key, r.mode === "navigate").then((m) => m || res);
  }).catch(() => yedek(key, r.mode === "navigate").then((m) => m || Response.error())));
});
