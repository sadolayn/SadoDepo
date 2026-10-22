// Oyun saatleri: hafta içi 08:45–12:30 ve 13:30–18:00 arası oyunlar kapalı.
// Saat telefondan değil sunucudan (sayfanın Date başlığı) alınır; telefonun saatini değiştirmek işe yaramaz.
// Oyun sayfalarında tüm sayfayı, hesap.html'de yalnızca Bulmaca bölümünü kapatır.
// Oyunlar sayfasında oyunquiz.js giriş sorusundan önce OyunSaat.kapali() ile bakar.
(function () {
  var TR = 3 * 3600e3; // Türkiye UTC+3 (yaz saati yok)
  var KAPALI = [[8 * 60 + 45, 12 * 60 + 30], [13 * 60 + 30, 18 * 60]];
  var TATIL = ["01-01", "04-23", "05-01", "05-19", "07-15", "08-30", "10-29"]; // resmî tatiller: gün boyu açık
  var YARIM = ["10-28"]; // arife: öğleden sonra açık
  var fark = 0; // sunucu saati - telefon saati

  function p(n) { return (n < 10 ? "0" : "") + n; }
  function kapali(ms) {
    var d = new Date((ms == null ? simdi() : ms) + TR), g = d.getUTCDay();
    if (g === 0 || g === 6) return false;
    var md = p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate());
    if (TATIL.indexOf(md) >= 0) return false;
    var dk = d.getUTCHours() * 60 + d.getUTCMinutes();
    for (var i = 0; i < KAPALI.length; i++) {
      if (YARIM.indexOf(md) >= 0 && KAPALI[i][0] >= 12 * 60) continue;
      if (dk >= KAPALI[i][0] && dk < KAPALI[i][1]) return true;
    }
    return false;
  }
  function simdi() { return Date.now() + fark; }
  function acilis() { // bir sonraki açılış anı (ms)
    var t = simdi(), dk = Math.ceil(t / 60000) * 60000;
    for (var i = 0; i < 4 * 24 * 60 && kapali(dk); i++) dk += 60000;
    return dk;
  }
  // Sunucu saatini al: aynı sitedeki küçük bir dosyaya HEAD isteği (service worker GET dışını geçirir)
  var hazir = new Promise(function (ok) {
    var t0 = Date.now();
    try {
      fetch("oyunsaat.js?s=" + t0, { method: "HEAD", cache: "no-store" }).then(function (r) {
        var t1 = Date.now(), h = r.headers.get("date"), s = h ? Date.parse(h) : NaN;
        if (!isNaN(s)) fark = s + 500 - (t0 + t1) / 2; // Date saniye hassasiyetinde: yarım saniye ekle
        ok();
      }).catch(function () { ok(); });
    } catch (e) { ok(); }
    setTimeout(ok, 4000);
  });

  function sure(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ":" + p(m) : m) + ":" + p(x);
  }
  var METIN = "Hafta içi <b>12:30–13:30</b> arası ve <b>18:00</b>'den sonra açık. Hafta sonu ve resmî tatillerde gün boyu açık 🙂";
  function kutuHtml(geri) {
    return '<div class="os-b"><div class="os-i">🕹️</div><h3>Oyunlar şu an kapalı</h3><p>' + METIN + '</p>' +
      '<div class="os-l">Açılmasına</div><div class="os-cd">–:––</div>' +
      (geri ? '<a class="os-a" href="index.html">🏠 Anasayfaya dön</a>' : "") + "</div>";
  }
  var css = ".os-b{max-width:360px;margin:auto;background:#0d0d0d;border:1px solid #262626;border-radius:18px;padding:22px 18px;color:#f2f2f2;text-align:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
    ".os-i{font-size:40px;line-height:1}.os-b h3{margin:8px 0 6px;font-size:19px;color:#e0a24f}.os-b p{margin:0 0 14px;font-size:14px;line-height:1.5;color:#bdbdbd}" +
    ".os-l{font-size:12px;color:#8a8a8a}.os-cd{font-size:32px;font-weight:700;color:#e0a24f;margin:2px 0 14px;font-variant-numeric:tabular-nums}" +
    ".os-a{display:block;padding:12px;border-radius:12px;border:1px solid #333;background:#161616;color:#f2f2f2;text-decoration:none;font-size:15px}" +
    "#oyunSaat{position:fixed;inset:0;z-index:99999;background:#000;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}" +
    "#oyunSaatP{padding:8px 0 16px}";

  function stil() { if (document.getElementById("osCss")) return; var s = document.createElement("style"); s.id = "osCss"; s.textContent = css; document.head.appendChild(s); }
  function sayac(el) {
    var cd = el.querySelector(".os-cd"), hedef = acilis();
    cd.textContent = sure(hedef - simdi());
  }

  // Sayfa kilidi: oyun sayfasıysa (<script src="oyunsaat.js" data-kilit="sayfa">) ya da hesap.html Bulmaca bölümü (data-kilit="bulmaca")
  var me = document.currentScript, mod = me && me.getAttribute("data-kilit");
  if (mod) {
    var el = null, gizli = [];
    var uygula = function () {
      var k = kapali();
      if (k && !el) {
        stil();
        if (mod === "sayfa") {
          el = document.createElement("div"); el.id = "oyunSaat"; el.innerHTML = kutuHtml(true);
          (document.body || document.documentElement).appendChild(el);
          document.documentElement.style.overflow = "hidden";
        } else {
          var pan = document.getElementById("bulmaca"); if (!pan) return;
          gizli = [];
          Array.prototype.forEach.call(pan.children, function (c) { gizli.push([c, c.hidden]); c.hidden = true; });
          el = document.createElement("div"); el.id = "oyunSaatP"; el.innerHTML = kutuHtml(false);
          pan.insertBefore(el, pan.firstChild);
        }
      } else if (!k && el) {
        el.remove(); el = null;
        if (mod === "sayfa") document.documentElement.style.overflow = "";
        else gizli.forEach(function (x) { x[0].hidden = x[1]; });
      }
      if (el) sayac(el);
    };
    var bas = function () { uygula(); hazir.then(uygula); setInterval(uygula, 1000); };
    if (document.body && mod === "sayfa") bas();
    else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bas);
    else bas();
  }

  window.OyunSaat = { metin: METIN, kapali: kapali, acilis: acilis, simdi: simdi, hazir: hazir, kutuHtml: kutuHtml, stil: stil, sayac: sayac, sure: sure };
})();
