/* Sadolayn tema seçimi: Otomatik (telefona uyar) · Açık · Koyu
   <head> içinde, stillerden ÖNCE ve senkron yüklenir; böylece sayfa açılırken renk sıçraması olmaz.
   Seçim cihazda "sTema" anahtarında tutulur (oto | acik | koyu). Varsayılan: oto.
   Sayfa <html data-tema="acik|koyu"> ile boyanır.

   Açık mod nasıl çalışır ("boyacı"):
   Sayfaların renkleri koyu tasarıma göre yazıldı. Açık modda bu dosya sayfanın stillerini okur ve her renkli kuralın
   açık karşılığını html[data-tema="acik"] ile başlayan yeni kurallar olarak ekler:
     - koyu zemin → kâğıt beyazı / beyaz kart, koyu renkli zemin → aynı rengin çok açık tonu
     - beyaz üzerinde okunmayan yazı rengi → aynı tonun okunur (≥4.5:1) koyusu; altın → koyu altın
     - koyu çizgi → açık çizgi, siyah gölge → hafif sıcak gölge
     - parlak dolgular (altın düğme, yeşil rozet) ve onların üstündeki yazı olduğu gibi kalır
   Satır içi style="" renkleri de aynı kurala göre çevrilir (koyuya dönünce eski haline gelir).
   Elle düzeltme gereken yerlere sayfanın stiline html[data-tema="acik"] .x { … } yazılır; boyacı bu kurallara
   dokunmaz ve ürettiğini kaynağın ÖNÜNE koyar, böylece elle yazılan her zaman kazanır.
   <html data-tema-motor="yok">: boyacı çalışmaz, sayfa açık renklerini tamamen kendisi verir (index.html).
   Oyun sayfaları bu dosyayı yüklemez, hep koyu kalır. */
(function () {
  var KEY = "sTema", d = document.documentElement, SAYFA = location.pathname;
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
  var motorVar = d.getAttribute("data-tema-motor") !== "yok";
  // Koyu kalacak parçalar (Atatürk açılış sahnesi; sayfa <html data-tema-koru="düzenli ifade"> ile ekleyebilir).
  // Bu kurallar açık modda da özgün renkleriyle yazılır; böylece genel kurallar onları ezemez.
  var KORU = new RegExp("ataIntro|\\.ai[A-Z]" + (d.getAttribute("data-tema-koru") ? "|" + d.getAttribute("data-tema-koru") : ""));
  function secim() { try { var v = localStorage.getItem(KEY); return v === "acik" || v === "koyu" ? v : "oto"; } catch (e) { return "oto"; } }

  /* ---------- renk hesapları (sRGB ↔ Lab) ---------- */
  function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function gam(c) { c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.max(0, Math.min(255, Math.round(c * 255))); }
  function lum(r, g, b) { return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
  function f3(t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; }
  function lab(r, g, b) {
    var R = lin(r), G = lin(g), B = lin(b);
    var x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, y = R * 0.2126 + G * 0.7152 + B * 0.0722, z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    var fx = f3(x), fy = f3(y), fz = f3(z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }
  function fi(t) { return t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787; }
  function rgbL(L, a, b) {
    var fy = (L + 16) / 116, x = fi(fy + a / 500) * 0.95047, y = fi(fy), z = fi(fy - b / 200) * 1.08883;
    return [gam(x * 3.2406 - y * 1.5372 - z * 0.4986), gam(-x * 0.9689 + y * 1.8758 + z * 0.0415), gam(x * 0.0557 - y * 0.2040 + z * 1.0570)];
  }
  function kontrast(r, g, b) { return 1.05 / (lum(r, g, b) + 0.05); } // beyaza karşı
  var ADLAR = { black: [0, 0, 0], white: [255, 255, 255] };
  function coz(s) {
    var m;
    if (s[0] === "#") {
      var h = s.slice(1); if (h.length === 3 || h.length === 4) h = h.replace(/./g, "$&$&");
      return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16), h.length === 8 ? parseInt(h.substr(6, 2), 16) / 255 : 1];
    }
    if ((m = s.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)/))) {
      var a = m[4] == null ? 1 : m[4].slice(-1) === "%" ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return [+m[1], +m[2], +m[3], a];
    }
    if (ADLAR[s]) return ADLAR[s].concat(1);
    return null;
  }
  function yaz(c) {
    var a = Math.round(c[3] * 1000) / 1000;
    return a >= 1 ? "rgb(" + c[0] + ", " + c[1] + ", " + c[2] + ")" : "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", " + a + ")";
  }
  var SICAK = [1.2, 4]; // nötr renklere verilecek hafif sıcaklık (kâğıt tonu)

  // Zemin rengi: koyu → açık. bilgi.parlak: dokunulmadı ve opak/parlak (üstündeki yazı korunur)
  function zemin(c, k) {
    var r = c[0], g = c[1], b = c[2], a = c[3], L = lab(r, g, b), C = Math.hypot(L[1], L[2]);
    if (a === 0) return c;
    if (a < 0.8 && C < 8) { // yarı saydam nötr
      if (L[0] < 20) return k.sabit ? [40, 30, 15, Math.min(0.45, a * 0.6)] : [255, 255, 255, Math.min(0.92, a + 0.3)];
      if (L[0] > 85) return [60, 45, 20, Math.min(0.12, a * 0.5)];
      return c;
    }
    if (a < 0.8) return c; // renkli saydam tonlar (altın %10 gibi) açıkta da güzel durur
    if (L[0] >= 35) { k.parlak = true; return c; }
    var o;
    if (C < 8) {
      if (r + g + b === 0) o = [246, 243, 236];
      else if (L[0] < 9) o = [255, 255, 255];
      else if (L[0] < 22) o = rgbL(94.5, SICAK[0], SICAK[1] + 1.5);
      else o = rgbL(90, SICAK[0], SICAK[1] + 2);
    } else {
      var s = Math.min(12, C * 0.5) / C;
      o = rgbL(97 - L[0] * 0.25, L[1] * s, L[2] * s);
    }
    return o.concat(a);
  }
  // Yazı rengi: beyaz üzerinde 4.5:1 değilse aynı tonun koyusu
  function yazi(c) {
    var a = c[3];
    if (a === 0) return c;
    var L = lab(c[0], c[1], c[2]), C = Math.hypot(L[1], L[2]);
    if (a < 1 && C < 8 && L[0] > 85) return [27, 24, 19, Math.max(a, 0.55)];
    // Hedef beyaza karşı 5.2: kâğıt zeminde (#f6f3ec) ve hafif renkli kartlarda da 4.5'in üstünde kalsın
    if (kontrast(c[0], c[1], c[2]) >= 6.5) return c;
    var hedef, aa = L[1], bb = L[2];
    if (C < 8) { hedef = Math.min(L[0], 8 + (100 - L[0]) * 30 / 42); aa = SICAK[0]; bb = SICAK[1]; } // gri yazı: açık modda biraz daha koyu (≈7:1), koyu moddaki canlılıkla aynı
    else hedef = L[0];
    var o = rgbL(hedef, aa, bb);
    while (kontrast(o[0], o[1], o[2]) < 6.5 && hedef > 5) { hedef -= 1.5; o = rgbL(hedef, aa, bb); }
    return o.concat(a);
  }
  function cizgi(c) {
    var L = lab(c[0], c[1], c[2]), C = Math.hypot(L[1], L[2]);
    if (c[3] === 0) return c;
    if (C < 8) {
      if (L[0] < 9) return [239, 233, 222, c[3]];
      if (L[0] < 40) return [228, 221, 207, c[3]];
      if (L[0] > 88) return [154, 143, 126, c[3]];
      return c;
    }
    if (L[0] < 40) { var s = Math.min(30, C * 0.8) / C; return rgbL(82, L[1] * s, L[2] * s).concat(c[3]); }
    return c;
  }
  function golge(c) {
    var L = lab(c[0], c[1], c[2]), C = Math.hypot(L[1], L[2]);
    if (C < 8 && L[0] < 20) return [60, 45, 20, Math.min(0.18, c[3] * 0.3)];
    if (C < 8 && L[0] > 85) return [60, 45, 20, Math.min(0.08, c[3] * 0.4)];
    return c;
  }
  function yaziGolge(c) {
    var L = lab(c[0], c[1], c[2]), C = Math.hypot(L[1], L[2]);
    if (C < 8 && L[0] < 30) return [0, 0, 0, 0];
    return c;
  }
  var RENK = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\b(?:black|white)\b/g;
  function cevir(deger, fn, k) {
    return deger.replace(RENK, function (s) { var c = coz(s.toLowerCase()); return c ? yaz(fn(c, k)) : s; });
  }

  /* ---------- kural kural çeviri ---------- */
  var ZEMIN = { "background-color": 1, "background-image": 1, background: 1 };
  var YAZI = { color: 1, fill: 1, "-webkit-text-fill-color": 1, "caret-color": 1, "text-decoration-color": 1, "accent-color": 1, "-webkit-text-stroke-color": 1, stroke: 1 };
  var CIZGI = /^(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|column-rule(-color)?|border)$/;
  var VARLAR = {}; // :root'ta bir kez tanımlı değişkenler (bağlama göre çözmek için)
  function kok(sel) { return /^(:root|html)$/.test(sel.trim()); }
  function varTopla(st, sel) {
    if (!kok(sel)) return;
    for (var i = 0; i < st.length; i++) { var p = st[i]; if (p.slice(0, 2) === "--") VARLAR[p] = VARLAR[p] === undefined ? st.getPropertyValue(p).trim() : null; }
  }
  function varCoz(v, n) {
    if ((n || 0) > 6 || v.indexOf("var(") < 0) return v;
    return varCoz(v.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, function (s, ad, yedek) {
      // Yalnızca :root'ta tek tanımlı değişkeni çöz; bölüme/öğeye göre değişen değişkene (ör. --ky) dokunma,
      // yoksa yedek değer (ör. #000) sabitlenir ve seçili düğmenin beyaz yazısı siyaha döner.
      var x = VARLAR[ad]; return x ? x : s;
    }), (n || 0) + 1);
  }
  function secici(sel) {
    var parca = [], d0 = 0, bas = 0;
    for (var i = 0; i < sel.length; i++) { var ch = sel[i]; if (ch === "(" || ch === "[") d0++; else if (ch === ")" || ch === "]") d0--; else if (ch === "," && !d0) { parca.push(sel.slice(bas, i)); bas = i + 1; } }
    parca.push(sel.slice(bas));
    return parca.map(function (s) {
      s = s.trim(); var P = 'html[data-tema="acik"]';
      if (/^(:root|html)\b/.test(s)) return s.replace(/^(:root|html)/, P);
      return P + " " + s;
    }).join(", ");
  }
  function kuralCevir(r) {
    var st = r.style, sel = r.selectorText, out = [], k = { parlak: false, sabit: st.position === "fixed" };
    if (sel.indexOf("data-tema") >= 0) return ""; // elle yazılmış tema kuralı, dokunma
    var aynen = KORU.test(sel), ayni = function (c) { return c; };
    var zemin_ = aynen ? ayni : zemin, yazi_ = aynen ? ayni : yazi, cizgi_ = aynen ? ayni : cizgi, golge_ = aynen ? ayni : golge, yaziGolge_ = aynen ? ayni : yaziGolge;
    var yaziKlip = /background-clip:\s*text|-webkit-background-clip:\s*text/.test(st.cssText);
    var gorulen = {};
    function ekle(p, v, onc) { out.push(p + ": " + v + (onc ? " !important" : "")); }
    // önce zemin (parlaklık bilgisi yazıyı etkiler)
    var liste = [];
    for (var i = 0; i < st.length; i++) liste.push(st[i]);
    ["background", "border", "border-top", "border-right", "border-bottom", "border-left", "border-color", "outline"].forEach(function (p) {
      var v = st.getPropertyValue(p); if (v && v.indexOf("var(") >= 0) liste.push(p);
    });
    liste.sort(function (a, b) { return (ZEMIN[b] ? 1 : 0) - (ZEMIN[a] ? 1 : 0); });
    liste.forEach(function (p) {
      if (gorulen[p]) return; gorulen[p] = 1;
      var v = st.getPropertyValue(p), onc = st.getPropertyPriority(p);
      if (!v) return;
      if (p.slice(0, 2) === "--") {
        var vv = varCoz(v.trim()); var c = coz(vv.toLowerCase());
        if (!c) { if (RENK.test(vv)) { RENK.lastIndex = 0; ekle(p, cevir(vv, zemin_, {})); } RENK.lastIndex = 0; return; }
        var L = lab(c[0], c[1], c[2])[0];
        ekle(p, yaz(L < 35 && c[3] >= 0.8 ? zemin_(c, {}) : yazi_(c)), onc); return;
      }
      var cv = varCoz(v);
      if (ZEMIN[p]) {
        if (!RENK.test(cv)) { RENK.lastIndex = 0; if (/^(none|transparent|initial|inherit|unset)$/.test(cv.trim()) || p === "background-image") ekle(p, v, onc); return; }
        RENK.lastIndex = 0;
        var yv = yaziKlip ? cevir(cv, yazi_) : cevir(cv, zemin_, k);
        // var() içeren kısayol: yalnızca renk/resim parçasını yaz, yoksa background-repeat vb. sıfırlanır
        if (p === "background") { var t1 = cv.trim(); if (coz(t1.toLowerCase())) { p = "background-color"; } else if (/^(linear|radial|conic|repeating)-gradient\(.*\)$/.test(t1)) p = "background-image"; }
        ekle(p, yv, onc);
      } else if (YAZI[p]) {
        ekle(p, k.parlak ? cv : cevir(cv, yazi_), onc);
      } else if (CIZGI.test(p)) {
        ekle(p, cevir(cv, cizgi_), onc);
      } else if (p === "box-shadow") {
        ekle(p, cevir(cv, golge_), onc);
      } else if (p === "text-shadow") {
        ekle(p, cevir(cv, yaziGolge_), onc);
      }
      RENK.lastIndex = 0;
    });
    return out.length ? secici(sel) + " { " + out.join("; ") + "; }" : "";
  }
  function kurallar(liste, sonuc) {
    for (var i = 0; i < liste.length; i++) {
      var r = liste[i];
      if (r.type === 1) { var x = kuralCevir(r); if (x) sonuc.push(x); }
      else if (r.cssRules && (r.type === 4 || r.type === 12)) {
        var ic = []; kurallar(r.cssRules, ic);
        if (ic.length) sonuc.push((r.type === 4 ? "@media " : "@supports ") + r.conditionText + " { " + ic.join("\n") + " }");
      }
    }
  }
  function varlar(liste) {
    for (var i = 0; i < liste.length; i++) { var r = liste[i]; if (r.type === 1) varTopla(r.style, r.selectorText); else if (r.type === 4 && r.cssRules) varlar(r.cssRules); }
  }

  var islenen = typeof WeakSet === "function" ? new WeakSet() : null, uretilen = [];
  function sayfaBoya() {
    if (!motorVar || !islenen) return;
    var ss = document.styleSheets, yeni = false;
    for (var i = 0; i < ss.length; i++) { try { if (ss[i].ownerNode && !ss[i].ownerNode.hasAttribute("data-tema-uretim")) varlar(ss[i].cssRules); } catch (e) {} }
    for (i = 0; i < ss.length; i++) {
      var s = ss[i], n = s.ownerNode;
      if (!n || n.hasAttribute("data-tema-uretim") || islenen.has(n)) continue;
      var kl; try { kl = s.cssRules; } catch (e) { continue; }
      islenen.add(n);
      var sonuc = []; kurallar(kl, sonuc);
      if (!sonuc.length) continue;
      var el = document.createElement("style"); el.setAttribute("data-tema-uretim", ""); el.textContent = sonuc.join("\n");
      n.parentNode.insertBefore(el, n); uretilen.push(el); yeni = true;
    }
    if (yeni) { try { var t = uretilen.map(function (e) { return e.textContent; }).join("\n"); sessionStorage.setItem("temaOn:" + SAYFA, t.length < 400000 ? t : ""); } catch (e) {} }
  }

  /* ---------- satır içi style="" ---------- */
  var ESKI = typeof WeakMap === "function" ? new WeakMap() : null;
  var SATIR = ["color", "background-color", "background-image", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "box-shadow", "outline-color", "text-shadow", "fill", "stroke"];
  var SVGK = ["fill", "stroke", "stop-color"];
  function svgBoya(el) {
    if (!ESKI || el.closest(".ataIntro,[data-tema-koru-alan]")) return;
    var eski = ESKI.get(el) || {};
    SVGK.forEach(function (a) {
      var v = el.getAttribute(a); if (!v || v.charAt(0) !== "#" && v.indexOf("rgb") !== 0) return;
      if (eski["@" + a] && eski["@" + a].yeni === v) return;
      var c = coz(v.toLowerCase()); if (!c) return;
      var L = lab(c[0], c[1], c[2])[0], y;
      if (a === "stroke") y = cizgi(c);
      else if (L < 35) y = zemin(c, {});
      else y = el.tagName.toLowerCase() === "text" || el.tagName.toLowerCase() === "tspan" ? yazi(c) : c;
      y = yaz(y); eski["@" + a] = { eski: v, yeni: y };
      if (y !== v) el.setAttribute(a, y);
    });
    ESKI.set(el, eski);
  }
  function satirBoya(el) {
    if (el.namespaceURI === "http://www.w3.org/2000/svg" && (el.hasAttribute("fill") || el.hasAttribute("stroke") || el.hasAttribute("stop-color"))) svgBoya(el);
    var st = el.style; if (!st || !st.length || !ESKI) return;
    if (el.closest(".ataIntro,[data-tema-koru-alan]")) return;
    var eski = ESKI.get(el) || {}, k = { parlak: false, sabit: st.position === "fixed" };
    SATIR.forEach(function (p) {
      var v = st.getPropertyValue(p); if (!v || !(RENK.test(v))) { RENK.lastIndex = 0; return; } RENK.lastIndex = 0;
      if (eski[p] && eski[p].yeni === v) return; // zaten çevrildi
      var fn = ZEMIN[p] ? zemin : YAZI[p] ? yazi : p === "box-shadow" ? golge : p === "text-shadow" ? yaziGolge : cizgi;
      var y = cevir(v, fn, k);
      if (ZEMIN[p] && k.parlak) k.yaziKoru = true;
      if (YAZI[p] && k.yaziKoru) y = v;
      eski[p] = { eski: v, yeni: y };
      if (y !== v) st.setProperty(p, y, st.getPropertyPriority(p));
    });
    ESKI.set(el, eski);
  }
  function satirGeri(el) {
    var eski = ESKI && ESKI.get(el); if (!eski) return;
    for (var p in eski) {
      if (p.charAt(0) === "@") { if (el.getAttribute(p.slice(1)) === eski[p].yeni) el.setAttribute(p.slice(1), eski[p].eski); }
      else if (el.style.getPropertyValue(p) === eski[p].yeni) el.style.setProperty(p, eski[p].eski);
    }
    ESKI.delete(el);
  }
  var gozcu = null;
  function satirlarBoya(kok) { if (kok.querySelectorAll) { if (kok.hasAttribute && (kok.hasAttribute("style") || kok.hasAttribute("fill") || kok.hasAttribute("stroke"))) satirBoya(kok); var l = kok.querySelectorAll("[style],svg [fill],svg [stroke],svg [stop-color]"); for (var i = 0; i < l.length; i++) satirBoya(l[i]); } }
  function gozcuBaslat() {
    if (!motorVar || gozcu || !window.MutationObserver || !document.body) return;
    satirlarBoya(document.body);
    gozcu = new MutationObserver(function (ml) {
      if (d.getAttribute("data-tema") !== "acik") return;
      ml.forEach(function (m) {
        if (m.type === "attributes") satirBoya(m.target);
        else for (var i = 0; i < m.addedNodes.length; i++) { var n = m.addedNodes[i]; if (n.nodeType === 1) { if (n.tagName === "STYLE" || n.tagName === "LINK") setTimeout(sayfaBoya, 0); else satirlarBoya(n); } }
      });
    });
    gozcu.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["style", "fill", "stroke"] });
  }
  function gozcuDurdur() {
    if (gozcu) { gozcu.disconnect(); gozcu = null; }
    if (document.body) { var l = document.body.querySelectorAll("[style],svg [fill],svg [stroke],svg [stop-color]"); for (var i = 0; i < l.length; i++) satirGeri(l[i]); satirGeri(document.body); }
  }

  /* ---------- uygula ---------- */
  var onbellek = null, gizle = null;
  function hazir() {
    sayfaBoya(); gozcuBaslat();
    if (onbellek) { onbellek.remove(); onbellek = null; }
    if (gizle) { gizle.remove(); gizle = null; }
  }
  function uygula() {
    var s = secim(), t = s === "oto" ? (mq && mq.matches ? "acik" : "koyu") : s;
    d.setAttribute("data-tema", t);
    d.setAttribute("data-tema-secim", s);
    d.style.colorScheme = t === "acik" ? "light" : "dark";
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "acik" ? "#f6f3ec" : "#000000");
    if (t === "acik" && motorVar) {
      if (document.readyState === "loading") {
        // Önceki ziyaretten kalan boyayı hemen uygula; yoksa sayfa hazır olana kadar kısa süre gizle (siyah parlama olmasın)
        var on = ""; try { on = sessionStorage.getItem("temaOn:" + SAYFA) || ""; } catch (e) {}
        if (on && !onbellek) { onbellek = document.createElement("style"); onbellek.setAttribute("data-tema-uretim", ""); onbellek.textContent = on; (document.head || d).appendChild(onbellek); }
        else if (!on && !gizle) { gizle = document.createElement("style"); gizle.setAttribute("data-tema-uretim", ""); gizle.textContent = "html{background:#f6f3ec!important}body{visibility:hidden!important}"; (document.head || d).appendChild(gizle); setTimeout(function () { if (gizle) { gizle.remove(); gizle = null; } }, 1500); }
      } else hazir();
    } else if (t === "koyu") gozcuDurdur();
    try { document.dispatchEvent(new CustomEvent("tema", { detail: { tema: t, secim: s } })); } catch (e) {}
    return t;
  }
  uygula();
  if (mq) { var f = function () { if (secim() === "oto") uygula(); }; mq.addEventListener ? mq.addEventListener("change", f) : mq.addListener(f); }
  window.addEventListener("storage", function (e) { if (e.key === KEY) uygula(); });
  window.Tema = {
    secim: secim,
    tema: function () { return d.getAttribute("data-tema"); },
    sec: function (v) { try { if (v === "oto") localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) {} return uygula(); }
  };
  document.addEventListener("DOMContentLoaded", function () {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", d.getAttribute("data-tema") === "acik" ? "#f6f3ec" : "#000000");
    if (d.getAttribute("data-tema") === "acik") hazir();
  });
  // Geç yüklenen <link> stilleri için
  window.addEventListener("load", function () { if (d.getAttribute("data-tema") === "acik") sayfaBoya(); });
})();
