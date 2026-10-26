/*
 * Sadolayn Alerts — Google Apps Script arka ucu
 * ------------------------------------------------------------
 * Görevleri:
 *   - Siteden gelen abonelik isteklerini kaydeder (Google E-Tablo)
 *   - Onay e-postası gönderir (çift onay: başkası adına abonelik olmaz)
 *   - Her sabah 10:00 (İstanbul) Google Haberler'den anahtar kelimelere
 *     uyan son 24 saatin haberlerini toplar ve özet e-posta gönderir
 *   - Her e-postada "abonelikten çık" bağlantısı bulunur
 *   - Bildirim açan telefonlara aynı saatte Firebase Cloud Messaging ile
 *     bildirim gönderir (e-posta gerekmez; telefon kendi kelimeleriyle kayıtlı)
 *
 * Kurulum: alerts/KURULUM.md
 */

const CFG = {
  NAME: 'Sadolayn Alerts',
  SITE: 'https://sadolayn.github.io/SadoDepo/',
  PAGE: 'https://sadolayn.github.io/SadoDepo/alerts.html',
  MAX_KEYWORDS: 10,       /* abone başına en fazla kelime */
  PER_KEYWORD: 5,         /* e-postada kelime başına en fazla haber */
  MAX_SUBS: 80,           /* Gmail günlük gönderim kotası (100) için üst sınır */
  DAILY_SIGNUP_LIMIT: 30, /* günde en fazla yeni onay e-postası */
  CONFIRM_COOLDOWN_MIN: 10,
  HOUR: 10,
  MAX_PUSH: 500,          /* en fazla bildirim kayıtlı telefon */
  DAILY_PUSH_SIGNUP: 150, /* günde en fazla yeni telefon kaydı */
  TZ: 'Europe/Istanbul'
};

const COLS = ['email', 'keywords', 'pendingKw', 'ctoken', 'utoken', 'status', 'created', 'lastConfirmMail', 'lastSent'];
const C = Object.fromEntries(COLS.map((c, i) => [c, i]));
const PCOLS = ['token', 'keywords', 'os', 'created', 'lastSent', 'lastTest'];
const PC = Object.fromEntries(PCOLS.map((c, i) => [c, i]));

/* ---------- Kurulum ---------- */

function setup() {
  const sh = sheet_();
  Logger.log('Tablo hazır: ' + sh.getParent().getUrl());
  installTrigger();
  Logger.log('Günlük tetikleyici kuruldu (' + CFG.HOUR + ':00 ' + CFG.TZ + ').');
}

function installTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'dailyDigest')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyDigest')
    .timeBased().atHour(CFG.HOUR).nearMinute(0).everyDays(1)
    .inTimezone(CFG.TZ).create();
}

function sheet_() {
  const props = PropertiesService.getScriptProperties();
  let ss = null;
  const id = props.getProperty('SS');
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) ss = SpreadsheetApp.create('Sadolayn Alerts — Aboneler');
  props.setProperty('SS', ss.getId());
  let sh = ss.getSheetByName('Aboneler');
  if (!sh) {
    sh = ss.insertSheet('Aboneler');
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function execUrl_() {
  return PropertiesService.getScriptProperties().getProperty('URL') || ScriptApp.getService().getUrl();
}

/* ---------- Web uç noktaları ---------- */

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'preview') return json_(preview_(p.q || ''));
  if (p.action === 'confirm') return page_(confirm_(p.t || ''));
  if (p.action === 'unsub') return page_(unsub_(p.t || ''));
  if (p.action === 'count') return json_(count_());
  return json_({ ok: true, name: CFG.NAME });
}

/* Sitedeki "kalan yer" sayacı için: yalnızca sayılar döner, e-posta ya da kelime dönmez */
function count_() {
  const c = CacheService.getScriptCache(), k = 'count_v1', hit = c.get(k);
  if (hit) return JSON.parse(hit);
  const data = sheet_().getDataRange().getValues().slice(1);
  const active = data.filter(r => r[C.status] === 'active').length;
  const o = { ok: true, active: active, max: CFG.MAX_SUBS, left: Math.max(0, CFG.MAX_SUBS - active) };
  c.put(k, JSON.stringify(o), 120);
  return o;
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents || '{}'); } catch (err) { return json_({ ok: false, msg: 'Geçersiz istek.' }); }
  if (body.action === 'subscribe') return json_(subscribe_(body));
  if (body.action === 'push_sub') return json_(pushSub_(body));
  if (body.action === 'push_unsub') return json_(pushUnsub_(body));
  if (body.action === 'push_test') return json_(pushTest_(body));
  return json_({ ok: false, msg: 'Bilinmeyen işlem.' });
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function page_(r) {
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${CFG.NAME}</title></head>
<body style="margin:0;background:#000;color:#f2f2f2;font-family:system-ui,-apple-system,Segoe UI,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px">
<div style="max-width:420px;width:100%;background:#0d0d0d;border:1px solid #262626;border-radius:18px;padding:24px;text-align:center">
<div style="font-size:42px">${r.ok ? '✅' : '⚠️'}</div>
<h2 style="color:#e0a24f;margin:8px 0">${esc_(r.title)}</h2>
<p style="color:#bdbdbd;line-height:1.5">${esc_(r.msg)}</p>
<a href="${CFG.PAGE}" target="_top" style="display:inline-block;margin-top:10px;padding:12px 18px;border-radius:12px;background:#e0a24f;color:#000;font-weight:700;text-decoration:none">Sadolayn Alerts'e dön</a>
</div></body></html>`;
  return HtmlService.createHtmlOutput(html).setTitle(CFG.NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ---------- Abonelik ---------- */

function cleanKeywords_(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = {};
  return arr.map(k => String(k || '').replace(/\s+/g, ' ').trim())
    .filter(k => k.length >= 2 && k.length <= 60)
    .filter(k => { const l = k.toLocaleLowerCase('tr'); if (seen[l]) return false; seen[l] = 1; return true; })
    .slice(0, CFG.MAX_KEYWORDS);
}

function subscribe_(b) {
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120)
    return { ok: false, msg: 'Geçerli bir e-posta adresi gir.' };
  if (isIs_(email)) return { ok: false, msg: 'İş e-posta adresi kabul edilmiyor; kişisel e-posta adresini yaz.' };
  const kws = cleanKeywords_(b.keywords);
  if (!kws.length) return { ok: false, msg: 'En az bir anahtar kelime ekle.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties();
    const dayKey = 'signups_' + Utilities.formatDate(new Date(), CFG.TZ, 'yyyyMMdd');
    const today = Number(props.getProperty(dayKey) || 0);
    if (today >= CFG.DAILY_SIGNUP_LIMIT) return { ok: false, msg: 'Bugünlük abonelik kotası doldu, yarın tekrar dene.' };

    const sh = sheet_();
    const data = sh.getDataRange().getValues();
    let rowIdx = -1;
    for (let i = 1; i < data.length; i++) if (data[i][C.email] === email) { rowIdx = i; break; }

    const now = new Date();
    const ctoken = Utilities.getUuid();
    if (rowIdx === -1) {
      const active = data.slice(1).filter(r => r[C.status] === 'active').length;
      if (active >= CFG.MAX_SUBS) return { ok: false, msg: 'Şu an yeni abone alınamıyor (kapasite dolu).' };
      const row = new Array(COLS.length).fill('');
      row[C.email] = email;
      row[C.pendingKw] = kws.join(' | ');
      row[C.ctoken] = ctoken;
      row[C.utoken] = Utilities.getUuid();
      row[C.status] = 'pending';
      row[C.created] = now;
      row[C.lastConfirmMail] = now;
      sh.appendRow(row);
    } else {
      const last = data[rowIdx][C.lastConfirmMail];
      if (last && (now - new Date(last)) < CFG.CONFIRM_COOLDOWN_MIN * 60000)
        return { ok: false, msg: 'Az önce onay e-postası gönderildi. Gelen kutunu (ve spam klasörünü) kontrol et.' };
      const r = rowIdx + 1;
      sh.getRange(r, C.pendingKw + 1).setValue(kws.join(' | '));
      sh.getRange(r, C.ctoken + 1).setValue(ctoken);
      sh.getRange(r, C.lastConfirmMail + 1).setValue(now);
      if (data[rowIdx][C.status] !== 'active') sh.getRange(r, C.status + 1).setValue('pending');
    }

    const link = execUrl_() + '?action=confirm&t=' + ctoken;
    MailApp.sendEmail({
      to: email,
      name: CFG.NAME,
      subject: CFG.NAME + ' · aboneliğini onayla',
      htmlBody: confirmMail_(kws, link)
    });
    props.setProperty(dayKey, String(today + 1));
    return { ok: true, msg: 'Onay e-postası gönderildi. E-postadaki bağlantıya tıklayınca bülten başlar.' };
  } finally {
    lock.releaseLock();
  }
}

function findBy_(col, val) {
  if (!val || val.length < 20) return null;
  const sh = sheet_();
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) if (data[i][col] === val) return { sh, row: i + 1, rec: data[i] };
  return null;
}

function confirm_(t) {
  const f = findBy_(C.ctoken, t);
  if (!f) return { ok: false, title: 'Bağlantı geçersiz', msg: 'Bu onay bağlantısı kullanılmış ya da süresi geçmiş olabilir.' };
  f.sh.getRange(f.row, C.keywords + 1).setValue(f.rec[C.pendingKw]);
  f.sh.getRange(f.row, C.pendingKw + 1).setValue('');
  f.sh.getRange(f.row, C.ctoken + 1).setValue('');
  f.sh.getRange(f.row, C.status + 1).setValue('active');
  return { ok: true, title: 'Abonelik onaylandı', msg: 'Takip ettiğin kelimeler: ' + f.rec[C.pendingKw] + '. Her sabah 10:00 civarı haber özetin gelecek.' };
}

function unsub_(t) {
  const f = findBy_(C.utoken, t);
  if (!f) return { ok: false, title: 'Bağlantı geçersiz', msg: 'Abonelik bulunamadı.' };
  f.sh.getRange(f.row, C.status + 1).setValue('unsub');
  return { ok: true, title: 'Abonelikten çıkıldı', msg: 'Artık e-posta almayacaksın. İstersen sayfadan yeniden abone olabilirsin.' };
}

/* ---------- Haberler ---------- */

/* Haber çekme. Anahtar kelime başına Google Haberler RSS; sonuç 30 dk önbellekte tutulur. */
function nKey_(kw) { return 'n_' + Utilities.base64EncodeWebSafe(Utilities.newBlob(kw.toLocaleLowerCase('tr')).getBytes()).slice(0, 200); }
function nUrl_(kw) { return 'https://news.google.com/rss/search?q=' + encodeURIComponent(kw + ' when:1d') + '&hl=tr&gl=TR&ceid=TR:tr'; }
function nParse_(res) {
  let items = [];
  try {
    if (res && res.getResponseCode() === 200) {
      const ch = XmlService.parse(res.getContentText()).getRootElement().getChild('channel');
      const limit = Date.now() - 26 * 3600 * 1000;
      items = ch.getChildren('item').map(it => {
        const srcEl = it.getChild('source');
        const source = srcEl ? srcEl.getText() : '';
        let title = it.getChildText('title') || '';
        if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
        const d = new Date(it.getChildText('pubDate'));
        return { title, source, link: it.getChildText('link'), ts: d.getTime() };
      }).filter(x => x.title && x.link && !isNaN(x.ts) && x.ts >= limit)
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 10);
    }
  } catch (e) { items = []; }
  return items;
}
function fetchNews_(kw) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(nKey_(kw));
  if (hit) return JSON.parse(hit);
  let items = [];
  try { items = nParse_(UrlFetchApp.fetch(nUrl_(kw), { muteHttpExceptions: true })); } catch (e) { items = []; }
  try { cache.put(nKey_(kw), JSON.stringify(items), 1800); } catch (e) {}
  return items;
}
/* Birçok kelimeyi AYNI ANDA çeker (fetchAll), önbelleğe yazar. Sırayla çekmek 6 dakika sınırını aşıyordu (22 Ekim 2026).
   Dönüş: hepsi bitti mi (süre yetmediyse false; kalanlar bir sonraki çalışmada çekilir). */
function nToplu_(kws, bitis) {
  const cache = CacheService.getScriptCache();
  const need = kws.filter(kw => !cache.get(nKey_(kw)));
  for (let i = 0; i < need.length; i += 10) {
    if (Date.now() > bitis) return false;
    const part = need.slice(i, i + 10);
    let res = [];
    try { res = UrlFetchApp.fetchAll(part.map(kw => ({ url: nUrl_(kw), muteHttpExceptions: true }))); }
    catch (e) { Logger.log('Toplu çekme hatası: ' + e); continue; }
    res.forEach((r, n) => { try { cache.put(nKey_(part[n]), JSON.stringify(nParse_(r)), 1800); } catch (e) {} });
  }
  return true;
}

function preview_(q) {
  const kws = cleanKeywords_(String(q).split(','));
  if (!kws.length) return { ok: false, msg: 'Kelime yok.' };
  return { ok: true, results: kws.map(kw => ({ kw, items: fetchNews_(kw).slice(0, CFG.PER_KEYWORD) })) };
}

/* ---------- İş e-posta adresleri ---------- */
/* Kurumsal (@isbank.com.tr) adreslere bülten gönderilmez; yeni kayıt da alınmaz. */
function isIs_(e) { return /@isbank\.com\.tr$/i.test(String(e || '').trim()); }

/* TEK SEFERLİK: tablodaki @isbank.com.tr abonelere kısa bir bilgi e-postası gönderir ve onları siler. */
/* Apps Script'te bir kez çalıştır (üst menüden isAdresleriniTemizle seç > Çalıştır). Günlük kayıtta kaç kişi silindiği yazar. */
function isAdresleriniTemizle() {
  const sh = sheet_();
  const data = sh.getDataRange().getValues();
  let silinen = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    const e = data[i][C.email];
    if (!isIs_(e)) continue;
    if (data[i][C.status] === 'active') {
      try {
        MailApp.sendEmail({
          to: e, name: CFG.NAME,
          subject: CFG.NAME + ' · iş e-posta adresleri artık kullanılmıyor',
          htmlBody: shell_('<p>Merhaba,</p><p>Sadolayn Alerts kişisel bir hobi projesidir; bu nedenle kurumsal e-posta adreslerine gönderimi sonlandırdık ve bu adresin kaydını sildik.</p>' +
            '<p>Haber özetini almaya devam etmek istersen <a href="' + CFG.PAGE + '">' + CFG.PAGE + '</a> adresinden <b>kişisel e-posta adresinle</b> yeniden abone olabilirsin; ya da aynı sayfada e-posta vermeden <b>telefon bildirimi</b> açabilirsin.</p><p>İlgin için teşekkürler 🙂</p>', '')
        });
      } catch (err) { Logger.log('Bilgi e-postası gönderilemedi: ' + e + ' — ' + err); }
    }
    sh.deleteRow(i + 1);
    silinen++;
  }
  Logger.log(silinen + ' iş adresi silindi.');
}

/* ---------- Günlük özet ---------- */

function dailyDigest() {
  /* Apps Script tek çalıştırmada en fazla 6 dakika çalışır. Abone ve haber sayısı artınca liste yarıda */
  /* kesiliyordu (22 Ekim 2026: 17 aboneden 10'una gitti). Artık ~4,5 dakikada durup 1 dakika sonra */
  /* kaldığı yerden devam ediyor; bugün e-posta gönderilmiş aboneler atlanıyor, kimseye iki kez gitmiyor. */
  const t0 = Date.now(), SURE = 4.5 * 60 * 1000;
  const sh = sheet_();
  const data = sh.getDataRange().getValues();
  /* Ay adı Türkçe (formatDate 'MMMM' İngilizce veriyordu: "26 October 2026") */
  const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const gun = Utilities.formatDate(new Date(), CFG.TZ, 'd/M/yyyy').split('/');
  const dateStr = gun[0] + ' ' + AY[Number(gun[1]) - 1] + ' ' + gun[2];
  const bugun = Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd');
  const gonderildi = v => v && Utilities.formatDate(new Date(v), CFG.TZ, 'yyyy-MM-dd') === bugun;
  const memo = {};
  const news = kw => (memo[kw] = memo[kw] || fetchNews_(kw));
  const bekleyen = r => r[C.status] === 'active' && r[C.keywords] && !isIs_(r[C.email]) && !gonderildi(r[C.lastSent]);

  /* Önce bekleyen tüm abonelerin kelimelerini aynı anda çek (önbelleğe); sonra e-postalar hızlı gider */
  const tum = {};
  data.slice(1).filter(bekleyen).forEach(r => String(r[C.keywords]).split(' | ').filter(Boolean).forEach(kw => (tum[kw] = 1)));
  if (!nToplu_(Object.keys(tum), t0 + SURE)) { devamKur_(); Logger.log('Haber çekme sürdü; 1 dakika sonra kaldığı yerden devam.'); return; }

  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!bekleyen(r)) continue; /* bugün zaten gitti (devam çalışması ya da elle yeniden çalıştırma) */
    if (MailApp.getRemainingDailyQuota() < 1) continue;
    if (Date.now() - t0 > SURE) { devamKur_(); Logger.log('Süre doluyor; kalanlar 1 dakika sonra gönderilecek.'); return; }

    const kws = String(r[C.keywords]).split(' | ').filter(Boolean);
    const used = {};
    const sections = kws.map(kw => ({
      kw,
      items: news(kw).filter(x => !used[x.link] && (used[x.link] = 1)).slice(0, CFG.PER_KEYWORD)
    }));
    const total = sections.reduce((s, x) => s + x.items.length, 0);
    if (!total) continue; /* Google Alerts gibi: haber yoksa e-posta yok */

    const unsub = execUrl_() + '?action=unsub&t=' + r[C.utoken];
    try {
      MailApp.sendEmail({
        to: r[C.email],
        name: CFG.NAME,
        subject: CFG.NAME + ' · ' + dateStr + ' · ' + total + ' haber',
        htmlBody: digestMail_(sections, dateStr, unsub)
      });
      sh.getRange(i + 1, C.lastSent + 1).setValue(new Date());
    } catch (e) {
      Logger.log('Gönderilemedi: ' + r[C.email] + ' — ' + e);
    }
  }
  /* Telefon bildirimleri günde bir kez (devam çalışmalarında tekrar gitmesin) */
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('PUSH_GUN') !== bugun) {
    props.setProperty('PUSH_GUN', bugun);
    try { pushDigest_(news); } catch (e) { Logger.log('Bildirimler gönderilemedi: ' + e); }
  }
}

/* Süre dolunca: 1 dakika sonra kaldığı yerden devam eden tek seferlik tetikleyici */
function devamKur_() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'dailyDigestDevam').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyDigestDevam').timeBased().after(60 * 1000).create();
}
function dailyDigestDevam() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'dailyDigestDevam').forEach(t => ScriptApp.deleteTrigger(t));
  dailyDigest();
}


/* ---------- Telefon bildirimleri (Firebase Cloud Messaging) ----------
 * Kurulum: Firebase hizmet hesabı JSON'unu Apps Script > Proje Ayarları > Komut dosyası özellikleri'ne
 * FCM_SA adıyla yapıştır. Bu anahtar yalnızca burada durur; sitede ya da GitHub'da yer almaz.
 */

function pushSheet_() {
  const ss = sheet_().getParent();
  let sh = ss.getSheetByName('Bildirim');
  if (!sh) { sh = ss.insertSheet('Bildirim'); sh.appendRow(PCOLS); sh.setFrozenRows(1); }
  return sh;
}

function cleanToken_(t) {
  t = String(t || '').trim();
  return /^[\w:\-]{100,400}$/.test(t) ? t : '';
}

function pushSub_(b) {
  const token = cleanToken_(b.token);
  if (!token) return { ok: false, msg: 'Bildirim kaydı geçersiz, sayfayı yenileyip tekrar dene.' };
  const kws = cleanKeywords_(b.keywords);
  if (!kws.length) return { ok: false, msg: 'En az bir anahtar kelime ekle.' };
  const os = ['ios', 'android', 'diger'].indexOf(b.os) >= 0 ? b.os : 'diger';
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = pushSheet_(), data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) if (data[i][PC.token] === token) {
      sh.getRange(i + 1, PC.keywords + 1, 1, 2).setValues([[kws.join(' | '), os]]);
      return { ok: true, msg: 'Güncellendi.' };
    }
    if (data.length - 1 >= CFG.MAX_PUSH) return { ok: false, msg: 'Şu an yeni bildirim kaydı alınamıyor (kapasite dolu).' };
    const props = PropertiesService.getScriptProperties();
    const dayKey = 'pushsub_' + Utilities.formatDate(new Date(), CFG.TZ, 'yyyyMMdd');
    const today = Number(props.getProperty(dayKey) || 0);
    if (today >= CFG.DAILY_PUSH_SIGNUP) return { ok: false, msg: 'Bugünlük bildirim kotası doldu, yarın tekrar dene.' };
    const row = new Array(PCOLS.length).fill('');
    row[PC.token] = token; row[PC.keywords] = kws.join(' | '); row[PC.os] = os; row[PC.created] = new Date();
    sh.appendRow(row);
    props.setProperty(dayKey, String(today + 1));
    return { ok: true, msg: 'Bildirimler açıldı.' };
  } finally { lock.releaseLock(); }
}

function pushUnsub_(b) {
  const token = cleanToken_(b.token);
  if (!token) return { ok: false };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = pushSheet_(), data = sh.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) if (data[i][PC.token] === token) sh.deleteRow(i + 1);
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function pushTest_(b) {
  const token = cleanToken_(b.token);
  if (!token) return { ok: false, msg: 'Kayıt bulunamadı.' };
  const sh = pushSheet_(), data = sh.getDataRange().getValues();
  let i = 1; for (; i < data.length; i++) if (data[i][PC.token] === token) break;
  if (i >= data.length) return { ok: false, gone: true, msg: 'Bu telefon kayıtlı değil; bildirimi yeniden aç.' };
  const last = data[i][PC.lastTest];
  if (last && (Date.now() - new Date(last).getTime()) < 60000) return { ok: false, msg: 'Az önce deneme gönderildi, bir dakika sonra tekrar dene.' };
  const kws = String(data[i][PC.keywords]).split(' | ').filter(Boolean);
  sh.getRange(i + 1, PC.lastTest + 1).setValue(new Date());
  const res = UrlFetchApp.fetch(fcmUrl_(), fcmReq_(token, '🔔 Sadolayn Alerts · deneme',
    'Bildirimler çalışıyor ✓ Her sabah 10:00\'da ' + (kws[0] ? '“' + kws[0] + '”' + (kws.length > 1 ? ' ve ' + (kws.length - 1) + ' kelimen daha' : '') : 'kelimelerin') + ' için haber varsa buraya düşecek.', 'test'));
  const code = res.getResponseCode(), txt = res.getContentText();
  if (code === 200) return { ok: true };
  if (code === 404 || /UNREGISTERED/.test(txt)) { sh.deleteRow(i + 1); return { ok: false, gone: true, msg: 'Bu telefonun kaydı geçersiz olmuş; bildirimi yeniden aç.' }; }
  Logger.log('Deneme bildirimi hatası ' + code + ': ' + txt);
  return { ok: false, msg: 'Deneme bildirimi gönderilemedi (' + code + ').' };
}

function fcmSa_() {
  const raw = PropertiesService.getScriptProperties().getProperty('FCM_SA');
  if (!raw) throw new Error('FCM_SA ayarı yok (Firebase hizmet hesabı JSON).');
  return JSON.parse(raw);
}
/* Anahtarın satır sonlarını toparla (kopyalama sırasında \\n'ye dönüşmüş olabilir) */
function pk_(k) {
  k = String(k || '').replace(/\\n/g, '\n');
  const m = k.match(/BEGIN PRIVATE KEY-*([\s\S]*?)-*END PRIVATE KEY/);
  if (!m) return k.replace(/\r/g, '').trim() + '\n';
  const body = m[1].replace(/[^A-Za-z0-9+\/=]/g, '');
  return '-----BEGIN PRIVATE KEY-----\n' + body.match(/.{1,64}/g).join('\n') + '\n-----END PRIVATE KEY-----\n';
}

function fcmUrl_() { return 'https://fcm.googleapis.com/v1/projects/' + fcmSa_().project_id + '/messages:send'; }

/* Hizmet hesabıyla imzalı JWT → 1 saatlik erişim anahtarı (önbellekte tutulur) */
/* E-postadaki görünmez/yanlış karakterleri temizle */
function em_(e) { return String(e || '').normalize('NFKC').replace(/[\u2010-\u2015\u2212]/g, '-').replace(/[^A-Za-z0-9@.\-_]/g, '').toLowerCase(); }

function fcmAccess_() {
  const cache = CacheService.getScriptCache(), hit = cache.get('fcm_at');
  if (hit) return hit;
  const sa = fcmSa_(), now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Utilities.base64EncodeWebSafe(typeof o === 'string' ? o : JSON.stringify(o)).replace(/=+$/, '');
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const claim = b64({ iss: em_(sa.client_email), scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(head + '.' + claim, pk_(sa.private_key))).replace(/=+$/, '');
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: head + '.' + claim + '.' + sig }
  });
  const j = JSON.parse(res.getContentText() || '{}');
  if (!j.access_token) throw new Error('Firebase erişim anahtarı alınamadı: ' + res.getContentText());
  cache.put('fcm_at', j.access_token, 3300);
  return j.access_token;
}

function fcmReq_(token, title, body, tag) {
  const url = CFG.PAGE + '#bugun';
  return {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + fcmAccess_() },
    payload: JSON.stringify({ message: {
      token: token,
      data: { title: title, body: body, url: url, tag: 'sadolayn-' + tag },
      webpush: { headers: { TTL: '43200', Urgency: 'high' }, notification: { title: title, body: body, icon: CFG.SITE + 'img/icon.png' }, fcm_options: { link: url } }
    } })
  };
}

function pushDigest_(news) {
  if (!PropertiesService.getScriptProperties().getProperty('FCM_SA')) return;
  const sh = pushSheet_(), data = sh.getDataRange().getValues();
  const jobs = [];
  for (let i = 1; i < data.length; i++) {
    const kws = String(data[i][PC.keywords] || '').split(' | ').filter(Boolean);
    if (!data[i][PC.token] || !kws.length) continue;
    const used = {};
    const hits = kws.map(kw => ({ kw, items: news(kw).filter(x => !used[x.link] && (used[x.link] = 1)).slice(0, CFG.PER_KEYWORD) })).filter(s => s.items.length);
    const total = hits.reduce((s, x) => s + x.items.length, 0);
    if (!total) continue; /* haber yoksa bildirim yok */
    let body = hits[0].kw + ': ' + hits[0].items[0].title;
    if (body.length > 120) body = body.slice(0, 117) + '…';
    if (hits.length > 1) body += ' · +' + (hits.length - 1) + ' kelimende daha haber var';
    jobs.push({ row: i + 1, req: Object.assign({ url: fcmUrl_() }, fcmReq_(data[i][PC.token], '☀️ Sadolayn Alerts · ' + total + ' haber', body, 'gunluk')) });
  }
  const gone = [], now = new Date();
  for (let k = 0; k < jobs.length; k += 50) {
    const part = jobs.slice(k, k + 50), res = UrlFetchApp.fetchAll(part.map(j => j.req));
    res.forEach((r, n) => {
      const code = r.getResponseCode(), txt = r.getContentText();
      if (code === 200) sh.getRange(part[n].row, PC.lastSent + 1).setValue(now);
      else if (code === 404 || /UNREGISTERED/.test(txt)) gone.push(part[n].row);
      else Logger.log('Bildirim hatası ' + code + ': ' + txt.slice(0, 300));
    });
  }
  gone.sort((a, b) => b - a).forEach(r => sh.deleteRow(r)); /* artık geçersiz telefonları temizle */
  Logger.log('Bildirim: ' + (jobs.length - gone.length) + ' gönderildi, ' + gone.length + ' geçersiz kayıt silindi.');
}

/* Kurulumdan sonra bir kez çalıştır: Firebase bağlantısı tamam mı? */
function testPushSetup() {
  const sa = fcmSa_();
  Logger.log('Hizmet hesabı: ' + sa.client_email + ' · proje: ' + sa.project_id);
  fcmAccess_();
  Logger.log('✅ Firebase erişimi tamam. Bildirim tablosu: ' + pushSheet_().getParent().getUrl());
}

/* ---------- E-posta şablonları ---------- */

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function shell_(inner, footer) {
  return `<div style="background:#f4f1ea;padding:20px 10px;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e0d2">
<div style="background:#111111;padding:18px 22px">
<div style="color:#e0a24f;font-size:20px;font-weight:bold;letter-spacing:1px">🔔 ${CFG.NAME}</div>
<div style="color:#9a9a9a;font-size:12px;margin-top:2px">Bilgi paylaştıkça büyür</div></div>
<div style="padding:18px 22px;color:#222;font-size:15px;line-height:1.5">${inner}</div>
<div style="padding:14px 22px;background:#faf8f3;color:#888;font-size:12px;line-height:1.5;border-top:1px solid #eee">${footer}</div>
</div></div>`;
}

function confirmMail_(kws, link) {
  const chips = kws.map(k => `<span style="display:inline-block;background:#fbf1e1;color:#8a5a14;border:1px solid #ecd3a8;border-radius:20px;padding:4px 10px;margin:2px;font-size:13px">${esc_(k)}</span>`).join(' ');
  return shell_(
    `<p style="margin-top:0">Merhaba,</p>
<p>${CFG.NAME} için abonelik isteği aldık. Takip edilecek kelimeler:</p>
<p>${chips}</p>
<p>Onaylarsan her sabah 10:00 civarı bu kelimelerle ilgili son 24 saatin haber bağlantıları gelecek.</p>
<p style="text-align:center;margin:22px 0"><a href="${link}" style="background:#e0a24f;color:#000;padding:12px 22px;border-radius:10px;font-weight:bold;text-decoration:none">Aboneliği onayla</a></p>`,
    `Bu isteği sen yapmadıysan e-postayı yok sayman yeterli, hiçbir şey gönderilmeyecek.`
  );
}

function digestMail_(sections, dateStr, unsub) {
  let inner = `<div style="color:#888;font-size:13px;margin-bottom:6px">${esc_(dateStr)} · son 24 saat</div>`;
  for (const s of sections) {
    inner += `<h3 style="margin:18px 0 6px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#b8791f;border-bottom:2px solid #f0e2c8;padding-bottom:4px">${esc_(s.kw)}</h3>`;
    if (!s.items.length) { inner += `<div style="color:#999;font-size:13px">Bugün yeni haber yok.</div>`; continue; }
    for (const it of s.items) {
      const t = Utilities.formatDate(new Date(it.ts), CFG.TZ, 'HH:mm');
      inner += `<div style="padding:8px 0;border-bottom:1px solid #f1f1f1">
<a href="${esc_(it.link)}" style="color:#1a2bb8;font-weight:bold;text-decoration:none;font-size:15px">${esc_(it.title)}</a>
<div style="color:#888;font-size:12px;margin-top:2px">${esc_(it.source)} · ${t}</div></div>`;
    }
  }
  return shell_(inner,
    `Kaynak: Google Haberler (Türkçe). Başlıklar ilgili haber sitelerine aittir.<br>
<a href="${CFG.PAGE}" style="color:#b8791f">Kelimelerini değiştir</a> · <a href="${unsub}" style="color:#b8791f">Abonelikten çık</a><br>
© ${new Date().getFullYear()} Sadolayn`);
}

/* ---------- Test ---------- */

function testPreview() { Logger.log(JSON.stringify(preview_('iş bankası, yapay zeka'), null, 1)); }
function testDigestToMe() {
  const me = Session.getActiveUser().getEmail();
  const sections = ['iş bankası', 'yapay zeka'].map(kw => ({ kw, items: fetchNews_(kw).slice(0, CFG.PER_KEYWORD) }));
  MailApp.sendEmail({ to: me, name: CFG.NAME, subject: CFG.NAME + ' · test', htmlBody: digestMail_(sections, 'Test', CFG.PAGE) });
  Logger.log('Test e-postası gönderildi: ' + me);
}
