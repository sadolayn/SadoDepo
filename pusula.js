// ===== Pusula (6 Kasım 2026) =====
// Telefonun yön sensörüyle kadran döner; üstteki sabit işaret bakılan yönü gösterir. Kadranda küçük yeşil nokta kıble yönü
// (yazı yazılmaz; uzun basınca "Kıble" ipucu). Kıble, seçilen ilin merkezinden Kâbe'ye (21,4225 K · 39,8262 D) büyük daire
// açısıyla hesaplanır; internete gerek yok. Sensör manyetik kuzeyi verir, il boylamına göre sapma düzeltilir (Türkiye'de ~6°).
// iPhone'da ve çoğu Android'de sensör izni bir dokunuşla istenir ("Başlat"). Bilgisayarda kadran sabit kalır, yeşil nokta yine gösterilir.
(function () {
  const $ = (id) => document.getElementById(id);
  if (!$("pusula")) return;
  // 81 il merkezi (enlem, boylam); kıble için yeterli hassasiyet (10 km sapma açıyı 0,1° bile değiştirmez)
  const IL = { "Adana": [37.0, 35.3213], "Adıyaman": [37.7648, 38.2786], "Afyonkarahisar": [38.7507, 30.5567], "Ağrı": [39.7191, 43.0503], "Amasya": [40.6499, 35.8353],
    "Ankara": [39.9334, 32.8597], "Antalya": [36.8969, 30.7133], "Artvin": [41.1828, 41.8183], "Aydın": [37.856, 27.8416], "Balıkesir": [39.6484, 27.8826],
    "Bilecik": [40.1451, 29.9798], "Bingöl": [38.8847, 40.4986], "Bitlis": [38.4006, 42.1095], "Bolu": [40.7392, 31.6089], "Burdur": [37.7203, 30.2908],
    "Bursa": [40.1885, 29.061], "Çanakkale": [40.1553, 26.4142], "Çankırı": [40.6013, 33.6134], "Çorum": [40.5506, 34.9556], "Denizli": [37.7765, 29.0864],
    "Diyarbakır": [37.9144, 40.2306], "Edirne": [41.6818, 26.5623], "Elazığ": [38.681, 39.2264], "Erzincan": [39.75, 39.5], "Erzurum": [39.9, 41.27],
    "Eskişehir": [39.7767, 30.5206], "Gaziantep": [37.0662, 37.3833], "Giresun": [40.9128, 38.3895], "Gümüşhane": [40.4386, 39.5086], "Hakkari": [37.5744, 43.7408],
    "Hatay": [36.2025, 36.1603], "Isparta": [37.7648, 30.5566], "Mersin": [36.8121, 34.6415], "İstanbul": [41.0082, 28.9784], "İzmir": [38.4237, 27.1428],
    "Kars": [40.6013, 43.0975], "Kastamonu": [41.3887, 33.7827], "Kayseri": [38.7312, 35.4787], "Kırklareli": [41.7333, 27.2167], "Kırşehir": [39.1425, 34.1709],
    "Kocaeli": [40.7654, 29.9408], "Konya": [37.8714, 32.4846], "Kütahya": [39.4167, 29.9833], "Malatya": [38.3552, 38.3095], "Manisa": [38.6191, 27.4289],
    "Kahramanmaraş": [37.5858, 36.9371], "Mardin": [37.3212, 40.7245], "Muğla": [37.2153, 28.3636], "Muş": [38.7432, 41.5064], "Nevşehir": [38.6244, 34.7239],
    "Niğde": [37.9667, 34.6833], "Ordu": [40.9839, 37.8764], "Rize": [41.0201, 40.5234], "Sakarya": [40.7569, 30.3781], "Samsun": [41.2867, 36.33],
    "Siirt": [37.9333, 41.95], "Sinop": [42.0231, 35.1531], "Sivas": [39.7477, 37.0179], "Tekirdağ": [40.9833, 27.5167], "Tokat": [40.3167, 36.55],
    "Trabzon": [41.0015, 39.7178], "Tunceli": [39.1079, 39.5401], "Şanlıurfa": [37.1591, 38.7969], "Uşak": [38.6823, 29.4082], "Van": [38.4891, 43.4089],
    "Yozgat": [39.8181, 34.8147], "Zonguldak": [41.4564, 31.7987], "Aksaray": [38.3687, 34.037], "Bayburt": [40.2552, 40.2249], "Karaman": [37.1759, 33.2287],
    "Kırıkkale": [39.8468, 33.5153], "Batman": [37.8812, 41.1351], "Şırnak": [37.4187, 42.4918], "Bartın": [41.6344, 32.3375], "Ardahan": [41.1105, 42.7022],
    "Iğdır": [39.9237, 44.045], "Yalova": [40.65, 29.2667], "Karabük": [41.2061, 32.6204], "Kilis": [36.7184, 37.1212], "Osmaniye": [37.0742, 36.247], "Düzce": [40.8438, 31.1565] };
  const KABE = [21.422487, 39.826206], R = Math.PI / 180;
  const kible = (la, lo) => { const d = (KABE[1] - lo) * R, y = Math.sin(d), x = Math.cos(la * R) * Math.tan(KABE[0] * R) - Math.sin(la * R) * Math.cos(d); return (Math.atan2(y, x) / R + 360) % 360; };
  const sapma = (lo) => 5.4 + (lo - 26) * 0.1; // manyetik sapma, doğu pozitif (2026, yaklaşık)
  const YON = ["K", "KKD", "KD", "DKD", "D", "DGD", "GD", "GGD", "G", "GGB", "GB", "BGB", "B", "BKB", "KB", "KKB"];
  const yonAd = (h) => YON[Math.round(h / 22.5) % 16];
  // ---- Yer: son seçilen il, yoksa Bölge Nabzı'nda seçili il; konum düğmesi en yakın ili bulur
  let yer = null; // { ad, la, lo }
  try { const s = localStorage.getItem("pusulaIl"); if (s && IL[s]) yer = { ad: s, la: IL[s][0], lo: IL[s][1] }; } catch (e) {}
  if (!yer) try { const b = JSON.parse(localStorage.getItem("bolgem") || "{}"); if (b.il && IL[b.il]) yer = { ad: b.il, la: IL[b.il][0], lo: IL[b.il][1] }; } catch (e) {}
  $("psSel").innerHTML = '<option value="">İl seç</option>' + Object.keys(IL).sort((a, b) => a.localeCompare(b, "tr")).map((k) => `<option>${k}</option>`).join("");
  // ---- Kadran
  const svg = $("psSvg");
  function kadran() {
    let s = `<circle cx="160" cy="160" r="152" fill="#0b0b0b" stroke="#2a2418" stroke-width="2"/><circle cx="160" cy="160" r="118" fill="none" stroke="#1d1a14" stroke-width="1"/>`;
    for (let a = 0; a < 360; a += 2) {
      const b = a % 30 === 0, m = a % 10 === 0, L = b ? 18 : m ? 11 : 5, w = b ? 2 : 1, c = b ? "#e0a24f" : m ? "#8a7a5e" : "#3a3326";
      s += `<line x1="160" y1="12" x2="160" y2="${12 + L}" stroke="${c}" stroke-width="${w}" transform="rotate(${a} 160 160)"/>`;
      if (b && a % 90) s += `<text x="160" y="46" text-anchor="middle" fill="#8a7a5e" font-size="11" font-family="system-ui,sans-serif" transform="rotate(${a} 160 160)">${a}</text>`;
    }
    [["K", 0, "#f3d38a"], ["D", 90, "#e0a24f"], ["G", 180, "#e0a24f"], ["B", 270, "#e0a24f"]].forEach(([t, a, c]) => {
      s += `<text x="160" y="72" text-anchor="middle" fill="${c}" font-size="${a ? 24 : 28}" font-weight="700" font-style="italic" font-family="Georgia,'Times New Roman',serif" transform="rotate(${a} 160 160)">${t}</text>`;
    });
    // Kuzey oku: ince, altın; güney ucu koyu
    s += `<polygon points="160,86 168,160 152,160" fill="#e0a24f"/><polygon points="160,234 168,160 152,160" fill="#2a2418"/><circle cx="160" cy="160" r="7" fill="#0b0b0b" stroke="#e0a24f" stroke-width="2"/>`;
    s += `<g id="psKible" style="display:none"><title>Kıble</title><circle cx="160" cy="26" r="6" fill="#3fc283" stroke="#0b0b0b" stroke-width="2"/></g>`;
    svg.innerHTML = s;
  }
  kadran();
  let kb = null; // kıble açısı (gerçek kuzeye göre)
  let heading = null, hGoster = 0, calisiyor = false;
  let yerYaz = function () {
    if (!yer) { $("psIl").textContent = "Yer"; $("psSel").value = ""; $("psKible").style.display = "none"; kb = null; return; }
    kb = kible(yer.la, yer.lo);
    $("psIl").textContent = /konum/.test(yer.ad) ? "📍 Konum" : "Yer"; $("psSel").value = yer.ad.replace(" (konum)", "");
    const g = $("psKible"); g.style.display = ""; g.setAttribute("transform", `rotate(${kb.toFixed(1)} 160 160)`);
    if (!calisiyor) $("psNot").innerHTML = `Kadran kuzeyi gösteriyor. <span style="color:#3fc283">●</span> ${Math.round(kb)}°`;
  };
  // ---- Sensör
  function uygula(h) {
    heading = h;
    // En kısa yoldan yumuşat (359° → 1° geçişinde ters dönmesin)
    const d = ((h - hGoster + 540) % 360) - 180; hGoster = (hGoster + d * 0.25 + 360) % 360;
    svg.style.transform = `rotate(${(-hGoster).toFixed(1)}deg)`;
    $("psDeg").textContent = Math.round(hGoster) + "°"; $("psDir").textContent = yonAd(hGoster);
    if (kb != null) { const fark = Math.abs(((kb - hGoster + 540) % 360) - 180); $("psDial").classList.toggle("kb", fark < 4); }
  }
  function olay(e) {
    let h = null;
    if (typeof e.webkitCompassHeading === "number") h = e.webkitCompassHeading; // iPhone: manyetik kuzeyden saat yönünde
    else if (e.alpha != null && (e.absolute || e.type === "deviceorientationabsolute")) h = (360 - e.alpha) % 360;
    if (h == null) return;
    const ekran = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    h = (h + ekran + (yer ? sapma(yer.lo) : 6) + 360) % 360; // ekran yönü + manyetik sapma → gerçek kuzey
    uygula(h);
  }
  function basla() {
    const dinle = () => {
      calisiyor = true; $("psBtn").textContent = "Çalışıyor"; $("psBtn").disabled = true; $("psDir").textContent = "sensör bekleniyor…";
      if ("ondeviceorientationabsolute" in window) window.addEventListener("deviceorientationabsolute", olay);
      window.addEventListener("deviceorientation", olay);
      $("psNot").innerHTML = (yer ? `<span style="color:#3fc283">●</span> ${Math.round(kb)}° · ` : "") + "Sapma varsa telefonu havada 8 çizer gibi döndür.";
      setTimeout(() => { if (heading == null) { $("psDir").textContent = "sensör yok"; $("psNot").textContent = "Bu cihazda yön sensörü bulunamadı; pusula telefonda çalışır. " + (yer ? `Kadran kuzeyi gösteriyor, yeşil nokta ${Math.round(kb)}°.` : ""); $("psBtn").disabled = false; $("psBtn").textContent = "Tekrar dene"; calisiyor = false; } }, 3000);
    };
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then((r) => { if (r === "granted") dinle(); else $("psNot").textContent = "Yön izni verilmedi. Safari › Ayarlar'dan hareket ve yön erişimine izin verip tekrar dene."; }).catch(() => { $("psNot").textContent = "Yön izni alınamadı."; });
    } else dinle();
    window.Rapor && Rapor.bolum("pusula");
  }
  $("psBtn").onclick = basla;
  $("psSel").onchange = () => { const k = $("psSel").value; yer = k && IL[k] ? { ad: k, la: IL[k][0], lo: IL[k][1] } : null; try { if (yer) localStorage.setItem("pusulaIl", k); else localStorage.removeItem("pusulaIl"); } catch (e) {} yerYaz(); };
  $("psGps").onclick = () => {
    if (!navigator.geolocation) return;
    $("psGps").textContent = "…";
    navigator.geolocation.getCurrentPosition((p) => {
      const la = p.coords.latitude, lo = p.coords.longitude; let en = null, enD = 1e9;
      for (const k in IL) { const d = Math.hypot(IL[k][0] - la, (IL[k][1] - lo) * Math.cos(la * R)); if (d < enD) { enD = d; en = k; } }
      yer = { ad: en + " (konum)", la, lo }; yerYaz(); $("psGps").textContent = "📍";
      try { localStorage.setItem("pusulaIl", en); } catch (e) {}
    }, () => { $("psGps").textContent = "📍"; $("psNot").textContent = "Konum alınamadı; ili listeden seç."; }, { timeout: 10000, maximumAge: 600000 });
  };
  // ---- Bilgisayar: yön sensörü yok; "sensör yok" demek yerine kıbleyi yazıyla göster, telefona geçirmeyi öner (7 Kasım 2026)
  const masaustu = matchMedia("(hover: hover) and (pointer: fine)").matches && !("ontouchstart" in window) && !navigator.maxTouchPoints;
  if (masaustu) {
    const ipucu = $("pusula").querySelector(".psTop .hint"); if (ipucu) ipucu.textContent = "Bilgisayarda yön sensörü olmadığı için kadran kuzeyi gösterir; döndürmek için telefonda aç.";
    $("psBtn").textContent = "📱 Telefonda aç";
    $("psBtn").onclick = () => { const t = document.getElementById("telAc"); if (t) t.click(); else { try { navigator.clipboard.writeText(location.href.split("#")[0] + "#pusula"); $("psBtn").textContent = "✅ Bağlantı kopyalandı"; } catch (e) {} } };
    const masaYaz = () => {
      if (kb == null) { $("psDeg").textContent = "–"; $("psDir").textContent = "ilini seç"; return; }
      $("psDeg").textContent = Math.round(kb) + "°"; $("psDir").textContent = "kıble · " + yonAd(kb);
      $("psNot").innerHTML = `<span style="color:#3fc283">●</span> ${yer.ad.replace(" (konum)", "")} için kıble kuzeyden saat yönünde <b>${Math.round(kb)}°</b> (${yonAd(kb)}). Kadran kuzeyi gösteriyor.`;
    };
    const eskiYer = yerYaz; yerYaz = function () { eskiYer(); masaYaz(); };
  }
  yerYaz();
  if (!yer) $("psNot").textContent = "İlini seç; kadranda yeşil nokta belirir.";
})();
