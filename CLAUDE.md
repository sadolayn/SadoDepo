# SadoDepo güvenlik kuralları

Bu depo **herkese açık**. Commit'ler, silinmiş dallar ve GitHub Actions logları dahil her şeyi herkes görebilir.

## Asla yapma
- Banka sitelerinden (isbank.com.tr, maximum.com.tr vb.) ham sayfa kaynağı, script listesi, HTML ya da "keşif" çıktısını depoya yazma. Bu kural geçici dallar için de geçerli.
- Keşif ya da deneme amacıyla banka sitelerini GitHub Actions üzerinden tarama. Actions logları da herkese açık.
- Herhangi bir API anahtarı, token ya da şifreyi commit etme. Sitenin kendi Firebase web yapılandırması (alerts.html) bu kuralın dışında, çünkü tarayıcıda zaten görünür olacak şekilde tasarlandı.

## Bunun yerine
- Bir banka sayfasının yapısını öğrenmek gerekiyorsa kullanıcıdan ekran görüntüsü ya da sayfa kaynağı iste.
- Veri çeken script'ler yalnızca işlenmiş ve gereken alanları içeren JSON yazsın, ham yanıtı kaydetmesin.

> Neden: Geçmişte depoya yazılan bir keşif çıktısı üçüncü tarafa ait bir anahtar içerdiği için sorun yarattı. Benzeri tekrarlanmasın diye bu kurallar var.

## İçerik dikkat kuralı (27 Ekim 2026)
Site herkese açık ve sahibi İş Bankası çalışanı; yanlış ya da abartılı tek bir cümle ona laf getirebilir.
- Kaynağın açıkça söylediğini yorumundan ayır. Açıklanmamış bilgiyi (ödeme takvimi, başvuru yeri, tutar…) kesinmiş gibi yazma, "henüz açıklanmadı" de.
- Yorum gerekiyorsa "… olabilir" diye belli et ve genel, savunulabilir bir mantığa dayandır; kişi, banka ya da kurum hakkında yeni iddia üretme.
- Rakam, tarih, kişi adı ve unvanı yalnızca kaynakta gördüğün gibi yaz.
- İş Bankası hakkında olumsuz, tartışmalı ya da müşteriyi şubeye/kanala yönlendiren ifade yazma. Emin değilsen o cümleyi hiç yazma.

> Neden: 26 Ekim'deki Tera/Pusula duyurusunun "Bankacılığa etkisi" notunda kaynakta olmayan "yatırımcı başvuruları İş Bankası üzerinden yürüyecek" ifadesi yazılmıştı.
