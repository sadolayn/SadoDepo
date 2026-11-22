/* takvimaktar.js — "📲 Telefon takvimine aktar" kartı (Takvim & Ajanda → Liste sekmesi, 22 Kasım 2026).
   Önümüzdeki 12 ayın resmî tatilleri, vergi son günleri ve PPK toplantıları tek .ics dosyasında; isteğe göre bir gün önce 09:00 hatırlatma.
   Veriler sayfanın kendisinden: DAYS (takvimp.js), Vergi.events (vergi.js), data/ppk.json. Dosya yalnızca cihazda oluşur. */
(function () {
  var yer = document.getElementById("liste"); if (!yer || !window.ICS) return;
  var KEY = "takvimAktar";
  var S = { tatil: true, vb: true, vt: false, ppk: true, hat: true, acik: false };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  var kaydet = function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  var ymd = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  var bas = new Date(); bas.setHours(12, 0, 0, 0);
  var bit = new Date(bas); bit.setFullYear(bit.getFullYear() + 1);
  var B = ymd(bas), E = ymd(bit), PPK = [];

  function tatiller() {
    var L = [];
    if (typeof DAYS === "undefined") return L;
    DAYS.forEach(function (recs, k) {
      if (k < B || k > E) return;
      recs.forEach(function (r) {
        if (r.type !== "tam" && r.type !== "yarim") return;
        L.push({ uid: "tatil-" + k + "-" + r.type, gun: k, baslik: (r.type === "yarim" ? "🌗 " : "🇹🇷 ") + r.name + (r.type === "yarim" ? " (yarım gün)" : ""), aciklama: r.type === "yarim" ? "Öğleden sonra resmî tatil." : "Resmî tatil." });
      });
    });
    return L;
  }
  function vergiler(tur) {
    if (!window.Vergi || !Vergi.events) return [];
    return Vergi.events(bas, bit).filter(function (v) { return tur === "b" ? (v.c === "b" || v.both) : (v.c === "t" && !v.both); }).map(function (v) {
      var g = ymd(v.d);
      return { uid: "vergi-" + v.k + "-" + g, gun: g, baslik: v.ic + " Son gün: " + v.n, aciklama: v.t + (ymd(v.nom) !== g ? " (Asıl son gün hafta sonuna ya da tatile denk geldiği için ilk iş gününe kaydı.)" : "") + " Kaynak: GİB takvimi; değişiklik için gib.gov.tr'ye bak." };
    });
  }
  function ppkler() {
    return PPK.filter(function (g) { return g >= B && g <= E; }).map(function (g) {
      return { uid: "ppk-" + g, gun: g, baslik: "🏦 TCMB PPK toplantısı", aciklama: "Faiz kararı genellikle saat 14:00'te açıklanır. Kaynak: TCMB toplantı takvimi.", url: "https://www.tcmb.gov.tr" };
    });
  }
  var GR = [
    ["tatil", "🇹🇷", "Resmî tatiller", tatiller],
    ["vb", "🧾", "Vergi son günleri · bireysel", function () { return vergiler("b"); }],
    ["vt", "🏢", "Vergi son günleri · ticari", function () { return vergiler("t"); }],
    ["ppk", "🏦", "PPK toplantıları", ppkler],
  ];

  var st = document.createElement("style");
  st.textContent =
    ".aktar{margin-bottom:12px;padding-top:4px;padding-bottom:4px}" +
    ".akBas{display:flex;align-items:center;gap:10px;width:100%;min-height:48px;padding:6px 0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}" +
    ".akBas .t2{flex:1;min-width:0}.akBas .t{font:italic 700 17px Georgia,'Times New Roman',serif;color:#f3d38a}.akBas small{display:block;font:500 12px system-ui,sans-serif;color:var(--muted);font-style:normal;margin-top:1px}" +
    ".akBas .ok{flex:none;color:#e0a24f;font-size:18px;transition:transform .25s ease}.aktar.ac .akBas .ok{transform:rotate(90deg)}" +
    ".akIc{padding:4px 0 10px;animation:akGel .3s cubic-bezier(.2,.7,.2,1) both}.akIc[hidden]{display:none}" +
    "@keyframes akGel{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}" +
    ".akSw{display:flex;align-items:center;gap:10px;width:100%;min-height:40px;margin:0 0 10px;padding:0;border:0;background:none;color:#cfcfcf;font:500 13px system-ui,sans-serif;text-align:left;cursor:pointer}" +
    ".akSw i{flex:none;position:relative;width:42px;height:26px;border-radius:99px;background:#333;transition:background-color .2s ease}" +
    ".akSw i::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#bbb;transition:transform .2s ease,background-color .2s ease}" +
    ".akSw[aria-pressed=\"true\"] i{background:#e0a24f}.akSw[aria-pressed=\"true\"] i::after{transform:translateX(16px);background:#1a1205}" +
    "@media (prefers-reduced-motion: reduce){.akIc{animation:none}.akBas .ok,.akSw i,.akSw i::after{transition:none}}" +
    "html[data-tema=\"acik\"] .akBas .t{color:#8a5a12}html[data-tema=\"acik\"] .akSw{color:#2a3340}html[data-tema=\"acik\"] .akSw i{background:#c9d3e0}html[data-tema=\"acik\"] .akSw i::after{background:#fff}html[data-tema=\"acik\"] .akSw[aria-pressed=\"true\"] i{background:#c98a35}" +
    ".aktar p{margin:0 0 10px;font-size:13px;line-height:1.45;color:var(--muted)}" +
    ".akSec{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}" +
    ".akSec button{display:flex;align-items:center;gap:8px;min-height:44px;padding:8px 10px;border-radius:12px;border:1px solid var(--line);background:#111;color:#cfcfcf;font:600 12.5px/1.3 system-ui,sans-serif;text-align:left;cursor:pointer;transition:border-color .2s ease,background-color .2s ease,color .2s ease}" +
    ".akSec button .i{font-size:17px}.akSec button small{display:block;font-weight:500;color:#8a8a8a;font-size:11.5px}" +
    ".akSec button.on{border-color:#e0a24f;background:rgba(224,162,79,.12);color:#fff}" +
    ".akSec button:active,.akBtn:active{transform:scale(.975)}" +
    ".akBtn{width:100%;min-height:46px;border:0;border-radius:13px;background:linear-gradient(160deg,#f3d38a,#e0a24f);color:#1a1205;font:700 14.5px system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 16px rgba(224,162,79,.22)}" +
    ".akBtn:disabled{opacity:.5;box-shadow:none}" +
    ".akNot{margin:8px 0 0;font-size:11.5px;color:#8a8a8a;line-height:1.4}" +
    "html[data-tema=\"acik\"] .akSec button{background:#f6f8fb;color:#2a3340}" +
    "html[data-tema=\"acik\"] .akSec button.on{background:#fbf0dc;border-color:#c9963f;color:#10151c}";
  document.head.appendChild(st);

  var k = document.createElement("div"); k.className = "card aktar"; k.id = "aktar";
  k.innerHTML = '<button type="button" class="akBas" aria-expanded="false" aria-controls="akIc" data-yeni="takvimAktar|2026-11-22|YENİ"><span style="font-size:22px" aria-hidden="true">📲</span><span class="t2"><span class="t">Telefon takvimine aktar</span><small>Tatiller, vergi son günleri, PPK · 12 ay</small></span><span class="ok" aria-hidden="true">›</span></button>' +
    '<div class="akIc" id="akIc" hidden>' +
    "<p>Önümüzdeki 12 ayın önemli günleri tek dosyada. Dosyayı açınca telefonun takvimi içe aktarmayı sorar (Samsung Takvim, Google Takvim).</p>" +
    '<div class="akSec" role="group" aria-label="Aktarılacaklar"></div>' +
    '<button type="button" class="akSw" id="akHat" aria-pressed="false"><i aria-hidden="true"></i>Bir gün önce 09:00\'da hatırlat</button>' +
    '<button type="button" class="akBtn" id="akBtn">📥 Takvim dosyasını indir</button>' +
    '<p class="akNot">Dosya yalnızca bu cihazda hazırlanır, hiçbir yere gönderilmez. Bayram tarihleri Diyanet\'e, vergi günleri GİB takvimine göre; resmî bir değişiklik olursa dosyayı yeniden indir.</p></div>';
  yer.insertBefore(k, yer.firstChild);
  var sec = k.querySelector(".akSec"), hat = k.querySelector("#akHat"), btn = k.querySelector("#akBtn"), basD = k.querySelector(".akBas"), ic = k.querySelector("#akIc");
  var acKapa = function (ac) { S.acik = ac; ic.hidden = !ac; k.classList.toggle("ac", ac); basD.setAttribute("aria-expanded", String(ac)); };
  hat.setAttribute("aria-pressed", String(!!S.hat)); acKapa(!!S.acik);
  basD.addEventListener("click", function () { acKapa(ic.hidden); kaydet(); });

  function ciz() {
    var top = 0;
    sec.innerHTML = GR.map(function (g) {
      var n = g[3]().length; if (S[g[0]]) top += n;
      return '<button type="button" data-g="' + g[0] + '" class="' + (S[g[0]] ? "on" : "") + '" aria-pressed="' + !!S[g[0]] + '"><span class="i">' + g[1] + "</span><span>" + g[2] + "<small>" + (n ? n + " gün" : "yükleniyor…") + "</small></span></button>";
    }).join("");
    btn.disabled = !top;
    btn.textContent = top ? "📥 Takvim dosyasını indir · " + top + " gün" : "Önce aktarılacakları seç";
  }
  sec.addEventListener("click", function (e) { var b = e.target.closest("button[data-g]"); if (!b) return; S[b.dataset.g] = !S[b.dataset.g]; kaydet(); ciz(); });
  hat.addEventListener("click", function () { S.hat = !S.hat; hat.setAttribute("aria-pressed", String(S.hat)); kaydet(); });
  btn.addEventListener("click", function () {
    var L = [];
    GR.forEach(function (g) { if (S[g[0]]) L = L.concat(g[3]()); });
    if (!L.length) return;
    if (S.hat) L.forEach(function (o) { o.alarmlar = ["-PT15H"]; });
    L.sort(function (a, b) { return a.gun.localeCompare(b.gun); });
    ICS.indir("sadolayn-takvim-" + B.slice(0, 7), L, "Sadolayn · önemli günler");
    window.Rapor && Rapor.bolum("takvim-aktar");
    btn.textContent = "✓ Dosya indi · aç ve takvime ekle"; setTimeout(ciz, 3500);
  });
  ciz();
  if (window.Ortak) Ortak.json("data/ppk.json").then(function (j) { PPK = (j && j.meetings) || []; ciz(); }).catch(function () { ciz(); });
})();
