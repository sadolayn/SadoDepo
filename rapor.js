/* rapor.js — anonim kullanım özeti.
   Oyun bitişleri ve açılan bölümler cihazda biriktirilir; 3 saatlik dilim başına TEK satır olarak
   (dilim bitince; oyun oynandıysa sayfa kapanırken/arka plana geçerken) Google Form'a gönderilir.
   Kişisel bilgi yok: cihaz kodu rastgele 4 harftir. Satır biçimi:
   📊 KULLANIM | Cihaz: k7q2 | Dilim: 2026-10-17 15-18 | Oyun: tavla 2 (1K) · batak 1 (0K) | Bölüm: isbank/Kampanya 3 · hesap/Faiz 1
   Toplu görünüm: istatistik.html */
(function () {
  var FORM = "https://docs.google.com/forms/d/e/1FAIpQLSfeuDkVXo1nk6IZ_9f7uEjXkCUF3M--PUv7cYcBwXPWe6F6gA/formResponse";
  var F_MSG = "entry.1123079006", F_KIM = "entry.1229018588";
  var KEY = "rapor_v1";
  var st;
  try { st = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (!st || typeof st !== "object") st = {};
  if (!st.id) st.id = Math.random().toString(36).slice(2, 6);
  st.d = st.d || {}; // { "2026-10-17 15-18": { o: {tavla:[oyun,kazanma]}, b: {"isbank/Kampanya":n} } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dilim(t) {
    var d = t || new Date(), h = Math.floor(d.getHours() / 3) * 3;
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(h) + "-" + pad(h + 3);
  }
  function slot() { var k = dilim(); return st.d[k] || (st.d[k] = { o: {}, b: {} }); }
  function satir(k, v) {
    var o = Object.keys(v.o).map(function (g) { return g + " " + v.o[g][0] + " (" + v.o[g][1] + "K)"; }).join(" · ");
    var b = Object.keys(v.b).map(function (g) { return g + " " + v.b[g]; }).join(" · ");
    return "📊 KULLANIM | Cihaz: " + st.id + " | Dilim: " + k + " | Oyun: " + (o || "-") + " | Bölüm: " + (b || "-");
  }
  // Biten dilimler hep gönderilir. Süren dilim yalnız içinde oyun sonucu varsa gönderilir
  // (sadece sayfa gezintisi dilim bitince tek satırda gider). Gönderilen kısım silinir; aynı dilimde
  // sonradan biriken fark ayrı satır olur, istatistik.html cihaz+dilim bazında toplar.
  function gonder(simdikiDahil) {
    var now = dilim(), sent = false;
    Object.keys(st.d).forEach(function (k) {
      if (k === now && !(simdikiDahil && Object.keys(st.d[k].o).length)) return;
      var v = st.d[k];
      if (!Object.keys(v.o).length && !Object.keys(v.b).length) { delete st.d[k]; return; }
      var fd = new FormData();
      fd.append(F_MSG, satir(k, v));
      fd.append(F_KIM, "Kullanım özeti");
      var ok = false;
      try { ok = navigator.sendBeacon && navigator.sendBeacon(FORM, fd); } catch (e) {}
      if (!ok) { try { fetch(FORM, { method: "POST", mode: "no-cors", body: fd, keepalive: true }).catch(function () {}); ok = true; } catch (e) {} }
      if (ok) { delete st.d[k]; sent = true; }
    });
    if (sent) save();
  }
  function gc(path, title) {
    try { if (window.goatcounter && goatcounter.count) goatcounter.count({ path: path, title: title || path, event: true }); } catch (e) {}
  }
  var sayfa = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
  var bolumGorulen = {};
  window.Rapor = {
    /** Oyun bitti: ad (tavla, batak…), kazandi (true/false) */
    oyun: function (ad, kazandi) {
      var s = slot(), x = s.o[ad] || (s.o[ad] = [0, 0]);
      x[0]++; if (kazandi) x[1]++;
      save();
      gc("oyun-bitti-" + ad, "Oyun bitti: " + ad);
    },
    /** Sayfa içi bölüm açıldı (sekme, menü). Aynı oturumda aynı bölüm bir kez sayılır. */
    bolum: function (ad) {
      if (!ad) return;
      var k = sayfa + "/" + String(ad).replace(/[|·]/g, " ").trim().slice(0, 30);
      if (bolumGorulen[k]) return;
      bolumGorulen[k] = 1;
      var s = slot(); s.b[k] = (s.b[k] || 0) + 1; save();
      gc("bolum-" + k.toLowerCase().replace(/[^a-z0-9çğıöşü/]+/g, "-"), "Bölüm: " + k);
    },
  };
  // Sayfanın kendisi de bir bölüm sayılır
  Rapor.bolum("(sayfa)");
  // Önceki dilimlerden kalanları gönder; sayfa kapanırken / arka plana geçerken birikmişi gönder
  gonder(false);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") gonder(true); });
  window.addEventListener("pagehide", function () { gonder(true); });
})();
