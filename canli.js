// canli.js — anonim "şu an sitede" sayacı (Firebase Realtime Database).
// Yazılan tek şey: hangi sayfa, telefon mu bilgisayar mı, zaman. İsim, cihaz kodu, konum, IP yok.
// Sekme kapanınca kayıt Firebase tarafından kendiliğinden silinir. Günlük sayaç her cihazda günde bir artar.
const FB_DB = "https://sadolaynsadosan-default-rtdb.europe-west1.firebasedatabase.app";
const V = "10.12.2";
(async function () {
  try {
    if (localStorage.getItem("canli_ben") === "1") return; // site sahibi kendini saymasın
  } catch (e) {}
  try {
    const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
    const { getDatabase, ref, set, onDisconnect, serverTimestamp, runTransaction } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-database.js`);
    const db = getDatabase(initializeApp({ databaseURL: FB_DB }, "canli"));
    const id = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);
    const sayfa = ((location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index").slice(0, 30);
    const cihaz = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent) ? "m" : "d";
    const r = ref(db, "online/" + id);
    await onDisconnect(r).remove();
    await set(r, { p: sayfa, d: cihaz, t: serverTimestamp() });
    // Uzun süre açık kalan sekmeler için 4 dakikada bir "hâlâ buradayım"
    setInterval(() => { set(r, { p: sayfa, d: cihaz, t: serverTimestamp() }).catch(() => {}); }, 240000);
    // Bugünün tekil ziyaretçi sayacı (Türkiye saatine göre gün)
    const gun = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
    let say = true;
    try { say = localStorage.getItem("canli_gun") !== gun; } catch (e) {}
    if (say) {
      await runTransaction(ref(db, "gun/" + gun), (v) => (v || 0) + 1);
      try { localStorage.setItem("canli_gun", gun); } catch (e) {}
    }
  } catch (e) { /* sayaç çalışmazsa site etkilenmez */ }
})();
