// Kart masası — King, Balayı King, Batak ve Solitaire için ortak kart görünümü ve ⚙️ ayarlar.
// Kart yüzü (renk düzeni, yazı tipi, kalınlık, punto), kart arkası ve ses bütün oyunlarda ortaktır;
// masa rengi her oyunda ayrı saklanır. Ayarlar "kartOpt" anahtarındadır.
// Sayfa, betik etiketinde ayar verir:
//   <script src="kartmasa.js" data-oyun="batak" data-masa="sado" data-hiz="yok" data-tema="1">
//   data-oyun : masa rengi bu adla saklanır (yoksa sayfa adı)
//   data-masa : o oyunun varsayılan masa rengi
//   (kart düzeni her oyunda aynı; üst üste dizilen elin kapsayıcısına "kose" sınıfı verilirse küçük simge rakamın altına iner)
//   data-hiz  : "yok" → "Hızlı oyun" seçeneği gösterilmez
//   data-tema : "1" → tarayıcının şerit rengi masa rengini alır
// Kullanım: kart boyu için kartın ya da kapsayıcısının üzerinde --cw (ör. 56px) tanımlanır.
//   KartMasa.el(kart) / KartMasa.html(kart) → kart (kart: { s: "♠", r: 2..14 }) · KartMasa.back() → kapalı kart
//   KartMasa.yuz(kart) / KartMasa.sinif(kart) → yalnızca kartın içi ve sınıfı (kendi yerleşimini yapan oyunlar için)
//   KartMasa.wait(ms) / KartMasa.hiz()      → oyun hızına göre bekleme
//   KartMasa.ayarlar()                      → ayarlar penceresi; id="ayarBtn" düğmesi kendiliğinden bağlanır
//   KartMasa.ekstra = { oyun: () => html, alt: () => html, bagla: (kok) => {} } → sayfaya özel bölümler
//   KartMasa.onChange                       → görünüm değişince çağrılır
//   KartMasa.kurallar = () => html          → ⚙️ Ayarlar'ın en üstünde açılır "📖 Oyunun kuralları" bölümü
(function () {
  const S = document.currentScript, D = (S && S.dataset) || {};
  const OYUN = D.oyun || (location.pathname.match(/([\w-]+)\.html$/) || [0, "kart"])[1];
  const MASA = [
    ["sado", "Sadolayn mavisi", "#1a2bb8"], ["yesil", "Çuha yeşili", "#0f5a3a"], ["zumrut", "Zümrüt", "#0b6b5c"],
    ["gece", "Gece mavisi", "#14306b"], ["okyanus", "Okyanus", "#1f5f9a"], ["bordo", "Bordo", "#6b1a2a"],
    ["mor", "Mürdüm", "#43215e"], ["kahve", "Ceviz", "#4a2f1d"], ["antrasit", "Antrasit", "#24272d"],
  ];
  const ARKA = [["altin", "Altın"], ["lacivert", "Lacivert"], ["bordo", "Bordo"], ["zumrut", "Zümrüt"], ["gece", "Gece"]];
  // Kart yüzü seçenekleri
  const RENK = { klasik: ["2 renk"], dort: ["4 renk"] };
  const YAZI = {
    modern: ["Modern", '"Arial Narrow", system-ui, sans-serif'],
    klasik: ["Klasik", 'Georgia, "Times New Roman", "Noto Serif", serif'],
    daktilo: ["Daktilo", 'ui-monospace, "SF Mono", "Roboto Mono", Menlo, Consolas, "Courier New", monospace'],
    suslu: ["Süslü", '"Snell Roundhand", "Segoe Script", "Brush Script MT", "Dancing Script", cursive'],
  };
  const KALIN = { ince: ["İnce", 400, 0], kalin: ["Kalın", 800, 0], ekstra: ["Ekstra kalın", 900, 0.016] }; // ad, kalınlık, kontur
  const PUNTO = { kucuk: ["Küçük", 0.86, 1, 0.9], normal: ["Normal", 1, 1, 1], buyuk: ["Büyük", 1.14, 0.9, 1.08], jumbo: ["Jumbo", 1.3, 0.8, 1.12] }; // ad, boy, en, simge
  const HAZIR = [
    ["klasik", "Klasik", "Varsayılan", { yuz: "klasik", yazi: "modern", kalin: "kalin", punto: "normal" }],
    ["dort", "4 Renk", "♦ mavi · ♣ yeşil", { yuz: "dort", yazi: "modern", kalin: "kalin", punto: "normal" }],
    ["okunakli", "Okunaklı", "Jumbo · ekstra kalın", { yuz: "dort", yazi: "modern", kalin: "ekstra", punto: "jumbo" }],
    ["zarif", "Zarif", "Klasik yazı · ince", { yuz: "klasik", yazi: "klasik", kalin: "ince", punto: "normal" }],
    ["daktilo", "Daktilo", "Eski usul · büyük", { yuz: "klasik", yazi: "daktilo", kalin: "kalin", punto: "buyuk" }],
    ["suslu", "Süslü", "El yazısı · büyük", { yuz: "klasik", yazi: "suslu", kalin: "kalin", punto: "buyuk" }],
  ];
  const RANK = { 1: "A", 11: "J", 12: "Q", 13: "K", 14: "A" };
  const OPT = { masa: "sado", masalar: {}, arka: "altin", yuz: "klasik", yazi: "modern", kalin: "kalin", punto: "normal", hizli: false };
  let ilk = true;
  try { const o = JSON.parse(localStorage.getItem("kartOpt") || "null"); if (o && typeof o === "object") { Object.assign(OPT, o); ilk = false; } } catch (e) {}
  if (!OPT.masalar || typeof OPT.masalar !== "object") OPT.masalar = {};
  if (!RENK[OPT.yuz]) OPT.yuz = "klasik";
  if (!YAZI[OPT.yazi]) OPT.yazi = "modern";
  if (!KALIN[OPT.kalin]) OPT.kalin = "kalin";
  if (!PUNTO[OPT.punto]) OPT.punto = "normal";
  if (!ARKA.some((a) => a[0] === OPT.arka)) OPT.arka = "altin";
  // Solitaire'in eski ayarları (masa rengi, kart arkası) bir kez taşınır
  if (OYUN === "solitaire" && !OPT.masalar.solitaire) {
    try {
      const s = JSON.parse(localStorage.getItem("solOpt") || "{}"), es = { lacivert: "gece", mavi: "okyanus" };
      if (s.masa) OPT.masalar.solitaire = es[s.masa] || s.masa;
      if (ilk && s.arka) OPT.arka = s.arka;
    } catch (e) {}
  }
  const save = () => { try { localStorage.setItem("kartOpt", JSON.stringify(OPT)); } catch (e) {} };
  const masaKey = () => { const k = OPT.masalar[OYUN] || D.masa || OPT.masa; return MASA.some((m) => m[0] === k) ? k : MASA[0][0]; };

  const css = document.createElement("style");
  css.textContent = `
:root { --masa: #1a2bb8; --kred: #d3261f; --kblue: #1f5fc4; --kgreen: #17803d; }
.table { background: linear-gradient(135deg, color-mix(in srgb, var(--masa), #fff 14%) 0%, var(--masa) 55%, color-mix(in srgb, var(--masa), #000 28%) 100%) !important; border-color: color-mix(in srgb, var(--masa), #fff 22%) !important; transition: background .4s; }
.card { width: var(--cw, 56px); height: calc(var(--cw, 56px) * 1.45); border-radius: calc(var(--cw, 56px) * .12); position: relative; flex: none;
  background: linear-gradient(180deg, #ffffff 0%, #f6f3ec 100%); color: #15161a; border: 1px solid rgba(0,0,0,.2);
  box-shadow: 0 1px 2px rgba(0,0,0,.35), 0 3px 8px rgba(0,0,0,.22); font-weight: 800; overflow: hidden; }
.card.red { color: var(--kred); }
.card.k-d { color: var(--kd, var(--kred)); }
.card.k-c { color: var(--kc, #15161a); }
.card .r { position: absolute; top: 2%; left: 6%; font-family: var(--kf, "Arial Narrow", system-ui, sans-serif); font-weight: var(--kw, 800);
  font-size: calc(var(--cw, 56px) * .5 * var(--kp, 1)); line-height: 1; letter-spacing: -1px; transform-origin: left top; transform: scaleX(var(--kx, 1));
  -webkit-text-stroke: calc(var(--cw, 56px) * var(--kst, 0)) currentColor; }
.card .r.ten { transform: scaleX(calc(.8 * var(--kx, 1))); letter-spacing: -2px; }
/* Bütün oyunlarda aynı düzen: rakam sol üstte, küçük simge sağ üstte, büyük simge altta ortada */
.card .s1 { position: absolute; top: 3.5%; right: 5%; font-size: calc(var(--cw, 56px) * .37 * var(--ksp, 1) / var(--kp, 1)); line-height: 1; } /* büyük puntoda rakama yer açılsın */
.card .s2 { position: absolute; left: 0; right: 0; bottom: 6%; display: flex; justify-content: center; font-size: calc(var(--cw, 56px) * .56); line-height: 1; }
.card .s1 svg, .card .s2 svg { display: block; width: 1em; height: 1em; fill: currentColor; }
/* Üst üste dizilen elde (Batak, King) kartın sağı görünmez: küçük simge rakamın altına iner */
.kose .card .s1 { top: calc(var(--cw, 56px) * (.06 + .5 * var(--kp, 1))); right: auto; left: 7%; font-size: calc(var(--cw, 56px) * .28 * var(--ksp, 1)); }
.card.back > * { display: none; }
.card.back, .kb { border: 2px solid #fff; }
.card.back::after, .kb::after { content: ""; position: absolute; inset: 2px; border-radius: inherit; }
.kb { position: relative; display: inline-block; overflow: hidden; }
.arka-altin .card.back, .arka-altin .kb { background: #b9802e; }
.arka-altin .card.back::after, .arka-altin .kb::after { background: repeating-linear-gradient(45deg, rgba(255,255,255,.16) 0 4px, transparent 4px 8px), radial-gradient(circle at 50% 50%, #f1c57c 0 16%, transparent 17%), linear-gradient(160deg, #d39a45, #9c6522); }
.arka-lacivert .card.back, .arka-lacivert .kb { background: #1b2a6b; }
.arka-lacivert .card.back::after, .arka-lacivert .kb::after { background: repeating-linear-gradient(45deg, rgba(224,162,79,.4) 0 1px, transparent 1px 7px), repeating-linear-gradient(-45deg, rgba(224,162,79,.4) 0 1px, transparent 1px 7px), linear-gradient(160deg, #2a3fa8, #121c55); }
.arka-bordo .card.back, .arka-bordo .kb { background: #6d1426; }
.arka-bordo .card.back::after, .arka-bordo .kb::after { background: radial-gradient(circle, rgba(255,214,150,.4) 1.2px, transparent 1.6px) 0 0 / 7px 7px, linear-gradient(160deg, #9b2036, #4f0d1b); }
.arka-zumrut .card.back, .arka-zumrut .kb { background: #0b5a48; }
.arka-zumrut .card.back::after, .arka-zumrut .kb::after { background: repeating-conic-gradient(rgba(255,255,255,.13) 0 25%, transparent 0 50%) 0 0 / 10px 10px, linear-gradient(160deg, #12806a, #063d31); }
.arka-gece .card.back, .arka-gece .kb { background: #111; border-color: #e0a24f; }
.arka-gece .card.back::after, .arka-gece .kb::after { inset: 3px; border: 1px solid rgba(224,162,79,.7); background: radial-gradient(circle at 50% 50%, transparent 0 22%, rgba(224,162,79,.55) 23% 26%, transparent 27%), repeating-linear-gradient(90deg, rgba(224,162,79,.12) 0 1px, transparent 1px 5px), linear-gradient(160deg, #1e1e1e, #050505); }
.kmBtn { width: 40px; height: 40px; flex: 0 0 40px; border-radius: 50%; border: 1px solid #333; background: #161616; color: #fff; font-size: 19px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; }
.kmSheet { position: fixed; inset: 0; z-index: 1100; background: rgba(0,0,0,.55); display: flex; align-items: flex-end; justify-content: center; }
.kmSheet[hidden] { display: none; }
.kmSheet .in { width: 100%; max-width: 480px; max-height: 88vh; max-height: calc(100dvh - 20px); overflow-y: auto; overscroll-behavior: contain; background: #121212; border-radius: 22px 22px 0 0; border: 1px solid #2a2a2a; border-bottom: 0; padding: 14px 18px calc(18px + env(safe-area-inset-bottom)); color: #eee; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; text-align: left; }
.kmSheet.acil .in { animation: kmUp .22s ease-out; }
@keyframes kmUp { from { transform: translateY(40px); opacity: 0; } }
.kmSheet h2 { display: flex; align-items: center; justify-content: space-between; margin: 0 0 4px; font-size: 19px; }
.kmSheet h2 button { width: 34px; height: 34px; border-radius: 50%; border: 0; background: #222; color: #bbb; font-size: 16px; cursor: pointer; }
.kmSheet h4 { margin: 18px 0 8px; font-size: 11.5px; letter-spacing: 1.4px; color: #8a8a8a; font-weight: 700; }
.kmSheet h4 small { letter-spacing: .3px; font-weight: 500; color: #6f6f6f; }
.kmSheet .opt { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid #1f1f1f; font-size: 15.5px; }
.kmSheet .opt > span:first-child { flex: 1; } .kmSheet .opt small { display: block; font-size: 12px; color: #8a8a8a; margin-top: 2px; }
.kmSheet .sw { position: relative; width: 50px; height: 30px; flex: none; }
.kmSheet .sw input { opacity: 0; width: 0; height: 0; position: absolute; }
.kmSheet .sw i { position: absolute; inset: 0; border-radius: 99px; background: #3a3a3a; transition: background .2s; cursor: pointer; }
.kmSheet .sw i::after { content: ""; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.4); }
.kmSheet .sw input:checked + i { background: #3fc283; }
.kmSheet .sw input:checked + i::after { transform: translateX(20px); }
.kmSeg { display: flex; flex: none; gap: 3px; padding: 3px; border-radius: 11px; background: #1e1e1e; }
.kmSeg button { flex: 1; border: 0; background: none; color: #aaa; padding: 8px 4px; border-radius: 8px; font: 700 13.5px system-ui, sans-serif; cursor: pointer; white-space: nowrap; }
.kmSeg button.on { background: #e0a24f; color: #1a1205; }
.kmTok { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 14px; background: linear-gradient(90deg, rgba(240,198,116,.16), rgba(240,198,116,.05)); border: 1px solid rgba(240,198,116,.3); font-size: 14px; color: #eadcc6; }
.kmTok b { font-size: 17px; color: #ffe2a6; }
.kmKural { margin: 2px 0 6px; border: 1px solid #4a3a1e; border-radius: 14px; background: rgba(224,162,79,.06); }
.kmKural summary { padding: 11px 14px; font-weight: 700; color: #f3c27c; cursor: pointer; list-style: none; }
.kmKural summary::-webkit-details-marker { display: none; }
.kmKural summary::after { content: "›"; float: right; transition: transform .2s; }
.kmKural[open] summary::after { transform: rotate(90deg); }
.kmKuralIc { padding: 0 14px 10px; }
.kmKuralIc ul { margin: 0; padding-left: 18px; font-size: 13.5px; line-height: 1.55; color: #cfc6b4; text-align: left; }
.kmKuralIc li { margin: 4px 0; }
.kmKuralIc b { color: #fff; }
.kmNot { margin: 6px 2px 0; font-size: 12px; color: #8a8a8a; line-height: 1.45; }
.kmPrev { display: flex; justify-content: center; gap: 8px; padding: 14px 8px 12px; border-radius: 16px; --cw: 58px;
  background: radial-gradient(120% 100% at 50% 20%, color-mix(in srgb, var(--masa) 82%, #fff), var(--masa) 65%, color-mix(in srgb, var(--masa), #000 30%)); }
.kmPrevL { text-align: center; font-size: 12px; color: #9a9a9a; margin: 6px 0 12px; }
.kmPrevL b { color: #e0a24f; font-weight: 700; }
.kmHazir { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.kmHazir button { border: 2px solid transparent; background: #1a1a1a; border-radius: 12px; padding: 8px 4px 7px; cursor: pointer; color: #ddd; font: 700 13px system-ui, sans-serif; }
.kmHazir button.on { border-color: #e0a24f; color: #fff; background: #221b12; }
.kmHazir .row { display: flex; justify-content: center; gap: 3px; margin-bottom: 6px; --cw: 32px; }
.kmHazir small { display: block; font-weight: 400; color: #8a8a8a; font-size: 10.5px; margin-top: 1px; }
.kmAyar { display: grid; gap: 10px; margin-top: 4px; }
.kmAyar .kmL { font-size: 12.5px; color: #a8a8a8; margin: 0 0 5px 2px; }
.kmColors { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.kmColors button { height: 46px; border-radius: 12px; border: 2px solid transparent; cursor: pointer; font: 600 11px system-ui; color: rgba(255,255,255,.88); display: flex; align-items: flex-end; justify-content: center; padding: 0 2px 5px; text-shadow: 0 1px 2px rgba(0,0,0,.6); line-height: 1.1; }
.kmColors button.on { border-color: #fff; box-shadow: 0 0 0 2px #e0a24f; }
.kmBacks { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.kmBacks button { border: 2px solid transparent; background: none; border-radius: 12px; padding: 6px 2px; cursor: pointer; color: #bbb; font: 600 11px system-ui; }
.kmBacks button.on { border-color: #e0a24f; color: #fff; background: #1a1a1a; }
.kmBacks .card { display: block; margin: 0 auto 5px; --cw: 40px; }
`;
  document.head.appendChild(css);

  const isRed = (s) => s === "♥" || s === "♦";
  const suitCls = { "♠": "k-s", "♥": "k-h", "♣": "k-c", "♦": "k-d" };
  // Simgeler yazı tipine bırakılmaz, çizilir: telefonun yazı tipinde ♠ ile ♣ küçükken birbirine benziyordu.
  // Maça sivri tepeli tek yaprak, sinek üç yuvarlak yapraklı yonca; ikisinin de ayağı aynı.
  const AYAK = "M45 62C45 79 39 90 28 97H72C61 90 55 79 55 62Z";
  const SUIT = {
    "♠": `<path d="M50 3C60 20 96 37 96 59C96 74 85 83 72 83C63 83 56 79 52 72H48C44 79 37 83 28 83C15 83 4 74 4 59C4 37 40 20 50 3Z"/><path d="${AYAK}"/>`,
    "♣": `<circle cx="50" cy="25" r="21"/><circle cx="25" cy="57" r="21"/><circle cx="75" cy="57" r="21"/><circle cx="50" cy="50" r="13"/><path d="${AYAK}"/>`,
    "♥": `<path d="M50 94C22 70 3 52 3 31C3 15 15 4 29 4C39 4 46 10 50 19C54 10 61 4 71 4C85 4 97 15 97 31C97 52 78 70 50 94Z"/>`,
    "♦": `<path d="M50 2L89 50L50 98L11 50Z"/>`,
  };
  const simge = (s) => `<svg viewBox="0 0 100 100" aria-hidden="true">${SUIT[s] || ""}</svg>`;
  function face(c) {
    const g = simge(c.s);
    return `<span class="r${c.r === 10 ? " ten" : ""}">${RANK[c.r] || c.r}</span><span class="s1" aria-label="${c.s}">${g}</span><span class="s2">${g}</span>`;
  }
  const cls = (c) => "card " + suitCls[c.s] + (isRed(c.s) ? " red" : "");
  function el(c) { const d = document.createElement("div"); d.className = cls(c); d.innerHTML = face(c); return d; }
  function back() { const d = document.createElement("div"); d.className = "card back"; return d; }
  const html = (c) => `<div class="${cls(c)}">${face(c)}</div>`;

  // Kart yüzü ayarı → CSS değişkenleri (önizleme kutuları kendi değişkenlerini taşır)
  function vars(o) {
    const y = YAZI[o.yazi] || YAZI.modern, k = KALIN[o.kalin] || KALIN.kalin, p = PUNTO[o.punto] || PUNTO.normal, d = o.yuz === "dort";
    return { "--kf": y[1], "--kw": k[1], "--kst": k[2], "--kp": p[1], "--kx": p[2], "--ksp": p[3], "--kd": d ? "var(--kblue)" : "var(--kred)", "--kc": d ? "var(--kgreen)" : "#15161a" };
  }
  const varStyle = (o) => Object.entries(vars(o)).map(([k, v]) => `${k}:${v}`).join(";").replace(/"/g, "'");
  function apply() {
    const m = MASA.find((x) => x[0] === masaKey()) || MASA[0];
    document.documentElement.style.setProperty("--masa", m[2]);
    if (D.tema === "1") { const t = document.querySelector('meta[name="theme-color"]'); if (t) t.setAttribute("content", m[2]); }
    const b = document.body;
    if (!b) return;
    b.classList.remove(...ARKA.map((a) => "arka-" + a[0]), "yuz-klasik", "yuz-dort");
    b.classList.add("arka-" + OPT.arka, "yuz-" + OPT.yuz);
    Object.entries(vars(OPT)).forEach(([k, v]) => b.style.setProperty(k, v));
  }
  const ayni = (o) => ["yuz", "yazi", "kalin", "punto"].every((k) => OPT[k] === o[k]);

  let sheet = null;
  function ayarlar() {
    let yeni = false;
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.className = "kmSheet"; sheet.hidden = true;
      sheet.onclick = (e) => { if (e.target === sheet) sheet.hidden = true; };
      document.body.appendChild(sheet);
    }
    if (sheet.hidden) { yeni = true; sheet.classList.add("acil"); } else sheet.classList.remove("acil");
    const eski = sheet.querySelector(".in"), kay = eski && !yeni ? eski.scrollTop : 0; // değişiklikte kaydırma yeri korunur
    const muted = window.CardSfx && CardSfx.muted ? CardSfx.muted() : false;
    const demo = [{ s: "♠", r: 14 }, { s: "♥", r: 13 }, { s: "♦", r: 10 }, { s: "♣", r: 7 }];
    const ex = KartMasa.ekstra || {};
    const hz = HAZIR.find((h) => ayni(h[3]));
    const seg = (k, L, fn) => `<div class="kmSeg" data-seg="${k}">${Object.entries(L).map(([v, a]) => `<button type="button" data-v="${v}" class="${OPT[k] === v ? "on" : ""}"${fn ? ` style="${fn(v, a)}"` : ""}>${a[0]}</button>`).join("")}</div>`;
    const tok = window.Token && Token.bakiye ? Token.bakiye() : null;
    sheet.innerHTML = `<div class="in">
      <h2>⚙️ Ayarlar <button data-x aria-label="Kapat">✕</button></h2>
      ${typeof KartMasa.kurallar === "function" ? `<details class="kmKural"${KartMasa.kuralAcik ? " open" : ""}><summary>📖 Oyunun kuralları</summary><div class="kmKuralIc">${KartMasa.kurallar()}</div></details>` : ""}
      <h4>OYUN</h4>
      <label class="opt"><span>🔊 Kart sesleri</span><span class="sw"><input type="checkbox" data-o="ses"${muted ? "" : " checked"}><i></i></span></label>
      ${D.hiz === "yok" ? "" : `<label class="opt"><span>⚡ Hızlı oyun<small>Rakipler kartlarını daha çabuk atar</small></span><span class="sw"><input type="checkbox" data-o="hizli"${OPT.hizli ? " checked" : ""}><i></i></span></label>`}
      ${ex.oyun ? ex.oyun() : ""}
      ${tok != null ? `<h4>⭐ YILDIZ</h4><div class="kmTok"><span>Bakiyen</span><b>${Token.fmt(tok)} Yıldız</b></div>
        <p class="kmNot">Bakiyen Batak, King ve Balayı King'de ortak. Biterse 3 saat sonra İş Bankası sorusu gelir; doğru cevap 1.000 Yıldız kazandırır.</p>` : ""}
      <h4>KART YÜZÜ <small>· bütün kart oyunlarında</small></h4>
      <div class="kmPrev">${demo.map(html).join("")}</div>
      <div class="kmPrevL">${hz ? `Şu an: <b>${hz[1]}</b>` : "Şu an: <b>Senin stilin</b>"} · ${RENK[OPT.yuz][0]} · ${YAZI[OPT.yazi][0]} · ${KALIN[OPT.kalin][0]} · ${PUNTO[OPT.punto][0]} punto</div>
      <div class="kmHazir">${HAZIR.map(([k, ad, alt, o]) => `<button type="button" data-hazir="${k}" class="${hz && hz[0] === k ? "on" : ""}"><div class="row" style="${varStyle(o)}">${demo.map(html).join("")}</div>${ad}<small>${alt}</small></button>`).join("")}</div>
      <h4>KENDİN AYARLA</h4>
      <div class="kmAyar">
        <div><div class="kmL">Renk düzeni</div>${seg("yuz", RENK)}</div>
        <div><div class="kmL">Yazı tipi</div>${seg("yazi", YAZI, (v, a) => `font-family:${a[1].replace(/"/g, "'")}`)}</div>
        <div><div class="kmL">Kalınlık</div>${seg("kalin", KALIN, (v, a) => `font-weight:${a[1]}`)}</div>
        <div><div class="kmL">Punto (harf ve rakam boyu)</div>${seg("punto", PUNTO)}</div>
      </div>
      <h4>MASA RENGİ <small>· bu oyunda</small></h4>
      <div class="kmColors">${MASA.map(([k, ad, c]) => `<button type="button" data-masa="${k}" class="${masaKey() === k ? "on" : ""}" style="background:radial-gradient(120% 90% at 50% 30%, color-mix(in srgb, ${c} 82%, #fff), ${c} 60%)">${ad}</button>`).join("")}</div>
      <h4>KART ARKASI</h4>
      <div class="kmBacks">${ARKA.map(([k, ad]) => `<button type="button" data-arka="${k}" class="arka-${k}${OPT.arka === k ? " on" : ""}"><span class="card back"></span>${ad}</button>`).join("")}</div>
      ${ex.alt ? ex.alt() : ""}
    </div>`;
    const changed = () => { save(); apply(); ayarlar(); if (typeof KartMasa.onChange === "function") KartMasa.onChange(); };
    sheet.querySelector("[data-x]").onclick = () => (sheet.hidden = true);
    sheet.querySelector('[data-o="ses"]').onchange = (e) => { if (window.CardSfx && CardSfx.setMuted) { CardSfx.setMuted(!e.target.checked); if (e.target.checked) CardSfx.play(); } if (typeof KartMasa.onSes === "function") KartMasa.onSes(e.target.checked); };
    const hb = sheet.querySelector('[data-o="hizli"]'); if (hb) hb.onchange = (e) => { OPT.hizli = e.target.checked; save(); };
    sheet.querySelectorAll("[data-hazir]").forEach((b) => (b.onclick = () => { Object.assign(OPT, HAZIR.find((h) => h[0] === b.dataset.hazir)[3]); changed(); }));
    sheet.querySelectorAll("[data-seg] button").forEach((b) => (b.onclick = () => { OPT[b.parentNode.dataset.seg] = b.dataset.v; changed(); }));
    sheet.querySelectorAll("[data-masa]").forEach((b) => (b.onclick = () => { OPT.masalar[OYUN] = b.dataset.masa; changed(); }));
    sheet.querySelectorAll("[data-arka]").forEach((b) => (b.onclick = () => { OPT.arka = b.dataset.arka; changed(); }));
    const kd = sheet.querySelector(".kmKural"); if (kd) kd.ontoggle = () => { KartMasa.kuralAcik = kd.open; };
    if (ex.bagla) ex.bagla(sheet);
    sheet.hidden = false;
    if (kay) sheet.querySelector(".in").scrollTop = kay;
  }

  const KartMasa = {
    OPT, el, back, html, ayarlar, apply, MASA,
    yuz: face, sinif: cls,
    olcu: () => { const p = PUNTO[OPT.punto] || PUNTO.normal; return { kp: p[1], kx: p[2] }; }, // harf boyu ve eni (yerleşim için)
    hiz: () => (OPT.hizli ? 0.5 : 1),
    wait: (ms) => new Promise((r) => setTimeout(r, ms * (OPT.hizli ? 0.5 : 1))),
    onChange: null,
    ekstra: null,
  };
  window.KartMasa = KartMasa;
  const init = () => { apply(); const b = document.getElementById("ayarBtn"); if (b) b.onclick = ayarlar; };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
