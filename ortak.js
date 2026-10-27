/* ortak.js — bütün sayfalarda ortak parçalar.
   1) Alt bilgi (footer): metni yalnızca burada değiştir, tüm sayfalarda değişir.
      Alt bilgi istemeyen sayfa: <body data-footer="yok">
      Oyun sayfalarında (OYUNLAR listesi ya da <body data-footer="kisa">) tek satır: "© Sadolayn · Okuyunuz ›";
      açıklama dokununca açılır, 15 sn sonra kendiliğinden kapanır (masa küçülmesin diye).
   2) Veri çekme ve hata kartı:
      Ortak.json(url)                 → no-store ile çeker; olmazsa son kaydedilen kopyaya düşer
      Ortak.hata(el, {ne, tekrar})    → tüm sayfalarda aynı görünen "alınamadı" kartı
   3) Bilgisayardan açanlara sağ altta "📱 Telefonda aç" düğmesi: o sayfanın karekodunu gösterir.
      Karekod yalnızca sayfanın adresini içerir (lib/qrcode.js, MIT, Kazuhiko Arase). İstemeyen sayfa: <body data-karekod="yok">
*/
(function () {
  var FOOTER = 'Copyright © {Y} Sadolayn. All rights reserved.<br><span style="font-size:11.5px;letter-spacing:.3px;color:#8a8a8a">Tüm hakları saklıdır.</span><br><span style="display:block;max-width:420px;margin:6px auto 0;font-size:12px;line-height:1.5;color:#9a9a9a">Kişisel bir sitedir; Türkiye İş Bankası A.Ş. ile bağı yoktur, banka tarafından hazırlanmamıştır. Banka adları ilgili kurumun tescilli markasıdır; resmi bilgi için <a href="https://www.isbank.com.tr" target="_blank" rel="noopener" style="color:#b5b5b5;display:inline-block;padding:5px 2px;margin:-5px 0">isbank.com.tr</a>.<br>Ziyaretler isimsiz sayılır; yalnızca kendi isteğinle yazdıkların (öneri formu, Alerts e-postası) saklanır. Ana sayfadaki "Önerileriniz ve görüşleriniz" formuna yazdıkların yalnızca site sahibine ulaşır.</span>';

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

  var OYUNLAR = /^(batak|king|balayi|tavla|solitaire|pilot|tahmin|bilmece)$/;
  var SAYFA = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
  function footer() {
    if (!document.body || document.body.getAttribute("data-footer") === "yok" || document.querySelector("footer.copyright")) return;
    var f = document.createElement("footer"); f.className = "copyright";
    var Y = new Date().getFullYear();
    if (document.body.getAttribute("data-footer") === "kisa" || OYUNLAR.test(SAYFA)) {
      f.style.cssText = "width:100%;flex:none;text-align:center;font-size:11.5px;color:#8a8a8a;margin:8px 0 2px;letter-spacing:.4px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif";
      var metin = FOOTER.replace("{Y}", Y).split("<br>").slice(2).join("<br>");
      f.innerHTML = "© " + Y + " Sadolayn · Tüm hakları saklıdır · " +
        '<button type="button" aria-expanded="false" style="background:none;border:0;padding:6px 4px;min-height:28px;color:#8a7a5e;font:inherit;font-weight:700;text-decoration:underline;text-underline-offset:2px;cursor:pointer">Okuyunuz ›</button>' +
        '<div hidden style="margin-top:4px">' + metin + "</div>";
      var b = f.querySelector("button"), d = f.querySelector("div"), t = null;
      var kapa = function () { d.hidden = true; b.textContent = "Okuyunuz ›"; b.setAttribute("aria-expanded", "false"); clearTimeout(t); };
      b.onclick = function () {
        if (!d.hidden) return kapa();
        d.hidden = false; b.textContent = "Kapat ✕"; b.setAttribute("aria-expanded", "true");
        clearTimeout(t); t = setTimeout(kapa, 15000);
        try { f.scrollIntoView({ block: "end", behavior: "smooth" }); } catch (e) {}
      };
    } else {
      f.style.cssText = "width:100%;text-align:center;font-size:12.5px;color:#9a9a9a;margin:28px 0 8px;letter-spacing:.5px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif";
      f.innerHTML = FOOTER.replace("{Y}", Y);
    }
    document.body.appendChild(f);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", footer); else footer();

  // Erişilebilirlik: <label> ile eşleşmemiş giriş kutularına, hemen üstündeki etiketin metnini ad olarak ver (görünüm değişmez)
  function etiketle() {
    document.querySelectorAll("input:not([type=hidden]), select, textarea").forEach(function (el) {
      if ((el.labels && el.labels.length) || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title")) return;
      var kap = el.closest(".field") || el, p = kap.previousElementSibling, ad = "";
      if (p && p.tagName === "LABEL") ad = p.textContent;
      else if (kap.parentElement) { var l = kap.parentElement.querySelector(":scope > label"); if (l) ad = l.textContent; }
      ad = (ad || el.placeholder || "").replace(/\s+/g, " ").trim();
      if (ad) el.setAttribute("aria-label", ad);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", etiketle); else etiketle();

  // Uzun sayfalarda sağ altta "yukarı" düğmesi: 1,5 ekran aşağı inince belirir; oyun sayfalarında yok
  function yukari() {
    if (!document.body || OYUNLAR.test(SAYFA) || document.body.getAttribute("data-footer") === "yok" || document.getElementById("ortakYukari")) return;
    var b = document.createElement("button"); b.type = "button"; b.id = "ortakYukari"; b.setAttribute("aria-label", "Sayfanın başına dön"); b.textContent = "↑";
    b.style.cssText = "position:fixed;right:14px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:80;width:44px;height:44px;border-radius:50%;border:1px solid #5a4320;background:rgba(12,12,12,.92);color:#e0a24f;font:700 20px/1 system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.6);cursor:pointer;opacity:0;transform:translateY(12px);transition:opacity .25s,transform .25s;pointer-events:none";
    b.onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
    document.body.appendChild(b);
    // Bilgisayarda (geniş ekran) yazılı ve içerik sütununun hemen sağında durur; telefonda yuvarlak ↑
    var yer = function () {
      var genis = innerWidth >= 760, c = document.querySelector(".wrap") || document.querySelector(".mn"), sag = 14;
      b.textContent = genis ? "↑ Başa dön" : "↑";
      b.style.width = genis ? "auto" : "44px"; b.style.padding = genis ? "0 16px" : "0"; b.style.borderRadius = genis ? "999px" : "50%"; b.style.font = genis ? "700 15px/1 system-ui,sans-serif" : "700 20px/1 system-ui,sans-serif";
      if (genis && c) { var r = c.getBoundingClientRect(); if (innerWidth - r.right > b.offsetWidth + 40) sag = Math.max(14, innerWidth - r.right - 18 - b.offsetWidth); }
      b.style.right = sag + "px";
    };
    // 1 ekran (en çok 800 piksel) aşağı inince belirir; büyük ekranda da geç kalmasın
    var f = function () { var esik = Math.min(innerHeight, 800), on = window.scrollY > esik && document.body.scrollHeight > innerHeight + esik * 1.2; b.style.opacity = on ? "1" : "0"; b.style.transform = on ? "none" : "translateY(12px)"; b.style.pointerEvents = on ? "auto" : "none"; };
    window.addEventListener("scroll", f, { passive: true }); window.addEventListener("resize", function () { yer(); f(); }); yer(); f();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", yukari); else yukari();

  // Hangi bölüm gerçekten kullanılıyor? Bir kutu/bölümün içine ilk dokunuşta (düğme, giriş, seçim) o bölümün başlığı
  // anonim olarak GoatCounter'a "bolum-<sayfa>/<başlık>" diye sayılır; sayfa açılışında bir kez, kimlik ve çerez yok.
  function kullanimSayimi() {
    if (OYUNLAR.test(SAYFA) || !window.Rapor) return;
    var f = function (e) {
      var t = e.target.closest ? e.target.closest("button, a, input, select, textarea, summary, [role=button], [role=tab]") : null;
      if (!t) return;
      var kap = t.closest("[data-rapor], section, article, details, .card, .box, .kutu, .panel");
      var ad = kap ? (kap.getAttribute("data-rapor") || ((kap.querySelector("h2, h3, summary, .t, .baslik") || {}).textContent || "")) : "";
      ad = ad.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, "").replace(/\s+/g, " ").trim().slice(0, 30);
      if (ad) Rapor.bolum(ad);
    };
    document.addEventListener("click", f, true);
    document.addEventListener("change", f, true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kullanimSayimi); else kullanimSayimi();

  // Oyunlarda ekranı aşağı çekmek sayfayı yenilemesin (oyun baştan açılmasın).
  // CSS yetmeyen tarayıcılar için: sayfa en üstteyken aşağı doğru çekme engellenir; kaydırılabilir bir pencerenin içi serbest.
  if (OYUNLAR.test(SAYFA)) {
    // Bazı telefon tarayıcıları (ör. Samsung İnternet) 100dvh'i alt çubuk gizliymiş gibi hesaplıyor; oyun açılınca eldeki
    // kartlar çubuğun altında kalıyordu. Sayfa yüksekliği tarayıcının o an gerçekten gösterdiği alana göre ayarlanır.
    var st = document.createElement("style"); st.textContent = "html,body{overscroll-behavior-y:none}body{min-height:var(--oyun-h,100dvh)!important}"; document.head.appendChild(st);
    var hAyarla = function () { document.documentElement.style.setProperty("--oyun-h", Math.round((window.visualViewport && window.visualViewport.height) || window.innerHeight) + "px"); };
    hAyarla(); window.addEventListener("resize", hAyarla); if (window.visualViewport) window.visualViewport.addEventListener("resize", hAyarla);
    var y0 = 0;
    document.addEventListener("touchstart", function (e) { y0 = e.touches[0].clientY; }, { passive: true });
    document.addEventListener("touchmove", function (e) {
      if (e.touches.length !== 1 || window.scrollY > 0 || e.touches[0].clientY - y0 <= 0) return;
      for (var el = e.target; el && el !== document.body; el = el.parentElement) {
        if (el.scrollTop > 0 && el.scrollHeight > el.clientHeight) return; // pencere içinde yukarı kaydırma
      }
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
  }

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
          '<div class="gv">🔒 Okuttuğunda telefonunda çıkan adresin <b style="color:#bbb">sadolayn.github.io/SadoDepo</b> ile başladığını kontrol et. Bu site giriş, şifre ya da kart bilgisi istemez; isteyen bir sayfa açılırsa kapat.</div></div>';
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
