/* ortak.js — bütün sayfalarda ortak parçalar.
   1) Alt bilgi (footer): metni yalnızca burada değiştir, tüm sayfalarda değişir.
      Alt bilgi istemeyen sayfa: <body data-footer="yok">
   2) Veri çekme ve hata kartı:
      Ortak.json(url)                 → no-store ile çeker; olmazsa son kaydedilen kopyaya düşer
      Ortak.hata(el, {ne, tekrar})    → tüm sayfalarda aynı görünen "alınamadı" kartı
*/
(function () {
  var FOOTER = 'Copyright © {Y} Sadolayn. All rights reserved.<br><span style="font-size:10.5px;letter-spacing:.3px;color:#555">Tüm hakları saklıdır.</span>';

  var css = document.createElement("style");
  css.textContent =
    ".ortakHata{max-width:440px;margin:18px auto;padding:18px 16px;border-radius:16px;background:#121212;border:1px solid #2c2c2c;text-align:center;color:#cfcfcf;font:14px/1.55 system-ui,-apple-system,'Segoe UI',sans-serif}" +
    ".ortakHata .i{font-size:34px;line-height:1;margin-bottom:6px}.ortakHata b{display:block;color:#fff;font-size:16px;margin-bottom:4px}" +
    ".ortakHata small{display:block;color:#8a8a8a;font-size:12.5px;margin-top:6px}" +
    ".ortakHata button{margin-top:12px;padding:10px 18px;border-radius:12px;border:0;background:#e0a24f;color:#1a1205;font:700 14px system-ui,sans-serif;cursor:pointer}" +
    ".ortakEski{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9999;max-width:92vw;padding:9px 14px;border-radius:99px;background:#2a2410;border:1px solid #6b5520;color:#f3d79c;font:13px system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.5);display:flex;gap:10px;align-items:center}" +
    ".ortakEski button{background:none;border:0;color:#bba06a;font-size:15px;cursor:pointer;padding:0}";
  document.head.appendChild(css);

  function abs(u) { try { return new URL(u, location.href).href.split("?")[0]; } catch (e) { return u; } }
  var eskiGosterildi = false;
  function eskiVeri() {
    if (eskiGosterildi) return; eskiGosterildi = true;
    var go = function () {
      var d = document.createElement("div"); d.className = "ortakEski";
      d.innerHTML = "📴 Güncel veri alınamadı; en son kaydedilen bilgiler gösteriliyor <button aria-label='Kapat'>✕</button>";
      d.querySelector("button").onclick = function () { d.remove(); };
      document.body.appendChild(d); setTimeout(function () { if (d.parentNode) d.remove(); }, 9000);
    };
    if (document.body) go(); else document.addEventListener("DOMContentLoaded", go);
  }

  window.Ortak = {
    json: function (url, opt) {
      var u = url + (url.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now();
      return fetch(u, Object.assign({ cache: "no-store" }, opt || {})).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        if (r.headers.get("x-ortak-yedek")) eskiVeri();
        return r.json();
      }).catch(function (err) {
        if (!window.caches) throw err;
        return caches.match(abs(url), { ignoreSearch: true }).then(function (c) {
          if (!c) throw err;
          eskiVeri(); return c.json();
        });
      });
    },
    /** el: kutu ya da id; o: { ne: "Haberler", tekrar: fonksiyon (yoksa sayfa yenilenir), not: ek açıklama } */
    hata: function (el, o) {
      o = o || {}; if (typeof el === "string") el = document.getElementById(el); if (!el) return;
      var off = navigator.onLine === false;
      el.innerHTML = '<div class="ortakHata"><div class="i">' + (off ? "📡" : "🙏") + "</div><b>" + (o.ne || "Veriler") + " şu an alınamadı</b>" +
        (off ? "İnternet bağlantın yok gibi görünüyor. Bağlanınca tekrar dene." : "Kaynak geçici olarak yanıt vermiyor olabilir. Birazdan tekrar dener misin?") +
        (o.not ? "<small>" + o.not + "</small>" : "") + '<button type="button">🔄 Tekrar dene</button></div>';
      el.querySelector(".ortakHata button").onclick = function () { if (typeof o.tekrar === "function") o.tekrar(); else location.reload(); };
    },
  };

  function footer() {
    if (!document.body || document.body.getAttribute("data-footer") === "yok" || document.querySelector("footer.copyright")) return;
    var f = document.createElement("footer"); f.className = "copyright";
    f.style.cssText = "width:100%;text-align:center;font-size:12px;color:#6f6f6f;margin:28px 0 8px;letter-spacing:.5px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif";
    f.innerHTML = FOOTER.replace("{Y}", new Date().getFullYear());
    document.body.appendChild(f);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", footer); else footer();
})();
