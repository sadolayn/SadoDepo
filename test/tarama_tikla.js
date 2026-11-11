// Site taraması (tıklama): her sayfadaki görünür düğme, sekme ve açılır başlıklara tek tek tıklar; JS hatası ve yatay taşma arar.
// Kullanım (yerel sunucu 8765'te açıkken): node test/tarama_tikla.js tel|pc|genis  → yalnızca sorunlu sayfaları yazar, sonda "bitti".
const { chromium } = require('playwright'); const fs = require('fs');
const pages = fs.readdirSync(require('path').resolve(__dirname, '..')).filter(f => f.endsWith('.html') && !/^(404|acilis|guzel)/.test(f));
(async () => {
  const b = await chromium.launch();
  for (const [vn, w, h] of [['tel', 360, 740], ['pc', 1440, 900], ['genis', 1920, 1080]].filter(x => x[0] === process.argv[2])) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: vn === 'tel', hasTouch: vn === 'tel', locale: 'tr-TR', timezoneId: 'Europe/Istanbul', serviceWorkers: 'block' });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    for (const p of pages) {
      const pg = await ctx.newPage(); const errs = new Set(); const over = new Set(); let n = 0;
      pg.on('pageerror', e => errs.add(e.message.slice(0, 160)));
      pg.on('dialog', d => d.dismiss().catch(() => {}));
      await pg.addInitScript(() => { window.print = () => {}; window.open = () => null; });
      const url = 'http://localhost:8765/' + p;
      await pg.goto(url, { waitUntil: 'load' }); await pg.waitForTimeout(900);
      const count = await pg.locator('button:visible, [role=tab]:visible, summary:visible').count();
      for (let i = 0; i < Math.min(count, 45); i++) {
        try {
          if (!pg.url().startsWith(url.split('#')[0])) { await pg.goto(url); await pg.waitForTimeout(500); }
          const el = pg.locator('button:visible, [role=tab]:visible, summary:visible').nth(i);
          const lbl = ((await el.textContent({ timeout: 500 })) || '').trim().slice(0, 18);
          await el.click({ timeout: 700, force: false }); n++;
          await pg.waitForTimeout(120);
          const o = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          if (o > 2) over.add(lbl + ':' + o);
        } catch (e) {}
      }
      if (errs.size || over.size) console.log(vn, p, 'tık', n, errs.size ? 'ERR ' + [...errs].join(' | ') : '', over.size ? 'TAŞMA ' + [...over].slice(0, 6).join(', ') : '');
      await pg.close();
    }
    await ctx.close();
  }
  await b.close(); console.log('bitti');
})();
