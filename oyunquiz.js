// Oyunlar sayfası giriş kapısı (oyunsaat.js ile birlikte çalışır)
// Yoğun saat (hafta içi 08:45–12:30, 13:30–18:00):
//   bilgisayar → kapalı uyarısı · telefon → İş Bankası sorusu; yanlışta 1 saat bekleme, doğruysa yoğun saat bitene kadar serbest
// Diğer saatler ve tatiller: arada bir sürpriz soru; bilemeyen de oyuna girer, bekleme yok
// Oyun sayfasına doğrudan girilirse oyunsaat.js buraya ?oyun=<sayfa> ile yollar; soru kendiliğinden açılır
(function () {
  var KEY = "oyunQuiz", BEKLE = 60 * 60 * 1000, SURPRIZ = 1 / 3;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var st = load(); st.until = st.until || 0;
  var O = window.OyunSaat || { kapali: function () { return false; }, simdi: Date.now, masaustu: function () { return false; }, gecisVar: function () { return false; }, gecisVer: function () {}, hazir: Promise.resolve() };

  var css = document.createElement("style");
  css.textContent =
    "#oq{position:fixed;inset:0;overflow-y:auto;background:rgba(0,0,0,.82);display:none;align-items:center;justify-content:center;z-index:9000;padding:16px}" +
    "#oq.on{display:flex}" +
    "#oq .b{width:100%;max-width:380px;background:#0d0d0d;border:1px solid #262626;border-radius:18px;padding:18px;color:#f2f2f2;max-height:92vh;max-height:calc(100dvh - 32px);margin:auto;overflow:auto}" +
    "#oq h3{margin:0 0 4px;font-size:18px;color:#e0a24f}" +
    "#oq .r{font-size:12px;color:#8a8a8a;margin:0 0 12px;line-height:1.45}" +
    "#oq .q{font-size:16px;font-weight:600;margin:0 0 12px;line-height:1.4}" +
    "#oq .o{display:block;width:100%;text-align:left;margin:0 0 8px;padding:12px;border-radius:12px;border:1px solid #333;background:#161616;color:#f2f2f2;font-size:15px;cursor:pointer}" +
    "#oq .o.ok{background:#1f5f35;border-color:#2f9a55}#oq .o.no{background:#6a1f1a;border-color:#c0392b}" +
    "#oq .o:disabled{cursor:default}" +
    "#oq .m{min-height:20px;font-size:14px;margin:6px 0 10px;text-align:center}" +
    "#oq .cd{font-size:30px;font-weight:700;text-align:center;color:#e0a24f;margin:8px 0;font-variant-numeric:tabular-nums}" +
    "#oq .x{width:100%;padding:11px;border-radius:12px;border:1px solid #333;background:transparent;color:#8a8a8a;font-size:14px;cursor:pointer}";
  document.head.appendChild(css);
  var ov = document.createElement("div"); ov.id = "oq";
  ov.innerHTML = '<div class="b"></div>';
  document.body.appendChild(ov);
  var box = ov.querySelector(".b"), timer = null;
  ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
  function close() { ov.classList.remove("on"); clearInterval(timer); }
  function go(href) { location.href = href; }
  function sure(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return (h ? h + ":" + p(m) : m) + ":" + p(x);
  }
  function geriSay(hedef, bitince) {
    var tick = function () {
      var left = hedef() - O.simdi();
      if (left <= 0) { clearInterval(timer); bitince(); return; }
      var el = document.getElementById("oqcd"); if (el) el.textContent = sure(left);
    };
    clearInterval(timer); tick(); timer = setInterval(tick, 1000);
  }

  // Bilgisayar, yoğun saat
  function showMasa() {
    box.innerHTML = '<h3>💻 Bilgisayardan şu an kapalı</h3><p class="r">' + O.masaMetin + '</p><div class="m">Bilgisayarda açılmasına:</div><div class="cd" id="oqcd"></div><button class="x" type="button">Kapat</button>';
    box.querySelector(".x").onclick = close;
    geriSay(O.acilis, close);
    ov.classList.add("on");
  }
  // Telefon, yoğun saat, yanlış cevaptan sonra
  function showLock(href) {
    box.innerHTML = '<h3>⏳ Biraz bekle</h3><p class="r">Yanlış cevaptan sonra <b>1 saat</b> beklemen gerekiyor 🙂</p>' +
      '<div class="m">Yeni soru için:</div><div class="cd" id="oqcd"></div><button class="x" type="button">Kapat</button>';
    box.querySelector(".x").onclick = close;
    geriSay(function () { return Math.min(st.until, O.kapali() ? O.acilis() : 0); }, function () { st.until = 0; save(st); ask(href); });
    ov.classList.add("on");
  }
  // sert: yoğun saat sorusu (yanlışta 1 saat) · değilse sürpriz soru (yanlışta da girer)
  function soru(href, sert) {
    var pool = (typeof ISQ !== "undefined" ? ISQ : []);
    if (!pool.length) { if (sert) O.gecisVer(); return go(href); }
    var qi; do { qi = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && qi === st.lastQ);
    st.lastQ = qi; save(st);
    var q = pool[qi], idx = q[1].map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    var bas = sert ? "🔐 Giriş sorusu" : "🎲 Sürpriz soru!";
    var kural = sert ? "Oyuna girmek için bir İş Bankası sorusunu bil 🙂<br>❌ Yanlışta <b>1 saat</b> sonra tekrar deneyebilirsin."
      : "Bilirsen ne güzel; bilemezsen de oyun açılıyor 🙂";
    box.innerHTML = "<h3>" + bas + '</h3><p class="r">' + kural + '</p><div class="q"></div><div class="os"></div><div class="m"></div><button class="x" type="button">Vazgeç</button>';
    box.querySelector(".q").textContent = q[0];
    box.querySelector(".x").onclick = close;
    var os = box.querySelector(".os"), msg = box.querySelector(".m");
    idx.forEach(function (oi) {
      var b = document.createElement("button"); b.type = "button"; b.className = "o"; b.textContent = q[1][oi];
      b.onclick = function () {
        os.querySelectorAll(".o").forEach(function (x) { x.disabled = true; if (+x.dataset.oi === q[2]) x.classList.add("ok"); });
        if (oi === q[2]) {
          b.classList.add("ok"); st.until = 0; save(st);
          if (sert) O.gecisVer();
          msg.textContent = "✅ Doğru! Oyun açılıyor…";
          setTimeout(function () { go(href); }, 700);
        } else if (sert) {
          b.classList.add("no"); st.until = O.simdi() + BEKLE; save(st);
          msg.textContent = "❌ Yanlış. 1 saat sonra tekrar deneyebilirsin.";
          setTimeout(function () { showLock(href); }, 1600);
        } else {
          b.classList.add("no");
          msg.textContent = "Olsun! Doğrusu yeşil olan 🙂 Oyun açılıyor…";
          setTimeout(function () { go(href); }, 1800);
        }
      };
      b.dataset.oi = oi;
      os.appendChild(b);
    });
    ov.classList.add("on");
  }
  function ask(href) {
    if (O.kapali()) {
      if (O.masaustu()) return showMasa();
      if (O.gecisVar()) return go(href);
      if (st.until && O.simdi() < st.until) return showLock(href);
      return soru(href, true);
    }
    if (Math.random() < SURPRIZ) return soru(href, false);
    go(href);
  }
  document.querySelectorAll("a.game").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); ask(a.getAttribute("href")); });
  });
  // Oyun sayfasından yönlendirildiyse (?oyun=batak.html) soruyu hemen aç
  try {
    var u = new URL(location.href), hedef = u.searchParams.get("oyun");
    if (hedef && /^[a-z0-9_-]+\.html(#[a-z0-9_-]+)?$/i.test(hedef)) {
      u.searchParams.delete("oyun"); history.replaceState(null, "", u.pathname + u.search + u.hash);
      O.hazir.then(function () {
        if (!O.kapali()) return go(hedef);
        ask(hedef);
      });
    }
  } catch (e) {}
})();
