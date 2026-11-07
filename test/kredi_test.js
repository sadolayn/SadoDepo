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
  console.log(`${kontrol} kontrol · ${hatalar.length} fark`); hatalar.slice(0, 30).forEach((h) => console.log("✗ " + h));
  await b.close(); process.exit(hatalar.length ? 1 : 0);
})();
