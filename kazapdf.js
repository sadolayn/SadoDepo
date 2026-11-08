/* Kaza Tutanağı Asistanı — PDF dökümü.
   Dış kütüphane ve yazı tipi yok: her A4 sayfa bir tuvale sistem yazı tipiyle çizilir (Türkçe harfler sorunsuz),
   sonra JPEG olarak (DCTDecode) kendi yazdığımız küçük bir PDF dosyasına gömülür. */
(function () {
  var PW = 595.28, PH = 841.89, SC = 2.5, M = 18, CW = PW - 2 * M;
  var FONT = "Arial, Helvetica, 'Liberation Sans', Roboto, 'Noto Sans', 'DejaVu Sans', sans-serif";
  var TA = "#e7f1fb", TB = "#fdf3e1", HDR = "#e6e6e6", LN = "#9a9a9a", INK = "#111", GR = "#555";
  var c; // geçerli bağlam (pt birimine ölçekli)

  function f(size, bold) { c.font = (bold ? "bold " : "") + size + "px " + FONT; }
  function sigdir(s, w, size, min, bold) {
    s = String(s == null ? "" : s);
    for (var z = size; z >= min; z -= 0.25) { f(z, bold); if (c.measureText(s).width <= w) return [s, z]; }
    f(min, bold);
    while (s.length > 1 && c.measureText(s + "…").width > w) s = s.slice(0, -1);
    return [s + "…", min];
  }
  function yazi(s, x, y, o) {
    o = o || {};
    var r = o.w ? sigdir(s, o.w, o.size || 7, o.min || 4.6, o.bold) : (f(o.size || 7, o.bold), [String(s == null ? "" : s), o.size || 7]);
    f(r[1], o.bold); c.fillStyle = o.color || INK; c.textAlign = o.align || "left"; c.textBaseline = "middle";
    c.fillText(r[0], x, y);
  }
  function satirlar(s, w) {
    var out = [];
    String(s || "").split(/\n/).forEach(function (par) {
      var kel = par.split(/\s+/), cur = "";
      kel.forEach(function (k) {
        var t = cur ? cur + " " + k : k;
        if (c.measureText(t).width <= w || !cur) cur = t; else { out.push(cur); cur = k; }
        while (c.measureText(cur).width > w && cur.length > 1) { var i = cur.length; while (i > 1 && c.measureText(cur.slice(0, i)).width > w) i--; out.push(cur.slice(0, i)); cur = cur.slice(i); }
      });
      out.push(cur);
    });
    return out;
  }
  // Kutuya sığdırarak paragraf yazar. Sığmazsa false döner (kesilir).
  function paragraf(s, x, y, w, h, size, min, renk) {
    var z, L, lh;
    for (z = size; z >= min; z -= 0.25) { f(z); lh = z * 1.22; L = satirlar(s, w); if (L.length * lh <= h) break; }
    if (z < min) { z = min; f(z); lh = z * 1.22; L = satirlar(s, w); }
    var sigar = Math.floor(h / lh), tasti = L.length > sigar;
    if (tasti) { L = L.slice(0, sigar); L[L.length - 1] = L[L.length - 1].replace(/.{0,14}$/, "") + "… (devamı ek sayfada)"; }
    c.fillStyle = renk || INK; c.textAlign = "left"; c.textBaseline = "top";
    L.forEach(function (l, i) { c.fillText(l, x, y + i * lh); });
    return !tasti;
  }
  function kutu(x, y, w, h, dolgu, cizgi) {
    if (dolgu) { c.fillStyle = dolgu; c.fillRect(x, y, w, h); }
    if (cizgi !== false) { c.strokeStyle = cizgi || LN; c.lineWidth = 0.5; c.strokeRect(x, y, w, h); }
  }
  function baslikBar(x, y, w, h, s, renk, hiza) {
    kutu(x, y, w, h, renk || HDR);
    yazi(s, hiza === "left" ? x + 3 : x + w / 2, y + h / 2 + .3, { size: 7, bold: true, align: hiza || "center", w: w - 6, min: 5 });
  }
  function satir(x, y, w, h, etiket, deger, lw) {
    lw = lw || 74;
    c.strokeStyle = "#c4c4c4"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w, y + h); c.stroke();
    yazi(etiket + ":", x + 2.5, y + h / 2 + .3, { size: 5.8, color: GR, w: lw - 4, min: 4.5 });
    if (deger) yazi(deger, x + lw, y + h / 2 + .3, { size: 7, bold: true, w: w - lw - 3, min: 4.6 });
  }
  function tarihTR(s) { if (!s) return ""; var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[3] + "." + m[2] + "." + m[1] : s; }
  function zamanTR(ts) {
    var d = new Date(ts); if (isNaN(d)) return "";
    var p = function (n) { return String(n).padStart(2, "0"); };
    return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function yeniSayfa() {
    var cv = document.createElement("canvas");
    cv.width = Math.round(PW * SC); cv.height = Math.round(PH * SC);
    c = cv.getContext("2d");
    c.fillStyle = "#fff"; c.fillRect(0, 0, cv.width, cv.height);
    c.setTransform(SC, 0, 0, SC, 0, 0);
    return cv;
  }
  function resimSigdir(img, x, y, w, h) {
    var iw = img.width, ih = img.height, k = Math.min(w / iw, h / ih), dw = iw * k, dh = ih * k;
    c.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    return [x + (w - dw) / 2, y + (h - dh) / 2, dw, dh];
  }
  async function bitmap(blob) {
    if (!blob) return null;
    try { if (window.createImageBitmap) return await createImageBitmap(blob); } catch (e) {}
    return await new Promise(function (res) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { URL.revokeObjectURL(u); res(im); };
      im.onerror = function () { URL.revokeObjectURL(u); res(null); };
      im.src = u;
    });
  }

  /* ---------- 9. ilk darbe çizimi ---------- */
  function darbeCiz(K, v, cx, cy, yuk) {
    var tasit = v.motor ? K.MOTOR : K.ARABA, vb = K.VB, k = yuk / vb[3];
    c.save(); c.translate(cx - vb[2] * k / 2 - vb[0] * k, cy - yuk / 2 - vb[1] * k); c.scale(k, k);
    tasit.forEach(function (p) {
      var yol = new Path2D(p[1]);
      if (p[0] === "gv") { c.fillStyle = "#fff"; c.fill(yol); c.strokeStyle = "#333"; c.lineWidth = 1.6; c.stroke(yol); }
      else if (p[0] === "cm") { c.fillStyle = "#d9e3ec"; c.fill(yol); c.strokeStyle = "#666"; c.lineWidth = 1; c.stroke(yol); }
      else { c.fillStyle = "#444"; c.fill(yol); }
    });
    f(12); c.fillStyle = "#777"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("Ön", 50, -20); c.fillText("Arka", 50, 204);
    if (v.darbe) {
      var o = K.ok(v.darbe);
      c.strokeStyle = "#d23c1e"; c.lineWidth = 6; c.lineCap = "round";
      c.beginPath(); c.moveTo(o.kuyruk[0], o.kuyruk[1]); c.lineTo(o.taban[0], o.taban[1]); c.stroke();
      c.fillStyle = "#d23c1e"; c.beginPath(); c.moveTo(o.uc[0], o.uc[1]); c.lineTo(o.k1[0], o.k1[1]); c.lineTo(o.k2[0], o.k2[1]); c.closePath(); c.fill();
    }
    c.restore();
  }

  /* ---------- 1. sayfa: resmî form düzeni ---------- */
  function sayfa1(K, S, imzaA, imzaB) {
    var cv = yeniSayfa(), A = S.A, B = S.B, y, i;
    yazi("KAZA BİLGİ DÖKÜMÜ — MADDİ HASARLI TRAFİK KAZASI", PW / 2, M + 9, { size: 12.5, bold: true, align: "center", w: CW });
    yazi("Resmî “Maddi Hasarlı Trafik Kazası Tespit Tutanağı” alan sırasıyla hazırlandı · " + zamanTR(Date.now()), PW / 2, M + 21, { size: 6.3, color: GR, align: "center", w: CW });
    y = 46;
    // 1 ve 2
    var w1 = 128;
    baslikBar(M, y, w1, 11, "1. Kaza Tarihi", null, "left");
    kutu(M, y + 11, w1, 33, null);
    satir(M, y + 11, w1, 11, "Tarih", tarihTR(S.zaman.tarih), 30);
    satir(M, y + 22, w1, 11, "Saat", S.zaman.saat, 30);
    var x2 = M + w1 + 4, w2 = CW - w1 - 4, yer = S.yer, cw3 = w2 / 3;
    baslikBar(x2, y, w2, 11, "2. Kaza Yeri", null, "left");
    kutu(x2, y + 11, w2, 33, null);
    [["İl", yer.il], ["İlçe", yer.ilce], ["Semt", yer.semt], ["Mahalle", yer.mahalle], ["Cadde", yer.cadde], ["Sokak", yer.sokak]].forEach(function (p, j) {
      satir(x2 + (j % 3) * cw3, y + 11 + Math.floor(j / 3) * 11, cw3, 11, p[0], p[1], 34);
    });
    satir(x2, y + 33, w2, 11, "Konum (enlem, boylam)", yer.lat != null ? (+yer.lat).toFixed(6) + ", " + (+yer.lon).toFixed(6) + (yer.acc ? "  (±" + Math.round(yer.acc) + " m)" : "") : "", 90);
    for (i = 1; i < 3; i++) { c.strokeStyle = "#c4c4c4"; c.beginPath(); c.moveTo(x2 + i * cw3, y + 11); c.lineTo(x2 + i * cw3, y + 33); c.stroke(); }
    y += 48;
    // 3
    var tn = (S.tanik || []).filter(function (t) { return t.ad || t.adres || t.tel; }), tr = Math.max(2, Math.min(3, tn.length));
    baslikBar(M, y, CW, 11, "3. Görgü Tanıkları" + (tn.length > 3 ? "  (+" + (tn.length - 3) + " tanık ek sayfada)" : ""), null, "left");
    kutu(M, y + 11, CW, 9 + tr * 10, null);
    var tc = [[M, 150, "Ad Soyad", "ad"], [M + 150, 300, "Adres", "adres"], [M + 450, CW - 450, "Tel No", "tel"]];
    tc.forEach(function (k) { yazi(k[2], k[0] + 3, y + 15.5, { size: 5.8, color: GR }); });
    for (i = 0; i < tr; i++) {
      var ty = y + 20 + i * 10, t = tn[i] || {};
      c.strokeStyle = "#c4c4c4"; c.lineWidth = .4; c.beginPath(); c.moveTo(M, ty); c.lineTo(M + CW, ty); c.stroke();
      tc.forEach(function (k) { if (t[k[3]]) yazi(t[k[3]], k[0] + 3, ty + 5.3, { size: 6.8, bold: true, w: k[1] - 6 }); });
    }
    tc.slice(1).forEach(function (k) { c.beginPath(); c.moveTo(k[0], y + 11); c.lineTo(k[0], y + 20 + tr * 10); c.stroke(); });
    y += 20 + tr * 10 + 4;
    // 4–8: üç sütun
    var wa = 190, wm = CW - 2 * wa - 6, xa = M, xm = M + wa + 3, xb = xm + wm + 3, RH = 10.6;
    baslikBar(xa, y, wa, 12, "ARAÇ A", "#cfe3f6"); baslikBar(xm, y, wm, 12, "7. Uygun Kutulara (x) İşareti Koyunuz"); baslikBar(xb, y, wa, 12, "ARAÇ B", "#f8e2bb");
    y += 12;
    var y0 = y, H4 = 24 * RH;
    kutu(xa, y0, wa, H4, TA); kutu(xb, y0, wa, H4, TB); kutu(xm, y0, wm, H4, "#fff");
    function kolon(x, v, renk) {
      var yy = y0, s = v.surucu, a = v.arac, p = v.police;
      function h(t) { baslikBar(x, yy, wa, RH, t, renk, "left"); yy += RH; }
      function r(e, d, lw) { satir(x, yy, wa, RH, e, d, lw || 82); yy += RH; }
      h("4. Sürücü Bilgileri");
      r("Adı Soyadı", s.ad); r("T.C. Kimlik No", s.tckn); r("Sürücü Belge No. ve Sınıfı", [s.belge, s.sinif].filter(Boolean).join(" / "));
      r("Alındığı Yer (İl/İlçe)", s.belgeYer);
      satir(x, yy, wa, RH * 2, "Adres", "", 82); c.save(); paragraf(s.adres || "", x + 82, yy + 2, wa - 85, RH * 2 - 3, 6.5, 4.8); c.restore(); yy += RH * 2;
      r("Cep Tel", s.tel); r("E-posta", s.eposta);
      h("5. Araç Bilgileri");
      r("Şasi No", a.sasi); r("Marka ve Modeli", a.marka); r("Plaka", a.plaka); r("Kullanım Şekli", a.kullanim);
      h("6. Trafik Sigortası Poliçe Bilgileri");
      r("Sigortalının Adı Soyadı", p.sigortali); r("Sigortalı Cep Tel", p.stel); r("Sigortalı E-posta", p.seposta); r("T.C. Kimlik / Vergi No", p.svkn);
      r("Sigorta Şirketinin Unvanı", p.sirket); r("Acente No", p.acente); r("Poliçe No.", p.no); r("SBM Poliçe No", p.sbm);
      r("Poliçe Başlangıç-Bitiş Tarihi", [tarihTR(p.bas), tarihTR(p.bit)].filter(Boolean).join(" – "), 98);
    }
    kolon(xa, A, "#cfe3f6"); kolon(xb, B, "#f8e2bb");
    // orta sütun: 15 madde
    var IH = (H4 - 2 * RH - RH - 3 * RH) / 15, yy = y0;
    K.MADDE.forEach(function (m, j) {
      var bx = 4, bw = 9;
      c.strokeStyle = "#c4c4c4"; c.lineWidth = .4; c.beginPath(); c.moveTo(xm, yy + IH); c.lineTo(xm + wm, yy + IH); c.stroke();
      [["A", xm + bx, S.kutu.A[j]], ["B", xm + wm - bx - bw, S.kutu.B[j]]].forEach(function (q) {
        var by = yy + (IH - bw) / 2;
        c.fillStyle = q[2] ? (q[0] === "A" ? "#cfe3f6" : "#f8e2bb") : "#fff"; c.fillRect(q[1], by, bw, bw);
        c.strokeStyle = "#333"; c.lineWidth = .6; c.strokeRect(q[1], by, bw, bw);
        if (q[2]) { c.strokeStyle = "#000"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(q[1] + 1.8, by + 1.8); c.lineTo(q[1] + bw - 1.8, by + bw - 1.8); c.moveTo(q[1] + bw - 1.8, by + 1.8); c.lineTo(q[1] + 1.8, by + bw - 1.8); c.stroke(); }
      });
      var tw = wm - 2 * (bx + bw) - 6, zz = 5.6, L;
      for (; zz >= 4.6; zz -= .2) { f(zz); L = satirlar(m, tw); if (L.length <= 2) break; }
      c.fillStyle = INK; c.textAlign = "center"; c.textBaseline = "middle";
      L.slice(0, 2).forEach(function (l, k2) { c.fillText(l, xm + wm / 2, yy + IH / 2 + (L.length > 1 ? (k2 - .5) * zz * 1.12 : 0)); });
      yy += IH;
    });
    function ortaSatir(sol, orta, sag, birim) {
      c.strokeStyle = "#c4c4c4"; c.lineWidth = .4; c.beginPath(); c.moveTo(xm, yy + RH); c.lineTo(xm + wm, yy + RH); c.stroke();
      yazi(orta, xm + wm / 2, yy + RH / 2 + .3, { size: 5.6, align: "center", w: wm - 70, min: 4.4 });
      yazi((sol || "") + (sol && birim ? " " + birim : ""), xm + 3, yy + RH / 2 + .3, { size: 6.8, bold: true, w: 32 });
      yazi((sag || "") + (sag && birim ? " " + birim : ""), xm + wm - 3, yy + RH / 2 + .3, { size: 6.8, bold: true, w: 32, align: "right" });
      yy += RH;
    }
    ortaSatir(A.hiz, "Hız Durumu (km/s)", B.hiz, "km/s");
    ortaSatir(A.fren, "Tespit edildi ise fren izi uzunluğu (m)", B.fren, "m");
    baslikBar(xm, yy, wm, RH, "8. Araç Yeşil Kart (Green Card) Belgesine Sahipse"); yy += RH;
    var ykA = A.yk && A.yk.on ? A.yk : {}, ykB = B.yk && B.yk.on ? B.yk : {};
    ortaSatir(ykA.no, "Yeşil Kart No", ykB.no); ortaSatir(ykA.ulke, "Ülke", ykB.ulke); ortaSatir(ykA.pasaport, "Pasaport No", ykB.pasaport);
    y = y0 + H4 + 4;
    // 9
    var hw = CW / 2, DH = 90;
    baslikBar(M, y, CW, 11, "9. Aracın İlk Darbe Aldığı Yer"); y += 11;
    kutu(M, y, hw, DH, TA); kutu(M + hw, y, hw, DH, TB);
    [[A, M, "A"], [B, M + hw, "B"]].forEach(function (q) {
      var v = q[0];
      yazi(q[2], q[1] + 10, y + 12, { size: 13, bold: true, color: q[2] === "A" ? "#2f6fd6" : "#c47a12" });
      yazi(v.arac.plaka || "", q[1] + 22, y + 12, { size: 7, bold: true, w: 90 });
      yazi(v.motor ? "Motosiklet" : "Otomobil", q[1] + 10, y + 26, { size: 6, color: GR });
      if (!v.darbe) yazi("İşaretlenmedi", q[1] + 10, y + 36, { size: 6, color: GR });
      darbeCiz(K, v, q[1] + hw / 2 + 20, y + DH / 2, DH - 8);
    });
    y += DH + 4;
    // 10
    var KH = 158, KW = KH * 4 / 3;
    baslikBar(M, y, CW, 11, "10. Çarpışma Yerinin ve Anının Taslağı"); y += 11;
    kutu(M, y, CW, KH + 4, "#fff");
    c.save(); var kx = M + CW - KW - 2; c.translate(kx, y + 2); c.scale(KW / Kroki.W, KH / Kroki.H);
    c.beginPath(); c.rect(0, 0, Kroki.W, Kroki.H); c.clip(); Kroki.ciz(c, S.kroki, {}); c.restore();
    c.strokeStyle = "#999"; c.lineWidth = .5; c.strokeRect(kx, y + 2, KW, KH);
    var ly = y + 10, lx = M + 6, lw2 = kx - lx - 8;
    yazi("Açıklama", lx, ly, { size: 7, bold: true }); ly += 11;
    c.fillStyle = "#2f6fd6"; c.fillRect(lx, ly - 4, 12, 8); yazi("A  " + (A.arac.plaka || "") + (A.arac.marka ? " · " + A.arac.marka : ""), lx + 16, ly, { size: 6.6, w: lw2 - 16 }); ly += 11;
    c.fillStyle = "#d4861b"; c.fillRect(lx, ly - 4, 12, 8); yazi("B  " + (B.arac.plaka || "") + (B.arac.marka ? " · " + B.arac.marka : ""), lx + 16, ly, { size: 6.6, w: lw2 - 16 }); ly += 11;
    c.fillStyle = "#c2402a"; c.beginPath(); c.moveTo(lx, ly - 2); c.lineTo(lx + 8, ly - 2); c.lineTo(lx + 8, ly - 4.5); c.lineTo(lx + 13, ly); c.lineTo(lx + 8, ly + 4.5); c.lineTo(lx + 8, ly + 2); c.lineTo(lx, ly + 2); c.fill();
    yazi("Gidiş yönü", lx + 16, ly, { size: 6.6 }); ly += 14;
    var yerT = [S.yer.mahalle, S.yer.cadde, S.yer.sokak].filter(Boolean).join(", ");
    if (yerT) { yazi("Yer:", lx, ly, { size: 6, color: GR }); ly += 4; f(6.6); paragraf(yerT, lx, ly, lw2, 40, 6.6, 5); }
    y += KH + 8;
    // 11
    var GH = 46, tamGorus = true;
    baslikBar(M, y, CW, 11, "11. Sürücü Görüşleri"); y += 11;
    kutu(M, y, hw, GH, TA); kutu(M + hw, y, hw, GH, TB);
    yazi("A", M + 4, y + 6, { size: 7, bold: true, color: "#2f6fd6" }); yazi("B", M + hw + 4, y + 6, { size: 7, bold: true, color: "#c47a12" });
    if (!paragraf(S.gorus.A, M + 13, y + 2.5, hw - 17, GH - 4, 6.6, 5)) tamGorus = false;
    if (!paragraf(S.gorus.B, M + hw + 13, y + 2.5, hw - 17, GH - 4, 6.6, 5)) tamGorus = false;
    y += GH + 4;
    // 12
    var IH2 = 36;
    baslikBar(M, y, CW, 11, "12. Sürücü İmzaları"); y += 11;
    kutu(M, y, hw, IH2, TA); kutu(M + hw, y, hw, IH2, TB);
    [[imzaA, M, A], [imzaB, M + hw, B]].forEach(function (q) {
      c.fillStyle = "#fff"; c.fillRect(q[1] + 70, y + 2, hw - 74, IH2 - 4);
      if (q[0]) resimSigdir(q[0], q[1] + 72, y + 3, hw - 78, IH2 - 6);
      yazi(q[1] === M ? "A sürücüsü" : "B sürücüsü", q[1] + 4, y + 9, { size: 6.4, bold: true, color: q[1] === M ? "#2f6fd6" : "#c47a12" });
      yazi(q[2].surucu.ad || "", q[1] + 4, y + 19, { size: 6.4, w: 64 });
      if (!q[0]) yazi("İmza yok", q[1] + 4, y + 29, { size: 5.8, color: GR });
    });
    y += IH2 + 4;
    // alt not
    kutu(M, y, CW, PH - M + 6 - y, "#fdecea", "#e3a598");
    f(6.5); c.fillStyle = "#7a2414"; c.textAlign = "center"; c.textBaseline = "middle";
    var not = "Bu belge Sadolayn Kaza Asistanı ile hazırlanmış bilgi dökümüdür; resmî tutanak yerine geçmez. Resmî kayıt için SBM'nin Sigortam360 uygulamasını ya da iki sürücünün imzaladığı kâğıt tutanağı kullanın.";
    var L2 = satirlar(not, CW - 12), ny = y + (PH - M + 6 - y) / 2 - (L2.length - 1) * 4;
    f(6.5, true); L2 = satirlar(not, CW - 12);
    L2.forEach(function (l, j) { c.fillText(l, PW / 2, ny + j * 8); });
    return { cv: cv, tamGorus: tamGorus, fazlaTanik: tn.length > 3 ? tn.slice(3) : null };
  }

  function sayfaUst(baslik, S, no, top) {
    yazi(baslik, M, M + 6, { size: 11, bold: true });
    var ust = [tarihTR(S.zaman.tarih), S.zaman.saat, S.A.arac.plaka ? "A " + S.A.arac.plaka : "", S.B.arac.plaka ? "B " + S.B.arac.plaka : ""].filter(Boolean).join(" · ");
    yazi(ust, PW - M, M + 6, { size: 7, color: GR, align: "right", w: 260 });
    c.strokeStyle = "#bbb"; c.lineWidth = .5; c.beginPath(); c.moveTo(M, M + 14); c.lineTo(PW - M, M + 14); c.stroke();
    yazi("Kaza bilgi dökümü · resmî tutanak yerine geçmez", M, PH - M + 4, { size: 6, color: "#777" });
    yazi("Sayfa " + no + " / " + top, PW - M, PH - M + 4, { size: 6, color: "#777", align: "right" });
  }
  async function fotoSayfa(liste, adet, baslik, S, no, top, blobAl) {
    var cv = yeniSayfa(); sayfaUst(baslik, S, no, top);
    var y0 = M + 20, alanH = PH - 2 * M - 30, kolon = adet === 4 ? 2 : 1, sira = adet === 4 ? 2 : 2;
    var hw = (CW - (kolon - 1) * 10) / kolon, hh = (alanH - (sira - 1) * 10) / sira;
    for (var i = 0; i < liste.length; i++) {
      var ft = liste[i], x = M + (i % kolon) * (hw + 10), y = y0 + Math.floor(i / kolon) * (hh + 10);
      kutu(x, y, hw, hh, "#f4f4f4", "#ccc");
      var img = await bitmap(await blobAl(ft.key));
      if (img) { resimSigdir(img, x + 3, y + 3, hw - 6, hh - 20); if (img.close) img.close(); }
      else yazi("Fotoğraf okunamadı", x + hw / 2, y + hh / 2, { size: 8, color: GR, align: "center" });
      yazi(ft.no + " · " + ft.ad + (ft.ts ? " · çekim " + zamanTR(ft.ts) : ""), x + 4, y + hh - 8, { size: 7, bold: true, w: hw - 8 });
    }
    return cv;
  }
  function metinSayfa(S, no, top, fazlaTanik) {
    var cv = yeniSayfa(); sayfaUst("Ek: Sürücü görüşleri ve tanıklar (tam metin)", S, no, top);
    var y = M + 24;
    [["A sürücüsü", S.gorus.A, "#2f6fd6"], ["B sürücüsü", S.gorus.B, "#c47a12"]].forEach(function (g) {
      if (!g[1]) return;
      yazi(g[0], M, y, { size: 9, bold: true, color: g[2] }); y += 8;
      f(8.5); var L = satirlar(g[1], CW), h = Math.min(L.length * 11 + 4, 330);
      paragraf(g[1], M, y, CW, h, 8.5, 6); y += h + 14;
    });
    if (fazlaTanik) {
      yazi("Diğer görgü tanıkları", M, y, { size: 9, bold: true }); y += 12;
      fazlaTanik.forEach(function (t) { yazi([t.ad, t.adres, t.tel].filter(Boolean).join(" · "), M, y, { size: 8, w: CW }); y += 12; });
    }
    return cv;
  }

  /* ---------- PDF dosyası ---------- */
  function hex16(s) { var h = "FEFF"; for (var i = 0; i < s.length; i++) h += s.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0"); return h; }
  function pdfYaz(sayfalar, baslik) {
    var enc = new TextEncoder(), parca = [], off = 0, ofs = [];
    function yaz(x) { var b = typeof x === "string" ? enc.encode(x) : x; parca.push(b); off += b.length; }
    function nesne(no, govde) { ofs[no] = off; yaz(no + " 0 obj\n"); govde(); yaz("\nendobj\n"); }
    yaz("%PDF-1.4\n"); yaz(new Uint8Array([37, 226, 227, 207, 211, 10]));
    var n = sayfalar.length, d = new Date(), p = function (x) { return String(x).padStart(2, "0"); };
    var tarih = "D:" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
    nesne(1, function () { yaz("<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /DisplayDocTitle true >> >>"); });
    nesne(2, function () { yaz("<< /Type /Pages /Kids [" + sayfalar.map(function (_, i) { return (4 + 3 * i) + " 0 R"; }).join(" ") + "] /Count " + n + " >>"); });
    nesne(3, function () { yaz("<< /Title <" + hex16(baslik) + "> /Producer <" + hex16("Sadolayn Kaza Asistanı") + "> /CreationDate (" + tarih + ") >>"); });
    sayfalar.forEach(function (s, i) {
      nesne(4 + 3 * i, function () { yaz("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + PW + " " + PH + "] /Resources << /XObject << /Im0 " + (6 + 3 * i) + " 0 R >> >> /Contents " + (5 + 3 * i) + " 0 R >>"); });
      var ic = "q\n" + PW + " 0 0 " + PH + " 0 0 cm\n/Im0 Do\nQ\n";
      nesne(5 + 3 * i, function () { yaz("<< /Length " + ic.length + " >>\nstream\n" + ic + "endstream"); });
      nesne(6 + 3 * i, function () {
        yaz("<< /Type /XObject /Subtype /Image /Width " + s.w + " /Height " + s.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + s.jpg.length + " >>\nstream\n");
        yaz(s.jpg); yaz("\nendstream");
      });
    });
    var x = off, top = 4 + 3 * n;
    var xr = "xref\n0 " + top + "\n0000000000 65535 f \n";
    for (var i = 1; i < top; i++) xr += String(ofs[i]).padStart(10, "0") + " 00000 n \n";
    yaz(xr + "trailer\n<< /Size " + top + " /Root 1 0 R /Info 3 0 R >>\nstartxref\n" + x + "\n%%EOF\n");
    return new Blob(parca, { type: "application/pdf" });
  }
  function jpeg(cv, q) {
    return new Promise(function (res) {
      cv.toBlob(function (b) { b.arrayBuffer().then(function (ab) { res({ jpg: new Uint8Array(ab), w: cv.width, h: cv.height }); cv.width = cv.height = 1; }); }, "image/jpeg", q);
    });
  }

  // K: {S, ARABA, MOTOR, VB, ok(), MADDE, sahne:[{key,ad,ts}], belge:[...], blob(key)}
  async function yap(K, ilerle) {
    var S = K.S, sayfalar = [];
    var imzaA = S.imza.A ? await bitmap(await K.blob("imza:A")) : null, imzaB = S.imza.B ? await bitmap(await K.blob("imza:B")) : null;
    var sahneG = [], belgeG = [], i;
    for (i = 0; i < K.sahne.length; i += 2) sahneG.push(K.sahne.slice(i, i + 2));
    for (i = 0; i < K.belge.length; i += 4) belgeG.push(K.belge.slice(i, i + 4));
    var s1 = sayfa1(K, S, imzaA, imzaB), ekMetin = !s1.tamGorus || s1.fazlaTanik;
    var top = 1 + sahneG.length + belgeG.length + (ekMetin ? 1 : 0), no = 1;
    sayfalar.push(await jpeg(s1.cv, 0.82)); if (ilerle) ilerle(no, top);
    for (i = 0; i < sahneG.length; i++) { no++; sayfalar.push(await jpeg(await fotoSayfa(sahneG[i], 2, "Fotoğraflar", S, no, top, K.blob), 0.8)); if (ilerle) ilerle(no, top); }
    for (i = 0; i < belgeG.length; i++) { no++; sayfalar.push(await jpeg(await fotoSayfa(belgeG[i], 4, "Belgeler (ehliyet, ruhsat, poliçe)", S, no, top, K.blob), 0.8)); if (ilerle) ilerle(no, top); }
    if (ekMetin) { no++; sayfalar.push(await jpeg(metinSayfa(S, no, top, s1.fazlaTanik), 0.82)); }
    return { blob: pdfYaz(sayfalar, "Kaza Bilgi Dökümü — Maddi Hasarlı Trafik Kazası"), sayfa: sayfalar.length };
  }

  window.KazaPDF = { yap: yap };
})();
