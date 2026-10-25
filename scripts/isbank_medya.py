# İş Bankası "Haberler ve Medya": bankanın kendi sitesindeki haber başlıkları ve resmi sosyal medya hesapları.
# Günde bir kez çalışır; isbank/medya.json dosyasına YALNIZCA işlenmiş alanları yazar (başlık, bağlantı; platform, hesap adı, bağlantı).
# Ham sayfa kaydedilmez, kayda yalnızca sayı basılır. Bir bölüm okunamazsa ya da öncekinin yarısından azı gelirse eski liste korunur.
# Reklam filmleri bankanın resmi YouTube kanalından ayrıca gelir (scripts/haberler.py, data/haberler.json → isbvideo).
import json, re, html, os, urllib.request, datetime as dt

OUT = "isbank/medya.json"
KOK = "https://www.isbank.com.tr"
UA = {"User-Agent": "Mozilla/5.0 (compatible; SadolaynBot/1.0)", "Accept-Language": "tr-TR,tr"}
TR = dt.timezone(dt.timedelta(hours=3))

def get(url):
    try:
        return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read().decode("utf-8", "replace")
    except Exception:
        return ""

def temiz(s):
    return re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", s)

def metin(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()

# ---------- Sosyal medya: sayfadaki platform bağlantıları ----------
PLATFORM = [("instagram.com", "Instagram"), ("facebook.com", "Facebook"), ("twitter.com", "X"), ("x.com", "X"), ("youtube.com", "YouTube"),
            ("linkedin.com", "LinkedIn"), ("tiktok.com", "TikTok"), ("spotify.com", "Spotify"), ("t.me", "Telegram"), ("threads.net", "Threads")]

def sosyal():
    b = temiz(get(KOK + "/bankamizi-taniyin/sosyal-medya"))
    out, gor = [], set()
    for m in re.finditer(r'(?is)<a[^>]+href="(https?://[^"]+)"[^>]*>(.*?)</a>', b):
        url, ad = html.unescape(m.group(1)).strip(), metin(m.group(2))
        alan = re.sub(r"^https?://(www\.|m\.|tr\.)?", "", url).split("/")[0].lower()
        p = next((ad_ for d, ad_ in PLATFORM if alan == d or alan.endswith("." + d)), None)
        # Sayfanın kendi alt bilgisindeki ikon bağlantılarının adı olmaz; yalnızca adı yazan hesaplar alınır. Nays yaşam süresini bitirdi.
        if not p or len(ad) < 2 or len(ad) > 40 or re.search(r"nays", ad + url, re.I) or (p, url) in gor:
            continue
        gor.add((p, url))
        out.append({"platform": p, "ad": ad, "url": url})
    return out

# ---------- Bankadan haberler: "İş Bankası'ndan Haberler" sayfasındaki başlıklar ----------
AYRI = {"haberler-ve-medya", "reklam-videolari", "sosyal-medya", "bankamizi-taniyin"}

def haberler():
    ana = temiz(get(KOK + "/bankamizi-taniyin/haberler-ve-medya"))
    # "İş Bankası'ndan Haberler" kutusunun "Detaylı Bilgi" bağlantısı
    adres = None
    i = re.search(r"İş Bankası.{0,6}ndan Haberler", ana)
    if i:
        h = re.search(r'href="([^"#]+)"', ana[i.end():i.end() + 3000])
        if h:
            adres = h.group(1) if h.group(1).startswith("http") else KOK + h.group(1)
    if not adres:
        return None
    b = temiz(get(adres))
    out, gor = [], set()
    for m in re.finditer(r'(?is)<a[^>]+href="((?:https://www\.isbank\.com\.tr)?/bankamizi-taniyin/[a-z0-9-]+/?)"[^>]*>(.*?)</a>', b):
        href, ic = m.group(1), metin(m.group(2))
        slug = href.rstrip("/").split("/")[-1]
        if slug in AYRI or slug in gor or len(ic) < 15 or re.match(r"(?i)^(detaylı bilgi|devamı|tümü)", ic):
            continue
        gor.add(slug)
        tarih = re.search(r"\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b", ic)
        baslik = re.sub(r"\s*\b\d{1,2}[./]\d{1,2}[./]20\d{2}\b\s*", " ", ic)
        baslik = re.sub(r"\s*(Detaylı Bilgi|Devamı)\s*>?\s*$", "", baslik).strip()[:180]
        out.append({"baslik": baslik, "url": KOK + "/bankamizi-taniyin/" + slug,
                    "tarih": f"{tarih.group(3)}-{int(tarih.group(2)):02d}-{int(tarih.group(1)):02d}" if tarih else ""})
    return out[:40]

# ---------- Birleştir, sigorta, kaydet ----------
eski = {}
if os.path.exists(OUT):
    try: eski = json.load(open(OUT, encoding="utf-8"))
    except Exception: eski = {}
veri = {"guncelleme": dt.datetime.now(TR).strftime("%Y-%m-%dT%H:%M")}
for ad, fn in [("sosyal", sosyal), ("haberler", haberler)]:
    yeni, onceki = fn(), eski.get(ad) or []
    if not yeni or len(yeni) < 0.5 * len(onceki):
        print(f"::warning::{ad}: okunan {len(yeni or [])} (önceki {len(onceki)}) — eski liste korundu")
        yeni = onceki
    veri[ad] = yeni
    print(f"{ad}: {len(yeni)}")
os.makedirs("isbank", exist_ok=True)
json.dump(veri, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
