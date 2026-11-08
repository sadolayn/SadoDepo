/* Verilerimi yedekle / taşı (7 Kasım 2026)
   Sitenin bu tarayıcıda sakladığı her şey (favoriler, tema, Günce, ajanda, Yıldızlar, oyun istatistikleri, ayarlar)
   tek bir dosyaya ya da kopyalanabilir koda çevrilir; başka cihazda geri yüklenir. Sunucu yok: veri yalnızca kullanıcıda.
   Dışarıda kalan: günlük sayaç işareti (canli_gun) ve Firebase'in kendi iç kayıtları. */
(function () {
  const SURUM = 1, ON = "SADOLAYN-YEDEK:", ONZ = "SADOLAYN-YEDEK-Z:";
  const disari = (k) => k === "canli_gun" || /^firebase[:_]/i.test(k);
  const $ = (id) => document.getElementById(id);

  function topla() {
    const d = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !disari(k)) d[k] = localStorage.getItem(k);
    }
    return { site: "SadoDepo", v: SURUM, t: new Date().toISOString(), d };
  }
  const b64 = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function akis(u8, Sinif, tur) {
    const st = new Blob([u8]).stream().pipeThrough(new Sinif(tur));
    return new Uint8Array(await new Response(st).arrayBuffer());
  }
  // Kod: mümkünse gzip ile sıkıştırılır (kısa olsun diye), değilse düz
  async function kodla(o) {
    const u8 = new TextEncoder().encode(JSON.stringify(o));
    if (window.CompressionStream) { try { return ONZ + b64(await akis(u8, CompressionStream, "gzip")); } catch (e) {} }
    return ON + b64(u8);
  }
  async function coz(metin) {
    let t = String(metin || "").trim();
    if (t.startsWith("{")) return JSON.parse(t); // indirilen dosya düz JSON
    t = t.replace(/\s+/g, "");
    if (t.startsWith(ONZ)) {
      if (!window.DecompressionStream) throw new Error("Bu tarayıcı sıkıştırılmış kodu açamıyor; yedek dosyasını kullan.");
      return JSON.parse(new TextDecoder().decode(await akis(unb64(t.slice(ONZ.length)), DecompressionStream, "gzip")));
    }
    if (t.startsWith(ON)) return JSON.parse(new TextDecoder().decode(unb64(t.slice(ON.length))));
    throw new Error("Bu bir Sadolayn yedeği değil.");
  }
  function dogrula(o) {
    if (!o || o.site !== "SadoDepo" || typeof o.d !== "object" || !o.d) throw new Error("Bu bir Sadolayn yedeği değil.");
    const d = {};
    Object.keys(o.d).forEach((k) => { if (typeof o.d[k] === "string" && k.length <= 60 && !disari(k)) d[k] = o.d[k]; });
    return d;
  }
  const tarih = (iso) => { try { return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  const durum = (m, iyi) => { const el = $("ydDurum"); el.textContent = m; el.style.color = iyi === false ? "#ef6a4c" : ""; };

  function ac() {
    const o = topla(), n = Object.keys(o.d).length;
    $("ydSay").textContent = n ? `Bu cihazda ${n} kayıt var (favoriler, tema, Günce, ajanda, Yıldızlar, oyunlar, ayarlar).` : "Bu cihazda henüz kayıtlı bir şey yok.";
    $("ydKod").value = ""; durum("");
    $("ydOv").hidden = false;
  }
  const kapat = () => { $("ydOv").hidden = true; };

  async function indir() {
    const o = topla(), ad = "sadolayn-yedek-" + o.t.slice(0, 10) + ".json";
    const url = URL.createObjectURL(new Blob([JSON.stringify(o)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    durum(`✅ "${ad}" indirildi. Yeni cihazda "Geri yükle" ile seç.`);
  }
  // Telefonda dosyayı doğrudan WhatsApp / e-posta / Drive'a gönderir (Web Share). Desteklemeyen tarayıcıda düğme görünmez.
  const dosya = () => { const o = topla(); return new File([JSON.stringify(o)], "sadolayn-yedek-" + o.t.slice(0, 10) + ".json", { type: "application/json" }); };
  const paylasilir = () => { try { return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [dosya()] })); } catch (e) { return false; } };
  async function paylas() {
    try { await navigator.share({ files: [dosya()], title: "Sadolayn yedeği", text: "Sadolayn verilerimin yedeği" }); durum("✅ Paylaşıldı. Yeni cihazda dosyayı kaydedip “Geri yükle” ile seç."); }
    catch (e) { if (e && e.name === "AbortError") return; durum("⚠️ Paylaşılamadı; “Yedek dosyası indir”i kullan.", false); }
  }
  async function kopyala() {
    const kod = await kodla(topla());
    const tamam = () => durum("✅ Yedek kodu kopyalandı. Yeni cihazda bu pencereye yapıştırıp “Geri yükle”ye bas.");
    try { await navigator.clipboard.writeText(kod); tamam(); }
    catch (e) { $("ydKod").value = kod; $("ydKod").select(); durum("Kod aşağıya yazıldı; seçip kopyala."); }
  }
  async function yukle(metin) {
    try {
      const o = await coz(metin), d = dogrula(o), n = Object.keys(d).length;
      if (!n) throw new Error("Yedekte geri yüklenecek kayıt yok.");
      if (!confirm(`${tarih(o.t)} tarihli yedekte ${n} kayıt var.\nBu cihazdaki aynı kayıtların üzerine yazılacak. Devam edilsin mi?`)) return;
      Object.keys(d).forEach((k) => { try { localStorage.setItem(k, d[k]); } catch (e) {} });
      durum(`✅ ${n} kayıt geri yüklendi. Sayfa yenileniyor…`);
      setTimeout(() => location.reload(), 900);
    } catch (e) { durum("⚠️ " + (e && e.message && /yedek|tarayıcı|kayıt/i.test(e.message) ? e.message : "Kod ya da dosya okunamadı; eksik kopyalanmış olabilir."), false); }
  }

  function kur() {
    if (!$("ydBtn")) return;
    $("ydBtn").addEventListener("click", ac);
    $("ydKapat").addEventListener("click", kapat);
    $("ydOv").addEventListener("click", (e) => { if (e.target === $("ydOv")) kapat(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("ydOv").hidden) kapat(); });
    $("ydIndir").addEventListener("click", indir);
    if ($("ydPaylas")) { $("ydPaylas").hidden = !paylasilir(); $("ydPaylas").addEventListener("click", paylas); }
    $("ydKopya").addEventListener("click", kopyala);
    $("ydYukle").addEventListener("click", () => { const v = $("ydKod").value.trim(); if (v) yukle(v); else $("ydDosya").click(); });
    $("ydDosya").addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; f.text().then(yukle); e.target.value = ""; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kur); else kur();
  window.Yedek = { topla, kodla, coz, dogrula };
})();
