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

print("=== isbank.com.tr ===")
for ad, url in [("bireysel", "https://www.isbank.com.tr/kampanyalar"), ("ticari", "https://www.isbank.com.tr/kampanyalar/ticari"), ("ticari-2", "https://www.isbank.com.tr/ticari/kampanyalar")]:
    st, body = get(url)
    cats = kategoriler(body, "https://www.isbank.com.tr") if body else []
    print(f"[{ad}] {url.replace('https://www.isbank.com.tr', '')} -> HTTP {st}, kategori bağlantısı: {len(cats)}, kartlar(güncel/geçmiş): {kart_say(body) if body else '-'}")
    for href, cad, n in cats:
        st2, b2 = get(href)
        g, p = kart_say(b2) if b2 else (0, 0)
        yol = href.replace("https://www.isbank.com.tr", "")
        print(f"   {cad[:40]:40s} site:{n:4d}  okunan güncel:{g:4d}  geçmiş:{p:3d}  {'✓' if g == n else '≠'}  {yol}  HTTP {st2}")

print("=== maximum.com.tr ===")
for ad, url in [("bireysel", "https://www.maximum.com.tr/kampanyalar/bireysel"), ("ticari", "https://www.maximum.com.tr/kampanyalar/ticari")]:
    st, body = get(url)
    b = temiz(body)
    linkler = len(set(re.findall(r'href="(/kampanyalar/[^"#?]+)"', b)))
    sonx = len(re.findall(r"Son\s+\d+\s+G[üu]n", b))
    sayi = re.search(r"Kampanya\s+Sayısı\s*\(\s*(\d+)\s*\)", b)
    json_var = "evet" if re.search(r"__NEXT_DATA__|application/json|window\.__", body) else "hayır"
    print(f"[{ad}] HTTP {st}, sayfa boyu {len(body)//1024} KB, kampanya bağlantısı: {linkler}, 'Son X Gün': {sonx}, 'Kampanya Sayısı': {sayi.group(1) if sayi else '-'}, gömülü veri: {json_var}")
