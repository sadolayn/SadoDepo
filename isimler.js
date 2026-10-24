// Oyuncu isimleri — tüm oyunlarda ortak.
// "Sadolayn" sabittir; diğer oyuncu isimlerini kullanıcı yazar (en fazla 8 karakter).
(function () {
  const MAX = 8, KEY = "oyunIsim";
  let D = {};
  try { D = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  const clean = (v) => String(v || "").replace(/[<>&"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, MAX);
  const isSado = (v) => v.toLocaleLowerCase("tr") === "sadolayn";
  const css = document.createElement("style");
  css.textContent = `.isimBox{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:6px 0 4px}
.isimBox>div{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#a9a39a;text-align:left;margin:0}
.isimBox input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1px solid #3a3226;background:#161310;color:#f3e3c4;font:inherit;font-size:16px;font-weight:600}
.isimBox input:focus{outline:none;border-color:#e0a24f}
.isimBox .fix{padding:10px 12px;border-radius:12px;border:1px dashed #3a3226;color:#e9c98f;font-size:16px;font-weight:700}
.isimBox small{font-size:10.5px;color:#6f6a62}`;
  document.head.appendChild(css);
  window.ISIM = {
    MAX,
    /** Kayıtlı isim; boşsa ya da "Sadolayn" yazılmışsa varsayılan */
    get(k, def) { const v = clean(D[k]); return v && !isSado(v) ? v : def; },
    set(k, v) { D[k] = clean(v); try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} },
    ben() { return this.get("ben", "Sen"); },
    /** Seçenekler penceresi için alanlar. list: [[anahtar, varsayılan, etiket], ...]; anahtar null ise sabit isim */
    html(list) {
      return `<div class="isimBox">${list.map(([k, def, lb]) => k
        ? `<div>${lb}<input data-isim="${k}" maxlength="${MAX}" placeholder="${def}" value="${clean(D[k])}" autocomplete="off" spellcheck="false"></div>`
        : `<div>${lb}<span class="fix">${def}</span></div>`).join("")}</div><small style="display:block;font-size:11px;color:#8a8a8a;margin-bottom:4px">İsimler en fazla ${MAX} karakter · tüm oyunlarda hatırlanır</small>`;
    },
    /** Alanları kaydetmeye bağla */
    bind(root, onChange) {
      root.querySelectorAll("input[data-isim]").forEach((i) => i.addEventListener("input", () => {
        if (i.value.length > MAX) i.value = i.value.slice(0, MAX);
        ISIM.set(i.dataset.isim, i.value); if (onChange) onChange();
      }));
    },
  };
})();
