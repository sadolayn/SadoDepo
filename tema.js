/* Sadolayn tema seçimi: Otomatik (telefona uyar) · Açık · Koyu
   <head> içinde, stillerden ÖNCE ve senkron yüklenir; böylece sayfa açılırken renk sıçraması olmaz.
   Seçim cihazda "sTema" anahtarında tutulur (oto | acik | koyu). Varsayılan: oto.
   Sayfa <html data-tema="acik|koyu"> ile boyanır; CSS'te html[data-tema="acik"] ile açık renkler verilir.
   Oyun sayfaları bu dosyayı yüklemez, hep koyu kalır. */
(function () {
  var KEY = "sTema", d = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
  function secim() { try { var v = localStorage.getItem(KEY); return v === "acik" || v === "koyu" ? v : "oto"; } catch (e) { return "oto"; } }
  function uygula() {
    var s = secim(), t = s === "oto" ? (mq && mq.matches ? "acik" : "koyu") : s;
    d.setAttribute("data-tema", t);
    d.setAttribute("data-tema-secim", s);
    d.style.colorScheme = t === "acik" ? "light" : "dark";
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "acik" ? "#f6f3ec" : "#000000");
    try { document.dispatchEvent(new CustomEvent("tema", { detail: { tema: t, secim: s } })); } catch (e) {}
    return t;
  }
  uygula();
  if (mq) { var f = function () { if (secim() === "oto") uygula(); }; mq.addEventListener ? mq.addEventListener("change", f) : mq.addListener(f); }
  // Başka sekmede değişirse burada da uygula
  window.addEventListener("storage", function (e) { if (e.key === KEY) uygula(); });
  window.Tema = {
    secim: secim,
    tema: function () { return d.getAttribute("data-tema"); },
    sec: function (v) { try { if (v === "oto") localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) {} return uygula(); }
  };
  // meta theme-color sayfada tema.js'den sonra geliyorsa, DOM hazır olunca bir kez daha ayarla
  document.addEventListener("DOMContentLoaded", uygula);
})();
