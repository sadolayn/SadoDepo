#!/usr/bin/env python3
"""Uzun dönem (Aralık 2005 – Ekim 2020) aylık kapanış fiyatlarını (TL) data/piyasa_uzun.json'a yazar.
Günlük veri (data/piyasa.json) Ekim 2020 sonunda başlar; "Geçmişte yatırsaydın" hesabı 20 yıla kadar geriye
gidebilsin diye bu dosya bir kez üretilir (geçmiş değişmediği için düzenli çalışması gerekmez).
Kurlar: Avrupa Merkez Bankası (frankfurter.app), her ayın son iş günü. Madenler ve Brent: Yahoo Finance aylık
kapanış (USD), TL/gram ve TL/varil'e çevrilir. Yalnızca işlenmiş sayılar yazılır, ham yanıt kaydedilmez."""
import json, urllib.request, datetime as dt, http.cookiejar, time, sys, os

OZ = 31.1034768
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
BAS, SON = "2005-12-01", "2020-10-31"

def get(url, op=None, tries=3):
    op = op or urllib.request.build_opener()
    for i in range(tries):
        try:
            return op.open(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=40).read().decode()
        except Exception as e:
            err = e; time.sleep(5)
    raise err

fx = json.loads(get(f"https://api.frankfurter.app/{BAS}..{SON}?base=USD&symbols=TRY,EUR,GBP"))["rates"]
ay_son = {}
for d in sorted(fx):
    ay_son[d[:7]] = d  # ayın son iş günü
aylar = sorted(ay_son)
print(f"::notice::ECB: {len(fx)} gün, {len(aylar)} ay ({aylar[0]} – {aylar[-1]})")

cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
try: get("https://fc.yahoo.com", op, 1)
except Exception: pass
crumb = get("https://query2.finance.yahoo.com/v1/test/getcrumb", op)
p1 = int(dt.datetime(2005, 11, 1).timestamp()); p2 = int(dt.datetime(2020, 11, 1).timestamp())
def yahoo(sym):
    for i in range(4):
        try:
            j = json.loads(get(f"https://query2.finance.yahoo.com/v8/finance/chart/{sym}?period1={p1}&period2={p2}&interval=1mo&crumb={crumb}", op))["chart"]["result"][0]
            return {dt.datetime.utcfromtimestamp(t + 86400 * 3).strftime("%Y-%m"): c for t, c in zip(j["timestamp"], j["indicators"]["quote"][0]["close"]) if c}
        except Exception as e:
            print(f"::warning::yahoo {sym} {i}: {str(e)[:80]}"); time.sleep(8)
    return {}

seri = {}
for k, sym in {"xau": "GC=F", "xag": "SI=F", "xpt": "PL=F", "xpd": "PA=F", "brent": "BZ=F"}.items():
    seri[k] = yahoo(sym)
    print(f"::notice::Yahoo {sym}: {len(seri[k])} ay" + (f" ({min(seri[k])} – {max(seri[k])})" if seri[k] else ""))
if any(len(seri[k]) < 150 for k in ("xau", "xag", "xpt", "xpd")):
    sys.exit("::error::Maden verisi eksik")

out = {k: [] for k in ("usd", "eur", "gbp", "xau", "xag", "xpt", "xpd", "brent")}
dates, son = [], {}
for ym in aylar:
    r = fx[ay_son[ym]]; u = r["TRY"]
    dates.append(ay_son[ym])
    out["usd"].append(round(u, 4)); out["eur"].append(round(u / r["EUR"], 4)); out["gbp"].append(round(u / r["GBP"], 4))
    for k in ("xau", "xag", "xpt", "xpd", "brent"):
        if ym in seri[k]: son[k] = seri[k][ym]
        v = son.get(k)
        out[k].append(None if v is None else round(v * u / (1 if k == "brent" else OZ), 3 if k != "brent" else 2))

for i in (0, 60, 120, len(dates) - 1):
    print("::notice::" + dates[i] + " " + ", ".join(f"{k}={out[k][i]}" for k in out))
os.makedirs("data", exist_ok=True)
json.dump({"source": "Aylık kapanış (ayın son iş günü). Kurlar: Avrupa Merkez Bankası (frankfurter.app). Madenler ve Brent: Yahoo Finance vadeli fiyatları, TL'ye çevrilmiştir.",
           "dates": dates, **out}, open("data/piyasa_uzun.json", "w"), separators=(",", ":"))
