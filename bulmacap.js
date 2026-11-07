const $ = (id) => document.getElementById(id);
// ===== Sayı Bulmaca =====
const BM = { n: 4, lvl: 2, mine: "", ai: "", cand: [], all: [], me: [], aiL: [], over: false, tur: 1, not: Array(10).fill(0) };
const BMLV = { 1: "Sadolayn rahat oynar: sadece son ipuçlarını hatırlar.", 2: "Sadolayn tüm ipuçlarını kullanır, uyan sayılar arasından rastgele seçer.", 3: "Sadolayn her tahmini en çok olasılığı eleyecek şekilde hesaplar. Bol şans!" };
const distinct = (s) => new Set(s).size === s.length;
const validNum = (s, n) => new RegExp(`^[1-9]\\d{${n - 1}}$`).test(s) && distinct(s);
function randNum(n) { const d = "0123456789".split(""); let s; do { for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } s = d.slice(0, n).join(""); } while (s[0] === "0"); return s; }
function score(sec, g) { let p = 0, m = 0; for (let i = 0; i < g.length; i++) { if (sec[i] === g[i]) p++; else if (sec.includes(g[i])) m++; } return [p, m]; }
function allNums(n) { const out = [], rec = (pre, used) => { if (pre.length === n) { out.push(pre); return; } for (let d = 0; d <= 9; d++) { if (used & (1 << d)) continue; if (!pre && !d) continue; rec(pre + d, used | (1 << d)); } }; rec("", 0); return out; }
const fb = ([p, m]) => p === 0 && m === 0 ? '<span class="z">0</span>' : `<span>${p ? `<span class="p">+${p}</span>` : ""}${p && m ? " " : ""}${m ? `<span class="m">−${m}</span>` : ""}</span>`;
// Sadolayn'ın tahmini: tutarlı adaylar arasından en kötü durumda en az aday bırakanı seçer (minimax)
function aiGuess() {
  const C = BM.cand; if (C.length === 1) return C[0];
  if (BM.lvl === 1) { const last = BM.aiL.slice(-2); const P = BM.all.filter((c) => !BM.aiL.some((x) => x.g === c) && last.every((x) => score(c, x.g).join() === x.s.join())); const Q = Math.random() < 0.25 ? BM.all : P.length ? P : C; return Q[Math.floor(Math.random() * Q.length)]; }
  if (BM.lvl === 2) return C[Math.floor(Math.random() * C.length)];
  if (BM.aiL.length === 0) return C[Math.floor(Math.random() * C.length)];
  const sample = (arr, k) => { if (arr.length <= k) return arr; const r = []; for (let i = 0; i < k; i++) r.push(arr[Math.floor(Math.random() * arr.length)]); return r; };
  const G = sample(C, C.length > 1500 ? 120 : 350), T = sample(C, 700);
  let best = G[0], bw = Infinity;
  for (const g of G) { const cnt = new Map(); let w = 0; for (const t of T) { const k = score(t, g).join(","); const v = (cnt.get(k) || 0) + 1; cnt.set(k, v); if (v > w) w = v; if (w >= bw) break; } if (w < bw) { bw = w; best = g; } }
  return best;
}
function bmRender() {
  $("bmTur").textContent = BM.tur;
  ["bmMeL", "bmAiL"].forEach((id, j) => { const L = j ? BM.aiL : BM.me, el = $(id), son = L.length - 1;
    const row = (x, k) => `<div class="gr${x.s[0] === BM.n ? " win" : ""}${k === son && BM.yeni ? " yeni" : ""}"><i>${k + 1}</i><b>${x.g}</b>${fb(x.s)}</div>`;
    el.dataset.n = BM.n; el.innerHTML = L.map(row).join("") || '<p class="hint">Henüz yok</p>'; el.scrollTop = el.scrollHeight; });
  BM.yeni = false;
  bmPadRender();
}
let bmIn = "";
// Tuş "tık" sesi ve hafif titreşim (Hesaplamalar'daki makineyle aynı ses; ayar aynı: hesapSes)
let SND = true; try { SND = localStorage.getItem("hesapSes") !== "0"; } catch (e) {}
let AC = null;
function tik(big) {
  try { if (navigator.vibrate) navigator.vibrate(big ? 14 : 8); } catch (e) {}
  if (!SND) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume();
    const t = AC.currentTime, len = Math.floor(AC.sampleRate * 0.03), buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const src = AC.createBufferSource(); src.buffer = buf;
    const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = big ? 1700 : 2600; bp.Q.value = 1.4;
    const g = AC.createGain(); g.gain.value = 0.7; src.connect(bp).connect(g).connect(AC.destination); src.start(t);
  } catch (e) {}
}
function bmPadRender() {
  $("bmDisp").innerHTML = Array.from({ length: BM.n }, (_, k) => `<span class="${k === bmIn.length ? "cur" : ""}">${bmIn[k] || ""}</span>`).join("");
  $("bmKeys").querySelectorAll("button").forEach((b) => { const d = b.dataset.d, nt = BM.not[+d]; b.disabled = BM.over || bmIn.includes(d) || bmIn.length >= BM.n || (d === "0" && !bmIn.length); b.classList.toggle("n", nt === 1); b.classList.toggle("y", nt === 2); });
  $("bmNot").querySelectorAll("button").forEach((b) => { const nt = BM.not[+b.dataset.nd]; b.className = nt === 1 ? "n" : nt === 2 ? "y" : ""; b.setAttribute("aria-label", `${b.dataset.nd}: ${nt === 1 ? "yok" : nt === 2 ? "var" : "işaretsiz"}`); });
  $("bmRuloBtn").classList.toggle("on", !$("bmRulo").hidden);
  $("bmSend").disabled = BM.over || bmIn.length !== BM.n; $("bmDel").disabled = BM.over || !bmIn.length;
  bmKaydet();
}
function bmKey(d) {
  if (BM.over) return;
  if (bmIn.length < BM.n && !bmIn.includes(d) && !(d === "0" && !bmIn.length)) { bmIn += d; tik(false); }
  bmPadRender();
}
$("bmKeys").innerHTML = "1234567890".split("").map((d) => `<button type="button" data-d="${d}">${d}</button>`).join("");
$("bmNot").innerHTML = "0123456789".split("").map((d) => `<button type="button" data-nd="${d}">${d}</button>`).join("");
$("bmNot").addEventListener("click", (e) => { const b = e.target.closest("button[data-nd]"); if (!b || BM.over) return; const d = +b.dataset.nd; BM.not[d] = (BM.not[d] + 1) % 3; tik(false); bmPadRender(); });
// Tuşlar parmak değdiği anda çalışır (pointerdown); ardından gelen click yok sayılır. Klavyeyle/erişilebilirlik araçlarıyla basılan click yine çalışır.
let bmPD = 0;
$("bmKeys").addEventListener("pointerdown", (e) => { const b = e.target.closest("button[data-d]"); if (!b || b.disabled || e.button > 0) return; bmPD = Date.now(); e.preventDefault(); bmKey(b.dataset.d); });
$("bmKeys").addEventListener("click", (e) => { const b = e.target.closest("button[data-d]"); if (!b) return; if (Date.now() - bmPD < 800) return; bmKey(b.dataset.d); });
$("bmDel").onclick = () => { bmIn = bmIn.slice(0, -1); bmPadRender(); };
$("bmRuloBtn").onclick = () => { $("bmRulo").hidden = !$("bmRulo").hidden; bmPadRender(); if (!$("bmRulo").hidden) { rlSize(); $("bmRulo").scrollIntoView({ behavior: "smooth", block: "nearest" }); } };
document.addEventListener("keydown", (e) => {
  if (!$("bulmaca").classList.contains("on") || $("bmGame").hidden || e.target.tagName === "INPUT") return;
  if (/^[0-9]$/.test(e.key)) { bmKey(e.key); e.preventDefault(); }
  else if (e.key === "Backspace") { $("bmDel").click(); e.preventDefault(); }
  else if (e.key === "Enter") { bmSend(); e.preventDefault(); }
});
// Kişisel istatistik (yalnızca bu cihazda): basamak + zorluk başına oynanan, kazanılan, berabere, en iyi tur
const IST_KEY = "bmIstat";
const istOku = () => { try { return JSON.parse(localStorage.getItem(IST_KEY) || "{}") || {}; } catch (e) { return {}; } };
function istYaz() {
  const k = `${BM.n}-${BM.lvl}`, x = istOku()[k];
  $("bmIst").innerHTML = x && x.o ? `📊 Bu ayarda: <b>${x.o}</b> oyun · <b>${x.k}</b> galibiyet${x.b ? ` · ${x.b} berabere` : ""}${x.en ? ` · en iyi <b>${x.en}</b> tur` : ""}` : "";
}
function istGuncelle(sonuc) {
  const A = istOku(), k = `${BM.n}-${BM.lvl}`, x = A[k] || { o: 0, k: 0, b: 0, en: 0 };
  x.o++; let rekor = "";
  if (sonuc === "k") { x.k++; if (!x.en) { rekor = "ilk"; x.en = BM.tur; } else if (BM.tur < x.en) { rekor = "yeni"; x.en = BM.tur; } }
  if (sonuc === "b") x.b++;
  A[k] = x; try { localStorage.setItem(IST_KEY, JSON.stringify(A)); } catch (e) {}
  return { x, rekor };
}
function bmEnd(t, s) { BM.over = true;
  if (!/karıştı/.test(t)) { const sonuc = /Kazandın/.test(t) ? "k" : /Berabere/.test(t) ? "b" : "y", r = istGuncelle(sonuc);
    s += `<br><span class="bmrek">${r.rekor === "yeni" ? `🏅 Yeni rekor: ${BM.tur} tur!` : r.rekor === "ilk" ? `🏅 Bu ayarda ilk galibiyetin!` : `📊 ${r.x.o} oyun · ${r.x.k} galibiyet${r.x.en ? ` · en iyi ${r.x.en} tur` : ""}`}</span>`; istYaz(); } window.Rapor && Rapor.oyun("bulmaca", /Kazandın/.test(t), `${BM.n} basamak | ${({1:"Kolay",2:"Zor",3:"Çok zor"})[BM.lvl]} | ${BM.tur}. tur | ${t.replace(/^\S+\s/, "")}`); $("bmEnd").hidden = false; $("bmEndT").textContent = t; $("bmEndS").innerHTML = s; $("bmPad").hidden = true; bmPadRender(); }
$("bmLen").addEventListener("click", (e) => { const b = e.target.closest("button[data-n]"); if (!b) return; BM.n = +b.dataset.n; $("bmLen").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); $("bmMine").maxLength = BM.n; $("bmMine").placeholder = "ör. " + "427150".slice(0, BM.n); $("bmMine").value = $("bmMine").value.slice(0, BM.n); try { localStorage.setItem("bmAyar", JSON.stringify({ n: BM.n, l: BM.lvl })); } catch (er) {} });
$("bmLvl").addEventListener("click", (e) => { const b = e.target.closest("button[data-l]"); if (!b) return; BM.lvl = +b.dataset.l; $("bmLvl").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); $("bmLvlHint").textContent = BMLV[BM.lvl]; try { localStorage.setItem("bmAyar", JSON.stringify({ n: BM.n, l: BM.lvl })); } catch (er) {} });
(function () { let a = null; try { a = JSON.parse(localStorage.getItem("bmAyar") || "null"); } catch (e) {} if (a) { BM.n = a.n || 4; BM.lvl = a.l || 2; } $("bmLen").querySelector(`[data-n="${BM.n}"]`).click(); $("bmLvl").querySelector(`[data-l="${BM.lvl}"]`).click(); })();
$("bmEye").onclick = () => { const i = $("bmMine"); i.style.webkitTextSecurity = i.style.webkitTextSecurity === "none" ? "disc" : "none"; };
$("bmRand").onclick = () => { $("bmMine").value = randNum(BM.n); $("bmErr").textContent = ""; };
$("bmGo").onclick = () => {
  const v = $("bmMine").value.trim();
  if (!validNum(v, BM.n)) { $("bmErr").textContent = `${BM.n} basamaklı, rakamları farklı ve 0 ile başlamayan bir sayı yaz (ya da rastgele seç).`; return; }
  const A = allNums(BM.n);
  Object.assign(BM, { mod: "normal", mine: v, ai: randNum(BM.n), cand: A, all: A, me: [], aiL: [], over: false, tur: 1, not: Array(10).fill(0) });
  $("bmGame").classList.remove("gunluk"); $("bmMineShow").parentElement.hidden = false; $("bmQuit").textContent = "Oyunu bırak"; $("bmPaylas").hidden = true;
  RL.notes = []; rlClearDraw(); rlRender();
  $("bmMineShow").textContent = v; $("bmSetup").hidden = true; $("bmGame").hidden = false; $("bmEnd").hidden = true;
  bmIn = ""; $("bmPad").hidden = false;
  $("bmMsg").textContent = "Sıra sende. Sadolayn da senin sayını arıyor…";
  bmRender(); $("bulmaca").scrollIntoView({ block: "start" });
};
function bmSend() {
  if (BM.over) return;
  const g = bmIn;
  if (!validNum(g, BM.n)) { $("bmMsg").innerHTML = `<span style="color:var(--red)">${BM.n} basamaklı, rakamları farklı, 0 ile başlamayan bir sayı yaz.</span>`; return; }
  const once = BM.me.findIndex((x) => x.g === g);
  if (once >= 0) { $("bmMsg").innerHTML = `<span style="color:var(--red)">${g} sayısını ${once + 1}. tahminde denedin (${BM.me[once].s[0] || BM.me[once].s[1] ? `+${BM.me[once].s[0]} −${BM.me[once].s[1]}` : "0"}). Başka bir sayı dene.</span>`; tik(true); return; }
  const s1 = score(BM.ai, g); BM.me.push({ g, s: s1 }); RL.notes.push({ g: BM.me.length - 1 }); bmIn = ""; BM.yeni = true;
  if (BM.mod === "gunluk") { bmRender(); rlRender(); if (s1[0] === BM.n) return gunBitir(); BM.tur++; $("bmTur").textContent = BM.tur; $("bmMsg").textContent = `${BM.me.length}. tahmin: ${s1[0] || s1[1] ? `+${s1[0]} −${s1[1]}` : "hiçbir rakam yok"}. Devam!`; return; }
  // Sadolayn'ın sırası
  const ag = aiGuess(), s2 = score(BM.mine, ag); BM.aiL.push({ g: ag, s: s2 });
  BM.cand = BM.cand.filter((c) => score(c, ag).join() === s2.join());
  const youWin = s1[0] === BM.n, aiWin = s2[0] === BM.n;
  bmRender(); rlRender();
  if (youWin && aiWin) return bmEnd("🤝 Berabere!", `İkiniz de ${BM.tur}. turda buldunuz. Sadolayn'ın sayısı <b>${BM.ai}</b>.`);
  if (youWin) return bmEnd("🏆 Kazandın!", `${BM.tur} tahminde buldun. Sadolayn'ın elinde ${BM.cand.length} olasılık kalmıştı.`);
  if (aiWin) return bmEnd("🎲 Sadolayn kazandı", `Senin sayını ${BM.tur} tahminde buldu. Onun sayısı <b>${BM.ai}</b> idi.`);
  if (!BM.cand.length) return bmEnd("🤔 Bir şeyler karıştı", "Sadolayn'a göre senin sayın hiçbir ipucuyla uyuşmuyor.");
  BM.tur++; $("bmTur").textContent = BM.tur;
  $("bmMsg").textContent = `Sadolayn ${ag} dedi${BM.cand.length <= 3 ? " — dikkat, çok yaklaştı!" : "."}`;
}
$("bmSend").onclick = bmSend;
// ===== Rulo: hesap makinesi şeridi gibi; tahminler kendiliğinden basılır, not yazılır, parmakla çizilir, PNG indirilir
const RL = { notes: [], tool: "kalem", strokes: [] };
const LV_AD = { 1: "Kolay", 2: "Zor", 3: "Çok zor" };
function rlRender() {
  setTimeout(bmKaydet, 0);
  $("rlInfo").textContent = `${BM.n} basamak · ${LV_AD[BM.lvl]} · ${new Date().toLocaleDateString("tr-TR")}`;
  const fbT = ([p, m]) => p === 0 && m === 0 ? '<span class="z">0</span>' : `<span>${p ? `<span class="p">+${p}</span>` : ""}${p && m ? " " : ""}${m ? `<span class="m">−${m}</span>` : ""}</span>`;
  $("rlLines").innerHTML = RL.notes.map((x) => x.g != null ? `<div><i>${x.g + 1}</i><span class="t">${BM.me[x.g].g}</span>${fbT(BM.me[x.g].s)}</div>` : `<div class="nt"><i>✎</i><span>${esc(x.t)}</span></div>`).join("") || '<div class="nt"><i></i><span style="color:#aaa">Tahminlerin buraya basılacak…</span></div>';
}
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rlAdd = () => { const v = $("rlText").value.trim(); if (!v) return; RL.notes.push({ t: v }); $("rlText").value = ""; rlRender(); };
$("rlAdd").onclick = rlAdd;
$("rlText").addEventListener("keydown", (e) => { if (e.key === "Enter") { rlAdd(); e.preventDefault(); } });
const cv = $("rlCanvas"), cx = cv.getContext("2d");
function rlSize() { const r = cv.getBoundingClientRect(); if (!r.width) return; const dpr = window.devicePixelRatio || 1; cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); rlRedraw(); }
function rlLine(c, st, sc) { c.lineCap = c.lineJoin = "round"; c.globalCompositeOperation = st.e ? "destination-out" : "source-over"; c.strokeStyle = "#2c4fa8"; c.lineWidth = (st.e ? 18 : 2.6) * sc; c.beginPath(); st.p.forEach(([x, y], i) => (i ? c.lineTo(x * sc, y * sc) : c.moveTo(x * sc, y * sc))); if (st.p.length === 1) c.lineTo(st.p[0][0] * sc + .1, st.p[0][1] * sc); c.stroke(); c.globalCompositeOperation = "source-over"; }
function rlRedraw() { const dpr = cv.width / (cv.getBoundingClientRect().width || 1); cx.clearRect(0, 0, cv.width, cv.height); RL.strokes.forEach((st) => rlLine(cx, st, dpr)); }
function rlClearDraw() { RL.strokes = []; rlRedraw(); }
let rlCur = null;
const rlPt = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); rlCur = { e: RL.tool === "silgi", p: [rlPt(e)] }; RL.strokes.push(rlCur); rlRedraw(); });
cv.addEventListener("pointermove", (e) => { if (!rlCur) return; rlCur.p.push(rlPt(e)); rlRedraw(); });
["pointerup", "pointercancel", "pointerleave"].forEach((t) => cv.addEventListener(t, () => { if (rlCur) { rlCur = null; bmKaydet(); } }));
document.querySelector(".rlTools").addEventListener("click", (e) => { const b = e.target.closest("button[data-rt]"); if (!b) return; RL.tool = b.dataset.rt; document.querySelectorAll(".rlTools [data-rt]").forEach((x) => x.classList.toggle("on", x === b)); });
$("rlClear").onclick = () => { if (!RL.strokes.length || confirm("Çizim silinsin mi?")) rlClearDraw(); };
window.addEventListener("resize", () => { if (!$("bmRulo").hidden) rlSize(); });
// İndir: başta Sadolayn, sonda davet linki olan bir şerit görseli
$("rlDown").onclick = async () => {
  const W = 600, pad = 34, lh = 34, cw = cv.getBoundingClientRect().width || 1, drawH = RL.strokes.length ? Math.round(220 * (W - pad * 2) / cw) : 0;
  const rows = RL.notes.length || 1, H = 150 + rows * lh + (drawH ? drawH + 20 : 0) + 140;
  const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  g.fillStyle = "#fbf7ec"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#000"; for (let x = 7; x < W; x += 14) { g.beginPath(); g.arc(x, 0, 5, 0, 7); g.arc(x, H, 5, 0, 7); g.fill(); }
  g.textAlign = "center"; g.fillStyle = "#a8741c"; g.font = "italic bold 40px Georgia, serif"; g.fillText("SADOLAYN", W / 2, 62);
  g.fillStyle = "#555"; g.font = "18px 'Courier New', monospace"; g.fillText(`Sayı Bulmaca · ${BM.n} basamak · ${LV_AD[BM.lvl]} · ${new Date().toLocaleDateString("tr-TR")}`, W / 2, 94);
  g.strokeStyle = "#c9c2b0"; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(pad, 118); g.lineTo(W - pad, 118); g.stroke(); g.setLineDash([]);
  let y = 150; g.textAlign = "left";
  RL.notes.forEach((x) => {
    if (x.g != null) { const r = BM.me[x.g]; g.fillStyle = "#999"; g.font = "18px 'Courier New', monospace"; g.fillText(String(x.g + 1), pad, y); g.fillStyle = "#222"; g.font = "bold 24px 'Courier New', monospace"; g.fillText(r.g.split("").join(" "), pad + 40, y);
      const [p, m] = r.s; let tx = W - pad; g.textAlign = "right"; g.font = "bold 22px 'Courier New', monospace";
      if (!p && !m) { g.fillStyle = "#999"; g.fillText("0", tx, y); } else { if (m) { g.fillStyle = "#c0392b"; g.fillText("−" + m, tx, y); tx -= 46; } if (p) { g.fillStyle = "#16824f"; g.fillText("+" + p, tx, y); } }
      g.textAlign = "left"; }
    else { g.fillStyle = "#2c4fa8"; g.font = "italic 21px 'Segoe Print', 'Comic Sans MS', cursive"; g.fillText("✎ " + x.t, pad, y); }
    y += lh; });
  if (!RL.notes.length) { g.fillStyle = "#aaa"; g.font = "18px 'Courier New', monospace"; g.fillText("(boş rulo)", pad, y); y += lh; }
  if (drawH) { const sc = (W - pad * 2) / cw; g.save(); g.translate(pad, y); const tmp = document.createElement("canvas"); tmp.width = W - pad * 2; tmp.height = drawH; const t = tmp.getContext("2d"); RL.strokes.forEach((st) => rlLine(t, st, sc)); g.drawImage(tmp, 0, 0); g.restore(); y += drawH + 20; }
  g.strokeStyle = "#c9c2b0"; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(pad, y); g.lineTo(W - pad, y); g.stroke(); g.setLineDash([]);
  g.textAlign = "center"; g.fillStyle = "#333"; g.font = "bold 20px system-ui, sans-serif"; g.fillText("Bu oyunu beğendim, muhakkak denemelisin! 🎲", W / 2, y + 44);
  g.fillStyle = "#a8741c"; g.font = "bold 18px 'Courier New', monospace"; g.fillText("sadolayn.github.io/SadoDepo/bulmaca.html", W / 2, y + 78);
  g.fillStyle = "#9a927e"; g.font = "14px system-ui, sans-serif"; g.fillText("“Bilgi paylaştıkça büyür”", W / 2, y + 106);
  const blob = await new Promise((r) => c.toBlob(r, "image/png")), ad = `sadolayn-bulmaca-${Date.now()}.png`;
  const file = new File([blob], ad, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: "Sadolayn Sayı Bulmaca", text: "Bu oyunu beğendim, muhakkak denemelisin! https://sadolayn.github.io/SadoDepo/bulmaca.html" }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = ad; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};
rlRender();

$("bmMine").addEventListener("input", () => { $("bmMine").value = $("bmMine").value.replace(/\D/g, "").slice(0, BM.n); });
$("bmAgain").onclick = () => { if (BM.mod === "gunluk") return gunCik(); $("bmGame").hidden = true; $("bmSetup").hidden = false; $("bmMine").value = ""; };
$("bmQuit").onclick = () => { if (BM.mod === "gunluk") return gunCik(); if (BM.over || confirm("Oyun bırakılsın mı?")) { if (!BM.over) bmEnd("🏳️ Oyunu bıraktın", `Sadolayn'ın sayısı <b>${BM.ai}</b> idi.`); $("bmGame").hidden = true; $("bmSetup").hidden = false; $("bmMine").value = ""; } };

// İstatistik satırı ayar değişince güncellenir
["bmLen", "bmLvl"].forEach((id) => $(id).addEventListener("click", () => setTimeout(istYaz, 0)));
istYaz();

// ===== Kaldığın yerden devam: oyun her hamlede bu cihaza kaydedilir; sayfa yenilenir ya da kapanırsa geri yüklenir =====
const BM_KAYIT = "bmOyun";
function bmKaydet() {
  if (!window.__bmHazir) return; // sayfa açılırken (geri yükleme bitmeden) kayıt silinmesin
  if (BM.mod === "gunluk") return gunKaydet();
  try {
    if (!BM.mine || BM.over || $("bmGame").hidden) { localStorage.removeItem(BM_KAYIT); return; }
    const cizim = JSON.stringify(RL.strokes).length < 150000 ? RL.strokes : [];
    localStorage.setItem(BM_KAYIT, JSON.stringify({ v: 1, n: BM.n, lvl: BM.lvl, mine: BM.mine, ai: BM.ai, me: BM.me, aiL: BM.aiL, tur: BM.tur, not: BM.not, inp: bmIn, notes: RL.notes, strokes: cizim, rulo: !$("bmRulo").hidden, t: Date.now() }));
  } catch (e) {}
}
window.addEventListener("pagehide", bmKaydet);
(function bmGeriYukle() {
  let k = null; try { k = JSON.parse(localStorage.getItem(BM_KAYIT) || "null"); } catch (e) {}
  if (!k || k.v !== 1 || !k.mine || Date.now() - k.t > 14 * 864e5) { window.__bmHazir = true; return; }
  const A = allNums(k.n);
  Object.assign(BM, { n: k.n, lvl: k.lvl, mine: k.mine, ai: k.ai, me: k.me || [], aiL: k.aiL || [], tur: k.tur || 1, not: k.not || Array(10).fill(0), over: false, all: A,
    cand: A.filter((c) => (k.aiL || []).every((x) => score(c, x.g).join() === x.s.join())) });
  bmIn = k.inp || ""; RL.notes = k.notes || []; RL.strokes = k.strokes || [];
  $("bmMineShow").textContent = BM.mine; $("bmSetup").hidden = true; $("bmGame").hidden = false; $("bmEnd").hidden = true; $("bmPad").hidden = false;
  $("bmMsg").textContent = `Kaldığın yerden devam: ${BM.tur}. tur. ${BM.aiL.length ? `Sadolayn en son ${BM.aiL[BM.aiL.length - 1].g} dedi.` : "Sıra sende."}`;
  bmRender(); rlRender();
  window.__bmHazir = true;
  if (k.rulo) { $("bmRulo").hidden = false; bmPadRender(); setTimeout(rlSize, 50); }
})();

// ===== Günün Sayısı: herkese aynı gün aynı 4 basamaklı sayı; günde bir kez; seri ve paylaşım =====
const GUN_BAS = "2026-11-07"; // #1 (yayın günü)
const gunBugun = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10); // Türkiye saati
const gunNo = (t) => Math.round((Date.parse(t) - Date.parse(GUN_BAS)) / 864e5) + 1;
const gunDun = (t) => new Date(Date.parse(t) - 864e5).toISOString().slice(0, 10);
function gunSayi(t) { // tarihten tohumlu karışım: her gün herkeste aynı, 4 farklı rakam, 0 ile başlamaz
  let h = 1779033703 ^ ("sadolayn-gunun-sayisi-" + t).length;
  for (const ch of "sadolayn-gunun-sayisi-" + t) { h = Math.imul(h ^ ch.charCodeAt(0), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0; const rnd = () => { a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const d = "0123456789".split(""); for (let i = 9; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  if (d[0] === "0") { const k = d.findIndex((x, i) => i > 0 && i < 4 && x !== "0"); [d[0], d[k > 0 ? k : 4]] = [d[k > 0 ? k : 4], d[0]]; }
  return d.slice(0, 4).join("");
}
const GK = "bmGun", GI = "bmGunIstat";
const gunOku = () => { try { const x = JSON.parse(localStorage.getItem(GK) || "null"); return x && x.t === gunBugun() ? x : { t: gunBugun(), me: [], bitti: false, not: Array(10).fill(0), notes: [] }; } catch (e) { return { t: gunBugun(), me: [], bitti: false, not: Array(10).fill(0), notes: [] }; } };
const gIstOku = () => { try { return JSON.parse(localStorage.getItem(GI) || "null") || { cozulen: 0, seri: 0, enSeri: 0, son: "", dag: {} }; } catch (e) { return { cozulen: 0, seri: 0, enSeri: 0, son: "", dag: {} }; } };
function gunKaydet() { try { localStorage.setItem(GK, JSON.stringify({ t: BM.gunT, me: BM.me, bitti: BM.over, not: BM.not, notes: RL.notes, inp: bmIn })); } catch (e) {} }
function gunPaylasMetni() {
  const g = gunOku(), I = gIstOku(), n = g.me.length;
  const satir = (x) => "🟢".repeat(x.s[0]) + "🟡".repeat(x.s[1]) + "⚫".repeat(4 - x.s[0] - x.s[1]);
  return `🔢 Sadolayn · Günün Sayısı #${gunNo(g.t)}\n${n} tahminde buldum!${I.seri > 1 ? ` 🔥 Seri: ${I.seri} gün` : ""}\n\n${g.me.map(satir).join("\n")}\n\nSen kaçta bulursun? 👉 sadolayn.github.io/SadoDepo/bulmaca.html`;
}
async function gunPaylas(btn) {
  const t = gunPaylasMetni();
  try { if (navigator.share) { await navigator.share({ text: t }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(t); const o = btn.textContent; btn.textContent = "✅ Kopyalandı, istediğin yere yapıştır"; setTimeout(() => (btn.textContent = o), 2200); } catch (e) { prompt("Kopyala:", t); }
  window.Rapor && Rapor.bolum("gunluk-paylas");
}
let gunDetay = false;
function gunKartYaz() {
  const g = gunOku(), I = gIstOku(), no = gunNo(g.t), el = $("bmGunKart"); if (!el) return;
  const tarih = new Date(g.t + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });
  const seri = I.son === g.t || I.son === gunDun(g.t) ? I.seri : 0;
  const dag = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => [k, I.dag[k] || 0]), mx = Math.max(1, ...dag.map((x) => x[1]));
  const yarin = new Date(Date.parse(g.t + "T00:00:00+03:00") + 864e5), kal = Math.max(0, yarin - Date.now()), sa = Math.floor(kal / 36e5), dk = Math.floor(kal % 36e5 / 6e4);
  const ist = `<div class="gs"><div><b>${I.cozulen}</b><span>çözülen gün</span></div><div><b>${seri}</b><span>seri 🔥</span></div><div><b>${I.enSeri}</b><span>en uzun seri</span></div><div><b>${I.cozulen ? (Object.entries(I.dag).reduce((a, [k, v]) => a + k * v, 0) / I.cozulen).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : "–"}</b><span>ort. tahmin</span></div></div>`;
  const dagH = `<div class="gd">${dag.filter((x) => x[0] <= Math.max(6, ...Object.keys(I.dag).map(Number))).map(([k, v]) => `<span>${k === 10 ? "10+" : k}</span><i class="${g.bitti && (g.me.length === k || (k === 10 && g.me.length >= 10)) ? "bu" : ""}" style="width:${Math.max(8, v / mx * 100)}%">${v}</i>`).join("")}</div>`;
  // İnce davet şeridi: ana oyun (Sadolayn'a karşı) ilk ekranda görünsün; istatistik yalnızca dokununca açılır
  let ust, alt = "";
  if (g.bitti) {
    ust = `<div class="gl"><b>✅ Günün Sayısı #${no}</b><span>${g.me.length} tahminde buldun${seri > 1 ? ` · 🔥 ${seri} gün` : ""}</span></div><div class="gk"><button type="button" class="ga" id="gunPaylas">📤 Paylaş</button><button type="button" class="gi" id="gunAc" aria-expanded="${gunDetay}" aria-label="İstatistik">${gunDetay ? "▴" : "📊"}</button></div>`;
    if (gunDetay) alt = `<div class="gx">${ist}${dagH}<button type="button" class="gi gw" id="gunGor">Tahminlerimi gör</button><div style="margin-top:8px;font-size:12px;color:var(--muted);text-align:center">⏳ Yeni sayı <b>${sa} sa ${dk} dk</b> sonra</div></div>`;
  } else {
    ust = `<div class="gl"><b>📅 Günün Sayısı #${no}</b><span>${g.me.length ? `${g.me.length} tahmin yaptın, devam et` : "Herkese aynı sayı · sen kaçta bulursun?"}</span></div><div class="gk"><button type="button" class="ga" id="gunBasla">${g.me.length ? "Devam ›" : "Çöz ›"}</button>${I.cozulen ? `<button type="button" class="gi" id="gunAc" aria-expanded="${gunDetay}">${gunDetay ? "▴" : "📊"}</button>` : ""}</div>`;
    if (gunDetay && I.cozulen) alt = `<div class="gx">${ist}${dagH}</div>`;
  }
  el.innerHTML = `<div class="gr1">${ust}</div>${alt}`;
  el.title = tarih;
  const b1 = $("gunBasla"), b2 = $("gunPaylas"), b3 = $("gunGor"), b4 = $("gunAc");
  if (b1) b1.onclick = gunBasla; if (b2) b2.onclick = () => gunPaylas(b2); if (b3) b3.onclick = gunBasla; if (b4) b4.onclick = () => { gunDetay = !gunDetay; gunKartYaz(); };
}
function gunBasla() {
  const g = gunOku();
  Object.assign(BM, { mod: "gunluk", gunT: g.t, n: 4, mine: "", ai: gunSayi(g.t), me: g.me, aiL: [], over: g.bitti, tur: g.me.length + 1, not: g.not || Array(10).fill(0), all: [], cand: [] });
  bmIn = g.bitti ? "" : (g.inp || ""); RL.notes = g.notes || g.me.map((x, i) => ({ g: i })); RL.strokes = [];
  $("bmGame").classList.add("gunluk"); $("bmMineShow").parentElement.hidden = true; $("bmQuit").textContent = "← Günün Sayısı ekranına dön";
  $("bmSetup").hidden = true; $("bmGunKart").hidden = true; $("bmGame").hidden = false; $("bmEnd").hidden = !g.bitti; $("bmPad").hidden = g.bitti;
  $("bmPaylas").hidden = !g.bitti; $("bmAgain").textContent = "Tamam";
  if (g.bitti) { $("bmEndT").textContent = `🎉 ${g.me.length} tahminde buldun!`; $("bmEndS").innerHTML = `Günün sayısı <b>${BM.ai}</b> idi. Yarın yeni sayı seni bekliyor.`; }
  $("bmTur").textContent = BM.tur; $("bmMsg").textContent = g.bitti ? "Bugünkü sayıyı çözdün." : g.me.length ? `Kaldığın yerden: ${g.me.length} tahmin yaptın.` : "Herkesle aynı sayı. İlk tahminini yap!";
  try { localStorage.setItem("bmGunAcik", "1"); } catch (e) {}
  bmRender(); rlRender(); window.scrollTo({ top: 0 });
}
function gunBitir() {
  BM.over = true; const I = gIstOku(), n = BM.me.length, t = BM.gunT;
  if (I.son !== t) { I.cozulen++; I.seri = I.son === gunDun(t) ? I.seri + 1 : 1; I.enSeri = Math.max(I.enSeri, I.seri); I.son = t; const k = Math.min(10, n); I.dag[k] = (I.dag[k] || 0) + 1; try { localStorage.setItem(GI, JSON.stringify(I)); } catch (e) {} }
  gunKaydet(); tik(true);
  window.Rapor && Rapor.oyun("gunluk", true, `#${gunNo(t)} | ${n} tahmin`);
  $("bmEnd").hidden = false; $("bmPad").hidden = true; $("bmPaylas").hidden = false;
  $("bmEndT").textContent = `🎉 ${n} tahminde buldun!`;
  $("bmEndS").innerHTML = `Günün sayısı <b>${BM.ai}</b> idi.${I.seri > 1 ? ` 🔥 Seri: <b>${I.seri} gün</b>.` : ""} Sonucunu sayıyı ele vermeden paylaşabilirsin.`;
  $("bmMsg").textContent = "Bugünkü sayıyı çözdün."; bmPadRender();
}
function gunCik() {
  gunKaydet(); BM.mod = "normal"; BM.mine = ""; BM.over = true;
  try { localStorage.removeItem("bmGunAcik"); } catch (e) {}
  $("bmGame").hidden = true; $("bmGame").classList.remove("gunluk"); $("bmSetup").hidden = false; $("bmGunKart").hidden = false; $("bmAgain").textContent = "Yeni oyun"; $("bmPaylas").hidden = true;
  gunKartYaz(); window.scrollTo({ top: 0 });
}
$("bmPaylas").onclick = () => gunPaylas($("bmPaylas"));
gunKartYaz(); setInterval(() => { if (!$("bmGunKart").hidden) gunKartYaz(); }, 60000);
// Günün Sayısı açıkken sayfa yenilenirse oraya geri dön
try { if (localStorage.getItem("bmGunAcik") === "1" && $("bmGame").hidden) gunBasla(); } catch (e) {}
