/* anasayfa-bas.js — ana sayfanın <head>'de, ilk boyamadan önce çalışması gereken küçük parçaları (22 Kasım 2026).
   Önceden index.html içinde satır içi betikti; ayrı dosyada olunca tarayıcı önbelleğe alır ve sayfanın güvenlik politikası
   satır içi betiğe izin vermeden çalışabilir. Sıra önemli: düzen sınıfları, 10 Kasım matemi, GoatCounter adres ayarı. */
// ---- düzen sınıfları (eski satır 14) ----
try {
/* Ana sayfa düzeni (22 Kasım 2026, duzen.js): gizlenen bölümler ve kompakt görünüm ilk boyamadan önce */ (function () { try { var d = JSON.parse(localStorage.getItem("anaDuzen") || "null"); if (!d) return; var c = document.documentElement.classList; (d.gizli || []).forEach(function (k) { if (/^[a-z]+$/.test(k)) c.add("dzG-" + k); }); if (d.kompakt) c.add("dzKompakt"); } catch (e) {} })();
} catch (e) { console.error("anasayfa: düzen sınıfları", e); }

// ---- 10 Kasım matemi (eski satır 15) ----
try {
/* 10 Kasım matemi: 9 Kasım öğleden 10 Kasım gece yarısına kadar kayan yazı siyah, solunda yas kurdelesi */
(function () { var n = new Date(); if (n.getMonth() === 10 && (n.getDate() === 10 || (n.getDate() === 9 && n.getHours() >= 12))) document.documentElement.classList.add("matem", "matem10"); /* 9 Kasım akşamı: fotoğraf da hemen geldi */ if (/ata10/.test(location.search)) document.documentElement.classList.add("matem", "matem10"); })();
} catch (e) { console.error("anasayfa: 10 Kasım matemi", e); }

// ---- GoatCounter adres ayarı (eski satır 1589) ----
try {
// Ana sayfa iki adresten açılıyor (/SadoDepo/ ve ana ekrana eklenmiş uygulamada /SadoDepo/index.html): raporda tek satır olsun
window.goatcounter = { path: function (p) { return p.replace(/\/index\.html(?=$|\?)/, "/"); } };
} catch (e) { console.error("anasayfa: GoatCounter adres ayarı", e); }
