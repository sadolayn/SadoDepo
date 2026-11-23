/* dunya.js — 🌍 Dünya saati (23 Kasım 2026). Ana sayfadaki saate dokunana açılan gizli sayfa; menüde ve haritada adı geçmez.
   - Canlı dünya haritası: kara noktaları güneşin o andaki yüksekliğine göre aydınlanır; gece tarafında şehir ışıkları yanar.
   - Gece-gündüz çizgisi, güneşin tepede olduğu nokta, Ekvator ve dönenceler, her 15°'de bir meridyen (1 saat) ve Greenwich.
   - "4 dakika kuralı": haritada bir yere dokununca o boylamın güneş saati; 1° boylam = 4 dk.
   - Zamanı kaydır: gece-gündüz çizgisinin 12 saat ileri/geri nasıl ilerlediği.
   - Şehir saatleri (yaz saati uygulamaları tarayıcıdan, Intl), İstanbul'da gün doğumu/batımı, sıradaki ekinoks ve gün dönümü.
   Hesaplar NOAA güneş formülleriyle (dakika düzeyinde yaklaşık). Kara verisi: Natural Earth (kamu malı), 1° ızgaraya indirildi.
   Hiçbir yere istek atmaz, konum sormaz; her şey cihazda hesaplanır. Bu dosya yalnızca saate dokunulunca yüklenir. */
(function () {
  if (window.DunyaSaati) return;
  var KARA_B64 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//8AAP///gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB////h///////fAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/7//5////////wAAAAAAAAAA4owAAAAPgAAAAAAAAAAAAAAAAAAAAAAAAAAA///8A///////+AAAAB7/wAAAAAAAAAAH8AAAAAAAAAAAAAAAAAAAAAAAAAHxn//4////////4AAAAA/8AAAAAAAAAAAAD4AAAAAAAAAAAAAAAAAAAAAAEYAAAP/Af///////8AAAAAPHAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAD9iCc+//AH///////5AAAAAAAAAAAAAB4AAAAD/8AAAAAAAAAAAAAAAAAAAAAD/wfz78AAAf/////8AAAAAAAAAAAAH4AAAB////AAAB/gAAAAAAAAAAAAAAGA4AAAeYAAAH/////8AAAAAAAAAAAAOAAAAH///6AAAAAAAAAAAAAAAAAAAAP+AYc+c7gAAD/////4AAAAAAAAAAAA4ACAH/////+DwAGAAAAAAAAAAAAAAAf/+4+4//4AAB/////wAAAAAAAAAAADwAHl3///////4APwAAAAAwAAAAAAAAOf/8M4///AAB/////wAAAAAAAAAAADwAff////////83//gAAABAAAf8gAACAH//B8f//8AA////+wAAAAAAB/AAAAAAfv/////////////8AAAAAB///+F//H//j+Bwf8AA3////AAAAAAA//4AAQA+fv/////////////+/n8wAP///////+QYDfzwf+AAf///4AAAAAAH///wMHf//n/////////////////+AD////////+////4Z/wA///4AAAAAAAH///+M////v//////////////////4E/////////////gD/8Af//wAAAAAAAf///+v//////////////////////vwf////////////7AD+YAf/wAA/8AAAA/8f+D///////////////////////AgLf///////////zw//gAP/gAAP8AAAB/4/+f//////////////////////+AAB////////////DIA/gAH/gAADAAAAP/z/////////////////////////+AAH///////////4AwwPAAD/AAAAAAAA//H/////////////////////////6AAP///////////wAA/AAAB/AAAAAAAB/+H//////////////////////jP/AAAH//z////////wAA/4AAAOAAAAAAAB//D//////////////////////A/YAAAA/5AD///////gAA/4QAAAAAAAAAAB//g7////////////////////+DgAAAAADwAA///////4AA/94AAAAAAAAAYA5+D///////////////////8AAHAAAAAADYAAP//////4AAf/8AAAAAAAAA8AA+C///////////////////wAAfgAAAAAMAAAH///////wAf/+AAAAAAAAA4AOcH///////////////////AAA/gAAAAAgAAAB///////+A///AAAAAAAABcAPQH//////////////////+AAA/AAAAAEAAAAAP///////x///wAAAAAAAHOAFD///////////////////+AAA+AAAAAAAAAABP///////x///8AAAAAAAPHAf/////////////////////6AA8AAAAAAAAAAAD///////5///8AAAAAAAPPz//////////////////////+AA4AAAAAAAAAAAD///////////8AAAAAAAAfn//////////////////////7AAwAAAAAAAAAAAD///////////kAAAAAAAAYf//////////////////////7AAAAAAAAAAAAAAB/////////+MPAAAAAAAAA///////////////////////zAAAAAAAAAAAAAAAf/////////wfAAAAAAAAP///////////////////////yAAAAAAAAAAAAAAAf/////////gCgAAAAAAAH///////////////////////iAAAAAAAAAAAAAAAP/////////xAAAAAAAAAD//////P/x//////////////CAAAAAAAAAAAAAAAP/////////+AAAAAAAAAB/////Hf/B/////////////+AAAAAAAAAAAAAAAAP////////8wAAAAAAAAAB//H/+CP+H/////////////8CAAAAAAAAAAAAAAAP////////wAAAAAAAAAHj/jz/+AD/H/////////////4HgAAAAAAAAAAAAAAf////////gAAAAAAAAAH/4Fw/8AB/D////////////+APAAAAAAAAAAAAAAAP////////gAAAAAAAAAH/4Acf+PB/g////////////8AIAAAAAAAAAAAAAAAP///////8AAAAAAAAAAH/gMGfN///x///////////v4AMAAAAAAAAAAAAAAAP///////8AAAAAAAAAAH/AMCOP///h//////////+ZwAMAAAAAAAAAAAAAAAH///////4AAAAAAAAAAH/AACHH///g//////////8BwAcAAAAAAAAAAAAAAAH///////wAAAAAAAAAAH+AAYGH///w//////////+w4AYAAAAAAAAAAAAAAAD///////wAAAAAAAAAAAgf+AABu//////////////g4D4AAAAAAAAAAAAAAAB///////wAAAAAAAAAAAh/+AAAA//////////////A8f4AAAAAAAAAAAAAAAB///////gAAAAAAAAAAB//8AAAA//////////////Ah+AAAAAAAAAAAAAAAAAP/////+AAAAAAAAAAAD//+AAAB//////////////gDwAAAAAAAAAAAAAAAAAH/////8AAAAAAAAAAAH///4OAB//////////////gDAAAAAAAAAAAAAAAAAAG/////4AAAAAAAAAAAP///8P4T//////////////wCAAAAAAAAAAAAAAAAAACf////4AAAAAAAAAAAP/////////////////////gAAAAAAAAAAAAAAAAAAABf//jgYAAAAAAAAAAAP/////////P///////////wAAAAAAAAAAAAAAAAAAAAv//AAYAAAAAAAAAAA//////////n///////////wAAAAAAAAAAAAAAAAAAAB3/+AAcAAAAAAAAAAB///////9//j///////////gAAAAAAAAAAAAAAAAAAAAb/+AAMAAAAAAAAAAD///////8//wH//////////AAAAAAAAAAAAAAAAAAAAAJ/+AAEAAAAAAAAAAH///////+f/8B//////////AAAAAAAAAAAAAAAAAAAAAM/8AAAAAAAAAAAAAH///////+f/84Af///////8QAAAAAAAAAAAAAAAAAAAACf8AAAAAAAAAAAAAP////////P//+AP///////4wAAAAAAAAAAAAAAAAAAAAAP8AAuAAAAAAAAAAf////////H///AH///////ggAAAAAAAAAAAAAAAAAAAAAP+AYBgAAAAAAAAAf////////n//+AD//4P//cAAAAAAAAAAAAAAAAAAAAAAAP+A4A8AAAAAAAAAf////////j//+AAf/4H/+AAAAAAAAAAAAAAAAgAAAAAAAH/B4ABwAAAAAAAAP////////h//8AAf/gD/8YAAAAAAAAAAAAAAAAAAAAAAAD/3wAh4AAAAAAAAP////////x//4AAf/AD/8QAQAAAAAAAAAAAAAAAAAAAAAAf/wAAAAAAAAAAAP////////4//gAAf+AD/+AAwAAAAAAAAAAAAAAAAAAAAAAH/wAAAAAAAAAAAf////////4f+AAAf8ADf/AAwAAAAAAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAf////////8f8AAAPwAAP/gAwAAAAAAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAf////////+fgAAAPwAAP/gAwAAAAAAAAAAAAAAAAAAAAAAAA/gAAAAAAAAAAf/////////eAAAAHwAAP/gAEAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAf/////////wAAAAHwAAE/gACAAAAAAAAAAAAAAAAAAAAAAAADABYAAAAAAAAP/////////gIAAAHwAAEfgAJAAAAAAAAAAAAAAAAAAAAAAAADgP/IAAAAAAAH//////////4AAADwAAIPABEAAAAAAAAAAAAAAAAAAAAAAAAAyPf+AAAAAAAD//////////4AAADoAAMEAAEAAAAAAAAAAAAAAAAAAAAAAAAAd///AAAAAAAB//////////wAAABIAAMAAAHAAAAAAAAAAAAAAAAAAAAAAAAAE///gAAAAAAB//////////wAAAAMAAEAAALgAAAAAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAf/////////gAAAAMAADAAMDAAAAAAAAAAAAAAAAAAAAAAAAAAf///gAAAAAAP/B///////gAAAAAABDgAOAAAAAAAAAAAAAAAAAAAAAAAAAAAf///wAAAAAACAAn//////AAAAAAAAxgA8AAAAAAAAAAAAAAAAAAAAAAAAAAAf///4AAAAAAAAAD/////+AAAAAAAAZgB8AAAAAAAAAAAAAAAAAAAAAAAAAAA////4AAAAAAAAAD/////8AAAAAAAAOwH8AAAAAAAAAAAAAAAAAAAAAAAAAAB////8AAAAAAAAAH/////4AAAAAAAAHQf8AQAAAAAAAAAAAAAAAAAAAAAAAAD////8AAAAAAAAAD/////gAAAAAAAAHgf8cAAAAAAAAAAAAAAAAAAAAAAAAAH/////AAAAAAAAAH/////AAAAAAAAADwf8ASgAAAAAAAAAAAAAAAAAAAAAAAH/////4AAAAAAAAH/////AAAAAAAAAD4P5wAxAAAAAAAAAAAAAAAAAAAAAAAH/////+AAAAAAAAD////+AAAAAAAAAB+P5wAz4AAAAAAAAAAAAAAAAAAAAAAH//////4AAAAAAAB////8AAAAAAAAAA8AxYif/AAAAAAAAAAAAAAAAAAAAAAH//////8AAAAAAAA////8AAAAAAAAAAcAAIAH/gIAAAAAAAAAAAAAAAAAAAAH///////gAAAAAAA////4AAAAAAAAAAMABAAA/wwAAAAAAAAAAAAAAAAAAAAH///////gAAAAAAA////4AAAAAAAAAADgAAAIf8AAAAAAAAAAAAAAAAAAAAAD///////gAAAAAAAf///8AAAAAAAAAAB/AAAA/4AAAAAAAAAAAAAAAAAAAAAB///////gAAAAAAAf///4AAAAAAAAAAABexgAOMAAAAAAAAAAAAAAAAAAAAAB///////AAAAAAAAf///8AAAAAAAAAAAABCAAAHAAAAAAAAAAAAAAAAAAAAAA///////AAAAAAAAf///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////+AAAAAAAAP///8AAAAAAAAAAAAAACgCAAAAAAAAAAAAAAAAAAAAAAAf/////8AAAAAAAAf///+AQAAAAAAAAAAAAB+CAAAAAAAAAAAAAAAAAAAAAAAP/////4AAAAAAAA////+AwAAAAAAAAAAAAD8HAAAAAAAAAAAAAAAAAAAAAAAP/////4AAAAAAAA////+AwAAAAAAAAAAAAz8DgAAAAAAAAAAAAAAAAAAAAAAH/////4AAAAAAAA////+DwAAAAAAAAAAAD/8HgAAAAAAAAAAAAAAAAAAAAAAB/////4AAAAAAAA////8PwAAAAAAAAAAAD//HwAAAAAAAAAAAAAAAAAAAAAAA/////4AAAAAAAA////wPgAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAf////wAAAAAAAA////gPgAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAP////wAAAAAAAAf//+APgAAAAAAAAAAAf///8AAAAAAAAAAAAAAAAAAAAAAAP////wAAAAAAAAf//+APgAAAAAAAAAAD////+AAAAAAAAAAAAAAAAAAAAAAAP////gAAAAAAAAP//+AfAAAAAAAAAAAf////+AAEAAAAAAAAAAAAAAAAAAAAP////AAAAAAAAAP///AfAAAAAAAAAAA//////AAAAAAAAAAAAAAAAAAAAAAAf///4AAAAAAAAAP///APAAAAAAAAAAA//////gAAAAAAAAAAAAAAAAAAAAAAf///gAAAAAAAAAP//+AOAAAAAAAAAAB//////wAAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAH//4AEAAAAAAAAAAA//////4AAAAAAAAAAAAAAAAAAAAAAf//+AAAAAAAAAAH//4AAAAAAAAAAAAA//////4AAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAH//4AAAAAAAAAAAAA//////4AAAAAAAAAAAAAAAAAAAAAAf//+AAAAAAAAAAD//wAAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAAf//8AAAAAAAAAAB//gAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///4AAAAAAAAAAB//gAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAA//AAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAA/+AAAAAAAAAAAAAAP/AP//wAAAAAAAAAAAAAAAAAAAAAA///gAAAAAAAAAAA/4AAAAAAAAAAAAAAf8AG//wAAAAAAAAAAAAAAAAAAAAAA//3AAAAAAAAAAAAYAAAAAAAAAAAAAAAeAAF//gAAAAAAAAAAAAAAAAAAAAAB//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//gAABAAAAAAAAAAAAAAAAAAB//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAAgAAAAAAAAAAAAAAAAAD//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAAQAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADYAAAAcAAAAAAAAAAAAAAAAAB/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAADQAAAAAAAAAAAAAAAAAD/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAHAAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAeAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAD+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAH4AAAAAAr/PgBj/AAAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAAAD//gAAB//////////gAAAAAAAAAAAAAAAAAAAAAAABoAAAAAAAAAAAAAAAAB////8A////////////iAAAAAAAAAAAAAAAAAAAAAAz8AAAAAAAAAAAAAAAGH////4D/////////////8AAAAAAAAAAAAAAAAAAAAEf8AAAAAAAAAEAe/nB//////4//////////////+gAAAAAAAAAAAAAAAAAAAH9+AAAAAAAAf+///////////x////////////////4AAAAAAAAAAAAAAHAAAA5+AAAAAAAA/////////////v////////////////wAAAAAAAAABgAAB//+P//+AAAAAAAP/////////////////////////////+AAAAAAAAAAiWfIAf/////+AAAAAAA//////////////////////////////4AAAAAAAAH////////////wAAAAAAF//////////////////////////////gAAAAAAAH////////////wAAAAAA////////////////////////////////gAAAAAD+f///////////8AAAAAAf////////////////////////////////wAAAAAA////////////+AEAAD8A/////////////////////////////////2AAAADwB////////////w4AAH+AD///////////////////////////////8AAAAAAAA////////////4AHA/gAH///////////////////////////////8AAAAAAAf//////////////gAAA//////////////////////////////////AAAAAAAP//////////////8D////////////////////////////////////8AAAAHX//////////////////////////////////////////////////////8A/gD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////";
  var ISIK = [[41.9,12.5,1],[43.9,12.4,1],[47.1,9.5,1],[-26.5,31.2,1],[49.6,6.1,1],[6.9,158.1,1],[7.1,171.4,1],[-8.5,179.2,1],[7.5,134.6,1],[26.1,-9.7,1],[43.7,7.4,1],[1.3,173.0,1],[-11.7,43.2,1],[42.5,1.5,1],[10.7,-61.5,1],[-2.0,30.1,1],[-26.3,31.1,1],[4.8,31.6,1],[52.1,4.3,1],[46.1,14.5,1],[48.2,17.1,1],[25.3,51.5,1],[42.5,19.3,1],[6.9,79.9,1],[16.4,120.6,1],[-6.2,35.8,1],[46.9,7.5,1],[27.1,-13.2,1],[42.7,21.2,1],[15.3,-61.4,1],[11.6,43.1,1],[2.9,101.7,1],[35.0,135.7,1],[13.5,-16.6,1],[42.0,21.4,1],[13.1,-59.6,1],[6.5,2.6,1],[-3.4,29.4,1],[13.2,-61.2,1],[14.0,-61.0,1],[17.3,-62.7,1],[-20.2,57.5,1],[12.1,-61.7,1],[26.2,50.6,1],[17.1,-61.9,1],[-34.9,-56.2,1],[6.1,1.2,1],[36.8,10.2,2],[24.5,54.4,1],[37.9,58.4,1],[-15.4,28.3,1],[-17.8,31.0,1],[-8.6,125.6,1],[-17.7,168.3,1],[14.1,-87.2,1],[6.8,-58.2,1],[64.1,-21.9,1],[18.5,-72.3,1],[0.3,32.6,1],[5.8,-55.2,1],[13.5,2.1,1],[38.6,68.8,1],[-25.3,-57.6,1],[12.2,-86.3,1],[8.5,-13.2,1],[33.7,73.1,1],[27.7,85.3,1],[-29.1,26.2,1],[-25.7,28.2,1],[-9.5,147.2,1],[-9.4,159.9,1],[9.0,-79.5,1],[34.0,-6.8,1],[47.0,28.9,1],[-26.0,32.6,1],[2.1,45.4,1],[23.6,58.4,1],[6.9,79.9,1],[47.9,106.9,1],[-22.6,17.1,1],[9.1,7.5,1],[11.9,-15.6,1],[32.0,35.9,1],[54.7,25.3,1],[57.0,24.1,1],[42.9,74.6,1],[-29.3,27.5,1],[-18.9,47.5,1],[-0.2,-78.5,1],[9.9,-84.1,1],[13.7,-89.2,1],[18.0,-76.8,1],[12.1,15.0,1],[3.8,8.8,1],[15.3,38.9,1],[45.8,16.0,1],[59.4,24.7,1],[-14.0,33.8,1],[14.6,-90.5,1],[0.4,9.5,1],[-18.1,178.4,1],[-33.0,-71.6,1],[18.1,-16.0,1],[12.7,-8.0,1],[33.9,35.5,1],[41.7,44.8,1],[51.2,71.4,1],[18.0,102.6,1],[-4.3,15.3,1],[9.5,-13.7,1],[6.8,-5.3,1],[45.4,-75.7,1],[44.8,20.5,1],[4.9,114.9,1],[-19.0,-65.3,1],[17.3,-88.8,1],[4.4,18.6,1],[3.9,11.5,1],[41.3,19.8,1],[40.2,44.5,1],[40.4,49.9,2],[11.6,104.9,1],[-16.5,-68.2,1],[6.4,2.4,1],[42.7,23.3,1],[53.9,27.6,1],[27.5,89.6,1],[-24.6,25.9,1],[-35.3,149.1,1],[12.4,-1.5,1],[43.9,18.4,1],[19.8,96.1,1],[-21.1,-175.2,1],[9.6,44.1,1],[-4.6,55.4,1],[0.3,6.7,1],[-13.8,-171.8,1],[35.9,14.5,1],[4.2,73.5,1],[31.8,35.2,1],[14.9,-23.5,1],[25.1,-77.4,1],[35.2,33.4,1],[-41.3,174.8,1],[21.0,105.8,2],[39.9,32.9,2],[47.5,19.1,1],[15.4,44.2,2],[44.4,26.1,1],[33.5,36.3,2],[38.7,-9.1,2],[15.6,32.5,2],[59.9,10.7,1],[52.2,21.0,1],[39.0,125.8,2],[-6.8,39.3,2],[53.3,-6.3,1],[6.3,-10.8,1],[3.1,101.7,1],[23.1,-82.4,2],[50.1,14.4,1],[29.4,48.0,2],[18.5,-69.9,2],[5.6,-0.2,2],[32.9,13.2,2],[32.1,34.8,2],[60.2,24.9,1],[55.7,12.6,1],[5.3,-4.0,2],[-15.8,-47.9,2],[50.8,4.3,1],[23.7,90.4,3],[-8.8,13.2,2],[36.8,3.0,2],[16.8,96.2,2],[37.8,-122.4,2],[39.7,-105.0,2],[29.7,-95.3,2],[25.8,-80.2,2],[33.7,-84.4,2],[41.8,-87.6,3],[10.5,-66.9,2],[50.4,30.5,2],[25.2,55.3,1],[41.3,69.3,2],[40.4,-3.7,2],[46.2,6.1,1],[59.3,18.1,1],[13.8,100.5,2],[-12.0,-77.1,3],[14.7,-17.5,2],[-26.2,28.0,2],[52.4,4.9,1],[33.6,-7.6,2],[37.6,127.0,3],[14.6,121.0,3],[25.7,-100.3,2],[52.5,13.4,2],[43.8,87.6,2],[30.7,104.1,2],[34.7,135.5,3],[-4.3,15.3,2],[28.6,77.2,1],[13.0,77.6,2],[38.0,23.7,2],[33.3,44.4,2],[9.0,38.7,2],[35.7,51.4,2],[49.3,-123.1,2],[43.7,-79.4,2],[-34.6,-58.4,3],[34.5,69.2,2],[48.2,16.4,2],[-37.8,145.0,2],[25.0,121.6,2],[-36.8,174.8,1],[34.0,-118.2,3],[38.9,-77.0,2],[40.7,-74.0,3],[51.5,-0.1,3],[41.0,29.0,3],[24.6,46.7,2],[-33.9,18.4,2],[55.8,37.6,3],[19.4,-99.1,3],[6.4,3.4,3],[41.9,12.5,2],[39.9,116.4,3],[-1.3,36.8,2],[-6.2,106.8,3],[4.6,-74.1,2],[30.1,31.2,3],[31.2,121.4,3],[35.7,139.7,3],[19.1,72.9,3],[48.9,2.4,3],[-33.4,-70.7,2],[22.6,88.4,3],[-22.9,-43.2,3],[-23.6,-46.6,3],[-33.9,151.2,2],[1.3,103.9,2],[22.3,114.2,2]];
  var SEHIR = [ // ad, enlem, boylam, saat dilimi, haritada yazının yeri (s: sağ, l: sol, a: alt, u: üst)
    ["İstanbul", 41.01, 28.98, "Europe/Istanbul", "a"], ["Londra", 51.51, -0.13, "Europe/London", "l"], ["Frankfurt", 50.11, 8.68, "Europe/Berlin", "s"],
    ["Moskova", 55.76, 37.62, "Europe/Moscow", "s"], ["Dubai", 25.2, 55.27, "Asia/Dubai", "s"], ["Pekin", 39.9, 116.4, "Asia/Shanghai", "l"],
    ["Singapur", 1.35, 103.82, "Asia/Singapore", "a"], ["Tokyo", 35.68, 139.69, "Asia/Tokyo", "s"], ["Sidney", -33.87, 151.21, "Australia/Sydney", "s"],
    ["New York", 40.71, -74.01, "America/New_York", "s"], ["Los Angeles", 34.05, -118.24, "America/Los_Angeles", "l"], ["São Paulo", -23.55, -46.63, "America/Sao_Paulo", "s"],
    // 23 Kasım 2026: ek şehirler (Ekvator çevresi, Afrika, Latin Amerika, Pasifik)
    ["Meksiko", 19.43, -99.13, "America/Mexico_City", "l", 1], ["Bogota", 4.71, -74.07, "America/Bogota", "s", 1], ["Buenos Aires", -34.6, -58.38, "America/Argentina/Buenos_Aires", "l", 1],
    ["Kahire", 30.04, 31.24, "Africa/Cairo", "a", 1], ["Lagos", 6.52, 3.38, "Africa/Lagos", "l", 1], ["Kinşasa", -4.32, 15.31, "Africa/Kinshasa", "l", 1],
    ["Nairobi", -1.29, 36.82, "Africa/Nairobi", "s", 1], ["Johannesburg", -26.2, 28.05, "Africa/Johannesburg", "s", 1], ["Mumbai", 19.08, 72.88, "Asia/Kolkata", "s", 1],
    ["Cakarta", -6.21, 106.85, "Asia/Jakarta", "a", 1], ["Auckland", -36.85, 174.76, "Pacific/Auckland", "l", 1], ["Honolulu", 21.31, -157.86, "Pacific/Honolulu", "s", 1]];
  var IST = SEHIR[0], LAT0 = 84, LAT1 = -60; // haritada görünen enlemler (Antarktika kesilir)
  var R = Math.PI / 180, D = 180 / Math.PI;

  // ---------- Kara maskesi (360 x 180, 1°) ----------
  var KARA = (function () { var s = atob(KARA_B64), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; })();
  function kara(lat, lon) {
    var y = Math.floor(90 - lat), x = Math.floor(((lon + 180) % 360 + 360) % 360);
    if (y < 0 || y > 179) return false; var i = y * 360 + x;
    return (KARA[i >> 3] >> (7 - (i & 7))) & 1;
  }

  // ---------- Güneş (NOAA) ----------
  function gunes(t) {
    var jc = (t / 864e5 + 2440587.5 - 2451545) / 36525;
    var L0 = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
    var M = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
    var e = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
    var C = Math.sin(M * R) * (1.914602 - jc * (0.004817 + 0.000014 * jc)) + Math.sin(2 * M * R) * (0.019993 - 0.000101 * jc) + Math.sin(3 * M * R) * 0.000289;
    var om = 125.04 - 1934.136 * jc, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * R);
    var eps0 = 23 + (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) / 60, eps = eps0 + 0.00256 * Math.cos(om * R);
    var dek = Math.asin(Math.sin(eps * R) * Math.sin(lam * R)) * D;
    var y = Math.pow(Math.tan(eps * R / 2), 2);
    var eot = 4 * D * (y * Math.sin(2 * L0 * R) - 2 * e * Math.sin(M * R) + 4 * e * y * Math.sin(M * R) * Math.cos(2 * L0 * R) - 0.5 * y * y * Math.sin(4 * L0 * R) - 1.25 * e * e * Math.sin(2 * M * R));
    var utcDk = ((t % 864e5) + 864e5) % 864e5 / 6e4;
    var lon = -(utcDk + eot - 720) / 4; lon = ((lon + 540) % 360) - 180;
    return { dek: dek, eot: eot, lat: dek, lon: lon, lam: ((lam % 360) + 360) % 360 };
  }
  function yuk(lat, lon, g) { var H = (lon - g.lon) * R; return Math.asin(Math.sin(lat * R) * Math.sin(g.dek * R) + Math.cos(lat * R) * Math.cos(g.dek * R) * Math.cos(H)) * D; }
  // Gün doğumu, batımı, öğle (UTC zaman damgası); kutup gecesi/gündüzü için null
  function dogBat(lat, lon, t) {
    var gun = Math.floor((t + lon * 4 * 6e4) / 864e5) * 864e5, ogle = gun + (720 - 4 * lon) * 6e4, g = gunes(ogle);
    ogle = gun + (720 - 4 * lon - g.eot) * 6e4; g = gunes(ogle);
    var c = Math.cos(90.833 * R) / (Math.cos(lat * R) * Math.cos(g.dek * R)) - Math.tan(lat * R) * Math.tan(g.dek * R);
    if (c < -1 || c > 1) return { ogle: ogle, dog: null, bat: null };
    var ha = Math.acos(c) * D * 4 * 6e4; return { ogle: ogle, dog: ogle - ha, bat: ogle + ha };
  }
  // Sıradaki ekinoks / gün dönümü: güneşin ekliptik boylamı 0, 90, 180, 270 dereceyi geçtiği an
  function gokOlaylari(t, kac) {
    var AD = { 0: "Mart ekinoksu", 90: "Haziran gün dönümü", 180: "Eylül ekinoksu", 270: "Aralık gün dönümü" };
    var ACK = { 0: "Gece ve gündüz her yerde eşit; ilkbahar başlar", 90: "Kuzey yarım kürede yılın en uzun günü", 180: "Gece ve gündüz her yerde eşit; sonbahar başlar", 270: "Kuzey yarım kürede yılın en kısa günü" };
    var out = [], a = t, la = gunes(a).lam;
    while (out.length < kac) {
      var hedef = (Math.floor(la / 90) + 1) * 90 % 360, b = a + 864e5, lb = gunes(b).lam;
      var gecti = function (x, y) { var d1 = ((x - hedef + 540) % 360) - 180, d2 = ((y - hedef + 540) % 360) - 180; return d1 < 0 && d2 >= 0; };
      if (gecti(la, lb)) {
        var lo = a, hi = b; for (var i = 0; i < 30; i++) { var m = (lo + hi) / 2; if (gecti(gunes(lo).lam, gunes(m).lam)) hi = m; else lo = m; }
        out.push({ t: hi, ad: AD[hedef], ack: ACK[hedef] });
      }
      a = b; la = lb;
    }
    return out;
  }

  // ---------- Biçim ----------
  var fmtCache = {};
  function fmt(tz, o) { var k = tz + JSON.stringify(o); return fmtCache[k] || (fmtCache[k] = new Intl.DateTimeFormat("tr-TR", Object.assign({ timeZone: tz }, o))); }
  function saat(t, tz, sn) { return fmt(tz, { hour: "2-digit", minute: "2-digit", second: sn ? "2-digit" : undefined, hourCycle: "h23" }).format(t); }
  function tzFark(tz, t) { // UTC'ye göre dakika
    var p = {}; fmt(tz, { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(t).forEach(function (x) { p[x.type] = +x.value; });
    return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute) - Math.floor(t / 6e4) * 6e4) / 6e4);
  }
  var fmtGun = {};
  function gunAnah(tz, t) { return (fmtGun[tz] || (fmtGun[tz] = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }))).format(t); }
  function sure(dk, isaret) { var s = dk < 0 ? "−" : "+", m = Math.abs(Math.round(dk)), h = Math.floor(m / 60); m %= 60; return (isaret ? s : "") + (h ? h + " sa" + (m ? " " + m + " dk" : "") : m + " dk"); }
  function nf(v, d) { return Number(v).toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function boy(lon) { return nf(Math.abs(lon), 1) + "° " + (lon >= 0 ? "D" : "B"); }
  function en(lat) { return nf(Math.abs(lat), 1) + "° " + (lat >= 0 ? "K" : "G"); }
  function gunesSaati(t, lon, gercek) { var g = gunes(t), dk = ((t % 864e5) + 864e5) % 864e5 / 6e4 + lon * 4 + (gercek ? g.eot : 0); dk = ((dk % 1440) + 1440) % 1440; return String(Math.floor(dk / 60)).padStart(2, "0") + ":" + String(Math.floor(dk % 60)).padStart(2, "0"); }

  // ---------- Görünüm ----------
  var css = document.createElement("style");
  css.textContent =
    ".dsO{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.78);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s ease}" +
    ".dsO.ac{opacity:1}.dsO[hidden]{display:none}" +
    ".dsK{position:relative;width:100%;max-width:1000px;max-height:94vh;overflow:auto;overscroll-behavior:contain;background:radial-gradient(120% 60% at 50% 0%,#14100a 0%,#050505 60%);border:1px solid #2a2418;border-bottom:0;border-radius:24px 24px 0 0;color:#e8e2d4;padding:14px 14px calc(18px + env(safe-area-inset-bottom));transform:translateY(28px);transition:transform .35s cubic-bezier(.2,.7,.2,1);font:14px/1.45 system-ui,-apple-system,'Segoe UI',sans-serif}" +
    ".dsO.ac .dsK{transform:none}" +
    "@media (min-width:760px){.dsO{align-items:center}.dsK{border-radius:24px;border-bottom:1px solid #2a2418;padding:20px 22px 22px}}" +
    ".dsX{position:sticky;top:0;float:right;z-index:3;width:38px;height:38px;border-radius:12px;border:1px solid #3a3020;background:rgba(10,10,10,.8);color:#cfc6b0;font-size:16px;cursor:pointer}" +
    ".dsB{margin:2px 0 2px;font:italic 700 24px Georgia,'Times New Roman',serif;color:#f3d38a;letter-spacing:.2px}" +
    ".dsAlt{font-size:12.5px;color:#9a917e;margin:0 0 10px}.dsAlt b{color:#e8e2d4;font-weight:600;font-variant-numeric:tabular-nums}" +
    ".dsH{position:relative;border-radius:16px;overflow:hidden;border:1px solid #2a2418;background:#05070b;touch-action:none;cursor:crosshair}" +
    ".dsH canvas{display:block;width:100%;height:auto}" +
    ".dsArac{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 2px 0}.dsIp{font-size:12px;color:#9a917e;line-height:1.3}" +
    ".dsOyn{flex:none;min-height:34px;padding:0 12px;border-radius:999px;border:1px solid #5a4320;background:rgba(224,162,79,.1);color:#f3d38a;font:700 12.5px system-ui,sans-serif;cursor:pointer}.dsOyn[aria-pressed=\"true\"]{background:#e0a24f;color:#1a1205}" +
    ".dsCor{position:absolute;inset:0;pointer-events:none}" +
    ".dsGir{position:absolute;color:#9fd3ff;opacity:.9;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px}" +
    ".dsGir svg{display:block;animation:dsDon 3.2s linear infinite}.dsGir.g svg{animation-direction:reverse}" +
    ".dsGir small{font:600 10.5px/1.15 system-ui,sans-serif;color:#cfe8ff;text-align:center;white-space:nowrap;text-shadow:0 1px 3px #000;background:rgba(3,6,12,.6);border-radius:6px;padding:1px 5px}" +
    "@keyframes dsDon{to{transform:rotate(-360deg)}}" +
    ".dsL{margin-top:10px}.dsL summary{cursor:pointer;font:700 13.5px system-ui,sans-serif;color:#f3d38a;list-style:none;min-height:28px;display:flex;align-items:center}.dsL summary::-webkit-details-marker{display:none}" +
    ".dsL summary::after{content:'›';margin-left:auto;font-size:18px;transition:transform .2s ease}.dsL[open] summary::after{transform:rotate(90deg)}" +
    ".dsL ul{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:9px}@media (min-width:760px){.dsL ul{grid-template-columns:1fr 1fr;column-gap:18px}}" +
    ".dsL li{display:flex;gap:10px;align-items:flex-start;font-size:12.5px;line-height:1.45;color:#cfc6b0}.dsL li b{display:block;color:#fff;font-weight:600}" +
    ".cz{flex:none;width:26px;height:14px;margin-top:3px;font-style:normal;text-align:center;line-height:14px}" +
    ".cz.gw{border-top:2px solid #f3d38a;height:0;margin-top:9px}.cz.mr{border-top:1px solid rgba(160,170,200,.5);height:0;margin-top:9px}.cz.gg{height:12px;border-bottom:2px solid #c9a35e;border-radius:0 0 50% 50%}" +
    ".cz.ek{border-top:2px solid rgba(120,190,255,.8);height:0;margin-top:9px}.cz.dn{border-top:2px dashed rgba(255,170,110,.75);height:0;margin-top:9px}.cz.yl{border-top:2px dotted rgba(243,211,138,.85);height:0;margin-top:9px}" +
    ".dsDaha{display:block;margin:8px auto 0;min-height:36px;padding:0 16px;border-radius:999px;border:1px solid #3a3020;background:transparent;color:#cfc6b0;font:600 12.5px system-ui,sans-serif;cursor:pointer}" +
    ".dsZ{display:flex;align-items:center;gap:10px;margin:10px 2px 4px}.dsZ input{flex:1;accent-color:#e0a24f;height:28px}" +
    ".dsZ span{min-width:92px;font:600 12.5px system-ui,sans-serif;color:#cfc6b0;font-variant-numeric:tabular-nums;text-align:right}" +
    ".dsZ button{min-height:32px;padding:0 12px;border-radius:999px;border:1px solid #5a4320;background:rgba(224,162,79,.1);color:#f3d38a;font:600 12.5px system-ui,sans-serif;cursor:pointer}" +
    ".dsZ button[hidden]{display:none}" +
    ".dsG{display:grid;gap:10px;margin-top:10px}@media (min-width:760px){.dsG{grid-template-columns:1.15fr 1fr}}" +
    ".dsC{border:1px solid #2a2418;border-radius:16px;background:rgba(255,255,255,.025);padding:12px 14px}" +
    ".dsC h3{margin:0 0 6px;font:800 11px system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#9a917e}" +
    ".dsP .yer{font:italic 700 19px Georgia,'Times New Roman',serif;color:#f3d38a}.dsP .yer small{font:500 12px system-ui,sans-serif;color:#9a917e;font-style:normal;margin-left:6px}" +
    ".dsP .ss{display:flex;gap:18px;margin:6px 0 4px;flex-wrap:wrap}.dsP .ss div{font-size:11.5px;color:#9a917e}.dsP .ss b{display:block;font:300 28px/1.1 system-ui,sans-serif;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:-.02em}" +
    ".dsP p{margin:4px 0 0;font-size:13px;color:#cfc6b0}.dsP p b{color:#f3d38a;font-weight:600}.dsP .kural{margin-top:8px;padding:8px 10px;border-radius:11px;background:rgba(224,162,79,.08);border:1px solid #3a2f1c;font-size:12.5px;color:#e8d9b8}" +
    ".dsS{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}@media (min-width:760px){.dsS{grid-template-columns:repeat(4,minmax(0,1fr))}}" +
    ".dsS button{display:block;text-align:left;border:1px solid #2a2418;border-radius:14px;background:rgba(255,255,255,.025);padding:9px 11px;color:inherit;font:inherit;cursor:pointer;transition:border-color .2s ease,background-color .2s ease}" +
    ".dsS button.sec{border-color:#e0a24f;background:rgba(224,162,79,.1)}.dsS button:active{transform:scale(.975)}" +
    ".dsS .ad{display:flex;justify-content:space-between;font-size:12.5px;color:#cfc6b0}.dsS .sa{display:block;font:300 26px/1.15 system-ui,sans-serif;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:-.02em;margin-top:1px}" +
    ".dsS .fk{display:block;font-size:11.5px;color:#8f8672;margin-top:1px}" +
    ".dsT ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}.dsT li{display:flex;gap:10px;align-items:baseline}.dsT li .i{font-size:16px}.dsT li b{color:#f3d38a;font-weight:600}.dsT li small{display:block;color:#8f8672;font-size:11.5px}" +
    ".dsN{margin:12px 2px 0;font-size:11px;color:#6f6858;line-height:1.5}" +
    ".dsBuy{flex:none;min-height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(243,211,138,.55);background:rgba(5,6,10,.78);color:#f3d38a;font:700 12.5px system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(4px)}" +
    ".dsBuy:active{transform:scale(.96)}" +
    ".dsBO{position:fixed;inset:0;z-index:460;background:#030406;color:#e8e2d4;font:13px/1.4 system-ui,-apple-system,'Segoe UI',sans-serif;opacity:0;transition:opacity .3s ease}.dsBO.ac{opacity:1}.dsBO[hidden]{display:none}" +
    ".dsBI{position:absolute;left:0;top:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:8px 12px;box-sizing:border-box}" +
    ".dsBI.don{transform-origin:top left;transform:rotate(90deg) translateY(-100%)}" +
    ".dsBU{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%}" +
    ".dsBU b{font:italic 700 17px Georgia,'Times New Roman',serif;color:#f3d38a}.dsBU span{color:#9a917e;font-variant-numeric:tabular-nums}.dsBU span i{font-style:normal;color:#fff}" +
    ".dsBU button{width:36px;height:36px;flex:none;border-radius:11px;border:1px solid #3a3020;background:rgba(10,10,10,.8);color:#cfc6b0;font-size:15px;cursor:pointer}" +
    ".dsBC{position:relative;border-radius:14px;overflow:hidden;border:1px solid #2a2418;touch-action:none;cursor:crosshair;line-height:0}.dsBC canvas{display:block}" +
    ".dsBA{display:flex;align-items:center;gap:10px;width:100%}.dsBA input{flex:1;accent-color:#e0a24f;height:26px}.dsBA span{min-width:92px;text-align:right;color:#cfc6b0;font:600 12px system-ui,sans-serif}" +
    "@media (prefers-reduced-motion: reduce){.dsO,.dsK,.dsBO{transition:none}.dsGir svg{animation:none}}";
  document.head.appendChild(css);

  var O, K, cv, cx, W = 0, Hh = 0, dpr = 1, kayma = 0, prob = { lat: IST[1], lon: IST[2], ad: "İstanbul" }, secSehir = 0, zSaat = null, zHarita = null, geri = null, sonCiz = 0;
  function simdi() { return Date.now() + kayma * 6e4; }
  function xy(lat, lon) { return [(lon + 180) / 360 * W, (LAT0 - lat) / (LAT0 - LAT1) * Hh]; }

  function kur() {
    O = document.createElement("div"); O.className = "dsO"; O.hidden = true;
    O.innerHTML = '<div class="dsK" role="dialog" aria-modal="true" aria-labelledby="dsB">' +
      '<button type="button" class="dsX" aria-label="Kapat">✕</button>' +
      '<div class="dsB" id="dsB">🌍 Dünya saati</div><div class="dsAlt" id="dsAlt"></div>' +
      '<div class="dsH" id="dsH"><canvas id="dsCv" role="img" aria-label="Gece ve gündüzü gösteren canlı dünya haritası"></canvas><div class="dsCor" aria-hidden="true"></div></div>' +
      '<div class="dsArac"><span class="dsIp">Haritaya dokun: o boylamın güneş saati</span><button type="button" class="dsBuy" id="dsBuy"></button></div>' +
      '<div class="dsZ"><button type="button" class="dsOyn" aria-pressed="false">▶ Oynat</button><input type="range" id="dsKay" min="-720" max="720" step="15" value="0" aria-label="Zamanı kaydır"><span id="dsKayY">şimdi</span><button type="button" id="dsSimdi" hidden>Şimdi</button></div>' +
      '<div class="dsG"><div class="dsC dsP" id="dsP"></div><div class="dsC dsT" id="dsT"></div></div>' +
      '<details class="dsC dsL"><summary>🧭 Haritadaki çizgiler ne anlatıyor?</summary><ul>' +
      '<li><i class="cz gw"></i><span><b>Greenwich (0° boylam)</b> Saat dilimlerinin başlangıcı. Buradan doğuya her 15° bir saat ileri, batıya bir saat geri; 1° = 4 dakika.</span></li>' +
      '<li><i class="cz mr"></i><span><b>İnce dikey çizgiler</b> 15°\'lik saat dilimleri (üstteki sayılar UTC farkı). Ülkeler sınırlarına göre saat seçtiği için gerçek dilimler bu çizgilerden sapar.</span></li>' +
      '<li><i class="cz gg"></i><span><b>Altın eğri</b> Gece-gündüz çizgisi. Ekinokslarda kutuptan kutba dümdüz iner; yaz ve kışta eğilir.</span></li>' +
      '<li><i class="cz ek"></i><span><b>Ekvator (0° enlem)</b> Dünya\'yı kuzey ve güney yarım küreye böler. Burada gece ve gündüz yıl boyu yaklaşık 12\'şer saattir; mart ve eylül ekinokslarında güneş tam tepesindedir.</span></li>' +
      '<li><i class="cz dn"></i><span><b>Yengeç ve Oğlak dönenceleri (23,44°)</b> Güneşin tam tepeye gelebildiği en kuzey ve en güney enlemler: haziran gün dönümünde Yengeç\'in, aralık gün dönümünde Oğlak\'ın tepesindedir. 23,44°, Dünya\'nın eksen eğikliğidir; aradaki kuşak tropikal bölgedir.</span></li>' +
      '<li><i class="cz yl"></i><span><b>Noktalı altın çizgi</b> Güneşin bugünkü yolu: güneş gün boyunca bu enlemin üzerinden batıya ilerler. "Oynat"a basınca izleyebilirsin.</span></li>' +
      '<li><i class="cz gi">🌀</i><span><b>Girdaplar (Coriolis)</b> Dünya döndüğü için büyük hava kütleleri sapar: kasırgalar kuzey yarım kürede saat yönünün tersine, güney yarım kürede saat yönünde döner. ' +
      'Lavabo ya da kovadaki girdabın yönünü ise bu etki belirlemez; o ölçekte çok zayıftır, kabın şekli ve suyun ilk hareketi belirler.</span></li></ul></details>' +
      '<div class="dsS" id="dsS"></div><button type="button" class="dsDaha" id="dsDaha" aria-expanded="false">＋ 12 şehir daha</button>' +
      '<p class="dsN">Her 15° boylam 1 saat, her 1° boylam 4 dakika eder: Dünya 24 saatte 360° döner. Saat dilimleri siyasi sınırlara göre çizildiği için şehirlerin saati çoğu zaman güneş saatinden farklıdır. ' +
      'Güneş hesapları NOAA formülleriyle, dakika düzeyinde yaklaşıktır. Harita verisi: Natural Earth. Bu sayfa hiçbir yere bağlanmaz, konum sormaz.</p></div>';
    document.body.appendChild(O); K = O.firstChild; cv = O.querySelector("#dsCv"); cx = cv.getContext("2d");
    O.addEventListener("click", function (e) { if (e.target === O || e.target.closest(".dsX")) kapa(); });
    var kay = O.querySelector("#dsKay");
    kay.addEventListener("input", function () { oynat(false); kayma = +kay.value; yenile(true); });
    O.querySelector("#dsSimdi").addEventListener("click", function () { oynat(false); kayma = 0; kay.value = 0; yenile(true); });
    O.querySelector(".dsZ .dsOyn").addEventListener("click", function () { oynat(!oyn); });
    O.querySelector("#dsDaha").addEventListener("click", function () { tumSehir = !tumSehir; this.setAttribute("aria-expanded", String(tumSehir)); this.textContent = tumSehir ? "− Daha az şehir" : "＋ 12 şehir daha"; yaziGuncelle(true); });
    O.querySelector("#dsS").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-i]"); if (!b) return; var c = SEHIR[+b.dataset.i];
      secSehir = +b.dataset.i; prob = { lat: c[1], lon: c[2], ad: c[0] }; yenile(true);
    });
    var basili = false;
    var dokun = function (e) { var r = cv.getBoundingClientRect(); sec_((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); };
    sec_ = function (x, y) {
      var lon = Math.max(-180, Math.min(180, x * 360 - 180)), lat = LAT0 - y * (LAT0 - LAT1), yak = null, ym = 1e9;
      SEHIR.forEach(function (c, i) { var d = Math.hypot(c[2] - lon, (c[1] - lat) * 1.2); if (d < ym) { ym = d; yak = i; } });
      if (ym < 6) { var c = SEHIR[yak]; prob = { lat: c[1], lon: c[2], ad: c[0] }; secSehir = yak; }
      else { prob = { lat: lat, lon: lon, ad: null }; secSehir = -1; }
      yenile(true);
    };
    cv.addEventListener("pointerdown", function (e) { basili = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} dokun(e); });
    cv.addEventListener("pointermove", function (e) { if (basili) dokun(e); });
    cv.addEventListener("pointerup", function () { basili = false; });
    cv.addEventListener("pointercancel", function () { basili = false; });
    addEventListener("resize", function () { if (!O.hidden) { boyutla(); ciz(); } });
    O.querySelector("#dsBuy").textContent = KABA ? "↻ Yan çevir" : "⤢ Büyüt";
    O.querySelector("#dsBuy").setAttribute("aria-label", KABA ? "Haritayı yan çevirip büyüt" : "Haritayı tam ekran büyüt");
    O.querySelector("#dsBuy").addEventListener("click", buyukAc);
  }

  // ---------- Yan çevrilmiş / tam ekran büyük harita ----------
  // Telefonda tam ekrana geçip yatay kilitlenir (Android); kilit olmazsa (ör. iPhone) harita 90° döndürülerek gösterilir.
  var KABA = window.matchMedia && matchMedia("(pointer: coarse)").matches, sec_ = null;
  var B = null, buyuk = false, don = false, tamEkran = false, cizB = false;
  function buyukKur() {
    B = { o: document.createElement("div") }; B.o.className = "dsBO"; B.o.hidden = true;
    B.o.innerHTML = '<div class="dsBI" role="dialog" aria-modal="true" aria-label="Büyük dünya haritası"><div class="dsBU"><b>🌍 Dünya saati</b><span id="dsBZ"></span><button type="button" aria-label="Küçült">✕</button></div>' +
      '<div class="dsBC"><canvas role="img" aria-label="Şehir adlarıyla büyük dünya haritası"></canvas><div class="dsCor" aria-hidden="true"></div></div>' +
      '<div class="dsBA"><button type="button" class="dsOyn" aria-pressed="false">▶ Oynat</button><input type="range" min="-720" max="720" step="15" value="0" aria-label="Zamanı kaydır"><span></span></div></div>';
    document.body.appendChild(B.o);
    B.i = B.o.firstChild; B.cv = B.o.querySelector("canvas"); B.cx = B.cv.getContext("2d"); B.k = B.o.querySelector(".dsBA input"); B.ky = B.o.querySelector(".dsBA span");
    B.o.querySelector(".dsBU button").addEventListener("click", buyukKapa);
    B.k.addEventListener("input", function () { oynat(false); kayma = +B.k.value; O.querySelector("#dsKay").value = kayma; yenile(true); });
    B.o.querySelector(".dsOyn").addEventListener("click", function () { oynat(!oyn); });
    var bas = false;
    var konum = function (e) {
      if (!don) { var r = B.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; }
      // 90° dönmüş kutu: ekrandaki (X, Y) → kutu içi (Y, kutuYüksekliği − X)
      var x = e.clientY, y = B.ih - e.clientX, ox = B.cv.offsetLeft, oy = B.cv.offsetTop; // tuvalin .dsBI içindeki yeri
      return [(x - ox) / B.w, (y - oy) / B.h];
    };
    B.cv.addEventListener("pointerdown", function (e) { bas = true; try { B.cv.setPointerCapture(e.pointerId); } catch (x) {} var k = konum(e); sec_(k[0], k[1]); });
    B.cv.addEventListener("pointermove", function (e) { if (bas) { var k = konum(e); sec_(k[0], k[1]); } });
    B.cv.addEventListener("pointerup", function () { bas = false; }); B.cv.addEventListener("pointercancel", function () { bas = false; });
    addEventListener("resize", function () { if (buyuk) setTimeout(buyukYerlestir, 60); });
    document.addEventListener("fullscreenchange", function () { if (buyuk && tamEkran && !document.fullscreenElement) buyukKapa(); });
  }
  function buyukYerlestir() {
    var vw = innerWidth, vh = innerHeight; don = vh > vw * 1.1; // kilit tutmadıysa dikey ekranda döndür
    var iw = don ? vh : vw, ih = don ? vw : vh; B.ih = ih;
    B.i.classList.toggle("don", don); B.i.style.width = iw + "px"; B.i.style.height = ih + "px";
    var w = Math.min(iw - 24, (ih - 104) * 360 / (LAT0 - LAT1)); w = Math.max(280, Math.floor(w));
    B.w = w; B.h = Math.round(w * (LAT0 - LAT1) / 360); B.dpr = Math.min(2, window.devicePixelRatio || 1);
    B.cv.width = Math.round(B.w * B.dpr); B.cv.height = Math.round(B.h * B.dpr); B.cv.style.width = B.w + "px"; B.cv.style.height = B.h + "px";
    girdaplar(B.o.querySelector(".dsCor"), B.w, B.h);
    buyukCiz();
  }
  function buyukCiz() {
    if (!buyuk || !B.w) return; // tam ekrana geçiş sürerken boyut henüz yok
    var k = [W, Hh, cx, dpr, sonCiz]; W = B.w; Hh = B.h; cx = B.cx; dpr = B.dpr; cizB = true;
    try { ciz(); } finally { W = k[0]; Hh = k[1]; cx = k[2]; dpr = k[3]; sonCiz = k[4]; cizB = false; }
    var t = simdi(); B.o.querySelector("#dsBZ").innerHTML = "UTC <i>" + saat(t, "UTC") + "</i> · İstanbul <i>" + saat(t, IST[3]) + "</i>";
    B.k.value = kayma; B.ky.textContent = kayma ? (kayma > 0 ? sure(kayma) + " sonra" : sure(-kayma) + " önce") : "şimdi";
  }
  function buyukAc() {
    if (!B) buyukKur();
    buyuk = true; B.o.hidden = false; tamEkran = false; B.w = 0;
    var sonra = function () { buyukYerlestir(); requestAnimationFrame(function () { B.o.classList.add("ac"); B.o.querySelector(".dsBU button").focus({ preventScroll: true }); }); };
    var fs = B.o.requestFullscreen ? B.o.requestFullscreen({ navigationUI: "hide" }) : null;
    if (fs && fs.then) fs.then(function () {
      tamEkran = true;
      var kilit = screen.orientation && screen.orientation.lock ? screen.orientation.lock("landscape") : null;
      if (kilit && kilit.then) kilit.then(function () { setTimeout(sonra, 250); }, sonra); else sonra();
    }, sonra); else sonra();
    window.Rapor && Rapor.bolum("dunya-saati-buyuk");
  }
  function buyukKapa() {
    if (!buyuk) return; buyuk = false; B.o.classList.remove("ac");
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    setTimeout(function () { B.o.hidden = true; var d = O && O.querySelector("#dsBuy"); if (d) d.focus({ preventScroll: true }); }, 300);
  }
  // Girdaplar: kuzeyde saat yönünün tersine, güneyde saat yönünde dönen iki kasırga simgesi (Coriolis)
  var GIR = [[22, -52, "k", "Kuzey: saat yönünün tersine ↺"], [-14, 82, "g", "Güney: saat yönünde ↻"]];
  // Üç kollu sarmal; kollar dönüşün gerisinde kalır (uydu görüntülerindeki gibi). Kuzeyde dışa doğru saat yönünde kıvrılıp
  // saat yönünün tersine döner; güneyde tam aynası.
  function girYol(yon) {
    var d = "";
    for (var j = 0; j < 3; j++) for (var s = 0; s <= 1.0001; s += 0.125) {
      var rr = 2.8 + s * 8.4, a = j * 2.0944 + yon * s * 2.2;
      d += (s ? "L" : "M") + (rr * Math.cos(a)).toFixed(2) + " " + (rr * Math.sin(a)).toFixed(2);
    }
    return d;
  }
  var GIR_YOL = { k: girYol(1), g: girYol(-1) };
  function girdaplar(kap, w, h) {
    if (!kap) return; var yaziVar = w >= 560, boy = Math.round(Math.max(18, Math.min(34, w / 26)));
    kap.innerHTML = GIR.map(function (g) {
      var x = (g[1] + 180) / 360 * w, y = (LAT0 - g[0]) / (LAT0 - LAT1) * h;
      return '<div class="dsGir ' + g[2] + '" style="left:' + x.toFixed(1) + "px;top:" + y.toFixed(1) + 'px"><svg width="' + boy + '" height="' + boy + '" viewBox="-12 -12 24 24" aria-hidden="true"><circle r="2.4" fill="currentColor"/><path d="' + GIR_YOL[g[2]] + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (yaziVar ? "<small>" + g[3] + "</small>" : "") + "</div>";
    }).join("");
  }
  // Günü oynat: 24 saat yaklaşık 12 saniyede akar (dakikada 120 dk)
  var oyn = null, tumSehir = false;
  function oynat(ac) {
    if (!ac) { if (oyn) { cancelAnimationFrame(oyn.id); oyn = null; } dugmeler(false); return; }
    if (oyn) return; dugmeler(true);
    oyn = { son: performance.now(), yazi: 0 };
    var adim = function (z) {
      if (!oyn) return; var dt = Math.min(100, z - oyn.son); oyn.son = z;
      kayma += dt * 0.12; if (kayma > 720) kayma -= 1440;
      var v = Math.round(kayma / 15) * 15; O.querySelector("#dsKay").value = v; if (B) B.k.value = v;
      ciz(); buyukCiz();
      if (z - oyn.yazi > 700) { oyn.yazi = z; yaziGuncelle(true); }
      oyn.id = requestAnimationFrame(adim);
    };
    oyn.id = requestAnimationFrame(adim);
  }
  function dugmeler(acik) {
    [].forEach.call(document.querySelectorAll(".dsOyn"), function (b) { b.setAttribute("aria-pressed", String(acik)); b.textContent = acik ? "⏸ Durdur" : "▶ Oynat"; });
  }

  function boyutla() {
    var w = Math.round(O.querySelector("#dsH").clientWidth) || 360;
    dpr = Math.min(2, window.devicePixelRatio || 1); W = w; Hh = Math.round(w * (LAT0 - LAT1) / 360);
    cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); cv.style.height = Hh + "px";
    girdaplar(O.querySelector(".dsCor"), W, Hh);
  }

  // ---------- Harita çizimi ----------
  function ciz() {
    var t = simdi(), g = gunes(t); sonCiz = Date.now();
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var bg = cx.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, "#070a12"); bg.addColorStop(1, "#04060a");
    cx.fillStyle = bg; cx.fillRect(0, 0, W, Hh);
    // Gündüz tarafına hafif sıcak ışık (kaba hücreler)
    var hc = Math.max(4, Math.round(W / 120));
    for (var py = 0; py < Hh; py += hc) for (var px = 0; px < W; px += hc) {
      var la = LAT0 - (py + hc / 2) / Hh * (LAT0 - LAT1), lo = (px + hc / 2) / W * 360 - 180, a = yuk(la, lo, g);
      if (a > -12) { var k = a > 0 ? 0.05 + 0.07 * Math.sin(a * R) : 0.05 * (1 + a / 12); cx.fillStyle = "rgba(224,162,79," + k.toFixed(3) + ")"; cx.fillRect(px, py, hc, hc); }
    }
    // Kara noktaları
    var adim = Math.min(4, Math.max(1, 3.6 * 360 / W)), ar = Math.max(0.7, adim * W / 360 * 0.34);
    for (var lat = LAT0 - adim / 2; lat > LAT1; lat -= adim) for (var lon = -180 + adim / 2; lon < 180; lon += adim) {
      if (!kara(lat, lon)) continue;
      var al = yuk(lat, lon, g), p = xy(lat, lon), c;
      if (al > 0) { var s = Math.sin(al * R); c = "rgba(" + Math.round(200 + 43 * s) + "," + Math.round(150 + 61 * s) + "," + Math.round(80 + 58 * s) + "," + (0.55 + 0.45 * s).toFixed(2) + ")"; }
      else if (al > -12) { var f = 1 + al / 12; c = "rgba(" + Math.round(110 + 90 * f) + "," + Math.round(100 + 50 * f) + "," + Math.round(120 - 40 * f) + "," + (0.32 + 0.23 * f).toFixed(2) + ")"; }
      else c = "rgba(96,112,150,.30)";
      cx.fillStyle = c; cx.beginPath(); cx.arc(p[0], p[1], ar, 0, 6.283); cx.fill();
    }
    // Gece şehir ışıkları
    ISIK.forEach(function (s) {
      var al = yuk(s[0], s[1], g); if (al > -4 || s[0] > LAT0 || s[0] < LAT1) return;
      var p = xy(s[0], s[1]), r = (0.55 + 0.45 * s[2]) * Math.max(0.8, W / 640) * (al < -12 ? 1 : (-al - 4) / 8);
      var gr = cx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 2.2); gr.addColorStop(0, "rgba(255,226,160,.9)"); gr.addColorStop(0.3, "rgba(255,190,100,.38)"); gr.addColorStop(1, "rgba(255,160,60,0)");
      cx.fillStyle = gr; cx.beginPath(); cx.arc(p[0], p[1], r * 2.2, 0, 6.283); cx.fill();
    });
    // Ekvator, dönenceler ve güneşin bugünkü yolu
    var yaz = Math.max(10, Math.min(12, W / 70));
    cx.font = "600 " + yaz + "px system-ui,sans-serif"; cx.textBaseline = "middle";
    var dar = W < 560;
    [[0, "Ekvator", "Ekvator", "rgba(120,190,255,.6)", [], 1.4], [23.44, "Yengeç Dönencesi", "Yengeç D.", "rgba(255,170,110,.55)", [6, 4], 1.2], [-23.44, "Oğlak Dönencesi", "Oğlak D.", "rgba(255,170,110,.55)", [6, 4], 1.2]].forEach(function (d) {
      var y = xy(d[0], 0)[1]; cx.strokeStyle = d[3]; cx.setLineDash(d[4]); cx.lineWidth = d[5]; cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke(); cx.setLineDash([]);
      var et = dar ? d[2] : d[1], fs = dar ? 10 : yaz; cx.font = "700 " + fs + "px system-ui,sans-serif";
      var tw = cx.measureText(et).width + 8; cx.fillStyle = "rgba(3,5,10,.72)"; cx.fillRect(3, y - fs - 4, tw, fs + 4);
      cx.fillStyle = d[3].replace(/[\d.]+\)$/, ".95)"); cx.fillText(et, 7, y - fs / 2 - 2);
    });
    cx.font = "600 " + yaz + "px system-ui,sans-serif";
    var gy = xy(g.dek, 0)[1]; cx.setLineDash([1.5, 4]); cx.lineWidth = 1.6; cx.strokeStyle = "rgba(243,211,138,.6)"; cx.beginPath(); cx.moveTo(0, gy); cx.lineTo(W, gy); cx.stroke(); cx.setLineDash([]); cx.lineWidth = 1;
    var yer = [];
    if (!dar) {
      var gyx = xy(0, -132)[0], gyy = gy + (g.dek < -12 ? -yaz * 0.9 : yaz * 0.9), gyw = cx.measureText("güneşin bugünkü yolu").width;
      cx.fillStyle = "rgba(243,211,138,.85)"; cx.fillText("güneşin bugünkü yolu", gyx, gyy); yer.push([gyx - 2, gyy - yaz * 0.7, gyw + 4, yaz * 1.4]);
    }
    // Meridyenler: her 15° bir saat
    for (var m = -165; m <= 180; m += 15) {
      var mx = xy(0, m)[0], gw = m === 0;
      cx.strokeStyle = gw ? "rgba(243,211,138,.75)" : "rgba(160,170,200,.12)"; cx.lineWidth = gw ? 1.2 : 1; cx.beginPath(); cx.moveTo(mx, 0); cx.lineTo(mx, Hh); cx.stroke();
      var k2 = m / 15; if (W < 560 && k2 % 2) continue;
      cx.fillStyle = gw ? "#f3d38a" : "rgba(170,180,205,.6)"; cx.textAlign = "center";
      cx.fillText(gw ? "0" : (k2 > 0 ? "+" : "−") + Math.abs(k2), Math.min(W - 8, Math.max(8, mx)), yaz * 0.9);
    }
    cx.textAlign = "left"; cx.fillStyle = "rgba(243,211,138,.85)"; cx.fillText("Greenwich", xy(0, 0)[0] + 5, yaz * 2.2);
    // Gece-gündüz çizgisi
    cx.strokeStyle = "rgba(243,211,138,.55)"; cx.lineWidth = 1.2; cx.beginPath();
    for (var x = 0; x <= W; x += 2) {
      var lo2 = x / W * 360 - 180, Hx = (lo2 - g.lon) * R, tl = Math.abs(g.dek) < 0.05 ? (Math.cos(Hx) >= 0 ? -90 : 90) : Math.atan(-Math.cos(Hx) / Math.tan(g.dek * R)) * D;
      var y2 = Math.max(0, Math.min(Hh, xy(tl, 0)[1])); if (x === 0) cx.moveTo(x, y2); else cx.lineTo(x, y2);
    }
    cx.stroke();
    // Şehirler: nokta; harita genişse adı (yan çevrilmiş büyük haritada saatiyle birlikte)
    var ey = Math.max(11, Math.min(13, W / 72));
    SEHIR.forEach(function (c, i) {
      var p = xy(c[1], c[2]), sec = i === secSehir;
      cx.fillStyle = sec ? "#fff" : c[5] ? "rgba(243,211,138,.75)" : "rgba(243,211,138,.9)"; cx.beginPath(); cx.arc(p[0], p[1], sec ? 3.4 : c[5] ? 1.8 : 2.2, 0, 6.283); cx.fill();
      if (sec) { cx.strokeStyle = "rgba(255,255,255,.6)"; cx.lineWidth = 1; cx.beginPath(); cx.arc(p[0], p[1], 7, 0, 6.283); cx.stroke(); }
      if (W < 560) return;
      var et2 = c[0] + (cizB ? "  " + saat(t, c[3]) : ""); cx.font = (c[5] ? "500 " : "600 ") + (c[5] ? ey - 1 : ey) + "px system-ui,sans-serif";
      var tw2 = cx.measureText(et2).width + 10, hh2 = ey + 7, bx, by, tamam = false;
      var dene = [c[4] || "s", "s", "l", "u", "a"];
      for (var di = 0; di < dene.length && !tamam; di++) {
        var yon = dene[di];
        bx = yon === "l" ? p[0] - 7 - tw2 : yon === "s" ? p[0] + 7 : p[0] - tw2 / 2; by = yon === "a" ? p[1] + 7 : yon === "u" ? p[1] - 7 - hh2 : p[1] - hh2 / 2;
        bx = Math.max(2, Math.min(W - tw2 - 2, bx)); by = Math.max(2, Math.min(Hh - hh2 - 2, by));
        tamam = !yer.some(function (q) { return bx < q[0] + q[2] + 2 && bx + tw2 + 2 > q[0] && by < q[1] + q[3] + 1 && by + hh2 + 1 > q[1]; });
      }
      if (!tamam && c[5] && !sec) return; // ek şehrin adı sığmıyorsa yalnızca noktası
      yer.push([bx, by, tw2, hh2]);
      cx.fillStyle = sec ? "rgba(243,211,138,.92)" : "rgba(4,5,9,.72)"; cx.strokeStyle = sec ? "rgba(255,255,255,.7)" : "rgba(243,211,138,.35)"; cx.lineWidth = 1;
      cx.beginPath(); if (cx.roundRect) cx.roundRect(bx, by, tw2, hh2, 6); else cx.rect(bx, by, tw2, hh2); cx.fill(); cx.stroke();
      cx.fillStyle = sec ? "#1a1205" : "#f1e6cc"; cx.textBaseline = "middle"; cx.fillText(et2, bx + 5, by + hh2 / 2 + 0.5);
    });
    cx.font = "600 " + yaz + "px system-ui,sans-serif";
    // Güneş
    var sp = xy(g.lat, g.lon), sr = Math.max(9, W / 55);
    var sg = cx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], sr * 2.6); sg.addColorStop(0, "rgba(255,236,170,1)"); sg.addColorStop(0.25, "rgba(255,206,110,.85)"); sg.addColorStop(0.6, "rgba(255,170,60,.25)"); sg.addColorStop(1, "rgba(255,150,40,0)");
    cx.fillStyle = sg; cx.beginPath(); cx.arc(sp[0], sp[1], sr * 2.6, 0, 6.283); cx.fill();
    cx.fillStyle = "#fff4cf"; cx.beginPath(); cx.arc(sp[0], sp[1], sr * 0.42, 0, 6.283); cx.fill();
    // Seçili boylam (4 dakika kuralı)
    var px2 = xy(0, prob.lon)[0]; cx.strokeStyle = "rgba(255,255,255,.85)"; cx.setLineDash([4, 4]); cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(px2, 0); cx.lineTo(px2, Hh); cx.stroke(); cx.setLineDash([]);
    var pp = xy(prob.lat, prob.lon); cx.fillStyle = "#fff"; cx.beginPath(); cx.arc(pp[0], pp[1], 3, 0, 6.283); cx.fill();
    var et = (prob.ad ? prob.ad + " · " : "") + "güneş " + gunesSaati(t, prob.lon, true), tw = cx.measureText(et).width + 14, tx = Math.min(W - tw - 4, Math.max(4, px2 - tw / 2)), ty = Hh - yaz * 2.4;
    cx.fillStyle = "rgba(0,0,0,.72)"; cx.strokeStyle = "rgba(255,255,255,.5)"; cx.beginPath(); if (cx.roundRect) cx.roundRect(tx, ty - yaz, tw, yaz * 2, 8); else cx.rect(tx, ty - yaz, tw, yaz * 2); cx.fill(); cx.stroke();
    cx.fillStyle = "#fff"; cx.textAlign = "center"; cx.fillText(et, tx + tw / 2, ty); cx.textAlign = "left";
  }

  // ---------- Yazılar ----------
  var sonDk = -1;
  function yaziGuncelle(tam) {
    var t = simdi(), g = gunes(t), istT = IST[3];
    O.querySelector("#dsAlt").innerHTML = "UTC <b>" + saat(t, "UTC", true) + "</b> · İstanbul <b>" + saat(t, istT, true) + "</b> · Güneş şu an <b>" + en(g.lat) + ", " + boy(g.lon) + "</b> noktasında tepede";
    var ky = O.querySelector("#dsKayY"); ky.textContent = kayma ? (kayma > 0 ? sure(kayma) + " sonra" : sure(-kayma) + " önce") : "şimdi"; O.querySelector("#dsSimdi").hidden = !kayma;
    var dk = Math.floor(t / 6e4); if (!tam && dk === sonDk) return; sonDk = dk; // kartlar dakikada bir (düğmeler her saniye yeniden çizilip dokunuşu kaçırmasın)
    // 4 dakika kuralı kartı
    var lon = prob.lon, dkG = lon * 4, ad = prob.ad || ("Boylam " + boy(lon)), al = yuk(prob.lat, lon, g);
    var sehir = secSehir >= 0 ? SEHIR[secSehir] : null, tz = sehir ? sehir[3] : null;
    var html = '<h3>4 dakika kuralı</h3><div class="yer">' + ad + "<small>" + en(prob.lat) + " · " + boy(lon) + "</small></div>" +
      '<div class="ss">' + (tz ? "<div>Saat<b>" + saat(t, tz) + "</b></div>" : "") + "<div>Güneş saati<b>" + gunesSaati(t, lon, true) + "</b></div><div>Ortalama güneş saati<b>" + gunesSaati(t, lon, false) + "</b></div></div>";
    html += "<p>Greenwich'e göre <b>" + sure(dkG, true) + "</b> (" + nf(Math.abs(lon), 1) + "° × 4 dk). " + (al > 0 ? "Güneş ufkun <b>" + nf(al, 0) + "°</b> üstünde." : al > -6 ? "Alacakaranlık: güneş ufkun hemen altında." : "Burada şu an gece.") + "</p>";
    if (tz) {
      var fark = tzFark(tz, t) - (dkG + g.eot);
      html += "<p>Saatler güneşten <b>" + sure(Math.abs(fark)) + " " + (fark >= 0 ? "ileri" : "geri") + "</b>" + (tz === istT ? ": Türkiye tüm yıl UTC+3 kullanıyor, bu 45. meridyenin saati; İstanbul ise 29. meridyende." : ".") + "</p>";
    }
    html += '<div class="kural">⏱️ Dünya 24 saatte 360° döner: <b>15° = 1 saat, 1° = 4 dakika</b>. Güneş saati bugün ortalamadan <b>' + sure(Math.abs(g.eot)) + " " + (g.eot >= 0 ? "ileri" : "geri") + "</b> (zaman denklemi; yıl boyunca ±16 dk oynar).</div>";
    O.querySelector("#dsP").innerHTML = html;
    // Gök takvimi
    var db = dogBat(IST[1], IST[2], t), uzun = db.dog ? (db.bat - db.dog) / 6e4 : null, ev = gokOlaylari(t, 2);
    var gunTR = function (x) { return fmt(istT, { day: "numeric", month: "long", weekday: "long" }).format(x); };
    var kalanGun = function (x) { return Math.ceil((x - t) / 864e5); };
    O.querySelector("#dsT").innerHTML = "<h3>Gökyüzü · İstanbul</h3><ul>" +
      (db.dog ? '<li><span class="i">🌅</span><span>Gün doğumu <b>' + saat(db.dog, istT) + "</b> · batımı <b>" + saat(db.bat, istT) + "</b><small>Gün " + sure(uzun) + " · güneş " + saat(db.ogle, istT) + "'de tepede</small></span></li>" : "") +
      '<li><span class="i">☀️</span><span>Güneş bugün <b>' + en(g.dek) + "</b> enleminin tepesinde<small>" + (Math.abs(g.dek) < 1 ? "Ekinoks günlerinde gece-gündüz çizgisi kutuptan kutba dümdüz iner" : "Ekinokslarda gece-gündüz çizgisi dümdüz iner; bugün eğik, çünkü güneş " + (g.dek < 0 ? "Oğlak" : "Yengeç") + " Dönencesi'ne doğru") + "</small></span></li>" +
      ev.map(function (x) { return '<li><span class="i">' + (/ekinoks/.test(x.ad) ? "⚖️" : "🔆") + "</span><span>" + x.ad + ": <b>" + gunTR(x.t) + "</b> · " + kalanGun(x.t) + " gün<small>" + x.ack + "</small></span></li>"; }).join("") + "</ul>";
    // Şehirler
    var istG = gunAnah(istT, t), istF = tzFark(istT, t);
    O.querySelector("#dsS").innerHTML = SEHIR.map(function (c, i) {
      if (c[5] && !tumSehir && i !== secSehir) return "";
      var a = yuk(c[1], c[2], g), ik = a > 0 ? "☀️" : a > -6 ? (gunesSaati(t, c[2], true) < "12:00" ? "🌅" : "🌇") : "🌙", f = tzFark(c[3], t) - istF, gd = gunAnah(c[3], t);
      var gunE = gd === istG ? "" : (gd > istG ? " · yarın" : " · dün");
      return '<button type="button" data-i="' + i + '" class="' + (i === secSehir ? "sec" : "") + '" aria-pressed="' + (i === secSehir) + '"><span class="ad"><span>' + c[0] + "</span><span>" + ik + '</span></span><span class="sa">' + saat(t, c[3]) + '</span><span class="fk">' + (i === 0 ? "UTC" + sure(istF, true).replace(" sa", "") : (f ? sure(f, true) : "aynı saat")) + gunE + "</span></button>";
    }).join("");
  }
  function yenile(harita) { var c = harita || Date.now() - sonCiz > 10000; yaziGuncelle(harita); if (c) { ciz(); buyukCiz(); } else if (buyuk && Math.floor(simdi() / 6e4) !== B.dk) { B.dk = Math.floor(simdi() / 6e4); buyukCiz(); } }

  function ac() {
    if (!O) kur();
    geri = document.activeElement; O.hidden = false; document.body.style.overflow = "hidden";
    boyutla(); yenile(true);
    requestAnimationFrame(function () { O.classList.add("ac"); O.querySelector(".dsX").focus({ preventScroll: true }); });
    clearInterval(zSaat); zSaat = setInterval(function () { if (!O.hidden) yenile(false); }, 1000);
    document.addEventListener("keydown", tus);
    window.Rapor && Rapor.bolum("dunya-saati");
  }
  function kapa() {
    if (!O || O.hidden) return;
    if (buyuk) buyukKapa();
    oynat(false);
    O.classList.remove("ac"); clearInterval(zSaat); document.removeEventListener("keydown", tus);
    setTimeout(function () { O.hidden = true; document.body.style.overflow = ""; if (geri && geri.focus) geri.focus({ preventScroll: true }); }, 300);
  }
  // Odak tuzağı (23 Kasım 2026): Tab açık pencerenin içinde döner, arkadaki sayfaya kaçmaz
  function odaklar(kap) { return [].filter.call(kap.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'), function (x) { return x.getClientRects().length && !x.closest("[hidden]"); }); }
  function tuzak(e, kap) {
    var L = odaklar(kap); if (!L.length) return;
    var ilk = L[0], son = L[L.length - 1], a = document.activeElement;
    if (!kap.contains(a)) { e.preventDefault(); ilk.focus(); return; }
    if (e.shiftKey && a === ilk) { e.preventDefault(); son.focus(); } else if (!e.shiftKey && a === son) { e.preventDefault(); ilk.focus(); }
  }
  function tus(e) {
    if (e.key === "Escape") { if (buyuk) buyukKapa(); else kapa(); }
    else if (e.key === "Tab") tuzak(e, buyuk && B ? B.i : K);
  }
  window.DunyaSaati = { ac: ac, kapa: kapa, _gunes: gunes, _dogBat: dogBat, _gok: gokOlaylari, _kara: kara };
})();
