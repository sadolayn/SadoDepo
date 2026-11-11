---
description: Siteyi baştan aşağı tarar (telefon + PC), linkleri ve veri güncelliğini denetler, puanlar ve öneri verir
---
Sadolayn sitesini (bu depo) baştan aşağı denetle ve sonucu Türkçe, kısa ve sade anlat. Önce `sadodepo` skill'ini yükle, `git pull` yap.

Adımlar (çıktıları ve ekran görüntülerini scratchpad'de tut, depoya ekleme):
1. **Sayfalar:** depo kökünde `python3 -m http.server 8765` aç; scratchpad'den `node <depo>/test/tarama_sayfa.js` komutunu `tel`, `kucuk`, `fold`, `pc`, `genis` için AYRI AYRI çalıştır (hepsi birden belleği doldurur). `sonuc-*.json` dosyalarında JS hatası, 404, yatay taşma, küçük yazı, küçük dokunma alanı, etiketsiz giriş ara. SVG `text` küçük yazı uyarıları (saat, tavla) yanlış alarmdır.
2. **Tıklama:** `node <depo>/test/tarama_tikla.js tel` ve `pc` (her biri ~8 dk; arka planda çalıştır).
3. **Linkler:** `python3 <depo>/test/tarama_link.py` (iç linkler) + `ext.json`'daki dış adreslerin yalnızca durum kodu. Banka sitelerine toplu istek atma; ilan.gov.tr, tobb.org.tr, ticaretsicil.gov.tr buradan açılmaz (yurt dışı engeli), wa.me/facebook/linkedin/news.google bot korumasıdır.
4. **Güncellik:** `data/`, `isbank/`, `gazete/` JSON'larının güncelleme tarihleri; GitHub Actions son çalışmalar (başarısız var mı); yıla bağlı içerik (takvimp.js DINI/tatiller, hesapp.js oranlar, data/ppk.json toplantıları); süresi dolacak duyurular (kayan yazı, YENİ şeridi).
5. **Görsel:** telefon (390) ve PC (1440, 1920) ekran görüntülerine toplu bak; bulanık görsel (doğal genişlik < görünen × piksel oranı), hizasızlık, çakışan sabit düğme ara.
6. **Performans:** ana sayfa ve Haberler'de 10. saniyeden sonra işlemci ve yerleşim sayısı (CDP Performance.getMetrics).
7. **Kredi testi:** yerel sunucu 8799'da açıkken `node test/kredi_test.js` → "0 fark" olmalı.

Bulduğun kesin hataları düzelt (görsel değişiklikte önce ekran görüntüsüyle öner), `sw.js` sürümünü artır, `main`'e gönder ve canlıda doğrula. En sonda: alan alan 10 üzerinden puan tablosu, düzeltilenler, kullanıcının yapması gerekenler ve öneriler.
