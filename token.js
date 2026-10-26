// Yıldız — Batak, King ve Balayı King'de ortak bakiye. (Solitaire'de Yıldız yok; orada dilek tutulur.)
// Bakiye "batakMP" anahtarında durur, böylece Batak'taki eski bakiye korunur. 1.000 Yıldız ve bir kerelik 2.000 Yıldız hediyeyle başlanır.
// Oyun başında Yıldız konur; kazanan katını alır (kesinti yok). Yıldız yalnızca oyun içi skordur.
// Dört kişilik tekli oyunlarda (King, Batak) sıraya göre: birinci 3 katını, ikinci Yıldızını geri alır; puan eşitse o sıraların payı bölünür.
// Yıldız biterse 3 saat sonra İş Bankası sorusu gelir (isq.js); doğru cevap 1.000 Yıldız kazandırır.
// Kullanım:
//   Token.bakiye() · Token.fmt(n) · Token.yeter() · Token.koy(n) → true/false
//   Token.secici(kok, oyun) → puan seçicisini kökün içine çizer; .deger() seçili tutarı verir
//   Token.sonuc(oyun, konan, kisi, kat, not) → ödemeyi yapar (kat: 0 kaybetti, 0–1 arası kısmi iade, 1 iade, 1'den büyük kazandı), { pay, fee, durum, html }
//   Token.sira(skorlar, ben, carpanlar) → { kat, sira, esit }: sıraya göre çarpan (varsayılan [3, 1, 0, 0]); eşitlikte o sıraların ortalaması
//   Token.kilit(modal, { goster, devam }) → Yıldız bittiyse bekleme ekranı ya da İş Bankası sorusu
(function () {
  const KEY = "batakMP", KADEMELER = [100, 250, 500, 1000, 2500, 5000, 10000], FEE = 0, ODUL = 1000, BEKLE = 3 * 36e5, HEDIYE = 2000;
  const MP = { bal: 1000, empty: 0, lastQ: -1 };
  const yukle = () => { try { Object.assign(MP, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {} if (!(MP.bal >= 0)) MP.bal = 0; return MP; };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(MP)); } catch (e) {} };
  yukle();
  // Bir defalık hediye: 22 Ekim 2026'dan sonra giren herkese 2.000 Yıldız (cihaz başına bir kez)
  let hediyeVerildi = false;
  if (!MP.hediye1) { MP.hediye1 = Date.now(); MP.bal += HEDIYE; MP.empty = 0; save(); hediyeVerildi = true; }
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

  const secenekler = () => { yukle(); return KADEMELER.filter((v) => v <= MP.bal); };
  // Puan seçicisi: oyunun son seçtiği tutar hatırlanır
  function secici(kok, oyun) {
    const L = secenekler(), son = oku("tokenYildiz", {});
    let v = L.includes(son[oyun]) ? son[oyun] : L.includes(100) ? 100 : L[0] || 0;
    kok.innerHTML = `<div class="tkBal"><span>⭐ Bakiyen</span><b>${fmt(MP.bal)} Yıldız</b></div>
      <div class="tkRow"><span>Yıldız ayır</span><div class="tkStep"><button type="button" data-d="-1" aria-label="Azalt">‹</button><b></b><button type="button" data-d="1" aria-label="Artır">›</button></div></div>`;
    const b = kok.querySelector(".tkStep b"), [ge, il] = kok.querySelectorAll(".tkStep button");
    const sync = () => { b.textContent = fmt(v); ge.disabled = L.indexOf(v) <= 0; il.disabled = L.indexOf(v) >= L.length - 1; if (api.onChange) api.onChange(v); };
    const api = { deger: () => v, onChange: null, sync };
    kok.querySelectorAll(".tkStep button").forEach((x) => (x.onclick = () => { const i = L.indexOf(v); v = L[Math.max(0, Math.min(L.length - 1, i + +x.dataset.d))]; son[oyun] = v; yaz("tokenYildiz", son); sync(); }));
    sync();
    return api;
  }
  function koy(n) { yukle(); if (!n || n > MP.bal) return false; MP.bal -= n; save(); return true; }
  // Sıraya göre çarpan: skorlar büyükten küçüğe dizilir; "ben" (0 = oyuncu) kaçıncı, kaç kişiyle eşit. Eşitlikte o sıraların çarpanları ortalanır
  // (ör. birincilik iki kişide: (3 + 1) / 2 = 2 kat; ikincilik iki kişide: (1 + 0) / 2 = yarısı geri).
  function sira(skorlar, ben, carpanlar) {
    const C = carpanlar || [3, 1, 0, 0], s = skorlar[ben || 0];
    const once = skorlar.filter((x) => x > s).length, esit = skorlar.filter((x) => x === s).length;
    let top = 0; for (let i = once; i < once + esit; i++) top += C[i] || 0;
    return { kat: Math.round((top / esit) * 100) / 100, sira: once + 1, esit };
  }
  // Oyun sonu ödemesi. kisi: masadaki oyuncu sayısı (masa = konan × kisi); kat: 0 kaybetti, 0–1 kısmi iade, 1 iade, 1'den büyük kazandı.
  // not: sonucun başına yazılan kısa ifade (ör. "🥈 İkinci oldun:")
  function sonuc(oyun, konan, kisi, kat, not) {
    yukle();
    if (!konan) return { pay: 0, fee: 0, durum: "yok", html: "" };
    const masa = konan * kisi, durum = kat > 1 ? "kazandi" : kat === 1 ? "berabere" : kat > 0 ? "kismi" : "kaybetti";
    const ucret = 0, fee = 0, pay = Math.round(konan * kat); // kesinti yok
    MP.bal += pay; if (MP.bal >= KADEMELER[0]) MP.empty = 0; save();
    const on = not ? not + " " : "";
    const t = durum === "kazandi" ? `${on || "🎉 "}<b>${fmt(pay)}</b> Yıldız aldın (net <b>+${fmt(pay - konan)}</b>)!`
      : durum === "berabere" ? `${on || "Berabere: "}${fmt(konan)} Yıldızın geri geldi.`
      : durum === "kismi" ? `${on}${fmt(pay)} Yıldız geri aldın (net −${fmt(konan - pay)}).` : `${on}Bu oyunda ${fmt(konan)} Yıldız kaybettin.`;
    return { pay, fee, ucret, masa, durum, html: `<div class="tkBox">${t}<br>⭐ Bakiye: <b>${fmt(MP.bal)}</b> Yıldız</div>` };
  }
  const kasa = (oyun) => (oku("tokenKasa", {})[oyun] || { oyun: 0, ucret: 0 });
  // Yıldız bittiyse: 3 saat bekleme, sonra bilgi sorusu (doğru cevap 1.000 Yıldız)
  function kilit(modal, o) {
    o = o || {};
    const goster = o.goster || (() => {}), geri = o.geri || "oyunlar.html";
    yukle();
    if (!MP.empty) { MP.empty = Date.now(); save(); }
    const left = MP.empty + BEKLE - Date.now();
    if (left > 0) {
      const h = Math.floor(left / 36e5), m = Math.floor((left % 36e5) / 6e4);
      modal.innerHTML = `<h2>⭐ Yıldız bitti</h2>
        <p>Yeni Yıldız için <b>${h ? h + " saat " : ""}${m} dakika</b> sonra gel. Seni bir bilgi sorusu bekliyor; bilirsen <b>1.000 Yıldız</b> kazanırsın.</p>
        <p style="font-size:12.5px">Bakiyen Batak, King ve Balayı King'de ortak. Solitaire Yıldız istemez, dilek tutup oynayabilirsin 🌙</p>
        <a class="btn" href="${geri}" style="display:block;text-decoration:none;padding:12px">Oyunlara dön</a>`;
      goster();
      return;
    }
    const pool = typeof ISQ !== "undefined" ? ISQ : [];
    if (!pool.length) { MP.bal += ODUL; MP.empty = 0; save(); if (o.devam) o.devam(); return; }
    let qi; do { qi = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && qi === MP.lastQ);
    const [q, opts0, ok0] = pool[qi];
    const ord = opts0.map((_, i) => i).sort(() => Math.random() - 0.5), ok = ord.indexOf(ok0);
    modal.innerHTML = `<h2>🧠 Bilgi Yarışması</h2><p>Doğru cevap: <b>1.000 Yıldız</b></p>
      <div style="font-weight:700;font-size:16px;margin:4px 0 12px;text-align:left"></div>
      <div class="tkQ">${ord.map((i, n) => `<button type="button" data-i="${n}"></button>`).join("")}</div><div class="tkRes" style="margin-top:12px;font-size:14px"></div><p style="font-size:11px;opacity:.65;margin:10px 0 0">Gönüllü hazırlanmış bilgi yarışmasıdır; İş Bankası'nın resmî içeriği değildir.</p>`;
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
        res.innerHTML = `✅ Doğru! <b>1.000 Yıldız</b> bakiyene eklendi.<button class="btn" type="button" style="margin-top:10px">Oyuna devam</button>`;
        res.querySelector("button").onclick = () => { if (o.devam) o.devam(); };
      } else {
        b.classList.add("bad"); MP.empty = Date.now(); save();
        res.innerHTML = `❌ Yanlış. 3 saat sonra yeni bir soruyla tekrar dene.<a class="btn" href="${geri}" style="display:block;text-decoration:none;padding:12px;margin-top:10px">Oyunlara dön</a>`;
      }
    };
  }
  if (hediyeVerildi) {
    const t = () => { const d = document.createElement("div");
      d.textContent = "🎁 Hediye: 2.000 Yıldız bakiyene eklendi!";
      d.style.cssText = "position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:9999;padding:12px 18px;border-radius:14px;background:linear-gradient(180deg,#f3cf86,#d9a54a);color:#2a1a05;font:600 15px system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.45);max-width:90vw;text-align:center;transition:opacity .4s";
      document.body.appendChild(d); setTimeout(() => (d.style.opacity = "0"), 4200); setTimeout(() => d.remove(), 4700); };
    document.body ? t() : document.addEventListener("DOMContentLoaded", t);
  }
  window.Token = {
    MP, KADEMELER, FEE, fmt, save, yukle, secenekler, secici, koy, sonuc, sira, kasa, kilit,
    bakiye: () => yukle().bal,
    yeter: () => yukle().bal >= KADEMELER[0],
  };
})();
