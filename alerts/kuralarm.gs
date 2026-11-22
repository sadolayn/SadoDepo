/*
 * Düzeltme 6 — kuralarm.gs: 🔔 Fiyat alarmı (22 Kasım 2026)
 * Dosya listesinde EN ALTTA olmalı (Code, duzelt, abonelik'ten sonra); aynı adlı doGet ve doPost'un yerine bunlar çalışır.
 * Not: Telefonda yapıştırırken satır sonları kaybolsa da çalışır (tek satırlık açıklama işareti kullanılmadı).
 *
 * Ne yapar: Sitedeki Döviz & Emtia sayfasında kurulan alarmlar (ör. "Dolar 51 TL'nin üstüne çıkınca") burada saklanır.
 * Saatte bir sitenin data/piyasa.json dosyasına bakılır; seviye gelince o telefona bildirim gider. Her alarm bir kez çalar.
 * Saklanan yalnızca: bildirim anahtarı, varlık, yön, seviye, tarih. Ad, e-posta ya da konum yok.
 *
 * Kurulum (bir kez, ~3 dk): Dosyalar ＋ → Komut dosyası → adı "kuralarm" → bu içeriği yapıştır → Kaydet
 * → işlev listesinden kurAlarmKur → Çalıştır (izin isterse ver)
 * → Dağıt → Dağıtımları yönet → ✏️ → Sürüm: Yeni sürüm → Dağıt. Adres değişmez. Kontrol: …/exec açılınca "v":6.
 */
const KA = {
  COLS: ['token', 'k', 'y', 'e', 'created', 'fired', 'deger'],
  PER: 6,          /* telefon başına en fazla alarm */
  MAX_ROWS: 3000,  /* tablo üst sınırı */
  DAILY_NEW: 300,  /* günde en fazla yeni telefon */
  VAR: { usd: ['💵', 'Dolar', 'TL', 4], eur: ['💶', 'Euro', 'TL', 4], gbp: ['💷', 'Sterlin', 'TL', 4], xau: ['🥇', 'Gram altın', 'TL', 2], xag: ['🥈', 'Gram gümüş', 'TL', 2], brent: ['🛢️', 'Brent petrol', 'TL/varil', 0] }
};

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'preview') return json_(preview_(p.q || ''));
  if (p.action === 'confirm') return page_(confirm_(p.t || ''));
  if (p.action === 'unsub') return page_(unsub_(p.t || ''));
  if (p.action === 'count') return json_(count_());
  if (p.action === 'status') return json_(status_(p.s || ''));
  return json_({ ok: true, name: CFG.NAME, v: 6 });
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents || '{}'); } catch (err) { return json_({ ok: false, msg: 'Geçersiz istek.' }); }
  if (body.action === 'subscribe') return json_(subscribe_(body));
  if (body.action === 'push_sub') return json_(pushSub_(body));
  if (body.action === 'push_unsub') return json_(pushUnsub_(body));
  if (body.action === 'push_test') return json_(pushTest_(body));
  if (body.action === 'alarm_set') return json_(alarmSet_(body));
  if (body.action === 'alarm_list') return json_(alarmList_(body));
  return json_({ ok: false, msg: 'Bilinmeyen işlem.' });
}

function kaSheet_() {
  const ss = sheet_().getParent();
  let sh = ss.getSheetByName('KurAlarm');
  if (!sh) { sh = ss.insertSheet('KurAlarm'); sh.appendRow(KA.COLS); sh.setFrozenRows(1); }
  return sh;
}

function kaTemiz_(L) {
  if (!Array.isArray(L)) return [];
  const out = [], seen = {};
  for (let i = 0; i < L.length && out.length < KA.PER; i++) {
    const a = L[i] || {}, k = String(a.k || ''), y = a.y === 'alt' ? 'alt' : (a.y === 'ust' ? 'ust' : ''), e = Number(a.e);
    if (!KA.VAR[k] || !y || !(e > 0) || !isFinite(e) || e > 1e7) continue;
    const key = k + '|' + y + '|' + e;
    if (seen[key]) continue;
    seen[key] = 1;
    out.push({ k: k, y: y, e: e });
  }
  return out;
}

/* Telefonun bekleyen alarmlarını verilen listeyle değiştirir; çalmış olanlar (7 gün) listede kalır ve yeniden kurulmaz. */
function alarmSet_(b) {
  const token = cleanToken_(b.token);
  if (!token) return { ok: false, msg: 'Bildirim kaydı geçersiz, sayfayı yenileyip tekrar dene.' };
  const L = kaTemiz_(b.alarms);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = kaSheet_(), data = sh.getDataRange().getValues(), calmis = {}, sil = [];
    let vardi = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] !== token) continue;
      vardi = true;
      if (data[i][5]) calmis[data[i][1] + '|' + data[i][2] + '|' + Number(data[i][3])] = 1;
      else sil.push(i + 1);
    }
    if (!vardi && L.length) {
      if (data.length - 1 + L.length > KA.MAX_ROWS) return { ok: false, msg: 'Şu an yeni alarm alınamıyor (kapasite dolu).' };
      const props = PropertiesService.getScriptProperties();
      const dayKey = 'kanew_' + Utilities.formatDate(new Date(), CFG.TZ, 'yyyyMMdd');
      const today = Number(props.getProperty(dayKey) || 0);
      if (today >= KA.DAILY_NEW) return { ok: false, msg: 'Bugünlük alarm kotası doldu, yarın tekrar dene.' };
      props.setProperty(dayKey, String(today + 1));
    }
    sil.sort(function (a, c) { return c - a; }).forEach(function (r) { sh.deleteRow(r); });
    const now = new Date(), rows = L.filter(function (a) { return !calmis[a.k + '|' + a.y + '|' + a.e]; }).map(function (a) { return [token, a.k, a.y, a.e, now, '', '']; });
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, KA.COLS.length).setValues(rows);
    return { ok: true, n: rows.length };
  } finally { lock.releaseLock(); }
}

function alarmList_(b) {
  const token = cleanToken_(b.token);
  if (!token) return { ok: false };
  const data = kaSheet_().getDataRange().getValues(), out = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] !== token) continue;
    out.push({ k: data[i][1], y: data[i][2], e: Number(data[i][3]), fired: data[i][5] ? new Date(data[i][5]).toISOString() : '', deger: data[i][6] === '' ? null : Number(data[i][6]) });
  }
  return { ok: true, alarms: out };
}

function kaSayi_(x, d) {
  const s = Number(x).toFixed(d).split('.');
  const tam = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return d ? tam + ',' + s[1] : tam;
}

function kaReq_(token, title, body, tag, url) {
  return {
    url: fcmUrl_(), method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + fcmAccess_() },
    payload: JSON.stringify({ message: {
      token: token,
      data: { title: title, body: body, url: url, tag: 'sadolayn-' + tag },
      webpush: { headers: { TTL: '43200', Urgency: 'high' }, notification: { title: title, body: body, icon: CFG.SITE + 'img/icon.png' }, fcm_options: { link: url } }
    } })
  };
}

/* Saatte bir: sitenin piyasa verisine bak, seviyesi gelen alarmları gönder */
function kurAlarmTara() {
  if (!PropertiesService.getScriptProperties().getProperty('FCM_SA')) return;
  let P = null;
  try {
    const r = UrlFetchApp.fetch(CFG.SITE + 'data/piyasa.json?t=' + Date.now(), { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) { Logger.log('piyasa.json alınamadı: ' + r.getResponseCode()); return; }
    P = JSON.parse(r.getContentText());
  } catch (err) { Logger.log('piyasa.json okunamadı: ' + err); return; }
  const son = function (k) { const a = P[k]; if (!Array.isArray(a)) return null; for (let i = a.length - 1; i >= 0; i--) if (typeof a[i] === 'number' && a[i] > 0) return a[i]; return null; };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = kaSheet_(), data = sh.getDataRange().getValues(), now = new Date(), jobs = [], sil = {}, gitti = {};
    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      if (r[5]) { if (now - new Date(r[5]) > 7 * 864e5) sil[i + 1] = 1; continue; }
      const v = KA.VAR[r[1]], s = son(r[1]), e = Number(r[3]);
      if (!v || s == null || !(e > 0) || !r[0]) continue;
      if (!((r[2] === 'ust' && s >= e) || (r[2] === 'alt' && s <= e))) continue;
      const title = v[0] + ' ' + v[1] + ' ' + kaSayi_(e, e % 1 === 0 ? 0 : Math.min(v[3], 2)) + ' ' + v[2] + (r[2] === 'ust' ? ' seviyesinin üstüne çıktı' : ' seviyesinin altına indi');
      const body = 'Şu an ' + kaSayi_(s, v[3]) + ' ' + v[2] + ' · Sadolayn fiyat alarmı. Banka kurları farklı olabilir.';
      jobs.push({ row: i + 1, token: r[0], s: s, req: kaReq_(r[0], title, body, 'alarm-' + r[1], CFG.SITE + 'piyasa.html#alarm') });
    }
    for (let k = 0; k < jobs.length; k += 50) {
      const part = jobs.slice(k, k + 50), res = UrlFetchApp.fetchAll(part.map(function (j) { return j.req; }));
      res.forEach(function (r, n) {
        const code = r.getResponseCode(), txt = r.getContentText();
        if (code === 200) sh.getRange(part[n].row, 6, 1, 2).setValues([[now, part[n].s]]);
        else if (code === 404 || /UNREGISTERED/.test(txt)) gitti[part[n].token] = 1;
        else Logger.log('Alarm bildirimi hatası ' + code + ': ' + txt.slice(0, 300));
      });
    }
    if (Object.keys(gitti).length) for (let i = 1; i < data.length; i++) if (gitti[data[i][0]]) sil[i + 1] = 1;
    Object.keys(sil).map(Number).sort(function (a, c) { return c - a; }).forEach(function (r) { sh.deleteRow(r); });
    Logger.log('Fiyat alarmı: ' + jobs.length + ' gönderim denendi, ' + Object.keys(sil).length + ' satır temizlendi.');
  } finally { lock.releaseLock(); }
}

/* Kurulumdan sonra bir kez çalıştır: saatlik kontrolü kurar ve tabloyu açar */
function kurAlarmKur() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'kurAlarmTara') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('kurAlarmTara').timeBased().everyHours(1).create();
  kaSheet_();
  Logger.log('✅ Fiyat alarmı kuruldu: saatte bir kontrol edilir. Alarmlar tablodaki "KurAlarm" sayfasında.');
}
