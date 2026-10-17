// Oyunlar sayfası: oyuna girmeden önce rastgele İş Bankası sorusu
// Mesai saatinde (hafta içi 08:30–17:30, resmî tatil değil): yanlışta 10 dk bekleme, üst üste 3 yanlışta 1 gün kilit
// Mesai dışında soru sorulmaz; ara sıra (yaklaşık 4'te 1) cezasız bir "hatırlatma sorusu" çıkar
(function () {
  var TATIL = ["01-01", "04-23", "05-01", "05-19", "07-15", "08-30", "10-29"],
    DINI = { 2026: ["03-20", "03-21", "03-22", "05-27", "05-28", "05-29", "05-30"], 2027: ["03-09", "03-10", "03-11", "05-16", "05-17", "05-18", "05-19"], 2028: ["02-26", "02-27", "02-28", "05-05", "05-06", "05-07", "05-08"] };
  function mesai(d) {
    d = d || new Date();
    var g = d.getDay(), md = ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2), dk = d.getHours() * 60 + d.getMinutes();
    if (g === 0 || g === 6) return false;
    if (TATIL.indexOf(md) >= 0 || (DINI[d.getFullYear()] || []).indexOf(md) >= 0) return false;
    if (md === "10-28" && dk >= 13 * 60) return false; // 28 Ekim öğleden sonra yarım gün
    return dk >= 8 * 60 + 30 && dk < 17 * 60 + 30;
  }
  var KEY = "oyunQuiz", WAIT = 10 * 60 * 1000, DAY = 24 * 60 * 60 * 1000, MAXW = 3;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var st = load(); st.wrong = st.wrong || 0; st.until = st.until || 0;
  if (st.until && Date.now() >= st.until && st.wrong >= MAXW) { st.wrong = 0; st.until = 0; save(st); }

  var css = document.createElement("style");
  css.textContent =
    "#oq{position:fixed;inset:0;background:rgba(0,0,0,.82);display:none;align-items:center;justify-content:center;z-index:9000;padding:16px}" +
    "#oq.on{display:flex}" +
    "#oq .b{width:100%;max-width:380px;background:#0d0d0d;border:1px solid #262626;border-radius:18px;padding:18px;color:#f2f2f2;max-height:92vh;overflow:auto}" +
    "#oq h3{margin:0 0 4px;font-size:18px;color:#e0a24f}" +
    "#oq .r{font-size:12px;color:#8a8a8a;margin:0 0 12px;line-height:1.45}" +
    "#oq .q{font-size:16px;font-weight:600;margin:0 0 12px;line-height:1.4}" +
    "#oq .o{display:block;width:100%;text-align:left;margin:0 0 8px;padding:12px;border-radius:12px;border:1px solid #333;background:#161616;color:#f2f2f2;font-size:15px;cursor:pointer}" +
    "#oq .o.ok{background:#1f5f35;border-color:#2f9a55}#oq .o.no{background:#6a1f1a;border-color:#c0392b}" +
    "#oq .o:disabled{cursor:default}" +
    "#oq .m{min-height:20px;font-size:14px;margin:6px 0 10px;text-align:center}" +
    "#oq .cd{font-size:30px;font-weight:700;text-align:center;color:#e0a24f;margin:8px 0;font-variant-numeric:tabular-nums}" +
    "#oq .x{width:100%;padding:11px;border-radius:12px;border:1px solid #333;background:transparent;color:#8a8a8a;font-size:14px;cursor:pointer}" +
    "#oq .hk{display:flex;gap:6px;justify-content:center;margin:0 0 12px}#oq .hk i{width:12px;height:12px;border-radius:50%;background:#2f9a55}#oq .hk i.u{background:#3a3a3a}";
  document.head.appendChild(css);
  var ov = document.createElement("div"); ov.id = "oq";
  ov.innerHTML = '<div class="b"></div>';
  document.body.appendChild(ov);
  var box = ov.querySelector(".b"), timer = null;
  ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
  function close() { ov.classList.remove("on"); clearInterval(timer); }
  var RULES = '<p class="r">Mesai saatindesin ⏰ Oyuna girmek için bir İş Bankası sorusunu bil 🙂 (Hafta içi 08:30–17:30 dışında soru sorulmaz.)<br>❌ Yanlışta <b>10 dakika</b> sonra tekrar deneyebilirsin.<br>⛔ Üst üste <b>3 yanlışta 1 gün</b> giremezsin.</p>';
  function hak() {
    var h = ""; for (var i = 0; i < MAXW; i++) h += "<i" + (i < st.wrong ? ' class="u"' : "") + "></i>";
    return '<div class="hk" title="Kalan hak">' + h + "</div>";
  }
  function fmt(ms) {
    var s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return (h ? h + ":" + p(m) : m) + ":" + p(x);
  }
  function showLock(name) {
    var day = st.wrong >= MAXW;
    box.innerHTML = "<h3>" + (day ? "⛔ Bugünlük bu kadar" : "⏳ Biraz bekle") + "</h3>" + RULES +
      '<div class="m">' + (day ? "Üst üste 3 yanlış yaptın. Kilidin açılmasına:" : "Yanlış cevaptan sonra tekrar denemek için:") + "</div>" +
      '<div class="cd" id="oqcd"></div>' + hak() + '<button class="x" type="button">Kapat</button>';
    box.querySelector(".x").onclick = close;
    var tick = function () {
      var left = st.until - Date.now();
      if (left <= 0) { clearInterval(timer); if (day) { st.wrong = 0; } st.until = 0; save(st); ask(name); return; }
      var el = document.getElementById("oqcd"); if (el) el.textContent = fmt(left);
    };
    clearInterval(timer); tick(); timer = setInterval(tick, 1000);
    ov.classList.add("on");
  }
  function ask(href) {
    var M = mesai();
    if (!M) {
      // Mesai dışı: çoğu zaman doğrudan oyuna; ara sıra hatırlatma sorusu (cezasız)
      if (Math.random() > 0.25) { location.href = href; return; }
      return askSoft(href);
    }
    if (st.until && Date.now() < st.until) return showLock(href);
    var pool = (typeof ISQ !== "undefined" ? ISQ : []);
    if (!pool.length) { location.href = href; return; }
    var qi; do { qi = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && qi === st.lastQ);
    st.lastQ = qi; save(st);
    var q = pool[qi], idx = q[1].map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    box.innerHTML = "<h3>🔐 Giriş sorusu</h3>" + RULES + hak() + '<div class="q"></div><div class="os"></div><div class="m"></div><button class="x" type="button">Vazgeç</button>';
    box.querySelector(".q").textContent = q[0];
    box.querySelector(".x").onclick = close;
    var os = box.querySelector(".os"), msg = box.querySelector(".m");
    idx.forEach(function (oi) {
      var b = document.createElement("button"); b.type = "button"; b.className = "o"; b.textContent = q[1][oi];
      b.onclick = function () {
        os.querySelectorAll(".o").forEach(function (x) { x.disabled = true; });
        if (oi === q[2]) {
          b.classList.add("ok"); st.wrong = 0; st.until = 0; save(st);
          msg.textContent = "✅ Doğru! Oyun açılıyor…";
          setTimeout(function () { location.href = href; }, 700);
        } else {
          b.classList.add("no"); st.wrong++;
          st.until = Date.now() + (st.wrong >= MAXW ? DAY : WAIT); save(st);
          msg.textContent = st.wrong >= MAXW ? "❌ Yanlış. 3. yanlış: 1 gün giremezsin." : "❌ Yanlış. 10 dakika sonra tekrar dene. Kalan hak: " + (MAXW - st.wrong);
          setTimeout(function () { showLock(href); }, 1400);
        }
      };
      os.appendChild(b);
    });
    ov.classList.add("on");
  }
  // Mesai dışı hatırlatma sorusu: yanlışta ceza yok, doğru cevap gösterilir ve oyun yine açılır
  function askSoft(href) {
    var pool = (typeof ISQ !== "undefined" ? ISQ : []);
    if (!pool.length) { location.href = href; return; }
    var q = pool[Math.floor(Math.random() * pool.length)], idx = q[1].map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    box.innerHTML = '<h3>🌙 Mesai dışı · hatırlatma sorusu</h3><p class="r">Mesai dışındasın, soru zorunlu değil 🙂 Bilgini tazelemek için bir tane soralım; yanlış da olsa oyun açılır.</p><div class="q"></div><div class="os"></div><div class="m"></div><button class="x" type="button">Soruyu geç, oyuna gir ›</button>';
    box.querySelector(".q").textContent = q[0];
    box.querySelector(".x").onclick = function () { location.href = href; };
    var os = box.querySelector(".os"), msg = box.querySelector(".m");
    idx.forEach(function (oi) {
      var b = document.createElement("button"); b.type = "button"; b.className = "o"; b.textContent = q[1][oi];
      b.onclick = function () {
        os.querySelectorAll(".o").forEach(function (x, k) { x.disabled = true; if (idx[k] === q[2]) x.classList.add("ok"); });
        if (oi === q[2]) { msg.textContent = "✅ Aferin! Oyun açılıyor…"; setTimeout(function () { location.href = href; }, 900); }
        else { b.classList.add("no"); msg.textContent = "Doğrusu yeşil olan 👆 Oyun açılıyor…"; setTimeout(function () { location.href = href; }, 2200); }
      };
      os.appendChild(b);
    });
    ov.classList.add("on");
  }
  document.querySelectorAll("a.game").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); ask(a.getAttribute("href")); });
  });
})();
