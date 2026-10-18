// Düzeltme dosyası: Firebase anahtarının satır sonlarını toparlar.
// Kod.gs'deki aynı adlı fonksiyonların yerine bunlar çalışır.

function pk_(k) {
  k = String(k || '').replace(/\\n/g, '\n').replace(/\r/g, '').trim();
  return k + '\n';
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
  const sa = fcmSa_(), k = String(sa.private_key || ''), t = pk_(k);
  Logger.log('Hizmet hesabı: ' + sa.client_email + ' · proje: ' + sa.project_id);
  Logger.log('Anahtar: ' + k.length + ' karakter · başlık ' + (k.indexOf('BEGIN PRIVATE KEY') >= 0 ? 'var' : 'YOK') +
    ' · kaçışlı \\n ' + (k.indexOf('\\n') >= 0 ? 'var' : 'yok') + ' · toparlanınca ' + t.split('\n').length + ' satır');
  fcmAccess_();
  Logger.log('✅ Firebase erişimi tamam. Bildirim tablosu: ' + pushSheet_().getParent().getUrl());
}
