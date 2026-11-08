/* Elektrikli araç şarjı (8 Kasım 2026) — Hesaplamalar › Şarj
   Hazır araçlar (Kia Niro EV, Togg T10X, BYD Atto 3, Tesla Model Y) üreticilerin açıkladığı değerlerden; örneğin Kia Niro EV: 64,8 kWh batarya, WLTP 460 km, 16,2 kWh/100 km,
   AC 11 kW (%10–100 yaklaşık 6 sa 20 dk), DC en çok 73 kW (%10–80: 73 kW'ta 45 dk, 50 kW'ta 65 dk).
   Kutular değiştirilebilir; "Başka araç" seçilirse kullanıcı kendi aracının değerlerini yazar. Fiyatlar kullanıcıdan gelir
   (tarife ve istasyon fiyatları değişir; sitede hazır fiyat yazılmaz). Bütün girişler yalnızca bu cihazda saklanır (sarj_v1).
   Hesap yaklaşıktır: şarj kaybı AC'de %12, DC'de %5 varsayılır; DC hız eğrisi Kia'nın %10–80 sürelerine göre ayarlıdır. */
(function () {
  if (!document.getElementById("sarj")) return;
  const $ = (id) => document.getElementById(id);
  const oku = (id) => Sayi.oku($(id)).n;
  const nf = (n, d = 1) => (isFinite(n) ? n.toLocaleString("tr-TR", { maximumFractionDigits: d }) : "–");
  const tl = (n) => (isFinite(n) ? n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL" : "–");
  const sure = (saat) => { if (!isFinite(saat) || saat < 0) return "–"; const dk = Math.round(saat * 60); if (dk < 60) return dk + " dk"; return Math.floor(dk / 60) + " sa" + (dk % 60 ? " " + (dk % 60) + " dk" : ""); };
  const tr = (x) => String(x).replace(".", ",");
  const kis = (a, lo, hi) => Math.min(hi, Math.max(lo, a));
  const satir = (id, L) => ($(id).innerHTML = L.filter(Boolean).map(([k, v, c]) => `<div${c ? ` class="${c}"` : ""}><span>${k}</span><b>${v}</b></div>`).join(""));

  // Hazır araçlar: yalnızca değerleri resmî ya da açık bir kaynakta net olan modeller. Tüketim = batarya ÷ WLTP menzil
  // (batarya tarafı; üreticilerin kWh/100 km değeri prizden ölçülür ve şarj kaybını da içerir, burada kayıp ayrıca eklenir).
  // dcOrt: %80'e kadar ortalama DC gücünün tepe güce oranı, üreticinin verdiği DC şarj süresinden hesaplandı.
  const ARAC = {
    niro: { ad: "Kia Niro EV", bat: 64.8, menzil: 460, ac: 11, dc: 73, dcOrt: 0.83,
      kaynak: "Kia Türkiye teknik özellikleri: 64,8 kWh, WLTP 460 km, AC 11 kW, DC en çok 73 kW (%10–80: 45 dk)." },
    toggS: { ad: "Togg T10X Standart Menzil", bat: 52.4, menzil: 314, ac: 11, dc: 180, dcOrt: 0.37,
      kaynak: "Togg T10X RWD Standart Menzil: 52,4 kWh, WLTP 314 km, AC 11 kW, DC en çok 180 kW (%20–80: 28 dk)." },
    toggU: { ad: "Togg T10X Uzun Menzil", bat: 88.5, menzil: 523, ac: 11, dc: 180, dcOrt: 0.63,
      kaynak: "Togg T10X RWD Uzun Menzil: 88,5 kWh, WLTP 523 km, AC 11 kW (22 kW seçeneği de var), DC en çok 180 kW (%20–80: 28 dk)." },
    atto3: { ad: "BYD Atto 3", bat: 60.4, menzil: 420, ac: 11, dc: 110, dcOrt: 0.59,
      kaynak: "BYD Türkiye teknik broşürü: 60,4 kWh, AC 11 kW, DC en çok 110 kW (%30–80: 28 dk); WLTP 420 km." },
    teslaY: { ad: "Tesla Model Y Standart", bat: 60, menzil: 534, ac: 11, dc: 175, dcOrt: 0.67,
      kaynak: "Tesla Model Y Standart (arkadan itiş): yaklaşık 60 kWh net, WLTP 534 km, AC 11 kW, DC en çok 175 kW (15 dk'da ≈ 260 km). Kaynaklar arasında küçük farklar var; aracının değerleriyle kontrol et." },
  };
  Object.values(ARAC).forEach((a) => (a.tuk = Math.round(a.bat / a.menzil * 1000) / 10));
  const SON_NOT = " Aracının ekranındaki kendi ortalama tüketimini yazarsan sonuçlar sana daha yakın olur.";
  const KAYIP = { ac: 0.12, dc: 0.05 }; // şebekeden çekilenin bataryaya girmeyen payı (yaklaşık)
  const DC_UST = 0.35; // %80 üstünde DC güç belirgin düşer (tepe gücün yaklaşık üçte biri)
  const dcOrt = () => (ARAC[D.arac] && ARAC[D.arac].dcOrt) || 0.6; // başka araçta genel bir ortalama

  // ---- kalıcılık: yalnızca bu cihaz
  const ALAN = ["sjBat", "sjTuk", "sjAcMax", "sjDcMax", "sjNow", "sjHedef", "sjGuc", "sjKm", "sjYNow", "sjEk", "sjMin", "sjLt", "sjYakit", "sjW", "sjSaat", "sjVNow", "sjVMin", "sjYilKm", "sjEvPay", "sjYilEk"];
  let D = {}; try { D = JSON.parse(localStorage.getItem("sarj_v1") || "{}") || {}; } catch (e) {}
  D.fiyat = D.fiyat || {}; // ev / ac / dc ayrı hatırlanır
  const kaydet = () => { ALAN.forEach((k) => (D[k] = $(k).value)); try { localStorage.setItem("sarj_v1", JSON.stringify(D)); } catch (e) {} };
  const aracYaz = (k) => { const a = ARAC[k]; if (!a) return; $("sjBat").value = tr(a.bat); $("sjTuk").value = tr(a.tuk); $("sjAcMax").value = tr(a.ac); $("sjDcMax").value = tr(a.dc); };
  const aracBelirle = () => { // kutular hazır bir aracın değerleriyle aynıysa o araç sayılır
    const k = Object.keys(ARAC).find((x) => { const a = ARAC[x]; return oku("sjBat") === a.bat && oku("sjTuk") === a.tuk && oku("sjAcMax") === a.ac && oku("sjDcMax") === a.dc; });
    D.arac = k || "diger";
    $("sjModel").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.a === D.arac));
    $("sjAracAd").textContent = k ? ARAC[k].ad : "Başka araç";
    $("sjAracOz").textContent = oku("sjBat") > 0 && oku("sjTuk") > 0 ? `${nf(oku("sjBat"))} kWh · ${nf(oku("sjTuk"))} kWh/100 km · menzil ≈ ${nf(oku("sjBat") / oku("sjTuk") * 100, 0)} km` : "aracının değerlerini aşağıya yaz";
    $("sjAracNot").textContent = k ? ARAC[k].kaynak + " Tüketim WLTP menzilinden hesaplandı." + SON_NOT : "Kendi aracının kullanılabilir batarya kapasitesini, ortalama tüketimini ve en yüksek şarj güçlerini yaz; bu cihazda saklanır.";
  };

  let mod = D.mod || "sarj", yer = D.yer || "ev";
  const fiyatYaz = () => {
    $("sjFiyat").value = D.fiyat[yer] || "";
    $("sjFiyatL").textContent = yer === "ev" ? "Evdeki elektrik fiyatı" : yer === "ac" ? "AC istasyon fiyatı" : "DC istasyon fiyatı";
    $("sjFiyat").placeholder = yer === "ev" ? "faturadaki kWh fiyatı" : "istasyonun kWh fiyatı";
  };
  const bar = (a, b, renk) => { // batarya göstergesi: a = başlangıç, b = bitiş (yüzde)
    const lo = kis(Math.min(a, b), 0, 100), hi = kis(Math.max(a, b), 0, 100);
    $("sjBarA").style.width = lo + "%"; $("sjBarB").style.left = lo + "%"; $("sjBarB").style.width = (hi - lo) + "%";
    $("sjBarB").className = renk || "";
  };
  const uyar = (m) => { $("sjWarn").hidden = !m; $("sjWarn").textContent = m || ""; };

  // ---- ⚡ Şarj: maliyet ve süre
  function hesapSarj() {
    const bat = oku("sjBat"), tuk = oku("sjTuk"), now = oku("sjNow"), hed = oku("sjHedef"), guc = oku("sjGuc"), fiyat = oku("sjFiyat");
    const dc = yer === "dc", arMax = dc ? oku("sjDcMax") : oku("sjAcMax");
    bar(now, hed, "dolum");
    if (!(bat > 0) || !(guc > 0) || !(arMax > 0) || !isFinite(now) || !isFinite(hed) || hed <= now || now < 0 || hed > 100) {
      $("sjT1").textContent = $("sjT2").textContent = "–"; $("sjT1b").textContent = $("sjT2b").textContent = "";
      satir("sjRows", []); uyar(hed <= now && isFinite(hed) && isFinite(now) ? "Hedef şarj, şu anki şarjdan yüksek olmalı." : ""); return;
    }
    uyar("");
    const P = Math.min(guc, arMax), eBat = bat * (hed - now) / 100, eSeb = eBat / (1 - KAYIP[dc ? "dc" : "ac"]);
    let saat;
    if (dc) { // %80'e kadar yüksek hız, üstünde düşük hız
      const alt = Math.min(hed, 80) - now, ust = Math.max(0, hed - Math.max(now, 80));
      saat = (bat * Math.max(0, alt) / 100) / (P * dcOrt()) + (bat * ust / 100) / (P * DC_UST);
    } else saat = eSeb / P * (hed > 90 ? 1.05 : 1); // %90 üstünde AC de biraz yavaşlar (Kia: %10–100, 11 kW'ta yaklaşık 6 sa 20 dk)
    const km = tuk > 0 ? eBat / tuk * 100 : NaN, tutar = fiyat > 0 ? eSeb * fiyat : NaN;
    const bitis = new Date(Date.now() + saat * 3600e3);
    $("sjT1L").textContent = "Ödeyeceğin"; $("sjT1").textContent = fiyat > 0 ? tl(tutar) : "–";
    $("sjT1b").textContent = fiyat > 0 ? `${nf(km, 0)} km yol için` : "fiyatı yazınca çıkar";
    $("sjT2L").textContent = "Süre (yaklaşık)"; $("sjT2").textContent = sure(saat);
    $("sjT2b").textContent = "biter: " + bitis.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) + (bitis.getDate() !== new Date().getDate() ? " (ertesi gün)" : "");
    satir("sjRows", [
      ["Bataryaya girecek enerji", nf(eBat) + " kWh"],
      [dc ? "İstasyondan çekilecek (kayıp dahil)" : "Şebekeden çekilecek (kayıp dahil)", nf(eSeb) + " kWh"],
      ["Kazanılan menzil", "≈ " + nf(km, 0) + " km"],
      ["Şarj gücü", `${nf(P)} kW` + (guc > arMax ? ` <small>(cihaz ${nf(guc)} kW, araç en çok ${nf(arMax)} kW alır)</small>` : "")],
      fiyat > 0 && tuk > 0 ? ["100 km maliyeti", tl(tuk / (1 - KAYIP[dc ? "dc" : "ac"]) * fiyat), "toplam"] : null,
      fiyat > 0 && tuk > 0 ? ["1 km maliyeti", tl(tuk / 100 / (1 - KAYIP[dc ? "dc" : "ac"]) * fiyat)] : null,
    ]);
    if (dc && hed > 80) uyar(`%80'den sonra DC şarj belirgin yavaşlar: son %${nf(hed - Math.max(now, 80), 0)} için yaklaşık ${sure((bat * (hed - Math.max(now, 80)) / 100) / (P * DC_UST))} gider. Yolculukta genelde %80'de çıkıp yola devam etmek daha hızlıdır.`);
    $("sjNote").textContent = "Süre ve kayıp yaklaşıktır: hava sıcaklığı, bataryanın ısısı ve istasyonun o anki gücü süreyi değiştirir. İstasyonlar genelde istasyondan çekilen kWh üzerinden ücretlendirir; kesin tutar için istasyonun uygulamasına bak.";
  }

  // ---- 🛣️ Yolculuk: menzil ve maliyet
  function hesapYol() {
    const bat = oku("sjBat"), tuk = oku("sjTuk"), km = oku("sjKm"), now = oku("sjYNow"), ek = oku("sjEk") || 0, min = oku("sjMin") || 0;
    const fiyatEv = Sayi.coz(D.fiyat.ev || "").n, fiyatDc = Sayi.coz(D.fiyat.dc || "").n, lt = oku("sjLt"), yakit = oku("sjYakit");
    if (!(bat > 0) || !(tuk > 0) || !(km > 0) || !(now > 0)) { $("sjT1").textContent = $("sjT2").textContent = "–"; satir("sjYRows", []); bar(0, 0); uyar(""); return; }
    const t = tuk * (1 + ek / 100), e = km * t / 100, kalanYuzde = now - e / bat * 100, menzilTam = bat / t * 100;
    const kullanilabilir = bat * (now - min) / 100, yolMenzil = Math.max(0, kullanilabilir / t * 100);
    bar(Math.max(0, kalanYuzde), now, kalanYuzde >= min ? "harcama" : "harcama az");
    // yolda şarj: her durakta %10'dan %80'e DC (Kia'nın verdiği süre ölçeğiyle)
    let durak = 0, durakSure = 0;
    if (kalanYuzde < min) {
      const eksik = (min - kalanYuzde) / 100 * bat, birDurak = bat * 0.7, P = oku("sjDcMax") || 50;
      durak = Math.ceil(eksik / birDurak); durakSure = eksik / (Math.min(P, oku("sjDcMax") || P) * dcOrt());
    }
    $("sjT1L").textContent = "Varışta kalan"; $("sjT1").textContent = kalanYuzde >= 0 ? "%" + nf(kalanYuzde, 0) : "yetmez";
    $("sjT1b").textContent = kalanYuzde >= min ? `≈ ${nf(Math.max(0, kalanYuzde) / 100 * bat / t * 100, 0)} km daha gider` : `yolda şarj gerekir`;
    $("sjT2L").textContent = "Harcanacak enerji"; $("sjT2").textContent = nf(e) + " kWh"; $("sjT2b").textContent = `${nf(t)} kWh/100 km ile`;
    const evMal = fiyatEv > 0 ? e / (1 - KAYIP.ac) * fiyatEv : NaN, benzin = lt > 0 && yakit > 0 ? km * lt / 100 * yakit : NaN;
    satir("sjYRows", [
      ["Bu şarjla gidilebilecek yol", `≈ ${nf(yolMenzil, 0)} km <small>(%${nf(min, 0)} kalana kadar)</small>`],
      ["Tam dolu menzil (bu tüketimle)", `≈ ${nf(menzilTam, 0)} km`],
      durak ? ["Yolda DC şarj", `${durak} durak · ≈ ${sure(durakSure)} <small>(en çok ${nf(oku("sjDcMax"))} kW)</small>`, "uyari"] : null,
      isFinite(evMal) ? ["Evde şarjla yolculuğun enerjisi", tl(evMal), "toplam"] : ["Evde şarjla maliyet", `<small>⚡ Şarj sekmesinde ev fiyatını yaz</small>`],
      isFinite(evMal) ? ["Km başı", tl(evMal / km)] : null,
      fiyatDc > 0 ? ["Hepsi DC istasyonda olsaydı", tl(e / (1 - KAYIP.dc) * fiyatDc)] : null,
      isFinite(benzin) ? ["⛽ Benzinli araçla aynı yol", tl(benzin)] : null,
      isFinite(benzin) && isFinite(evMal) ? [benzin >= evMal ? "Fark (elektrik lehine)" : "Fark (benzin lehine)", tl(Math.abs(benzin - evMal)), "toplam"] : null,
    ]);
    uyar(kalanYuzde < min ? `Bu yolculuk için şarj yetmiyor: varışta %${nf(min, 0)} kalması için yaklaşık ${nf((min - kalanYuzde) / 100 * bat)} kWh eklemen gerekir.` : "");
    $("sjNote").textContent = "Tüketim hıza, havaya, yüke ve klimaya göre değişir; en doğru sonuç için aracının ekranındaki kendi ortalamanı yaz. Ek tüketim payı tahminidir, kendin ayarla.";
  }

  // ---- 🔋 V2L: araçtan cihaz beslemek
  function hesapV2l() {
    const bat = oku("sjBat"), tuk = oku("sjTuk"), w = oku("sjW"), saat = oku("sjSaat"), now = oku("sjVNow"), min = oku("sjVMin") || 0, fiyatEv = Sayi.coz(D.fiyat.ev || "").n;
    if (!(bat > 0) || !(w > 0) || !(saat > 0) || !(now > 0)) { $("sjT1").textContent = $("sjT2").textContent = "–"; satir("sjVRows", []); bar(0, 0); uyar(""); return; }
    const VERIM = 0.9, e = w / 1000 * saat / VERIM, dus = e / bat * 100, kalan = now - dus;
    const azami = Math.max(0, bat * (now - min) / 100) * VERIM / (w / 1000);
    bar(Math.max(0, kalan), now, kalan >= min ? "harcama" : "harcama az");
    $("sjT1L").textContent = "Bataryadan gidecek"; $("sjT1").textContent = "%" + nf(dus, 1); $("sjT1b").textContent = nf(e, 2) + " kWh";
    $("sjT2L").textContent = "Bu güçle çalışır"; $("sjT2").textContent = azami >= 99 ? "99 sa+" : sure(azami); $("sjT2b").textContent = `%${nf(min, 0)} kalana kadar`;
    satir("sjVRows", [
      ["Kalan şarj", kalan >= 0 ? "%" + nf(kalan, 0) : "yetmez", kalan >= min ? "" : "uyari"],
      tuk > 0 ? ["Menzilden giden", `≈ ${nf(e / tuk * 100, 0)} km`] : null,
      fiyatEv > 0 ? ["Evdeki fiyatla değeri", tl(e / (1 - KAYIP.ac) * fiyatEv), "toplam"] : null,
    ]);
    uyar(kalan < min ? `Bu sürede şarj %${nf(min, 0)}'ın altına iner; araç ayarladığın alt sınırda V2L'yi keser.` : w > 3600 ? "Bu güç çoğu aracın V2L çıkışının üstünde olabilir; aracının kılavuzundaki en yüksek V2L gücünü kontrol et." : "");
    $("sjNote").textContent = "Aracında V2L (araçtan cihaza elektrik) özelliği ve adaptörü varsa geçerlidir. Dönüştürme kaybı yaklaşık %10 varsayıldı; cihaz güçleri örnek değerlerdir, cihazın etiketindeki gücü yaz.";
  }

  // ---- 💰 Yıllık: benzinli araca göre kazanç (fiyatlar bugünkü gibi kalırsa)
  function hesapYil() {
    const tuk = oku("sjTuk"), km = oku("sjYilKm"), evPay = kis(oku("sjEvPay"), 0, 100) / 100, ek = oku("sjYilEk") || 0;
    const fEv = Sayi.coz(D.fiyat.ev || "").n, fDc = Sayi.coz(D.fiyat.dc || "").n, lt = oku("sjYLt"), yakit = oku("sjYYakit");
    bar(0, 0); $("sjT1L").textContent = "Yıllık kazanç"; $("sjT2L").textContent = "Aylık kazanç"; $("sjT1b").textContent = $("sjT2b").textContent = "";
    const t = tuk * (1 + ek / 100), kwh = km * t / 100;
    const evGerek = evPay > 0, dcGerek = evPay < 1, fiyatTam = (!evGerek || fEv > 0) && (!dcGerek || fDc > 0);
    const elek = fiyatTam ? kwh * (evPay * (fEv || 0) / (1 - KAYIP.ac) + (1 - evPay) * (fDc || 0) / (1 - KAYIP.dc)) : NaN;
    const benzin = lt > 0 && yakit > 0 ? km * lt / 100 * yakit : NaN, fark = benzin - elek;
    const ok = isFinite(elek) && isFinite(benzin) && km > 0 && tuk > 0;
    const tl0 = (n) => (isFinite(n) ? Math.round(n).toLocaleString("tr-TR") + " TL" : "–"); // yıllık tutarlarda kuruş gereksiz, kutuya sığsın
    $("sjT1").textContent = ok ? tl0(fark) : "–"; $("sjT2").textContent = ok ? tl0(fark / 12) : "–";
    if (ok) { $("sjT1b").textContent = fark >= 0 ? "elektrik lehine" : "benzin lehine"; $("sjT2b").textContent = `yılda ${nf(km, 0)} km ile`; }
    else $("sjT1b").textContent = "fiyatları yazınca çıkar";
    satir("sjYilRows", km > 0 && tuk > 0 ? [
      ["Yıllık enerji (bataryaya)", nf(kwh, 0) + " kWh"],
      ["⚡ Yıllık elektrik", isFinite(elek) ? tl0(elek) : `<small>${evGerek && !(fEv > 0) ? "ev fiyatını" : "DC fiyatını"} yaz</small>`],
      ["⛽ Yıllık benzin", isFinite(benzin) ? tl0(benzin) : "<small>tüketim ve yakıt fiyatını yaz</small>"],
      isFinite(elek) ? ["Km başı elektrik", tl(elek / km)] : null,
      isFinite(benzin) ? ["Km başı benzin", tl(benzin / km)] : null,
      ok ? ["5 yılda (fiyatlar aynı kalırsa)", tl0(fark * 5), "toplam"] : null,
    ] : []);
    uyar(""); $("sjNote").textContent = "Bugünkü fiyatlarla yaklaşık hesaptır; elektrik ve yakıt fiyatları değiştikçe sonuç değişir. Bakım, sigorta ve vergi farkları dahil değildir. Ev şarjında %12, DC'de %5 şarj kaybı eklendi.";
  }

  function hesapla() {
    ["sarj", "yol", "v2l", "yil"].forEach((m) => ($("sjP-" + m).hidden = m !== mod));
    document.querySelector("#sarj .sjBat").hidden = mod === "yil";
    $("sjMod").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.m === mod));
    $("sjYer").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.y === yer && Math.abs(+b.dataset.k - oku("sjGuc")) < 0.01));
    aracBelirle();
    if (mod === "sarj") hesapSarj(); else if (mod === "yol") hesapYol(); else if (mod === "yil") hesapYil(); else hesapV2l();
  }

  // ---- olaylar
  ALAN.forEach((k) => { if (D[k] != null && D[k] !== "") $(k).value = D[k]; });
  if (!D.sjBat) aracYaz("niro");
  if (!D.sjGuc) $("sjGuc").value = "7,4";
  // Yıllık bölümündeki fiyat ve benzin kutuları diğer bölümlerdekilerle ortaktır (birine yazılan ötekine de geçer)
  const ESLE = { sjYfEv: () => "ev", sjYfDc: () => "dc" }, ESLE2 = { sjYLt: "sjLt", sjLt: "sjYLt", sjYYakit: "sjYakit", sjYakit: "sjYYakit" };
  const yilDoldur = () => { $("sjYfEv").value = D.fiyat.ev || ""; $("sjYfDc").value = D.fiyat.dc || ""; $("sjYLt").value = $("sjLt").value; $("sjYYakit").value = $("sjYakit").value; };
  fiyatYaz(); yilDoldur();
  $("sarj").addEventListener("input", (e) => {
    if (ESLE[e.target.id]) { D.fiyat[ESLE[e.target.id]()] = e.target.value; if (yer === ESLE[e.target.id]()) $("sjFiyat").value = e.target.value; }
    if (ESLE2[e.target.id]) $(ESLE2[e.target.id]).value = e.target.value;
    if (e.target.id === "sjFiyat") { D.fiyat[yer] = e.target.value; yilDoldur(); }
    if (e.target.id === "sjGuc" && oku("sjGuc") > (oku("sjAcMax") || 11) + 11 && yer !== "dc") { yer = "dc"; D.yer = yer; fiyatYaz(); }
    hesapla(); kaydet();
  });
  $("sjMod").addEventListener("click", (e) => { const b = e.target.closest("button[data-m]"); if (!b) return; mod = D.mod = b.dataset.m; hesapla(); kaydet(); });
  $("sjModel").innerHTML = Object.keys(ARAC).map((k) => `<button data-a="${k}">${ARAC[k].ad}</button>`).join("") + `<button data-a="diger">Başka araç</button>`;
  $("sjModel").addEventListener("click", (e) => { const b = e.target.closest("button[data-a]"); if (!b) return; if (ARAC[b.dataset.a]) aracYaz(b.dataset.a); else { ["sjBat", "sjTuk", "sjAcMax", "sjDcMax"].forEach((x) => ($(x).value = "")); $("sjBat").focus(); } hesapla(); kaydet(); });
  $("sjYer").addEventListener("click", (e) => { const b = e.target.closest("button[data-y]"); if (!b) return; yer = D.yer = b.dataset.y; $("sjGuc").value = tr(b.dataset.k); fiyatYaz(); hesapla(); kaydet(); });
  const cip = (id, hedef) => $(id).addEventListener("click", (e) => { const b = e.target.closest("button[data-v],button[data-w]"); if (!b) return; $(hedef).value = tr(b.dataset.v || b.dataset.w); hesapla(); kaydet(); });
  cip("sjHedefC", "sjHedef"); cip("sjKmC", "sjKm"); cip("sjEkC", "sjEk"); cip("sjCihaz", "sjW");
  cip("sjYilKmC", "sjYilKm"); cip("sjEvPayC", "sjEvPay"); cip("sjYilEkC", "sjYilEk");
  hesapla();
  window.Sarj = { hesapla };
})();
