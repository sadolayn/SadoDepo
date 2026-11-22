/* duzen.js — "🧩 Ana sayfayı düzenle" (22 Kasım 2026).
   Bölümleri gizle/göster, sırasını değiştir, kompakt görünüm (açıklamalar gizlenir, sayfa kısalır).
   Ayar yalnızca bu cihazda: localStorage "anaDuzen" = { gizli: [...], sira: [...], kompakt: true|false }.
   Gizleme ve kompakt sınıfları <head>'deki küçük betikle ilk boyamadan önce <html>'e konur (sayfa zıplamaz);
   bu dosya </nav>'dan hemen sonra yüklenir: sırayı uygular, düzenleme penceresini kurar.
   Arama yapılırken gizli bölümler geçici olarak görünür (aranan şey gizli bölümdeyse de bulunur). */
(function () {
  var KEY = "anaDuzen", H = document.documentElement, nav = document.querySelector("nav.mn"); if (!nav) return;
  var BOL = [ // anahtar, simge, ad, açıklama, taşınabilir mi
    ["dgs", "✨", "Sen yokken", "son bakışından beri değişenler", 0],
    ["pnl", "📊", "Tek bakışta", "çeyrek, PPK, kampanya, piyasa, tatile kalan", 0],
    ["fav", "⭐", "Favorilerim", "sabitlediğin araçlar", 0],
    ["isb", "🏦", "İş Bankası Gündemi", "kampanyalar ve haberler kartı", 1],
    ["sabah", "☀️", "Her sabah", "Resmî Gazete, haberler, Bölge Nabzı, Alerts", 1],
    ["hesap", "🧮", "Hesap ve ajanda", "Bankacılık, Yol Gösteren, Günce, Takvim", 1],
    ["arac", "🧰", "Cebindeki araçlar", "Döviz, hesaplamalar, yakınımda, hava", 1],
    ["mola", "🎮", "Mola", "oyunlar", 1],
    ["brif", "☕", "Sabah brifingi", "açılış kartı", 1],
    ["payl", "🎁", "Paylaş kutusu", "arkadaşına öner, bilgisayarına ekle", 0],
  ];
  var BK = {}; BOL.forEach(function (b) { BK[b[0]] = b; });
  var VARS = BOL.filter(function (b) { return b[4]; }).map(function (b) { return b[0]; });
  function oku() { var d = null; try { d = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {} d = d || {}; d.gizli = (d.gizli || []).filter(function (k) { return BK[k]; }); d.sira = (d.sira || []).filter(function (k) { return BK[k] && BK[k][4]; }); VARS.forEach(function (k) { if (d.sira.indexOf(k) < 0) d.sira.push(k); }); d.kompakt = !!d.kompakt; return d; }
  function yaz(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  var D = oku();

  // Taşınabilir bölümleri işaretle (başlık metninden; HTML'de data-dz varsa o)
  var ADLAR = { sabah: /^Her sabah/, hesap: /^Hesap ve ajanda/, arac: /^Cebindeki/, mola: /^Mola/, brif: /^Sabah brifingi/ };
  [].forEach.call(nav.querySelectorAll(":scope > .mnB"), function (m) {
    if (m.dataset.dz) return; var h = m.querySelector("h2"), t = h ? h.textContent.trim() : "";
    Object.keys(ADLAR).forEach(function (k) { if (ADLAR[k].test(t)) m.dataset.dz = k; });
  });
  var isb = nav.querySelector(":scope > a.one.isb"); if (isb) isb.dataset.dz = "isb";
  function el(k) { return nav.querySelector(':scope > [data-dz="' + k + '"]'); }
  function sirala() {
    var M = VARS.map(el).filter(Boolean); if (M.length < 2) return;
    var ilk = M.reduce(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING ? b : a; });
    var yer = document.createComment("dz"); nav.insertBefore(yer, ilk);
    D.sira.forEach(function (k) { var e = el(k); if (e) nav.insertBefore(e, yer); });
    yer.remove();
  }
  function siniflar(arama) {
    BOL.forEach(function (b) { H.classList.toggle("dzG-" + b[0], !arama && D.gizli.indexOf(b[0]) > -1); });
    H.classList.toggle("dzKompakt", !!D.kompakt);
  }
  sirala(); siniflar(false);

  // ---------- PC sütun dengesi (22 Kasım 2026) ----------
  // 1000 px ve üstünde menü ızgarası 2 (1680+ px'te 3) sütun. Her bölümün boyu ölçülür, 2 px'lik satırlardan o kadar yer ayrılır;
  // böylece bir bölüm, kısa kalan sütunun altındaki boşluğa çıkar. Telefonda ve arama sırasında (tek sütun) hiçbir şey yapılmaz.
  var dz = 0;
  function dengele() {
    dz = 0;
    var kids = [].slice.call(nav.children), grid = innerWidth >= 1000 && getComputedStyle(nav).display === "grid";
    if (!grid) { nav.classList.remove("dengeli"); kids.forEach(function (e) { e.style.gridRowEnd = ""; }); return; }
    kids.forEach(function (e) {
      var cs = getComputedStyle(e); if (cs.display === "none" || cs.position === "absolute" || cs.position === "fixed") { e.style.gridRowEnd = ""; return; }
      var h = e.getBoundingClientRect().height + parseFloat(cs.marginTop || 0) + parseFloat(cs.marginBottom || 0);
      e.style.gridRowEnd = "span " + Math.max(1, Math.ceil(h / 2));
    });
    nav.classList.add("dengeli");
  }
  function sonra() { if (!dz) dz = requestAnimationFrame(dengele); }
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(sonra);
    [].forEach.call(nav.children, function (e) { ro.observe(e); });
    new MutationObserver(function (L) { L.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) ro.observe(n); }); }); sonra(); }).observe(nav, { childList: true });
    addEventListener("resize", sonra);
    if (q) q.addEventListener("input", sonra);
    sonra();
  }
  // Arama sırasında gizli bölümler de taransın
  var q = document.getElementById("araQ");
  if (q) q.addEventListener("input", function () { siniflar(!!q.value.trim()); });

  // ---------- Düzenleme penceresi ----------
  var css = document.createElement("style");
  css.textContent =
    ".dzSh{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.66);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .25s ease}" +
    ".dzSh.ac{opacity:1}.dzSh[hidden]{display:none}" +
    ".dzK{width:100%;max-width:480px;max-height:88vh;overflow:auto;overscroll-behavior:contain;background:#0d0d0d;border:1px solid #2a2a2a;border-bottom:0;border-radius:22px 22px 0 0;padding:10px 14px calc(14px + env(safe-area-inset-bottom));transform:translateY(24px);transition:transform .3s cubic-bezier(.2,.7,.2,1)}" +
    ".dzSh.ac .dzK{transform:none}" +
    ".dzK .grab{width:40px;height:4px;border-radius:9px;background:#333;margin:0 auto 10px}" +
    ".dzK h3{margin:0 0 4px;font:italic 700 20px Georgia,'Times New Roman',serif;color:#f3d38a}" +
    ".dzK>p{margin:0 0 12px;font-size:13px;line-height:1.45;color:#9a9a9a}" +
    ".dzKmp{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;border:1px solid #5a4320;background:rgba(224,162,79,.08);margin-bottom:14px;cursor:pointer}" +
    ".dzKmp>span{flex:1}.dzKmp b{display:block;font-size:15px;color:#f2f2f2}.dzKmp small{display:block;font-size:12.5px;color:#9a9a9a;margin-top:2px}" +
    ".dzSw{appearance:none;-webkit-appearance:none;flex:none;width:46px;height:28px;border-radius:99px;background:#333;position:relative;cursor:pointer;transition:background-color .2s ease;margin:0}" +
    ".dzSw::after{content:'';position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#bbb;transition:transform .2s ease,background-color .2s ease}" +
    ".dzSw:checked{background:#e0a24f}.dzSw:checked::after{transform:translateX(18px);background:#1a1205}" +
    ".dzSw:focus-visible{outline:2px solid #f3d38a;outline-offset:2px}" +
    ".dzGr{margin:0 2px 6px;font:700 11px system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8a8a8a}" +
    ".dzL{display:grid;gap:6px;margin-bottom:14px}" +
    ".dzS{display:grid;grid-template-columns:30px 1fr auto auto;gap:8px;align-items:center;padding:8px 8px 8px 10px;border-radius:13px;border:1px solid #262626;background:#111;transition:opacity .2s ease,border-color .2s ease}" +
    ".dzS.kapali{opacity:.55}.dzS .i{font-size:19px;text-align:center}.dzS b{display:block;font-size:14px;color:#f2f2f2}.dzS small{display:block;font-size:11.5px;color:#8a8a8a;margin-top:1px}" +
    ".dzOk{display:flex;gap:4px}.dzOk button{width:34px;height:34px;border-radius:10px;border:1px solid #2a2a2a;background:#161616;color:#ddd;font-size:15px;cursor:pointer}" +
    ".dzOk button:disabled{opacity:.3;cursor:default}.dzOk button:active:not(:disabled){transform:scale(.94);border-color:#e0a24f}" +
    ".dzS.oynadi{border-color:#e0a24f}" +
    ".dzAlt{display:flex;gap:8px}.dzAlt button{min-height:46px;border-radius:13px;font:700 14px system-ui,sans-serif;cursor:pointer}" +
    ".dzSif{padding:0 14px;border:1px solid #333;background:transparent;color:#bbb}.dzTam{flex:1;border:0;background:linear-gradient(160deg,#f3d38a,#e0a24f);color:#1a1205}" +
    "@media (prefers-reduced-motion: reduce){.dzSh,.dzK,.dzSw,.dzSw::after,.dzS{transition:none}}" +
    "html[data-tema=\"acik\"] .dzK{background:#fff;border-color:#c9d3e0}html[data-tema=\"acik\"] .dzK h3{color:#8a5a12}html[data-tema=\"acik\"] .dzK>p{color:#3d4653}" +
    "html[data-tema=\"acik\"] .dzKmp{background:#fbf4e6;border-color:#e6cf9f}html[data-tema=\"acik\"] .dzKmp b,html[data-tema=\"acik\"] .dzS b{color:#10151c}" +
    "html[data-tema=\"acik\"] .dzKmp small,html[data-tema=\"acik\"] .dzS small,html[data-tema=\"acik\"] .dzGr{color:#3d4653}" +
    "html[data-tema=\"acik\"] .dzS{background:#f6f8fb;border-color:#c9d3e0}html[data-tema=\"acik\"] .dzOk button{background:#fff;border-color:#c9d3e0;color:#2a3340}" +
    "html[data-tema=\"acik\"] .dzSw{background:#c9d3e0}html[data-tema=\"acik\"] .dzSw::after{background:#fff}html[data-tema=\"acik\"] .dzSw:checked{background:#c98a35}" +
    "html[data-tema=\"acik\"] .dzSif{border-color:#c9d3e0;color:#3d4653}html[data-tema=\"acik\"] .dzK .grab{background:#c9d3e0}";
  document.head.appendChild(css);

  var sh = null, geri = null, oynayan = null;
  function satir(k, i, n) {
    var b = BK[k], acik = D.gizli.indexOf(k) < 0;
    return '<div class="dzS' + (acik ? "" : " kapali") + (oynayan === k ? " oynadi" : "") + '" data-k="' + k + '"><span class="i" aria-hidden="true">' + b[1] + "</span><span><b>" + b[2] + "</b><small>" + b[3] + "</small></span>" +
      (b[4] ? '<span class="dzOk"><button type="button" data-yon="-1" aria-label="' + b[2] + ' yukarı"' + (i === 0 ? " disabled" : "") + '>↑</button><button type="button" data-yon="1" aria-label="' + b[2] + ' aşağı"' + (i === n - 1 ? " disabled" : "") + ">↓</button></span>" : "<span></span>") +
      '<input type="checkbox" class="dzSw" role="switch" data-goster="' + k + '"' + (acik ? " checked" : "") + ' aria-label="' + b[2] + ' görünsün">' + "</div>";
  }
  function ciz() {
    var ust = BOL.filter(function (b) { return !b[4]; }).map(function (b) { return b[0]; });
    sh.querySelector(".dzK").innerHTML = '<div class="grab" aria-hidden="true"></div><h3 id="dzB">🧩 Ana sayfayı düzenle</h3>' +
      "<p>Görmek istemediğin bölümleri kapat, sırasını oklarla değiştir. Ayar yalnızca bu cihazda tutulur; arama yaparken gizli bölümler de taranır.</p>" +
      '<label class="dzKmp"><span><b>Kompakt görünüm</b><small>Açıklamalar gizlenir, satırlar sıkılaşır; sayfa belirgin kısalır</small></span><input type="checkbox" class="dzSw" role="switch" id="dzKmpS"' + (D.kompakt ? " checked" : "") + "></label>" +
      '<div class="dzGr">Bölümler</div><div class="dzL">' + D.sira.map(function (k, i) { return satir(k, i, D.sira.length); }).join("") + "</div>" +
      '<div class="dzGr">Üst ve alt kısım</div><div class="dzL">' + ust.map(function (k) { return satir(k, 0, 1); }).join("") + "</div>" +
      '<div class="dzAlt"><button type="button" class="dzSif">Varsayılana dön</button><button type="button" class="dzTam">Tamam</button></div>';
  }
  function uygula() { yaz(D); sirala(); siniflar(false); if (typeof sonra === "function") sonra(); }
  function kapa() {
    if (!sh || sh.hidden) return;
    sh.classList.remove("ac"); document.removeEventListener("keydown", tus);
    setTimeout(function () { sh.hidden = true; document.body.style.overflow = ""; if (geri) geri.focus({ preventScroll: true }); }, 250);
  }
  function tus(e) { if (e.key === "Escape") kapa(); }
  function ac() {
    geri = document.activeElement;
    if (!sh) {
      sh = document.createElement("div"); sh.className = "dzSh"; sh.hidden = true;
      sh.innerHTML = '<div class="dzK" role="dialog" aria-modal="true" aria-labelledby="dzB"></div>';
      document.body.appendChild(sh);
      sh.addEventListener("click", function (e) {
        if (e.target === sh || e.target.closest(".dzTam")) return kapa();
        if (e.target.closest(".dzSif")) { D = { gizli: [], sira: VARS.slice(), kompakt: false }; oynayan = null; uygula(); ciz(); return; }
        var b = e.target.closest("button[data-yon]");
        if (b) {
          var k = b.closest(".dzS").dataset.k, i = D.sira.indexOf(k), j = i + Number(b.dataset.yon);
          if (j < 0 || j >= D.sira.length) return;
          D.sira.splice(i, 1); D.sira.splice(j, 0, k); oynayan = k; uygula(); ciz();
          var y = sh.querySelector('.dzS[data-k="' + k + '"] button[data-yon="' + b.dataset.yon + '"]'); if (y && !y.disabled) y.focus(); else { y = sh.querySelector('.dzS[data-k="' + k + '"] button:not(:disabled)'); if (y) y.focus(); }
        }
      });
      sh.addEventListener("change", function (e) {
        var c = e.target;
        if (c.id === "dzKmpS") { D.kompakt = c.checked; uygula(); window.Rapor && Rapor.bolum(c.checked ? "kompakt-ac" : "kompakt-kapa"); return; }
        var k = c.dataset.goster; if (!k) return;
        D.gizli = D.gizli.filter(function (x) { return x !== k; }); if (!c.checked) D.gizli.push(k);
        c.closest(".dzS").classList.toggle("kapali", !c.checked); uygula();
      });
    }
    ciz(); sh.hidden = false; document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { sh.classList.add("ac"); var t = sh.querySelector("#dzKmpS"); if (t) t.focus({ preventScroll: true }); });
    document.addEventListener("keydown", tus);
    window.Rapor && Rapor.bolum("ana-duzenle");
  }
  var btn = document.getElementById("dzBtn"); if (btn) btn.addEventListener("click", ac);
  window.AnaDuzen = { ac: ac };
})();
