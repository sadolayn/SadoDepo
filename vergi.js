// vergi.js — Vergi takvimi (Takvim & Ajanda sayfasının "Vergi" sekmesi). Bankacılık sayfasından taşındı.
// Kullanım: Vergi.init({ el: document.getElementById("vergi"), dayInfo: (d) => ({ we, hol, half, name }) })
//   Vergi.events(from, to) → [{k, ic, n, c, both, t, nom, d}] (aylık görünümde nokta koymak için)
window.Vergi = (function () {
  const $ = (x) => document.getElementById(x);
  const R2 = (x) => Math.round(x * 100) / 100;
  const tl = (n) => Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";
  const nfx = (v) => Number(v).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dayDiff = (a, b) => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5);
  const shortD = (d) => d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fdtw = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" });
  function num(id) { const v = String($(id).value || "").trim().replace(/\s/g, ""); const c = v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : (/^\d{1,3}(\.\d{3})+$/.test(v) ? v.replace(/\./g, "") : v); const n = parseFloat(c); return isFinite(n) ? n : 0; }
  function rows(id, list) { $(id).innerHTML = list.map(([k, v, cls]) => `<div class="${cls || ""}"><span>${k}</span><span>${v}</span></div>`).join(""); }
  let dayInfo = (d) => ({ we: d.getDay() === 0 || d.getDay() === 6, hol: false, half: false, name: "" });
  const dayWhy = (d) => { const i = dayInfo(d); return i.hol ? i.name : i.we ? (d.getDay() === 6 ? "Cumartesi" : "Pazar") : i.half ? i.name : ""; };
  const CSS = `
  #vergi .vstick { position: sticky; top: var(--stickH, 0px); z-index: 20; background: var(--card); margin: 0 -14px; padding: 6px 14px 2px; }
  #vergi .vchips { display: flex; gap: 6px; margin-bottom: 10px; }
  #vergi .vchips button { flex: 1; padding: 8px; border-radius: 10px; border: 1px solid var(--line); background: #121212; color: var(--muted); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
  #vergi .vchips button.on { background: var(--accent); color: #000; border-color: var(--accent); }
  .valert { border-radius: 12px; padding: 10px 12px; font-size: 13px; line-height: 1.45; margin-bottom: 10px; }
  .valert.r { background: rgba(224,71,58,.12); border: 1px solid #7a2e28; color: #ffb3aa; }
  .valert.o { background: rgba(224,162,79,.1); border: 1px solid #6b5326; color: #f3d19a; }
  .valert.g { background: rgba(31,111,74,.12); border: 1px solid #1f6f4a; color: #9fe0bf; }
  .vlist { display: grid; gap: 6px; }
  .vit { display: grid; grid-template-columns: 34px 1fr auto; gap: 8px; align-items: center; background: #121212; border: 1px solid var(--line); border-radius: 12px; padding: 9px 10px; cursor: pointer; }
  .vit.sel { border-color: var(--accent); }
  .vit .ic { font-size: 22px; text-align: center; }
  .vit .t { font-weight: 600; font-size: 14px; }
  .vit .s { font-size: 12px; color: var(--muted); margin-top: 1px; }
  .vit .k { text-align: right; font-weight: 800; font-size: 18px; line-height: 1; }
  .vit .k small { display: block; font-size: 10px; font-weight: 500; color: var(--muted); margin-top: 2px; }
  .vit.r .k { color: #ff7a6e; } .vit.o .k { color: #f0b46a; } .vit.n .k { color: var(--ink); }
  .vit .tag { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 6px; margin-left: 4px; vertical-align: 1px; }
  .tag.b { background: rgba(224,162,79,.18); color: #f0c37a; } .tag.t { background: rgba(74,125,255,.18); color: #9db8ff; }
  #vergi .cal .d.vb { box-shadow: inset 0 -3px 0 #e0a24f; font-weight: 700; }
  #vergi .cal .d.vt { box-shadow: inset 0 -3px 0 #4a7dff; font-weight: 700; }
  #vergi .cal .d.vb.vt { box-shadow: inset 0 -3px 0 #e0a24f, inset 0 -6px 0 #4a7dff; }
  #vergi .cal .d.today { outline: 1px solid #fff; }
  #vergi .cal .lg .l7::before { background: #e0a24f; height: 4px; } #vergi .cal .lg .l8::before { background: #4a7dff; height: 4px; }
  .vmsg { width: 100%; box-sizing: border-box; min-height: 110px; background: #121212; color: var(--ink); border: 1px solid var(--line); border-radius: 12px; padding: 10px; font: inherit; font-size: 13px; line-height: 1.45; resize: vertical; }
  #vergi .cal { margin-top: 10px; }
  #vergi .cal .yr { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 8px; }
  @media (min-width: 440px) { #vergi .cal .yr { grid-template-columns: repeat(3, 1fr); } }
  #vergi .cal .mo h3 { margin: 0 0 3px; font-size: 12px; text-align: center; text-transform: capitalize; }
  #vergi .cal .g { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
  #vergi .cal .h { text-align: center; font-size: 8px; color: var(--muted); }
  #vergi .cal .d { position: relative; text-align: center; font-size: 10px; padding: 3px 0; border-radius: 4px; background: #121212; border: 1px solid transparent; cursor: pointer; }
  #vergi .cal .d.out { opacity: .3; }
  #vergi .cal .hls { display: grid; gap: 4px; }
  #vergi .cal .hl { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; background: rgba(224,71,58,.08); border-left: 3px solid #e0473a; padding: 5px 8px; border-radius: 6px; }
  #vergi .cal .hl span { color: var(--muted); white-space: nowrap; }
  #vergi .cal .hl b { font-weight: 600; text-align: right; }
  #vergi .cal .hl.half { background: rgba(224,162,79,.07); border-left-color: #e0a24f; }
  #vergi .cal .d.e { background: transparent; }
  #vergi .cal .d.we { color: #666; background: #0b0b0b; }
  #vergi .cal .d.hol { color: #ff7a6e; background: rgba(224,71,58,.12); }
  #vergi .cal .d.half { color: #f0b46a; background: rgba(224,162,79,.1); }
  #vergi .cal .d.isl { border-color: #4a7dff; }
  #vergi .cal .d.vade { border-color: var(--accent); font-weight: 700; }
  #vergi .cal .d.val { background: #1f6f4a; color: #fff; font-weight: 700; }
  #vergi .cal .d.rng-x::after { content: ""; position: absolute; left: 20%; right: 20%; bottom: 2px; height: 2px; background: rgba(224,162,79,.35); border-radius: 2px; }
  #vergi .cal .lg { display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: 11px; color: var(--muted); margin-top: 10px; justify-content: center; }
  #vergi .cal .lg span::before { content: ""; display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 4px; vertical-align: -1px; }
  #vergi .cal .lg .l1::before { border: 2px solid #4a7dff; } #vergi .cal .lg .l2::before { border: 2px solid var(--accent); }
  #vergi .cal .lg .l3::before { background: #1f6f4a; } #vergi .cal .lg .l4::before { background: rgba(224,71,58,.5); }
  #vergi .cal .lg .l5::before { background: rgba(224,162,79,.4); } #vergi .cal .lg .l6::before { background: #222; }
  #vergi .cal .tip { text-align: center; font-size: 12px; color: var(--ink); min-height: 18px; margin: 0 0 8px; position: sticky; top: var(--stickH, 0px); z-index: 5; background: var(--card); padding: 4px 0; }
  #vergi .rows div { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 9px 0; border-top: 1px solid var(--line); font-size: 14px; }
  #vergi .rows div span:first-child { color: var(--muted); flex: 1 1 auto; min-width: 0; } #vergi .rows div span:last-child { flex: 0 0 auto; text-align: right; white-space: nowrap; }
  #vergi .rows div.total span:last-child { font-weight: 700; } #vergi .rows div.neg span:last-child { color: #ff7a6e; } #vergi .rows div.pos span:last-child { color: #9fe0bf; }
  #vergi .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  #vergi label { display: block; font-size: 13px; color: var(--muted); margin: 10px 0 5px; }
  #vergi .field { position: relative; } #vergi .field input { padding-right: 40px; width: 100%; box-sizing: border-box; }
  #vergi .field .unit { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 13px; }
  #vergi .big { text-align: center; padding: 6px 0 12px; } #vergi .big span { display: block; font-size: 13px; color: var(--muted); } #vergi .big b { font-size: 30px; color: var(--accent); }
  #vergi .hint, #vergi .note { font-size: 13px; color: var(--muted); line-height: 1.4; margin: 0 0 12px; }
  #vergi .tscopy { background: transparent; border: 1px solid var(--accent); color: var(--accent); border-radius: 12px; padding: 10px 14px; font: inherit; font-weight: 700; cursor: pointer; }
  #vergi h2 { margin: 0 0 8px; font-size: 17px; }`;
  const HTML = `
    <div class="card">
      <h2>🧾 Vergi Takvimi</h2>
      <div class="vstick">
      <div class="vchips" id="v_f"><button data-f="all" class="on">Tümü</button><button data-f="b">Bireysel</button><button data-f="t">Ticari</button></div>
      <div id="v_alert"></div>
      </div>
      <div class="vlist" id="v_list"></div>
      <p class="note">Son gün hafta sonu ya da resmi tatile denk gelirse izleyen ilk iş gününe kayar (VUK). Arife günleri öğleden sonra tatildir; ödemeyi sabah yaptırın. Bir vergiye dokun → aşağıda ödeme planı ve kısa bir not hazırlanır.</p>
    </div>
    <div class="card">
      <h2>💳 Ödeme planı</h2>
      <div style="font-size:14px;margin-bottom:8px" id="v_sel">–</div>
      <div class="two">
        <div><label>Vergi tutarı</label><div class="field"><input id="v_tut" type="text" inputmode="decimal" value="10.000"><span class="unit">TL</span></div></div>
        <div><label>Kart taksit sayısı</label><select id="v_tak"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>6</option><option>9</option><option>12</option></select></div>
      </div>
      <div class="two">
        <div><label>Taksit aylık faizi</label><div class="field"><input id="v_fz" type="text" inputmode="decimal" value="0"><span class="unit">%</span></div></div>
        <div><label>Gecikme (son günden sonra)</label><div class="field"><input id="v_gun" type="text" inputmode="numeric" value="30"><span class="unit">gün</span></div></div>
      </div>
      <p class="hint" style="margin-top:6px">Faiz 0 = kampanyalı / faizsiz taksit. Faiz girilirse KKDF ve BSMV (%15+%15) eklenir.</p>
      <div id="v_tk"></div>
      <div class="big" style="margin-top:10px"><span id="v_lbl">Aylık taksit</span><b id="v_out">–</b></div>
      <div class="rows" id="v_rows"></div>
      <label style="margin-top:12px">Kendime not</label>
      <textarea class="vmsg" id="v_msg"></textarea>
      <button type="button" class="tscopy" id="v_copy" style="width:100%;margin-top:8px">📋 Notu kopyala</button>
    </div>
    <div class="card">
      <h2>📅 1 Yıllık Vergi Takvimi</h2>
      <div class="cal" id="v_cal"></div>
      <p class="note">Tarihler Gelir İdaresi vergi takviminin genel düzenine göre hazırlanmıştır; GİB süre uzatımı ilan edebilir, kesin tarih için gib.gov.tr vergi takvimini kontrol edin. Gecikme zammı: aylık %3,7 (13.11.2025 Resmî Gazete), gün bazında hesaplanır.</p>
    </div>
`;
const GZ_AYLIK = 3.7; // gecikme zammı, aylık % (13.11.2025 RG)
function vergiEvents(from, to) {
  const ev = [];
  const add = (y, m, d, o) => {
    const last = new Date(y, m, 0).getDate();
    const nom = new Date(y, m - 1, Math.min(d, last), 12);
    let due = new Date(nom); while (dayInfo(due).we || dayInfo(due).hol) due = addDays(due, 1);
    if (due >= from && due <= to) ev.push({ ...o, nom, d: due });
  };
  for (let y = from.getFullYear(); y <= to.getFullYear(); y++) {
    add(y, 1, 31, { k: "mtv1", ic: "🚗", n: "MTV 1. taksit", c: "b", both: 1, t: "Motorlu Taşıtlar Vergisi, yılın ilk yarısı" });
    add(y, 7, 31, { k: "mtv2", ic: "🚗", n: "MTV 2. taksit", c: "b", both: 1, t: "Motorlu Taşıtlar Vergisi, yılın ikinci yarısı" });
    add(y, 5, 31, { k: "emk1", ic: "🏠", n: "Emlak ve ÇTV 1. taksit", c: "b", both: 1, t: "Emlak vergisi + çevre temizlik vergisi (Mart–Mayıs)" });
    add(y, 11, 30, { k: "emk2", ic: "🏠", n: "Emlak ve ÇTV 2. taksit", c: "b", both: 1, t: "Emlak vergisi + çevre temizlik vergisi (Kasım)" });
    add(y, 3, 31, { k: "gv1", ic: "💼", n: "Yıllık gelir vergisi beyanı + 1. taksit", c: "b", t: "Kira, serbest meslek, ticari kazanç vb. önceki yıl gelirleri" });
    add(y, 7, 31, { k: "gv2", ic: "💼", n: "Yıllık gelir vergisi 2. taksit", c: "b", t: "Mart'ta beyan edilen gelir vergisinin ikinci yarısı" });
    add(y, 2, 28, { k: "bu", ic: "🏪", n: "Basit usul beyanı", c: "t", t: "Basit usule tabi esnafın yıllık beyanı" });
    add(y, 4, 30, { k: "kv", ic: "🏢", n: "Kurumlar vergisi beyan ve ödeme", c: "t", t: "Şirketlerin önceki yıl kurumlar vergisi" });
    add(y, 5, 17, { k: "gec1", ic: "📊", n: "Geçici vergi (1. dönem)", c: "t", t: "Ocak–Mart dönemi geçici vergi beyan ve ödeme" });
    add(y, 8, 17, { k: "gec2", ic: "📊", n: "Geçici vergi (2. dönem)", c: "t", t: "Nisan–Haziran dönemi geçici vergi beyan ve ödeme" });
    add(y, 11, 17, { k: "gec3", ic: "📊", n: "Geçici vergi (3. dönem)", c: "t", t: "Temmuz–Eylül dönemi geçici vergi beyan ve ödeme" });
    for (let m = 1; m <= 12; m++) {
      const pm = AYLAR_TR[(m + 10) % 12];
      add(y, m, 28, { k: "kdv", ic: "🧾", n: "KDV + Muhtasar ve prim hizmet + Damga", c: "t", t: `${pm} dönemi beyan ve ödemeleri` });
      add(y, m, 31, { k: "sgk", ic: "👷", n: "SGK primi + Ba-Bs formları", c: "t", t: `${pm} dönemi SGK prim ödemesi ve Ba-Bs bildirimleri` });
    }
  }
  return ev.sort((a, b) => a.d - b.d);
}
// Kartla ödeme / taksit durumu (İş Bankası kampanya sayfalarındaki son bilgilere göre; kampanyalar dönemseldir)
const VTK = {
  mtv: { def: 3, max: 3, lvl: "g", txt: "🚗 <b>MTV'de taksit var (kampanyalı).</b> Maximum özellikli bireysel kartlarla Ocak/Temmuz dönemlerinde 3 aya varan taksit (Ocak 2026: 750 TL ve üzeri, tüm banka kanalları). gib.gov.tr'de peşin ödenen 2.000 TL ve üzeri MTV sonradan 2–3 taksit faizsiz yapılabildi. Ticari: <b>İş Bankası Vergi Kart</b> ile plaka sınırı olmadan toplu MTV talimatı." },
  emk: { def: 1, max: 12, lvl: "o", txt: "🏠 <b>Emlak ve ÇTV'de taksit kampanyası genelde yok</b>, kartla tek çekim ödenir (ÇTV belediye POS'u üzerinden Vergi Kart ile de ödenebilir). Taksit seçersen standart kart faizi işler." },
  gv: { def: 1, max: 12, lvl: "o", txt: "💼 <b>Gelir vergisinde taksit kampanyaya bağlı</b>; kampanya yoksa kartla tek çekim. Taksit seçersen standart kart faizi işler." },
  tic: { def: 1, max: 4, lvl: "o", txt: "🏢 <b>Ticari vergilerde taksit dönemsel kampanyaya bağlı.</b> İş Bankası ticari kredi kartlarıyla geçmiş kampanyalarda 2–4 ay faizsiz taksit verildi (gib.gov.tr veya banka kanalı, taksitlendirme İşCep / Maximum İşyerim'den). <b>Vergi Kart</b>: tek çekim, ayda iki hesap kesimi (15 ve 28'i). Kampanya yoksa standart oran." },
  sgk: { def: 2, max: 2, lvl: "o", txt: "👷 <b>SGK primi:</b> ticari kartla 5.000 TL ve üzeri ödemeye 2 ay faizsiz taksit kampanyası uygulandı (2025, talep İşCep'ten, hesap kesiminden önce). Kartla SGK ödemesinde <b>%3,10 + BSMV komisyon</b> (en az 4,94 TL + BSMV) alınır; taksit kampanyası komisyonu kapsamaz. SGK'da gecikme cezası ve gecikme zammı ayrı kurallarla hesaplanır; aşağıdaki gecikme tutarı yaklaşıktır." },
};
const vtkOf = (e) => (e.k.startsWith("mtv") ? VTK.mtv : e.k.startsWith("emk") ? VTK.emk : e.k.startsWith("gv") ? VTK.gv : e.k === "sgk" ? VTK.sgk : VTK.tic);
const AYLAR_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
let vFilt = "all", vSel = null;
try { vFilt = localStorage.getItem("v_filt") || "all"; } catch (e) {}
function vToday() { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12); }
function calcVergi() {
  const today = vToday(), end = addDays(today, 365);
  const all = vergiEvents(new Date(today.getFullYear(), today.getMonth(), 1, 12), end);
  const vShow = (e) => vFilt === "all" || e.c === vFilt || (e.both && vFilt === "t");
  const ev = all.filter(vShow);
  document.querySelectorAll("#v_f button").forEach((b) => b.classList.toggle("on", b.dataset.f === vFilt));
  const up = ev.filter((e) => e.d >= today);
  const left = (e) => dayDiff(today, e.d);
  const soon = up.filter((e) => left(e) <= 7);
  $("v_alert").innerHTML = soon.length
    ? `<div class="valert ${soon.some((e) => left(e) <= 3) ? "r" : "o"}">⚠️ <b>${soon.length} vergi</b> için son gün 7 gün içinde: ${soon.map((e) => `${e.ic} ${e.n} (${left(e) === 0 ? "bugün" : left(e) + " gün"})`).join(" · ")}</div>`
    : up.length ? `<div class="valert g">✅ Önümüzdeki 7 günde son günü olan vergi yok. Sıradaki: ${up[0].ic} ${up[0].n} – ${left(up[0])} gün.</div>` : "";
  if (!vSel || !up.some((e) => e.k === vSel.k && +e.d === +vSel.d)) vSel = up[0] || null;
  $("v_list").innerHTML = up.slice(0, 14).map((e, i) => {
    const L = left(e), cl = L <= 3 ? "r" : L <= 7 ? "o" : "n";
    const shifted = +e.nom !== +e.d ? ` · <span style="color:#f0b46a">${shortD(e.nom)} ${dayWhy(e.nom)} → ilk iş günü</span>` : "";
    const half = dayInfo(e.d).half ? ` · <span style="color:#f0b46a">arife, sabah öde</span>` : "";
    return `<div class="vit ${cl}${vSel && e.k === vSel.k && +e.d === +vSel.d ? " sel" : ""}" data-i="${i}">
      <div class="ic">${e.ic}</div>
      <div><div class="t">${e.n}${e.both ? '<span class="tag b">Bireysel</span><span class="tag t">Ticari</span>' : `<span class="tag ${e.c}">${e.c === "b" ? "Bireysel" : "Ticari"}</span>`}</div><div class="s">${fdtw(e.d)} ${e.d.getFullYear()}${shifted}${half}<br>${e.t}</div></div>
      <div class="k">${L === 0 ? "Bugün" : L}<small>${L === 0 ? "son gün" : "gün kaldı"}</small></div></div>`;
  }).join("") || '<div class="note">Bu filtrede yaklaşan vergi yok.</div>';
  $("v_list").onclick = (e) => { const it = e.target.closest(".vit"); if (!it) return; vSel = up[+it.dataset.i]; $("v_tak").value = String(vtkOf(vSel).def); $("v_fz").value = "0"; calcVergi(); $("v_tut").scrollIntoView({ behavior: "smooth", block: "center" }); };
  calcVergiPlan(today);
  renderVergiCal(today, end, all);
}
function calcVergiPlan(today) {
  const e = vSel;
  $("v_sel").innerHTML = e ? `${e.ic} <b>${e.n}</b> · son gün ${fdtw(e.d)} ${e.d.getFullYear()} · <b>${dayDiff(today, e.d)} gün</b> kaldı` : "Listeden bir vergi seç.";
  const T = num("v_tut"), n = Math.max(1, +$("v_tak").value || 1), r = num("v_fz") / 100, g = Math.max(0, Math.round(num("v_gun")));
  if (!T) { $("v_out").textContent = "–"; rows("v_rows", []); $("v_msg").value = ""; return; }
  const i = r * 1.3;
  const taksit = n === 1 ? T : i ? T * i / (1 - Math.pow(1 + i, -n)) : T / n;
  const top = taksit * n, ek = top - T;
  const gz = T * GZ_AYLIK / 100 * g / 30;
  const tk = e ? vtkOf(e) : null;
  $("v_tk").innerHTML = tk ? `<div class="valert ${n > tk.max || (tk.lvl !== "g" && n > 1 && !r) ? "r" : tk.lvl}" style="margin-top:8px">${tk.txt}${n > tk.max ? `<br>⚠️ Seçilen ${n} taksit bu vergi için kampanyalı taksit sayısını (${tk.max}) aşıyor.` : tk.lvl !== "g" && n > 1 && !r ? "<br>⚠️ Aktif kampanya yoksa bu taksit faizsiz olmaz; faiz oranını gir." : ""}<br><a href="https://www.isbank.com.tr/kampanyalar" target="_blank" rel="noopener" style="color:var(--accent)">Güncel kampanyaları kontrol et ↗</a></div>` : "";
  const kom = e && e.k === "sgk" ? Math.max(4.94, T * 0.031) * 1.05 : 0;
  $("v_lbl").textContent = n === 1 ? "Tek çekim" : `${n} taksit · aylık`;
  $("v_out").textContent = tl(taksit);
  rows("v_rows", [
    ["Vergi tutarı", tl(T)],
    ...(kom ? [["Kartla SGK ödeme komisyonu (%3,10 + BSMV)", "+" + tl(kom), "neg"]] : []),
    ...(n > 1 ? [[`Kartla ${n} taksit toplamı`, tl(top)], [r ? "Taksit maliyeti (faiz + KKDF + BSMV)" : "Taksit maliyeti", r ? "+" + tl(ek) : "Faizsiz", r ? "neg" : "pos"]] : []),
    [`Geç öderse: ${g} gün gecikme zammı (aylık %${nfx(GZ_AYLIK)})`, "+" + tl(gz), "neg"],
    [`${g} gün gecikmeyle toplam`, tl(T + gz), "total"],
    ...(r && n > 1 ? [[gz > ek ? "✅ Taksitli ödemek gecikmekten ucuz" : "ℹ️ Bu sürede gecikme zammı taksit maliyetinden düşük", tl(Math.abs(gz - ek)) + " fark"]] : []),
  ]);
  if (e) {
    const L = dayDiff(today, e.d);
    $("v_msg").value = `${e.n} son ödeme: ${fdtw(e.d)} ${e.d.getFullYear()} (${L === 0 ? "bugün" : L + " gün kaldı"}).\n` +
      (n > 1 ? `Kredi kartıyla ${n} taksit → aylık ${tl(taksit)}${r ? "" : " (kampanya varsa faizsiz, kontrol et)"}.\n` : `Ödeme: şube, internet ve mobil bankacılık.\n`) +
      `Son günden sonra aylık %${nfx(GZ_AYLIK)} gecikme zammı.`;
  } else $("v_msg").value = "";
}
function renderVergiCal(today, end, all) {
  const byDay = {};
  all.forEach((e) => { const k = ymd(e.d); (byDay[k] = byDay[k] || []).push(e); });
  const start = new Date(today.getFullYear(), today.getMonth(), 1, 12);
  const months = []; for (let m = new Date(start); m <= end; m = new Date(m.getFullYear(), m.getMonth() + 1, 1, 12)) months.push(new Date(m));
  const html = months.map((m) => {
    const first = (m.getDay() + 6) % 7, dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    let cells = ["P", "S", "Ç", "P", "C", "C", "P"].map((h) => `<div class="h">${h}</div>`).join("");
    for (let i = 0; i < first; i++) cells += `<div class="d e"></div>`;
    for (let dd = 1; dd <= dim; dd++) {
      const d = new Date(m.getFullYear(), m.getMonth(), dd, 12), k = ymd(d), inf = dayInfo(d);
      const evs = (byDay[k] || []).filter((e) => vFilt === "all" || e.c === vFilt || (e.both && vFilt === "t"));
      const out = d < today || d > end;
      const cls = ["d", inf.hol ? "hol" : inf.we ? "we" : inf.half ? "half" : "", evs.some((e) => e.c === "b") ? "vb" : "", evs.some((e) => e.c === "t" || e.both) ? "vt" : "", +d === +today ? "today" : "", out ? "out" : ""].join(" ");
      const tip = [...evs.map((e) => `${e.ic} ${e.n}`), inf.name, !inf.name && inf.we ? (d.getDay() === 6 ? "Cumartesi" : "Pazar") : ""].filter(Boolean).join(" · ");
      cells += `<div class="${cls}" data-tip="${fdtw(d)} ${d.getFullYear()}${tip ? " — " + tip : " — İş günü"}">${dd}</div>`;
    }
    return `<div class="mo"><h3>${m.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</h3><div class="g">${cells}</div></div>`;
  }).join("");
  $("v_cal").innerHTML = `<div class="tip" id="v_tip">Bir güne dokun, o günün vergilerini gör.</div><div class="yr">${html}</div>
    <div class="lg"><span class="l7">Bireysel vergi</span><span class="l8">Ticari vergi</span><span class="l4">Resmi / dini bayram</span><span class="l5">Arife</span><span class="l6">Hafta sonu</span></div>`;
}
  function bagla() {
  $("v_cal").addEventListener("click", (e) => { const d = e.target.closest(".d[data-tip]"); if (d) $("v_tip").textContent = d.dataset.tip; });
$("v_f").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; vFilt = b.dataset.f; try { localStorage.setItem("v_filt", vFilt); } catch (er) {} vSel = null; calcVergi(); });
["v_tut", "v_tak", "v_fz", "v_gun"].forEach((x) => $(x).addEventListener("input", () => calcVergiPlan(vToday())));
$("v_tut").addEventListener("blur", () => { $("v_tut").value = num("v_tut").toLocaleString("tr-TR", { maximumFractionDigits: 2 }); });
$("v_copy").addEventListener("click", () => {
  const t = $("v_msg").value; if (!t) return;
  const done = () => { const b = $("v_copy"); b.textContent = "✅ Kopyalandı"; setTimeout(() => (b.textContent = "📋 Notu kopyala"), 1500); };
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, () => prompt("Kopyala:", t)); else prompt("Kopyala:", t);
});

  }
  function init(o) {
    if (o && o.dayInfo) dayInfo = o.dayInfo;
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    o.el.innerHTML = HTML;
    bagla(); calcVergi();
  }
  return { init, events: vergiEvents, calc: () => calcVergi() };
})();
