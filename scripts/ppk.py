#!/usr/bin/env python3
"""TCMB Para Politikası Kurulu faiz kararını takip eder.
Karar günü saat 14:00'ten sonra TCMB'nin "Faiz Oranlarına İlişkin Basın Duyurusu"nu bulur,
politika faizini (bir hafta vadeli repo) ve gecelik borç verme / borçlanma oranlarını okuyup
data/ppk.json içindeki "last" alanına yazar. Ana sayfadaki PPK uyarısı ve haber kutusu bu dosyayı kullanır.

Kaynaklar (resmî):
  Basın duyuruları RSS: https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/RSS/Basin+Duyurulari
  Karar metni:          https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Duyurular/Basin/YYYY/DUYYYYY-NN

Kullanım:
  python scripts/ppk.py            → karar bekleniyorsa bul ve kaydet
  python scripts/ppk.py --sleep    → zincirin bir sonraki çalışmaya kadar kaç saniye bekleyeceğini yazar
                                     (karar günü 14:01'e göre ayarlanır, karar alınana kadar sık dener)
  python scripts/ppk.py --test F   → kaydedilmiş bir karar sayfasını (HTML/metin) ayrıştırıp sonucu yazar
"""
import datetime as dt
import html
import json
import re
import sys
import urllib.request

P = "data/ppk.json"
BASE = "https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR"
RSS = BASE + "/Bottom+Menu/Diger/RSS/Basin+Duyurulari"
PAGES = [BASE + "/Main+Menu/Duyurular/Basin/{y}/DUY{y}-{n:02d}",
         BASE + "/PPK/PPK+Toplanti+Kararlari/DUY{y}-{n:02d}"]
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "Accept-Language": "tr-TR,tr;q=0.9"}
AYLAR = ["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"]
BASLIK = r"(?:Faiz Oranlarına İlişkin Basın Duyurusu|Para Politikası Kurulu Ara Toplantı Kararı)"


def now_tr():
    # Türkiye saati sabit UTC+3
    return dt.datetime.now(dt.timezone.utc).replace(tzinfo=None) + dt.timedelta(hours=3)


def get(url, tries=2):
    last = None
    for _ in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            last = e
    raise last


def duz(h):
    """HTML → düz metin (etiketler atılır, &…; çözülür, boşluklar tekleşir)."""
    h = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", h)
    h = re.sub(r"(?s)<!\[CDATA\[(.*?)\]\]>", r"\1", h)
    h = re.sub(r"<[^>]+>", " ", h)
    h = html.unescape(h).replace("\xa0", " ")
    return re.sub(r"\s+", " ", h).strip()


def sayilar(seg):
    return [float(x.replace(",", ".")) for x in re.findall(r"yüzde\s*(\d+(?:,\d+)?)", seg)]


def ayristir(t, no=None):
    """Karar metninden oranları çıkarır. Başarısızsa None."""
    if no and not re.search(BASLIK + r"\s*\(\s*" + re.escape(no) + r"\s*\)", t):
        return None  # sayfa bu numaralı faiz kararı değil (ör. toplantı özeti)
    i = t.find("bir hafta vadeli repo")
    if i < 0:
        return None
    j = t.find("karar", i)
    if j < 0 or j - i > 400:
        return None
    seg = t[i:j]
    n1 = sayilar(seg)
    if not n1:
        return None
    rate, eski = n1[-1], (n1[0] if len(n1) > 1 else n1[-1])
    if "sabit" in seg:
        eski = rate
    lend = borrow = None
    k = t.find("borç verme faiz oran", j)
    if 0 <= k - j < 400:
        m = t.find("borçlanma faiz oran", k)
        if m < 0 or m - k > 300:
            m = k + 160
        nl = sayilar(t[k:m])
        lend = nl[-1] if nl else None
        e = t.find(".", m)
        nb = sayilar(t[m:e if e > 0 else m + 200])
        borrow = nb[-1] if nb else None
    tarih = None
    s = t.find("Sayı")
    for alan in ([t[max(0, s - 160):s + 200]] if s >= 0 else []) + [t]:
        d = re.search(r"(\d{1,2})\s+(" + "|".join(a.capitalize() for a in AYLAR) + r")\s+(20\d\d)", alan)
        if d:
            tarih = dt.date(int(d.group(3)), AYLAR.index(d.group(2).lower()) + 1, int(d.group(1))).isoformat()
            break
    if not (0 < rate < 100):
        return None
    if lend is not None and borrow is not None and not (borrow <= rate <= lend):
        lend = borrow = None  # tutarsız okuma: koridoru eski aralıktan türet
    return {"date": tarih, "rate": rate, "old": eski, "lend": lend, "borrow": borrow}


def adaylar(son_no, yil):
    """Son kayıttan sonraki faiz kararı numaraları: önce RSS, olmazsa sırayla dene."""
    sy, sn = (int(x) for x in son_no.split("-")) if son_no else (yil, 0)
    out = []
    try:
        r = duz(get(RSS))
        for y, n in re.findall(BASLIK + r"\s*\((\d{4})-(\d{1,3})\)", r):
            if (int(y), int(n)) > (sy, sn):
                out.append((int(y), int(n)))
    except Exception as e:  # noqa: BLE001
        print(f"::warning::PPK: RSS alınamadı ({e})")
    if not out:  # RSS gecikirse numaraları sırayla dene
        start = sn + 1 if sy == yil else 1
        out = [(yil, n) for n in range(start, start + 12)]
    return sorted(set(out))


def kaydet(j, karar, no, url):
    L = j.get("last", {})
    yayilma_l = (L.get("lend", 0) - L.get("rate", 0)) if L.get("lend") is not None else 3
    yayilma_b = (L.get("rate", 0) - L.get("borrow", 0)) if L.get("borrow") is not None else 1.5
    nz = lambda x: int(x) if float(x).is_integer() else round(x, 2)  # noqa: E731  (37.0 → 37)
    yeni = {
        "date": karar["date"],
        "rate": nz(karar["rate"]),
        "lend": nz(karar["lend"] if karar["lend"] is not None else karar["rate"] + yayilma_l),
        "borrow": nz(karar["borrow"] if karar["borrow"] is not None else karar["rate"] - yayilma_b),
        "change": nz(karar["rate"] - karar["old"]),
        "no": no,
        "url": url,
    }
    if L.get("date"):
        j["prev"] = {k: L[k] for k in ("date", "rate", "lend", "borrow") if k in L}
    j["last"] = yeni
    j["updated"] = now_tr().date().isoformat()
    with open(P, "w", encoding="utf-8") as f:
        json.dump(j, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"::notice::PPK kararı kaydedildi: {no} · {yeni['date']} · %{yeni['rate']} (değişim {yeni['change']:+})")


def bekleme(j, t):
    """Zincirin bir sonraki çalışması: karar günü 14:01'de, karar alınana kadar ~2,5 dakikada bir."""
    bugun = t.date().isoformat()
    if bugun in j.get("meetings", []) and j.get("last", {}).get("date") != bugun:
        hedef = t.replace(hour=14, minute=1, second=0, microsecond=0)
        if t < hedef:
            return max(60, min(3300, int((hedef - t).total_seconds())))
        if t.hour < 20:
            return 150
    return 3300


def main():
    if "--test" in sys.argv:
        f = sys.argv[sys.argv.index("--test") + 1]
        print(json.dumps(ayristir(duz(open(f, encoding="utf-8").read())), ensure_ascii=False))
        return
    with open(P, encoding="utf-8") as f:
        j = json.load(f)
    t = now_tr()
    if "--sleep" in sys.argv:
        print(bekleme(j, t))
        return
    L = j.get("last", {})
    bugun = t.date().isoformat()
    bekleyen = [m for m in j.get("meetings", []) if m > L.get("date", "") and (m < bugun or (m == bugun and t.hour >= 14))]
    if not bekleyen and "--force" not in sys.argv:
        print("::notice::PPK: bekleyen karar yok")
        return
    for y, n in adaylar(L.get("no", ""), t.year):
        no = f"{y}-{n:02d}"
        for sablon in PAGES:
            url = sablon.format(y=y, n=n)
            try:
                karar = ayristir(duz(get(url, 1)), no)
            except Exception:  # noqa: BLE001
                continue
            if not karar:
                continue
            karar["date"] = karar["date"] or (bekleyen[-1] if bekleyen else bugun)
            if karar["date"] <= L.get("date", ""):
                continue
            kaydet(j, karar, no, url)
            return
    print(f"::notice::PPK: {bekleyen[-1] if bekleyen else ''} kararı henüz yayımlanmadı")


if __name__ == "__main__":
    main()
