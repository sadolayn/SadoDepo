# İş Bankası "Haberler ve Medya": bankanın kendi sitesindeki haber başlıkları ve resmi sosyal medya hesapları.
# Not: Haber listesi sayfada süzgeçle sonradan yükleniyor; kartlar düz bağlantı olarak gelirse alınır, gelmezse liste boş kalır
# (menü sayfaları haber sanılmasın diye başka yol denenmez). Sosyal medya hesapları sayfadan sorunsuz okunur.
# Günde bir kez çalışır; isbank/medya.json dosyasına YALNIZCA işlenmiş alanları yazar (başlık, bağlantı; platform, hesap adı, bağlantı).
# Ham sayfa kaydedilmez, kayda yalnızca sayı basılır. Bir bölüm okunamazsa ya da öncekinin yarısından azı gelirse eski liste korunur.
# Reklam filmleri: bankanın "Reklam Videoları" sayfasındaki YouTube film kimlikleri + resmi kanalın adı "reklam" geçen oynatma listeleri;
# film adları YouTube'un herkese açık oEmbed bilgisinden okunur. Kanalın diğer son videoları ayrıca gelir (scripts/haberler.py → isbvideo).
import json, re, html, os, urllib.request, urllib.parse, datetime as dt

OUT = "isbank/medya.json"
KOK = "https://www.isbank.com.tr"
UA = {"User-Agent": "Mozilla/5.0 (compatible; SadolaynBot/1.0)", "Accept-Language": "tr-TR,tr"}
TR = dt.timezone(dt.timedelta(hours=3))

DURUM = []  # sayfa yanıt kodları (kayda yalnızca sayı basılır)

def get_duz(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60)
        DURUM.append(r.status)
        return r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        DURUM.append(e.code)
    except Exception:
        DURUM.append(0)
    return ""

def get_tarayici(url):
    """Sayfa bağlantılarını sonradan yüklüyorsa: gerçek tarayıcıda açılıp son hâli alınır (kuruluysa)."""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page(user_agent=UA["User-Agent"], locale="tr-TR")
            pg.goto(url, wait_until="networkidle", timeout=90000)
            pg.wait_for_timeout(2500)
            h = pg.content()
            b.close()
            return h
    except Exception:
        return ""

def get(url):
    return get_duz(url)

def temiz(s):
    return re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", s)

def metin(s):
    s = html.unescape(re.sub(r"<[^>]+>", " ", s)).replace("\u200b", "").replace("\u00a0", " ")  # görünmez boşluklar silinir
    return re.sub(r"\s+", " ", s).strip()

# ---------- Sosyal medya: sayfadaki platform bağlantıları ----------
PLATFORM = [("instagram.com", "Instagram"), ("facebook.com", "Facebook"), ("twitter.com", "X"), ("x.com", "X"), ("youtube.com", "YouTube"),
            ("linkedin.com", "LinkedIn"), ("tiktok.com", "TikTok"), ("spotify.com", "Spotify"), ("t.me", "Telegram"), ("threads.net", "Threads")]

def sosyal(getir=None):
    b = temiz((getir or get)(KOK + "/bankamizi-taniyin/sosyal-medya"))
    out, gor = [], set()
    for m in re.finditer(r'(?is)<a[^>]+href="(https?://[^"]+)"[^>]*>(.*?)</a>', b):
        url, ad = html.unescape(m.group(1)).strip(), metin(m.group(2))
        alan = re.sub(r"^https?://(www\.|m\.|tr\.)?", "", url).split("/")[0].lower()
        p = next((ad_ for d, ad_ in PLATFORM if alan == d or alan.endswith("." + d)), None)
        # Sayfanın kendi alt bilgisindeki ikon bağlantılarının adı olmaz; yalnızca adı yazan hesaplar alınır. Nays yaşam süresini bitirdi.
        if not p or len(ad) < 2 or len(ad) > 40 or re.search(r"nays", ad + url, re.I) or (p, url) in gor:
            continue
        url = re.sub(r"[?&](fref|lang|hl|ref|igshid)=[^&]*", "", url).rstrip("?&")  # izleme ekleri atılır
        gor.add((p, url))
        out.append({"platform": p, "ad": ad, "url": url})
    return out

# ---------- Bankadan haberler: "İş Bankası'ndan Haberler" sayfasındaki başlıklar ----------
AYRI = {"haberler-ve-medya", "reklam-videolari", "sosyal-medya", "bankamizi-taniyin"}

def haberler(getir=None):
    get = getir or get_duz
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
    BAG = r'(?is)<a[^>]+href="((?:https://www\.isbank\.com\.tr)?/bankamizi-taniyin/[a-z0-9-]+/?)"[^>]*>(.*?)</a>'
    # Menü ve alt bilgi: "Haberler ve Medya" sayfasında da bulunan bağlantılar haber sayılmaz
    menu = {m.group(1).rstrip("/").split("/")[-1] for m in re.finditer(BAG, ana)}
    out, gor = [], set()
    for m in re.finditer(BAG, b):
        href, ic = m.group(1), metin(m.group(2))
        slug = href.rstrip("/").split("/")[-1]
        if slug in AYRI or slug in menu or slug in gor:
            continue
        # Kartta bağlantı çoğu zaman "Detaylı Bilgi" düğmesindedir: başlık kartın üstündeki başlık etiketinden,
        # kısa açıklama başlıkla düğme arasındaki metinden, tarih düğmenin yanındaki gg.aa.yyyy'den alınır
        once = b[max(0, m.start() - 3000):m.start()]
        bas = list(re.finditer(r"(?is)<h[1-6][^>]*>(.*?)</h[1-6]>", once))
        if len(ic.split()) >= 5:
            baslik, ozet = ic, ""
        elif bas:
            baslik, ozet = metin(bas[-1].group(1)), metin(once[bas[-1].end():])
        else:
            continue
        if len(baslik.split()) < 3:
            continue
        gor.add(slug)
        tarih = re.search(r"\b(\d{1,2})\.(\d{1,2})\.(20\d{2})\b", b[m.end():m.end() + 800]) or re.search(r"\b(\d{1,2})\.(\d{1,2})\.(20\d{2})\b", once[-800:])
        baslik = re.sub(r"\s*\b\d{1,2}[./]\d{1,2}[./]20\d{2}\b\s*", " ", baslik)
        baslik = re.sub(r"\s*(Detaylı Bilgi|Devamı)\s*>?\s*$", "", baslik).strip()[:180]
        ozet = re.sub(r"\s*\b\d{1,2}[./]\d{1,2}[./]20\d{2}\b\s*", " ", ozet)
        ozet = re.sub(r"\s*(Detaylı Bilgi|Devamı)\s*>?\s*", " ", ozet).strip()[:220]
        out.append({"baslik": baslik, "ozet": ozet, "url": KOK + "/bankamizi-taniyin/" + slug,
                    "tarih": f"{tarih.group(3)}-{int(tarih.group(2)):02d}-{int(tarih.group(1)):02d}" if tarih else ""})
    return out[:40]

# ---------- Reklam filmleri ----------
YT_KANAL = "UC8taW8Ljy9xA_tiWy-1OPww"
YT_UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36",
         "Accept-Language": "tr-TR,tr;q=0.9", "Cookie": "CONSENT=YES+1; SOCS=CAI"}
YT_ID = r'(?:youtube(?:-nocookie)?\.com\\?/(?:embed\\?/|watch\?v=|v\\?/|shorts\\?/)|youtu\.be\\?/)([A-Za-z0-9_-]{11})'
SAY = {}  # kayda yalnızca sayılar basılır
# Bankanın sayfasında YouTube yerine video dosyası olarak duran ama resmi kanalda da bulunan filmler (adı arama sonucuyla doğrulandı)
EK = ["3abDmZx6Wzk"]  # Türkiye İş Bankası - 96. Yıl Reklam Filmi

def yt_get(url, sure=30):
    try:
        return urllib.request.urlopen(urllib.request.Request(url, headers=YT_UA), timeout=sure).read().decode("utf-8", "replace")
    except Exception:
        return ""

def yt_veri(sayfa):
    m = re.search(r'(?s)(?:var ytInitialData|window\["ytInitialData"\])\s*=\s*(\{.*?\});\s*</script>', sayfa)
    try:
        return json.loads(m.group(1)) if m else None
    except Exception:
        return None

def gez(o):
    if isinstance(o, dict):
        yield o
        for v in o.values():
            yield from gez(v)
    elif isinstance(o, list):
        for v in o:
            yield from gez(v)

def yazi(t):
    if isinstance(t, dict):
        if "simpleText" in t: return t["simpleText"]
        if "runs" in t: return "".join(x.get("text", "") for x in t["runs"])
        if "content" in t: return t["content"]
    return t if isinstance(t, str) else ""

def reklam_sayfa(getir=None):
    """Bankanın "Reklam Videoları" sayfasındaki YouTube film kimlikleri, sayfadaki sırayla."""
    b = (getir or get)(KOK + "/bankamizi-taniyin/reklam-videolari")
    ids = []
    for m in re.finditer(YT_ID, b):
        if m.group(1) not in ids:
            ids.append(m.group(1))
    SAY["sayfadaki youtube filmi"] = len(ids)
    SAY["sayfadaki mp4"] = len(set(re.findall(r"[\w/.%-]+\.mp4", b)))
    return ids

def reklam_listeleri():
    """Resmi kanalın adı "reklam" geçen oynatma listelerindeki filmler: [(kimlik, ad)]."""
    d = yt_veri(yt_get(f"https://www.youtube.com/channel/{YT_KANAL}/playlists?hl=tr"))
    listeler = []
    for o in gez(d or {}):
        if o.get("playlistId") and "title" in o and "videoId" not in o:
            listeler.append((o["playlistId"], yazi(o["title"])))
        lv = o.get("lockupViewModel")
        if isinstance(lv, dict) and "PLAYLIST" in str(lv.get("contentType", "")):
            ad = next((yazi(x["title"]) for x in gez(lv.get("metadata", {})) if "title" in x and yazi(x["title"])), "")
            listeler.append((lv.get("contentId", ""), ad))
    tum, sec = set(), []
    for pid, ad in listeler:
        if pid and pid not in tum:
            tum.add(pid)
            if re.search(r"reklam", ad, re.I):
                sec.append(pid)
    SAY["oynatma listesi"], SAY["reklam listesi"] = len(tum), len(sec)
    out = []
    for pid in sec[:4]:
        d, n = yt_veri(yt_get(f"https://www.youtube.com/playlist?list={pid}&hl=tr")), 0
        for o in gez(d or {}):
            v = o.get("playlistVideoRenderer")
            if isinstance(v, dict) and v.get("videoId"):
                out.append((v["videoId"], yazi(v.get("title")))); n += 1
        if not n:  # liste sayfası okunamazsa akışından (son 15 film)
            x = yt_get(f"https://www.youtube.com/feeds/videos.xml?playlist_id={pid}")
            for e in re.finditer(r"(?s)<entry>.*?<yt:videoId>([\w-]{11})</yt:videoId>.*?<title>(.*?)</title>", x):
                out.append((e.group(1), html.unescape(e.group(2))))
    SAY["listedeki film"] = len(out)
    return out

def oembed(vid):
    try:
        j = json.loads(yt_get("https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(f"https://www.youtube.com/watch?v={vid}"), 15))
        return j.get("title") or ""
    except Exception:
        return None

def reklam():
    ids = reklam_sayfa() or reklam_sayfa(get_tarayici)
    aday, gor = [], set()
    for vid, ad in [(i, "") for i in ids + EK] + reklam_listeleri():
        if vid not in gor:
            gor.add(vid); aday.append((vid, ad, "banka" if vid in ids + EK else "liste"))
    aday = aday[:50]
    out, ok = [], 0
    for vid, ad, kay in aday:
        t = oembed(vid)
        if t is None:
            continue  # kaldırılmış ya da gizli film
        ok += 1
        t = re.sub(r"\bFlmi\b", "Filmi", re.sub(r"\s+", " ", t or ad)).strip()  # YouTube'daki yazım hatası
        out.append({"id": vid, "baslik": t[:140], "kaynak": kay})
    if aday and not ok:  # oEmbed hiç yanıt vermediyse adaylar adlarıyla alınır
        out = [{"id": v, "baslik": a[:140], "kaynak": k} for v, a, k in aday]
    SAY["yayındaki film"] = len(out)
    return out

# ---------- Birleştir, sigorta, kaydet ----------
eski = {}
if os.path.exists(OUT):
    try: eski = json.load(open(OUT, encoding="utf-8"))
    except Exception: eski = {}
veri = {"guncelleme": dt.datetime.now(TR).strftime("%Y-%m-%dT%H:%M")}
for ad, fn in [("sosyal", sosyal), ("haberler", haberler)]:
    yeni, yol = fn(), "düz"
    if not yeni:
        yeni, yol = fn(get_tarayici), "tarayıcı"
    onceki = eski.get(ad) or []
    if ad == "haberler" and yeni:
        var = {x["url"] for x in yeni}
        yeni = sorted(yeni + [x for x in onceki if x["url"] not in var], key=lambda x: x.get("tarih") or "", reverse=True)[:40]
    print(f"{ad}: {yol} okuma {len(yeni or [])}")
    if not yeni or len(yeni) < 0.5 * len(onceki):
        print(f"::warning::{ad}: okunan {len(yeni or [])} (önceki {len(onceki)}) — eski liste korundu")
        yeni = onceki
    veri[ad] = yeni
    print(f"{ad}: {len(yeni)}")
yeni, onceki = reklam(), eski.get("reklam") or []
print("reklam:", ", ".join(f"{k} {v}" for k, v in SAY.items()))
if not yeni or len(yeni) < 0.5 * len(onceki):
    print(f"::warning::reklam: okunan {len(yeni)} (önceki {len(onceki)}) — eski liste korundu")
    yeni = onceki
veri["reklam"] = yeni
# Bankanın sayfasında YouTube'da olmayan, yalnızca kendi sitesinde oynayan film sayısı (sayfada "sitede N film daha" bağlantısı için)
veri["reklam_sitede"] = max(0, SAY.get("sayfadaki mp4", 0) - len(EK)) if SAY.get("sayfadaki mp4") else eski.get("reklam_sitede", 0)
print("sayfa yanıt kodları:", ",".join(map(str, DURUM)))
os.makedirs("isbank", exist_ok=True)
json.dump(veri, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
