"""Türkiye'deki İş Bankası şube ve bankamatik konumlarını OpenStreetMap'ten çeker.

Sonuç isbank/sube_konum.json dosyasına yazılır. Şubeler sayfası en yakın şubeleri
bu dosyadan hesaplar; böylece telefonun harita sunucusuna bağlanması gerekmez.
Günde bir kez GitHub Actions'ta çalışır (.github/workflows/subeler.yml).
"""
import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta

SUNUCULAR = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
AD = "İş Bankası|Is Bankasi|İş Bankasi|Iş Bankası|İşbank|Isbank|İŞ BANKASI|Türkiye İş"
SORGU = f"""[out:json][timeout:240];
area["ISO3166-1"="TR"][admin_level=2]->.tr;
(
  nwr(area.tr)["amenity"="bank"]["name"~"{AD}",i];
  nwr(area.tr)["amenity"="bank"]["brand"~"{AD}",i];
  nwr(area.tr)["amenity"="bank"]["operator"~"{AD}",i];
  nwr(area.tr)["amenity"="atm"]["name"~"{AD}",i];
  nwr(area.tr)["amenity"="atm"]["brand"~"{AD}",i];
  nwr(area.tr)["amenity"="atm"]["operator"~"{AD}",i];
);
out center tags;"""
CIKTI = "isbank/sube_konum.json"


def cek():
    veri = urllib.parse.urlencode({"data": SORGU}).encode()
    for deneme in range(3):
        for u in SUNUCULAR:
            try:
                req = urllib.request.Request(u, data=veri, headers={"User-Agent": "sadolayn-subeler/1.0 (github.com/sadolayn/SadoDepo)"})
                with urllib.request.urlopen(req, timeout=300) as r:
                    j = json.load(r)
                if len(j.get("elements", [])) > 100:
                    print(f"{u}: {len(j['elements'])} kayıt")
                    return j
                print(f"{u}: az kayıt ({len(j.get('elements', []))}), sonraki sunucu")
            except Exception as e:  # sunucu yoğun ya da zaman aşımı
                print(f"{u}: {e}")
        time.sleep(30)
    return None


def main():
    j = cek()
    if not j:
        print("Hiçbir sunucudan veri alınamadı; mevcut dosya korunuyor.")
        sys.exit(0)
    gorulen, liste = set(), []
    for e in j["elements"]:
        t = e.get("tags", {})
        la = e.get("lat") or (e.get("center") or {}).get("lat")
        lo = e.get("lon") or (e.get("center") or {}).get("lon")
        if la is None or lo is None:
            continue
        anahtar = (round(la, 5), round(lo, 5))
        if anahtar in gorulen:
            continue
        gorulen.add(anahtar)
        atm = t.get("amenity") == "atm"
        kayit = {"la": round(la, 6), "lo": round(lo, 6)}
        if atm:
            kayit["a"] = 1
        ad = t.get("name") or ""
        if ad and ad not in ("İş Bankası", "Türkiye İş Bankası"):
            kayit["n"] = ad
        if t.get("branch"):
            kayit["b"] = t["branch"]
        adr = " ".join(x for x in [t.get("addr:street"), t.get("addr:housenumber"), t.get("addr:district") or t.get("addr:suburb")] if x)
        if adr:
            kayit["adr"] = adr
        tel = t.get("phone") or t.get("contact:phone")
        if tel:
            kayit["tel"] = tel
        if t.get("opening_hours"):
            kayit["s"] = t["opening_hours"]
        liste.append(kayit)
    liste.sort(key=lambda k: (k["la"], k["lo"]))
    sube = sum(1 for k in liste if not k.get("a"))
    tr = timezone(timedelta(hours=3))
    out = {
        "guncelleme": datetime.now(tr).strftime("%Y-%m-%dT%H:%M:%S+03:00"),
        "kaynak": "OpenStreetMap katkıcıları (ODbL)",
        "sube": sube,
        "atm": len(liste) - sube,
        "e": liste,
    }
    with open(CIKTI, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{sube} şube, {len(liste) - sube} bankamatik yazıldı.")


if __name__ == "__main__":
    main()
