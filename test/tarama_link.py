"""Site taraması (link): HTML/JS/CSS içindeki iç bağlantıların dosyası var mı bakar; dış adresleri ext.json olarak çalışılan klasöre yazar.
Kullanım: geçici bir klasörden `python3 <depo>/test/tarama_link.py`. Dış adreslerin açılıp açılmadığı ayrıca (yalnızca durum kodu) denetlenir."""
import re,os,glob,json,sys
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ext=set(); bad=[]
for f in sorted(glob.glob(root+'/*.html')+glob.glob(root+'/*.js')+glob.glob(root+'/*.css')+[root+'/manifest.json',root+'/sw.js']):
    s=open(f,encoding='utf-8',errors='replace').read()
    name=os.path.basename(f)
    for m in re.finditer(r'''(?:href|src|action|poster)\s*=\s*["']([^"'#?\s<>{}$+]+)(?:[?#][^"']*)?["']''',s):
        u=m.group(1)
        if u.startswith(('http://','https://')): ext.add((u,name)); continue
        if u.startswith(('mailto:','tel:','javascript:','data:','blob:','//','about:')) or not u: continue
        p=os.path.normpath(os.path.join(root,u.lstrip('/').replace('SadoDepo/','',1) if u.startswith('/') else u))
        if not os.path.exists(p): bad.append((name,u))
    # anchors
    for m in re.finditer(r'''https?://[^\s"'<>\\)`]+''',s):
        ext.add((m.group(0).rstrip('.,;'),name))
    if f.endswith('.css') or f.endswith('.html'):
        for m in re.finditer(r'url\(\s*["\']?([^"\')]+)',s):
            u=m.group(1)
            if u.startswith(('data:','http','#')): continue
            p=os.path.normpath(os.path.join(root,u.split('?')[0].split('#')[0]))
            if not os.path.exists(p): bad.append((name,'css url '+u))
print('KIRIK İÇ:',sorted(set(bad)))
# sw.js precache list
s=open(root+'/sw.js').read()
for m in re.finditer(r'"(\./[^"]+|[a-z0-9_/.-]+\.(?:html|js|css|png|jpg|json|woff2))"',s):
    u=m.group(1)
    if not os.path.exists(os.path.join(root,u.split('?')[0])): print('SW eksik:',u)
d={}
for u,n in ext: d.setdefault(u,set()).add(n)
json.dump({u:sorted(n) for u,n in d.items()},open('ext.json','w'),indent=0)  # dış adres listesi çalışılan klasöre
print(len(d),'dış URL')
import collections
print(collections.Counter(re.sub(r'https?://([^/]+).*',r'\1',u) for u in d).most_common(80))
print('http:',[u for u in d if u.startswith('http://')][:20])
