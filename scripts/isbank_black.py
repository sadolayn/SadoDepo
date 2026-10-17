#!/usr/bin/env python3
"""İş Black ayrıcalıkları sayfasını günde bir kez kontrol eder; kampanya başlıklarını ve
sayfa içeriğinin özetini isbank/black.json'a yazar. İçerik değişirse "degisim" tarihi güncellenir,
yeni çıkan kampanyanın "ilk" görüldüğü gün kaydedilir. Aynı gün içinde tekrar yazmaz (gereksiz commit olmasın)."""
import json, re, html, hashlib, os, sys, urllib.request, datetime as dt

URLS = [
    "https://www.isbank.com.tr/kampanyalar/is-black-ayricaliklari",
    "https://www.isbank.com.tr/is-black",
]
OUT = "isbank/black.json"
now = dt.datetime.now(dt.timezone(dt.timedelta(hours=3)))
today = now.strftime("%Y-%m-%d")

old = {}
if os.path.exists(OUT):
    try:
        old = json.load(open(OUT, encoding="utf-8"))
    except Exception:
        old = {}

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; SadolaynBot/1.0)", "Accept-Language": "tr-TR,tr"})
    return urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")

def clean(s):
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()

items, texts = {}, []
for u in URLS:
    try:
        raw = get(u)
    except Exception as e:
        print(f"::warning::{u} alınamadı: {e}")
        continue
    body = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", raw)
    texts.append(clean(body))
    # Kampanya kartları: /kampanyalar/... bağlantıları ve başlıkları
    for m in re.finditer(r'(?is)<a[^>]+href="(/kampanyalar/[^"#?]+)"[^>]*>(.*?)</a>', body):
        href, inner = m.group(1), clean(m.group(2))
        if not inner or len(inner) < 6 or href.rstrip("/").endswith("/kampanyalar") or "is-black-ayricaliklari" in href:
            continue
        t = inner[:140]
        items.setdefault(href, t if len(t) > len(items.get(href, "")) else items[href])

if not texts:
    print("::warning::hiçbir sayfa alınamadı, dosya değişmedi")
    sys.exit(0)

digest = hashlib.sha256("\n".join(texts).encode()).hexdigest()[:16]
ilk = dict(old.get("ilk", {}))
first = not old.get("hash")  # ilk çalıştırmada mevcut kampanyalar "yeni" sayılmaz
for href in items:
    ilk.setdefault(href, "2000-01-01" if first else today)
changed = bool(old.get("hash")) and digest != old.get("hash")  # ilk çalıştırma değişiklik sayılmaz
data = {
    "kaynak": URLS,
    "kontrol": today,
    "degisim": today if changed else old.get("degisim", today),
    "hash": digest,
    "kampanyalar": [{"baslik": t, "url": "https://www.isbank.com.tr" + h, "ilk": ilk[h]} for h, t in items.items()],
    "ilk": {h: d for h, d in ilk.items() if h in items},
}
if old.get("hash") and old.get("kontrol") == today and not changed:
    print("bugün zaten kontrol edildi, değişiklik yok")
    sys.exit(0)
os.makedirs("isbank", exist_ok=True)
json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"black.json yazıldı: {len(items)} kampanya, değişti={changed}")
