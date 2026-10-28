#!/usr/bin/env python3
"""Türk haber sitelerinin RSS akışlarından başlıkları toplar, data/haberler.json yazar.
Yalnızca başlık, kaynak, saat ve bağlantı saklanır (haber metni/görsel alınmaz)."""
import json, re, html, urllib.request, datetime as dt, os, sys, time
from email.utils import parsedate_to_datetime
from concurrent.futures import ThreadPoolExecutor
import xml.etree.ElementTree as ET
from eski_haber import eski_mi  # scripts/eski_haber.py: Google'ın yeni diye verdiği yıllar önceki haberleri eler

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
    ("DonanımHaber", "https://www.donanimhaber.com/rss/tum/"),
    ("TRT Haber", "https://www.trthaber.com/bilim_teknoloji_articles.rss"),
  ],
  "spor": [
    ("AA", "https://www.aa.com.tr/tr/rss/default?cat=spor"),
    ("NTV", "https://www.ntv.com.tr/sporskor.rss"),
    ("Hürriyet", "https://www.hurriyet.com.tr/rss/spor"),
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
    cat, src, url = args[:3]
    max_age = args[3] if len(args) > 3 else MAX_AGE
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
            se = it.find("source")
            if se is not None and se.text:
                src_name = se.text.strip()
                if t.endswith(" - " + src_name): t = t[: -(len(src_name) + 3)]
            else:
                src_name = src
            link = text(it.find("link"))
            if not link:
                l = it.find(f"{ns}link"); link = l.get("href") if l is not None else ""
            d = parse_date(text(it.find("pubDate")) or text(it.find(f"{ns}published")) or text(it.find(f"{ns}updated")) or text(it.find("{http://purl.org/dc/elements/1.1/}date")))
            if not t or not link.startswith("http"): continue
            if d and (d > NOW + dt.timedelta(hours=1) or NOW - d > max_age): continue
            out.append({"t": t[:220], "s": src_name, "u": link, "d": d.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if d else None})
        return cat, src, out, None
    except Exception as e:
        return cat, src, [], str(e)[:90]

# Okul tatili: Google Haberler aramaları (kaynak adı akıştan alınır)
import urllib.parse
GN = lambda q: "https://news.google.com/rss/search?q=" + urllib.parse.quote(q + " when:2d") + "&hl=tr&gl=TR&ceid=TR:tr"
OKUL_FEEDS = [("Google Haberler", GN(q)) for q in ['okullar tatil', '"eğitime ara"', '"okullar tatil edildi"', '"yüz yüze eğitime"', 'kar tatili okul']]
OKUL_RE = re.compile(r"(okul|okullar|eğitim|öğretim|ders)\w*[^.?!]{0,60}(tatil|ara ver|yapılmayacak|uzaktan|askıya)|tatil\w*[^.?!]{0,40}(okul|eğitim)", re.I)

# İş Bankası: Google Haberler aramaları + tüm kategorilerdeki eşleşen başlıklar
ISB_FEEDS = [("Google Haberler", GN(q)) for q in ['"İş Bankası"', '"İşbank"', '"İşCep"', '"Maximum kart" OR "Maximiles" OR "MaxiPuan"', 'ISCTR']]
ISB_RE = re.compile(r"iş ?bankası|işbank|isbank|işcep|iscep|isctr|maximiles|maxipuan|maximum kart|maximum mobil|türkiye iş bankası", re.I)

# Tarım (İş Bankası tarım kredileri dahil)
TARIM_FEEDS = [("Google Haberler", GN(q)) for q in ['tarım', 'çiftçi', '"tarım kredisi" OR "tarımsal kredi"', '"İş Bankası" tarım OR çiftçi OR "Tarım Kart" OR üretici', 'hasat OR rekolte', '"Tarım ve Orman Bakanlığı"', 'hayvancılık OR süt fiyatı']]
TARIM_RE = re.compile(r"tarım|tarim|çiftçi|ciftci|hasat|rekolte|hayvancılık|besici|zirai|ziraat|tohum|gübre|sulama|buğday|fındık|pamuk|zeytin|çiğ süt|\btmo\b|kuraklık|don vurdu|tarla", re.I)
# Yapay zeka
YZ_FEEDS = [("Google Haberler", GN(q)) for q in ['"yapay zeka"', '"yapay zekâ"', 'ChatGPT OR OpenAI OR Gemini OR Anthropic OR Claude', '"üretken yapay zeka" OR "büyük dil modeli"']]
YZ_RE = re.compile(r"yapay ?zek[aâ]|\bai\b|chatgpt|openai|gemini|anthropic|claude|copilot|dil modeli|llm|nvidia", re.I)

jobs = [(c, s, u) for c, lst in FEEDS.items() for s, u in lst] + [("okul", s, u) for s, u in OKUL_FEEDS] + [("isbank", s, u) for s, u in ISB_FEEDS] \
     + [("tarim", s, u) for s, u in TARIM_FEEDS] + [("yz", s, u) for s, u in YZ_FEEDS]
# Ekonomim: tek genel akış; haberler bağlantıdaki bölüme göre sekmelere dağıtılır
EKONOMIM = ("Ekonomim", "https://www.ekonomim.com/rss")
EKONOMIM_ROUTE = {"gundem": "gundem", "dunya": "dunya", "teknoloji": "teknoloji", "spor": "spor"}  # gerisi (ekonomi, finans, piyasa…) → ekonomi
jobs += [("_ekonomim", *EKONOMIM)]
# İş Bankası resmi YouTube kanalı (adres isbank.com.tr alt bilgisindeki bağlantıdan); yeni ürün tanıtımları burada çıkıyor.
# YouTube'un RSS akışı saatlerce "404" dönebiliyor: üç farklı adres birkaç tur denenir, alınamazsa son alınan liste korunur.
ISB_YT_URLS = [
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC8taW8Ljy9xA_tiWy-1OPww",
  "https://www.youtube.com/feeds/videos.xml?playlist_id=UU8taW8Ljy9xA_tiWy-1OPww",
  "https://www.youtube.com/feeds/videos.xml?user=turkiyeisbankasi",
]
def yt_fetch():
    errs = []
    for tur in range(3):
        for u in ISB_YT_URLS:
            _, _, items, err = fetch(("_isbvideo", "İş Bankası YouTube", u, dt.timedelta(days=365)))
            if not err and items: return items, None
            errs.append(err or "boş")
        time.sleep(4)
    return [], errs[-1]

# ---------- Yazarlar ----------
# Yeni yazar eklemek için listeye bir satır ekle: (kısa ad, görünen ad, Google Haberler araması, [ek RSS akışları])
YAZARLAR = [
  ("mahfi", "Mahfi Eğilmez", '"Mahfi Eğilmez"', [("Kendi Kendine Ekonomi", "https://www.mahfiegilmez.com/feeds/posts/default?alt=rss")]),
  ("aliekber", "Ali Ekber Yıldırım", '"Ali Ekber Yıldırım"', []),
  ("irfan", "İrfan Donat", '"İrfan Donat"', []),
  ("ece", "Ece Üner", '"Ece Üner"', []),
]
YAZAR_AGE = dt.timedelta(days=14)
GNY = lambda q: "https://news.google.com/rss/search?q=" + urllib.parse.quote(q + " when:14d") + "&hl=tr&gl=TR&ceid=TR:tr"
for k, n, q, extra in YAZARLAR:
    jobs += [("_y_" + k, "Google Haberler", GNY(q), YAZAR_AGE)] + [("_y_" + k, s, u, YAZAR_AGE) for s, u in extra]
with ThreadPoolExecutor(12) as ex:
    yt = ex.submit(yt_fetch)
    res = list(ex.map(fetch, jobs))
    yt_items, yt_err = yt.result()

# Videolar: yeni alınanlar + önceki liste (YouTube akışı kapalıyken de eski videolar görünsün)
try:
    _eski = json.load(open("data/haberler.json", encoding="utf8"))
except Exception:
    _eski = {}
_vid = {x["u"]: x for x in _eski.get("isbvideo", []) if x.get("u")}
for x in yt_items: _vid[x["u"]] = x
_sinir = (NOW - dt.timedelta(days=365)).strftime("%Y-%m-%dT%H:%M:%SZ")
isbvideo = sorted((x for x in _vid.values() if (x.get("d") or "") >= _sinir), key=lambda x: x.get("d") or "", reverse=True)[:20]
isbvideo_ok = NOW.strftime("%Y-%m-%dT%H:%M:%SZ") if yt_items else _eski.get("isbvideo_ok")
if yt_err: print(f"::warning::İş Bankası YouTube alınamadı ({yt_err}); önceki {len(isbvideo)} video korundu")
norm = lambda t: re.sub(r"[^\wçğıöşü]+", " ", t.lower()).strip()
cats = {}
ok_src = {}
for cat, src, items, err in res:
    if err: print(f"::warning::{cat}/{src}: {err}")
    else: ok_src.setdefault(cat, []).append(f"{src}:{len(items)}")
    if cat.startswith("_y_"):
        cats.setdefault(cat, []).extend(items); continue
    if cat == "_ekonomim":
        for x in items:
            seg = urllib.parse.urlparse(x["u"]).path.strip("/").split("/")[0]
            cats.setdefault(EKONOMIM_ROUTE.get(seg, "ekonomi"), []).append(x)
        continue
    cats.setdefault(cat, []).extend(items)
# Okul tatili kategorisi: arama sonuçları + tüm kategorilerdeki eşleşen başlıklar
okul = [x for x in cats.get("okul", []) if OKUL_RE.search(x["t"].lower())]
for c, items in cats.items():
    if c != "okul": okul += [x for x in items if OKUL_RE.search(x["t"].lower())]
cats["okul"] = okul
low = lambda t: t.replace("İ", "i").replace("I", "ı").lower()
isb = [x for x in cats.get("isbank", []) if ISB_RE.search(low(x["t"]))]
for c, items in cats.items():
    if c not in ("isbank", "okul"): isb += [x for x in items if ISB_RE.search(low(x["t"]))]
cats["isbank"] = isb
# Banka hakkında olumsuz başlıklar (dava, protesto, şikâyet, soruşturma, arıza, dolandırıcılık…) hiçbir kategoride gösterilmez:
# bu sayfa banka gündemini derler, tartışma ya da şikâyet aktarmaz
ISB_OLUMSUZ = re.compile(r"protesto|eylem|yürü(?:dü|yüş)|slogan|grev|sendika|dava|mahkeme|ceza|soruşturma|gözaltı|tutukla|iddianame|skandal|"
                         r"şika?yet|şikâyet|mağdur|dolandır|hack|siber saldırı|sızıntı|sızdır|çöktü|erişim sorunu|arıza|kesinti(?!siz)|tepki|rüşvet|"
                         r"kara para|usulsüz|zimmet|haciz|icra|tazminat|işten çıkar|kovul|istifa|zarar et|çakıldı|sert düş|kriz|ihlal|suç", re.I)
for c in list(cats):
    cats[c] = [x for x in cats[c] if not (ISB_RE.search(low(x["t"])) and ISB_OLUMSUZ.search(low(x["t"])))]
# Eski haber süzgeci (yalnızca İş Bankası sekmesi): başlıkta eski yıl ya da haber sayfasındaki yayın tarihi 60 günden eskiyse elenir.
# Adres çözme sonuçları isb_tarih'te saklanır (haber başına bir kez bakılır); turda en çok 12 yeni adrese bakılır, kalanı sonraki tur.
# Tarih okunamazsa haber gösterilir; süzgeç bir şey bozarsa haberler yine listelenir.
_tarih = {k: v for k, v in (_eski.get("isb_tarih") or {}).items() if isinstance(v, dict)}
isb_tarih, _bak, _elenen, _kalan = {}, 0, 0, []
def _eski_kontrol(x):
    global _bak
    if x["u"] not in _tarih:
        if _bak >= 12: return x, None, None
        _bak += 1
    try: e, v = eski_mi(x, _tarih, NOW)
    except Exception: e, v = False, None
    return x, e, v
with ThreadPoolExecutor(6) as ex:
    _sonuc = list(ex.map(_eski_kontrol, cats["isbank"]))
for x, e, v in _sonuc:
    if v is not None: isb_tarih[x["u"]] = v
    if e: _elenen += 1
    else: _kalan.append(x)
cats["isbank"] = _kalan
_neden = {}
for x, e, v in _sonuc:
    if v and v.get("n") and x["u"] not in _tarih: _neden[v["n"]] = _neden.get(v["n"], 0) + 1
print(f"İş Bankası eski haber süzgeci: {_bak} yeni adrese bakıldı, {_elenen} haber elendi, {len(_kalan)} kaldı" + (f"; tarih okunamadı: {', '.join(f'{k}×{n}' for k, n in _neden.items())}" if _neden else ""))
tar = [x for x in cats.get("tarim", []) if TARIM_RE.search(low(x["t"]))]
for c, items in cats.items():
    if c not in ("tarim", "okul", "yz"): tar += [x for x in items if TARIM_RE.search(low(x["t"]))]
cats["tarim"] = tar
yz = [x for x in cats.get("yz", []) if YZ_RE.search(low(x["t"]))]
for c, items in cats.items():
    if c not in ("yz", "okul", "tarim"): yz += [x for x in items if YZ_RE.search(low(x["t"]))]
cats["yz"] = yz
yazarlar = []
for k, n, q, extra in YAZARLAR:
    seen, lst = set(), []
    for x in sorted(cats.pop("_y_" + k, []), key=lambda x: x["d"] or "", reverse=True):
        key = norm(x["t"])[:70]
        if key in seen or x["u"] in seen: continue
        seen.add(key); seen.add(x["u"]); lst.append(x)
    yazarlar.append({"k": k, "n": n, "items": lst[:30]})
for cat, items in cats.items():
    seen, uniq = set(), []
    items.sort(key=lambda x: x["d"] or "", reverse=True)
    for x in items:
        k = norm(x["t"])[:70]
        if k in seen or x["u"] in seen: continue
        seen.add(k); seen.add(x["u"]); uniq.append(x)
    # Tek kaynağın listeyi doldurmaması için kaynak başına en fazla 12 başlık
    per, capped = {}, []
    for x in uniq:
        per[x["s"]] = per.get(x["s"], 0) + 1
        if per[x["s"]] <= 12: capped.append(x)
    cats[cat] = capped[:80]
print("::notice::" + " | ".join(f"{c}: {', '.join(v)}" for c, v in ok_src.items()))
total = sum(len(v) for v in cats.values())
if total < 20: sys.exit(f"::error::Çok az haber ({total})")
os.makedirs("data", exist_ok=True)
print(f"::notice::isbvideo: {len(isbvideo)} (yeni alınan {len(yt_items)})")
print("::notice::yazarlar: " + ", ".join(f"{y['n']}:{len(y['items'])}" for y in yazarlar))
json.dump({"updated": NOW.strftime("%Y-%m-%dT%H:%M:%SZ"), "cats": cats, "yazarlar": yazarlar, "isbvideo": isbvideo, "isbvideo_ok": isbvideo_ok, "isb_tarih": isb_tarih}, open("data/haberler.json", "w"), ensure_ascii=False, separators=(",", ":"))
print("yazıldı", total)
