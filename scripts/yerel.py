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
GUN = 7  # son 7 günün başlıkları (küçük ilçelerde başlığında adı geçen haber seyrek)

# Kaynaklar: [kısa ad, görünen ad, alan adı, il sayfası, ilçe sayfası kalıbı ({il}, {ilce}: adresteki yazım)]
KAYNAK = [
  ["yeniasir", "Yeni Asır", "yeniasir.com.tr", "https://www.yeniasir.com.tr/haberleri/{il}", "https://www.yeniasir.com.tr/haberleri/{ilce}"],
  ["posta", "Posta", "posta.com.tr", "https://www.posta.com.tr/{il}-haberleri/", "https://www.posta.com.tr/{il}-haberleri/{ilce}/"],
  ["milliyet", "Milliyet", "milliyet.com.tr", "https://www.milliyet.com.tr/haberleri/{il}", "https://www.milliyet.com.tr/{il}/{ilce}-haber/"],
  ["hurriyet", "Hürriyet", "hurriyet.com.tr", "https://www.hurriyet.com.tr/haberleri/{il}", "https://www.hurriyet.com.tr/{il}/{ilce}-haberleri/"],
  ["ntv", "NTV", "ntv.com.tr", "https://www.ntv.com.tr/{il}", "https://www.ntv.com.tr/haberleri/{il}-{ilce}"],
]
# Yerler: [kısa ad (adresteki yazım), görünen ad, başlıkta aranacak biçim (düzenli ifade, küçük harf)].
# Arama BAŞLIKTA yapılır: gazetelerin her haber sayfasının menüsünde bütün ilçe adları yazdığı için metinde arama alakasız haber getiriyor.
# Adı başka anlama da gelen yerler daraltılır ("Aydın" bir soyadı, "Köşk" Çankaya Köşkü de olabilir, "Yenipazar" Bilecik'te de var).
IL = ["aydin", "Aydın", r"aydın['’]|aydınlı|aydın büyükşehir|aydın valil|aydın valisi|aydın il "]
ILCE = [
  ["bozdogan", "Bozdoğan", r"bozdoğan"], ["buharkent", "Buharkent", r"buharkent"], ["cine", "Çine", r"\bçine"],
  ["didim", "Didim", r"didim"], ["efeler", "Efeler", r"efeler['’ ]"], ["germencik", "Germencik", r"germencik"],
  ["incirliova", "İncirliova", r"incirliova"], ["karacasu", "Karacasu", r"karacasu"], ["karpuzlu", "Karpuzlu", r"karpuzlu"],
  ["kocarli", "Koçarlı", r"koçarlı"], ["kosk", "Köşk", r"köşk['’](?:te|de|ün|e)|köşk belediye|köşk ilçe"],
  ["kusadasi", "Kuşadası", r"kuşadası"], ["kuyucak", "Kuyucak", r"kuyucak"], ["nazilli", "Nazilli", r"nazilli"],
  ["soke", "Söke", r"\bsöke"], ["sultanhisar", "Sultanhisar", r"sultanhisar"], ["yenipazar", "Yenipazar", r"yenipazar(?!.*bilecik)"],
]
# İş Bankası hakkında olumsuz başlıklar burada da gösterilmez (scripts/haberler.py ile aynı kural)
ISB_RE = re.compile(r"iş ?bankası|işbank|isbank|işcep|iscep|isctr|maximiles|maxipuan|maximum kart", re.I)
ISB_OLUMSUZ = re.compile(r"protesto|eylem|grev|sendika|dava|mahkeme|ceza|soruşturma|gözaltı|tutukla|skandal|şika?yet|şikâyet|mağdur|dolandır|"
                         r"hack|siber saldırı|sızıntı|çöktü|arıza|kesinti(?!siz)|tepki|rüşvet|usulsüz|zimmet|haciz|icra|tazminat|işten çıkar|kriz|ihlal|suç", re.I)
low = lambda t: t.replace("İ", "i").replace("I", "ı").lower()

# Gazetelerin başlığa eklediği bölüm adları ("Aydın Haberleri - … - Yerel Haberler", "… - Gündem Haberleri") atılır
ON_EK = re.compile(r"^[^-–]{2,40}Haberleri\s+[-–]\s+")
SON_EK = re.compile(r"\s+[-–]\s+[^-–]{2,40}Haber(?:ler(?:i)?)?\s*$")

def ara(ad, alan):
    q = f"intitle:\"{ad}\" site:{alan} when:{GUN}d"
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
        t = SON_EK.sub("", ON_EK.sub("", t)).strip()
        if not t or not u.startswith("http") or (d and NOW - d > dt.timedelta(days=GUN)): continue
        if ISB_RE.search(low(t)) and ISB_OLUMSUZ.search(low(t)): continue
        out.append({"t": t[:200], "u": u, "d": d.strftime("%Y-%m-%dT%H:%M:%SZ") if d else None})
    return out

def is_(args):
    yer, kay = args
    for den in range(2):
        try: return yer[0], kay[0], [x for x in ara(yer[1], kay[2]) if re.search(yer[2], low(x["t"]))], None
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
# Aydın geneli: başlığında Aydın geçenler + bütün ilçelerin haberleri, kaynak başına en yeni 15
for kk, *_ in KAYNAK:
    hepsi, gor = [], set()
    for yk in [IL[0]] + [c[0] for c in ILCE]:
        for x in haber.get(yk, {}).get(kk, []):
            if x["u"] not in gor: gor.add(x["u"]); hepsi.append(x)
    haber[IL[0]][kk] = sorted(hepsi, key=lambda x: x["d"] or "", reverse=True)[:15]
print(f"Yerel: {len(yerler)} yer × {len(KAYNAK)} kaynak, {say} başlık, {hata} arama alınamadı")
if hata > len(sonuc) // 2 and eski: raise SystemExit("::error::Aramaların yarısından çoğu alınamadı; dosya değiştirilmedi")
os.makedirs("data", exist_ok=True)
json.dump({"guncelleme": NOW.strftime("%Y-%m-%dT%H:%M:%SZ"), "gun": GUN,
           "kaynaklar": [{"k": k, "ad": a, "il": u1, "ilce": u2} for k, a, _, u1, u2 in KAYNAK],
           "iller": [{"k": IL[0], "ad": IL[1], "ilceler": [{"k": k, "ad": a} for k, a, _ in ILCE]}],
           "haber": haber}, open("data/yerel.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
