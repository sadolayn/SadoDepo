/*
 * Düzeltme 4 — abonelik.gs (Code.gs ve duzelt.gs'den SONRA eklenmeli; aynı adlı fonksiyonların yerine bunlar çalışır)
 *
 * 1) Onay bağlantısına ikinci kez tıklanınca "Bağlantı geçersiz" yerine "Aboneliğin zaten onaylı ✅" çıkar.
 *    (Kurumsal e-posta güvenlik sistemleri bağlantıları önceden açtığı için kişi tıklayınca "geçersiz" görüyordu;
 *    aslında abonelik onaylanmış oluyordu.)
 * 2) Abone olan cihaz, kendi aboneliğinin durumunu görebilir: siteye yalnızca o cihaza verilen gizli bir
 *    "durum anahtarı" (stoken) ile sorulur. E-posta adresiyle sorgu YOK; başkası kimin abone olduğunu öğrenemez.
 * Not: Telefonda yapıştırırken satır sonları kaybolsa da çalışır (// açıklama yok).
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
  return json_({ ok: true, name: CFG.NAME, v: 4 });
}

function stHeader_(sh) {
  if (sh.getRange(1, S_COL + 1).getValue() !== 'stoken') sh.getRange(1, S_COL + 1).setValue('stoken');
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
    const ctoken = Utilities.getUuid();
    let stoken;
    if (rowIdx === -1) {
      const active = data.slice(1).filter(r => r[C.status] === 'active').length;
      if (active >= CFG.MAX_SUBS) return { ok: false, msg: 'Şu an yeni abone alınamıyor (kapasite dolu).' };
      const row = new Array(S_COL + 1).fill('');
      row[C.email] = email;
      row[C.pendingKw] = kws.join(' | ');
      row[C.ctoken] = ctoken;
      row[C.utoken] = Utilities.getUuid();
      row[C.status] = 'pending';
      row[C.created] = now;
      row[C.lastConfirmMail] = now;
      row[S_COL] = stoken = Utilities.getUuid();
      sh.appendRow(row);
    } else {
      const r = rowIdx + 1;
      stoken = data[rowIdx][S_COL] || Utilities.getUuid();
      if (!data[rowIdx][S_COL]) sh.getRange(r, S_COL + 1).setValue(stoken);
      const last = data[rowIdx][C.lastConfirmMail];
      if (last && (now - new Date(last)) < CFG.CONFIRM_COOLDOWN_MIN * 60000)
        return { ok: false, s: stoken, msg: 'Az önce onay e-postası gönderildi. Gelen kutunu (ve spam / gereksiz klasörünü) kontrol et.' };
      sh.getRange(r, C.pendingKw + 1).setValue(kws.join(' | '));
      sh.getRange(r, C.ctoken + 1).setValue(ctoken);
      sh.getRange(r, C.lastConfirmMail + 1).setValue(now);
      if (data[rowIdx][C.status] !== 'active') sh.getRange(r, C.status + 1).setValue('pending');
    }

    const link = execUrl_() + '?action=confirm&t=' + ctoken;
    MailApp.sendEmail({ to: email, name: CFG.NAME, subject: CFG.NAME + ' · aboneliğini onayla', htmlBody: confirmMail_(kws, link) });
    props.setProperty(dayKey, String(today + 1));
    return { ok: true, s: stoken, msg: 'Onay e-postası gönderildi. E-postadaki bağlantıya tıklayınca bülten başlar.' };
  } finally {
    lock.releaseLock();
  }
}

/* Onay: bağlantı tekrar açılırsa (ya da e-posta güvenlik sistemi önceden açtıysa) "zaten onaylı" der */
function confirm_(t) {
  const f = findBy_(C.ctoken, t);
  if (!f) return { ok: false, title: 'Bağlantı geçersiz', msg: 'Bu onay bağlantısı eski. Sitede yeniden abone olduysan en son gelen onay e-postasındaki bağlantıyı kullan.' };
  const pend = f.rec[C.pendingKw];
  if (!pend && f.rec[C.status] === 'active')
    return { ok: true, title: 'Aboneliğin zaten onaylı', msg: 'Takip ettiğin kelimeler: ' + f.rec[C.keywords] + '. Her sabah 10:00 civarı, kelimelerine uyan yeni haber varsa özetin gelir.' };
  f.sh.getRange(f.row, C.keywords + 1).setValue(pend);
  f.sh.getRange(f.row, C.pendingKw + 1).setValue('');
  f.sh.getRange(f.row, C.status + 1).setValue('active'); /* ctoken silinmez: ikinci tıklamada "zaten onaylı" görünsün */
  return { ok: true, title: 'Abonelik onaylandı', msg: 'Takip ettiğin kelimeler: ' + pend + '. Her sabah 10:00 civarı haber özetin gelecek.' };
}

/* Durum: yalnızca durum anahtarını bilen cihaz sorabilir; e-posta maskelenir */
function status_(s) {
  if (!s || s.length < 20) return { ok: false };
  const sh = sheet_();
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][S_COL] !== s) continue;
    const r = data[i], e = String(r[C.email]), at = e.indexOf('@');
    const tz = (d) => d ? Utilities.formatDate(new Date(d), CFG.TZ, "yyyy-MM-dd'T'HH:mm") : '';
    return { ok: true, email: e.slice(0, 2) + '•••' + e.slice(at), status: r[C.status], keywords: String(r[C.keywords] || ''), pending: String(r[C.pendingKw] || ''), lastSent: tz(r[C.lastSent]), lastConfirmMail: tz(r[C.lastConfirmMail]) };
  }
  return { ok: false };
}
