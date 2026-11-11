// Site taraması (sayfa): her sayfayı verilen ekran boyutunda açar; JS hatası, kırık dosya, yatay taşma, küçük yazı, küçük dokunma alanı, etiketsiz giriş arar.
// Kullanım (depo kökünde `python3 -m http.server 8765` açıkken, geçici bir klasörden): node test/tarama_sayfa.js tel|kucuk|fold|pc|genis  → sonuc-<boyut>.json
// Ekran görüntüleri ve sonuç dosyaları çalışılan klasöre yazılır; depoya eklenmez.
const { chromium } = require('playwright');
const fs = require('fs');
const pages = fs.readdirSync(require('path').resolve(__dirname, '..')).filter(f => f.endsWith('.html'));
const VPS = { tel: [390, 800, 2], kucuk: [320, 640, 1], fold: [768, 900, 1], pc: [1440, 900, 1], genis: [1920, 1080, 1] };
(async () => {
  const b = await chromium.launch();
  const out = {};
  for (const [vn, [w, h, dsf]] of Object.entries(VPS).filter(([k]) => k === process.argv[2])) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: vn === 'kucuk' || vn==='fold' ? 1 : 1, isMobile: vn !== 'pc', hasTouch: vn !== 'pc', locale: 'tr-TR', timezoneId: 'Europe/Istanbul', serviceWorkers: 'block' });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    for (const p of pages) {
      const pg = await ctx.newPage();
      const rec = { err: [], notfound: [] };
      pg.on('pageerror', e => rec.err.push('PE: ' + e.message.slice(0, 200)));
      pg.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) rec.err.push('CE: ' + m.text().slice(0, 200)); });
      pg.on('response', r => { if (r.url().includes('localhost') && r.status() >= 400) rec.notfound.push(r.status() + ' ' + r.url().replace('http://localhost:8765/', '')); });
      try {
        await pg.goto('http://localhost:8765/' + p, { waitUntil: 'load', timeout: 20000 });
        await pg.waitForTimeout(1200);
        rec.m = await pg.evaluate(() => {
          const vw = innerWidth, r = {};
          r.sw = document.documentElement.scrollWidth; r.vw = vw;
          r.lang = document.documentElement.lang; r.title = document.title;
          r.viewport = (document.querySelector('meta[name=viewport]') || {}).content || null;
          r.desc = !!document.querySelector('meta[name=description]');
          const vis = el => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
          const sel = el => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''));
          const over = [], small = {}, tap = [], noalt = [], nolabel = [];
          for (const el of document.querySelectorAll('body *')) {
            if (!vis(el)) continue;
            const b = el.getBoundingClientRect();
            if (b.right > vw + 2 && b.left < vw && over.length < 8) {
              // skip if inside horizontally scrollable ancestor
              let a = el.parentElement, sc = false;
              while (a && a !== document.body) { const s = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(s.overflowX)) { sc = true; break; } a = a.parentElement; }
              if (!sc) over.push(sel(el) + ' r=' + Math.round(b.right));
            }
            const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
            if (own) { const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 11) { const k = sel(el) + ' ' + fs; small[k] = (small[k] || 0) + 1; } }
            if (/^(A|BUTTON|INPUT|SELECT)$/.test(el.tagName) && (b.width < 24 || b.height < 24) && el.type !== 'hidden' && tap.length < 10) {
              if (!(el.tagName==='A' && getComputedStyle(el).display==='inline')) tap.push(sel(el) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height));
            }
            if (el.tagName === 'IMG' && !el.hasAttribute('alt')) noalt.push(sel(el));
            if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && el.type !== 'hidden' && !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.title) nolabel.push(sel(el));
            if (el.tagName === 'BUTTON' && !el.textContent.trim() && !el.getAttribute('aria-label') && !el.title) nolabel.push('btn:' + sel(el));
          }
          r.over = over; r.small = Object.entries(small).slice(0, 8); r.tap = tap; r.noalt = noalt.slice(0, 5); r.nolabel = nolabel.slice(0, 6);
          r.blank = [...document.querySelectorAll('a[target=_blank]')].filter(a => !/noopener|noreferrer/.test(a.rel)).length;
          r.h1 = document.querySelectorAll('h1').length;
          return r;
        });
        if (vn === 'tel' || vn === 'pc' || vn === 'genis') await pg.screenshot({ path: `${vn}-${p.replace('.html', '')}.png`, fullPage: false });
      } catch (e) { rec.err.push('NAV: ' + e.message.slice(0, 150)); }
      out[vn + ' ' + p] = rec;
      await pg.close();
    }
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync('sonuc-' + process.argv[2] + '.json', JSON.stringify(out, null, 1));
})();
