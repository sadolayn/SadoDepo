#!/usr/bin/env python3
"""Türk haber sitelerinin RSS akışlarından başlıkları toplar, data/haberler.json yazar.
Yalnızca başlık, kaynak, saat ve bağlantı saklanır (haber metni/görsel alınmaz)."""
import json, re, html, urllib.request, datetime as dt, os, sys
from email.utils import parsedate_to_datetime
from concurrent.futures import ThreadPoolExecutor
import xml.etree.ElementTree as ET

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36",
      "Accept": "application/rss+xml,application/xml,text/xml,*/*"}
FEEDS = {
  "gundem": [
    ("AA", "https://www.aa.com.tr/tr/rss/default?cat=guncel"),
    ("NTV", "https://www.ntv.com.tr/gundem.rss"),
    ("BBC Türkçe", "https://feeds.bbci.co.uk/turkce/rss.xml"),
    ("Habertürk", "https://www.haberturk.com/rss/manset.xml"),
    ("Hürriyet", "https://www.hurriyet.com.tr/rss/gundem"),
    ("Sözcü", "https://www.sozcu.com.tr/feeds-rss-category-gundem"),
    ("Cumhuriyet", "https://www.cumhuriyet.com.tr/rss/son_dakika.xml"),
    ("TRT Haber", "https://www.trthaber.com/gundem_articles.rss"),
  ],
  "ekonomi": [
    ("AA", "https://www.aa.com.tr/tr/rss/default?cat=ekonomi"),
    ("NTV", "https://www.ntv.com.tr/ekonomi.rss"),
    ("Bloomberg HT", "https://www.bloomberght.com/rss"),
    ("Dünya", "https://www.dunya.com/rss?dunya"),
    ("Habertürk", "https://www.haberturk.com/rss/ekonomi.xml"),
    ("Hürriyet", "https://www.hurriyet.com.tr/rss/ekonomi"),
    ("TRT Haber", "https://www.trthaber.com/ekonomi_articles.rss"),
  ],
  "dunya": [
    ("AA", "https://www.aa.com.tr/tr/rss/default?cat=dunya"),
    ("NTV", "https://www.ntv.com.tr/dunya.rss"),
    ("Hürriyet", "https://www.hurriyet.com.tr/rss/dunya"),
    ("TRT Haber", "https://www.trthaber.com/dunya_articles.rss"),
    ("Habertürk", "https://www.haberturk.com/rss/dunya.xml"),
  ],
  "teknoloji": [
    ("AA", "https://www.aa.com.tr/tr/rss/default?cat=bilim-teknoloji"),
    ("NTV", "https://www.ntv.com.tr/teknoloji.rss"),
    ("Webtekno", "https://www.webtekno.com/rss.xml"),
    ("ShiftDelete", "https://shiftdelete.net/feed"),
    ("TRT Haber", "https://www.trthaber.com/bilim_teknoloji_articles.rss"),
  ],
  "spor": [
    ("AA", "https://www.aa.com.tr/tr/rss/default?cat=spor"),
    ("NTV", "https://www.ntv.com.tr/sporskor.rss"),
    ("Hürriyet", "https://www.hurriyet.com.tr/rss/spor"),
    ("TRT Spor", "https://www.trtspor.com.tr/sondakika.rss"),
  ],
}
NOW = dt.datetime.now(dt.timezone.utc)
MAX_AGE = dt.timedelta(hours=36)

def text(el):
    return html.unescape(re.sub(r"<[^>]+>", "", (el.text or "") if el is not None else "")).strip()

def parse_date(s):
    if not s: return None
    try:
        d = parsedate_to_datetime(s)
    except Exception:
        try: d = dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception: return None
    if d.tzinfo is None: d = d.replace(tzinfo=dt.timezone(dt.timedelta(hours=3)))
    return d

def fetch(args):
    cat, src, url = args
    try:
        req = urllib.request.Request(url, headers=UA)
        raw = urllib.request.urlopen(req, timeout=20).read()
        root = ET.fromstring(raw)
        items = root.findall(".//item")
        ns = "{http://www.w3.org/2005/Atom}"
        if not items: items = root.findall(f".//{ns}entry")
        out = []
        for it in items[:40]:
            t = text(it.find("title")) or text(it.find(f"{ns}title"))
            link = text(it.find("link"))
            if not link:
                l = it.find(f"{ns}link"); link = l.get("href") if l is not None else ""
            d = parse_date(text(it.find("pubDate")) or text(it.find(f"{ns}updated")) or text(it.find(f"{ns}published")) or text(it.find("{http://purl.org/dc/elements/1.1/}date")))
            if not t or not link.startswith("http"): continue
            if d and (d > NOW + dt.timedelta(hours=1) or NOW - d > MAX_AGE): continue
            out.append({"t": t[:220], "s": src, "u": link, "d": d.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if d else None})
        return cat, src, out, None
    except Exception as e:
        return cat, src, [], str(e)[:90]

jobs = [(c, s, u) for c, lst in FEEDS.items() for s, u in lst]
with ThreadPoolExecutor(12) as ex:
    res = list(ex.map(fetch, jobs))

norm = lambda t: re.sub(r"[^\wçğıöşü]+", " ", t.lower()).strip()
cats = {}
ok_src = {}
for cat, src, items, err in res:
    if err: print(f"::warning::{cat}/{src}: {err}")
    else: ok_src.setdefault(cat, []).append(f"{src}:{len(items)}")
    cats.setdefault(cat, []).extend(items)
for cat, items in cats.items():
    seen, uniq = set(), []
    items.sort(key=lambda x: x["d"] or "", reverse=True)
    for x in items:
        k = norm(x["t"])[:70]
        if k in seen or x["u"] in seen: continue
        seen.add(k); seen.add(x["u"]); uniq.append(x)
    cats[cat] = uniq[:80]
print("::notice::" + " | ".join(f"{c}: {', '.join(v)}" for c, v in ok_src.items()))
total = sum(len(v) for v in cats.values())
if total < 20: sys.exit(f"::error::Çok az haber ({total})")
os.makedirs("data", exist_ok=True)
json.dump({"updated": NOW.strftime("%Y-%m-%dT%H:%M:%SZ"), "cats": cats}, open("data/haberler.json", "w"), ensure_ascii=False, separators=(",", ":"))
print("yazıldı", total)
