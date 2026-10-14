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
