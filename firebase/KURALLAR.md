# Firebase Realtime Database kuralları

Bu veritabanını yalnızca iki yer kullanır: canlı ziyaretçi sayacı (`sayac.js`, yazar) ve site sahibinin
istatistik sayfası (okur). Sadolayn Alerts bu veritabanını kullanmaz.

Sayaç kimlik doğrulamasız yazdığı için kurallar, yalnızca sayacın yazdığı biçime izin verecek kadar dardır
(11 Kasım 2026'da sıkılaştırıldı):

- `online/<id>`
  - `id` yalnızca küçük harf ve rakam, 6-20 karakter (sayacın ürettiği biçim).
  - Yalnızca `p` (sayfa adı, en çok 30 karakter, harf/rakam/tire), `d` (`m` ya da `d`) ve `t` alanları.
  - `t` sunucu saatine yakın olmalı (en çok 10 dakika geri, 1 dakika ileri): ileri tarihli "hayalet ziyaretçi" yazılamaz.
  - Var olan bir kaydın sayfa adı ve cihaz türü sonradan değiştirilemez (yalnızca saat yenilenir ya da kayıt silinir).
- `gun/<tarih>`
  - Tarih yalnızca 2026-2039 arası, geçerli ay ve gün biçiminde (`0001-01-01` gibi anahtarlar yazılamaz).
  - Yalnızca bir artırılabilir (eski değer + 1); silinemez, keyfi sayı yazılamaz.
- Kökte başka hiçbir yol okunamaz ve yazılamaz.

Bilinen sınır: giriş (kimlik doğrulama) olmadığı için biri sayacı teker teker artırabilir ya da başkasının
"şu an sitede" kaydını silebilir. Kişisel veri yoktur; etkilenen yalnızca sayılardır. Kalıcı çözüm Firebase
App Check ya da anonim giriştir (ayrı bir kurulum ister).

Firebase konsolu → Realtime Database → Kurallar (Rules) bölümüne yapıştırılır:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "online": {
      ".read": true,
      "$id": {
        ".write": "$id.matches(/^[a-z0-9]{6,20}$/) && (!newData.exists() || !data.exists() || (data.child('p').val() == newData.child('p').val() && data.child('d').val() == newData.child('d').val()))",
        ".validate": "newData.hasChildren(['p','d','t']) && newData.child('p').isString() && newData.child('p').val().length <= 30 && newData.child('p').val().matches(/^[A-Za-z0-9_-]+$/) && newData.child('d').isString() && newData.child('d').val().matches(/^[md]$/) && newData.child('t').isNumber() && newData.child('t').val() <= now + 60000 && newData.child('t').val() >= now - 600000",
        "$other": { ".validate": false }
      }
    },
    "gun": {
      ".read": true,
      "$g": {
        ".write": "$g.matches(/^20(2[6-9]|3[0-9])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/) && newData.exists()",
        ".validate": "newData.isNumber() && ((!data.exists() && newData.val() == 1) || (data.exists() && newData.val() == data.val() + 1))"
      }
    }
  }
}
```

Yapıştırmadan önce eski kuralların bir kopyasını sakla. Yayınladıktan sonra siteyi başka bir cihazdan
(ya da "Beni sayma" kapalıyken) açıp istatistik sayfasında "şu an sitede" sayısının arttığını kontrol et.
