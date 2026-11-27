/* anasayfa.js — ana sayfanın (index.html) betikleri tek dosyada (22 Kasım 2026).
   Önceden sayfanın içinde 15 ayrı satır içi <script> vardı; aynı sırayla buraya taşındı. Her parça kendi try/catch'i içinde:
   biri hata verse öbürleri çalışmaya devam eder (eskiden de ayrı betikler böyleydi). Yalnızca Öneri formunun ayarı (ONERI)
   genel değişken olarak kalır. Bu dosya </body>'den önce, degisen.js'den sonra yüklenir; sayfa içeriği hazırdır. */

// ---- 10 Kasım: logonun yerinde gün boyu Atatürk fotoğrafı  if (documen (eski satır 870) ----
try {
/* 10 Kasım: logonun yerinde gün boyu Atatürk fotoğrafı */ if (document.documentElement.classList.contains("matem10")) { var aI = document.querySelector("h1.logo img"); aI.src = "img/ata-10kasim.jpg"; aI.alt = "Mustafa Kemal Atatürk"; }
} catch (e) { console.error("anasayfa: 10 Kasım: logonun yerinde gün boyu Atatürk fotoğrafı  if (documen", e); }

// ---- (function () { (eski satır 1145) ----
try {
  (function () {
    const h = new Date().getHours();
    let t;
    // Günün saatine göre kendi çizdiğimiz altın simge (telefonun emojisi yerine)
    const G = '<defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd98a"/><stop offset="1" stop-color="#d08a2e"/></linearGradient></defs>';
    const RAY = (r1, r2) => Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); return `<line x1="${12 + c * r1}" y1="${12 + s * r1}" x2="${12 + c * r2}" y2="${12 + s * r2}"/>`; }).join("");
    const IK = {
      sabah: `${G}<g class="gr" stroke="#e8b05d" stroke-width="1.6" stroke-linecap="round">${RAY(7.2, 10)}</g><circle cx="12" cy="12" r="4.8" fill="url(#gA)"/>`,
      oglen: `${G}<g class="gr" stroke="#e8b05d" stroke-width="1.5" stroke-linecap="round" transform="translate(-3 -3) scale(.85)">${RAY(7.2, 10)}</g><circle cx="7.2" cy="7.2" r="4" fill="url(#gA)"/><path d="M8 19.5h10.2a3.4 3.4 0 0 0 .2-6.8 4.6 4.6 0 0 0-8.8 1.3A2.8 2.8 0 0 0 8 19.5z" fill="#1a1410" stroke="#e0a24f" stroke-width="1.3" stroke-linejoin="round"/>`,
      aksam: `${G}<clipPath id="gH"><rect x="0" y="0" width="24" height="15.5"/></clipPath><g clip-path="url(#gH)"><g class="gr" stroke="#e8b05d" stroke-width="1.5" stroke-linecap="round" transform="translate(0 3.5)">${RAY(7.6, 10.2)}</g><circle cx="12" cy="15.5" r="5.6" fill="url(#gA)"/></g><g stroke="#e0a24f" stroke-linecap="round"><line x1="2.5" y1="17.5" x2="21.5" y2="17.5" stroke-width="1.6"/><line x1="6" y1="20.5" x2="18" y2="20.5" stroke-width="1.2" opacity=".6"/></g>`,
      gece: `${G}<path d="M15.5 3.6a8.6 8.6 0 1 0 4.9 14.6 7 7 0 0 1-4.9-14.6z" fill="url(#gA)"/><g fill="#ffe2a8"><path class="gs" d="M19 4.2l.55 1.25 1.25.55-1.25.55L19 7.8l-.55-1.25-1.25-.55 1.25-.55z"/><path class="gs g2" d="M21.2 10l.4.9.9.4-.9.4-.4.9-.4-.9-.9-.4.9-.4z"/></g>`,
    };
    let ik;
    // Selamlama (8 Kasım 2026): sabah imza "Sağlıklı günler", gün içinde doğal ifadeler; hafta sonu ve özel günlerde değişir.
    // Simge yine saate göre seçilir. Alt satırda "Hoş geldiniz · Keyifli gezinmeler · İyi çalışmalar" döner.
    if (h >= 5 && h < 11) { t = "Sağlıklı günler"; ik = "sabah"; }
    else if (h >= 11 && h < 17) { t = "Keyifli günler"; ik = "oglen"; }
    else if (h >= 17 && h < 22) { t = "İyi akşamlar"; ik = "aksam"; }
    else { t = "Güzel geceler"; ik = "gece"; }
    // Özel günler (8 Kasım 2026; Google'ın günlük çizimleri gibi). Öncelik: dinî ve millî bayramlar, arifeler, kandiller, anma günleri.
    // ana: büyük selamın yerine geçer (kısa). alt: alttaki dönen satırda ilk sıralarda (aynı güne birden çok gün denk gelebilir).
    // anma: o gün "Keyifli gezinmeler" gösterilmez. Dinî tarihler Diyanet takvimine dayanır; bilim günleri ve doğum tarihleri
    // kaynaklarla doğrulandı (UNESCO Matematik Günü 14 Mart, Dünya Tasarruf Günü 31 Ekim, Aziz Sancar 8 Eylül 1946, Cahit Arf 11 Ekim 1910).
    const OZEL = (function () {
      const n = new Date(), ay = n.getMonth() + 1, gn = n.getDate(), md = String(ay).padStart(2, "0") + "-" + String(gn).padStart(2, "0"), ymd = n.getFullYear() + "-" + md;
      const pazar = (kacinci) => n.getDay() === 0 && gn === (7 - new Date(n.getFullYear(), ay - 1, 1).getDay()) % 7 + 1 + (kacinci - 1) * 7; // ayın kaçıncı pazarı
      const o = { alt: [] }, ekle = (alt, ana, anma) => { o.alt.push(alt); if (ana && !o.ana) o.ana = ana; if (anma) o.anma = true; };
      const DINI = { // ilk gün: [gün sayısı, ad]
        "2026-03-20": [3, "Ramazan Bayramı"], "2026-05-27": [4, "Kurban Bayramı"], "2027-03-09": [3, "Ramazan Bayramı"], "2027-05-16": [4, "Kurban Bayramı"],
        "2028-02-26": [3, "Ramazan Bayramı"], "2028-05-05": [4, "Kurban Bayramı"], "2029-02-14": [3, "Ramazan Bayramı"], "2029-04-24": [4, "Kurban Bayramı"] };
      for (const bas in DINI) {
        const [sure, ad] = DINI[bas], fark = Math.round((new Date(n.getFullYear(), ay - 1, gn) - new Date(bas + "T00:00:00")) / 864e5);
        if (fark >= 0 && fark < sure) { ekle(`🌙 ${ad}`, "Mutlu bayramlar"); o.tatil = true; } // dinî bayramda sade, klasik selam
        if (fark === -1) ekle(`🌙 Yarın ${ad}`, "Hayırlı arifeler");
      }
      const KANDIL = { "2026-01-15": "Miraç Kandili", "2026-02-02": "Berat Kandili", "2026-08-24": "Mevlid Kandili", "2026-12-10": "Regaip Kandili",
        "2027-01-04": "Miraç Kandili", "2027-01-22": "Berat Kandili", "2027-08-13": "Mevlid Kandili", "2027-12-02": "Regaip Kandili", "2027-12-24": "Miraç Kandili",
        "2028-01-11": "Berat Kandili", "2028-08-02": "Mevlid Kandili", "2028-11-23": "Regaip Kandili", "2028-12-13": "Miraç Kandili", "2028-12-30": "Berat Kandili" }; // Diyanet listesi
      if (KANDIL[ymd]) ekle(`✨ Bu gece ${KANDIL[ymd]}`, "Hayırlı kandiller");
      if ({ "2026-03-16": 1, "2027-03-05": 1, "2028-02-22": 1 }[ymd]) ekle("✨ Bu gece Kadir Gecesi", "Hayırlı geceler");
      if ({ "2026-06-25": 1, "2027-06-15": 1, "2028-06-03": 1 }[ymd]) ekle("🥣 Bugün Aşure Günü");
      const MILLI = { "04-23": "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı", "05-19": "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı", "08-30": "30 Ağustos Zafer Bayramı", "10-29": "29 Ekim Cumhuriyet Bayramı" };
      if (MILLI[md]) ekle(`🇹🇷 ${MILLI[md]}mız kutlu olsun`, "İyi bayramlar");
      // Sabit günler: [ay-gün, mesaj, ana selam, anma]
      [["11-10", "🇹🇷 Ulu Önder Atatürk'ü saygı ve özlemle anıyoruz", "Saygı ve özlemle", 1],
       ["03-18", "🇹🇷 18 Mart Çanakkale Zaferi; şehitlerimizi rahmetle anıyoruz", "Rahmetle anıyoruz", 1],
       ["07-15", "🇹🇷 15 Temmuz Demokrasi ve Millî Birlik Günü", "", 1],
       ["03-12", "🇹🇷 12 Mart: İstiklal Marşı'nın kabulü ve Mehmet Akif Ersoy'u anma günü"],
       ["01-01", "🎉 Yeni yılımız kutlu olsun", "Mutlu yıllar"], ["12-31", "🎄 Yeni yıl yaklaşıyor", "İyi yıllar"],
       ["05-01", "🛠️ 1 Mayıs Emek ve Dayanışma Günü"],
       ["11-24", "🍎 24 Kasım Öğretmenler Günü kutlu olsun"], ["03-08", "🌷 8 Mart Dünya Kadınlar Günü kutlu olsun"],
       ["03-14", "🩺 14 Mart Tıp Bayramı kutlu olsun"], ["02-14", "❤️ Bugün Sevgililer Günü"],
       ["08-26", "🏛️ 26 Ağustos 1924: Türkiye İş Bankası kuruldu"], ["10-31", "🐷 31 Ekim Dünya Tasarruf Günü"],
       ["04-22", "🌍 22 Nisan Dünya Günü"], ["06-05", "🌱 5 Haziran Dünya Çevre Günü"],
       // Bilim, matematik, fizik, uzay
       ["03-14", "π 14 Mart Dünya Matematik Günü (Pi Günü: π ≈ 3,14159…) · Einstein'ın doğum günü"],
       ["07-22", "π 22 Temmuz: Pi'ye yakınlık günü (22/7 ≈ 3,142)"],
       ["02-11", "🔬 11 Şubat Bilimde Kadınlar ve Kız Çocukları Günü"],
       ["01-04", "🍎 Isaac Newton'un doğum günü (1643): yerçekimi ve hareket yasaları"],
       ["02-15", "🔭 Galileo Galilei'nin doğum günü (1564): gökyüzüne teleskopla bakan öncü"],
       ["11-07", "⚛️ Marie Curie'nin doğum günü (1867): iki ayrı bilim dalında Nobel alan tek kişi"],
       ["04-12", "🚀 12 Nisan 1961: Yuri Gagarin uzaya çıkan ilk insan oldu"],
       ["07-20", "🌕 20 Temmuz 1969: Apollo 11 Ay'a indi"],
       ["10-04", "🛰️ 4 Ekim 1957: İlk yapay uydu Sputnik 1 fırlatıldı"],
       ["10-11", "🧮 Matematikçi Cahit Arf'ın doğum günü (1910): Arf değişmezi"],
       ["09-08", "🧬 Nobel ödüllü bilim insanımız Aziz Sancar'ın doğum günü (1946)"],
      ].forEach(([g, alt, ana, anma]) => { if (g === md) ekle(alt, ana, anma); });
      if (MILLI[md] || ["01-01", "05-01", "07-15"].includes(md)) o.tatil = true; // resmî tatil: "İyi çalışmalar" denmez
      if (ay === 5 && pazar(2)) ekle("💐 Anneler Günü kutlu olsun");
      if (ay === 6 && pazar(3)) ekle("👔 Babalar Günü kutlu olsun");
      return o;
    })();
    if (OZEL.ana) t = OZEL.ana;
    else if (OZEL.anma && t === "Keyifli günler") t = "Sağlıklı günler"; // anma günlerinde "keyifli" denmez
    else if ((new Date().getDay() === 0 || new Date().getDay() === 6) && h >= 9 && h < 17) t = "İyi hafta sonları";
    const svg = (id) => `<svg class="gik ${ik}" viewBox="0 0 24 24" aria-hidden="true">${IK[ik].replace(/"gA"|#gA|"gH"|#gH/g, (m) => m.replace(/g([AH])/, id + "$1"))}</svg>`;
    const simge = OZEL.anma ? () => "" : svg; // anma günlerinde güneş/ay simgesi gösterilmez
    document.getElementById("greet").innerHTML = t + simge("a"); // boşluk yok: simgenin payı CSS ile iki yana eşit verilir
    document.getElementById("greet2").innerHTML = t + " " + simge("b");
    // 10 Kasım matemi: selamlama yerine "1881 – ∞"; dokununca İş Bankası'nın YouTube'daki 10 Kasım videosu açılır.
    // Video haberler.json'daki İş Bankası YouTube akışından bulunur (saatlik güncellenir); henüz yoksa kanalın videolar sayfası açılır.
    if (document.documentElement.classList.contains("matem")) {
      const KANAL = "https://www.youtube.com/channel/UC8taW8Ljy9xA_tiWy-1OPww/videos";
      document.getElementById("greet").innerHTML = `<a class="sonsuz" id="sonsuz" href="${KANAL}" target="_blank" rel="noopener" aria-label="1881 – sonsuzluk. İş Bankası'nın 10 Kasım videosunu izle">1881 – ∞</a>`;
      document.getElementById("greet2").textContent = "1881 – ∞";
      document.getElementById("welcome").style.display = "none";
      document.getElementById("sonsuz").addEventListener("click", () => { window.Rapor && Rapor.bolum("matem-video"); });
      Ortak.json("data/haberler.json").then((j) => {
        const esik = new Date(Date.now() - 3 * 864e5).toISOString(), bul = [];
        (function gez(o) { if (Array.isArray(o)) o.forEach(gez); else if (o && typeof o === "object") { if (o.u && /youtube\.com/.test(o.u) && /İş Bankası YouTube/.test(o.s || "")) bul.push(o); else Object.values(o).forEach(gez); } })(j);
        const v = bul.filter((x) => (x.d || "") >= esik && /10\s*Kas[ıi]m|Atatürk|anıyoruz|minnet|özlem/i.test(x.t || "") && !/müze/i.test(x.t || "")).sort((a, b) => (b.u.includes("watch") - a.u.includes("watch")) || (b.d > a.d ? 1 : -1))[0];
        if (v) document.getElementById("sonsuz").href = v.u;
      }).catch(() => {});
    }
    // Alt satır: birkaç saniyede bir yumuşakça değişir
    (function () {
      const el = document.getElementById("welcome"), n = new Date(), wd = n.getDay() > 0 && n.getDay() < 6 && n.getHours() >= 8 && n.getHours() < 18;
      const ONR = "Öneri ve isteklerinizi en alttan iletebilirsiniz ✉️";
      const anma = !!OZEL.anma; // 10 Kasım: "keyifli" ifadeler gösterilmez
      const L = [...OZEL.alt, "Hoş geldiniz", ...(anma ? [] : ["Keyifli gezinmeler"]), ...(wd && !OZEL.tatil ? ["İyi çalışmalar"] : []), ONR]; // resmî tatilde "İyi çalışmalar" yok
      if (OZEL.alt.length) el.textContent = OZEL.alt[0]; // özel gün mesajı açılışta görünür
      el.addEventListener("click", () => { if (el.textContent === ONR) document.getElementById("oneriBtn").click(); else if (el.textContent === ODUL) location.href = "isbank.html#odul"; else if (/kampanya/i.test(el.textContent)) location.href = "isbank.html#maximum"; });
      // Kampanya hatırlatıcısı: her ayın ilk 5 günü
      // (Ayın ilk haftası kampanya satırı 2 Kasım 2026'da kaldırıldı; kampanya hatırlatması kayan yazıda.) İşCep ödülü 9 Kasım'a kadar, dokununca haberlere
      const ODUL = "🏆 İşCep art arda 4. kez “Dünyanın En İyi Bireysel Mobil Bankacılık Uygulaması” seçildi ›";
      // Kupa sahnesi (8 Kasım): her turda tekrar açılıp bıktırıyordu. Artık her cihazda günde yalnızca bir kez, o günün ilk
      // girişinde gösterilir; gösterildikten sonra dönen satırdan çıkar. Son gün 9 Kasım.
      const bugun = n.getFullYear() + "-" + (n.getMonth() + 1) + "-" + n.getDate();
      let odulGor = ""; try { odulGor = localStorage.getItem("odulGor") || ""; } catch (e) {}
      const odulVar = new Date() < new Date("2026-11-10T00:00:00") && odulGor !== bugun && !document.documentElement.classList.contains("matem"); // matemde kutlama kartı gösterilmez
      if (odulVar) L.splice(1, 0, ODUL);
      if (odulVar) document.getElementById("top").classList.remove("kompakt"); // kupa sahnesi eski (büyük logolu) düzende kurulu; son gün 9 Kasım
      // "Animasyonları azalt" açıksa (bilgisayarda sık) sahne yine gelir; yalnızca hareketler kapalı olur (CSS'te reduce kuralları var)
      let k = 0;
      // Ödül sırası gelince: logo ve selamlama kaybolur, büyük altın kupa sahnesi açılır (7 sn)
      const top = document.getElementById("top"), odS = document.getElementById("odS");
      const KR = ["#ff4d6d", "#ffd23f", "#3ec1ff", "#5be37a", "#b56bff", "#ff8c2e", "#f3d38a", "#ff5fd2"];
      // Kartın yeri ve yüksekliği logo + selamlama alanına göre ölçülür. Sahne açılışta (1. sn) başladığı için logo ya da yazı tipi
      // henüz yüklenmemişse ölçü kısa kalıp alt yazı kesiliyordu (8 Kasım): yüklendikçe ve boyut değiştikçe yeniden ölçülür.
      // Yazı alana sığmıyorsa (bazı ekranlarda selamlama kısa kalıyor) kart yazı kadar uzar; selamlamanın alt boşluğu da aynı kadar
      // artar ki alttaki kayan yazı şeridi kartın altında kalsın. Video açıkken kart ayrıca 52 px uzundur.
      const olc = () => {
        const lg = top.querySelector("h1.logo"), hl = top.querySelector(".hello"), yz = odS && odS.querySelector(".yazi");
        if (!lg || !hl || !odS) return;
        if (!hl.style.marginBottom) hl.dataset.mb0 = parseFloat(getComputedStyle(hl).marginBottom) || 0;
        const h0 = hl.offsetTop + hl.offsetHeight - lg.offsetTop + (top.classList.contains("vidOn") ? 52 : 0);
        odS.style.top = lg.offsetTop + "px"; odS.style.height = h0 + "px";
        const ihtiyac = yz ? yz.offsetTop + yz.offsetHeight + 8 : 0, fazla = Math.max(0, ihtiyac - h0);
        const ek = (top.classList.contains("vidOn") ? 52 : 0) + fazla;
        if (fazla) odS.style.height = (h0 + fazla) + "px";
        hl.style.marginBottom = ek ? (+hl.dataset.mb0 + ek) + "px" : "";
        // Dar ekranda (≈ 400 px altı ya da büyük yazı tipi) saat ve takvim kutusu kupa yazısının üstüne biniyor:
        // çakışma varsa sahne süresince ikisi yumuşakça gizlenir, sahne bitince geri gelir.
        const kes = (a, b) => a.width && b.width && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const yr = yz ? [...yz.children].map((e) => e.getBoundingClientRect()) : [];
        const engel = [top.querySelector(".clock"), top.querySelector(".datec"), top.querySelector(".tarihK .temaD")].filter(Boolean).map((e) => e.getBoundingClientRect());
        top.classList.toggle("odDar", yr.some((y) => engel.some((e) => kes(y, e))));
      };
      const yenidenOlc = () => { if (top.classList.contains("odulOn")) olc(); };
      window.addEventListener("load", yenidenOlc); window.addEventListener("resize", yenidenOlc);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(yenidenOlc);
      if (window.ResizeObserver) { const ro = new ResizeObserver(yenidenOlc); ["h1.logo", ".hello"].forEach((q) => { const e = top.querySelector(q); if (e) ro.observe(e); }); }
      const sahne = (ac) => {
        if (!odS) return;
        if (ac) {
          olc();
          odS.querySelectorAll(".kf").forEach((x) => x.remove());
          for (let i = 0; i < 40; i++) { const c = document.createElement("i"); c.className = "kf"; c.style.left = Math.random() * 100 + "%"; c.style.background = KR[i % KR.length]; c.style.animationDelay = (Math.random() * 1.2).toFixed(2) + "s"; c.style.animationDuration = (2 + Math.random() * 1.6).toFixed(2) + "s"; odS.appendChild(c); }
        }
        top.classList.toggle("odulOn", ac);
        odS.tabIndex = ac ? 0 : -1;
        // Video (kullanıcının kendi üretimi): bir kez oynar, bitince son karede kalır; yavaş bağlantı ya da "animasyonları azalt" açıksa çizilen kupa kalır
        const v = document.getElementById("kvid"), c = navigator.connection;
        const vidOk = v && v.canPlayType("video/mp4") && !matchMedia("(prefers-reduced-motion: reduce)").matches && !(c && (c.saveData || /2g/.test(c.effectiveType || "")));
        if (!vidOk) return;
        if (ac) {
          top.classList.add("vidOn"); v.currentTime = 0;
          olc();
          const pr = v.play(); if (pr && pr.catch) pr.catch(() => { top.classList.remove("vidOn"); top.querySelector(".hello").style.marginBottom = ""; });
        } else { v.pause(); top.classList.remove("vidOn"); top.querySelector(".hello").style.marginBottom = ""; }
      };
      const don = () => {
        el.classList.add("fade");
        setTimeout(() => {
          k = (k + 1) % L.length; const m = L[k], od = m === ODUL;
          if (od) { L.splice(k, 1); k--; try { localStorage.setItem("odulGor", bugun); } catch (e) {} } // bir kez gösterildi
          el.textContent = od ? "" : m;
          sahne(od);
          el.style.cursor = m === ONR || /kampanya/i.test(m) ? "pointer" : ""; el.style.color = /kampanya/i.test(m) ? "#e0a24f" : "";
          el.classList.remove("fade");
          setTimeout(don, od ? 12000 : 4500);
        }, 600);
      };
      // Ödül varken merasim sayfa açılır açılmaz başlar (1 sn sonra), kimse kaçırmasın
      setTimeout(don, odulVar ? 1000 : 4500);
    })();
    // Saat ve tarih
    const AY = ["OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN", "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK"];
    const GUN = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    const rot = (id, deg) => ["", "2"].forEach((k) => document.getElementById(id + k).setAttribute("transform", `rotate(${deg} 50 50)`));
    const put = (id, v) => ["", "2"].forEach((k) => (document.getElementById(id + k).textContent = v));
    const KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    let lastDay = -1;
    const tick = () => {
      const n = new Date();
      // 10 Kasım: 09.05'te iki saat de durur, gece yarısına kadar 09:05'te kalır
      const dur = n.getMonth() === 10 && n.getDate() === 10 && n.getHours() * 60 + n.getMinutes() >= 9 * 60 + 5;
      const h = dur ? 9 : n.getHours(), m = dur ? 5 : n.getMinutes(), sec = dur ? 0 : n.getSeconds();
      rot("hh", (h % 12) * 30 + m * 0.5);
      rot("mh", m * 6 + sec * 0.1);
      rot("sh", sec * 6);
      const hm = String(h).padStart(2, "0") + String(m).padStart(2, "0");
      ["dig", "dig2"].forEach((id) => {
        const el = document.getElementById(id);
        if (el.dataset.t !== hm) { el.dataset.t = hm; el.innerHTML = `<span class="nx">${hm[0]}</span><span class="nx">${hm[1]}</span><span class="nc"><i></i><i></i></span><span class="nx">${hm[2]}</span><span class="nx">${hm[3]}</span>`; el.setAttribute("aria-label", hm.slice(0, 2) + ":" + hm.slice(2)); }
        el.classList.toggle("off", !dur && sec % 2 === 1);
      });
      if (n.getDate() !== lastDay) {
        lastDay = n.getDate();
        document.documentElement.classList.add("saatHazir"); // saat/tarih dolunca görünür (açılışta "--:--" ve boş kutu görünmesin)
        put("dm", AY[n.getMonth()]);
        put("dd", n.getDate());
        document.getElementById("dw").textContent = GUN[n.getDay()];
        document.getElementById("dw2").textContent = KISA[n.getDay()];
        document.getElementById("datec").setAttribute("aria-label", n.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" }));
      }
    };
    tick(); setInterval(tick, 1000);
    // Takvim kutusuna dokununca Takvim sayfası açılır
    document.querySelectorAll(".datec").forEach((el) => { el.setAttribute("role", "link"); el.title = "Takvim"; el.addEventListener("click", () => (location.href = "takvim.html")); });
    const top = document.getElementById("top"), bar = document.getElementById("bar");
    // Büyük logo ekrandan tamamen çıkınca üstte ince şerit belirir; menü hiç örtülmez
    const first = document.querySelector("a.isb");
    // Şerit, ilk kart (İş Bankası) ekrandan tamamen çıktıktan sonra görünür
    const onScroll = () => bar.classList.toggle("show", first.getBoundingClientRect().bottom < bar.offsetHeight);
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  })();
} catch (e) { console.error("anasayfa: (function () {", e); }

// ---- Öneri formu → Google Form. Formu oluşturunca bu üç değeri doldur (b (eski satır 1477) ----
  // Öneri formu → Google Form. Formu oluşturunca bu üç değeri doldur (bkz. açıklama).
  const ONERI = {
    action: "https://docs.google.com/forms/d/e/1FAIpQLSfeuDkVXo1nk6IZ_9f7uEjXkCUF3M--PUv7cYcBwXPWe6F6gA/formResponse",
    mesaj: "entry.1123079006",   // Öneri
    kimden: "entry.1229018588",  // İsim / iletişim
  };
  (function () {
    const $ = (id) => document.getElementById(id), ov = $("oneriOv");
    const ac = () => { ov.hidden = false; $("oneriDurum").textContent = ""; setTimeout(() => $("oneriMsg").focus(), 50); };
    const kapa = () => (ov.hidden = true);
    $("oneriBtn").onclick = ac; $("oneriKapat").onclick = kapa;
    ov.addEventListener("click", (e) => { if (e.target === ov) kapa(); });
    $("oneriForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = $("oneriMsg").value.trim(), d = $("oneriDurum");
      if (!msg) return;
      if (!ONERI.action || !ONERI.mesaj) { d.style.color = "#ef8a5d"; d.textContent = "Form henüz bağlanmadı; çok yakında 🙂"; return; }
      const f = new FormData(); f.append(ONERI.mesaj, msg); if (ONERI.kimden) f.append(ONERI.kimden, $("oneriKim").value.trim());
      $("oneriGonder").disabled = true; d.style.color = "#9a9a9a"; d.textContent = "Gönderiliyor…";
      fetch(ONERI.action, { method: "POST", mode: "no-cors", body: f }).then(() => {
        d.style.color = "#3fc283"; d.textContent = "Teşekkürler, önerin ulaştı 🙏"; $("oneriMsg").value = ""; $("oneriKim").value = "";
        setTimeout(kapa, 1800);
      }, () => { d.style.color = "#ef8a5d"; d.textContent = "Gönderilemedi, internet bağlantını kontrol edip tekrar dene."; })
        .finally(() => ($("oneriGonder").disabled = false));
    });
  })();

// ---- (function () { (eski satır 1505) ----
try {
(function () {
  const $ = (id) => document.getElementById(id);
  const URL_ = "https://sadolayn.github.io/SadoDepo/";
  const METIN = "Şuna bir bak:\nGüncel İş Bankası kampanyaları ve gündemi, bankacılık hesaplamaları, döviz ve emtia, bölge nabzı, ajanda ve keyifli oyunlar tek yerde.\nSadolayn Alerts ile seçtiğin konunun haberleri her sabah 10:00'da telefonunda.\nA❤️KLA D💙V🤍M";
  $("oner").onclick = async () => {
    window.Rapor && Rapor.bolum("arkadasina-oner");
    if (navigator.share) { try { await navigator.share({ title: "SADOLAYN", text: METIN, url: URL_ }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    const y = $("kurYardim"); y.hidden = false;
    y.innerHTML = `<b>Paylaş:</b><br><a href="https://wa.me/?text=${encodeURIComponent(METIN + " " + URL_)}" target="_blank" rel="noopener" style="color:#3fc283">WhatsApp ile gönder</a> · <a href="#" id="kopya" style="color:#e0a24f">Bağlantıyı kopyala</a>`;
    $("kopya").onclick = (e) => { e.preventDefault(); navigator.clipboard && navigator.clipboard.writeText(URL_).then(() => ($("kopya").textContent = "Kopyalandı ✓")); };
  };
  const kurulu = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (kurulu) $("kur").hidden = true;
  const pc = window.__masaustu, mac = /Macintosh|Mac OS X/.test(navigator.userAgent);
  if (pc) {
    $("kur").querySelector(".pyIc2").textContent = "💻";
    $("kur").querySelector(".pyTx").innerHTML = "<b>Bilgisayarına ekle</b><small>Kendi penceresinde aç, tek tıkla ulaş</small>";
  }
  $("kur").onclick = async () => {
    window.Rapor && Rapor.bolum("ana-ekrana-ekle");
    const p = window.__kurPrompt;
    if (p) { p.prompt(); try { const r = await p.userChoice; if (r.outcome === "accepted") $("kur").hidden = true; } catch (e) {} window.__kurPrompt = null; return; }
    const t = window.__tarayici, y = $("kurYardim"); y.hidden = false;
    if (pc) {
      const kisa = mac ? "⌘ + D" : "Ctrl + D";
      const P = pc === "edge" ? [
          "Sağ üstteki <b>⋯</b> menüsüne tıkla",
          "<b>Uygulamalar</b> → <b>Bu siteyi uygulama olarak yükle</b>'yi seç",
          "<b>Yükle</b>'ye tıkla. Görev çubuğuna sabitleyebilirsin 🎉"]
        : pc === "chrome" ? [
          "Adres çubuğunun sağındaki <b>⊕ yükle</b> simgesine ya da <b>⋮</b> menüsüne tıkla",
          "<b>Yayınla, kaydet ve paylaş</b> → <b>Sayfayı uygulama olarak yükle</b>'yi seç",
          `<b>Yükle</b>'ye tıkla. ${mac ? "Dock'ta" : "Görev çubuğunda"} durur 🎉`]
        : pc === "safari" ? [
          "Üstteki menü çubuğunda <b>Dosya</b>'ya tıkla",
          "<b>Dock'a Ekle</b>'yi seç",
          "<b>Ekle</b>'ye tıkla. Sadolayn Dock'ta durur 🎉"]
        : [
          `<b>${kisa}</b> tuşlarına bas`,
          "Yer imi çubuğunu seç",
          "<b>Kaydet</b>'e tıkla. Bir tıkla açarsın 🎉"];
      y.innerHTML = `<div class="kyB"><b>💻 Sadolayn'ı bilgisayarına ekle</b><button class="kyX" aria-label="Kapat">✕</button></div>
        <div class="kyN">Bilgisayarına program kurulmaz; Sadolayn kendi penceresinde açılır, ${mac ? "Dock'tan" : "görev çubuğundan"} tek tıkla ulaşırsın.</div>
        <ol class="kyS">${P.map((x) => `<li>${x}</li>`).join("")}</ol>
        ${pc !== "firefox" && pc !== "diger" ? `<div class="kyN" style="margin-top:6px">Daha kısası: <b>${kisa}</b> ile yer imlerine ekleyebilirsin.</div>` : ""}`;
      y.querySelector(".kyX").onclick = () => (y.hidden = true);
      return;
    }
    const S = t === "ios" ? [
        "Ekranın altındaki <b>Paylaş</b> simgesine dokun <span class='ik'>⬆️</span><br><small>Görmüyorsan önce <b>•••</b> düğmesine dokun.</small>",
        "Açılan listede aşağı kaydır, <b>Ana Ekrana Ekle</b>'yi seç <span class='ik'>➕</span>",
        "Sağ üstteki <b>Ekle</b>'ye dokun. Hepsi bu! 🎉"]
      : t === "chrome" ? [
        // Chrome 150 (Temmuz 2026) "Ana ekrana ekle"nin adını "Yükle ve kısayol oluştur" yaptı; eski sürümlerde eski ad durur
        "Sağ üstteki <b>⋮</b> (üç nokta) menüsüne dokun<br><small>Görmüyorsan ekranı parmağınla hafifçe aşağı çek; üst çubuk belirir.</small>",
        "Menüde <b>Yükle ve kısayol oluştur</b>'u seç<br><small>Yer imleri, Geçmiş… satırlarının biraz altındadır; görmüyorsan menüyü aşağı kaydır. Eski Chrome'larda adı <b>Ana ekrana ekle</b>'dir.</small>",
        "Açılan pencerede <b>Yükle</b>'ye ya da <b>Kısayol oluştur</b>'a dokun",
        "<b>Ekle</b>'ye dokun. Hepsi bu! 🎉"]
      : t === "samsung" ? [
        "Ekranı parmağınla <b>hafifçe aşağı çek</b> 👇<br><small>Sayfayı aşağı kaydırınca tarayıcı alttaki çubuğu gizler; biraz geri çekince çubuk geri gelir.</small>",
        "Alttaki çubuğun <b>en sağındaki</b> menüye dokun: <b>⋮</b> (üç nokta) ya da <b>≡</b> (üç çizgi)",
        "<b>Sayfa ekle</b> → <b>Ana ekran</b>'ı seç",
        "<b>Ekle</b>'ye dokun. Hepsi bu! 🎉"]
      : [
        "Tarayıcının menüsünü aç: sağ üstte ya da sağ altta <b>⋮</b> veya <b>≡</b><br><small>Görmüyorsan ekranı parmağınla hafifçe aşağı çek; çubuk belirir.</small>",
        "<b>Ana ekrana ekle</b>, <b>Yükle ve kısayol oluştur</b> ya da <b>Sayfa ekle → Ana ekran</b>'ı seç",
        "<b>Ekle</b>'ye dokun. Hepsi bu! 🎉"];
    y.innerHTML = `<div class="kyB"><b>📲 Sadolayn'ı ana ekrana ekle</b><button class="kyX" aria-label="Kapat">✕</button></div>
      <div class="kyN">Bu bir uyarı değil, küçük bir yol tarifi 😊 Telefonuna uygulama yüklenmez; sitenin kısayolu ana ekrana gelir, tek dokunuşla açarsın.</div>
      <ol class="kyS">${S.map((x) => `<li>${x}</li>`).join("")}</ol>`;
    // Menünün yerini ekranın kenarında zıplayan bir okla göster (Samsung: sağ alt, Chrome: sağ üst)
    const okKaldir = () => { const o = document.getElementById("kyOk"); if (o) o.remove(); };
    okKaldir();
    if (t === "samsung" || t === "chrome") {
      const o = document.createElement("div"); o.id = "kyOk"; o.className = "kyOk " + (t === "samsung" ? "alt" : "ust");
      o.innerHTML = t === "samsung" ? "<span>Menü burada</span><b>⬇</b>" : "<b>⬆</b><span>Menü burada</span>";
      o.onclick = okKaldir; document.body.appendChild(o); setTimeout(okKaldir, 25000);
    }
    y.querySelector(".kyX").onclick = () => { y.hidden = true; okKaldir(); };
  };
  window.addEventListener("appinstalled", () => ($("kur").hidden = true));
})();
} catch (e) { console.error("anasayfa: (function () {", e); }

// ---- ===== Açılış kartı ===== (eski satır 1594) ----
try {
// ===== Açılış kartı =====
// Sabah tek bakışta: çeyrek ve Günce hedefleri (bu cihazdaki gunce_v2), Resmî Gazete (gazete/),
// PPK (data/ppk.json), takvim notu, Döviz & Emtia (data/piyasa.json), Bölge Nabzı (seçili yer) ve kampanya sayıları (isbank/kampanya_hepsi.json).
// Ana sayfada "Sabah brifingi" satırına dokununca yerinde açılır/kapanır; satırın altında kısa özet durur.
// Veri alınamayan parça sessizce gizlenir.
(function () {
  var K = document.getElementById("acilis"); if (!K || !window.fetch) return;
  var $ = function (i) { return document.getElementById(i); };
  var esc = Ortak.esc; // ortak.js
  var oku = function (k, v) { try { var x = localStorage.getItem(k); return x == null ? v : x; } catch (e) { return v; } };
  var yaz = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var GUNAD = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var anah = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var gunAy = function (s) { var p = s.split("-"); return +p[2] + " " + AY[+p[1] - 1]; };
  var BUGUN = new Date(); BUGUN.setHours(12, 0, 0, 0);
  var B = anah(BUGUN);
  var ekle = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  var fark = function (s) { return Math.round((new Date(s + "T12:00:00") - BUGUN) / 864e5); };
  // Resmî tatiller ve yarım günler (Günce ve Takvim'deki listeyle aynı)
  var TATIL = ["2026-01-01","2026-03-20","2026-03-21","2026-03-22","2026-04-23","2026-05-01","2026-05-19","2026-05-27","2026-05-28","2026-05-29","2026-05-30","2026-07-15","2026-08-30","2026-10-29",
    "2027-01-01","2027-03-09","2027-03-10","2027-03-11","2027-04-23","2027-05-01","2027-05-16","2027-05-17","2027-05-18","2027-05-19","2027-07-15","2027-08-30","2027-10-29"];
  var YARIM = ["2026-03-19","2026-05-26","2026-10-28","2027-03-08","2027-05-15","2027-10-28"];
  var isG = function (d) { return d.getDay() !== 0 && d.getDay() !== 6 && TATIL.indexOf(anah(d)) < 0; };
  var isV = function (d) { return isG(d) ? (YARIM.indexOf(anah(d)) > -1 ? 0.5 : 1) : 0; };
  var sayi = function (n, k) { return n.toLocaleString("tr-TR", { minimumFractionDigits: k, maximumFractionDigits: k }); };



  var goster = function () {};
  // ---- Sabah bandı: gün boyu (13 Kasım 2026), tek satır. Öncelik: PPK günü, yeni İşCep sürümü, Gazete'deki bankacılık başlıkları,
  // ayın son iş günü / arife / yarın tatil, bugün gelen yeni kampanyalar, çeyrek hedefi. Sığan kadarı (en çok 3) yazılır;
  // bir parçanın uzun hâli sığmazsa kısası denenir, o da sığmazsa sıradakine geçilir.
  // Sakin sabah (8 Kasım 2026): haber niteliğinde parça yoksa bandın başına günün İşCep ipucu gelir, fincan yerine ampul yanar.
  // Bant, veriler gelene kadar (en çok 1,5 sn) bekler; böylece açıldıktan sonra içeriği bir anda değişmez.
  var SB = {}, SBP = [], sbHazir = false, sbSaat = new Date().getHours(), sbVakit = true; // 13 Kasım 2026: bant gün boyu durur (Açılış kartına giden kapı); önceden iş günleri 07:00-11:00
  function sbYaz() {
    if (!sbVakit || !sbHazir) return;
    var haber = ["ppk", "iscep", "gazete", "duyuru", "takvim", "kampanya"].filter(function (k) { return SB[k]; }), ipc = !haber.length && SB.ipucu;
    var son = !SB.kampanya && SB.yeni5 ? "yeni5" : "hedef"; // bugün yeni kampanya yazıldıysa 5 günlük sayı tekrar etmesin
    // 13 Kasım 2026: geniş ekranda (bilgisayar, açık katlanır) bant Açılış kartı gibi uzar: önce çeyrek · faiz · PPK, sonra haberler; en çok 7 parça.
    // Telefonda öncelik yine haberlerde, en çok 3 parça; çeyrek/faiz/PPK yalnızca yer kalırsa sona eklenir.
    var genis = innerWidth >= 760, bilgi = ["cyr", "pf", "ppkg"].filter(function (k) { return SB[k]; });
    if (SB[son] === SB.cyr) son = null; // Günce'de hedef yoksa "hedef" yerine çeyrek satırı zaten bilgi parçalarında
    var sira = (ipc ? ["ipucu", son] : haber.concat(son)).filter(Boolean), azami = genis ? 7 : 3;
    sira = genis ? bilgi.concat(sira) : sira.concat(bilgi);
    var aday = sira.map(function (k) { return SB[k]; }).filter(Boolean), el = $("sbB");
    if (!aday.length || !el) return;
    var ik = el.querySelector(".sbI"); ik.textContent = ipc ? "💡" : "☕"; ik.classList.toggle("ipc", !!ipc);
    if (el.hidden) { el.hidden = false; window.aclBant = true; if (oku("aclGordu", "") !== B) el.classList.add("kirp"); }
    var t = $("sbT");
    var sigar = function (h) { t.innerHTML = h; var r = document.createRange(); r.selectNodeContents(t); return r.getBoundingClientRect().width <= t.clientWidth - 1; }; // gerçek yazı genişliği (scrollWidth küsuratı yuvarlıyor)
    function diz(ilkKisa) { // ilk parça uzun ya da kısa hâliyle başlayıp sığanları sırayla ekler; seçilenlerin öncelik sırasını da döndürür
      var sec = [], sira = [];
      aday.forEach(function (a, j) {
        if (sec.length >= azami) return;
        var secenek = [].concat(a); if (!sec.length && ilkKisa) secenek = secenek.slice(-1);
        for (var i = 0; i < secenek.length; i++) {
          if (/^Bugün/.test(secenek[i]) && sec.some(function (x) { return /^Bugün/.test(x); })) continue; // "Bugün … · Bugün …" tekrarı olmasın
          if (!sec.length || sigar(sec.concat(secenek[i]).join(" · "))) { sec.push(secenek[i]); sira.push(j); break; }
        }
      });
      return { sec: sec, sira: sira.join(",") };
    }
    var u = diz(false), k = diz(true), en = k.sec.length > u.sec.length || (k.sec.length === u.sec.length && k.sira < u.sira) ? k : u; // daha çok parça, eşitse daha öncelikli olanlar
    if (en === u && k.sec.length >= u.sec.length && !sigar(u.sec.join(" · "))) en = k; // uzun hâli tek başına bile taşıyorsa kısası
    if (genis) { // geniş ekranda: önce hepsini kısa hâliyle sığdır, sonra yer kaldıkça uzun hâllerine geç (uzun bir başlık çeyrek/hedefi dışarı itmesin)
      var ks = [], kx = [];
      aday.forEach(function (x) { var s2 = [].concat(x); if (ks.length < azami && sigar(ks.concat(s2[s2.length - 1]).join(" · "))) { ks.push(s2[s2.length - 1]); kx.push(s2); } });
      kx.forEach(function (x, i) { if (x.length > 1) { var dene = ks.slice(); dene[i] = x[0]; if (sigar(dene.join(" · "))) ks = dene; } });
      if (ks.length > en.sec.length) en = { sec: ks };
    }
    t.innerHTML = en.sec.join(" · ");
  }
  window.addEventListener("resize", sbYaz); // katlanan ekran açılıp kapanınca yeniden sığdır
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sbYaz); // yazı tipi geç yüklenince yeniden ölç
  var OZ = { gor: oku("aclGordu", "") === B ? "✅ Bugün baktın · " : "" }, alt = []; // küçükken görünen tek satır: çeyrek · PPK · kampanya
  function ozetYaz() { $("aclAlt").innerHTML = alt.join("<br>"); $("aclD").innerHTML = (OZ.gor || "") + ["ceyrek", "pf", "ppk"].map(function (k) { return OZ[k]; }).filter(Boolean).map(function (x) { return '<span style="white-space:nowrap">' + x + "</span>"; }).join(" · "); } // her parça bölünmeden satıra sığar

  // ---- 2) Satırlar: çeyrek, Gazete, PPK, takvim (sırası sabit) ----
  var SAT = {}, SIRA = ["ceyrek", "gazete", "iscep", "ipucu", "bolge", "ppk", "takvim", "piyasa"]; // piyasa kampanyaların hemen üstünde
  function satir(ad, html) {
    if (ad === "piyasa") { $("aclPy").innerHTML = html; goster(); return; } // Döviz & Emtia ayrı kutuda, Kampanyalar'ın altında (13 Kasım 2026)
    SAT[ad] = html; $("aclSat").innerHTML = SIRA.map(function (k) { return SAT[k] || ""; }).join(""); goster();
  }
  function kalip(href, ik, x, dis) { return '<a class="aclS" href="' + href + '"' + (dis ? ' target="_blank" rel="noopener"' : "") + '><span class="ik" aria-hidden="true">' + ik + '</span><span class="x">' + x + '</span><span class="ok" aria-hidden="true">›</span></a>'; }

  // Döviz & Emtia: döviz 1 birimin TL karşılığı; emtia uluslararası dolar fiyatı (ons / varil). Değişim, başlığın altındaki dönem seçicisine göre
  // (günlük, haftalık, aylık, 3 ay, 6 ay, yıllık), her kalem kendi biriminde. Altında Sepetim: seçilen kalemlerin aynı dönemdeki değişimi,
  // eşit ağırlıklı ve TL bazında. 6 Kasım 2026: dönem seçici yalnızca Sepetim'deydi, kutular hep günlüktü; tek seçici ikisini birden yönetir.
  Ortak.json("data/piyasa.json").then(function (P) {
    var D = P.dates || [], OZ = 31.1034768, n = D.length, i1 = n - 1, i0 = n - 2; if (i0 < 0) return;
    var KAL = [["usd", "💵", "Dolar", "TL", 2, 0], ["eur", "💶", "Euro", "TL", 2, 0], ["gbp", "💷", "Sterlin", "TL", 2, 0], ["xau", "🥇", "Altın", "$/ons", 0, OZ],
      ["xag", "🥈", "Gümüş", "$/ons", 2, OZ], ["xpt", "⚪", "Platin", "$/ons", 0, OZ], ["xpd", "🔘", "Paladyum", "$/ons", 0, OZ], ["brent", "🛢️", "Petrol", "$/varil", 2, 1]]
      .filter(function (x) { return P[x[0]] && P[x[0]][i1] != null && P[x[0]][i0] != null; });
    var deg = function (k, i, kat) { var v = P[k][i]; return kat ? v * kat / P.usd[i] : v; }; // emtia: TL → dolar
    // Sepet dönemi: günlük, haftalık, aylık, 3 ay, 6 ay, 1 yıl (seçim bu cihazda kalır)
    var DON = [["1g", "Gün", 0, "günlük"], ["1h", "Hafta", 7, "haftalık"], ["1a", "Ay", 1, "aylık"], ["3a", "3 Ay", 3, "3 aylık"], ["6a", "6 Ay", 6, "6 aylık"], ["1y", "Yıl", 12, "yıllık"]];
    var don = oku("aclDonem", "1g"); if (!DON.some(function (x) { return x[0] === don; })) don = "1g";
    function baz() { // dönemin başındaki kapanış: o güne ya da öncesine düşen son iş günü
      if (don === "1g") return i0;
      var x = DON.filter(function (d) { return d[0] === don; })[0], t = new Date(D[i1] + "T12:00:00");
      if (don === "1h") t.setDate(t.getDate() - 7); else t.setMonth(t.getMonth() - x[2]);
      var hedef = anah(t), i = i1; while (i > 0 && D[i] > hedef) i--; return i;
    }
    var gTL = function (k, b) { return (P[k][i1] / P[k][b] - 1) * 100; }; // sepet için TL bazında değişim
    var ok = function (c) { var cl = Math.abs(c) < 0.005 ? "eq" : c > 0 ? "up" : "dn"; return '<i class="' + cl + '">' + (cl === "eq" ? "–" : (cl === "up" ? "▲ %" : "▼ %") + sayi(Math.abs(c), 2)) + "</i>"; };
    var SEP = (oku("aclSepet", "usd,eur,xau") || "").split(",").filter(function (k) { return KAL.some(function (x) { return x[0] === k; }); });
    function kutular(b) {
      return KAL.map(function (x) {
        var v = deg(x[0], i1, x[5]), o = deg(x[0], b, x[5]);
        return '<a href="piyasa.html" class="' + (x[5] ? "em" : "") + '"><span class="ad">' + x[1] + " " + x[2] + "</span><b>" + (x[5] ? "$" : "₺") + sayi(v, x[4]) + '</b><span class="br">' + x[3] + "</span>" + ok((v - o) / o * 100) + "</a>";
      }).join("");
    }
    var aralik = function (b) { return gunAy(D[b]) + (D[b].slice(0, 4) !== D[i1].slice(0, 4) ? " " + D[b].slice(0, 4) : "") + " → " + gunAy(D[i1]); };
    // Dönem: "günlük ▾" yazısına dokununca seçim listesi açılır; kutular ve Sepetim birlikte değişir
    var donSec = function (b) { return '<div class="aclPD"><b>Değişim</b><small>' + aralik(b) + '</small></div><div class="aclSeg" role="group" aria-label="Değişim dönemi">' + DON.map(function (d) { return '<button type="button" data-don="' + d[0] + '" class="' + (d[0] === don ? "on" : "") + '" aria-pressed="' + (d[0] === don) + '">' + d[1] + "</button>"; }).join("") + "</div>"; };
    function sepet(b) {
      var top = SEP.reduce(function (a, k) { return a + gTL(k, b); }, 0), c = SEP.length ? top / SEP.length : 0;
      return '<div class="aclSp"><div class="aclSpB"><b>🧺 Sepetim</b>' + (SEP.length ? '<span class="aclSpS">' + ok(c) + "</span>" : "") + '<small>' + DON.filter(function (d) { return d[0] === don; })[0][3] + " · TL</small></div>" +
        '<div class="aclSpC" role="group" aria-label="Sepete kalem seç">' + KAL.map(function (x) { return '<button type="button" data-sep="' + x[0] + '" aria-pressed="' + (SEP.indexOf(x[0]) > -1) + '">' + x[1] + " " + x[2] + "</button>"; }).join("") + "</div></div>";
    }
    function ciz() {
      var b = baz();
      satir("piyasa", '<div class="aclP"><a class="aclPB" href="piyasa.html"><b>💱 Döviz &amp; Emtia</b><small>' + gunAy(D[i1]) + " kapanışı ›</small></a>" + donSec(b) +
        '<div class="aclPG">' + kutular(b) + "</div>" + sepet(b) +
        '<details class="aclPN"><summary>ℹ️ Değerler nasıl okunur?</summary>Döviz: 1 birimin TL karşılığı. Emtia: uluslararası dolar fiyatı; altın, gümüş, platin ve paladyum 1 ons, petrol 1 varil Brent. ▲▼ kutularda seçilen dönemin başındaki kapanışa göre (günlükte bir önceki kapanış), kendi biriminde. Döviz &amp; Emtia sayfasında değişimler TL bazındadır; bu yüzden emtiada buradakinden küçük bir fark görülebilir (aradaki fark doların TL karşısındaki hareketidir). Sepetim: seçilen kalemlerin seçilen dönemdeki (gün, hafta, ay, 3 ay, 6 ay, yıl) değişiminin eşit ağırlıklı ortalaması, hepsi TL bazında; yatırım tavsiyesi değildir.</details></div>');
    }
    $("aclPy").addEventListener("click", function (e) { var b = e.target.closest("button[data-don]"); if (!b) return; don = b.dataset.don; yaz("aclDonem", don); ciz(); });
    $("aclPy").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-sep]"); if (!b) return;
      var k = b.dataset.sep, i = SEP.indexOf(k); if (i > -1) SEP.splice(i, 1); else SEP.push(k);
      yaz("aclSepet", SEP.join(",")); ciz();
    });
    ciz();
  }).catch(function () {});

  // Çeyrek: iş günü ilerlemesi + Günce hedefleri
  (function () {
    var qn = Math.floor(BUGUN.getMonth() / 3), y = BUGUN.getFullYear();
    var bas = new Date(y, qn * 3, 1, 12), son = new Date(y, qn * 3 + 3, 0, 12), ger = 0, kal = 0;
    for (var d = new Date(bas); d <= son; d = ekle(d, 1)) { if (d < BUGUN) ger += isV(d); else kal += isV(d); }
    var top = ger + kal, yuz = top ? Math.round(ger / top * 100) : 0;
    var h = "";
    try {
      var G = JSON.parse(localStorage.getItem("gunce_v2") || "null"), T = G && G.targets && G.targets[y + "-Q" + (qn + 1)];
      if (G && T && Array.isArray(G.products)) {
        var ay = [qn * 3, qn * 3 + 1, qn * 3 + 2], kisa = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });
        var TUM = G.products.filter(function (p) { return Number(T[p.id]) > 0 && (!p.type || p.type === "adet" || p.type === "tutar"); }).map(function (p) {
          var s = 0; Object.keys(G.days || {}).forEach(function (k) { var a = k.split("-"); if (+a[0] === y && ay.indexOf(+a[1] - 1) > -1) s += Number((G.days[k] || {})[p.id]) || 0; });
          var f = function (n) { return p.type === "tutar" ? kisa.format(n).replace(/\s?B$/, " bin") : sayi(Math.round(n * 10) / 10, 0); };
          return { ad: p.name, s: s, t: Number(T[p.id]), f: f };
        });
        if (TUM.length) SB.hedef = "Çeyrek hedefi <b>%" + Math.round(TUM.reduce(function (a, o) { return a + Math.min(o.s / o.t, 1); }, 0) / TUM.length * 100) + "</b>"; // ürünlerin ortalaması, her biri en fazla %100
        var H = TUM.slice().sort(function (a, b) { return a.s / a.t - b.s / b.t; }).slice(0, 3);
        if (H.length) h = "<small>🎯 " + H.map(function (o) { return esc(o.ad) + " <b>" + o.f(o.s) + "/" + o.f(o.t) + "</b>"; }).join(" · ") + "</small>";
      }
    } catch (e) {}
    if (!h) h = "<small>Hedeflerini Günce'ye girersen burada görünür 🎯</small>";
    OZ.ceyrek = "📅 Çeyrekte <b>" + sayi(kal, kal % 1 ? 1 : 0) + "</b> iş günü"; ozetYaz();
    SB.cyr = "Çeyrekte <b>" + sayi(kal, kal % 1 ? 1 : 0) + "</b> iş günü";
    if (!SB.hedef) SB.hedef = SB.cyr; sbYaz();
    satir("ceyrek", kalip("gunce.html", "📅", "<b>" + (qn + 1) + ". çeyrek:</b> %" + yuz + " tamamlandı, <b>" + sayi(kal, kal % 1 ? 1 : 0) + " iş günü</b> kaldı" +
      '<span class="aclBar"><i style="width:' + yuz + '%"></i></span>' + h));
  })();

  // Takvim notu
  (function () {
    var n = [], ilk = ekle(BUGUN, 1); while (!isG(ilk)) ilk = ekle(ilk, 1);
    var ayAd = function (d) { return AY[d.getMonth()]; }, ayIs = function (y, m) { var s = 0; for (var d = new Date(y, m, 1, 12); d.getMonth() === m; d = ekle(d, 1)) s += isV(d); return s; };
    var aySon = ekle(BUGUN, 1).getMonth() !== BUGUN.getMonth();
    var sonIs = isG(BUGUN) && ilk.getMonth() !== BUGUN.getMonth();
    var ana = "", alt2 = "";
    if (!isG(BUGUN)) ana = (BUGUN.getDay() === 0 || BUGUN.getDay() === 6 ? "Hafta sonu" : "Bugün resmî tatil") + (aySon ? ", ay bugün bitiyor" : "") + " · sonraki iş günü <b>" + GUNAD[ilk.getDay()] + " " + ilk.getDate() + " " + ayAd(ilk) + "</b>";
    else if (YARIM.indexOf(B) > -1) { ana = "Bugün <b>arife, yarım gün</b>"; SB.takvim = "Bugün <b>arife</b>, yarım gün"; }
    else if (sonIs) { ana = "Bugün <b>ayın son iş günü</b>"; SB.takvim = "Bugün <b>ayın son iş günü</b>"; }
    else if (!isG(ekle(BUGUN, 1)) && ekle(BUGUN, 1).getDay() !== 6) { ana = "Yarın <b>resmî tatil</b> · sonraki iş günü " + GUNAD[ilk.getDay()] + " " + ilk.getDate() + " " + ayAd(ilk); SB.takvim = "Yarın <b>resmî tatil</b>"; }
    else { var k = 0; for (var d = new Date(BUGUN); d.getMonth() === BUGUN.getMonth(); d = ekle(d, 1)) if (d > BUGUN) k += isV(d); ana = ayAd(BUGUN) + " ayının bitmesine <b>" + sayi(k, k % 1 ? 1 : 0) + " iş günü</b> var"; }
    if (ilk.getMonth() !== BUGUN.getMonth()) { var m = ilk.getMonth(), yy = ilk.getFullYear(), s = ayIs(yy, m); alt2 = "<small>" + AY[m] + " ayında " + sayi(s, s % 1 ? 1 : 0) + " iş günü var</small>"; }
    satir("takvim", kalip("takvim.html", "🗓️", ana + alt2)); sbYaz();
  })();

  // Resmî Gazete
  // Kurum duyurusu (13 Kasım 2026): bugün ya da dün yayımlanan BDDK/TCMB/SPK… duyurusu banda haber olarak girer (önemli olan önce)
  SBP.push(Ortak.json("gazete/duyurular.json").then(function (j) {
    var dun = anah(ekle(BUGUN, -1)), L = (j.duyurular || []).filter(function (x) { return x && x.baslik && x.bant !== false && x.tarih >= dun && x.tarih <= B; })
      .sort(function (a, b) { return (b.onemli === true) - (a.onemli === true) || b.tarih.localeCompare(a.tarih); });
    if (!L.length) return;
    var x = L[0], ne = x.tarih === B ? "" : "Dün ";
    SB.duyuru = [ne + esc(x.kurum) + ": <b>" + esc(x.baslik) + "</b>", ne + "<b>" + esc(x.kurum) + "</b> duyurusu"]; sbYaz();
  }).catch(function () {}));
  SBP.push(Ortak.json("gazete/index.json").then(function (L) {
    var t = (L || [])[0]; if (!t) return;
    return Ortak.json("gazete/" + t + ".json").then(function (g) {
      var b = g.bankacilik || [], at = g.onemli_atamalar || [], gun = t === B ? "Bugünkü" : gunAy(t) + " tarihli";
      var x = b.length ? gun + " Resmî Gazete'de bankacılığa dokunan <b>" + b.length + " başlık</b><small>" + esc(b[0].baslik) + (b.length > 1 ? " · +" + (b.length - 1) + " başlık daha" : "") + "</small>"
        : gun + " Resmî Gazete'de bankacılığı doğrudan ilgilendiren <b>düzenleme yok</b>";
      if (at.length) x += "<small>👔 " + at.length + " önemli atama</small>";
      if (t === B && b.length) { SB.gazete = ["Gazete'de <b>" + b.length + "</b> bankacılık başlığı", "Gazete: <b>" + b.length + "</b> bankacılık başlığı"]; sbYaz(); }
      satir("gazete", kalip("gazete.html", "📜", x));
      alt.push("Resmî Gazete " + gunAy(t) + (g.sayi ? ", sayı " + esc(g.sayi) : ""));
      ozetYaz();
    });
  }).catch(function () {}));

  // Günün İşCep ipucu (isbank/iscep_ipucu.json): İş Bankası Gündemi › İşCep'teki "Günün ipucu" ile aynı seçim
  // (son 14 günde eklenen önce, yoksa güne göre sırayla); kartta her gün, bantta yalnızca sakin sabahlarda
  SBP.push(Ortak.json("isbank/iscep_ipucu.json").then(function (J) {
    var L = (J && J.ipuclari) || []; if (!L.length) return;
    var taze = function (x) { return x.yeni && Date.now() - new Date(x.yeni + "T00:00:00") < 14 * 864e5; }, i = -1;
    for (var j = 0; j < L.length; j++) if (taze(L[j])) { i = j; break; }
    if (i < 0) i = Math.floor(Date.now() / 864e5) % L.length;
    var x = L[i];
    satir("ipucu", kalip("isbank.html#iscep", esc(x.ic || "💡"), "<b>Günün İşCep ipucu:</b> " + esc(x.t) + (x.n ? "<small>📍 " + esc(x.n) + "</small>" : "")));
    SB.ipucu = ['Günün ipucu: <i class="sbIp">' + esc(x.t) + "</i>", '<i class="sbIp">' + esc(x.t) + "</i>"]; sbYaz();
  }).catch(function () {}));

  // İşCep yeni sürümü (isbank/iscep.json; her gün App Store ve Google Play'den, scripts/iscep_surum.py): kartta son 7 gün, sabah bandında son 3 gün.
  // Google Play sürüm numarası vermediği için Play'deki güncelleme App Store'daki son sürümden yeniyse "Android'de güncellendi" denir.
  SBP.push(Ortak.json("isbank/iscep.json").then(function (J) {
    var v = (J && J.surumler || [])[0], P = J && J.play; if (!v || !v.tarih) return;
    var ilkYeni = function (L) { return (L || []).filter(function (x) { return !/performans|iyileştirme/i.test(x); })[0] || (L || [])[0]; };
    var g = fark(v.tarih), gp = P && P.guncelleme && P.guncelleme > v.tarih ? fark(P.guncelleme) : null;
    if (g <= 0 && g >= -6) {
      var yen = ilkYeni(v.yenilikler);
      satir("iscep", kalip("isbank.html#iscep", "📲", "İşCep <b>" + esc(v.surum) + "</b> yayında (" + gunAy(v.tarih) + ")" + (yen ? "<small>" + esc(yen) + "</small>" : "")));
      if (g >= -2) { SB.iscep = ["Yeni İşCep <b>" + esc(v.surum) + "</b> yayında", "Yeni İşCep <b>" + esc(v.surum) + "</b>"]; sbYaz(); }
    } else if (gp !== null && gp <= 0 && gp >= -6) {
      var yp = ilkYeni(P.yenilikler);
      satir("iscep", kalip("isbank.html#iscep", "📲", "İşCep <b>Google Play'de güncellendi</b> (" + gunAy(P.guncelleme) + ")" + (yp ? "<small>" + esc(yp) + "</small>" : "")));
      if (gp >= -2) { SB.iscep = ["İşCep <b>Android'de güncellendi</b>", "Android'de yeni <b>İşCep</b>"]; sbYaz(); }
    }
  }).catch(function () {}));

  // PPK
  SBP.push(Ortak.json("data/ppk.json").then(function (J) {
    var son = J.last || {}, sonra = (J.meetings || []).filter(function (m) { return m >= B; })[0];
    if (!sonra && !son.date) return;
    var g = sonra ? fark(sonra) : null, x;
    if (sonra === B) x = "Bugün <b>PPK toplantı günü</b>";
    else if (sonra) x = "Sonraki PPK: <b>" + gunAy(sonra) + "</b> (" + (g === 1 ? "yarın" : g + " gün sonra") + ")";
    else x = "PPK takvimi";
    if (son.date && son.rate != null) {
      var c = Number(son.change) || 0, bp = Math.round(Math.abs(c) * 100);
      x += "<small>Son karar " + gunAy(son.date) + ": politika faizi %" + sayi(son.rate, son.rate % 1 ? 2 : 0) + ", " + (c === 0 ? "değişmedi" : bp + " baz puan " + (c < 0 ? "indirim" : "artırım")) + " · kaynak TCMB</small>";
    }
    // Özet satırı: politika faizi (son PPK kararı, data/ppk.json) ve sonraki toplantıya kalan gün
    if (son.rate != null) OZ.pf = "📈 Politika faizi <b>%" + sayi(son.rate, son.rate % 1 ? 2 : 0) + "</b>";
    if (sonra) OZ.ppk = "🏛️ PPK " + (g === 0 ? "<b>bugün</b>" : "<b>" + g + "</b> gün");
    if (son.rate != null) SB.pf = "Politika faizi <b>%" + sayi(son.rate, son.rate % 1 ? 2 : 0) + "</b>";
    if (sonra && g > 0) SB.ppkg = ["PPK'ya <b>" + g + "</b> gün", "PPK <b>" + g + "</b> gün"];
    if (sonra === B) SB.ppk = "Bugün <b>PPK</b> günü";
    sbYaz();
    ozetYaz();
    satir("ppk", kalip(son.url || "https://www.tcmb.gov.tr", "🏛️", x, true));
  }).catch(function () {}));

  // ---- 3) Kampanyalar: yalnızca iki sayı, büyük ve net — Faiz & Kredi ve yeni gelenler (bireysel / ticari) ----
  // Liste yok; dokununca İş Bankası Gündemi › Kampanyalar aynı süzgeçle açılır. "Yeni" orada da son 5 gün.
  SBP.push(Ortak.json("isbank/kampanya_hepsi.json").then(function (KH) {
    var ayni = function (t) { return (t || "").toLocaleLowerCase("tr").replace(/[’'`]/g, "").replace(/[çğıöşüâîû]/g, function (h) { return { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" }[h]; }).replace(/[^a-z0-9%]/g, ""); };
    var uc = anah(ekle(BUGUN, -4)); // son 5 gün
    function say(seg) {
      var G = {};
      ["isbank", "maximum", "maximiles"].forEach(function (kay) {
        var v = (KH[kay] || {})[seg] || {}, L = v.kampanyalar || [].concat.apply([], (v.kategoriler || []).map(function (c) { return c.kampanyalar || []; }));
        L.forEach(function (k) {
          if (!k || !k.baslik || (k.bitis && k.bitis < B)) return;
          var a = k.es || ayni(k.baslik), ilk = k.ilk && k.ilk > "2000-01-01" ? k.ilk : "0";
          if (!G[a]) G[a] = { ne: k.ne || "", ilk: ilk };
          else { if (ilk < G[a].ilk) G[a].ilk = ilk; if (!G[a].ne && k.ne) G[a].ne = k.ne; }
        });
      });
      var fk = 0, yn = 0; Object.keys(G).forEach(function (a) { if (G[a].ne === "Faiz & Kredi") fk++; if (G[a].ilk >= uc) yn++; });
      return { fk: fk, yn: yn };
    }
    var Bi = say("bireysel"), Ti = say("ticari");
    (function () { // sabah bandı için: bugün ilk kez görülen kampanyalar, iki segment ve üç site birlikte, aynı kampanya bir kez
      var G = {}; ["isbank", "maximum", "maximiles"].forEach(function (kay) { Object.keys(KH[kay] || {}).forEach(function (sg) {
        var v = KH[kay][sg] || {}, L = v.kampanyalar || [].concat.apply([], (v.kategoriler || []).map(function (c) { return c.kampanyalar || []; }));
        L.forEach(function (k) { if (!k || !k.baslik || (k.bitis && k.bitis < B)) return; var a = k.es || ayni(k.baslik), ilk = k.ilk && k.ilk > "2000-01-01" ? k.ilk : "0"; if (!(a in G) || ilk < G[a]) G[a] = ilk; });
      }); });
      var yb = Object.keys(G).filter(function (a) { return G[a] === B; }).length;
      if (yb) { SB.kampanya = ["Bugün <b>" + yb + "</b> yeni kampanya", "<b>" + yb + "</b> yeni kampanya"]; sbYaz(); }
      // 11 Kasım 2026: bandın son parçası çeyrek hedefi yerine son 5 günün yeni kampanyaları (İş Bankası kartındaki sayıyla aynı); yoksa çeyrek hedefi kalır
      var y5 = Object.keys(G).filter(function (a) { return G[a] >= uc; }).length;
      if (y5) { SB.yeni5 = ["Son 5 günde <b>" + y5 + "</b> yeni kampanya", "<b>" + y5 + "</b> yeni kampanya"]; sbYaz(); }
    })();
    if (!Bi.fk && !Ti.fk && !Bi.yn && !Ti.yn) return;
    function kutu(tur, ic, ad, alt, b, t) {
      return '<div class="aclT ' + tur + '"><div class="ust"><span class="ic" aria-hidden="true">' + ic + '</span><b class="n">' + (b + t) + '</b></div><div class="ad">' + ad + '</div><div class="alt2">' + alt + "</div>" +
        '<div class="sg"><button type="button" data-git="' + tur + '|bireysel">👤 Bireysel <b>' + b + '</b></button><button type="button" data-git="' + tur + '|ticari">🏢 Ticari <b>' + t + "</b></button></div></div>";
    }
    $("aclK").innerHTML = '<div class="aclKB">📣 Kampanyalar</div><div class="aclTT">' +
      kutu("fk", "🏦", "Faiz &amp; Kredi", "şu an geçerli", Bi.fk, Ti.fk) + kutu("yeni", "🆕", "Yeni gelen", "son 5 günde", Bi.yn, Ti.yn) + "</div>";
    $("aclK").hidden = false;
    $("aclK").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-git]"); if (!b) return;
      var p = b.dataset.git.split("|"), o = {}; try { o = JSON.parse(localStorage.getItem("isbankKamp") || "{}") || {}; } catch (x) {}
      o.seg = p[1]; o.nere = ""; o.kim = ""; o.one = false; o.ne = p[0] === "fk" ? "Faiz & Kredi" : ""; if (p[0] === "fk") o.kay = "isbank";
      yaz("isbankKamp", JSON.stringify(o));
      if (window.Rapor) Rapor.bolum("acilis-" + p[0] + "-" + p[1]);
      location.href = "isbank.html#" + (p[0] === "fk" ? "kliste" : "yeniliste-" + p[1]); // sayfa doğrudan süzülmüş listeye iner
    });
  }).catch(function () {}));

  // ---- 4) Bölge Nabzı: yalnızca seçili yer; ayrıntı Bölge Nabzı sayfasında ----
  (function () {
    var Y = null; try { Y = JSON.parse(localStorage.getItem("bolgem") || localStorage.getItem("haber_yerel2") || "null"); } catch (e) {}
    var ad = Y && [Y.elle || Y.ilce, Y.il].filter(Boolean).join(", ");
    satir("bolge", kalip("bolge.html", "📍", ad ? "Bölge Nabzı: <b>" + esc(ad) + "</b><small>Atama, vefat, yatırım, konkordato… bölgende neler oluyor</small>"
      : "<b>Bölge Nabzı:</b> ilini ya da ilçeni seç<small>Bölgende neler olduğuna buradan geçersin</small>"));
  })();

  // Sabah bandı: veriler gelince (en çok 1,5 sn beklenir) bir kerede yazılır
  (function () { var bitti = function () { if (sbHazir) return; sbHazir = true; sbYaz(); }; Promise.all(SBP).then(bitti, bitti); setTimeout(bitti, 1500); })();

  // ---- Aç / kapat: sayfa her açılışta kapalı, satıra dokununca kart yerinde açılır; kayan yazıdan da açılır ----
  var row = $("aclRow");
  function durum(acik, kaydir) {
    K.hidden = !acik; row.setAttribute("aria-expanded", acik ? "true" : "false"); row.classList.toggle("acik", acik);
    if (acik) { yaz("aclGordu", B); OZ.gor = ""; ozetYaz(); var sb = $("sbB"); if (sb) sb.classList.remove("kirp"); }
    if (acik && kaydir) { // üstteki yapışkan çubuğun altında kalmasın: "Sabah brifingi" başlığı görünecek kadar yukarıdan başla (13 Kasım 2026)
      var bas = row.closest(".mnB"), hb = bas && bas.querySelector("h2") || row, bar = document.getElementById("bar");
      var ust = bar && getComputedStyle(bar).display !== "none" ? bar.offsetHeight : 0;
      window.scrollTo({ top: hb.getBoundingClientRect().top + window.scrollY - ust - 12, behavior: "smooth" });
    }
  }
  durum(false); // her açılışta kapalı başlar; satıra dokununca açılır (site uzamasın)
  row.addEventListener("click", function (e) {
    e.preventDefault(); var a = K.hidden; durum(a);
    if (window.Rapor) Rapor.bolum(a ? "acilis-ac" : "acilis-kapat");
  });
  window.Acilis = { ac: function () { durum(true, true); } };
  if (location.hash === "#acilis") setTimeout(function () { window.Acilis.ac(); }, 300);
  // Favoriler, arama ve A-Z listesindeki "Açılış kartı" kısayolları: kart gizli olduğu için #acilis'e atlamak bir şey
  // yapmıyordu (6 Kasım 2026); kısayola dokununca kartı aç ve oraya kaydır
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href="#acilis"]');
    if (!a || a === row || document.body.classList.contains("favDuz") || e.target.closest("[data-fvx], .yb")) return;
    e.preventDefault(); window.Acilis.ac();
    if (window.Rapor) Rapor.bolum("acilis-kisayol");
  });
  window.addEventListener("hashchange", function () { if (location.hash === "#acilis") window.Acilis.ac(); });
})();
} catch (e) { console.error("anasayfa: ===== Açılış kartı =====", e); }

// ---- Görünüm seçimi (tema.js): köşedeki düğme, dokundukça Açık → Koyu → (eski satır 1943) ----
try {
  // Görünüm seçimi (tema.js): köşedeki düğme, dokundukça Açık → Koyu → Sistem; kısa süre adını gösterir
  (function () {
    var k = document.getElementById("temaSec"), n = document.getElementById("temaN"), zm;
    var AD = { acik: "Açık", koyu: "Koyu", oto: "Sistem" }, SIRA = { acik: "koyu", koyu: "oto", oto: "acik" };
    function boya() {
      var s = Tema.secim(), t = Tema.tema();
      k.dataset.s = s;
      var ad = document.getElementById("temaAd"); if (ad) ad.textContent = "Görünüm: " + AD[s];
      k.setAttribute("aria-label", "Görünüm: " + AD[s] + (s === "oto" ? " (telefona uyar, şu an " + (t === "acik" ? "açık" : "koyu") + ")" : "") + ". Değiştirmek için dokun.");
    }
    k.addEventListener("click", function () {
      var y = SIRA[Tema.secim()]; Tema.sec(y); window.Rapor && Rapor.bolum("tema-sec-" + y);
      n.textContent = y === "oto" ? "Sistem · telefona uyar" : AD[y]; n.classList.add("on");
      clearTimeout(zm); zm = setTimeout(function () { n.classList.remove("on"); }, 1400);
    });
    document.addEventListener("tema", boya); boya();
  })();
} catch (e) { console.error("anasayfa: Görünüm seçimi (tema.js): köşedeki düğme, dokundukça Açık → Koyu →", e); }

// ---- Kayan yazı: ayrıntı vermeyen merak cümleleri, sonunda "hepsi ve dah (eski satır 1966) ----
try {
// Kayan yazı: ayrıntı vermeyen merak cümleleri, sonunda "hepsi ve daha fazlası İş Bankası Gündemi'nde".
// Şeridin tamamı ve sağdaki "Göz at" düğmesi dokunulabilir; dokunulan cümlenin bölümü açılır.
(function () {
  const kutu = document.getElementById("kayan"), ser = document.getElementById("kayanSer");
  if (!kutu) return;
  // Sade: az cümle, her biri dokununca ilgili bölüme açılır
  // [bölüm, cümle, son gün (isteğe bağlı)] — son günü geçen cümle kendiliğinden kalkar
  const bugunTR = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
  // Önemli duyuru (ÖNEMLİ rozeti, PPK satırından hemen sonra): Resmi Gazete sayfasındaki "yapım aşamasında" kutusuna gider
  const dizi = [
    ["video", "<svg class=\"kyTrb\" viewBox=\"0 0 30 20\" aria-hidden=\"true\"><rect width=\"30\" height=\"20\" fill=\"#e30a17\"/><circle cx=\"11\" cy=\"10\" r=\"5\" fill=\"#fff\"/><circle cx=\"12.25\" cy=\"10\" r=\"4\" fill=\"#e30a17\"/><polygon points=\"16.2,10 19.9,8.8 17.6,11.9 17.6,8.1 19.9,11.2\" fill=\"#fff\"/></svg><b>Cumhuriyet Bayramımız kutlu olsun!</b> İş Bankası'nın 29 Ekim videosu <b class=\"gir\">İş Bankası Gündemi › Video</b>", "2026-10-29", "onem"],
    // 20 Kasım 2026: yapılandırma HAZIRLIĞI haberi (Ekonomim; Sabah yazarı Dilek Güngör'ün aktardığı bilgiler). Resmî karar yok: yalnızca "değerlendiriliyor" denir, vade/faiz kesinmiş gibi yazılmaz. Bir hafta kalır
    ["https://www.ekonomim.com/ekonomi/kredi-karti-ve-ihtiyac-kredisi-borclarina-yeni-yapilandirma-hazirligi-haberi-932457", "📰 Kredi kartı ve ihtiyaç kredisi borçlarına <b>yeni yapılandırma hazırlığı</b>: haberlere göre BDDK 48–60 ay vade seçeneklerini değerlendiriyor; resmî karar henüz açıklanmadı <b class=\"gir\">Haberi oku</b>", "2026-11-27", "onem"],
    // 9 Kasım 2026: COP31 (Antalya, 9–20 Kasım 2026); kaynak İş Bankası'nın 6.11.2026 tarihli "Türkiye İş Bankası COP31'de" duyurusu, rol adı birebir ("İklim Destekçisi"); zirve bitince kalkar
    ["cop31.html", "🌍 <b>COP31 İklim Zirvesi</b> 9–20 Kasım'da Antalya'da; İş Bankası COP31'de <b>“İklim Destekçisi”</b> olarak yer alıyor <b class=\"gir\">Program</b>", "2026-11-20", "onem"], // 10 Kasım: dokununca İş Bankası'nın COP31 programı (cop31.html)
    // COP31 oturumları artık program dosyasından (isbank/cop31.json) aşağıda eklenir (10 Kasım 2026)
    // 6 Kasım 2026: Genel Müdür H. Cahit Çınar'ın Eylül 2026 sonuçlarına ilişkin değerlendirmesi (Fintechtime / Fintech Dünyası'ndaki açıklama metni); Haberler'deki alıntı kartına gider
    ["haber", "💬 İş Bankası Genel Müdürü H. Cahit Çınar: “Bundan sonra da <b>bir bankanın çok daha ötesinde bir kurum</b> olarak kaynaklarımızı ülkemizin katma değerli üretimine fayda sağlamak ve tüm paydaşlarımız için kalıcı değer üretmek için kullanmaya devam edeceğiz” <b class=\"gir\">İş Bankası Gündemi › Haber</b>", "2026-11-20", "onem"],
    // Ay başı hatırlatması (her ayın 1-5'i): yeni kampanyalara katılmayı unutma. İlk 3 gün "Yeni gelenler"e, sonra tüm kampanyalara gider
    ...(+bugunTR.slice(8) <= 5 ? [[+bugunTR.slice(8) <= 5 ? "yeniliste" : "maximum", "🗓️ Yeni ay, yeni kampanyalar! " + ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"][+bugunTR.slice(5, 7) - 1] + " kampanyalarına katılmayı unutma 🎁 <b class=\"gir\">Güncel kampanyalar</b>"]] : []),
    ...(function () { try { return window.aclBant || localStorage.getItem("aclGordu") === bugunTR; } catch (e) { return false; } })() ? [] : [["acilis", "☕ <b>Açılış kartı</b> hazır: çeyrek, Gazete, bölgen, PPK ve kampanyalar tek ekranda. Bugün baktın mı? <b class=\"gir\">Aç</b>"]],
    // 18 Kasım 2026: yeni ürün; kaynak isbank.com.tr/kazanc-hesap-ticari ve bankanın 18.11.2026 açıklaması (AA/DHA). Yalnızca sayfada yazanlar; ay sonunda kalkar
    ["banka.html#tkh", "🆕 İş Bankası'ndan yeni ürün: <b>Ticari Kazanç Hesabı</b>, işletmenin vadesiz hesabında belirlenen tutarın üstündeki bakiye her iş günü 17.45'te vadeliye geçip <b>gecelik faiz</b> kazanıyor <b class=\"gir\">Hesapla</b>", "2026-11-30", "onem"],
    // 25 Kasım 2026: İş Yatırım (İş Bankası iştiraki) YK başkanlığı; kaynak İş Yatırım'ın 24.11.2026 tarihli KAP açıklaması (CNBC-e, Investing, Banka Dünyası aynı bilgi).
    // Yalnızca açıklamada yazanlar: Özşuca 24.11.2026 itibarıyla YK üyeliğinden ayrıldı, görev dağılımında Ayvacı başkan seçildi, GM Devecioğlu YK üyesi atandı (ilk genel kurul onayına sunulacak).
    // Ayvacı'nın İş Bankası'ndaki yeni unvanı BDDK iznine bağlı olduğundan yazılmaz. Kullanıcı isteği: üst şeritte 2-3 gün → 27 Kasım'dan sonra kendiliğinden kalkar.
    ["https://www.cnbce.com/borsa/is-yatirimda-yeni-donem-yonetim-kurulu-baskani-degisti-h42547", "📈 İş Bankası iştiraki <b>İş Yatırım'da</b> yeni dönem: Ebru Özşuca'nın yerine Yönetim Kurulu Başkanlığına <b>Kenan Ayvacı</b> seçildi; Genel Müdür <b>Serhat Devecioğlu</b> da yönetim kuruluna katıldı<small>KAP açıklaması, 24 Kasım 2026 · CNBC-e ↗</small>", "2026-11-27", "ust", "isyatirim-baskan"],
    // 23 Kasım 2026: İş Bankası–DenizBank Maximum iş birliği (DHA, AA, Fintech Dünyası aynı açıklama). 24 Kasım: bağlantı İş Bankası'nın kendi duyurusuna çevrildi. Yalnızca açıklamada
    // yazanlar: imzalayanlar ve unvanları, 6 Aralık 2026, "500 bini aşkın" üye iş yeri, Çınar'ın sözleri birebir (art arda gelen iki cümle). İmza yeri/tarihi açıklamada yok, yazılmaz.
    // "ust" işareti: ana sayfanın en üstündeki GÜNDEM şeridinde geçer (alttaki kayan yazıda tekrar etmez); geçiş gününe kadar kalır.
    // (5 Kasım'daki DenizBank duyurusu satırı bunun yerine kaldırıldı.)
    ["https://www.isbank.com.tr/bankamizi-taniyin/is-bankasi-ve-denizbanktan-odeme-sistemlerinde-is-birligi", "🤝 <b>İş Bankası ile DenizBank</b> Maximum'un 25. yılında ödeme sistemlerinde iş birliğine imza attı: DenizBank kredi kartları <b>6 Aralık 2026</b> itibarıyla Maximum özellikleri kazanıyor<small>İş Bankası duyurusu ↗</small>", "2026-12-06", "ust", "denizbank-maximum"],
    ["https://www.isbank.com.tr/bankamizi-taniyin/is-bankasi-ve-denizbanktan-odeme-sistemlerinde-is-birligi", "✍️ Anlaşmayı İş Bankası Genel Müdürü <b>H. Cahit Çınar</b> ve DenizBank Genel Müdürü <b>Recep Baştuğ</b> imzaladı. Çınar: “İki bankanın deneyimini, teknolojik altyapısını ve yaygın erişimini bir araya getirerek ödeme sistemlerinde daha büyük bir ölçek ve daha geniş bir etki alanı oluşturmayı hedefliyoruz. Tüm DenizBank müşterilerine ‘Maximum dünyasına hoş geldiniz’ diyoruz”", "2026-12-06", "ust", "denizbank-cinar"],
    ["https://www.isbank.com.tr/bankamizi-taniyin/is-bankasi-ve-denizbanktan-odeme-sistemlerinde-is-birligi", "🛍️ DenizBank kredi kartı kullanıcıları Maximum'un <b>500 bini aşkın</b> üye iş yerinde taksitli alışveriş yapabilecek; DenizBank üye iş yerleri de Maximum Kart sahiplerine açılacak", "2026-12-06", "ust", "denizbank-isyeri"],
    // 8 Kasım 2026: sayfanın en üstündeki görünüm seçimi; dokununca yukarı çıkar ve seçici kısa bir an parlar
    ["tema", "🌓 Gözüne göre seç: takvimin altındaki <b>◐ Görünüm</b> düğmesine dokun: <b>Açık · Koyu · Sistem</b>; Sistem telefonunun ayarına uyar <b class=\"gir\">Seç</b>", "2026-11-22"],
    // İşCep ödülü satırı 5 Kasım'da çıkarıldı: üstteki kupa kartı zaten gösteriyor
    ["maximum", "🎁 Kampanyaları bulmak hiç bu kadar kolay olmamıştı: İş Bankası, Maximum ve Maximiles tek ekranda; arama, takvim ve <b>Bana uygun</b> <b class=\"gir\">İş Bankası Gündemi › Kampanyalar</b>", "2026-11-30"],
    ["iscep", "🌍 İşCep ile yurt dışına para gönderimi: süre ve ücret bilgileri <b class=\"gir\">İş Bankası Gündemi › İşCep</b> bölümünde", "2026-12-31"],
          ];
  const CAGRI = [null, null];
  // 10 Kasım matemi: yalnızca anma satırı, ÖNEMLİ duyurular ve PPK kalır; kampanya/tanıtım satırları o gün gösterilmez
  const MATEM = document.documentElement.classList.contains("matem");
  if (MATEM) dizi.unshift(["anma", "Cumhuriyetimizin ve Türkiye İş Bankası'nın Kurucusu Ulu Önder <b>Mustafa Kemal Atatürk</b>'ü, tarifsiz bir özlem, derin bir saygı ve sonsuz minnetle anıyoruz. <b class=\"yil\">1881 – ∞</b>", "", "anma"]);
  // PPK satırı (TCMB faiz kararı) varsa en başa gelir; ana sayfadaki PPK betiği Kayan.ppk(...) ile verir
  let ppk = null;
  // Matemde siyah şeritte yalnızca anma yazısı geçer; haber satırları (ÖNEMLİ duyurular, COP31, PPK) en üstteki şeride taşınır.
  // 23 Kasım 2026: "ust" işaretli satırlar her gün en üstteki GÜNDEM şeridinde geçer (YENİ satırları varsa arkalarına eklenir; SON DAKİKA hepsinin önüne geçer).
  let ustSon = "";
  function ustSerit() {
    const k = document.getElementById("yeniS"), s2 = document.getElementById("ysSer"); if (!k || !s2) return;
    const tem = (x) => x.replace(/<b class="gir">.*?<\/b>/g, "").replace(/<b class="yn">(.*?)<\/b>/, "<b>$1</b>");
    const adres = (h) => /^https?:/.test(h) ? h : h.includes(".html") ? h : "isbank.html#" + h;
    const L = dizi.filter((d) => (d[3] === "ust" || (MATEM && d[3] === "onem")) && (!d[2] || bugunTR <= d[2])).map(([h, x, , , g]) => `<a href="${adres(h)}"${/^https?:/.test(h) ? ' target="_blank" rel="noopener"' : ""}${g ? ` data-g="${g}"` : ""}>${tem(x)}</a>`);
    if (ppk && MATEM) L.unshift(`<a href="#" data-ppk="1">${tem(ppk.html)}</a>`);
    if (!L.length) { if (MATEM) k.hidden = true; return; }
    const tur = '<span style="display:inline-block;width:22px"></span>' + L.join("");
    if (tur === ustSon) return; // aynı içerik: şeridi baştan başlatma
    ustSon = tur; k.dataset.gundem = 1; window.ustGundemTur = tur;
    // SON DAKİKA varsa şerit onun etiketiyle kalır; gündem satırları (Resmî Gazete, kurum duyuruları…) son dakikanın arkasından geçer
    const sd = k.classList.contains("sd") && window.sdTur ? window.sdTur : "";
    const yn = !sd && window.yeniTur ? window.yeniTur : ""; // YENİ şeridi satırları gündemin arkasında kalır
    s2.innerHTML = sd + tur + yn + sd + tur + yn; k.hidden = false;
    if (!sd) { k.querySelector(".ysEt").innerHTML = "<i></i>GÜNDEM"; k.setAttribute("aria-label", "Gündem"); }
    requestAnimationFrame(() => s2.style.setProperty("--sure", Math.max(28, Math.round(s2.scrollWidth / 2 / 40)) + "s"));
    if (!k.dataset.ppkDinle) { k.dataset.ppkDinle = 1; s2.addEventListener("click", (e) => { if (e.target.closest("[data-ppk]")) { e.preventDefault(); ppk && ppk.tap && ppk.tap(); } const a = e.target.closest("a[data-g]"); if (a && window.Rapor) Rapor.bolum("gundem-" + a.dataset.g); }); }
  }
  function ciz() {
    const tek = (ppk && !MATEM ? `<span class="kyOge ppk" data-h="ppk">${ppk.html}</span>` : "") +
      dizi.filter((d) => (!d[2] || bugunTR <= d[2]) && (!MATEM || d[3] === "anma") && d[3] !== "ust").map(([h, x, , k]) => `<span class="kyOge${x === CAGRI[1] ? " son" : ""}${k ? " " + k : ""}" data-h="${h}">${x}</span>`).join("");
    ustSerit();
    ser.innerHTML = tek + tek; // iki kopya: kesintisiz döngü
    kutu.hidden = false;
    requestAnimationFrame(() => { const w = ser.scrollWidth / 2; ser.style.setProperty("--sure", Math.max(25, Math.round(w / 55)) + "s"); });
  }
  ciz();
  // Kurum Duyuruları'ndaki son 3 günün ÖNEMLİ duyuruları kayan yazının başına (Resmî Gazete sayfasındaki bölüme gider)
  Ortak.json("gazete/duyurular.json").then((j) => {
    const yeni = (j.duyurular || []).filter((x) => x && x.onemli && x.bant !== false && x.baslik && (Date.now() - new Date(x.tarih + "T12:00:00")) / 864e5 <= 3).slice(0, 2); // 3 gün kalır (2 Kasım 2026: 7 gün uzun geldi)
    if (!yeni.length) return;
    const e = Ortak.esc; // ortak.js
    // 27 Kasım 2026: kurum duyuruları en üstteki şeride taşındı ("ust"); tıklama "gundem-kurum" diye sayılır
    dizi.unshift(...yeni.map((x) => ["gazete.html?kurum", `<b class="yn">ÖNEMLİ</b>🏛️ ${e(x.kurum)}: ${e(x.baslik)} <b class="gir">Ayrıntı</b>`, "", "ust", "kurum"]));
    dizi.sort((a, b) => (b[0] === "anma") - (a[0] === "anma") || (b[0] === "video") - (a[0] === "video")); // anma satırı ve bayram videosu yine en başta
    ciz();
  }).catch(() => {});
  // 27 Kasım 2026: bugünkü Resmî Gazete'nin "Bankacılığı ilgilendirenler" başlıkları da en üstteki şeritte (en fazla 2; Resmî Gazete sayfasında o günü açar).
  // Başlıklar sitenin kendi Resmî Gazete özetindekilerle aynı; İş Bankası adı geçen madde şeride çıkmaz.
  Ortak.json("gazete/" + bugunTR + ".json").then((g) => {
    const e = Ortak.esc;
    const L = ((g && g.bankacilik) || []).filter((x) => x && x.baslik && !/i̇ş bankası|iş bankası|işbank/i.test(x.baslik + " " + (x.aciklama || ""))).slice(0, 2);
    if (!L.length) return;
    dizi.unshift(...L.map((x) => ["gazete.html#" + bugunTR, `📜 <b>Resmî Gazete</b> · ${e(x.baslik)} <b class="gir">Ayrıntı</b>`, "", "ust", "resmigazete"]));
    dizi.sort((a, b) => (b[0] === "anma") - (a[0] === "anma") || (b[0] === "video") - (a[0] === "video"));
    ciz();
  }).catch(() => {});
  // COP31: bugünün kalan İş Bankası oturumları saatleriyle (program: isbank/cop31.json, İş Bankası'nın yayımladığı PDF'ten); bugün yoksa sıradaki gün
  Ortak.json("isbank/cop31.json").then((j) => {
    const O = (j.oturumlar || []).filter((o) => Date.parse(o.g + "T" + o.s + ":00+03:00") > Date.now());
    if (!O.length) return;
    const e = Ortak.esc; // ortak.js
    const ad = (o) => o.baslik || (o.kisiler[0] && o.kisiler[0].ad) || "";
    const bg = O.filter((o) => o.g === bugunTR), L = (bg.length ? bg : O.filter((o) => o.g === O[0].g)).slice(0, 3);
    const AYS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"], d = new Date(L[0].g + "T12:00:00+03:00");
    const bas = bg.length ? "🎙️ COP31'de bugün İş Bankası:" : "🎙️ COP31'de İş Bankası " + d.getUTCDate() + " " + AYS[d.getUTCMonth()] + "'da:";
    const satir = ["cop31.html", bas + " " + L.map((o) => "<b>" + o.b.replace(":", ".") + "</b> " + e(ad(o))).join(" · ") + (bg.length > 3 ? " · +" + (bg.length - 3) + " oturum" : "") + " <b class=\"gir\">Program</b>", "2026-11-19", "onem"];
    const k = dizi.findIndex((x) => x[0] === "cop31.html");
    dizi.splice(k > -1 ? k + 1 : 0, 0, satir);
    ciz();
  }).catch(() => {});
  window.Kayan = { ppk: (o) => { if ((o && o.html) === (ppk && ppk.html)) { ppk = o; return; } ppk = o; ciz(); } };
  kutu.addEventListener("click", (e) => {
    const o = e.target.closest(".kyOge"); const h = o ? o.dataset.h : "iscep";
    e.preventDefault();
    if (MATEM && (!o || h === "anma")) return; // anma satırı ve kurdele bir yere götürmez
    if (h === "ppk") { ppk && ppk.tap && ppk.tap(); return; }
    if (h === "tema") { window.Rapor && Rapor.bolum("kayan-tema"); const t = document.getElementById("temaSec"); t && t.scrollIntoView({ behavior: "smooth", block: "center" }); if (t && t.animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) setTimeout(() => t.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 500, iterations: 2, easing: "ease-in-out" }), 450); return; }
    if (h === "acilis") { window.Rapor && Rapor.bolum("kayan-acilis"); window.Acilis && window.Acilis.ac(); return; }
    if (/^https:\/\/www\.denizbank\.com\//.test(h)) { window.Rapor && Rapor.bolum("kayan-denizbank-duyuru"); window.open(h, "_blank", "noopener"); return; } // DenizBank'ın kendi duyurusu
    if (/^https:\/\/www\.ekonomim\.com\//.test(h)) { window.Rapor && Rapor.bolum("kayan-ekonomim"); window.open(h, "_blank", "noopener"); return; } // Ekonomim haberi (yeni sekmede)
    if (/^https:\/\/www\.isbank\.com\.tr\//.test(h)) { window.Rapor && Rapor.bolum("kayan-isbank-duyuru"); window.open(h, "_blank", "noopener"); return; } // İş Bankası'nın kendi duyurusu
    if (h === "cop31.html") { window.Rapor && Rapor.bolum("kayan-cop31"); location.href = h; return; }
    if (h.includes(".html")) { window.Rapor && Rapor.bolum(h.includes("kurum") ? "kayan-kurum" : "kayan-gazete-yakinda"); location.href = h; return; }
    window.Rapor && Rapor.bolum("kayan-" + h); location.href = "isbank.html#" + h;
  });
})();
} catch (e) { console.error("anasayfa: Kayan yazı: ayrıntı vermeyen merak cümleleri, sonunda \"hepsi ve dah", e); }

// ---- PPK kuralı (TCMB faiz kararı), kayan yazının en başında: (eski satır 2068) ----
try {
// PPK kuralı (TCMB faiz kararı), kayan yazının en başında:
// her toplantıdan 2 gün önce "DİKKAT" satırı; karar günü 14:15'ten (TR) ertesi gün sonuna kadar karar satırı.
// Satıra dokununca ayrıntı + paylaş penceresi açılır. Karar data/ppk.json'dan gelir (TCMB basın duyurusundan
// otomatik); henüz gelmediyse ekonomi manşetine bakılır, karar beklenirken 2 dakikada bir yenilenir.
(function () {
  const sh = document.getElementById("ppkSh"), ic = document.getElementById("ppkIc");
  if (!sh || !window.Ortak || !window.Kayan) return;
  const AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const GUN = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const SITE = "https://sadolayn.github.io/SadoDepo/";
  const nf = (x) => Number(x).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  const trNow = () => new Date(Date.now() + 3 * 3600e3); // UTC alanları Türkiye saatini verir
  const iso = (d) => d.toISOString().slice(0, 10);
  const fark = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5);
  const gunAy = (m) => { const d = new Date(m + "T12:00:00Z"); return `${d.getUTCDate()} ${AY[d.getUTCMonth()]}`; };
  const gunAyHafta = (m) => `${gunAy(m)} ${GUN[new Date(m + "T12:00:00Z").getUTCDay()]}`;
  const esc = Ortak.esc; // ortak.js
  // Türkçe ek: sayının okunuşundaki son kelimeye göre (%37'de, %35,5'ten, %37'ye, %40'a)
  function son(x) {
    const B = ["sıfır", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"], O = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
    let [a, k] = String(Number(x)).split("."), n = +(k || a);
    if (!k && n % 100 === 0 && n) return "yüz";
    n %= 100; return n % 10 ? B[n % 10] : n ? O[n / 10] : "sıfır";
  }
  function ek(x, tur) {
    const w = son(x), v = (w.match(/[aeıioöuü]/g) || ["a"]).pop(), on = "eiöü".includes(v), c = w.slice(-1);
    const sesli = "aeıioöuü".includes(c), sert = "çfhkpsşt".includes(c);
    if (tur === "e") return (sesli ? "y" : "") + (on ? "e" : "a");
    return (sert ? "t" : "d") + (on ? "e" : "a") + (tur === "den" ? "n" : "");
  }
  const yz = (x, tur) => `%${nf(x)}'${ek(x, tur)}`;
  let J = null, H = null, sonCekim = 0, yuk = false, hYuk = false, acik = null;

  function kararCumlesi(L) {
    const eski = L.rate - (L.change || 0), bp = Math.round(Math.abs(L.change || 0) * 100);
    if (!L.change) return { kisa: `politika faizini <b>${yz(L.rate, "de")} sabit</b> tuttu`, baslik: `TCMB politika faizini ${yz(L.rate, "de")} sabit tuttu`, uzun: `Politika faizi ${yz(L.rate, "de")} sabit tutuldu.`, bp: "" };
    const fiil = L.change < 0 ? ["indirdi", "indirildi"] : ["yükseltti", "yükseltildi"];
    return { kisa: `politika faizini <b>${yz(eski, "den")} ${yz(L.rate, "e")}</b> ${fiil[0]}`, baslik: `TCMB politika faizini ${yz(eski, "den")} ${yz(L.rate, "e")} ${fiil[0]}`,
      uzun: `Politika faizi ${yz(eski, "den")} ${yz(L.rate, "e")} ${fiil[1]} (${bp} baz puan).`, bp: `${bp} baz puan ${L.change < 0 ? "indirim" : "artış"}` };
  }
  function manset(m) {
    if (!H || !H.cats) return null;
    const alt = m + "T11:00:00Z";
    for (const c of ["ekonomi", "gundem"]) for (const x of H.cats[c] || [])
      if (x.d >= alt && /faiz/i.test(x.t) && /(PPK|Merkez Bankas|TCMB|politika faiz)/i.test(x.t)) return x;
    return null;
  }
  function paylas(txt) {
    window.Rapor && Rapor.bolum("ppk-paylas");
    if (navigator.share) { navigator.share({ text: txt }).catch(() => {}); return; }
    window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank", "noopener");
  }
  // Pencere: ayrıntı + paylaş
  function pencere(o) {
    ic.innerHTML = `<span class="pE${o.uy ? " uy" : ""}">${o.etiket}</span><div class="pT">${o.baslik}</div>${o.alt ? `<div class="pS">${o.alt}</div>` : ""}
      <div class="pB">${o.pay ? `<button type="button" class="ana" data-pay>📤 Paylaş</button>` : ""}${o.url ? `<a href="${esc(o.url)}" target="_blank" rel="noopener">${o.urlAd || "Kaynak"} ↗</a>` : ""}</div>
      <div class="pK">Kaynak: ${o.kaynak || "TCMB Para Politikası Kurulu"}. Bilgi amaçlıdır.</div>`;
    const b = ic.querySelector("[data-pay]"); if (b) b.onclick = () => paylas(o.pay);
    sh.hidden = false; window.Rapor && Rapor.bolum("kayan-ppk");
  }
  sh.addEventListener("click", (e) => { if (e.target === sh || e.target.closest(".x")) sh.hidden = true; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") sh.hidden = true; });
  const ver = (html, o) => { acik = o; Kayan.ppk(html ? { html, tap: () => pencere(acik) } : null); };

  function ciz() {
    if (!J) return;
    const t = trNow(), bugun = iso(t), dk = t.getUTCHours() * 60 + t.getUTCMinutes();
    const M = J.meetings || [], L = J.last || {};
    // Karar: karar günü, TCMB rakamları gelir gelmez (en geç 14:15) ertesi günün sonuna kadar
    const gec = M.filter((m) => { const k = fark(m, bugun); return (k === 0 && (dk >= 855 || (dk >= 840 && L.date === m && L.rate != null))) || k === 1; }).pop(); // karar verisi geldiyse 14:15'i beklemeden
    if (gec) {
      if (L.date === gec && L.rate != null) {
        const c = kararCumlesi(L), url = L.url || "https://www.tcmb.gov.tr/";
        const txt = `📣 TCMB faiz kararı · ${gunAy(gec)} ${gec.slice(0, 4)}\n${c.uzun}\nGecelik borç verme %${nf(L.lend)} · gecelik borçlanma %${nf(L.borrow)}\nKaynak: TCMB ${url}\n${SITE}`;
        ver(`<b class="tc">📣 TCMB</b>${c.kisa} <b class="gir">Paylaş</b>`, {
          etiket: `TCMB · PPK KARARI · ${gunAy(gec).toLocaleUpperCase("tr")}`, baslik: c.baslik,
          alt: `${c.bp ? `<b>${c.bp}</b><br>` : ""}Gecelik borç verme <b>%${nf(L.lend)}</b> · gecelik borçlanma <b>%${nf(L.borrow)}</b>`,
          pay: txt, url, urlAd: "TCMB duyurusu" });
        return;
      }
      if (!H && !hYuk) { hYuk = true; Ortak.json("data/haberler.json").then((x) => { H = x; ciz(); }).catch(() => {}); } // manşet yedeği
      const h = manset(gec);
      if (h) ver(`<b class="tc">📣 TCMB</b>PPK faiz kararı açıklandı: ${esc(h.t)} <b class="gir">Paylaş</b>`, {
        etiket: "TCMB · PPK KARARI AÇIKLANDI", baslik: `<a href="${esc(h.u)}" target="_blank" rel="noopener">${esc(h.t)}</a>`,
        alt: `${esc(h.s || "")} · TCMB rakamları birkaç dakika içinde burada`, pay: `📣 ${h.t}\n${h.u}\n${SITE}`, url: h.u, urlAd: "Haberi aç", kaynak: esc(h.s || "haber sitesi") });
      else ver(`<b class="tc">📣 TCMB</b>PPK faiz kararı açıklandı · rakamlar birkaç dakika içinde burada`, {
        etiket: "TCMB · PPK KARARI AÇIKLANDI", baslik: "Faiz kararı açıklandı", alt: "TCMB rakamları birkaç dakika içinde burada görünecek." });
      bekle(); return;
    }
    // Uyarı: toplantıdan 2 gün önce başlar
    const yak = M.find((m) => { const k = fark(bugun, m); return k >= 0 && k <= 2; });
    if (!yak) { ver(null); return; }
    const k = fark(bugun, yak), simdi = L.rate != null ? `Politika faizi şu an <b>%${nf(L.rate)}</b>` : "";
    const hat = `⏰ Hatırlatma: TCMB PPK faiz kararı ${gunAyHafta(yak)} saat 14:00'te açıklanacak.${L.rate != null ? ` Politika faizi şu an %${nf(L.rate)}.` : ""}\n${SITE}`;
    let satir, baslik;
    if (k === 2) { satir = `TCMB PPK faiz kararına <b>2 gün</b> kaldı · ${gunAyHafta(yak)}, saat 14:00`; baslik = "TCMB PPK faiz kararına 2 gün kaldı"; }
    else if (k === 1) { satir = `TCMB PPK faiz kararı <b>yarın</b> · ${gunAyHafta(yak)}, saat 14:00`; baslik = "TCMB PPK faiz kararı yarın"; }
    else if (dk < 840) { satir = `Bugün TCMB PPK günü · faiz kararı saat <b>14:00'te</b>`; baslik = "Bugün TCMB PPK günü"; }
    else { satir = `TCMB PPK faiz kararı açıklanıyor · ayrıntı <b>birkaç dakika içinde</b> burada`; baslik = "Faiz kararı açıklanıyor"; bekle(); }
    ver(`<b class="uy">⚠️ DİKKAT</b>${satir}`, { uy: true, etiket: "⚠️ DİKKAT · TCMB PPK", baslik,
      alt: `${gunAyHafta(yak)} · karar saat <b>14:00'te</b>, ayrıntısı açıklanır açıklanmaz burada${simdi ? "<br>" + simdi : ""}`,
      pay: hat, url: "https://www.tcmb.gov.tr/wps/wcm/connect/tr/tcmb+tr/main+menu/duyurular/takvim", urlAd: "TCMB takvimi" });
  }
  // Karar bekleniyorsa 2 dakikada bir yeni veri al
  function bekle() {
    if (yuk || Date.now() - sonCekim < 120e3) return;
    yuk = true; sonCekim = Date.now();
    Promise.all([Ortak.json("data/ppk.json").catch(() => J), Ortak.json("data/haberler.json").catch(() => H)])
      .then(([a, b]) => { J = a || J; H = b || H; }).finally(() => { yuk = false; ciz(); });
  }
  Ortak.json("data/ppk.json").then((j) => { J = j; sonCekim = Date.now(); ciz(); }).catch(() => {});
  setInterval(ciz, 30e3);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) ciz(); });
})();
} catch (e) { console.error("anasayfa: PPK kuralı (TCMB faiz kararı), kayan yazının en başında:", e); }

// ---- "YENİ" şeridi: sitede yeni tasarlanan bölümler. Her satır başlangıç (eski satır 2184) ----
try {
// "YENİ" şeridi: sitede yeni tasarlanan bölümler. Her satır başlangıç gününden itibaren 5 gün durur, sonra kendiliğinden kalkar.
// [simge, ad, kısa not, sitedeki yeri, başlangıç günü (YYYY-AA-GG)]
(function () {
  const GUN = 5;
  const YENI = [
    ["🏢", "Ticari Kazanç Hesabı", "Bankacılık'ta: bakiyeni ve oranı yaz, gecelik getiriyi gör", "banka.html#tkh", "2026-11-18"],
    ["📱", "Kolay Adres", "İşCep ipuçlarında: IBAN yerine cep numaranla para al", "isbank.html#iscep", "2026-11-18"],
    ["🔨", "Bölge Nabzı", "Büyük satışlar: bölgendeki icra, iflas ve taşınmaz satışı haberleri", "bolge.html", "2026-11-18"],
    ["📝", "Dilekçe Örnekleri", "Hesaplamalar'da: 55 hazır dilekçe: PDF ya da Word, ekrana imza, süre hatırlatıcısı", "dilekce.html", "2026-11-14"],
    ["↩️", "Geri · 🏠 · ↑", "sayfalarda aşağı inince sağ altta, kaydırma çubuğunun yanında; bilgisayarda 📱 Telefonda aç sol altta", "haberler.html", "2026-11-13"],
    ["🌓", "Görünüm", "artık takvimin hemen altında: Açık · Koyu · Sistem", "#datec", "2026-11-13"],
    ["🖥️", "Bilgisayarda", "ana sayfa ve 10 sayfa geniş ekranda iki sütun", "banka.html", "2026-11-11"],
    ["☕", "Sabah bandı", "bilgisayarda daha uzun: çeyrek, faiz, PPK, kampanya ve kurum duyurusu", "#acilis", "2026-11-13"],
    ["🧭", "Pusula", "Hesaplamalar'da: telefonu düz tut, yönünü gör", "hesap.html#pusula", "2026-11-06"],
    ["🏬", "Bölge Nabzı", "AVM & proje düğmesi: yerel firmaların mağaza ve proje haberleri", "bolge.html", "2026-11-06"],
    ["🌍", "Bölge Nabzı › Dünya", "24 ülkede ekonomi, ticaret ve gurbetçi haberleri", "bolge.html#dunya", "2026-11-05"],
    ["🚗", "Bölge Nabzı", "trafik kazası ve dolandırıcılık haberleri de bölgende", "bolge.html", "2026-11-05"],
    ["⭐", "Favorilerim", "sık kullandığın 8 aracı ana sayfaya sabitle", "#fav", "2026-11-05"],
    ["📍", "Bölge Nabzı", "ilini ya da ilçeni seç: atama, vefat, yatırım, konkordato…", "bolge.html", "2026-10-29"],
    ["🧭", "Yol Gösteren", "firmayı tanımak için resmî kaynaklar tek yerde", "firma.html", "2026-10-28"],
    ["💡", "Pratik", "Hesaplamalar'da kısayollar: yüzde, KDV, tarih, mesafe…", "hesap.html#klavye", "2026-10-27"],
    ["🎁", "Kampanyalar", "İş Bankası, Maximum ve Maximiles tek ekranda; arama ve \"Bana uygun\"", "isbank.html#maximum", "2026-10-29"],
  ];
  const bugun = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10); // İstanbul günü
  const son = (d) => new Date(Date.parse(d + "T00:00:00Z") + (GUN - 1) * 864e5).toISOString().slice(0, 10);
  const L = YENI.filter((x) => x[4] <= bugun && bugun <= son(x[4]));
  const kutu = document.getElementById("yeniS"), ser = document.getElementById("ysSer");
  if (!kutu || !ser || !L.length || document.documentElement.classList.contains("matem")) return; // matemde bu şerit gündem haberlerini taşır
  const esc = Ortak.esc; // ortak.js
  window.yeniTur = '<span style="display:inline-block;width:22px"></span>' + L.map(([e, ad, not, u]) => `<a href="${esc(u)}" data-r="${esc(ad)}">${e}<b>${esc(ad)}</b>${esc(not)}</a>`).join("") + `<span class="ysNot ysSon">sitede yeni ✦</span>`;
  const tur = (kutu.dataset.gundem && window.ustGundemTur || "") + window.yeniTur; // gündem sonradan gelirse ustSerit YENİ satırlarını arkasına ekler
  ser.innerHTML = tur + tur; // iki tur yan yana: kesintisiz döngü
  requestAnimationFrame(() => ser.style.setProperty("--sure", Math.max(28, Math.round(ser.scrollWidth / 2 / 40)) + "s"));
  kutu.hidden = false;
  // Tıklama sayımı (anonim): GoatCounter'da "bolum-index/yeni-<bölüm>"
  ser.addEventListener("click", (e) => { const a = e.target.closest("a[data-r]"); if (a && window.Rapor) Rapor.bolum("yeni-" + a.dataset.r); });
})();
} catch (e) { console.error("anasayfa: \"YENİ\" şeridi: sitede yeni tasarlanan bölümler. Her satır başlangıç", e); }

// ---- SON DAKİKA (11 Kasım 2026): data/son_dakika.json'daki gelişmeler (s (eski satır 2222) ----
try {
// SON DAKİKA (11 Kasım 2026): data/son_dakika.json'daki gelişmeler (scripts/son_dakika.py seçer: BDDK, SPK, MASAK, TCMB, Hazine,
// TMSF, Borsa İstanbul, TÜİK; en az 3 farklı güvenilir kaynak ya da resmî duyuru; 12 saat kalır). Varsa üst şerit kırmızı altyazıya döner,
// yoksa YENİ şeridi olduğu gibi kalır. Başlık kaynağın kendi başlığıdır; dokununca haberin kaynağı yeni sekmede açılır.
(function () {
  const kutu = document.getElementById("yeniS"), ser = document.getElementById("ysSer");
  if (!kutu || !ser || !window.Ortak || document.documentElement.classList.contains("matem")) return;
  const esc = Ortak.esc; // ortak.js
  const saat = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }); };
  Ortak.json("data/son_dakika.json").then((j) => {
    const simdi = Date.now();
    const L = ((j && j.haberler) || []).filter((x) => x && x.t && /^https:\/\//.test(x.u || "") && new Date(x.son) > simdi).slice(0, 3);
    if (!L.length) return;
    const tur = '<span style="display:inline-block;width:22px"></span>' + L.map((x) =>
      `<a href="${esc(x.u)}" target="_blank" rel="noopener" data-sd="${esc(x.k || "")}">${esc(x.t)}<small>${esc(x.s)}${x.n >= 3 ? " · " + x.n + " kaynak" : ""}${x.d ? " · " + saat(x.d) : ""} ↗</small></a>`).join("");
    // Arkasından gündem satırları (bugünkü Resmî Gazete, önemli kurum duyuruları) geçer; sonradan gelirse ustSerit ekler
    window.sdTur = tur; const gd = window.ustGundemTur || "";
    ser.innerHTML = tur + gd + tur + gd;
    kutu.classList.add("sd"); kutu.hidden = false; kutu.setAttribute("aria-label", "Son dakika");
    kutu.querySelector(".ysEt").innerHTML = "<i></i>SON DAKİKA";
    requestAnimationFrame(() => ser.style.setProperty("--sure", Math.max(24, Math.round(ser.scrollWidth / 2 / 45)) + "s"));
    ser.addEventListener("click", (e) => { const a = e.target.closest("a[data-sd]"); if (a && window.Rapor) Rapor.bolum("sondakika-" + a.dataset.sd); });
  }).catch(() => {});
})();
} catch (e) { console.error("anasayfa: SON DAKİKA (11 Kasım 2026): data/son_dakika.json'daki gelişmeler (s", e); }

// ---- İş Bankası Gündemi kartında canlı satır: güncel kampanya sayısı (üç (eski satır 2245) ----
try {
// İş Bankası Gündemi kartında canlı satır: güncel kampanya sayısı (üç site; iki sitede birden yayımlanan bir kez) ve yeni gelenler.
// Veri her sabah toplanan isbank/kampanya_hepsi.json; alınamazsa satır gizli kalır.
(function () {
  var el = document.getElementById("isbCanli"); if (!el || !window.fetch) return;
  var ayni = function (t) { return (t || "").toLocaleLowerCase("tr").replace(/[’'`]/g, "").replace(/[çğıöşüâîû]/g, function (h) { return { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" }[h]; }).replace(/[^a-z0-9%]/g, ""); };
  var gun = function (once) { return new Date(Date.now() + 3 * 3600e3 - once * 864e5).toISOString().slice(0, 10); }; // İstanbul günü
  Ortak.json("isbank/kampanya_hepsi.json").then(function (K) {
    var bugun = gun(0), uc = gun(4), G = {}; // son 5 gün
    ["isbank", "maximum", "maximiles"].forEach(function (kay) {
      var S = K[kay] || {};
      Object.keys(S).forEach(function (sg) {
        var v = S[sg] || {}, L = v.kampanyalar || [].concat.apply([], (v.kategoriler || []).map(function (c) { return c.kampanyalar || []; }));
        L.forEach(function (k) {
          if (!k || !k.baslik || (k.bitis && k.bitis < bugun)) return;
          var a = k.es || ayni(k.baslik), ilk = k.ilk && k.ilk > "2000-01-01" ? k.ilk : "0";
          if (!(a in G) || ilk < G[a]) G[a] = ilk; // aynı kampanya birden çok yerdeyse ilk görüldüğü gün
        });
      });
    });
    var n = 0, yb = 0, y3 = 0;
    Object.keys(G).forEach(function (a) { n++; if (G[a] === bugun) yb++; if (G[a] >= uc) y3++; });
    if (!n) return;
    el.innerHTML = '<span data-git="maximum">🎁 <b>' + n.toLocaleString("tr-TR") + "</b> farklı kampanya</span>" + (y3 ? '<span class="y" data-git="yeni">🆕 son 5 günde <b>' + y3 + "</b> yeni" + (yb ? " · bugün <b>" + yb + "</b>" : "") + "</span>" : "") // açılan "Yeni gelenler" listesiyle aynı sayı;
    el.hidden = false;
    // Etikete dokununca: sayı Kampanyalar'a, "yeni" Kampanyalar › Yeni gelenler'e götürür (kartın geri kalanı İş Bankası Gündemi'ni açar)
    el.addEventListener("click", function (e) { var s = e.target.closest("[data-git]"); if (!s) return; e.preventDefault(); location.href = "isbank.html#" + s.dataset.git; });
  }).catch(function () {});
})();
} catch (e) { console.error("anasayfa: İş Bankası Gündemi kartında canlı satır: güncel kampanya sayısı (üç", e); }

// ---- Özel gün açılışı: bugün 29 Ekim ise ana sayfaya ilk girişte (günde (eski satır 2275) ----
try {
// Özel gün açılışı: bugün 29 Ekim ise ana sayfaya ilk girişte (günde bir kez) bayrak, Atatürk ve sözü; dokununca ya da 12 sn sonra kapanır.
// ?ata ile her zaman denenebilir. Hareketi azaltmayı seçenlere gösterilmez.
(function () {
  var t = new Date(Date.now() + 3 * 3600e3), gun = t.toISOString().slice(0, 10), md = gun.slice(5);
  var TRB = '<svg class="trb" viewBox="0 0 30 20" aria-label="Türk bayrağı" role="img"><rect width="30" height="20" fill="#E30A17"/><circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="12.25" cy="10" r="4" fill="#E30A17"/><polygon fill="#fff" points="14.80,10.00 16.49,9.41 16.53,7.62 17.61,9.05 19.32,8.53 18.30,10.00 19.32,11.47 17.61,10.95 16.53,12.38 16.49,10.59"/></svg>';
  var OZEL = { "10-29": TRB + " Cumhuriyet Bayramımız kutlu olsun" };
  var zorla = /[?&]ata\b/.test(location.search), not = OZEL[md] || (zorla ? OZEL["10-29"] : "");
  if (!not || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try { if (!zorla && localStorage.getItem("anaOzel") === gun) return; localStorage.setItem("anaOzel", gun); } catch (e) {}
  if (zorla) history.replaceState(null, "", location.pathname + location.hash);
  var el = document.createElement("div"); el.className = "ataIntro";
  // 29 Ekim: altında Cumhuriyet'in kaçıncı yılı (1923'ten bu yana), altın satır
  var yil = md === "10-29" || zorla ? t.getUTCFullYear() - 1923 : 0;
  el.innerHTML = '<div class="aiTop"></div><div class="aiOzel">' + not + '</div>' + (yil ? '<div class="aiYil"><i></i><span>1923 – ' + t.getUTCFullYear() + ' · ' + yil + '. yıl</span><i></i></div>' : "") +
    '<div class="aiImg"><span class="aiGlow"></span><img src="img/ataturk.jpg" alt="Mustafa Kemal Atatürk" decoding="async"></div>' +
    '<blockquote class="aiQ">Sermayenin azlığına bakarak cesaretiniz kırılmasın! Böyle kurumlar için en kuvvetli sermaye; zekâ, dikkat, iffettir; teknik ve metodik çalışmasını bilmektir. Bu inançla işe sarılınız, mutlaka başarırsınız!<cite>Mustafa Kemal Atatürk</cite></blockquote>' +
    '<button type="button" class="aiSkip">Geç ›</button><div class="aiImza">Sadolayn</div>';
  document.body.appendChild(el); document.documentElement.style.overflow = "hidden";
  var bitti = false, z = [], kapat = function () { if (bitti) return; bitti = true; z.forEach(clearTimeout); el.classList.add("out"); document.documentElement.style.overflow = ""; setTimeout(function () { el.remove(); }, 900); };
  el.addEventListener("click", kapat);
  var img = el.querySelector("img"), basla = function () { if (el.classList.contains("go")) return; el.classList.add("go"); z.push(setTimeout(kapat, 12500)); };
  if (img.complete && img.naturalWidth) basla(); else { img.addEventListener("load", basla); img.addEventListener("error", kapat); z.push(setTimeout(basla, 4000)); }
})();
} catch (e) { console.error("anasayfa: Özel gün açılışı: bugün 29 Ekim ise ana sayfaya ilk girişte (günde", e); }

// ---- Bölgem'de son bakılan yer varsa satırın açıklamasında görünür (yaln (eski satır 2300) ----
try {
// Bölgem'de son bakılan yer varsa satırın açıklamasında görünür (yalnızca bu cihazdaki seçim)
(function () {
  try {
    var y = JSON.parse(localStorage.getItem("bolgem") || localStorage.getItem("haber_yerel2") || "null"), ad = y && [y.elle || y.ilce, y.il].filter(Boolean).join(", ");
    var d = document.getElementById("bolgemD"); if (!ad || !d) return;
    d.textContent = ""; var b = document.createElement("b"); b.style.color = "#ffdcc4"; b.textContent = ad;
    d.appendChild(b); d.appendChild(document.createTextNode(" · atama, vefat, yatırım, konkordato ve bölgedeki bankalar"));
  } catch (e) {}
})();
} catch (e) { console.error("anasayfa: Bölgem'de son bakılan yer varsa satırın açıklamasında görünür (yaln", e); }

// ---- Ana sayfa: anlık arama (alt başlıklar dahil) + Tüm araçlar A-Z + Fa (eski satır 2311) ----
try {
/* Ana sayfa: anlık arama (alt başlıklar dahil) + Tüm araçlar A-Z + Favorilerim (en fazla 8, yalnızca bu cihazda saklanır)
   Yeni bir sekme/bölüm eklenince ALT listesine bir satır eklemek yeter: [başlık, ana bölüm, adres, simge, ek arama kelimeleri] */
(function () {
  var nav = document.querySelector("nav.mn"); if (!nav) return;
  var $ = function (id) { return document.getElementById(id); };
  var q = $("araQ"), sil = $("araSil"), yok = $("araYok"), favS = $("fav"), favL = $("favL"), favIp = $("favIp"), duz = $("favDuz");
  var altL = $("altL"), azP = $("azP"), azBtn = $("azBtn"), msg = $("altMsg");
  var ALT = [
    ["Vadeli Mevduat Getirisi", "Bankacılık", "banka.html#mev", "💰", "mevduat faiz stopaj vade"],
    ["Tüketici Kredisi", "Bankacılık", "banka.html#tk", "🛍️", "ihtiyaç kredisi taksit"],
    ["Ek Hesap Faizi", "Bankacılık", "banka.html#ek", "➕", "kmh kredili mevduat taksitli ek hesap"],
    ["Kredi Kartı Gecikme Faizi", "Bankacılık", "banka.html#kk", "💳", "kart gecikme"],
    ["Konut Kredisi", "Bankacılık", "banka.html#konut", "🏠", "ev ekspertiz"],
    ["Taşıt Kredisi", "Bankacılık", "banka.html#tasit", "🚗", "araba araç"],
    ["BCH Rotatif Kredi", "Bankacılık", "banka.html#bch", "🔄", "rotatif"],
    ["Taksitli Ticari Kredi", "Bankacılık", "banka.html#tic", "📦", "ticari esnaf"],
    ["Çek İskonto & Valör", "Bankacılık", "banka.html#cek", "🧾", "iştira valör takvimi"],
    ["Tarım Kredisi", "Bankacılık", "banka.html#tarim", "🌾", "çiftçi"],
    ["Hesap Makinesi", "Hesaplamalar", "hesap.html#calc", "🧮", ""],
    ["Cetvel", "Hesaplamalar", "hesap.html#cetvel", "📏", "ölçü"],
    ["Mesafe Ölçme", "Hesaplamalar", "hesap.html#mesafe", "📐", "uzaklık"],
    ["Faiz Hesabı", "Hesaplamalar", "hesap.html#faiz", "💵", ""],
    ["Tarih Hesabı", "Hesaplamalar", "hesap.html#tarih", "📆", "iki tarih arası gün ekle çıkar"],
    ["Yüzde, KDV & Tapu Harcı", "Hesaplamalar", "hesap.html#yuzde", "％", "ötv vergi tapu harcı"],
    ["Pratik Kısayollar", "Hesaplamalar", "hesap.html#klavye", "💡", "emoji alt kodu altgr klavye"],
    ["Sayı Bulmaca", "Oyunlar", "bulmaca.html", "🔢", "oyun"],
    ["Pusula", "Hesaplamalar", "hesap.html#pusula", "🧭", "yön kuzey kıble"],
    ["Dilekçe Örnekleri", "Hesaplamalar", "dilekce.html", "📝", "dilekçe istifa izin nakil şikayet kvkk itiraz belediye okul vergi"],
    ["Kaza Tutanağı", "Hesaplamalar", "kaza.html", "🚗", "kaza tespit tutanağı trafik sigorta hasar kroki anlaşmalı"],
    ["Kampanyalar", "İş Bankası Gündemi", "isbank.html#maximum", "🎁", "maximum maximiles"],
    ["Yeni Kampanyalar", "İş Bankası Gündemi", "isbank.html#yeni", "🆕", "son eklenen"],
    ["Kampanya Takvimi", "İş Bankası Gündemi", "isbank.html#ktakvim", "⏳", "bitiş"],
    ["İşCep İpuçları", "İş Bankası Gündemi", "isbank.html#iscep", "📲", "mobil"],
    ["İş Black", "İş Bankası Gündemi", "isbank.html#black", "🖤", "maximiles black lounge"],
    ["İş Plus", "İş Bankası Gündemi", "isbank.html#isplus", "➕", ""],
    ["İş Bankası Haberleri", "İş Bankası Gündemi", "isbank.html#guncel", "📰", "güncel"],
    ["KAP Bildirimleri", "İş Bankası Gündemi", "isbank.html#kap", "📢", "kamuyu aydınlatma"],
    ["Atamalar", "İş Bankası Gündemi", "isbank.html#atamalar", "👔", "genel müdür yardımcısı"],
    ["Videolar", "İş Bankası Gündemi", "isbank.html#video", "🎬", ""],
    ["Şubeler", "İş Bankası Gündemi", "isbank.html#subeler", "📍", "şube adres"],
    ["Kartsız Öde", "İş Bankası Gündemi", "isbank.html#kartsiz", "💳", ""],
    ["Pazarama", "İş Bankası Gündemi", "isbank.html#pazarama", "🛒", ""],
    ["Medya", "İş Bankası Gündemi", "isbank.html#medya", "📣", "reklam"],
    ["Tarihçe", "İş Bankası Gündemi", "isbank.html#tarihce", "🏛️", "tarih atatürk"],
    ["Günün Sorusu", "İş Bankası Gündemi", "isbank.html#soru", "❓", "bilgi yarışması"],
    ["COP31 Programı", "İş Bankası Gündemi", "cop31.html", "🌍", "cop31 iklim zirvesi antalya oturum panel konuşmacı takvim"],
    ["Kurum Duyuruları", "Resmî Gazete", "gazete.html#kurum", "🏛️", "bddk tcmb spk masak tmsf ticaret bakanlığı merkez bankası düzenleyici kurum duyuru karar genelge"], // 8 Kasım 2026: bir ziyaretçi BDDK/TCMB duyurularını aramayla bulamadığını yazmıştı
    ["Ajanda", "Takvim & Ajanda", "takvim.html#ajanda", "📝", "ziyaret toplantı izin"],
    ["Vergi Takvimi", "Takvim & Ajanda", "takvim.html#vergi", "🧾", "beyanname son gün"],
    ["İş Günü Hesabı", "Takvim & Ajanda", "takvim.html#hesap", "🗓️", "iki tarih arası"],
    ["Yıllık Takvim", "Takvim & Ajanda", "takvim.html#yil", "📅", "tatil bayram"],
    ["Eczane", "En Yakınımda", "yakin.html#eczane", "💊", "nöbetçi"],
    ["Hastane", "En Yakınımda", "yakin.html#hastane", "🏥", "acil"],
    ["İş Bankası Şubesi", "En Yakınımda", "yakin.html#isbank", "🏦", "şube"],
    ["İş Bankası ATM", "En Yakınımda", "yakin.html#isatm", "🏧", "atm bankamatik"],
    ["Tüm ATM'ler", "En Yakınımda", "yakin.html#atm", "🏧", "bankamatik"],
    ["Toplanma Alanı", "En Yakınımda", "yakin.html#toplanma", "🟩", "deprem afad"],
    ["Akaryakıt", "En Yakınımda", "yakin.html#akaryakit", "⛽", "benzin"],
    ["Batak", "Oyunlar", "batak.html", "♠️", "kart"],
    ["King", "Oyunlar", "king.html", "👑", "kart"],
    ["Balayı King", "Oyunlar", "balayi.html", "💞", "kart iki kişilik"],
    ["Tavla", "Oyunlar", "tavla.html", "🎲", ""],
    ["Solitaire", "Oyunlar", "solitaire.html", "🃏", "kart"],
    ["UçUç", "Oyunlar", "pilot.html", "✈️", ""],
    ["Sayı Bilmecesi", "Oyunlar", "bilmece.html", "🧩", "bulmaca"],
    ["Asal Tahmin", "Oyunlar", "tahmin.html", "🔮", ""],
    ["Satranç", "Oyunlar", "satranc.html", "♟️", "satranc chess şah mat"],
    ["Amiral Battı", "Oyunlar", "amiral.html", "⚓", "amiral batti gemi savaş"],
    ["Solo Test", "Oyunlar", "solotest.html", "🔘", "solo test piyon zeka"]
  ];
  var norm = function (t) { return String(t || "").replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase()
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a").replace(/î/g, "i").replace(/[^a-z0-9 ]+/g, " "); };
  var KART = [].slice.call(nav.querySelectorAll("a.one, a.row, a.tile")).filter(function (a) { return !a.closest("#fav"); });
  var baslik = function (a) { var t = a.querySelector(".t"); return t ? t.childNodes[0].textContent.trim() : ""; };
  // Tek katalog: ana kartlar + alt başlıklar (adres anahtardır)
  var KAT = {};
  KART.forEach(function (a) {
    var d = a.querySelector(".d"), ik = a.querySelector(".ik"), h = a.getAttribute("href");
    a._ara = norm(baslik(a) + " " + (d ? d.textContent : "") + " " + (a.getAttribute("data-ara") || ""));
    KAT[h] = { ad: baslik(a), ust: "", h: h, ik: (ik && ik.textContent.trim()) || "🏛️", ana: true };
    var y = document.createElement("span"); y.className = "yld"; y.setAttribute("aria-hidden", "true"); y.textContent = "☆"; a.appendChild(y);
  });
  ALT.forEach(function (x) { KAT[x[2]] = { ad: x[0], ust: x[1], h: x[2], ik: x[3], ara: norm(x[0] + " " + x[1] + " " + x[4]), adN: norm(x[0]) }; });
  // --- Favoriler
  var KEY = "anaFav", MAX = 8, F = [];
  try { F = JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (e) {}
  F = F.filter(function (h) { return KAT[h]; }).slice(0, MAX);
  function kaydet() { try { localStorage.setItem(KEY, JSON.stringify(F)); } catch (e) {} }
  function uyar(t) { msg.textContent = t; msg.hidden = !t; clearTimeout(uyar.t); if (t) uyar.t = setTimeout(function () { msg.hidden = true; }, 3500); }
  function degis(h) {
    var i = F.indexOf(h);
    if (i > -1) F.splice(i, 1);
    else if (F.length >= MAX) { uyar("En fazla 8 favori olabilir; önce birini çıkar ⭐"); favIp.hidden = false; favIp.textContent = "En fazla 8 favori olabilir; önce birini çıkar ⭐"; return false; }
    else F.push(h);
    kaydet(); ciz(); return true;
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function satir(k) { // arama sonucu ve A-Z satırı: bağlantı + yıldız
    var r = el("div", "alt"), a = el("a"); a.href = k.h;
    var i = el("i", "", k.ik); i.setAttribute("aria-hidden", "true");
    var sp = el("span"); sp.appendChild(el("b", "", k.ad)); sp.appendChild(el("small", "", k.ust || "Ana bölüm"));
    a.appendChild(i); a.appendChild(sp); r.appendChild(a);
    var b = el("button", "yb"); b.type = "button"; b.setAttribute("data-fav", k.h); r.appendChild(b);
    return r;
  }
  function yildizlar() {
    [].forEach.call(document.querySelectorAll(".alt .yb"), function (b) {
      var h = b.getAttribute("data-fav"), on = F.indexOf(h) > -1, ad = KAT[h] ? KAT[h].ad : "";
      b.textContent = on ? "★" : "☆"; b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-label", ad + (on ? ": favorilerden çıkar" : ": favorilere ekle"));
    });
  }
  function ciz() {
    favL.textContent = "";
    F.forEach(function (h) {
      var k = KAT[h]; if (!k) return;
      var c = el("a", "fv"); c.href = h;
      var i = el("i", "", k.ik); i.setAttribute("aria-hidden", "true");
      var sp = el("span"); sp.appendChild(el("b", "", k.ad)); if (k.ust) sp.appendChild(el("small", "", k.ust));
      c.appendChild(i); c.appendChild(sp);
      // Düzenleme açıkken kartın köşesinde ✕: dokununca favoriden çıkar (4 Kasım 2026: çıkarma yolu görünmüyordu)
      var x = el("button", "fvx", "✕"); x.type = "button"; x.setAttribute("data-fvx", h); x.setAttribute("aria-label", k.ad + " favorilerden çıkar"); c.appendChild(x);
      favL.appendChild(c);
    });
    var acik = document.body.classList.contains("favDuz");
    favIp.hidden = !acik && F.length > 0;
    favIp.innerHTML = acik ? "Sabitlemek istediğin araçlara dokun (en fazla 8); çıkarmak için favorideki <b>✕</b>'e dokun. Alt başlıklar için aramadaki ☆'a dokun. Bitince <b>Tamam</b>'a dokun."
      : "Sık kullandığın 8 aracı buraya sabitle: <b>Seç</b>'e dokun, sonra araçlara dokun. Aramadaki ☆ ile alt başlıkları da ekleyebilirsin.";
    duz.textContent = acik ? "Tamam ✓" : (F.length ? "Düzenle" : "Seç");
    duz.setAttribute("aria-pressed", acik ? "true" : "false");
    KART.forEach(function (a) {
      var on = F.indexOf(a.getAttribute("href")) > -1; a.classList.toggle("secili", on);
      a.querySelector(".yld").textContent = on ? "★" : "☆";
      if (acik) a.setAttribute("aria-pressed", on ? "true" : "false"); else a.removeAttribute("aria-pressed");
    });
    yildizlar();
  }
  // --- Arama: ana kartları süzer, eşleşen alt başlıkları üstte "Doğrudan git" listesinde gösterir
  function ara() {
    var k = norm(q.value).split(" ").filter(Boolean), say = 0, son = null;
    sil.hidden = !q.value;
    if (k.length && !azP.hidden) azKapa();
    KART.forEach(function (a) {
      var ok = !k.length || k.every(function (w) { return a._ara.indexOf(w) > -1; });
      a.classList.toggle("gizli", !ok); if (ok) { say++; son = a; }
    });
    nav.querySelectorAll(".rows, .tiles").forEach(function (g) {
      var bos = !g.querySelector("a:not(.gizli)"), h = g.previousElementSibling;
      g.classList.toggle("gizli", bos); if (h && h.tagName === "H2") h.classList.toggle("gizli", bos);
    });
    favS.classList.toggle("gizli", k.length > 0);
    altL.textContent = "";
    var bul = !k.length ? [] : ALT.map(function (x) { return KAT[x[2]]; }).filter(function (x) { return k.every(function (w) { return x.ara.indexOf(w) > -1; }); });
    bul.sort(function (a, b) { // adında geçenler önce, sonra alfabetik
      var pa = k.every(function (w) { return a.adN.indexOf(w) > -1; }) ? 0 : 1, pb = k.every(function (w) { return b.adN.indexOf(w) > -1; }) ? 0 : 1;
      return pa - pb || a.ad.localeCompare(b.ad, "tr");
    });
    bul = bul.slice(0, 8);
    if (bul.length) { altL.appendChild(el("div", "altB", "Doğrudan git")); bul.forEach(function (x) { altL.appendChild(satir(x)); }); yildizlar(); }
    altL.hidden = !bul.length;
    yok.hidden = !k.length || say > 0 || bul.length > 0;
    if (bul.length + say === 1) return bul[0] ? bul[0].h : son.href;
    return null;
  }
  q.addEventListener("input", ara);
  // Sonuç yoksa çıkan "sık arananlar" çipleri: dokununca o kelimeyle aranır
  yok.addEventListener("click", function (e) { var b = e.target.closest("button[data-q]"); if (!b) return; q.value = b.dataset.q; ara(); q.focus(); });
  q.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { q.value = ""; ara(); }
    if (e.key === "Enter") { var t = ara(); if (t) location.href = t; else q.blur(); }
  });
  sil.addEventListener("click", function () { q.value = ""; ara(); q.focus(); });
  // --- Tüm araçlar A-Z
  function azKapa() { azP.hidden = true; azP.textContent = ""; azBtn.setAttribute("aria-expanded", "false"); azBtn.textContent = "🔤 Tüm araçlar A-Z ›"; }
  azBtn.addEventListener("click", function () {
    if (!azP.hidden) { azKapa(); return; }
    if (q.value) { q.value = ""; ara(); }
    var L = Object.keys(KAT).map(function (h) { return KAT[h]; }).sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); });
    var harf = "";
    L.forEach(function (x) {
      var h = x.ad.charAt(0).toLocaleUpperCase("tr");
      if (!/[A-ZÇĞİÖŞÜ]/.test(h)) h = "#";
      if (h !== harf) { harf = h; azP.appendChild(el("div", "altB", h)); }
      azP.appendChild(satir(x));
    });
    var kp = el("button", "azKapat", "Listeyi kapat ✕"); kp.type = "button"; kp.onclick = function () { azKapa(); azBtn.scrollIntoView({ block: "center" }); };
    azP.appendChild(kp);
    azP.hidden = false; azBtn.setAttribute("aria-expanded", "true"); azBtn.textContent = "🔤 Tüm araçlar A-Z ✕";
    yildizlar();
  });
  // Yıldız düğmeleri (arama sonuçları ve A-Z)
  favL.addEventListener("click", function (e) {
    var x = e.target.closest("[data-fvx]"); if (!x) return;
    e.preventDefault(); e.stopPropagation();
    var h = x.getAttribute("data-fvx"), ad = KAT[h] ? KAT[h].ad : "";
    if (degis(h)) uyar(ad + " favorilerden çıkarıldı");
  });
  nav.addEventListener("click", function (e) {
    var b = e.target.closest(".yb"); if (!b) return;
    e.preventDefault();
    var h = b.getAttribute("data-fav"), on = F.indexOf(h) > -1;
    if (degis(h)) uyar(on ? "Favorilerden çıkarıldı" : "⭐ " + KAT[h].ad + " favorilere eklendi");
  });
  duz.addEventListener("click", function () {
    document.body.classList.toggle("favDuz");
    if (q.value) { q.value = ""; ara(); }
    ciz();
  });
  nav.addEventListener("click", function (e) {
    if (!document.body.classList.contains("favDuz")) return;
    var a = e.target.closest("a"); if (!a || KART.indexOf(a) < 0) return;
    e.preventDefault(); e.stopPropagation();
    degis(a.getAttribute("href"));
  }, true);
  ciz();
})();
} catch (e) { console.error("anasayfa: Ana sayfa: anlık arama (alt başlıklar dahil) + Tüm araçlar A-Z + Fa", e); }

// ---- C düzeni kutucukları (15 Kasım 2026). Veriler sitenin kendi dosyala (eski satır 2529) ----
try {
// C düzeni kutucukları (15 Kasım 2026). Veriler sitenin kendi dosyalarından: data/ppk.json, data/piyasa.json, isbank/kampanya_hepsi.json.
// Tatil ve iş günü hesabı takvimdeki resmî tatillerle aynı (sabit günler + Diyanet'e göre dinî bayramlar); arife öğleden sonra yarım gün.
(function () {
  var $ = function (i) { return document.getElementById(i); };
  if (!$("pnl")) return;
  var GUN = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"], GK = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"],
    AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var ymd = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  var ekle = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  var fark = function (a, b) { return Math.round((b - a) / 864e5); };
  var tr = function (v, k) { return Number(v).toLocaleString("tr-TR", { minimumFractionDigits: k, maximumFractionDigits: k }); };
  var bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  var SABIT = { "01-01": "Yılbaşı", "04-23": "23 Nisan", "05-01": "1 Mayıs", "05-19": "19 Mayıs", "07-15": "15 Temmuz", "08-30": "Zafer Bayramı", "10-29": "Cumhuriyet Bayramı" };
  var DINI = { "2026-03-20": [3, "Ramazan Bayramı"], "2026-05-27": [4, "Kurban Bayramı"], "2027-03-09": [3, "Ramazan Bayramı"], "2027-05-16": [4, "Kurban Bayramı"],
    "2028-02-26": [3, "Ramazan Bayramı"], "2028-05-05": [4, "Kurban Bayramı"], "2029-02-14": [3, "Ramazan Bayramı"], "2029-04-24": [4, "Kurban Bayramı"] };
  var TAM = {}, ARIFE = {};
  for (var y = bugun.getFullYear() - 1; y <= bugun.getFullYear() + 2; y++) { for (var md in SABIT) TAM[y + "-" + md] = SABIT[md]; ARIFE[y + "-10-28"] = "Cumhuriyet Bayramı arifesi"; }
  Object.keys(DINI).forEach(function (b) { var bd = new Date(b + "T00:00:00"); for (var i = 0; i < DINI[b][0]; i++) { var k = ymd(ekle(bd, i)); TAM[k] = TAM[k] || DINI[b][1]; } var a = ymd(ekle(bd, -1)); if (!TAM[a]) ARIFE[a] = DINI[b][1] + " arifesi"; });
  var hs = function (d) { return d.getDay() === 0 || d.getDay() === 6; };
  var izin = function (d) { return hs(d) || !!TAM[ymd(d)]; };

  // Çeyrek: kalan iş günü (bugün dahil). Arife yarım gündür, 0,5 sayılır (22 Kasım 2026; Açılış kartındaki çeyrek sayısıyla aynı)
  var ay = bugun.getMonth(), cb = new Date(bugun.getFullYear(), ay - ay % 3, 1), cs = new Date(bugun.getFullYear(), ay - ay % 3 + 3, 0), top = 0, kal = 0;
  for (var x = new Date(cb); x <= cs; x = ekle(x, 1)) if (!izin(x)) { var dg = ARIFE[ymd(x)] ? 0.5 : 1; top += dg; if (x >= bugun) kal += dg; }
  $("cyN").innerHTML = tr(kal, kal % 1 ? 1 : 0) + "<small>gün</small>";
  $("cyBas").textContent = cb.getDate() + " " + AY[cb.getMonth()]; $("cyBit").textContent = cs.getDate() + " " + AY[cs.getMonth()];
  requestAnimationFrame(function () { setTimeout(function () { $("cyB").style.width = Math.round((top - kal) / top * 100) + "%"; }, 50); });

  // Tatile kalan: hafta içine denk gelen ilk resmî tatil; hafta sonuyla birleşen toplam izin
  var L = [];
  for (var i = 0; i < 500 && L.length < 4; i++) {
    var d = ekle(bugun, i), ad = TAM[ymd(d)]; if (!ad || (i > 0 && TAM[ymd(ekle(d, -1))] === ad)) continue;
    var bas = d, son = d; while (izin(ekle(bas, -1))) bas = ekle(bas, -1); while (izin(ekle(son, 1))) son = ekle(son, 1);
    var ig = 0; for (var z = new Date(d); z <= son; z = ekle(z, 1)) if (TAM[ymd(z)] && !hs(z)) ig++;
    L.push({ ad: ad, gun: d, bas: bas, son: son, sure: fark(bas, son) + 1, kalan: i, ig: ig });
  }
  var t = L.filter(function (o) { return o.ig > 0; })[0] || L[0];
  if (t) {
    $("ttN").innerHTML = t.kalan === 0 ? "Bugün" : t.kalan + "<small>gün</small>";
    $("ttAd").textContent = t.ad;
    var ar = ARIFE[ymd(ekle(t.bas, -1))] && !hs(ekle(t.bas, -1));
    $("ttA").textContent = t.gun.getDate() + " " + AY[t.gun.getMonth()] + " " + GUN[t.gun.getDay()] + " · " + (t.sure > t.ig ? "hafta sonuyla " : "") + t.sure + " gün tatil" + (ar ? " · arife yarım gün" : "");
    var p = ekle(t.bas, -((t.bas.getDay() + 6) % 7)), h = "", n = 0;
    for (var w = new Date(p); (w <= t.son || w.getDay() !== 1) && n < 14; w = ekle(w, 1), n++) {
      var k = ymd(w), c = TAM[k] ? "tt" : ARIFE[k] && !hs(w) ? "ar" : hs(w) ? "hs" : "";
      h += '<div class="' + c + '" title="' + (TAM[k] || ARIFE[k] || "") + '">' + GK[w.getDay()] + "<b>" + w.getDate() + "</b></div>";
    }
    $("ttH").innerHTML = h;
    $("ttS").innerHTML = L.filter(function (o) { return o !== t && o.ig > 0; }).slice(0, 2).map(function (o) { return "<span>" + o.ad + " <b>" + o.kalan + " gün</b> · " + o.sure + " gün tatil</span>"; }).join("");
  }

  // Tatile kalan (22 Kasım 2026): artık "Tek bakışta" kutucuklarının altında ince bir şerit (index.html'de #pnl içinde);
  // önceki sürümde telefonda Cebindeki araçlar'ın altında, PC'de Mola sütunundaydı ve sayfanın ortasında büyük yer kaplıyordu.

  // "Ana ekranına ekle" hatırlatması; dokununca alttaki mevcut kurulum düğmesini çalıştırır (aynı yönergeler)
  (function () {
    var h = $("kurHat"), kur = $("kur"); if (!h || !kur) return;
    try {
      var n = (+localStorage.getItem("sGelis") || 0) + 1; localStorage.setItem("sGelis", n);
      var kapali = +localStorage.getItem("sKurHat") || 0;
      if (matchMedia("(display-mode: standalone)").matches || navigator.standalone || /kaynak=uygulama/.test(location.search) || n < 2 || Date.now() - kapali < 30 * 864e5) return;
    } catch (e) { return; }
    h.hidden = false;
    var kapat = function () { h.hidden = true; try { localStorage.setItem("sKurHat", Date.now()); } catch (e) {} };
    $("kurHatKapat").onclick = function () { if (window.Rapor) Rapor.bolum("kur-hatirlat-kapat"); kapat(); };
    $("kurHatAc").onclick = function () { if (window.Rapor) Rapor.bolum("kur-hatirlat-ac"); kapat(); kur.click(); setTimeout(function () { var y = $("kurYardim"); if (y && !y.hidden) y.scrollIntoView({ behavior: "smooth", block: "center" }); }, 150); };
  })();
  // Saha Radarı kullanım sayımı (anonim): ana sayfadaki karta ve menü satırına dokunma
  [].forEach.call(document.querySelectorAll('a.pk.sah, a.row[href="saha.html"]'), function (a) { a.addEventListener("click", function () { if (window.Rapor) Rapor.bolum(a.classList.contains("pk") ? "saha-kart" : "saha-satir"); }); });

  var json = function (u) { return Ortak.json(u); }; // ortak.js aynı dosyayı tek kez indirir
  // Sonraki PPK; karara 2 gün kala kutu sarı çerçeveli.
  json("data/ppk.json").then(function (P) {
    var s = (P.meetings || []).map(function (m) { return new Date(m + "T00:00:00"); }).filter(function (m) { return m >= bugun; })[0];
    if (s) { var g = fark(bugun, s); $("ppkN").innerHTML = g === 0 ? "Bugün" : g + "<small>gün</small>"; $("ppkT").textContent = s.getDate() + " " + AY[s.getMonth()] + " " + GUN[s.getDay()]; if (g <= 2) $("pkPpk").classList.add("yakin"); }
    if (P.last) { var c = P.last.change; $("ppkF").innerHTML = "Faiz <b>%" + tr(P.last.rate, P.last.rate % 1 ? 2 : 0) + "</b>" + (c ? " · son karar " + (c < 0 ? "−" : "+") + Math.round(Math.abs(c) * 100) + " baz puan" : " · son karar sabit"); }
  }).catch(function () {});

  // Piyasa (küçük kutu): son değer ve günlük değişim
  json("data/piyasa.json").then(function (D) {
    $("pkKur").innerHTML = [["Dolar", "usd", 2], ["Euro", "eur", 2], ["Gram altın", "xau", 0]].map(function (a) {
      var v = (D[a[1]] || []).slice(-2); if (v.length < 2) return "";
      var son = v[1], yz = (v[1] - v[0]) / v[0] * 100;
      return "<div><span>" + a[0] + "</span><b>" + tr(son, a[2]) + '</b><span class="' + (yz < 0 ? "d" : "u") + '">' + (yz < 0 ? "▼" : "▲") + " %" + tr(Math.abs(yz), 2) + "</span></div>";
    }).join("");
  }).catch(function () {});

  // Kampanyalar: dört bölüm (Faiz & Kredi · Yeni gelen · Süresi doluyor · Tarım), her biri bireysel / ticari.
  // Sayım İş Bankası Gündemi ve Açılış kartıyla aynı: üç site birlikte, aynı kampanya bir kez. Düğmeler İş Bankası Gündemi'nde süzülmüş listeyi açar.
  var ayni = function (t) { return (t || "").toLocaleLowerCase("tr").replace(/[’'`]/g, "").replace(/[çğıöşüâîû]/g, function (h) { return { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" }[h]; }).replace(/[^a-z0-9%]/g, ""); };
  var gun = function (n) { return new Date(Date.now() + 3 * 3600e3 + n * 864e5).toISOString().slice(0, 10); };
  json("isbank/kampanya_hepsi.json").then(function (K) {
    var bg = gun(0), uc = gun(-4), hf = gun(6), TUM = {}, S = { bireysel: {}, ticari: {} };
    ["isbank", "maximum", "maximiles"].forEach(function (kay) {
      Object.keys(K[kay] || {}).forEach(function (sg) {
        var v = K[kay][sg] || {}, LL = v.kampanyalar || [].concat.apply([], (v.kategoriler || []).map(function (c) { return c.kampanyalar || []; }));
        LL.forEach(function (k) {
          if (!k || !k.baslik || (k.bitis && k.bitis < bg)) return;
          var a = k.es || ayni(k.baslik), ilk = k.ilk && k.ilk > "2000-01-01" ? k.ilk : "0"; TUM[a] = 1;
          var G = S[sg]; if (!G) return;
          if (!G[a]) G[a] = { ne: k.ne || "", nere: k.nere || "", ilk: ilk, bit: k.bitis || "" };
          else { var g = G[a]; if (ilk < g.ilk) g.ilk = ilk; if (!g.ne && k.ne) g.ne = k.ne; if (!g.nere && k.nere) g.nere = k.nere; if (k.bitis && (!g.bit || k.bitis > g.bit)) g.bit = k.bitis; }
        });
      });
    });
    var say = function (sg, f) { var G = S[sg]; return Object.keys(G).filter(function (a) { return f(G[a]); }).length; };
    var B4 = [
      ["fk", "🏦", "Faiz &amp; Kredi", "şu an geçerli", function (g) { return g.ne === "Faiz & Kredi"; }, ""],
      ["yeni", "🆕", "Yeni gelen", "son 5 günde", function (g) { return g.ilk >= uc; }, ""],
      ["bit", "⏳", "Süresi doluyor", "7 gün içinde bitiyor", function (g) { return g.bit && g.bit <= hf; }, "sic"],
      ["tar", "🌾", "Tarım", "çiftçiye ve tarıma özel", function (g) { return g.nere === "Tarım"; }, "tar"]];
    var n = Object.keys(TUM).length; if (!n) return;
    $("kmN").textContent = n.toLocaleString("tr-TR");
    $("kmK").innerHTML = B4.map(function (b) {
      var bi = say("bireysel", b[4]), ti = say("ticari", b[4]);
      var dg = function (sg, ad, x) { return '<button type="button" data-git="' + b[0] + "|" + sg + '"' + (x ? "" : " disabled") + "><span>" + ad + "</span><b>" + x + "</b></button>"; };
      return '<div class="kb ' + b[5] + '"><div class="kbu"><span aria-hidden="true">' + b[1] + "</span><b>" + (bi + ti) + '</b></div><div class="kad">' + b[2] + '</div><div class="kal">' + b[3] + "</div>" +
        '<div class="ksg">' + (b[0] === "tar" && !bi ? "" : dg("bireysel", "👤 Bireysel", bi)) + dg("ticari", "🏢 Ticari", ti) + "</div></div>";
    }).join("");
    $("kmK").addEventListener("click", function (e) {
      var d = e.target.closest("button[data-git]"); if (!d || d.disabled) return;
      var p = d.dataset.git.split("|"), o = {}; try { o = JSON.parse(localStorage.getItem("isbankKamp") || "{}") || {}; } catch (x) {}
      if (window.Rapor) Rapor.bolum("pano-kamp-" + p[0] + "-" + p[1]);
      if (p[0] === "bit") { try { sessionStorage.setItem("kTakSeg", p[1]); } catch (x) {} location.href = "isbank.html#ktakvim"; return; } // Kampanya takvimi: bitişler gün gün
      o.seg = p[1]; o.nere = p[0] === "tar" ? "Tarım" : ""; o.kim = ""; o.one = false; o.ne = p[0] === "fk" ? "Faiz & Kredi" : "";
      if (p[0] === "fk" || p[0] === "tar") o.kay = "isbank";
      try { localStorage.setItem("isbankKamp", JSON.stringify(o)); } catch (x) {}
      location.href = "isbank.html#" + (p[0] === "yeni" ? "yeniliste-" + p[1] : "kliste");
    });
  }).catch(function () {});
})();
} catch (e) { console.error("anasayfa: C düzeni kutucukları (15 Kasım 2026). Veriler sitenin kendi dosyala", e); }

// ---- Gizli: saate dokunan "Dünya saati"ni görür (23 Kasım 2026) ----
// Menüde ya da sayfada adı geçmez; dunya.js yalnızca ilk dokunuşta yüklenir. Dokunulan saat bir an altın parlar.
try {
  (function () {
    var yuk = null;
    function ac(e) {
      var c = e.currentTarget; c.classList.remove("dsDok"); void c.offsetWidth; c.classList.add("dsDok");
      if (window.DunyaSaati) return DunyaSaati.ac();
      if (yuk) return;
      yuk = document.createElement("script"); yuk.src = "dunya.js";
      yuk.onload = function () { if (window.DunyaSaati) DunyaSaati.ac(); };
      yuk.onerror = function () { yuk.remove(); yuk = null; };
      document.head.appendChild(yuk);
    }
    document.querySelectorAll(".clock").forEach(function (c) {
      c.addEventListener("click", ac);
      if (c.closest("[aria-hidden='true']")) return; // üst şeritteki küçük saat: şerit ekran okuyucudan gizli
      // 23 Kasım 2026: klavye ve ekran okuyucu için gerçek düğme gibi davranır; odak çerçevesi yalnızca klavyeyle gelir
      c.setAttribute("role", "button"); c.tabIndex = 0; c.setAttribute("aria-haspopup", "dialog");
      c.setAttribute("aria-label", "Dünya saati"); if (document.getElementById("dig")) c.setAttribute("aria-describedby", "dig");
      c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ac(e); } });
    });
  })();
} catch (e) { console.error("anasayfa: dünya saati", e); }
