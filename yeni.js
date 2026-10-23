// "YENİ / YENİLENDİ" rozetleri — tüm sayfalarda ortak.
// Kullanım: <a data-yeni="anahtar|2026-10-17|YENİ"> … <div class="t">Başlık</div> … </a>
// Etiket "•" ise yalnızca kırmızı nokta konur (küçük sekmeler için).
// Kullanıcı öğeye dokununca o tarihli değişiklik görülmüş sayılır; 21 gün sonra rozet kendiliğinden kalkar.
(function () {
  var KEY = "yeniGoruldu", GUN = 21;
  var S = {}; try { S = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  var css = document.createElement("style");
  css.textContent = ".yeniB{display:inline-block;margin-left:7px;padding:1px 6px;border-radius:6px;background:#e5383b;color:#fff;font-size:11px;font-weight:800;letter-spacing:.5px;vertical-align:2px;line-height:1.5;animation:yeniP 1.8s ease-in-out infinite}" +
    ".yeniB.up{background:#2f7de1}.yeniD{position:absolute;top:4px;right:6px;width:9px;height:9px;border-radius:50%;background:#e5383b;box-shadow:0 0 0 2px #000;animation:yeniP 1.8s ease-in-out infinite}" +
    "@keyframes yeniP{50%{opacity:.65}}";
  document.head.appendChild(css);
  function run() {
    document.querySelectorAll("[data-yeni]").forEach(function (el) {
      var p = el.getAttribute("data-yeni").split("|"), k = p[0], d = p[1], lb = p[2] || "YENİ";
      var age = (Date.now() - new Date(d + "T00:00:00").getTime()) / 864e5;
      if (S[k] === d || age > GUN || age < -1) return;
      if (el.classList.contains("on") || el.classList.contains("active")) { S[k] = d; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} return; } // zaten açık olan sekme
      var b = document.createElement("span");
      if (lb === "•") { b.className = "yeniD"; if (getComputedStyle(el).position === "static") el.style.position = "relative"; el.appendChild(b); }
      else { b.className = "yeniB" + (/YENİLEN|GÜNCEL/.test(lb) ? " up" : ""); b.textContent = lb; (el.querySelector(".t") || el).appendChild(b); }
      el.addEventListener("click", function () { S[k] = d; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (b.parentNode) b.parentNode.removeChild(b); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
