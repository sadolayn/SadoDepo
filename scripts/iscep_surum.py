#!/usr/bin/env python3
"""İşCep'in yeni sürümünü App Store ve Google Play'den takip eder, isbank/iscep.json'daki sürüm geçmişine ekler.
Ana sayfadaki sabah bandı (ilk 3 gün) ve Açılış kartı (ilk 7 gün) yeni sürümü bu dosyadan gösterir.

Kaynaklar (resmî mağazalar):
  App Store:   Apple'ın herkese açık arama servisi  https://itunes.apple.com/lookup?id=308261752&country=tr
  Google Play: uygulama sayfası                     https://play.google.com/store/apps/details?id=com.pozitron.iscep&hl=tr&gl=TR
               (google-play-scraper paketiyle okunur; Google'ın herkese açık bir sürüm servisi yok)

Kurallar:
  * Yalnızca listedeki en yeni sürümden büyük bir sürüm görülürse yeni kayıt eklenir; elle yazılmış eski kayıtlara dokunulmaz.
  * Aynı sürüm öteki mağazada da görülürse yalnızca kaydın "magazalar" alanına eklenir.
  * Bir mağazaya ulaşılamazsa ya da sürüm "cihaza göre değişir" gibi okunamazsa o mağaza sessizce atlanır.
  * Mağazadan gelen sürüm notu satırlara bölünür; "Bu sürümle birlikte;" gibi giriş satırları atılır, en çok 8 madde tutulur.

Kullanım:
  python scripts/iscep_surum.py               → mağazalara bak, yeni sürüm varsa dosyaya yaz
  python scripts/iscep_surum.py --test F.json → mağaza yerine örnek yanıt dosyasıyla dene (dosyaya yazmaz, sonucu basar)
"""
import datetime as dt
import json
import re
import sys
import urllib.request

P = "isbank/iscep.json"
APPLE = "https://itunes.apple.com/lookup?id=308261752&country=tr"
PLAY_ID = "com.pozitron.iscep"
PLAY_URL = "https://play.google.com/store/apps/details?id=com.pozitron.iscep&hl=tr&gl=TR"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
      "Accept-Language": "tr-TR,tr;q=0.9"}
TR = dt.timezone(dt.timedelta(hours=3))


def anahtar(s):
    """'10.13.1' → (10, 13, 1); sayı olmayan sürüm (ör. 'Cihaza göre değişir') → None"""
    s = (s or "").strip()
    return tuple(int(x) for x in s.split(".")) if re.fullmatch(r"\d+(\.\d+){1,3}", s) else None


def notlar(metin):
    """Mağaza sürüm notunu madde listesine çevirir."""
    if not metin:
        return []
    metin = re.sub(r"<br\s*/?>", "\n", metin)
    metin = re.sub(r"<[^>]+>", "", metin)
    cik = []
    for s in re.split(r"[\r\n]+", metin):
        s = re.sub(r"^\s*[•\-\*–·●▪]+\s*", "", s).strip()
        if not s or len(s) < 3:
            continue
        # Giriş satırları: "Bu sürümle birlikte;", "İşCep'in bu sürümüyle;", "With this version of İşCep;"
        if re.search(r"[;:]$", s) and len(s) < 70 and re.search(r"sürüm|güncelleme|version|update|ile", s, re.I):
            continue
        if re.fullmatch(r"(yenilikler|what'?s new)\s*[:;]?", s, re.I):
            continue
        cik.append(s[:220])
    return cik[:8]


def apple(ham=None):
    try:
        J = ham if ham is not None else json.loads(urllib.request.urlopen(urllib.request.Request(APPLE, headers=UA), timeout=30).read().decode("utf-8"))
        r = (J.get("results") or [{}])[0]
        surum, zaman = r.get("version"), r.get("currentVersionReleaseDate")
        if not anahtar(surum) or not zaman:
            return None
        t = dt.datetime.fromisoformat(zaman.replace("Z", "+00:00")).astimezone(TR).date().isoformat()
        return {"magaza": "App Store", "surum": surum.strip(), "tarih": t, "yenilikler": notlar(r.get("releaseNotes"))}
    except Exception as e:  # ulaşılamazsa sessizce geç
        print("App Store okunamadı:", e, file=sys.stderr)
        return None


def play(ham=None):
    try:
        if ham is None:
            from google_play_scraper import app  # pip install google-play-scraper
            ham = app(PLAY_ID, lang="tr", country="tr")
        surum, guncel = ham.get("version"), ham.get("updated")
        if not anahtar(surum) or not guncel:
            return None
        t = dt.datetime.fromtimestamp(int(guncel), TR).date().isoformat()
        return {"magaza": "Google Play", "surum": surum.strip(), "tarih": t, "yenilikler": notlar(ham.get("recentChanges"))}
    except Exception as e:
        print("Google Play okunamadı:", e, file=sys.stderr)
        return None


def birlestir(D, bulunan):
    """Bulunan mağaza sürümlerini sürüm geçmişine işler. Değişiklik olduysa True döner."""
    L = D.setdefault("surumler", [])
    degisti = False
    for b in sorted([x for x in bulunan if x], key=lambda x: anahtar(x["surum"])):
        kayit = next((v for v in L if v.get("surum") == b["surum"]), None)
        if kayit:
            mg = kayit.get("magazalar")
            if mg is None:
                continue  # elle yazılmış eski kayıt: dokunma
            if b["magaza"] not in mg:
                mg.append(b["magaza"]); degisti = True
            if not kayit.get("yenilikler") and b["yenilikler"]:
                kayit["yenilikler"] = b["yenilikler"]; degisti = True
            continue
        en = max((anahtar(v.get("surum")) or (0,) for v in L), default=(0,))
        if anahtar(b["surum"]) > en:
            L.insert(0, {"surum": b["surum"], "tarih": b["tarih"], "yenilikler": b["yenilikler"], "magazalar": [b["magaza"]]})
            degisti = True
    if degisti:
        D["guncelleme"] = dt.datetime.now(TR).replace(microsecond=0).isoformat()
        D.setdefault("playUrl", PLAY_URL)
    return degisti


def main():
    if len(sys.argv) > 2 and sys.argv[1] == "--test":
        T = json.load(open(sys.argv[2], encoding="utf-8"))
        D = json.load(open(P, encoding="utf-8"))
        bulunan = [apple(T.get("apple")), play(T.get("play"))]
        print("bulunan:", json.dumps(bulunan, ensure_ascii=False))
        print("değişti:", birlestir(D, bulunan))
        print(json.dumps(D["surumler"][:2], ensure_ascii=False, indent=2))
        return
    D = json.load(open(P, encoding="utf-8"))
    bulunan = [apple(), play()]
    for b in bulunan:
        print(b and (b["magaza"], b["surum"], b["tarih"]))
    if birlestir(D, bulunan):
        with open(P, "w", encoding="utf-8") as f:
            f.write(json.dumps(D, ensure_ascii=False, indent=2) + "\n")
        print("isbank/iscep.json güncellendi:", D["surumler"][0]["surum"])
    else:
        print("Yeni sürüm yok.")


if __name__ == "__main__":
    main()
