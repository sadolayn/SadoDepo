# Kampanya toplayıcı: isbank.com.tr, maximum.com.tr ve maximiles.com.tr (her biri bireysel + ticari)
# Günde bir kez (sabah) çalışır; isbank/kampanya_hepsi.json dosyasına YALNIZCA işlenmiş alanları yazar
# (başlık, kısa açıklama, bitiş tarihi, bağlantı, ilk görülme, ne/nere grubu). Ham sayfa kaydedilmez, kayda yalnızca sayı basılır.
# Sigorta: bir kaynak o gün açılmazsa ya da öncekinin yarısından az kampanya gelirse o kaynağın eski listesi korunur.
import json, re, html, os, urllib.request, urllib.error, datetime as dt

OUT = "isbank/kampanya_hepsi.json"
UA = {"User-Agent": "Mozilla/5.0 (compatible; SadolaynBot/1.0)", "Accept-Language": "tr-TR,tr"}
TR = dt.timezone(dt.timedelta(hours=3))
bugun = dt.datetime.now(TR).date()

DURUM = {}  # alan adı -> son HTTP durumu (kayda yalnızca sayı olarak basılır)

def get(url):
    alan = url.split("/")[2]
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60)
        DURUM[alan] = r.status
        return r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        DURUM[alan] = e.code
    except Exception:
        DURUM[alan] = 0
    return ""

def temiz(s):
    return re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", s)

def metin(s):
    s = re.sub(r"(?i)<br\s*/?>", " ", s)
    s = html.unescape(re.sub(r"<[^>]+>", " ", s))
    s = re.sub(r"\s+", " ", s).strip()
    # Banka diliyle yazılmış "sizi bekliyor / kazanın" gibi ifadeler olduğu gibi kalır; yalnızca boşluk temizlenir
    return s

# ---------- Sınıflandırıcı ----------
# Kampanya sınıflandırıcı: her kampanya "ne" ve "nere" boyutlarında TAM OLARAK BİR gruba girer (ilk eşleşen kazanır).

def _r(*k):
    return re.compile("|".join(k), re.I)

# Ne kazanırım — sıra önemli
NE = [
    ("MaxiMil",       "✈️", _r(r"maximil", r"maximiles[’'`]?(?:ın|in)?ı?z?\s+ile", r"\bmil(?:ler)?\b")),
    ("MaxiPuan",      "🪙", _r(r"maxipuan", r"pazaramapuan", r"\bpuan", r"geri kazan")),
    ("Faiz & Kredi",  "🏦", _r(r"faiz oran", r"\bkredi(?!\s*kart)", r"ek hesap", r"mevduat", r"vadeli", r"faizsiz kredi")),
    ("İndirim",       "🏷️", _r(r"indirim", r"%\s?\d", r"\d\s?%", r"yerine", r"bedava", r"ücretsiz", r"hediye", r"usd\s?'?\s?ye varan", r"bağış")),
    ("Taksit",        "📆", _r(r"taksit", r"erteleme", r"vade fark", r"sonradan")),
]
NE_DIGER = ("Ayrıcalık", "✨")

# Nerede — sıra önemli (dar ve kesin olanlar önce)
NERE = [
    # Tarım ilk sırada: çiftçi kampanyaları (İmece Kart, traktör, hasat, sulama...) hiçbir zaman başka gruba karışmasın
    ("Tarım",               "🌾", _r(r"tarım", r"çiftçi", r"zirai", r"tohum", r"gübre", r"traktör", r"hayvancılık", r"besici", r"sulama", r"hasat",
                                  r"imece", r"\btmo\b", r"elüs", r"ürün senedi")),
    ("Pati",                "🐾", _r(r"\bpati\b", r"royal canin", r"veteriner", r"petshop")),
    ("Ödeme & Fatura",      "🧾", _r(r"vergi", r"harç", r"fatura", r"igdaş", r"sağlık", r"eczane", r"bağış", r"katkı pay", r"\bsgk\b", r"tema vakf", r"aidat", r"\bmtv\b", r"farmazon")),
    ("Eğitim & Kitap",      "🎓", _r(r"eğitim", r"okul", r"kırtasiye", r"kitap", r"penguen", r"iş kültür", r"kurs\b")),
    ("Araç & Akaryakıt",    "🚗", _r(r"akaryak", r"\bshell\b", r"opet", r"petrol", r"istasyon", r"şarj", r"lastik", r"pirelli", r"petlas", r"michelin",
                                  r"araç", r"oto\s?(?:yol|yıkama|motiv|park)", r"otomotiv", r"otopark", r"\bhgs\b", r"vinyet", r"europcar", r"tiktak", r"yolcu360",
                                  r"windycar", r"qcar", r"enterprise[’'][dt]an", r"enterprise araç", r"araç kiralama", r"rent\s?go", r"up enerji", r"zeplin", r"taşıt")),
    ("Market & Yemek",      "🛒", _r(r"market", r"migros", r"carrefour", r"\ba101\b", r"\bşok\b", r"\bbim\b", r"getir", r"metro mağaza", r"bonveno", r"yemek",
                                  r"restoran", r"brunch", r"(?<!cinemapink by maximum )büfe", r"uber eats", r"trendyol go", r"kafe", r"\bcafe\b", r"gıda", r"toptan", r"gastropay")),
    ("Seyahat",             "🏖️", _r(r"(?<!swiss)otel", r"tatil", r"uçak", r"uçuş", r"\bets\b", r"ets[’']", r"ucuzabilet", r"\bthy\b", r"türk hava", r"emirates", r"havalimanı",
                                  r"lounge", r"fast track", r"allways", r"hızlı geçiş", r"(?<!online )(?<!internet )yurt dışı(?!na para| internet| online)", r"duty free", r"roaming", r"\besim", r"seyahat", r"turizm", r"\btur(?:lar)?", r"pegasus")),
    ("Giyim & Kozmetik",    "👗", _r(r"giyim", r"kozmetik", r"ayakkab", r"aksesuar", r"zara\b(?! home)", r"lefties", r"massimo", r"stradivarius", r"pull&bear", r"bershka",
                                  r"oysho", r"\bmavi\b", r"mavi[’']", r"\bflo\b", r"flo[’']", r"lumberjack", r"nine west", r"in street", r"reebok", r"under armour", r"sportive",
                                  r"\bgap\b", r"gap[’']", r"marks", r"forever 21", r"lululemon", r"\bdesa\b", r"desa[’']", r"\badl\b", r"adl[’']", r"love my body", r"victoria",
                                  r"sephora", r"m\.a\.c", r"bobbi brown", r"yves rocher", r"kiko", r"cosmetics", r"jimmy key", r"tumi", r"samsonite", r"atasay", r"eleventy",
                                  r"in-formal", r"maje", r"sandro", r"capri", r"decathlon", r"trendyolmilla", r"\bdolap\b", r"zsa zsa", r"mağazalarında vade farksız")),
    ("Elektronik & Beyaz Eşya", "📱", _r(r"elektronik", r"media\s?markt", r"samsung", r"teknosa", r"vatan", r"apple", r"beyaz eşya", r"klima", r"mitsubishi", r"dyson",
                                  r"miele", r"tefal", r"shark ninja", r"süpürge", r"monitör", r"telefon", r"\bmonster\b", r"monster[’']", r"demirdöküm", r"vaillant", r"yapay zeka", r"gemini", r"\btv\b")),
    ("Ev & Yaşam",          "🛋️", _r(r"mobilya", r"yatak", r"yataş", r"doğtaş", r"kelebek", r"ikea", r"bella maison", r"lazzoni", r"zara home", r"karaca", r"korkmaz",
                                  r"paşabahçe", r"yatsan", r"dekorasyon", r"flying tiger", r"yapı sektör", r"toyzz", r"oyuncak", r"ofis kiralama", r"offismekan", r"iş mekan")),
    ("Eğlence & Spor",      "🎭", _r(r"macfit", r"\bspor", r"sport", r"maraton", r"euroleague", r"bubilet", r"passo", r"\bbkm\b", r"etkinlik", r"sinema", r"cinema",
                                  r"kidzania", r"digiturk", r"prime üyel", r"alive", r"konser", r"biletinix", r"webrazzi")),
    ("Online Alışveriş",    "🌐", _r(r"e-ticaret", r"amazon", r"trendyol", r"hepsiburada", r"\bn11\b", r"n11[’']", r"pttavm", r"pazarama", r"yepy", r"internet alışveriş",
                                  r"online", r"\.com", r"sevkiyat", r"kargo")),
    ("Bankacılık",          "🏦", _r(r"maaş", r"emekli", r"kredi", r"ek hesap", r"mevduat", r"sigorta", r"\bbes\b", r"işcep", r"bankamatik", r"temassız", r"karekod",
                                  r"\btroy\b", r"troy[’']", r"kart başvuru", r"ek kart", r"yeni kredi kartı", r"başvurunuz", r"\bpos\b", r"yazarkasa", r"ökc", r"esnaf",
                                  r"tarım", r"çiftçi", r"startup", r"ticari kart", r"ticari kredi", r"eft", r"havale", r"işpay", r"hesap", r"faiz", r"black", r"plus", r"finansman", r"teminat", r"kosgeb", r"imece", r"\bosb\b", r"girişimci", r"paket", r"ihracatçı", r"kart sahibi")),
]
NERE_DIGER = ("Genel", "✨")

# isbank.com.tr kategori adresinden kesin "nere" ipucu (anahtar kelimeden önce gelir)
SLUG_NERE = {
    "ciftci-ve-tarim-bankaciligi-kampanyalari": "Tarım",
    "gida-market-kampanyalari": "Market & Yemek", "akaryakit-kampanyalari": "Araç & Akaryakıt", "otomotiv-kampanyalari": "Araç & Akaryakıt",
    "arac-kiralama-kampanyalari": "Araç & Akaryakıt", "giyim-aksesuar-kampanyalari": "Giyim & Kozmetik", "seyahat-kampanyalari": "Seyahat",
    "turizm-kampanyalari": "Seyahat", "egitim-kirtasiye-kampanyalari": "Eğitim & Kitap", "dekorasyon-mobilya-kampanyalari": "Ev & Yaşam",
    "beyaz-esya-kampanyalari": "Elektronik & Beyaz Eşya", "e-ticaret-kampanyalari": "Online Alışveriş", "fatura-kampanyalari": "Ödeme & Fatura",
    "iste-maasa-ozel": "Bankacılık", "emeklilere-ozel": "Bankacılık", "bireysel-emeklilik": "Bankacılık", "bireysel-kredi-kampanyalari": "Bankacılık",
    "bankamatik-karti-kampanyalari": "Bankacılık",
}

def sinifla(k, slug=""):
    t = (k.get("baslik", "") + " " + k.get("ozet", "")).replace("İ", "i").replace("I", "ı")
    tb = k.get("baslik", "").replace("İ", "i").replace("I", "ı")
    ne = next((ad for ad, _, re_ in NE if re_.search(tb)), None) or next((ad for ad, _, re_ in NE if re_.search(t)), NE_DIGER[0])
    nere = SLUG_NERE.get(slug) or next((ad for ad, _, re_ in NERE if re_.search(tb)), None) or next((ad for ad, _, re_ in NERE if re_.search(t)), NERE_DIGER[0])
    return ne, nere

GRUPLAR = {"ne": [(a, i) for a, i, _ in NE] + [NE_DIGER], "nere": [(a, i) for a, i, _ in NERE] + [NERE_DIGER]}

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

def isb_kartlar(body, adet=None):
    """Kategori sayfasındaki güncel kampanya kartları ('Geçmiş Kampanyalar' sonrası alınmaz).
    Bitiş tarihi yazmayan kartlar da alınır; ama sayfadaki adetten fazlası çıkarsa (menü bağlantısı karışmış demektir) yalnızca tarihli olanlar kalır."""
    parca = re.split(r"Geçmiş\s+Kampanyalar", temiz(body), maxsplit=1)
    guncel = parca[0]
    out, gor, tarihsiz = [], set(), []
    # Süresi bitmiş kartlar (sitede "Bu Kampanya Sona Ermiştir" etiketli ya da "Geçmiş Kampanyalar" altında) yalnızca sayılır
    biten = set()
    for m in re.finditer(r'(?is)<a[^>]+href="(/kampanyalar/[^"#?]+)"[^>]*>(.*?)</a>', temiz(body)):
        ic = metin(m.group(2)); sl = m.group(1).rstrip("/").split("/")[-1]
        if re.search(r"sona\s+erm", ic, re.I) or (len(parca) > 1 and m.start() >= len(guncel) and len(ic) >= 15 and not re.search(r"\(\d+\)$", ic)):
            biten.add(sl)
    for m in re.finditer(r'(?is)<a[^>]+href="(/kampanyalar/[^"#?]+)"[^>]*>(.*?)</a>', guncel):
        href, ic = m.group(1).replace("//", "/"), metin(m.group(2))
        slug = href.rstrip("/").split("/")[-1]
        if re.search(r"\(\d+\)$", ic) or slug in gor:
            continue
        if slug in biten or re.search(r"sona\s+erm", ic, re.I):
            continue
        mt = re.match(r"(.*?)\s*Bitiş Tarihi:\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*(.*)", ic)
        if not mt:
            if len(ic) >= 20 and not re.match(r"(?i)^(>|›|tüm kampanya|detaylı bilgi|geçmiş kampanya)", ic) and not re.search(r"kampanyaları$", ic, re.I):
                gor.add(slug)
                tarihsiz.append({"baslik": re.sub(r"\s*Detaylı Bilgi\s*>?\s*$", "", ic)[:160], "bitis": "", "ozet": "", "url": KOK_I + href})
            continue
        gor.add(slug)
        out.append({"baslik": mt.group(1).strip()[:160], "bitis": f"{mt.group(4)}-{int(mt.group(3)):02d}-{int(mt.group(2)):02d}",
                    "ozet": re.sub(r"\s*Detaylı Bilgi\s*>?\s*$", "", mt.group(5)).strip()[:220], "url": KOK_I + href})
    if tarihsiz and (adet is None or len(out) + len(tarihsiz) <= adet):
        out += tarihsiz
    isb_kartlar.biten = len(biten)
    return out

def isbank(segment):
    ana = get(KOK_I + "/kampanyalar" + ("?v=ticari" if segment == "ticari" else ""))
    if not ana:
        return None
    kats = []
    for url, ad, adet in isb_kategoriler(ana):
        lst = isb_kartlar(get(url), adet)
        slug = url.split("?")[0].rstrip("/").split("/")[-1]
        kats.append({"ad": ad, "slug": slug, "adet": adet, "url": url, "kampanyalar": lst, "biten": isb_kartlar.biten})
    # İş Bankası'nın kategori adetlerine süresi bitmiş ("Bu Kampanya Sona Ermiştir") kampanyalar da dahildir;
    # sitede güncel kampanyalar önce, bitmişler altta ve "Daha Fazla Kampanya Göster" ile listelenir. Burada yalnızca güncel olanlar alınır.
    return {"toplam": sum(k["adet"] for k in kats), "kategoriler": kats}

# ---------- maximum.com.tr ----------
KOK_M = "https://www.maximum.com.tr"

def max_kartlar(body, kok=KOK_M):
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
        # Kartın bağlantısı "Son N Gün" şeridinden ÖNCE gelir (görselin bağlantısı): önceki karttan bu şeride kadarki son kampanya bağlantısı
        once = b[(yer[i - 1].end() if i else max(0, m.start() - 6000)): m.start()]
        link = None
        for h in reversed(re.findall(r'href="([^"#]+)"', once)):
            if "kampanya" in h.lower() and not re.search(r"/kampanyalar/(bireysel|ticari)(-kampanyalar)?/?$", h, re.I):
                link = h if h.startswith("http") else kok + h
                break
        anahtar = link or metinler[0]
        if anahtar in gor:
            continue
        gor.add(anahtar)
        kalan = int(m.group(1))
        out.append({"baslik": metinler[0][:160], "bitis": (bugun + dt.timedelta(days=max(0, kalan - 1))).isoformat(),
                    "ozet": (metinler[1][:220] if len(metinler) > 1 and len(metinler[1]) > 25 else ""), "url": link or kok + "/kampanyalar"})
    return out

def maximum(segment):
    body = get(f"{KOK_M}/kampanyalar/{segment}")
    if not body:
        return None
    lst = max_kartlar(body)
    say = re.search(r"Kampanya\s+Sayısı\s*\(\s*(\d+)\s*\)", temiz(body))
    return {"toplam": int(say.group(1)) if say else len(lst), "kampanyalar": lst}

# ---------- maximiles.com.tr ----------
# Liste sayfası kampanyaları tarayıcıda sonradan yükler; Bireysel/Ticari sekmeleri aynı adreste.
# 1) Kampanya adresleri toplanır: sayfanın kendisinden ve (kuruluysa) gerçek bir tarayıcıyla, iki sekmede ayrı ayrı.
# 2) Her kampanyanın kendi sayfasından yalnızca başlık, kısa açıklama ve bitiş tarihi alınır.
KOK_X = "https://www.maximiles.com.tr"
X_ADRES = re.compile(r"^https?://www\.maximiles\.com\.tr/kampanyalar/([a-z0-9-]+)/?$", re.I)
X_SEKME = {"bireysel", "ticari", "bireysel-kampanyalar", "ticari-kampanyalar"}
AYLAR = {a: i + 1 for i, a in enumerate(["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"])}

def x_norm(h):
    h = html.unescape(h).split("#")[0].split("?")[0]
    if not h.startswith("http"):
        h = KOK_X + "/" + h.lstrip("/")
    m = X_ADRES.match(h)
    return f"{KOK_X}/kampanyalar/{m.group(1).lower()}" if m and m.group(1).lower() not in X_SEKME else None

def x_tarayici():
    """Gerçek tarayıcıyla iki sekmede görünen kampanya adresleri: (bireysel, ticari) ya da kurulu değilse None."""
    try:
        from playwright.sync_api import sync_playwright
    except Exception:
        return None
    gor = "els => els.filter(e => e.offsetParent !== null).map(e => e.href)"
    try:
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page(user_agent=UA["User-Agent"], locale="tr-TR", viewport={"width": 1280, "height": 900})
            pg.goto(KOK_X + "/kampanyalar", wait_until="networkidle", timeout=90000)
            pg.wait_for_timeout(2500)
            def topla():
                for _ in range(40):  # "Daha fazla" düğmesi varsa liste bitene kadar
                    d = pg.get_by_role("button", name=re.compile(r"daha fazla|devamını gör|tümünü gör", re.I))
                    if not d.count() or not d.first.is_visible():
                        break
                    d.first.click()
                    pg.wait_for_timeout(1500)
                for _ in range(12):
                    pg.evaluate("window.scrollBy(0, document.body.scrollHeight)")
                    pg.wait_for_timeout(400)
                return {x for x in map(x_norm, pg.eval_on_selector_all("a[href*='kampanyalar/']", gor)) if x}
            bir = topla()
            # "Ticari Kampanyalar" yazısı menüde de olabilir: listeyi gerçekten değiştiren ilk dokunuş sekmedir
            tic = set()
            for sek in pg.get_by_text(re.compile(r"^\s*Ticari\s+Kampanyalar\s*$")).all():
                try:
                    if not sek.is_visible():
                        continue
                    once = pg.url
                    sek.click(timeout=5000)
                    pg.wait_for_timeout(3000)
                    t = topla()
                    if t and t != bir:
                        tic = t
                        break
                    if pg.url != once:
                        pg.goto(KOK_X + "/kampanyalar", wait_until="networkidle", timeout=90000)
                        pg.wait_for_timeout(2500)
                except Exception:
                    continue
            b.close()
            return bir - tic if tic else bir, tic - bir
    except Exception:
        return None

AY_RE = "ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık"

def x_tarih(t):
    """Kampanya metnindeki bitiş: önce tarih aralığının sonu, yoksa metindeki en geç tarih.
    Dönüş: ISO tarih, "" (tarih yok) ya da None (bütün tarihler geçmiş: kampanya bitmiş)."""
    t = t.lower()
    def d(y, a, g):
        try: return dt.date(int(y), int(a) if str(a).isdigit() else AYLAR[a], int(g))
        except (ValueError, KeyError): return None
    sonlar = []
    for m in re.finditer(r"(\d{1,2})[./](\d{1,2})[./](20\d{2})\s*(?:-|–|ile)\s*(\d{1,2})[./](\d{1,2})[./](20\d{2})", t):
        sonlar.append(d(m.group(6), m.group(5), m.group(4)))
    for m in re.finditer(r"(\d{1,2})\s*(?:(" + AY_RE + r")\s*(?:(20\d{2})\s*)?)?(?:-|–)\s*(\d{1,2})\s+(" + AY_RE + r")\s+(20\d{2})", t):
        sonlar.append(d(m.group(6), m.group(5), m.group(4)))
    tum = [d(y, a, g) for g, a, y in re.findall(r"\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b", t)]
    tum += [d(y, a, g) for g, a, y in re.findall(r"\b(\d{1,2})\s+(" + AY_RE + r")\s+(20\d{2})\b", t)]
    sonlar, tum = [x for x in sonlar if x], [x for x in tum if x]
    aday = sonlar or tum
    if not aday:
        return ""
    gelecek = [x for x in aday if bugun <= x <= bugun + dt.timedelta(days=400)]
    return max(gelecek).isoformat() if gelecek else None

def x_baslik_gun(baslik):
    """Başlık tek bir günü söylüyorsa ("25 Ekim'de …") o gün; yoksa None."""
    tg = re.search(r"\b(\d{1,2})\s+(" + AY_RE + r")[’'`]?(?:d|t)[ae]\b", baslik.lower())
    if not tg: return None
    try:
        g = dt.date(bugun.year, AYLAR[tg.group(2)], int(tg.group(1)))
        return g.replace(year=bugun.year + 1) if g < bugun - dt.timedelta(days=180) else g
    except (ValueError, KeyError):
        return None

def x_detay(url):
    b = get(url)
    if not b:
        return None
    t = temiz(b)
    h1 = re.search(r"(?is)<h1[^>]*>(.*?)</h1>", t)
    baslik = metin(h1.group(1)) if h1 else ""
    if not baslik:
        og = re.search(r'(?i)<meta[^>]+property="og:title"[^>]+content="([^"]+)"', b)
        baslik = re.sub(r"\s*[|–-]\s*Maximiles.*$", "", html.unescape(og.group(1))).strip() if og else ""
    if len(baslik) < 8:
        return None
    ac = re.search(r'(?i)<meta[^>]+name="description"[^>]+content="([^"]*)"', b)
    ozet = re.sub(r"\s+", " ", html.unescape(ac.group(1))).strip() if ac else ""
    if ozet.lower().startswith(baslik.lower()[:30]):
        ozet = ""
    ticari = bool(re.search(r"Kampanyalar\s*(?:[›>/»]\s*)?Ticari\s+Kampanyalar", metin(t)))
    # Tarih yalnızca başlığın altındaki kampanya metninde aranır (menü, alt bilgi ve öteki kampanya kartları dışarıda kalır)
    govde = metin(t[h1.end():] if h1 else t)[:3500]
    # Başlık tek bir günü söylüyorsa ("25 Ekim'de …") kampanya o gündür; metindeki puan yükleme tarihi bitiş sanılmasın
    gun_ = x_baslik_gun(baslik)
    if gun_:
        if gun_ < bugun: return "bitti"
        return {"baslik": baslik[:160], "bitis": gun_.isoformat(), "ozet": ozet[:220], "url": url, "tv": 3}, ticari
    # Sayfanın kendi "Başlangıç - Bitiş Tarihi" alanı varsa kesin olan odur (metindeki puan yükleme tarihi gibi sonraki tarihler bitiş sanılmasın)
    alan = re.search(r"başlangıç\s*[-–]\s*bitiş\s*tarihi\s*:?\s*\d{1,2}[./]\d{1,2}[./]20\d{2}\s*[-–]\s*(\d{1,2})[./](\d{1,2})[./](20\d{2})", metin(t).lower())
    if alan:
        try:
            son = dt.date(int(alan.group(3)), int(alan.group(2)), int(alan.group(1)))
            if son < bugun: return "bitti"
            return {"baslik": baslik[:160], "bitis": son.isoformat(), "ozet": ozet[:220], "url": url, "tv": 2}, ticari
        except ValueError:
            pass
    bitis = x_tarih(govde)
    if bitis is None:
        return "bitti"
    return {"baslik": baslik[:160], "bitis": bitis, "ozet": ozet[:220], "url": url, "tv": 2}, ticari

X_HEPSI = None

def x_hepsi():
    global X_HEPSI
    if X_HEPSI is not None:
        return X_HEPSI
    X_HEPSI = {}
    ana = get(KOK_X + "/kampanyalar")
    duz = {x for x in map(x_norm, re.findall(r'href=["\']([^"\']*kampanyalar/[a-z0-9-]+/?)["\']', ana, re.I)) if x}
    tr = x_tarayici()
    bir_t, tic_t = tr if tr else (set(), set())
    print(f"maximiles: sayfada {len(duz)} bağlantı, tarayıcıda {len(bir_t)} bireysel + {len(tic_t)} ticari" + ("" if tr else " (tarayıcı yok)"))
    biten = 0
    # Daha önce okunmuş ve bitişi gelmemiş kampanyanın sayfası yeniden açılmaz (banka sitesine gereksiz yük olmasın):
    # yalnızca yeni çıkan kampanyaların kendi sayfası okunur
    bilinen = {k["url"]: k for seg_ in ("bireysel", "ticari") for k in ((eski.get("maximiles") or {}).get(seg_) or {}).get("kampanyalar", [])
               if k.get("bitis") and k["bitis"] >= bugun.isoformat() and k.get("tv", 0) >= 2}  # tv: bitiş tarihi yeni okuyucuyla okundu (eskiler bir kez yeniden okunur)
    acilan = 0
    for url in sorted(duz | bir_t | tic_t):
        if url in bilinen:
            k = {x: bilinen[url][x] for x in ("baslik", "bitis", "ozet", "url", "tv")}
            g_ = x_baslik_gun(k["baslik"])
            if g_ and g_ < bugun:
                biten += 1
                continue
            if g_: k["bitis"] = g_.isoformat()
            seg = "ticari" if url in tic_t else "bireysel" if url in bir_t else next((s_ for s_ in ("bireysel", "ticari") if any(y["url"] == url for y in ((eski.get("maximiles") or {}).get(s_) or {}).get("kampanyalar", []))), "bireysel")
            X_HEPSI.setdefault(seg, []).append(k)
            continue
        acilan += 1
        r = x_detay(url)
        if r == "bitti":
            biten += 1
            continue
        if not r:
            continue
        k, ticari_iz = r
        if url in tic_t: seg = "ticari"
        elif url in bir_t: seg = "bireysel"
        else: seg = "ticari" if ticari_iz or re.search(r"ticari|business|işyeri|kobi|şirket", url + " " + k["baslik"], re.I) else "bireysel"
        X_HEPSI.setdefault(seg, []).append(k)
    print(f"maximiles: yeni açılan sayfa {acilan}, hafızadan {len(bilinen)}, süresi geçmiş {biten}, bitişi okunamayan {sum(1 for v in X_HEPSI.values() for k in v if not k['bitis'])}")
    return X_HEPSI

def maximiles(segment):
    lst = x_hepsi().get(segment, [])
    return {"toplam": len(lst), "kampanyalar": lst} if lst else None

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
    # Tekil bağlantı sayısı: bağlantılar okunamayıp hepsi aynı adrese düşerse sigorta devreye girer
    if "kategoriler" in v: return len({k["url"] for c in v["kategoriler"] for k in c["kampanyalar"]})
    return len({k["url"] for k in v.get("kampanyalar", [])})

KOK = {"isbank": KOK_I, "maximum": KOK_M, "maximiles": KOK_X}
veri = {"guncelleme": dt.datetime.now(TR).strftime("%Y-%m-%dT%H:%M"), "isbank": {}, "maximum": {}, "maximiles": {}}
for kaynak, fn in [("isbank", isbank), ("maximum", maximum), ("maximiles", maximiles)]:
    for seg in ["bireysel", "ticari"]:
        yeni = fn(seg)
        onceki = (eski.get(kaynak) or {}).get(seg)
        if not yeni or (onceki and adet(yeni) < 0.5 * adet(onceki)):
            print(f"::warning::{kaynak}/{seg}: okunan {adet(yeni)} (önceki {adet(onceki)}, HTTP {DURUM.get(KOK[kaynak].split('/')[2], '-')}) — eski liste korundu")
            yeni = onceki
        # Maximiles listesi tarayıcıda her seferinde aynı eksiksizlikte yüklenmeyebilir:
        # bu turda görünmeyen ama bitiş günü gelmemiş kampanya korunur (sayı oynamasın, geri gelen "yeni" sanılmasın)
        if kaynak == "maximiles" and yeni and onceki and yeni is not onceki:
            var = {k["url"] for k in yeni["kampanyalar"]}
            kalan = [k for k in onceki.get("kampanyalar", []) if k["url"] not in var and k.get("bitis") and k["bitis"] >= bugun.isoformat()]
            if kalan:
                yeni["kampanyalar"] += kalan
                yeni["toplam"] = len(yeni["kampanyalar"])
        veri[kaynak][seg] = yeni
        if yeni:
            print(f"{kaynak}/{seg}: sitede {yeni['toplam']}, okunan {adet(yeni)}" + (f", kategori {len(yeni['kategoriler'])}" if "kategoriler" in yeni else ""))

ilk_tarih(veri, eski)
# Bir kaynak/bölüm ilk kez toplanıyorsa kampanyaları "yeni" sayılmaz (hepsine birden YENİ rozeti çıkmasın)
for kaynak in ("isbank", "maximum", "maximiles"):
    for seg, v in veri[kaynak].items():
        if v and not adet((eski.get(kaynak) or {}).get(seg)):
            for k in v.get("kampanyalar", []) + [x for c in v.get("kategoriler", []) for x in c["kampanyalar"]]:
                k["ilk"] = "2000-01-01"

# Her kampanyaya tek bir "ne" ve tek bir "nere" grubu: toplamlar her zaman tutar.
# isbank'ta aynı kampanya birden çok kategoride olabilir; hepsine aynı grup verilir (kategori ipucu olan ilk adres önce).
for kaynak in veri:
    if not isinstance(veri[kaynak], dict): continue
    for seg, v in veri[kaynak].items():
        if not v: continue
        if "kategoriler" in v:
            ipucu, cok = {}, {}
            for kat in v["kategoriler"]:
                for k in kat["kampanyalar"]:
                    if kat["slug"] in SLUG_NERE: cok.setdefault(k["url"], set()).add(SLUG_NERE[kat["slug"]])
                    if k["url"] not in ipucu or (kat["slug"] in SLUG_NERE and ipucu[k["url"]] not in SLUG_NERE):
                        ipucu[k["url"]] = kat["slug"]
            # Sitede birbirinden farklı gruplara giren birden çok kategoride listelenen kampanyada kategori ipucu kullanılmaz
            for u, g in cok.items():
                if len(g) > 1: ipucu[u] = ""
            liste = [(k, ipucu[k["url"]]) for kat in v["kategoriler"] for k in kat["kampanyalar"]]
        else:
            liste = [(k, "") for k in v.get("kampanyalar", [])]
        sonuc = {}
        for k, slug in liste:
            if k["url"] not in sonuc: sonuc[k["url"]] = sinifla(k, slug)
            k["ne"], k["nere"] = sonuc[k["url"]]
# Aynı kampanya başka sitede açıklamasıyla bir gruba girdiyse, kısa yazıldığı için "Genel" kalan kopyası da o gruba alınır
def _ayni(b): return re.sub(r"[^a-z0-9]", "", b.lower().replace("ı", "i"))
_tum = [k for kaynak in veri if isinstance(veri[kaynak], dict) for v in veri[kaynak].values() if v
        for k in v.get("kampanyalar", []) + [x for c in v.get("kategoriler", []) for x in c["kampanyalar"]]]
_grup = {}
for k in _tum:
    if k.get("nere") and k["nere"] != NERE_DIGER[0]: _grup.setdefault(_ayni(k["baslik"]), k["nere"])
for k in _tum:
    if k.get("nere") == NERE_DIGER[0] and _ayni(k["baslik"]) in _grup: k["nere"] = _grup[_ayni(k["baslik"])]
# Maximiles sayfalarındaki tarih alanı bazen kampanya metniyle çelişiyor (ör. metin "1–31 Ekim", alan 30.10).
# Aynı kampanya İş Bankası ya da Maximum'da da varsa bitiş günü oradan alınır (önce isbank.com.tr)
_bitis = {}
for kaynak in ("maximum", "isbank"):
    for v in (veri.get(kaynak) or {}).values():
        if not v: continue
        for k in v.get("kampanyalar", []) + [x for c in v.get("kategoriler", []) for x in c["kampanyalar"]]:
            if k.get("bitis"): _bitis[_ayni(k["baslik"])] = k["bitis"]
for v in (veri.get("maximiles") or {}).values():
    if not v: continue
    for k in v.get("kampanyalar", []):
        if _ayni(k["baslik"]) in _bitis: k["bitis"] = _bitis[_ayni(k["baslik"])]
veri["gruplar"] = {b: [{"ad": a, "ikon": i} for a, i in g] for b, g in GRUPLAR.items()}
os.makedirs("isbank", exist_ok=True)
json.dump(veri, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
