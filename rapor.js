/* rapor.js — anonim kullanım sayımı (GoatCounter) ve oyun sonucu özeti (Google Form).
   Kimlik, cihaz kodu, çerez yok. Forma yalnızca oyunun adı, sonucu ve oyun ayarları gider.
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
  var FORM = { action: "https://docs.google.com/forms/d/e/1FAIpQLSfeuDkVXo1nk6IZ_9f7uEjXkCUF3M--PUv7cYcBwXPWe6F6gA/formResponse", mesaj: "entry.1123079006", kimden: "entry.1229018588" };
  var ADLAR = { king: "King", tavla: "Tavla", solitaire: "Solitaire", pilot: "UçUç", tahmin: "Sayı Tahmin", bulmaca: "Sayı Bulmaca", balayi: "Balayı" };
  var IKON = { king: "👑", tavla: "🎯", solitaire: "🃏", pilot: "✈️", tahmin: "🔢", bulmaca: "🧩", balayi: "💞" };
  var sayfa = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
  var gorulen = {};
  window.Rapor = {
    oyun: function (ad, kazandi, detay) {
      gc("oyun-bitti-" + ad, "Oyun bitti: " + ad);
      if (ad === "batak") return; // Batak masa özetini kendisi gönderir
      try {
        var f = new FormData();
        f.append(FORM.mesaj, (IKON[ad] || "🎮") + " " + (ADLAR[ad] || ad).toLocaleUpperCase("tr") + " | Sonuç: " + (kazandi === null ? "Bitti" : kazandi ? "Kazandı" : "Kaybetti") + (detay ? " | " + String(detay).slice(0, 200) : ""));
        f.append(FORM.kimden, "Oyun sonucu");
        fetch(FORM.action, { method: "POST", mode: "no-cors", body: f }).catch(function () {});
      } catch (e) {}
    },
    bolum: function (ad) {
      if (!ad) return;
      var k = sayfa + "/" + String(ad).trim().slice(0, 30);
      if (gorulen[k]) return; gorulen[k] = 1;
      gc("bolum-" + k.toLocaleLowerCase("tr").replace(/[^a-z0-9çğıöşü/]+/g, "-"), "Bölüm: " + k);
    },
  };
  try { localStorage.removeItem("rapor_v1"); } catch (e) {} // eski sürümün biriktirdiği özetleri temizle
})();
