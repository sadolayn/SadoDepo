# Sadolayn Alerts — Kurulum (bir kez, ~5 dk)

1. https://script.google.com → **Yeni proje**. Adını "Sadolayn Alerts" yap.
2. `Code.gs` içeriğini silip bu klasördeki `Code.gs` dosyasının tamamını yapıştır, kaydet.
3. Üstteki işlev listesinden **setup** seç → **Çalıştır**. Google izin isteyecek
   ("Bu uygulama doğrulanmadı" → Gelişmiş → Sadolayn Alerts'e git → İzin ver).
   Bu adım abone tablosunu ve her sabah 10:00 tetikleyicisini kurar.
4. **Dağıt → Yeni dağıtım → Web uygulaması**
   - Şu kullanıcı olarak çalıştır: **Ben**
   - Erişimi olanlar: **Herkes**
   → Dağıt → çıkan `https://script.google.com/macros/s/…/exec` adresini kopyala.
5. Bu adresi `alerts.html` içindeki `const ENDPOINT = "";` satırına yaz (ya da Claude'a gönder).

Test: işlev listesinden `testDigestToMe` çalıştırırsan örnek bülten kendi Gmail'ine gelir.

Notlar
- E-postalar kurulumu yapan Gmail hesabından gider; alıcılar bu adresi görür.
  İstersen ayrı bir Gmail hesabıyla kurabilirsin.
- Ücretsiz Gmail günde ~100 e-posta gönderebilir; bu yüzden abone sınırı 80.
- Abone listesi Google Drive'ında "Sadolayn Alerts — Aboneler" tablosunda durur.
- Code.gs'i değiştirirsen: Dağıt → Dağıtımları yönet → düzenle → **Yeni sürüm**.


## Telefon bildirimi (Firebase Cloud Messaging)

1. Firebase konsolu → Proje ayarları → Genel → Web uygulaması ekle (</>) → çıkan `firebaseConfig` değerleri `alerts.html` içindeki `PUSH_CFG`'ye yazılır (herkese açık değerlerdir).
2. Proje ayarları → Cloud Messaging → Web Push sertifikaları → Anahtar çifti oluştur → `alerts.html` içindeki `VAPID`'e yazılır.
3. Proje ayarları → Hizmet hesapları → Yeni özel anahtar oluştur → inen JSON'un tamamı Apps Script → Proje Ayarları → Komut dosyası özellikleri'ne `FCM_SA` adıyla eklenir. **Bu dosya gizlidir; siteye, GitHub'a ya da sohbete konmaz.**
4. Apps Script'te `testPushSetup` bir kez çalıştırılır, sonra Dağıt → Dağıtımları yönet → Yeni sürüm.

Bildirimler `dailyDigest` içinde e-postalardan sonra gönderilir. Kayıtlı telefonlar tablodaki **Bildirim** sayfasındadır; geçersiz olanlar gönderimde kendiliğinden silinir.

## Düzeltme 4/5 — abonelik.gs (onay bağlantısı + "aboneliklerim")

1. Apps Script'te sol menüden **Dosyalar ＋ → Komut dosyası** → adı `abonelik` → `alerts/abonelik.gs` içeriğinin tamamını yapıştır → Kaydet.
   Dosya listesinde **en altta** olmalı (Code ve duzelt'ten sonra); aynı adlı fonksiyonların yerine bunlar çalışır.
2. **Dağıt → Dağıtımları yönet → ✏️ düzenle → Sürüm: Yeni sürüm → Dağıt.** Adres değişmez.
3. Kontrol: `…/exec` adresini tarayıcıda aç → `"v":5` görünmeli.

Ne değişir:
- Onay bağlantısına ikinci kez tıklanırsa (bazı e-posta sistemleri bağlantıları önceden açabiliyor) "Bağlantı geçersiz" yerine **"Aboneliğin zaten onaylı ✅"** çıkar.
- Abone olunan cihazda sitede **"📬 Bu cihazdaki aboneliklerin"** kutusu çıkar: onay bekleniyor / aktif / çıkıldı ve son gönderim saati.
  Durum yalnızca e-postadaki bağlantıyı (onay ya da "aboneliğimi bu cihazda göster") açan cihaza verilir; sitede e-posta yazan biri başkasının aboneliğini göremez.
- Zaten abone olan adres yeniden yazılırsa "zaten abone ✅" denir ve o adrese "bu cihazda göster" bağlantısı gider.
- Tabloya en sağa `stoken` sütunu eklenir.

## Gönderen adresini değiştirme (e-postalar ayrı bir Gmail hesabından gitsin)

Ücretsiz Gmail'de e-posta, Apps Script'i çalıştıran hesabın adresinden gider; görünen ad "Sadolayn Alerts" olsa da adres gizlenemez
(`noReply` yalnızca Google Workspace'te var). Kişisel adres görünmesin diye gönderimi ayrı bir hesaba taşı (bilgisayardan, ~10 dk):

1. Yeni bir Gmail hesabı aç (ör. "sadolayn.alerts").
2. Kişisel hesapta: Apps Script projesini ve Drive'daki "Sadolayn Alerts — Aboneler" tablosunu yeni hesapla **Düzenleyici** olarak paylaş.
3. Yeni hesapla script.google.com → projeyi aç → işlev listesinden **setup** → Çalıştır → izin ver.
   Günlük 10:00 tetikleyicisi artık yeni hesap adına kurulur; bülten oradan gider.
4. Yeni hesapla **Dağıt → Yeni dağıtım → Web uygulaması** (Şu kullanıcı olarak çalıştır: **Ben**, Erişim: **Herkes**) → yeni `…/exec` adresini Claude'a gönder
   (sitedeki `ENDPOINT` güncellenir; onay e-postaları da yeni hesaptan gider).
   Proje Ayarları → Komut dosyası özellikleri'nde `URL` diye bir satır varsa değerini yeni adresle değiştir.
5. Kişisel hesapla aynı projede sol menü **Tetikleyiciler (⏰)** → kişisel hesabın `dailyDigest` tetikleyicisini sil (yoksa bülten iki kez gider).
   Eski web uygulaması dağıtımını silme: daha önce gönderilmiş e-postalardaki "abonelikten çık" bağlantıları ona gider ve aynı tabloyu kullanır.
6. Yeni hesapla `testDigestToMe` çalıştır; örnek bülten yeni hesabın gelen kutusuna gelmeli.

Aboneler, abone listesi ve telefon bildirimleri olduğu gibi kalır; her e-posta aboneye ayrı gider, aboneler birbirini görmez.
