/* Kaza Tutanağı Asistanı — kroki (çarpışma taslağı) çizim aracı.
   Kroki veri olarak tutulur (şablon + araçlar/oklar/yazılar + kalem izleri); hem ekrandaki tuvale
   hem PDF sayfasına aynı ciz() ile çizilir. Mantıksal alan 1000 × 750 (4:3). */
(function () {
  var W = 1000, H = 750;
  var PAPER = "#f3f1ec", ROAD = "#a7a7a7", EDGE = "#666", LINE = "#fff", GRASS = "#c9dcb8", WALK = "#ddd8cc";
  var RENK = { A: "#2f6fd6", B: "#d4861b" };
  var CAR_L = 140, CAR_W = 66, OK_L = 160;
  var SABLON = [
    ["duz", "Düz yol"], ["dort", "Dört yol kavşak"], ["t", "T kavşak"], ["doner", "Döner kavşak"], ["otopark", "Otopark"], ["bos", "Boş"]
  ];
  var VARSAYILAN = {
    duz: [[300, 425, 0], [700, 325, 180]],
    dort: [[230, 425, 0], [550, 650, -90]],
    t: [[230, 350, 0], [550, 640, -90]],
    doner: [[110, 425, 0], [550, 680, -90]],
    otopark: [[300, 375, 0], [700, 375, 180]],
    bos: [[350, 375, 0], [650, 375, 180]]
  };

  function yeni(tpl) {
    tpl = VARSAYILAN[tpl] ? tpl : "dort";
    var d = { tpl: tpl, items: [], paths: [] };
    arabaYerlestir(d);
    return d;
  }
  function arabaYerlestir(d) {
    var v = VARSAYILAN[d.tpl] || VARSAYILAN.bos;
    d.items = d.items.filter(function (it) { return it.t !== "car"; });
    d.items.unshift({ t: "car", who: "B", x: v[1][0], y: v[1][1], r: v[1][2] });
    d.items.unshift({ t: "car", who: "A", x: v[0][0], y: v[0][1], r: v[0][2] });
  }

  /* ---------- şablonlar ---------- */
  function yolH(c, y0, y1, x0, x1, orta) {
    x0 = x0 == null ? 0 : x0; x1 = x1 == null ? W : x1;
    c.fillStyle = ROAD; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.strokeStyle = EDGE; c.lineWidth = 4; c.setLineDash([]);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.moveTo(x0, y1); c.lineTo(x1, y1); c.stroke();
    if (orta !== false) { c.strokeStyle = LINE; c.lineWidth = 5; c.setLineDash([34, 26]); c.beginPath(); c.moveTo(x0, (y0 + y1) / 2); c.lineTo(x1, (y0 + y1) / 2); c.stroke(); c.setLineDash([]); }
  }
  function yolV(c, x0, x1, y0, y1, orta) {
    y0 = y0 == null ? 0 : y0; y1 = y1 == null ? H : y1;
    c.fillStyle = ROAD; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.strokeStyle = EDGE; c.lineWidth = 4; c.setLineDash([]);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.moveTo(x1, y0); c.lineTo(x1, y1); c.stroke();
    if (orta !== false) { c.strokeStyle = LINE; c.lineWidth = 5; c.setLineDash([34, 26]); c.beginPath(); c.moveTo((x0 + x1) / 2, y0); c.lineTo((x0 + x1) / 2, y1); c.stroke(); c.setLineDash([]); }
  }
  function yaya(c, x, y, w, h, dikey) {
    c.fillStyle = "rgba(255,255,255,.85)";
    var n = 6, i;
    for (i = 0; i < n; i++) {
      if (dikey) c.fillRect(x, y + i * h / n + 4, w, h / n - 8);
      else c.fillRect(x + i * w / n + 4, y, w / n - 8, h);
    }
  }
  function sablon(c, tpl) {
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    if (tpl === "bos") {
      c.strokeStyle = "rgba(0,0,0,.06)"; c.lineWidth = 2;
      for (var g = 50; g < W; g += 50) { c.beginPath(); c.moveTo(g, 0); c.lineTo(g, H); c.stroke(); }
      for (g = 50; g < H; g += 50) { c.beginPath(); c.moveTo(0, g); c.lineTo(W, g); c.stroke(); }
      return;
    }
    if (tpl === "otopark") {
      c.fillStyle = "#bdbdbd"; c.fillRect(0, 0, W, H);
      c.fillStyle = ROAD; c.fillRect(0, 290, W, 170);
      c.strokeStyle = LINE; c.lineWidth = 5;
      for (var x = 40; x <= W - 40; x += 115) {
        c.beginPath(); c.moveTo(x, 40); c.lineTo(x, 270); c.moveTo(x, 480); c.lineTo(x, 710); c.stroke();
      }
      c.beginPath(); c.moveTo(40, 270); c.lineTo(Math.floor((W - 80) / 115) * 115 + 40, 270); c.moveTo(40, 480); c.lineTo(Math.floor((W - 80) / 115) * 115 + 40, 480); c.stroke();
      c.fillStyle = "rgba(255,255,255,.9)"; c.font = "bold 46px system-ui, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("P", W - 40, 375);
      return;
    }
    // kaldırımlar
    c.fillStyle = WALK;
    if (tpl === "duz") { c.fillRect(0, 245, W, 260); yolH(c, 275, 475); return; }
    if (tpl === "dort") {
      c.fillRect(0, 245, W, 260); c.fillRect(370, 0, 260, H);
      yolH(c, 275, 475); yolV(c, 400, 600);
      c.fillStyle = ROAD; c.fillRect(310, 275, 380, 200); c.fillRect(400, 195, 200, 360);
      c.strokeStyle = EDGE; c.lineWidth = 4; c.beginPath(); c.moveTo(310, 275); c.lineTo(400, 275); c.moveTo(600, 275); c.lineTo(690, 275); c.moveTo(310, 475); c.lineTo(400, 475); c.moveTo(600, 475); c.lineTo(690, 475);
      c.moveTo(400, 195); c.lineTo(400, 275); c.moveTo(600, 195); c.lineTo(600, 275); c.moveTo(400, 475); c.lineTo(400, 555); c.moveTo(600, 475); c.lineTo(600, 555); c.stroke();
      yaya(c, 330, 280, 50, 190, true); yaya(c, 620, 280, 50, 190, true); yaya(c, 405, 205, 190, 50, false); yaya(c, 405, 495, 190, 50, false);
      return;
    }
    if (tpl === "t") {
      c.fillRect(0, 170, W, 260); c.fillRect(370, 400, 260, H - 400);
      yolH(c, 200, 400); yolV(c, 400, 600, 400, H);
      c.fillStyle = ROAD; c.fillRect(402, 300, 196, 180); c.strokeStyle = EDGE; c.lineWidth = 4; c.beginPath(); c.moveTo(400, 400); c.lineTo(400, 480); c.moveTo(600, 400); c.lineTo(600, 480); c.stroke();
      yaya(c, 405, 420, 190, 50, false);
      return;
    }
    if (tpl === "doner") {
      c.fillRect(0, 245, W, 260); c.fillRect(370, 0, 260, H);
      yolH(c, 275, 475); yolV(c, 400, 600);
      c.fillStyle = WALK; c.beginPath(); c.arc(500, 375, 245, 0, Math.PI * 2); c.fill();
      c.fillStyle = ROAD; c.beginPath(); c.arc(500, 375, 215, 0, Math.PI * 2); c.fill();
      c.fillRect(0, 275, W, 200); c.fillRect(400, 0, 200, H);
      c.beginPath(); c.arc(500, 375, 215, 0, Math.PI * 2); c.fill();
      c.strokeStyle = LINE; c.lineWidth = 5; c.setLineDash([34, 26]);
      c.beginPath(); c.moveTo(0, 375); c.lineTo(275, 375); c.moveTo(725, 375); c.lineTo(W, 375); c.moveTo(500, 0); c.lineTo(500, 150); c.moveTo(500, 600); c.lineTo(500, H); c.stroke();
      c.beginPath(); c.arc(500, 375, 155, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      c.fillStyle = GRASS; c.strokeStyle = EDGE; c.lineWidth = 4;
      c.beginPath(); c.arc(500, 375, 95, 0, Math.PI * 2); c.fill(); c.stroke();
      return;
    }
  }

  /* ---------- öğeler ---------- */
  function boyut(it, c) {
    if (it.t === "car") return [CAR_L, CAR_W];
    if (it.t === "ok") return [OK_L, 44];
    if (it.t === "yazi") {
      var w = 120;
      if (c) { c.font = "bold 34px system-ui, Arial, sans-serif"; w = c.measureText(it.s || "").width + 20; }
      else w = (it.s || "").length * 19 + 20;
      return [Math.max(60, w), 50];
    }
    return [40, 40];
  }
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function arabaCiz(c, it) {
    var L = CAR_L, Wd = CAR_W, col = RENK[it.who] || "#555";
    c.save(); c.translate(it.x, it.y); c.rotate(it.r * Math.PI / 180);
    c.fillStyle = "rgba(0,0,0,.18)"; rr(c, -L / 2 + 4, -Wd / 2 + 5, L, Wd, 16); c.fill();
    c.fillStyle = col; c.strokeStyle = "rgba(0,0,0,.55)"; c.lineWidth = 3; rr(c, -L / 2, -Wd / 2, L, Wd, 16); c.fill(); c.stroke();
    // ön cam (önde, +x), arka cam
    c.fillStyle = "rgba(220,235,250,.92)";
    c.beginPath(); c.moveTo(L / 2 - 46, -Wd / 2 + 9); c.lineTo(L / 2 - 26, -Wd / 2 + 13); c.lineTo(L / 2 - 26, Wd / 2 - 13); c.lineTo(L / 2 - 46, Wd / 2 - 9); c.closePath(); c.fill();
    c.fillStyle = "rgba(220,235,250,.7)";
    c.beginPath(); c.moveTo(-L / 2 + 30, -Wd / 2 + 11); c.lineTo(-L / 2 + 16, -Wd / 2 + 14); c.lineTo(-L / 2 + 16, Wd / 2 - 14); c.lineTo(-L / 2 + 30, Wd / 2 - 11); c.closePath(); c.fill();
    // farlar
    c.fillStyle = "#fff6c8"; c.fillRect(L / 2 - 7, -Wd / 2 + 7, 5, 12); c.fillRect(L / 2 - 7, Wd / 2 - 19, 5, 12);
    c.restore();
    c.save(); c.translate(it.x, it.y);
    c.font = "bold 40px system-ui, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.lineWidth = 6; c.strokeStyle = "rgba(0,0,0,.55)"; c.strokeText(it.who, 0, 2); c.fillStyle = "#fff"; c.fillText(it.who, 0, 2);
    c.restore();
  }
  function okCiz(c, it) {
    c.save(); c.translate(it.x, it.y); c.rotate(it.r * Math.PI / 180);
    var L = OK_L;
    c.fillStyle = "#c2402a"; c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 3; c.lineJoin = "round";
    c.beginPath(); c.moveTo(-L / 2, -7); c.lineTo(L / 2 - 38, -7); c.lineTo(L / 2 - 38, -22); c.lineTo(L / 2, 0); c.lineTo(L / 2 - 38, 22); c.lineTo(L / 2 - 38, 7); c.lineTo(-L / 2, 7); c.closePath();
    c.stroke(); c.fill();
    c.restore();
  }
  function yaziCiz(c, it) {
    c.save(); c.translate(it.x, it.y); c.rotate(it.r * Math.PI / 180);
    c.font = "bold 34px system-ui, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round";
    c.lineWidth = 8; c.strokeStyle = "rgba(255,255,255,.92)"; c.strokeText(it.s || "", 0, 1);
    c.fillStyle = "#1d1d1d"; c.fillText(it.s || "", 0, 1);
    c.restore();
  }
  function izCiz(c, p) {
    if (!p || p.length < 2) return;
    c.save(); c.strokeStyle = "#1d1d1d"; c.lineWidth = 6; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(p[0], p[1]);
    if (p.length === 2) c.lineTo(p[0] + .1, p[1]);
    for (var i = 2; i < p.length - 2; i += 2) { var mx = (p[i] + p[i + 2]) / 2, my = (p[i + 1] + p[i + 3]) / 2; c.quadraticCurveTo(p[i], p[i + 1], mx, my); }
    c.lineTo(p[p.length - 2], p[p.length - 1]); c.stroke(); c.restore();
  }
  // c: mantıksal birimlere (1000×750) ölçeklenmiş bağlam. o.sec: seçili öğe, o.hs: tutamaç yarıçapı
  function ciz(c, d, o) {
    o = o || {};
    c.save();
    sablon(c, d.tpl);
    (d.paths || []).forEach(function (p) { izCiz(c, p); });
    var sira = d.items.filter(function (i) { return i.t === "car"; }).concat(d.items.filter(function (i) { return i.t !== "car"; }));
    sira.forEach(function (it) { if (it.t === "car") arabaCiz(c, it); else if (it.t === "ok") okCiz(c, it); else yaziCiz(c, it); });
    if (o.sec) {
      var it = o.sec, b = boyut(it, c), hs = o.hs || 24;
      c.save(); c.translate(it.x, it.y); c.rotate(it.r * Math.PI / 180);
      c.strokeStyle = "#e0a24f"; c.lineWidth = Math.max(3, hs / 6); c.setLineDash([12, 8]);
      c.strokeRect(-b[0] / 2 - 10, -b[1] / 2 - 10, b[0] + 20, b[1] + 20); c.setLineDash([]);
      var hy = -b[1] / 2 - 10 - hs * 2.2;
      c.beginPath(); c.moveTo(0, -b[1] / 2 - 10); c.lineTo(0, hy); c.stroke();
      c.fillStyle = "#e0a24f"; c.strokeStyle = "#5a4320"; c.lineWidth = Math.max(2, hs / 10);
      c.beginPath(); c.arc(0, hy, hs, 0, Math.PI * 2); c.fill(); c.stroke();
      c.strokeStyle = "#000"; c.lineWidth = Math.max(2, hs / 8);
      c.beginPath(); c.arc(0, hy, hs * .5, -Math.PI * .9, Math.PI * .5); c.stroke();
      c.restore();
    }
    c.restore();
  }
  function bosMu(d) {
    if (!d) return true;
    return !(d.paths && d.paths.length) && !d.items.some(function (i) { return i.t !== "car"; });
  }

  /* ---------- etkileşim ---------- */
  function bagla(cv, al, degisti, ui) {
    var c = cv.getContext("2d"), sec = null, mod = "tasi", gecmis = [], k = 1;
    var ptr = new Map(), is = null; // is: {tur, ...}
    var kutu = cv.closest(".kz-kroki"), cw = cv.parentNode;

    function boyutla() {
      if (kutu.classList.contains("tam")) {
        var aw = cw.clientWidth, ah = cw.clientHeight, w = Math.min(aw, ah * W / H);
        cv.style.width = w + "px"; cv.style.height = (w * H / W) + "px";
      } else { cv.style.width = ""; cv.style.height = ""; }
      var r = cv.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
      if (!r.width) return;
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.width * H / W * dpr);
      k = cv.width / W; ciz2();
    }
    function hs() { var r = cv.getBoundingClientRect(); return r.width ? 20 * W / r.width : 24; }
    function ciz2() {
      var d = al(); if (!d) return;
      if (sec && d.items.indexOf(sec) < 0) sec = null;
      c.setTransform(k, 0, 0, k, 0, 0); ciz(c, d, { sec: sec, hs: hs() });
      if (ui && ui.secim) ui.secim(sec);
    }
    function nokta(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
    function yerel(it, p) {
      var a = -it.r * Math.PI / 180, dx = p.x - it.x, dy = p.y - it.y;
      return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
    }
    function vur(p) {
      var d = al(), pad = hs() * .9, sira = d.items.filter(function (i) { return i.t !== "car"; }).reverse().concat(d.items.filter(function (i) { return i.t === "car"; }).reverse());
      for (var i = 0; i < sira.length; i++) {
        var it = sira[i], b = boyut(it, c), l = yerel(it, p);
        if (Math.abs(l.x) <= b[0] / 2 + pad && Math.abs(l.y) <= b[1] / 2 + pad) return it;
      }
      return null;
    }
    function tutamacMi(p) {
      if (!sec) return false;
      var b = boyut(sec, c), l = yerel(sec, p), h = hs(), hy = -b[1] / 2 - 10 - h * 2.2;
      return Math.hypot(l.x, l.y - hy) <= h * 1.6;
    }
    function kaydet() { gecmis.push(JSON.stringify(al())); if (gecmis.length > 40) gecmis.shift(); }
    function bitti() { degisti(); ciz2(); }
    function yaslan(r) { r = ((r % 360) + 540) % 360 - 180; var s = Math.round(r / 15) * 15; return Math.abs(r - s) < 5 ? s : Math.round(r); }

    cv.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      var p = nokta(e); ptr.set(e.pointerId, p);
      var d = al();
      if (ptr.size === 2) {
        if (is && is.tur === "kalem") { d.paths.pop(); if (is.kayitli) gecmis.pop(); }
        if (sec) {
          var ps = Array.from(ptr.values());
          if (!is || !is.kayitli) kaydet();
          is = { tur: "iki", a0: Math.atan2(ps[1].y - ps[0].y, ps[1].x - ps[0].x), r0: sec.r, kayitli: true };
        } else is = null;
        ciz2(); return;
      }
      if (ptr.size > 2) return;
      if (mod === "kalem") { kaydet(); d.paths.push([Math.round(p.x), Math.round(p.y)]); is = { tur: "kalem", kayitli: true }; ciz2(); return; }
      if (tutamacMi(p)) { kaydet(); is = { tur: "don", kayitli: true }; return; }
      var it = vur(p);
      sec = it;
      if (it) is = { tur: "tasi", dx: p.x - it.x, dy: p.y - it.y, p0: p, kayitli: false };
      else is = null;
      ciz2();
    });
    cv.addEventListener("pointermove", function (e) {
      if (!ptr.has(e.pointerId)) return;
      var p = nokta(e); ptr.set(e.pointerId, p);
      if (!is) return;
      var d = al();
      if (is.tur === "kalem") {
        var yol = d.paths[d.paths.length - 1], lx = yol[yol.length - 2], ly = yol[yol.length - 1];
        if (Math.hypot(p.x - lx, p.y - ly) > 3) { yol.push(Math.round(p.x), Math.round(p.y)); ciz2(); }
      } else if (is.tur === "tasi" && sec) {
        if (!is.kayitli) { if (Math.hypot(p.x - is.p0.x, p.y - is.p0.y) < 4) return; kaydet(); is.kayitli = true; }
        sec.x = Math.round(Math.max(0, Math.min(W, p.x - is.dx))); sec.y = Math.round(Math.max(0, Math.min(H, p.y - is.dy))); ciz2();
      } else if (is.tur === "don" && sec) {
        sec.r = yaslan(Math.atan2(p.y - sec.y, p.x - sec.x) * 180 / Math.PI + 90); ciz2();
      } else if (is.tur === "iki" && sec && ptr.size >= 2) {
        var ps = Array.from(ptr.values()), a = Math.atan2(ps[1].y - ps[0].y, ps[1].x - ps[0].x);
        sec.r = yaslan(is.r0 + (a - is.a0) * 180 / Math.PI); ciz2();
      }
    });
    function birak(e) {
      if (!ptr.has(e.pointerId)) return;
      ptr.delete(e.pointerId);
      if (ptr.size === 0) { var deg = is && is.kayitli; is = null; if (deg) bitti(); }
    }
    cv.addEventListener("pointerup", birak);
    cv.addEventListener("pointercancel", birak);

    var api = {
      ciz: ciz2, boyutla: boyutla,
      mod: function (m) { mod = m; if (m === "kalem") { sec = null; } ciz2(); },
      sablon: function (t) { var d = al(); if (d.tpl === t) return; kaydet(); d.tpl = t; arabaYerlestir(d); sec = null; bitti(); },
      ok: function () {
        var d = al(); kaydet();
        var o = { t: "ok", x: W / 2, y: H / 2, r: 0 };
        if (sec && sec.t === "car") { var a = sec.r * Math.PI / 180; o.x = sec.x + Math.cos(a) * 175; o.y = sec.y + Math.sin(a) * 175; o.r = sec.r; }
        o.x = Math.round(Math.max(60, Math.min(W - 60, o.x))); o.y = Math.round(Math.max(40, Math.min(H - 40, o.y)));
        d.items.push(o); sec = o; mod = "tasi"; bitti(); return o;
      },
      yazi: function (s) { if (!s) return; var d = al(); kaydet(); var o = { t: "yazi", x: W / 2, y: 120, r: 0, s: String(s).slice(0, 40) }; d.items.push(o); sec = o; mod = "tasi"; bitti(); },
      duzenle: function (s) { if (!sec || sec.t !== "yazi" || !s) return; kaydet(); sec.s = String(s).slice(0, 40); bitti(); },
      secili: function () { return sec; },
      dondur: function (dr) { if (!sec) return; kaydet(); sec.r = yaslan(sec.r + dr); bitti(); },
      sil: function () { if (!sec || sec.t === "car") return; var d = al(); kaydet(); d.items.splice(d.items.indexOf(sec), 1); sec = null; bitti(); },
      geri: function () { if (!gecmis.length) return false; var d = JSON.parse(gecmis.pop()), cur = al(); cur.tpl = d.tpl; cur.items = d.items; cur.paths = d.paths; sec = null; bitti(); return true; },
      temizle: function () { var d = al(); kaydet(); d.items = []; d.paths = []; arabaYerlestir(d); sec = null; bitti(); },
      tam: function (on) { kutu.classList.toggle("tam", on); document.body.style.overflow = on ? "hidden" : ""; requestAnimationFrame(boyutla); }
    };
    if (window.ResizeObserver) new ResizeObserver(function () { boyutla(); }).observe(cw); else window.addEventListener("resize", boyutla);
    boyutla();
    return api;
  }

  window.Kroki = { W: W, H: H, SABLON: SABLON, yeni: yeni, ciz: ciz, bagla: bagla, bosMu: bosMu };
})();
