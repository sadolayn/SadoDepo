# Kampanya toplayıcı: isbank.com.tr (bireysel + ticari) ve maximum.com.tr (bireysel + ticari)
# Günde iki kez çalışır; isbank/kampanya_hepsi.json dosyasına YALNIZCA işlenmiş alanları yazar
# (başlık, kısa açıklama, bitiş tarihi, bağlantı, ilk görülme). Ham sayfa kaydedilmez, kayda yalnızca sayı basılır.
# Sigorta: bir kaynak o gün açılmazsa ya da öncekinin yarısından az kampanya gelirse o kaynağın eski listesi korunur.
import json, re, html, os, urllib.request, urllib.error, datetime as dt

OUT = "isbank/kampanya_hepsi.json"
UA = {"User-Agent": "Mozilla/5.0 (compatible; SadolaynBot/1.0)", "Accept-Language": "tr-TR,tr"}
TR = dt.timezone(dt.timedelta(hours=3))
bugun = dt.datetime.now(TR).date()

def get(url):
    try:
        return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read().decode("utf-8", "replace")
    except Exception:
        return ""

def temiz(s):
    return re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", s)

def metin(s):
    s = re.sub(r"(?i)<br\s*/?>", " ", s)
    s = html.unescape(re.sub(r"<[^>]+>", " ", s))
    s = re.sub(r"\s+", " ", s).strip()
    # Banka diliyle yazılmış "sizi bekliyor / kazanın" gibi ifadeler olduğu gibi kalır; yalnızca boşluk temizlenir
    return s

# ---------- isbank.com.tr ----------
KOK_I = "https://www.isbank.com.tr"

def isb_kategoriler(body):
    """Kategori bağlantıları 'Ad (12)': (tam adres, ad, adet). 'Tüm Kampanyalar' atlanır."""
    out, gor = [], set()
    for m in re.finditer(r'(?is)<a[^>]+href="([^"#]*kampanyalar[^"#]*)"[^>]*>(.*?)</a>', temiz(body)):
        href, ic = m.group(1), metin(m.group(2))
        mm = re.match(r"(.{3,80}?)\s*\((\d+)\)$", ic)
        if not mm or href in gor or mm.group(1).lower().startswith("tüm kampanya"):
            continue
        gor.add(href)
        out.append((href if href.startswith("http") else KOK_I + href, mm.group(1).strip(), int(mm.group(2))))
    return out

def isb_kartlar(body):
    """Kategori sayfasındaki güncel kampanya kartları ('Geçmiş Kampanyalar' sonrası alınmaz)."""
    guncel = re.split(r"Geçmiş\s+Kampanyalar", temiz(body), maxsplit=1)[0]
    out, gor = [], set()
    for m in re.finditer(r'(?is)<a[^>]+href="(/kampanyalar/[^"#?]+)"[^>]*>(.*?)</a>', guncel):
        href, ic = m.group(1).replace("//", "/"), metin(m.group(2))
        slug = href.rstrip("/").split("/")[-1]
        if re.search(r"\(\d+\)$", ic) or slug in gor:
            continue
        mt = re.match(r"(.*?)\s*Bitiş Tarihi:\s*(\d{2})\.(\d{2})\.(\d{4})\s*(.*)", ic)
        if not mt:
            continue
        gor.add(slug)
        out.append({"baslik": mt.group(1).strip()[:160], "bitis": f"{mt.group(4)}-{mt.group(3)}-{mt.group(2)}",
                    "ozet": re.sub(r"\s*Detaylı Bilgi\s*>?\s*$", "", mt.group(5)).strip()[:220], "url": KOK_I + href})
    return out

def isbank(segment):
    ana = get(KOK_I + "/kampanyalar" + ("?v=ticari" if segment == "ticari" else ""))
    if not ana:
        return None
    kats = []
    for url, ad, adet in isb_kategoriler(ana):
        lst = isb_kartlar(get(url))
        slug = url.split("?")[0].rstrip("/").split("/")[-1]
        kats.append({"ad": ad, "slug": slug, "adet": adet, "url": url, "kampanyalar": lst})
    return {"toplam": sum(k["adet"] for k in kats), "kategoriler": kats}

# ---------- maximum.com.tr ----------
KOK_M = "https://www.maximum.com.tr"

def max_kartlar(body):
    """Kartlar 'Son N Gün' şeridine göre bölünür; başlık şeritten sonraki ilk anlamlı metin, bağlantı kampanya detayı."""
    b = temiz(body)
    yer = [m for m in re.finditer(r"Son\s+(\d+)\s+G[üu]n", b)]
    out, gor = [], set()
    for i, m in enumerate(yer):
        parca = b[m.end(): (yer[i + 1].start() if i + 1 < len(yer) else m.end() + 6000)]
        metinler = [metin(x) for x in re.findall(r">([^<>]{6,400})<", parca)]
        metinler = [x for x in metinler if x and not re.match(r"(?i)^(detaylı bilgi|maximum kart.?a başvur|başvur|son \d+ gün)", x)]
        if not metinler:
            continue
        link = None
        for h in re.findall(r'href="([^"#]+)"', parca):
            if "kampanya" in h.lower() and not re.search(r"/kampanyalar/(bireysel|ticari)/?$", h, re.I):
                link = h if h.startswith("http") else KOK_M + h
                break
        anahtar = link or metinler[0]
        if anahtar in gor:
            continue
        gor.add(anahtar)
        kalan = int(m.group(1))
        out.append({"baslik": metinler[0][:160], "bitis": (bugun + dt.timedelta(days=max(0, kalan - 1))).isoformat(),
                    "ozet": (metinler[1][:220] if len(metinler) > 1 and len(metinler[1]) > 25 else ""), "url": link or KOK_M + "/kampanyalar"})
    return out

def maximum(segment):
    body = get(f"{KOK_M}/kampanyalar/{segment}")
    if not body:
        return None
    lst = max_kartlar(body)
    say = re.search(r"Kampanya\s+Sayısı\s*\(\s*(\d+)\s*\)", temiz(body))
    return {"toplam": int(say.group(1)) if say else len(lst), "kampanyalar": lst}

# ---------- Birleştir, sigorta, kaydet ----------
eski = {}
if os.path.exists(OUT):
    try: eski = json.load(open(OUT, encoding="utf-8"))
    except Exception: eski = {}

def ilk_tarih(yeni, eski_v):
    """Her kampanyaya ilk görüldüğü günü yaz (YENİ rozeti için)."""
    gor = {}
    def topla(v):
        if isinstance(v, dict):
            if "url" in v and "ilk" in v: gor[v["url"]] = v["ilk"]
            for x in v.values(): topla(x)
        elif isinstance(v, list):
            for x in v: topla(x)
    topla(eski_v)
    ilk_calisma = not gor
    def isle(v):
        if isinstance(v, dict):
            if "url" in v and "baslik" in v: v["ilk"] = gor.get(v["url"], "2000-01-01" if ilk_calisma else bugun.isoformat())
            for x in v.values(): isle(x)
        elif isinstance(v, list):
            for x in v: isle(x)
    isle(yeni)

def adet(v):
    if not v: return 0
    if "kategoriler" in v: return sum(len(k["kampanyalar"]) for k in v["kategoriler"])
    return len(v.get("kampanyalar", []))

veri = {"guncelleme": dt.datetime.now(TR).strftime("%Y-%m-%dT%H:%M"), "isbank": {}, "maximum": {}}
for kaynak, fn in [("isbank", isbank), ("maximum", maximum)]:
    for seg in ["bireysel", "ticari"]:
        yeni = fn(seg)
        onceki = (eski.get(kaynak) or {}).get(seg)
        if not yeni or (onceki and adet(yeni) < 0.5 * adet(onceki)):
            print(f"::warning::{kaynak}/{seg}: okunan {adet(yeni)} (önceki {adet(onceki)}) — eski liste korundu")
            yeni = onceki
        veri[kaynak][seg] = yeni
        if yeni:
            print(f"{kaynak}/{seg}: sitede {yeni['toplam']}, okunan {adet(yeni)}" + (f", kategori {len(yeni['kategoriler'])}" if "kategoriler" in yeni else ""))

ilk_tarih(veri, eski)
os.makedirs("isbank", exist_ok=True)
json.dump(veri, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
