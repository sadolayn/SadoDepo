/* ics.js — telefon takvimine aktarılacak .ics dosyası (22 Kasım 2026).
   Kullanım: ICS.indir("dosya-adi", [{ uid, gun: "YYYY-MM-DD", baslik, aciklama, url, alarmlar: ["-PT15H", "PT9H"] }], "Takvim adı")
   - Olaylar tüm gün sürer. Alarm, olay gününün 00:00'ına göre yazılır:
     "-PT15H" = bir gün önce 09:00 · "PT9H" = o gün 09:00 · "-P2DT15H" = üç gün önce 09:00.
   - Dosya yalnızca cihazda oluşturulur; hiçbir yere gönderilmez. Samsung Takvim ve Google Takvim içe aktarır.
   - Türkçe karakterler UTF-8 kalır; 75 bayttan uzun satırlar kurala göre bölünür. */
(function () {
  function kac(t) { return String(t == null ? "" : t).replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1"); }
  // 75 bayttan uzun satırı UTF-8 karakter ortasından bölmeden katla
  function katla(s) {
    var enc = new TextEncoder(), out = [], cur = "", n = 0;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i], cp = s.codePointAt(i); if (cp > 0xffff) { ch = s.slice(i, i + 2); i++; }
      var b = enc.encode(ch).length;
      if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; n = 0; }
      cur += ch; n += b;
    }
    out.push(cur);
    return out.join("\r\n ");
  }
  function gun8(g) { return String(g).replace(/-/g, ""); }
  function sonraki(g) { var d = new Date(g + "T12:00:00"); d.setDate(d.getDate() + 1); return d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0"); }
  function olustur(olaylar, ad) {
    var dt = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sadolayn//Takvim//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    if (ad) L.push("X-WR-CALNAME:" + kac(ad));
    (olaylar || []).forEach(function (o) {
      if (!o || !/^\d{4}-\d{2}-\d{2}$/.test(o.gun || "")) return;
      L.push("BEGIN:VEVENT", "UID:" + kac(o.uid || (gun8(o.gun) + "-" + Math.random().toString(36).slice(2))) + "@sadolayn", "DTSTAMP:" + dt,
        "DTSTART;VALUE=DATE:" + gun8(o.gun), "DTEND;VALUE=DATE:" + sonraki(o.gun), "SUMMARY:" + kac(o.baslik), "TRANSP:TRANSPARENT");
      if (o.aciklama || o.url) L.push("DESCRIPTION:" + kac((o.aciklama || "") + (o.url ? (o.aciklama ? "\n" : "") + o.url : "")));
      if (o.url) L.push("URL:" + o.url);
      (o.alarmlar || []).forEach(function (t) {
        if (!/^-?P(\d+D)?(T\d+H)?$/.test(t)) return;
        L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + kac(o.baslik), "TRIGGER:" + t, "END:VALARM");
      });
      L.push("END:VEVENT");
    });
    L.push("END:VCALENDAR");
    return L.map(katla).join("\r\n") + "\r\n";
  }
  function indir(dosya, olaylar, ad) {
    var b = new Blob([olustur(olaylar, ad)], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = String(dosya || "takvim").replace(/[^\w.-]+/g, "-") + ".ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  window.ICS = { olustur: olustur, indir: indir };
})();
