/* alarm.js — 🔔 Fiyat alarmı (22 Kasım 2026).
   "Dolar 51 TL'yi geçerse haber ver" gibi en çok 6 alarm. Alarmlar bu cihazda tutulur ("kurAlarm").
   - Siteyi açınca (ana sayfa ve Döviz & Emtia) gerçekleşen alarm hemen gösterilir.
   - Telefon bildirimi: cihaz Sadolayn bildirimlerine izin verdiyse ve Alerts sunucusunda kuralarm.gs kuruluysa (sürüm 6+),
     alarmlar sunucuya da yazılır; sunucu saatte bir data/piyasa.json'a bakar, seviye gelince telefona bildirim gönderir.
     Sunucuya giden: yalnızca bildirim anahtarı + alarm (varlık, yön, seviye). Ad, e-posta, konum yok.
   Ana sayfa yalnızca KurAlarm.kontrol(P) kullanır; kart yalnızca piyasa.html'de çizilir. */
(function () {
  var KEY = "kurAlarm", TOK = "kurAlarmToken", MAX = 6;
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbzpXXh8_spElgVjX-6jC45ZAgXnTdIWYhBY_k_79rAeGZo2u-UbtndgzAXuf4sYkxg/exec";
  var V = [ // anahtar, simge, ad, birim, ondalık
    ["usd", "💵", "Dolar", "TL", 4], ["eur", "💶", "Euro", "TL", 4], ["gbp", "💷", "Sterlin", "TL", 4],
    ["xau", "🥇", "Gram altın", "TL", 2], ["xag", "🥈", "Gram gümüş", "TL", 2], ["brent", "🛢️", "Brent petrol", "TL/varil", 0]];
  var VK = {}; V.forEach(function (v) { VK[v[0]] = v; });
  function oku() { try { var L = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(L) ? L.filter(function (a) { return a && VK[a.k] && (a.y === "ust" || a.y === "alt") && a.e > 0; }) : []; } catch (e) { return []; } }
  function yaz(L) { try { localStorage.setItem(KEY, JSON.stringify(L.slice(0, MAX))); } catch (e) {} }
  function son(P, k) { var a = P && P[k]; if (!Array.isArray(a)) return null; for (var i = a.length - 1; i >= 0; i--) if (typeof a[i] === "number" && a[i] > 0) return a[i]; return null; }
  function nf(v, d) { return Number(v).toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function ond(e, d) { return Number(e) % 1 === 0 ? 0 : Math.min(d, 2); } // alarm seviyesi: tam sayıysa küsuratsız
  function ad(a) { var v = VK[a.k]; return v[1] + " " + v[2] + " " + nf(a.e, ond(a.e, v[4])) + " " + v[3] + (a.y === "ust" ? " seviyesinin üstüne çıktı" : " seviyesinin altına indi"); }
  // Gerçekleşen alarmları işaretler ve yalnızca YENİ çalanları döndürür (aynı alarm iki kez gösterilmez)
  function kontrol(P) {
    var L = oku(), yeni = [];
    L.forEach(function (a) {
      if (a.cal) return;
      var s = son(P, a.k); if (s == null) return;
      if ((a.y === "ust" && s >= a.e) || (a.y === "alt" && s <= a.e)) { a.cal = Date.now(); a.calD = s; yeni.push(a); }
    });
    if (yeni.length) yaz(L);
    return yeni.map(function (a) { return { a: a, metin: ad(a), simdi: nf(a.calD, VK[a.k][4]) + " " + VK[a.k][3] }; });
  }
  function token() { try { return localStorage.getItem(TOK) || ((JSON.parse(localStorage.getItem("alerts_push") || "null") || {}).token) || ""; } catch (e) { return ""; } }
  // Sunucu sürümü (oturum boyunca bir kez sorulur)
  function sunucu() {
    try { var c = JSON.parse(sessionStorage.getItem("kaSunucu") || "null"); if (c && Date.now() - c.t < 36e5) return Promise.resolve(c.v); } catch (e) {}
    return fetch(ENDPOINT).then(function (r) { return r.json(); }).then(function (j) {
      var v = (j && +j.v) || 0; try { sessionStorage.setItem("kaSunucu", JSON.stringify({ t: Date.now(), v: v })); } catch (e) {} return v;
    }).catch(function () { return 0; });
  }
  function post(o) { return fetch(ENDPOINT, { method: "POST", body: JSON.stringify(o) }).then(function (r) { return r.json(); }); }
  function senkron() {
    var t = token(); if (!t) return Promise.resolve(false);
    return sunucu().then(function (v) {
      if (v < 6) return false;
      var L = oku().filter(function (a) { return !a.cal; }).map(function (a) { return { k: a.k, y: a.y, e: a.e }; });
      return post({ action: "alarm_set", token: t, alarms: L }).then(function (j) { if (j && j.gone) { try { localStorage.removeItem(TOK); } catch (e) {} } return !!(j && j.ok); }).catch(function () { return false; });
    });
  }
  window.KurAlarm = { oku: oku, yaz: yaz, kontrol: kontrol, token: token, sunucu: sunucu, senkron: senkron, V: V };

  // ======================= Döviz & Emtia sayfasındaki kart =======================
  if (!/piyasa\.html$/.test(location.pathname) || !window.Ortak) return;
  var P = null, acik = false, sec = { k: "usd", y: "ust" }, durum = { v: 0, tok: "" };
  var $ = function (i) { return document.getElementById(i); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var css = document.createElement("style");
  css.textContent =
    "#alrK h2{display:flex;align-items:center;gap:8px}" +
    "#alrK .alrA{margin:2px 0 10px;font-size:13px;line-height:1.45;color:var(--muted,#8a8a8a)}" +
    ".alrL{display:grid;gap:8px;margin-bottom:10px}" +
    ".alrS{display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:center;padding:10px 10px 10px 12px;border-radius:13px;border:1px solid #262626;background:#0d0d0d;animation:alrGel .45s cubic-bezier(.2,.7,.2,1) both}" +
    ".alrS .i{font-size:20px;text-align:center}.alrS b{display:block;font-size:14.5px;color:#f2f2f2}.alrS small{display:block;margin-top:2px;font-size:12px;color:#9a9a9a}" +
    ".alrS.cal{border-color:#2c5a41;background:rgba(63,194,131,.09)}.alrS.cal small{color:#7fe0b0}" +
    ".alrS button{width:34px;height:34px;border-radius:10px;border:1px solid #333;background:transparent;color:#aaa;font-size:15px;cursor:pointer}" +
    ".alrYon{display:inline-block;padding:0 6px;border-radius:6px;font-size:11.5px;font-weight:700;margin-left:4px;vertical-align:1px}" +
    ".alrYon.u{background:rgba(63,194,131,.15);color:#7fe0b0}.alrYon.a{background:rgba(239,106,76,.15);color:#ffab95}" +
    ".alrEk{width:100%;min-height:44px;border-radius:13px;border:1px dashed #5a4320;background:rgba(224,162,79,.07);color:#f3d38a;font:700 14px system-ui,sans-serif;cursor:pointer}" +
    ".alrEk:active,.alrKay:active,.alrVar button:active{transform:scale(.975)}" +
    ".alrF{margin-top:10px;padding:12px;border-radius:14px;border:1px solid #5a4320;background:#0a0a0a;animation:alrGel .3s cubic-bezier(.2,.7,.2,1) both}" +
    ".alrF label{display:block;font-size:12px;color:#9a9a9a;margin:0 0 6px}" +
    ".alrVar{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}" +
    ".alrVar button,.alrYn button,.alrHz button{min-height:40px;border-radius:11px;border:1px solid #2a2a2a;background:#111;color:#cfcfcf;font:600 12.5px system-ui,sans-serif;cursor:pointer;transition:border-color .2s ease,background-color .2s ease,color .2s ease}" +
    ".alrVar button.on,.alrYn button.on{border-color:#e0a24f;background:rgba(224,162,79,.15);color:#fff}" +
    ".alrYn{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}" +
    ".alrDeg{display:flex;align-items:center;gap:8px;margin-bottom:6px}" +
    ".alrDeg input{flex:1;min-width:0;height:46px;padding:0 12px;border-radius:12px;border:1px solid #333;background:#111;color:#fff;font:600 18px system-ui,sans-serif;font-variant-numeric:tabular-nums}" +
    ".alrDeg input:focus{outline:2px solid #e0a24f;outline-offset:1px}.alrDeg span{font-size:13px;color:#9a9a9a}" +
    ".alrHz{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px}.alrHz button{min-height:34px;font-size:12px}" +
    ".alrSim{font-size:12.5px;color:#9a9a9a;margin-bottom:10px}.alrSim b{color:#f3d38a}" +
    ".alrMsg{font-size:12.5px;color:#ffab95;min-height:0;margin-bottom:6px}" +
    ".alrKay{width:100%;min-height:46px;border:0;border-radius:13px;background:linear-gradient(160deg,#f3d38a,#e0a24f);color:#1a1205;font:700 14.5px system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 16px rgba(224,162,79,.22)}" +
    ".alrBil{display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px 12px;border-radius:13px;border:1px solid #262626;font-size:12.5px;line-height:1.4;color:#bdbdbd}" +
    ".alrBil .i{font-size:18px}.alrBil a{color:#f3d38a;font-weight:700}" +
    ".alrBil.on{border-color:#2c5a41;color:#9fe0bf}" +
    "@keyframes alrGel{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
    "@media (prefers-reduced-motion: reduce){.alrS,.alrF{animation:none}.alrVar button,.alrYn button{transition:none}}" +
    "html[data-tema=\"acik\"] .alrS{background:#fff;border-color:#c9d3e0}html[data-tema=\"acik\"] .alrS b{color:#10151c}html[data-tema=\"acik\"] .alrS small{color:#3d4653}" +
    "html[data-tema=\"acik\"] .alrS.cal{background:#e9f7ef;border-color:#a9dcbf}html[data-tema=\"acik\"] .alrS.cal small{color:#1a7a4c}" +
    "html[data-tema=\"acik\"] .alrF{background:#fbf6ec;border-color:#e6cf9f}html[data-tema=\"acik\"] .alrEk{background:#fbf4e6;color:#8a5a12;border-color:#d8b77a}" +
    "html[data-tema=\"acik\"] .alrVar button,html[data-tema=\"acik\"] .alrYn button,html[data-tema=\"acik\"] .alrHz button,html[data-tema=\"acik\"] .alrDeg input{background:#fff;color:#2a3340;border-color:#c9d3e0}" +
    "html[data-tema=\"acik\"] .alrVar button.on,html[data-tema=\"acik\"] .alrYn button.on{background:#fbf0dc;border-color:#c9963f;color:#10151c}" +
    "html[data-tema=\"acik\"] .alrSim b{color:#8a5a12}html[data-tema=\"acik\"] .alrBil{border-color:#c9d3e0;color:#3d4653}html[data-tema=\"acik\"] .alrBil a{color:#8a5a12}" +
    "html[data-tema=\"acik\"] .alrBil.on{border-color:#a9dcbf;color:#1a7a4c}html[data-tema=\"acik\"] .alrYon.u{color:#1a7a4c}html[data-tema=\"acik\"] .alrYon.a{color:#b8442a}";
  document.head.appendChild(css);

  function uzak(a) { var s = son(P, a.k); if (!s) return ""; var f = (a.e - s) / s * 100; return Math.abs(f) < 0.05 ? "çok yakın" : "%" + nf(Math.abs(f), 1) + " uzakta"; }
  function satir(a, i) {
    var v = VK[a.k], s = son(P, a.k);
    var alt = a.cal ? "✅ Gerçekleşti · " + new Date(a.cal).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + (a.calD ? " · " + nf(a.calD, v[4]) + " " + v[3] : "")
      : "Şu an " + (s ? nf(s, v[4]) + " " + v[3] + " · " + uzak(a) : "–");
    return '<div class="alrS' + (a.cal ? " cal" : "") + '"><span class="i" aria-hidden="true">' + v[1] + "</span><div><b>" + v[2] + " " + nf(a.e, ond(a.e, v[4])) + " " + v[3] +
      '<span class="alrYon ' + (a.y === "ust" ? "u" : "a") + '">' + (a.y === "ust" ? "↑ üstüne" : "↓ altına") + "</span></b><small>" + alt + "</small></div>" +
      '<button type="button" data-sil="' + i + '" aria-label="' + esc(v[2]) + ' alarmını sil">✕</button></div>';
  }
  function bilgi() {
    var t = durum.tok, ok = durum.v >= 6;
    if (t && ok) return '<div class="alrBil on"><span class="i">📲</span><span>Telefon bildirimi açık: seviye gelince telefonuna bildirim düşer (saatte bir kontrol).</span></div>';
    if (!ok) return '<div class="alrBil"><span class="i">🔔</span><span>Alarm gerçekleşince siteyi açtığında ana sayfada ve burada haber veririm.</span></div>';
    return '<div class="alrBil"><span class="i">📲</span><span>Telefonuna bildirim de gelsin mi? <a href="alerts.html#fiyat-alarmi">Bildirime izin ver ›</a></span></div>';
  }
  function ciz() {
    var k = $("alrK"); if (!k) return;
    var L = oku();
    k.innerHTML = '<div class="ghead"><h2>🔔 Fiyat alarmı' + (Date.now() < Date.parse("2026-11-29T00:00:00") ? '<span style="display:inline-block;padding:1px 6px;border-radius:6px;background:#d32f2f;color:#fff;font:800 11px system-ui,sans-serif;letter-spacing:.5px">YENİ</span>' : "") + "</h2><small>en çok " + MAX + "</small></div>" +
      '<p class="alrA">Belirlediğin seviyeye gelince haber veririm. Alarmlar yalnızca bu cihazda tutulur.</p>' +
      (L.length ? '<div class="alrL">' + L.map(satir).join("") + "</div>" : "") +
      (L.length < MAX ? '<button type="button" class="alrEk" id="alrEk" aria-expanded="' + acik + '">' + (acik ? "Vazgeç ✕" : "＋ Alarm kur") + "</button>" : "") +
      (acik ? form() : "") + bilgi();
    if (acik) formBagla();
  }
  function form() {
    var v = VK[sec.k];
    return '<div class="alrF" id="alrF"><label>Ne için?</label><div class="alrVar" role="group" aria-label="Varlık">' +
      V.filter(function (x) { return son(P, x[0]) != null; }).map(function (x) { return '<button type="button" data-k="' + x[0] + '" class="' + (x[0] === sec.k ? "on" : "") + '" aria-pressed="' + (x[0] === sec.k) + '">' + x[1] + " " + x[2] + "</button>"; }).join("") + "</div>" +
      '<label>Ne zaman?</label><div class="alrYn" role="group" aria-label="Yön"><button type="button" data-y="ust" class="' + (sec.y === "ust" ? "on" : "") + '">📈 Üstüne çıkınca</button><button type="button" data-y="alt" class="' + (sec.y === "alt" ? "on" : "") + '">📉 Altına inince</button></div>' +
      '<label for="alrD">Seviye (' + v[3] + ")</label><div class=\"alrDeg\"><input id=\"alrD\" type=\"text\" inputmode=\"decimal\" autocomplete=\"off\"><span>" + v[3] + "</span></div>" +
      '<div class="alrHz" role="group" aria-label="Hızlı seviye">' + [-5, -2, 2, 5].map(function (p) { return '<button type="button" data-p="' + p + '">' + (p > 0 ? "+" : "−") + Math.abs(p) + "%</button>"; }).join("") + "</div>" +
      '<div class="alrSim" id="alrSim"></div><div class="alrMsg" id="alrMsg" role="alert"></div><button type="button" class="alrKay" id="alrKay">🔔 Alarmı kur</button></div>';
  }
  function sayi(t) { t = String(t || "").trim().replace(/\s/g, ""); if (!t) return NaN; if (t.indexOf(",") > -1) t = t.replace(/\./g, "").replace(",", "."); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ""); return Number(t); }
  function oneri(p) { var s = son(P, sec.k), d = VK[sec.k][4]; var x = s * (1 + p / 100); var yuv = d >= 4 ? 0.05 : d >= 2 ? (x > 1000 ? 10 : 1) : 100; return Math.round(x / yuv) * yuv; }
  function formBagla() {
    var inp = $("alrD"), v = VK[sec.k], s = son(P, sec.k);
    if (!inp.value) inp.value = nf(oneri(sec.y === "ust" ? 2 : -2), ond(oneri(2), v[4]));
    var sim = function () { $("alrSim").innerHTML = "Şu an <b>" + nf(s, v[4]) + " " + v[3] + "</b> · son veri " + esc((P.updated || "").replace(/^(\d{4})-(\d\d)-(\d\d)/, "$3.$2.$1")); };
    sim();
    $("alrF").onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.k) { sec.k = b.dataset.k; inp.value = ""; ciz(); return; }
      if (b.dataset.y) { sec.y = b.dataset.y; inp.value = ""; ciz(); return; }
      if (b.dataset.p) { var p = +b.dataset.p; sec.y = p > 0 ? "ust" : "alt"; var deger = nf(oneri(p), ond(oneri(p), v[4])); ciz(); $("alrD").value = deger; return; }
    };
    $("alrKay").onclick = function () {
      var e = sayi(inp.value), m = $("alrMsg");
      if (!(e > 0) || !isFinite(e)) { m.textContent = "Geçerli bir seviye yaz (ör. " + nf(oneri(2), ond(oneri(2), v[4])) + ")."; inp.focus(); return; }
      if (sec.y === "ust" && s >= e) { m.textContent = v[2] + " şu an zaten " + nf(s, v[4]) + " " + v[3] + "; daha yüksek bir seviye yaz ya da “Altına inince”yi seç."; return; }
      if (sec.y === "alt" && s <= e) { m.textContent = v[2] + " şu an zaten " + nf(s, v[4]) + " " + v[3] + "; daha düşük bir seviye yaz ya da “Üstüne çıkınca”yı seç."; return; }
      if (Math.abs(e - s) / s > 0.5) { m.textContent = "Bu seviye bugünkü değerden çok uzak (%50'den fazla); bir kez daha kontrol eder misin?"; if (!m.dataset.uyardi) { m.dataset.uyardi = "1"; return; } }
      var L = oku().filter(function (a) { return !(a.k === sec.k && a.y === sec.y && a.e === e); });
      L.unshift({ k: sec.k, y: sec.y, e: e, t: Date.now() }); yaz(L);
      acik = false; ciz(); senkron();
      window.Rapor && Rapor.bolum("fiyat-alarm-" + sec.k);
    };
    inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") $("alrKay").click(); });
  }
  function kur() {
    var app = $("app"), guncel = app && app.querySelector("#tiles");
    if (!guncel || $("alrK")) return !!$("alrK");
    var kart = guncel.closest(".card"), k = document.createElement("div"); k.className = "card"; k.id = "alrK";
    kart.parentNode.insertBefore(k, kart.nextSibling);
    k.addEventListener("click", function (e) {
      if (e.target.closest("#alrEk")) { acik = !acik; ciz(); if (acik) setTimeout(function () { var f = $("alrD"); if (f) f.focus({ preventScroll: true }); $("alrF").scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 60); return; }
      var s = e.target.closest("[data-sil]"); if (s) { var L = oku(); L.splice(+s.dataset.sil, 1); yaz(L); ciz(); senkron(); }
    });
    ciz();
    if (location.hash === "#alarm") setTimeout(function () { k.scrollIntoView({ block: "start", behavior: "smooth" }); }, 300);
    return true;
  }
  Ortak.json("data/piyasa.json").then(function (j) {
    P = j; kontrol(P);
    if (!kur()) { var mo = new MutationObserver(function () { if (kur()) mo.disconnect(); }); mo.observe($("app") || document.body, { childList: true, subtree: true }); setTimeout(function () { mo.disconnect(); }, 15000); }
    durum.tok = token();
    sunucu().then(function (v) {
      durum.v = v; ciz();
      if (v >= 6 && durum.tok) {
        // Sunucuda çalan alarmları buraya da işle, sonra güncel listeyi sunucuya yaz
        post({ action: "alarm_list", token: durum.tok }).then(function (r) {
          if (!r || !r.ok || !Array.isArray(r.alarms)) return;
          var L = oku(), deg = false;
          r.alarms.forEach(function (x) { if (!x.fired) return; L.forEach(function (a) { if (!a.cal && a.k === x.k && a.y === x.y && a.e === +x.e) { a.cal = new Date(x.fired).getTime() || Date.now(); a.calD = +x.deger || null; deg = true; } }); });
          if (deg) { yaz(L); ciz(); }
          senkron();
        }).catch(function () {});
      }
    });
  }).catch(function () {});
})();
