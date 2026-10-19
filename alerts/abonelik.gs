/*
 * Düzeltme 5 — abonelik.gs (Kod.gs'den SONRA; aynı adlı fonksiyonların yerine bunlar çalışır)
 * Not: Telefonda yapıştırırken satır sonları kaybolsa da çalışır (tek satırlık açıklama işareti kullanılmadı).
 *
 * 1) Onay bağlantısı ikinci kez açılırsa (kurumsal e-posta güvenlik sistemleri bağlantıları önceden açabiliyor)
 *    "Bağlantı geçersiz" yerine "Aboneliğin zaten onaylı" çıkar.
 * 2) Zaten abone olan adres yeniden yazılırsa "Az önce e-posta gönderildi" hatası yerine
 *    "Bu adres zaten abone" denir ve o adrese "bu cihazda göster" bağlantısı gönderilir.
 * 3) "Bu cihazdaki aboneliklerin" kutusu: durum yalnızca e-postadaki bağlantıyı açan cihaza verilir.
 *    Sitede e-posta yazan biri başkasının aboneliğini ya da kelimelerini GÖREMEZ.
 * Tabloya en sağa "stoken" sütunu eklenir (10. sütun). Eski satırlar etkilenmez.
 */
const S_COL = 9; /* COLS.length: 'stoken' sütunu (0'dan sayılır) */

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'preview') return json_(preview_(p.q || ''));
  if (p.action === 'confirm') return page_(confirm_(p.t || ''));
  if (p.action === 'unsub') return page_(unsub_(p.t || ''));
  if (p.action === 'count') return json_(count_());
  if (p.action === 'status') return json_(status_(p.s || ''));
  return json_({ ok: true, name: CFG.NAME, v: 5 });
}

function stHeader_(sh) {
  if (sh.getRange(1, S_COL + 1).getValue() !== 'stoken') sh.getRange(1, S_COL + 1).setValue('stoken');
}

function showLink_(stoken, email) {
  return CFG.PAGE + '#abone=' + encodeURIComponent(stoken) + '&e=' + encodeURIComponent(email);
}

function sameKw_(a, b) {
  const n = (s) => String(s || '').split(' | ').map(x => x.trim().toLowerCase()).filter(Boolean).sort().join('|');
  return n(a) === n(b);
}

function statusMail_(email, kws, link) {
  const chips = String(kws).split(' | ').filter(Boolean).map(k => '<span style="display:inline-block;background:#fbf1e1;color:#8a5a14;border:1px solid #ecd3a8;border-radius:20px;padding:4px 10px;margin:2px;font-size:13px">' + esc_(k) + '</span>').join(' ');
  return shell_(
    '<p style="margin-top:0">Merhaba,</p><p>' + esc_(email) + ' adresinin ' + CFG.NAME + ' aboneliği <b>zaten aktif</b> ✅ Takip edilen kelimeler:</p><p>' + chips + '</p>' +
    '<p>Aboneliğini bu cihazda, sitedeki "Bu cihazdaki aboneliklerin" kutusunda görmek için:</p>' +
    '<p style="text-align:center;margin:22px 0"><a href="' + link + '" style="background:#e0a24f;color:#000;padding:12px 22px;border-radius:10px;font-weight:bold;text-decoration:none">Aboneliğimi bu cihazda göster</a></p>',
    'Bu isteği sen yapmadıysan e-postayı yok sayman yeterli; aboneliğinde hiçbir şey değişmez.'
  );
}

function subscribe_(b) {
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120)
    return { ok: false, msg: 'Geçerli bir e-posta adresi gir.' };
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
    stHeader_(sh);
    const data = sh.getDataRange().getValues();
    let rowIdx = -1;
    for (let i = 1; i < data.length; i++) if (data[i][C.email] === email) { rowIdx = i; break; }

    const now = new Date();
    const kwStr = kws.join(' | ');

    if (rowIdx === -1) {
      const active = data.slice(1).filter(r => r[C.status] === 'active').length;
      if (active >= CFG.MAX_SUBS) return { ok: false, msg: 'Şu an yeni abone alınamıyor (kapasite dolu).' };
      const ctoken = Utilities.getUuid();
      const row = new Array(S_COL + 1).fill('');
      row[C.email] = email;
      row[C.pendingKw] = kwStr;
      row[C.ctoken] = ctoken;
      row[C.utoken] = Utilities.getUuid();
      row[C.status] = 'pending';
      row[C.created] = now;
      row[C.lastConfirmMail] = now;
      row[S_COL] = Utilities.getUuid();
      sh.appendRow(row);
      MailApp.sendEmail({ to: email, name: CFG.NAME, subject: CFG.NAME + ' · aboneliğini onayla', htmlBody: confirmMail_(kws, execUrl_() + '?action=confirm&t=' + ctoken) });
      props.setProperty(dayKey, String(today + 1));
      return { ok: true, msg: 'Onay e-postası gönderildi. E-postadaki bağlantıya tıklayınca bülten başlar.' };
    }

    const r = rowIdx + 1, rec = data[rowIdx];
    let stoken = rec[S_COL];
    if (!stoken) { stoken = Utilities.getUuid(); sh.getRange(r, S_COL + 1).setValue(stoken); }
    const last = rec[C.lastConfirmMail];
    const yakin = last && (now - new Date(last)) < CFG.CONFIRM_COOLDOWN_MIN * 60000;
    const aktif = rec[C.status] === 'active';

    if (aktif && sameKw_(rec[C.keywords], kwStr)) {
      if (yakin) return { ok: true, durum: 'aktif', msg: 'Bu adres zaten abone ✅ Kelimelerin de aynı. Bu cihazda görmek için az önce gönderdiğimiz e-postadaki bağlantıyı aç.' };
      MailApp.sendEmail({ to: email, name: CFG.NAME, subject: CFG.NAME + ' · aboneliğin zaten aktif', htmlBody: statusMail_(email, rec[C.keywords], showLink_(stoken, email)) });
      sh.getRange(r, C.lastConfirmMail + 1).setValue(now);
      props.setProperty(dayKey, String(today + 1));
      return { ok: true, durum: 'aktif', msg: 'Bu adres zaten abone ✅ Bu cihazda da görmek için e-postana bir bağlantı gönderdik.' };
    }

    if (yakin) return { ok: false, msg: 'Az önce bu adrese onay e-postası gönderildi. Gelen kutunu (ve spam / gereksiz klasörünü) kontrol et; 10 dakika sonra yeniden deneyebilirsin.' };
    const ctoken = Utilities.getUuid();
    sh.getRange(r, C.pendingKw + 1).setValue(kwStr);
    sh.getRange(r, C.ctoken + 1).setValue(ctoken);
    sh.getRange(r, C.lastConfirmMail + 1).setValue(now);
    if (!aktif) sh.getRange(r, C.status + 1).setValue('pending');
    MailApp.sendEmail({ to: email, name: CFG.NAME, subject: CFG.NAME + ' · aboneliğini onayla', htmlBody: confirmMail_(kws, execUrl_() + '?action=confirm&t=' + ctoken) });
    props.setProperty(dayKey, String(today + 1));
    return { ok: true, msg: aktif ? 'Yeni kelimelerin için onay e-postası gönderildi; onaylayana kadar eski kelimelerinle bülten gelmeye devam eder.' : 'Onay e-postası gönderildi. E-postadaki bağlantıya tıklayınca bülten başlar.' };
  } finally {
    lock.releaseLock();
  }
}

/* Onay: ikinci açılışta "zaten onaylı"; sayfadaki düğme, aboneliği o cihazda göstermek için siteye götürür */
function confirm_(t) {
  const f = findBy_(C.ctoken, t);
  if (!f) return { ok: false, title: 'Bağlantı geçersiz', msg: 'Bu onay bağlantısı eski. Sitede yeniden abone olduysan en son gelen onay e-postasındaki bağlantıyı kullan.' };
  let stoken = f.rec[S_COL];
  if (!stoken) { stoken = Utilities.getUuid(); f.sh.getRange(f.row, S_COL + 1).setValue(stoken); }
  const link = showLink_(stoken, f.rec[C.email]);
  const pend = f.rec[C.pendingKw];
  if (!pend && f.rec[C.status] === 'active')
    return { ok: true, link: link, title: 'Aboneliğin zaten onaylı', msg: 'Takip ettiğin kelimeler: ' + f.rec[C.keywords] + '. Her sabah 10:00 civarı, kelimelerine uyan yeni haber varsa özetin gelir.' };
  f.sh.getRange(f.row, C.keywords + 1).setValue(pend);
  f.sh.getRange(f.row, C.pendingKw + 1).setValue('');
  f.sh.getRange(f.row, C.status + 1).setValue('active');
  return { ok: true, link: link, title: 'Abonelik onaylandı', msg: 'Takip ettiğin kelimeler: ' + pend + '. Her sabah 10:00 civarı haber özetin gelecek.' };
}

/* Sonuç sayfası: düğme onaylanan aboneliği o cihazda gösterecek bağlantıya gider */
function page_(r) {
  const href = r.link || CFG.PAGE;
  const btn = r.link ? 'Aboneliğimi sitede göster' : 'Sadolayn Alerts\'e dön';
  const html = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + CFG.NAME + '</title></head>' +
    '<body style="margin:0;background:#000;color:#f2f2f2;font-family:system-ui,-apple-system,Segoe UI,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px">' +
    '<div style="max-width:420px;width:100%;background:#0d0d0d;border:1px solid #262626;border-radius:18px;padding:24px;text-align:center">' +
    '<div style="font-size:42px">' + (r.ok ? '✅' : '⚠️') + '</div>' +
    '<h2 style="color:#e0a24f;margin:8px 0">' + esc_(r.title) + '</h2>' +
    '<p style="color:#bdbdbd;line-height:1.5">' + esc_(r.msg) + '</p>' +
    '<a href="' + esc_(href) + '" target="_top" style="display:inline-block;margin-top:10px;padding:12px 18px;border-radius:12px;background:#e0a24f;color:#000;font-weight:700;text-decoration:none">' + btn + '</a>' +
    '</div></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle(CFG.NAME).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* Durum: yalnızca e-postadaki bağlantıyla gelen gizli anahtarı bilen cihaz sorabilir */
function status_(s) {
  if (!s || s.length < 20) return { ok: false };
  const sh = sheet_();
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][S_COL] !== s) continue;
    const r = data[i];
    const tz = (d) => d ? Utilities.formatDate(new Date(d), CFG.TZ, "yyyy-MM-dd'T'HH:mm") : '';
    return { ok: true, status: r[C.status], keywords: String(r[C.keywords] || ''), pending: String(r[C.pendingKw] || ''), lastSent: tz(r[C.lastSent]) };
  }
  return { ok: false };
}
