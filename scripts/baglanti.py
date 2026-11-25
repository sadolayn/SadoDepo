"""Haftalık bağlantı kontrolü (25 Kasım 2026).

Sitenin sayfalarındaki dış bağlantıları açıp yalnızca durum koduna bakar, sonucu data/baglanti.json'a yazar.
- Banka siteleri (isbank.com.tr, maximum.com.tr vb.) hiç denenmez (CLAUDE.md: banka siteleri Actions üzerinden taranmaz).
- Sayfa içeriği kaydedilmez; yalnızca adres, durum kodu ve bağlantının geçtiği sayfa yazılır.
- Kesin kırık: 404/410 ya da adres hiç bulunamadı (alan adı yok). Zaman aşımı, 403, 429 ve 5xx "açılamadı" sayılır;
  devlet sitelerinin bir kısmı yurt dışından gelen isteği engellediği için bunlar kırık demek değildir.
"""
import concurrent.futures as cf
import datetime as dt
import glob
import json
import os
import re
import socket
import ssl
import urllib.error
import urllib.request

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKTI = os.path.join(KOK, "data", "baglanti.json")

# Hiç denenmeyenler: banka siteleri, sitenin kendi servisleri ve API'ler, bot korumalı sosyal ağlar
BANKA = re.compile(r"(^|\.)(isbank\.com\.tr|maximum\.com\.tr|maximiles\.com\.tr|isyatirim\.com\.tr|iscep\.com\.tr|"
                   r"denizbank\.com|garantibbva\.com\.tr|akbank\.com|yapikredi\.com\.tr|ziraatbank\.com\.tr|halkbank\.com\.tr|"
                   r"vakifbank\.com\.tr|qnb\.com\.tr|enpara\.com|teb\.com\.tr|ing\.com\.tr|kuveytturk\.com\.tr|"
                   r"albarakaturk\.com\.tr|sekerbank\.com\.tr|odeabank\.com\.tr|fibabanka\.com\.tr|hsbc\.com\.tr)$")
ATLA = re.compile(r"(^|\.)(sadolayn\.github\.io|goatcounter\.com|zgo\.at|firebasedatabase\.app|gstatic\.com|googleapis\.com|"
                  r"open-meteo\.com|nominatim\.openstreetmap\.org|tile\.openstreetmap\.org|overpass-api\.de|overpass\.kumi\.systems|"
                  r"overpass\.private\.coffee|script\.google\.com|unpkg\.com|ytimg\.com|w3\.org|purl\.org|openxmlformats\.org|"
                  r"wa\.me|facebook\.com|instagram\.com|linkedin\.com|x\.com|twitter\.com|news\.google\.com)$")


def adresler():
    """HTML ve JS dosyalarındaki dış sayfa bağlantıları → {adres: [sayfalar]}"""
    bul = {}
    for f in sorted(glob.glob(KOK + "/*.html") + glob.glob(KOK + "/*.js")):
        ad = os.path.basename(f)
        if ad in ("sw.js",):
            continue
        s = open(f, encoding="utf-8", errors="replace").read()
        for m in re.finditer(r"https://[^\s\"'<>\\)`]+", s):
            u = m.group(0).rstrip(".,;:")
            if re.search(r"[{}$*|]", u):  # şablon adresleri (${...}, {s}) atlanır
                continue
            host = re.sub(r"^https://([^/:?#]+).*", r"\1", u).lower()
            if BANKA.search(host) or ATLA.search(host):
                continue
            bul.setdefault(u, set()).add(ad)
    return {u: sorted(n) for u, n in bul.items()}


BAGLAM = ssl.create_default_context()
BASLIK = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 SadolaynBaglantiKontrol",
          "Accept-Language": "tr-TR,tr;q=0.9"}


def dene(u):
    """(durum, açıklama) döndürür; içerik okunmaz."""
    for yontem in ("HEAD", "GET"):
        try:
            istek = urllib.request.Request(u, headers=BASLIK, method=yontem)
            with urllib.request.urlopen(istek, timeout=20, context=BAGLAM) as y:
                return y.status, "tamam"
        except urllib.error.HTTPError as e:
            if yontem == "HEAD" and e.code in (400, 403, 404, 405, 429, 500, 501, 503):
                continue  # bazı siteler HEAD isteğini kabul etmez; GET ile bir kez daha denenir
            return e.code, "http"
        except urllib.error.URLError as e:
            neden = e.reason
            if isinstance(neden, socket.gaierror):
                return 0, "alan adı bulunamadı"
            if yontem == "HEAD":
                continue
            return -1, str(neden)[:80]
        except Exception as e:  # zaman aşımı vb.
            if yontem == "HEAD":
                continue
            return -1, type(e).__name__
    return -1, "bilinmiyor"


def main():
    liste = adresler()
    with cf.ThreadPoolExecutor(8) as ex:
        sonuc = dict(zip(liste, ex.map(dene, liste)))
    kirik, acilamayan = [], []
    for u, (kod, aciklama) in sorted(sonuc.items()):
        satir = {"adres": u, "durum": kod if kod > 0 else aciklama, "sayfalar": liste[u]}
        if kod in (404, 410) or aciklama == "alan adı bulunamadı":
            kirik.append(satir)
        elif kod < 200 or kod >= 400:
            acilamayan.append(satir)
    veri = {
        "guncelleme": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
        "kontrol_edilen": len(liste),
        "kirik": kirik,
        "acilamayan": acilamayan,
        "not": "Banka siteleri denenmez. 'açılamayan' listesindekiler çoğunlukla yurt dışı engeli ya da bot korumasıdır; elle bakılmalı.",
    }
    os.makedirs(os.path.dirname(CIKTI), exist_ok=True)
    with open(CIKTI, "w", encoding="utf-8") as f:
        json.dump(veri, f, ensure_ascii=False, indent=1)
    print(f"{len(liste)} adres · kırık {len(kirik)} · açılamayan {len(acilamayan)}")
    for s in kirik:
        print("KIRIK", s["durum"], s["adres"], s["sayfalar"])


if __name__ == "__main__":
    main()
