const $ = (id) => document.getElementById(id);
// ===== Sekmeler =====
$("tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-t]"); if (!b) return;
  if (b.dataset.t === "kaza") { window.Rapor && Rapor.bolum("kaza"); location.href = "kaza.html"; return; } // Kaza Tutanağı Asistanı ayrı sayfada (8 Kasım 2026)
  document.querySelectorAll("#tabs button").forEach((x) => x.classList.toggle("on", x === b));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("on", p.id === b.dataset.t));
  try { localStorage.setItem("hesapTab", b.dataset.t); } catch (e) {}
  try { history.replaceState(null, "", "#" + b.dataset.t); } catch (e) {} // yenilenince aynı sekme açılsın
  window.Rapor && Rapor.bolum(b.dataset.t);
  if (b.dataset.t === "cetvel") drawRuler();
  if (b.dataset.t === "calc") setTimeout(makineBoyut, 0);
  if (b.dataset.t !== "mesafe" && typeof camStop === "function" && mStream) camStop();
  window.scrollTo({ top: 0 });
});
// Yapışkan üst bölüm yüksekliği (makine onun altında sabit kalır)
const setSH = () => { const R = document.documentElement.style; R.setProperty("--sh", document.querySelector(".stick").offsetHeight + "px"); const c = document.querySelector(".calcbox"); if (c && c.offsetHeight) R.setProperty("--ch", c.offsetHeight + "px"); };
setSH(); window.addEventListener("resize", setSH);
// Hesap makinesi tam ekran: tuşlar büyüyerek makine ekranın altına kadar uzanır (6 tuş sırası)
function makineBoyut() {
  const P = $("calc"); if (!P || !P.classList.contains("on")) return;
  const R = document.documentElement.style; R.setProperty("--kh", "42px");
  const vh = window.visualViewport ? visualViewport.height : innerHeight;
  const kutu = P.querySelector(".calcbox"), bar = P.querySelector(".tapebar");
  const kAlt = kutu.getBoundingClientRect().bottom + window.scrollY, bAlt = bar ? bar.getBoundingClientRect().bottom + window.scrollY : kAlt;
  let bos = vh - bAlt - 10; // önce rulo düğmeleri de sığsın
  if (bos < 0) bos = Math.min(0, vh - kAlt - 6); // sığmıyorsa en azından makine ekrana sığsın
  R.setProperty("--kh", Math.round(Math.max(34, Math.min(74, 42 + bos / 6))) + "px");
  setSH();
}
window.addEventListener("resize", () => { clearTimeout(makineBoyut.t); makineBoyut.t = setTimeout(makineBoyut, 120); });
// Eski hesap makinesi tuş sesi (plastik "tık")
let SND = true; try { SND = localStorage.getItem("hesapSes") !== "0"; } catch (e) {}
let AC = null;
function tik(big) {
  if (!SND) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume();
    const t = AC.currentTime, len = Math.floor(AC.sampleRate * 0.03), buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const src = AC.createBufferSource(); src.buffer = buf;
    const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = big ? 1700 : 2600; bp.Q.value = 1.4;
    const g = AC.createGain(); g.gain.value = 0.9; src.connect(bp).connect(g).connect(AC.destination); src.start(t);
    const o = AC.createOscillator(), og = AC.createGain(); o.type = "square"; o.frequency.setValueAtTime(big ? 180 : 240, t); og.gain.setValueAtTime(0.06, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.025); o.connect(og).connect(AC.destination); o.start(t); o.stop(t + 0.03);
  } catch (e) {}
}
// Türkçe sayı okuma/yazma
function num(v) { return v && v.tagName ? Sayi.oku(v).n : Sayi.coz(v).n; } // biçim doğrulamalı okuma (sayi.js): "12abc" gibi girişler NaN → sonuç "–"
const tl = (n, d = 2) => (isFinite(n) ? n.toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d }) : "–");
const nf = (n, d = 2) => (isFinite(n) ? n.toLocaleString("tr-TR", { maximumFractionDigits: d }) : "–");
const rows = (id, list) => ($(id).innerHTML = list.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join(""));
document.querySelectorAll('input[inputmode="decimal"]').forEach((i) => i.addEventListener("blur", () => { const n = num(i); if (i.value.trim() && Math.abs(n) >= 1000) i.value = n.toLocaleString("tr-TR", { maximumFractionDigits: 6 }); }));

// ===== Hesap makinesi: kesirli (rasyonel) aritmetik, yuvarlama hatası yok =====
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a || 1n; };
const Q = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
const qAdd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d), qSub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
const qMul = (a, b) => Q(a.n * b.n, a.d * b.d), qDiv = (a, b) => (b.n === 0n ? null : Q(a.n * b.d, a.d * b.n));
const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); // PPK karar linki için
function qParse(s) { s = s.replace(",", "."); const neg = s.startsWith("-"); if (neg) s = s.slice(1); const [i, f = ""] = s.split("."); const n = BigInt((i || "0") + f) * (neg ? -1n : 1n); return Q(n, 10n ** BigInt(f.length)); }
function qFmt(q, maxDigits = 12) {
  const neg = q.n < 0n; let n = neg ? -q.n : q.n; const d = q.d; let ip = n / d, rem = n % d;
  const intStr = ip.toString(); if (intStr.length > maxDigits) return null;
  const room = Math.max(0, maxDigits - intStr.length); let frac = "";
  for (let i = 0; i < room + 1 && rem !== 0n; i++) { rem *= 10n; frac += (rem / d).toString(); rem %= d; }
  // yuvarla
  if (frac.length > room) { const up = +frac[room] >= 5; frac = frac.slice(0, room); if (up) { let s = (intStr + frac); let carry = BigInt(s) + 1n; s = carry.toString().padStart(s.length, "0"); const il = s.length - frac.length; if (il > maxDigits) return null; return fmtParts(neg, s.slice(0, il), s.slice(il)); } }
  return fmtParts(neg, intStr, frac);
}
function fmtParts(neg, i, f) { f = f.replace(/0+$/, ""); const ig = i.replace(/\B(?=(\d{3})+(?!\d))/g, "."); const s = (neg && (i !== "0" || f) ? "-" : "") + ig + (f ? "," + f : ""); return s; }
let acc = null, op = null, entry = null, lastOp = null, lastB = null, mem = null, err = false, fresh = true;
const tapeL = [];
const OPS = { "+": "+", "-": "−", "*": "×", "/": "÷" };
const apply = (a, o, b) => (o === "+" ? qAdd(a, b) : o === "-" ? qSub(a, b) : o === "*" ? qMul(a, b) : qDiv(a, b));
const shown = () => (entry !== null ? entry : acc ? qFmt(acc) : "0");
function disp() {
  let t = err ? "Hata" : entry !== null ? fmtEntry(entry) : acc ? qFmt(acc) || "Taşma" : "0";
  if (t === "Taşma") err = true;
  $("lNum").textContent = t; $("lOp").textContent = op ? OPS[op] : "";
  $("iM").classList.toggle("on", !!mem && mem.n !== 0n); $("iE").classList.toggle("on", err); $("iK").classList.toggle("on", !err && t.startsWith("-"));
}
function fmtEntry(e) { const neg = e.startsWith("-"), s = neg ? e.slice(1) : e, [i, f] = s.split(","); return (neg ? "-" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (f !== undefined ? "," + f : ""); }
function tape(a, b, cls) { tapeL.push([a, b, cls]); if (tapeL.length > 200) tapeL.shift(); const el = $("tape"); $("tapeIn").innerHTML = tapeL.map(([x, y, c], i) => `<div class="${c || ""}${i === tapeL.length - 1 ? " yeni" : ""}"><span>${y}</span><span>${x}</span></div>`).join(""); el.scrollTop = el.scrollHeight; ruloGoster(); yazdir(); }
const curQ = () => (entry !== null ? qParse(entry === "-" ? "0" : entry) : acc || Q(0n));
function press(k) {
  if (err && k !== "C") return;
  if (/^\d$/.test(k) || k === "00") {
    if (fresh || entry === null) { entry = k === "00" ? "0" : k; fresh = false; }
    else { const digits = entry.replace(/[-,]/g, ""); if (digits.length >= 12) return; entry = entry === "0" ? (k === "00" ? "0" : k) : entry === "-0" ? "-" + k : entry + k; }
  } else if (k === ",") { if (fresh || entry === null) { entry = "0,"; fresh = false; } else if (!entry.includes(",")) entry += ","; }
  else if (k === "⌫") { if (entry !== null && !fresh) { entry = entry.slice(0, -1); if (entry === "" || entry === "-") entry = "0"; } }
  else if (k === "CE") { entry = "0"; fresh = true; }
  else if (k === "C") { acc = op = entry = lastOp = lastB = null; err = false; fresh = true; tape("", "C", "c"); }
  else if (k === "±") { if (entry !== null) entry = entry.startsWith("-") ? entry.slice(1) : "-" + entry; else if (acc) { acc = Q(-acc.n, acc.d); } }
  else if (k in OPS) {
    if (entry !== null) { const b = curQ(); if (acc === null || op === null) { acc = b; tape(qFmt(acc), ""); } else { tape(qFmt(b), OPS[op]); const r = apply(acc, op, b); if (!r) { err = true; disp(); return; } acc = r; } entry = null; }
    else if (acc === null) acc = Q(0n);
    op = k; fresh = true;
  } else if (k === "=") {
    let b;
    if (op && entry !== null) { b = curQ(); lastOp = op; lastB = b; tape(qFmt(b), OPS[op]); }
    else if (op && entry === null) { b = acc; lastOp = op; lastB = b; tape(qFmt(b), OPS[op]); }
    else if (lastOp && acc) { b = lastB; tape(qFmt(b), OPS[lastOp]); }
    else { if (entry !== null) { acc = curQ(); entry = null; } disp(); return; }
    const r = apply(acc ?? Q(0n), op || lastOp, b); if (!r) { err = true; disp(); return; }
    acc = r; op = null; entry = null; fresh = true; tape(qFmt(acc) || "Taşma", "=", "t");
  } else if (k === "%") {
    const b = curQ(); let r;
    if (op === "+" || op === "-") r = qDiv(qMul(acc, b), Q(100n)); else r = qDiv(b, Q(100n));
    const f = qFmt(r); if (!f) { err = true; disp(); return; } // 12 haneyi aşarsa çökme yerine "Hata"
    entry = f.replace(/\./g, ""); fresh = true;
  } else if (k === "√") {
    const v = Number(curQ().n) / Number(curQ().d); if (v < 0) { err = true; disp(); return; }
    // Bilimsel gösterim ("1e-12") üretmeden en çok 12 haneye yuvarla; çok küçük kök 0 olur
    const s = Math.sqrt(v), ih = s >= 1 ? Math.floor(Math.log10(s)) + 1 : 1;
    entry = s.toFixed(Math.max(0, Math.min(11, 12 - ih))).replace(/\.?0+$/, "").replace(".", ",") || "0"; fresh = true; tape(entry, "√");
  } else if (k === "M+" || k === "M-") { const v = curQ(); mem = mem ? (k === "M+" ? qAdd(mem, v) : qSub(mem, v)) : (k === "M+" ? v : Q(-v.n, v.d)); fresh = true; if (entry === null && acc) entry = null; tape(qFmt(v) || "Taşma", k === "M+" ? "M+" : "M−"); }
  else if (k === "MR") { if (mem) { const f = qFmt(mem); if (!f) { err = true; disp(); return; } entry = f.replace(/\./g, ""); fresh = true; } }
  else if (k === "MC") { mem = null; }
  disp();
}
$("keys").parentElement.addEventListener("pointerdown", (e) => { const b = e.target.closest("[data-k]"); if (b) tik(b.dataset.k === "=" || b.dataset.k === "C"); });
// Basınca tuşun altından yeşil ışık
const isik = (b) => { b.classList.add("lit"); clearTimeout(b._lt); b._lt = setTimeout(() => b.classList.remove("lit"), 160); };
$("keys").parentElement.addEventListener("pointerdown", (e) => { const b = e.target.closest(".k"); if (b) isik(b); });
$("keys").parentElement.addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (b) { press(b.dataset.k); ruloGoster(); } });
const sndUI = () => ($("snd").textContent = SND ? "🔊" : "🔇");
$("snd").onclick = () => { SND = !SND; try { localStorage.setItem("hesapSes", SND ? "1" : "0"); } catch (e) {} sndUI(); tik(); }; sndUI();
document.addEventListener("keydown", (e) => {
  if (!$("calc").classList.contains("on") || e.target.closest("input")) return;
  const m = { Enter: "=", "=": "=", Backspace: "⌫", Escape: "C", Delete: "CE", ".": ",", ",": ",", "%": "%", "+": "+", "-": "-", "*": "*", "x": "*", "/": "/" };
  const k = /^\d$/.test(e.key) ? e.key : m[e.key]; if (!k) return; e.preventDefault(); tik(k === "=" || k === "C"); press(k);
  const b = document.querySelector(`.calc [data-k="${CSS.escape(k)}"]`); if (b) { b.classList.add("down"); isik(b); setTimeout(() => b.classList.remove("down"), 90); }
});
$("tClear").onclick = () => { tapeL.length = 0; $("tapeIn").innerHTML = '<span class="e">— rulo boş —</span>'; };
// Rakam girilince rulo ekranda değilse sayfa kayar, rulonun son satırı makinenin altında görünür
// Ruloya dokununca uzar / kısalır; tercih hatırlanır
try { if (localStorage.getItem("hesapRulo") === "uzun") $("calc").classList.add("rulouzun"); } catch (e) {}
$("tape").addEventListener("click", () => { const u = $("calc").classList.toggle("rulouzun"); try { localStorage.setItem("hesapRulo", u ? "uzun" : "kisa"); } catch (e) {} setTimeout(() => { makineBoyut(); const el = $("tape"); el.scrollTop = el.scrollHeight; }, 380); });
function ruloGoster() { const r = $("tape").getBoundingClientRect(), alt = window.innerHeight, ust = document.querySelector(".stick").offsetHeight; if (r.bottom > alt + 2) window.scrollBy({ top: r.bottom - alt + 6, behavior: "smooth" }); else if (r.top < ust - 2) window.scrollBy({ top: r.top - ust - 6, behavior: "smooth" }); }
// ===== Görünüm: Şeritli (varsayılan) · Klasik · Pastel =====
const SKIN = { seritli: "SL-12P", klasik: "SL-12", pastel: "SL-12 ♡" };
let skin = "seritli"; try { skin = localStorage.getItem("hesapGorunum") || "seritli"; } catch (e) {} if (!SKIN[skin]) skin = "seritli";
function skinUygula(s) {
  skin = s; $("calc").dataset.skin = s; $("mdl").textContent = SKIN[s];
  $("skinPop").querySelectorAll("button[data-s]").forEach((b) => b.classList.toggle("on", b.dataset.s === s));
  try { localStorage.setItem("hesapGorunum", s); } catch (e) {}
  setTimeout(() => { makineBoyut(); const t = $("tape"); t.scrollTop = t.scrollHeight; }, 0);
}
skinUygula(skin);
$("skinB").onclick = (e) => { e.stopPropagation(); $("skinPop").hidden = !$("skinPop").hidden; };
$("skinPop").onclick = (e) => { const b = e.target.closest("button[data-s]"); if (!b) return; skinUygula(b.dataset.s); $("skinPop").hidden = true; window.Rapor && Rapor.bolum("makine-" + b.dataset.s); };
document.addEventListener("click", (e) => { if (!e.target.closest("#skinPop, #skinB")) $("skinPop").hidden = true; });
// Şeritli: her satır basılırken ışık yanar, yazıcı "vızz" sesi gelir
function yazdir() {
  if (skin !== "seritli") return;
  const c = $("calc"); c.classList.add("basiyor"); clearTimeout(c._b); c._b = setTimeout(() => c.classList.remove("basiyor"), 320);
  if (!SND) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume();
    const t = AC.currentTime + 0.02, d = 0.24, len = Math.floor(AC.sampleRate * d), buf = AC.createBuffer(1, len, AC.sampleRate), x = buf.getChannelData(0);
    for (let i = 0; i < len; i++) { const f = i / len, zarf = Math.min(1, f * 12) * Math.pow(1 - f, 1.5), titres = 0.55 + 0.45 * Math.sign(Math.sin(2 * Math.PI * 48 * i / AC.sampleRate)); x[i] = (Math.random() * 2 - 1) * zarf * titres; }
    const src = AC.createBufferSource(); src.buffer = buf;
    const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1300; bp.Q.value = 0.9;
    const g = AC.createGain(); g.gain.value = 0.35; src.connect(bp).connect(g).connect(AC.destination); src.start(t);
  } catch (e) {}
}
// Ruloyu gerçek fiş gibi dar bir PDF olarak indir (kitaplık sitenin içinde, ilk tıklamada yüklenir)
const loadJs = (src) => new Promise((ok, no) => { const sc = document.createElement("script"); sc.src = src; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
let pdfP = null;
const loadPdf = () => pdfP || (pdfP = loadJs("lib/jspdf.umd.min.js").then(() => loadJs("lib/pdffont.js")).catch((e) => { pdfP = null; throw e; }));
$("tPdf").onclick = async () => {
  if (!tapeL.length) { $("tPdf").textContent = "Rulo boş 🙂"; setTimeout(() => ($("tPdf").textContent = "📄 PDF indir"), 1300); return; }
  $("tPdf").textContent = "⏳ Hazırlanıyor…";
  try {
    await loadPdf();
    const W = 80, lh = 5.2, H = Math.max(110, 52 + tapeL.length * lh + tapeL.filter((x) => x[2] === "t").length * 2.5 + 26);
    const doc = new window.jspdf.jsPDF({ unit: "mm", format: [W, H] });
    doc.addFileToVFS("FS.ttf", PDF_FONTS.regular); doc.addFont("FS.ttf", "FS", "normal");
    doc.addFileToVFS("FSB.ttf", PDF_FONTS.bold); doc.addFont("FSB.ttf", "FS", "bold");
    doc.setFillColor(250, 247, 238); doc.rect(0, 0, W, H, "F");
    const L = 7, R = W - 7, now = new Date(), clean = (t) => String(t || "").replace(/−/g, "-").replace(/√/g, "kök ");
    const dash = (y) => { doc.setLineDashPattern([1, 1], 0); doc.setDrawColor(150); doc.line(L, y, R, y); doc.setLineDashPattern([], 0); };
    let y = 12;
    doc.setFont("FS", "bold"); doc.setFontSize(14); doc.text("SADOLAYN", W / 2, y, { align: "center" }); y += 5;
    doc.setFont("FS", "normal"); doc.setFontSize(8.5); doc.setTextColor(110);
    doc.text(`${SKIN[skin].replace(/[^\x20-\x7E]/g, "").trim()} · Hesap rulosu`, W / 2, y, { align: "center" }); y += 4.5;
    doc.text(now.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) + "  " + now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }), W / 2, y, { align: "center" }); y += 4;
    dash(y); y += 6;
    doc.setFontSize(11);
    tapeL.forEach(([num, op, c]) => {
      if (c === "t") { dash(y - 4); y += 1; }
      doc.setFont("FS", c === "t" ? "bold" : "normal"); doc.setTextColor(c === "c" ? 170 : 40, c === "c" ? 50 : 35, c === "c" ? 50 : 30);
      doc.text(clean(op), L, y); doc.text(clean(num), R, y, { align: "right" }); y += lh + (c === "t" ? 1.5 : 0);
    });
    y += 2; dash(y); y += 6;
    doc.setFont("FS", "normal"); doc.setFontSize(8); doc.setTextColor(110);
    doc.text("Akıllı makine: 10 ÷ 3 × 3 = 10 :)", W / 2, y, { align: "center" });
    doc.save(`hesap-rulosu-${ymd(now)}.pdf`);
    $("tPdf").textContent = "✅ İndirildi";
  } catch (e) { $("tPdf").textContent = "⚠️ Olmadı, tekrar dene"; }
  setTimeout(() => ($("tPdf").textContent = "📄 PDF indir"), 1600);
};
$("tCopy").onclick = () => { const t = tapeL.map(([a, b]) => `${b ? b + " " : ""}${a}`.trim()).join("\n"); if (!t) return; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { $("tCopy").textContent = "✅ Kopyalandı"; setTimeout(() => ($("tCopy").textContent = "📋 Kopyala"), 1400); }, () => prompt("Kopyala:", t)); };
disp();

// ===== Tarih yardımcıları ve tatiller =====
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pD = (s) => (s ? new Date(s + "T12:00:00") : null);
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dd = (a, b) => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5);
const longD = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
const HF = ["01-01", "04-23", "05-01", "05-19", "07-15", "08-30", "10-29"], HALF = ["10-28"];
const HR = { 2026: ["03-20", "03-21", "03-22", "05-27", "05-28", "05-29", "05-30"], 2027: ["03-09", "03-10", "03-11", "05-16", "05-17", "05-18", "05-19"], 2028: ["02-26", "02-27", "02-28", "05-05", "05-06", "05-07", "05-08"], 2029: ["02-14", "02-15", "02-16", "04-24", "04-25", "04-26", "04-27"] };
const HH = { 2026: ["03-19", "05-26"], 2027: ["03-08", "05-15"], 2028: ["02-25", "05-04"], 2029: ["02-13"] }; // 2029 Kurban arifesi 23 Nisan: zaten tam gün tatil
const isWE = (d) => d.getDay() === 0 || d.getDay() === 6;
const isHol = (d) => { const md = ymd(d).slice(5); return HF.includes(md) || (HR[d.getFullYear()] || []).includes(md); };
const isHalf = (d) => { const md = ymd(d).slice(5); return HALF.includes(md) || (HH[d.getFullYear()] || []).includes(md); };
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const today = new Date(); today.setHours(12, 0, 0, 0);

// ===== Faiz =====
// TL mevduat stopajı (GVK geçici 67; CK 11444 ile 31.12.2026'ya kadar): 6 aya kadar %17,5 · 1 yıla kadar %15 · 1 yıldan uzun %10
const STOPAJ = [[6, 17.5, "6 aya kadar (vadesiz dahil)"], [12, 15, "1 yıla kadar"], [Infinity, 10, "1 yıldan uzun"]];
const VADE = { kredi: [["Aylık", 30], ["3 aylık", 90], ["6 aylık", 180], ["Yıllık", 360], ["2 yıl", 720], ["3 yıl", 1080], ["5 yıl", 1800], ["10 yıl", 3600]],
  mevduat: [["32 gün", 32], ["45 gün", 45], ["60 gün", 60], ["90 gün", 90], ["180 gün", 180], ["1 yıl", "1y"], ["540 gün", 540]] };
let fMod = "kredi", fTaxAuto = true;
const addM = (d, m) => { const x = new Date(d.getFullYear(), d.getMonth() + m, 1, 12), last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); x.setDate(Math.min(d.getDate(), last)); return x; };
function fChips() { $("fVade").innerHTML = VADE[fMod].map(([t, v]) => `<button type="button" data-v="${v}">${t}</button>`).join(""); fMarkChip(); }
function fMarkChip() { const g = Math.round(num($("fG"))), a = pD($("fA").value) || today; $("fVade").querySelectorAll("button").forEach((b) => b.classList.toggle("on", (b.dataset.v === "1y" ? dd(a, addM(a, 12)) : +b.dataset.v) === g)); }
$("fMod").addEventListener("click", (e) => { const b = e.target.closest("button[data-m]"); if (!b) return; fMod = b.dataset.m; $("fMod").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); fTaxAuto = true; $("fG").value = fMod === "kredi" ? 30 : 32; fSyncB(); fChips(); calcF(); });
$("fVade").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-v]"); if (!b) return; const a = pD($("fA").value) || today;
  $("fG").value = b.dataset.v === "1y" ? dd(a, addM(a, 12)) : b.dataset.v; fSyncB(); calcF();
});
// Başlangıç girildiyse bitişi gün sayısına göre güncelle
function fSyncB() { const a = pD($("fA").value); if (a) $("fB").value = ymd(addD(a, Math.round(num($("fG"))))); }
["fA", "fB"].forEach((id) => $(id).addEventListener("input", () => { const a = pD($("fA").value), b = pD($("fB").value); if (a && b && b > a) $("fG").value = dd(a, b); else if (a && id === "fA") fSyncB(); calcF(); }));
$("fG").addEventListener("input", () => { fSyncB(); calcF(); });
$("fTax").addEventListener("input", () => { fTaxAuto = !$("fTax").value.trim(); calcF(); });
["fP", "fR", "fBsmv", "fKkdf"].forEach((id) => $(id).addEventListener("input", calcF));
function fStopaj(g) {
  const a = pD($("fA").value) || today, b = addD(a, g);
  return STOPAJ.find(([m]) => m === Infinity || b <= addM(a, m));
}
function calcF() {
  const P = num($("fP")), r = num($("fR")), g = Math.round(num($("fG")));
  const kr = fMod === "kredi";
  const a = pD($("fA").value) || today, yr = a.getFullYear(), base = kr ? 36000 : isLeap(yr) ? 36600 : 36500;
  let nx = yr + 1; while (!isLeap(nx)) nx++;
  // Vade iki yıla yayılıyorsa (ör. 2027 → 2028) artık yılı da söyle
  const end = addD(a, g || 0), span = []; for (let y = yr; y <= end.getFullYear(); y++) if (isLeap(y)) span.push(y);
  $("fLeap").innerHTML = kr
    ? `📅 <b>${yr}</b> ${isLeap(yr) ? "artık yıl (366 gün)" : "artık yıl değil (365 gün)"}. Kredi hesabında yıl genellikle <b>360 gün</b> sayılır, faiz ÷ <b>36.000</b>.`
    : `📅 <b>${yr}</b> ${isLeap(yr) ? "<b>artık yıl</b> → yıl 366 gün, faiz ÷ <b>36.600</b>" : "artık yıl değil → yıl 365 gün, faiz ÷ <b>36.500</b>"}.${isLeap(yr) ? "" : ` Sonraki artık yıl: <b>${nx}</b> (÷ 36.600).`}${span.length && !isLeap(yr) ? ` <br>⚠️ Vade ${span.join(", ")} yılına sarkıyor.` : ""}`;
  $("fKrBox").hidden = !kr; $("fStBox").hidden = kr;
  fMarkChip();
  let st = null;
  if (!kr && g) { st = fStopaj(g); if (fTaxAuto) $("fTax").value = String(st[1]).replace(".", ","); $("fTaxL").textContent = `Stopaj — güncel oran %${nf(st[1], 1)} · ${st[2]}`; }
  $("fStNote").innerHTML = `Güncel TL mevduat stopajı: 6 aya kadar <b>%17,5</b> · 1 yıla kadar <b>%15</b> · 1 yıldan uzun <b>%10</b> (31.12.2026'ya kadar geçerli karar). Vadeye göre kendiliğinden gelir, istersen değiştirebilirsin.`;
  // Oran girilmeden sonuç gösterilmez; hazır bir oran bankanın oranı sanılmasın
  if (!P || !r || !g) { $("fOut").textContent = "–"; rows("fRows", []); $("fNote").innerHTML = $("fR").value.trim() ? "" : "✍️ <b>Faiz oranını gir</b>, hesap burada görünsün. Oran bankaya ve kişiye göre değişir; hesap bilgi amaçlıdır."; ["fDay", "fTot"].forEach((id) => ($(id).textContent = "–")); $("fDay2").textContent = $("fTot2").textContent = ""; $("fWarn").hidden = true; return; }
  const gun = (P * r) / base, faiz = gun * g;
  // Vade bitişi tatile denk geliyor mu?
  let iw = new Date(end); while (isWE(iw) || isHol(iw)) iw = addD(iw, 1);
  const endTxt = end.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
  $("fWarn").hidden = false; $("fWarn").className = ymd(iw) !== ymd(end) ? "warn" : "warn ok";
  $("fWarn").innerHTML = ymd(iw) !== ymd(end)
    ? `⚠️ Vade bitişi <b>${endTxt}</b> — ${isWE(end) ? "hafta sonu" : "resmî tatil"}. İlk iş günü <b>${longD(iw)}</b> (${dd(end, iw)} gün sonra)${kr ? "; ödeme o güne kayar." : "; faiz o güne kadar işleyebilir, bankaya göre değişir."}`
    : `✅ Vade bitişi <b>${endTxt}</b> — iş günü.${$("fA").value ? "" : " (Başlangıç bugün sayıldı.)"}`;
  $("fBigL").textContent = `${g} günlük ${kr ? "faiz" : "brüt faiz"}`;
  const tR = kr ? 0 : num($("fTax")) / 100;
  $("fDay").textContent = tl(gun) + " TL"; $("fDay2").textContent = kr ? `1 günlük · ${tl(gun * 30)} TL / 30 gün` : `brüt · net ${tl(gun * (1 - tR))} TL`;
  $("fTotL").textContent = `${g} günlük ${kr ? "faiz" : "net faiz"}`; $("fTot").textContent = tl(kr ? faiz : faiz * (1 - tR)) + " TL"; $("fTot2").textContent = kr ? `geri ödeme ${tl(P + faiz * (1 + num($("fBsmv")) / 100 + num($("fKkdf")) / 100), 0)} TL*` : `stopaj %${nf(tR * 100, 1)} düşüldü`;
  $("fOut").textContent = tl(faiz) + " TL";
  if (kr) {
    const bs = faiz * num($("fBsmv")) / 100, kk = faiz * num($("fKkdf")) / 100;
    rows("fRows", [
      ["Formül", `${tl(P, 0)} × %${nf(r)} × ${g} ÷ 36.000`],
      ["Günlük faiz", tl(gun) + " TL"],
      ["Aylık (30 gün) faiz", tl(gun * 30) + " TL"],
      ["BSMV" + (bs ? ` (%${nf(num($("fBsmv")))})` : ""), tl(bs) + " TL"],
      ["KKDF" + (kk ? ` (%${nf(num($("fKkdf")))})` : ""), tl(kk) + " TL"],
      ["Faiz + vergiler", tl(faiz + bs + kk) + " TL"],
      ["Toplam geri ödeme", tl(P + faiz + bs + kk) + " TL"],
    ]);
    $("fNote").textContent = "* Basit faiz hesabıdır, taksitli kredinin ödeme planı değildir; oran aylık verildiyse 12 ile çarpıp gir. BSMV ve KKDF boşsa 0 sayılır; kredi türüne göre kendin gir (ör. ticari TL kredide BSMV %5, KKDF %0; konut kredisinde ikisi de yok).";
  } else {
    const tax = faiz * num($("fTax")) / 100;
    rows("fRows", [
      ["Formül", `${tl(P, 0)} × %${nf(r)} × ${g} ÷ ${base.toLocaleString("tr-TR")}`],
      ["Günlük brüt faiz", tl(gun) + " TL"],
      ["Günlük net faiz", tl(gun * (1 - num($("fTax")) / 100)) + " TL"],
      [`Stopaj (%${nf(num($("fTax")), 1)})`, tl(tax) + " TL"],
      ["Net faiz", tl(faiz - tax) + " TL"],
      ["Vade sonu toplam (net)", tl(P + faiz - tax) + " TL"],
      ["Net yıllık getiri", "%" + nf(r * (1 - num($("fTax")) / 100), 2)],
    ]);
    $("fNote").textContent = "";
  }
}
fChips();

// ===== İki tarih arası =====
function wdCount(a, b) { let w = 0, h = 0, hf = 0, we = 0; for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) { if (isWE(d)) we++; else if (isHol(d)) h++; else { w++; if (isHalf(d)) hf++; } } return { w, h, hf, we }; }
function calcT() {
  const a = pD($("tA").value), b = pD($("tB").value);
  if (!a || !b) { $("tOut").textContent = "–"; rows("tRows", []); return; }
  const [x, y] = a <= b ? [a, b] : [b, a], g = dd(x, y);
  // yıl/ay/gün
  let Y = y.getFullYear() - x.getFullYear(), M = y.getMonth() - x.getMonth(), D = y.getDate() - x.getDate();
  if (D < 0) { M--; D += new Date(y.getFullYear(), y.getMonth(), 0).getDate(); } if (M < 0) { Y--; M += 12; }
  const c = wdCount(addD(x, 1), y);
  $("tOut").textContent = `${g.toLocaleString("tr-TR")} gün`;
  rows("tRows", [
    ["Yıl · ay · gün", [Y && `${Y} yıl`, M && `${M} ay`, `${D} gün`].filter(Boolean).join(" ")],
    ["Hafta", `${Math.floor(g / 7)} hafta ${g % 7} gün`],
    ["İş günü (başlangıç hariç)", `${c.w}${c.hf ? ` (${c.hf} yarım)` : ""}`],
    ["Hafta sonu / tatil", `${c.we} / ${c.h}`],
    ["Başlangıç dahil sayılırsa", `${g + 1} gün`],
    ["Saat / dakika", `${(g * 24).toLocaleString("tr-TR")} sa · ${(g * 1440).toLocaleString("tr-TR")} dk`],
  ]);
  let iw = new Date(b); while (isWE(iw) || isHol(iw)) iw = addD(iw, 1);
  const bT = b.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
  $("tWarn").hidden = false; $("tWarn").className = ymd(iw) !== ymd(b) ? "warn" : "warn ok";
  $("tWarn").innerHTML = ymd(iw) !== ymd(b) ? `⚠️ Bitiş <b>${bT}</b> — ${isWE(b) ? "hafta sonu" : "resmî tatil"}. İlk iş günü <b>${longD(iw)}</b>.` : `✅ Bitiş <b>${bT}</b> — iş günü${isHalf(b) ? " (yarım gün)" : ""}.`;
}
["tA", "tB"].forEach((id) => $(id).addEventListener("input", calcT));
$("tQ").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-q]"); if (!b) return; const a = pD($("tA").value) || today, q = b.dataset.q;
  if (q === "bil" || q === "ppk") { const d = q === "bil" ? nextQEnd() : nextPPK(); if (d) { $("tA").value = ymd(today); $("tB").value = ymd(d); calcT(); } return; }
  const r = q === "0" ? today : q === "m" ? new Date(a.getFullYear(), a.getMonth() + 1, 0, 12) : q === "y" ? new Date(a.getFullYear(), 11, 31, 12) : q === "365" ? addM(a, 12) : addD(a, +q); // "+1 yıl" takvim yılı (artık yılda 366 gün)
  $("tB").value = ymd(r); calcT();
});
function calcA() {
  const d = pD($("aD").value), n = Math.round(num($("aN")));
  if (!d || !isFinite(n)) { $("aOut").textContent = "–"; rows("aRows", []); return; }
  const r = addD(d, n);
  $("aOut").textContent = r.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  let iw = new Date(r); while (isWE(iw) || isHol(iw)) iw = addD(iw, 1);
  rows("aRows", [["Gün", r.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })], ...(ymd(iw) !== ymd(r) ? [["Tatile denk geliyor; ilk iş günü", longD(iw)]] : []), ["Bugüne uzaklık", `${dd(today, r)} gün`]]);
}
["aD", "aN"].forEach((id) => $(id).addEventListener("input", calcA));
$("aNeg").onclick = () => { const v = $("aN").value.trim(); $("aN").value = v.startsWith("-") ? v.slice(1) : "-" + (v || "0"); calcA(); }; // iPhone sayı klavyesinde eksi tuşu yok
$("tA").value = ymd(today); $("tB").value = ymd(new Date(today.getFullYear(), 11, 31, 12)); $("aD").value = ymd(today);
calcT(); calcA(); calcF();

// ===== Yaklaşan önemli günler: bilanço dönemleri ve TCMB PPK faiz kararları =====
// PPK tarihleri TCMB'nin yayımladığı takvimden (2027'nin ikinci yarısı henüz açıklanmadı)
const TCMB_PPK = "https://www.tcmb.gov.tr/wps/wcm/connect/tr/tcmb+tr/main+menu/temel+faaliyetler/para+politikasi/merkez+bankasi+faiz+oranlari/faiz-oranlari", TCMB_TAKVIM = "https://www.tcmb.gov.tr/wps/wcm/connect/tr/tcmb+tr/main+menu/duyurular/takvim";
const PPK = ["2026-01-22", "2026-03-12", "2026-04-22", "2026-06-11", "2026-07-23", "2026-09-10", "2026-10-22", "2026-12-10", "2027-01-21", "2027-03-18", "2027-04-22", "2027-06-10"];
function isGunSay(a, b) { let n = 0; for (let d = addD(a, 1); d <= b; d = addD(d, 1)) if (!isWE(d) && !isHol(d)) n++; return n; }
const kalan = (g) => (g === 0 ? "Bugün" : g === 1 ? "Yarın" : `${g}`);
function evRow(d, title, g, extra, next) {
  return `<div class="evr${next ? " next" : ""}" data-go="${ymd(d)}"><span>${title}</span><b>${kalan(g)}${g > 1 ? "<em>gün kaldı</em>" : ""}</b><small>${d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })}${extra ? " · " + extra : ""}</small></div>`;
}
const nextQEnd = () => { for (let y = today.getFullYear(); ; y++) for (const [m, d] of [[2, 31], [5, 30], [8, 30], [11, 31]]) { const x = new Date(y, m, d, 12); if (dd(today, x) >= 0) return x; } };
const nextPPK = () => PPK.map(pD).find((d) => dd(today, d) >= 0);
function calcEv() {
  // Bilanço: içinde bulunulan çeyreğin sonu + sonraki 3 dönem
  const qEnds = []; for (let y = today.getFullYear(); y <= today.getFullYear() + 1; y++) [[2, 31], [5, 30], [8, 30], [11, 31]].forEach(([m, d], i) => qEnds.push({ d: new Date(y, m, d, 12), q: i + 1, y }));
  const up = qEnds.filter((x) => dd(today, x.d) >= 0).slice(0, 4);
  const cur = up[0], qStart = addD(new Date(cur.d.getFullYear(), cur.d.getMonth() - 2, 0, 12), 0), tot = dd(qStart, cur.d), done = dd(qStart, today);
  $("evBil").innerHTML = `<h3>📊 Bilanço dönemleri</h3>` + up.map((x, i) => {
    const g = dd(today, x.d);
    return evRow(x.d, `${x.y} / ${x.q}. çeyrek sonu${x.q === 4 ? " (yıl sonu)" : ""}`, g, i === 0 ? `${isGunSay(today, x.d)} iş günü` : "", i === 0) + (i === 0 ? `<div class="bar" title="Dönemden geçen: %${Math.round(done / tot * 100)}"><i style="width:${Math.min(100, done / tot * 100)}%"></i></div>` : "");
  }).join("");
  const pp = PPK.map(pD).filter((d) => dd(today, d) >= 0).slice(0, 4);
  const pj = window.PPKJ, L = pj && pj.last;
  const son = L ? `<div class="hint" style="margin:0 0 8px;padding:8px 10px;border:1px solid var(--line);border-radius:10px">📌 Son karar <b>${new Date(L.date + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}</b>: politika faizi <b>%${String(L.rate).replace(".", ",")}</b>${L.change ? ` (${L.change > 0 ? "+" : "−"}${String(Math.abs(L.change)).replace(".", ",")} puan)` : " (değişmedi)"} · <a href="${esc(L.url || TCMB_PPK)}" target="_blank" rel="noopener">karar metni ↗</a></div>` : "";
  $("evPpk").innerHTML = `<h3>🏦 TCMB faiz kararı (PPK)</h3>` + son + (pp.length ? pp.map((d, i) => evRow(d, `${d.toLocaleDateString("tr-TR", { month: "long" })} PPK kararı`, dd(today, d), i === 0 ? "14:00" : "", i === 0)).join("") : '<p class="hint">Yeni takvim henüz açıklanmadı.</p>') + `<p class="hint" style="margin-top:6px">Kaynak: <a href="${TCMB_TAKVIM}" target="_blank" rel="noopener">TCMB toplantı takvimi ↗</a> · <a href="${TCMB_PPK}" target="_blank" rel="noopener">TCMB faiz oranları ↗</a></p>`;
}
calcEv();
// PPK takvimi ve son karar data/ppk.json'dan (saatlik güncellenir; karar günü 14:01'den itibaren sık kontrol)
if (window.Ortak && Ortak.json) Ortak.json("data/ppk.json").then((j) => { if (!j) return; window.PPKJ = j; if (Array.isArray(j.meetings) && j.meetings.length) { PPK.length = 0; j.meetings.forEach((x) => PPK.push(x)); } calcEv(); }).catch(() => {});
["evBil", "evPpk"].forEach((id) => $(id).addEventListener("click", (e) => { const r = e.target.closest("[data-go]"); if (!r) return; $("tA").value = ymd(today); $("tB").value = r.dataset.go; calcT(); $("tA").closest(".card").scrollIntoView({ behavior: "smooth", block: "start" }); }));

// ===== KDV & ÖTV =====
// Oranlar Ekim 2026 itibarıyla. ÖTV dilimleri "vergisiz fiyat" (ÖTV matrahı) üzerinden: [üst sınır TL, oran %]
// Cep telefonu: CK 24.10.2025 (4.500 / 9.000 TL), asgari ÖTV 456 TL (2026). Otomobil: CK 10115 (24.07.2025).
const CARS = {
  "c1400": { ad: "1.400 cm³'e kadar", d: [[650000, 70], [900000, 75], [1100000, 80], [Infinity, 90]] },
  "c1600": { ad: "1.401–1.600 cm³", d: [[850000, 75], [1100000, 80], [1650000, 90], [Infinity, 100]] },
  "c2000": { ad: "1.601–2.000 cm³", d: [[1650000, 150], [Infinity, 170]] },
  "c2001": { ad: "2.000 cm³ üstü", d: [[Infinity, 220]] },
};
const EVS = { "e160": { ad: "160 kW'a kadar", d: [[1650000, 25], [Infinity, 55]] }, "e161": { ad: "160 kW üstü", d: [[1650000, 65], [Infinity, 75]] } };
const VCAT = [
  ["Genel", [["kdv", "Yalnız KDV (oranı sen seç)"], ["elle", "KDV + ÖTV (oranları sen gir)"]]],
  ["Beyaz eşya & ev", [["beyaz", "Buzdolabı · çamaşır · bulaşık makinesi", 6.7, 20], ["firin", "Fırın · ocak · mikrodalga", 6.7, 20], ["klima", "Klima", 6.7, 20], ["supurge", "Elektrikli süpürge · küçük ev aleti", 6.7, 20], ["tv", "Televizyon · monitör", 6.7, 20]]],
  ["Elektronik", [["tel", "Cep telefonu (dilimli ÖTV)", "tel", 20], ["konsol", "Oyun konsolu", 20, 20], ["kamera", "Fotoğraf makinesi · kamera", 20, 20], ["pc", "Bilgisayar · tablet", 0, 20]]],
  ["Kişisel", [["parfum", "Parfüm · kozmetik · makyaj", 20, 20], ["giyim", "Giyim · ayakkabı", 0, 10], ["gida", "Temel gıda (ekmek, süt, sebze…)", 0, 1], ["restoran", "Lokanta · kafe", 0, 10]]],
  ["Faturalar", [["elek", "Elektrik faturası (konut)", 5, 10, { lbl: "BTV", n: "Elektrikte önce tüketim bedeline <b>%5 BTV</b> (belediye tüketim vergisi) eklenir, KDV bunun üzerinden alınır: konutta <b>%10</b>. Enerji fonu (%1) birim fiyatın içindedir; TRT payı 2021'de kaldırıldı." }],
    ["elekis", "Elektrik faturası (iş yeri)", 5, 20, { lbl: "BTV", n: "İş yeri elektriğinde BTV %5, KDV %20 (sanayide BTV %1)." }],
    ["gaz", "Doğal gaz faturası", 0, 20, { n: "Doğal gazda KDV %20 tüketim bedeli üzerinden alınır." }],
    ["su", "Su faturası (şebeke suyu)", 0, 1, { n: "Şebeke suyunda KDV %1'dir. Faturadaki atık su bedelinde KDV %10'dur ve ÇTV (çevre temizlik vergisi) m³ başına ayrıca eklenir." }],
    ["gsm", "Cep telefonu faturası", 10, 20, { lbl: "ÖİV", par: true, n: "Hat faturasında <b>%10 ÖİV</b> (özel iletişim vergisi) ve <b>%20 KDV</b> ikisi de vergisiz tutar üzerinden alınır: 100 TL'lik hizmete 30 TL vergi." }]]],
  ["Otomobil (sıfır)", [["oto", "Benzinli / dizel (motor hacmine göre)", "oto", 20], ["ev", "Elektrikli otomobil (motor gücüne göre)", "ev", 20]]],
];
const VC = {}; VCAT.forEach(([, l]) => l.forEach((x) => (VC[x[0]] = x)));
$("vCat").innerHTML = VCAT.map(([g, l]) => `<optgroup label="${g}">${l.map(([id, ad]) => `<option value="${id}">${ad}</option>`).join("")}</optgroup>`).join("");
let vDir = "in", kO = 20, vSub = "c1600";
try { const c = localStorage.getItem("vergiCat"); if (c && VC[c]) $("vCat").value = c; } catch (e) {}
function vSubUI() {
  const c = $("vCat").value, list = c === "oto" ? CARS : c === "ev" ? EVS : null;
  if (!list) { $("vSub").innerHTML = ""; return; }
  if (!list[vSub]) vSub = Object.keys(list)[c === "oto" ? 1 : 0];
  $("vSub").innerHTML = `<label>${c === "oto" ? "Motor hacmi" : "Motor gücü"}</label><div class="chips">${Object.entries(list).map(([k, v]) => `<button type="button" data-s="${k}" class="${k === vSub ? "on" : ""}">${v.ad}</button>`).join("")}</div>`;
}
$("vSub").addEventListener("click", (e) => { const b = e.target.closest("button[data-s]"); if (!b) return; vSub = b.dataset.s; vSubUI(); calcV(); });
$("vCat").addEventListener("change", () => { try { localStorage.setItem("vergiCat", $("vCat").value); } catch (e) {} const c = $("vCat").value; if (c === "oto" || c === "ev") $("vP").value = "2.000.000"; else if (c === "tel") $("vP").value = "45.000"; else if (VC[c][4]) $("vP").value = "1.500"; vSubUI(); calcV(); });
$("vDir").addEventListener("click", (e) => { const b = e.target.closest("button[data-d]"); if (!b) return; vDir = b.dataset.d; $("vDir").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); calcV(); });
$("kO").addEventListener("click", (e) => { const b = e.target.closest("button[data-o]"); if (!b) return; kO = +b.dataset.o; $("kO").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); calcV(); });
["vP", "vO"].forEach((id) => $(id).addEventListener("input", calcV));
// Vergisiz fiyattan ÖTV (dilim + asgari tutar)
function otvOf(m, spec) {
  if (typeof spec === "number") return { o: spec, t: m * spec / 100 };
  const d = spec.d.find(([lim]) => m <= lim), t = Math.max(m * d[1] / 100, spec.min || 0);
  return { o: d[1], t, min: spec.min && m * d[1] / 100 < spec.min };
}
// Vergiler dahil fiyattan geriye: her dilimi dene, tutarlı olanı al
function fromGross(G, spec, k) {
  if (typeof spec === "number") { const m = G / (1 + k / 100) / (1 + spec / 100); return m; }
  let lo = 0, prev = 0;
  for (const [lim, o] of spec.d) {
    let m = G / (1 + k / 100) / (1 + o / 100);
    if (spec.min && m * o / 100 < spec.min) m = G / (1 + k / 100) - spec.min;
    if (m > lo && m <= lim) return m;
    if (m <= lo) return lo; // dilim sınırındaki boşluk: fiyat bir alt dilimin üst sınırına denk gelir
    lo = lim; prev = o;
  }
  return G / (1 + k / 100) / (1 + prev / 100);
}
function calcV() {
  const c = $("vCat").value, x = VC[c], P = num($("vP"));
  const manual = c === "kdv" || c === "elle";
  $("vManual").hidden = !manual; $("vOtvBox").hidden = c !== "elle";
  let spec, k; const opt = (!manual && x[4]) || {}, L = opt.lbl || "ÖTV";
  if (manual) { k = kO; spec = c === "elle" ? num($("vO")) : 0; }
  else { k = x[3]; spec = x[2] === "tel" ? { d: [[4500, 25], [9000, 40], [Infinity, 50]], min: 456 } : x[2] === "oto" ? CARS[vSub] : x[2] === "ev" ? EVS[vSub] : x[2]; }
  const rateTxt = typeof spec === "number" ? (spec ? `${L} <b>%${nf(spec, 1)}</b>` : "ÖTV <b>yok</b>") : `ÖTV <b>${spec.d.map(([l, o]) => `%${o}${isFinite(l) ? ` (≤${tl(l, 0)})` : ""}`).join(" · ")}</b>`;
  $("vRate").innerHTML = manual ? "" : `<span>${rateTxt}</span><span>KDV <b>%${k}</b></span>`;
  if (!P) { $("vOut").textContent = "–"; rows("vRows", []); $("vBar").innerHTML = ""; return; }
  const m = vDir === "in" ? (opt.par ? P / (1 + k / 100 + spec / 100) : fromGross(P, spec, k)) : P;
  const ot = otvOf(m, spec), kdvM = opt.par ? m : m + ot.t, kdv = kdvM * k / 100, G = kdvM + kdv + (opt.par ? ot.t : 0), top = ot.t + kdv;
  $("vDir").firstElementChild.textContent = opt.n ? "Fatura tutarı (vergiler dahil)" : "Vergiler dahil fiyat"; $("vDir").lastElementChild.textContent = opt.n ? "Vergisiz tüketim bedeli" : "Vergisiz fiyat";
  $("vBigL").textContent = vDir === "in" ? `${tl(P, 0)} TL'nin içindeki vergiler` : "Vergiler dahil fiyat";
  $("vOut").textContent = tl(vDir === "in" ? top : G) + " TL";
  $("vBar").innerHTML = `<i class="va" style="width:${m / G * 100}%"></i><i class="vo" style="width:${ot.t / G * 100}%"></i><i class="vk" style="width:${kdv / G * 100}%"></i>`;
  rows("vRows", [
    ["Vergisiz fiyat", tl(m) + " TL"],
    ...(ot.t || spec ? [[`${L} (%${nf(ot.o, 1)}${ot.min ? ", asgari 456 TL" : ""})`, tl(ot.t) + " TL"]] : []),
    ...(ot.t && !opt.par ? [[`KDV matrahı (fiyat + ${L})`, tl(kdvM) + " TL"]] : []),
    [`KDV (%${k})`, tl(kdv) + " TL"],
    ["Vergiler toplamı", tl(top) + " TL"],
    ["Vergiler dahil fiyat", tl(G) + " TL"],
    ["Fiyatın vergi payı", "%" + nf(top / G * 100, 1)],
  ]);
  $("vNote").innerHTML = `<span class="vleg"><span><i style="background:#6f6a62"></i>Ürün</span><span><i style="background:#ef6a4c"></i>${L}</span><span><i style="background:#e0a24f"></i>KDV</span></span>` +
    (opt.n ? opt.n + " Oranlar Ekim 2026 itibarıyla." : manual ? "" : `${ot.t ? "KDV, ÖTV eklenmiş fiyat üzerinden alınır. " : ""}${typeof spec === "number" || !ot.t ? "" : "ÖTV dilimi vergisiz fiyata (matraha) göre belirlenir. "}Oranlar Ekim 2026 itibarıyla güncel; Cumhurbaşkanı kararıyla değişebilir.${c === "oto" || c === "ev" ? " Engelli, ticari ve özel indirimler dahil değildir." : ""}`);
}
vSubUI(); calcV();

// ===== Tapu harcı =====
function calcTp() {
  const P = num($("tpP")), E = num($("tpE")), D = num($("tpD")), M = Math.max(P, E);
  if (!M) { $("tpOut").textContent = "–"; rows("tpRows", []); return; }
  const h = M * 0.02;
  $("tpOut").textContent = tl(h * 2) + " TL";
  rows("tpRows", [
    ...(E > P ? [["⚠️ Harç esası (vergi değeri, beyandan yüksek)", tl(M) + " TL"]] : [["Harç esası", tl(M) + " TL"]]),
    ["Alıcının harcı (binde 20)", tl(h) + " TL"],
    ["Satıcının harcı (binde 20)", tl(h) + " TL"],
    ...(D ? [["Döner sermaye (alıcı)", tl(D) + " TL"]] : []),
    ["Alıcının toplam ödemesi", tl(h + D) + " TL"],
    ["Tek kişi öderse (harç + döner sermaye)", tl(h * 2 + D) + " TL"],
  ]);
}
["tpP", "tpE", "tpD"].forEach((id) => $(id).addEventListener("input", calcTp)); calcTp();

// ===== Yüzde =====
// Sayının okunuşundaki son kelimeye göre Türkçe ek: ekS(250, 0) → "nin" (250'nin), ekS(20, 1) → "si" (%20'si)
const EKS = { 0: ["ın", "ı"], 1: ["in", "i"], 2: ["nin", "si"], 3: ["ün", "ü"], 4: ["ün", "ü"], 5: ["in", "i"], 6: ["nın", "sı"], 7: ["nin", "si"], 8: ["in", "i"], 9: ["un", "u"],
  10: ["un", "u"], 20: ["nin", "si"], 30: ["un", "u"], 40: ["ın", "ı"], 50: ["nin", "si"], 60: ["ın", "ı"], 70: ["in", "i"], 80: ["in", "i"], 90: ["ın", "ı"], yuz: ["ün", "ü"], bin: ["in", "i"], milyon: ["un", "u"], milyar: ["ın", "ı"] };
function ekS(x, tur) {
  const t = nf(Math.abs(x), 4), d = (t.includes(",") ? t.split(",")[1] : t.replace(/\D/g, "")).replace(/^0+(?=\d)/, "") || "0";
  const z = (d.match(/0+$/) || [""])[0].length, n = +d;
  const k = n === 0 ? 0 : z === 0 ? +d.slice(-1) : z === 1 ? +d.slice(-2) : z === 2 ? "yuz" : z < 6 ? "bin" : z < 9 ? "milyon" : "milyar";
  return EKS[k][tur];
}
function calcY() {
  const A = num($("yA")), B = num($("yB"));
  rows("yRows", [
    [`${nf(A)}'${ekS(A, 0)} %${nf(B)}'${ekS(B, 1)}`, nf(A * B / 100, 4)],
    [`${nf(A)} + %${nf(B)}`, nf(A * (1 + B / 100), 4)],
    [`${nf(A)} − %${nf(B)}`, nf(A * (1 - B / 100), 4)],
    [`${nf(B)}, ${nf(A)}'${ekS(A, 0)} yüzde kaçı?`, A ? "%" + nf(B / A * 100, 4) : "–"],
    [`${nf(A)} → ${nf(B)} değişim`, A ? (B >= A ? "+%" : "−%") + nf(Math.abs((B - A) / A * 100), 4) : "–"],
  ]);
}
["yA", "yB"].forEach((id) => $(id).addEventListener("input", calcY));
calcY();

// ===== Cetvel =====
// Varsayılan: dokunmatik cihazlarda ~6,3 CSS px/mm, bilgisayarda 96 dpi (3,78 px/mm). Banka kartıyla ayarlanır.
const DEF = matchMedia("(pointer: coarse)").matches ? 6.3 : 96 / 25.4;
let ppm = DEF; try { const s = +localStorage.getItem("cetvelPPM"); if (s > 1) ppm = s; } catch (e) {}
let mark = null, markX = null, rLock = false;
try { rLock = localStorage.getItem("cetvelKilit") === "1"; } catch (e) {}
// Cetvel boyu ekrana göre: sayfa kaydırmadan tamamı görünsün (en az 5, en çok 15 cm)
let RLEN = 150;
function rFit() {
  const w = $("rwrap"), top = w.getBoundingClientRect().top + window.scrollY;
  const bos = (window.innerHeight || document.documentElement.clientHeight) - top - 70 - 8;
  RLEN = Math.max(50, Math.min(150, Math.floor(bos / ppm)));
}
function rCanvas(c, W, H) { const dpr = window.devicePixelRatio || 1; c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px"; const g = c.getContext("2d"); g.scale(dpr, dpr); return g; }
// Dikey cetvel; side: "L" (çizgiler soldan) ya da "R" (çizgiler sağdan)
function drawVert(c, H, side) {
  const W = 84, g = rCanvas(c, W, H), x0 = side === "L" ? 0 : W, d = side === "L" ? 1 : -1;
  const grd = g.createLinearGradient(0, 0, W, 0); grd.addColorStop(side === "L" ? 0 : 1, "#e8c27a"); grd.addColorStop(side === "L" ? 1 : 0, "#c9984a");
  g.fillStyle = grd; g.fillRect(side === "L" ? 0 : 14, 0, W - 14, RLEN * ppm + 12);
  g.fillStyle = "#2a1c08"; g.strokeStyle = "#2a1c08"; g.font = "bold 13px system-ui"; g.textBaseline = "middle"; g.textAlign = "center";
  for (let mm = 0; mm <= RLEN; mm++) {
    const y = Math.round(mm * ppm) + .5, L = mm % 10 === 0 ? 30 : mm % 5 === 0 ? 20 : 11;
    g.lineWidth = mm % 10 === 0 ? 1.4 : 1; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + d * L, y); g.stroke();
    if (mm % 10 === 0 && mm) g.fillText(String(mm / 10), x0 + d * 44, y);
  }
  g.font = "10px system-ui"; g.fillText("cm", x0 + d * 44, 10);
  if (mark !== null) { g.strokeStyle = "#ef4a3a"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, mark); g.lineTo(W, mark); g.stroke(); }
}
function drawHoriz(c, W) {
  const H = 58, g = rCanvas(c, W, H), len = Math.min(W, RLEN * ppm);
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, "#9fd3ff"); grd.addColorStop(1, "#6fb4ec");
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.fillStyle = "#08223a"; g.strokeStyle = "#08223a"; g.font = "bold 12px system-ui"; g.textBaseline = "middle"; g.textAlign = "center";
  for (let mm = 0; mm * ppm <= len; mm++) {
    const x = Math.round(mm * ppm) + .5, L = mm % 10 === 0 ? 26 : mm % 5 === 0 ? 17 : 9;
    g.lineWidth = mm % 10 === 0 ? 1.4 : 1; g.beginPath(); g.moveTo(x, H); g.lineTo(x, H - L); g.stroke();
    if (mm % 10 === 0 && mm) g.fillText(String(mm / 10), x, 13);
  }
  g.font = "10px system-ui"; g.textAlign = "left"; g.fillText("cm", 4, 13);
  if (markX !== null) { g.strokeStyle = "#ef4a3a"; g.lineWidth = 2; g.beginPath(); g.moveTo(markX, 0); g.lineTo(markX, H); g.stroke(); }
}
function drawRuler() {
  rFit();
  const w = $("rwrap"), H = Math.ceil(RLEN * ppm) + 70;
  if (mark !== null) mark = Math.min(mark, RLEN * ppm);
  w.style.height = H + "px";
  drawVert($("ruler"), H, "L"); drawVert($("rulerR"), H, "R"); drawHoriz($("rulerB"), w.clientWidth);
  const ayarli = Math.abs(ppm - DEF) >= .001;
  $("rDev").textContent = rLock ? "🔒 Ayar kilitli ✓" : ayarli ? "Bu cihaza ayarlı ✓" : "Varsayılan ayar — kartla ayarla ↓";
  $("rLen").textContent = mark !== null ? `↕ ${nf(mark / ppm / 10, 1)} cm · ${nf(mark / ppm, 0)} mm` : "Ölçmek için dokun";
  $("rLenH").textContent = markX !== null ? `↔ ${nf(markX / ppm / 10, 1)} cm · ${nf(markX / ppm, 0)} mm` : "";
  // Okuma etiketi çizginin hemen yanında: sayfa kaydırılınca da görünür
  $("rTag").hidden = $("rLine").hidden = mark === null;
  if (mark !== null) { $("rTag").style.top = mark + "px"; $("rTag").textContent = `${nf(mark / ppm / 10, 1)} cm`; $("rLine").style.top = mark + "px"; }
  $("rTagH").hidden = markX === null;
  if (markX !== null) { $("rTagH").style.left = Math.min(w.clientWidth - 50, Math.max(50, markX)) + "px"; $("rTagH").textContent = `↔ ${nf(markX / ppm / 10, 1)} cm`; }
  $("cardBox").style.width = (85.6 * ppm) + "px"; $("cardBox").style.height = (53.98 * ppm) + "px"; $("cardBox").style.maxWidth = "none";
  $("cal").value = ppm;
  $("calOpen").hidden = rLock; $("calLocked").hidden = !rLock;
  $("cal").disabled = rLock; $("calReset").disabled = rLock;
}
$("rwrap").addEventListener("pointerdown", (e) => { if (e.target.closest("#rbot")) return; const r = $("rwrap").getBoundingClientRect(); mark = Math.min(RLEN * ppm, Math.max(0, e.clientY - r.top)); drawRuler(); });
$("rwrap").addEventListener("pointermove", (e) => { if (e.buttons && !e.target.closest("#rbot")) { const r = $("rwrap").getBoundingClientRect(); mark = Math.min(RLEN * ppm, Math.max(0, e.clientY - r.top)); drawRuler(); } });
const setX = (e) => { const r = $("rbot").getBoundingClientRect(); markX = Math.max(0, e.clientX - r.left); drawRuler(); };
$("rbot").addEventListener("pointerdown", setX);
$("rbot").addEventListener("pointermove", (e) => { if (e.buttons) setX(e); });
$("cal").addEventListener("input", () => { if (rLock) return; ppm = +$("cal").value; try { localStorage.setItem("cetvelPPM", ppm); } catch (e) {} $("calNudge").hidden = false; drawRuler(); });
$("calReset").onclick = () => { if (rLock) return; ppm = DEF; try { localStorage.removeItem("cetvelPPM"); } catch (e) {} drawRuler(); };
$("calLock").onclick = () => {
  if (Math.abs(ppm - DEF) < .001 && !confirm("Henüz kartla ayar yapmamışsın gibi görünüyor 🙂 Yine de varsayılan ayarla kilitleyelim mi?")) return;
  rLock = true; try { localStorage.setItem("cetvelKilit", "1"); } catch (e) {} $("calNudge").hidden = true; drawRuler();
  if (typeof toast === "function") toast("🔒 Kilitlendi — artık bozulmaz");
};
$("calUnlock").onclick = () => {
  if (!confirm("Kilidi açarsan ayarı yeniden değiştirebilirsin; kaydırıcıya dokunursan ölçüler de değişir. Kartın yanındaysa sorun yok, açalım mı? 😊")) return;
  rLock = false; try { localStorage.removeItem("cetvelKilit"); } catch (e) {} drawRuler();
};
window.addEventListener("resize", () => { if ($("cetvel").classList.contains("on")) drawRuler(); });

// ===== Mesafe ölçer: kamera + eğim sensörü (trigonometri) =====
let mStream = null, mBeta = null, mLockD = null, mTopOn = false;
try { const e = localStorage.getItem("mesafeGoz"); if (e) $("mEye").value = e; } catch (e) {}
const mEye = () => Math.max(20, num($("mEye"))) / 100;
const mFmt = (m) => (!isFinite(m) || m < 0 ? "–" : m < 10 ? nf(m, 2) + " m" : nf(m, 1) + " m");
try { const bb = localStorage.getItem("mesafeBoy"); if (bb) $("mBoy").value = bb; } catch (e) {}
$("mBoy").addEventListener("input", () => { const b = num($("mBoy")); if (b > 100 && b < 230) { $("mEye").value = Math.round(b - 12); try { localStorage.setItem("mesafeBoy", $("mBoy").value); } catch (e) {} mSave(); } });
$("mEye").addEventListener("input", mSave);
function mSave() { try { localStorage.setItem("mesafeGoz", $("mEye").value); } catch (e) {} mRender(); }
function onOri(e) {
  if (e.beta == null) return;
  // Dik tutulan telefonda beta ≈ 90° (kamera ufka bakar), yere doğru eğdikçe azalır.
  const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  if (Math.abs(ang) === 90) { $("lvl").textContent = "Telefonu dik (portre) tut"; $("mD").textContent = "–"; return; }
  const b = e.beta;
  mBeta = mBeta == null ? b : mBeta * 0.8 + b * 0.2; // titremeyi yumuşat
  mRender();
}
function mGuide() {
  const g = $("guide"); if (!g) return;
  g.innerHTML = mLockD == null
    ? `① Artıyı ölçeceğin şeyin <u>yere değdiği</u> noktaya getir<small>Uzaklık üstte yazıyor → sonra 🔒 Uzaklığı kilitle</small>`
    : `② Şimdi telefonu kaldır, artıyı <u>tepesine</u> getir<small>Uzaklık kilitli: ${mFmt(mLockD)} · yükseklik sağ üstte</small>`;
}
function mRender() {
  mGuide();
  if (mBeta == null) return;
  const h = mEye(), b = mBeta;
  const down = 90 - b; // ufkun kaç derece altına bakıyor
  $("lvl").textContent = down > 0 ? `${nf(down, 1)}° aşağı` : `${nf(-down, 1)}° yukarı`;
  if (mLockD == null) {
    $("mD").textContent = b > 0 && b < 89 ? mFmt(h * Math.tan(b * Math.PI / 180)) : b >= 89 ? "∞" : "–";
    $("mH").textContent = "–";
  } else {
    $("mD").textContent = mFmt(mLockD) + " 🔒";
    const up = b - 90; // ufkun kaç derece üstüne bakıyor (eksi ise altına)
    $("mH").textContent = mTopOn ? mFmt(h + mLockD * Math.tan(up * Math.PI / 180)) : "–";
  }
}
async function camStart() {
  try {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      const r = await DeviceOrientationEvent.requestPermission(); if (r !== "granted") throw new Error("sensör izni verilmedi");
    }
    window.addEventListener("deviceorientation", onOri);
    mStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    $("vid").srcObject = mStream; await $("vid").play().catch(() => {});
    $("camPh").hidden = true; ["cross", "hud", "camStep", "lvl", "guide"].forEach((id) => ($(id).hidden = false)); mGuide();
    setTimeout(() => { if (mBeta == null) { $("lvl").hidden = false; $("lvl").textContent = "Eğim sensörü bulunamadı (sayfayı telefonda aç)"; } }, 1500);
  } catch (err) {
    $("camPh").hidden = false;
    $("camPh").querySelector("div:nth-child(2)").innerHTML = `<b style="color:var(--red)">Kamera açılamadı.</b><br>${err && err.message === "sensör izni verilmedi" ? "Eğim sensörüne izin vermelisin; sayfayı yenileyip yeniden dene." : err && err.name === "NotAllowedError" ? "Tarayıcıda kamera iznine \"İzin ver\" demelisin." : "Bu cihazda kamera ya da eğim sensörü yok."}`;
  }
}
function camStop() { if (mStream) mStream.getTracks().forEach((t) => t.stop()); mStream = null; window.removeEventListener("deviceorientation", onOri); mBeta = null; $("camPh").hidden = false; ["cross", "hud", "camStep", "lvl", "guide"].forEach((id) => ($(id).hidden = true)); }
$("camGo").onclick = camStart; $("camStop").onclick = camStop;
$("mLock").onclick = () => {
  if (mLockD != null) return;
  if (mBeta == null) { $("lvl").textContent = "Eğim sensörü yok"; return; }
  if (mBeta >= 89) { $("lvl").textContent = "Artıyı daha aşağıya, yere değdiği yere indir"; return; }
  mLockD = mEye() * Math.tan(mBeta * Math.PI / 180); mTopOn = true;
  $("mLock").innerHTML = `✅ Kilitli: ${mFmt(mLockD)}`; $("mLock").classList.add("on");
  tik(false); if (navigator.vibrate) navigator.vibrate(30); mRender();
};
$("mTop").onclick = () => { mLockD = null; mTopOn = false; $("mLock").innerHTML = "🔒 Uzaklığı kilitle"; $("mLock").classList.remove("on"); mRender(); };

// Açılışta her zaman hesap makinesi; adreste sekme yazılıysa (ör. hesap.html#faiz) o sekme açılır
// Sayı Bulmaca 6 Kasım 2026'da kendi sayfasına taşındı (Oyunlar); eski #bulmaca bağlantıları oraya gider
const bmYonlendir = () => { if (location.hash === "#bulmaca") location.replace("bulmaca.html"); };
bmYonlendir(); window.addEventListener("hashchange", bmYonlendir);
// Açılışta sekme: adresteki #sekme, yoksa en son açık sekme (sayfa yenilense de aynı yerde kalınır; 8 Kasım)
try {
  const h = location.hash.slice(1), var_ = (x) => x && document.querySelector(`#tabs [data-t="${x}"]`);
  let son = null; try { son = localStorage.getItem("hesapTab"); } catch (e) {}
  const t = var_(h) ? h : var_(son) ? son : "calc"; document.querySelector(`#tabs [data-t="${t}"]`).click();
  // Adresteki #sekme yüzünden tarayıcının bölüme atlamasını geri al: sayfa en üstten açılsın
  if (h) { const ust = () => window.scrollTo(0, 0); ust(); window.addEventListener("load", () => setTimeout(ust, 0), { once: true }); }
} catch (e) {}
setTimeout(makineBoyut, 60); if (document.fonts && document.fonts.ready) document.fonts.ready.then(makineBoyut);
