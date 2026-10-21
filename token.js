// Token — Batak, King ve Balayı King'de ortak bakiye. (Solitaire'de Token yok; orada dilek tutulur.)
// Bakiye "batakMP" anahtarında durur, böylece Batak'taki eski bakiye korunur. 1.000 Token ile başlanır.
// Oyun başında Token konur; kazanan masa ücreti olarak masadaki toplamın %1'ini öder.
// Token biterse 1 gün sonra İş Bankası sorusu gelir (isq.js); doğru cevap 1.000 Token kazandırır.
// Kullanım:
//   Token.bakiye() · Token.fmt(n) · Token.yeter() · Token.koy(n) → true/false
//   Token.secici(kok, oyun) → bahis seçicisini kökün içine çizer; .deger() seçili tutarı verir
//   Token.sonuc(oyun, konan, kisi, kat) → ödemeyi yapar (kat: 0 kaybetti, 1 iade, 2/3 kazandı), { pay, fee, durum, html }
//   Token.kilit(modal, { goster, devam }) → Token bittiyse bekleme ekranı ya da İş Bankası sorusu
(function () {
  const KEY = "batakMP", BAHIS = [100, 250, 500, 1000, 2500, 5000, 10000], FEE = 0.01, ODUL = 1000, GUN = 864e5;
  const MP = { bal: 1000, empty: 0, lastQ: -1 };
  const yukle = () => { try { Object.assign(MP, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {} if (!(MP.bal >= 0)) MP.bal = 0; return MP; };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(MP)); } catch (e) {} };
  yukle();
  const fmt = (n) => Math.round(n).toLocaleString("tr-TR");
  const oku = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } };
  const yaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  const css = document.createElement("style");
  css.textContent = `
.tkBal { display: flex; justify-content: space-between; align-items: center; margin: 4px 0 10px; padding: 10px 14px; border-radius: 14px; background: linear-gradient(90deg, rgba(240,198,116,.16), rgba(240,198,116,.05)); border: 1px solid rgba(240,198,116,.3); font-size: 14px; color: #eadcc6; text-align: left; }
.tkBal b { font-size: 17px; color: #ffe2a6; }
.tkRow { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 0 12px; font-size: 15px; color: #eadcc6; }
.tkRow > span { white-space: nowrap; text-align: left; }
.tkStep { display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,.28); border: 1px solid rgba(240,198,116,.25); border-radius: 999px; padding: 3px; }
.tkStep button { width: 34px; height: 34px; border-radius: 50%; border: none; background: linear-gradient(180deg, #f3cf86, #d9a54a); color: #2a1a05; font-size: 18px; font-weight: 800; line-height: 1; cursor: pointer; }
.tkStep button:disabled { opacity: .35; cursor: default; }
.tkStep b { min-width: 64px; text-align: center; font-size: 16px; color: #fff3dc; font-variant-numeric: tabular-nums; }
/* Başla düğmesi uzun pencerede de hep görünür: pencerenin altına yapışık şerit */
.tkAlt { position: sticky; bottom: -20px; z-index: 2; margin: 10px -20px -20px; padding: 14px 20px 20px; background: linear-gradient(rgba(13,13,13,0), #0d0d0d 14px); }
.tkNot { font-size: 12px; color: #a99a83; text-align: left; margin: -4px 2px 12px; line-height: 1.45; }
.tkBox { background: rgba(240,198,116,.08); border: 1px solid rgba(240,198,116,.3); border-radius: 12px; padding: 10px 12px; margin: 0 0 12px; font-size: 14px; line-height: 1.5; color: #eadcc6; }
.tkBox b { color: #fff; }
.tkQ { display: grid; gap: 8px; }
.tkQ button { padding: 12px; border-radius: 12px; border: 1px solid #262626; background: #161616; color: #f2f2f2; font-size: 15px; font-weight: 600; cursor: pointer; text-align: left; }
.tkQ button.ok { border-color: #3fc283; background: rgba(63,194,131,.15); }
.tkQ button.bad { border-color: #e0473a; background: rgba(224,71,58,.15); }
`;
  document.head.appendChild(css);

  const secenekler = () => { yukle(); return BAHIS.filter((v) => v <= MP.bal); };
  // Bahis seçicisi: oyunun son seçtiği tutar hatırlanır
  function secici(kok, oyun) {
    const L = secenekler(), son = oku("tokenBahis", {});
    let v = L.includes(son[oyun]) ? son[oyun] : L.includes(100) ? 100 : L[0] || 0;
    kok.innerHTML = `<div class="tkBal"><span>🪙 Bakiyen</span><b>${fmt(MP.bal)} Token</b></div>
      <div class="tkRow"><span>Masaya koy</span><div class="tkStep"><button type="button" data-d="-1" aria-label="Azalt">‹</button><b></b><button type="button" data-d="1" aria-label="Artır">›</button></div></div>`;
    const b = kok.querySelector(".tkStep b"), [ge, il] = kok.querySelectorAll(".tkStep button");
    const sync = () => { b.textContent = fmt(v); ge.disabled = L.indexOf(v) <= 0; il.disabled = L.indexOf(v) >= L.length - 1; if (api.onChange) api.onChange(v); };
    const api = { deger: () => v, onChange: null, sync };
    kok.querySelectorAll(".tkStep button").forEach((x) => (x.onclick = () => { const i = L.indexOf(v); v = L[Math.max(0, Math.min(L.length - 1, i + +x.dataset.d))]; son[oyun] = v; yaz("tokenBahis", son); sync(); }));
    sync();
    return api;
  }
  function koy(n) { yukle(); if (!n || n > MP.bal) return false; MP.bal -= n; save(); return true; }
  // Oyun sonu ödemesi. kisi: masadaki oyuncu sayısı (masa = konan × kisi); kat: 0 kaybetti, 1 iade, 2/3 kazandı
  function sonuc(oyun, konan, kisi, kat) {
    yukle();
    if (!konan) return { pay: 0, fee: 0, durum: "yok", html: "" };
    const masa = konan * kisi, durum = kat > 1 ? "kazandi" : kat === 1 ? "berabere" : "kaybetti";
    const ucret = Math.max(1, Math.round(masa * FEE)); // masa ücreti: oyunu kim kazanırsa ondan alınır
    let pay = konan * kat, fee = 0;
    if (durum === "kazandi") { fee = ucret; pay -= fee; }
    MP.bal += pay; if (MP.bal >= BAHIS[0]) MP.empty = 0; save();
    const K = oku("tokenKasa", {}); K[oyun] = K[oyun] || { oyun: 0, ucret: 0 }; K[oyun].oyun++; K[oyun].ucret += ucret; yaz("tokenKasa", K);
    const t = durum === "kazandi" ? `🎉 <b>+${fmt(pay)}</b> Token kazandın!<br><small style="opacity:.75">Masa ücreti (%1): −${fmt(fee)} Token</small>`
      : durum === "berabere" ? `Berabere: ${fmt(konan)} Token iade edildi.` : `Bu oyunda ${fmt(konan)} Token kaybettin.`;
    return { pay, fee, ucret, masa, durum, html: `<div class="tkBox">${t}<br>🪙 Bakiye: <b>${fmt(MP.bal)}</b> Token</div>` };
  }
  const kasa = (oyun) => (oku("tokenKasa", {})[oyun] || { oyun: 0, ucret: 0 });
  // Token bittiyse: 1 gün bekleme, sonra İş Bankası sorusu (doğru cevap 1.000 Token)
  function kilit(modal, o) {
    o = o || {};
    const goster = o.goster || (() => {}), geri = o.geri || "oyunlar.html";
    yukle();
    if (!MP.empty) { MP.empty = Date.now(); save(); }
    const left = MP.empty + GUN - Date.now();
    if (left > 0) {
      const h = Math.floor(left / 36e5), m = Math.floor((left % 36e5) / 6e4);
      modal.innerHTML = `<h2>🪙 Token bitti</h2>
        <p>Yeni Token için <b>${h} saat ${m} dakika</b> sonra gel. Seni İş Bankası tarihçesi ve ürünleriyle ilgili bir soru bekliyor; bilirsen <b>1.000 Token</b> kazanırsın.</p>
        <p style="font-size:12.5px">Bakiyen Batak, King ve Balayı King'de ortak. Solitaire Token istemez, dilek tutup oynayabilirsin 🌙</p>
        <a class="btn" href="${geri}" style="display:block;text-decoration:none;padding:12px">Oyunlara dön</a>`;
      goster();
      return;
    }
    const pool = typeof ISQ !== "undefined" ? ISQ : [];
    if (!pool.length) { MP.bal += ODUL; MP.empty = 0; save(); if (o.devam) o.devam(); return; }
    let qi; do { qi = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && qi === MP.lastQ);
    const [q, opts0, ok0] = pool[qi];
    const ord = opts0.map((_, i) => i).sort(() => Math.random() - 0.5), ok = ord.indexOf(ok0);
    modal.innerHTML = `<h2>🏦 İş Bankası Bilgi Yarışması</h2><p>Doğru cevap: <b>1.000 Token</b></p>
      <div style="font-weight:700;font-size:16px;margin:4px 0 12px;text-align:left"></div>
      <div class="tkQ">${ord.map((i, n) => `<button type="button" data-i="${n}"></button>`).join("")}</div><div class="tkRes" style="margin-top:12px;font-size:14px"></div>`;
    modal.querySelector("div[style]").textContent = q;
    modal.querySelectorAll(".tkQ button").forEach((b, n) => (b.textContent = opts0[ord[n]]));
    goster();
    modal.querySelector(".tkQ").onclick = (e) => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      modal.querySelectorAll(".tkQ button").forEach((x) => { x.disabled = true; if (+x.dataset.i === ok) x.classList.add("ok"); });
      yukle(); MP.lastQ = qi;
      const res = modal.querySelector(".tkRes");
      if (+b.dataset.i === ok) {
        MP.bal += ODUL; MP.empty = 0; save();
        res.innerHTML = `✅ Doğru! <b>1.000 Token</b> hesabına yüklendi.<button class="btn" type="button" style="margin-top:10px">Oyuna devam</button>`;
        res.querySelector("button").onclick = () => { if (o.devam) o.devam(); };
      } else {
        b.classList.add("bad"); MP.empty = Date.now(); save();
        res.innerHTML = `❌ Yanlış. Yarın yeni bir soruyla tekrar dene.<a class="btn" href="${geri}" style="display:block;text-decoration:none;padding:12px;margin-top:10px">Oyunlara dön</a>`;
      }
    };
  }
  window.Token = {
    MP, BAHIS, FEE, fmt, save, yukle, secenekler, secici, koy, sonuc, kasa, kilit,
    bakiye: () => yukle().bal,
    yeter: () => yukle().bal >= BAHIS[0],
  };
})();
