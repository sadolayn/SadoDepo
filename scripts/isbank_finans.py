#!/usr/bin/env python3
"""İş Bankası'nın kendi sitesindeki resmi finansal veri Excel'ini (2015'ten beri çeyreklik)
indirip isbank/finans.json yazar. Kaynak: Key Financial Indicators sayfası."""
import json, io, sys, urllib.request, datetime as dt
import openpyxl

URL = "https://www.isbank.com.tr/contentmanagement/IsbankInvestorRelationsGeneric/key-financial-indicators/IsbankFinancialData.xlsx"
req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
raw = urllib.request.urlopen(req, timeout=60).read()
ws = openpyxl.load_workbook(io.BytesIO(raw), data_only=True).worksheets[0]
rows = list(ws.iter_rows(values_only=True))

# Dönem başlığı: "Assets" satırı
hdr = next(r for r in rows if r[0] and str(r[0]).strip() == "Assets")
cols = [(i, str(v).strip()) for i, v in enumerate(hdr) if i > 0 and v and "/" in str(v)]

def find(label, after=None):
    start = 0
    if after:
        start = next(i for i, r in enumerate(rows) if r[0] and str(r[0]).strip().startswith(after))
    for r in rows[start:]:
        if r[0] and str(r[0]).strip().startswith(label):
            out = []
            for i, _ in cols:
                v = r[i]
                try: out.append(float(v))
                except (TypeError, ValueError): out.append(None)
            return out
    print(f"::warning::satır bulunamadı: {label}")
    return [None] * len(cols)

thousand = lambda xs: [None if x is None else round(x / 1e6, 3) for x in xs]   # bin TL -> milyar TL
pct = lambda xs: [None if x is None else round(x * 100, 2) for x in xs]
cnt = lambda xs: [None if x is None else int(x) for x in xs]

S = {
  "aktif": thousand(find("Total Assets")),
  "kredi": thousand(find("Loans")),
  "mevduat": thousand(find("Deposits")),
  "ozkaynak": thousand(find("Shareholders' Equity")),
  "netkar": thousand(find("Net Period Profit")),
  "nfg": thousand(find("Net Interest Income")),
  "komisyon": thousand(find("Net Fees and Commissions")),
  "npl": pct(find("NPL Ratio", after="RATIO ANALYSIS")),
  "roe": pct(find("Return on Average Equity", after="RATIO ANALYSIS")),
  "roa": pct(find("Retun on Average Assets", after="RATIO ANALYSIS")),
  "syr": pct(find("Capital Adequacy Ratio")),
  "sube": cnt(find("Number of Branches")),
  "atm": cnt(find("Number of ATMs")),
  "calisan": cnt(find("Number of Employees")),
  "kart": cnt(find("Number of Credit Cards")),
}
periods = [p for _, p in cols]
keep = 13  # son ~3 yıl
out = {
  "updated": dt.datetime.now(dt.timezone(dt.timedelta(hours=3))).isoformat(timespec="minutes"),
  "kaynak": "İş Bankası – Key Financial Indicators (IsbankFinancialData.xlsx)",
  "url": URL,
  "birim": "milyar TL; oranlar %",
  "periods": periods[-keep:],
  "s": {k: v[-keep:] for k, v in S.items()},
}
if not out["periods"] or out["s"]["aktif"][-1] is None: sys.exit("::error::veri okunamadı")
try:
    old = json.load(open("isbank/finans.json"))
    if old.get("periods") == out["periods"] and old.get("s") == out["s"]:
        print("::notice::değişiklik yok"); sys.exit(0)
except FileNotFoundError:
    pass
json.dump(out, open("isbank/finans.json", "w"), ensure_ascii=False, separators=(",", ":"))
print("::notice::son dönem", out["periods"][-1], "aktif", out["s"]["aktif"][-1], "net kâr", out["s"]["netkar"][-1])
