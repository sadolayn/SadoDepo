#!/usr/bin/env python3
"""İl / ilçe listesi (Bölgem sayfası): data/ililce.json.
Kaynak: turkey-neighbourhoods npm paketi (MIT; PTT posta kodu listesinden üretiliyor). Paket yalnızca indirilip açılır,
içindeki iki JSON okunur; hiçbir kodu çalıştırılmaz. 10 günde bir çalışır; liste değişmediyse dosyaya dokunulmaz.
Güvenlik sigortası: il sayısı 81 değilse ya da ilçe sayısı belirgin azaldıysa eski dosya korunur."""
import json, os, subprocess, sys, tarfile, tempfile

OUT = "data/ililce.json"
TR = "abcçdefgğhıijklmnoöprsştuüvyz"
key = lambda s: [TR.index(ch) if ch in TR else 99 for ch in s.replace("İ", "i").replace("I", "ı").lower()]

with tempfile.TemporaryDirectory() as d:
    subprocess.run(["npm", "pack", "turkey-neighbourhoods@latest", "--pack-destination", d], check=True, capture_output=True)
    tgz = next(f for f in os.listdir(d) if f.endswith(".tgz"))
    with tarfile.open(os.path.join(d, tgz)) as t:
        def oku(ad):
            m = t.getmember("package/src/data/" + ad)
            return json.load(t.extractfile(m))
        iller, ilceler = oku("cityNamesByCode.json"), oku("districtsByCityCode.json")

if set(iller) != set(ilceler) or len(iller) != 81:
    sys.exit(f"::error::Beklenmeyen veri: {len(iller)} il, {len(ilceler)} ilçe listesi; dosya değiştirilmedi")
yeni = {iller[k]: sorted(ilceler[k], key=key) for k in sorted(iller, key=lambda k: key(iller[k]))}
eski = {}
try: eski = json.load(open(OUT, encoding="utf8"))
except Exception: pass
n_yeni, n_eski = sum(map(len, yeni.values())), sum(map(len, eski.values()))
if eski and n_yeni < n_eski * 0.95:
    sys.exit(f"::error::İlçe sayısı {n_eski} → {n_yeni} düştü; dosya değiştirilmedi")
if yeni == eski:
    print(f"İl/ilçe listesi aynı: 81 il, {n_yeni} ilçe"); sys.exit(0)
os.makedirs("data", exist_ok=True)
json.dump(yeni, open(OUT, "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
fark = [(il, sorted(set(yeni[il]) ^ set(eski.get(il, [])))) for il in yeni if set(yeni[il]) != set(eski.get(il, []))]
print(f"İl/ilçe listesi güncellendi: {n_eski} → {n_yeni} ilçe; değişen iller: " + ", ".join(f"{il} ({' '.join(f)})" for il, f in fark[:20]))
