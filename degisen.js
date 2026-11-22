/* degisen.js — ana sayfada "✨ Sen yokken" kartı (22 Kasım 2026).
   Son bakışından bu yana: yeni kampanyalar, Resmî Gazete özetleri, PPK kararı, dolar ve gram altındaki değişim;
   ayrıca takibe aldığın kampanyalardan bitmesine 3 gün kalanlar ve gerçekleşen fiyat alarmları.
   Karşılaştırma için gereken küçük özet YALNIZCA bu cihazda tutulur ("senYokken"); hiçbir yere gönderilmez, ziyaret sayılmaz.
   Veriler sitenin kendi dosyalarından (Ortak.json aynı dosyayı sayfada tek kez indirir). */
(function () {
  var kart = document.getElementById("dgs"); if (!kart || !window.Ortak) return;
  var KEY = "senYokken", PENCERE = 30 * 60e3;
  var esc = Ortak.esc; // ortak.js
  var nf = function (v, d) { return Number(v).toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d }); };
  var gunTR = function (once) { return new Date(Date.now() + 3 * 3600e3 - (once || 0) * 864e5).toISOString().slice(0, 10); }; // İstanbul günü
  var bugun = gunTR(0);
  var kalan = function (g) { return Math.round((new Date(g + "T12:00:00") - new Date(bugun + "T12:00:00")) / 864e5); };
  var oku = function () { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
  var yaz = function (o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  var son = function (a) { if (!Array.isArray(a)) return null; for (var i = a.length - 1; i >= 0; i--) if (typeof a[i] === "number" && a[i] > 0) return a[i]; return null; };
  var al = function (u) { return Ortak.json(u).catch(function () { return null; }); };

  function kampanyalar(K) {
    var L = [], gor = {};
    ["isbank", "maximum", "maximiles"].forEach(function (kay) {
      var S = (K && K[kay]) || {};
      Object.keys(S).forEach(function (sg) {
        var v = S[sg] || {}, A = v.kampanyalar || [].concat.apply([], (v.kategoriler || []).map(function (c) { return c.kampanyalar || []; }));
        A.forEach(function (k) { if (k && k.url && !gor[k.url] && (!k.bitis || k.bitis >= bugun)) { gor[k.url] = 1; L.push(k); } });
      });
    });
    return L;
  }
  function zaman(t) {
    var d = new Date(t), g = new Date(t + 3 * 3600e3).toISOString().slice(0, 10), s = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    if (g === bugun) return "bugün " + s;
    if (g === gunTR(1)) return "dün " + s;
    var n = Math.round((new Date(bugun) - new Date(g)) / 864e5);
    return n < 7 ? n + " gün önce" : d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  }
  function fark(ad, ik, a, b, d, href) {
    if (!(a > 0) || !(b > 0)) return "";
    var f = (b - a) / a * 100; if (Math.abs(f) < 0.2) return "";
    return '<a href="' + href + '">' + ik + " " + ad + " <b>" + nf(b, d) + '</b> <span class="' + (f > 0 ? "u" : "d") + '">' + (f > 0 ? "▲" : "▼") + " %" + nf(Math.abs(f), 1) + "</span></a>";
  }

  Promise.all([al("isbank/kampanya_hepsi.json"), al("gazete/index.json"), al("data/ppk.json"), al("data/piyasa.json")]).then(function (R) {
    var KL = kampanyalar(R[0]), GZ = Array.isArray(R[1]) ? R[1] : (R[1] && (R[1].gunler || R[1].dates)) || [], PPK = R[2] || {}, P = R[3] || {};
    var yakin = gunTR(14);
    var cur = {
      t: Date.now(),
      gor: KL.filter(function (k) { return k.ilk && k.ilk > "2000-01-01" && k.ilk >= yakin; }).map(function (k) { return k.url; }),
      gz: GZ.slice().sort().pop() || "",
      ppk: (PPK.last && PPK.last.date) || "",
      usd: son(P.usd), xau: son(P.xau)
    };
    if (!R[0]) cur.gor = null; // veri alınamadıysa "yeni" sayılmasın
    var st = oku() || {}, base = null;
    if (!st.son) st.son = cur;
    else if (cur.t - st.son.t > PENCERE) { st.once = st.son; st.son = cur; }
    else { var t0 = st.son.t; st.son = cur; st.son.t = t0; if (!R[0] && st.once) st.son.gor = st.once.gor; }
    base = st.once || null;
    yaz(st);

    var cip = [], sat = [];
    if (base) {
      if (cur.gor && base.gor) {
        var once = {}; base.gor.forEach(function (u) { once[u] = 1; });
        var yeni = cur.gor.filter(function (u) { return !once[u]; }).length;
        if (yeni) cip.push('<a href="isbank.html#yeniliste">🎁 <b>' + yeni + "</b> yeni kampanya</a>");
      }
      if (cur.gz && base.gz && cur.gz > base.gz) {
        var n = GZ.filter(function (g) { return g > base.gz; }).length;
        cip.push('<a href="gazete.html">📜 <b>' + n + "</b> yeni Resmî Gazete özeti</a>");
      }
      if (cur.ppk && base.ppk && cur.ppk > base.ppk && PPK.last) {
        var c = Number(PPK.last.change) || 0;
        cip.push('<a href="takvim.html">🏦 PPK kararı: <b>%' + esc(String(PPK.last.rate).replace(".", ",")) + "</b>" + (c ? " (" + (c > 0 ? "+" : "−") + nf(Math.abs(c) * 100, 0) + " baz puan)" : " (değişmedi)") + "</a>");
      }
      var f1 = fark("Dolar", "💵", base.usd, cur.usd, 2, "piyasa.html"), f2 = fark("Gram altın", "🥇", base.xau, cur.xau, 0, "piyasa.html");
      if (f1) cip.push(f1); if (f2) cip.push(f2);
    }
    // Takipteki kampanyalar: bitmesine 3 gün ya da daha az kalanlar
    var T = []; try { T = JSON.parse(localStorage.getItem("kmpTakip") || "[]") || []; } catch (e) {}
    T.filter(function (x) { return x && x.s && /^https:\/\//.test(x.u || "") && kalan(x.s) >= 0 && kalan(x.s) <= 3; }).sort(function (a, b) { return a.s.localeCompare(b.s); }).slice(0, 3).forEach(function (x) {
      var g = kalan(x.s);
      sat.push('<a class="dgsS" href="' + esc(x.u) + '" target="_blank" rel="noopener"><span class="i" aria-hidden="true">⏰</span><span>' + esc(x.b) + "<small>" + (g === 0 ? "Bugün son gün" : g === 1 ? "Yarın son gün" : "Son " + (g + 1) + " gün") + " · takibe aldığın kampanya ↗</small></span></a>");
    });
    // Fiyat alarmları: yeni gerçekleşenler + son 24 saatte gerçekleşmiş olanlar
    if (window.KurAlarm) {
      KurAlarm.kontrol(P);
      KurAlarm.oku().filter(function (a) { return a.cal && Date.now() - a.cal < 864e5; }).slice(0, 3).forEach(function (a) {
        var v = KurAlarm.V.filter(function (x) { return x[0] === a.k; })[0]; if (!v) return;
        sat.push('<a class="dgsS alr" href="piyasa.html#alarm"><span class="i" aria-hidden="true">🔔</span><span>' + esc(v[2] + " " + nf(a.e, Number(a.e) % 1 === 0 ? 0 : Math.min(v[4], 2)) + " " + v[3] + (a.y === "ust" ? " seviyesinin üstüne çıktı" : " seviyesinin altına indi")) +
          "<small>" + (a.calD ? "Şu an " + nf(a.calD, v[4]) + " " + v[3] + " · " : "") + "fiyat alarmın ›</small></span></a>");
      });
    }
    if (st.kapat && st.once && st.kapat === st.once.t) cip = []; // bu turun değişiklikleri kapatıldı
    if (st.kapatG === bugun) sat = [];                          // hatırlatmalar bugün için kapatıldı
    if (!cip.length && !sat.length) return;
    kart.innerHTML = '<div class="dgsB"><h3>' + (cip.length ? "✨ Sen yokken" + (base ? "<small>son bakışın " + esc(zaman(base.t)) + "</small>" : "") : "⏰ Hatırlatmalar") + "</h3>" +
      '<button type="button" class="dgsX" aria-label="Kartı kapat">✕</button></div>' +
      (cip.length ? '<div class="dgsC">' + cip.join("") + "</div>" : "") + sat.join("") +
      '<p class="dgsN">🔒 Karşılaştırma yalnızca bu cihazda yapılır.</p>';
    kart.hidden = false;
    kart.querySelector(".dgsX").onclick = function () {
      var s2 = oku() || {}; s2.kapat = s2.once ? s2.once.t : 0; s2.kapatG = bugun; yaz(s2);
      kart.classList.add("kapan"); setTimeout(function () { kart.hidden = true; kart.classList.remove("kapan"); }, 220);
    };
    kart.addEventListener("click", function (e) { var a = e.target.closest("a"); if (a && window.Rapor) Rapor.bolum("sen-yokken"); });
  });
})();
