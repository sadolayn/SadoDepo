// Oyun saatleri. "Yoğun saat": hafta içi 08:45–12:30 ve 13:30–18:00 (resmî tatiller hariç).
// Yoğun saatte: bilgisayardan oyunlar kapalı; telefondan girişte İş Bankası sorusu (oyunquiz.js), yanlışta 5 dakika bekleme.
// Doğru cevap tek kullanımlık, 2 dakikalık bir geçiş verir (localStorage "oyunGecis"): her oyun girişinde yeniden sorulur.
// Saat telefondan değil sunucudan (sayfanın Date başlığı) alınır; cihaz saatini değiştirmek işe yaramaz.
// Oyun sayfaları: <script src="oyunsaat.js" data-kilit="sayfa">  ·  hesap.html Bulmaca: data-kilit="bulmaca"
(function () {
  var TR = 3 * 3600e3; // Türkiye UTC+3 (yaz saati yok)
  var YOGUN = [[8 * 60 + 45, 12 * 60 + 30], [13 * 60 + 30, 18 * 60]];
  var TATIL = ["01-01", "04-23", "05-01", "05-19", "07-15", "08-30", "10-29"]; // resmî tatiller: gün boyu serbest
  var YARIM = ["10-28"]; // arife: öğleden sonra serbest
  var GKEY = "oyunGecis";
  var fark = 0; // sunucu saati - cihaz saati

  function p(n) { return (n < 10 ? "0" : "") + n; }
  function kapali(ms) { // yoğun saat mi?
    var d = new Date((ms == null ? simdi() : ms) + TR), g = d.getUTCDay();
    if (g === 0 || g === 6) return false;
    var md = p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate());
    if (TATIL.indexOf(md) >= 0) return false;
    var dk = d.getUTCHours() * 60 + d.getUTCMinutes();
    for (var i = 0; i < YOGUN.length; i++) {
      if (YARIM.indexOf(md) >= 0 && YOGUN[i][0] >= 12 * 60) continue;
      if (dk >= YOGUN[i][0] && dk < YOGUN[i][1]) return true;
    }
    return false;
  }
  function simdi() { return Date.now() + fark; }
  function acilis() { // yoğun saatin bittiği an (ms)
    var dk = Math.ceil(simdi() / 60000) * 60000;
    for (var i = 0; i < 4 * 24 * 60 && kapali(dk); i++) dk += 60000;
    return dk;
  }
  // Masaüstü bilgisayar mı? (telefon ve tablet değil)
  function masaustu() {
    var ua = navigator.userAgent || "";
    if (/Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(ua)) return false;
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return false; // iPadOS masaüstü kılığında
    return true;
  }
  // geçiş: 2 dk ömürlü; cihaz-sunucu saat farkları için birkaç dakika pay
  function gecisVar() { try { var g = +localStorage.getItem(GKEY), t = simdi(); return g > t - 3 * 60000 && g <= t + 5 * 60000; } catch (e) { return false; } }
  function gecisVer() { try { localStorage.setItem(GKEY, String(simdi() + 2 * 60000)); } catch (e) {} }
  function gecisKullan() { var v = gecisVar(); gecisSil(); return v; }
  function gecisSil() { try { localStorage.removeItem(GKEY); } catch (e) {} }

  // Sunucu saati: aynı sitedeki bu dosyaya HEAD isteği (service worker GET dışını geçirir)
  var hazir = new Promise(function (ok) {
    var t0 = Date.now();
    try {
      fetch("oyunsaat.js?s=" + t0, { method: "HEAD", cache: "no-store" }).then(function (r) {
        var t1 = Date.now(), h = r.headers.get("date"), s = h ? Date.parse(h) : NaN;
        if (!isNaN(s)) fark = s + 500 - (t0 + t1) / 2; // Date saniye hassasiyetinde
        ok();
      }).catch(function () { ok(); });
    } catch (e) { ok(); }
    setTimeout(ok, 4000);
  });

  function sure(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ":" + p(m) : m) + ":" + p(x);
  }
  var MASA_METIN = "Hafta içi <b>08:45</b>'ten önce, <b>12:30–13:30</b> arası ve <b>18:00</b>'den sonra açık. Hafta sonu ve ulusal bayramlarda gün boyu açık 🙂";
  var css = ".os-b{max-width:360px;margin:auto;background:#0d0d0d;border:1px solid #262626;border-radius:18px;padding:22px 18px;color:#f2f2f2;text-align:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
    ".os-i{font-size:40px;line-height:1}.os-b h3{margin:8px 0 6px;font-size:19px;color:#e0a24f}.os-b p{margin:0 0 14px;font-size:14px;line-height:1.5;color:#bdbdbd}" +
    ".os-l{font-size:12px;color:#8a8a8a}.os-cd{font-size:32px;font-weight:700;color:#e0a24f;margin:2px 0 14px;font-variant-numeric:tabular-nums}" +
    ".os-a{display:block;padding:12px;border-radius:12px;border:1px solid #333;background:#161616;color:#f2f2f2;text-decoration:none;font-size:15px;margin-top:8px}" +
    ".os-a.pri{background:#e0a24f;border-color:#e0a24f;color:#1a1205;font-weight:700}" +
    "#oyunSaat{position:fixed;inset:0;z-index:99990;background:#000;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}" +
    "#oyunSaatP{padding:8px 0 16px}";
  function stil() { if (document.getElementById("osCss")) return; var s = document.createElement("style"); s.id = "osCss"; s.textContent = css; document.head.appendChild(s); }
  function masaKutu(geri) {
    return '<div class="os-b"><div class="os-i">🕹️</div><h3>Oyunlar şu an kapalı</h3><p>' + MASA_METIN + '</p>' +
      '<div class="os-l">Açılmasına</div><div class="os-cd">–:––</div>' +
      (geri ? '<a class="os-a" href="index.html">🏠 Ana sayfaya dön</a>' : "") + "</div>";
  }
  function soruKutu(hedef) {
    return '<div class="os-b"><div class="os-i">🔐</div><h3>Önce bir soru 🙂</h3><p>Bu saatlerde oyuna girmek için bir İş Bankası sorusunu bilmen gerekiyor.</p>' +
      '<a class="os-a pri" href="oyunlar.html?oyun=' + encodeURIComponent(hedef) + '">Soruyu cevapla</a></div>';
  }

  // Sayfa kilidi
  var me = document.currentScript, mod = me && me.getAttribute("data-kilit");
  if (mod) {
    var el = null, gizli = [], hedef = (location.pathname.split("/").pop() || "oyunlar.html") + (mod === "bulmaca" ? "#bulmaca" : "");
    var kaldir = function () {
      if (!el) return;
      el.remove(); el = null;
      if (mod === "sayfa") document.documentElement.style.overflow = "";
      else gizli.forEach(function (x) { x[0].hidden = x[1]; });
    };
    var koy = function (html) {
      stil(); kaldir();
      if (mod === "sayfa") {
        el = document.createElement("div"); el.id = "oyunSaat"; el.innerHTML = html;
        (document.body || document.documentElement).appendChild(el);
        document.documentElement.style.overflow = "hidden";
      } else {
        var pan = document.getElementById("bulmaca"); if (!pan) return;
        gizli = [];
        Array.prototype.forEach.call(pan.children, function (c) { gizli.push([c, c.hidden]); c.hidden = true; });
        el = document.createElement("div"); el.id = "oyunSaatP"; el.innerHTML = html;
        pan.insertBefore(el, pan.firstChild);
      }
    };
    var izinli = false; // bu açılışta geçiş kullanıldı
    var saatHazir = false; // telefonda karar sunucu saati gelince verilir
    var durum = ""; // "" serbest · "masa" bilgisayar kilidi · "soru" telefonda soru gerekli
    // Bilgisayar: her saniye bakılır (yoğun saat başlarsa kapanır, bitince açılır)
    // Telefon: yalnızca açılışta bakılır; oynanan oyun yarıda kesilmez
    var bak = function (ilk) {
      var k = kapali(), yeni = "";
      if (k && masaustu()) yeni = "masa";
      else if (k && !izinli && saatHazir && (ilk || durum === "soru")) { if (gecisKullan()) izinli = true; else yeni = "soru"; }
      if (yeni !== durum) {
        durum = yeni;
        if (yeni === "masa") koy(masaKutu(mod === "sayfa"));
        else if (yeni === "soru") {
          if (mod === "sayfa") { location.replace("oyunlar.html?oyun=" + encodeURIComponent(hedef)); return; }
          koy(soruKutu(hedef));
        } else kaldir();
      }
      if (durum === "masa" && el) { var cd = el.querySelector(".os-cd"); if (cd) cd.textContent = sure(acilis() - simdi()); }
    };
    var bas = function () { bak(true); hazir.then(function () { saatHazir = true; bak(true); }); setInterval(function () { bak(false); }, 1000); };
    if (document.body && mod === "sayfa") bas();
    else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bas);
    else bas();
  }

  window.OyunSaat = { kapali: kapali, acilis: acilis, simdi: simdi, hazir: hazir, sure: sure, masaustu: masaustu,
    gecisVar: gecisVar, gecisVer: gecisVer, gecisSil: gecisSil, gecisKullan: gecisKullan, masaMetin: MASA_METIN };
})();
