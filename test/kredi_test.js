// Bankacılık hesaplayıcısını bankanın ödeme planı örneklerine karşı kuruşu kuruşuna kontrol eder.
// Çalıştırma: depo kökünde `python3 -m http.server 8799` açıkken  NODE_PATH=$(npm root -g) node test/kredi_test.js
const { chromium } = require("playwright");
const ORN = require("./kredi_ornekleri.json");
const sayi = (t) => parseFloat(String(t).replace(/\./g, "").replace(",", "."));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext();
  await ctx.route(/gc\.zgo\.at|firebase|googleapis|gstatic|docs\.google/, (r) => r.fulfill({ status: 200, body: "" }));
  const p = await ctx.newPage(); const hatalar = []; p.on("pageerror", (e) => hatalar.push("JS: " + e.message));
  await p.goto("http://localhost:8799/banka.html", { waitUntil: "networkidle" });
  let kontrol = 0;
  const esit = (ad, bulunan, beklenen) => { kontrol++; if (Math.abs(bulunan - beklenen) > 0.005) hatalar.push(`${ad}: site ${bulunan.toFixed(2)} · banka ${beklenen.toFixed(2)}`); };
  for (const o of ORN.tuketici) {
    const g = o.girdi;
    const plan = await p.evaluate((g) => {
      tIlkManual = true; const s = (k, v) => (document.getElementById(k).value = v);
      s("t_tutar", g.tutar.toLocaleString("tr-TR")); s("t_faiz", String(g.faiz).replace(".", ",")); s("t_vade", String(g.vade));
      s("t_bas", g.bas); s("t_ilk", g.ilk); s("t_bsmv", String(g.bsmv)); s("t_kkdf", String(g.kkdf)); calcTK();
      return [...document.querySelectorAll("#t_plan tr")].slice(1).map((tr) => [...tr.children].map((td) => td.textContent));
    }, g);
    // sütunlar: # · tarih · gün · taksit · anapara · faiz · KKDF · BSMV · kalan
    const r1 = plan[0], s1 = o.satir1;
    esit(o.ad + " · 1. gün", +r1[2], s1.gun);
    [["taksit", 3], ["anapara", 4], ["faiz", 5], ["fon", 6], ["vergi", 7], ["kalan", 8]].forEach(([k, i]) => esit(`${o.ad} · 1. ${k}`, sayi(r1[i]), s1[k]));
    ORN.tuketici_ortak_satirlar.satirlar.forEach(([an, fz, fon, kal], j) => {
      const r = plan[j + 1], no = j + 2;
      esit(`${o.ad} · ${no}. taksit`, sayi(r[3]), ORN.tuketici_ortak_satirlar.taksit); esit(`${o.ad} · ${no}. anapara`, sayi(r[4]), an);
      esit(`${o.ad} · ${no}. faiz`, sayi(r[5]), fz); esit(`${o.ad} · ${no}. fon`, sayi(r[6]), fon); esit(`${o.ad} · ${no}. vergi`, sayi(r[7]), fon); esit(`${o.ad} · ${no}. kalan`, sayi(r[8]), kal);
    });
    const top = plan[plan.length - 1];
    esit(o.ad + " · toplam geri", sayi(top[3]), o.toplam.geri); esit(o.ad + " · toplam faiz", sayi(top[5]), o.toplam.faiz);
    esit(o.ad + " · toplam fon", sayi(top[6]), o.toplam.fon); esit(o.ad + " · toplam vergi", sayi(top[7]), o.toplam.vergi);
  }
  for (const o of ORN.konut || []) {
    const g = o.girdi;
    const plan = await p.evaluate((g) => {
      dManual.k2 = true; eksOn = false; const s = (k, v) => (document.getElementById(k).value = v);
      s("k2_tutar", g.tutar.toLocaleString("tr-TR")); s("k2_faiz", String(g.faiz).replace(".", ",")); s("k2_vade", String(g.vade));
      s("k2_bas", g.bas); s("k2_ilk", g.ilk); calcKonut();
      return [...document.querySelectorAll("#k2_mplan tr")].slice(1).map((tr) => [...tr.children].map((td) => td.textContent));
    }, g);
    // sütunlar: # · tarih · gün · taksit · anapara · faiz · kalan
    const s1 = o.satir1, r1 = plan[0];
    esit(o.ad + " · 1. gün", +r1[2], s1.gun);
    [["taksit", 3], ["anapara", 4], ["faiz", 5], ["kalan", 6]].forEach(([k, i]) => esit(`${o.ad} · 1. ${k}`, sayi(r1[i]), s1[k]));
    ORN.konut_ortak_satirlar.satirlar.forEach(([an, fz, kal], j) => { const r = plan[j + 1], no = j + 2;
      esit(`${o.ad} · ${no}. taksit`, sayi(r[3]), ORN.konut_ortak_satirlar.taksit); esit(`${o.ad} · ${no}. anapara`, sayi(r[4]), an); esit(`${o.ad} · ${no}. faiz`, sayi(r[5]), fz); esit(`${o.ad} · ${no}. kalan`, sayi(r[6]), kal); });
    const top = plan[plan.length - 1];
    esit(o.ad + " · toplam geri", sayi(top[3]), o.toplam.geri); esit(o.ad + " · toplam faiz", sayi(top[5]), o.toplam.faiz);
  }
  for (const o of ORN.ticari || []) {
    const g = o.girdi;
    const plan = await p.evaluate((g) => {
      tcIlkManual = true; const s = (k, v) => (document.getElementById(k).value = v);
      s("tc_tutar", g.tutar.toLocaleString("tr-TR")); s("tc_faiz", String(g.faiz).replace(".", ",")); s("tc_vade", String(g.vade));
      s("tc_bas", g.bas); s("tc_ilk", g.ilk); s("tc_bsmv", String(g.bsmv)); s("tc_kkdf", String(g.kkdf)); calcTic();
      return { T: document.getElementById("tc_out").textContent, rows: [...document.querySelectorAll("#tc_plan tr")].slice(1).map((tr) => [...tr.children].map((td) => td.textContent)) };
    }, g);
    // sütunlar: sıra · vade · gün · anapara · faiz · fon · vergi · taksit · kalan
    esit(o.ad + " · taksit tutarı", sayi(plan.T.replace(/[^0-9.,]/g, "")), o.taksit);
    o.satirlar.forEach(([tarih, an, fz, vg, kal], j) => { const r = plan.rows[j], no = j + 1, t = tarih.split("-").reverse().join(".");
      kontrol++; if (r[1] !== t) hatalar.push(`${o.ad} · ${no}. vade: site ${r[1]} · banka ${t}`);
      esit(`${o.ad} · ${no}. anapara`, sayi(r[3]), an); esit(`${o.ad} · ${no}. faiz`, sayi(r[4]), fz); esit(`${o.ad} · ${no}. vergi`, sayi(r[6]), vg);
      esit(`${o.ad} · ${no}. taksit`, sayi(r[7]), j === o.satirlar.length - 1 ? o.son_taksit : o.taksit); esit(`${o.ad} · ${no}. kalan`, sayi(r[8]), kal); });
    const top = plan.rows[plan.rows.length - 1];
    esit(o.ad + " · toplam faiz", sayi(top[4]), o.toplam.faiz); esit(o.ad + " · toplam vergi", sayi(top[6]), o.toplam.vergi); esit(o.ad + " · toplam geri", sayi(top[7]), o.toplam.geri);
  }
  console.log(`${kontrol} kontrol · ${hatalar.length} fark`); hatalar.slice(0, 30).forEach((h) => console.log("✗ " + h));
  await b.close(); process.exit(hatalar.length ? 1 : 0);
})();
