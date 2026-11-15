// kalkan.js — her sayfanın en başında çalışan küçük koruma (15 Kasım 2026).
// 1) Başka bir site bu sayfayı kendi içinde çerçeveyle gösteremez (tıklama tuzağına karşı).
// 2) "javascript:" ya da "data:" ile başlayan bağlantılar hiçbir zaman çalışmaz (veriye sızmış kötü bağlantıya karşı).
(function () {
  if (window.top !== window.self) {
    // Çerçevede açıldıysa sayfa hiç görünmez; tarayıcı izin verirse asıl adrese geçilir.
    document.documentElement.style.display = "none";
    try { window.top.location.replace(window.self.location.href); } catch (e) {}
  }
  var KOTU = /^\s*(javascript|data|vbscript)\s*:/i;
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (a && KOTU.test(a.getAttribute("href") || "")) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
})();
