/* Kaza Tutanağı Asistanı (kaza.html) — sihirbaz, kayıt, fotoğraflar, formlar, ilk darbe, imzalar, bitiş.
   Hiçbir bilgi bir yere gönderilmez: yazılar localStorage'da, fotoğraf/imza IndexedDB'de, yalnızca bu cihazda.
   Tek ağ isteği: kullanıcı "Konumumu al" derse adres için OpenStreetMap Nominatim (yalnızca enlem/boylam gider). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "kaza_v1", BEN = "kaza_ben", AYAR = "kaza_ayar";
  var ADIM = [["🛑", "Güvenlik", "guvenlik"], ["📸", "Foto", "foto"], ["📍", "Yer", "yer"], ["🙋", "A", "a"], ["👤", "B", "b"], ["☑️", "Nasıl", "nasil"], ["✏️", "Kroki", "kroki"], ["💬", "Görüş", "gorus"], ["✍️", "İmza", "imza"], ["📄", "Bitir", "bitir"]];
  var KONTROL = [
    "Sürücü belgesiz motorlu araç kullanılıyorsa veya yetersiz sürücü belgesi ile motorlu araç kullanılıyorsa",
    "Sürücüde yaş küçüklüğü varsa",
    "Sürücüde alkol veya akıl sağlığı şüphesi varsa",
    "Kazaya karışan araçlardan biri veya daha fazlası kamu kurumlarına ait ise",
    "Kamu kurumlarına ait eşyada zarar meydana gelirse",
    "Trafik kazasında sadece 3üncü kişilere ait eşyalara zarar gelirse",
    "Kazaya karışan araçlardan birinin veya birkaçının trafik sigortası yok ise (Yeşilkart-Green Card trafik sigortası yerine geçer)",
    "Trafik kazası ölüm ve/veya yaralanma ile sonuçlanmışsa"
  ];
  var MADDE = [
    "Kırmızı ışık ihlalinde bulunmak", "Taşıt giremez işareti bulunan karayoluna girmek", "Karşı yönden gelen trafiğin kullandığı yola girmek",
    "Geçme yasağı (sollama yasağı) olan yerde geçiş yapmak", "Kavşakta geçiş önceliğine uymamak", "Aynı istikamette ve aynı şeritte giderken önündeki araca arkadan çarpmak",
    "Yetkili memurun dur işaretinde geçmek", "Sağa dönüş kurallarına uymamak", "Sola dönüş kurallarına uymamak", "Geri manevra kurallarına uymamak",
    "Geçme (sollama) kurallarına uymamak", "Geçiş önceliğine uymamak", "Park etme kurallarına uymamak", "Duraklama kurallarına uymamak",
    "Kurallara uygun olarak park edilmiş araca çarpmak"
  ];
  // Araç şekilleri (üstten görünüş, ön yukarıda). Görünüm kutusu: VB
  var VB = [-40, -34, 180, 250];
  var ARABA = [
    ["tk", "M5 34 h8 v26 h-8z M87 34 h8 v26 h-8z M5 122 h8 v26 h-8z M87 122 h8 v26 h-8z"],
    ["gv", "M32 8 H68 Q86 8 88 30 V152 Q86 174 68 174 H32 Q14 174 12 152 V30 Q14 8 32 8 Z"],
    ["cm", "M22 52 Q50 40 78 52 L74 74 Q50 68 26 74 Z"],
    ["cm", "M26 136 Q50 142 74 136 L78 154 Q50 162 22 154 Z"]
  ];
  var MOTOR = [
    ["tk", "M44 2 h12 v36 h-12z M44 144 h12 v36 h-12z"],
    ["gv", "M40 44 Q50 34 60 44 L63 122 Q50 140 37 122 Z"],
    ["tk", "M18 46 h64 v7 h-64z"],
    ["cm", "M43 84 h14 v34 h-14z"]
  ];
  function okGeo(p) {
    var cx = 50, cy = 91, dx = p.x - cx, dy = p.y - cy, L = Math.hypot(dx, dy);
    if (L < 1) { dx = 0; dy = -1; L = 1; }
    dx /= L; dy /= L;
    var uc = [p.x, p.y], taban = [p.x + dx * 16, p.y + dy * 16], kuyruk = [p.x + dx * 48, p.y + dy * 48];
    return { uc: uc, taban: taban, kuyruk: kuyruk, k1: [taban[0] - dy * 9, taban[1] + dx * 9], k2: [taban[0] + dy * 9, taban[1] - dx * 9] };
  }

  var SAHNE = [["genel", "🚗", "Genel görünüm"], ["Ahasar", "💥", "A aracı hasar"], ["Bhasar", "💥", "B aracı hasar"], ["Aplaka", "🔢", "A plaka"], ["Bplaka", "🔢", "B plaka"], ["yol", "🚦", "Yol / işaretler"]];
  function BELGE(v) { return [[v + "ehl1", "🪪", "Ehliyet ön"], [v + "ehl2", "🪪", "Ehliyet arka"], [v + "ruhsat", "📄", "Ruhsat"], [v + "police", "🛡️", "Poliçe"]]; }

  // Alan tanımları: [anahtar, etiket, tür, geniş?]
  var F = {
    surucu: [["ad", "Adı Soyadı", "ad", 1], ["tckn", "T.C. Kimlik No", "tckn"], ["tel", "Cep Tel", "tel"], ["belge", "Sürücü Belge No", "text"], ["sinif", "Belge Sınıfı", "sinif"], ["belgeYer", "Alındığı Yer (İl/İlçe)", "text", 1], ["adres", "Adres", "adres", 1], ["eposta", "E-posta", "email", 1]],
    arac: [["plaka", "Plaka", "plaka"], ["marka", "Marka ve Modeli", "text"], ["sasi", "Şasi No", "sasi", 1], ["kullanim", "Kullanım Şekli", "kullanim", 1]],
    police: [["sirket", "Sigorta Şirketinin Unvanı", "text", 1], ["no", "Poliçe No", "text"], ["acente", "Acente No", "text"], ["sigortali", "Sigortalının Adı Soyadı", "text", 1], ["stel", "Sigortalı Cep Tel", "tel"], ["svkn", "T.C. Kimlik / Vergi No", "vkn"], ["seposta", "Sigortalı E-posta", "email", 1], ["sbm", "SBM Poliçe No", "text", 1], ["bas", "Başlangıç Tarihi", "date"], ["bit", "Bitiş Tarihi", "date"]],
    yk: [["no", "Yeşil Kart No", "text", 1], ["ulke", "Ülke", "text"], ["pasaport", "Pasaport No", "text"]]
  };
  var GRUP = { surucu: "4. Sürücü Bilgileri", arac: "5. Araç Bilgileri", police: "6. Trafik Sigortası Poliçe Bilgileri", yk: "8. Yeşil Kart (Green Card)" };
  var B_HIZLI = [["surucu", "ad"], ["surucu", "tel"], ["arac", "plaka"], ["police", "sirket"], ["police", "no"]];

  /* ---------- yardımcılar ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; }); }
  function p2(n) { return String(n).padStart(2, "0"); }
  function ymd(d) { return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function hm(d) { return p2(d.getHours()) + ":" + p2(d.getMinutes()); }
  function al(o, yol) { return yol.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function koy(o, yol, v) { var k = yol.split("."), son = k.pop(); var h = k.reduce(function (a, x) { return a[x]; }, o); h[son] = v; }
  function birlestir(hedef, kaynak) {
    if (!kaynak || typeof kaynak !== "object") return hedef;
    Object.keys(hedef).forEach(function (k) {
      if (!(k in kaynak)) return;
      var h = hedef[k], s = kaynak[k];
      if (h && typeof h === "object" && !Array.isArray(h) && s && typeof s === "object" && !Array.isArray(s)) birlestir(h, s);
      else if (Array.isArray(h)) { if (Array.isArray(s) && (!h.length || typeof h[0] === "object" || s.length === h.length)) hedef[k] = s; }
      else hedef[k] = s;
    });
    Object.keys(kaynak).forEach(function (k) { if (!(k in hedef)) hedef[k] = kaynak[k]; });
    return hedef;
  }
  function toast(s) { var t = $("kzToast"); t.textContent = s; t.classList.add("on"); clearTimeout(toast.z); toast.z = setTimeout(function () { t.classList.remove("on"); }, 2200); }
  function rapor(ad) { try { if (window.Rapor) Rapor.bolum("kaza-" + ad); } catch (e) {} }
  function okuJ(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function tcknGecerli(s) {
    if (!/^[1-9]\d{10}$/.test(s)) return false;
    var d = s.split("").map(Number), t1 = d[0] + d[2] + d[4] + d[6] + d[8], t2 = d[1] + d[3] + d[5] + d[7];
    return ((t1 * 7 - t2) % 10 + 10) % 10 === d[9] && d.slice(0, 10).reduce(function (a, b) { return a + b; }, 0) % 10 === d[10];
  }
  function plakaBicim(s) {
    var t = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), m = t.match(/^(\d{2})([A-Z]{1,3})(\d{2,5})$/);
    return m ? m[1] + " " + m[2] + " " + m[3] : String(s || "").toUpperCase().replace(/\s+/g, " ").trim();
  }

  /* ---------- IndexedDB (fotoğraf, imza) ---------- */
  var DB = (function () {
    var acik = null, bellek = new Map();
    function ac() {
      if (!acik) acik = new Promise(function (res) {
        try {
          var r = indexedDB.open("kazaDB", 1);
          r.onupgradeneeded = function () { r.result.createObjectStore("d"); };
          r.onsuccess = function () { res(r.result); };
          r.onerror = function () { res(null); };
        } catch (e) { res(null); }
      });
      return acik;
    }
    function islem(mod, fn) {
      return ac().then(function (db) {
        if (!db) return fn(null);
        return new Promise(function (res, rej) {
          var t = db.transaction("d", mod), r = fn(t.objectStore("d"));
          t.oncomplete = function () { res(r && "result" in r ? r.result : undefined); };
          t.onerror = function () { rej(t.error); }; t.onabort = function () { rej(t.error); };
        });
      });
    }
    return {
      al: function (k) { return islem("readonly", function (s) { return s ? s.get(k) : { result: bellek.get(k) }; }); },
      koy: function (k, v) { return islem("readwrite", function (s) { if (s) s.put(v, k); else bellek.set(k, v); }); },
      sil: function (k) { return islem("readwrite", function (s) { if (s) s.delete(k); else bellek.delete(k); }); },
      temizle: function () { return islem("readwrite", function (s) { if (s) s.clear(); else bellek.clear(); }); }
    };
  })();

  /* ---------- durum ---------- */
  function aracBos() {
    return {
      surucu: { ad: "", tckn: "", belge: "", sinif: "", belgeYer: "", adres: "", tel: "", eposta: "" },
      arac: { plaka: "", marka: "", sasi: "", kullanim: "" },
      police: { sirket: "", no: "", acente: "", sigortali: "", stel: "", svkn: "", seposta: "", sbm: "", bas: "", bit: "" },
      yk: { on: false, no: "", ulke: "", pasaport: "" },
      hiz: "", fren: "", motor: false, darbe: null
    };
  }
  function bos() {
    var n = new Date();
    var s = {
      v: 1, adim: 0, guv: { yarali: null, q: [0, 0, 0, 0, 0, 0, 0, 0], tamam: false },
      zaman: { tarih: ymd(n), saat: hm(n) }, yer: { il: "", ilce: "", semt: "", mahalle: "", cadde: "", sokak: "", lat: null, lon: null, acc: null },
      tanik: [], A: aracBos(), B: aracBos(),
      kutu: { A: MADDE.map(function () { return 0; }), B: MADDE.map(function () { return 0; }) },
      gorus: { A: "", B: "" }, kroki: Kroki.yeni("dort"), krokiDok: false, imza: { A: false, B: false }, foto: {}, olustu: Date.now()
    };
    var ben = okuJ(BEN);
    if (ben) ["surucu", "arac", "police", "yk"].forEach(function (g) { if (ben[g]) birlestir(s.A[g], ben[g]); });
    return s;
  }
  var ayar = birlestir({ hatirla: true, gizle: true }, okuJ(AYAR));
  var S = birlestir(bos(), okuJ(KEY));
  if (!S.kroki || !S.kroki.items) S.kroki = Kroki.yeni("dort");
  var surum = 0, kayitZ = null;
  function kaydet(hemen) {
    surum++;
    clearTimeout(kayitZ);
    var yap = function () {
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("⚠️ Kaydedilemedi: telefonda yer kalmamış olabilir"); }
      if (ayar.hatirla) { try { localStorage.setItem(BEN, JSON.stringify({ surucu: S.A.surucu, arac: S.A.arac, police: S.A.police, yk: S.A.yk })); } catch (e) {} }
      adimIsaret();
    };
    if (hemen) yap(); else kayitZ = setTimeout(yap, 250);
  }
  window.addEventListener("pagehide", function () { if (kayitZ) { clearTimeout(kayitZ); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} } });
  function ayarKaydet() { try { localStorage.setItem(AYAR, JSON.stringify(ayar)); } catch (e) {} }

  /* ---------- adımlar ---------- */
  var adimlar = $("kzAdimlar");
  adimlar.innerHTML = ADIM.map(function (a, i) { return '<button type="button" data-i="' + i + '" aria-label="' + (i + 1) + ". adım: " + a[1] + '"><b>' + a[0] + '</b><span><i class="kzNo">' + (i + 1) + '</i><i class="kzAd"> ' + a[1] + "</i></span></button>"; }).join(""); // 9 Kasım: numaralar soldan sağa sırayı gösterir
  adimlar.onclick = function (e) { var b = e.target.closest("button[data-i]"); if (b) git(+b.dataset.i); };
  function doluMu(i) {
    var A = S.A, B = S.B;
    switch (i) {
      case 0: return S.guv.tamam;
      case 1: return Object.keys(S.foto).some(function (k) { return SAHNE.some(function (s) { return s[0] === k; }) || /^ek/.test(k); });
      case 2: return !!(S.yer.il || S.yer.cadde || S.yer.lat != null);
      case 3: return !!(A.surucu.ad || A.arac.plaka);
      case 4: return !!(B.surucu.ad || B.arac.plaka || S.foto.Behl1 || S.foto.Bpolice);
      case 5: return S.kutu.A.some(Boolean) || S.kutu.B.some(Boolean) || !!(A.darbe || B.darbe);
      case 6: return !!S.krokiDok;
      case 7: return !!(S.gorus.A || S.gorus.B);
      case 8: return S.imza.A && S.imza.B;
    }
    return false;
  }
  function adimIsaret() { adimlar.querySelectorAll("button").forEach(function (b, i) { b.classList.toggle("ok", doluMu(i)); }); }
  var gosterim = {};
  function git(i, sessiz) {
    i = Math.max(0, Math.min(ADIM.length - 1, i));
    S.adim = i; kaydet();
    document.querySelectorAll(".kz-adim").forEach(function (s) { s.classList.toggle("on", +s.dataset.a === i); });
    adimlar.querySelectorAll("button").forEach(function (b, j) { b.classList.toggle("on", j === i); if (j === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
    $("kzBar").style.transform = "scaleX(" + ((i + 1) / ADIM.length) + ")";
    $("kzAdimYazi").innerHTML = "Adım <b>" + (i + 1) + "</b> / " + ADIM.length + (i < ADIM.length - 1 ? " · soldan sağa sırayla ilerle" : " · son adım");
    $("kzGeri").disabled = i === 0;
    $("kzIleri").hidden = i === ADIM.length - 1;
    $("kzNav").style.gridTemplateColumns = i === ADIM.length - 1 ? "1fr" : "";
    $("kzIleri").textContent = i === ADIM.length - 2 ? "Bitir →" : "İleri →";
    if (!sessiz) window.scrollTo(0, 0);
    rapor(ADIM[i][2]);
    if (gosterim[i]) gosterim[i]();
  }
  $("kzGeri").onclick = function () { git(S.adim - 1); };
  $("kzIleri").onclick = function () { if (S.adim === 0 && !S.guv.tamam && !durGoster()) { S.guv.tamam = true; } git(S.adim + 1); };

  /* ---------- 0 · güvenlik ---------- */
  $("kzKontrolL").innerHTML = KONTROL.map(function (k, i) {
    return '<div class="kz-tg"><span>' + esc(k) + '</span><div class="seg" role="group" aria-label="' + esc(k) + '"><button type="button" data-q="' + i + '" data-v="1">Evet</button><button type="button" data-q="' + i + '" data-v="0">Hayır</button></div></div>';
  }).join("");
  function durGoster() { return S.guv.yarali === 1 || S.guv.q.some(Boolean); }
  function guvCiz() {
    document.querySelectorAll("[data-yarali]").forEach(function (b) { b.classList.toggle("on", S.guv.yarali === +b.dataset.yarali); });
    document.querySelectorAll("[data-q]").forEach(function (b) { b.classList.toggle("on", S.guv.q[+b.dataset.q] === +b.dataset.v); });
    var dur = durGoster();
    $("kzDur").hidden = !dur;
    $("kzKontrol").hidden = S.guv.yarali === 1;
  }
  document.querySelector(".kz-yarali").addEventListener("click", function (e) {
    var b = e.target.closest("[data-yarali]"); if (!b) return;
    S.guv.yarali = +b.dataset.yarali; S.guv.tamam = false; kaydet(); guvCiz();
    (S.guv.yarali === 1 ? $("kzDur") : $("kzKontrol")).scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("kzKontrolL").addEventListener("click", function (e) {
    var b = e.target.closest("[data-q]"); if (!b) return;
    S.guv.q[+b.dataset.q] = +b.dataset.v; S.guv.tamam = false; kaydet(); guvCiz();
    if (durGoster() && b.dataset.v === "1") $("kzDur").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("kzHicbiri").onclick = function () {
    S.guv.q = S.guv.q.map(function () { return 0; }); if (S.guv.yarali == null) S.guv.yarali = 0;
    S.guv.tamam = true; kaydet(); guvCiz(); git(1);
  };
  $("kzDurGeri").onclick = function () { S.guv.yarali = null; S.guv.q = S.guv.q.map(function () { return 0; }); kaydet(); guvCiz(); window.scrollTo({ top: 0 }); };

  /* ---------- fotoğraflar ---------- */
  var urlOnbellek = {}, hedefSlot = null;
  function slotHTML(k, ikon, ad) { return '<div class="kz-slot" role="button" tabindex="0" data-slot="' + k + '" aria-label="' + esc(ad) + ' fotoğrafı"><b>' + ikon + "</b><span>" + esc(ad) + "</span></div>"; }
  function ekler() { return Object.keys(S.foto).filter(function (k) { return /^ek/.test(k); }).sort(function (a, b) { return S.foto[a].ts - S.foto[b].ts; }); }
  function fotoKutulari() {
    $("kzSlots").innerHTML = SAHNE.map(function (s) { return slotHTML(s[0], s[1], s[2]); }).join("") +
      ekler().map(function (k, i) { return slotHTML(k, "📷", "Ek fotoğraf " + (i + 1)); }).join("");
    fotoGuncelle();
  }
  function fotoAd(k) {
    var s = SAHNE.concat(BELGE("A"), BELGE("B")).find(function (x) { return x[0] === k; });
    if (s) return (/^[AB](ehl|ruh|pol)/.test(k) ? k[0] + " — " : "") + s[2];
    return "Ek fotoğraf " + (ekler().indexOf(k) + 1);
  }
  function fotoGuncelle() {
    document.querySelectorAll("[data-slot]").forEach(function (el) {
      var k = el.dataset.slot, var_ = !!S.foto[k];
      el.classList.toggle("dolu", var_);
      var x = el.querySelector(".kz-x"), cap = el.querySelector(".kz-cap");
      if (!var_) { el.style.backgroundImage = ""; if (x) x.remove(); if (cap) cap.remove(); return; }
      if (!x) { el.insertAdjacentHTML("beforeend", '<button type="button" class="kz-x" aria-label="Fotoğrafı sil">✕</button><i class="kz-cap"></i>'); cap = el.querySelector(".kz-cap"); }
      cap.textContent = el.querySelector("span").textContent;
      var u = urlOnbellek[k];
      if (u && u.ts === S.foto[k].ts) { el.style.backgroundImage = "url(" + u.url + ")"; return; }
      DB.al("f:" + k).then(function (b) {
        if (!b) return;
        if (urlOnbellek[k]) URL.revokeObjectURL(urlOnbellek[k].url);
        urlOnbellek[k] = { url: URL.createObjectURL(b), ts: S.foto[k].ts };
        el.style.backgroundImage = "url(" + urlOnbellek[k].url + ")";
      });
    });
  }
  function kucult(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, 1600 / Math.max(w, h));
        var cv = document.createElement("canvas"); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        var c = cv.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, cv.width, cv.height); c.drawImage(im, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(u);
        cv.toBlob(function (b) { cv.width = cv.height = 1; b ? res(b) : rej(new Error("jpeg")); }, "image/jpeg", 0.75);
      };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error("okunamadı")); };
      im.src = u;
    });
  }
  async function fotoEkle(k, file) {
    var el = document.querySelector('[data-slot="' + k + '"]'); if (el) el.classList.add("yuk");
    try {
      var b = await kucult(file);
      await DB.koy("f:" + k, b);
      S.foto[k] = { ts: file.lastModified && Math.abs(Date.now() - file.lastModified) < 864e5 * 3 ? file.lastModified : Date.now() };
      kaydet(true);
    } catch (e) { toast("⚠️ Fotoğraf eklenemedi"); }
    if (el) el.classList.remove("yuk");
  }
  document.addEventListener("click", function (e) {
    var x = e.target.closest(".kz-x");
    if (x) {
      e.stopPropagation();
      var k = x.closest("[data-slot]").dataset.slot;
      if (!confirm("Bu fotoğraf silinsin mi?")) return;
      delete S.foto[k]; DB.sil("f:" + k); kaydet(true);
      if (/^ek/.test(k)) fotoKutulari(); else fotoGuncelle();
      return;
    }
    var s = e.target.closest("[data-slot]");
    if (s) { hedefSlot = s.dataset.slot; $("kzCek").value = ""; $("kzCek").click(); }
  });
  document.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-slot]")) { e.preventDefault(); e.target.click(); } });
  $("kzCek").onchange = async function () {
    var f = this.files && this.files[0]; if (!f || !hedefSlot) return;
    var k = hedefSlot; hedefSlot = null;
    await fotoEkle(k, f);
    if (/^ek/.test(k)) fotoKutulari(); else fotoGuncelle();
  };
  $("kzFotoEk").onclick = function () { hedefSlot = "ek" + Date.now(); $("kzCek").value = ""; $("kzCek").click(); };
  $("kzGaleri").onclick = function () { $("kzSec2").value = ""; $("kzSec2").click(); };
  $("kzSec2").onchange = async function () {
    var fs = Array.from(this.files || []);
    for (var i = 0; i < fs.length; i++) { await fotoEkle("ek" + (Date.now() + i), fs[i]); }
    fotoKutulari();
    if (fs.length) toast("🖼️ " + fs.length + " fotoğraf eklendi");
  };

  /* ---------- formlar ---------- */
  function alanHTML(yol, etiket, tur, genis, v) {
    var id = "f_" + yol.replace(/\./g, "_"), benim = v === "A", ac = function (x) { return benim ? x : "off"; };
    var at = "", el = "input";
    switch (tur) {
      case "ad": at = 'type="text" autocomplete="' + ac("name") + '" autocapitalize="words"'; break;
      case "tckn": at = 'type="text" inputmode="numeric" maxlength="11" pattern="[0-9]*" autocomplete="off" class="kz-tc"'; break;
      case "vkn": at = 'type="text" inputmode="numeric" maxlength="11" pattern="[0-9]*" autocomplete="off" class="kz-tc"'; break;
      case "tel": at = 'type="tel" inputmode="tel" autocomplete="' + ac("tel") + '" placeholder="05xx xxx xx xx"'; break;
      case "email": at = 'type="email" inputmode="email" autocomplete="' + ac("email") + '" autocapitalize="off"'; break;
      case "plaka": at = 'type="text" autocomplete="off" autocapitalize="characters" class="kz-plaka" placeholder="34 ABC 123"'; break;
      case "sasi": at = 'type="text" autocomplete="off" autocapitalize="characters" maxlength="20" class="kz-plaka"'; break;
      case "date": at = 'type="date"'; break;
      case "sinif": at = 'type="text" autocomplete="off" autocapitalize="characters" list="kzSiniflar" placeholder="B"'; break;
      case "kullanim": at = 'type="text" autocomplete="off" list="kzKullanim" placeholder="Hususi, Ticari…"'; break;
      case "adres": el = "textarea"; at = 'rows="2" autocomplete="' + ac("street-address") + '"'; break;
      default: at = 'type="text" autocomplete="off"';
    }
    var kutu = el === "textarea" ? "<textarea id=\"" + id + "\" data-k=\"" + yol + "\" " + at + "></textarea>" : "<input id=\"" + id + "\" data-k=\"" + yol + "\" " + at + ">";
    var uy = tur === "tckn" || tur === "vkn" || tur === "plaka" ? '<div class="kz-uy" data-uy="' + yol + '"></div>' : "";
    return '<div class="' + (genis ? "kz-g1" : "") + '"><label for="' + id + '">' + esc(etiket) + "</label>" + kutu + uy + "</div>";
  }
  function grupHTML(v, g, haric) {
    return F[g].filter(function (a) { return !haric || !haric.some(function (h) { return h[0] === g && h[1] === a[0]; }); })
      .map(function (a) { return alanHTML(v + "." + g + "." + a[0], a[1], a[2], a[3], v); }).join("");
  }
  function belgeHTML(v) {
    return '<div class="card kz-belge"><h3 class="kz-st">📸 Belgelerin fotoğrafı</h3><div class="kz-slots">' +
      BELGE(v).map(function (s) { return slotHTML(s[0], s[1], s[2]); }).join("") + '</div><p class="kz-not">Yazmak yerine çekebilirsin; PDF’e eklenir.</p></div>';
  }
  function kat(baslik, ic, acik, not) { return '<details class="card kz-kat"' + (acik ? " open" : "") + "><summary>" + esc(baslik) + (not ? "<small>" + esc(not) + "</small>" : "") + '</summary><div class="kz-ic"><div class="kz-grid">' + ic + "</div></div></details>"; }
  function ykHTML(v) {
    return '<div class="card"><label class="kz-sw"><input type="checkbox" data-k="' + v + '.yk.on" data-yk="' + v + '"><span></span> Yabancı plakalı / Yeşil Kart</label><div class="kz-grid" data-ykf="' + v + '" hidden>' + grupHTML(v, "yk") + "</div></div>";
  }
  $("kzFormA").innerHTML = belgeHTML("A") +
    kat(GRUP.surucu, grupHTML("A", "surucu"), true) + kat(GRUP.arac, grupHTML("A", "arac"), true) +
    kat(GRUP.police, grupHTML("A", "police") + '<div class="kz-g1"><button type="button" class="kz-mini" data-ayni="A">👤 Sigortalı = sürücü</button></div>', false, "Poliçede yazar") + ykHTML("A");
  $("kzFormB").innerHTML = '<div class="card"><h3 class="kz-st">En gerekli 5 bilgi</h3><div class="kz-grid">' +
    B_HIZLI.map(function (h) { var a = F[h[0]].find(function (x) { return x[0] === h[1]; }); return alanHTML("B." + h[0] + "." + h[1], a[1], a[2], h[1] === "ad" || h[1] === "sirket", "B"); }).join("") +
    '</div></div>' + belgeHTML("B") +
    kat("Diğer sürücü bilgileri", grupHTML("B", "surucu", B_HIZLI), false) + kat("Diğer araç bilgileri", grupHTML("B", "arac", B_HIZLI), false) +
    kat("Diğer poliçe bilgileri", grupHTML("B", "police", B_HIZLI) + '<div class="kz-g1"><button type="button" class="kz-mini" data-ayni="B">👤 Sigortalı = sürücü</button></div>', false) + ykHTML("B");
  document.body.insertAdjacentHTML("beforeend", '<datalist id="kzSiniflar"><option value="B"><option value="A"><option value="A2"><option value="A1"><option value="BE"><option value="C"><option value="CE"><option value="D"><option value="M"></datalist><datalist id="kzKullanim"><option value="Hususi"><option value="Ticari"><option value="Taksi"><option value="Kiralık"></datalist>');

  var YER = [["il", "İl"], ["ilce", "İlçe"], ["semt", "Semt"], ["mahalle", "Mahalle"], ["cadde", "Cadde"], ["sokak", "Sokak"]];
  $("kzYerF").innerHTML = '<div class="kz-grid">' + YER.map(function (y) { return alanHTML("yer." + y[0], y[1], "text", 0, "B"); }).join("") + "</div>";

  function tanikCiz() {
    $("kzTanik").innerHTML = S.tanik.map(function (t, i) {
      return '<div class="kz-tanik"><div class="kz-tb"><span>Tanık ' + (i + 1) + '</span><button type="button" class="kz-link" data-tsil="' + i + '">Kaldır</button></div><div class="kz-grid">' +
        alanHTML("tanik." + i + ".ad", "Ad Soyad", "text", 1, "B") + alanHTML("tanik." + i + ".tel", "Tel No", "tel", 1, "B") + alanHTML("tanik." + i + ".adres", "Adres", "text", 1, "B") + "</div></div>";
    }).join("");
    doldur($("kzTanik"));
  }
  $("kzTanikEk").onclick = function () { S.tanik.push({ ad: "", adres: "", tel: "" }); kaydet(); tanikCiz(); var x = $("f_tanik_" + (S.tanik.length - 1) + "_ad"); if (x) x.focus(); };
  $("kzTanik").addEventListener("click", function (e) { var b = e.target.closest("[data-tsil]"); if (!b) return; S.tanik.splice(+b.dataset.tsil, 1); kaydet(); tanikCiz(); });

  function uyari(yol) {
    var el = document.querySelector('[data-uy="' + yol + '"]'); if (!el) return;
    var v = String(al(S, yol) || "");
    el.className = "kz-uy"; el.textContent = "";
    if (!v) return;
    if (/tckn$/.test(yol)) {
      if (v.length < 11) { el.textContent = "11 hane olmalı (" + v.length + ")"; el.classList.add("no"); }
      else if (tcknGecerli(v)) { el.textContent = "✓ Numara geçerli görünüyor"; el.classList.add("ok"); }
      else { el.textContent = "⚠️ Kontrol hanesi tutmuyor, bir daha bak"; el.classList.add("no"); }
    } else if (/svkn$/.test(yol)) {
      if (v.length === 11) { if (tcknGecerli(v)) { el.textContent = "✓ T.C. kimlik no geçerli görünüyor"; el.classList.add("ok"); } else { el.textContent = "⚠️ T.C. kimlik no kontrolü tutmuyor"; el.classList.add("no"); } }
      else if (v.length !== 10) { el.textContent = "T.C. 11, vergi no 10 hane"; el.classList.add("no"); }
    } else if (/plaka$/.test(yol)) {
      if (!/^\d{2} [A-Z]{1,3} \d{2,5}$/.test(v)) { el.textContent = /yk/.test(yol) ? "" : "Türk plakası değilse sorun yok"; el.classList.add("no"); }
    }
  }
  function doldur(kok) {
    (kok || document).querySelectorAll("[data-k]").forEach(function (el) {
      var v = al(S, el.dataset.k);
      if (el.type === "checkbox") el.checked = !!v; else el.value = v == null ? "" : v;
      uyari(el.dataset.k);
    });
    gizleUygula(); ykGoster();
  }
  function gizleUygula() { document.querySelectorAll(".kz-tc").forEach(function (el) { el.classList.toggle("kz-gizli", !!ayar.gizle); }); $("kzGizle").checked = !!ayar.gizle; }
  function ykGoster() { document.querySelectorAll("[data-ykf]").forEach(function (g) { g.hidden = !S[g.dataset.ykf].yk.on; }); }
  document.addEventListener("input", function (e) {
    var el = e.target; if (!el.dataset || !el.dataset.k) return;
    var v = el.type === "checkbox" ? el.checked : el.value;
    if (el.classList.contains("kz-tc")) { var t = v.replace(/\D/g, "").slice(0, 11); if (t !== v) { el.value = t; v = t; } }
    if (el.classList.contains("kz-plaka")) { var u = v.toUpperCase(); if (u !== v) { var p = el.selectionStart; el.value = u; try { el.setSelectionRange(p, p); } catch (x) {} v = u; } }
    koy(S, el.dataset.k, v); kaydet();
    if (/tckn$|svkn$/.test(el.dataset.k)) uyari(el.dataset.k);
    if (/surucu\.ad$/.test(el.dataset.k)) imzaAdlari();
  });
  document.addEventListener("change", function (e) {
    var el = e.target; if (!el.dataset || !el.dataset.k) return;
    if (/arac\.plaka$/.test(el.dataset.k)) { el.value = plakaBicim(el.value); koy(S, el.dataset.k, el.value); kaydet(); }
    if (el.type === "checkbox") { koy(S, el.dataset.k, el.checked); kaydet(); ykGoster(); }
    else { koy(S, el.dataset.k, el.type === "number" ? el.value : el.value.trim()); kaydet(); }
    uyari(el.dataset.k);
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ayni]"); if (!b) return;
    var v = S[b.dataset.ayni];
    v.police.sigortali = v.surucu.ad; v.police.stel = v.surucu.tel; v.police.seposta = v.surucu.eposta; if (v.surucu.tckn) v.police.svkn = v.surucu.tckn;
    kaydet(); doldur(b.closest(".kz-ic")); toast("Sürücü bilgileri sigortalıya kopyalandı");
  });

  // hatırla
  $("kzHatirla").checked = !!ayar.hatirla;
  $("kzHatirla").onchange = function () {
    ayar.hatirla = this.checked; ayarKaydet();
    if (!ayar.hatirla) { localStorage.removeItem(BEN); toast("A bilgilerin artık hatırlanmayacak"); } else { kaydet(); toast("A bilgilerin bu telefonda hatırlanacak"); }
  };
  $("kzBenSil").onclick = function () {
    if (!confirm("Hatırlanan A bilgileri silinsin mi? (Bu kazadaki bilgiler kalır.)")) return;
    localStorage.removeItem(BEN); ayar.hatirla = false; ayarKaydet(); $("kzHatirla").checked = false; toast("Hatırlanan bilgiler silindi");
  };

  /* ---------- konum ---------- */
  function konumYaz() {
    var y = S.yer;
    $("kzKonumD").textContent = y.lat != null ? "📍 " + (+y.lat).toFixed(5) + ", " + (+y.lon).toFixed(5) + (y.acc ? " (±" + Math.round(y.acc) + " m)" : "") : "Adres alanlarını elle de yazabilirsin.";
  }
  $("kzKonum").onclick = function () {
    var b = this;
    if (!navigator.geolocation) { toast("Bu telefonda konum alınamıyor"); return; }
    b.disabled = true; b.textContent = "📡 Konum alınıyor…";
    navigator.geolocation.getCurrentPosition(async function (p) {
      var lat = p.coords.latitude, lon = p.coords.longitude;
      S.yer.lat = +lat.toFixed(6); S.yer.lon = +lon.toFixed(6); S.yer.acc = p.coords.accuracy || null; kaydet(); konumYaz();
      b.textContent = "🔎 Adres bulunuyor…";
      try {
        var r = await fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=tr&addressdetails=1&zoom=18&lat=" + lat.toFixed(6) + "&lon=" + lon.toFixed(6));
        var a = (await r.json()).address || {};
        var il = a.province || a.state || a.city || "", ilce = a.town || a.county || a.city_district || a.municipality || a.district || "";
        var mah = a.suburb || a.neighbourhood || a.quarter || a.village || "", semt = [a.quarter, a.neighbourhood].find(function (x) { return x && x !== mah; }) || "";
        var yol = a.road || a.pedestrian || a.street || "";
        var sokakMi = /(sokak|sokağı|sk\.?)$/i.test(yol);
        if (ilce === il) ilce = a.city_district || a.county || "";
        var yeni = { il: il, ilce: ilce, semt: semt, mahalle: mah, cadde: sokakMi ? "" : yol, sokak: sokakMi ? yol : "" };
        Object.keys(yeni).forEach(function (k) { if (yeni[k] || !S.yer[k]) S.yer[k] = yeni[k]; });
        kaydet(); doldur($("kzYerF")); toast("📍 Adres dolduruldu, kontrol et");
      } catch (e) { toast("Adres bulunamadı; konum kaydedildi, adresi elle yaz"); }
      b.disabled = false; b.textContent = "📍 Konumu yenile";
    }, function () {
      b.disabled = false; b.textContent = "📍 Konumumu al";
      toast("Konum izni verilmedi; adresi elle yazabilirsin");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  };

  /* ---------- 7. 15 madde ---------- */
  $("kz15").innerHTML = '<div class="kz-hd"><span>Durum</span><b class="kz-lA">A</b><b class="kz-lB">B</b></div>' + MADDE.map(function (m, i) {
    return "<div><span>" + esc(m) + '</span><button type="button" class="kz-ch A" data-m="' + i + '" data-v="A" aria-pressed="false" aria-label="A: ' + esc(m) + '">A</button><button type="button" class="kz-ch B" data-m="' + i + '" data-v="B" aria-pressed="false" aria-label="B: ' + esc(m) + '">B</button></div>';
  }).join("");
  function kutuCiz() { document.querySelectorAll(".kz-ch").forEach(function (b) { var on = !!S.kutu[b.dataset.v][+b.dataset.m]; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); }); }
  $("kz15").addEventListener("click", function (e) {
    var b = e.target.closest(".kz-ch"); if (!b) return;
    var a = S.kutu[b.dataset.v], i = +b.dataset.m; a[i] = a[i] ? 0 : 1; kaydet(); kutuCiz();
  });

  /* ---------- 9. ilk darbe ---------- */
  function darbeSVG(v) {
    var d = S[v], tas = d.motor ? MOTOR : ARABA, ok = "";
    if (d.darbe) { var o = okGeo(d.darbe); ok = '<line class="ok" x1="' + o.kuyruk[0] + '" y1="' + o.kuyruk[1] + '" x2="' + o.taban[0] + '" y2="' + o.taban[1] + '"/><polygon class="okb" points="' + [o.uc, o.k1, o.k2].map(function (q) { return q.join(","); }).join(" ") + '"/>'; }
    return '<div class="kz-dh"><span class="kz-l' + v + '">' + v + '</span><button type="button" class="kz-link" data-dtemiz="' + v + '"' + (d.darbe ? "" : " hidden") + '>Temizle</button></div>' +
      '<svg viewBox="' + VB.join(" ") + '" role="img" aria-label="' + v + ' aracı: ilk darbe yerini işaretle" data-dv="' + v + '">' +
      tas.map(function (p) { return '<path class="' + p[0] + '" d="' + p[1] + '"/>'; }).join("") +
      '<text class="yz" x="50" y="-16" text-anchor="middle">Ön</text><text class="yz" x="50" y="208" text-anchor="middle">Arka</text>' + ok + "</svg>" +
      '<div class="mt"><button type="button" data-tas="' + v + '" data-m="0" class="' + (d.motor ? "" : "on") + '">🚗 Oto</button><button type="button" data-tas="' + v + '" data-m="1" class="' + (d.motor ? "on" : "") + '">🏍️ Motor</button></div>';
  }
  function darbeCiz() { document.querySelectorAll(".kz-darbe [data-v]").forEach(function (k) { k.innerHTML = darbeSVG(k.dataset.v); }); }
  document.querySelector(".kz-darbe").addEventListener("click", function (e) {
    var t = e.target.closest("[data-tas]");
    if (t) { S[t.dataset.tas].motor = t.dataset.m === "1"; S[t.dataset.tas].darbe = null; kaydet(); darbeCiz(); return; }
    var c = e.target.closest("[data-dtemiz]");
    if (c) { S[c.dataset.dtemiz].darbe = null; kaydet(); darbeCiz(); return; }
    var svg = e.target.closest("svg[data-dv]"); if (!svg) return;
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var q = pt.matrixTransform(svg.getScreenCTM().inverse());
    S[svg.dataset.dv].darbe = { x: Math.round(Math.max(-30, Math.min(130, q.x))), y: Math.round(Math.max(-24, Math.min(206, q.y))) };
    kaydet(); darbeCiz();
  });

  /* ---------- kroki ---------- */
  $("kzTpl").innerHTML = Kroki.SABLON.map(function (t) { return '<button type="button" data-t="' + t[0] + '">' + t[1] + "</button>"; }).join("");
  function tplCiz() { $("kzTpl").querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b.dataset.t === S.kroki.tpl); }); }
  var kroki = Kroki.bagla($("kzKrokiC"), function () { return S.kroki; }, function () { S.krokiDok = true; kaydet(true); tplCiz(); }, {
    secim: function (s) {
      $("kzSec").hidden = !s;
      if (!s) return;
      $("kzSecAd").textContent = s.t === "car" ? s.who + " aracı" : s.t === "ok" ? "Ok" : "“" + s.s + "”";
      $("kzSecSil").hidden = s.t === "car"; $("kzSecDz").hidden = s.t !== "yazi";
    }
  });
  $("kzTpl").onclick = function (e) { var b = e.target.closest("[data-t]"); if (b) { kroki.sablon(b.dataset.t); tplCiz(); } };
  var tamEkran = false;
  $("kzArac").onclick = function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.m) { $("kzArac").querySelectorAll("[data-m]").forEach(function (x) { x.classList.toggle("on", x === b); }); kroki.mod(b.dataset.m); return; }
    var mod = function () { $("kzArac").querySelectorAll("[data-m]").forEach(function (x) { x.classList.toggle("on", x.dataset.m === "tasi"); }); };
    switch (b.dataset.c) {
      case "ok": kroki.ok(); mod(); break;
      case "yazi": var s = prompt("Sokak / cadde adı ya da not:", ""); if (s && s.trim()) { kroki.yazi(s.trim()); mod(); } break;
      case "geri": if (!kroki.geri()) toast("Geri alınacak bir şey yok"); tplCiz(); break;
      case "temiz": if (confirm("Kroki baştan başlasın mı? (Geri alınabilir)")) kroki.temizle(); break;
      case "tam": tamEkran = !tamEkran; kroki.tam(tamEkran); b.textContent = tamEkran ? "✕ Küçült" : "⛶ Büyüt"; break;
    }
  };
  $("kzSec").onclick = function (e) {
    var b = e.target.closest("[data-r]"); if (!b) return;
    if (b.dataset.r === "sil") kroki.sil();
    else if (b.dataset.r === "duzenle") { var s = kroki.secili(); var y = prompt("Yazıyı düzelt:", s ? s.s : ""); if (y && y.trim()) kroki.duzenle(y.trim()); }
    else kroki.dondur(+b.dataset.r);
  };
  gosterim[6] = function () { kroki.boyutla(); tplCiz(); };

  /* ---------- imzalar ---------- */
  function imzaPad(v) {
    var cv = $("kzImza" + v), c = cv.getContext("2d"), dpr = 1, son = [], ciziyor = false, degisti = false;
    function boyutla() {
      var r = cv.getBoundingClientRect(); if (!r.width) return;
      dpr = Math.min(3, window.devicePixelRatio || 1);
      var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      if (cv.width === w && cv.height === h) return;
      cv.width = w; cv.height = h; yukle();
    }
    function kalem() { c.setTransform(dpr, 0, 0, dpr, 0, 0); c.strokeStyle = "#13204a"; c.lineWidth = 2.6; c.lineCap = "round"; c.lineJoin = "round"; }
    function yukle() {
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
      if (!S.imza[v]) return;
      DB.al("imza:" + v).then(function (b) {
        if (!b) return;
        var u = URL.createObjectURL(b), im = new Image();
        im.onload = function () { c.setTransform(1, 0, 0, 1, 0, 0); var k = Math.min(cv.width / im.width, cv.height / im.height); c.drawImage(im, (cv.width - im.width * k) / 2, (cv.height - im.height * k) / 2, im.width * k, im.height * k); URL.revokeObjectURL(u); };
        im.src = u;
      });
    }
    function nokta(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cv.addEventListener("pointerdown", function (e) {
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      ciziyor = true; son = [nokta(e)]; kalem();
      c.beginPath(); c.arc(son[0][0], son[0][1], 1.3, 0, Math.PI * 2); c.fillStyle = "#13204a"; c.fill();
    });
    cv.addEventListener("pointermove", function (e) {
      if (!ciziyor) return;
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; if (!evs.length) evs = [e];
      kalem();
      evs.forEach(function (ev) {
        var p = nokta(ev), a = son[son.length - 1];
        if (Math.hypot(p[0] - a[0], p[1] - a[1]) < 1.2) return;
        son.push(p);
        if (son.length >= 3) {
          var p0 = son[son.length - 3], p1 = son[son.length - 2], p2v = son[son.length - 1];
          var m1 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], m2 = [(p1[0] + p2v[0]) / 2, (p1[1] + p2v[1]) / 2];
          c.beginPath(); c.moveTo(m1[0], m1[1]); c.quadraticCurveTo(p1[0], p1[1], m2[0], m2[1]); c.stroke();
        } else { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(p[0], p[1]); c.stroke(); }
      });
      degisti = true;
    });
    function bitir() {
      if (!ciziyor) return; ciziyor = false;
      S.imza[v] = true; kaydet(true);
      cv.toBlob(function (b) { if (b) DB.koy("imza:" + v, b); }, "image/png");
    }
    cv.addEventListener("pointerup", bitir); cv.addEventListener("pointercancel", bitir);
    if (window.ResizeObserver) new ResizeObserver(boyutla).observe(cv);
    return {
      boyutla: boyutla, yukle: yukle,
      temizle: function () { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); S.imza[v] = false; DB.sil("imza:" + v); kaydet(true); }
    };
  }
  var imzalar = { A: imzaPad("A"), B: imzaPad("B") };
  document.querySelectorAll("[data-temiz]").forEach(function (b) { b.onclick = function () { imzalar[b.dataset.temiz].temizle(); }; });
  function imzaAdlari() { $("kzImzaAdA").textContent = S.A.surucu.ad || ""; $("kzImzaAdB").textContent = S.B.surucu.ad || ""; }
  gosterim[8] = function () { imzaAdlari(); imzalar.A.boyutla(); imzalar.B.boyutla(); };

  /* ---------- 9 · bitir ---------- */
  function ozet() {
    var A = S.A, B = S.B, sahneSay = Object.keys(S.foto).filter(function (k) { return !/^[AB](ehl|ruhsat|police)/.test(k); }).length;
    var R = [
      [sahneSay >= 3, "Fotoğraflar", sahneSay ? sahneSay + " fotoğraf" : "Henüz fotoğraf yok", 1],
      [!!(S.yer.il || S.yer.cadde || S.yer.lat != null), "Kaza yeri", [S.yer.ilce, S.yer.il].filter(Boolean).join(", ") || "Konum ya da adres yok", 2],
      [!!A.arac.plaka, "A plakası", A.arac.plaka || "Yazılmadı", 3],
      [!!(A.police.sirket || A.police.no || S.foto.Apolice), "A sigorta", A.police.sirket || (S.foto.Apolice ? "Poliçe fotoğrafı var" : "Şirket / poliçe yok"), 3],
      [!!B.surucu.ad, "B sürücü adı", B.surucu.ad || "Yazılmadı", 4],
      [!!B.surucu.tel, "B telefon", B.surucu.tel || "Yazılmadı", 4],
      [!!B.arac.plaka, "B plakası", B.arac.plaka || "Yazılmadı", 4],
      [!!((B.police.sirket && B.police.no) || S.foto.Bpolice), "B sigorta", B.police.sirket ? B.police.sirket + (B.police.no ? " · " + B.police.no : " · poliçe no yok") : (S.foto.Bpolice ? "Poliçe fotoğrafı var" : "Şirket / poliçe yok"), 4],
      [!!(A.darbe && B.darbe), "İlk darbe yeri", A.darbe && B.darbe ? "İkisi de işaretli" : "İşaretlenmedi", 5],
      [!!S.krokiDok, "Kroki", S.krokiDok ? "Çizildi" : "Araçları yerleştir", 6],
      [!!(S.gorus.A || S.gorus.B), "Görüşler", S.gorus.A || S.gorus.B ? "Yazıldı" : "Boş", 7],
      [S.imza.A && S.imza.B, "İmzalar", S.imza.A && S.imza.B ? "İkisi de var" : S.imza.A ? "B imzası yok" : S.imza.B ? "A imzası yok" : "Yok", 8]
    ];
    $("kzOzet").innerHTML = R.map(function (r) {
      return '<div class="kz-oz ' + (r[0] ? "ok" : "no") + '"><i>' + (r[0] ? "✓" : "!") + "</i><span>" + esc(r[1]) + "<small>" + esc(r[2]) + "</small></span>" + (r[0] ? "<span></span>" : '<button type="button" data-git="' + r[3] + '">Ekle</button>') + "</div>";
    }).join("");
  }
  $("kzOzet").onclick = function (e) { var b = e.target.closest("[data-git]"); if (b) git(+b.dataset.git); };
  function kopyaListe() {
    var gizle = ayar.gizle, sat = [], html = "";
    function ekle(baslik, liste) {
      var dolu = liste.filter(function (x) { return x[1]; }); if (!dolu.length) return;
      html += '<div class="kz-kg">' + esc(baslik) + "</div>"; sat.push("", "— " + baslik + " —");
      dolu.forEach(function (x) {
        var goster = x[2] && gizle ? String(x[1]).replace(/^(\d{2})\d+(\d{2})$/, function (m, a, b) { return a + "•".repeat(m.length - 4) + b; }) : x[1];
        html += '<div class="kz-kr"><span><small>' + esc(x[0]) + "</small>" + esc(goster) + '</span><button type="button" data-kopya="' + esc(x[1]) + '" aria-label="' + esc(x[0]) + ' kopyala">📋</button></div>';
        sat.push(x[0] + ": " + x[1]);
      });
    }
    var tr = function (s) { var m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[3] + "." + m[2] + "." + m[1] : s; };
    ekle("Kaza", [["Tarih", tr(S.zaman.tarih)], ["Saat", S.zaman.saat]].concat(YER.map(function (y) { return [y[1], S.yer[y[0]]]; })).concat([["Konum", S.yer.lat != null ? S.yer.lat + ", " + S.yer.lon : ""]]));
    S.tanik.forEach(function (t, i) { ekle("Tanık " + (i + 1), [["Ad Soyad", t.ad], ["Adres", t.adres], ["Tel No", t.tel]]); });
    ["A", "B"].forEach(function (v) {
      ["surucu", "arac", "police"].concat(S[v].yk.on ? ["yk"] : []).forEach(function (g) {
        ekle(v + " · " + GRUP[g].replace(/^\d\. /, ""), F[g].map(function (a) { var x = S[v][g][a[0]]; return [a[1], a[2] === "date" ? tr(x) : x, a[2] === "tckn" || a[2] === "vkn"]; }));
      });
    });
    var m7 = [];
    MADDE.forEach(function (m, i) { var k = (S.kutu.A[i] ? "A" : "") + (S.kutu.B[i] ? "B" : ""); if (k) m7.push([k.split("").join(", "), m]); });
    ekle("7. İşaretlenen kutular", m7.map(function (x) { return [x[0], x[1]]; }).concat([["Hız A (km/s)", S.A.hiz], ["Hız B (km/s)", S.B.hiz], ["Fren izi A (m)", S.A.fren], ["Fren izi B (m)", S.B.fren]]));
    ekle("11. Sürücü görüşleri", [["A", S.gorus.A], ["B", S.gorus.B]]);
    $("kzKopyaL").innerHTML = html || '<p class="kz-not">Henüz bilgi yok.</p>';
    return sat.join("\n").trim();
  }
  function kopyala(s, b) {
    var bitti = function () { if (b) { b.classList.add("ok"); b.textContent = "✓"; setTimeout(function () { b.classList.remove("ok"); b.textContent = "📋"; }, 1400); } toast("Kopyalandı"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(bitti, function () { eskiKopya(s); bitti(); });
    else { eskiKopya(s); bitti(); }
  }
  function eskiKopya(s) { var t = document.createElement("textarea"); t.value = s; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} t.remove(); }
  $("kzKopyaL").onclick = function (e) { var b = e.target.closest("[data-kopya]"); if (b) kopyala(b.dataset.kopya, b); };
  $("kzHepsiKopya").onclick = function () { var t = kopyaListe(); if (t) kopyala(t); };
  $("kzKopya").addEventListener("toggle", function () { if (this.open) { kopyaListe(); rapor("kopya"); } });
  $("kzGizle").onchange = function () { ayar.gizle = this.checked; ayarKaydet(); gizleUygula(); kopyaListe(); };
  gosterim[9] = function () { ozet(); if ($("kzKopya").open) kopyaListe(); };

  // PDF
  function fotoListeleri() {
    var sahne = [], belge = [], n = 0;
    SAHNE.map(function (s) { return s[0]; }).concat(ekler()).forEach(function (k) { if (S.foto[k]) sahne.push({ key: "f:" + k, ad: fotoAd(k), ts: S.foto[k].ts, no: ++n }); });
    BELGE("A").concat(BELGE("B")).forEach(function (s) { if (S.foto[s[0]]) belge.push({ key: "f:" + s[0], ad: fotoAd(s[0]), ts: S.foto[s[0]].ts, no: ++n }); });
    return { sahne: sahne, belge: belge };
  }
  function dosyaAdi() {
    var pl = (S.A.arac.plaka || S.B.arac.plaka || "").replace(/[^A-Za-z0-9]/g, "");
    return "kaza-" + (S.zaman.tarih || ymd(new Date())) + (pl ? "-" + pl : "") + ".pdf";
  }
  var hazir = null; // {surum, file}
  async function pdfDosya() {
    if (hazir && hazir.surum === surum) return hazir.file;
    var L = fotoListeleri();
    var r = await KazaPDF.yap({ S: S, ARABA: ARABA, MOTOR: MOTOR, VB: VB, ok: okGeo, MADDE: MADDE, sahne: L.sahne, belge: L.belge, blob: DB.al },
      function (n, t) { $("kzPdfD").textContent = "⏳ Sayfa " + n + " / " + t + " hazırlanıyor…"; });
    var file = new File([r.blob], dosyaAdi(), { type: "application/pdf" });
    hazir = { surum: surum, file: file, sayfa: r.sayfa };
    return file;
  }
  function indir(file) {
    var u = URL.createObjectURL(file), a = document.createElement("a");
    a.href = u; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
  }
  function boyutYaz(n) { return n > 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.round(n / 1024) + " KB"; }
  async function pdfIs(paylas) {
    var b = paylas ? $("kzPdf") : $("kzPdfIndir"), eski = b.textContent;
    b.disabled = true; $("kzPdfD").textContent = "⏳ PDF hazırlanıyor…";
    try {
      if (!S.imza.A || !S.imza.B) { /* imzasız da hazırlanır; özet zaten uyarıyor */ }
      var file = await pdfDosya();
      $("kzPdfD").textContent = "✓ " + file.name + " · " + hazir.sayfa + " sayfa · " + boyutYaz(file.size);
      rapor("pdf");
      if (paylas && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Kaza Bilgi Dökümü", text: "Kaza bilgi dökümü (resmî tutanak yerine geçmez)." });
        } catch (e) {
          if (e && e.name === "NotAllowedError") { b.disabled = false; b.textContent = "📤 Hazır — paylaşmak için dokun"; return; }
          if (!(e && e.name === "AbortError")) indir(file);
        }
      } else indir(file);
    } catch (e) { $("kzPdfD").textContent = "⚠️ PDF hazırlanamadı. Telefonda yer azsa birkaç fotoğrafı silip tekrar dene."; }
    b.disabled = false; b.textContent = eski.indexOf("Hazır") >= 0 ? "📄 PDF oluştur ve paylaş" : eski;
  }
  $("kzPdf").onclick = function () { pdfIs(true); };
  $("kzPdfIndir").onclick = function () { pdfIs(false); };
  $("kzFotoPay").onclick = async function () {
    var L = fotoListeleri(), hepsi = L.sahne.concat(L.belge);
    if (!hepsi.length) { toast("Henüz fotoğraf yok"); return; }
    var files = [];
    for (var i = 0; i < hepsi.length; i++) { var b = await DB.al(hepsi[i].key); if (b) files.push(new File([b], "kaza-foto-" + p2(hepsi[i].no) + ".jpg", { type: "image/jpeg" })); }
    if (navigator.canShare && navigator.canShare({ files: files })) {
      try { await navigator.share({ files: files, title: "Kaza fotoğrafları" }); return; } catch (e) { if (e && e.name === "AbortError") return; }
    }
    files.forEach(function (f, j) { setTimeout(function () { indir(f); }, j * 400); });
  };

  // sil
  $("kzSil").onclick = async function () {
    var benDe = $("kzSilBen").checked;
    if (!confirm("Bu kazanın tüm bilgileri, fotoğrafları, krokisi ve imzaları bu telefondan silinsin mi?" + (benDe ? "\nHatırlanan A bilgilerin de silinecek." : ""))) return;
    await temizle(benDe); toast("🗑️ Kaza bilgileri silindi");
  };
  async function temizle(benDe) {
    try { localStorage.removeItem(KEY); } catch (e) {}
    if (benDe) { localStorage.removeItem(BEN); }
    await DB.temizle();
    Object.keys(urlOnbellek).forEach(function (k) { URL.revokeObjectURL(urlOnbellek[k].url); }); urlOnbellek = {};
    hazir = null; S = bos(); $("kzSilBen").checked = false;
    hepsiniCiz(); kaydet(true); git(0);
  }

  function hepsiniCiz() {
    guvCiz(); fotoKutulari(); tanikCiz(); doldur(); konumYaz(); kutuCiz(); darbeCiz(); tplCiz(); kroki.ciz(); imzaAdlari();
    imzalar.A.yukle(); imzalar.B.yukle(); adimIsaret(); $("kzHatirla").checked = !!ayar.hatirla;
  }
  hepsiniCiz();
  // 9 Kasım 2026: önceden başlanmış bir kayıt varsa açılışta sor: kaldığın yerden mi, yeni kaza mı? Yeni kayıt her zaman 1. adımdan başlar
  var yarim = (S.adim || 0) > 0 || S.guv.tamam || S.guv.yarali != null || ADIM.some(function (_, i) { return i > 0 && doluMu(i); });
  if (yarim) {
    var t = new Date(S.olustu || Date.now()), kutu = $("kzDevam");
    $("kzDevamT").textContent = t.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) + " " + t.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) + " · " + ((S.adim || 0) + 1) + ". adımda kalmıştın";
    kutu.hidden = false;
    $("kzDevamE").onclick = function () { kutu.hidden = true; rapor("devam"); };
    $("kzDevamY").onclick = async function () {
      if (!confirm("Önceki kaydın bilgileri, fotoğrafları, krokisi ve imzaları silinip yeni bir kaza başlatılsın mı?\n(Kendi hatırlanan bilgilerin kalır. Önce PDF'ini almak istersen Vazgeç'e bas, kaldığın yerden devam et.)")) return;
      await temizle(false); kutu.hidden = true; rapor("yeni"); toast("🆕 Yeni kaza: 1. adımdan başlıyoruz");
    };
    git(S.adim || 0, true);
    try { history.scrollRestoration = "manual"; } catch (e) {} // tarayıcı eski kaydırma yerine dönmesin: soru kutusu görünsün
    window.scrollTo(0, 0); window.addEventListener("load", function () { window.scrollTo(0, 0); }, { once: true });
  } else git(0, true);
})();
