/* Solo Test (piyon atlama), tek kişilik.
   Tahtalar 7×7 ızgarada: hücre numarası = satır*7 + sütun. Her tahtanın delikleri (cells), başlangıç piyonları ve hedef deliği var.
   Durum her hamlede cihazda saklanır ("stKayit", tahta başına ayrı oyun); rekor "stEnIyi", sayaç "stIst", ses "stSes".
   İpucu: arka planda (Web Worker) çalışan geri izlemeli arama. Ölü konumlar simetriyle birlikte hatırlanır,
   bulunan çözüm yolu da saklanır; ipucunu izleyen oyuncuya sonraki ipuçları hemen gelir. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Tahtalar ---------- */
  var EN = [], FR = [];
  for (var r = 0; r < 7; r++) for (var c = 0; c < 7; c++) {
    var ic = (r >= 2 && r <= 4) || (c >= 2 && c <= 4);
    if (ic) EN.push(r * 7 + c);
    if (ic || (Math.abs(r - 3) === 2 && Math.abs(c - 3) === 2)) FR.push(r * 7 + c);
  }
  var TAHTA = {
    isinma: { ad: "isinma", ikon: "🌱", baslik: "Isınma", cells: EN, hedef: 24, bas: [10, 16, 17, 18, 24, 31], tanit: "6 piyonluk haç: ısınmak için 🙂" },
    piramit: { ad: "piramit", ikon: "🔺", baslik: "Piramit", cells: EN, hedef: 24, bas: [10, 16, 17, 18, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32, 33, 34], tanit: "16 piyonluk piramit" },
    ingiliz: { ad: "ingiliz", ikon: "➕", baslik: "İngiliz", cells: EN, hedef: 24, bas: EN.filter(function (x) { return x !== 24; }), tanit: "Klasik 33 delik, ortası boş" },
    fransiz: { ad: "fransiz", ikon: "✳️", baslik: "Fransız", cells: FR, hedef: 38, bas: FR.filter(function (x) { return x !== 10; }), tanit: "37 delik; üstteki boş, hedef aşağıda" },
  };
  var SIRA = ["isinma", "piramit", "ingiliz", "fransiz"];
  // Her tahta için hamle üçlüleri [kaynak, atlanan, hedef] (deliklerin sıra numarasıyla)
  function hamleler(cells) {
    var idx = {}, M = [];
    cells.forEach(function (x, i) { idx[x] = i; });
    cells.forEach(function (x, i) {
      var r = Math.floor(x / 7), c = x % 7;
      [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(function (d) {
        var r2 = r + 2 * d[0], c2 = c + 2 * d[1];
        if (r2 < 0 || r2 > 6 || c2 < 0 || c2 > 6) return;
        var b = idx[(r + d[0]) * 7 + c + d[1]], t = idx[r2 * 7 + c2];
        if (b != null && t != null) M.push([i, b, t]);
      });
    });
    return { idx: idx, M: M };
  }
  SIRA.forEach(function (k) { var T = TAHTA[k], h = hamleler(T.cells); T.idx = h.idx; T.M = h.M; T.hi = h.idx[T.hedef]; });

  /* ---------- Çözücü ----------
     Yığınla çalışan (özyinelemesiz) geri izleme: küçük dilimler halinde ilerler, böylece Worker yeni isteği hemen alır.
     Konum anahtarı: delik i doluysa 2^i (37 deliğe kadar sayı olarak tam). Simetrik konumların en küçüğü "ölü" listesine yazılır. */
  function motorYap() {
    var onbellek = {};
    function hazirla(cells, hedef) {
      var n = cells.length, P = [], idx = {}, i;
      for (i = 0; i < n; i++) { P.push(Math.pow(2, i)); idx[cells[i]] = i; }
      var A = [], B = [], C = [], D = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      for (i = 0; i < n; i++) {
        var r = Math.floor(cells[i] / 7), c = cells[i] % 7;
        for (var d = 0; d < 4; d++) {
          var r2 = r + 2 * D[d][0], c2 = c + 2 * D[d][1];
          if (r2 < 0 || r2 > 6 || c2 < 0 || c2 > 6) continue;
          var b = idx[(r + D[d][0]) * 7 + c + D[d][1]], t = idx[r2 * 7 + c2];
          if (b != null && t != null) { A.push(i); B.push(b); C.push(t); }
        }
      }
      // 8 simetri; tahtayı kendine (hedefli aramada hedef deliği de kendine) götürenler kalır. İlki birim dönüşüm.
      var T = [function (r, c) { return [r, c]; }, function (r, c) { return [c, 6 - r]; }, function (r, c) { return [6 - r, 6 - c]; }, function (r, c) { return [6 - c, r]; },
        function (r, c) { return [r, 6 - c]; }, function (r, c) { return [6 - r, c]; }, function (r, c) { return [c, r]; }, function (r, c) { return [6 - c, 6 - r]; }];
      var S = [];
      T.forEach(function (f) {
        var m = [];
        for (var k = 0; k < n; k++) { var q = f(Math.floor(cells[k] / 7), cells[k] % 7), j = idx[q[0] * 7 + q[1]]; if (j == null) return; m.push(j); }
        if (hedef >= 0 && m[idx[hedef]] !== idx[hedef]) return;
        S.push(m.map(function (j) { return P[j]; }));
      });
      return { n: n, A: A, B: B, C: C, S: S, idx: idx, olu: new Set() };
    }
    // Arama nesnesi: adim(say) en çok "say" düğüm ilerler; "var" | "yok" | null (sürüyor) döner. Bulunca .yol = [[a,b,c],…]
    function arama(tahta, p0, hedefli) {
      var k = tahta.ad + (hedefli ? "*" : ""), H = onbellek[k] || (onbellek[k] = hazirla(tahta.cells, hedefli ? tahta.hedef : -1));
      if (H.olu.size > 15e5) H.olu = new Set(); // bellek şişmesin
      var n = H.n, A = H.A, B = H.B, C = H.C, nm = A.length, S = H.S, ns = S.length, olu = H.olu, hi = hedefli ? H.idx[tahta.hedef] : -1;
      var p = p0.slice(), K = [], sayi = 0, i, s, d = 0, J = [], KEY = [], mod = 0, val = false;
      for (s = 0; s < ns; s++) K.push(0);
      for (i = 0; i < n; i++) if (p[i]) { sayi++; for (s = 0; s < ns; s++) K[s] += S[s][i]; }
      function uygula(j, yon) { // yon 1: hamle, -1: geri
        var a = A[j], b = B[j], c = C[j];
        p[a] = yon < 0 ? 1 : 0; p[b] = p[a]; p[c] = yon < 0 ? 0 : 1; sayi -= yon;
        for (var s = 0; s < ns; s++) K[s] += yon * (S[s][c] - S[s][a] - S[s][b]);
      }
      var o = { dugum: 0, yol: null };
      o.adim = function (say) {
        while (say-- > 0) {
          if (mod === 0) { // yeni düğüm
            o.dugum++;
            if (sayi === 1) {
              if (hi < 0 || p[hi] === 1) { o.yol = []; for (var x = 0; x < d; x++) o.yol.push([A[J[x]], B[J[x]], C[J[x]]]); return "var"; }
              val = false; mod = 2; continue;
            }
            var key = K[0];
            for (s = 1; s < ns; s++) if (K[s] < key) key = K[s];
            if (olu.has(key)) { val = false; mod = 2; continue; }
            KEY[d] = key; J[d] = -1; mod = 1;
          }
          if (mod === 1) { // sıradaki geçerli hamle
            var j = J[d] + 1;
            while (j < nm && (!p[A[j]] || !p[B[j]] || p[C[j]])) j++;
            if (j < nm) { J[d] = j; uygula(j, 1); d++; mod = 0; continue; }
            if (olu.size > 15e5) olu.clear(); olu.add(KEY[d]); val = false; mod = 2;
          }
          if (mod === 2) { // çocuktan dönüş (hep başarısız; başarı yukarıda hemen biter)
            if (d === 0) return "yok";
            d--; uygula(J[d], -1); mod = 1;
          }
        }
        return null;
      };
      return o;
    }
    return { arama: arama };
  }

  /* Worker gövdesi: tek iş; yeni istek gelince eskisi bırakılır (ama öğrendiği ölü konumlar kalır).
     İş: önce hedef delikte biten çözüm, yoksa herhangi bir delikte tek piyon. Bir konuma en çok "ms" süre harcanır. */
  function isciGovde(self, M) {
    var is = null, sonuc = {};
    function dongu() {
      if (!is) return;
      var t = Date.now() + 25, r = null;
      while (r === null && Date.now() < t) r = is.a.adim(4000);
      if (r === null && Date.now() > is.bitis) r = "sure";
      if (r === "yok" && is.hedefli) { is.hedefli = false; is.a = M.arama(is.tahta, is.p, false); r = null; }
      if (r === null) { setTimeout(dongu, 0); return; }
      var x = { tip: "sonuc", key: is.key, durum: r, yol: is.a.yol, hedefli: is.hedefli, dugum: is.a.dugum, ms: Date.now() - is.t0 };
      if (r !== "sure") sonuc[is.key] = x;
      is = null; self.postMessage(x);
    }
    self.onmessage = function (e) {
      var d = e.data;
      if (d.tip !== "coz") return;
      if (sonuc[d.key]) { self.postMessage(sonuc[d.key]); return; }
      if (is && is.key === d.key) { is.bitis = Math.max(is.bitis, Date.now() + d.ms); return; }
      var bas = !is; is = { key: d.key, tahta: d.tahta, p: d.p, hedefli: true, t0: Date.now(), bitis: Date.now() + d.ms };
      is.a = M.arama(d.tahta, d.p, true);
      if (bas) setTimeout(dongu, 0);
    };
  }
  var isci = null, dinle = [];
  function isciKur() {
    var kaynak = "(" + isciGovde.toString() + ")(self,(" + motorYap.toString() + ")());";
    try {
      isci = new Worker(URL.createObjectURL(new Blob([kaynak], { type: "text/javascript" })));
      isci.onerror = function () { isci = null; yerelKur(); };
    } catch (e) { yerelKur(); }
    if (isci) isci.onmessage = function (e) { dinle.forEach(function (f) { f(e.data); }); };
  }
  function yerelKur() { // Worker yoksa aynı gövde ana sayfada çalışır (dilimli olduğu için donmaz)
    var sahte = { postMessage: function (x) { setTimeout(function () { dinle.forEach(function (f) { f(x); }); }, 0); } };
    isciGovde(sahte, motorYap());
    isci = { postMessage: function (d) { sahte.onmessage({ data: d }); } };
  }
  isciKur();
  function cozIste(key, ms) {
    isci.postMessage({ tip: "coz", key: key, tahta: { ad: T.ad, cells: T.cells, hedef: T.hedef }, p: p.slice(), ms: ms });
  }

  /* ---------- Durum ---------- */
  var KAYIT = "stKayit", REK = "stEnIyi", IST = "stIst";
  function oku(k, v) { try { var x = JSON.parse(localStorage.getItem(k) || "null"); return x == null ? v : x; } catch (e) { return v; } }
  function yaz(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var K = oku(KAYIT, null); if (!K || K.v !== 1) K = { v: 1, aktif: "ingiliz", o: {} };
  if (!TAHTA[K.aktif]) K.aktif = "ingiliz";
  var T, p, G; // aktif tahta, piyon dizisi, oyun kaydı {h, t, ip, bitti, rap}
  var sec = -1, iyiYol = {}, sesAcik = oku("stSes", false) === true;
  var calis = 0; // süre sayacı: oyun sürerken başladığı an (0: durdu)

  function anahtar(x) { return (x || p).join(""); }
  function gecerli(m) { return p[m[0]] && p[m[1]] && !p[m[2]]; }
  function piyonHamleleri(i) { return T.M.filter(function (m) { return m[0] === i && gecerli(m); }); }
  function hamleVar() { return T.M.some(gecerli); }
  function kalan() { var n = 0; for (var i = 0; i < p.length; i++) n += p[i]; return n; }
  function gecen() { return (G.t || 0) + (calis ? Date.now() - calis : 0); }
  function sureYaz(ms) { var s = Math.floor(ms / 1000), m = Math.floor(s / 60); return m + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }
  function saatDur() { if (calis) { G.t = (G.t || 0) + Date.now() - calis; calis = 0; } }
  function saatBasla() { if (!calis && !G.bitti && G.h.length) calis = Date.now(); }
  function kaydet() {
    var t = gecen();
    K.o[T.ad] = { h: G.h, t: t, ip: G.ip || 0, bitti: !!G.bitti, rap: !!G.rap };
    K.aktif = T.ad; yaz(KAYIT, K);
  }

  /* ---------- Çizim ---------- */
  var izg = $("stIzgara"), pk = $("stPiyon"), tahtaEl = $("stTahta");
  var delikEl = [], piyonEl = [];
  function hucreStil(i) { var x = T.cells[i]; return "translate(" + (x % 7) * 100 + "%," + Math.floor(x / 7) * 100 + "%)"; }
  function piyonYap(i, gel) {
    var el = document.createElement("i"); el.className = "p" + (gel ? " gel" : ""); el.innerHTML = "<b></b>";
    el.style.transform = hucreStil(i); pk.appendChild(el); piyonEl[i] = el;
    if (gel) setTimeout(function () { el.classList.remove("gel"); }, 320);
    return el;
  }
  function tahtaKur() {
    izg.innerHTML = ""; pk.innerHTML = ""; delikEl = []; piyonEl = [];
    var dolu = {};
    T.cells.forEach(function (x, i) { dolu[x] = i; });
    for (var x = 0; x < 49; x++) {
      if (dolu[x] == null) { var bos = document.createElement("span"); bos.setAttribute("role", "presentation"); izg.appendChild(bos); continue; }
      var i = dolu[x], h = document.createElement("button");
      h.type = "button"; h.className = "h" + (x === T.hedef ? " hd" : ""); h.dataset.i = i;
      h.setAttribute("role", "gridcell");
      izg.appendChild(h); delikEl[i] = h;
    }
    for (var j = 0; j < p.length; j++) if (p[j]) piyonYap(j);
    etiketle();
  }
  function etiketle() {
    for (var i = 0; i < delikEl.length; i++) {
      var x = T.cells[i], ad = (Math.floor(x / 7) + 1) + ". satır " + (x % 7 + 1) + ". sütun, " + (p[i] ? "piyon" : "boş") + (x === T.hedef ? ", hedef delik" : "");
      delikEl[i].setAttribute("aria-label", ad);
    }
  }
  function isaretTemizle() {
    delikEl.forEach(function (h) { h.classList.remove("ok", "ip"); });
    piyonEl.forEach(function (e) { if (e) e.classList.remove("sec", "ip"); });
  }
  function sec_(i) {
    isaretTemizle(); sec = i;
    if (i < 0) return;
    if (piyonEl[i]) piyonEl[i].classList.add("sec");
    piyonHamleleri(i).forEach(function (m) { delikEl[m[2]].classList.add("ok"); });
  }
  function sayacYaz() {
    $("stKalan").textContent = kalan();
    $("stHamle").textContent = G.h.length;
    $("stSure").textContent = sureYaz(gecen());
    $("stGeri").disabled = !G.h.length;
    $("stIpucu").disabled = !!G.bitti;
    var R = oku(REK, {})[T.ad];
    $("stRekor").textContent = R ? R.k + (R.m ? "🎯" : "") + " · " + sureYaz(R.t) : "–";
    var I = oku(IST, {})[T.ad];
    $("stIst").textContent = I && I.o ? T.baslik + " tahtasında " + I.o + " oyun bitirdin" + (I.tek ? " · " + I.tek + " kez tek piyon" : "") + (I.dahi ? " · " + I.dahi + " kez hedefte 🏆" : "") : T.tanit;
  }
  function mesaj(h) { $("stMsg").innerHTML = h || ""; }
  setInterval(function () { if (calis) $("stSure").textContent = sureYaz(gecen()); }, 500);

  /* ---------- Ses (isteğe bağlı, kapalı başlar) ---------- */
  var ac = null;
  function tik(f, g) {
    if (!sesAcik) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      var o = ac.createOscillator(), v = ac.createGain(), t = ac.currentTime;
      o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.09);
      v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(g || 0.18, t + 0.008); v.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(v); v.connect(ac.destination); o.start(t); o.stop(t + 0.16);
    } catch (e) {}
  }
  function sesYaz() { var b = $("stSes"); b.textContent = sesAcik ? "🔊" : "🔇"; b.setAttribute("aria-label", sesAcik ? "Ses açık" : "Ses kapalı"); }
  $("stSes").addEventListener("click", function () { sesAcik = !sesAcik; yaz("stSes", sesAcik); sesYaz(); tik(520, 0.12); });

  /* ---------- Oyun ---------- */
  function oyunAc(ad) {
    if (T && G) { saatDur(); kaydet(); }
    T = TAHTA[ad]; sec = -1; ipucuBirak();
    p = T.cells.map(function (x) { return T.bas.indexOf(x) >= 0 ? 1 : 0; });
    var k = K.o[ad], h = [];
    if (k && k.h) { // kayıttan yeniden oynat; geçersiz hamlede dur
      for (var j = 0; j < k.h.length; j++) { var m = k.h[j]; if (!m || !gecerli(m)) break; p[m[0]] = 0; p[m[1]] = 0; p[m[2]] = 1; h.push(m); }
    }
    G = { h: h, t: k && k.t || 0, ip: k && k.ip || 0, bitti: false, rap: !!(k && k.rap) };
    calis = 0;
    $("stSec").querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b.dataset.t === ad); });
    tahtaKur(); $("stSon").hidden = true;
    if (G.h.length && !hamleVar()) bitir(true);
    else { saatBasla(); mesaj(G.h.length ? "Kaldığın yerden devam 🙂" : "Bir piyona dokun, sonra atlayacağı deliğe."); }
    sayacYaz(); kaydet(); arkaPlan();
  }
  function yap(m, surukle) {
    var a = m[0], b = m[1], c = m[2], el = piyonEl[a], yenen = piyonEl[b];
    p[a] = 0; p[b] = 0; p[c] = 1; G.h.push(m);
    piyonEl[a] = null; piyonEl[b] = null; piyonEl[c] = el;
    isaretTemizle(); sec = -1;
    if (el) { el.classList.remove("tut", "sec"); void el.offsetWidth; el.style.transform = hucreStil(c); }
    if (yenen) { setTimeout(function () { yenen.classList.add("git"); }, surukle ? 0 : 90); setTimeout(function () { yenen.remove(); }, 420); }
    tik(330, 0.16); setTimeout(function () { tik(210, 0.09); }, 110);
    saatBasla(); etiketle(); mesaj("");
    ipucuBirak();
    if (!hamleVar()) bitir(false);
    sayacYaz(); kaydet(); arkaPlan();
  }
  function geriAl() {
    if (!G.h.length) return;
    var m = G.h.pop(), a = m[0], b = m[1], c = m[2], el = piyonEl[c];
    p[a] = 1; p[b] = 1; p[c] = 0;
    piyonEl[c] = null; piyonEl[a] = el;
    isaretTemizle(); sec = -1;
    if (el) el.style.transform = hucreStil(a);
    piyonYap(b, true);
    if (G.bitti) { G.bitti = false; $("stSon").hidden = true; }
    if (G.h.length) saatBasla(); else { saatDur(); }
    ipucuBirak(); etiketle(); mesaj(G.h.length ? "" : "Başa döndün 🙂"); tik(260, 0.1);
    sayacYaz(); kaydet(); arkaPlan();
  }
  function bastan() {
    saatDur(); delete K.o[T.ad]; G = null; yaz(KAYIT, K);
    var ad = T.ad; T = null; oyunAc(ad);
  }

  /* ---------- Bitiş ---------- */
  function puan(k, merkez) {
    if (k === 1 && merkez) return ["🏆 Dahi!", "Son piyon tam hedef delikte. Bundan iyisi yok, ellerine sağlık!"];
    if (k === 1) return ["🌟 Usta", "Tek piyon kaldı, harika! Bir dahakine son piyonu altın halkalı hedef delikte bitirmeyi dene."];
    if (k === 2) return ["👏 Çok iyi", "Sadece 2 piyon kaldı; tek piyona çok yakındın."];
    if (k <= 4) return ["🙂 İyi", k + " piyon kaldı. Güzel gidiyor, biraz daha pratikle tek piyona inersin."];
    return ["Bir daha dene 💪", k + " piyon kaldı. Kenarlardaki piyonları erken toplamak işini kolaylaştırır."];
  }
  function bitir(yuklemede) {
    saatDur(); G.bitti = true;
    var k = kalan(), merkez = k === 1 && p[T.hi] === 1, P = puan(k, merkez), t = G.t || 0;
    $("stSonB").textContent = P[0];
    $("stSonP").textContent = P[1] + " " + G.h.length + " hamle, " + sureYaz(t) + (G.ip ? " · " + G.ip + " ipucu" : "") + ".";
    var rk = $("stSonR"); rk.hidden = true;
    if (!G.rap) {
      G.rap = true;
      var I = oku(IST, {}), x = I[T.ad] || { o: 0, tek: 0, dahi: 0 };
      x.o++; if (k === 1) x.tek++; if (merkez) x.dahi++; I[T.ad] = x; yaz(IST, I);
      if (!G.ip) {
        var R = oku(REK, {}), e = R[T.ad];
        var daha = !e || k < e.k || (k === e.k && merkez && !e.m) || (k === e.k && !!merkez === !!e.m && t < e.t);
        if (daha) { R[T.ad] = { k: k, m: merkez, t: t }; yaz(REK, R); rk.textContent = e ? "🏅 Yeni rekor!" : "🏅 Bu tahtada ilk rekorun"; rk.hidden = false; }
      } else { rk.textContent = "💡 İpucuyla bitti; rekora sayılmaz"; rk.hidden = false; }
      if (window.Rapor) Rapor.oyun("solotest", k === 1, T.baslik + " | " + k + " piyon" + (merkez ? " (hedefte)" : "") + " | " + G.h.length + " hamle | " + sureYaz(t) + (G.ip ? " | " + G.ip + " ipucu" : ""));
    }
    $("stSon").hidden = false;
    mesaj(k === 1 ? "Oyun bitti 🎉" : "Hamle kalmadı. İstersen geri alıp başka yol dene.");
    if (!yuklemede) { setTimeout(function () { var r = $("stSon").getBoundingClientRect(); if (r.bottom > innerHeight) $("stSon").scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }, 450); tik(660, 0.12); setTimeout(function () { tik(880, 0.1); }, 140); }
    sayacYaz();
  }

  /* ---------- İpucu ----------
     Her hamleden sonra arka planda o konum için çözüm aranır (Worker); ipucuna dokununca çoğu zaman hazırdır.
     Bulunan yolun bütün ara konumları "iyiYol"a yazılır: ipucunu izleyen oyuncuya sonrakiler beklemeden gelir. */
  var yokKonum = {}, sureKonum = {}, ipBek = null; // ipBek: {key, ok, t0, z}
  function konumKey() { return T.ad + ":" + anahtar(); }
  dinle.push(function (r) {
    if (r.tip !== "sonuc") return;
    var ad = r.key.split(":")[0], q = r.key.split(":")[1].split("").map(Number);
    if (r.durum === "var") r.yol.forEach(function (m) { iyiYol[ad + ":" + q.join("")] = { m: m, hedefli: r.hedefli }; q[m[0]] = 0; q[m[1]] = 0; q[m[2]] = 1; });
    else if (r.durum === "yok") yokKonum[r.key] = 1;
    else sureKonum[r.key] = 1;
    window.SoloTestSon = { durum: r.durum, ms: r.ms, dugum: r.dugum };
    if (ipBek && ipBek.key === r.key) { var b = ipBek; ipBek = null; clearTimeout(b.z); $("stIpucu").disabled = !!G.bitti; b.ok(ipucuSonuc(r.key)); }
  });
  function arkaPlan() { // sessiz ön hazırlık
    if (!G || G.bitti) return;
    var key = konumKey();
    if (!iyiYol[key] && !yokKonum[key] && !sureKonum[key]) cozIste(key, 6000);
  }
  function ipucuGoster(m, not) {
    sec_(m[0]);
    if (piyonEl[m[0]]) piyonEl[m[0]].classList.add("ip");
    delikEl[m[2]].classList.remove("ok"); delikEl[m[2]].classList.add("ip");
    mesaj(not || "💡 Parlayan piyonu, kesik çizgili deliğe atla.");
  }
  function ipucuSonuc(key) {
    if (key !== konumKey()) { mesaj(""); return null; }
    var b = iyiYol[key];
    if (b) {
      if (G.ipSon !== key) { G.ipSon = key; G.ip = (G.ip || 0) + 1; kaydet(); }
      ipucuGoster(b.m, b.hedefli ? null : "💡 Son piyonu hedef delikte bitirmek artık mümkün değil ama tek piyona hâlâ inilebilir 👍");
      return b.m;
    }
    var n = geriSayisi();
    if (yokKonum[key]) mesaj(n > 0 ? "Bu durumdan tek piyona inilemiyor. <b>" + n + " hamle</b> geri alırsan çözüme giden yol belli 🙂" : "Bu durumdan tek piyona inilemiyor, birkaç hamle geri al 🙂");
    else mesaj(n > 0 ? "Bu konumda ipucunu bulamadım 🤔 <b>" + n + " hamle</b> geri alırsan çözüme giden yol belli." : "Bu konum çok dallı budaklı, ipucunu bulamadım 🤔 Bir hamle geri alıp yeniden dene.");
    return null;
  }
  // Çözümü bilinen en son konuma kaç hamle geri gidilmeli? (bilinmiyorsa 0)
  function geriSayisi() {
    var q = T.cells.map(function (x) { return T.bas.indexOf(x) >= 0 ? 1 : 0; }), son = -1;
    for (var k = 0; k <= G.h.length; k++) {
      if (iyiYol[T.ad + ":" + q.join("")]) son = k;
      var m = G.h[k]; if (m) { q[m[0]] = 0; q[m[1]] = 0; q[m[2]] = 1; }
    }
    return son < 0 ? 0 : G.h.length - son;
  }
  function ipucu() {
    if (G.bitti) return Promise.resolve(null);
    var key = konumKey();
    if (iyiYol[key] || yokKonum[key]) return Promise.resolve(ipucuSonuc(key));
    if (ipBek && ipBek.key === key) return ipBek.pr;
    delete sureKonum[key];
    mesaj("🤔 Düşünüyorum…"); $("stIpucu").disabled = true;
    ipBek = { key: key };
    ipBek.pr = new Promise(function (ok) { ipBek.ok = ok; });
    ipBek.z = setTimeout(function () { if (ipBek && ipBek.key === key) mesaj("🤔 Bu konum biraz zorlu, hâlâ arıyorum…"); }, 3500);
    cozIste(key, 12000);
    return ipBek.pr;
  }
  // Fransız tahtasının başlangıcından hedefe bir çözüm (bu çözücüyle önceden bulundu; açılışta uzun aramaya gerek kalmasın)
  (function () {
    var F = TAHTA.fransiz, q = F.cells.map(function (x) { return F.bas.indexOf(x) >= 0 ? 1 : 0; });
    [[3,4,5],[6,5,4],[16,9,3],[3,4,5],[11,10,9],[1,5,11],[8,9,10],[11,10,9],[13,12,11],[18,11,5],[22,15,8],[8,9,10],[17,10,4],[0,4,10],[27,20,13],[7,13,20],[25,26,27],[23,24,25],[27,20,13],[14,13,12],[19,12,6],[2,6,12],[34,30,24],[36,32,26],[25,26,27],[28,27,26],[35,31,25],[25,26,27],[33,27,20],[21,20,19],[19,12,6],[6,5,4],[4,10,17],[17,24,30],[29,30,31]].forEach(function (m) { iyiYol["fransiz:" + q.join("")] = { m: m, hedefli: true }; q[m[0]] = 0; q[m[1]] = 0; q[m[2]] = 1; });
  })();
  function ipucuBirak() { // konum değişti: bekleyen ipucu boşa düşer
    if (ipBek) { var b = ipBek; ipBek = null; clearTimeout(b.z); $("stIpucu").disabled = !!(G && G.bitti); b.ok(null); }
  }

  /* ---------- Dokunma ve sürükleme ---------- */
  var tut = null; // {i, x0, y0, surukle, el}
  function hucreAl(x, y) {
    var r = izg.getBoundingClientRect(), w = r.width / 7, cx = Math.floor((x - r.left) / w), cy = Math.floor((y - r.top) / w);
    if (cx < 0 || cx > 6 || cy < 0 || cy > 6) return -1;
    var i = T.idx[cy * 7 + cx]; return i == null ? -1 : i;
  }
  function dokun(i) {
    if (G.bitti) return;
    if (i < 0) { sec_(-1); return; }
    if (sec >= 0 && !p[i]) {
      var m = piyonHamleleri(sec).filter(function (m) { return m[2] === i; })[0];
      if (m) { yap(m); return; }
      sec_(-1); return;
    }
    if (p[i]) {
      if (sec === i) { sec_(-1); return; }
      if (!piyonHamleleri(i).length) {
        sec_(-1); var el = piyonEl[i];
        if (el) { el.classList.remove("salla"); void el.offsetWidth; el.classList.add("salla"); setTimeout(function () { el.classList.remove("salla"); }, 320); }
        mesaj("Bu piyonun atlayabileceği boş delik yok."); return;
      }
      sec_(i); mesaj(""); return;
    }
    sec_(-1);
  }
  tahtaEl.addEventListener("pointerdown", function (e) {
    if (G.bitti || (e.pointerType === "mouse" && e.button !== 0)) return;
    var i = hucreAl(e.clientX, e.clientY);
    tut = { i: i, x0: e.clientX, y0: e.clientY, surukle: false, id: e.pointerId };
    if (i >= 0 && p[i] && piyonHamleleri(i).length) { try { tahtaEl.setPointerCapture(e.pointerId); } catch (x) {} }
    e.preventDefault();
  });
  tahtaEl.addEventListener("pointermove", function (e) {
    if (!tut || tut.id !== e.pointerId) return;
    var i = tut.i;
    if (!tut.surukle) {
      if (Math.hypot(e.clientX - tut.x0, e.clientY - tut.y0) < 8 || i < 0 || !p[i] || !piyonHamleleri(i).length) return;
      tut.surukle = true; sec_(i); tut.el = piyonEl[i]; tut.el.classList.add("tut");
    }
    var r = pk.getBoundingClientRect(), w = r.width / 7;
    tut.el.style.transform = "translate(" + (e.clientX - r.left - w / 2) + "px," + (e.clientY - r.top - w / 2) + "px)";
  });
  function birak(e) {
    if (!tut || tut.id !== e.pointerId) return;
    var t = tut; tut = null;
    if (!t.surukle) { if (e.type === "pointerup") dokun(t.i); return; }
    var j = e.type === "pointerup" ? hucreAl(e.clientX, e.clientY) : -1;
    var m = j >= 0 ? piyonHamleleri(t.i).filter(function (m) { return m[2] === j; })[0] : null;
    if (m) { yap(m, true); return; }
    t.el.classList.remove("tut"); void t.el.offsetWidth; t.el.style.transform = hucreStil(t.i);
  }
  tahtaEl.addEventListener("pointerup", birak);
  tahtaEl.addEventListener("pointercancel", birak);
  // Klavye: Enter/Boşluk ile deliğe "dokunma"
  izg.addEventListener("click", function (e) { var h = e.target.closest(".h"); if (h && e.detail === 0) dokun(+h.dataset.i); });

  /* ---------- Düğmeler ---------- */
  $("stGeri").addEventListener("click", geriAl);
  $("stSonGeri").addEventListener("click", geriAl);
  $("stIpucu").addEventListener("click", function () { ipucu(); });
  var eminZ = 0;
  $("stBastan").addEventListener("click", function () {
    var b = $("stBastan");
    if (G.h.length && !G.bitti && !b.classList.contains("emin")) {
      b.classList.add("emin"); b.textContent = "Emin misin?";
      clearTimeout(eminZ); eminZ = setTimeout(function () { b.classList.remove("emin"); b.textContent = "↻ Baştan"; }, 3000);
      return;
    }
    clearTimeout(eminZ); b.classList.remove("emin"); b.textContent = "↻ Baştan"; bastan();
  });
  $("stSonYeni").addEventListener("click", bastan);
  $("stSec").innerHTML = SIRA.map(function (k) { var x = TAHTA[k]; return '<button type="button" data-t="' + k + '" aria-label="' + x.baslik + ' tahtası, ' + x.bas.length + ' piyon">' + x.ikon + " " + x.baslik + "<small>" + x.bas.length + " piyon</small></button>"; }).join("");
  $("stSec").addEventListener("click", function (e) { var b = e.target.closest("button[data-t]"); if (b && b.dataset.t !== T.ad) oyunAc(b.dataset.t); });
  $("stNas").addEventListener("toggle", function () { if ($("stNas").open && window.Rapor) Rapor.bolum("nasil-oynanir"); });

  document.addEventListener("visibilitychange", function () { if (document.hidden) { saatDur(); kaydet(); } else saatBasla(); });
  window.addEventListener("pagehide", function () { saatDur(); kaydet(); });

  sesYaz();
  oyunAc(K.aktif);
  // Testler için küçük kapı
  window.SoloTest = { ipucu: ipucu, durum: function () { return { tahta: T.ad, kalan: kalan(), hamle: G.h.length, bitti: !!G.bitti, hedefte: kalan() === 1 && p[T.hi] === 1, p: p.join("") }; }, motor: motorYap };
})();
