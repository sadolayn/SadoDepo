#!/usr/bin/env python3
"""Yerel haberler (Güncel Haberler › Yerel): seçilen il ya da ilçe hakkında, köklü gazetelerin o yere ait son başlıkları.
Günde bir kez, sabah 10:00'dan önce çalışır. Her yer × kaynak için Google Haberler'de "<yer> site:<gazete>" araması yapılır;
gazetelerin sitelerine girilmez. data/yerel.json'a yalnızca başlık, bağlantı ve saat yazılır.
Pilot: Aydın ve ilçeleri. Kaynaklar bilerek büyük gazetelerin il/ilçe sayfalarıyla sınırlı (küçük yerel siteler doğrulanamadı)."""
import json, re, html, os, time, urllib.request, urllib.parse, datetime as dt
from email.utils import parsedate_to_datetime
from concurrent.futures import ThreadPoolExecutor
import xml.etree.ElementTree as ET

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36"}
NOW = dt.datetime.now(dt.timezone.utc)
GUN = 3  # son 3 günün başlıkları (yerelde haber seyrek)

# Kaynaklar: [kısa ad, görünen ad, alan adı, il sayfası, ilçe sayfası kalıbı ({il}, {ilce}: adresteki yazım)]
KAYNAK = [
  ["yeniasir", "Yeni Asır", "yeniasir.com.tr", "https://www.yeniasir.com.tr/haberleri/{il}", "https://www.yeniasir.com.tr/haberleri/{ilce}"],
  ["posta", "Posta", "posta.com.tr", "https://www.posta.com.tr/{il}-haberleri/", "https://www.posta.com.tr/{il}-haberleri/{ilce}/"],
  ["milliyet", "Milliyet", "milliyet.com.tr", "https://www.milliyet.com.tr/haberleri/{il}", "https://www.milliyet.com.tr/{il}/{ilce}-haber/"],
  ["hurriyet", "Hürriyet", "hurriyet.com.tr", "https://www.hurriyet.com.tr/haberleri/{il}", "https://www.hurriyet.com.tr/{il}/{ilce}-haberleri/"],
  ["ntv", "NTV", "ntv.com.tr", "https://www.ntv.com.tr/{il}", "https://www.ntv.com.tr/haberleri/{il}-{ilce}"],
]
# Yerler: [kısa ad (adresteki yazım), görünen ad, arama]. Arama, adı başka anlama da gelen yerlerde daraltılır
# ("Aydın" bir soyadı, "Köşk" bir yapı, "Yenipazar" Bilecik'te de bir ilçe).
IL = ["aydin", "Aydın", "Aydın'da OR Aydın'ın OR Aydınlı OR \"Aydın Büyükşehir\" OR \"Aydın Valisi\" OR \"Aydın Valiliği\""]
ILCE = [
  ["bozdogan", "Bozdoğan", "Bozdoğan"], ["buharkent", "Buharkent", "Buharkent"], ["cine", "Çine", "Çine"],
  ["didim", "Didim", "Didim"], ["efeler", "Efeler", "Efeler"], ["germencik", "Germencik", "Germencik"],
  ["incirliova", "İncirliova", "İncirliova"], ["karacasu", "Karacasu", "Karacasu"], ["karpuzlu", "Karpuzlu", "Karpuzlu"],
  ["kocarli", "Koçarlı", "Koçarlı"], ["kosk", "Köşk", "\"Köşk Belediye\" OR Köşk'te OR Köşk'ün OR \"Köşk ilçe\""],
  ["kusadasi", "Kuşadası", "Kuşadası"], ["kuyucak", "Kuyucak", "Kuyucak"], ["nazilli", "Nazilli", "Nazilli"],
  ["soke", "Söke", "Söke"], ["sultanhisar", "Sultanhisar", "Sultanhisar"], ["yenipazar", "Yenipazar", "Yenipazar Aydın"],
]
# İş Bankası hakkında olumsuz başlıklar burada da gösterilmez (scripts/haberler.py ile aynı kural)
ISB_RE = re.compile(r"iş ?bankası|işbank|isbank|işcep|iscep|isctr|maximiles|maxipuan|maximum kart", re.I)
ISB_OLUMSUZ = re.compile(r"protesto|eylem|grev|sendika|dava|mahkeme|ceza|soruşturma|gözaltı|tutukla|skandal|şika?yet|şikâyet|mağdur|dolandır|"
                         r"hack|siber saldırı|sızıntı|çöktü|arıza|kesinti(?!siz)|tepki|rüşvet|usulsüz|zimmet|haciz|icra|tazminat|işten çıkar|kriz|ihlal|suç", re.I)
low = lambda t: t.replace("İ", "i").replace("I", "ı").lower()

def ara(sorgu, alan):
    q = f"({sorgu}) site:{alan} when:{GUN}d"
    url = "https://news.google.com/rss/search?q=" + urllib.parse.quote(q) + "&hl=tr&gl=TR&ceid=TR:tr"
    raw = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20).read()
    out = []
    for it in ET.fromstring(raw).findall(".//item")[:15]:
        t = html.unescape((it.findtext("title") or "").strip())
        se = it.find("source")
        if se is not None and se.text and t.endswith(" - " + se.text.strip()): t = t[: -(len(se.text.strip()) + 3)]
        u = (it.findtext("link") or "").strip()
        try: d = parsedate_to_datetime(it.findtext("pubDate")).astimezone(dt.timezone.utc)
        except Exception: d = None
        if not t or not u.startswith("http") or (d and NOW - d > dt.timedelta(days=GUN)): continue
        if ISB_RE.search(low(t)) and ISB_OLUMSUZ.search(low(t)): continue
        out.append({"t": t[:200], "u": u, "d": d.strftime("%Y-%m-%dT%H:%M:%SZ") if d else None})
    return out

def is_(args):
    yer, kay = args
    for den in range(2):
        try: return yer[0], kay[0], ara(yer[2], kay[2]), None
        except Exception as e: err = str(e)[:80]; time.sleep(3)
    return yer[0], kay[0], [], err

yerler = [IL] + ILCE
with ThreadPoolExecutor(4) as ex:
    sonuc = list(ex.map(is_, [(y, k) for y in yerler for k in KAYNAK]))

eski = {}
try: eski = json.load(open("data/yerel.json", encoding="utf8")).get("haber", {})
except Exception: pass
haber, hata, say = {}, 0, 0
for yk, kk, items, err in sonuc:
    if err:
        hata += 1
        items = (eski.get(yk) or {}).get(kk, [])  # alınamazsa dünkü liste kalır
    gor, temiz = set(), []
    for x in sorted(items, key=lambda x: x["d"] or "", reverse=True):
        k = re.sub(r"\W+", " ", low(x["t"]))[:70]
        if k in gor: continue
        gor.add(k); temiz.append(x)
    haber.setdefault(yk, {})[kk] = temiz[:10]
    say += len(temiz[:10])
print(f"Yerel: {len(yerler)} yer × {len(KAYNAK)} kaynak, {say} başlık, {hata} arama alınamadı")
if hata > len(sonuc) // 2 and eski: raise SystemExit("::error::Aramaların yarısından çoğu alınamadı; dosya değiştirilmedi")
os.makedirs("data", exist_ok=True)
json.dump({"guncelleme": NOW.strftime("%Y-%m-%dT%H:%M:%SZ"), "gun": GUN,
           "kaynaklar": [{"k": k, "ad": a, "il": u1, "ilce": u2} for k, a, _, u1, u2 in KAYNAK],
           "iller": [{"k": IL[0], "ad": IL[1], "ilceler": [{"k": k, "ad": a} for k, a, _ in ILCE]}],
           "haber": haber}, open("data/yerel.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
