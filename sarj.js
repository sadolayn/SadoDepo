/* Elektrikli araç şarjı — Hesaplamalar › Şarj (8 Kasım 2026, yeniden tasarım)
   Bölümler: ⚡ Şarj (maliyet/süre) · 🛣️ Yolculuk (varışta kalan) · 🔋 V2L (araçtan cihaz) · 💰 Yıllık (benzinliye göre).
   Hazır araçlar yalnızca değerleri resmî ya da açık bir kaynakta net olan modeller (Kia Niro EV, Togg T10X, BYD Atto 3,
   Tesla Model Y Standart); tüketim = batarya ÷ WLTP menzil (batarya tarafı; üreticilerin kWh/100 km değeri prizden ölçülür,
   şarj kaybını içerir — burada kayıp ayrıca eklenir). DC ortalama hızı her model için üreticinin verdiği şarj süresinden
   (dcOrt). Fiyatlar kullanıcıdan gelir, sitede hazır fiyat yazılmaz. Bütün girişler yalnızca bu cihazda (sarj_v1). */
(function () {
  if (!document.getElementById("sarj")) return;
  const $ = (id) => document.getElementById(id);
  const oku = (id) => Sayi.oku($(id)).n;
  const nf = (n, d = 1) => (isFinite(n) ? n.toLocaleString("tr-TR", { maximumFractionDigits: d }) : "–");
  const tl = (n) => (isFinite(n) ? n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL" : "–");
  const tl0 = (n) => (isFinite(n) ? Math.round(n).toLocaleString("tr-TR") + " TL" : "–");
  const sure = (saat) => {
    if (!isFinite(saat) || saat < 0) return "–";
    if (saat >= 48) { const g = Math.floor(saat / 24), sa = Math.round(saat - g * 24); return "≈ " + g + " gün" + (sa ? " " + sa + " sa" : ""); } // V2L'de küçük cihazlar günlerce çalışır
    const dk = Math.round(saat * 60); if (dk < 60) return dk + " dk"; return Math.floor(dk / 60) + " sa" + (dk % 60 ? " " + (dk % 60) + " dk" : "");
  };
  const tr = (x) => String(x).replace(".", ",");
  const kis = (a, lo, hi) => Math.min(hi, Math.max(lo, a));
  const satir = (id, L) => ($(id).innerHTML = L.filter(Boolean).map(([k, v, c]) => `<div${c ? ` class="${c}"` : ""}><span>${k}</span><b>${v}</b></div>`).join(""));

  const ARAC = {
    niro: { ad: "Kia Niro EV", ik: "🚙", bat: 64.8, menzil: 460, ac: 11, dc: 73, dcOrt: 0.83,
      kaynak: "Kia Türkiye teknik özellikleri: 64,8 kWh, WLTP 460 km, AC 11 kW, DC en çok 73 kW (%10–80: 45 dk)." },
    toggS: { ad: "Togg T10X Standart Menzil", ik: "🚘", bat: 52.4, menzil: 314, ac: 11, dc: 180, dcOrt: 0.37,
      kaynak: "Togg T10X RWD Standart Menzil: 52,4 kWh, WLTP 314 km, AC 11 kW, DC en çok 180 kW (%20–80: 28 dk)." },
    toggU: { ad: "Togg T10X Uzun Menzil", ik: "🚘", bat: 88.5, menzil: 523, ac: 11, dc: 180, dcOrt: 0.63,
      kaynak: "Togg T10X RWD Uzun Menzil: 88,5 kWh, WLTP 523 km, AC 11 kW (22 kW seçeneği de var), DC en çok 180 kW (%20–80: 28 dk)." },
    atto3: { ad: "BYD Atto 3", ik: "🚙", bat: 60.4, menzil: 420, ac: 11, dc: 110, dcOrt: 0.59,
      kaynak: "BYD Türkiye teknik broşürü: 60,4 kWh, AC 11 kW, DC en çok 110 kW (%30–80: 28 dk); WLTP 420 km." },
    teslaY: { ad: "Tesla Model Y Standart", ik: "🚗", bat: 60, menzil: 534, ac: 11, dc: 175, dcOrt: 0.67,
      kaynak: "Tesla Model Y Standart (arkadan itiş): yaklaşık 60 kWh net, WLTP 534 km, AC 11 kW, DC en çok 175 kW (15 dk'da ≈ 260 km). Kaynaklar arasında küçük farklar var; aracının değerleriyle kontrol et." },
  };
  Object.values(ARAC).forEach((a) => (a.tuk = Math.round(a.bat / a.menzil * 1000) / 10));
  const KAYIP = { ac: 0.12, dc: 0.05 }; // şebekeden/istasyondan çekilenin bataryaya girmeyen payı (yaklaşık)
  const DC_UST = 0.35; // %80 üstünde DC güç belirgin düşer
  const GUCLER = { ev: [2.3, 7.4, 11], ac: [11, 22], dc: [50, 120, 180] };
  const GUC_AD = { 2.3: "Normal priz", 7.4: "Duvar ünitesi", 11: "Duvar ünitesi" };

  // ---- kalıcılık
  const ALAN = ["sjBat", "sjTuk", "sjAcMax", "sjDcMax", "sjNow", "sjHedef", "sjGuc", "sjKm", "sjYNow", "sjEk", "sjMin", "sjLt", "sjYakit", "sjW", "sjSaat", "sjVNow", "sjVMin", "sjYilKm", "sjEvPay", "sjYilEk"];
  let D = {}; try { D = JSON.parse(localStorage.getItem("sarj_v1") || "{}") || {}; } catch (e) {}
  D.fiyat = D.fiyat || {}; D.guc = D.guc || {}; D.cihaz = D.cihaz || null;
  const kaydet = () => { ALAN.forEach((k) => (D[k] = $(k).value)); try { localStorage.setItem("sarj_v1", JSON.stringify(D)); } catch (e) {} };
  // kayıtlı değerler geri yazılır; kaydırıcılara sayı olarak (önceki sürüm "15.000" gibi metin saklamış olabilir)
  ALAN.forEach((k) => { if (D[k] == null || D[k] === "") return; const el = $(k); el.value = el.type === "range" ? String(Sayi.coz(D[k]).n) : D[k]; });

  let mod = D.mod || "sarj", yer = D.yer || "ev";
  const dcOrt = () => (ARAC[D.arac] && ARAC[D.arac].dcOrt) || 0.6;
  const aracYaz = (k) => { const a = ARAC[k]; if (!a) return; $("sjBat").value = tr(a.bat); $("sjTuk").value = tr(a.tuk); $("sjAcMax").value = tr(a.ac); $("sjDcMax").value = tr(a.dc); };
  if (!$("sjBat").value) aracYaz("niro");

  // ---- araç
  function aracBelirle() {
    const k = Object.keys(ARAC).find((x) => { const a = ARAC[x]; return oku("sjBat") === a.bat && oku("sjTuk") === a.tuk && oku("sjAcMax") === a.ac && oku("sjDcMax") === a.dc; });
    D.arac = k || "diger";
    const bat = oku("sjBat"), tuk = oku("sjTuk");
    $("sjAracAd").textContent = k ? ARAC[k].ad : "Kendi aracım";
    $("sjAracOz").textContent = bat > 0 && tuk > 0 ? `${nf(bat)} kWh · menzil ≈ ${nf(bat / tuk * 100, 0)} km` : "değerlerini yazmak için dokun";
    document.querySelector("#sjAracBtn .sjHAracIc").textContent = k ? ARAC[k].ik : "✏️";
    $("sjAraclar").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.a === D.arac));
    $("sjAracNot").textContent = k ? ARAC[k].kaynak + " Tüketim WLTP menzilinden hesaplandı; aracının ekranındaki kendi ortalamanı yazarsan sonuç sana daha yakın olur." : "Kendi aracının kullanılabilir batarya kapasitesini, ortalama tüketimini ve en yüksek şarj güçlerini yaz; bu cihazda saklanır.";
  }
  const enUzun = Math.max(...Object.values(ARAC).map((a) => a.menzil));
  $("sjAraclar").innerHTML = Object.keys(ARAC).map((k) => { const a = ARAC[k];
    return `<button type="button" data-a="${k}"><span class="ik">${a.ik}</span><span class="ad"><b>${a.ad}</b><small>${nf(a.bat)} kWh · DC ${a.dc} kW</small><i class="men"><i style="width:${Math.round(a.menzil / enUzun * 100)}%"></i></i></span><span class="km">${a.menzil}<small>km</small></span></button>`; }).join("")
    + `<button type="button" data-a="diger"><span class="ik">✏️</span><span class="ad"><b>Kendi aracım</b><small>listede yoksa değerleri yaz</small></span><span class="km">›</span></button>`;
  const shAc = (ac) => { $("sjSh").hidden = !ac; document.documentElement.classList.toggle("sjShAcik", ac); $("sjMini").classList.remove("on"); if (ac) { aracBelirle(); $("sjDuzD").open = D.arac === "diger"; } };
  $("sjAracBtn").addEventListener("click", () => shAc(true));
  $("sjShX").addEventListener("click", () => shAc(false)); $("sjShTamam").addEventListener("click", () => shAc(false));
  $("sjSh").addEventListener("click", (e) => { if (e.target === $("sjSh")) shAc(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("sjSh").hidden) shAc(false); });
  $("sjAraclar").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-a]"); if (!b) return;
    if (ARAC[b.dataset.a]) { aracYaz(b.dataset.a); hesapla(); kaydet(); setTimeout(() => shAc(false), 180); }
    else { ["sjBat", "sjTuk", "sjAcMax", "sjDcMax"].forEach((x) => ($(x).value = "")); $("sjDuzD").open = true; hesapla(); kaydet(); setTimeout(() => $("sjBat").focus(), 60); }
  });

  // ---- görsel yardımcılar
  const bar = (a, b, renk, yazi) => {
    const lo = kis(Math.min(a, b), 0, 100), hi = kis(Math.max(a, b), 0, 100);
    $("sjBarA").style.width = lo + "%"; $("sjBarB").style.left = lo + "%"; $("sjBarB").style.width = (hi - lo) + "%";
    $("sjBarB").className = renk || ""; $("sjBatYazi").textContent = yazi || "";
  };
  const cip = (L) => ($("sjCip").innerHTML = L.filter(Boolean).map((x) => `<span>${x}</span>`).join(""));
  const ust = (t1L, t1, t1b, t2L, t2, t2b) => { $("sjT1L").textContent = t1L; $("sjT1").textContent = t1; $("sjT1b").textContent = t1b || ""; $("sjT2L").textContent = t2L; $("sjT2").textContent = t2; $("sjT2b").textContent = t2b || ""; $("sjM1").textContent = t1 + " · " + t2; $("sjM2").textContent = t1L; };
  const uyar = (m) => { $("sjWarn").hidden = !m; $("sjWarn").textContent = m || ""; };
  const kaydirici = () => document.querySelectorAll("#sarj input[type=range]").forEach((r) => { // dolu kısım rengi + değer yazısı
    const p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty("--p", p + "%");
    const o = $(r.id + "O"); if (!o) return;
    const v = +r.value; o.textContent = r.id === "sjKm" ? v + " km" : r.id === "sjYilKm" ? v.toLocaleString("tr-TR") + " km" : r.id === "sjSaat" ? tr(v) + " sa" : "%" + v;
  });
  const pilSec = (id, v) => $(id).querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.v === +v));

  // ---- ⚡ Şarj
  const fiyatAd = { ev: "Evdeki elektrik fiyatı", ac: "AC istasyon fiyatı", dc: "DC istasyon fiyatı" };
  function yerCiz() {
    $("sjYer").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.y === yer));
    ["ev", "ac", "dc"].forEach((y) => ($("sjYer" + y[0].toUpperCase() + y.slice(1)).textContent = tr(D.guc[y] || GUCLER[y][GUCLER[y].length - (y === "dc" ? 2 : 1)]) + " kW"));
    const g = oku("sjGuc"), L = GUCLER[yer];
    $("sjGucPil").innerHTML = L.map((k) => `<button data-k="${k}" class="${Math.abs(k - g) < 0.01 ? "on" : ""}">${tr(k)} kW${yer === "ev" ? `<small>${GUC_AD[k]}</small>` : ""}</button>`).join("") + `<button data-k="el" class="${L.some((k) => Math.abs(k - g) < 0.01) ? "" : "on"}">✏️ Diğer</button>`;
    $("sjFiyatL").textContent = fiyatAd[yer]; $("sjFiyat").value = D.fiyat[yer] || "";
  }
  function hesapSarj() {
    const bat = oku("sjBat"), tuk = oku("sjTuk"), now = +$("sjNow").value, hed = +$("sjHedef").value, guc = oku("sjGuc"), fiyat = oku("sjFiyat");
    const dc = yer === "dc", arMax = dc ? oku("sjDcMax") : oku("sjAcMax");
    pilSec("sjHedefC", hed);
    bar(now, hed, "dolum", `%${now} → %${hed}`);
    if (!(bat > 0) || !(guc > 0) || !(arMax > 0) || hed <= now) {
      ust("Ödeyeceğin", "–", "", "Süre", "–"); cip([]); satir("sjRows", []);
      uyar(hed <= now ? "Hedef şarj, şu anki şarjdan yüksek olmalı." : !(bat > 0) ? "Araç değerlerini gir: üstteki araç kartına dokun." : ""); return;
    }
    uyar("");
    const P = Math.min(guc, arMax), eBat = bat * (hed - now) / 100, eSeb = eBat / (1 - KAYIP[dc ? "dc" : "ac"]);
    let saat;
    if (dc) { const alt = Math.min(hed, 80) - now, ustP = Math.max(0, hed - Math.max(now, 80)); saat = (bat * Math.max(0, alt) / 100) / (P * dcOrt()) + (bat * ustP / 100) / (P * DC_UST); }
    else saat = eSeb / P * (hed > 90 ? 1.05 : 1); // %90 üstünde AC de biraz yavaşlar (Kia: %10–100, 11 kW'ta ≈ 6 sa 20 dk)
    const km = tuk > 0 ? eBat / tuk * 100 : NaN, tutar = fiyat > 0 ? eSeb * fiyat : NaN, yuzKm = tuk > 0 && fiyat > 0 ? tuk / (1 - KAYIP[dc ? "dc" : "ac"]) * fiyat : NaN;
    const bitis = new Date(Date.now() + saat * 3600e3), ertesi = bitis.toDateString() !== new Date().toDateString();
    ust("Ödeyeceğin", fiyat > 0 ? tl(tutar) : "–", fiyat > 0 ? "" : "fiyatı aşağıya yaz", "Süre", sure(saat), "⏰ " + bitis.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) + (ertesi ? " (yarın)" : "") + "'de biter");
    cip([`🛣️ +${nf(km, 0)} km`, `⚡ ${nf(eBat)} kWh`, isFinite(yuzKm) ? `💵 100 km ${tl0(yuzKm)}` : null]);
    satir("sjRows", [
      ["Bataryaya girecek enerji", nf(eBat) + " kWh"],
      [dc ? "İstasyondan çekilecek (kayıp dahil)" : "Şebekeden çekilecek (kayıp dahil)", nf(eSeb) + " kWh"],
      ["Kazanılan menzil", "≈ " + nf(km, 0) + " km"],
      ["Şarj gücü", `${nf(P)} kW` + (guc > arMax ? ` <small>(araç en çok ${nf(arMax)} kW alır)</small>` : "")],
      isFinite(yuzKm) ? ["100 km maliyeti", tl(yuzKm), "toplam"] : null,
      isFinite(yuzKm) ? ["1 km maliyeti", tl(yuzKm / 100)] : null,
    ]);
    if (dc && hed > 80) uyar(`%80'den sonra DC şarj belirgin yavaşlar: son %${hed - Math.max(now, 80)} için yaklaşık ${sure((bat * (hed - Math.max(now, 80)) / 100) / (P * DC_UST))} gider. Yolculukta %80'de çıkıp devam etmek genelde daha hızlıdır.`);
    $("sjNote").textContent = "Süre ve kayıp yaklaşıktır: hava sıcaklığı, bataryanın ısısı ve istasyonun o anki gücü süreyi değiştirir. İstasyonlar genelde istasyondan çekilen kWh üzerinden ücretlendirir; kesin tutar için istasyonun uygulamasına bak.";
  }

  // ---- 🛣️ Yolculuk
  function hesapYol() {
    const bat = oku("sjBat"), tuk = oku("sjTuk"), km = +$("sjKm").value, now = +$("sjYNow").value, ek = +$("sjEk").value || 0, min = +$("sjMin").value || 0;
    const fEv = Sayi.coz(D.fiyat.ev || "").n, fDc = Sayi.coz(D.fiyat.dc || "").n, lt = oku("sjLt"), yakit = oku("sjYakit");
    pilSec("sjEkC", ek); pilSec("sjMinC", min);
    $("sjYolA").textContent = "%" + now; $("sjYolKmY").textContent = km + " km";
    if (!(bat > 0) || !(tuk > 0)) { ust("Varışta kalan", "–", "", "Harcanacak", "–"); cip([]); satir("sjYRows", []); bar(0, 0); uyar("Araç değerlerini gir: üstteki araç kartına dokun."); return; }
    const t = tuk * (1 + ek / 100), e = km * t / 100, kalan = now - e / bat * 100, yolMenzil = Math.max(0, bat * (now - min) / 100 / t * 100);
    const yeter = kalan >= min;
    $("sjYolB").textContent = kalan >= 0 ? "%" + Math.round(kalan) : "–"; $("sjYolB").className = yeter ? "" : "az";
    const oran = kis(yolMenzil / km, 0, 1); $("sjYolDolu").style.width = oran * 100 + "%"; $("sjYolDolu").className = yeter ? "" : "az";
    $("sjYolArac").style.left = `calc(${Math.min(oran, 1) * 100}% - 12px)`;
    bar(Math.max(0, kalan), now, yeter ? "harcama" : "harcama az", `%${now} → ${kalan >= 0 ? "%" + Math.round(kalan) : "yetmez"}`);
    let durak = 0, durakSure = 0;
    if (!yeter) { const eksik = (min - kalan) / 100 * bat; durak = Math.ceil(eksik / (bat * 0.7)); durakSure = eksik / ((oku("sjDcMax") || 50) * dcOrt()); }
    const evMal = fEv > 0 ? e / (1 - KAYIP.ac) * fEv : NaN, benzin = lt > 0 && yakit > 0 ? km * lt / 100 * yakit : NaN;
    ust("Varışta kalan", kalan >= 0 ? "%" + Math.round(kalan) : "Yetmez", yeter ? `≈ ${nf(Math.max(0, kalan) / 100 * bat / t * 100, 0)} km daha gider` : `🔌 yolda ${durak} kez DC şarj`, "Yolculuğun enerjisi", isFinite(evMal) ? tl0(evMal) : nf(e) + " kWh", isFinite(evMal) ? `evde şarjla · km ${tl(evMal / km)}` : `${nf(t)} kWh/100 km`);
    cip([`🔋 ${nf(e)} kWh`, `🛣️ bu şarjla ≈ ${nf(yolMenzil, 0)} km`, durak ? `⏱️ şarj ≈ ${sure(durakSure)}` : null]);
    satir("sjYRows", [
      ["Bu şarjla gidilebilecek yol", `≈ ${nf(yolMenzil, 0)} km <small>(%${min} kalana kadar)</small>`],
      ["Tam dolu menzil (bu koşulda)", `≈ ${nf(bat / t * 100, 0)} km`],
      durak ? ["Yolda DC şarj", `${durak} durak · ≈ ${sure(durakSure)}`, "uyari"] : null,
      isFinite(evMal) ? ["Evde şarjla enerji", tl(evMal), "toplam"] : ["Evde şarjla maliyet", "<small>⚡ Şarj bölümünde ev fiyatını yaz</small>"],
      fDc > 0 ? ["Hepsi DC istasyonda olsaydı", tl(e / (1 - KAYIP.dc) * fDc)] : null,
      isFinite(benzin) ? ["⛽ Benzinli araçla aynı yol", tl(benzin)] : null,
      isFinite(benzin) && isFinite(evMal) ? [benzin >= evMal ? "Fark (elektrik lehine)" : "Fark (benzin lehine)", tl(Math.abs(benzin - evMal)), "toplam"] : null,
    ]);
    uyar(yeter ? "" : `Bu yolculuk için şarj yetmiyor: varışta %${min} kalması için yaklaşık ${nf((min - kalan) / 100 * bat)} kWh eklemen gerekir.`);
    $("sjNote").textContent = "Tüketim hıza, havaya, yüke ve klimaya göre değişir; yol ve hava payları tahminidir. En doğru sonuç için aracının ekranındaki kendi ortalamanı yaz.";
  }

  // ---- 🔋 V2L
  function hesapV2l() {
    const bat = oku("sjBat"), tuk = oku("sjTuk"), w = oku("sjW"), saat = +$("sjSaat").value, now = +$("sjVNow").value, min = +$("sjVMin").value || 0, fEv = Sayi.coz(D.fiyat.ev || "").n;
    pilSec("sjVMinC", min);
    if (!(bat > 0) || !(w > 0)) { ust("Bataryadan gidecek", "–", "", "Bu güçle çalışır", "–"); cip([]); satir("sjVRows", []); bar(0, 0); uyar(""); return; }
    const VERIM = 0.9, e = w / 1000 * saat / VERIM, dus = e / bat * 100, kalan = now - dus, azami = Math.max(0, bat * (now - min) / 100) * VERIM / (w / 1000);
    bar(Math.max(0, kalan), now, kalan >= min ? "harcama" : "harcama az", `%${now} → ${kalan >= 0 ? "%" + Math.round(kalan) : "yetmez"}`);
    ust("Bataryadan gidecek", "%" + nf(dus, 1), `${nf(e, 2)} kWh · ${tr(saat)} saatte`, "Bu güçle çalışır", sure(azami), `%${min} kalana kadar`);
    cip([`🔌 ${nf(w, 0)} W`, tuk > 0 ? `🛣️ −${nf(e / tuk * 100, 0)} km menzil` : null, isFinite(fEv) && fEv > 0 ? `💵 ${tl(e / (1 - KAYIP.ac) * fEv)}` : null]);
    satir("sjVRows", [["Kalan şarj", kalan >= 0 ? "%" + Math.round(kalan) : "yetmez", kalan >= min ? "" : "uyari"]]);
    uyar(kalan < min ? `Bu sürede şarj %${min}'ın altına iner; araç ayarlanan alt sınırda V2L'yi keser.` : w > 3600 ? "Bu güç çoğu aracın V2L çıkışının üstünde olabilir; aracının kılavuzundaki en yüksek V2L gücünü kontrol et." : "");
    $("sjNote").textContent = "Aracında V2L (araçtan cihaza elektrik) özelliği ve adaptörü varsa geçerlidir. Dönüştürme kaybı yaklaşık %10 varsayıldı; cihaz güçleri örnek değerlerdir, cihazın etiketindeki gücü yaz.";
  }
  const cihazCiz = () => { const sec = D.cihaz || []; $("sjCihaz").querySelectorAll("button").forEach((b, i) => b.classList.toggle("on", sec.includes(i))); };

  // ---- 💰 Yıllık
  function hesapYil() {
    const tuk = oku("sjTuk"), km = +$("sjYilKm").value, evPay = +$("sjEvPay").value / 100, ek = +$("sjYilEk").value || 0;
    const fEv = Sayi.coz(D.fiyat.ev || "").n, fDc = Sayi.coz(D.fiyat.dc || "").n, lt = oku("sjYLt"), yakit = oku("sjYYakit");
    pilSec("sjYilEkC", ek);
    $("sjEvPayY").textContent = evPay >= 1 ? "🏠 Şarjın hepsi evde" : evPay <= 0 ? "⚡ Şarjın hepsi DC istasyonda" : `🏠 %${Math.round(evPay * 100)} evde · ⚡ %${Math.round((1 - evPay) * 100)} DC istasyonda`;
    bar(0, 0);
    const t = tuk * (1 + ek / 100), kwh = km * t / 100;
    const fiyatTam = (evPay <= 0 || fEv > 0) && (evPay >= 1 || fDc > 0);
    const elek = fiyatTam && tuk > 0 ? kwh * (evPay * (fEv || 0) / (1 - KAYIP.ac) + (1 - evPay) * (fDc || 0) / (1 - KAYIP.dc)) : NaN;
    const benzin = lt > 0 && yakit > 0 ? km * lt / 100 * yakit : NaN, fark = benzin - elek, ok = isFinite(elek) && isFinite(benzin);
    ust("Yıllık kazanç", ok ? tl0(fark) : "–", ok ? (fark >= 0 ? "elektrik lehine" : "benzin lehine") : "fiyatları aşağıya yaz", "Aylık kazanç", ok ? tl0(fark / 12) : "–", ok ? `yılda ${km.toLocaleString("tr-TR")} km ile` : "");
    cip([tuk > 0 ? `⚡ ${nf(kwh, 0)} kWh/yıl` : null, ok ? `📅 5 yılda ${tl0(fark * 5)}` : null]);
    const mx = Math.max(elek || 0, benzin || 0) || 1;
    $("sjCubuk").innerHTML = [["⚡ Elektrik", elek, "el"], ["⛽ Benzin", benzin, "bz"]].map(([ad, v, c]) => `<div class="${c}"><span>${ad}</span><i><i style="width:${isFinite(v) ? Math.max(3, v / mx * 100) : 0}%"></i></i><b>${isFinite(v) ? tl0(v) : "–"}</b></div>`).join("");
    satir("sjYilRows", [
      isFinite(elek) ? ["Km başı elektrik", tl(elek / km)] : ["⚡ Yıllık elektrik", `<small>${evPay > 0 && !(fEv > 0) ? "ev fiyatını" : "DC fiyatını"} yaz</small>`],
      isFinite(benzin) ? ["Km başı benzin", tl(benzin / km)] : ["⛽ Yıllık benzin", "<small>tüketim ve yakıt fiyatını yaz</small>"],
      ok ? ["5 yılda (fiyatlar aynı kalırsa)", tl0(fark * 5), "toplam"] : null,
    ]);
    uyar(""); $("sjNote").textContent = "Bugünkü fiyatlarla yaklaşık hesaptır; fiyatlar değiştikçe sonuç değişir. Bakım, sigorta ve vergi farkları dahil değildir. Ev şarjında %12, DC'de %5 şarj kaybı eklendi.";
  }

  function hesapla() {
    ["sarj", "yol", "v2l", "yil"].forEach((m) => ($("sjP-" + m).hidden = m !== mod));
    $("sjMod").querySelectorAll("button").forEach((b) => { const on = b.dataset.m === mod; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
    document.querySelector("#sjH .sjHBat").hidden = mod === "yil";
    $("sjH").dataset.mod = mod;
    aracBelirle(); kaydirici();
    if (mod === "sarj") { yerCiz(); hesapSarj(); } else if (mod === "yol") hesapYol(); else if (mod === "yil") hesapYil(); else { cihazCiz(); hesapV2l(); }
  }

  // ---- olaylar
  const yilDoldur = () => { $("sjYfEv").value = D.fiyat.ev || ""; $("sjYfDc").value = D.fiyat.dc || ""; $("sjYLt").value = $("sjLt").value; $("sjYYakit").value = $("sjYakit").value; };
  if (!D.sjGuc) $("sjGuc").value = "11";
  yilDoldur();
  const ESLE = { sjYfEv: "ev", sjYfDc: "dc" }, ESLE2 = { sjYLt: "sjLt", sjLt: "sjYLt", sjYYakit: "sjYakit", sjYakit: "sjYYakit" };
  $("sarj").addEventListener("input", (e) => {
    const id = e.target.id;
    if (ESLE[id]) D.fiyat[ESLE[id]] = e.target.value;
    if (ESLE2[id]) $(ESLE2[id]).value = e.target.value;
    if (id === "sjFiyat") { D.fiyat[yer] = e.target.value; yilDoldur(); }
    if (id === "sjGuc") D.guc[yer] = oku("sjGuc");
    if (id === "sjNow" && +$("sjHedef").value <= +e.target.value) $("sjHedef").value = Math.min(100, +e.target.value + 1);
    if (id === "sjHedef" && +$("sjNow").value >= +e.target.value) $("sjNow").value = Math.max(0, +e.target.value - 1);
    if (id === "sjW") { D.cihaz = []; cihazCiz(); }
    hesapla(); kaydet();
  });
  $("sjMod").addEventListener("click", (e) => { const b = e.target.closest("button[data-m]"); if (!b) return; mod = D.mod = b.dataset.m; hesapla(); kaydet(); });
  $("sjYer").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-y]"); if (!b) return; yer = D.yer = b.dataset.y;
    $("sjGuc").value = tr(D.guc[yer] || (yer === "dc" ? 120 : yer === "ac" ? 22 : 11)); $("sjGucEl").hidden = true; hesapla(); kaydet();
  });
  $("sjGucPil").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b) return;
    if (b.dataset.k === "el") { $("sjGucEl").hidden = false; $("sjGuc").focus(); $("sjGuc").select(); return; }
    $("sjGucEl").hidden = true; $("sjGuc").value = tr(b.dataset.k); D.guc[yer] = +b.dataset.k; hesapla(); kaydet();
  });
  const pil = (id, hedef) => $(id).addEventListener("click", (e) => { const b = e.target.closest("button[data-v]"); if (!b) return; $(hedef).value = b.dataset.v; if (hedef === "sjHedef" && +$("sjNow").value >= +b.dataset.v) $("sjNow").value = +b.dataset.v - 1; hesapla(); kaydet(); });
  pil("sjHedefC", "sjHedef"); pil("sjEkC", "sjEk"); pil("sjMinC", "sjMin"); pil("sjVMinC", "sjVMin"); pil("sjYilEkC", "sjYilEk");
  $("sjCihaz").addEventListener("click", (e) => { // birden çok cihaz: toplam güç
    const b = e.target.closest("button[data-w]"); if (!b) return;
    const btns = [...$("sjCihaz").querySelectorAll("button")], i = btns.indexOf(b), sec = new Set(D.cihaz || []);
    sec.has(i) ? sec.delete(i) : sec.add(i); D.cihaz = [...sec];
    $("sjW").value = D.cihaz.length ? String(D.cihaz.reduce((t, j) => t + +btns[j].dataset.w, 0)) : "";
    hesapla(); kaydet();
  });
  ["sjBat", "sjTuk", "sjAcMax", "sjDcMax"].forEach((x) => $(x).addEventListener("input", () => setTimeout(() => $("sjAraclar").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.a === D.arac)))));

  // Sonuç kartı sabit başlığın altına kayıp gözden çıkınca üstte ince özet şeridi belirir (kaydırırken sonucu görmeye devam et);
  // başka sekmede ya da araç penceresi açıkken görünmez
  let miniIs = false;
  const miniBak = () => {
    miniIs = false;
    const sh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sh")) || 120;
    const goster = $("sarj").classList.contains("on") && $("sjSh").hidden && $("sjH").getBoundingClientRect().bottom < sh + 8;
    $("sjMini").classList.toggle("on", goster);
  };
  window.addEventListener("scroll", () => { if (!miniIs) { miniIs = true; requestAnimationFrame(miniBak); } }, { passive: true });
  $("tabs").addEventListener("click", () => setTimeout(miniBak, 30));
  $("sjMini").addEventListener("click", () => $("sjH").scrollIntoView({ behavior: "smooth", block: "center" }));

  hesapla();
  window.Sarj = { hesapla };
})();
