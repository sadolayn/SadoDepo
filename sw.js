// Sadolayn — çevrimdışı yedek. Önce internetten alır (güncellemeler hemen gelir).
// İnternet yoksa ya da sunucu hata verirse en son başarılı kopyayı gösterir.
// Önbellek anahtarı "?t=..." gibi ekler olmadan tutulur; her istek ayrı kopya olarak birikmez.
const CACHE = "sadolayn-v556";
// Çevrimdışı açılması gereken sayfalar ve dosyaları (Bankacılık, Hesaplamalar, Günce, Takvim, oyunlar): kurulumda hazırlanır.
// Biri inemezse diğerleri yine önbelleğe girer. Liste: bu sayfaların yüklediği yerel js/css/görsel/yazı tipi (yaklaşık 1,8 MB).
const ONCE = ["./", "./index.html", "./manifest.webmanifest", "./balayi.html", "./balayiai.js", "./banka.css", "./banka.html", "./bankap.js", "./batak.html", "./batakai.js", "./bilmece.html", "./bulmaca.html", "./bulmacap.js", "./cardsound.js", "./faizhatira.js", "./gunce.css", "./gunce.html", "./guncep.js", "./hareket.css", "./hesap.css", "./hesap.html", "./hesapp.js", "./img/ataturk.jpg", "./img/icon.png", "./img/logo.png", "./isimler.js", "./isq.js", "./kartmasa.js", "./king.html", "./kingai.js", "./lib/gelasio-italic-latin-ext.woff2", "./lib/gelasio-italic-latin.woff2", "./lib/gelasio-latin-ext.woff2", "./lib/gelasio-latin.woff2", "./numfmt.js", "./ortak.js", "./oyunlar.html", "./oyunquiz.js", "./oyunsaat.js", "./pilot.html", "./pusula.js", "./sarj.js", "./anma.js", "./satranc.html", "./satrancai.js", "./amiral.html", "./amiralp.js", "./solotest.html", "./solotestp.js", "./cop31.html", "./cop31.js", "./isbank/cop31.json", "./kaza.html", "./kaza.css", "./kazap.js", "./kazapdf.js", "./kazakroki.js", "./pwa.js", "./rapor.js", "./sayac.js", "./sayi.js", "./solitaire.html", "./tahmin.html", "./takvim.css", "./takvim.html", "./takvimp.js", "./tavla.html", "./tema.js", "./theme.css", "./token.js", "./vergi.js", "./yedek.js", "./yeni.js"];
const anahtar = (u) => { const x = new URL(u, self.location.href); return x.origin + x.pathname; };
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ONCE.map((u) =>
    fetch(new Request(u, { cache: "reload" })).then((res) => { if (res.ok) return c.put(anahtar(u), res); }).catch(() => {})))));
});
// Yeni sürümde eski önbellekteki, yenide olmayan kopyalar (ziyaret edilmiş sayfalar, veri dosyaları) taşınır; sonra eski silinir.
// Böylece her güncellemede çevrimdışı yedek sıfırlanmaz.
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.open(CACHE).then((yeni) => caches.keys().then((ks) => Promise.all(ks.filter((x) => x !== CACHE).map((eskiAd) =>
    caches.open(eskiAd).then((eski) => eski.keys().then((reqs) => Promise.all(reqs.map((r) =>
      yeni.match(r).then((var_) => var_ || eski.match(r).then((res) => res && yeni.put(r, res))))))).then(() => caches.delete(eskiAd))))))
    .then(() => self.clients.claim()));
});
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
  let url = new URL((e.notification.data && e.notification.data.url) || "./alerts.html#bugun", self.registration.scope).href;
  if (new URL(url).origin !== self.location.origin) url = new URL("./alerts.html#bugun", self.registration.scope).href; // bildirim yalnızca kendi sitemizi açar
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url.split("#")[0] === url.split("#")[0] && "focus" in c) { c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
