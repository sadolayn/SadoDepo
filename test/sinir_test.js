// Sınır ve olağan dışı değer testleri (22 Kasım 2026): eksi tutar, aşırı oran, kesirli vade, ödenen > borç,
// çek iskontosu (tatil/hafta sonu valörü), kredi planı tutarlılığı, KDV/ÖTV dilim sınırları, Ana sayfa çeyrek iş günü (arife 0,5).
// Çalıştırma: depo kökünde `python3 -m http.server 8799` açıkken  NODE_PATH=$(npm root -g) node test/sinir_test.js
const { chromium } = require("playwright");
const URL = "http://localhost:8799/";
const sayi = (t) => parseFloat(String(t).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
(async () => {
  const b = await chromium.launch(), hatalar = [];
  let kontrol = 0;
  const bak = (ad, kosul, detay) => { kontrol++; if (!kosul) hatalar.push(ad + (detay ? " → " + detay : "")); };
  const yakin = (ad, bulunan, beklenen, tol = 0.005) => bak(ad, Math.abs(bulunan - beklenen) <= tol, `bulunan ${bulunan} · beklenen ${beklenen}`);
  async function sayfa(yol, saat) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
    await ctx.route(/gc\.zgo\.at|firebase|googleapis|gstatic|docs\.google|maximum\.com|overpass|nominatim|open-meteo/, (r) => r.fulfill({ status: 200, body: "" }));
    const p = await ctx.newPage();
    if (saat) await p.clock.setFixedTime(new Date(saat));
    p.on("pageerror", (e) => hatalar.push(`${yol} JS: ${e.message} @ ${(e.stack || "").split("\n")[1]}`));
    await p.goto(URL + yol, { waitUntil: "networkidle" });
    await p.evaluate(() => {
      window.__yaz = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); };
      window.__durum = (id) => { const el = typeof id === "string" ? document.getElementById(id) : id, k = el.closest(".field") || el.parentElement;
        return { hata: el.getAttribute("aria-invalid") === "true", neden: k.dataset.hata || "", uyari: k.classList.contains("sayiUyari") ? k.dataset.uyari || "" : "" }; };
    });
    return p;
  }
  // Bir kutuya değer yaz, durumunu oku, eski değeri geri koy
  async function dene(p, id, v) {
    return p.evaluate(([id, v]) => { const el = document.getElementById(id), eski = el.value; __yaz(id, v); const d = __durum(id); __yaz(id, eski); return d; }, [id, v]);
  }

  // ================= Bankacılık =================
  const p = await sayfa("banka.html");
  const TL = ["b_tutar", "e_tutar", "et_tutar", "m_tutar", "v_min", "t_tutar", "t_ucret", "t_butce", "ao_x", "ys_p", "ta_deger", "ta_noter",
    "k2_tutar", "k2_masraf", "k2_butce", "k2_deger", "tr_tutar", "kh_tutar", "tc_tutar", "tc_butce", "c_lim", "k_borc", "k_odenen"];
  for (const id of TL) { const d = await dene(p, id, "-5000"); bak(`${id}: eksi tutar reddedilmeli`, d.hata && d.neden === "Eksi olamaz", JSON.stringify(d)); }
  { const d = await dene(p, "b_tutar", "200.000.000.000"); bak("b_tutar: 200 milyar reddedilmeli", d.hata && d.neden === "En fazla 100 milyar TL", JSON.stringify(d)); }
  { const d = await dene(p, "t_tutar", "250.000"); bak("t_tutar: normal tutar temiz", !d.hata && !d.uyari, JSON.stringify(d)); }
  for (const id of ["t_vade", "ys_n", "k2_vade", "tr_vade", "tc_vade"]) {
    const s0 = await dene(p, id, "0"), s1 = await dene(p, id, "24,5"), s2 = await dene(p, id, "400"), s3 = await dene(p, id, "-12"), s4 = await dene(p, id, "24");
    bak(`${id}: 0 ay`, s0.hata && s0.neden === "En az 1 ay", JSON.stringify(s0));
    bak(`${id}: 24,5 ay`, s1.hata && s1.neden === "Tam sayı yaz", JSON.stringify(s1));
    bak(`${id}: 400 ay`, s2.hata && s2.neden === "En fazla 360 ay", JSON.stringify(s2));
    bak(`${id}: -12 ay`, s3.hata && s3.neden === "Eksi olamaz", JSON.stringify(s3));
    bak(`${id}: 24 ay temiz`, !s4.hata, JSON.stringify(s4));
  }
  for (const id of ["b_gun", "e_gun", "m_gun", "m2_gun", "k_gun"]) {
    const a = await dene(p, id, "-3"), c = await dene(p, id, "30,5");
    bak(`${id}: eksi gün`, a.hata && a.neden === "Eksi olamaz", JSON.stringify(a));
    bak(`${id}: kesirli gün`, c.hata && c.neden === "Tam sayı yaz", JSON.stringify(c));
  }
  // Taşıt kredisi tutar ve vadeyi BDDK sınırına göre kendisi düzeltir: eksi ya da geçersiz giriş kalmamalı
  for (const [id, v] of [["ta_tutar", "-5000"], ["ta_vade", "-12"], ["ta_vade", "0"], ["ta_vade", "400"], ["ta_vade", "24,5"]]) {
    const r = await p.evaluate(([id, v]) => { const el = document.getElementById(id), eski = el.value; __yaz(id, v); const o = { v: el.value, d: __durum(id) }; __yaz(id, eski); return o; }, [id, v]);
    bak(`${id}=${v}: düzeltilmeli ya da reddedilmeli`, r.d.hata || (r.v !== v && !/^-/.test(r.v)), JSON.stringify(r));
  }
  { const d = await dene(p, "k_gun", "120"); bak("k_gun: 120 gün", d.hata && d.neden === "En fazla 90 gün", JSON.stringify(d)); }
  for (const id of ["e_faiz", "et_faiz", "t_faiz", "ys_r", "ta_faiz", "k2_faiz", "tc_faiz", "k_akdi", "k_gec"]) {
    const n = await dene(p, id, "3,5"), u = await dene(p, id, "12"), h = await dene(p, id, "60"), e = await dene(p, id, "-1");
    bak(`${id}: aylık %3,5 temiz`, !n.hata && !n.uyari, JSON.stringify(n));
    bak(`${id}: aylık %12 uyarı`, !u.hata && u.uyari === "Yıllık oran mı yazdın?", JSON.stringify(u));
    bak(`${id}: aylık %60 hata`, h.hata && h.neden === "En fazla %50", JSON.stringify(h));
    bak(`${id}: eksi faiz`, e.hata && e.neden === "Eksi olamaz", JSON.stringify(e));
  }
  for (const id of ["b_faiz", "m_faiz", "m2_faiz", "tr_faiz", "kh_faiz", "c_faiz"]) {
    const n = await dene(p, id, "45"), u = await dene(p, id, "200"), h = await dene(p, id, "600");
    bak(`${id}: yıllık %45 temiz`, !n.hata && !n.uyari, JSON.stringify(n));
    bak(`${id}: yıllık %200 uyarı`, !u.hata && u.uyari === "Çok yüksek görünüyor", JSON.stringify(u));
    bak(`${id}: yıllık %600 hata`, h.hata && h.neden === "En fazla %500", JSON.stringify(h));
  }
  for (const id of ["b_bsmv", "t_kkdf", "m_stopaj", "c_oran", "k_asg", "k_vergi"]) { const d = await dene(p, id, "120"); bak(`${id}: %120`, d.hata && d.neden === "En fazla %100", JSON.stringify(d)); }
  for (const id of ["t_tahsis", "t_sig"]) { const d = await dene(p, id, "-1"); bak(`${id}: eksi binde`, d.hata && d.neden === "Eksi olamaz", JSON.stringify(d)); }

  // Kredi kartı: eksi ödeme tamamen reddedilir, borçtan fazla ödeme uyarılır
  {
    const r = await p.evaluate(() => {
      __yaz("k_borc", "50.000"); const sonuc = (v) => { __yaz("k_odenen", v); return { out: document.getElementById("k_out").textContent, d: __durum("k_odenen") }; };
      const eksi = sonuc("-5.000"), fazla = sonuc("60.000"), normal = sonuc("5.000"); return { eksi, fazla, normal };
    });
    bak("Kart: eksi ödeme sonucu göstermemeli", r.eksi.out === "–" && r.eksi.d.hata, JSON.stringify(r.eksi));
    bak("Kart: borçtan fazla ödeme uyarısı", !r.fazla.d.hata && r.fazla.d.uyari === "Borçtan fazla · borç kadar sayıldı" && r.fazla.out !== "–", JSON.stringify(r.fazla));
    bak("Kart: normal ödeme temiz ve sonuçlu", !r.normal.d.hata && !r.normal.d.uyari && /\d/.test(r.normal.out), JSON.stringify(r.normal));
  }

  // Çek iskontosu: bağımsız formülle (faiz = tutar × yıllık faiz × (valör − kullandırım + 1) ÷ 360, BSMV %5)
  {
    const cek = (v, t = "100.000") => p.evaluate(([v, t]) => {
      __yaz("c_isl", "2026-12-01"); __yaz("c_faiz", "40"); __yaz("c_oran", "100"); __yaz("c_bsmv", "5"); __yaz("c_kkdf", "0"); __yaz("c_kom", "0"); __yaz("c_lim", "");
      CEKLER.length = 0; CEKLER.push({ t, v }); renderCekList(); calcCek();
      return { out: document.getElementById("c_out").textContent, warn: document.getElementById("c_warn").textContent };
    }, [v, t]);
    const net = (gun) => { const F = 100000 * 0.40 * gun / 360; return 100000 - F - F * 0.05; };
    let r = await cek("2026-12-15"); yakin("Çek: iş günü vadesi (valör 16 Ara, 16 gün)", sayi(r.out), Math.round(net(16) * 100) / 100);
    r = await cek("2026-12-19"); yakin("Çek: cumartesi vadesi (takas 21, valör 22 Ara, 22 gün)", sayi(r.out), Math.round(net(22) * 100) / 100);
    r = await cek("2026-12-31"); yakin("Çek: yılbaşına kayan valör (4 Oca 2027, 35 gün)", sayi(r.out), Math.round(net(35) * 100) / 100);
    bak("Çek: yılbaşı uyarısı", /tatil/.test(r.warn), r.warn);
    r = await cek("2026-12-15", "-1.000"); bak("Çek: eksi tutar hesaba girmemeli", r.out === "–" && /eksi olamaz/.test(r.warn), JSON.stringify(r));
    r = await cek("2026-12-15", "12abc"); bak("Çek: bozuk tutar hesaba girmemeli", r.out === "–" && /tutarı kontrol et/.test(r.warn), JSON.stringify(r));
    r = await cek("2026-12-15", ""); bak("Çek: boş tutar sessiz", r.out === "–" && !/tutarı kontrol et/.test(r.warn), JSON.stringify(r));
  }

  // Tüketici kredisi planı: anapara toplamı = kredi tutarı, son kalan 0, plan içinde NaN yok (faiz 0 dahil)
  {
    let tohum = 7; const rnd = () => ((tohum = (tohum * 16807) % 2147483647) / 2147483647);
    const durumlar = [[100000, 0, 12], [1000, 0.01, 1], [5e6, 6, 36], [250000, 3.49, 24]];
    for (let i = 0; i < 24; i++) durumlar.push([Math.round(1000 + rnd() * 3e6), Math.round(rnd() * 600) / 100, 1 + Math.floor(rnd() * 36)]);
    for (const [tutar, faiz, vade] of durumlar) {
      const plan = await p.evaluate(([tutar, faiz, vade]) => {
        tIlkManual = true; const s = (k, v) => (document.getElementById(k).value = v);
        s("t_tutar", tutar.toLocaleString("tr-TR")); s("t_faiz", String(faiz).replace(".", ",")); s("t_vade", String(vade));
        s("t_bas", "2026-12-01"); s("t_ilk", "2027-01-01"); s("t_bsmv", "15"); s("t_kkdf", "15"); calcTK();
        return [...document.querySelectorAll("#t_plan tr")].slice(1).map((tr) => [...tr.children].map((td) => td.textContent));
      }, [tutar, faiz, vade]);
      const ad = `Kredi ${tutar} TL · %${faiz} · ${vade} ay`, taksitler = plan.slice(0, -1);
      bak(ad + ": taksit sayısı", taksitler.length === vade, `${taksitler.length} satır`);
      bak(ad + ": NaN/Infinity yok", !plan.flat().some((x) => /NaN|Infinity|undefined/.test(x)));
      yakin(ad + ": anapara toplamı", taksitler.reduce((a, r) => a + sayi(r[4]), 0), tutar, 0.05);
      yakin(ad + ": son kalan", sayi(taksitler[taksitler.length - 1][8]), 0, 0.01);
      if (faiz === 0) yakin(ad + ": faizsiz taksit", sayi(taksitler[1] ? taksitler[1][3] : taksitler[0][3]), tutar / vade, 0.02);
    }
  }
  bak("Bankacılık: sayfada NaN/Infinity yazmıyor", await p.evaluate(() => !/NaN|Infinity/.test(document.body.innerText)));
  await p.context().close();

  // ================= Hesaplamalar =================
  const h = await sayfa("hesap.html");
  { const d = await dene(h, "aN", "-45"); bak("aN: ± gün eksi serbest", !d.hata, JSON.stringify(d)); }
  { const d = await dene(h, "yA", "-250"); bak("yA: yüzde sayısı eksi serbest", !d.hata, JSON.stringify(d)); }
  for (const id of ["fP", "vP", "tpP", "tpE", "tpD"]) { const d = await dene(h, id, "-100"); bak(`${id}: eksi tutar`, d.hata && d.neden === "Eksi olamaz", JSON.stringify(d)); }
  { const d = await dene(h, "fG", "30,5"); bak("fG: kesirli gün", d.hata && d.neden === "Tam sayı yaz", JSON.stringify(d)); }
  { const d = await dene(h, "fR", "200"); bak("fR: yıllık %200 uyarı", !d.hata && d.uyari === "Çok yüksek görünüyor", JSON.stringify(d)); }
  { const d = await dene(h, "vO", "220"); bak("vO: ÖTV %220 geçerli", !d.hata, JSON.stringify(d)); }
  { const d = await dene(h, "vO", "1500"); bak("vO: ÖTV %1500 hata", d.hata && d.neden === "En fazla %1.000", JSON.stringify(d)); }
  { const d = await dene(h, "mBoy", "-170"); bak("mBoy: eksi boy", d.hata && d.neden === "Eksi olamaz", JSON.stringify(d)); }
  // KDV / ÖTV sınırları
  const vergi = (cat, dir, P, o) => h.evaluate(([cat, dir, P, o]) => {
    const s = document.getElementById("vCat"); s.value = cat; s.dispatchEvent(new Event("change"));
    document.querySelector(`#vDir button[data-d="${dir}"]`).click();
    if (o != null) __yaz("vO", o);
    __yaz("vP", P); calcV(); return document.getElementById("vOut").textContent;
  }, [cat, dir, P, o]);
  yakin("KDV %20: 120 TL içindeki vergi", sayi(await vergi("kdv", "in", "120")), 20);
  bak("KDV: 0 TL sonuç yok", (await vergi("kdv", "in", "0")) === "–");
  bak("KDV: eksi fiyat sonuç yok", (await vergi("kdv", "in", "-120")) === "–");
  yakin("ÖTV %220 + KDV %20: 384 TL içindeki vergi", sayi(await vergi("elle", "in", "384", "220")), 284);
  yakin("ÖTV %0 elle = yalnız KDV", sayi(await vergi("elle", "in", "120", "0")), 20);
  yakin("Telefon ÖTV dilim sınırı 4.500 (%25)", sayi(await vergi("tel", "ex", "4.500")), 6750);
  yakin("Telefon ÖTV dilim sınırı 4.500,01 (%40)", sayi(await vergi("tel", "ex", "4.500,01")), 7560.02);
  yakin("Telefon ÖTV geri hesap 6.750 → 2.250 vergi", sayi(await vergi("tel", "in", "6.750")), 2250);
  for (const m of [100, 1500, 4499.99, 8999.99, 9000.01, 60000]) { // vergisiz → vergili → vergisiz geri dönüşü tutarlı olmalı
    const G = sayi(await vergi("tel", "ex", m.toLocaleString("tr-TR"))), V = sayi(await vergi("tel", "in", G.toLocaleString("tr-TR")));
    yakin(`Telefon ÖTV gidiş-dönüş (${m} TL)`, G - V, m, 0.02);
  }
  bak("Hesaplamalar: sayfada NaN/Infinity yazmıyor", await h.evaluate(() => !/NaN|Infinity/.test(document.body.innerText)));
  await h.context().close();

  // ================= Ana sayfa: çeyrek iş günü (28 Ekim arifesi 0,5) =================
  const a = await sayfa("index.html", "2026-10-01T09:00:00");
  const cy = await a.evaluate(() => ({ kutu: document.getElementById("cyN").textContent, acilis: (document.getElementById("aclD") || {}).textContent || "" }));
  bak("Ana sayfa çeyrek kutusu 64,5 gün (1 Eki 2026)", cy.kutu.replace(/gün/, "").trim() === "64,5", cy.kutu);
  bak("Açılış kartı da 64,5 diyor", /64,5/.test(cy.acilis), cy.acilis);
  await a.context().close();

  await b.close();
  console.log(`${kontrol} kontrol · ${hatalar.length} hata`);
  hatalar.forEach((x) => console.log("  ✗ " + x));
  process.exit(hatalar.length ? 1 : 0);
})();
