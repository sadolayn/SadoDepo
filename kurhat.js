/* kurhat.js — "Ana ekranına ekle" hatırlatması, ana sayfa dışındaki sayfalar için (27 Kasım 2026).
   Ana sayfadaki hatırlatmayla aynı kurallar: uygulama olarak açıldıysa çıkmaz, sayfaya ikinci gelişte görünür,
   kapatılınca 30 gün çıkmaz (kapatma kaydı ana sayfayla ortak: "sKurHat"). Kayıtlar yalnızca bu cihazda durur.
   Kullanım: <script src="kurhat.js" data-once=".list" defer></script>  → hatırlatma o öğenin hemen üstüne eklenir. */
(function () {
  var sc = document.currentScript, sec = sc && sc.getAttribute("data-once");
  function kur() {
    var hedef = sec && document.querySelector(sec); if (!hedef) return;
    try {
      if (matchMedia("(display-mode: standalone)").matches || navigator.standalone || /kaynak=uygulama/.test(location.search)) return;
      if (matchMedia("(min-width: 1000px)").matches) return;
      var n = (+localStorage.getItem("sGelisD") || 0) + 1; localStorage.setItem("sGelisD", n);
      if (n < 2 || Date.now() - (+localStorage.getItem("sKurHat") || 0) < 30 * 864e5) return;
    } catch (e) { return; }
    var st = document.createElement("style");
    st.textContent = ".kurHatD{display:flex;align-items:center;gap:10px;margin:0 0 12px;padding:9px 8px 9px 12px;border:1px solid #5a4320;border-radius:14px;background:rgba(224,162,79,.08);animation:kurHatG .45s cubic-bezier(.2,.7,.2,1) both}" +
      ".kurHatD>span{font-size:20px}.kurHatD .ac{flex:1;text-align:left;background:none;border:0;color:inherit;font:inherit;padding:2px 0;cursor:pointer;min-height:36px}" +
      ".kurHatD .ac b{display:block;font:700 14px system-ui,sans-serif;color:#e0a24f}.kurHatD .ac small{font-size:12px;color:#a8a8a8}" +
      ".kurHatD .kp{flex:none;width:36px;height:36px;border-radius:50%;border:0;background:none;color:#a8a8a8;font-size:15px;cursor:pointer}" +
      ".kurHatD .ac:active{transform:scale(.975)}" +
      'html[data-tema="acik"] .kurHatD{background:#fbf4e6;border-color:#e6cf9f}html[data-tema="acik"] .kurHatD .ac b{color:#8a5a12}html[data-tema="acik"] .kurHatD .ac small,html[data-tema="acik"] .kurHatD .kp{color:#5c6470}' +
      "@keyframes kurHatG{from{opacity:0;transform:translateY(10px)}}@media (prefers-reduced-motion:reduce){.kurHatD{animation:none}}";
    document.head.appendChild(st);
    var h = document.createElement("div"); h.className = "kurHatD";
    h.innerHTML = '<span aria-hidden="true">📲</span><button type="button" class="ac"><b>Ana ekranına ekle</b><small>Tek dokunuşla aç, uygulama gibi kullan</small></button><button type="button" class="kp" aria-label="Kapat">✕</button>';
    hedef.parentNode.insertBefore(h, hedef);
    var kapat = function () { h.remove(); try { localStorage.setItem("sKurHat", Date.now()); } catch (e) {} };
    h.querySelector(".kp").onclick = function () { if (window.Rapor) Rapor.bolum("kur-hatirlat-kapat"); kapat(); };
    h.querySelector(".ac").onclick = function () {
      if (window.Rapor) Rapor.bolum("kur-hatirlat-ac");
      var p = window.__kurPrompt; kapat();
      if (p) { p.prompt(); window.__kurPrompt = null; return; } // Chrome: kurulum penceresi doğrudan açılır
      location.href = "index.html#kur";                          // diğerleri: ana sayfadaki yol tarifi
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kur); else kur();
})();
