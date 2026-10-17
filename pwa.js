// Uygulama gibi kurulum (ana ekrana ekle) + çevrimdışı yedek
(function () {
  if ("serviceWorker" in navigator) window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); window.__kurPrompt = e; document.dispatchEvent(new Event("kurulabilir")); });
})();
