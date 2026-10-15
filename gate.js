// Oyunlar için çalışan kodu kilidi (Vadeli Mevduat'taki çalışan moduyla aynı kod)
(function () {
  var KEY = "sado_oyun", EMP = "sado_calisan", CODE = "1924";
  var ok = false;
  try { ok = localStorage.getItem(KEY) === "1" || localStorage.getItem(EMP) === "1"; } catch (e) {}
  if (ok) return;
  var de = document.documentElement;
  de.classList.add("gate-locked");
  var st = document.createElement("style");
  st.textContent =
    "html.gate-locked body > *:not(#gate){display:none !important}" +
    "#gate{position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}" +
    "#gate .gbox{width:100%;max-width:320px;background:#0d0d0d;border:1px solid #262626;border-radius:18px;padding:22px;text-align:center;color:#f2f2f2}" +
    "#gate h2{margin:0 0 6px;font-size:20px}#gate p{margin:0 0 14px;color:#8a8a8a;font-size:14px}" +
    "#gate input{width:100%;box-sizing:border-box;font-size:22px;letter-spacing:6px;text-align:center;padding:12px;border-radius:12px;border:1px solid #333;background:#161616;color:#fff;outline:none}" +
    "#gate input:focus{border-color:#e0a24f}" +
    "#gate button{width:100%;margin-top:10px;padding:12px;border-radius:12px;border:1px solid #e0a24f;background:#e0a24f;color:#000;font-size:16px;font-weight:700;cursor:pointer}" +
    "#gate a{display:inline-block;margin-top:12px;color:#8a8a8a;font-size:13px;text-decoration:none}" +
    "#gate .err{color:#e0473a;font-size:13px;min-height:18px;margin-top:8px}" +
    "#gate .shake{animation:gsh .3s}@keyframes gsh{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}";
  (document.head || de).appendChild(st);
  function build() {
    var g = document.createElement("div");
    g.id = "gate";
    g.innerHTML =
      '<div class="gbox"><h2>🔒 Oyunlar</h2><p>Devam etmek için çalışan kodunu gir.</p>' +
      '<input id="gateIn" type="password" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="••••">' +
      '<button id="gateBtn" type="button">Giriş</button><div class="err" id="gateErr"></div>' +
      '<a href="index.html">← Ana sayfa</a></div>';
    document.body.appendChild(g);
    var inp = document.getElementById("gateIn");
    function tryIt() {
      if (inp.value.trim() === CODE) {
        try { localStorage.setItem(KEY, "1"); } catch (e) {}
        de.classList.remove("gate-locked");
        g.remove();
        window.dispatchEvent(new Event("resize"));
      } else {
        document.getElementById("gateErr").textContent = "Kod hatalı.";
        var b = g.querySelector(".gbox"); b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
        inp.value = ""; inp.focus();
      }
    }
    document.getElementById("gateBtn").onclick = tryIt;
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") tryIt(); });
    setTimeout(function () { inp.focus(); }, 50);
  }
  if (document.body) build(); else document.addEventListener("DOMContentLoaded", build);
})();
