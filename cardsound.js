// Kart sesleri: Web Audio ile üretilen kısa "kart atma", "dağıtma" ve "toplama" sesleri
(function () {
  let AC = null, out = null, noise = null;
  let muted = false;
  try { muted = localStorage.getItem("cardMute") === "1"; } catch (e) {}

  function init() {
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
    if (AC) { if (AC.state !== "running") AC.resume(); return; }
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    out = AC.createGain(); out.gain.value = muted ? 0 : 1; out.connect(AC.destination);
    noise = AC.createBuffer(1, Math.floor(AC.sampleRate * 0.4), AC.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    try { const b = AC.createBuffer(1, 1, 22050); const s = AC.createBufferSource(); s.buffer = b; s.connect(AC.destination); s.start(0); } catch (e) {}
    if (AC.state !== "running") AC.resume();
  }
  // Tek bir kart sesi: kâğıdın havada/çuhada kaymasıyla çıkan yumuşak "fşt" + çuhaya düşen kısa, boğuk "pat".
  // (Eski sürümdeki sinüs "tok" sesi taş/pul gibi duyuluyordu; artık yalnızca filtrelenmiş hışırtı var.)
  function flick(when = 0, vol = 1, bright = 1) {
    if (!AC || muted) return;
    const t = AC.currentTime + when, j = 0.9 + Math.random() * 0.2;
    // 1) kayma: geniş bantlı, tiz ama yumuşatılmış kâğıt hışırtısı
    const s1 = AC.createBufferSource(); s1.buffer = noise; s1.playbackRate.value = j;
    const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.6;
    bp.frequency.setValueAtTime(5200 * bright * j, t); bp.frequency.exponentialRampToValueAtTime(2400 * bright, t + 0.06);
    const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 8500;
    const g1 = AC.createGain();
    g1.gain.setValueAtTime(0.0001, t);
    g1.gain.exponentialRampToValueAtTime(0.32 * vol, t + 0.012);
    g1.gain.exponentialRampToValueAtTime(0.0005, t + 0.075);
    s1.connect(bp); bp.connect(lp); lp.connect(g1); g1.connect(out);
    s1.start(t, Math.random() * 0.25); s1.stop(t + 0.09);
    // 2) düşme: çok kısa, boğuk kâğıt "pat"ı (gürültü, sinüs yok)
    const t2 = t + 0.05 + Math.random() * 0.012;
    const s2 = AC.createBufferSource(); s2.buffer = noise;
    const lp2 = AC.createBiquadFilter(); lp2.type = "lowpass"; lp2.frequency.value = 1800; lp2.Q.value = 0.5;
    const hp2 = AC.createBiquadFilter(); hp2.type = "highpass"; hp2.frequency.value = 350;
    const g2 = AC.createGain();
    g2.gain.setValueAtTime(0.0001, t2);
    g2.gain.exponentialRampToValueAtTime(0.38 * vol, t2 + 0.003);
    g2.gain.exponentialRampToValueAtTime(0.0005, t2 + 0.035);
    s2.connect(hp2); hp2.connect(lp2); lp2.connect(g2); g2.connect(out);
    s2.start(t2, Math.random() * 0.25); s2.stop(t2 + 0.045);
  }
  // Karıştırma (riffle): kartların uçlarının art arda bırakılmasıyla çıkan hızlı "trrrr"
  function riffle(when = 0, dur = 0.55, vol = 0.5) {
    if (!AC || muted) return;
    const n = Math.round(dur / 0.012);
    for (let i = 0; i < n; i++) {
      const t = AC.currentTime + when + i * (dur / n) + Math.random() * 0.004;
      const s = AC.createBufferSource(); s.buffer = noise;
      const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2; bp.frequency.value = 3000 + Math.random() * 2500;
      const g = AC.createGain(), v = vol * (0.5 + 0.5 * Math.sin(Math.PI * i / n)) * (0.7 + Math.random() * 0.3);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3 * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.018);
      s.connect(bp); bp.connect(g); g.connect(out); s.start(t, Math.random() * 0.3); s.stop(t + 0.022);
    }
  }
  // Kayma sesi (kartları toplama / desteyi çevirme)
  function swish(when = 0, dur = 0.22, vol = 0.5) {
    if (!AC || muted) return;
    const t = AC.currentTime + when;
    const src = AC.createBufferSource(); src.buffer = noise; src.loop = true;
    const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(2600, t + dur);
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * 0.35, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    src.connect(bp); bp.connect(g); g.connect(out); src.start(t); src.stop(t + dur + 0.02);
  }

  const CardSfx = {
    play() { init(); flick(0, 1, 1); },
    flip() { init(); flick(0, 0.7, 1.2); },
    deal(n = 13) { init(); for (let i = 0; i < n; i++) flick(i * 0.06, 0.5 + Math.random() * 0.25, 1); },
    collect() { init(); swish(0, 0.24, 0.55); },
    shuffle() { init(); riffle(0, 0.55, 0.55); swish(0.6, 0.22, 0.4); },
  };
  window.CardSfx = CardSfx;

  // İlk dokunuşta sesi uyandır
  const wake = () => init();
  window.addEventListener("pointerdown", wake, { passive: true });
  window.addEventListener("touchstart", wake, { passive: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && AC && AC.state !== "running") AC.resume(); });

  // Ses aç/kapa düğmesi (sol alt köşe)
  // Sayfa kendi ses ayarını gösteriyorsa (<body data-ses-dugmesi="yok">) köşe düğmesi eklenmez
  CardSfx.muted = () => muted;
  CardSfx.setMuted = (m) => { muted = !!m; try { localStorage.setItem("cardMute", muted ? "1" : "0"); } catch (e) {} init(); if (out) out.gain.value = muted ? 0 : 1; };
  window.addEventListener("DOMContentLoaded", () => {
    if (document.body.getAttribute("data-ses-dugmesi") === "yok") return;
    const b = document.createElement("button");
    b.setAttribute("aria-label", "Kart seslerini aç/kapat");
    b.style.cssText = "position:fixed;left:10px;bottom:10px;z-index:9;width:40px;height:40px;border-radius:50%;border:1px solid #333;background:rgba(13,13,13,.85);color:#f2f2f2;font-size:18px;cursor:pointer";
    const upd = () => (b.textContent = muted ? "🔇" : "🔊");
    upd();
    b.onclick = () => {
      muted = !muted;
      try { localStorage.setItem("cardMute", muted ? "1" : "0"); } catch (e) {}
      init();
      if (out) out.gain.value = muted ? 0 : 1;
      upd();
      if (!muted) flick(0, 0.8, 1);
    };
    document.body.appendChild(b);
  });
})();
