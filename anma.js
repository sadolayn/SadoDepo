/* 10 Kasım 09.05 saygı duruşu (8 Kasım 2026)
   O gün site açıksa saat 09.05'te saygı ekranı açılır ve siren çalar. Siren ses dosyası değil, tarayıcıda üretilir
   (Web Audio: yavaşça yükselen, düz giden ve sonunda sönen bir siren sesi, yaklaşık 1 dakika).
   Tarayıcılar kullanıcı dokunmadan ses çalmaya izin vermeyebilir: o zaman ekranda "Sireni çal" düğmesi çıkar.
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
      + ".aiAnmaSaat{font:700 13px system-ui,sans-serif;letter-spacing:4px;color:#c9a25e}.aiAnmaB{margin:0;font-size:clamp(22px,6vw,32px);font-weight:400;line-height:1.25;color:#f2ead8!important}"
      + ".aiAnmaA{margin:0;max-width:440px;font-size:15px;line-height:1.5;color:#cfc6b3!important}.aiAnmaD{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:6px}"
      + ".aiAnmaD button{min-height:46px;padding:10px 18px;border-radius:999px;border:1px solid #6b5530;background:#15110a;color:#f3d38a;font:700 15px system-ui,sans-serif;cursor:pointer}"
      + ".aiAnmaD button.aiAnmaCal{background:#e0a24f;color:#1a1206;border-color:#e0a24f}.aiAnmaD button[hidden]{display:none}";
    document.head.appendChild(s);
  }

  function ac() {
    if (acildi || Date.now() >= BITIS) return; acildi = true; stil();
    var el = document.createElement("div"); el.className = "aiAnma"; el.setAttribute("data-tema-koru-alan", ""); el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "10 Kasım saygı duruşu");
    el.innerHTML = '<img class="aiAnmaFoto" src="img/ataturk.jpg" alt="Mustafa Kemal Atatürk">'
      + '<div class="aiAnmaSaat">10 KASIM · 09.05</div>'
      + '<p class="aiAnmaB">Ulu Önder Atatürk\'ü saygı ve özlemle anıyoruz</p>'
      + '<p class="aiAnmaA">Saygı duruşu</p>'
      + '<div class="aiAnmaD"><button type="button" class="aiAnmaCal" hidden>🔊 Sireni çal</button><button type="button" class="aiAnmaSus" hidden>🔇 Sesi kapat</button><button type="button" class="aiAnmaKapat">Kapat</button></div>';
    document.body.appendChild(el); requestAnimationFrame(function () { el.classList.add("on"); });
    var cal = el.querySelector(".aiAnmaCal"), sus = el.querySelector(".aiAnmaSus");
    var baslat = function () { if (durdur) return; durdur = siren(60); cal.hidden = true; sus.hidden = !durdur; if (durdur) setTimeout(function () { sus.hidden = true; durdur = null; }, 61000); };
    cal.onclick = function () { if (C && C.state === "suspended") C.resume().then(function () { durdur = null; baslat(); }); else baslat(); };
    sus.onclick = function () { if (durdur) durdur(); durdur = null; sus.hidden = true; cal.hidden = false; };
    el.querySelector(".aiAnmaKapat").onclick = function () { if (durdur) durdur(); el.classList.remove("on"); setTimeout(function () { el.remove(); }, 1600); };
    // Kendiliğinden çalmayı dene; tarayıcı izin vermezse düğme görünür
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
