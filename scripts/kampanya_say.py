# Kampanya kaynakları için SAYIM denemesi: hiçbir dosyaya yazmaz, yalnızca kategori adı ve adet basar.
# Amaç: isbank.com.tr (bireysel + ticari) ve maximum.com.tr listelerinin sade okumayla gelip gelmediğini
# ve "Geçmiş Kampanyalar" ayrılınca sitedeki sayılarla tutup tutmadığını görmek. Ham sayfa ya da metin basılmaz.
import re, html, urllib.request, urllib.error, sys

UA = {"User-Agent": "Mozilla/5.0 (compatible; SadolaynBot/1.0)", "Accept-Language": "tr-TR,tr"}

def get(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60)
        return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:  # ağ hatası
        return 0, ""

def temiz(s):
    s = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", s)
    return s

def kart_say(body):
    """Güncel kampanya kartı sayısı: 'Geçmiş Kampanyalar' başlığından sonrası sayılmaz."""
    b = temiz(body)
    k = re.split(r"Geçmiş\s+Kampanyalar", b, maxsplit=1)
    guncel, gecmis = k[0], (k[1] if len(k) > 1 else "")
    return len(re.findall(r"Bitiş\s*Tarihi", guncel)), len(re.findall(r"Bitiş\s*Tarihi", gecmis))

def kategoriler(body, kok):
    """'Kategori Adı (12)' biçimindeki bağlantılar: (slug, ad, adet)."""
    out, gor = [], set()
    for m in re.finditer(r'(?is)<a[^>]+href="([^"#?]*kampanyalar[^"#?]*)"[^>]*>(.*?)</a>', temiz(body)):
        href, ic = m.group(1), re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", m.group(2)))).strip()
        mm = re.match(r"(.{3,80}?)\s*\((\d+)\)$", ic)
        if not mm or href in gor:
            continue
        gor.add(href)
        out.append((href if href.startswith("http") else kok + href, mm.group(1), int(mm.group(2))))
    return out

print("=== 2. tur: isbank.com.tr Ticari sekmesi ve sayfa geçişi ===")
st, ana = get("https://www.isbank.com.tr/kampanyalar")
# Ticari sekmesine giden bağlantılar (yalnızca adres yolu basılır)
yollar = sorted(set(re.findall(r'href="(/[^"#]*ticari[^"#]*)"', ana, flags=re.I)))
print("ana sayfada 'ticari' geçen bağlantı yolları:", len(yollar))
for y in yollar[:40]:
    print("   ", y)
# Sayfa geçişi: 18'den fazla kampanyalı kategoride olası 2. sayfa biçimleri
kat = "https://www.isbank.com.tr/kampanyalar/giyim-aksesuar-kampanyalari"
st, b1 = get(kat)
ilk = set(re.findall(r'href="(/kampanyalar/[^"#?]+)"', b1))
sayfa_link = sorted(set(re.findall(r'href="([^"#]*(?:page|sayfa|pageIndex|p=)[^"#]*)"', b1, flags=re.I)))
print("kategori sayfasındaki sayfa bağlantıları:", sayfa_link[:10])
for ek in ["?page=2", "?sayfa=2", "?pageIndex=2", "?p=2", "/2", "?pg=2", "?currentPage=2"]:
    st2, b2 = get(kat + ek)
    g, _ = kart_say(b2) if b2 else (0, 0)
    yeni_l = set(re.findall(r'href="(/kampanyalar/[^"#?]+)"', b2)) - ilk if b2 else set()
    print(f"   {ek:16s} HTTP {st2}  güncel kart: {g:3d}  ilk sayfada olmayan bağlantı: {len(yeni_l)}")
# Sayfada "daha fazla" düğmesi ya da veri adresi ipucu (yalnızca var/yok)
for ipucu in ["Daha Fazla", "Devamını", "loadMore", "LoadMore", "api/", "GetCampaign", "data-page", "data-total"]:
    print(f"   ipucu '{ipucu}': {'var' if ipucu.lower() in b1.lower() else 'yok'}")
