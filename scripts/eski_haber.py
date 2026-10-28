"""Eski haber süzgeci (İş Bankası sekmesi için).
Google Haberler bazen yıllar önceki bir yazıyı yeni tarihle akışa veriyor (25 Ekim 2026'da 2018 tarihli
"İşCep'ten yeni yıl kampanyası" böyle girdi). İki katman: başlıkta eski yıl; gerçek haber sayfasındaki yayın tarihi.
Yalnızca haber sitelerine gidilir, sayfadan sadece tarih okunur, hiçbir şey kaydedilmez."""
import re, json, base64, urllib.request, urllib.parse, datetime as dt

UA2 = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36",
       "Accept": "text/html,*/*", "Accept-Language": "tr-TR,tr;q=0.9"}
YIL_RE = re.compile(r"\b(19\d\d|20\d\d)\b")
MUAF_RE = re.compile(r"\bberi\b|yıldönüm|yıldır|kurul|tarihçe|yıllık", re.I)

def eski_baslik(t, simdi):
    """Başlıkta iki yıl ve daha öncesine ait bir yıl geçiyorsa (ör. 2018) eski sayılır; "1924'ten beri" gibi anlatımlar muaf."""
    yillar = [int(y) for y in YIL_RE.findall(t or "")]
    return bool(yillar) and min(yillar) <= simdi.year - 2 and not MUAF_RE.search(t)

def gn_coz(u):
    """news.google.com/rss/articles/<kod> → gerçek haber adresi; çözülemezse ""."""
    m = re.search(r"news\.google\.com/(?:rss/)?articles/([^/?#]+)", u or "")
    if not m: return "" if "news.google.com" in (u or "") else (u or "")
    kod = m.group(1)
    try:  # eski biçim: adres kodun içinde açık yazar
        b = base64.urlsafe_b64decode(kod + "=" * (-len(kod) % 4))
        s = re.findall(rb"https?://[\x21-\x7e]+", b)
        if s: return s[0].decode("ascii", "ignore").rstrip("\x01\x02\x03\x04\x05\x08")
    except Exception: pass
    try:  # yeni biçim (AU_yqL…): Google'ın kendi çözücüsüne imza ve zaman damgasıyla sorulur
        pg = urllib.request.urlopen(urllib.request.Request(f"https://news.google.com/articles/{kod}", headers=UA2), timeout=15).read().decode("utf8", "ignore")
        sg, ts = re.search(r'data-n-a-sg="([^"]+)"', pg), re.search(r'data-n-a-ts="([^"]+)"', pg)
        if not (sg and ts): return ""
        ic = json.dumps(["garturlreq", [["en-US", "US", ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"], None, None, 1, 1, "US:en", None, 180,
                         None, None, None, None, None, 0, None, None, [1608992183, 723341000]], "en-US", "US", 1, [2, 3, 4, 8], 1, 0, "655000234", 0, 0, None, 0],
                         kod, int(ts.group(1)), sg.group(1)])
        body = urllib.parse.urlencode({"f.req": json.dumps([[["Fbv4je", ic, None, "generic"]]])}).encode()
        r = urllib.request.urlopen(urllib.request.Request("https://news.google.com/_/DotsSplashUi/data/batchexecute", data=body,
                                   headers={**UA2, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"}), timeout=15).read().decode("utf8", "ignore")
        m2 = re.search(r'garturlres\\?",\\?"(https?://[^"\\]+)', r)
        return m2.group(1) if m2 else ""
    except Exception: return ""

TARIH_RE = [re.compile(p, re.I) for p in (
    r'property=["\']article:published_time["\'][^>]*content=["\']([^"\']+)', r'content=["\']([^"\']+)["\'][^>]*property=["\']article:published_time',
    r'"datePublished"\s*:\s*"([^"]+)"', r'itemprop=["\']datePublished["\'][^>]*content=["\']([^"\']+)',
    r'name=["\'](?:pubdate|publish-date|publishdate|publish_date|DC\.date\.issued)["\'][^>]*content=["\']([^"\']+)', r'<time[^>]+datetime=["\']([^"\']+)')]

def tarih_ayikla(s):
    s = (s or "").strip()
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m: return m.group(0)
    m = re.match(r"(\d{1,2})[./](\d{1,2})[./](\d{4})", s)
    return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}" if m else ""

def yayin_tarihi(url):
    """Haber sayfasındaki yayın tarihi (YYYY-AA-GG); bulunamazsa ""."""
    try:
        raw = urllib.request.urlopen(urllib.request.Request(url, headers=UA2), timeout=12).read(300000).decode("utf8", "ignore")
    except Exception: return ""
    return tarih_bul(raw)

def tarih_bul(raw):
    for rx in TARIH_RE:
        m = rx.search(raw)
        if m:
            t = tarih_ayikla(m.group(1))
            if t: return t
    return ""

def eski_mi(x, cache, simdi, sinir_gun=60):
    """x: {"t","u"}; cache: eski JSON'daki isb_tarih. Dönüş: (eski?, kayıt | None). None → bakılmadı."""
    if eski_baslik(x.get("t"), simdi): return True, {"p": "", "n": "baslik"}
    v = cache.get(x.get("u"))
    if v is None:
        r = gn_coz(x.get("u")); p = yayin_tarihi(r) if r else ""
        v = {"p": p, "r": r[:300]}
    sinir = (simdi - dt.timedelta(days=sinir_gun)).strftime("%Y-%m-%d")
    return bool(v.get("p")) and v["p"] < sinir, v
