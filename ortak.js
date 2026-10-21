/* ortak.js — bütün sayfalarda ortak parçalar.
   1) Alt bilgi (footer): metni yalnızca burada değiştir, tüm sayfalarda değişir.
      Alt bilgi istemeyen sayfa: <body data-footer="yok">
   2) Veri çekme ve hata kartı:
      Ortak.json(url)                 → no-store ile çeker; olmazsa son kaydedilen kopyaya düşer
      Ortak.hata(el, {ne, tekrar})    → tüm sayfalarda aynı görünen "alınamadı" kartı
   3) Bilgisayardan açanlara sağ altta "📱 Telefonda aç" düğmesi: o sayfanın karekodunu gösterir.
      Karekod yalnızca sayfanın adresini içerir (lib/qrcode.js, MIT, Kazuhiko Arase). İstemeyen sayfa: <body data-karekod="yok">
*/
(function () {
  var FOOTER = 'Copyright © {Y} Sadolayn. All rights reserved.<br><span style="font-size:10.5px;letter-spacing:.3px;color:#555">Tüm hakları saklıdır.</span><br><span style="font-size:10.5px;color:#555">Kişisel bir projedir; herhangi bir bankayla resmi bağı yoktur. Bilgiler kamuya açık kaynaklardan derlenir.</span>';

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

  // Sayfa internetten değil, cihazdaki son kopyadan geldiyse (ağ siteyi engelliyor ya da bağlantı yok) üstte söyle
  if (window.__yedek) {
    var uy = function () {
      var d = document.createElement("div");
      d.style.cssText = "position:relative;z-index:60;margin:0 0 8px;padding:10px 14px;border-radius:0 0 14px 14px;background:#2a2410;border:1px solid #6b5520;border-top:0;color:#f3d79c;font:13.5px/1.45 system-ui,-apple-system,'Segoe UI',sans-serif;text-align:center";
      d.innerHTML = "📴 <b>Bu ağda siteye şu an ulaşılamıyor</b>; bu sayfanın cihazda kayıtlı <b>eski bir kopyasını</b> görüyorsun. Güncel hâli için telefondan (mobil veriyle) bak.";
      document.body.insertBefore(d, document.body.firstChild);
    };
    if (document.body) uy(); else document.addEventListener("DOMContentLoaded", uy);
  }

  // ---- 3) Telefonda aç: bilgisayarda sayfanın karekodu ----
  var ME = (document.currentScript && document.currentScript.src) || "";
  function karekod() {
    var b = document.body;
    if (!b || b.getAttribute("data-karekod") === "yok" || document.getElementById("telAc")) return;
    var masaustu = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches && window.innerWidth >= 900;
    if (!masaustu) return;
    var st = document.createElement("style");
    st.textContent =
      "#telAc{position:fixed;right:18px;bottom:18px;z-index:9000;display:flex;align-items:center;gap:7px;padding:10px 15px;border-radius:99px;border:1px solid #6b5222;background:rgba(18,16,12,.94);color:#f3dca8;font:600 13.5px system-ui,-apple-system,'Segoe UI',sans-serif;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.5)}" +
      "#telAc:hover{border-color:#e0a24f;color:#fff}" +
      "#telAcK{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px}" +
      "#telAcK .in{width:100%;max-width:340px;background:#111;border:1px solid #2c2c2c;border-radius:20px;padding:20px 20px 16px;text-align:center;color:#eee;font:14px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif}" +
      "#telAcK h3{margin:0 0 4px;font-size:18px;color:#fff}#telAcK p{margin:0 0 12px;color:#bbb;font-size:13.5px}" +
      "#telAcK .qr{background:#fff;border-radius:14px;padding:12px;width:220px;height:220px;margin:0 auto 10px;box-sizing:border-box}#telAcK .qr svg{width:100%;height:100%;display:block}" +
      "#telAcK .ad{font:12.5px ui-monospace,Menlo,Consolas,monospace;color:#e0a24f;word-break:break-all;margin-bottom:10px}" +
      "#telAcK .gv{font-size:11.5px;color:#7d7d7d;margin:10px 0 0}" +
      "#telAcK .bt{display:flex;gap:8px}#telAcK button{flex:1;padding:10px;border-radius:11px;border:1px solid #333;background:#1a1a1a;color:#eee;font:600 13.5px system-ui,sans-serif;cursor:pointer}#telAcK button.k{background:#e0a24f;border-color:#e0a24f;color:#1a1205}" +
      "@media print{#telAc,#telAcK{display:none!important}}";
    document.head.appendChild(st);
    var btn = document.createElement("button");
    btn.id = "telAc"; btn.type = "button"; btn.innerHTML = "📱 Telefonda aç"; btn.title = "Bu sayfanın karekodunu göster";
    b.appendChild(btn);
    function lib(cb) {
      if (window.qrcode) return cb();
      var sc = document.createElement("script");
      sc.src = ME ? ME.replace(/ortak\.js(\?.*)?$/, "lib/qrcode.js") : "lib/qrcode.js";
      sc.onload = cb; document.head.appendChild(sc);
    }
    btn.onclick = function () {
      lib(function () {
        var url = location.href;
        var q = qrcode(0, "M"); q.addData(url); q.make();
        var k = document.createElement("div"); k.id = "telAcK";
        k.innerHTML = '<div class="in"><h3>📱 Telefonunda aç</h3><p>Telefonunun kamerasını karekoda tut; bu sayfa telefonunda açılır.</p>' +
          '<div class="qr">' + q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }) + '</div>' +
          '<div class="ad"></div><div class="bt"><button type="button" class="c">🔗 Adresi kopyala</button><button type="button" class="k">Kapat</button></div>' +
          '<div class="gv">Karekod yalnızca yukarıdaki adresi içerir. Bu site giriş, şifre ya da kart bilgisi istemez.</div></div>';
        k.querySelector(".ad").textContent = url.replace(/^https?:\/\//, "");
        var kapat = function () { k.remove(); document.removeEventListener("keydown", esc); };
        var esc = function (e) { if (e.key === "Escape") kapat(); };
        document.addEventListener("keydown", esc);
        k.onclick = function (e) { if (e.target === k) kapat(); };
        k.querySelector(".k").onclick = kapat;
        k.querySelector(".c").onclick = function () {
          var t = this;
          (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { t.textContent = "✅ Kopyalandı"; }, function () { t.textContent = "Adresi seçip kopyala"; });
        };
        b.appendChild(k);
      });
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", karekod); else karekod();
})();
