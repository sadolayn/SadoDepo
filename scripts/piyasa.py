#!/usr/bin/env python3
"""Döviz ve kıymetli maden fiyatlarını (TL) toplayıp data/piyasa.json yazar.
Kur: Avrupa Merkez Bankası referans kurları (frankfurter.app) — USD/TRY, EUR/TRY, GBP/TRY.
Madenler: fawazahmed0/currency-api (USD/ons) -> TL/gram (1 ons = 31.1034768 gr).
Haftalık geçmiş (2020-11'den beri) + son 21 gün günlük."""
import json, urllib.request, datetime as dt, sys, os
from concurrent.futures import ThreadPoolExecutor

OZ = 31.1034768
UA = {"User-Agent": "Mozilla/5.0 sadolayn-piyasa"}
TODAY = dt.date.today()

def get(url, tries=3):
    last = None
    for _ in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode()
        except Exception as e:
            last = e
    raise last

# ---- Kurlar (ECB) ----
fx = json.loads(get("https://api.frankfurter.app/2020-11-01..?base=USD&symbols=TRY,EUR,GBP"))["rates"]
fx_dates = sorted(fx)
print(f"::notice::ECB kur günleri {len(fx_dates)} ({fx_dates[0]} – {fx_dates[-1]})")
def fx_on(d):
    lo, hi = 0, len(fx_dates) - 1
    if d < fx_dates[0]: return None
    while lo < hi:
        m = (lo + hi + 1) // 2
        if fx_dates[m] <= d: lo = m
        else: hi = m - 1
    return fx[fx_dates[lo]]

# ---- Madenler ----
def metal_urls(d):
    s = d.isoformat()
    urls = []
    if d >= dt.date(2024, 3, 2):
        urls += [f"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{s}/v1/currencies/usd.min.json",
                 f"https://{s}.currency-api.pages.dev/v1/currencies/usd.min.json"]
    urls += [f"https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/{s}/currencies/usd.min.json"]
    return urls

def metal(d):
    for u in metal_urls(d):
        try:
            j = json.loads(get(u, 2))
            r = j.get("usd", j)
            vals = {k: r.get(k) for k in ("xau", "xag", "xpt", "xpd")}
            if all(v and v > 0 for v in vals.values()):
                return d.isoformat(), {k: 1 / v for k, v in vals.items()}
        except Exception:
            pass
    return d.isoformat(), None

# 1) LBMA resmi gösterge fiyatları (USD/ons)
LBMA = {"xau": ["gold_pm", "gold_am"], "xag": ["silver"], "xpt": ["platinum_pm", "platinum_am"], "xpd": ["palladium_pm", "palladium_am"]}
lb = {}
for m, names in LBMA.items():
    for n in names:
        try:
            arr = json.loads(get(f"https://prices.lbma.org.uk/json/{n}.json"))
            ser = {}
            for e in arr:
                d0 = e.get("d"); v = e.get("v") or []
                if d0 and d0 >= "2020-10-01" and v and v[0]:
                    ser[d0] = float(v[0])
            if len(ser) > 500:
                lb[m] = ser
                print(f"::notice::LBMA {n}: {len(ser)} gün, son {max(ser)}")
                break
        except Exception as e:
            print(f"::warning::LBMA {n}: {str(e)[:120]}")
if len(lb) < 4: sys.exit("::error::LBMA verisi eksik: " + ",".join(lb))

ok = {}
last = {}
for d0 in sorted(set().union(*[set(v) for v in lb.values()])):
    for m in lb:
        if d0 in lb[m]: last[m] = lb[m][d0]
    if len(last) == 4: ok[d0] = dict(last)

# 2) LBMA'nın henüz yayınlamadığı son günler için currency-api
lastd = dt.date.fromisoformat(max(ok))
extra = [lastd + dt.timedelta(days=i) for i in range(1, (TODAY - lastd).days + 1)]
with ThreadPoolExecutor(8) as ex:
    for k, v in ex.map(metal, extra):
        if v and dt.date.fromisoformat(k).weekday() < 5: ok[k] = v
print(f"::notice::Toplam maden günü {len(ok)}, son {max(ok)}")

cols = {k: [] for k in ["usd", "eur", "gbp", "xau", "xag", "xpt", "xpd"]}
keep = []
for s in sorted(ok):
    r = fx_on(s)
    if not r: continue
    u = r["TRY"]
    keep.append(s)
    cols["usd"].append(round(u, 4))
    cols["eur"].append(round(u / r["EUR"], 4))
    cols["gbp"].append(round(u / r["GBP"], 4))
    for m in ("xau", "xag", "xpt", "xpd"):
        cols[m].append(round(ok[s][m] * u / OZ, 3))

def sample(s):
    i = min(range(len(keep)), key=lambda j: abs((dt.date.fromisoformat(keep[j]) - dt.date.fromisoformat(s)).days))
    usd = cols["usd"][i]
    return keep[i] + " " + ", ".join(f"{k}={cols[k][i]}" for k in cols) + \
        " | USD/ons: " + ", ".join(f"{m}={round(cols[m][i]*OZ/usd)}" for m in ("xau", "xag", "xpt", "xpd"))
for s in ("2021-10-15", "2023-12-29", keep[-1]):
    print("::notice::" + sample(s))

out = {
    "updated": dt.datetime.now(dt.timezone(dt.timedelta(hours=3))).strftime("%Y-%m-%d %H:%M"),
    "source": "Kurlar: Avrupa Merkez Bankası referans kurları (frankfurter.app). Madenler: currency-api ons fiyatları, TL/gram'a çevrilmiştir.",
    "dates": keep, **cols,
}
os.makedirs("data", exist_ok=True)
json.dump(out, open("data/piyasa.json", "w"), separators=(",", ":"))
print("yazıldı", len(keep))
