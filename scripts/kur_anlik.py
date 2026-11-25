#!/usr/bin/env python3
"""Anlık kur ve emtia fiyatları → data/kur_anlik.json (25 Kasım 2026).
Alttaki canlı kur bandı (kurbant.js) için: canlı servis (Truncgil) durursa bant bu dosyayla akmaya devam eder.
haberler.yml zinciri gündüz 20 dakikada bir, gece saatte bir çalıştırır.
Kaynak: Yahoo Finance; her kalem için son fiyat, önceki kapanış ve piyasa saati.
  USDTRY=X, EURTRY=X, GBPTRY=X, EURUSD=X; GC=F (altın, USD/ons), SI=F (gümüş, USD/ons), BZ=F (Brent, USD/varil).
  Gram altın ve gümüş TL: ons fiyatı × USD/TRY ÷ 31,1034768 (uluslararası fiyat; kuyumcu fiyatından farklıdır).
Yalnızca işlenmiş alanlar yazılır, ham yanıt kaydedilmez (CLAUDE.md).
Dolar alınamazsa ya da sitenin günlük verisinden çok uzaksa dosya değişmez; eski dosya kalır, bant tazelik süresi dolunca günlük veriye geçer."""
import json, os, sys, time, urllib.request, urllib.parse, http.cookiejar, datetime as dt

OZ = 31.1034768
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
SEMBOL = {"usd": "USDTRY=X", "eur": "EURTRY=X", "gbp": "GBPTRY=X", "eurusd": "EURUSD=X",
          "ons": "GC=F", "gumus_ons": "SI=F", "brent": "BZ=F"}
CIKTI = "data/kur_anlik.json"


def oturum():
    """Yahoo çerez + crumb (piyasa.py ile aynı yol); crumb alınamazsa crumb'sız denenir."""
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    h = {"User-Agent": UA, "Accept": "application/json,text/plain,*/*"}
    try:
        op.open(urllib.request.Request("https://fc.yahoo.com", headers=h), timeout=20)
    except Exception:
        pass  # 404 dönse de çerez gelir
    crumb = ""
    try:
        crumb = op.open(urllib.request.Request("https://query2.finance.yahoo.com/v1/test/getcrumb", headers=h), timeout=20).read().decode().strip()
    except Exception as e:
        print(f"::warning::crumb alınamadı: {str(e)[:80]}")
    return op, h, crumb


def fiyat(op, h, crumb, sym):
    """(son fiyat, önceki kapanış, piyasa saati [unix sn]) ya da None."""
    u = f"https://query2.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym, safe='=')}?range=1d&interval=5m"
    if crumb:
        u += "&crumb=" + urllib.parse.quote(crumb, safe="")  # crumb içinde "/" olabilir
    for deneme in range(3):
        try:
            j = json.loads(op.open(urllib.request.Request(u, headers=h), timeout=25).read())
            m = j["chart"]["result"][0]["meta"]
            v, o, z = m.get("regularMarketPrice"), m.get("chartPreviousClose") or m.get("previousClose"), m.get("regularMarketTime")
            if all(isinstance(x, (int, float)) and x > 0 for x in (v, o, z)):
                return float(v), float(o), int(z)
            print(f"::warning::{sym}: eksik alan")
            return None
        except Exception as e:
            print(f"::warning::{sym} deneme {deneme + 1}: {str(e)[:80]}")
            time.sleep(4)
    return None


def gunluk_dolar():
    """Sitenin günlük verisindeki son dolar (makullük denetimi için); yoksa None."""
    try:
        P = json.load(open("data/piyasa.json", encoding="utf-8"))
        return next((x for x in reversed(P.get("usd") or []) if isinstance(x, (int, float)) and x > 0), None)
    except Exception:
        return None


def main():
    op, h, crumb = oturum()
    R = {k: fiyat(op, h, crumb, s) for k, s in SEMBOL.items()}
    u = R["usd"]
    if not u:
        print("::warning::USD/TRY alınamadı; kur_anlik.json değişmedi")
        return
    g = gunluk_dolar()
    if g and abs(u[0] / g - 1) > 0.10:
        print(f"::warning::USD/TRY {u[0]} günlük veriden ({g}) çok uzak; kur_anlik.json değişmedi")
        return
    K = {}

    def koy(ad, v, o, z, nd):
        K[ad] = {"v": round(v, nd), "o": round(o, nd), "z": z}

    koy("usd", *u, 4)
    for ad in ("eur", "gbp"):
        if R[ad]:
            koy(ad, *R[ad], 4)
    if R["eurusd"]:
        koy("eurusd", *R["eurusd"], 5)
    if R["ons"]:
        v, o, z = R["ons"]
        koy("ons", v, o, z, 2)
        koy("gra", v * u[0] / OZ, o * u[1] / OZ, min(z, u[2]), 2)  # gram altın TL
    if R["gumus_ons"]:
        v, o, z = R["gumus_ons"]
        koy("gumus", v * u[0] / OZ, o * u[1] / OZ, min(z, u[2]), 3)  # gümüş TL/gram
    if R["brent"]:
        koy("brent", *R["brent"], 2)
    out = {
        "guncelleme": dt.datetime.now(dt.timezone(dt.timedelta(hours=3))).isoformat(timespec="seconds"),
        "kaynak": "Yahoo Finance (USDTRY=X, EURTRY=X, GBPTRY=X, EURUSD=X, GC=F, SI=F, BZ=F). Gram altın ve gümüş: ons fiyatı × USD/TRY ÷ 31,1034768.",
        "k": K,
    }
    os.makedirs("data", exist_ok=True)
    with open(CIKTI, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print("::notice::kur_anlik: " + ", ".join(f"{k}={x['v']}" for k, x in K.items()))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # zincirin geri kalanı etkilenmesin
        print(f"::warning::kur_anlik beklenmeyen hata: {str(e)[:120]}")
        sys.exit(0)
