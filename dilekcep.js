/* Dilekçe Örnekleri (dilekce.html) — liste, form, önizleme, PDF.
   Güvenlik: kullanıcının yazdığı hiçbir şey innerHTML'e girmez; önizleme textContent ile kurulur.
   Gizlilik: yazılanlar cihazdan çıkmaz. "Hatırla" açıksa yalnızca ad, telefon, e-posta, adres bu cihazda (localStorage) tutulur; T.C. kimlik no hiç tutulmaz. */
(function () {
  "use strict";
  var T = window.DILEKCELER || [], KAT = window.DILEKCE_KAT || [];
  var $ = function (id) { return document.getElementById(id); };
  var BOS = "", NOKTA = "……………";
  var GLOBAL = ["ad", "tc", "tel", "eposta", "adres", "yer"];
  var ls = {
    al: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    yaz: function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var tr = function (s) { return String(s).toLocaleUpperCase("tr-TR"); };
  var sade = function (s) {
    return String(s || "").toLocaleLowerCase("tr-TR").replace(/[çğıöşüâîû]/g, function (c) { return { "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u", "â": "a", "î": "i", "û": "u" }[c]; });
  };
  var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  var bugun = function () { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  var tarihYaz = function (v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? m[3] + "." + m[2] + "." + m[1] : ""; };
  function toast(s) { var t = $("dlToast"); t.textContent = s; t.classList.add("on"); clearTimeout(toast.z); toast.z = setTimeout(function () { t.classList.remove("on"); }, 2200); }

  // ---------- Alan tanımı ----------
  function alan(a) { // [k, l, p, t, o]
    var tur = a[3] || "", ops = tur.slice(-1) === "?";
    tur = tur.replace("?", "");
    return { k: a[0], l: a[1], p: a[2] || "", t: tur, ops: ops, sec: Array.isArray(a[4]) ? a[4] : null, yedek: typeof a[4] === "string" ? a[4] : "" };
  }

  // ---------- Durum ----------
  var sablon = null, V = {}, ELLE = {}, durum = {};
  var IMZA = null; // { url, w, h } — yalnızca bellekte, hiçbir yere kaydedilmez
  var G = ls.al("dlKimlik", {}) || {};
  var hatirla = !!ls.al("dlHatirla", false);
  if (!hatirla) G = {};

  // ---------- Liste ----------
  var aktifKat = "tum";
  function listeCiz() {
    var q = sade($("dlAra").value.trim()), kutu = $("dlGruplar"), say = 0;
    kutu.textContent = "";
    KAT.forEach(function (k) {
      if (aktifKat !== "tum" && aktifKat !== k[0]) return;
      var ler = T.filter(function (t) { return t.kat === k[0] && (!q || q.split(/\s+/).every(function (w) { return sade(t.ad + " " + t.ac + " " + (t.ara || "") + " " + k[1]).indexOf(w) >= 0; })); });
      if (!ler.length) return;
      say += ler.length;
      var g = el("section", "dl-grup"), h = el("h2");
      h.append(el("span", "", k[2] + " " + k[1]), el("small", "", ler.length + " örnek"));
      var s = el("div", "dl-satirlar");
      ler.forEach(function (t) {
        var b = el("button", "dl-row"); b.type = "button"; b.dataset.id = t.id;
        var tx = el("span", "tx"); tx.append(el("span", "t", t.ad), el("span", "d", t.ac));
        b.append(el("span", "ik", t.ik), tx, el("span", "ok", "›"));
        s.append(b);
      });
      g.append(h, s); kutu.append(g);
    });
    $("dlBos").hidden = say > 0;
    sonCiz(q);
  }
  function katCiz() {
    var k = $("dlKat"); k.textContent = "";
    [["tum", "Tümü", "✨"]].concat(KAT).forEach(function (c) {
      var b = el("button", c[0] === aktifKat ? "on" : "", c[2] + " " + c[1]); b.type = "button"; b.dataset.k = c[0];
      b.setAttribute("role", "tab"); b.setAttribute("aria-selected", c[0] === aktifKat ? "true" : "false");
      k.append(b);
    });
  }
  function sonCiz(q) {
    var kutu = $("dlSon"); kutu.textContent = "";
    var son = (ls.al("dlSon", []) || []).map(function (id) { return T.find(function (t) { return t.id === id; }); }).filter(Boolean);
    if (!son.length || q || aktifKat !== "tum") return;
    var d = el("div", "dl-son"), w = el("div");
    d.append(el("b", "", "Son kullandıkların"));
    son.forEach(function (t) { var b = el("button", "", t.ik + " " + t.ad); b.type = "button"; b.dataset.id = t.id; w.append(b); });
    d.append(w); kutu.append(d);
  }
  $("dlKat").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-k]"); if (!b) return;
    aktifKat = b.dataset.k; katCiz(); listeCiz();
  });
  $("dlAra").addEventListener("input", listeCiz);
  document.addEventListener("click", function (e) {
    var b = e.target.closest("#dlGruplar .dl-row, #dlSon button[data-id]"); if (!b) return;
    ac(b.dataset.id, true);
  });

  // ---------- Düzenleyici ----------
  function ac(id, it) {
    var t = T.find(function (x) { return x.id === id; }); if (!t) return;
    if (sablon) durum[sablon.id] = { V: V, elle: ELLE[sablon.id], ek: $("g_ekler").value };
    sablon = t;
    var d = durum[id] || {};
    V = d.V || {}; ELLE[id] = d.elle;
    $("dlIk").textContent = t.ik; $("dlAd").textContent = t.ad; $("dlAc").textContent = t.ac;
    $("dlNot").hidden = !t.nt; $("dlNot").textContent = t.nt ? "💡 " + t.nt : "";
    alanlarCiz();
    GLOBAL.forEach(function (k) { var i = document.querySelector('[data-g="' + k + '"]'); if (i) i.value = G[k] || ""; });
    $("g_tc").value = V.__tc || "";
    $("g_yer").value = V.__yer || "";
    $("dlYerK").hidden = t.yer === false;
    if (!$("g_tarih").value) $("g_tarih").value = bugun();
    $("g_ekler").value = d.ek != null ? d.ek : (t.e || []).join("\n");
    $("dlHatirla").checked = hatirla;
    elleKur();
    $("dlListe").hidden = true; $("dlDuz").hidden = false; $("dlBar").hidden = false; document.body.classList.add("dl-acik");
    if (it) { try { history.pushState({ d: id }, "", "#" + id); } catch (e) {} }
    window.scrollTo(0, 0);
    var son = (ls.al("dlSon", []) || []).filter(function (x) { return x !== id; }); son.unshift(id); ls.yaz("dlSon", son.slice(0, 4));
    ciz();
  }
  function kapat() {
    if (sablon) durum[sablon.id] = { V: V, elle: ELLE[sablon.id], ek: $("g_ekler").value };
    $("dlDuz").hidden = true; $("dlBar").hidden = true; $("dlListe").hidden = false; document.body.classList.remove("dl-acik");
    listeCiz();
  }
  $("dlGeri").onclick = function () { if (history.state && history.state.d) history.back(); else { try { history.replaceState(null, "", location.pathname); } catch (e) {} kapat(); } };
  window.addEventListener("popstate", function () { var id = location.hash.slice(1); if (id && T.some(function (t) { return t.id === id; })) ac(id, false); else kapat(); });

  function alanlarCiz() {
    var kutu = $("dlAlanlar"); kutu.textContent = "";
    sablon.f.map(alan).forEach(function (a) {
      var id = "f_" + a.k, lab = el("label", "", a.l); lab.htmlFor = id;
      if (a.ops) lab.append(" ", el("small", "", "(isteğe bağlı)"));
      kutu.append(lab);
      var g;
      if (a.t === "s") {
        g = el("select"); g.id = id;
        a.sec.forEach(function (o) { var op = el("option", "", o); op.value = o; g.append(op); });
        if (V[a.k] == null) V[a.k] = a.sec[0];
        g.value = V[a.k];
        kutu.append(g);
      } else if (a.t === "c") {
        g = el("div", "dl-cks"); g.id = id; g.setAttribute("role", "group"); g.setAttribute("aria-label", a.l);
        var secili = V[a.k] || a.sec.slice(0, 2);
        V[a.k] = secili;
        a.sec.forEach(function (o, i) {
          var l = el("label", "dl-ck"), c = el("input"); c.type = "checkbox"; c.value = o; c.checked = secili.indexOf(o) >= 0; c.id = id + "_" + i;
          l.append(c, el("span", "", o)); g.append(l);
        });
        kutu.append(g);
      } else if (a.t === "ta") {
        g = el("textarea"); g.id = id; g.rows = 4; g.placeholder = a.p; g.value = V[a.k] || "";
        kutu.append(g);
      } else if (a.t === "d") {
        g = el("input"); g.type = "date"; g.id = id; g.value = V[a.k] || "";
        kutu.append(g);
      } else {
        var f = el("div", "field"); g = el("input"); g.id = id; g.placeholder = a.p; g.value = V[a.k] || "";
        if (a.t === "n") g.inputMode = a.k === "tutar" ? "decimal" : "text";
        f.append(g); kutu.append(f);
      }
    });
  }
  $("dlAlanlar").addEventListener("input", alanOku);
  $("dlAlanlar").addEventListener("change", alanOku);
  function alanOku(e) {
    var hedef = e.target, id = (hedef.id || "").replace(/^f_/, "").replace(/_\d+$/, "");
    var a = sablon.f.map(alan).find(function (x) { return x.k === id; }); if (!a) return;
    if (a.t === "c") V[a.k] = [].slice.call(document.querySelectorAll("#f_" + a.k + " input:checked")).map(function (c) { return c.value; });
    else V[a.k] = hedef.value;
    ciz();
  }
  $("dlForm").addEventListener("input", function (e) {
    var g = e.target.dataset && e.target.dataset.g;
    if (g === "tc") { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11); V.__tc = e.target.value; }
    else if (g === "yer") V.__yer = e.target.value;
    else if (g) { G[g] = e.target.value; if (hatirla) kimlikSakla(); }
    if (g || e.target.id === "g_tarih" || e.target.id === "g_ekler") ciz();
  });
  $("g_tarih").addEventListener("change", ciz);
  function kimlikSakla() { ls.yaz("dlKimlik", { ad: G.ad || "", tel: G.tel || "", eposta: G.eposta || "", adres: G.adres || "" }); }
  $("dlHatirla").onchange = function () {
    hatirla = this.checked; ls.yaz("dlHatirla", hatirla);
    if (hatirla) { kimlikSakla(); toast("👍 Bilgilerin bu cihazda hatırlanacak"); } else { ls.yaz("dlKimlik", null); toast("🧹 Kayıtlı bilgiler silindi"); }
  };

  // ---------- Metin modeli ----------
  function deger(k, a) {
    var v;
    if (k === "ad" || k === "tel" || k === "eposta" || k === "adres") v = G[k];
    else if (k === "tc") v = V.__tc;
    else v = V[k];
    if (a && a.t === "c") v = (v || []).map(function (x) { return "– " + x; }).join("\n");
    else if (a && a.t === "d") v = tarihYaz(v);
    v = String(v == null ? "" : v).trim();
    if (v && a && a.t !== "ta" && a.t !== "c" && k !== "adres") v = v.replace(/\s*\n\s*/g, " ").replace(/\.+$/, "");
    return v;
  }
  function doldur(s, ust) { // {boş:true} → paragraf atlanmalı
    var A = {}; sablon.f.map(alan).forEach(function (a) { A[a.k] = a; });
    var atla = false;
    var out = String(s).replace(/\{(\w+)\}/g, function (_, k) {
      var a = A[k], v = deger(k, a);
      if (!v) { if (a && a.yedek) return a.yedek; if (a && a.ops) { atla = true; return ""; } return BOS; }
      return ust ? tr(v) : v;
    });
    return atla ? null : out;
  }
  var bas1 = function (s) { return s ? s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1) : s; };
  function sablonMetni() { // düzenleme kutusu için düz metin
    var p = sablon.m.map(function (x) {
      if (sablon.yapi) { var v = doldur(x[1]); return v == null ? null : x[0] + ": " + v; }
      return doldur(x);
    }).filter(function (x) { return x != null; });
    if (!sablon.yapi && sablon.kp) p.push(sablon.kp);
    return p.join("\n\n").split(BOS).join(NOKTA);
  }
  function model() {
    var t = sablon, m = { yapi: !!t.yapi };
    m.bas = doldur(t.k, true).split("\n");
    m.yer = t.yer === false ? "" : tr(($("g_yer").value || "").trim());
    m.konu = t.yapi ? "" : bas1(doldur(t.kn) || "");
    var elle = ELLE[t.id];
    if (elle != null) {
      var par = elle.replace(/\r/g, "").split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean);
      if (t.yapi) m.rows = par.map(function (x) { var r = /^([^:\n]{2,40}):\s*([\s\S]*)$/.exec(x); return r && r[1] === tr(r[1]) ? [r[1].trim(), r[2]] : ["", x]; });
      else m.paras = par;
      m.kp = "";
    } else if (t.yapi) {
      m.rows = t.m.map(function (x) { var v = doldur(x[1]); return v == null ? null : [x[0], v]; }).filter(Boolean);
    } else {
      m.paras = t.m.map(function (x) { return doldur(x); }).filter(function (x) { return x != null && x !== ""; });
      m.kp = t.kp || "";
    }
    m.tarih = tarihYaz($("g_tarih").value) || BOS;
    m.ad = deger("ad") || BOS;
    m.rol = t.rol || "";
    var il = [];
    if (!t.yapi) il.push(["Adres", deger("adres") || BOS]);
    if (deger("tel") || !t.yapi) il.push(["Telefon", deger("tel") || BOS]);
    if (deger("eposta")) il.push(["E-posta", deger("eposta")]);
    if (!t.yapi && (deger("tc") || t.tc)) il.push(["T.C. Kimlik No", deger("tc") || BOS]);
    m.ilet = il;
    m.ekler = $("g_ekler").value.split("\n").map(function (x) { return x.trim().replace(/^\d+\s*[-.)]\s*/, ""); }).filter(Boolean);
    return m;
  }
  function bosSay(m) {
    var s = JSON.stringify(m), n = 0, i = -1;
    while ((i = s.indexOf(BOS, i + 1)) >= 0) n++;
    return n;
  }
  var duz = function (s) { return String(s).split(BOS).join(NOKTA); };

  // ---------- Önizleme ----------
  function yaziKoy(e, s) { // BOS işaretlerini altın renkli boş yer yap
    String(s).split(BOS).forEach(function (p, i) { if (i) e.append(el("span", "bos", "……………")); if (p) e.append(document.createTextNode(p)); });
    return e;
  }
  var cizBekle = 0;
  function ciz() { if (cizBekle) return; cizBekle = requestAnimationFrame(function () { cizBekle = 0; cizNow(); }); }
  function cizNow() {
    if (!sablon) return;
    var m = model(), k = $("dlKagit"); k.textContent = "";
    m.bas.forEach(function (b) { k.append(yaziKoy(el("p", "k-bas"), b)); });
    if (m.yer) k.append(el("p", "k-yer", m.yer));
    if (m.konu) { var kn = el("p", "k-konu"); kn.append(el("b", "", "Konu: ")); yaziKoy(kn, m.konu); k.append(kn); }
    var gv = el("div", "k-govde");
    if (m.rows) m.rows.forEach(function (r) { var s = el("div", "k-sat"); s.append(el("b", "", r[0] ? r[0] + " :" : "")); s.append(yaziKoy(el("span"), r[1])); gv.append(s); });
    else { m.paras.forEach(function (p) { gv.append(yaziKoy(el("span", /^– /.test(p) ? "k-p liste" : "k-p"), p)); }); if (m.kp) gv.append(el("span", "k-p", m.kp)); }
    k.append(gv);
    var im = el("div", "k-imza");
    im.append(yaziKoy(el("div"), m.tarih), yaziKoy(el("div"), m.ad));
    if (m.rol) im.append(el("div", "", m.rol));
    if (IMZA) { var ii = el("img"); ii.src = IMZA.url; ii.alt = "İmza"; im.append(ii); }
    im.append(el("i", "", "İmza"));
    k.append(im);
    if (m.ilet.length) { var il = el("div", "k-ilet"); m.ilet.forEach(function (x) { il.append(el("b", "", x[0] + ":")); il.append(yaziKoy(el("span"), x[1])); }); k.append(il); }
    if (m.ekler.length) { var ek = el("div", "k-ek"); ek.append(el("b", "", "EKLER:")); m.ekler.forEach(function (x, i) { ek.append(el("div", "", (i + 1) + "- " + x)); }); k.append(ek); }
    var n = bosSay(m), e = $("dlEksik"); e.textContent = "";
    if (n) { e.append(el("b", "", n + " boş yer var. ")); e.append("Altın renkli yerleri doldurursan dilekçe tamamlanır; boş bırakırsan çıktıda elle doldurmak için noktalı kalır."); }
    else e.textContent = "✅ Dilekçe hazır. İmzalamayı unutma.";
    if (ELLE[sablon.id] == null && !$("dlElle").hidden) $("dlMetin").value = sablonMetni();
    hatCiz();
  }

  // ---------- Elle düzenleme ----------
  function elleKur() {
    var acik = ELLE[sablon.id] != null;
    $("dlElle").hidden = !acik; $("dlDuzBtn").setAttribute("aria-pressed", acik ? "true" : "false");
    $("dlDuzBtn").textContent = acik ? "✅ Düzenlemeyi bitir" : "✏️ Metni düzenle";
    if (acik) $("dlMetin").value = ELLE[sablon.id];
  }
  $("dlDuzBtn").onclick = function () {
    var acik = !$("dlElle").hidden;
    if (!acik) { $("dlElle").hidden = false; $("dlMetin").value = ELLE[sablon.id] != null ? ELLE[sablon.id] : sablonMetni(); this.setAttribute("aria-pressed", "true"); this.textContent = "✅ Düzenlemeyi bitir"; $("dlMetin").focus(); }
    else { $("dlElle").hidden = true; this.setAttribute("aria-pressed", "false"); this.textContent = "✏️ Metni düzenle"; }
  };
  $("dlMetin").addEventListener("input", function () { ELLE[sablon.id] = this.value; ciz(); });
  $("dlSablon").onclick = function () { ELLE[sablon.id] = undefined; $("dlMetin").value = sablonMetni(); ciz(); toast("↺ Şablon metnine dönüldü"); };

  // ---------- Düz metin (kopyala / paylaş) ----------
  function duzMetin() {
    var m = model(), L = [];
    m.bas.forEach(function (b) { L.push(duz(b)); });
    if (m.yer) L.push(m.yer);
    L.push("");
    if (m.konu) { L.push("Konu: " + duz(m.konu)); L.push(""); }
    if (m.rows) m.rows.forEach(function (r) { L.push((r[0] ? r[0] + " : " : "") + duz(r[1])); L.push(""); });
    else { m.paras.forEach(function (p) { L.push(duz(p)); L.push(""); }); if (m.kp) { L.push(m.kp); L.push(""); } }
    L.push(duz(m.tarih), duz(m.ad)); if (m.rol) L.push(m.rol); L.push("İmza", "");
    m.ilet.forEach(function (x) { L.push(x[0] + ": " + duz(x[1])); });
    if (m.ekler.length) { L.push("", "EKLER:"); m.ekler.forEach(function (x, i) { L.push((i + 1) + "- " + x); }); }
    return L.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  $("dlKop").onclick = function () {
    var s = duzMetin();
    var ok = function () { toast("📋 Metin kopyalandı"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(ok, yedekKop); else yedekKop();
    function yedekKop() { var ta = el("textarea"); ta.value = s; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.append(ta); ta.select(); try { document.execCommand("copy"); ok(); } catch (e) { toast("Kopyalanamadı"); } ta.remove(); }
  };
  $("dlYaz").onclick = function () { window.print(); };

  // ---------- PDF ----------
  var yukle = function (src) { return new Promise(function (ok, no) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); };
  var pdfP = null;
  var pdfYukle = function () { return pdfP || (pdfP = yukle("lib/jspdf.umd.min.js").then(function () { return yukle("lib/pdffont.js"); }).catch(function (e) { pdfP = null; throw e; })); };
  function pdfYap() {
    return pdfYukle().then(function () {
      var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
      doc.addFileToVFS("FS.ttf", window.PDF_FONTS.regular); doc.addFont("FS.ttf", "FS", "normal");
      doc.addFileToVFS("FSB.ttf", window.PDF_FONTS.bold); doc.addFont("FSB.ttf", "FS", "bold");
      doc.setProperties({ title: sablon.ad, creator: "Sadolayn" });
      var m = model(), L = 25, R = 190, W = R - L, TOP = 25, ALT = 277, LH = 6.1, y = TOP;
      var yaz = function (b, s) { doc.setFont("FS", b ? "bold" : "normal"); doc.setFontSize(s || 12); };
      var sar = function (s, w, ilk) { // satırlara böl; ilk satır girintili olabilir
        var out = [];
        duz(s).split("\n").forEach(function (par, pi) {
          var kel = par.split(/\s+/).filter(Boolean), cur = "", gen = w - (pi === 0 && ilk ? ilk : 0);
          if (!kel.length) { out.push({ s: "", g: 0 }); return; }
          kel.forEach(function (k) {
            var den = cur ? cur + " " + k : k;
            if (doc.getTextWidth(den) <= gen || !cur) { cur = den; }
            else { out.push({ s: cur, g: w - gen }); cur = k; gen = w; }
            while (doc.getTextWidth(cur) > gen && cur.length > 1) { var i = cur.length - 1; while (i > 1 && doc.getTextWidth(cur.slice(0, i)) > gen) i--; out.push({ s: cur.slice(0, i), g: w - gen }); cur = cur.slice(i); gen = w; }
          });
          out.push({ s: cur, g: w - gen });
        });
        return out;
      };
      var yer = function (h) { if (y + h > ALT) { doc.addPage(); y = TOP; } };
      // Başlık
      yaz(true);
      m.bas.forEach(function (b) { sar(b, W).forEach(function (l) { yer(LH); doc.text(l.s, L + W / 2, y, { align: "center" }); y += LH; }); });
      if (m.yer) { doc.text(m.yer, R, y + 1, { align: "right" }); y += LH + 1; }
      y += 6;
      if (m.konu) {
        yaz(true); var kw = doc.getTextWidth("Konu: "); doc.text("Konu:", L, y);
        yaz(false); sar(m.konu, W - kw).forEach(function (l) { yer(LH); doc.text(l.s, L + kw, y); y += LH; }); y += 3;
      }
      y += 2;
      if (m.rows) {
        var LW = 46;
        m.rows.forEach(function (r) {
          yaz(true); var ls_ = r[0] ? sar(r[0], LW - 5) : [];
          yaz(false); var vs = sar(r[1], W - LW);
          var n = Math.max(ls_.length, vs.length); yer(Math.min(n, 3) * LH);
          var y0 = y;
          yaz(true); ls_.forEach(function (l, i) { doc.text(l.s, L, y0 + i * LH); }); if (r[0]) doc.text(":", L + LW - 3, y0);
          yaz(false); vs.forEach(function (l, i) { if (i && y0 + i * LH > ALT) { doc.addPage(); y0 = TOP - i * LH; } doc.text(l.s, L + LW, y0 + i * LH); });
          y = y0 + n * LH + 2.5;
        });
      } else {
        yaz(false);
        m.paras.concat(m.kp ? [m.kp] : []).forEach(function (p) {
          var lst = /^– /.test(p); sar(p, lst ? W - 12.5 : W, lst ? 0 : 12.5).forEach(function (l) { yer(LH); doc.text(l.s, L + (lst ? 12.5 : l.g), y); y += LH; }); y += 2;
        });
      }
      // İmza
      y += 8; yer(LH * 4);
      var cx = L + W * 0.76;
      yaz(false); doc.text(duz(m.tarih), cx, y, { align: "center" }); y += LH;
      yaz(true); doc.text(duz(m.ad), cx, y, { align: "center" }); y += LH;
      yaz(false); if (m.rol) { doc.text(m.rol, cx, y, { align: "center" }); y += LH; }
      if (IMZA) { var iw_ = 40, ih_ = Math.min(18, iw_ * IMZA.h / IMZA.w); iw_ = ih_ * IMZA.w / IMZA.h; yer(ih_ + LH); doc.addImage(IMZA.url, "PNG", cx - iw_ / 2, y - 3, iw_, ih_); y += ih_; }
      doc.setTextColor(120); doc.text("İmza", cx, y, { align: "center" }); doc.setTextColor(0); y += LH;
      // İletişim
      if (m.ilet.length) {
        y += 8; yaz(true); var iw = 0; m.ilet.forEach(function (x) { iw = Math.max(iw, doc.getTextWidth(x[0] + ":")); }); iw += 3;
        m.ilet.forEach(function (x) {
          yaz(false); var vs = sar(x[1], W - iw); yer(vs.length * LH);
          yaz(true); doc.text(x[0] + ":", L, y);
          yaz(false); vs.forEach(function (l) { doc.text(l.s, L + iw, y); y += LH; });
        });
      }
      if (m.ekler.length) {
        y += 5; yer(LH * 2); yaz(true); doc.text("EKLER:", L, y); doc.setLineWidth(0.25); doc.line(L, y + 0.8, L + doc.getTextWidth("EKLER:"), y + 0.8); y += LH;
        yaz(false); m.ekler.forEach(function (x, i) { sar((i + 1) + "- " + x, W).forEach(function (l) { yer(LH); doc.text(l.s, L, y); y += LH; }); });
      }
      return doc;
    });
  }
  var dosyaAdi = function () { return "dilekce-" + sablon.id + "-" + ($("g_tarih").value || bugun()) + ".pdf"; };
  function dugme(b, yazi, is) {
    var eski = b.innerHTML; b.textContent = yazi; b.disabled = true; // düğme içeriği sabit (kullanıcı verisi değil)
    return is().then(function (r) { b.innerHTML = eski; b.disabled = false; return r; }, function (e) { b.innerHTML = eski; b.disabled = false; throw e; });
  }
  $("dlPdf").onclick = function () {
    var b = this;
    dugme(b, "⏳", function () { return pdfYap().then(function (doc) { doc.save(dosyaAdi()); toast("✅ PDF indirildi"); }); })
      .catch(function () { toast("PDF hazırlanamadı; 🖨️ Yazdır ile PDF kaydedebilirsin"); });
  };
  $("dlPay").onclick = function () {
    var b = this;
    if (!navigator.share) { $("dlKop").click(); return; }
    dugme(b, "⏳", function () {
      return pdfYap().then(function (doc) {
        var f = null;
        try { f = new File([doc.output("blob")], dosyaAdi(), { type: "application/pdf" }); } catch (e) {}
        if (f && navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: sablon.ad });
        return navigator.share({ title: sablon.ad, text: duzMetin() });
      });
    }).catch(function (e) { if (!e || e.name !== "AbortError") toast("Paylaşılamadı"); });
  };

  // ---------- Word ----------
  $("dlDocx").onclick = function () {
    var b = this;
    try {
      var imza = null;
      if (IMZA) { var bin = atob(IMZA.url.split(",")[1]), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); imza = { png: u, w: IMZA.w, h: IMZA.h }; }
      var m = model(), dz = function (v) { return duz(v); };
      var md = { bas: m.bas.map(dz), yer: m.yer, konu: m.konu ? dz(m.konu) : "", rows: m.rows ? m.rows.map(function (r) { return [r[0], dz(r[1])]; }) : null,
        paras: m.paras ? m.paras.map(dz) : null, kp: m.kp, tarih: dz(m.tarih), ad: dz(m.ad), rol: m.rol, ilet: m.ilet.map(function (x) { return [x[0], dz(x[1])]; }), ekler: m.ekler };
      var blob = window.DilekceDocx(md, { imza: imza, baslik: sablon.ad });
      indir(blob, dosyaAdi().replace(/\.pdf$/, ".docx"));
      toast("✅ Word dosyası indirildi");
    } catch (e) { toast("Word dosyası hazırlanamadı"); }
  };
  function indir(blob, ad) {
    var u = URL.createObjectURL(blob), a = el("a"); a.href = u; a.download = ad; document.body.append(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }

  // ---------- Süre hatırlatıcısı ----------
  var GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  var tarihAl = function (v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; };
  var ekle = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  var isGunuEkle = function (d, n) { var x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() % 6) n--; } return x; };
  var HAT = { // [hesap, başlık, açıklama, eksikse ipucu]
    "trafik-itiraz": [function () { var t = tarihAl(V.teb); return t && ekle(t, 15); }, "İtiraz için son gün", "Tebliğden itibaren 15 gün. Son günü bekleme, birkaç gün önce ver.", "Tebliğ tarihini girince itiraz için son günü hesaplayıp takvimine ekleyebilirsin."],
    "bilgi-edinme": [function () { var t = tarihAl($("g_tarih").value); return t && isGunuEkle(t, 15); }, "Cevap beklenen gün", "Başvurudan itibaren 15 iş günü (hafta sonları sayılmadı, resmî tatiller hesaba katılmadı; yaklaşık).", ""],
    "kvkk": [function () { var t = tarihAl($("g_tarih").value); return t && ekle(t, 30); }, "Cevap için son gün", "Veri sorumlusu en geç 30 gün içinde cevap vermeli; başvurunun şirkete ulaştığı günden sayılır.", ""],
    "kira-fesih": [function () { var t = tarihAl(V.bitis); return t && ekle(t, -15); }, "Bildirimin ulaşması gereken son gün", "Teslim günün sözleşmenin bittiği günse bildirim en geç 15 gün önce ev sahibine ulaşmış olmalı.", "Teslim tarihini girince bildirimin son gününü hesaplayıp takvimine ekleyebilirsin."]
  };
  var hatGun = null;
  function hatCiz() {
    var h = sablon && HAT[sablon.id], k = $("dlHat");
    if (!h) { k.hidden = true; hatGun = null; return; }
    hatGun = h[0]();
    k.hidden = false; k.classList.toggle("eksik", !hatGun);
    if (hatGun) { $("dlHatT").textContent = "📅 " + h[1] + ": " + tarihYaz(ymdYerel(hatGun)) + " " + GUNLER[hatGun.getDay()]; $("dlHatA").textContent = h[2]; }
    else { $("dlHatT").textContent = "📅 Süre hatırlatıcısı"; $("dlHatA").textContent = h[3]; }
  }
  function ymdYerel(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  $("dlHatB").onclick = function () {
    if (!hatGun) return;
    var h = HAT[sablon.id], ics = function (s) { return String(s).replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n"); };
    var g = ymdYerel(hatGun).replace(/-/g, ""), ert = ymdYerel(ekle(hatGun, 1)).replace(/-/g, ""), simdi = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    var uid = (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) + "@sadolayn";
    var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sadolayn//Dilekce//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT", "UID:" + uid, "DTSTAMP:" + simdi,
      "DTSTART;VALUE=DATE:" + g, "DTEND;VALUE=DATE:" + ert, "SUMMARY:" + ics(sablon.ad + " – " + h[1]), "DESCRIPTION:" + ics(h[2]), "TRANSP:TRANSPARENT",
      "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", "DESCRIPTION:" + ics(sablon.ad + ": 3 gün kaldı"), "END:VALARM",
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:" + ics(sablon.ad + ": yarın son gün"), "END:VALARM", "END:VEVENT", "END:VCALENDAR"];
    indir(new Blob([L.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" }), "hatirlatma-" + sablon.id + ".ics");
    toast("📅 Takvim dosyası indi; açınca takvimine eklenir");
  };

  // ---------- İmza ----------
  var tv = $("dlTuval"), cx = tv.getContext("2d"), cizim = false, cizgiVar = false, son = null, sinir = null;
  function tuvalKur() {
    var r = tv.getBoundingClientRect(), d = Math.min(3, window.devicePixelRatio || 1);
    tv.width = Math.round(r.width * d); tv.height = Math.round(r.height * d);
    cx.setTransform(d, 0, 0, d, 0, 0); cx.lineCap = "round"; cx.lineJoin = "round"; cx.strokeStyle = "#1c2f7a";
    cizgiVar = false; sinir = null;
  }
  var nokta = function (e) { var r = tv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || 0.5 }; };
  function sinirla(p) { var k = 4; if (!sinir) sinir = { a: p.x, b: p.y, c: p.x, d: p.y }; sinir.a = Math.min(sinir.a, p.x - k); sinir.b = Math.min(sinir.b, p.y - k); sinir.c = Math.max(sinir.c, p.x + k); sinir.d = Math.max(sinir.d, p.y + k); }
  tv.addEventListener("pointerdown", function (e) { e.preventDefault(); tv.setPointerCapture(e.pointerId); cizim = true; son = nokta(e); sinirla(son); cx.beginPath(); cx.arc(son.x, son.y, 1.1, 0, 7); cx.fillStyle = "#1c2f7a"; cx.fill(); cizgiVar = true; });
  tv.addEventListener("pointermove", function (e) {
    if (!cizim) return; e.preventDefault();
    var p = nokta(e), hiz = Math.hypot(p.x - son.x, p.y - son.y);
    cx.lineWidth = Math.max(1.3, Math.min(3.2, 3.4 - hiz * 0.08));
    cx.beginPath(); cx.moveTo(son.x, son.y); cx.quadraticCurveTo(son.x, son.y, (son.x + p.x) / 2, (son.y + p.y) / 2); cx.lineTo(p.x, p.y); cx.stroke();
    son = p; sinirla(p);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(function (t) { tv.addEventListener(t, function () { cizim = false; }); });
  function modalAc() { $("dlModal").hidden = false; document.body.style.overflow = "hidden"; requestAnimationFrame(tuvalKur); }
  function modalKapat() { $("dlModal").hidden = true; document.body.style.overflow = ""; }
  $("dlImzaAt").onclick = modalAc;
  $("dlVazgec").onclick = modalKapat;
  $("dlModal").addEventListener("click", function (e) { if (e.target === this) modalKapat(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("dlModal").hidden) modalKapat(); });
  window.addEventListener("resize", function () { if (!$("dlModal").hidden && !cizgiVar) tuvalKur(); });
  $("dlTemizle").onclick = tuvalKur;
  $("dlImzaOk").onclick = function () {
    if (!cizgiVar || !sinir) { toast("Önce imzanı çiz 🙂"); return; }
    var d = tv.width / tv.getBoundingClientRect().width;
    var x0 = Math.max(0, sinir.a * d), y0 = Math.max(0, sinir.b * d), w = Math.min(tv.width - x0, (sinir.c - sinir.a) * d), h = Math.min(tv.height - y0, (sinir.d - sinir.b) * d);
    var o = document.createElement("canvas"), olc = Math.min(1, 600 / w); o.width = Math.max(1, Math.round(w * olc)); o.height = Math.max(1, Math.round(h * olc));
    o.getContext("2d").drawImage(tv, x0, y0, w, h, 0, 0, o.width, o.height);
    IMZA = { url: o.toDataURL("image/png"), w: o.width, h: o.height };
    imzaGoster(); modalKapat(); ciz(); toast("✍️ İmza eklendi");
  };
  $("dlImzaSil").onclick = function () { IMZA = null; imzaGoster(); ciz(); };
  function imzaGoster() {
    var k = $("dlImzaOn"); k.textContent = "";
    if (IMZA) { var i = el("img"); i.src = IMZA.url; i.alt = ""; k.append(i); } else k.append(el("span", "", "İmza yok"));
    $("dlImzaSil").hidden = !IMZA; $("dlImzaAt").textContent = IMZA ? "✍️ Yeniden imzala" : "✍️ Ekrana imza at";
  }

  // ---------- Başlat ----------
  katCiz(); listeCiz();
  var ilk = location.hash.slice(1);
  if (ilk && T.some(function (t) { return t.id === ilk; })) { try { history.replaceState(null, "", location.pathname); history.pushState({ d: ilk }, "", "#" + ilk); } catch (e) {} ac(ilk, false); }
})();
