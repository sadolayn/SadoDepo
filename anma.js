/* 10 Kasım anma ekranı (8 Kasım 2026)
   O gün site açıksa saat 09.05'te anma ekranı açılır: fotoğraf, "10 KASIM", anma metni ve "1881 – ∞".
   Siren 09.05'te kendiliğinden çalar (tarayıcı kullanıcı dokunmadan sese izin vermezse düğme çıkar);
   siren bittikten ya da kapatıldıktan sonra isteyen "Sireni çal" düğmesiyle yeniden çalar. Siren ses dosyası değil, tarayıcıda üretilir
   (Web Audio: yavaşça yükselen, düz giden ve sonunda sönen bir siren sesi, yaklaşık 1 dakika).
   ortak.js bu dosyayı yalnızca 10 Kasım'da yükler. Sınıf adları .ai… ile başlar: tema motoru açık modda bunları koyu bırakır. */
(function () {
  var n = new Date(); if (n.getMonth() !== 10 || n.getDate() !== 10 || window.__anma) return; window.__anma = 1;
  var Y = n.getFullYear(), HEDEF = new Date(Y, 10, 10, 9, 5, 0).getTime(), BITIS = new Date(Y, 10, 10, 9, 8, 0).getTime();
  if (Date.now() >= BITIS) return;
  var acildi = false, C = null, durdur = null;

  function siren(sn) { // yavaş açılan, düz giden, sonunda sönen siren
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    C = C || new AC();
    var t0 = C.currentTime + 0.05, son = t0 + sn, g = C.createGain(), f = C.createBiquadFilter(), oscs = [];
    f.type = "lowpass"; f.frequency.value = 1800; f.connect(g); g.connect(C.destination);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16, t0 + 4); g.gain.setValueAtTime(0.16, son - 6); g.gain.exponentialRampToValueAtTime(0.0001, son);
    [[0, "sawtooth"], [7, "sawtooth"], [-5, "triangle"]].forEach(function (d) {
      var o = C.createOscillator(); o.type = d[1]; o.detune.value = d[0];
      o.frequency.setValueAtTime(140, t0); o.frequency.exponentialRampToValueAtTime(520, t0 + 7); // motor gibi yavaş yükselir
      for (var t = t0 + 7; t < son - 6; t += 3) { o.frequency.linearRampToValueAtTime(535, t + 1.5); o.frequency.linearRampToValueAtTime(520, t + 3); } // hafif dalgalanma
      o.frequency.exponentialRampToValueAtTime(160, son); // sönerek biter
      o.connect(f); o.start(t0); o.stop(son + 0.1); oscs.push(o);
    });
    return function () { try { g.gain.cancelScheduledValues(C.currentTime); g.gain.setTargetAtTime(0.0001, C.currentTime, 0.3); oscs.forEach(function (o) { o.stop(C.currentTime + 1.2); }); } catch (e) {} };
  }

  function stil() {
    var s = document.createElement("style");
    s.textContent = ".aiAnma{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;background:#000;color:#f2ead8;text-align:center;font-family:Georgia,'Times New Roman',serif;opacity:0;transition:opacity 1.6s ease}"
      + ".aiAnma.on{opacity:1}.aiAnmaFoto{width:min(56vw,240px);aspect-ratio:3/4;object-fit:cover;object-position:50% 20%;border-radius:14px;filter:grayscale(1) contrast(1.05);box-shadow:0 0 60px rgba(224,162,79,.18)}"
      + ".aiAnmaBas{margin:4px 0 0;font:700 clamp(26px,7.5vw,34px) system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.5px;color:#f2f2f2!important}"
      + ".aiAnmaB{margin:0;max-width:480px;font:400 clamp(17px,4.6vw,21px)/1.55 system-ui,-apple-system,'Segoe UI',sans-serif;text-wrap:balance;letter-spacing:normal;color:#e6e6e6!important}"
      + ".aiAnmaYil{margin:2px 0 0;font:400 clamp(34px,10vw,46px) system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:1px;color:#c9a25e!important}"
      + ".aiAnmaD{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px}"
      + ".aiAnmaD button{min-height:46px;padding:10px 18px;border-radius:999px;border:1px solid #6b5530;background:#15110a;color:#f3d38a;font:700 15px system-ui,sans-serif;cursor:pointer}"
      + ".aiAnmaD button.aiAnmaCal{background:#e0a24f;color:#1a1206;border-color:#e0a24f}.aiAnmaD button[hidden]{display:none}";
    document.head.appendChild(s);
  }

  function ac() {
    if (acildi || Date.now() >= BITIS) return; acildi = true; stil();
    var el = document.createElement("div"); el.className = "aiAnma"; el.setAttribute("data-tema-koru-alan", ""); el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "10 Kasım anma");
    el.innerHTML = '<img class="aiAnmaFoto" src="img/ataturk.jpg" alt="Mustafa Kemal Atatürk">'
      + '<h2 class="aiAnmaBas">10 KASIM</h2>'
      + '<p class="aiAnmaB">Cumhuriyetimizin ve Türkiye&nbsp;İş&nbsp;Bankası\'nın Kurucusu Ulu Önder Mustafa Kemal Atatürk\'ü, tarifsiz bir özlem, derin bir saygı ve sonsuz minnetle anıyoruz.</p>'
      + '<p class="aiAnmaYil">1881 – ∞</p>'
      + '<div class="aiAnmaD"><button type="button" class="aiAnmaCal">🔊 Sireni çal</button><button type="button" class="aiAnmaSus" hidden>🔇 Sesi kapat</button><button type="button" class="aiAnmaKapat">Kapat</button></div>';
    document.body.appendChild(el); requestAnimationFrame(function () { el.classList.add("on"); });
    var cal = el.querySelector(".aiAnmaCal"), sus = el.querySelector(".aiAnmaSus");
    var baslat = function () { if (durdur) return; durdur = siren(60); cal.hidden = true; sus.hidden = !durdur; if (durdur) { var bu = durdur; setTimeout(function () { if (durdur !== bu) return; sus.hidden = true; durdur = null; cal.hidden = false; }, 61000); } }; // bitince yeniden çalınabilir
    cal.onclick = function () { if (C && C.state === "suspended") C.resume().then(function () { durdur = null; baslat(); }); else baslat(); };
    sus.onclick = function () { if (durdur) durdur(); durdur = null; sus.hidden = true; cal.hidden = false; };
    el.querySelector(".aiAnmaKapat").onclick = function () { if (durdur) durdur(); el.classList.remove("on"); setTimeout(function () { el.remove(); }, 1600); };
    // 09.05'te siren kendiliğinden çalar (tarayıcı izin verirse); izin vermezse ya da siren bitince "Sireni çal" ile tekrar çalınabilir
    baslat();
    setTimeout(function () { if (!C || C.state !== "running") { if (durdur) durdur(); durdur = null; sus.hidden = true; cal.hidden = false; } }, 400);
    setTimeout(function () { if (document.body.contains(el) && !durdur) el.querySelector(".aiAnmaKapat").click(); }, 3 * 60000); // 3 dakika sonra kendiliğinden kapanır
  }

  var zaman = null, bak = function () { if (Date.now() >= BITIS) { clearInterval(zaman); return; } if (!acildi && Date.now() >= HEDEF) ac(); };
  var kalan = HEDEF - Date.now();
  if (kalan <= 0) bak(); else setTimeout(bak, kalan);
  zaman = setInterval(bak, 15000); // arka plandaki sekmede zamanlayıcı gecikirse
  document.addEventListener("visibilitychange", function () { if (!document.hidden) bak(); });
})();
