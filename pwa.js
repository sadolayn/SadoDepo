// Uygulama gibi kurulum + çevrimdışı yedek.
// Önemli: Samsung İnternet, Opera vb. bazı Android tarayıcılar "uygulama yükle" deyince kendi ürettikleri
// eski tip bir APK kurar ve Google Play Protect bunu "Güvenli olmayan uygulama" diye engeller.
// Bu yüzden kurulum bildirimi (manifest) yalnızca Google'ın imzaladığı paketi kuran Chrome'da ve
// APK kurmayan iPhone/iPad'de eklenir. Diğer tarayıcılarda "Ana ekrana ekle" sade bir kısayol oluşturur.
(function () {
  var ua = navigator.userAgent, ios = /iphone|ipad|ipod/i.test(ua), android = /android/i.test(ua);
  var brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
  var chrome = brands.length ? brands.some(function (b) { return b.brand === "Google Chrome"; })
    : /Chrome\/\d+/.test(ua) && !/SamsungBrowser|OPR|Opera|EdgA|Edg\/|YaBrowser|MiuiBrowser|HuaweiBrowser|UCBrowser|Vivaldi|DuckDuckGo|Brave|; wv\)/.test(ua);
  window.__tarayici = ios ? "ios" : chrome ? "chrome" : android ? (/SamsungBrowser/.test(ua) ? "samsung" : "android-diger") : "masaustu";
  if (ios || chrome) {
    var l = document.createElement("link"); l.rel = "manifest"; l.href = "manifest.webmanifest"; document.head.appendChild(l);
  }
  if ("serviceWorker" in navigator) window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); window.__kurPrompt = e; });
})();
