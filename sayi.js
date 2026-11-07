/* Sayı girişlerinin ortak okuyucusu (Bankacılık ve Hesaplamalar)
   Önce BİÇİM doğrulanır, sonra sayıya çevrilir. "12abc", "1.2.3", "12,5,6", "5e3" gibi girişler reddedilir
   (eskiden parseFloat ile 12, 1,2, 12,5, 5000 okunup hesap yanlış veriyle sürüyordu; 7 Kasım 2026).
   Kabul edilen biçimler:
     1.000.000   1.000.000,50   (Türkçe: nokta binlik, virgül ondalık)
     1000000     1000000,50     12,5     ,5
     12.5        (yalnızca ondalık nokta; "1.500" gibi üç haneli grup binlik sayılır)
     başta eksi; başta/sonda "%", sonda "TL" ya da "₺"; aradaki boşluklar.
   Sonuç: { n, ok, bos } — geçersizse n = NaN (hesaplar "–" gösterir), boşsa n = 0. */
(function () {
  // sondaki virgül geçerli: yazarken "12," ara hâli kırmızı yanmasın
  const TR_GRUP = /^-?\d{1,3}(\.\d{3})+(,\d*)?$/, TR = /^-?(\d+)?(,\d*)?$/, NOKTA = /^-?\d+\.\d+$/;
  function coz(v) {
    let s = String(v == null ? "" : v).replace(/[\s  ]/g, "").replace(/^%|%$/g, "").replace(/(TL|₺)$/i, "");
    if (s === "" || s === "-") return { n: 0, ok: true, bos: true };
    let t;
    if (TR_GRUP.test(s)) t = s.replace(/\./g, "").replace(",", ".");
    else if (TR.test(s) && /\d/.test(s)) t = s.replace(",", ".");
    else if (NOKTA.test(s)) t = s;
    else return { n: NaN, ok: false, bos: false };
    const n = Number(t.replace(/^(-?)\./, "$10."));
    return isFinite(n) ? { n, ok: true, bos: false } : { n: NaN, ok: false, bos: false };
  }
  // Kutuyu işaretle: geçersizse kırmızı çerçeve ve altında kısa uyarı
  function isaretle(el) {
    if (!el || el.tagName !== "INPUT") return;
    const r = coz(el.value), kutu = el.closest(".field") || el.parentElement;
    if (r.ok) { el.removeAttribute("aria-invalid"); if (kutu) kutu.classList.remove("sayiHata"); }
    else { el.setAttribute("aria-invalid", "true"); if (kutu) kutu.classList.add("sayiHata"); }
  }
  const SECICI = 'input[inputmode="decimal"], input[inputmode="numeric"]';
  document.addEventListener("input", (e) => { if (e.target.matches && e.target.matches(SECICI)) isaretle(e.target); }, true);
  const st = document.createElement("style");
  st.textContent = `input[aria-invalid="true"] { border-color: #ef6a4c !important; box-shadow: 0 0 0 3px rgba(239,106,76,.22) !important; }
.sayiHata { position: relative; }
.sayiHata::after { content: "Sayıyı kontrol et"; position: absolute; right: 10px; top: -9px; padding: 0 6px; border-radius: 6px; background: #ef6a4c; color: #fff; font: 700 10.5px/16px system-ui, -apple-system, "Segoe UI", sans-serif; pointer-events: none; }`;
  document.head.appendChild(st);
  window.Sayi = { coz, isaretle };
})();
