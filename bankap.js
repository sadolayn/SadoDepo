const $ = (x) => document.getElementById(x);
const tl = (n) => isFinite(n) ? n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL" : "–";
const pct = (n) => isFinite(n) ? "%" + n.toLocaleString("tr-TR", { maximumFractionDigits: 2 }) : "–";
function num(id) {
  const v = $(id).value.trim().replace(/\s/g, "");
  // Türkçe biçim: 1.000.000,50
  const clean = v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : (/^\d{1,3}(\.\d{3})+$/.test(v) ? v.replace(/\./g, "") : v);
  const n = parseFloat(clean);
  return isFinite(n) ? n : 0;
}
function rows(id, list) {
  $(id).innerHTML = list.map(([k, v, cls]) => `<div class="${cls || ""}"><span>${k}</span><span>${v}</span></div>`).join("");
}
// Tutar alanlarını binlik ayırıcıyla biçimlendir
for (const id of ["b_tutar", "m_tutar", "v_min", "t_tutar", "t_ucret", "ao_x", "ys_p", "k_borc", "k_odenen", "k2_deger", "k2_tutar", "k2_masraf", "tr_tutar", "tc_tutar", "t_butce", "k2_butce", "tc_butce", "ta_deger", "ta_noter", "ta_tutar"]) {
  $(id).addEventListener("blur", () => {
    if (id === "ta_noter" && !$(id).value.trim()) return;
    const n = num(id);
    $(id).value = n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  });
}

// ---------- BCH ----------
function calcBCH() {
  const P = num("b_tutar"), ry = num("b_faiz") / 100, g = num("b_gun");
  const esas = Number($("b_esas").value) || 360;
  const bsmv = num("b_bsmv") / 100, kkdf = num("b_kkdf") / 100;
  // Faiz = Anapara × Yıllık faiz × Gün / Gün esası
  const faiz = P * ry * g / esas;
  const vB = faiz * bsmv, vK = faiz * kkdf;
  const top = faiz + vB + vK;
  const aylik = ry / 12 * 100;
  const efektif = (Math.pow(1 + (ry / 12) * (1 + bsmv + kkdf), 12) - 1) * 100;
  $("b_out").textContent = tl(top);
  rows("b_rows", [
    ["Faiz", tl(faiz)],
    ["BSMV", tl(vB)],
    ["KKDF", tl(vK)],
    ["Günlük maliyet", tl(g ? top / g : 0)],
    ["Dönem sonu borç", tl(P + top), "total"],
    ["Aylık faiz karşılığı", pct(aylik)],
    ["Yıllık efektif maliyet (vergiler dahil)", pct(efektif)],
  ]);
  bchOzet = P ? ozetMetni("BCH ROTATİF KREDİ ÖZETİ", [[`Kullanılan tutar: ${tl(P)}`, `Kullanım süresi: ${g} gün (gün esası ${esas})`, `Yıllık faiz oranı: ${pct(ry * 100)}`], [`Faiz: ${tl(faiz)}`, `BSMV (${pct(bsmv * 100)}): ${tl(vB)}`, ...(vK ? [`KKDF (${pct(kkdf * 100)}): ${tl(vK)}`] : []), `Toplam maliyet: ${tl(top)}`, `Dönem sonu borç: ${tl(P + top)}`], [`Aylık faiz karşılığı: ${pct(aylik)}`, `Yıllık efektif maliyet (vergiler dahil): ${pct(efektif)}`]]) : "";
}
let bchOzet = "";

// ---------- Mevduat ----------
let stopajManual = false, mevOzet = "";
$("m_stopaj").addEventListener("input", () => (stopajManual = true));
function autoStopaj(g) {
  if (g <= 182) return 17.5;
  if (g <= 365) return 15;
  return 10;
}
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
// Vade içindeki günleri yıllara göre böl: faiz = Σ (gün / yılın gün sayısı)
function yearFrac(start, days) {
  let f = 0, leapDays = 0;
  const d = new Date(start);
  for (let i = 0; i < days; i++) {
    const L = isLeap(d.getFullYear());
    f += 1 / (L ? 366 : 365);
    if (L) leapDays++;
    d.setDate(d.getDate() + 1);
  }
  return { f, leapDays };
}
// Ek faiz / bilanço / PPK
let PPK = { last: { date: "2026-10-22", rate: 36, lend: 39, borrow: 34.5 }, meetings: ["2026-12-10", "2027-01-21", "2027-03-18", "2027-04-22", "2027-06-10"] };
Ortak.json("data/ppk.json").then((j) => { PPK = j; calcMev(); }).catch(() => {});
const fdt = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
const fdtw = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" });
const dayDiff = (a, b) => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
function netFor(P, r, days, start, sManual) {
  const s = sManual != null ? sManual : autoStopaj(days) / 100;
  return P * r * yearFrac(start, days).f * (1 - s);
}
function quarterEnds(from, n) {
  const out = []; let y = from.getFullYear(), q = Math.floor(from.getMonth() / 3);
  while (out.length < n) {
    const d = new Date(y, q * 3 + 3, 0, 12);
    if (dayDiff(from, d) >= 0) out.push(d);
    q++; if (q > 3) { q = 0; y++; }
  }
  return out;
}
function calcBreak(P, r, g, start) {
  const sMan = stopajManual ? num("m_stopaj") / 100 : null;
  const mn = num("v_min");
  if (!P || !g || !r) { $("v_target").textContent = "–"; $("v_out").innerHTML = ""; return; }
  const target = netFor(P, r, g, start, sMan);
  $("v_target").textContent = tl(target);
  const unit = (amt) => netFor(amt, 1, g, start, sMan); // %100 oranla net getiri (oranı bulmak için)
  const sc = [num("v_p1"), num("v_p2")].filter((x) => x > 0).map((pc) => {
    const vad = Math.min(P, Math.max(mn, P * pc / 100));
    const rest = P - vad;
    const u = rest > 0 ? unit(rest) : 0;
    const rMin = u ? target / u : NaN;                      // kalan tutar aynı neti versin
    return { pc, vad, rest, rMin };
  });
  const pr = (x) => isFinite(x) ? "%" + nfx(Math.round(x * 10000) / 100) : "–";
  $("v_out").innerHTML = sc.map((x) => `<div class="rows brm">
      <div><span>%${nfx(x.pc)} barem</span><span>${P * x.pc / 100 < mn && x.vad === mn ? "asgari tutar uygulandı" : ""}</span></div>
      <div><span>Vadesizde (faizsiz)</span><span>${tl(x.vad)}</span></div>
      <div><span>Vadeliye giden</span><span>${tl(x.rest)}</span></div>
      <div class="total"><span>Başabaş oran</span><span>${pr(x.rMin)}</span></div>
    </div>`).join("");
  $("v_note").textContent = `Başabaş oran: vadeliye giden tutarla aynı net faizi (${tl(target)}) almak için gereken oran. Bu oranın altındaki teklif daha az, üstündeki daha fazla net faiz getirir.`;
}

function calcExtra(P, r, g, start) {
  calcBreak(P, r, g, start);
  const sMan = stopajManual ? num("m_stopaj") / 100 : null;
  if (!m2GunManual) $("m2_gun").value = g || "";
  const r2 = num("m2_faiz") / 100, g2 = Math.round(num("m2_gun")) || g;
  if (!P || !g || !r2) { $("m2_out").textContent = "–"; rows("m2_rows", []); $("m2_note").textContent = ""; }
  else {
    const ours = netFor(P, r, g, start, sMan), theirs = netFor(P, r2, g2, start, sMan), diff = theirs - ours;
    $("m2_label").textContent = diff > 0 ? "2. teklif daha fazla kazandırıyor" : "1. teklif daha iyi";
    $("m2_out").textContent = (diff > 0 ? "+" : "") + tl(diff);
    const list = [
      [`1. teklif net (%${nfx(r * 100)} · ${g} gün)`, tl(ours)],
      [`2. teklif net (%${nfx(r2 * 100)} · ${g2} gün)`, tl(theirs)],
      ["Fark (vade başına)", tl(Math.abs(diff)), diff > 0 ? "neg" : "pos"],
      ["Günlük fark", tl(Math.abs(diff) / Math.max(g, g2))],
      ["Yıllık fark (yenilenirse)", tl(Math.abs(diff) * 365 / g2)],
    ];
    let note = "";
    if (diff > 0) {
      // Farkı kapatmak için gereken oran (aynı vade) ve gereken vade (aynı oran)
      const unit = netFor(P, 1, g, start, sMan);
      const rNeed = unit ? theirs / unit : 0;
      let dNeed = null;
      for (let d = g; d <= g * 3 + 30; d++) { if (netFor(P, r, d, start, sMan) >= theirs) { dNeed = d; break; } }
      list.push([`Aynı ${g} günde gereken oran`, "%" + nfx(Math.ceil(rNeed * 10000) / 100)]);
      if (dNeed) list.push([`%${nfx(r * 100)} ile gereken vade`, `${dNeed} gün (+${dNeed - g})`, "total"]);
      note = dNeed
        ? `Örnek: ${g} gün yerine ${dNeed} gün seçilirse 1. teklifin oranıyla net ${tl(netFor(P, r, dNeed, start, sMan))} kazanılır; 2. teklifin ${g2} günlük getirisine ulaşılır${dNeed > g2 ? ` (para ${dNeed - g2} gün daha uzun kalır)` : dNeed < g2 ? ` (para ${g2 - dNeed} gün daha kısa kalır)` : ""}. Fark ${tl(diff)}.`
        : "";
    }
    rows("m2_rows", list);
    $("m2_note").textContent = note;
  }
  // Bilanço ve PPK
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const end = addDays(start, g);
  const qs = quarterEnds(today, 4);
  const nextQ = qs[0];
  const startQ = quarterEnds(start, 1)[0];
  const covers = dayDiff(startQ, end) > 0;
  const minDays = dayDiff(start, startQ) + 1;
  const L = PPK.last || {};
  const acik = (PPK.meetings || []).filter((x) => x !== L.date); // bugünkü karar açıklandıysa artık "sonraki" değil
  const nextP = acik.map((x) => new Date(x + "T12:00:00")).filter((d) => dayDiff(today, d) >= 0);
  const inVade = acik.map((x) => new Date(x + "T12:00:00")).filter((d) => dayDiff(start, d) >= 0 && dayDiff(d, end) > 0);
  const r3 = [
    ["Sonraki bilanço", `${fdtw(nextQ)} · <b>${dayDiff(today, nextQ)} gün</b>`],
    ...qs.slice(1).map((d) => ["", `${fdt(d)} · ${dayDiff(today, d)} gün`]),
    ["Bilanço kapsamı", covers ? `✅ Evet · ${fdt(startQ)}` : `❌ Hayır · en az <b>${minDays} gün</b>`, covers ? "pos" : "neg"],
    ["Politika faizi", L.rate != null ? `%${nfx(L.rate)}${L.change ? ` <span style="color:${L.change < 0 ? "var(--ok,#3fc283)" : "var(--bad,#e0473a)"}">(${L.change > 0 ? "+" : "−"}${nfx(Math.abs(L.change))} puan)</span>` : ""} <span style="color:var(--muted)">· ${fdt(new Date(L.date + "T12:00:00"))}</span>${L.url ? ` · <a href="${L.url}" target="_blank" rel="noopener" style="color:var(--accent)">karar ↗</a>` : ""}` : "–"],
    ["Sonraki PPK", nextP[0] ? `${fdtw(nextP[0])} · <b>${dayDiff(today, nextP[0]) ? dayDiff(today, nextP[0]) + " gün" : "bugün"}</b>` : "Takvim açıklanmadı"],
    ["Vade içinde PPK", inVade.length ? `⚠️ ${inVade.map((d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })).join(" · ")}` : "Yok", "wrapv"],
  ];
  $("m3_rows").innerHTML = r3.map(([k, v, c]) => `<div class="${c || ""}"><span>${k}</span><span style="text-align:right">${v}</span></div>`).join("");
  $("m3_note").textContent = (inVade.length ? "Vade süresince faiz kararı açıklanacak: vade sonunda yenileme oranı değişebilir. " : "") +
    `Bilanço günleri çeyrek sonlarıdır (31 Mart, 30 Haziran, 30 Eylül, 31 Aralık); mevduatın bilanço gününü kapsaması için vade sonu bu tarihten sonraya düşmelidir.`;
  $("m3_ppk").innerHTML = (PPK.meetings || []).map((x) => { const d = new Date(x + "T12:00:00"), k = dayDiff(today, d);
    const son = L.date === x && L.rate != null ? ` · %${nfx(L.rate)}${L.url ? ` <a href="${L.url}" target="_blank" rel="noopener" style="color:var(--accent)">↗</a>` : ""}` : "";
    return `<div style="${k < 0 && !son ? "opacity:.45" : ""}"><span>${fdtw(d)} ${d.getFullYear()}</span><span>${k < 0 ? "yapıldı" : k === 0 ? "bugün" : k + " gün"}${son}</span></div>`; }).join("") +
    `<div><span style="color:var(--muted)">Kaynak</span><span><a href="https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Temel+Faaliyetler/Para+Politikasi/Para+Politikasi+Kurulu/Toplanti+Takvimi" target="_blank" rel="noopener" style="color:var(--accent)">TCMB toplantı takvimi ↗</a></span></div>`;
}
let m2GunManual = false;

$("m2_gun").addEventListener("input", () => (m2GunManual = true));
$("t_ilk").addEventListener("input", () => (tIlkManual = true));
try { const v = localStorage.getItem("tk_sig"); if (v) $("t_sig").value = v; } catch (e) {}
$("ts_copy").addEventListener("click", () => {
  if (!tkSummary) return;
  const done = () => { const b = $("ts_copy"); b.textContent = "✅ Kopyalandı"; setTimeout(() => (b.textContent = "📋 Özeti kopyala"), 1500); };
  if (navigator.clipboard) navigator.clipboard.writeText(notEkle(tkSummary)).then(done, () => prompt("Kopyala:", tkSummary));
  else prompt("Kopyala:", tkSummary);
});
$("ao_t").addEventListener("input", () => (aoTManual = true));
$("ys_r").addEventListener("input", () => (ysRManual = true));
$("ys_t").addEventListener("input", () => (ysTManual = true));
const nfx = (v) => Number(v).toLocaleString("tr-TR", { maximumFractionDigits: 2 });

function calcMev() {
  const g = Math.round(num("m_gun"));
  if (!stopajManual) $("m_stopaj").value = String(autoStopaj(g)).replace(".", ",");
  const P = num("m_tutar"), r = num("m_faiz") / 100, s = num("m_stopaj") / 100;
  const n = Number($("m_yenile").value);
  const start = $("m_bas").value ? new Date($("m_bas").value + "T12:00:00") : new Date();
  const y1 = yearFrac(start, g);
  const brut1 = P * r * y1.f;
  const net1 = brut1 * (1 - s);
  let leapInfo = "";
  let totalLeap = y1.leapDays;
  const stopajTxt = stopajManual ? "Stopaj oranını elle girdin." : `Stopaj vadeye göre otomatik seçildi (6 aya kadar %17,5 · 1 yıla kadar %15 · 1 yıldan uzun %10).`;
  const fd = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const pill = (k, L, v, i) => { const e = $("m_" + k); $("m_" + k + "L").textContent = L; e.textContent = v; if (i != null) $("m_" + k + "i").textContent = i;
    if (k !== "bal") e.style.fontSize = v.length >= 16 ? "13.5px" : v.length >= 14 ? "15px" : ""; // büyük tutarlar kutuya sığsın
    if (k === "p1") $("m_p1i").classList.toggle("uy", /tatil|arife/.test(i || "")); };
  const sTxt = `%${nfx(s * 100)}`, netY = pct(r * (1 - s) * 100);
  // Vade sonu tatile/arifeye denk geliyorsa yalnızca uyarı (hesap seçilen gün sayısıyla kalır)
  const end1 = addDays(start, g), wd = (d) => d.toLocaleDateString("tr-TR", { weekday: "long" });
  const tAd = g ? tatilAdi(end1) : null, aAd = g && !tAd ? arifeAdi(end1) : null;
  let tNot = "";
  if (tAd) {
    const nb = nextBiz(end1), g2 = g + dayDiff(end1, nb), ilk = n === 1 ? "Vade sonu" : "İlk vade sonu";
    $("m_warn").innerHTML = `📅 <b>${ilk} tatile denk geliyor:</b> ${fd(end1)} ${wd(end1)} (${tAd}). İlk iş günü <b>${fd(nb)} ${wd(nb)}</b>; vade <b>${g2} gün</b> açılabilir. Hesap ${g} güne göre yapıldı.`;
    tNot = `Not: ${ilk} ${fd(end1)} ${wd(end1)} (${tAd}) gününe denk geliyor. Vade, ilk iş günü olan ${fd(nb)} ${wd(nb)} tarihine göre ${g2} gün olarak açılabilir; yukarıdaki tutarlar ${g} gün içindir.`;
  } else if (aAd) {
    $("m_warn").innerHTML = `📅 <b>${n === 1 ? "Vade sonu" : "İlk vade sonu"} arifeye denk geliyor:</b> ${fd(end1)} ${wd(end1)} (${aAd}, yarım gün çalışılır).`;
    tNot = `Not: ${n === 1 ? "Vade sonu" : "İlk vade sonu"} ${fd(end1)} ${wd(end1)} ${aAd} (yarım gün) gününe denk geliyor.`;
  }
  $("m_warn").hidden = !(tAd || aAd);
  if (n === 1) {
    const end = addDays(start, g);
    $("m_bigLabel").textContent = "Net getiri";
    $("m_out").textContent = tl(net1);
    $("m_outi").textContent = `${g} gün · yıllık net oran ${netY}`;
    pill("bal", "Vade sonu bakiye", tl(P + net1));
    pill("p1", "Vade sonu", fd(end), wd(end) + (tAd ? " · tatil ⚠️" : aAd ? " · arife" : ""));
    pill("p2", "Brüt faiz", tl(brut1));
    pill("p3", `Stopaj (${sTxt})`, "−" + tl(brut1 * s));
    pill("p4", "Günlük net", tl(g ? net1 / g : 0));
    mevOzet = P && g && r ? ozetMetni("VADELİ MEVDUAT ÖZETİ", [
      [`Anapara: ${tl(P)}`, `Vade: ${g} gün (${fd(start)} – ${fd(end)})`, `Yıllık brüt faiz oranı: %${nfx(r * 100)}`],
      [`Brüt faiz: ${tl(brut1)}`, `Stopaj (${sTxt}): −${tl(brut1 * s)}`, `Net faiz: ${tl(net1)}`, `Vade sonu bakiye: ${tl(P + net1)}`],
      [`Günlük net getiri: ${tl(g ? net1 / g : 0)}`, `Yıllık net oran: ${netY}`],
    ], tNot) : "";
  } else {
    let bal = P, brutT = 0, stT = 0;
    const d = new Date(start);
    totalLeap = 0;
    for (let i = 0; i < n; i++) {
      const yf = yearFrac(d, g);
      totalLeap += yf.leapDays;
      const b = bal * r * yf.f;
      brutT += b; stT += b * s; bal += b * (1 - s);
      d.setDate(d.getDate() + g);
    }
    $("m_bigLabel").textContent = `${n} vade sonunda net getiri`;
    $("m_out").textContent = tl(bal - P);
    $("m_outi").textContent = `${g} gün × ${n} vade · toplam ${Math.round(g * n)} gün`;
    pill("bal", "Son bakiye", tl(bal));
    pill("p1", "Son vade", fd(d), wd(d) + (tatilAdi(d) ? " · tatil" : ""));
    pill("p2", "Toplam brüt faiz", tl(brutT));
    pill("p3", `Toplam stopaj (${sTxt})`, "−" + tl(stT));
    pill("p4", "İlk vade net faiz", tl(net1));
    mevOzet = P && g && r ? ozetMetni("VADELİ MEVDUAT ÖZETİ", [
      [`Anapara: ${tl(P)}`, `Vade: ${g} gün × ${n} dönem (toplam ${Math.round(g * n)} gün)`, `Başlangıç: ${fd(start)} · Son vade: ${fd(d)}`, `Yıllık brüt faiz oranı: %${nfx(r * 100)}`],
      [`İlk vade net faiz: ${tl(net1)}`, `Toplam brüt faiz: ${tl(brutT)}`, `Toplam stopaj (${sTxt}): −${tl(stT)}`, `Toplam net faiz: ${tl(bal - P)}`, `Son bakiye: ${tl(bal)}`],
    ], [tNot, "Her vade sonunda net faizin anaparaya eklenip aynı oranla yenilendiği varsayılmıştır."].filter(Boolean).join("\n")) : "";
  }
  calcExtra(P, r, g, start);
  // Yıl gün sayısı vadenin düştüğü yıllara göre otomatik
  { const ys = new Set(), d = new Date(start); for (let i = 0; i < Math.max(1, g * n); i++) { ys.add(d.getFullYear()); d.setDate(d.getDate() + 1); }
    const parts = [...ys].map((y) => `${isLeap(y) ? 366 : 365} (${y})`);
    $("m_esasTxt").textContent = parts.length === 1 ? parts[0] : parts.join(" · "); }
  if (totalLeap > 0) leapInfo = ` Vadenin ${totalLeap} günü artık yıla denk geliyor; bu günler ÷366 ile hesaplandı.`;
  $("m_note").textContent = stopajTxt + leapInfo;
}

// ---------- Tüketici ----------
// Tatiller (takvim.html ile aynı kaynak): sabit resmi tatiller + bayramlar (tam gün)
const TK_FIXED = ["01-01", "04-23", "05-01", "05-19", "07-15", "08-30", "10-29"];
const TK_REL = { 2026: ["03-20", "03-21", "03-22", "05-27", "05-28", "05-29", "05-30"], 2027: ["03-09", "03-10", "03-11", "05-16", "05-17", "05-18", "05-19"],
  2028: ["02-26", "02-27", "02-28", "05-05", "05-06", "05-07", "05-08"], 2029: ["02-14", "02-15", "02-16", "04-24", "04-25", "04-26", "04-27"] };
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const pDate = (v) => (v ? new Date(v + "T12:00:00") : null);
function isHoliday(d) {
  const w = d.getDay(); if (w === 0 || w === 6) return true;
  const md = ymd(d).slice(5);
  return TK_FIXED.includes(md) || (TK_REL[d.getFullYear()] || []).includes(md);
}
function nextBiz(d) { const x = new Date(d); while (isHoliday(x)) x.setDate(x.getDate() + 1); return x; }
// Vade sonu kontrolü: günün tatil adı (bayram / resmi tatil / hafta sonu), değilse null
const TK_AD = { "01-01": "Yılbaşı", "04-23": "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı", "05-01": "1 Mayıs Emek ve Dayanışma Günü", "05-19": "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı",
  "07-15": "15 Temmuz Demokrasi ve Millî Birlik Günü", "08-30": "30 Ağustos Zafer Bayramı", "10-29": "29 Ekim Cumhuriyet Bayramı" };
function tatilAdi(d) {
  const md = ymd(d).slice(5), i = (TK_REL[d.getFullYear()] || []).indexOf(md);
  if (i >= 0) return i < 3 ? "Ramazan Bayramı" : "Kurban Bayramı";
  if (TK_AD[md]) return TK_AD[md];
  const w = d.getDay(); return w === 0 || w === 6 ? "hafta sonu" : null;
}
// Arife (yarım gün çalışılır): 28 Ekim ve bayramların bir önceki günü
function arifeAdi(d) {
  if (tatilAdi(d)) return null;
  const y = addDays(d, 1), r = TK_REL[y.getFullYear()] || [], md = ymd(y).slice(5);
  if (ymd(d).slice(5) === "10-28") return "Cumhuriyet Bayramı arifesi";
  return r[0] === md ? "Ramazan Bayramı arifesi" : r[3] === md ? "Kurban Bayramı arifesi" : null;
}
function addMonthsC(d, m) { // ay sonunu aşarsa ayın son günü
  const day = d.getDate(), x = new Date(d.getFullYear(), d.getMonth() + m, 1, 12);
  x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()));
  return x;
}
const shortD = (d) => d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
let tIlkManual = false, tkSummary = "";
// BDDK (13.02.2025, 11152 sayılı karar) ihtiyaç kredisi azami vadeleri; yapılandırmalarda da geçerli
const tkMaxVade = (P) => (P <= 125000 ? 36 : P <= 250000 ? 24 : 12);
const tkVadeUyari = (P, n) => {
  const m = tkMaxVade(P);
  return n > m ? `⚠️ <b>Vade sınırı:</b> ${P <= 125000 ? "125.000 TL'ye kadar" : P <= 250000 ? "125.000 – 250.000 TL arası" : "250.000 TL üzeri"} ihtiyaç kredilerinde azami vade <b>${m} ay</b> (BDDK). Hesap bilgi amaçlı yapıldı.` : "";
};
// Plan dönemleri: per = [{d, fac, g}] — fac: ay oranı (tam ay = 1), g: gösterilen gün
// Taksit, kırık dönem dikkate alınmadan standart eşit taksit formülüyle bulunur.
// Anapara payı tam ay varsayımıyla ayrılır; kırık dönemde (fac ≠ 1) yalnızca o taksitteki faiz/KKDF/BSMV
// gün/30 ile hesaplanır, dolayısıyla o taksit tutarı farklı çıkar.
const R2 = (x) => Math.round(x * 100) / 100; // kuruşa yuvarla
function tkPlan(B, per, T, r, kkdf, bsmv, closeLast) {
  // Yöntem: faiz+vergi (brüt) önce kuruşa yuvarlanır, faiz brütten ayrılır, KKDF/BSMV faizden hesaplanır.
  // Son taksit, eşit taksite çok yakınsa tam taksite sabitlenir; kuruş farkı vergi/fona (yoksa faize) yazılır.
  const out = []; let bal = B; T = R2(T); const tx = 1 + kkdf + bsmv;
  const fOf = (x) => R2(R2(x * tx) / tx);
  for (let j = 0; j < per.length && bal > 0.005; j++) {
    const fFull = fOf(bal * r), anaN = R2(T - fFull - R2(fFull * kkdf) - R2(fFull * bsmv));
    let f = per[j].fac === 1 ? fFull : fOf(bal * r * per[j].fac), kk = R2(f * kkdf), bs = R2(f * bsmv);
    let ana = anaN;
    const last = ana >= bal - 0.005 || (closeLast && j === per.length - 1);
    if (last) ana = bal;
    let t = R2(ana + f + kk + bs);
    if (last && j > 0 && per[j].fac === 1 && Math.abs(t - T) < Math.max(1, T * 0.0005)) {
      const rem = R2(T - t);
      // Kuruş farkı faiz/vergiyi eksiye düşürecekse (ör. %0 faiz) sabitleme yapılmaz; son taksit birkaç kuruş küçük kalır
      if (kkdf > 0 && kk + rem >= 0) { kk = R2(kk + rem); t = T; } else if (bsmv > 0 && bs + rem >= 0) { bs = R2(bs + rem); t = T; } else if (f + rem >= 0) { f = R2(f + rem); t = T; }
    }
    bal = R2(Math.max(0, bal - ana));
    out.push({ d: per[j].d, g: per[j].g, t, ana, f, kk, bs, bal });
  }
  return out;
}
// Standart eşit taksit (anüite)
function solveT(B, per, r, kkdf, bsmv) {
  const i = r * (1 + kkdf + bsmv), n = per.length;
  return i === 0 ? B / n : B * i / (1 - Math.pow(1 + i, -n));
}
const planHead = "<tr><th>#</th><th>Tarih</th><th>Gün</th><th>Taksit</th><th>Anapara</th><th>Faiz</th><th>KKDF</th><th>BSMV</th><th>Kalan</th></tr>";
const fmt2 = (x) => x.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const planTot = (p) => { const S = (k) => fmt2(p.reduce((a, x) => a + x[k], 0));
  return `<tr style="font-weight:700"><td></td><td>Toplam</td><td></td><td>${S("t")}</td><td>${S("ana")}</td><td>${S("f")}</td><td>${S("kk")}</td><td>${S("bs")}</td><td></td></tr>`; };
const planRow = (x, no) => `<tr><td>${no}</td><td>${shortD(x.d)}</td><td>${x.g}</td><td>${fmt2(x.t)}</td><td>${fmt2(x.ana)}</td><td>${fmt2(x.f)}</td><td>${fmt2(x.kk)}</td><td>${fmt2(x.bs)}</td><td>${fmt2(x.bal)}</td></tr>`;

function calcTK() {
  const P = num("t_tutar"), r = num("t_faiz") / 100, n = Math.round(num("t_vade"));
  const bsmv = num("t_bsmv") / 100, kkdf = num("t_kkdf") / 100, diger = num("t_ucret");
  const oran = Math.min(num("t_tahsis"), 5);
  const tahsis = P * oran / 1000, tahsisB = tahsis * bsmv, ucret = tahsis + tahsisB + diger;
  $("t_mnote").innerHTML = num("t_tahsis") > 5
    ? '<span style="color:#ef8a5d">Tahsis ücreti binde 5\'i geçemez; hesap binde 5 ile yapıldı.</span>'
    : "Kredi tahsis ücreti yasal olarak en fazla kredi tutarının binde 5'i olabilir ve bu ücrete BSMV (%15) eklenir. Diğer masraf: varsa ekspertiz, dosya vb.";
  const i = r * (1 + bsmv + kkdf);
  const bas = pDate($("t_bas").value) || new Date();
  if (!tIlkManual || !$("t_ilk").value) $("t_ilk").value = ymd(addMonthsC(bas, 1));
  let ilk = pDate($("t_ilk").value);
  $("t_ilk").min = ymd(addDays(bas, 5)); $("t_ilk").max = ymd(addDays(bas, 45));
  const gIlk = ilk ? dayDiff(bas, ilk) : NaN, okIlk = gIlk >= 5 && gIlk <= 45;
  $("t_dnote").innerHTML = okIlk || !ilk
    ? `İlk taksit tarihi kullandırımdan en az 5, en fazla 45 gün sonra olmalı (bankaya göre değişir).${ilk ? ` Şu an: <b>${gIlk} gün</b>.` : ""}`
    : `<span style="color:#ef8a5d">⚠️ İlk taksit tarihi kullandırım tarihinden en az 5, en fazla 45 gün sonra olmalı (şu an ${gIlk} gün). Uygun tarih: ${shortD(addDays(bas, 5))} – ${shortD(addDays(bas, 45))}.</span>`;
  if (!P || !n || !ilk || !okIlk) { $("ts_warn").hidden = true; ["ts_taksit", "ts_toplam", "ts_masraf", "ts_sig", "ts_net"].forEach((x) => ($(x).textContent = "–")); $("ts_ilk").textContent = ""; tkSummary = ""; $("t_out").textContent = "–"; rows("t_rows", []); rows("t_prows", []); $("t_plan").innerHTML = ""; calcAO(); return; }
  const dues = []; for (let k = 0; k < n; k++) dues.push(addMonthsC(ilk, k));
  // İlk dönem: ilk taksit kullandırımdan tam 1 ay sonraysa 1 ay faiz; değilse gün/30 (kırık dönem)
  const g1 = dayDiff(bas, ilk), tamAy = ymd(addMonthsC(bas, 1)) === ymd(ilk);
  const per = dues.map((d, j) => j === 0 ? { d, fac: tamAy ? 1 : g1 / 30, g: g1 } : { d, fac: 1, g: 30 });
  const taksit = r === 0 ? P / n : solveT(P, per, r, kkdf, bsmv);
  const plan = tkPlan(P, per, taksit, r, kkdf, bsmv, true);
  let tF = 0, tB = 0, tK = 0, toplam = 0;
  plan.forEach((x) => { tF += x.f; tK += x.kk; tB += x.bs; toplam += x.t; });
  $("t_plan").innerHTML = planHead + plan.map((x, j) => planRow(x, j + 1)).join("") + planTot(plan);
  // Yıllık maliyet oranı: masraf dahil, gerçek günlerle iç verim oranı
  const net = P - ucret;
  const cum = []; per.reduce((a, x, j) => (cum[j] = a + x.fac), 0);
  const irr = (net) => { const pv = (m) => plan.reduce((a, x, j) => a + x.t / Math.pow(1 + m, cum[j]), 0);
    let lo = 0, hi = 1; for (let it = 0; it < 100; it++) { const m = (lo + hi) / 2; if (pv(m) > net) lo = m; else hi = m; } return (lo + hi) / 2; };
  const aylikMaliyet = irr(net), aylikSade = irr(P);
  const tatil = plan.filter((x) => isHoliday(x.d)).length;
  const tek = plan.length === 1;
  $("t_out").textContent = tl(tek ? plan[0].t : R2(taksit));
  rows("t_rows", [
    [tek ? "Taksit tarihi" : "İlk / son taksit", tek ? shortD(plan[0].d) : `${shortD(plan[0].d)} · ${shortD(plan[plan.length - 1].d)}`],
    ...(!tek && Math.abs(plan[0].t - R2(taksit)) > 0.005 ? [[`İlk taksit (${plan[0].g} gün)`, tl(plan[0].t)]] : []),
    ...(tek ? [["Vade", `${plan[0].g} gün`]] : []),
    ...(tatil ? [["Hafta sonu / tatile denk gelen taksit", `${tatil} adet (ilk iş günü tahsil edilir)`]] : []),
    ["Toplam geri ödeme", tl(toplam), "total"],
    [`Kredi tahsis ücreti (binde ${String(oran).replace(".", ",")})`, tl(tahsis)],
    [`Tahsis ücretinin BSMV'si (%${String(bsmv * 100).replace(".", ",")})`, tl(tahsisB)],
    ...(diger ? [["Diğer masraf", tl(diger)]] : []),
    ["Toplam masraf", tl(ucret)],
    ["Hesaba geçecek tutar", tl(P - ucret)],
  ]);
  { const w = tkVadeUyari(P, n); $("ts_warn").hidden = !w; $("ts_warn").innerHTML = w; }
  // Özet kutuları
  const sigOn = $("t_sigtip").value !== "yok", sigOran = num("t_sig");
  const sig = sigOn ? R2(P * sigOran / 1000 * n / 12) : 0;
  $("ts_sigbox").hidden = $("t_sigwrap").hidden = $("t_sighint").hidden = !sigOn;
  try { localStorage.setItem("tk_sig", $("t_sig").value); } catch (e) {}
  const ilkFark = !tek && Math.abs(plan[0].t - R2(taksit)) > 0.005;
  $("ts_taksit").textContent = tl(tek ? plan[0].t : R2(taksit));
  $("ts_ilk").textContent = tek ? `Tek taksit · ${shortD(plan[0].d)}` : `${n} ay` + (ilkFark ? ` · ilk taksit ${tl(plan[0].t)}` : "");
  $("ts_toplam").textContent = tl(toplam);
  $("ts_masraf").textContent = tl(ucret); $("ts_masrafi").textContent = diger ? "tahsis + BSMV + diğer masraf" : "tahsis ücreti + BSMV";
  $("ts_sig").textContent = sigOn ? tl(sig) : "Yok";
  $("ts_sigi").textContent = sigOn ? `binde ${nfx(sigOran)} × ${nfx(n / 12)} yıl` : "";
  $("ts_net").textContent = tl(P - ucret);
  $("ts_net").parentElement.classList.toggle("wide2", !sigOn);
  tkPdf = { tur: "Tüketici Kredisi", bas, P, r, n, bsmv, kkdf, tF, tV: tB, tFo: tK, top: toplam, T: tek ? plan[0].t : R2(taksit), rows: plan.map((x) => ({ d: x.d, a: x.ana, f: x.f, fo: x.kk, v: x.bs, t: x.t, b: x.bal })) };
  tkSummary = krediOzet({ tur: "Tüketici Kredisi", P, n, r, taksit: tek ? plan[0].t : R2(taksit), plan, bsmv, kkdf, tF, tB, tK, toplam, d0: plan[0].d, d1: plan[plan.length - 1].d, tek });
  rows("t_prows", [
    ["Toplam faiz", tl(tF)],
    ["Toplam KKDF", tl(tK)],
    ["Toplam BSMV", tl(tB)],
    ["Toplam vergi ve fon", tl(tK + tB)],
    ["Aylık efektif faiz (vergiler dahil)", pct(i * 100)],
    ["Yıllık maliyet oranı (ücretler hariç)", pct((Math.pow(1 + aylikSade, 12) - 1) * 100)],
    ["Yıllık maliyet oranı (ücretler dahil)", pct((Math.pow(1 + aylikMaliyet, 12) - 1) * 100)],
  ]);
  calcAO({ per, P, r, n, bsmv, kkdf, taksit, bas, dues, plan });
}

// Ara ödeme (tarihli)
let aoTManual = false, ysTManual = false, ysRManual = false;
// İşlem günündeki durum: ödenmiş taksit, kalan anapara, işlemiş faiz (gün/30, KKDF+BSMV dahil)
function tkState(c, at) {
  const { r, n, bsmv, kkdf, bas, dues, plan, P } = c;
  if (!at || dayDiff(bas, at) <= 0) return { err: "Tarih kullandırım tarihinden sonra olmalı." };
  // İşlem günü taksit gününe denk gelirse o günün taksiti henüz ödenmemiş sayılır
  const k = dues.filter((d) => dayDiff(d, at) > 0).length;
  if (k >= n) return { err: "Bu tarihte tüm taksitler ödenmiş olur." };
  const onDue = dayDiff(dues[k], at) === 0;
  const B = k ? plan[k - 1].bal : P, last = k ? dues[k - 1] : bas, g = dayDiff(last, at);
  // Taksit günündeyse dönemin faizi ödeme planındaki gibi (tam ay = 1 ay faiz), değilse gün/30
  const af = R2(onDue ? plan[k].f : B * r * g / 30), acc = R2(af + R2(af * kkdf) + R2(af * bsmv));
  return { k, B, last, g: onDue ? plan[k].g : g, acc, onDue, eski: plan.slice(k).reduce((a, x) => a + x.t, 0) };
}
// Yeni plan dönemleri: işlem tarihinden ilk taksite kırık dönem (yeni kredi gibi), sonra tam aylar
function mkPer(from, first, cnt, gun) { // gun: asıl planın taksit günü (Şubat'ta 28'e düşse bile sonraki aylarda geri döner)
  const ds = []; for (let j = 0; j < cnt; j++) { const d = addMonthsC(first, j); if (gun) d.setDate(Math.min(gun, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); ds.push(d); }
  const g1 = dayDiff(from, first), tam = ymd(addMonthsC(from, 1)) === ymd(first);
  return ds.map((d, j) => j === 0 ? { d, fac: tam ? 1 : g1 / 30, g: g1 } : { d, fac: 1, g: 30 });
}
const sumT = (a) => a.reduce((s, x) => s + x.t, 0);
function calcAO(c) {
  const clearA = (m) => { $("ao_out").textContent = "–"; rows("ao_rows", []); $("ao_plan").innerHTML = ""; $("ao_note").textContent = m || ""; };
  const clearY = (m) => { $("ys_out").textContent = "–"; rows("ys_rows", []); $("ys_plan").innerHTML = ""; $("ys_note").textContent = m || ""; };
  if (!c) { clearA(); clearY(); return; }
  const { r, n, bsmv, kkdf, taksit, dues } = c;
  const defDate = () => { const d = new Date(dues[Math.min(2, n - 1)]); d.setDate(d.getDate() + 12); return ymd(d); };
  if (!aoTManual || !$("ao_t").value) $("ao_t").value = defDate();
  if (!ysTManual || !$("ys_t").value) $("ys_t").value = defDate();
  if (!ysRManual) $("ys_r").value = $("t_faiz").value.trim() ? String(Math.round(r * 10000) / 100).replace(".", ",") : "";

  // ---- Ara ödeme
  (() => {
    const at = pDate($("ao_t").value), X = num("ao_x"), st = tkState(c, at);
    if (st.err) return clearA(st.err);
    const { k, B, last, g, acc, eski } = st;
    const kapama = R2(B + acc);
    if (!X) return clearA("Ara ödeme tutarını gir.");
    if (X >= kapama - 0.005) {
      $("ao_label").textContent = "Erken kapama tutarı"; $("ao_out").textContent = tl(kapama);
      rows("ao_rows", [["Kalan anapara", tl(B)], [`İşlemiş faiz + vergiler (${g} gün)`, tl(acc)], ["Faiz tasarrufu", tl(eski - kapama), "pos"]]);
      $("ao_plan").innerHTML = ""; $("ao_note").textContent = `Ara ödeme kalan borcu karşılıyor; kredi kapanır.${X > kapama ? " Fazlası: " + tl(X - kapama) + "." : ""}`;
      return;
    }
    if (X <= acc) return clearA(`Ara ödeme, işlemiş faizi (${tl(acc)}) karşılamalı.`);
    const f0 = st.onDue ? k + 1 : k, cnt = n - f0;
    if (cnt <= 0) return clearA(`Seçilen tarih son taksit günü; kalan borç için ${tl(kapama)} ödenmeli.`);
    const B2 = R2(B - (X - acc));
    const per = mkPer(at, dues[f0], cnt, new Date(dues[0]).getDate());
    const v = $("ao_sec").value === "v";
    const T = v ? taksit : solveT(B2, per, r, kkdf, bsmv);
    const p = tkPlan(B2, per, T, r, kkdf, bsmv, true);
    $("ao_label").textContent = v ? "Kalan vade" : "Yeni taksit";
    $("ao_out").textContent = v ? `${p.length} ay` : tl(R2(T));
    rows("ao_rows", [
      ["Ödenmiş taksit", `${k} adet`],
      ["Kalan anapara", tl(B)],
      [`İşlemiş faiz + vergiler (${g} gün)`, tl(acc)],
      ["Anaparaya giden", tl(X - acc)],
      ["Yeni anapara", tl(B2)],
      ...(v ? [["Taksit (değişmez)", tl(R2(taksit))], ["Kısalma", `${n - k - p.length} ay`]] : [["Eski taksit", tl(R2(taksit))], ["Kalan taksit", `${cnt} adet`]]),
      ...(Math.abs(p[0].t - R2(T)) > 0.005 ? [[`İlk taksit (${shortD(p[0].d)}, ${p[0].g} gün)`, tl(p[0].t)]] : []),
      ["Son taksit", `${shortD(p[p.length - 1].d)} · ${tl(p[p.length - 1].t)}`],
      ["Faiz tasarrufu", tl(eski - X - sumT(p)), "pos"],
    ]);
    $("ao_plan").innerHTML = planHead + p.map((x, j) => planRow(x, f0 + j + 1)).join("") + planTot(p);
    $("ao_note").textContent = (st.onDue ? "Ara ödeme taksit gününe denk geldi: o günün taksidi ödenmemiş sayıldı, faizi ara ödemeden kapatıldı ve yeni plan bir sonraki taksit gününden başlar. " : "") + "Ara ödeme önce işlemiş faizi (gün/30, KKDF+BSMV dahil) kapatır, kalanı anaparadan düşer. Yeni planın ilk taksiti, ara ödeme gününden taksit gününe kadar olan günlerin faiziyle hesaplanır.";
  })();

  // ---- Yapılandırma
  (() => {
    const at = pDate($("ys_t").value), st = tkState(c, at);
    if (st.err) return clearY(st.err);
    const { k, B, g, acc, eski } = st;
    const yn = Math.round(num("ys_n")), yr = num("ys_r") / 100;
    let pes = num("ys_p");
    if (!(yn > 0)) return clearY("Yeni vadeyi gir.");
    const eksik = pes < acc;
    if (eksik) pes = acc;
    const BC = R2(B - (pes - acc));
    if (BC <= 0.005) return clearY("Peşin tutar kalan borcu kapatıyor.");
    const yFirst = st.onDue ? (dues[k + 1] || addMonthsC(at, 1)) : dues[k];
    const per = mkPer(at, yFirst, yn, new Date(dues[0]).getDate());
    const T = solveT(BC, per, yr, kkdf, bsmv);
    const p = tkPlan(BC, per, T, yr, kkdf, bsmv, true);
    const fark = pes + sumT(p) - eski;
    $("ys_out").textContent = tl(R2(T));
    rows("ys_rows", [
      ["Kalan anapara", tl(B)],
      [`İşlemiş faiz + vergiler (${g} gün)`, tl(acc)],
      ["Alınan peşin tutar", tl(pes)],
      ["Yapılandırılan anapara", tl(BC), "total"],
      ["Yeni vade / faiz", `${yn} ay · %${nfx(yr * 100)}`],
      ...(Math.abs(p[0].t - R2(T)) > 0.005 ? [[`İlk taksit (${shortD(p[0].d)}, ${p[0].g} gün)`, tl(p[0].t)]] : []),
      ["Son taksit", shortD(p[p.length - 1].d)],
      ["Eski taksit", `${tl(R2(taksit))} · kalan ${n - k} ay`],
      ["Toplam geri ödeme (yeni plan)", tl(sumT(p))],
      [fark >= 0 ? "Eski plana göre ek maliyet" : "Eski plana göre tasarruf", tl(Math.abs(fark)), fark >= 0 ? "neg" : "pos"],
    ]);
    $("ys_plan").innerHTML = planHead + p.map((x, j) => planRow(x, j + 1)).join("") + planTot(p);
    const yw = tkVadeUyari(BC, yn).replace(" ihtiyaç kredilerinde", " yapılandırmalarda");
    $("ys_note").innerHTML = (yw ? `<span style="color:#ef8a5d">${yw}</span><br>` : "") + (eksik ? `Peşin tutar en az işlemiş faiz + vergiler (${tl(acc)}) kadar olmalı; hesap bu tutarla yapıldı. ` : "") + "Peşin tutar önce işlemiş faizi kapatır, kalanı anaparadan düşer. Yeni planın ilk taksiti bir sonraki taksit günüdür. Yapılandırmada alınabilecek ücretler dahil değildir.";
  })();
}


// ---------- Kredi kartı ----------
let kkManual = false;
["k_akdi", "k_gec"].forEach((x) => $(x).addEventListener("input", () => (kkManual = true)));
function kkTier(b) {
  // TCMB azami aylık oranlar (1 Ekim 2026 itibarıyla; İş Bankası Maximum'da aynı): akdi / gecikme
  if (b < 30000) return [3.25, 3.55, "30.000 TL altı"];
  if (b <= 180000) return [3.75, 4.05, "30.000 – 180.000 TL"];
  return [4.25, 4.55, "180.000 TL üstü"];
}
$("k_lim") && $("k_lim").addEventListener("click", (e) => { const b = e.target.closest("button[data-a]"); if (!b) return; $("k_asg").value = b.dataset.a; calcKK(); });
function calcKK() {
  const B = num("k_borc");
  const t = kkTier(B);
  if (!kkManual) {
    $("k_akdi").value = String(t[0]).replace(".", ",");
    $("k_gec").value = String(t[1]).replace(".", ",");
  }
  const O = Math.min(num("k_odenen"), B), asg = B * num("k_asg") / 100;
  const ra = num("k_akdi") / 100, rg = num("k_gec") / 100, g = num("k_gun"), v = num("k_vergi") / 100;
  const kalan = B - O;
  let akdiMatrah, gecMatrah;
  if (O >= asg) { gecMatrah = 0; akdiMatrah = kalan; }
  else { gecMatrah = asg - O; akdiMatrah = B - asg; }
  const fA = akdiMatrah * ra * g / 30, fG = gecMatrah * rg * g / 30;
  const vergi = (fA + fG) * v;
  const top = fA + fG + vergi;
  const TB = [[0, "30.000 TL altı", 3.25, 3.55], [30000, "30.000 – 180.000 TL", 3.75, 4.05], [180001, "180.000 TL üstü", 4.25, 4.55]];
  $("k_note").innerHTML = `<b>Oranlar neden değişiyor?</b> TCMB azami faizi <b>dönem borcunun tutarına göre</b> üç dilimde belirliyor. Dönem borcunu değiştirince dilim değişirse oranlar da kendiliğinden değişir${kkManual ? " (şu an oranları elle girdin, otomatik seçim kapalı)" : ""}:
    <table class="ltvtab" style="margin-top:6px"><tr><th>Dönem borcu</th><th>Akdi</th><th>Gecikme</th></tr>${TB.map((r) => `<tr class="${!kkManual && r[1] === t[2] ? "on" : ""}"><td>${r[1]}</td><td>%${nfx(r[2])}</td><td>%${nfx(r[3])}</td></tr>`).join("")}</table>
    <span style="display:block;margin-top:4px">📌 <b>maximum.com.tr'de yayımlanan oranlar:</b> Maximum kartlarda akdi faiz %3,25 / %3,75 / %4,25 (aylık, BSMV-KKDF hariç; <a href="https://www.maximum.com.tr/harcama-taksitlendirme" target="_blank" rel="noopener" style="color:var(--accent)">maximum.com.tr ↗</a>). Oranlar TCMB\'nin 1 Ekim 2026 tablosuyla aynı; kesin oran hesap özetinde yazar.</span>`;
  $("k_out").textContent = tl(top);
  $("k_lim").querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.a === num("k_asg")));
  $("k_oto").innerHTML = `<span>✓</span><span>Oranlar otomatik: <b>akdi %${nfx(ra * 100)}</b> · <b>gecikme %${nfx(rg * 100)}</b> · asgari %${nfx(num("k_asg"))} · ${g} gün · BSMV+KKDF %${nfx(v * 100)}${kkManual ? " (elle girildi)" : ` <span style="opacity:.75">(dönem borcu ${t[2]} dilimi, maximum.com.tr'de yayımlanan oran)</span>`}. Sadece borcu, ödenen tutarı ve limiti girmen yeter.</span>`;
  rows("k_rows", [
    ["Asgari ödeme", tl(asg)],
    [O >= asg ? "Asgari ödendi ✓" : "Ödenmeyen asgari", O >= asg ? "" : tl(asg - O), O >= asg ? "pos" : "neg"],
    ["Gecikme faizi", tl(fG)],
    ["Akdi faiz", tl(fA)],
    ["BSMV + KKDF", tl(vergi)],
    ["Sonraki ekstreye devreden", tl(kalan + top), "total"],
  ]);
  kkOzet = B ? ozetMetni("BİREYSEL KREDİ KARTI GECİKME ÖZETİ", [[`Dönem borcu: ${tl(B)}`, `Ödenen tutar: ${tl(O)}`, `Asgari ödeme (%${nfx(num("k_asg"))}): ${tl(asg)}`], [`Aylık akdi faiz: %${nfx(ra * 100)}`, `Aylık gecikme faizi: %${nfx(rg * 100)}`, `Faiz işleyen gün: ${g}`], [`Gecikme faizi: ${tl(fG)}`, `Akdi faiz: ${tl(fA)}`, `BSMV + KKDF: ${tl(vergi)}`, `Toplam faiz + vergi: ${tl(top)}`, `Sonraki ekstreye devreden: ${tl(kalan + top)}`]], "Yaklaşık hesaptır; kesin tutar bir sonraki hesap özetinde yer alır.") : "";
}
let kkOzet = "";

// ---------- Konut ----------
// BDDK 29.01.2026 tarihli 11364 sayılı karar: ekspertiz değerine ve enerji sınıfına göre azami kredi/değer oranı
const LTV_BANDS = [
  { max: 5e6, ad: "5 milyon TL'ye kadar", AB: 90, C: 80, D: 70 },
  { max: 7e6, ad: "5 – 7 milyon TL", AB: 80, C: 70, D: 60 },
  { max: 10e6, ad: "7 – 10 milyon TL", AB: 70, C: 60, D: 50 },
  { max: 20e6, ad: "10 – 20 milyon TL", AB: 50, C: 40, D: 30 },
  { max: Infinity, ad: "20 milyon TL üzeri", AB: 40, C: 30, D: 20 },
];
function ltvBand(v) { return LTV_BANDS.findIndex((b) => v <= b.max); }
let eksOn = false;
function renderLtv() {
  const v = num("k2_deger"), cls = $("k2_enerji").value, P = num("k2_tutar");
  if (!eksOn || !v) { $("k2_ltv").className = "ltvbox"; $("k2_ltv").innerHTML = eksOn ? "Ekspertiz değerini girince azami kredi oranı burada görünür." : ""; return null; }
  const bi = ltvBand(v), band = LTV_BANDS[bi], rate = band[cls];
  const maxKredi = v * rate / 100;
  const over = P > maxKredi + 0.5;
  const clsAd = { AB: "A/B", C: "C", D: "D ve altı" }[cls];
  let rowsH = LTV_BANDS.map((b, i) => `<tr class="${i === bi ? "on" : ""}"><td>${b.ad}</td><td>%${b.AB}</td><td>%${b.C}</td><td>%${b.D}</td></tr>`).join("");
  $("k2_ltv").className = "ltvbox" + (over ? " warn" : "");
  $("k2_ltv").innerHTML = `Bu konut için azami kredi oranı <b>%${rate}</b> (${band.ad}, enerji sınıfı ${clsAd}).<br>
    Çekilebilecek en yüksek kredi: <b>${tl(maxKredi)}</b>
    ${over ? `<br><span style="color:#ef6a4c">Girdiğin tutar bu sınırı aşıyor.</span>` : ""}
    <button type="button" id="k2_max">En yüksek tutarı kullan</button>
    <table class="ltvtab"><tr><th>Ekspertiz değeri</th><th>A/B</th><th>C</th><th>D ve altı</th></tr>${rowsH}</table>`;
  $("k2_max").onclick = () => { $("k2_tutar").value = Math.floor(maxKredi).toLocaleString("tr-TR"); calcKonut(); };
  return { over, maxKredi, rate };
}
// Kredi tarih yardımcıları (tüketici kredisiyle aynı mantık)
function mkPerStep(bas, first, cnt, step, base) {
  const ds = []; for (let j = 0; j < cnt; j++) ds.push(addMonthsC(first, j * step));
  const g1 = dayDiff(bas, first), tam = ymd(addMonthsC(bas, step)) === ymd(first);
  return ds.map((d, j) => j === 0 ? { d, fac: tam ? 1 : g1 / base, g: g1 } : { d, fac: 1, g: step === 1 ? 30 : 360 });
}
const dManual = {};
function dateSetup(pre, step, cnt, minG, maxG) {
  const bas = pDate($(pre + "_bas").value) || new Date();
  if (!$(pre + "_bas").value) $(pre + "_bas").value = ymd(bas);
  if (!dManual[pre] || !$(pre + "_ilk").value) $(pre + "_ilk").value = ymd(addMonthsC(bas, step));
  const ilk = pDate($(pre + "_ilk").value);
  const g = ilk ? dayDiff(bas, ilk) : NaN, ok = ilk && g >= minG && g <= maxG;
  if (minG === 5) { $(pre + "_ilk").min = ymd(addDays(bas, 5)); $(pre + "_ilk").max = ymd(addDays(bas, 45)); } else { $(pre + "_ilk").min = ymd(addDays(bas, 1)); $(pre + "_ilk").removeAttribute("max"); }
  $(pre + "_dnote").innerHTML = ok
    ? (minG === 5 ? `İlk taksit kullandırımdan en az 5, en fazla 45 gün sonra olmalı. Şu an: <b>${g} gün</b>.` : `Kullandırımdan ödemeye <b>${g} gün</b>.`)
    : `<span style="color:#ef8a5d">⚠️ ${minG === 5 ? `İlk taksit tarihi kullandırımdan en az 5, en fazla 45 gün sonra olmalı (şu an ${isFinite(g) ? g : "–"} gün). Uygun tarih: ${shortD(addDays(bas, 5))} – ${shortD(addDays(bas, 45))}.` : "Ödeme tarihi kullandırımdan sonra olmalı."}</span>`;
  return { bas, ilk, ok, g };
}
["k2", "tr"].forEach((p) => $(p + "_ilk").addEventListener("input", () => (dManual[p] = true)));
let k2Summary = "";
function calcKonut() {
  const L = renderLtv();
  const deger = num("k2_deger"), P = num("k2_tutar"), r = num("k2_faiz") / 100, n = Math.round(num("k2_vade"));
  const tahsis = P * num("k2_tahsis") / 100, masraf = num("k2_masraf");
  const D = dateSetup("k2", 1, n, 5, 45);
  const ltvRows = (eksOn && deger) ? [["Peşinat", tl(Math.max(0, deger - P))], ["Kredi / ekspertiz değeri", pct((P / deger) * 100)]] : [];
  rows("k2e_rows", ltvRows);
  $("k2s_warn").hidden = !(L && L.over);
  if (L && L.over) $("k2s_warn").innerHTML = `⚠️ Kredi tutarı ekspertize göre sınırı aşıyor. En yüksek: <b>${tl(L.maxKredi)}</b> (%${L.rate}).`;
  if (!P || !n || !D.ok) { ["k2s_taksit", "k2s_toplam", "k2s_faiz", "k2s_masraf", "k2s_net"].forEach((x) => ($(x).textContent = "–")); $("k2s_ilk").textContent = ""; k2Summary = ""; $("k2_out").textContent = "–"; rows("k2_rows", []); $("k2_plan").innerHTML = ""; $("k2_mplan").innerHTML = ""; return; }
  const per = mkPerStep(D.bas, D.ilk, n, 1, 30);
  const taksit = r === 0 ? P / n : solveT(P, per, r, 0, 0);
  const plan = tkPlan(P, per, taksit, r, 0, 0, true);
  const toplam = plan.reduce((a, x) => a + x.t, 0), tF = plan.reduce((a, x) => a + x.f, 0);
  // Yıllık plan (planın satırlarından)
  const fmt = (x) => x.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
  let html = "<tr><th>Yıl</th><th>Ödenen</th><th>Anapara</th><th>Faiz</th><th>Kalan</th></tr>";
  for (let y = 0; y < Math.ceil(plan.length / 12); y++) {
    const ch = plan.slice(y * 12, (y + 1) * 12);
    html += `<tr><td>${y + 1}</td><td>${fmt(ch.reduce((a, x) => a + x.t, 0))}</td><td>${fmt(ch.reduce((a, x) => a + x.ana, 0))}</td><td>${fmt(ch.reduce((a, x) => a + x.f, 0))}</td><td>${fmt(ch[ch.length - 1].bal)}</td></tr>`;
  }
  $("k2_plan").innerHTML = html;
  $("k2_mplan").innerHTML = "<tr><th>#</th><th>Tarih</th><th>Gün</th><th>Taksit</th><th>Anapara</th><th>Faiz</th><th>Kalan</th></tr>" +
    plan.map((x, j) => `<tr><td>${j + 1}</td><td>${shortD(x.d)}</td><td>${x.g}</td><td>${fmt2(x.t)}</td><td>${fmt2(x.ana)}</td><td>${fmt2(x.f)}</td><td>${fmt2(x.bal)}</td></tr>`).join("") + `<tr style="font-weight:700"><td></td><td>Toplam</td><td></td><td>${fmt2(toplam)}</td><td>${fmt2(P)}</td><td>${fmt2(tF)}</td><td></td></tr>`;
  // Masraf dahil yıllık maliyet oranı (gerçek dönemlerle)
  const cum = []; per.reduce((a, x, j) => (cum[j] = a + x.fac), 0);
  const net = P - tahsis - masraf;
  const pv = (m) => plan.reduce((a, x, j) => a + x.t / Math.pow(1 + m, cum[j]), 0);
  let lo = 0, hi = 1; for (let it = 0; it < 100; it++) { const m = (lo + hi) / 2; if (pv(m) > net) lo = m; else hi = m; }
  const ilkF = Math.abs(plan[0].t - R2(taksit)) > 0.005;
  $("k2_out").textContent = tl(R2(taksit));
  rows("k2_rows", [
    ["İlk / son taksit", `${shortD(plan[0].d)} · ${shortD(plan[plan.length - 1].d)}`],
    ...(ilkF ? [[`İlk taksit (${plan[0].g} gün)`, tl(plan[0].t)]] : []),
    ["Toplam faiz", tl(tF)],
    ["Toplam geri ödeme (ödeme planı)", tl(toplam), "total"],
    ["Tahsis ücreti", tl(tahsis)],
    ...(masraf ? [["Diğer masraf", tl(masraf)]] : []),
    ["Hesaba geçecek tutar", tl(P - tahsis - masraf)],
    ["Yıllık maliyet oranı (masraf dahil)", pct((Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100)],
  ]);
  $("k2s_taksit").textContent = tl(R2(taksit));
  $("k2s_ilk").textContent = `${n} ay · ${n % 12 ? nfx(n / 12) : n / 12} yıl` + (ilkF ? ` · ilk taksit ${tl(plan[0].t)}` : "");
  $("k2s_toplam").textContent = tl(toplam);
  $("k2s_faiz").textContent = tl(tF);
  $("k2s_masraf").textContent = tl(tahsis + masraf);
  $("k2s_masrafi").textContent = masraf ? "tahsis + diğer masraf" : "tahsis ücreti";
  $("k2s_net").textContent = tl(P - tahsis - masraf);
  k2Pdf = { tur: "Konut Kredisi", bas: D.bas, P, r, n, bsmv: 0, kkdf: 0, tF, tV: 0, tFo: 0, top: toplam, T: R2(taksit), rows: plan.map((x) => ({ d: x.d, a: x.ana, f: x.f, fo: 0, v: 0, t: x.t, b: x.bal })) };
  k2Summary = krediOzet({ tur: "Konut Kredisi", P, n, r, taksit: R2(taksit), plan, bsmv: 0, kkdf: 0, tF, tB: 0, tK: 0, toplam, d0: plan[0].d, d1: plan[plan.length - 1].d });
  $("k2_note").textContent = "Oranlar BDDK'nın 29.01.2026 tarihli 11364 sayılı kararına göredir; birinci el–ikinci el ayrımı yoktur. Tahsis ücreti üst sınırı kredi tutarının binde 5'idir. Her taksit dönemi 1 ay faiz işler; ilk taksit tam bir ay sonra değilse ilk taksidin faizi gün/30 ile hesaplanır. Uygulamayı bankanla teyit et.";
}

// ---------- Hesap çekirdekleri (DOM'suz): vade karşılaştırma ve ters hesap da bunları kullanır ----------
function tkCore(P, r, n, bsmv, kkdf, bas, ilk) {
  const dues = []; for (let k = 0; k < n; k++) dues.push(addMonthsC(ilk, k));
  const g1 = dayDiff(bas, ilk), tamAy = ymd(addMonthsC(bas, 1)) === ymd(ilk);
  const per = dues.map((d, j) => j === 0 ? { d, fac: tamAy ? 1 : g1 / 30, g: g1 } : { d, fac: 1, g: 30 });
  const taksit = r === 0 ? P / n : solveT(P, per, r, kkdf, bsmv);
  const plan = tkPlan(P, per, taksit, r, kkdf, bsmv, true);
  return { T: n === 1 ? plan[0].t : R2(taksit), plan };
}
function k2Core(P, r, n, bas, ilk) {
  const per = mkPerStep(bas, ilk, n, 1, 30);
  const taksit = r === 0 ? P / n : solveT(P, per, r, 0, 0);
  return { T: R2(taksit), plan: tkPlan(P, per, taksit, r, 0, 0, true) };
}
function tcCore(P, r, n, bsmv, kkdf, bas, ilk) {
  const dues = []; for (let k = 0; k < n; k++) dues.push(nextBiz(addMonthsC(ilk, k)));
  const g = []; let prev = bas; for (const d of dues) { g.push(dayDiff(prev, d)); prev = d; }
  let lo = 0, hi = P * 2 + 1; for (let it = 0; it < 80; it++) { const m = (lo + hi) / 2; const pl = tcPlan(P, r, g, m, bsmv, kkdf); if (pl[n - 1].t > m) lo = m; else hi = m; }
  // son taksit diğerlerine en yakın olacak kuruşluk tutar
  let T = 0, plan = null, best = Infinity;
  for (const c of [-2, -1, 0, 1, 2].map((x) => Math.round(hi * 100 + x) / 100)) { const pl = tcPlan(P, r, g, c, bsmv, kkdf), d = Math.abs(pl[n - 1].t - c); if (d < best - 1e-9) { best = d; T = c; plan = pl; } }
  return { T, plan, dues, g };
}

// ---------- Taşıt kredisi ----------
// BDDK (Bankaların Kredi İşlemlerine İlişkin Yönetmelik 12/A) ve isbank.com.tr/aninda-tasit-kredisi: araç değerine göre azami vade ve kredilendirme oranı.
// Sıfırda anahtar teslim fatura değeri, ikinci elde kasko değeri esas alınır; ikinci elde tavan noter satış bedelini aşamaz.
const TA_DILIM = [[400000, 48, 0.70], [800000, 36, 0.50], [1200000, 24, 0.30], [2000000, 12, 0.20]];
// Türkiye'de üretilen elektrikli araçlar (Togg) hesaba girmez; sınırları yalnızca bilgi kutusunda gösterilir (BDDK Kurul Kararı 06.03.2025, sayı 11158)
const TA_DILIM_E = [[2500000, 48, 0.70], [5000000, 36, 0.50], [6500000, 24, 0.30], [7500000, 12, 0.20]];
const taDilim = (v) => TA_DILIM.find((d) => v <= d[0]) || null;
const taN = (n) => n.toLocaleString("tr-TR");
const taDilimAd = (i) => (i === 0 ? `${taN(TA_DILIM[0][0])} TL'ye kadar` : `${taN(TA_DILIM[i - 1][0] + 1)} – ${taN(TA_DILIM[i][0])} TL`);
let taIkinci = false, taTutarManual = false, taVadeManual = false, taIlkManual = false, taSummary = "", taPdf = null, taLastMax = null;
const taDeger = () => num("ta_deger");
function taTavan() {
  const v = taDeger(), d = taDilim(v); if (!v || !d) return null;
  let max = Math.floor(v * d[2]); let kisit = "";
  const noter = taIkinci ? num("ta_noter") : 0;
  if (taIkinci && noter > 0 && noter < max) { max = Math.floor(noter); kisit = "noter"; }
  return { d, max, kisit, noter };
}
function taDilimBox() {
  const v = taDeger(), t = taTavan(), box = $("ta_dilim");
  box.classList.remove("kotu");
  if (!v) { box.innerHTML = "Araç değerini gir."; return; }
  const ust = TA_DILIM[TA_DILIM.length - 1][0];
  if (!t) { box.classList.add("kotu"); box.innerHTML = `<b>${tl(v)}</b> değerindeki araç için taşıt kredisi kullandırılmaz (üst sınır ${taN(ust)} TL). Türkiye'de üretilen elektrikli araçta sınır 7,5 milyon TL; aşağıdaki ⚡ kutusuna bak.`; $("ta_tab").innerHTML = ""; return; }
  const i = TA_DILIM.indexOf(t.d);
  const pes = Math.max(0, (taIkinci && t.noter > 0 ? t.noter : v) - t.max);
  box.innerHTML = `<b>${taDilimAd(i)}</b> dilimindesin → en fazla <b>${t.d[1]} ay</b>, ${taIkinci ? "kasko değerinin" : "aracın"} <b>%${Math.round(t.d[2] * 100)}</b>'${({ 0.2: "si", 0.3: "u", 0.5: "si", 0.7: "i" })[t.d[2]]} kadar kredi` +
    `<span class="big2">${tl(t.max)}</span>` +
    (t.kisit === "noter" ? `⚠️ Noter satış bedeli (${tl(t.noter)}) kasko tavanından (${tl(Math.floor(v * t.d[2]))}) düşük; kredi en fazla satış bedeli kadar.<br>` : "") +
    `En az peşinat: <b>${tl(pes)}</b>`;
  $("ta_tab").innerHTML = "<tr><th>Araç değeri</th><th>Azami vade</th><th>Kredi payı</th></tr>" +
    TA_DILIM.map((d, j) => `<tr class="${j === i ? "on" : ""}"><td>${taDilimAd(j)}</td><td>${d[1]} ay</td><td>%${Math.round(d[2] * 100)}</td></tr>`).join("") +
    `<tr class="lim"><td>${taN(ust)} TL üzeri</td><td colspan="2">kredi kullandırılmaz</td></tr>`;
  $("ta_tabnot").innerHTML = `Kaynak: BDDK, Bankaların Kredi İşlemlerine İlişkin Yönetmelik (12/A) · <a href="https://www.isbank.com.tr/aninda-tasit-kredisi" target="_blank" rel="noopener" style="color:var(--accent)">isbank.com.tr/aninda-tasit-kredisi</a>. Sıfırda fatura, ikinci elde kasko değeri esas alınır.`;
}
const taMaxVade = () => { const t = taTavan(); return t ? t.d[1] : 0; };
function taCore(P, r, n, bas, ilk) { return tkCore(P, r, n, 0.15, 0.15, bas, ilk); }
function calcTasit() {
  taDilimBox();
  const t = taTavan();
  if (t && (!taTutarManual || !num("ta_tutar") || (taLastMax != null && num("ta_tutar") === taLastMax))) { $("ta_tutar").value = t.max.toLocaleString("tr-TR"); taTutarManual = false; }
  taLastMax = t ? t.max : null;
  const maxV = taMaxVade();
  $("ta_vadelab").textContent = maxV ? `(en çok ${maxV})` : "";
  if (maxV && (!taVadeManual || !num("ta_vade") || num("ta_vade") > maxV)) $("ta_vade").value = maxV;
  const P = num("ta_tutar"), r = num("ta_faiz") / 100, n = Math.max(1, Math.round(num("ta_vade"))), bsmv = 0.15, kkdf = 0.15;
  const bas = pDate($("ta_bas").value) || new Date();
  if (!$("ta_bas").value) $("ta_bas").value = ymd(bas);
  if (!taIlkManual || !$("ta_ilk").value) $("ta_ilk").value = ymd(addMonthsC(bas, 1));
  const ilk = pDate($("ta_ilk").value);
  $("ta_ilk").min = ymd(addDays(bas, 5)); $("ta_ilk").max = ymd(addDays(bas, 90));
  const gIlk = ilk ? dayDiff(bas, ilk) : NaN, okIlk = gIlk >= 5 && gIlk <= 90;
  $("ta_dnote").innerHTML = okIlk || !ilk
    ? `İlk taksit tarihi kullandırımdan en az 5, en fazla 90 gün sonra olmalı (bankaya göre değişir).${ilk ? ` Şu an: <b>${gIlk} gün</b>.` : ""}`
    : `<span style="color:#ef8a5d">⚠️ İlk taksit tarihi kullandırımdan en az 5, en fazla 90 gün sonra olmalı (şu an ${gIlk} gün). Uygun tarih: ${shortD(addDays(bas, 5))} – ${shortD(addDays(bas, 90))}.</span>`;
  // Uyarılar
  let w = "";
  if (!t) w = "⚠️ Araç değeri sınırların dışında; hesap bilgi amaçlı yapıldı.";
  else if (P > t.max) w = `⚠️ <b>Kredi tavanı:</b> bu araç için en fazla <b>${tl(t.max)}</b> kredi kullandırılabilir${t.kisit === "noter" ? " (noter satış bedeli sınırı)" : ""}. Hesap bilgi amaçlı yapıldı.`;
  else if (n > t.d[1]) w = `⚠️ <b>Vade sınırı:</b> bu dilimde azami vade <b>${t.d[1]} ay</b>. Hesap bilgi amaçlı yapıldı.`;
  $("ta_warn").hidden = !w; $("ta_warn").innerHTML = w;
  const clear = () => { ["ta_s_taksit", "ta_s_toplam", "ta_s_faiz", "ta_s_masraf", "ta_s_net"].forEach((x) => ($(x).textContent = "–")); $("ta_s_ilk").textContent = ""; $("ta_out").textContent = "–"; rows("ta_rows", []); rows("ta_prows", []); $("ta_plan").innerHTML = ""; taSummary = ""; taPdf = null; };
  if (!P || !ilk || !okIlk || !(r >= 0)) return clear();
  const o = taCore(P, r, n, bas, ilk), plan = o.plan, taksit = o.T;
  let tF = 0, tB = 0, tK = 0, toplam = 0; plan.forEach((x) => { tF += x.f; tK += x.kk; tB += x.bs; toplam += x.t; });
  const tahsis = R2(P * 0.005), tahsisB = R2(tahsis * bsmv), ucret = R2(tahsis + tahsisB);
  const tek = plan.length === 1, ilkFark = !tek && Math.abs(plan[0].t - taksit) > 0.005;
  const tatil = plan.filter((x) => isHoliday(x.d)).length;
  $("ta_s_taksit").textContent = tl(taksit);
  $("ta_s_ilk").textContent = tek ? `Tek taksit · ${shortD(plan[0].d)}` : `${n} ay` + (ilkFark ? ` · ilk taksit ${tl(plan[0].t)} (${plan[0].g} gün)` : "");
  $("ta_s_toplam").textContent = tl(toplam);
  $("ta_s_faiz").textContent = tl(tF + tK + tB);
  $("ta_s_masraf").textContent = tl(ucret);
  $("ta_s_net").textContent = tl(P - ucret);
  $("ta_out").textContent = tl(taksit);
  rows("ta_rows", [
    [tek ? "Taksit tarihi" : "İlk / son taksit", tek ? shortD(plan[0].d) : `${shortD(plan[0].d)} · ${shortD(plan[plan.length - 1].d)}`],
    ...(ilkFark ? [[`İlk taksit (${plan[0].g} gün)`, tl(plan[0].t)]] : []),
    ...(tatil ? [["Tatile denk gelen taksit", `${tatil} adet<small>ilk iş günü tahsil edilir</small>`]] : []),
    ["Toplam geri ödeme", tl(toplam), "total"],
    ["Tahsis ücreti", `${tl(tahsis)}<small>binde 5</small>`],
    ["Tahsis BSMV'si", `${tl(tahsisB)}<small>%15</small>`],
    ["Hesaba geçecek", tl(P - ucret), "total"],
  ]);
  const i = r * (1 + bsmv + kkdf);
  rows("ta_prows", [["Toplam faiz", tl(tF)], ["Toplam KKDF", tl(tK)], ["Toplam BSMV", tl(tB)], ["Toplam vergi ve fon", tl(tK + tB)], ["Aylık efektif faiz (vergiler dahil)", pct(i * 100)]]);
  $("ta_plan").innerHTML = planHead + plan.map((x, j) => planRow(x, j + 1)).join("") + planTot(plan);
  taPdf = { tur: "Taşıt Kredisi", bas, P, r, n, bsmv, kkdf, tF, tV: tB, tFo: tK, top: toplam, T: taksit, rows: plan.map((x) => ({ d: x.d, a: x.ana, f: x.f, fo: x.kk, v: x.bs, t: x.t, b: x.bal })) };
  taSummary = krediOzet({ tur: `Taşıt Kredisi (${taIkinci ? "ikinci el" : "sıfır km"})`, P, n, r, taksit, plan, bsmv, kkdf, tF, tB, tK, toplam, d0: plan[0].d, d1: plan[plan.length - 1].d, tek }) +
    `\n\nAraç ${taIkinci ? "kasko" : "fatura"} değeri: ${tl(taDeger())}${t ? ` · Kredi tavanı: ${tl(t.max)} · Azami vade: ${t.d[1]} ay` : ""}`;
}
$("ta_sifir").addEventListener("click", () => { taIkinci = false; $("ta_sifir").classList.add("on"); $("ta_ikinci").classList.remove("on"); $("ta_ikinciwrap").hidden = true; $("ta_degerlab").textContent = "Anahtar teslim fatura değeri"; $("ta_degerhint").hidden = false; calcTasit(); });
$("ta_ikinci").addEventListener("click", () => { taIkinci = true; $("ta_ikinci").classList.add("on"); $("ta_sifir").classList.remove("on"); $("ta_ikinciwrap").hidden = false; $("ta_degerlab").textContent = "Kasko değeri (TSB listesi)"; $("ta_degerhint").hidden = true; calcTasit(); });
$("ta_tutar").addEventListener("input", () => (taTutarManual = true));
$("ta_vade").addEventListener("input", () => (taVadeManual = true));
$("ta_ilk").addEventListener("input", () => (taIlkManual = true));
ozetBagla("ta", () => taSummary);
$("ta_pdf").addEventListener("click", (e) => taSummary && planPdf(taPdf, e.currentTarget));


// ---------- Yönetmelik izleme ----------
// Resmi Gazete özetleri (gazete/*.json, son 45 gün) taranır; kredi yönetmeliğine ya da ilgili ürüne değinen bir madde varsa
// ilgili hesabın başında "dikkat" uyarısı çıkar. Baremler elle güncellenir; uyarı yalnızca "kontrol et" der.
const YON_IZLE = {
  ta_yon: ["taşıt kredi", "araç kredi", "kredi işlemlerine ilişkin yönetmelik", "kredilendirme oran", "bankaların kredi işlemleri", "elektrik motorlu taşıt", "elektrikli araç kredi"],
};
(async function () {
  let idx = []; try { idx = await Ortak.json("gazete/index.json"); } catch (e) { return; }
  const son = new Date(); son.setDate(son.getDate() - 45);
  const gunler = (idx || []).filter((d) => new Date(d + "T12:00:00") >= son).sort().reverse().slice(0, 45);
  const norm = (t) => String(t || "").toLocaleLowerCase("tr-TR");
  const bul = {};
  await Promise.all(gunler.map(async (d) => {
    let g; try { g = await Ortak.json(`gazete/${d}.json`); } catch (e) { return; }
    const parca = [];
    (g.bankacilik || []).forEach((x) => parca.push(typeof x === "string" ? x : [x.baslik, x.aciklama, x.ozet].join(" ")));
    (g.bolumler || []).forEach((b) => (b.maddeler || []).forEach((m) => parca.push([m.baslik, m.aciklama].join(" "))));
    parca.push(g.ozet);
    const metin = norm(parca.join(" · "));
    for (const [id, kl] of Object.entries(YON_IZLE)) {
      const k = kl.find((x) => metin.includes(x));
      if (k && !(bul[id] && bul[id].d > d)) bul[id] = { d, k };
    }
  }));
  for (const [id, o] of Object.entries(bul)) {
    const el = $(id); if (!el) continue;
    const dd = new Date(o.d + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    el.hidden = false;
    el.innerHTML = `⚠️ <b>Dikkat:</b> ${dd} tarihli Resmi Gazete'de taşıt kredilerini ilgilendirebilecek bir düzenleme var. Aşağıdaki baremler bu değişikliğe göre kontrol edilmemiş olabilir; <a href="gazete.html#${o.d}" style="color:inherit;font-weight:700">özeti aç</a> ve isbank.com.tr ile karşılaştır.`;
  }
})();

// Vade karşılaştırma tablosu + ters hesap (üç kredide ortak)
const VK = {
  t: { vadeler: [6, 12, 18, 24, 36, 48], lim: (P, n) => (n > tkMaxVade(P) ? `BDDK: bu tutarda en fazla ${tkMaxVade(P)} ay` : ""),
    ctx: () => { const bas = pDate($("t_bas").value), ilk = pDate($("t_ilk").value); const g = bas && ilk ? dayDiff(bas, ilk) : NaN; return g >= 5 && g <= 45 ? { r: num("t_faiz") / 100, bsmv: num("t_bsmv") / 100, kkdf: num("t_kkdf") / 100, bas, ilk } : null; },
    run: (c, P, n) => tkCore(P, c.r, n, c.bsmv, c.kkdf, c.bas, c.ilk) },
  k2: { vadeler: [60, 96, 120, 180, 240], lim: () => "",
    ctx: () => { const bas = pDate($("k2_bas").value), ilk = pDate($("k2_ilk").value); const g = bas && ilk ? dayDiff(bas, ilk) : NaN; return g >= 5 && g <= 45 ? { r: num("k2_faiz") / 100, bas, ilk } : null; },
    run: (c, P, n) => k2Core(P, c.r, n, c.bas, c.ilk) },
  tc: { vadeler: [12, 18, 24, 36, 48, 60], lim: () => "",
    ctx: () => { const bas = pDate($("tc_bas").value), ilk = pDate($("tc_ilk").value); if (!bas || !ilk || ilk <= bas) return null; return dayDiff(bas, nextBiz(ilk)) <= 45 ? { r: num("tc_faiz") / 100, bsmv: num("tc_bsmv") / 100, kkdf: num("tc_kkdf") / 100, bas, ilk } : null; },
    run: (c, P, n) => tcCore(P, c.r, n, c.bsmv, c.kkdf, c.bas, c.ilk) },
};
function vkRender(pre) {
  const V = VK[pre], c = V.ctx(), P = num(pre + "_tutar"), n0 = Math.round(num(pre + "_vade"));
  const tab = $(pre + "_vk"), box = $(pre + "_ters");
  if (!c || !P) { tab.innerHTML = ""; box.hidden = true; return; }
  const vs = [...new Set([...V.vadeler, n0].filter((x) => x > 0))].sort((a, b) => a - b);
  tab.innerHTML = "<tr><th>Vade</th><th>Aylık taksit</th><th>Toplam geri ödeme</th><th>Toplam faiz</th></tr>" + vs.map((n) => {
    const o = V.run(c, P, n), top = o.plan.reduce((a, x) => a + x.t, 0), fz = o.plan.reduce((a, x) => a + x.f, 0), w = V.lim(P, n);
    return `<tr class="vkr${n === n0 ? " on" : ""}${w ? " lim" : ""}" data-n="${n}"><td>${n} ay${w ? `<small>${w}</small>` : ""}</td><td>${fmt2(o.T)}</td><td>${fmt2(top)}</td><td>${fmt2(fz)}</td></tr>`;
  }).join("");
  // Ters hesap: bu taksitle (seçili vadede) çekilebilecek en yüksek kredi
  const B = num(pre + "_butce");
  if (!B || !n0) { box.hidden = true; return; }
  let lo = 0, hi = B * n0 * 2; for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; if (V.run(c, m, n0).T <= B) lo = m; else hi = m; }
  const maxP = Math.floor(lo / 100) * 100, o = maxP > 0 ? V.run(c, maxP, n0) : null, w = maxP > 0 ? V.lim(maxP, n0) : "";
  box.hidden = false;
  box.innerHTML = o ? `Aylık <b style="font-size:14px">${tl(B)}</b> taksitle, <b style="font-size:14px">${n0} ay</b> vadede çekilebilecek en yüksek kredi:<br><b>${tl(maxP)}</b> <span style="color:var(--muted)">(taksit ${tl(o.T)})</span>${w ? `<br><span style="color:#ef8a5d">⚠️ ${w}</span>` : ""}<button type="button" data-p="${maxP}">Bu tutarı kredi tutarına yaz</button>` : "Bu taksitle kredi çıkmıyor; tutarı ya da vadeyi artır.";
}
function vkCalc(pre) { ({ t: calcTK, k2: calcKonut, tc: calcTic })[pre](); vkRender(pre); }
["t", "k2", "tc"].forEach((pre) => {
  $(pre + "_vk").addEventListener("click", (e) => { const r = e.target.closest("tr[data-n]"); if (!r) return; $(pre + "_vade").value = r.dataset.n; vkCalc(pre); });
  $(pre + "_ters").addEventListener("click", (e) => { const b = e.target.closest("button[data-p]"); if (!b) return; $(pre + "_tutar").value = (+b.dataset.p).toLocaleString("tr-TR"); vkCalc(pre); $(pre + "_tutar").scrollIntoView({ behavior: "smooth", block: "center" }); });
  $(pre + "_butce").addEventListener("input", () => vkRender(pre));
});
// Banka dışına giden her özetin sonunda aynı uyarı olsun (tek yerden)
const NOT_OZET = "ℹ️ Tahmini hesaplamadır, resmî belge değildir. Kesin tutar işlem günü banka tarafından belirlenir.";
function notEkle(t) { return !t || String(t).includes(NOT_OZET) ? t : String(t).trimEnd() + "\n\n" + NOT_OZET; }
// Hesap özeti: tek tip metin + kopyala düğmesi (kişisel not)
function ozetMetni(baslik, bolumler, not) {
  const L = "──────────────────";
  return [baslik, L, ...bolumler.flatMap((b, i) => (i ? [L, ...b] : b)), L, ...(not ? [not] : []), NOT_OZET].join("\n");
}
function ozetBagla(pre, getT) {
  const c = $(pre + "_copy");
  if (c) c.addEventListener("click", () => {
    const t = getT(); if (!t) return; const o = c.textContent;
    const done = () => { c.textContent = "✅ Kopyalandı"; setTimeout(() => (c.textContent = o), 1500); };
    const fb = () => { const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); } catch (e) {} a.remove(); done(); };
    if (navigator.clipboard) navigator.clipboard.writeText(notEkle(t)).then(done, fb); else fb();
  });
}
// ---------- Ödeme planı PDF (üç kredide ortak) ----------
let tkPdf = null, k2Pdf = null, tcPdf = null;
const PDF_NOTE = "Bu belge tahmini bir hesaplamadır; bankanın resmi ödeme planı değildir. Kesin tutarlar ve tarihler işlem günü banka tarafından belirlenir. Ücret, masraf, komisyon ve sigorta dahil edilmemiştir.";
// Özet kutuları: ilk satır kredi, ikinci satır ödeme bilgisi
function planKutular(o) {
  const f = fmt2, pc = (x) => "%" + x.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  return [
    [["Kredi tutarı", f(o.P) + " TL"], ["Vade", o.rows.length + " taksit"], o.faizK || ["Aylık faiz", pc(o.r * 100)]],
    [[o.taksitK || "Aylık taksit", f(o.T) + " TL"], ["Toplam geri ödeme", f(o.top) + " TL"], ["Faiz + vergi + fon", f(o.tF + o.tV + o.tFo) + " TL"]],
  ];
}
function planPdfHTML(o) {
  const d = (x) => shortD(x), f = fmt2, pc = (x) => "%" + x.toLocaleString("tr-TR", { maximumFractionDigits: 3 });
  const S = (k) => R2(o.rows.reduce((a, x) => a + x[k], 0));
  const K = planKutular(o), cell = "padding:5px 6px;text-align:right;border-bottom:1px solid #ece6d8";
  const kutu = (row, koyu) => `<div style="display:flex;gap:8px;margin-top:8px">${row.map(([k, v]) => `<div style="flex:1;padding:9px 11px;border-radius:9px;${koyu ? "background:#1c1a16;color:#f3dca8" : "background:#faf6ec;border:1px solid #e6dcc4;color:#222"}"><div style="font-size:10.5px;opacity:.75">${k}</div><div style="font-size:15px;font-weight:700;margin-top:2px">${v}</div></div>`).join("")}</div>`;
  return `<div style="width:760px;padding:26px 32px;background:#fff;color:#222;font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:1.4">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #c9953c;padding-bottom:8px">
      <div><div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#a8741c">KREDİ HESAPLAMA ÖZETİ</div><div style="font-size:19px;font-weight:700;margin-top:2px">${o.tur}</div></div>
      <div style="text-align:right;font-size:10.5px;color:#777">Hesaplama tarihi: ${d(new Date())}<br>İlk taksit: ${d(o.rows[0].d)}</div></div>
    <div style="margin-top:6px;font-size:10.5px;color:#a8741c;font-weight:700">BİLGİLENDİRME AMAÇLI · RESMİ ÖDEME PLANI DEĞİLDİR</div>
    ${kutu(K[0], false)}${kutu(K[1], true)}
    <div style="margin-top:6px;font-size:10.5px;color:#777">BSMV ${pc(o.bsmv * 100)} · KKDF ${pc(o.kkdf * 100)} · Toplam faiz ${f(o.tF)} TL · vergi ${f(o.tV)} TL · fon ${f(o.tFo)} TL</div>
    <table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:11px">
      <thead><tr>${["#", "Tarih", "Taksit", "Anapara", "Faiz", "Vergi", "Fon", "Kalan borç"].map((h, i) => `<th style="background:#1c1a16;color:#f3dca8;padding:6px 5px;font-weight:700;text-align:${i < 2 ? "center" : "right"}">${h}</th>`).join("")}</tr></thead>
      <tbody>${o.rows.map((x, k) => `<tr style="page-break-inside:avoid"><td style="${cell};text-align:center;color:#999">${k + 1}</td><td style="${cell};text-align:center">${d(x.d)}</td><td style="${cell};font-weight:700">${f(x.t)}</td><td style="${cell}">${f(x.a)}</td><td style="${cell}">${f(x.f)}</td><td style="${cell}">${f(x.v)}</td><td style="${cell}">${f(x.fo)}</td><td style="${cell};color:#777">${f(x.b)}</td></tr>`).join("")}
      <tr style="background:#faf0d4;font-weight:700"><td style="${cell}"></td><td style="${cell};text-align:center">Toplam</td><td style="${cell}">${f(S("t"))}</td><td style="${cell}">${f(S("a"))}</td><td style="${cell}">${f(S("f"))}</td><td style="${cell}">${f(S("v"))}</td><td style="${cell}">${f(S("fo"))}</td><td style="${cell}"></td></tr></tbody>
    </table>
    <p style="margin-top:14px;font-size:10.5px;color:#666;border-top:1px solid #e6dcc4;padding-top:8px">${PDF_NOTE}</p></div>`;
}
// PDF kitaplıkları sitenin kendi içinde (lib/), dış bağlantı gerekmez; ilk tıklamada yüklenir
const loadJs = (src) => new Promise((ok, no) => { const sc = document.createElement("script"); sc.src = src; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
let pdfLibP = null;
const loadPdfLib = () => pdfLibP || (pdfLibP = loadJs("lib/jspdf.umd.min.js").then(() => loadJs("lib/jspdf.plugin.autotable.min.js")).then(() => loadJs("lib/pdffont.js")).catch((e) => { pdfLibP = null; throw e; }));
function buildPlanPdf(o, name) {
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
  doc.addFileToVFS("FS.ttf", PDF_FONTS.regular); doc.addFont("FS.ttf", "FS", "normal");
  doc.addFileToVFS("FSB.ttf", PDF_FONTS.bold); doc.addFont("FSB.ttf", "FS", "bold");
  const d = (x) => shortD(x), f = fmt2, pc = (x) => "%" + x.toLocaleString("tr-TR", { maximumFractionDigits: 3 });
  const S = (k) => R2(o.rows.reduce((a, x) => a + x[k], 0));
  const L = 14, W = 182, GOLD = [201, 149, 60], DARK = [28, 26, 22], CREAM = [250, 246, 236];
  let y = 18;
  // Başlık
  doc.setFont("FS", "bold"); doc.setFontSize(9); doc.setTextColor(168, 116, 28); doc.text("KREDİ HESAPLAMA ÖZETİ", L, y - 1);
  doc.setFontSize(17); doc.setTextColor(34, 34, 34); doc.text(o.tur, L, y + 6.5);
  doc.setFont("FS", "normal"); doc.setFontSize(9); doc.setTextColor(119, 119, 119);
  doc.text(`Hesaplama tarihi: ${d(new Date())}`, L + W, y, { align: "right" }); doc.text(`İlk taksit: ${d(o.rows[0].d)}`, L + W, y + 5, { align: "right" });
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.9); doc.line(L, y + 10, L + W, y + 10);
  doc.setFont("FS", "bold"); doc.setFontSize(8.5); doc.setTextColor(168, 116, 28); doc.text("BİLGİLENDİRME AMAÇLI · RESMİ ÖDEME PLANI DEĞİLDİR", L, y + 15);
  y += 19;
  // Yan yana özet kutuları
  const K = planKutular(o), bw = (W - 8) / 3, bh = 15;
  K.forEach((row, ri) => {
    row.forEach(([k, v], i) => {
      const x = L + i * (bw + 4);
      if (ri === 1) { doc.setFillColor(...DARK); doc.roundedRect(x, y, bw, bh, 2.5, 2.5, "F"); doc.setTextColor(243, 220, 168); }
      else { doc.setFillColor(...CREAM); doc.setDrawColor(230, 220, 196); doc.setLineWidth(0.25); doc.roundedRect(x, y, bw, bh, 2.5, 2.5, "FD"); doc.setTextColor(90, 90, 90); }
      doc.setFont("FS", "normal"); doc.setFontSize(8.5); doc.text(k, x + 4, y + 5.5);
      doc.setFont("FS", "bold"); doc.setFontSize(12); if (ri === 0) doc.setTextColor(34, 34, 34); doc.text(v, x + 4, y + 11.8);
    });
    y += bh + 3;
  });
  doc.setFont("FS", "normal"); doc.setFontSize(8.5); doc.setTextColor(119, 119, 119);
  doc.text(`BSMV ${pc(o.bsmv * 100)} · KKDF ${pc(o.kkdf * 100)} · Toplam faiz ${f(o.tF)} TL · vergi ${f(o.tV)} TL · fon ${f(o.tFo)} TL`, L, y + 2);
  // Taksit tablosu
  doc.autoTable({
    startY: y + 6, margin: { left: L, right: L, bottom: 20 }, theme: "plain", showHead: "everyPage", showFoot: "lastPage",
    head: [["#", "Tarih", "Taksit", "Anapara", "Faiz", "Vergi", "Fon", "Kalan borç"]],
    body: o.rows.map((x, k) => [k + 1, d(x.d), f(x.t), f(x.a), f(x.f), f(x.v), f(x.fo), f(x.b)]),
    foot: [["", "Toplam", f(S("t")), f(S("a")), f(S("f")), f(S("v")), f(S("fo")), ""]],
    styles: { font: "FS", fontSize: 8.5, cellPadding: { top: 1.6, bottom: 1.6, left: 1.5, right: 1.5 }, halign: "right", textColor: [40, 40, 40], lineColor: [236, 230, 216], lineWidth: { bottom: 0.2 } },
    headStyles: { font: "FS", fontStyle: "bold", fillColor: DARK, textColor: [243, 220, 168], halign: "right" },
    footStyles: { font: "FS", fontStyle: "bold", fillColor: [250, 240, 212], textColor: [34, 34, 34], halign: "right" },
    columnStyles: { 0: { halign: "center", cellWidth: 9, textColor: [150, 150, 150] }, 1: { halign: "center", cellWidth: 22 }, 2: { fontStyle: "bold" }, 7: { textColor: [120, 120, 120] } },
    didParseCell: (h) => { if (h.section === "head" && h.column.index < 2) h.cell.styles.halign = "center"; },
  });
  // Not
  y = doc.lastAutoTable.finalY + 7;
  if (y > 268) { doc.addPage(); y = 20; }
  doc.setFont("FS", "normal"); doc.setFontSize(8.5); doc.setTextColor(102, 102, 102);
  doc.text(doc.splitTextToSize(PDF_NOTE, W), L, y);
  // Her sayfa: soluk filigran ve alt bilgi
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    try { doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.05 })); } catch (e) {}
    doc.setFont("FS", "bold"); doc.setFontSize(46); doc.setTextColor(168, 116, 28); doc.text("BİLGİ AMAÇLI", 105, 170, { align: "center", angle: 30 });
    try { doc.restoreGraphicsState(); } catch (e) {}
    doc.setDrawColor(230, 220, 196); doc.setLineWidth(0.3); doc.line(L, 284, L + W, 284);
    doc.setFont("FS", "normal"); doc.setFontSize(8); doc.setTextColor(168, 116, 28);
    doc.text("Bilgilendirme amaçlı tahmini hesaplamadır · resmi ödeme planı değildir", L, 289);
    doc.setTextColor(140, 140, 140); doc.text(`${i} / ${n}`, L + W, 289, { align: "right" });
  }
  doc.save(name);
}
function planPdf(o, btn) {
  if (!o) return;
  const name = `KrediHesabi_${o.tur.replace(/\s+/g, "")}_${Math.round(o.P)}TL.pdf`.replace(/İ/g, "I").replace(/ı/g, "i").replace(/Ş/g, "S").replace(/ş/g, "s").replace(/Ğ/g, "G").replace(/ğ/g, "g").replace(/Ü/g, "U").replace(/ü/g, "u").replace(/Ö/g, "O").replace(/ö/g, "o").replace(/Ç/g, "C").replace(/ç/g, "c");
  const lbl = btn.textContent; btn.textContent = "⏳ PDF hazırlanıyor…"; btn.disabled = true;
  const done = () => { btn.textContent = lbl; btn.disabled = false; };
  loadPdfLib().then(() => { buildPlanPdf(o, name); done(); }).catch(() => {
    // Kitaplık yüklenemezse: aynı sayfada yazdır (PDF olarak kaydet)
    const fr = document.createElement("iframe"); fr.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0"; document.body.appendChild(fr);
    fr.contentDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>${name}</title><style>@page{size:A4;margin:10mm}body{margin:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${planPdfHTML(o)}</body></html>`); fr.contentDocument.close();
    setTimeout(() => { fr.contentWindow.print(); setTimeout(() => fr.remove(), 2000); done(); }, 300);
  });
}

// ---------- Hesap özeti: üç kredide ortak şablon ----------
// Ücret, masraf, komisyon ve sigorta bu özete bilerek dahil edilmez.
function krediOzet(o) {
  const L = "──────────────────", pc = (x) => "%" + nfx(x * 100);
  const first = o.plan[0].t, last = o.plan[o.plan.length - 1].t;
  const ilkF = !o.tek && Math.abs(first - o.taksit) > 0.004, sonF = !o.tek && Math.abs(last - o.taksit) > 0.004;
  return [
    "KREDİ ÖDEME ÖZETİ",
    L,
    `Kredi türü: ${o.tur}`,
    `Kredi tutarı: ${tl(o.P)}`,
    `Vade: ${o.vadeTxt || (o.tek ? "Tek taksit" : o.n + " ay")}`,
    o.faizTxt || `Aylık faiz oranı: %${(o.r * 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`,
    L,
    `${o.tek ? "Ödenecek tutar" : "Aylık taksit tutarı"}: ${tl(o.taksit)}`,
    ...(ilkF ? [`İlk taksit tutarı: ${tl(first)}`] : []),
    ...(sonF ? [`Son taksit tutarı: ${tl(last)}`] : []),
    `Toplam geri ödeme: ${tl(o.toplam)}`,
    L,
    `Toplam faiz: ${tl(o.tF)}`,
    `BSMV oranı: ${pc(o.bsmv)} · BSMV tutarı: ${tl(o.tB)}`,
    `KKDF oranı: ${pc(o.kkdf)} · KKDF tutarı: ${tl(o.tK)}`,
    `Toplam vergi ve fon (BSMV + KKDF): ${tl(o.tB + o.tK)}`,
    L,
    `İlk taksit tarihi: ${shortD(o.d0)}`,
    `Son taksit tarihi: ${shortD(o.d1)}`,
    L,
    "Bilgi amaçlıdır; kesin tutar işlem günü belirlenir. Krediye ilişkin ücret, masraf ve komisyon bilgileri dahil edilmemiştir.",
  ].join("\n");
}

// ---------- Taksitli ticari kredi ----------
// Faiz = kalan × aylık faiz × gün/30 (gerçek gün, kayan tarihlerle), vergi/fon faiz üzerinden.
// Taksit eşit; kuruşa yukarı yuvarlanır, son taksit kalan anaparayı kapatır.
let tcIlkManual = false, tcLast = null, tcSummary = "";
function tcPlan(P, r, g, T, bsmv, kkdf) {
  let b = P; const out = [];
  for (let k = 0; k < g.length; k++) {
    const f = R2(b * r * g[k] / 30), v = R2(f * bsmv), fo = R2(f * kkdf);
    let a = R2(T - f - v - fo), t = T;
    if (k === g.length - 1) { a = b; t = R2(a + f + v + fo); }
    b = R2(b - a); out.push({ g: g[k], a, f, v, fo, t, b });
  }
  return out;
}
function calcTic() {
  const P = num("tc_tutar"), r = num("tc_faiz") / 100, n = Math.round(num("tc_vade"));
  const bsmv = num("tc_bsmv") / 100, kkdf = num("tc_kkdf") / 100;
  const bas = pDate($("tc_bas").value) || new Date();
  if (!$("tc_bas").value) $("tc_bas").value = ymd(bas);
  if (!tcIlkManual || !$("tc_ilk").value) $("tc_ilk").value = ymd(addMonthsC(bas, 1));
  const ilk = pDate($("tc_ilk").value);
  // Banka kuralı: ilk taksit (iş gününe kaymış hâliyle) kullandırımdan en fazla 45 gün sonra olabilir
  $("tc_ilk").min = ymd(addDays(bas, 1)); $("tc_ilk").max = ymd(addDays(bas, 45));
  const ilkK = ilk ? nextBiz(ilk) : null, gun = ilk ? dayDiff(bas, ilkK) : NaN;
  const ok = ilk && ilk > bas && gun <= 45;
  const kay = ok && ymd(ilkK) !== ymd(ilk);
  $("tc_dnote").innerHTML = ilk && ilk > bas && gun > 45
    ? `<span style="color:#ef8a5d">⚠️ İlk taksit kredi veriliş tarihinden en fazla <b>45 gün</b> sonra olabilir; ${kay || ymd(ilkK) !== ymd(ilk) ? `iş gününe kaymış hâliyle (${shortD(ilkK)}) ` : ""}şu an <b>${gun} gün</b>. ${shortD(bas)} için en geç ${shortD(addDays(bas, 45))} seç (iş günü olmalı).</span>`
    : ok ? `İlk taksite <b>${gun} gün</b>. ` + (kay ? `${shortD(ilk)} ${ilk.toLocaleDateString("tr-TR", { weekday: "long" })} olduğu için ilk taksit <b>${shortD(ilkK)}</b> tarihine kayar. ` : "") + `Ödeme günü: her ayın <b>${ilk.getDate()}.</b> günü; hafta sonu ya da bayrama denk gelirse ilk iş günü.`  +
    (!kay && isHoliday(addDays(ilk, -1)) && ilk.getDate() > 1 ? `<br><span style="color:#e0a24f">💡 Sözleşmedeki ödeme günü ${shortD(addDays(ilk, -1))} ise (tatil ya da hafta sonu olduğu için planda ${shortD(ilk)} görünür) burada da ${shortD(addDays(ilk, -1))} gir; yoksa sonraki taksit günleri kayar.</span>` : "") : '<span style="color:#ef8a5d">⚠️ Ödeme başlangıç tarihi kredi veriliş tarihinden sonra olmalı.</span>';
  const clear = () => { ["tcs_taksit", "tcs_faiz", "tcs_vergi", "tcs_toplam"].forEach((x) => ($(x).textContent = "–")); $("tcs_ilk").textContent = ""; $("tc_out").textContent = "–"; rows("tc_rows", []); $("tc_plan").innerHTML = ""; tcLast = null; tcSummary = ""; };
  if (!P || !n || n > 600 || !ok) return clear();
  const { T, plan, dues, g } = tcCore(P, r, n, bsmv, kkdf, bas, ilk);
  const sum = (k) => R2(plan.reduce((s, x) => s + x[k], 0));
  const tF = sum("f"), tV = sum("v"), tFo = sum("fo"), top = sum("t");
  const f4 = (x) => x.toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  $("tc_out").textContent = tl(T);
  $("tcs_taksit").textContent = tl(T);
  $("tcs_ilk").textContent = `${n} taksit · ilk ${shortD(dues[0])}` + (Math.abs(plan[n - 1].t - T) > 0.004 ? ` · son taksit ${tl(plan[n - 1].t)}` : "");
  $("tcs_faiz").textContent = tl(tF); $("tcs_vergi").textContent = tl(tV + tFo); $("tcs_toplam").textContent = tl(top);
  tcPdf = { tur: "Taksitli Ticari Kredi", bas, P, r, n, bsmv, kkdf, tF, tV, tFo, top, T, rows: plan.map((x, k) => ({ d: dues[k], a: x.a, f: x.f, fo: x.fo, v: x.v, t: x.t, b: x.b })) };
  tcSummary = krediOzet({ tur: "Taksitli Ticari Kredi", P, n, r, taksit: T, plan, bsmv, kkdf, tF, tB: tV, tK: tFo, toplam: top, d0: dues[0], d1: dues[n - 1] });
  rows("tc_rows", [
    ["İlk / son taksit", `${shortD(dues[0])} · ${shortD(dues[n - 1])}`],
    ["Toplam faiz", tl(tF)],
    [`Toplam vergi (BSMV %${nfx(bsmv * 100)})`, tl(tV)],
    [`Toplam fon (KKDF %${nfx(kkdf * 100)})`, tl(tFo)],
    ["Geri ödenecek toplam", tl(top), "total"],
    ...(Math.abs(plan[n - 1].t - T) > 0.004 ? [["Son taksit", tl(plan[n - 1].t)]] : []),
  ]);
  $("tc_plan").innerHTML = "<tr><th>Sıra<br>No</th><th>Vade</th><th>Fark<br>(Gün)</th><th>Anapara</th><th>Faiz</th><th>Fon</th><th>Vergi</th><th>Taksit Tutarı</th><th>Kalan Anapara</th></tr>" +
    plan.map((x, k) => `<tr><td>${k + 1}</td><td>${shortD(dues[k])}</td><td>${x.g}</td><td>${fmt2(x.a)}</td><td>${fmt2(x.f)}</td><td>${fmt2(x.fo)}</td><td>${fmt2(x.v)}</td><td>${fmt2(x.t)}</td><td>${fmt2(x.b)}</td></tr>`).join("") +
    `<tr class="tot"><td></td><td>TOPLAM:</td><td></td><td>${fmt2(P)}</td><td>${fmt2(tF)}</td><td>${fmt2(tFo)}</td><td>${fmt2(tV)}</td><td>${fmt2(top)}</td><td></td></tr>`;
  tcLast = { P, n, plan };
}
$("tc_ilk").addEventListener("input", () => (tcIlkManual = true));
$("t_pdf").addEventListener("click", (e) => tkSummary && planPdf(tkPdf, e.currentTarget));
$("k2_pdf").addEventListener("click", (e) => k2Summary && planPdf(k2Pdf, e.currentTarget));
$("tc_pdf").addEventListener("click", (e) => tcSummary && planPdf(tcPdf, e.currentTarget));
$("tc_copy").addEventListener("click", () => {
  if (!tcSummary) return;
  const done = () => { const b = $("tc_copy"); b.textContent = "✅ Kopyalandı"; setTimeout(() => (b.textContent = "📋 Özeti kopyala"), 1500); };
  if (navigator.clipboard) navigator.clipboard.writeText(notEkle(tcSummary)).then(done, () => prompt("Kopyala:", tcSummary));
  else prompt("Kopyala:", tcSummary);
});

// ---------- Tarım ----------
// [KKDF, BSMV] — levhasız ÇKS/çiftçilik belgeli: KKDF %15, ancak 15.000 TL'ye kadar olan kredide %0
const TR_PRESET = { levha: [0, 5], cks: [15, 5] };
const trKkdf = (durum, P) => (durum === "cks" && P <= 15000 ? 0 : TR_PRESET[durum][0]);
let trManual = false, trOzet = "", trPdf = null;
["tr_kkdf", "tr_bsmv"].forEach((x) => $(x).addEventListener("input", () => (trManual = true)));
let trLast = null;
let trModeLast = "aylik";
function trSchedule(P, ry, n, mode, tax) {
  // dönemsel faiz ve dönem sayısı
  if (mode === "hasat") {
    const faiz = P * ry * (n / 12);
    return { per: P + faiz * (1 + tax), count: 1, faiz, label: "Vade sonu ödeme" };
  }
  const periods = mode === "yillik" ? Math.max(1, Math.round(n / 12)) : n;
  const r = mode === "yillik" ? ry : ry / 12;
  const i = r * (1 + tax);
  const per = i === 0 ? P / periods : P * i / (1 - Math.pow(1 + i, -periods));
  // vergi hariç faiz toplamı
  let kalan = P, faiz = 0;
  for (let k = 0; k < periods; k++) { const f = kalan * r; const a = per - f * (1 + tax); faiz += f; kalan -= a; }
  return { per, count: periods, faiz, label: mode === "yillik" ? "Yıllık taksit" : "Aylık taksit" };
}
function calcTarim() {
  const durum = TR_PRESET[$("tr_durum").value] ? $("tr_durum").value : "levha";
  if (durum !== trLast) { trManual = false; trLast = durum; }
  if (!trManual) {
    $("tr_kkdf").value = String(trKkdf(durum, num("tr_tutar")));
    $("tr_bsmv").value = String(TR_PRESET[durum][1]);
  }
  const P = num("tr_tutar"), ry = num("tr_faiz") / 100, n = Math.round(num("tr_vade"));
  const kkdf = num("tr_kkdf") / 100, bsmv = num("tr_bsmv") / 100;
  const mode = $("tr_odeme").value;
  if (mode !== trModeLast) { dManual.tr = false; trModeLast = mode; }
  const step = mode === "aylik" ? 1 : mode === "yillik" ? 12 : Math.max(1, n);
  const cnt = mode === "aylik" ? n : mode === "yillik" ? Math.max(1, Math.round(n / 12)) : 1;
  $("tr_ilkLbl").textContent = mode === "hasat" ? "Ödeme (vade) tarihi" : "İlk taksit tarihi";
  const D = dateSetup("tr", step, cnt, mode === "aylik" ? 5 : 1, mode === "aylik" ? 45 : 99999);
  if (!P || !n || !D.ok) { $("tr_out").textContent = "–"; rows("tr_rows", []); $("tr_plan").innerHTML = ""; trOzet = ""; trPdf = null; return; }
  // Dönem faizi: aylık = yıllık/12 (kırık ilk dönem gün/30); yıllık ve hasat = gün/360
  const rp = mode === "aylik" ? ry / 12 : ry;
  const per = mode === "hasat" ? [{ d: D.ilk, fac: ymd(addMonthsC(D.bas, n)) === ymd(D.ilk) ? n / 12 : D.g / 360, g: D.g }] : mkPerStep(D.bas, D.ilk, cnt, step, mode === "aylik" ? 30 : 360);
  const build = (kk, bs) => { const T = mode === "hasat" ? P * (1 + rp * per[0].fac * (1 + kk + bs)) : solveT(P, per, rp, kk, bs); return { T, plan: tkPlan(P, per, T, rp, kk, bs, true) }; };
  const cur = build(kkdf, bsmv);
  const sum = (pl, k) => pl.reduce((a, x) => a + x[k], 0);
  const toplam = sum(cur.plan, "t"), fz = sum(cur.plan, "f");
  const alt = durum === "levha" ? build(trKkdf("cks", num("tr_tutar")), bsmv) : null; // levhasız olsaydı: 15.000 TL'ye kadar KKDF yok
  const fark = alt ? Math.abs(sum(alt.plan, "t") - toplam) : 0;
  const ilkF = cur.plan.length > 1 && Math.abs(cur.plan[0].t - R2(cur.T)) > 0.005;
  $("tr_bigLbl").textContent = mode === "hasat" ? "Vade sonu ödeme" : mode === "yillik" ? "Yıllık taksit" : "Aylık taksit";
  $("tr_out").textContent = tl(mode === "hasat" ? cur.plan[0].t : R2(cur.T));
  rows("tr_rows", [
    [mode === "hasat" ? "Ödeme tarihi" : "İlk / son taksit", mode === "hasat" ? `${shortD(cur.plan[0].d)} · ${D.g} gün` : `${shortD(cur.plan[0].d)} · ${shortD(cur.plan[cur.plan.length - 1].d)}`],
    ...(ilkF ? [[`İlk taksit (${cur.plan[0].g} gün)`, tl(cur.plan[0].t)]] : []),
    ["Toplam faiz", tl(fz)],
    ["KKDF", tl(sum(cur.plan, "kk"))],
    ["BSMV", tl(sum(cur.plan, "bs"))],
    ["Toplam geri ödeme", tl(toplam), "total"],
    ...(alt && fark > 0.005 ? [["Levhasıza göre tasarruf (KKDF yok)", tl(fark), "pos"]] : []),
  ]);
  $("tr_plan").innerHTML = planHead + cur.plan.map((x, j) => planRow(x, j + 1)).join("") + planTot(cur.plan);
  { const tek = mode === "hasat", T0 = tek ? cur.plan[0].t : R2(cur.T), odAd = { aylik: "aylık eşit taksit", hasat: "vade sonunda tek ödeme", yillik: "yıllık eşit taksit" }[mode];
    const fz = `Yıllık faiz oranı: %${nfx(ry * 100)} (aylık %${(ry / 12 * 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })})`;
    trOzet = krediOzet({ tur: "Tarım Kredisi", P, n, r: ry / 12, taksit: T0, plan: cur.plan, bsmv, kkdf, tF: fz ? sum(cur.plan, "f") : 0, tB: sum(cur.plan, "bs"), tK: sum(cur.plan, "kk"), toplam, d0: cur.plan[0].d, d1: cur.plan[cur.plan.length - 1].d, tek, vadeTxt: `${n} ay · ${odAd}`, faizTxt: fz }).replace("KREDİ ÖDEME ÖZETİ", "TARIM KREDİSİ ÖDEME ÖZETİ");
    trPdf = { tur: "Tarım Kredisi", P, r: ry / 12, n, bsmv, kkdf, tF: sum(cur.plan, "f"), tV: sum(cur.plan, "bs"), tFo: sum(cur.plan, "kk"), top: toplam, T: T0, faizK: ["Yıllık faiz", "%" + nfx(ry * 100)], taksitK: tek ? "Vade sonu ödeme" : mode === "yillik" ? "Yıllık taksit" : "Aylık taksit", rows: cur.plan.map((x) => ({ d: x.d, a: x.ana, f: x.f, fo: x.kk, v: x.bs, t: x.t, b: x.bal })) }; }
  const txt = {
    levha: "<b>KKDF %0</b>: Vergi levhalı (gerçek usulde vergilendirilen) çiftçinin zirai faaliyet için kullandığı kredi ticari/zirai kredi sayılır. Alınan makine, ekipman vb. işletme aktifine kaydedilir ve faturayla belgelenir.",
    cks: num("tr_tutar") <= 15000 ? "<b>KKDF %0 + BSMV %5</b>: Levhasız, ÇKS / çiftçilik belgeli çiftçide kredi tutarı 15.000 TL'ye kadar olduğu için KKDF alınmaz." : "<b>KKDF %15 + BSMV %5</b>: Vergi levhası olmayan, ÇKS / çiftçilik belgeli çiftçide KKDF %15 uygulanır. Kredi tutarı 15.000 TL'ye kadar olursa KKDF %0 olur.",
  }[durum];
  $("tr_info").innerHTML = txt + (trManual ? "<br><span style='color:var(--muted)'>Vergi oranlarını elle girdin.</span>" : "");
}

// ---------- Çek iskonto & valör ----------
const HOL_FIXED = { "01-01": "Yılbaşı", "04-23": "Ulusal Egemenlik ve Çocuk Bayramı", "05-01": "Emek ve Dayanışma Günü", "05-19": "Atatürk'ü Anma, Gençlik ve Spor Bayramı", "07-15": "Demokrasi ve Millî Birlik Günü", "08-30": "Zafer Bayramı", "10-29": "Cumhuriyet Bayramı" };
const HOL_REL = {
  2026: { "03-19": ["Ramazan Bayramı arifesi", 1], "03-20": ["Ramazan Bayramı 1. gün"], "03-21": ["Ramazan Bayramı 2. gün"], "03-22": ["Ramazan Bayramı 3. gün"], "05-26": ["Kurban Bayramı arifesi", 1], "05-27": ["Kurban Bayramı 1. gün"], "05-28": ["Kurban Bayramı 2. gün"], "05-29": ["Kurban Bayramı 3. gün"], "05-30": ["Kurban Bayramı 4. gün"] },
  2027: { "03-08": ["Ramazan Bayramı arifesi", 1], "03-09": ["Ramazan Bayramı 1. gün"], "03-10": ["Ramazan Bayramı 2. gün"], "03-11": ["Ramazan Bayramı 3. gün"], "05-15": ["Kurban Bayramı arifesi", 1], "05-16": ["Kurban Bayramı 1. gün"], "05-17": ["Kurban Bayramı 2. gün"], "05-18": ["Kurban Bayramı 3. gün"], "05-19": ["Kurban Bayramı 4. gün"] },
};
// Günün durumu: {we, hol, half, name}
function dayInfo(d) {
  const md = ymd(d).slice(5), y = d.getFullYear(), w = d.getDay();
  const r = (HOL_REL[y] || {})[md];
  const info = { we: w === 0 || w === 6, hol: false, half: false, name: "" };
  if (HOL_FIXED[md]) { info.hol = true; info.name = HOL_FIXED[md]; }
  if (md === "10-28") { info.half = true; info.name = "Cumhuriyet Bayramı arifesi (yarım gün)"; }
  if (r) { if (r[1]) { info.half = true; info.name = r[0] + " (yarım gün)"; } else { info.hol = true; info.name = r[0]; } }
  return info;
}
const isBizDay = (d) => { const i = dayInfo(d); return !i.we && !i.hol; }; // arife (yarım gün) takas/valör günü sayılır (banka tablosu)
const nextBizC = (d) => { const x = new Date(d); while (!isBizDay(x)) x.setDate(x.getDate() + 1); return x; };
const addBiz = (d, n) => { let x = nextBizC(d); for (let i = 0; i < n; i++) { x = addDays(x, 1); x = nextBizC(x); } return x; };
const dayWhy = (d) => { const i = dayInfo(d); return i.hol ? i.name : i.we ? (d.getDay() === 6 ? "Cumartesi" : "Pazar") : i.half ? i.name : ""; };
const parseNum = (v) => { v = String(v || "").trim().replace(/\s/g, ""); const c = v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : (/^\d{1,3}(\.\d{3})+$/.test(v) ? v.replace(/\./g, "") : v); const n = parseFloat(c); return isFinite(n) ? n : 0; };
let CEKLER = [{ t: "1.000.000", v: "2026-11-27" }];
try { const sv = JSON.parse(localStorage.getItem("cekler") || "null"); if (Array.isArray(sv) && sv.length) CEKLER = sv; } catch (e) {}
function renderCekList() {
  $("c_list").innerHTML = CEKLER.map((c, i) => `<div class="ckrow">
      <div><label style="margin-top:0">${i + 1}. çek tutarı</label><div class="field"><input data-i="${i}" data-k="t" type="text" inputmode="decimal" value="${c.t}"><span class="unit">TL</span></div></div>
      <div><label style="margin-top:0">Vade</label><input data-i="${i}" data-k="v" type="date" value="${c.v}" style="color-scheme:dark"></div>
      <button type="button" class="ckdel" data-del="${i}" title="Sil" ${CEKLER.length === 1 ? "disabled" : ""}>✕</button>
    </div>`).join("");
}
let calSel = "";
function calcCek() {
  const isl = pDate($("c_isl").value) || new Date();
  const ry = num("c_faiz") / 100, B = 360, ic = false;
  const vg = 1, bsmv = num("c_bsmv") / 100, kkdf = num("c_kkdf") / 100;
  const oran = Math.min(100, num("c_oran") || 0) / 100, komO = Math.min(1.1, num("c_kom")) / 100;
  try { localStorage.setItem("cekler", JSON.stringify(CEKLER)); } catch (e) {}
  const warns = [];
  const islWhy = dayWhy(isl);
  if (dayInfo(isl).we || dayInfo(isl).hol) warns.push(`🔴 Kullandırım tarihi ${shortD(isl)} iş günü değil (${islWhy}).`);
  else if (dayInfo(isl).half) warns.push(`🟠 Kullandırım tarihi ${shortD(isl)}: ${islWhy}.`);
  const res = [];
  CEKLER.forEach((c, i) => {
    const T = parseNum(c.t), v = pDate(c.v);
    if (!T || !v) return;
    const vIs = nextBizC(v);
    const val = vg === 0 ? vIs : addBiz(vIs, vg);
    const n = dayDiff(isl, val);
    if (n <= 0) { warns.push(`🔴 ${i + 1}. çek: valör tarihi kullandırımdan sonra olmalı.`); return; }
    if (dayDiff(isl, v) > 365) warns.push(`🔴 ${i + 1}. çek: vade 1 yılı aşıyor (${dayDiff(isl, v)} gün). Çek iskontosunda en fazla 1 yıl vadeli çek alınır.`);
    const A = T * oran, nf = ic ? n : n + 1; // banka tablosu: valör günü dahil (+1)
    const F = ic ? A * ry * nf / (B + ry * nf) : A * ry * nf / B;
    res.push({ i, T, A, v, vIs, val, n, nf, nv: dayDiff(isl, v), F, bs: F * bsmv, kk: F * kkdf });
    const why = dayWhy(v);
    if (dayInfo(v).half) warns.push(`🟠 ${i + 1}. çek vadesi ${fdtw(v)} → ${why}. Arife günü takasa girer; valör bayram sonrası ilk iş günü ${fdtw(val)}.`);
    else if (!isBizDay(v)) warns.push(`🟠 ${i + 1}. çek vadesi ${fdtw(v)} → ${why}. Takasa ${fdtw(vIs)} girer.`);
    const skipped = [], weS = []; for (let x = addDays(vIs, 1); x < val; x = addDays(x, 1)) if (!isBizDay(x)) { if (dayInfo(x).hol) skipped.push(`${shortD(x)} ${dayWhy(x)}`); else weS.push(dayWhy(x)); }
    if (skipped.length) warns.push(`🟠 ${i + 1}. çek valörü tatil nedeniyle ${fdtw(val)} tarihine kayıyor (${skipped.join(", ")}).`);
    else if (weS.length) warns.push(`ℹ️ ${i + 1}. çek valörü hafta sonu nedeniyle ${fdtw(val)}.`);
    if (v.getFullYear() > 2027) warns.push(`ℹ️ ${v.getFullYear()} için bayram tarihleri girilmedi; yalnızca hafta sonu ve sabit tatiller dikkate alındı.`);
  });
  if (!res.length) { $("c_days").innerHTML = ""; $("c_mini").innerHTML = ""; $("c_cmp").innerHTML = ""; $("c_prev").textContent = ""; $("c_out").textContent = "–"; rows("c_rows", []); $("c_tab").innerHTML = ""; $("c_warn").innerHTML = warns.length ? `<div class="ckwarn">${warns.map((w) => `<div>${w}</div>`).join("")}</div>` : ""; renderCal(isl, []); return; }
  const S = (k) => res.reduce((a, x) => a + x[k], 0);
  const TT = S("T"), AA = S("A");
  let FF = S("F"), BS = S("bs"), KK = S("kk");
  if (!ic) { // banka tablosu: toplam tutar × faiz × ortalama gün (5 hane) ÷ 360
    const og = Math.ceil(res.reduce((a, x) => a + x.A * x.nf, 0) / AA * 1e5 - 1e-6) / 1e5;
    FF = AA * ry * og / B; BS = FF * bsmv; KK = FF * kkdf;
  }
  const kom = AA * komO, komBS = kom * bsmv;
  const net = AA - FF - BS - KK - kom - komBS;
  const lim = num("c_lim");
  if (lim > 0) warns.push(AA > lim ? `🔴 Kullandırılan tutar (${tl(AA)}) kredi limitini (${tl(lim)}) ${tl(AA - lim)} aşıyor.` : `ℹ️ Limit kullanımı: %${nfx(Math.round(AA / lim * 1000) / 10)} · kalan limit ${tl(lim - AA)}.`);
  const ortGun = res.reduce((a, x) => a + x.A * x.n, 0) / AA;
  const ortF = res.reduce((a, x) => a + x.A * x.nf, 0) / AA; // faiz gün sayısı (ağırlıklı)
  const ortR = Math.ceil(ortF * 1e5 - 1e-6) / 1e5; // banka tablosu: 5 haneye yukarı yuvarlar
  // Banka tablosu: ort. vade günü = kullandırım + tam gün; ort. valör günü = kullandırım + yuvarlanmış gün − 1, tam iş gününe (hafta sonu/tatil/arife hariç) kaydırılır
  const ortVD = addDays(isl, Math.floor(ortR));
  let ortVV = addDays(isl, Math.round(ortR) - 1);
  for (let g = 0; g < 15; g++) { const di = dayInfo(ortVV); if (!di.we && !di.hol && !di.half) break; ortVV = addDays(ortVV, 1); }
  $("c_out").textContent = tl(net);
  $("c_cmp").innerHTML = `<div class="n"><b>${tl(net)}</b>Net tutar</div><div><b>${shortD(ortVD)}</b>Ort. vade</div><div class="vv"><b>${shortD(ortVV)}</b>Valör</div>`;
  $("c_mini").innerHTML = `<span>Toplam çek <b>${tl(TT)}</b></span><span>Faiz + BSMV <b class="r">${tl(FF + BS)}</b></span>`;
  {
    const x = res[0];
    $("c_days").innerHTML = (res.length === 1 ? `<div class="x">Çek vadesi ${fdtw(x.v)} → valör ${fdtw(x.val)} · faiz ${x.nf} gün</div>` : "") + `      <div class="v"><span>Ortalama vade günü</span><b style="font-size:20px">${shortD(ortVD)}</b><i>${fdtw(ortVD).split(" ").pop()}</i></div>
      <div class="h"><span>Ort. vade valör günü</span><b style="font-size:20px">${shortD(ortVV)}</b><i>${fdtw(ortVV).split(" ").pop()}</i></div>`;
  }
  rows("c_rows", [
    [`Çek toplamı (${res.length} adet)`, tl(TT)],
    [`Kullandırılan tutar (%${nfx(oran * 100)})`, tl(AA)],
    ["İskonto faizi", "−" + tl(FF), "neg"],
    [`Faiz + BSMV`, "−" + tl(FF + BS), "neg"],
    [`BSMV (%${nfx(bsmv * 100)})`, "−" + tl(BS), "neg"],
    ...(KK ? [[`KKDF (%${nfx(kkdf * 100)})`, "−" + tl(KK), "neg"]] : []),
    ...(kom ? [[`Kullandırım komisyonu (%${nfx(komO * 100)})`, "−" + tl(kom), "neg"], ["Komisyon BSMV", "−" + tl(komBS), "neg"]] : []),
    ["Hesaba geçecek net tutar", tl(net), "total"],
    ["Faiz oranı", `yıllık %${nfx(ry * 100)}`],

  ]);
  $("c_tab").innerHTML = "<tr><th>#</th><th>Tutar</th><th>Vade</th><th>Vade gün</th><th>Valör</th><th>Gün</th><th>Faiz</th><th>BSMV</th></tr>" +
    res.map((x) => `<tr><td>${x.i + 1}</td><td>${fmt2(x.T)}</td><td>${shortD(x.v)}</td><td>${x.nv}</td><td>${shortD(x.val)}</td><td>${x.nf}</td><td>${fmt2(x.F)}</td><td>${fmt2(x.bs)}</td></tr>`).join("");
  $("c_warn").innerHTML = warns.some((w) => !w.startsWith("ℹ️")) ? `<div class="ckwarn">${warns.map((w) => `<div>${w}</div>`).join("")}</div>` : `<div class="ckwarn" style="border-color:#1f6f4a;background:rgba(31,111,74,.12);color:#9fe0bf">✅ Vade ve valör tarihleri iş gününe denk geliyor.${warns.map((w) => `<div>${w}</div>`).join("")}</div>`;
  $("c_note").textContent = !ic ? `Hesap yöntemi: Faiz = Kullandırılan tutar × yıllık faiz × gün ÷ ${B}; gün = valör − kullandırım + 1 (valör günü dahil). Ortalama vade gün sayısı tutar ağırlıklıdır. Faiz kullandırımda peşin alınır.` : `Reeskont: Faiz = Kullandırılan tutar × yıllık faiz × gün ÷ (${B} + yıllık faiz × gün). Faiz kullandırımda peşin alınır; gün sayısı kullandırımdan valör (hesaba geçiş) tarihine kadardır.`;
  const sum = [ozetMetni("TL ÇEK İSKONTO ÖZETİ", [[`İşlem (kullandırım) tarihi: ${shortD(isl)}`, `Çek adedi: ${res.length}`, `Yıllık faiz oranı: %${nfx(ry * 100)}`],
    res.map((x) => `${x.i + 1}) ${fmt2(x.T)} TL · vade ${shortD(x.v)} · valör ${shortD(x.val)} · ${x.nf} gün`),
    [`Toplam çek: ${tl(TT)}`, ...(oran < 1 ? [`Kullandırılan (%${nfx(oran * 100)}): ${tl(AA)}`] : []), `İskonto faizi: ${tl(FF)}`, `BSMV (%${nfx(bsmv * 100)}): ${tl(BS)}`, ...(KK ? [`KKDF: ${tl(KK)}`] : []), ...(kom ? [`Kullandırım komisyonu + BSMV: ${tl(kom + komBS)}`] : []), `Ortalama vade: ${shortD(ortVD)} · valör ${shortD(ortVV)}`, `Hesaba geçecek net tutar: ${tl(net)}`]],
    "Faiz kullandırımda peşin alınır; valör tarihleri hafta sonu ve resmi tatillere göre kaydırılmıştır.")];
  $("c_prev").textContent = sum.join("\n");
  cekPdf = { isl, ry, res, TT, AA, FF, BS, KK, kom: kom + komBS, net, ortVD, ortVV, bsmv, kkdf, oran };
  renderCal(isl, res);
}
let cekPdf = null;
ozetBagla("c", () => $("c_prev").textContent);
$("c_pdf").addEventListener("click", (e) => cekPdf && belgePdf(cekBelge(cekPdf), e.currentTarget));
// Çek listesi: kredi planıyla aynı görünüm, satırlar çek bazında
function cekBelge(o) {
  const f = fmt2, d = shortD, S = (k) => o.res.reduce((a, x) => a + x[k], 0);
  return {
    ust: "ÇEK İSKONTO HESAPLAMA ÖZETİ", baslik: "TL Çek İskontosu", sag: [`Hesaplama tarihi: ${d(new Date())}`, `Kullandırım: ${d(o.isl)}`],
    kutular: [[["Toplam çek", f(o.TT) + " TL"], ["Çek adedi", o.res.length + " adet"], ["Yıllık faiz", "%" + nfx(o.ry * 100)]],
      [["Hesaba geçecek net", f(o.net) + " TL"], ["Ortalama vade", d(o.ortVD)], ["Ort. valör günü", d(o.ortVV)]]],
    alt: `Kullandırılan ${f(o.AA)} TL${o.oran < 1 ? " (%" + nfx(o.oran * 100) + ")" : ""} · İskonto faizi ${f(o.FF)} TL · BSMV ${f(o.BS)} TL${o.KK ? " · KKDF " + f(o.KK) + " TL" : ""}${o.kom ? " · Komisyon+BSMV " + f(o.kom) + " TL" : ""}`,
    head: ["#", "Çek tutarı", "Vade", "Takas günü", "Valör", "Gün", "Faiz", "BSMV"],
    body: o.res.map((x) => [x.i + 1, f(x.T), d(x.v), d(x.vIs), d(x.val), x.nf, f(x.F), f(x.bs)]),
    foot: ["", f(S("T")), "", "", "Toplam", "", f(S("F")), f(S("bs"))],
    center: [0, 2, 3, 4, 5], dosya: `CekIskonto_${Math.round(o.TT)}TL.pdf`,
    not: "Bu belge tahmini bir hesaplamadır. Faiz = tutar × yıllık faiz × gün ÷ 360 (gün = valör − kullandırım + 1). Toplam faiz ortalama vade gününe göre hesaplandığından satır toplamından kuruş farkı olabilir. Kesin tutar işlem günü belirlenir.",
  };
}
// Genel belge PDF'i (çek listesi vb.): kredi planıyla aynı tasarım
function belgePdf(o, btn) {
  const lbl = btn.textContent; btn.textContent = "⏳ PDF hazırlanıyor…"; btn.disabled = true;
  const done = () => { btn.textContent = lbl; btn.disabled = false; };
  loadPdfLib().then(() => {
    const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    doc.addFileToVFS("FS.ttf", PDF_FONTS.regular); doc.addFont("FS.ttf", "FS", "normal");
    doc.addFileToVFS("FSB.ttf", PDF_FONTS.bold); doc.addFont("FSB.ttf", "FS", "bold");
    const L = 14, W = 182, GOLD = [201, 149, 60], DARK = [28, 26, 22], CREAM = [250, 246, 236]; let y = 18;
    doc.setFont("FS", "bold"); doc.setFontSize(9); doc.setTextColor(168, 116, 28); doc.text(o.ust, L, y - 1);
    doc.setFontSize(17); doc.setTextColor(34, 34, 34); doc.text(o.baslik, L, y + 6.5);
    doc.setFont("FS", "normal"); doc.setFontSize(9); doc.setTextColor(119, 119, 119);
    o.sag.forEach((t, i) => doc.text(t, L + W, y + i * 5, { align: "right" }));
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.9); doc.line(L, y + 10, L + W, y + 10);
    doc.setFont("FS", "bold"); doc.setFontSize(8.5); doc.setTextColor(168, 116, 28); doc.text("BİLGİLENDİRME AMAÇLI · RESMİ BELGE DEĞİLDİR", L, y + 15);
    y += 19;
    const bw = (W - 8) / 3, bh = 15;
    o.kutular.forEach((row, ri) => { row.forEach(([k, v], i) => { const x = L + i * (bw + 4);
      if (ri === 1) { doc.setFillColor(...DARK); doc.roundedRect(x, y, bw, bh, 2.5, 2.5, "F"); doc.setTextColor(243, 220, 168); }
      else { doc.setFillColor(...CREAM); doc.setDrawColor(230, 220, 196); doc.setLineWidth(0.25); doc.roundedRect(x, y, bw, bh, 2.5, 2.5, "FD"); doc.setTextColor(90, 90, 90); }
      doc.setFont("FS", "normal"); doc.setFontSize(8.5); doc.text(k, x + 4, y + 5.5);
      doc.setFont("FS", "bold"); doc.setFontSize(12); if (ri === 0) doc.setTextColor(34, 34, 34); doc.text(String(v), x + 4, y + 11.8); }); y += bh + 3; });
    doc.setFont("FS", "normal"); doc.setFontSize(8.5); doc.setTextColor(119, 119, 119); doc.text(doc.splitTextToSize(o.alt, W), L, y + 2);
    const cs = {}; (o.center || []).forEach((i) => (cs[i] = { halign: "center" })); cs[0] = { halign: "center", cellWidth: 9, textColor: [150, 150, 150] };
    doc.autoTable({ startY: y + 7, margin: { left: L, right: L, bottom: 20 }, theme: "plain", showHead: "everyPage", showFoot: "lastPage",
      head: [o.head], body: o.body, foot: [o.foot],
      styles: { font: "FS", fontSize: 8.5, cellPadding: { top: 1.6, bottom: 1.6, left: 1.5, right: 1.5 }, halign: "right", textColor: [40, 40, 40], lineColor: [236, 230, 216], lineWidth: { bottom: 0.2 } },
      headStyles: { font: "FS", fontStyle: "bold", fillColor: DARK, textColor: [243, 220, 168], halign: "right" },
      footStyles: { font: "FS", fontStyle: "bold", fillColor: [250, 240, 212], textColor: [34, 34, 34], halign: "right" },
      columnStyles: cs, didParseCell: (h) => { if (h.section !== "body" && (o.center || []).includes(h.column.index)) h.cell.styles.halign = "center"; } });
    y = doc.lastAutoTable.finalY + 7; if (y > 268) { doc.addPage(); y = 20; }
    doc.setFont("FS", "normal"); doc.setFontSize(8.5); doc.setTextColor(102, 102, 102); doc.text(doc.splitTextToSize(o.not, W), L, y);
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) { doc.setPage(i);
      try { doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.05 })); } catch (e) {}
      doc.setFont("FS", "bold"); doc.setFontSize(46); doc.setTextColor(168, 116, 28); doc.text("BİLGİ AMAÇLI", 105, 170, { align: "center", angle: 30 });
      try { doc.restoreGraphicsState(); } catch (e) {}
      doc.setDrawColor(230, 220, 196); doc.setLineWidth(0.3); doc.line(L, 284, L + W, 284);
      doc.setFont("FS", "normal"); doc.setFontSize(8); doc.setTextColor(168, 116, 28); doc.text("Bilgilendirme amaçlı tahmini hesaplamadır · resmi belge değildir", L, 289);
      doc.setTextColor(140, 140, 140); doc.text(`${i} / ${n}`, L + W, 289, { align: "right" }); }
    doc.save(o.dosya); done();
  }).catch(() => {
    const cell = "padding:5px 6px;text-align:right;border-bottom:1px solid #ece6d8";
    const html = `<div style="font-family:Georgia,serif;font-size:12px;color:#222;padding:20px"><div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#a8741c">${o.ust}</div><div style="font-size:19px;font-weight:700">${o.baslik}</div><div style="color:#777;font-size:10.5px">${o.sag.join(" · ")}</div>
      ${o.kutular.map((r) => `<div style="display:flex;gap:8px;margin-top:8px">${r.map(([k, v]) => `<div style="flex:1;padding:8px 10px;border:1px solid #e6dcc4;border-radius:8px"><div style="font-size:10.5px;color:#777">${k}</div><b>${v}</b></div>`).join("")}</div>`).join("")}
      <p style="font-size:10.5px;color:#777">${o.alt}</p><table style="width:100%;border-collapse:collapse;font-size:11px"><tr>${o.head.map((h) => `<th style="background:#1c1a16;color:#f3dca8;padding:6px">${h}</th>`).join("")}</tr>
      ${o.body.map((r) => `<tr>${r.map((c) => `<td style="${cell}">${c}</td>`).join("")}</tr>`).join("")}<tr style="background:#faf0d4;font-weight:700">${o.foot.map((c) => `<td style="${cell}">${c}</td>`).join("")}</tr></table><p style="font-size:10.5px;color:#666">${o.not}</p></div>`;
    const fr = document.createElement("iframe"); fr.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0"; document.body.appendChild(fr);
    fr.contentDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>${o.dosya}</title><style>@page{size:A4;margin:10mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${html}</body></html>`); fr.contentDocument.close();
    setTimeout(() => { fr.contentWindow.print(); setTimeout(() => fr.remove(), 2000); done(); }, 300);
  });
}
function renderCal(isl, res) {
  const marks = {};
  const add = (d, c) => { const k = ymd(d); (marks[k] = marks[k] || new Set()).add(c); };
  add(isl, "isl");
  res.forEach((x) => { add(x.v, "vade"); add(x.val, "val"); });
  const t0 = new Date(); const start = new Date(t0.getFullYear(), t0.getMonth(), 1, 12);
  const end = addDays(new Date(t0.getFullYear(), t0.getMonth(), t0.getDate(), 12), 365);
  const months = [];
  for (let m = new Date(start); m <= end; m = new Date(m.getFullYear(), m.getMonth() + 1, 1, 12)) months.push(new Date(m));
  const hols = [];
  const html = months.map((m) => {
    const first = (m.getDay() + 6) % 7, dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    let cells = ["P", "S", "Ç", "P", "C", "C", "P"].map((h) => `<div class="h">${h}</div>`).join("");
    for (let i = 0; i < first; i++) cells += `<div class="d e"></div>`;
    for (let dd = 1; dd <= dim; dd++) {
      const d = new Date(m.getFullYear(), m.getMonth(), dd, 12), k = ymd(d), inf = dayInfo(d), mk = marks[k] || new Set();
      const out = d < new Date(t0.getFullYear(), t0.getMonth(), t0.getDate(), 12) || d > end;
      if (!out && (inf.hol || inf.half)) hols.push({ d, n: inf.name, half: inf.half });
      const cls = ["d", inf.hol ? "hol" : inf.we ? "we" : inf.half ? "half" : "", mk.has("isl") ? "isl" : "", mk.has("vade") ? "vade" : "", mk.has("val") ? "val" : "", out ? "out" : ""].join(" ");
      const tip = [mk.has("isl") ? "Kullandırım" : "", mk.has("vade") ? "Çek vadesi" : "", mk.has("val") ? "Valör (hesaba geçiş)" : "", inf.name, !inf.name && inf.we ? (d.getDay() === 6 ? "Cumartesi" : "Pazar") : ""].filter(Boolean).join(" · ");
      cells += `<div class="${cls}" data-tip="${fdtw(d)} ${d.getFullYear()}${tip ? " — " + tip : " — İş günü"}">${dd}</div>`;
    }
    return `<div class="mo"><h3>${m.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</h3><div class="g">${cells}</div></div>`;
  }).join("");
  // Bayram listesi (ardışık günler birleştirilir)
  const groups = [];
  hols.forEach((h) => {
    const base = h.n.replace(/ \d\. gün$/, "").replace(/ \(yarım gün\)$/, "");
    const g = groups[groups.length - 1];
    if (g && !h.half && g.base === base && dayDiff(g.e, h.d) === 1) g.e = h.d;
    else groups.push({ base: h.half ? h.n : base, s: h.d, e: h.d, half: h.half });
  });
  const list = groups.map((g) => `<div class="hl${g.half ? " half" : ""}"><span>${g.s === g.e ? fdtw(g.s) : `${g.s.getDate()}–${fdtw(g.e)}`} ${g.e.getFullYear()}</span><b>${g.base}</b></div>`).join("");
  $("c_cal").innerHTML = `<div class="tip" id="c_tip">Bir güne dokun, açıklamasını gör.</div><div class="yr">${html}</div>
    <div class="lg"><span class="l1">Kullandırım</span><span class="l2">Çek vadesi</span><span class="l3">Valör</span><span class="l4">Resmî tatil / bayram</span><span class="l5">Arife (yarım gün)</span><span class="l6">Hafta sonu</span></div>`;
}
$("c_cal").addEventListener("click", (e) => { const d = e.target.closest(".d[data-tip]"); if (d) $("c_tip").textContent = d.dataset.tip; });
$("c_list").addEventListener("input", (e) => { const el = e.target; if (el.dataset.i == null) return; CEKLER[+el.dataset.i][el.dataset.k] = el.value; calcCek(); });
$("c_list").addEventListener("focusout", (e) => { const el = e.target; if (el.dataset.k === "t") { const n = parseNum(el.value); el.value = n.toLocaleString("tr-TR", { maximumFractionDigits: 2 }); CEKLER[+el.dataset.i].t = el.value; } });
$("c_list").addEventListener("click", (e) => { const b = e.target.closest("[data-del]"); if (!b) return; CEKLER.splice(+b.dataset.del, 1); renderCekList(); calcCek(); });
$("c_add").addEventListener("click", () => { const lastV = pDate(CEKLER[CEKLER.length - 1]?.v) || new Date(); CEKLER.push({ t: "", v: ymd(addMonthsC(lastV, 1)) }); renderCekList(); calcCek(); });
["c_isl", "c_faiz", "c_bsmv", "c_kkdf", "c_oran", "c_kom", "c_lim"].forEach((x) => $(x).addEventListener("input", calcCek));

$("c_kom").addEventListener("blur", () => { const k = num("c_kom"); if (k > 1.1) $("c_kom").value = "1,1"; });
$("c_lim").addEventListener("blur", () => { const n = num("c_lim"); $("c_lim").value = n ? n.toLocaleString("tr-TR", { maximumFractionDigits: 2 }) : ""; });
$("c_isl").value = ymd(new Date());
// Özet kartı: aşağı kaydırınca üstte tek satıra iner
(function () {
  const top = $("c_top"), bar = $("c_bar");
  const f = () => {
    if (!top.offsetParent) { bar.classList.remove("show"); return; }
    const sh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stickH")) || 0;
    bar.classList.toggle("show", top.getBoundingClientRect().bottom < sh + 8 && !!$("c_cmp").innerHTML);
  };
  window.addEventListener("scroll", f, { passive: true }); window.addEventListener("resize", f);
})();
renderCekList();

// ---------- Ek Hesap (bireysel) ----------
// Faiz = tutar × aylık oran × gün / 30; KKDF %15 + BSMV %15 faize eklenir.
// Taksitli Ek Hesap: vergi dahil aylık oranla eşit taksit (isbank.com.tr örnek ödeme tablosuyla birebir).
(function () {
  let EK = { aylik: 4.25, maasli: 4.19, maasli_bas: "2026-01-01", maasli_bit: "2026-10-31", isplus: { Turkuaz: 4.23, Mavi: 4.21, Lacivert: 4.19 }, black: { Black: 4.15, "Black Plus": 4.10 }, kontrol: "2026-10-25", link: "https://www.isbank.com.tr/ek-hesap",
    link_maasli: "https://www.isbank.com.tr/kampanyalar/maasini-is-bankasindan-alan-musterilerimize-ozel-indirimli-faiz-orani-ile-ek-hesap",
    link_isplus: "https://www.isbank.com.tr/kampanyalar/ek-hesap-faiz-oraninda-indirim-ayricaligi",
    link_black: "https://www.isbank.com.tr/ek-hesap-faiz-oraninda-indirim-ayricaligi", taksit_max: 12, kampanya: null, ekler: [] };
  const VG = 0.30, GUNLER = [[1, "1 gün"], [5, "5 gün"], [10, "10 gün"], [15, "15 gün"], [30, "1 ay"]];
  const f2 = (v) => v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const trh = (d) => new Date(d + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  const bugun = ymd(new Date());
  const gunFark = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5);
  const escB = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const lnk = (u, t) => u ? `<a href="${escB(u)}" target="_blank" rel="noopener">${escB(t)} ↗</a>` : escB(t);
  let oranElle = false, tOranElle = false, vade = 12, secili = null; // secili: hangi düğmeye basıldı (aynı orana sahip düğmelerden yalnızca o yansın)
  // Dönemli oranlar: maaş kampanyası + JSON'dan gelen ek kampanyalar ({ad, oran, bas, bit, url}). Süresi dolan kendiliğinden gizlenir.
  const donemli = () => [EK.maasli && { id: "maasli", ad: "Maaşı İş Bankası'na yatanlar", oran: EK.maasli, bas: EK.maasli_bas, bit: EK.maasli_bit, url: EK.link_maasli }]
    .concat((EK.ekler || []).map((k, i) => ({ id: "ek" + i, ...k }))).filter(Boolean);
  const aktif = (k) => (!k.bas || bugun >= k.bas) && (!k.bit || bugun <= k.bit);
  const kalem = (P, r, g) => { const faiz = P * r / 100 * g / 30, v = faiz * VG; return { faiz, kkdf: faiz * 0.15, bsmv: faiz * 0.15, v, top: faiz + v }; };
  const gunAd = (g) => g === 30 ? "1 ay (30 gün)" : g + " gün";

  function oranlar() {
    const L = [[EK.aylik, "Standart", "std"]];
    donemli().filter(aktif).forEach((k) => L.push([k.oran, k.ad, k.id]));
    const r = num("e_faiz");
    if (secili && !L.some((x) => x[2] === secili && Math.abs(r - x[0]) < 1e-9)) secili = null;
    $("e_oranlar").innerHTML = L.map(([v, ad, id]) => `<button type="button" data-r="${v}" data-id="${id}" class="${Math.abs(r - v) < 1e-9 && (!secili || secili === id) ? "on" : ""}">%${f2(v)}<small>${escB(ad)}</small></button>`).join("");
    $("e_oranlar").querySelectorAll("button").forEach((b) => (b.onclick = () => { $("e_faiz").value = f2(+b.dataset.r); oranElle = true; secili = b.dataset.id; calcEk(); }));
    $("e_oranlarNot") && $("e_oranlarNot").remove();
    const n = document.createElement("div"); n.id = "e_oranlarNot"; n.className = "ekoran";
    const P = [lnk(EK.link, `Standart %${f2(EK.aylik)}`)];
    donemli().filter(aktif).forEach((k) => P.push(lnk(k.url, `${k.ad} %${f2(k.oran)}${k.bit ? ` (son gün ${trh(k.bit)})` : ""}`)));
    if (EK.isplus) P.push(lnk(EK.link_isplus, "İş Plus: " + Object.entries(EK.isplus).map(([a, v]) => `${a} %${f2(v)}`).join(" · ")));
    if (EK.black) P.push(lnk(EK.link_black, `İş Black %${f2(EK.black.Black)} · Black Plus %${f2(EK.black["Black Plus"])}`));
    const biten = donemli().filter((k) => k.bit && bugun > k.bit && gunFark(k.bit, bugun) <= 30);
    n.innerHTML = `<b>Kaynaklar:</b> ${P.join(" · ")}. Bu indirimler taksitli kullanıma geçmez; taksitli için ayrı dönemsel kampanya olabilir.` + biten.map((k) => `<br>⏹️ ${escB(k.ad)} için %${f2(k.oran)} kampanyası sona erdi (son gün ${trh(k.bit)}); artık standart oran geçerli.`).join("");
    $("e_oranlar").after(n);
  }
  function gunler(g) {
    $("e_gunler").innerHTML = GUNLER.map(([v, ad]) => `<button type="button" data-g="${v}" class="${g === v ? "on" : ""}">${ad}</button>`).join("");
    $("e_gunler").querySelectorAll("button").forEach((b) => (b.onclick = () => { $("e_gun").value = b.dataset.g; calcEk(); }));
  }
  let ekOzet = "";
  window.calcEk = function () {
    const P = num("e_tutar"), r = num("e_faiz");
    let g = Math.round(num("e_gun"));
    const asim = g > 30;
    if (g < 1) g = 1; if (g > 30) g = 30;
    oranlar(); gunler(asim ? -1 : g);
    const k = kalem(P, r, g);
    $("e_lbl").textContent = `${gunAd(g)} · ödenecek faiz + vergi`;
    $("e_out").textContent = tl(k.top);
    rows("e_rows", [["Faiz", tl(k.faiz)], ["KKDF (%15)", tl(k.kkdf)], ["BSMV (%15)", tl(k.bsmv)], ["Günlük maliyet", tl(k.top / g)], ["Geri ödenecek toplam", tl(P + k.top), "total"]]);
    const w = $("e_warn");
    w.className = "ekwarn" + (asim ? " hot" : "");
    w.innerHTML = (asim
      ? `<b>⚠️ ${Math.round(num("e_gun"))} gün yazıldı; hesap 30 güne göre gösteriliyor.</b> Bir aydan uzun kullanımda dönem faizi ödenmezse anaparaya eklenir ve faize faiz işler; tutar değişir. Uzun vade için aşağıdaki <b>Taksitli Nakit Avans</b>'a bak.`
      : `<b>⚠️ 1 aydan sonra dikkat:</b> Ek hesap faizi her hesap kesim döneminde tahsil edilir. Dönem faizi ödenmezse faiz anaparaya eklenir, faize de faiz işler; tutar bu hesaptan farklı olabilir.`);
    ekOzet = ozetMetni("BİREYSEL EK HESAP FAİZ ÖZETİ", [[`Kullanılacak tutar: ${tl(P)}`, `Süre: ${gunAd(g)}`, `Aylık faiz oranı: %${f2(r)}`], [`Faiz: ${tl(k.faiz)}`, `KKDF (%15): ${tl(k.kkdf)}`, `BSMV (%15): ${tl(k.bsmv)}`, `Toplam maliyet: ${tl(k.top)}`, `Geri ödenecek toplam: ${tl(P + k.top)}`]]);
    $("e_hapT").textContent = `· ${tl(P)} · %${f2(r)}`;
    $("e_hap").innerHTML = GUNLER.map(([v, ad]) => { const x = kalem(P, r, v); return `<tr class="r${v === g ? " on" : ""}" data-g="${v}"><td>${ad}</td><td>${f2(x.faiz)}</td><td>${f2(x.v)}</td><td>${f2(x.top)} TL</td></tr>`; }).join("");
    $("e_hap").querySelectorAll("tr").forEach((tr) => (tr.onclick = () => { $("e_gun").value = tr.dataset.g; calcEk(); $("e_out").scrollIntoView({ behavior: "smooth", block: "center" }); }));
  };
  let tOzet = "";
  window.calcEkT = function () {
    const P = num("et_tutar"), r = num("et_faiz") / 100, max = EK.taksit_max || 12;
    if (vade > max) vade = max;
    const VD = [2, 3, 4, 6, 9, 12].filter((v) => v <= max);
    $("et_vadeler").innerHTML = VD.map((v) => `<button type="button" data-v="${v}" class="${v === vade ? "on" : ""}">${v} ay</button>`).join("");
    $("et_vadeler").querySelectorAll("button").forEach((b) => (b.onclick = () => { vade = +b.dataset.v; calcEkT(); }));
    const re = r * (1 + VG), n = vade;
    const t = Math.round((re ? P * re / (1 - Math.pow(1 + re, -n)) : P / n) * 100) / 100;
    let kal = P, sF = 0, sV = 0, plan = "";
    for (let i = 1; i <= n; i++) {
      const fz = kal * r, vg = fz * VG, ap = i === n ? kal : t - fz - vg;
      kal = Math.max(0, kal - ap); sF += fz; sV += vg;
      plan += `<tr><td>${i}</td><td>${f2(i === n ? ap + fz + vg : t)}</td><td>${f2(ap)}</td><td>${f2(fz)}</td><td>${f2(vg)}</td><td>${f2(kal)}</td></tr>`;
    }
    const top = t * n;
    $("et_lbl").textContent = `${n} ay · aylık taksit`;
    $("et_out").textContent = tl(t);
    rows("et_rows", [["Toplam geri ödeme", tl(top), "total"], ["Toplam faiz", tl(sF)], ["KKDF + BSMV", tl(sV)], ["Efektif aylık maliyet", "%" + (re * 100).toLocaleString("tr-TR", { maximumFractionDigits: 3 })]]);
    $("et_note").textContent = (P < 500 || P > 600000 ? "⚠️ Taksitli kullanım 500 TL – 600.000 TL arası ve ek hesap limiti kadar. " : "") + "İlk taksit kullanımdan 30 gün sonra (bankaya göre değişir).";
    tOzet = ozetMetni("TAKSİTLİ NAKİT AVANS ÖZETİ (Ek Hesaba bağlı)", [[`Tutar: ${tl(P)}`, `Vade: ${n} ay`, `Aylık faiz oranı: %${f2(r * 100)}`], [`Aylık taksit tutarı: ${tl(t)}`, `Toplam geri ödeme: ${tl(top)}`], [`Toplam faiz: ${tl(sF)}`, `KKDF + BSMV: ${tl(sV)}`, `Efektif aylık maliyet: %${(re * 100).toLocaleString("tr-TR", { maximumFractionDigits: 3 })}`]], "Oran kullanım günü sabitlenir, vade boyunca değişmez.");
    const K = EK.kampanya, kEl = $("et_kamp");
    if (K && bugun >= (K.bas || "") && bugun <= K.bit) { kEl.hidden = false; kEl.href = K.url; kEl.innerHTML = `🎉 <b>${escB(K.ad)}</b> · son gün ${trh(K.bit)}: ${escB(K.oran)} ↗`; } else kEl.hidden = true;
  };
  function src() {
    $("e_src").innerHTML = `Faiz oranı kendiliğinden gelmez; sana uygulanan oranı yaz. Düğmelerdeki oranlar <a href="${EK.link}" target="_blank" rel="noopener">isbank.com.tr</a>'de herkese açık yayımlanan genel oranlardır (son kontrol: ${new Date(EK.kontrol + "T12:00:00").toLocaleDateString("tr-TR")}); kişiye uygulanan oran farklı olabilir. Hesap bilgi amaçlıdır.`;
  }
  const kopya = (id, getT) => $(id).addEventListener("click", () => {
    const t = getT(); if (!t) return; const b = $(id), o = b.textContent;
    const done = () => { b.textContent = "✅ Kopyalandı"; setTimeout(() => (b.textContent = o), 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(notEkle(t)).then(done, () => prompt("Kopyala:", t)); else prompt("Kopyala:", t);
  });
  ozetBagla("e", () => ekOzet); ozetBagla("et", () => tOzet);
  $("e_faiz").addEventListener("input", (e) => { if (e.isTrusted) { oranElle = true; secili = null; } });
  $("et_faiz").addEventListener("input", (e) => { if (e.isTrusted) tOranElle = true; });
  ["e_tutar", "et_tutar"].forEach((id) => $(id).addEventListener("blur", () => { $(id).value = num(id).toLocaleString("tr-TR", { maximumFractionDigits: 2 }); }));
  document.querySelectorAll("#ek input").forEach((e) => e.addEventListener("input", () => (e.id.startsWith("et_") ? calcEkT() : calcEk())));
  // Oran alanı kendiliğinden dolmaz; yukarıdaki düğmeye dokununca ya da elle yazınca hesaplanır
  const uygula = () => { src(); calcEk(); calcEkT(); };
  uygula();
  Ortak.json("data/kredi_oran.json").then((j) => { if (j && j.ek_hesap && j.ek_hesap.aylik) { EK = Object.assign(EK, j.ek_hesap); uygula(); } }).catch(() => {});
})();

// ---------- Faiz oranı girilmeden sonuç yok ----------
// Oran alanı boşken ona bağlı sonuçlar gizlenir, yerine "Faiz oranını gir" notu çıkar; nota dokununca alan açılır.
function fyKontrol() {
  const bos = (id) => !$(id).value.trim();
  document.querySelectorAll("[data-fy]").forEach((el) => el.classList.toggle("fyGizli", el.dataset.fy.split(" ").some(bos)));
  document.querySelectorAll("[data-fymsg]").forEach((el) => (el.hidden = !el.dataset.fymsg.split(" ").some(bos)));
}
["input", "change", "click"].forEach((ev) => document.addEventListener(ev, fyKontrol));
document.querySelectorAll("[data-fymsg]").forEach((el) => el.addEventListener("click", () => {
  const id = el.dataset.fymsg.split(" ").reverse().find((x) => !$(x).value.trim()); if (!id) return;
  const i = $(id); i.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => i.focus({ preventScroll: true }), 250);
}));
fyKontrol();

ozetBagla("b", () => bchOzet); ozetBagla("mv", () => mevOzet); ozetBagla("k", () => kkOzet); ozetBagla("tr", () => trOzet);
$("tr_pdf").addEventListener("click", (e) => trPdf && planPdf(trPdf, e.currentTarget));
// ---------- Sekmeler ----------
function miniGuncelle() { const a = document.querySelector(".tabs button.active"); if (!a) return; $("miniCur").innerHTML = `<i>${a.querySelector("i").textContent}</i><span>${a.querySelector("span").innerHTML.replace(/<br\s*\/?>/gi, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ")}</span>`; }
function menuAc(o) {
  if (o && !$("menuPan").firstChild) { const c = document.querySelector(".stick .tabs").cloneNode(true); c.querySelectorAll("[data-yeni]").forEach((x) => x.removeAttribute("data-yeni")); $("menuPan").appendChild(c); }
  if (o) $("menuPan").querySelectorAll("button[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === document.querySelector(".stick .tabs button.active")?.dataset.tab));
  $("menuPan").classList.toggle("on", o); $("menuOv").classList.toggle("on", o); $("miniBtn").textContent = o ? "Kapat ▴" : "Menü ▾";
}
$("miniBtn").addEventListener("click", () => menuAc(!$("menuPan").classList.contains("on")));
$("menuOv").addEventListener("click", () => menuAc(false));
$("menuPan").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tab]"); if (!b) return;
  menuAc(false); document.querySelector(`.stick .tabs button[data-tab="${b.dataset.tab}"]`).click();
  formaKay();
});
// Hesap seçilince form ekrana gelsin: büyük menü yukarı kayar, üstte ince "Menü ▾" çubuğu kalır, ilk giriş kutusu hemen görünür
function formaKay() {
  const top = document.querySelector(".stick").getBoundingClientRect().bottom + window.scrollY - 34;
  window.scrollTo({ top: Math.max(0, top), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
document.querySelectorAll(".tabs button").forEach((b) => {
  b.addEventListener("click", (e) => {
    if (e.isTrusted && b.closest(".stick")) setTimeout(formaKay, 30);
    document.querySelectorAll(".tabs button").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    $(b.dataset.tab).classList.add("active");
    miniGuncelle();
    try { localStorage.setItem("bankaTab", b.dataset.tab); } catch (e) {}
  });
});
try {
  const t = (location.hash.slice(1) && document.querySelector(`.tabs button[data-tab="${location.hash.slice(1)}"]`)) ? location.hash.slice(1) : localStorage.getItem("bankaTab");
  if (t) document.querySelector(`.tabs button[data-tab="${t}"]`)?.click();
} catch (e) {}
miniGuncelle();
(function () { const B = ["mev", "tk", "ek", "kk", "konut", "tasit"], T = ["bch", "tic", "cek", "tarim"];
  [...B, ...T].forEach((id) => { const h = document.querySelector(`#${id} .card h2`); if (!h) return; const r = document.createElement("span"); r.className = "grp " + (B.includes(id) ? "b" : "t"); r.textContent = B.includes(id) ? "👤 Bireysel" : "🏢 Ticari"; h.parentElement.insertBefore(r, h); }); })();

document.querySelectorAll("#bch input, #bch select").forEach((e) => e.addEventListener("input", calcBCH));
(function () { const t = new Date(); $("t_bas").value = ymd(t); })();
(function () { const t = new Date(); $("m_bas").value = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; })();
document.querySelectorAll("#mev input, #mev select").forEach((e) => e.addEventListener("input", calcMev));
document.querySelectorAll("#tk input, #tk select").forEach((e) => e.addEventListener("input", calcTK));
document.querySelectorAll("#kk input").forEach((e) => e.addEventListener("input", calcKK));
document.querySelectorAll("#konut input, #konut select").forEach((e) => e.addEventListener("input", calcKonut));
$("k2_eksbtn").addEventListener("click", () => {
  eksOn = !eksOn;
  $("k2_eks").classList.toggle("on", eksOn);
  $("k2_eksbody").hidden = !eksOn; $("k2_ekshint").hidden = eksOn;
  $("k2_eksbtn").textContent = eksOn ? "Kapat" : "Ekspertizi başlat";
  calcKonut();
  if (eksOn) setTimeout(() => $("k2_deger").focus(), 50);
});
$("k2s_copy").addEventListener("click", () => {
  if (!k2Summary) return;
  const done = () => { const b = $("k2s_copy"); b.textContent = "✅ Kopyalandı"; setTimeout(() => (b.textContent = "📋 Özeti kopyala"), 1500); };
  if (navigator.clipboard) navigator.clipboard.writeText(notEkle(k2Summary)).then(done, () => prompt("Kopyala:", k2Summary));
  else prompt("Kopyala:", k2Summary);
});
document.querySelectorAll("#tarim input, #tarim select").forEach((e) => e.addEventListener("input", calcTarim));
document.querySelectorAll("#tic input").forEach((e) => e.addEventListener("input", calcTic));
document.querySelectorAll("#tasit input").forEach((e) => e.addEventListener("input", calcTasit));
[["tk", "t"], ["konut", "k2"], ["tic", "tc"]].forEach(([sec, pre]) => document.querySelectorAll(`#${sec} input, #${sec} select`).forEach((e) => { if (e.id !== pre + "_butce") e.addEventListener("input", () => setTimeout(() => vkRender(pre), 0)); }));
calcBCH(); calcMev(); calcTK(); calcKK(); calcKonut(); calcTarim(); calcTic(); calcTasit(); calcCek(); ["t", "k2", "tc"].forEach(vkRender);
