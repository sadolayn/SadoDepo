#!/usr/bin/env python3
"""Döviz ve kıymetli maden fiyatlarını (TL) toplayıp data/piyasa.json yazar.
Birincil kaynak: Yahoo Finance günlük kapanışlar. Kur: USD/TRY, EUR/TRY, GBP/TRY.
Madenler USD/ons -> TL/gram (1 ons = 31.1034768 gr)."""
import json, time, urllib.request, datetime as dt, sys, os

OZ = 31.1034768
START = dt.datetime(2020, 1, 1, tzinfo=dt.timezone.utc)
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}

YAHOO = {"usdtry": "TRY=X", "eurtry": "EURTRY=X", "gbptry": "GBPTRY=X",
         "xau": "GC=F", "xag": "SI=F", "xpt": "PL=F", "xpd": "PA=F"}

def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode()

def yahoo(sym):
    p1 = int(START.timestamp()); p2 = int(time.time()) + 86400
    for host in ("query1", "query2"):
        try:
            u = f"https://{host}.finance.yahoo.com/v8/finance/chart/{sym}?period1={p1}&period2={p2}&interval=1d&events=history"
            j = json.loads(get(u))["chart"]["result"][0]
            ts = j["timestamp"]; cl = j["indicators"]["quote"][0]["close"]
            out = {}
            for t, c in zip(ts, cl):
                if c is None or c <= 0: continue
                d = dt.datetime.fromtimestamp(t, dt.timezone.utc).strftime("%Y-%m-%d")
                out[d] = c
            if len(out) > 500: return out
        except Exception as e:
            print("yahoo fail", sym, host, e, file=sys.stderr)
    return None

def clean(series, maxjump=0.25):
    """Tek günlük hatalı sıçramaları at (önceki ve sonraki güne göre)."""
    ds = sorted(series)
    bad = set()
    for i in range(1, len(ds) - 1):
        a, b, c = series[ds[i-1]], series[ds[i]], series[ds[i+1]]
        if abs(b/a - 1) > maxjump and abs(b/c - 1) > maxjump: bad.add(ds[i])
    return {d: v for d, v in series.items() if d not in bad}

raw = {}
for k, s in YAHOO.items():
    r = yahoo(s)
    if not r: sys.exit(f"Veri alınamadı: {k}")
    raw[k] = clean(r)
    print(k, len(raw[k]), min(raw[k]), max(raw[k]), file=sys.stderr)

# İş günü takvimi: kurların tarihleri birleşimi, eksikler bir önceki değerle doldurulur
dates = sorted(set().union(*[set(v) for v in raw.values()]))
dates = [d for d in dates if d <= dt.date.today().isoformat()]
last = {}
cols = {k: [] for k in ["usd", "eur", "gbp", "xau", "xag", "xpt", "xpd"]}
keep = []
for d in dates:
    for k in raw:
        if d in raw[k]: last[k] = raw[k][d]
    if len(last) < len(raw): continue
    keep.append(d)
    u = last["usdtry"]
    cols["usd"].append(round(u, 4))
    cols["eur"].append(round(last["eurtry"], 4))
    cols["gbp"].append(round(last["gbptry"], 4))
    for m in ("xau", "xag", "xpt", "xpd"):
        cols[m].append(round(last[m] * u / OZ, 2 if m != "xag" else 3))

out = {
    "updated": dt.datetime.now(dt.timezone(dt.timedelta(hours=3))).strftime("%Y-%m-%d %H:%M"),
    "source": "Yahoo Finance günlük kapanış (USD/TRY, EUR/TRY, GBP/TRY; altın, gümüş, platin, paladyum vadeli ons fiyatı × USD/TRY ÷ 31,1035)",
    "dates": keep,
    **cols,
}
os.makedirs("data", exist_ok=True)
with open("data/piyasa.json", "w") as f:
    json.dump(out, f, separators=(",", ":"))
print("yazıldı", len(keep), "gün, son", keep[-1], {k: v[-1] for k, v in cols.items()})
