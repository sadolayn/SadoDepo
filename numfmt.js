// Rakam alanlarında yazarken binlik ayırıcı (1.000.000,50). Nokta tuşu ondalık virgüle çevrilir.
(function () {
  function ok(el) {
    return el && el.tagName === "INPUT" && el.type === "text" && !el.hasAttribute("data-nofmt") &&
      /^(decimal|numeric)$/.test(el.getAttribute("inputmode") || "");
  }
  function fmt(v) {
    var neg = /^\s*-/.test(v);
    v = v.replace(/[^\d,]/g, "");
    var i = v.indexOf(",");
    var ip = i < 0 ? v : v.slice(0, i), dp = i < 0 ? null : v.slice(i + 1).replace(/,/g, "");
    ip = ip.replace(/^0+(?=\d)/, "");
    ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (neg ? "-" : "") + ip + (dp !== null ? "," + dp : "");
  }
  document.addEventListener("beforeinput", function (e) {
    var el = e.target; if (!ok(el)) return;
    var s = el.selectionStart, t = el.selectionEnd; if (s == null || s !== t) return;
    // Ayırıcı noktayı silerken yanındaki rakamı sil
    if (e.inputType === "deleteContentBackward" && el.value.charAt(s - 1) === ".") el.setSelectionRange(s - 1, s - 1);
    else if (e.inputType === "deleteContentForward" && el.value.charAt(s) === ".") el.setSelectionRange(s + 1, s + 1);
  }, true);
  document.addEventListener("input", function (e) {
    var el = e.target; if (!ok(el)) return;
    var v = el.value, c = el.selectionStart == null ? v.length : el.selectionStart;
    // Yazılan nokta = ondalık (virgül yoksa)
    if (e.data === "." && v.charAt(c - 1) === "." && v.indexOf(",") < 0) v = v.slice(0, c - 1) + "," + v.slice(c);
    var keep = v.slice(0, c).replace(/[^\d,-]/g, "").length;
    var nv = fmt(v);
    if (nv === el.value) return;
    el.value = nv;
    var p = 0, n = 0;
    while (p < nv.length && n < keep) { if (/[\d,-]/.test(nv.charAt(p))) n++; p++; }
    try { el.setSelectionRange(p, p); } catch (x) {}
  }, true);
  // Sayfa açılışında mevcut değerleri de biçimle
  function initAll() {
    document.querySelectorAll('input[type="text"][inputmode="decimal"], input[type="text"][inputmode="numeric"]').forEach(function (el) {
      if (ok(el) && el.value && !/[^\d.,\s-]/.test(el.value)) {
        var v = el.value.trim();
        // "1.000.000" ya da "1000000,5" biçimi; tek nokta + 1-2 hane ise ondalık say
        if (/^\d+\.\d{1,2}$/.test(v)) v = v.replace(".", ",");
        el.value = fmt(v);
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll); else initAll();
})();
