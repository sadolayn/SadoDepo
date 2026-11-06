/* rapor.js — anonim kullanım sayımı (GoatCounter). Kimlik, cihaz kodu, çerez yok; oyun sonuçları hiçbir yere gönderilmez.
   GoatCounter panelinde görünenler:
     oyun-bitti-<oyun>   → biten oyun sayısı (tavla, batak, king, balayi, solitaire, pilot, tahmin, bulmaca)
     bolum-<sayfa>/<bölüm> → sayfa içinde açılan bölüm/sekme (aynı sayfa açılışında bir kez)
     tema-<koyu|acik>-<oto|secim> → ziyaretçi siteyi hangi görünümde gördü (tarayıcı oturumunda bir kez; oto = telefon ayarı, secim = elle seçti)
     bolum-index/tema-sec-<oto|acik|koyu> → ana sayfadaki Görünüm düğmesine dokunma
   Sayfa ziyaretlerini GoatCounter zaten kendisi sayar. */
(function () {
  var q = [], tries = 0;
  function flush() {
    if (window.goatcounter && goatcounter.count) {
      while (q.length) { var e = q.shift(); try { goatcounter.count({ path: e[0], title: e[1], event: true }); } catch (x) {} }
      return;
    }
    if (++tries < 40) setTimeout(flush, 500); // count.js async yüklenir; hazır olana kadar bekle (en çok 20 sn)
  }
  function gc(path, title) { q.push([path, title]); if (q.length === 1) { tries = 0; flush(); } }
  var sayfa = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
  var gorulen = {};
  window.Rapor = {
    oyun: function (ad, kazandi, detay) {
      gc("oyun-bitti-" + ad, "Oyun bitti: " + ad);
    },
    bolum: function (ad) {
      if (!ad) return;
      var k = sayfa + "/" + String(ad).trim().slice(0, 30);
      if (gorulen[k]) return; gorulen[k] = 1;
      gc("bolum-" + k.toLocaleLowerCase("tr").replace(/[^a-z0-9çğıöşü/]+/g, "-"), "Bölüm: " + k);
    },
  };
  // Görünüm sayımı: koyu mu açık mı görüldü (oyun sayfaları tema yüklemez, orada sayılmaz)
  try {
    var t = document.documentElement.getAttribute("data-tema"), sc = document.documentElement.getAttribute("data-tema-secim");
    if (t && !sessionStorage.getItem("raporTema")) {
      sessionStorage.setItem("raporTema", "1");
      gc("tema-" + t + "-" + (sc === "oto" ? "oto" : "secim"), "Görünüm: " + t + (sc === "oto" ? " (otomatik)" : " (seçilmiş)"));
    }
  } catch (e) {}
  try { localStorage.removeItem("rapor_v1"); } catch (e) {} // eski sürümün biriktirdiği özetleri temizle
})();
