#!/usr/bin/env python3
"""İş Bankası konsolide olmayan (solo) finansal raporunun Excel'inden çeyrek özeti çıkarır.

Kullanım (Excel bankanın sitesinden ya da KAP'tan elle indirilir; depoya konmaz):
    python3 scripts/solo_ozet.py "ISBTR-Konsolide Olmayan-30.09.2026.xlsx" [...]
Sonuç isbank/solo_ozet.json dosyasına yazılır. Yalnızca aşağıdaki kalemlerin
"Toplam" sütunları alınır (milyon TL); ham tablo kaydedilmez.
Bilanço/nazım kalemleri: cari dönem ve önceki yıl sonu. Gelir tablosu: cari ve önceki yılın aynı dönemi (kümülatif).
"""
import json, os, re, sys
import openpyxl

# (anahtar, sayfa, satır kodu, satır adı başlangıcı, TP/YP de alınsın mı)
BILANCO = [
    ("aktif", "VARLIKLAR", None, "VARLIKLAR TOPLAMI", False),
    ("finVarlik", "VARLIKLAR", "I.", "FİNANSAL VARLIKLAR", False),
    ("kredi", "VARLIKLAR", "2.1", "Krediler", True),
    ("bzk", "VARLIKLAR", "2.5", "Beklenen Zarar", False),
    ("gnakdi", "NAZIM HESAP", "I.", "GARANTİ ve KEFALETLER", False),
    ("akreditif", "NAZIM HESAP", "1.3", "Akreditifler", False),
    ("mevduat", "YÜKÜMLÜLÜKLER", "I.", "MEVDUAT", False),
    ("ozkaynak", "YÜKÜMLÜLÜKLER", "XVI.", "ÖZKAYNAKLAR", False),
]
GELIR = [
    ("faizGelir", "I.", "FAİZ GELİRLERİ"),
    ("faizGider", "II.", "FAİZ GİDERLERİ"),
    ("nfg", "III.", "NET FAİZ GELİRİ"),
    ("komisyon", "IV.", "NET ÜCRET VE KOMİSYON"),
    ("ticari", "VI.", "TİCARİ KÂR/ZARAR"),
    ("spk", "6.1", "Sermaye Piyasası"),
    ("turev", "6.2", "Türev Finansal"),
    ("kambiyo", "6.3", "Kambiyo"),
    ("brut", "VIII.", "FAALİYET BRÜT KÂRI"),
    ("netkar", "XXV.", "DÖNEM NET KÂRI"),
]


def satirlar(ws):
    for row in ws.iter_rows(values_only=True):
        yield [c for c in row if c not in (None, "")]


def nrm(t):
    return str(t).strip().replace("Â", "A").replace("â", "a")


def bul(ws, kod, ad):
    ad = nrm(ad)
    for r in satirlar(ws):
        s = [nrm(x) for x in r]
        if not s:
            continue
        if kod is None:
            if s[0].startswith(ad):
                return r[1:]
        elif s[0] == kod and len(s) > 1 and s[1].startswith(ad):
            return r[2:]
    raise SystemExit(f"bulunamadı: {ws.title} {kod} {ad}")


BOL = 1  # rapor birimi: ara dönem "MİLYON TÜRK LİRASI", yıl sonu "BİN TÜRK LİRASI"


def sayilar(r):
    return [round(x / BOL) for x in r if isinstance(x, (int, float))]


def birim(ws):
    for r in satirlar(ws):
        t = " ".join(str(x) for x in r).upper()
        if "TÜRK LİRASI" in t or "TURK LIRASI" in t:
            return 1000 if "BİN" in t or "BIN " in t else 1
    raise SystemExit("birim bulunamadı")


def donem(ws):
    for r in satirlar(ws):
        for x in r:
            m = re.search(r"\((\d\d)/(\d\d)/(\d{4})\)", str(x))
            if m:
                return f"{m.group(3)}/{int(m.group(2))}"
    raise SystemExit("dönem bulunamadı")


def oku(yol):
    global BOL
    wb = openpyxl.load_workbook(yol, data_only=True, read_only=True)
    BOL = birim(wb["VARLIKLAR"])
    p = donem(wb["VARLIKLAR"])
    y, m = p.split("/")
    out = {"p": p, "bilanco": {}, "gelir": {}, "oncekiYilSonu": f"{int(y) - 1}/12", "oncekiDonem": f"{int(y) - 1}/{m}"}
    for k, sayfa, kod, ad, tpyp in BILANCO:
        n = sayilar(bul(wb[sayfa], kod, ad))
        # sütunlar: TP, YP, Toplam (cari) · TP, YP, Toplam (önceki yıl sonu)
        out["bilanco"][k] = [n[2], n[5]]
        if tpyp:
            out["bilanco"][k + "TP"] = [n[0], n[3]]
            out["bilanco"][k + "YP"] = [n[1], n[4]]
    ws = next(w for w in wb.worksheets if nrm(w.title).startswith("KAR VEYA ZARAR"))  # yıl sonunda "KAR", ara dönemde "KÂR"
    for k, kod, ad in GELIR:
        n = sayilar(bul(ws, kod, ad))
        out["gelir"][k] = [n[0], n[1]]  # kümülatif cari, kümülatif önceki yıl aynı dönem
    # tutarlılık: alt kalemler toplamı
    g, b = out["gelir"], out["bilanco"]
    yak = lambda a, b: abs(a - b) <= 2  # bin TL'den yuvarlamada 1-2 milyon fark olabilir
    for i in (0, 1):
        assert yak(g["faizGelir"][i] - g["faizGider"][i], g["nfg"][i]), "net faiz tutmuyor"
        assert yak(g["spk"][i] + g["turev"][i] + g["kambiyo"][i], g["ticari"][i]), "ticari kâr tutmuyor"
        assert yak(b["krediTP"][i] + b["krediYP"][i], b["kredi"][i]), "TP+YP kredi tutmuyor"
    out["birim"] = "milyon TL" if BOL == 1 else "milyon TL (raporda bin TL; yuvarlandı)"
    return out


def main():
    hedef = os.path.join(os.path.dirname(__file__), "..", "isbank", "solo_ozet.json")
    try:
        J = json.load(open(hedef, encoding="utf-8"))
    except FileNotFoundError:
        J = {"not": "", "donemler": []}
    J["not"] = ("İş Bankası konsolide olmayan (solo) finansal raporlarından seçilmiş kalemler, milyon TL. "
                "Bilanço ve nazım hesaplar: [cari, önceki yıl sonu]; gelir tablosu: [cari, önceki yılın aynı dönemi], yılbaşından kümülatif. "
                "scripts/solo_ozet.py ile bankanın yayımladığı Excel'den üretilir.")
    J["kaynak"] = {"ad": "İş Bankası · Finansal bilgiler (konsolide olmayan finansal raporlar)", "url": "https://www.isbank.com.tr/bankamizi-taniyin/finansal-bilgiler"}
    for yol in sys.argv[1:]:
        d = oku(yol)
        J["donemler"] = [x for x in J["donemler"] if x["p"] != d["p"]] + [d]
        print("eklendi", d["p"])
    key = lambda x: tuple(int(t) for t in x["p"].split("/"))
    J["donemler"].sort(key=key)
    with open(hedef, "w", encoding="utf-8") as f:
        json.dump(J, f, ensure_ascii=False, indent=1)
        f.write("\n")


if __name__ == "__main__":
    main()
