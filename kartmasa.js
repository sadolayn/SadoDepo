// Kart masası — King ve Balayı King için ortak kart görünümü ve ayarlar.
// Kart yüzü (Solitaire ile aynı tarz), masa rengi, kart arkası deseni, ses ve oyun hızı.
// Ayarlar "kartOpt" anahtarında saklanır; iki oyunda ortaktır.
// Kullanım: kart boyu için kartın ya da kapsayıcısının üzerinde --cw (ör. 56px) tanımlanır.
//   KartMasa.el(kart)  → kart öğesi (kart: { s: "♠", r: 2..14 })
//   KartMasa.back()    → kapalı kart öğesi
//   KartMasa.wait(ms)  → oyun hızına göre bekleme
//   KartMasa.ayarlar() → ayarlar penceresini açar; id="ayarBtn" düğmesi kendiliğinden bağlanır
//   KartMasa.onChange  → ayar değişince çağrılır
(function () {
  const MASA = [
    ["sado", "Sadolayn mavisi", "#1a2bb8"], ["yesil", "Çuha yeşili", "#0f5a3a"], ["zumrut", "Zümrüt", "#0b6b5c"], ["gece", "Gece mavisi", "#14306b"],
    ["bordo", "Bordo", "#6b1a2a"], ["mor", "Mürdüm", "#43215e"], ["kahve", "Ceviz", "#4a2f1d"], ["antrasit", "Antrasit", "#24272d"],
  ];
  const ARKA = [["altin", "Altın"], ["lacivert", "Lacivert"], ["bordo", "Bordo"], ["zumrut", "Zümrüt"], ["gece", "Gece"]];
  const YUZ = [["klasik", "Klasik", "2 renk"], ["dort", "4 renk", "♦ mavi · ♣ yeşil"]];
  const RANK = { 1: "A", 11: "J", 12: "Q", 13: "K", 14: "A" };
  const OPT = { masa: "sado", arka: "altin", yuz: "klasik", hizli: false };
  try { Object.assign(OPT, JSON.parse(localStorage.getItem("kartOpt") || "{}")); } catch (e) {}
  const save = () => { try { localStorage.setItem("kartOpt", JSON.stringify(OPT)); } catch (e) {} };

  const css = document.createElement("style");
  css.textContent = `
:root { --masa: #1a2bb8; --kred: #d3261f; --kblue: #1f5fc4; --kgreen: #17803d; }
.table { background: linear-gradient(135deg, color-mix(in srgb, var(--masa), #fff 14%) 0%, var(--masa) 55%, color-mix(in srgb, var(--masa), #000 28%) 100%) !important; border-color: color-mix(in srgb, var(--masa), #fff 22%) !important; transition: background .4s; }
.card { width: var(--cw, 56px); height: calc(var(--cw, 56px) * 1.45); border-radius: calc(var(--cw, 56px) * .12); position: relative; flex: none;
  background: linear-gradient(180deg, #ffffff 0%, #f6f3ec 100%); color: #15161a; border: 1px solid rgba(0,0,0,.2);
  box-shadow: 0 1px 2px rgba(0,0,0,.35), 0 3px 8px rgba(0,0,0,.22); font-weight: 800; overflow: hidden; }
.card.red { color: var(--kred); }
.yuz-dort .card.k-d { color: var(--kblue); }
.yuz-dort .card.k-c { color: var(--kgreen); }
.card .r { position: absolute; top: 3%; left: 7%; font: 800 calc(var(--cw, 56px) * .5)/1 "Arial Narrow", system-ui, sans-serif; letter-spacing: -1px; transform-origin: left top; }
.card .r.ten { transform: scaleX(.8); letter-spacing: -2px; }
.card .s1 { position: absolute; top: 36%; left: 8%; font-size: calc(var(--cw, 56px) * .32); line-height: 1; }
.card .s2 { position: absolute; right: 9%; bottom: 5%; font-size: calc(var(--cw, 56px) * .6); line-height: 1; }
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
.kmSheet .in { width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto; background: #121212; border-radius: 22px 22px 0 0; border: 1px solid #2a2a2a; border-bottom: 0; padding: 14px 18px calc(18px + env(safe-area-inset-bottom)); animation: kmUp .22s ease-out; color: #eee; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; text-align: left; }
@keyframes kmUp { from { transform: translateY(40px); opacity: 0; } }
.kmSheet h2 { display: flex; align-items: center; justify-content: space-between; margin: 0 0 4px; font-size: 19px; }
.kmSheet h2 button { width: 34px; height: 34px; border-radius: 50%; border: 0; background: #222; color: #bbb; font-size: 16px; cursor: pointer; }
.kmSheet h4 { margin: 16px 0 8px; font-size: 11.5px; letter-spacing: 1.4px; color: #8a8a8a; font-weight: 700; }
.kmSheet .opt { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid #1f1f1f; font-size: 15.5px; }
.kmSheet .opt > span:first-child { flex: 1; } .kmSheet .opt small { display: block; font-size: 12px; color: #8a8a8a; margin-top: 2px; }
.kmSheet .sw { position: relative; width: 50px; height: 30px; flex: none; }
.kmSheet .sw input { opacity: 0; width: 0; height: 0; position: absolute; }
.kmSheet .sw i { position: absolute; inset: 0; border-radius: 99px; background: #3a3a3a; transition: background .2s; cursor: pointer; }
.kmSheet .sw i::after { content: ""; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.4); }
.kmSheet .sw input:checked + i { background: #3fc283; }
.kmSheet .sw input:checked + i::after { transform: translateX(20px); }
.kmColors { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.kmColors button { aspect-ratio: 1.5; border-radius: 12px; border: 2px solid transparent; cursor: pointer; font: 600 11px system-ui; color: rgba(255,255,255,.88); display: flex; align-items: flex-end; justify-content: center; padding: 0 2px 5px; text-shadow: 0 1px 2px rgba(0,0,0,.6); line-height: 1.1; }
.kmColors button.on { border-color: #fff; box-shadow: 0 0 0 2px #e0a24f; }
.kmBacks { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.kmBacks button, .kmFaces button { border: 2px solid transparent; background: none; border-radius: 12px; padding: 6px 2px; cursor: pointer; color: #bbb; font: 600 11px system-ui; }
.kmBacks button.on, .kmFaces button.on { border-color: #e0a24f; color: #fff; background: #1a1a1a; }
.kmBacks .card { display: block; margin: 0 auto 5px; --cw: 40px; }
.kmFaces { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.kmFaces .row { display: flex; justify-content: center; gap: 3px; margin-bottom: 6px; --cw: 34px; }
.kmFaces small { display: block; font-weight: 400; color: #8a8a8a; font-size: 10.5px; margin-top: 1px; }
`;
  document.head.appendChild(css);

  const isRed = (s) => s === "♥" || s === "♦";
  const suitCls = { "♠": "k-s", "♥": "k-h", "♣": "k-c", "♦": "k-d" };
  function face(c) {
    return `<span class="r${c.r === 10 ? " ten" : ""}">${RANK[c.r] || c.r}</span><span class="s1">${c.s}\uFE0E</span><span class="s2">${c.s}\uFE0E</span>`;
  }
  function el(c) {
    const d = document.createElement("div");
    d.className = "card " + suitCls[c.s] + (isRed(c.s) ? " red" : "");
    d.innerHTML = face(c);
    return d;
  }
  function back() { const d = document.createElement("div"); d.className = "card back"; return d; }
  const html = (c) => `<div class="card ${suitCls[c.s]}${isRed(c.s) ? " red" : ""}">${face(c)}</div>`;

  function apply() {
    const m = MASA.find((x) => x[0] === OPT.masa) || MASA[0];
    document.documentElement.style.setProperty("--masa", m[2]);
    const b = document.body;
    if (!b) return;
    b.classList.remove(...ARKA.map((a) => "arka-" + a[0]), "yuz-klasik", "yuz-dort");
    b.classList.add("arka-" + OPT.arka, "yuz-" + OPT.yuz);
  }

  let sheet = null;
  function ayarlar() {
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.className = "kmSheet"; sheet.hidden = true;
      sheet.onclick = (e) => { if (e.target === sheet) sheet.hidden = true; };
      document.body.appendChild(sheet);
    }
    const muted = window.CardSfx && CardSfx.muted ? CardSfx.muted() : false;
    const demo = [{ s: "♠", r: 14 }, { s: "♥", r: 13 }, { s: "♦", r: 10 }, { s: "♣", r: 7 }];
    sheet.innerHTML = `<div class="in">
      <h2>⚙️ Ayarlar <button data-x aria-label="Kapat">✕</button></h2>
      <h4>OYUN</h4>
      <label class="opt"><span>🔊 Kart sesleri</span><span class="sw"><input type="checkbox" data-o="ses"${muted ? "" : " checked"}><i></i></span></label>
      <label class="opt"><span>⚡ Hızlı oyun<small>Rakipler kartlarını daha çabuk atar</small></span><span class="sw"><input type="checkbox" data-o="hizli"${OPT.hizli ? " checked" : ""}><i></i></span></label>
      <h4>KART YÜZÜ</h4>
      <div class="kmFaces">${YUZ.map(([k, ad, alt]) => `<button data-yuz="${k}" class="yuz-${k}${OPT.yuz === k ? " on" : ""}"><div class="row">${demo.map(html).join("")}</div>${ad}<small>${alt}</small></button>`).join("")}</div>
      <h4>MASA RENGİ</h4>
      <div class="kmColors">${MASA.map(([k, ad, c]) => `<button data-masa="${k}" class="${OPT.masa === k ? "on" : ""}" style="background:radial-gradient(120% 90% at 50% 30%, color-mix(in srgb, ${c} 82%, #fff), ${c} 60%)">${ad}</button>`).join("")}</div>
      <h4>KART ARKASI</h4>
      <div class="kmBacks">${ARKA.map(([k, ad]) => `<button data-arka="${k}" class="arka-${k}${OPT.arka === k ? " on" : ""}"><span class="card back"></span>${ad}</button>`).join("")}</div>
    </div>`;
    const changed = () => { save(); apply(); ayarlar(); if (typeof KartMasa.onChange === "function") KartMasa.onChange(); };
    sheet.querySelector("[data-x]").onclick = () => (sheet.hidden = true);
    sheet.querySelector('[data-o="ses"]').onchange = (e) => { if (window.CardSfx && CardSfx.setMuted) { CardSfx.setMuted(!e.target.checked); if (e.target.checked) CardSfx.play(); } };
    sheet.querySelector('[data-o="hizli"]').onchange = (e) => { OPT.hizli = e.target.checked; save(); };
    sheet.querySelectorAll("[data-yuz]").forEach((b) => (b.onclick = () => { OPT.yuz = b.dataset.yuz; changed(); }));
    sheet.querySelectorAll("[data-masa]").forEach((b) => (b.onclick = () => { OPT.masa = b.dataset.masa; changed(); }));
    sheet.querySelectorAll("[data-arka]").forEach((b) => (b.onclick = () => { OPT.arka = b.dataset.arka; changed(); }));
    sheet.hidden = false;
  }

  const KartMasa = {
    OPT, el, back, html, ayarlar, apply,
    hiz: () => (OPT.hizli ? 0.5 : 1),
    wait: (ms) => new Promise((r) => setTimeout(r, ms * (OPT.hizli ? 0.5 : 1))),
    onChange: null,
  };
  window.KartMasa = KartMasa;
  const init = () => { apply(); const b = document.getElementById("ayarBtn"); if (b) b.onclick = ayarlar; };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
