/* Sayı girişlerinin ortak okuyucusu (Bankacılık ve Hesaplamalar)
   Önce BİÇİM doğrulanır, sonra sayıya çevrilir. "12abc", "1.2.3", "12,5,6", "5e3" gibi girişler reddedilir
   (eskiden parseFloat ile 12, 1,2, 12,5, 5000 okunup hesap yanlış veriyle sürüyordu; 7 Kasım 2026).
   Kabul edilen biçimler:
     1.000.000   1.000.000,50   (Türkçe: nokta binlik, virgül ondalık)
     1000000     1000000,50     12,5     ,5
     12.5        (yalnızca ondalık nokta; "1.500" gibi üç haneli grup binlik sayılır —
                  yüzde/binde kutularında ise "3.125" ondalıktır, 3,125 okunur)
     başta eksi; başta/sonda "%", sonda "TL" ya da "₺"; aradaki boşluklar.
   Sonuç: { n, ok, bos } — geçersizse n = NaN (hesaplar "–" gösterir), boşsa n = 0.

   SINIR DENETİMİ (22 Kasım 2026): biçimi doğru olsa da olmayacak değerler reddedilir (eskiden ör. eksi
   ödenen kart borcu ya da eksi çek tutarı hesaba giriyordu). Kutunun yanındaki birime göre varsayılanlar:
     TL   → eksi olamaz, en fazla 100 milyar      ay  → tam sayı, 1–360      gün → tam sayı, 0–3660
     ‰    → 0–1000                                %, kW, cm, TL/kWh… → eksi olamaz
     birimsiz ya da "±" birimli kutular (A/B sayıları, ± gün) ve data-eksi verilmiş kutular → serbest
   Sayfa kutuya özel kural verebilir: Sayi.sinir({ id: { min, max, tam, ust, ustMetin } }).
   "ust" sert sınır değildir: aşılırsa hesap sürer, kutuda turuncu "olağan dışı" uyarısı çıkar.
   Sayfa kendi uyarısını Sayi.uyar(el, "metin") ile verir (ör. "Borçtan fazla"); boş metin siler. */
(function () {
  // sondaki virgül geçerli: yazarken "12," ara hâli kırmızı yanmasın
  const TR_GRUP = /^-?\d{1,3}(\.\d{3})+(,\d*)?$/, TR = /^-?(\d+)?(,\d*)?$/, NOKTA = /^-?\d+\.\d+$/;
  // oran: kutu yüzde/binde kutusuysa tek noktalı giriş ondalıktır ("3.125" → 3,125; binlik olamaz)
  function coz(v, oran) {
    let s = String(v == null ? "" : v).replace(/[\s  ]/g, "").replace(/^%|%$/g, "").replace(/(TL|₺)$/i, "");
    if (s === "" || s === "-") return { n: 0, ok: true, bos: true };
    let t;
    if (oran && NOKTA.test(s)) t = s;
    else if (TR_GRUP.test(s)) t = s.replace(/\./g, "").replace(",", ".");
    else if (TR.test(s) && /\d/.test(s)) t = s.replace(",", ".");
    else if (NOKTA.test(s)) t = s;
    else return { n: NaN, ok: false, bos: false };
    const n = Number(t.replace(/^(-?)\./, "$10."));
    return isFinite(n) ? { n, ok: true, bos: false } : { n: NaN, ok: false, bos: false };
  }
  // Yüzde (%) ya da binde (‰) birimli kutu mu? Birim, kutunun yanındaki span'da yazar.
  function oranMi(el) {
    const k = el && (el.closest(".field") || el.parentElement), u = k && k.querySelector("span");
    return !!u && /^[%‰]/.test(u.textContent.trim());
  }
  // ---- Sınır denetimi ----
  const OZEL = {}; // kutu id → kural (Sayi.sinir ile)
  function birim(el) {
    const k = el && (el.closest(".field") || el.parentElement), u = k && k.querySelector("span");
    return u ? u.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function kural(el) {
    const b = birim(el), o = (el.id && OZEL[el.id]) || {};
    let k;
    if (el.hasAttribute("data-eksi") || !b || b.indexOf("±") > -1) k = {};
    else if (b === "TL") k = { min: 0, max: 1e11 };
    else if (b === "ay") k = { min: 1, max: 360, tam: true };
    else if (b === "gün") k = { min: 0, max: 3660, tam: true };
    else if (b.charAt(0) === "‰") k = { min: 0, max: 1000 };
    else k = { min: 0 };
    return Object.assign(k, o);
  }
  const yaz = (x) => x >= 1e9 ? (x / 1e9).toLocaleString("tr-TR") + " milyar" : x >= 1e6 ? (x / 1e6).toLocaleString("tr-TR") + " milyon" : x.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  function birimli(x, b) {
    const s = yaz(x), u = b.split(" ")[0];
    return u === "%" ? "%" + s : u === "‰" ? "‰" + s : u ? s + " " + u : s;
  }
  function denetle(el, r) {
    if (!r.ok || r.bos) return r;
    const k = kural(el), n = r.n, b = birim(el), red = (neden) => ({ n: NaN, ok: false, bos: false, neden });
    if (k.min != null && n < k.min) return red(n < 0 ? "Eksi olamaz" : "En az " + birimli(k.min, b));
    if (k.max != null && n > k.max) return red("En fazla " + birimli(k.max, b));
    if (k.tam && !Number.isInteger(n)) return red("Tam sayı yaz");
    if (k.ust != null && n > k.ust) return { n, ok: true, bos: false, uyari: k.ustMetin || "Olağan dışı yüksek" };
    return r;
  }
  const oku = (el) => denetle(el, coz(el.value, oranMi(el)));
  // Kutuyu işaretle: geçersizse kırmızı çerçeve ve üstünde kısa neden; olağan dışıysa turuncu uyarı
  function isaretle(el) {
    if (!el || el.tagName !== "INPUT") return;
    const r = oku(el), kutu = el.closest(".field") || el.parentElement;
    const uy = r.ok ? r.uyari || el.dataset.disUyari || "" : "";
    if (r.ok) el.removeAttribute("aria-invalid"); else el.setAttribute("aria-invalid", "true");
    if (!kutu) return;
    kutu.classList.toggle("sayiHata", !r.ok);
    kutu.classList.toggle("sayiUyari", !!uy);
    if (!r.ok) kutu.dataset.hata = r.neden || "Sayıyı kontrol et"; else delete kutu.dataset.hata;
    if (uy) kutu.dataset.uyari = uy; else delete kutu.dataset.uyari;
  }
  // Sayfanın kendi uyarısı (ör. ödenen tutar borçtan fazla): hesap sürer, kutuda turuncu not
  function uyar(el, metin) {
    if (!el) return;
    if (metin) el.dataset.disUyari = metin; else delete el.dataset.disUyari;
    isaretle(el);
  }
  const SECICI = 'input[inputmode="decimal"], input[inputmode="numeric"]';
  function sinir(map) {
    Object.assign(OZEL, map);
    document.querySelectorAll(SECICI).forEach((el) => { if (el.value.trim()) isaretle(el); });
  }
  document.addEventListener("input", (e) => { if (e.target.matches && e.target.matches(SECICI)) isaretle(e.target); }, true);
  const st = document.createElement("style");
  st.textContent = `input[aria-invalid="true"] { border-color: #ef6a4c !important; box-shadow: 0 0 0 3px rgba(239,106,76,.22) !important; }
.sayiHata, .sayiUyari { position: relative; }
.sayiHata::after, .sayiUyari::after { position: absolute; right: 10px; top: -9px; max-width: calc(100% - 20px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 6px; border-radius: 6px; font: 700 10.5px/16px system-ui, -apple-system, "Segoe UI", sans-serif; pointer-events: none; }
.sayiHata::after { content: attr(data-hata); background: #ef6a4c; color: #fff; }
.sayiUyari:not(.sayiHata)::after { content: attr(data-uyari); background: #e8b52b; color: #1a1300; }`;
  document.head.appendChild(st);
  window.Sayi = { coz, oku, oranMi, isaretle, sinir, uyar, kural };
})();
