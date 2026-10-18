// Sadolayn — çevrimdışı yedek. Önce internetten alır (güncellemeler hemen gelir),
// bağlantı yoksa en son görülen kopyayı gösterir.
const CACHE = "sadolayn-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./img/icon.png"]).catch(() => {}))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then((res) => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then((m) => m || (r.mode === "navigate" ? caches.match("./index.html") : Response.error()))));
});

// ---- Sadolayn Alerts telefon bildirimleri (Firebase Cloud Messaging üzerinden gelen web push) ----
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
