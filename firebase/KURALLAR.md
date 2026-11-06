# Firebase Realtime Database kuralları (öneri)

Canlı ziyaretçi sayacı (`sayac.js`) kimlik doğrulamasız yazar. Bugünkü kurallar herkese açık yazma
izni veriyorsa, dışarıdan biri `online/` altına çöp kayıt yazabilir ya da `gun/<tarih>` sayısını
istediği değere çekebilir. Aşağıdaki kurallar yalnızca sayacın yazdığı biçime izin verir:

- `online/<id>`: yalnızca `p` (sayfa adı, en çok 30 karakter), `d` (`m` ya da `d`) ve `t` (sayı) alanları.
- `gun/<tarih>`: yalnızca bir artırılabilir (eski değer + 1), silinemez, keyfi sayı yazılamaz.
- Kökte başka hiçbir yol yazılamaz.

Firebase konsolu → Realtime Database → Rules bölümüne yapıştır (6 Kasım 2026 güvenlik incelemesi):

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "online": {
      ".read": true,
      "$id": {
        ".write": "$id.matches(/^[A-Za-z0-9_-]{6,40}$/)",
        ".validate": "newData.hasChildren(['p','d','t']) && newData.child('p').isString() && newData.child('p').val().length <= 30 && newData.child('p').val().matches(/^[A-Za-z0-9_-]+$/) && newData.child('d').val().matches(/^[md]$/) && newData.child('t').isNumber()",
        "$other": { ".validate": false }
      }
    },
    "gun": {
      ".read": true,
      "$g": {
        ".write": "$g.matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/) && newData.exists()",
        ".validate": "newData.isNumber() && ((!data.exists() && newData.val() == 1) || newData.val() == data.val() + 1)"
      }
    }
  }
}
```

Kuralı yapıştırdıktan sonra ana sayfayı açıp sayacın hâlâ arttığını kontrol et. `online/<id>` kayıtlarının
`id` biçimi `sayac.js`'deki üretimle uyuşmazsa `$id.matches(...)` satırını ona göre genişlet.
