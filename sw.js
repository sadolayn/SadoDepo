// Sadolayn — çevrimdışı yedek. Önce internetten alır (güncellemeler hemen gelir).
// İnternet yoksa ya da sunucu hata verirse en son başarılı kopyayı gösterir.
// Önbellek anahtarı "?t=..." gibi ekler olmadan tutulur; her istek ayrı kopya olarak birikmez.
const CACHE = "sadolayn-v237";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./img/icon.png"]).catch(() => {}))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
function yedek(key, navigate) {
  return caches.match(key, { ignoreSearch: true }).then((m) => {
    if (!m && navigate) m = caches.match("./index.html");
    return Promise.resolve(m).then((m) => {
      if (!m) return null;
      const h = new Headers(m.headers); h.set("x-ortak-yedek", "1");
      // Sayfa açılışıysa sayfaya "eski kopya" işareti koy: ortak.js üstte uyarı gösterir
      if (navigate) return m.text().then((t) => new Response(t.replace(/<head>/i, "<head><script>window.__yedek=1</script>"), { status: 200, statusText: "OK", headers: h }));
      return m.blob().then((b) => new Response(b, { status: 200, statusText: "OK", headers: h }));
    });
  });
}
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  const key = u.origin + u.pathname;
  // Tarayıcının 10 dakikalık önbelleğini atla: sunucuya "değişti mi?" diye sor (değişmediyse çok hızlı 304 döner)
  const nav = r.mode === "navigate";
  e.respondWith(fetch(nav ? new Request(r.url, { cache: "no-cache", credentials: "same-origin" }) : new Request(r, { cache: "no-cache" })).then((res) => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(key, cp)); return res; }
    return yedek(key, nav).then((m) => m || res);
  }).catch(() => yedek(key, nav).then((m) => m || Response.error())));
});

// ---- Sadolayn Alerts telefon bildirimleri (Firebase Cloud Messaging üzerinden gelen web push) ----
// Bu iki işleyici olmadan bildirim telefona ulaşır ama ekranda görünmez. sw.js düzenlenirken silinmemeli.
self.addEventListener("push", (e) => {
  let j = {};
  try { j = e.data ? e.data.json() : {}; } catch (err) { j = { notification: { body: e.data ? e.data.text() : "" } }; }
  const n = j.notification || {}, d = j.data || {};
  const url = d.url || (j.fcmOptions && j.fcmOptions.link) || "./alerts.html#bugun";
  e.waitUntil(self.registration.showNotification(n.title || d.title || "Sadolayn Alerts", {
    body: n.body || d.body || "Bugünün haberleri hazır.",
    icon: "img/icon.png", badge: "img/icon.png",
    tag: d.tag || "sadolayn-alerts", renotify: true,
    data: { url }
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./alerts.html#bugun", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url.split("#")[0] === url.split("#")[0] && "focus" in c) { c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
