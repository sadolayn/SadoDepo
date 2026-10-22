// Faiz oranı hatırlama: <input data-hatirla> alanlarına girilen oran yalnızca bu cihazda (localStorage "faizHatira") saklanır.
// Sayfa açılınca son girilen oran geri yazılır ve hesap kendiliğinden yapılır. Alan silinirse kayıt da silinir.
// Sayfanın kendi hesap kodlarından SONRA yüklenmeli (</body> öncesi), çünkü geri yazınca "input" olayı tetiklenir.
(function () {
  var KEY = "faizHatira", S = {};
  try { S = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  function kaydet() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var css = document.createElement("style");
  css.textContent = ".fyHat{display:block;font-size:10.5px;color:#7d8a6a;margin-top:3px}.fyHat[hidden]{display:none}";
  document.head.appendChild(css);
  document.querySelectorAll("input[data-hatirla]").forEach(function (inp) {
    var id = inp.id; if (!id) return;
    var not = document.createElement("small"); not.className = "fyHat"; not.textContent = "💾 bu cihazda hatırlanır";
    var yer = inp.closest(".field") || inp;
    yer.insertAdjacentElement("afterend", not);
    var goster = function () { not.hidden = !inp.value.trim(); };
    inp.addEventListener("input", function () {
      var v = inp.value.trim();
      if (v) S[id] = v; else delete S[id];
      kaydet(); goster();
    });
    if (S[id] && !inp.value.trim()) {
      inp.value = S[id];
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    }
    goster();
  });
})();
