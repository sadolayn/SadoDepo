/* rapor.js — anonim kullanım sayımı (yalnızca GoatCounter).
   Kimlik, cihaz kodu, çerez yok; Google Form'a hiçbir şey göndermez.
   GoatCounter panelinde görünenler:
     oyun-bitti-<oyun>   → biten oyun sayısı (tavla, batak, king, balayi, solitaire, pilot, tahmin, bulmaca)
     bolum-<sayfa>/<bölüm> → sayfa içinde açılan bölüm/sekme (aynı sayfa açılışında bir kez)
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
    oyun: function (ad, kazandi) { gc("oyun-bitti-" + ad, "Oyun bitti: " + ad); },
    bolum: function (ad) {
      if (!ad) return;
      var k = sayfa + "/" + String(ad).trim().slice(0, 30);
      if (gorulen[k]) return; gorulen[k] = 1;
      gc("bolum-" + k.toLocaleLowerCase("tr").replace(/[^a-z0-9çğıöşü/]+/g, "-"), "Bölüm: " + k);
    },
  };
  try { localStorage.removeItem("rapor_v1"); } catch (e) {} // eski sürümün biriktirdiği özetleri temizle
})();
