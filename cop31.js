// COP31 Antalya · İş Bankası etkinlik programı (10 Kasım 2026)
// Veri: isbank/cop31.json (İş Bankası'nın yayımladığı program PDF'inden: gün, saat, yer, başlık, konuşmacılar).
// Gün seçici, arama, "şu an / sıradaki" kutusu; her oturum ve tüm program takvime eklenebilir (.ics ya da Google Takvim).
// Saatler Türkiye saatidir (UTC+3, yaz saati yok); takvim dosyasına UTC olarak yazılır, telefon kendi saatine çevirir.
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var GUN = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  var KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var fold = function (t) { return String(t || "").replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase().replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a"); };
  var rapor = function (n) { try { window.Rapor && Rapor.bolum("cop31-" + n); } catch (e) {} };
  var D = null, O = [], secili = "", aranan = "";

  // Türkiye saati: "2026-11-09" + "13:45" → UTC ms
  var ms = function (g, s) { return Date.parse(g + "T" + s + ":00+03:00"); };
  var simdi = function () { return Date.now(); };
  var bugun = function () { return new Date(simdi() + 3 * 3600e3).toISOString().slice(0, 10); };
  var gunAd = function (g) { var d = new Date(g + "T12:00:00+03:00"); return d.getUTCDate() + " " + AY[d.getUTCMonth()] + " " + GUN[d.getUTCDay()]; };
  var saat = function (s) { return s.replace(":", "."); };
  var baslik = function (o) { return o.baslik || (o.kisiler[0] && o.kisiler[0].ad) || "Oturum"; };
  var durum = function (o) { var t = simdi(); return t >= ms(o.g, o.s) ? "gecti" : t >= ms(o.g, o.b) ? "simdi" : "gelecek"; };

  function toast(t) { var e = $("cpToast"); e.textContent = t; e.classList.add("on"); clearTimeout(toast.z); toast.z = setTimeout(function () { e.classList.remove("on"); }, 2600); }

  /* ---------- takvim ---------- */
  var utc = function (g, s) { return new Date(ms(g, s)).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
  var icsKac = function (t) { return String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); };
  // RFC 5545: satır en fazla 75 bayt; Türkçe harfler UTF-8'de 2 bayt tuttuğu için bayta göre bölünür
  var katla = function (s) {
    var out = [], cur = "", n = 0, sinir = 74;
    Array.from(s).forEach(function (ch) {
      var b = unescape(encodeURIComponent(ch)).length;
      if (n + b > sinir) { out.push(cur); cur = " "; n = 1; sinir = 74; }
      cur += ch; n += b;
    });
    out.push(cur); return out.join("\r\n");
  };
  function aciklama(o) {
    var k = o.kisiler.map(function (x) { return "• " + x.ad + " — " + x.unvan; });
    if (o.katilimci) k.unshift(o.katilimci);
    return (k.length ? k.join("\n") + "\n\n" : "") + "Türkiye İş Bankası'nın yayımladığı COP31 Antalya programından derlenmiştir. Kaynak: " + D.kaynak;
  }
  function vevent(o, i) {
    return ["BEGIN:VEVENT", "UID:cop31-" + o.g + "-" + o.b.replace(":", "") + "-" + i + "@sadolayn.github.io", "DTSTAMP:" + utc(bugun(), "00:00"),
      "DTSTART:" + utc(o.g, o.b), "DTEND:" + utc(o.g, o.s), katla("SUMMARY:" + icsKac("COP31 · " + baslik(o))),
      katla("LOCATION:" + icsKac(o.yer + ", COP31 Antalya")), katla("DESCRIPTION:" + icsKac(aciklama(o))),
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsKac("COP31 · " + baslik(o)), "TRIGGER:-PT15M", "END:VALARM", "END:VEVENT"].join("\r\n");
  }
  function icsIndir(liste, ad) {
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sadolayn//COP31//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:COP31 · İş Bankası"]
      .concat(liste.map(function (o) { return vevent(o, O.indexOf(o)); })).concat(["END:VCALENDAR"]).join("\r\n");
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" }), dosya = new File([blob], ad, { type: "text/calendar" });
    // Telefonda paylaş menüsü takvim uygulamasını doğrudan gösterebilir; olmazsa dosya indirilir, dokununca takvim açılır
    if (navigator.canShare && navigator.canShare({ files: [dosya] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      navigator.share({ files: [dosya], title: "COP31 · İş Bankası" }).catch(function () { indir(blob, ad); });
    } else indir(blob, ad);
  }
  function indir(blob, ad) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = ad; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast("📅 Takvim dosyası indi; dokununca takvimine eklenir");
  }
  function google(o) {
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("COP31 · " + baslik(o)) +
      "&dates=" + utc(o.g, o.b) + "/" + utc(o.g, o.s) + "&ctz=Europe/Istanbul&location=" + encodeURIComponent(o.yer + ", COP31 Antalya") +
      "&details=" + encodeURIComponent(aciklama(o));
  }

  /* ---------- çizim ---------- */
  function kart(o, i) {
    var d = durum(o), kisi = o.kisiler.map(function (x) {
      var mod = /Moderatör/.test(x.unvan), un = x.unvan.replace(/\s*·\s*Moderatör\s*$/, "").replace(/·\s*Moderatör\s*·/, "·");
      return "<li" + (mod ? ' class="mod"' : "") + "><b>" + esc(x.ad) + "</b><small>" + esc(un) + "</small></li>";
    }).join("");
    return '<article class="cp-o ' + d + '" style="animation-delay:' + Math.min(i, 8) * 0.05 + 's">' +
      '<div class="cp-ust"><span class="cp-saat">' + saat(o.b) + "–" + saat(o.s) + '</span><span class="cp-etk">📍 ' + esc(o.yer) + "</span>" +
      (d === "simdi" ? '<span class="cp-rozet s">● Şu an</span>' : d === "gecti" ? '<span class="cp-rozet g">Bitti</span>' : "") + "</div>" +
      "<h3>" + esc(baslik(o)) + "</h3>" + (o.katilimci ? '<p class="cp-kat">' + esc(o.katilimci) + "</p>" : "") +
      (kisi ? '<ul class="cp-k">' + kisi + "</ul>" : "") +
      medya(o, d) +
      (d === "gecti" ? "" : '<div class="cp-ek"><button type="button" data-ics="' + O.indexOf(o) + '">📅 Takvime ekle</button><a href="' + google(o) + '" target="_blank" rel="noopener" data-g="1">Google Takvim ↗</a></div>') +
      "</article>";
  }
  // Kayıt ve haber: cop31.json'da oturumun "video" ({ad, url}) ve "haber" ([{ad, url}]) alanları.
  // Biten oturumda ikisi de yoksa "kayıt yayımlanırsa burada görünecek" notu çıkar.
  var guvenli = function (u) { return /^https:\/\//.test(u || "") ? u : ""; };
  function medya(o, d) {
    var v = o.video && guvenli(o.video.url), H = (o.haber || []).filter(function (x) { return guvenli(x.url); });
    if (!v && !H.length) return d === "gecti" ? '<p class="cp-yok">🎥 Kayıt yayımlanırsa burada görünecek</p>' : "";
    return '<div class="cp-ek cp-md">' +
      (v ? '<a class="vid" href="' + esc(v) + '" target="_blank" rel="noopener" data-m="video">🎥 Kaydı izle' + (o.video.ad ? " · " + esc(o.video.ad) : "") + " ↗</a>" : "") +
      H.map(function (x) { return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener" data-m="haber">📰 ' + esc(x.ad || "Haber") + " ↗</a>"; }).join("") +
      (!v && d === "gecti" ? '<span class="cp-yok">🎥 Kayıt henüz yok</span>' : "") + "</div>";
  }
  function gunlerCiz() {
    var gunler = [], say = {};
    O.forEach(function (o) { if (!say[o.g]) { gunler.push(o.g); say[o.g] = 0; } say[o.g]++; });
    var b = bugun();
    $("cpGunler").innerHTML = gunler.map(function (g) {
      var d = new Date(g + "T12:00:00+03:00");
      return '<button type="button" data-g="' + g + '" class="' + (g === secili ? "on " : "") + (g < b ? "gecti " : "") + (g === b ? "bugun" : "") + '" aria-pressed="' + (g === secili) + '">' +
        "<span>" + KISA[d.getUTCDay()] + "</span><b>" + d.getUTCDate() + "</b><i>" + say[g] + " oturum</i></button>";
    }).join("");
    var on = $("cpGunler").querySelector(".on"); if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", inline: "center" });
  }
  function listeCiz() {
    var q = fold(aranan.trim()), h = "";
    if (q) {
      var L = O.filter(function (o) { return fold(baslik(o) + " " + (o.katilimci || "") + " " + o.yer + " " + o.kisiler.map(function (x) { return x.ad + " " + x.unvan; }).join(" ")).indexOf(q) > -1; });
      var son = "";
      L.forEach(function (o, i) { if (o.g !== son) { h += '<h2 class="cp-gunB">' + gunAd(o.g) + "</h2>"; son = o.g; } h += kart(o, i); });
      $("cpListe").innerHTML = h || '<div class="cp-bos">“' + esc(aranan.trim()) + "” ile eşleşen oturum yok.</div>";
      return;
    }
    O.filter(function (o) { return o.g === secili; }).forEach(function (o, i) { h += kart(o, i); });
    $("cpListe").innerHTML = '<h2 class="cp-gunB">' + gunAd(secili) + "</h2>" + h;
  }
  function simdiCiz() {
    var su = O.filter(function (o) { return durum(o) === "simdi"; }), sonra = O.filter(function (o) { return durum(o) === "gelecek"; }), e = $("cpSimdi");
    if (su.length) e.innerHTML = "<b>● Şu an</b>" + su.map(function (o) { return "<span>" + esc(baslik(o)) + "</span><small>" + saat(o.b) + "–" + saat(o.s) + " · " + esc(o.yer) + "</small>"; }).join("");
    else if (sonra.length) { var o = sonra[0]; e.innerHTML = "<b>Sıradaki · " + (o.g === bugun() ? "bugün" : gunAd(o.g)) + " " + saat(o.b) + "</b><span>" + esc(baslik(o)) + "</span><small>📍 " + esc(o.yer) + "</small>"; }
    else e.innerHTML = "<b>Program tamamlandı</b><span>Programdaki oturumlar sona erdi 🌱</span>";
  }
  function hepsi() { gunlerCiz(); listeCiz(); simdiCiz(); }

  /* ---------- olaylar ---------- */
  $("cpGunler").addEventListener("click", function (e) { var b = e.target.closest("button[data-g]"); if (!b) return; secili = b.dataset.g; aranan = ""; $("cpAra").value = ""; hepsi(); rapor("gun"); });
  $("cpAra").addEventListener("input", function () { aranan = this.value; listeCiz(); });
  $("cpListe").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-ics]"); if (b) { var o = O[+b.dataset.ics]; icsIndir([o], "cop31-" + o.g + "-" + o.b.replace(":", "") + ".ics"); rapor("ics"); return; }
    if (e.target.closest("a[data-g]")) rapor("google");
    var m = e.target.closest("a[data-m]"); if (m) rapor(m.dataset.m);
  });
  $("cpTumIcs").onclick = function () {
    var kalan = O.filter(function (o) { return durum(o) !== "gecti"; });
    if (!kalan.length) { toast("Program tamamlandı; eklenecek oturum kalmadı"); return; }
    icsIndir(kalan, "cop31-is-bankasi-programi.ics"); rapor("ics-tumu");
  };

  /* ---------- veri ---------- */
  (window.Ortak && Ortak.json ? Ortak.json("isbank/cop31.json") : fetch("isbank/cop31.json").then(function (r) { return r.json(); })).then(function (j) {
    D = j; O = (j.oturumlar || []).slice().sort(function (a, b) { return (a.g + a.b).localeCompare(b.g + b.b); });
    if (j.kaynak) $("cpKaynak").href = j.kaynak;
    var b = bugun(), gunler = O.map(function (o) { return o.g; });
    var hash = (location.hash || "").slice(1);
    secili = gunler.indexOf(hash) > -1 ? hash : gunler.indexOf(b) > -1 ? b : (gunler.filter(function (g) { return g > b; })[0] || gunler[gunler.length - 1]);
    hepsi();
    setInterval(function () { simdiCiz(); if (!aranan) listeCiz(); }, 60000); // "şu an" ve "bitti" rozetleri dakikada bir güncellenir
  }).catch(function () {
    $("cpListe").innerHTML = '<div class="cp-bos">Program yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile ya da <a href="https://www.isbank.com.tr/bankamizi-taniyin/cop-31" target="_blank" rel="noopener" style="color:var(--accent)">kaynağa</a> bak.</div>';
  });
})();
