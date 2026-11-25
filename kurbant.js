/* kurbant.js — Canlı kur bandı (25 Kasım 2026)
   Haber kanallarındaki gibi alt bant: döviz ve altın fiyatları sağdan sola akar.
   Yeri: telefonda (999 px ve altı) alttaki menü çubuğunun (#sTab) üst şeridi; bilgisayarda ekranın altında, yan menünün sağından sağ kenara.
   Veri sırası:
     1) Truncgil Finans (serbest piyasa, dakikalık): yalnızca son 20 dakikada güncellendiyse "CANLI" (yeşil nokta).
        Ons altın ve Brent her zaman sitenin kendi verisinden (birimi belli olsun diye).
     2) Canlı kaynak susarsa sitenin anlık kur dosyası (data/kur_anlik.json: Yahoo Finance; haberler.yml zinciri gündüz
        20 dakikada bir, gece saatte bir yazar, scripts/kur_anlik.py): piyasa saati 90 dakikadan yeniyse "GÜNCEL" (altın nokta).
     3) O da eskiyse (hafta sonu, zincir durursa) sitenin günlük verisi (data/piyasa.json: ECB referans kurları, Yahoo Finance): "KAPANIŞ".
     4) Hiçbiri yoksa ve canlı kaynağın eski verisi varsa: "SON VERİ" + saati.
   Yalıtım: bant, panel ve ayar satırı gölge DOM içinde çizilir. Sitede başka sayfalarda .kb gibi sınıflar var; gölge DOM sayesinde
   ne sayfanın stilleri banda karışır (ör. ana sayfadaki p { letter-spacing }) ne de bandın stilleri sayfaya taşar.
   Sayfaya yazılan tek stil: html.kbnVar ile sayfa sonuna yer ayırma ve alttaki sabit düğmeleri bandın üstüne itme.
   Güvenlik: dış veri yalnızca sayıya çevrilip textContent ile yazılır (HTML olarak hiçbir zaman); istek çerez ve sayfa adresi göndermez;
   sitenin kendi kapanışından çok uzak (bozuk ya da yanlış birimli) değer gösterilmez. Dışarıdan kod yüklenmez.
   Dokununca panel açılır: tüm kalemler, kaynak, saat, "Bandı gizle". Gizleme bu cihazda kalır (localStorage "kurBandi" = "kapali");
   geri açmak için Döviz & Emtia sayfasının altındaki anahtar (piyasa.html #kurBandiAyar).
   ortak.js yükler: site menüsü olan sayfalarda. Oyunlarda, kendi alt çubuğu olan sayfalarda (Kaza, Dilekçe) ve 9–10 Kasım matem saatlerinde yok. */
(function () {
  "use strict";
  if (window.KurBandi) return;
  var H = document.documentElement, B = document.body;
  if (!B || !B.attachShadow) return; // çok eski tarayıcı: bant yok

  var KEY = "kurBandi", YENI_K = "kurbandi", YENI_T = "2026-11-25";
  var CANLI_URL = "https://finans.truncgil.com/v4/today.json";
  var TAZE = 20 * 60e3;          // canlı sayılma süresi
  var ANLIK_URL = "data/kur_anlik.json", ANLIK_TAZE = 90 * 60e3; // sitenin 20 dakikalık dosyası; gece zincir saatte bir döner
  var HIZ = 40;                  // akış hızı, piksel/sn
  var OZ = 31.1034768;           // 1 ons = 31,10 gram
  var SAYFA = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
  var tel = window.matchMedia ? window.matchMedia("(max-width: 999px)") : { matches: innerWidth < 1000 };

  // [anahtar, banttaki ad, paneldeki ad, paneldeki küçük not, ondalık, banttaki önek, paneldeki önek]
  var KAL = [
    ["usd", "DOLAR", "Dolar", "", 4, "", "₺"],
    ["eur", "EURO", "Euro", "", 4, "", "₺"],
    ["eurusd", "EUR/USD", "EUR/USD", "parite", 4, "", ""],
    ["gbp", "STERLİN", "Sterlin", "", 4, "", "₺"],
    ["gra", "GRAM ALTIN", "Gram altın", "", 2, "", "₺"],
    ["ceyrek", "ÇEYREK ALTIN", "Çeyrek altın", "", 0, "", "₺"],
    ["ons", "ONS ALTIN", "Ons altın", "", 2, "$", "$"],
    ["gumus", "GÜMÜŞ", "Gümüş", "gram", 2, "", "₺"],
    ["brent", "BRENT", "Brent", "varil", 2, "$", "$"]
  ];
  var AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  function kapaliMi() { try { return localStorage.getItem(KEY) === "kapali"; } catch (e) { return false; } }
  function matem() { var n = new Date(); return n.getMonth() === 10 && (n.getDate() === 10 || (n.getDate() === 9 && n.getHours() >= 12)); }

  /* ---------- biçim ---------- */
  var NF = {};
  function nf(v, d) { if (!NF[d]) NF[d] = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d }); return NF[d].format(v); }
  function yuzde(c) {
    if (!isFinite(c)) return { s: "", c: "eq" };
    if (Math.abs(c) < 0.005) return { s: "%0,00", c: "eq" };
    return { s: (c > 0 ? "▲ %" : "▼ %") + nf(Math.abs(c), 2), c: c > 0 ? "up" : "dn" };
  }
  function iki(n) { return (n < 10 ? "0" : "") + n; }
  function trSaat(ms) { var d = new Date(ms + 3 * 3600e3); return iki(d.getUTCHours()) + "." + iki(d.getUTCMinutes()); } // İstanbul, UTC+3
  function trGun(ms) { var d = new Date(ms + 3 * 3600e3); return d.getUTCDate() + " " + AY[d.getUTCMonth()]; }
  function zamanYaz(ms, cumle) { // bugünse "19.41", dünse "Dün 19.41" (cümle içinde "dün 19.41"), daha eskiyse "24 Kasım 19.41"
    var bugun = trGun(Date.now()), dun = trGun(Date.now() - 864e5), g = trGun(ms);
    return (g === bugun ? "" : g === dun ? (cumle ? "dün " : "Dün ") : g + " ") + trSaat(ms);
  }
  function gunYaz(iso) { var p = String(iso || "").split("-"); return p.length === 3 ? +p[2] + " " + AY[+p[1] - 1] : ""; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  /* ---------- veri ---------- */
  var CAN = null, BIZ = null, ANL = null, sonCekim = 0, bizZaman = 0, anlCekim = 0, MOD = "yuk", V = {}, ESKI = {}, sonPing = 0;

  // Sayı: 50.6244 ya da "50,6246" ya da "%0,08" → 50.6244 / 0.08
  function sayi(o, alan) {
    if (!o || typeof o !== "object") return NaN;
    var v = o[alan];
    if (typeof v === "string") { v = v.replace(/[%\s]/g, ""); if (v.indexOf(",") > -1) v = v.replace(/\./g, "").replace(",", "."); }
    v = typeof v === "number" || typeof v === "string" ? Number(v) : NaN;
    return isFinite(v) ? v : NaN;
  }
  function canliCoz(j) {
    if (!j || typeof j !== "object") return null;
    var m = String(j.Update_Date || "").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    var zaman = m ? Date.parse(m[1] + "-" + m[2] + "-" + m[3] + "T" + m[4] + ":" + m[5] + ":" + (m[6] || "00") + "+03:00") : NaN;
    var D = {};
    var al = function (k, kod) { var o = j[kod], s = sayi(o, "Selling"), c = sayi(o, "Change"); if (s > 0) D[k] = { v: s, c: Math.abs(c) < 50 ? c : NaN }; };
    al("usd", "USD"); al("eur", "EUR"); al("gbp", "GBP"); al("gra", "GRA"); al("ceyrek", "CEYREKALTIN"); al("gumus", "GUMUS");
    if (!D.usd) return null;
    if (D.eur) D.eurusd = { v: D.eur.v / D.usd.v, c: isFinite(D.eur.c) && isFinite(D.usd.c) ? ((1 + D.eur.c / 100) / (1 + D.usd.c / 100) - 1) * 100 : NaN };
    return { zaman: zaman, V: D };
  }
  // Bozuk ya da yanlış birimli veri gösterilmesin: sitenin kendi son değerinden çok uzaksa o kalem düşer
  function makul(D, G) {
    var SINIR = { usd: 0.08, eur: 0.08, gbp: 0.08, eurusd: 0.06, gra: 0.15, gumus: 0.3 };
    Object.keys(D).forEach(function (k) {
      if (k === "ceyrek") { if (!D.gra || !(D.ceyrek.v > D.gra.v * 1.45 && D.ceyrek.v < D.gra.v * 2.1)) delete D.ceyrek; return; } // çeyrek ≈ 1,6–1,75 gram altın
      var g = G && G[k]; if (g && SINIR[k] && Math.abs(D[k].v / g.v - 1) > SINIR[k]) delete D[k];
    });
    if (D.gumus && D.gra && D.gumus.v > D.gra.v / 20) delete D.gumus; // gümüş gramı altının çok altında olmalı
  }
  function bizimCoz(P) {
    var D = P && P.dates; if (!Array.isArray(D) || D.length < 2) return null;
    var i1 = D.length - 1, i0 = i1 - 1, R = {};
    var s = function (k, i) { var a = P[k]; return Array.isArray(a) && typeof a[i] === "number" && a[i] > 0 ? a[i] : NaN; };
    var koy = function (k, v1, v0) { if (v1 > 0 && v0 > 0) R[k] = { v: v1, c: (v1 / v0 - 1) * 100 }; };
    var u1 = s("usd", i1), u0 = s("usd", i0);
    koy("usd", u1, u0); koy("eur", s("eur", i1), s("eur", i0)); koy("gbp", s("gbp", i1), s("gbp", i0));
    koy("eurusd", s("eur", i1) / u1, s("eur", i0) / u0);
    koy("gra", s("xau", i1), s("xau", i0));
    koy("ons", s("xau", i1) * OZ / u1, s("xau", i0) * OZ / u0);
    koy("gumus", s("xag", i1), s("xag", i0));
    koy("brent", s("brent", i1) / u1, s("brent", i0) / u0);
    return R.usd ? { tarih: D[i1], V: R } : null;
  }
  function bizimCek() {
    var p = window.Ortak && Ortak.json ? Ortak.json("data/piyasa.json") : fetch("data/piyasa.json", { cache: "no-store" }).then(function (r) { return r.json(); });
    return p.then(function (P) { var b = bizimCoz(P); if (b) { BIZ = b; bizZaman = Date.now(); } }).catch(function () {});
  }
  // Sitenin anlık kur dosyası: { guncelleme, k: { usd: { v: son, o: önceki kapanış, z: piyasa saati (unix sn) }, … } }
  function anlikCoz(j) {
    if (!j || typeof j !== "object" || !j.k || typeof j.k !== "object") return null;
    var R = {};
    ["usd", "eur", "gbp", "eurusd", "gra", "ons", "gumus", "brent"].forEach(function (k) {
      var x = j.k[k]; if (!x || typeof x !== "object") return;
      var v = Number(x.v), o = Number(x.o), z = Number(x.z) * 1000;
      if (v > 0 && o > 0 && isFinite(v) && isFinite(o) && z > 0 && isFinite(z)) R[k] = { v: v, c: (v / o - 1) * 100, z: z };
    });
    return R.usd ? { zaman: R.usd.z, V: R } : null;
  }
  function anlikCek() {
    anlCekim = Date.now();
    var p = window.Ortak && Ortak.json ? Ortak.json(ANLIK_URL) : fetch(ANLIK_URL, { cache: "no-store" }).then(function (r) { return r.json(); });
    return p.then(function (j) { var a = anlikCoz(j); if (a && BIZ) makul(a.V, BIZ.V); ANL = a && a.V.usd ? a : null; }).catch(function () {});
  }
  function canliCek() {
    if (navigator.onLine === false) return Promise.resolve(null);
    var ac = window.AbortController ? new AbortController() : null, t = ac ? setTimeout(function () { ac.abort(); }, 8000) : 0;
    return fetch(CANLI_URL, { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer", mode: "cors", signal: ac ? ac.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (j) { clearTimeout(t); return canliCoz(j) || { bozuk: true }; })
      .catch(function () { clearTimeout(t); return null; });
  }
  function karar() {
    var simdi = Date.now(), taze = CAN && isFinite(CAN.zaman) && simdi - CAN.zaman < TAZE && CAN.zaman - simdi < 10 * 60e3;
    var anlTaze = ANL && simdi - ANL.zaman < ANLIK_TAZE && ANL.zaman - simdi < 10 * 60e3;
    if (taze) {
      MOD = "canli"; V = {};
      var Y = anlTaze ? ANL.V : BIZ ? BIZ.V : {}; // ons ve Brent: önce 20 dakikalık dosya, yoksa günlük veri
      ["ons", "brent"].forEach(function (k) { if (Y[k]) V[k] = Y[k]; });
      Object.keys(CAN.V).forEach(function (k) { V[k] = CAN.V[k]; });
    } else if (anlTaze) { MOD = "guncel"; V = ANL.V; }
    else if (BIZ) { MOD = "kapanis"; V = BIZ.V; }
    else if (CAN) { MOD = "son"; V = CAN.V; }
    else MOD = "yok";
  }

  /* ---------- sayfaya yazılan tek stil: yer ayırma ---------- */
  var gs = el("style"); gs.id = "kurBandiYer"; gs.setAttribute("data-tema-uretim", ""); // tema.js bu stile dokunmasın
  gs.textContent =
    "html.kbnVar body::after{content:'';display:block;height:30px}" +
    "@media (max-width:999px){" +
      "html.tbVar.kbnVar #ortakGez,html.tbVar.kbnVar #ortakYukari{bottom:calc(114px + env(safe-area-inset-bottom))!important}" +
      "html.tbVar.kbnVar .fab{bottom:calc(118px + env(safe-area-inset-bottom))!important}" +
      "html.tbVar.kbnVar .toast,html.tbVar.kbnVar .cp-toast,html.tbVar.kbnVar #kTost,html.tbVar.kbnVar .ortakEski,html.tbVar.kbnVar .atoast{bottom:calc(122px + env(safe-area-inset-bottom))!important}}" +
    "@media (min-width:1000px){html.kbnVar body::after{height:34px}" +
      "html.kbnVar #ortakGez,html.kbnVar #ortakYukari{bottom:calc(50px + env(safe-area-inset-bottom))!important}" +
      "html.kbnVar .ortakEski{bottom:48px!important}html.kbnVar .fab{bottom:54px!important}" +
      "html.kbnVar .toast,html.kbnVar .cp-toast,html.kbnVar #kTost{bottom:58px!important}html.kbnVar .kvToast,html.kbnVar #kHatP{bottom:52px!important}html.kbnVar .atoast{bottom:126px!important}}" +
    "@media print{html.kbnVar body::after{display:none}#kurBandi,#kurBandiKatman{display:none!important}}";
  document.head.appendChild(gs);

  /* ---------- gölge DOM stili (bant, panel, ayar satırı) ---------- */
  var CSS =
    ":host{all:initial;display:block;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-text-size-adjust:100%;text-size-adjust:100%}" +
    "*,*::before,*::after{box-sizing:border-box}" +
    "button{font:inherit;color:inherit;margin:0}" +
    // Bant
    ".b{all:unset;box-sizing:border-box;position:relative;display:flex;align-items:stretch;width:100%;height:30px;overflow:hidden;cursor:pointer;color:#f2f2f2;line-height:1;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;background:rgba(0,0,0,.28);border-bottom:1px solid rgba(255,255,255,.07)}" +
    ".b:focus-visible{outline:2px solid #f3d38a;outline-offset:-2px}" +
    ".et{flex:none;position:relative;display:flex;align-items:center;gap:6px;padding:0 17px 0 13px;font:800 11px/1 system-ui,-apple-system,sans-serif;letter-spacing:.13em;color:#f3d38a;background:linear-gradient(90deg,rgba(224,162,79,.22),rgba(224,162,79,.08));-webkit-clip-path:polygon(0 0,100% 0,calc(100% - 9px) 100%,0 100%);clip-path:polygon(0 0,100% 0,calc(100% - 9px) 100%,0 100%)}" +
    ".nok{position:relative;flex:none;display:inline-block;width:7px;height:7px;border-radius:50%;background:#8a8a8a;transition:background-color .2s ease,box-shadow .2s ease}" +
    "[data-durum=canli] .nok{background:#3fc283;box-shadow:0 0 0 3px rgba(63,194,131,.18)}" +
    "[data-durum=guncel] .nok{background:#e0a24f;box-shadow:0 0 0 3px rgba(224,162,79,.18)}" +
    ".nok::after{content:'';position:absolute;inset:0;border-radius:50%;background:inherit;opacity:0}" +
    ".nok.ping::after{animation:ping 1.1s cubic-bezier(.2,.7,.2,1)}" +
    "@keyframes ping{from{opacity:.75;transform:scale(1)}to{opacity:0;transform:scale(3.4)}}" +
    ".yeni{position:absolute;top:4px;right:7px;width:6px;height:6px;border-radius:50%;background:#e5383b}" +
    ".yol{flex:1;min-width:0;overflow:hidden;display:flex;align-items:center;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12px,#000 calc(100% - 18px),transparent);mask-image:linear-gradient(90deg,transparent,#000 12px,#000 calc(100% - 18px),transparent)}" +
    ".ser{display:inline-flex;align-items:center;height:100%;white-space:nowrap;will-change:transform;animation:kay var(--sure,60s) linear infinite}" +
    ".b:active .ser,.b.dur .ser{animation-play-state:paused}@media (hover:hover){.b:hover .ser{animation-play-state:paused}}" +
    "[data-durum=yuk] .ser,[data-durum=yok] .ser{animation:none}" +
    "@keyframes kay{from{transform:translateX(0)}to{transform:translateX(-50%)}}" +
    ".o{display:inline-flex;align-items:baseline;gap:6px;padding-left:14px}" +
    ".o::after{content:'◆';align-self:center;margin-left:14px;font-size:8px;color:#5a4320}" +
    ".a{font:700 11px/1 system-ui,-apple-system,sans-serif;letter-spacing:.06em;color:#a8a8a8}" +
    ".d{font:700 13px/1 system-ui,-apple-system,sans-serif;font-variant-numeric:tabular-nums;color:#f5f5f5;transition:color .2s ease}" +
    ".f{display:inline-block;font:700 11.5px/1 system-ui,-apple-system,sans-serif;font-variant-numeric:tabular-nums}" +
    ".up,.d.yuk{color:#3fc283}.dn,.d.dus{color:#ef6a4c}.eq{color:#8a8a8a}" +
    ".f.pop{animation:pop .5s cubic-bezier(.2,.7,.2,1)}@keyframes pop{from{opacity:.25;transform:translateY(4px)}}" +
    ".bos{padding-left:14px;font:600 12px/1 system-ui,sans-serif;color:#8a8a8a}" +
    ".sag{display:none}" +
    // Bilgisayar: ekranın altında tam genişlik (yan menünün sağından)
    ":host([yer=alt]) .b{position:fixed;left:0;right:0;bottom:0;z-index:46;width:auto;height:34px;background:rgba(6,6,6,.93);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-bottom:0;border-top:1px solid #262626}" +
    ":host([yer=alt]) .b::before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,#5a4320 18%,#e0a24f 50%,#5a4320 82%,transparent);opacity:.75}" +
    ":host([yer=alt]) .d{font-size:14px}:host([yer=alt]) .a{font-size:11.5px}:host([yer=alt]) .et{padding-left:16px}" +
    ":host([yer=alt]) .sag{display:flex;align-items:center;gap:8px;flex:none;padding:0 14px 0 12px;border-left:1px solid #1c1c1c;font:600 11.5px/1 system-ui,sans-serif;color:#8a8a8a}" +
    ".sag b{color:#e0a24f;font-size:15px}" +
    "@media (min-width:1200px){:host([yer=alt]) .b{left:220px}}" +
    "@media (min-width:1000px) and (max-width:1199px){:host([yer=alt]) .b{left:64px}}" +
    // Panel
    ".pan{position:fixed;inset:0;z-index:9700;display:flex;align-items:flex-end;justify-content:center;line-height:1.4;color:#f2f2f2}" +
    ".pan[hidden]{display:none}" +
    ".arka{position:absolute;inset:0;background:rgba(0,0,0,.6);opacity:0;transition:opacity .25s ease}" +
    ".kart{position:relative;width:100%;max-width:560px;max-height:88vh;overflow:auto;overscroll-behavior:contain;padding:10px 16px calc(18px + env(safe-area-inset-bottom));background:#0b0b0b;border:1px solid #262626;border-bottom:0;border-radius:20px 20px 0 0;transform:translateY(104%);transition:transform .3s cubic-bezier(.2,.7,.2,1)}" +
    ".pan.ac .arka{opacity:1}.pan.ac .kart{transform:none}" +
    ".kart::before{content:'';display:block;width:38px;height:4px;border-radius:99px;background:#2c2c2c;margin:0 auto 12px}" +
    ".bas{display:flex;align-items:center;gap:10px}" +
    ".bas h2{margin:0;font:italic 700 21px/1.2 Georgia,'Times New Roman',serif;color:#e0a24f}" +
    ".durum{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;border:1px solid #262626;font:800 11px/1 system-ui,sans-serif;letter-spacing:.1em;color:#d8d8d8;white-space:nowrap}" +
    ".durum .nok{width:6px;height:6px}" +
    ".x{margin-left:auto;flex:none;width:40px;height:40px;border-radius:12px;border:1px solid #262626;background:#111;color:#cfcfcf;font:600 16px/1 system-ui,sans-serif;cursor:pointer;transition:transform .15s ease,border-color .2s ease}" +
    ".x:active{transform:scale(.94)}.x:focus-visible,.ana:focus-visible,.giz:focus-visible,.anah:focus-visible{outline:2px solid #f3d38a;outline-offset:2px}" +
    ".acik{margin:8px 0 12px;font-size:12.5px;line-height:1.4;color:#a8a8a8}" +
    ".iz{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}" +
    "@media (max-width:339px){.iz{grid-template-columns:1fr 1fr}}" +
    ".k{display:flex;flex-direction:column;gap:4px;min-width:0;padding:10px 10px 11px;border-radius:14px;background:#0f0f0f;border:1px solid #1c1c1c;animation:gel .45s cubic-bezier(.2,.7,.2,1) both}" +
    "@keyframes gel{from{opacity:0;transform:translateY(10px)}}" +
    ".ka{font-size:12px;line-height:1.35;color:#a8a8a8}.ka small{font-size:11px;color:#8a8a8a}" +
    ".kd{font:700 15.5px/1.2 system-ui,-apple-system,sans-serif;font-variant-numeric:tabular-nums;color:#f5f5f5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    "@media (min-width:480px){.kd{font-size:17px}.k{padding:11px 12px}}" +
    ".kf{font:700 12px/1 system-ui,sans-serif;font-variant-numeric:tabular-nums}" +
    ".not{margin:12px 0 0;font-size:12px;line-height:1.45;color:#a8a8a8}" +
    ".dug{display:flex;gap:8px;margin-top:14px}" +
    ".ana{flex:1;display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:12px;background:#e0a24f;color:#1a1206;font:800 14px/1 system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 14px rgba(224,162,79,.25);transition:transform .15s ease}" +
    ".giz{min-height:44px;padding:0 14px;border-radius:12px;border:1px solid #262626;background:transparent;color:#cfcfcf;font:600 13.5px/1 system-ui,sans-serif;cursor:pointer;transition:transform .15s ease,border-color .2s ease}" +
    ".ana:active,.giz:active{transform:scale(.975)}.giz:hover{border-color:#5a4320}" +
    // Bildirim ("Kur bandı gizlendi · Geri al")
    ".tost{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));z-index:9800;transform:translate(-50%,12px);opacity:0;display:flex;align-items:center;gap:10px;width:max-content;max-width:calc(100vw - 24px);padding:9px 10px 9px 15px;border-radius:999px;background:#17140c;border:1px solid #5a4320;color:#f3dca8;font:13px/1.3 system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.5);transition:opacity .2s ease,transform .2s ease}" +
    "@media (max-width:999px){.tost{bottom:calc(84px + env(safe-area-inset-bottom))}}" +
    ".tost.ac{opacity:1;transform:translate(-50%,0)}.tost button{flex:none;min-height:32px;padding:0 12px;border-radius:999px;border:0;background:#e0a24f;color:#1a1206;font:800 12.5px/1 system-ui,sans-serif;cursor:pointer}" +
    // Döviz & Emtia sayfasındaki ayar satırı
    ".ayar{display:flex;align-items:center;gap:12px;margin:18px 0 6px;padding:13px 14px;border-radius:16px;background:#0d0d0d;border:1px solid #262626;line-height:1.4}" +
    ".ayar .ik{font-size:22px;line-height:1}.ayar .m{flex:1;min-width:0}.ayar b{display:block;font-size:14.5px;color:#f2f2f2}" +
    ".ayar small{display:block;margin-top:3px;font-size:12px;line-height:1.4;color:#a8a8a8}" +
    ".anah{all:unset;flex:none;position:relative;width:52px;height:30px;border-radius:999px;border:1px solid #3a3a3a;background:#1a1a1a;cursor:pointer;transition:background-color .2s ease,border-color .2s ease}" +
    ".anah::after{content:'';position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#8a8a8a;transition:transform .2s ease,background-color .2s ease}" +
    ".anah[aria-checked=true]{background:#3a2a10;border-color:#e0a24f}.anah[aria-checked=true]::after{transform:translateX(22px);background:#e0a24f}" +
    ".anah:disabled{opacity:.5;cursor:default}" +
    // Açık mod ("gün ışığı ve altın"): host'a sayfanın data-tema değeri yansıtılır
    ":host([data-tema=acik]) .b{background:rgba(237,242,248,.75);border-bottom-color:#e1e7ef;color:#10151c}" +
    ":host([data-tema=acik][yer=alt]) .b{background:rgba(255,255,255,.95);border-top-color:#d3dce8}" +
    ":host([data-tema=acik][yer=alt]) .b::before{background:linear-gradient(90deg,transparent,#e2cfa6 18%,#c48a2c 50%,#e2cfa6 82%,transparent)}" +
    ":host([data-tema=acik]) .et{color:#8a5a12;background:linear-gradient(90deg,rgba(224,162,79,.28),rgba(224,162,79,.1))}" +
    ":host([data-tema=acik]) .a{color:#525c6a}:host([data-tema=acik]) .d,:host([data-tema=acik]) .kd{color:#10151c}" +
    ":host([data-tema=acik]) .up,:host([data-tema=acik]) .d.yuk{color:#1f8a57}:host([data-tema=acik]) .dn,:host([data-tema=acik]) .d.dus{color:#c2412a}" +
    ":host([data-tema=acik]) .eq,:host([data-tema=acik]) .bos,:host([data-tema=acik]) .sag{color:#5d6672}" +
    ":host([data-tema=acik]) .o::after{color:#c9a35a}:host([data-tema=acik][yer=alt]) .sag{border-left-color:#e1e7ef}:host([data-tema=acik]) .sag b{color:#8a5a12}" +
    ":host([data-tema=acik]) [data-durum=canli] .nok{background:#1f8a57;box-shadow:0 0 0 3px rgba(31,138,87,.16)}" +
    ":host([data-tema=acik]) [data-durum=guncel] .nok{background:#c48a2c;box-shadow:0 0 0 3px rgba(196,138,44,.16)}" +
    ":host([data-tema=acik]) .pan{color:#10151c}:host([data-tema=acik]) .arka{background:rgba(16,21,28,.35)}" +
    ":host([data-tema=acik]) .kart{background:#fff;border-color:#d3dce8}:host([data-tema=acik]) .kart::before{background:#d3dce8}" +
    ":host([data-tema=acik]) .bas h2{color:#8a5a12}:host([data-tema=acik]) .durum{border-color:#d3dce8;color:#2e3642}" +
    ":host([data-tema=acik]) .x{background:#f5f8fc;border-color:#d3dce8;color:#2e3642}" +
    ":host([data-tema=acik]) .acik,:host([data-tema=acik]) .not,:host([data-tema=acik]) .ka{color:#3d4653}:host([data-tema=acik]) .ka small{color:#525c6a}" +
    ":host([data-tema=acik]) .k{background:#f5f8fc;border-color:#dfe6ef}" +
    ":host([data-tema=acik]) .giz{border-color:#d3dce8;color:#2e3642}:host([data-tema=acik]) .ana{box-shadow:0 4px 14px rgba(196,138,44,.25)}" +
    ":host([data-tema=acik]) .tost{background:#fff7e6;border-color:#e2cfa6;color:#6b4a12;box-shadow:0 6px 18px rgba(80,60,20,.18)}" +
    ":host([data-tema=acik]) .ayar{background:#fff;border-color:#d3dce8}:host([data-tema=acik]) .ayar b{color:#10151c}:host([data-tema=acik]) .ayar small{color:#3d4653}" +
    ":host([data-tema=acik]) .anah{background:#e6edf5;border-color:#b7c3d3}:host([data-tema=acik]) .anah::after{background:#7a8594}" +
    ":host([data-tema=acik]) .anah[aria-checked=true]{background:#f6ecd9;border-color:#c48a2c}:host([data-tema=acik]) .anah[aria-checked=true]::after{background:#c48a2c}" +
    // Hareket azaltma: akış sürer (sitedeki öteki kayan yazılar gibi), geri kalan hareketler durur
    "@media (prefers-reduced-motion:reduce){.f.pop,.nok.ping::after,.k{animation:none}.kart,.arka,.tost,.anah,.anah::after{transition:none}}";

  var hostlar = [];
  function golge(host) {
    host.setAttribute("data-tema-koru-alan", ""); // tema.js satır içi boyamasına dokunmasın
    host.setAttribute("data-tema", H.getAttribute("data-tema") || "koyu");
    var r = host.attachShadow({ mode: "open" }), s = el("style"); s.textContent = CSS; r.appendChild(s);
    hostlar.push(host); return r;
  }
  if (window.MutationObserver) new MutationObserver(function () {
    var t = H.getAttribute("data-tema") || "koyu"; hostlar.forEach(function (h) { h.setAttribute("data-tema", t); });
  }).observe(H, { attributes: true, attributeFilter: ["data-tema"] });

  /* ---------- bant ---------- */
  var host = null, kok = null, bant = null, ser = null, yazi = null, nok = null, saat = null, imza = "", flashZ = 0, zam = 0, olcZ = 0;

  function yeniGorulmedi() {
    try { var S = JSON.parse(localStorage.getItem("yeniGoruldu") || "{}") || {}; return S[YENI_K] !== YENI_T && (Date.now() - Date.parse(YENI_T + "T00:00:00")) / 864e5 <= 7; } catch (e) { return false; }
  }
  function yeniGoruldu() {
    try { var S = JSON.parse(localStorage.getItem("yeniGoruldu") || "{}") || {}; S[YENI_K] = YENI_T; localStorage.setItem("yeniGoruldu", JSON.stringify(S)); } catch (e) {}
    var y = kok && kok.querySelector(".yeni"); if (y) y.remove();
  }

  function kur() {
    if (host || kapaliMi() || matem()) return;
    host = el("div"); host.id = "kurBandi";
    kok = golge(host);
    bant = el("button", "b"); bant.type = "button"; bant.setAttribute("aria-haspopup", "dialog");
    var et = el("span", "et"); nok = el("i", "nok"); nok.setAttribute("aria-hidden", "true"); yazi = el("span", "", "PİYASA");
    et.appendChild(nok); et.appendChild(yazi);
    if (yeniGorulmedi()) { var yn = el("i", "yeni"); yn.setAttribute("aria-hidden", "true"); et.appendChild(yn); }
    var yol = el("span", "yol"); yol.setAttribute("aria-hidden", "true");
    ser = el("span", "ser"); ser.appendChild(el("span", "bos", "Kurlar yükleniyor…")); yol.appendChild(ser);
    var sag = el("span", "sag"); sag.setAttribute("aria-hidden", "true"); saat = el("span", "", ""); sag.appendChild(saat); sag.appendChild(el("b", "", "›"));
    bant.appendChild(et); bant.appendChild(yol); bant.appendChild(sag);
    bant.setAttribute("data-durum", "yuk"); bant.setAttribute("aria-label", "Piyasa bandı yükleniyor");
    bant.addEventListener("click", panelAc);
    kok.appendChild(bant);
    yerlestir();
    H.classList.add("kbnVar");
    imza = "";
    cek(true);
  }
  function kaldir() {
    clearTimeout(zam);
    if (host) { var h = host; h.remove(); hostlar = hostlar.filter(function (x) { return x !== h; }); host = kok = bant = ser = null; }
    H.classList.remove("kbnVar");
  }
  function yerlestir() {
    if (!host) return;
    var dock = document.getElementById("sTab");
    if (tel.matches && dock && getComputedStyle(dock).display !== "none") {
      if (host.parentNode !== dock) dock.insertBefore(host, dock.firstChild);
      host.removeAttribute("yer");
    } else {
      if (host.parentNode !== B) B.appendChild(host);
      host.setAttribute("yer", "alt");
    }
    if (MOD !== "yuk" && MOD !== "yok") { imza = ""; ciz(); }
  }

  // Şerit: kalemler bir kez dizilir; şerit dar kalırsa (geniş ekran) dizi tekrarlanır, sonra iki kopya yan yana: -%50 kayınca kesintisiz döner
  function oge(x, d) {
    var o = el("span", "o"); o.setAttribute("data-k", x[0]);
    o.appendChild(el("span", "a", x[1]));
    o.appendChild(el("b", "d", x[5] + nf(d.v, x[4])));
    var y = yuzde(d.c); o.appendChild(el("span", "f " + y.c, y.s));
    return o;
  }
  function seritKur(L) {
    ser.textContent = "";
    L.forEach(function (x) { ser.appendChild(oge(x, V[x[0]])); });
    var w = ser.scrollWidth || 1, kap = (kok.querySelector(".yol") || bant).clientWidth || innerWidth, tekrar = Math.max(1, Math.ceil((kap + 60) / w));
    for (var r = 1; r < tekrar; r++) L.forEach(function (x) { ser.appendChild(oge(x, V[x[0]])); });
    [].slice.call(ser.childNodes).forEach(function (n) { ser.appendChild(n.cloneNode(true)); });
    ser.style.setProperty("--sure", Math.max(18, Math.round((w * tekrar) / HIZ)) + "s");
  }
  function ciz() {
    if (!bant || !ser) return;
    if (MOD === "yok") { kaldir(); return; }
    var L = KAL.filter(function (x) { return V[x[0]]; });
    if (!L.length) { kaldir(); return; }
    var yeniImza = MOD + ":" + L.map(function (x) { return x[0]; }).join(",") + ":" + (host.getAttribute("yer") || "t") + ":" + innerWidth;
    bant.setAttribute("data-durum", MOD);
    yazi.textContent = MOD === "canli" ? "CANLI" : MOD === "guncel" ? "GÜNCEL" : MOD === "son" ? "SON VERİ" : "KAPANIŞ";
    saat.textContent = MOD === "canli" ? "Son " + trSaat(CAN.zaman) : MOD === "guncel" ? "Son " + zamanYaz(ANL.zaman) : MOD === "son" ? zamanYaz(CAN.zaman) : BIZ ? gunYaz(BIZ.tarih) : "";
    bant.setAttribute("aria-label", (MOD === "canli" ? "Canlı kur bandı" : MOD === "guncel" ? "Kur bandı, 20 dakikada bir güncellenen piyasa verisi" : MOD === "son" ? "Kur bandı, canlı kaynağın son verisi" : "Kur bandı, günlük kapanış verisi") + ". Ayrıntılar için dokun.");
    if (yeniImza !== imza) { imza = yeniImza; KAL.forEach(function (x) { if (V[x[0]]) ESKI[x[0]] = V[x[0]].v; }); seritKur(L); return; }
    // Aynı kalemler: değerler yerinde güncellenir (akış baştan başlamaz); değişen değer kısa bir an yeşil/kırmızı yanar
    var degisti = false;
    L.forEach(function (x) {
      var d = V[x[0]], eski = ESKI[x[0]], yon = eski == null ? 0 : d.v > eski * (1 + 1e-9) ? 1 : d.v < eski * (1 - 1e-9) ? -1 : 0, y = yuzde(d.c), metin = x[5] + nf(d.v, x[4]);
      ESKI[x[0]] = d.v;
      [].forEach.call(ser.querySelectorAll('[data-k="' + x[0] + '"]'), function (o) {
        var dv = o.querySelector(".d"), fv = o.querySelector(".f");
        if (dv.textContent !== metin) dv.textContent = metin;
        if (fv.textContent !== y.s) fv.textContent = y.s;
        fv.className = "f " + y.c;
        if (yon) { degisti = true; dv.classList.remove("yuk", "dus"); dv.classList.add(yon > 0 ? "yuk" : "dus"); void fv.offsetWidth; fv.classList.add("pop"); }
      });
    });
    if (degisti) { clearTimeout(flashZ); flashZ = setTimeout(function () { if (!ser) return; [].forEach.call(ser.querySelectorAll(".yuk,.dus,.pop"), function (e) { e.classList.remove("yuk", "dus", "pop"); }); }, 1600); }
  }
  function ping() { if (!nok) return; nok.classList.remove("ping"); void nok.offsetWidth; nok.classList.add("ping"); }

  /* ---------- yenileme ---------- */
  function cek(ilk) {
    sonCekim = Date.now();
    var isler = [canliCek()];
    if (ilk || !BIZ || Date.now() - bizZaman > 10 * 60e3) isler.push(bizimCek());
    var anlIste = ilk || MOD !== "canli" || Date.now() - anlCekim > 5 * 60e3;
    return Promise.all(isler).then(function (r) {
      return anlIste ? anlikCek().then(function () { return r; }) : r; // günlük veri önce gelsin: makullük denetimi ona göre
    }).then(function (r) {
      var c = r[0];
      // Başarısız istekte eski canlı veri silinmez: 20 dakikalık tazelik süresi dolana kadar bant "CANLI" kalır, gidip gelmez
      if (c && !c.bozuk) { if (BIZ) makul(c.V, BIZ.V); if (c.V.usd) CAN = c; }
      karar();
      ciz(); panelYenile();
      var z = MOD === "canli" ? CAN.zaman : MOD === "guncel" ? ANL.zaman : 0;
      if (z && z !== sonPing) { if (sonPing) ping(); sonPing = z; } // yeni veri geldi: nokta bir kez dalgalanır
    }).then(planla, planla);
  }
  function planla() {
    clearTimeout(zam);
    if (!host || document.hidden) return;
    var az = navigator.connection && navigator.connection.saveData;
    zam = setTimeout(function () { cek(false); }, az ? 180e3 : MOD === "canli" ? 60e3 : MOD === "guncel" ? 120e3 : 180e3);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { clearTimeout(zam); return; }
    if (host && Date.now() - sonCekim > 30e3) cek(false); else planla();
  });
  var olc = function () { clearTimeout(olcZ); olcZ = setTimeout(function () { if (host && MOD !== "yuk") { imza = ""; ciz(); } }, 250); };
  addEventListener("resize", olc);
  if (tel.addEventListener) tel.addEventListener("change", yerlestir); else if (tel.addListener) tel.addListener(yerlestir);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(olc);

  /* ---------- panel ve bildirim (sayfanın en üst katmanı: body içinde kendi gölge DOM'u) ---------- */
  var katman = null, kkok = null, pan = null, kart = null;
  function katmanKur() {
    if (katman) return;
    katman = el("div"); katman.id = "kurBandiKatman"; kkok = golge(katman); B.appendChild(katman);
  }
  function panelKur() {
    katmanKur();
    pan = el("div", "pan"); pan.hidden = true;
    pan.setAttribute("role", "dialog"); pan.setAttribute("aria-modal", "true"); pan.setAttribute("aria-labelledby", "pb");
    var arka = el("div", "arka"); arka.addEventListener("click", panelKapat);
    kart = el("div", "kart");
    pan.appendChild(arka); pan.appendChild(kart); kkok.appendChild(pan);
    pan.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); panelKapat(); }
      if (e.key === "Tab") { // odak panelin içinde kalsın
        var f = [].slice.call(kart.querySelectorAll("a[href],button")); if (!f.length) return;
        if (e.shiftKey && kkok.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && kkok.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }
  function panelIcerik(yenileme) {
    if (!kart) return;
    var odak = kkok.activeElement && kart.contains(kkok.activeElement) ? kkok.activeElement.className : "";
    pan.setAttribute("data-durum", MOD);
    kart.textContent = "";
    var bas = el("div", "bas"), h = el("h2", "", "Piyasa"); h.id = "pb";
    var dur = el("span", "durum"); var dn = el("i", "nok"); dn.setAttribute("aria-hidden", "true"); dur.appendChild(dn);
    dur.appendChild(document.createTextNode(MOD === "canli" ? "CANLI · " + trSaat(CAN.zaman) : MOD === "guncel" ? "GÜNCEL · " + zamanYaz(ANL.zaman) : MOD === "son" ? "SON VERİ · " + zamanYaz(CAN.zaman) : "KAPANIŞ · " + (BIZ ? gunYaz(BIZ.tarih) : "")));
    var x = el("button", "x", "✕"); x.type = "button"; x.setAttribute("aria-label", "Kapat"); x.addEventListener("click", panelKapat);
    bas.appendChild(h); bas.appendChild(dur); bas.appendChild(x); kart.appendChild(bas);
    var alt = MOD === "canli" ? "Serbest piyasa satış fiyatları; sayfa açıkken dakikada bir yenilenir. Değişim önceki kapanışa göre."
      : MOD === "guncel" ? "Piyasa fiyatları; site gün içinde 20 dakikada bir, gece saatte bir günceller. Değişim önceki kapanışa göre."
      : MOD === "son" ? "Canlı kaynağın son verisi gösteriliyor. Değişim önceki kapanışa göre."
      : (CAN ? "Canlı kaynak en son " + zamanYaz(CAN.zaman, true) + " itibarıyla güncellendi; şimdilik sitenin günlük verisi gösteriliyor."
        : "Canlı kaynağa şu an ulaşılamıyor; sitenin günlük verisi gösteriliyor.") + " Değişim önceki güne göre.";
    kart.appendChild(el("p", "acik", alt));
    var iz = el("div", "iz"), i = 0;
    KAL.forEach(function (k) {
      var d = V[k[0]]; if (!d) return;
      var t = el("div", "k"); if (yenileme) t.style.animation = "none"; else t.style.animationDelay = (Math.floor(i++ / 3) * 0.06) + "s";
      var a = el("span", "ka", k[2]); if (k[3]) { a.appendChild(document.createTextNode(" ")); a.appendChild(el("small", "", k[3])); } t.appendChild(a);
      t.appendChild(el("b", "kd", k[6] + nf(d.v, k[4])));
      var y = yuzde(d.c); t.appendChild(el("span", "kf " + y.c, y.s || "–"));
      iz.appendChild(t);
    });
    kart.appendChild(iz);
    var not = MOD === "kapanis"
      ? "Kaynak: Döviz için Avrupa Merkez Bankası referans kurları (frankfurter.app, günlük); altın, gümüş ve Brent için Yahoo Finance uluslararası fiyatları, TL'ye çevrilmiştir."
      : MOD === "guncel" ? "Kaynak: Yahoo Finance. Gram altın ve gümüş, uluslararası ons fiyatından TL'ye çevrilmiştir; kuyumcu fiyatından farklıdır."
      : "Kaynak: Truncgil Finans (serbest piyasa)" + (V.ons || V.brent ? "; ons altın ve Brent: Yahoo Finance." : ".");
    kart.appendChild(el("p", "not", not + " Bilgi amaçlıdır, işlem fiyatı ya da yatırım tavsiyesi değildir; bankaların kurları farklıdır."));
    var dug = el("div", "dug");
    if (SAYFA !== "piyasa") { var a2 = el("a", "ana", "💱 Döviz & Emtia ›"); a2.href = "piyasa.html"; dug.appendChild(a2); }
    var g = el("button", "giz", "Bandı gizle"); g.type = "button"; g.addEventListener("click", gizle); dug.appendChild(g);
    kart.appendChild(dug);
    if (odak) { var f = kart.querySelector("." + odak.split(" ")[0]); if (f) f.focus({ preventScroll: true }); }
  }
  function panelYenile() { if (pan && !pan.hidden && pan.classList.contains("ac")) panelIcerik(true); }
  function panelAc() {
    if (MOD === "yuk") return;
    if (!pan) panelKur();
    panelIcerik(false); pan.hidden = false;
    bant && bant.classList.add("dur");
    requestAnimationFrame(function () { requestAnimationFrame(function () { pan.classList.add("ac"); }); });
    var x = kart.querySelector(".x"); if (x) x.focus({ preventScroll: true });
    yeniGoruldu();
    window.Rapor && Rapor.bolum && Rapor.bolum("kur-bandi");
  }
  function panelKapat() {
    if (!pan || pan.hidden) return;
    pan.classList.remove("ac"); bant && bant.classList.remove("dur");
    setTimeout(function () { if (!pan.classList.contains("ac")) pan.hidden = true; }, 320);
    if (bant && bant.isConnected) try { bant.focus({ preventScroll: true }); } catch (e) {}
  }

  /* ---------- gizle / aç ---------- */
  var tost = null, tostZ = 0;
  function bildir(metin, dugme, fn) {
    katmanKur();
    if (tost) tost.remove();
    tost = el("div", "tost"); tost.setAttribute("role", "status");
    tost.appendChild(el("span", "", metin));
    if (dugme) { var b = el("button", "", dugme); b.type = "button"; b.addEventListener("click", function () { if (tost) tost.remove(); tost = null; fn(); }); tost.appendChild(b); }
    kkok.appendChild(tost);
    requestAnimationFrame(function () { requestAnimationFrame(function () { tost && tost.classList.add("ac"); }); });
    clearTimeout(tostZ); tostZ = setTimeout(function () { if (tost) { tost.classList.remove("ac"); var t = tost; setTimeout(function () { t.remove(); }, 250); tost = null; } }, 6000);
  }
  function ac() { try { localStorage.removeItem(KEY); } catch (e) {} kur(); ayarCiz(); }
  function gizle() {
    try { localStorage.setItem(KEY, "kapali"); } catch (e) {}
    panelKapat(); kaldir(); ayarCiz();
    window.Rapor && Rapor.bolum && Rapor.bolum("kur-bandi-gizle");
    bildir(SAYFA === "piyasa" ? "Kur bandı gizlendi" : "Kur bandı gizlendi · Döviz & Emtia'dan yeniden açılır", "Geri al", ac);
  }
  // Döviz & Emtia sayfasında: bandı aç/kapat anahtarı
  var akok = null;
  function ayarCiz() {
    var k = document.getElementById("kurBandiAyar"); if (!k) return;
    if (!akok) {
      akok = golge(k);
      var s = el("div", "ayar");
      s.appendChild(el("span", "ik", "📺")).setAttribute("aria-hidden", "true");
      var m = el("span", "m"), bb = el("b", "", "Alt bantta canlı kurlar"); bb.id = "ab"; m.appendChild(bb);
      m.appendChild(el("small", "", "Ekranın altında akan döviz ve altın bandı. Kapatırsan yalnızca bu cihazda kapanır.")); s.appendChild(m);
      var an = el("button", "anah"); an.type = "button"; an.setAttribute("role", "switch"); an.setAttribute("aria-labelledby", "ab");
      an.addEventListener("click", function () { if (kapaliMi()) ac(); else gizle(); });
      s.appendChild(an); akok.appendChild(s);
    }
    var a = akok.querySelector(".anah"); a.setAttribute("aria-checked", String(!kapaliMi()));
    if (matem()) { a.disabled = true; akok.querySelector("small").textContent = "Bugün yas günü; bant gösterilmiyor."; }
  }

  window.KurBandi = { ac: ac, gizle: gizle };
  kur(); ayarCiz();
})();
