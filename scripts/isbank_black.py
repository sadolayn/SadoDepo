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

# Banka kendi sitesinde "biz" der; burada üçüncü şahsa çevrilir ki metin banka adına yazılmış gibi okunmasın.
UCUNCU = [
    (r"\bBankamızdan\b", "İş Bankası'ndan"), (r"\bBankamıza\b", "İş Bankası'na"), (r"\bBankamızda\b", "İş Bankası'nda"),
    (r"\bBankamızın\b", "İş Bankası'nın"), (r"\bBankamız\b", "İş Bankası"),
]
# "müşterilerimize/şubelerimizden" gibi iyelik ekleri atılır: müşterilere, şubelerden (sayfa zaten İş Bankası kartı)
def ucuncu(s):
    for a, b in UCUNCU:
        s = re.sub(a, b, s, flags=re.I)
    return re.sub(r"\b(müşteri|şube)(ler)?(?:i?miz)", r"\1\2", s, flags=re.I)

def clean(s):
    s = html.unescape(s)              # önce varlıkları aç (&lt;img&gt; gibi gizli etiketler de görünür olsun)
    s = re.sub(r"<[^>]+>", " ", s)    # sonra etiketleri at
    s = s.replace("<", "‹").replace(">", "›")
    return ucuncu(re.sub(r"\s+", " ", s).strip())

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
    "kampanyalar": [{"baslik": t, "url": "https://www.isbank.com.tr" + h.replace("//", "/"), "ilk": ilk[h]} for h, t in items.items()],
    "ayricaliklar": [{"baslik": re.split(r"\s*Bitiş Tarihi:", t)[0].strip(), "bitis": (lambda m: f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else "")(re.search(r"Bitiş Tarihi:\s*(\d{2})\.(\d{2})\.(\d{4})", t)), "url": "https://www.isbank.com.tr" + h.replace("//", "/")} for h, t in items.items() if "Bitiş Tarihi" in t],
    "ilk": {h: d for h, d in ilk.items() if h in items},
}
bk_old = {}
try:
    bk_old = json.load(open("isbank/banka_kampanya.json", encoding="utf-8"))
except Exception:
    pass
if old.get("hash") and old.get("kontrol") == today and not changed and bk_old.get("kontrol") == today:
    print("bugün zaten kontrol edildi, değişiklik yok")
    sys.exit(0)
os.makedirs("isbank", exist_ok=True)
json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"black.json yazıldı: {len(items)} kampanya, değişti={changed}")

# ===== Kredi kartı dışı banka kampanyaları (maaş, emekli, kredi, BES, fatura, İşCep, Bankamatik) =====
BANKA = {
    "iste-maasa-ozel": ("💼", "Maaşını İş'e taşıyanlara"),
    "emeklilere-ozel": ("👴", "Emeklilere özel"),
    "bireysel-kredi-kampanyalari": ("🏦", "Bireysel kredi"),
    "bireysel-emeklilik": ("🛡️", "BES ve sigorta"),
    "fatura-kampanyalari": ("🧾", "Fatura talimatı"),
    "iscep-kampanyalari": ("📲", "İşCep'e özel"),
    "bankamatik-karti-kampanyalari": ("🏧", "Bankamatik kartı"),
    "diger-kampanyalar": ("✨", "Diğer kampanyalar"),
}
def parse_items(body):
    out, seen = [], set()
    for m in re.finditer(r'(?is)<a[^>]+href="(/kampanyalar/[^"#?]+)"[^>]*>(.*?)</a>', body):
        href, inner = m.group(1).replace("//", "/"), clean(m.group(2))
        slug = href.rstrip("/").split("/")[-1]
        if slug in BANKA or href.rstrip("/").endswith("/kampanyalar") or re.search(r"\(\d+\)$", inner):
            continue
        mt = re.match(r"(.*?)\s*Bitiş Tarihi:\s*(\d{2})\.(\d{2})\.(\d{4})\s*(.*)", inner)
        if mt:
            title, bitis, desc = mt.group(1).strip(), f"{mt.group(4)}-{mt.group(3)}-{mt.group(2)}", mt.group(5).strip()[:160]
        elif inner.lower() in ("detaylı bilgi", "detayli bilgi") or len(inner) < 8:
            title, bitis, desc = slug.replace("-", " ").capitalize(), "", ""
        else:
            continue  # menü/gezinme bağlantısı, kampanya kartı değil
        if slug in seen:
            continue
        seen.add(slug)
        out.append({"baslik": title, "bitis": bitis, "ozet": desc, "url": "https://www.isbank.com.tr" + href})
    return out
cats, all_cats = [], []
src = "\n".join(texts)
# kategori sayıları ayrıcalıklar sayfasındaki menüden
for href, t in items.items():
    m = re.match(r"(.*?)\s*\((\d+)\)$", t)
    if m:
        all_cats.append({"slug": href.rstrip("/").split("/")[-1], "ad": m.group(1), "adet": int(m.group(2))})
for slug, (ic, ad) in BANKA.items():
    url = "https://www.isbank.com.tr/kampanyalar/" + slug
    adet = next((c["adet"] for c in all_cats if c["slug"] == slug), None)
    try:
        body = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", get(url))
        lst = parse_items(body)
    except Exception as e:
        print(f"::warning::{slug}: {e}"); lst = []
    cats.append({"slug": slug, "ic": ic, "ad": ad, "adet": adet, "url": url, "kampanyalar": lst[:15]})
bk = {"kontrol": today, "kategoriler": cats}
json.dump(bk, open("isbank/banka_kampanya.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("banka_kampanya.json:", [(c["slug"], len(c["kampanyalar"])) for c in cats])
