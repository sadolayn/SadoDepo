"""Son dakika şeridi: ekonomi ve finans otoritelerine ilişkin önemli gelişmeleri seçer (11 Kasım 2026).

Girdi : data/haberler.json (haberler.py'nin topladığı başlıklar), gazete/duyurular.json (kurum duyuruları)
Çıktı : data/son_dakika.json  -> {"guncelleme": ..., "haberler": [{k, t, s, u, n, ilk, gor, son}]}

Kurallar (sitede abartılı ya da tek kaynaklı haber çıkmasın diye sıkı tutulur):
  1. Konu: yalnızca BDDK, SPK, MASAK, TCMB, Hazine ve Maliye, TMSF, Borsa İstanbul, TÜİK (enflasyon)
     ve bunlarda "olay" sayılan gelişmeler: başkan istifası/görevden alma, atama, faiz kararı,
     enflasyon verisi, faaliyet izni iptali/el koyma/tasfiye, borsada devre kesici.
  2. Doğrulama: son 3 saatte en az 3 FARKLI güvenilir kaynak aynı olayı (aynı kurum + aynı olay türü) vermiş olmalı.
  3. Resmî kurum duyuruları (duyurular.json, "onemli": true, bugünün tarihi) doğrudan girer.
  4. Başlığı biz yazmayız: öncelikli kaynağın (önce AA) başlığı birebir alınır; yalnızca "Son dakika" öneki atılır.
  5. İş Bankası adı geçen başlıklar hiç girmez; soru başlıkları ("... mı?") girmez.
  6. Her haber ilk görüldüğünden 12 saat sonra düşer; sitede en fazla 3 tanesi gösterilir.
Ham yanıt saklanmaz; yalnızca gereken alanlar yazılır.
"""
import json
import os
import re
from datetime import datetime, timedelta, timezone

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GIRDI = os.path.join(KOK, "data", "haberler.json")
DUYURU = os.path.join(KOK, "gazete", "duyurular.json")
CIKTI = os.path.join(KOK, "data", "son_dakika.json")

PENCERE = timedelta(hours=3)   # olayın doğrulanması için bakılan süre
OMUR = timedelta(hours=12)     # şeritte kalma süresi
EN_AZ_KAYNAK = 3

# Güvenilir kaynaklar: farklı yazımlar tek ada toplanır (aynı kaynağı iki kez saymamak için)
KAYNAK = {
    "aa": "AA", "anadolu ajansı": "AA", "habertürk": "Habertürk", "ntv": "NTV", "trt haber": "TRT Haber",
    "hürriyet": "Hürriyet", "ekonomim": "Ekonomim", "bloomberg ht": "Bloomberg HT", "bloomberght": "Bloomberg HT",
    "dünya": "Dünya", "dünya gazetesi": "Dünya", "sözcü": "Sözcü", "sözcü gazetesi": "Sözcü", "milliyet": "Milliyet",
    "cumhuriyet": "Cumhuriyet", "cnn türk": "CNN Türk", "bbc türkçe": "BBC Türkçe", "euronews.com": "Euronews",
    "euronews": "Euronews", "ihlas haber ajansı": "İHA", "iha": "İHA", "dha": "DHA", "demirören haber ajansı": "DHA",
    "gazete oksijen": "Oksijen", "forbes türkiye": "Forbes Türkiye", "foreks.com": "Foreks", "investing.com türkiye": "Investing.com",
    "yeni şafak": "Yeni Şafak", "sabah": "Sabah", "akşam": "Akşam", "karar": "Karar", "türkiye gazetesi": "Türkiye",
    "t24": "T24", "reuters": "Reuters", "ekonomi gazetesi": "Ekonomi Gazetesi", "dw türkçe": "DW Türkçe",
}
# Başlığı seçerken öncelik (önce haber ajansı ve ekonomi yayınları)
ONCELIK = ["AA", "Bloomberg HT", "Ekonomim", "Dünya", "NTV", "Habertürk", "TRT Haber", "BBC Türkçe", "Hürriyet",
           "Reuters", "DHA", "İHA", "CNN Türk", "Milliyet", "Sözcü", "Cumhuriyet", "Euronews", "Oksijen"]

KURUM = [  # (kısa ad, desen) — sıra önemli: bir başlık ilk eşleşen kuruma yazılır
    ("BDDK", r"\bBDDK\b|bankacılık düzenleme ve denetleme"),
    ("SPK", r"\bSPK\b|sermaye piyasası kurulu"),
    ("MASAK", r"\bMASAK\b|mali suçları araştırma"),
    ("TMSF", r"\bTMSF\b|tasarruf mevduatı sigorta"),
    ("TCMB", r"\bTCMB\b|merkez bankası|politika faizi|\bPPK\b"),
    ("Hazine ve Maliye", r"hazine ve maliye|maliye bakan"),
    ("Borsa İstanbul", r"borsa istanbul|\bBIST\b"),
    ("TÜİK", r"\bTÜİK\b|enflasyon"),
]
YABANCI_MB = r"(abd|fed|avrupa|ecb|japonya|boj|ingiltere|çin|rusya|isviçre|kanada|avustralya|hindistan|brezilya|kore|norveç|isveç)\b[^.]{0,25}merkez bankası"
OLAY = [  # (olay türü, desen) — küçük harfe çevrilmiş başlıkta aranır
    ("ayrılık", r"istifa|görevden al|görevden af|affını iste|görevinden ayrıl|görevden ayrıl|görevine son|görevden çekil"),
    ("atama", r"atandı|atama yapıldı|başkanlığına .{0,40}getirildi|yeni başkanı"),
    ("faiz", r"faiz(i|ini)? (kararı|kararını|indirdi|indirimi|artırdı|artırımı|sabit)|politika faizi|faizi (%|yüzde)"),
    ("enflasyon", r"enflasyon (açıklandı|rakamları|verisi|oldu|yüzde|%)|(yıllık|aylık) enflasyon"),
    ("izin", r"faaliyet izn|izni iptal|izni kaldır|lisansı iptal|el kon|el koy|kayyum|tasfiye"),
    ("borsa", r"devre kesici|işlemler durduruldu|seans durdu"),
]
DISLA = r"iş bankası|işbank|türkiye iş\b|işcep|maximum kart|maximiles|iş yatırım|anadolu hayat|anadolu sigorta|iş gyo|iş portföy|iş leasing|iş faktoring|milli reasürans|softtech|şişecam"
# Spekülasyon, beklenti ve çağrı başlıkları ile TÜİK dışı enflasyon verileri girmez
SPEKULASYON = r"iddia|kulis|bekleniyor|beklenti|edeceği|edecek|alınacak|alınması|olabilir|çağrı|gündemde|sinyal|kulağı|\benag\b|\bito\b|istanbul ticaret odası"
# Aynı olayı doğrulamak için başlıklardaki özel adlar karşılaştırılır; bunlar ad sayılmaz
GENEL_AD = {"son", "dakika", "flaş", "bddk", "spk", "masak", "tmsf", "tcmb", "merkez", "bankası", "başkanı", "başkan", "başkanlığına",
            "bakan", "bakanı", "bakanlığı", "hazine", "maliye", "borsa", "istanbul", "türkiye", "tüik", "bist", "politika", "ekim", "kasım",
            "aralık", "ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "yeni", "resmi", "resmî", "gazete",
            # şirket türü sözcükleri: farklı şirketlerin ortak adı sayılmasın
            "portföy", "yönetimi", "holding", "bank", "banka", "bankası", "yatırım", "menkul", "değerler", "şirketi", "sigorta", "katılım",
            "finans", "faktoring", "leasing", "ödeme", "elektronik", "para", "kuruluşu", "fon", "fonu", "fonları", "grup", "grubu", "enerji"}
AD_GEREKMEZ = {"faiz", "enflasyon", "borsa"}  # bu olaylar günde bir kez olur; başlıkta ad aranmaz


def kucuk(t):
    return (t or "").replace("I", "ı").replace("İ", "i").lower()


def zaman(s):
    try:
        return datetime.fromisoformat((s or "").replace("Z", "+00:00"))
    except ValueError:
        return None


def temiz_baslik(t):
    t = re.sub(r"^\s*(son dakika|sondakika|flaş|flash)\s*(haber)?\s*[!:|.\-–…]*\s*", "", t or "", flags=re.I)
    return re.sub(r"\s+", " ", t).strip()


def adlar(baslik):
    """Başlıktaki özel adlar (büyük harfle başlayan, kurum/genel sözcük olmayan): 'Kavcıoğlu'nun' -> 'kavcıoğlu'."""
    out = set()
    for w in re.findall(r"[A-ZÇĞİÖŞÜ][\wçğıöşüâîû]+(?:['’][\wçğıöşü]+)?", baslik or ""):
        a = kucuk(re.split(r"['’]", w)[0])
        if len(a) > 2 and a not in GENEL_AD:
            out.add(a)
    return out


def siniflandir(baslik):
    k = kucuk(baslik)
    if re.search(DISLA, k) or re.search(SPEKULASYON, k) or re.search(r"\s(mi|mı|mu|mü)\?|\?\s*$", k):
        return None
    kurum = None
    for ad, desen in KURUM:
        if re.search(desen, baslik, re.I) or re.search(desen, k):
            if ad == "TCMB" and re.search(YABANCI_MB, k) and not re.search(r"\bTCMB\b|türkiye cumhuriyet merkez", baslik + " " + k):
                continue
            kurum = ad
            break
    if not kurum:
        return None
    for tur, desen in OLAY:
        if re.search(desen, k):
            if tur == "izin" and kurum in ("MASAK", "Hazine ve Maliye", "TÜİK"):
                continue  # MASAK'ın el koyma/operasyon haberleri gündelik; yalnızca başkan değişikliği gibi gelişmeler sayılır
            return kurum, tur
    return None


def main():
    simdi = zaman(os.environ.get("SD_SIMDI")) or datetime.now(timezone.utc)
    try:
        with open(GIRDI, encoding="utf-8") as f:
            H = json.load(f)
    except (OSError, ValueError):
        print("haberler.json okunamadı")
        return
    try:
        with open(CIKTI, encoding="utf-8") as f:
            ESKI = {x["id"]: x for x in json.load(f).get("haberler", [])}
    except (OSError, ValueError, KeyError):
        ESKI = {}

    # 1) Tüm kategorilerdeki başlıklar (aynı bağlantı bir kez)
    gorulen, kume = set(), {}
    for liste in (H.get("cats") or {}).values():
        for x in liste if isinstance(liste, list) else []:
            u, t = x.get("u") or "", x.get("t") or ""
            if not u or u in gorulen or not u.startswith("https://"):
                continue
            gorulen.add(u)
            kaynak = KAYNAK.get(kucuk(x.get("s")).strip())
            d = zaman(x.get("d"))
            if not kaynak or not d or simdi - d > PENCERE or d - simdi > timedelta(minutes=10):
                continue
            sinif = siniflandir(t)
            if sinif:
                kume.setdefault(sinif, []).append({"t": temiz_baslik(t), "s": kaynak, "u": u, "d": d})

    yeni = {}
    for (kurum, tur), L in kume.items():
        if tur not in AD_GEREKMEZ:  # aynı olay mı? En az 3 kaynağın başlığında aynı kişi/şirket adı geçmeli
            sayac = {}
            for x in L:
                for a in adlar(x["t"]):
                    sayac.setdefault(a, set()).add(x["s"])
            enIyi = max(sayac.items(), key=lambda kv: len(kv[1]), default=(None, set()))
            if len(enIyi[1]) < EN_AZ_KAYNAK:
                continue
            L = [x for x in L if enIyi[0] in adlar(x["t"])]
        kaynaklar = {x["s"] for x in L}
        if len(kaynaklar) < EN_AZ_KAYNAK:
            continue
        L.sort(key=lambda x: (ONCELIK.index(x["s"]) if x["s"] in ONCELIK else 99, x["d"]))
        sec, ilk = L[0], min(x["d"] for x in L)
        hid = f"{kurum}-{tur}-{ilk.astimezone(timezone(timedelta(hours=3))).strftime('%Y-%m-%d')}"
        yeni[hid] = {"id": hid, "k": kurum, "t": sec["t"], "s": sec["s"], "u": sec["u"], "n": len(kaynaklar),
                     "ilk": ilk.strftime("%Y-%m-%dT%H:%M:%SZ"), "d": sec["d"].strftime("%Y-%m-%dT%H:%M:%SZ")}  # d: gösterilen kaynağın kendi saati

    # 2) Resmî kurum duyuruları: bugünün "önemli" işaretli olanları
    bugun = (simdi + timedelta(hours=3)).strftime("%Y-%m-%d")
    try:
        with open(DUYURU, encoding="utf-8") as f:
            for x in json.load(f).get("duyurular", []):
                if (x.get("onemli") and x.get("tarih") == bugun and (x.get("url") or "").startswith("https://") and x.get("baslik")
                        and not re.search(DISLA, kucuk(x.get("baslik", "") + " " + x.get("ozet", "")))):
                    hid = "resmi-" + re.sub(r"\W+", "-", kucuk(x.get("kurum", "") + "-" + x["baslik"]))[:70]
                    yeni[hid] = {"id": hid, "k": x.get("kurum", ""), "t": f'{x.get("kurum", "")}: {x["baslik"]}', "s": f'{x.get("kurum", "")} duyurusu',
                                 "u": x["url"], "n": 0, "ilk": simdi.strftime("%Y-%m-%dT%H:%M:%SZ")}
    except (OSError, ValueError):
        pass

    # 3) Önceki çalıştırmalarla birleştir: başlık ilk seçildiği gibi kalır, kaynak sayısı büyüyebilir; 12 saat dolunca düşer
    sonuc = {}
    for hid, x in yeni.items():
        e = ESKI.get(hid)
        if e:
            e["n"] = max(e.get("n", 0), x["n"])
            sonuc[hid] = e
        else:
            x["gor"] = simdi.strftime("%Y-%m-%dT%H:%M:%SZ")
            x["son"] = (simdi + OMUR).strftime("%Y-%m-%dT%H:%M:%SZ")
            sonuc[hid] = x
    for hid, e in ESKI.items():
        if hid not in sonuc and zaman(e.get("son")) and zaman(e["son"]) > simdi:
            sonuc[hid] = e

    L = sorted(sonuc.values(), key=lambda x: x["gor"], reverse=True)
    with open(CIKTI, "w", encoding="utf-8") as f:
        json.dump({"guncelleme": simdi.strftime("%Y-%m-%dT%H:%M:%SZ"), "haberler": L}, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"son dakika: {len(L)} haber (" + ", ".join(f'{x["k"]}/{x["n"]} kaynak' for x in L) + ")")


if __name__ == "__main__":
    main()
