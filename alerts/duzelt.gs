// Düzeltme 2: Firebase anahtarını ayıklayıp yeniden kurar (telefon kopyalamasında araya giren karakterler).
// Kod.gs'deki aynı adlı fonksiyonların yerine bunlar çalışır.

function pk_(k) {
  k = String(k || '').replace(/\\n/g, '\n');
  const m = k.match(/BEGIN PRIVATE KEY-*([\s\S]*?)-*END PRIVATE KEY/);
  if (!m) return k.replace(/\r/g, '').trim() + '\n';
  const body = m[1].replace(/[^A-Za-z0-9+\/=]/g, '');
  return '-----BEGIN PRIVATE KEY-----\n' + body.match(/.{1,64}/g).join('\n') + '\n-----END PRIVATE KEY-----\n';
}

function fcmAccess_() {
  const cache = CacheService.getScriptCache(), hit = cache.get('fcm_at');
  if (hit) return hit;
  const sa = fcmSa_(), now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Utilities.base64EncodeWebSafe(typeof o === 'string' ? o : JSON.stringify(o)).replace(/=+$/, '');
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const claim = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
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

function testPushSetup() {
  const sa = fcmSa_(), k = String(sa.private_key || '');
  const m = k.replace(/\\n/g, '\n').match(/BEGIN PRIVATE KEY-*([\s\S]*?)-*END PRIVATE KEY/);
  const raw = m ? m[1] : '', body = raw.replace(/[^A-Za-z0-9+\/=]/g, ''), odd = raw.replace(/[A-Za-z0-9+\/=\n]/g, '');
  Logger.log('Hizmet hesabı: ' + sa.client_email + ' · proje: ' + sa.project_id);
  Logger.log('Anahtar: ' + k.length + ' karakter · gövde ' + body.length + ' (beklenen ~1624) · fazlalık: ' + (odd.length ? JSON.stringify(odd) : 'yok'));
  fcmAccess_();
  Logger.log('✅ Firebase erişimi tamam. Bildirim tablosu: ' + pushSheet_().getParent().getUrl());
}
