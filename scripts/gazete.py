#!/usr/bin/env python3
"""
Resmi Gazete günlük özetini çeker ve gazete/ klasörüne yazar.
Türkçe karakter desteği düzeltilmiş versiyon.
"""

import json
import os
import re
import datetime as dt
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from html.parser import HTMLParser
from zoneinfo import ZoneInfo
from html import unescape

TZ = ZoneInfo("Europe/Istanbul")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
BASE = "https://www.resmigazete.gov.tr"


class FihristParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = []
        self._in_link = False
        self._href = ""
        self._text = []
        self._current_section = "Diğer"

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and "href" in attrs:
            href = attrs["href"]
            if re.search(r"/\d{8}(-\d+)?\.htm", href) or "eskiler" in href:
                self._in_link = True
                self._href = href if href.startswith("http") else BASE + href
                self._text = []

    def handle_endtag(self, tag):
        if tag == "a" and self._in_link:
            text = " ".join(self._text).strip()
            text = re.sub(r"\s+", " ", text)
            text = unescape(text)
            if text and len(text) > 8:
                self.items.append({
                    "baslik": text[:300],
                    "url": self._href,
                    "bolum": self._current_section or "Diğer"
                })
            self._in_link = False
            self._text = []

    def handle_data(self, data):
        data = data.strip()
        if not data:
            return
        if self._in_link:
            self._text.append(data)
        upper = data.upper()
        if any(k in upper for k in ["CUMHURBAŞKANI", "YÖNETMELİK", "TEBLİĞ", "KARAR", "İLAN", "ATAMA", "KANUN", "YÜRÜTME"]):
            if len(data) < 90:
                self._current_section = data.strip()


def fetch(url: str) -> str:
    req = Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "tr-TR,tr;q=0.9"
    })
    with urlopen(req, timeout=45) as r:
        raw = r.read()
        # Türkçe siteler için sırayla dene
        for enc in ("utf-8", "windows-1254", "iso-8859-9", "latin-1"):
            try:
                return raw.decode(enc)
            except UnicodeDecodeError:
                continue
        return raw.decode("utf-8", errors="replace")


def bugunun_tarihi():
    return dt.datetime.now(TZ).date()


def sayfa_url(tarih: dt.date) -> str:
    return f"{BASE}/eskiler/{tarih.year}/{tarih.month:02d}/{tarih.strftime('%Y%m%d')}.htm"


def sayiyi_bul(html: str) -> str:
    m = re.search(r"Sayı\s*[:=]?\s*(\d{4,5})", html, re.I)
    if m:
        return m.group(1)
    m = re.search(r"(\d{5})\s*sayılı", html)
    return m.group(1) if m else ""


def bankacilik_filtrele(items):
    anahtar = [
        "banka", "kredi", "mevduat", "sermaye", "şirket", "anonim", "limited",
        "faiz", "tcmb", "merkez bankası", "bddk", "spk", "sigorta", "finans",
        "vergi", "kdv", "ötv", "kurumlar vergisi", "gelir vergisi", "teşvik",
        "yatırım", "kambiyo", "döviz", "altın"
    ]
    sonuc = []
    for it in items:
        t = it["baslik"].lower()
        if any(k in t for k in anahtar):
            sonuc.append({
                "baslik": it["baslik"],
                "aciklama": "",
                "url": it["url"]
            })
    return sonuc[:12]


def bolumlere_ayir(items):
    bolumler = {}
    for it in items:
        b = it.get("bolum") or "Diğer"
        if b not in bolumler:
            bolumler[b] = []
        bolumler[b].append({
            "baslik": it["baslik"],
            "aciklama": "",
            "url": it["url"]
        })
    return [{"baslik": k, "maddeler": v[:8]} for k, v in bolumler.items() if v]


def ozet_olustur(items, sayi):
    if not items:
        return f"{sayi} sayılı Resmî Gazete'de bugün önemli bir düzenleme tespit edilemedi."
    basliklar = [it["baslik"] for it in items[:5]]
    return (
        f"Bugünkü Resmî Gazete'de (Sayı: {sayi}) toplam {len(items)} madde yer alıyor. "
        f"Öne çıkanlar: " + "; ".join(basliklar[:4]) + "."
    )


def main():
    bugun = bugunun_tarihi()
    tarih_str = bugun.isoformat()
    url = sayfa_url(bugun)

    print(f"Çekiliyor: {url}")

    try:
        html = fetch(url)
    except (HTTPError, URLError) as e:
        print(f"Bugünün sayısı bulunamadı ({e}). Önceki gün deneniyor...")
        onceki = bugun - dt.timedelta(days=1)
        url = sayfa_url(onceki)
        try:
            html = fetch(url)
            bugun = onceki
            tarih_str = bugun.isoformat()
            print(f"Önceki gün kullanıldı: {url}")
        except Exception as e2:
            print("Önceki gün de alınamadı:", e2)
            os.makedirs("gazete", exist_ok=True)
            with open("gazete/kontrol.json", "w", encoding="utf-8") as f:
                json.dump({"son_kontrol": dt.datetime.now(TZ).isoformat()}, f, ensure_ascii=False)
            return

    parser = FihristParser()
    parser.feed(html)
    items = parser.items

    # Tekrarları temizle
    seen = set()
    temiz = []
    for it in items:
        key = it["baslik"][:80]
        if key not in seen:
            seen.add(key)
            temiz.append(it)
    items = temiz

    sayi = sayiyi_bul(html) or "?"

    data = {
        "tarih": tarih_str,
        "sayi": sayi,
        "guncelleme": dt.datetime.now(TZ).isoformat(),
        "ozet": ozet_olustur(items, sayi),
        "onemli_atamalar": [],
        "bankacilik": bankacilik_filtrele(items),
        "bolumler": bolumlere_ayir(items),
        "kaynak": url
    }

    os.makedirs("gazete", exist_ok=True)

    with open(f"gazete/{tarih_str}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # index.json
    index_path = "gazete/index.json"
    if os.path.exists(index_path):
        with open(index_path, encoding="utf-8") as f:
            index = json.load(f)
    else:
        index = []
    if tarih_str not in index:
        index.append(tarih_str)
    index = sorted(set(index))[-30:]
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False)

    with open("gazete/kontrol.json", "w", encoding="utf-8") as f:
        json.dump({"son_kontrol": dt.datetime.now(TZ).isoformat()}, f, ensure_ascii=False)

    print(f"Tamam: {tarih_str} — Sayı {sayi} — {len(items)} madde")


if __name__ == "__main__":
    main()