// İş Bankası soru havuzu: Günün sorusu, Batak MaxiPuan sorusu ve Oyunlar giriş sorusu ortak kullanır
// Format: [soru, şıklar, doğru şık indeksi, son geçerlilik tarihi ("" = süresiz), konu, eklenme tarihi (yeni rozeti için)]
// Sorular konu konu yazılır; Günün sorusu her gün bunları karıştırır ve aynı konuyu art arda getirmez.
// İzmir Şubesi 12 Temmuz 1925'te açıldı; yıl sayısı bugüne göre hesaplanır
function izmirQ() {
  const t = new Date();
  let y = t.getFullYear() - 1925;
  if (t < new Date(t.getFullYear(), 6, 12)) y--;
  return ["İş Bankası İzmir Şubesi kaç yıldır hizmet veriyor? (" + t.toLocaleDateString("tr-TR") + " itibarıyla)", [(y - 25) + " yıl", (y - 10) + " yıl", y + " yıl", (y + 6) + " yıl"], 2];
}
// Bir grup soruya konu (ve istenirse eklenme tarihi) yazar
function K(konu, liste, eklendi) {
  return liste.map((q) => { const x = q.slice(0, 3); x[3] = q[3] || ""; x[4] = konu; if (eklendi) x[5] = eklendi; return x; });
}
const ISQ_KONU = {
  tarih: "🏛️ Tarihçe",
  kart: "💳 Maximum, kartlar ve ürünler",
  iscep: "📲 İşCep ve dijital",
  black: "🖤 İş Black ve Maximiles Black",
  matik: "🏧 Bankamatik ve Gişematik",
  kurum: "🏆 Ödüller, iştirakler ve kurum",
};
const ISQ_ALL = [].concat(
  // --- Tarihçe (isbank.com.tr "O Günlerden Bugünlere" ve sitedeki tarihçe) ---
  K("tarih", [
    ["Türkiye İş Bankası hangi yıl kuruldu?", ["1923", "1924", "1927", "1933"], 1],
    ["Türkiye İş Bankası'nın kurucusu kimdir?", ["Mustafa Kemal Atatürk", "İsmet İnönü", "Kâzım Karabekir", "Celâl Bayar"], 0],
    ["İş Bankası'nın ilk genel müdürü kimdir?", ["Muammer Eriş", "Celâl Bayar", "Şükrü Saracoğlu", "Hasan Saka"], 1],
    ["İş Bankası hangi tarihte kuruldu?", ["29 Ekim 1923", "26 Ağustos 1924", "23 Nisan 1920", "30 Ağustos 1922"], 1],
    ["İş Bankası hangi şehirde kuruldu?", ["İstanbul", "İzmir", "Ankara", "Bursa"], 2],
    ["İş Bankası'nın kuruluş sermayesi ne kadardı?", ["100 bin lira", "500 bin lira", "1 milyon lira", "10 milyon lira"], 2],
    ["Atatürk, İş Bankası'nın 1 milyon liralık kuruluş sermayesinin ne kadarını karşıladı?", ["100 bin lira", "250 bin lira", "500 bin lira", "Tamamını"], 1],
    ["Atatürk'ün İş Bankası hisseleri, vasiyeti gereği hangi parti tarafından temsil edilir?", ["Cumhuriyet Halk Partisi", "Demokrat Parti", "Hazine", "TBMM"], 0],
    ["Atatürk'ün İş Bankası hisselerinin kâr payları hangi kurumlara gider?", ["TÜBİTAK ve YÖK", "Türk Dil Kurumu ve Türk Tarih Kurumu", "Kızılay ve Darüşşafaka", "Milli Eğitim ve Diyanet"], 1],
    ["İş Bankası İktisadi Bağımsızlık Müzesi, bankanın Ankara'daki tarihi genel müdürlük binasındadır. Bu bina hangi semttedir?", ["Kızılay", "Çankaya", "Ulus", "Bahçelievler"], 2],
    izmirQ(),
    ["İş Bankası kurulduğunda kaç şubesi vardı?", ["1", "2", "5", "10"], 1],
    ["İş Bankası kurulduğunda kaç çalışanı vardı?", ["12", "37", "100", "250"], 1],
    ["İş Bankası'nın Ankara'daki ilk binası hangi caddedeydi?", ["Atatürk Bulvarı", "Anafartalar Caddesi", "İstasyon Caddesi", "Bankalar Caddesi"], 2],
    ["İş Bankası kuruluş yılı olan 1924'ü kaç müşteriyle kapattı?", ["133", "433", "1.433", "4.330"], 1],
    ["İş Bankası'nın ilk sanayi yatırımı hangisidir?", ["Şişecam", "Sümerbank", "Paşabahçe", "İpekiş"], 3],
    ["Bugünkü Anadolu Sigorta hangi yıl kuruldu?", ["1925", "1938", "1951", "1990"], 0],
    ["İş Bankası 1927'de hangi bankayla birleşti?", ["Osmanlı Bankası", "Milli İtibar Bankası", "Emlak Bankası", "Ziraat Bankası"], 1],
    ["Kumbarayı Türkiye'ye hangi banka getirdi?", ["Ziraat Bankası", "Akbank", "İş Bankası", "Yapı Kredi"], 2],
    ["İş Bankası Türkiye'ye kumbarayı hangi yıl getirdi?", ["1928", "1945", "1960", "1975"], 0],
    ["İş Bankası'nın 1929'da kurduğu ve bugün de faaliyette olan reasürans şirketi hangisidir?", ["Anadolu Hayat", "Milli Reasürans", "Türk Reasürans", "Anadolu Sigorta"], 1],
    ["Büyük Buhran yıllarında (1929–1934) İş Bankası'nın mevduatı kaç katına çıktı?", ["2 katına", "4 katına", "9 katına", "20 katına"], 2],
    ["Yurt dışında şube açan ilk Türk bankası olan İş Bankası, 1932'de hangi şehirlerde şube açtı?", ["Londra ve Paris", "Berlin ve Kahire", "Viyana ve Atina", "Hamburg ve İskenderiye"], 3],
    ["İş Bankası'nın kurduğu Şişecam'ın Paşabahçe fabrikası hangi yıl üretime başladı?", ["1929", "1935", "1946", "1953"], 1],
    ["İş Bankası Kültür Yayınları hangi yıldan beri kesintisiz kitap yayımlıyor?", ["1934", "1956", "1972", "1999"], 1],
    ["1979'da İş Bankası kaç şubeye ulaşmıştı?", ["265", "565", "865", "1.265"], 2],
    ["1979'da Türkiye'deki mevduatın yaklaşık yüzde kaçı İş Bankası'ndaydı?", ["%5", "%12", "%22", "%40"], 2],
    ["İş Bankası'nın merkezi bilgisayar sistemi ilk olarak hangi yıl çalışmaya başladı?", ["1973", "1983", "1993", "2003"], 1],
    ["Anadolu Hayat Emeklilik hangi yıl kuruldu?", ["1975", "1990", "2001", "2010"], 1],
    ["Türkiye'nin ilk internet şubesini hangi banka, hangi yıl açtı?", ["İş Bankası, 1997", "Garanti BBVA, 2001", "Akbank, 1999", "Ziraat Bankası, 2003"], 0],
    ["İş Bankası genel müdürlüğü 2000 yılında Ankara'dan nereye taşındı?", ["İstanbul Levent, İş Kuleleri", "İstanbul Maslak", "İzmir Konak", "İstanbul Ataşehir"], 0],
    ["İş Bankası'nın ilk genel müdürü Celâl Bayar hangi yıl Cumhurbaşkanı oldu?", ["1938", "1946", "1950", "1960"], 2],
    ["İş Bankası'nın QR kodla ödeme sistemi Parakod hangi yıl hayata geçti?", ["2005", "2012", "2018", "2022"], 1],
    ["İş Bankası'nın yapay zekâ destekli dijital asistanı Maxi hangi yıl devreye girdi?", ["2012", "2017", "2021", "2024"], 1],
    ["İş Bankası 100. yaşını hangi yıl kutladı?", ["2014", "2023", "2024", "2025"], 2],
  ]),

  // --- Maximum, kartlar ve ürünler ---
  K("kart", [
    ["Maximum kart harcamalarında kazanılan puanın adı nedir?", ["MaxiPuan", "Bonus", "ParaPuan", "Chip-para"], 0],
    ["Telefona ya da eşyaya yapıştırılıp temassız ödeme yapılan İş Bankası kart ürününün adı nedir?", ["MaxiPara", "MaxSticker", "Maximiles Black", "İşCep Pay"], 1],
    ["MaxSticker'ın üzerinde aşağıdakilerden hangisi bulunmaz?", ["Kart numarası, son kullanma tarihi ve CVV", "Temassız ödeme çipi", "Maximum özelliği", "MaxiPuan kazanımı"], 0],
    ["MaxSticker başvurusu nereden yapılır?", ["Sadece şubeden", "İşCep'teki 'MaxSticker Kartlarım' menüsünden", "ATM'den", "Kargo ile"], 1],
    ["Maximum kartla akıllı saatten ödeme ('Saat ile Öde') hangi uygulamadan etkinleştirilir?", ["İşCep", "Maximum Mobil", "İşCep ve Maximum Mobil", "İmece Mobil"], 2],
    ["Fiziksel kartın özelliklerini dijital ortama taşıyıp plastik kullanımını azaltan İş Bankası uygulamasının adı nedir?", ["Esnek Kart", "Dijital Kullanım", "Çevre Kart", "Yeşil Cüzdan"], 1],
    ["Akıllı saatle temassız ödeme hangi teknoloji kategorisine girer?", ["Giyilebilir teknoloji", "Blokzincir transferi", "Biyometrik göz taraması", "Sesli komutla kredi"], 0],
    ["İş Bankası ile Burgan Bank iş birliğiyle Maximum ekosistemine katılan kart hangisidir?", ["Bonus Kart", "Axess Kart", "ON Kredi Kartı", "World Card"], 2],
    ["İş Bankası'nın tarım üreticilerine girdi alımları için sunduğu kartın adı nedir?", ["Başak Kart", "İmece Kart", "Üretici Kart", "Bereket Kart"], 1],
    ["Kredi kartı kampanyalarını, harcama ve MaxiPuan takibini tek yerde toplayan İş Bankası uygulaması hangisidir?", ["Maximum Mobil", "İşCep Cüzdan", "Bonus Flaş", "Axess Mobil"], 0],
    ["İş Bankası'nda kredili mevduat hesabının (KMH) yaygın adı nedir?", ["Artı Para", "Ek Hesap", "Avans Hesap", "Esnek Hesap"], 1],
    ["Ekim 2026 kampanyası: Maximum anlaşmalı marketlerde tek seferde 20.000 TL alışverişe kaç TL MaxiPuan veriliyor?", ["250 TL", "500 TL", "1.000 TL", "2.000 TL"], 2, "2026-10-31"],
    ["Ekim 2026 'İş Bankası'nı Arkadaşınıza Önerin' kampanyasında davet eden ve yeni müşteri olan arkadaşı kaçar TL MaxiPuan kazanır?", ["100 TL", "250 TL", "500 TL", "1.000 TL"], 2, "2026-10-31"],
  ]),

  // --- İşCep ve dijital ---
  K("iscep", [
    ["İşCep, hangi derginin 'En İyi Dijital Banka Ödülleri'nde birçok kez 'Dünyanın En İyi Mobil Bankacılık Uygulaması' seçildi?", ["Forbes", "Global Finance", "Time", "National Geographic"], 1],
    ["İş Bankası'na uzaktan, görüntülü görüşmeyle müşteri olmak için İşCep'teki özelliğin adı nedir?", ["Hızlı Kredi", "Müşteri Olmak İstiyorum", "Kolay Adres", "QR ile Öde"], 1],
    ["İşCep'teki Açık Bankacılık hizmetine eklenen yeni özellik hangisidir?", ["Sadece kripto varlık takibi", "Farklı bankalardaki kartların İşCep'ten görüntülenmesi", "Yabancı borsa hisse alımı", "Araç kiralama entegrasyonu"], 1],
    ["İş Bankası İnternet Şubesi bilgileriyle ayrı şifre almadan giriş yapılabilen kamu platformu hangisidir?", ["Vergi Dairesi Portalı", "e-Devlet Kapısı", "e-Nabız", "UYAP Vatandaş"], 1],
    ["İşCep'ten şifre girmeden doğrudan geçiş yapılabilen iki iştirak hangisidir?", ["Anadolu Hayat Emeklilik ve Anadolu Sigorta", "Şişecam ve Türk Telekom", "İş Yatırım ve Softtech", "Arçelik ve Migros"], 0],
    ["Farklı bankalardaki hesapların tek ekrandan izlenmesini sağlayan altyapının genel adı nedir?", ["Mobil Cüzdan", "Açık Bankacılık", "Ortak ATM Ağı", "Dijital Köprü"], 1],
    ["7/24 kesintisiz ve anlık TL transferi sağlayan, İş Bankası'nın da kullandığı sistem hangisidir?", ["SWIFT", "FAST", "EFT", "Western Union"], 1],
    ["Hesap numarası yerine telefon, e-posta ya da TCKN ile para almayı sağlayan özelliğin adı nedir?", ["Pratik Kod", "CepBank", "Kolay Adres", "Hızlı Transfer"], 2],
    ["İşCep'teki, WhatsApp'tan da ulaşılabilen yapay zekâ destekli kişisel asistanın adı nedir?", ["Maxi", "Pepper", "İşbot", "Asistan İş"], 0],
    ["Kredi notu sorgulaması dijital kanallardan hangi kuruluş üzerinden yapılır?", ["Kredi Kayıt Bürosu (Findeks)", "Merkez Bankası", "BDDK", "Hazine"], 0],
    ["İşCep üzerinden de kullanılabilen uluslararası para transferi hizmeti hangisidir?", ["Western Union", "MoneyGram", "Ripple", "Wise"], 0],
    ["İş Bankası dijital kanallarından vergi, trafik cezası ve MTV dışında hangileri de ödenebilir?", ["ÖSYM sınav ücretleri", "Pasaport harcı", "Tapu harcı", "Hepsi"], 3],
    ["İşCep hangi yıl yayına girdi?", ["2003", "2007", "2012", "2016"], 1],
    ["İşCep, Global Finance'ın 'Dünyanın En İyi Mobil Bankacılık Uygulaması' ödülünü 2025'te kaçıncı kez kazandı?", ["1. kez", "2. kez", "3. kez", "5. kez"], 2],
    ["İşCep, Global Finance'ın 'Dünyanın En İyi Mobil Bankacılık Uygulaması' ödülünü ilk kez hangi yıl kazandı?", ["2019", "2021", "2023", "2025"], 2],
    ["Global Finance'ın İşCep'e verdiği ödülün töreni hangi şehirde yapıldı?", ["New York", "Londra", "Dubai", "Frankfurt"], 1],
    ["Haziran 2026 yatırımcı sunumuna göre İşCep'in yaklaşık kaç müşterisi var?", ["6 milyon", "11 milyon", "16 milyon", "26 milyon"], 2],
    ["İşCep üzerinden yaklaşık kaç farklı işlem yapılabiliyor?", ["100'den fazla", "300'den fazla", "800'den fazla", "2.000'den fazla"], 2],
    ["Diğer bankalardaki paranı İşCep'ten İş Bankası'na getirmek için hangi menü kullanılır?", ["Para Aktar › İş Bankası Hesabıma Para Getir", "Hesaplarım › Hesap Kapat", "Kartlarım › Limit Artır", "Ayarlar › Açık Hesap"], 0],
  ]),

  // --- İşCep'in gizli özellikleri (21 Ekim 2026; isbank.com.tr ürün sayfaları ve sitedeki İşCep ipuçları) ---
  K("iscep", [
    ["İşCep'te Visa ile yurt dışı para transferinin ücreti ne kadar?", ["Ücretsiz", "Gönderilen tutarın %1'i", "250 TL sabit", "25 USD + muhabir banka masrafı"], 2],
    ["İşCep'ten Visa ile yurt dışına tek işlemde en fazla ne kadar gönderilebilir?", ["1.000 USD", "5.000 USD", "10.000 USD", "50.000 USD"], 1],
    ["Visa ile yurt dışı para transferi İşCep'te hangi menüde?", ["Para Aktar › Başka Hesaba › Visa ile Yurt Dışı Para Transferi", "Kartlar › Visa İşlemleri", "Yatırım › Döviz › Transfer", "Ödeme Yap › Yurt Dışı"], 0],
    ["Visa ile yurt dışına gönderilen para alıcının bankasına ne kadar sürede iletilir?", ["Dakikalar içinde", "Ertesi iş günü", "2–3 iş günü", "1 hafta"], 0],
    ["İşCep'le telefondan temassız ödemede kaç TL'nin altındaki alışverişler şifresizdir?", ["750 TL", "1.500 TL", "2.500 TL", "5.000 TL"], 2],
    ["İşCep'le telefondan temassız ödeme için telefon nasıl olmalı?", ["NFC'li, Android 9 ve üzeri", "Herhangi bir iPhone", "Çift SIM kartlı", "Sadece tablet"], 0],
    ["Telefonla temassız öderken İşCep'i açıp giriş yapmak gerekir mi?", ["Evet, her seferinde", "Hayır, telefonun ekran kilidi açık olması yeter", "Sadece 100 TL üzerinde", "Sadece gece"], 1],
    ["İşCep'le akıllı saatten ödeme için saatte hangi işletim sistemi olmalı?", ["watchOS 9", "Wear OS 3.0 ve üzeri", "Tizen 5", "Herhangi bir akıllı bileklik"], 1],
    ["Kart akıllı saate yüklendikten sonra saatle ödeme ve Bankamatik'ten para çekme için ne gerekir?", ["Telefon yanında olmalı", "İnternet bağlantısı şart", "Bluetooth açık olmalı", "Hiçbiri; internet, Bluetooth ve telefon gerekmez"], 3],
    ["Girişimci Kız Çocukları Hesabı en az kaç TL ile açılır?", ["100 TL", "500 TL", "1.000 TL", "10.000 TL"], 2],
    ["Girişimci Kız Çocukları Hesabı kaç gün vadeyle açılır?", ["32 gün", "92 gün", "180 gün", "365 gün"], 2],
    ["Girişimci Kız Çocukları Hesabı'na faiz nasıl verilir?", ["Sabit %10", "Yıllık TÜFE değişimi üzerine prim eklenerek", "Politika faizinin yarısı kadar", "Faiz verilmez, MaxiPuan verilir"], 1],
    ["Kız çocuğu 18 yaşına gelince Girişimci Kız Çocukları Hesabı'ndaki birikim ne olur?", ["Velinin hesabına geçer", "Bloke olur", "Çocuğun vadesiz hesabına aktarılır", "Vakfa bağışlanır"], 2],
    ["İşCep'te Gelen Arama Bilgilendirme açıkken Çözüm Merkezi'nin araması ekranda nasıl görünür?", ["Bilinmeyen Numara", "Türkiye İş Bankası Müşteri Hizmetleri", "Gizli Numara", "İşCep Destek"], 1],
    ["İşCep, şüpheli numaradan gelen aramayı ekranda nasıl gösterir?", ["Olası Şüpheli Çağrı", "Spam", "Dolandırıcı", "Engellenen Arama"], 0],
    ["İşCep'in Zararlı Yazılım Koruma (antivirüs) özelliği hangi telefonlarda var?", ["Sadece iPhone", "Sadece Android", "Hem Android hem iPhone", "Sadece tabletler"], 1],
    ["İşCep'in Zararlı Yazılım Koruması açıkken İşCep kapatılırsa ne olur?", ["Koruma da kapanır", "Arka planda çalışmaya devam eder", "Telefon yeniden başlar", "Sadece Wi-Fi'de çalışır"], 1],
    ["İşCep Seyahatim'den hangi havalimanı için lounge ve fast track satın alınabilir?", ["Esenboğa", "Sabiha Gökçen", "Adnan Menderes", "Antalya"], 1],
    ["Yapay zekâ asistanı Maxi'ye İşCep dışında hangi kanallardan da ulaşılabilir?", ["Telegram ve Signal", "WhatsApp ve Facebook Messenger", "Sadece e-posta", "Hiçbiri"], 1],
    ["Maxi, İşCep'e kaydettiğin faturalar için ne yapar?", ["Faturayı iptal eder", "Ödeme günü gelince hatırlatır", "Faturayı başkasına ödetir", "Hiçbir şey yapmaz"], 1],
    ["İşCep'teki 'Ödeme İste' ile gönderilen istek onaylanınca para hangi sistemle anında geçer?", ["SWIFT", "EFT", "FAST", "Western Union"], 2],
    ["İş Plus seviyeleri hangileridir?", ["Bronz, Gümüş, Altın", "Turkuaz, Mavi, Lacivert", "Klasik, Gold, Platinum", "Yeşil, Sarı, Kırmızı"], 1],
    ["İşCep ana sayfasındaki tutarları tek dokunuşla gizleyen özelliğin adı nedir?", ["Gizli Hesap", "Hassas Mod", "Karanlık Mod", "Kilitli Ekran"], 1],
    ["İşCep'te para gönderirken IBAN'ı elle yazmak yerine ne yapılabilir?", ["IBAN alanındaki kamerayla okutulur", "Sesli söylenir", "Sadece şubeden yazdırılır", "SMS ile gönderilir"], 0],
    ["Telefonun ana ekranında İşCep simgesine basılı tutunca ne çıkar?", ["Uygulama silinir", "Karekodla öde, para çek gibi kısayollar", "Bakiye bildirimi", "Şifre değiştirme ekranı"], 1],
    ["İşCep'teki 'Kanal Kullanım Tercihleri' ile ne yapılabilir?", ["Kart limiti artırılır", "İnternet Şube, Maximum Mobil ve Çözüm Merkezi açılıp kapatılır, saat aralığı belirlenir", "Döviz kuru sabitlenir", "Şube randevusu alınır"], 1],
    ["İşCep Aracım, aracın için ne söyler?", ["Tahmini değerini ve satış süresini", "Yakıt tüketimini", "Lastik basıncını", "Motor arızasını"], 0],
    ["İşCep Evim'de konutun için ne hesaplanabilir?", ["Deprem riski", "Satış ve kira değeri", "Elektrik faturası", "Emlak vergisi cezası"], 1],
    ["İşCep Ailem'de çocuğunla ilgili hangisi görülebilir?", ["ÖSYM sınav sonuçları", "e-Okul notları ve okul duyuruları", "Doktor raporları", "Diş randevusu"], 1],
    ["İşCep'te kaç kısayol eklenebilir, kaçı ana sayfada durur?", ["8 / 2", "16 / 4", "20 / 6", "Sınırsız / 10"], 1],
    ["İşCep'te işlem kısıtlaması için hangi seviyeler seçilebilir?", ["Standart, Kısıtlı, Çok Kısıtlı", "Düşük, Orta, Yüksek", "Açık, Kapalı", "Gündüz, Gece"], 0],
    ["Katılım isteyen kampanyalarda İşCep'te KATIL'a basmadan yapılan harcama ne olur?", ["Yine puan kazandırır", "Puan kazandırmaz", "İki kat puan kazandırır", "İptal edilir"], 1],
  ], "2026-10-21"),

  // --- İş Black ve Maximiles Black (isbank.com.tr/is-black, 21 Ekim 2026'da yeniden kontrol edildi) ---
  K("black", [
    ["İş Black programına dahil olmak için İş Bankası'ndaki aylık ortalama varlık en az ne kadar olmalı?", ["250 bin TL", "500 bin TL", "1 milyon TL", "4 milyon TL"], 2],
    ["İş Black Plus kademesi için aylık ortalama varlık en az ne kadar olmalı?", ["1 milyon TL", "2 milyon TL", "4 milyon TL", "10 milyon TL"], 2],
    ["İş Black programına nasıl dahil olunur?", ["Şubeye dilekçeyle başvurulur", "Yıllık üyelik ücreti ödenir", "Varlığa göre kendiliğinden tanımlanır", "Sadece davetle"], 2],
    ["İş Black müşterileri Maksimum Vadeli Hesap'ta ne kadar ek faiz alır?", ["+%0,5", "+%1", "+%2", "+%3"], 1],
    ["İş Black Plus müşterileri Maksimum Vadeli Hesap'ta ne kadar ek faiz alır?", ["+%1", "+%2", "+%3", "+%5"], 2],
    ["İş Black Plus müşterileri ayda kaç kez ücretsiz yurt dışı para transferi yapabilir?", ["1", "2", "5", "Sınırsız"], 1],
    ["İş Black Plus müşterilerinden kiralık kasa için hangisi alınmaz?", ["Kimlik", "İmza", "Depozito", "Anahtar teslim formu"], 2],
    ["İş Black Plus müşterileri İş Portföy uzmanıyla ne sıklıkla görüşebilir?", ["Haftada bir", "Ayda bir", "3 ayda bir", "Yılda bir"], 2],
    ["İş Black ayrıcalıkları İşCep'te hangi menüden görülür?", ["Kampanyalar › Black", "İş Black", "Ayarlar › Üyelik", "Kartlarım"], 1],
    ["İş Black müşterilerine kültür-sanat etkinliklerinde yüzde kaç indirim var?", ["%10", "%20", "%30", "%50"], 1],
    ["Maximiles Black kartta 1 MaxiMil kaç TL değerindedir?", ["0,10 TL", "0,50 TL", "1 TL", "2 TL"], 2],
    ["Maximiles Black kart için asgari kart limiti ne kadardır?", ["50.000 TL", "150.000 TL", "300.000 TL", "1.000.000 TL"], 2],
    ["Maximiles Black'te satın alma koruması olay başına ne kadara kadar geçerlidir?", ["1.000 TL", "3.000 TL", "10.000 TL", "50.000 TL"], 1],
    ["Maximiles Black'te bilet ve konaklama kartla ödenirse yurt dışı seyahat sigortası limiti ne kadardır?", ["5.000 €", "10.000 €", "30.000 €", "100.000 €"], 2],
  ]),

  // --- Bankamatik ve Gişematik ---
  K("matik", [
    ["Herkesin ATM'lere dediği \"Bankamatik\" adı aslında nedir?", ["Türkçede genel bir kelime", "İş Bankası'nın ATM'lerine verdiği marka", "Merkez Bankası'nın sistem adı", "Bir Alman üreticinin model adı"], 1],
    ["Türkiye'nin ilk ATM'sini (Bankamatik) hangi banka sundu?", ["Ziraat Bankası", "Akbank", "Garanti", "İş Bankası"], 3],
    ["İş Bankası ilk Bankamatik'i ve onunla çalışan kartı hangi yıl sundu?", ["1975", "1982", "1990", "1997"], 1],
    ["Çevrim içi çalışan modern Bankamatik'ler ve banka kartları hangi yıl hizmete girdi?", ["1980", "1987", "1995", "2001"], 1],
    ["İş Bankası'nın yurt dışındaki ilk Bankamatik'i hangi şehirde kuruldu?", ["Londra", "Erbil", "Batum", "Bağdat"], 1],
    ["İşCep ile Bankamatik'i birleştiren hizmetin adı nedir?", ["İşCepmatik", "CepATM", "MaxiMatik", "Gişematik"], 0],
    // Gişematik limitleri henüz isbank.com.tr'de yayımlı değil; eklenince kaynak linki konacak (Ekim 2026)
    ["İş Bankası Gişematik'ten tek seferde en fazla kaç TL para çekilebilir?", ["20.000 TL", "50.000 TL", "120.000 TL", "250.000 TL"], 2],
    ["İş Bankası Gişematik'e tek seferde en fazla kaç TL para yatırılabilir?", ["100.000 TL", "250.000 TL", "500.000 TL", "1.000.000 TL"], 2],
  ]),
  // --- Bankamatik ve Gişematik: yeni sorular (21 Ekim 2026; isbank.com.tr/bankamatik ve İş Vapur duyurusu) ---
  K("matik", [
    ["İş Bankası'nın yüzen şubesi İş Vapur'da nakit işlemler için hangi cihazlar var?", ["2 Bankamatik", "1 GişeMatik ve 1 Bankamatik", "Sadece İşCepmatik", "Cihaz yok, sadece gişe"], 1],
    ["İş Bankası'nın Türkiye genelinde kaç Bankamatik'i var?", ["2.500'e varan", "4.000'e varan", "7.000'e varan", "15.000'e varan"], 2],
    ["Bankamatik'ten (kartla ya da İşCep karekoduyla) günde kaç TL'ye kadar ücretsiz para çekilir?", ["10.000 TL", "20.000 TL", "30.000 TL", "50.000 TL"], 1],
    ["Bankamatik'ten günlük 20.000 TL'yi aşan çekim hangi tutara kadar ücret karşılığı yapılabilir?", ["25.000 TL", "30.000 TL", "40.000 TL", "50.000 TL"], 1],
    ["Bankamatik'ten günlük döviz çekme limiti nedir?", ["300 USD / 300 EUR", "500 USD / 500 EUR", "800 USD / 800 EUR", "2.000 USD / 2.000 EUR"], 2],
    ["Bankamatik'te kartsız olarak başkasının hesabına para yatırmak için ne kullanılır?", ["Alıcının TCKN'si ya da YKN'si", "Alıcının araç plakası", "Alıcının doğum tarihi", "Sadece kart numarası"], 0],
    ["Bankamatik'e yatırılan TL hesaba ne zaman geçer?", ["Anında", "Aynı gün 17:00'de", "Ertesi iş günü", "2 iş günü sonra"], 0],
    ["'Bankamatik'te Ara' özelliği hangi Bankamatik'lerde kullanılabilir?", ["Bütün Bankamatik'lerde, her dilde", "Sadece dokunmatik ekranlı Bankamatik'lerde, Türkçe", "Sadece şube içindekilerde", "Sadece havalimanlarında"], 1],
    ["Kart Bankamatik'te kalırsa hangi numara aranır?", ["112", "0 850 724 0 724", "155", "Aramaya gerek yok, kart kendiliğinden geri gelir"], 1],
    ["Bankamatik'te altınla ilgili hangi işlem yapılabilir?", ["Fiziki altın çekme", "Altın hesabı sorgulama ve altın alım-satımı", "Fiziki altın yatırma", "Hiçbiri"], 1],
    ["Akıllı saatle Bankamatik'ten para çekerken kart şifresi nereye girilir?", ["Bankamatik'in tuş takımına", "Saatin ekranına", "Telefona", "Şifre gerekmez"], 1],
    ["Kartı yanında olmayan müşteri Bankamatik'ten nasıl para çeker?", ["TCKN'sini tuşlayarak", "Bankamatik ekranındaki karekodu İşCep'le okutarak", "Parmak iziyle", "Para çekemez"], 1],
    ["İş Bankası Gişematik cihazları nerede bulunur?", ["Sokaktaki Bankamatik noktalarında", "Şube içinde", "Sadece AVM'lerde", "Sadece havalimanlarında"], 1],
    ["Şube içindeki Gişematik'ten tek seferde çekilebilen tutar, Bankamatik'teki günlük ücretsiz çekim limitinin kaç katıdır?", ["2 katı", "4 katı", "6 katı", "10 katı"], 2],
    ["Gişematik'e tek seferde yatırılabilen tutar, Gişematik'ten çekilebilen tutardan ne kadar fazladır?", ["80.000 TL", "250.000 TL", "380.000 TL", "500.000 TL"], 2],
  ], "2026-10-21"),

  // --- Ödüller, iştirakler ve kurum ---
  K("kurum", [
    ["İş Bankası'nın kaç tane Tarım İhtisas Şubesi var?", ["40-45", "50-55", "55-60", "100 ve üzeri"], 2],
    ["'Hasan Âli Yücel Klasikler Dizisi' hangi yayınevine aittir?", ["Yapı Kredi Yayınları", "İş Bankası Kültür Yayınları", "Can Yayınları", "Remzi Kitabevi"], 1],
    ["İş Bankası İzmir Şubesi'nin şube kodu kaçtır?", ["1000", "3400", "3500", "4200"], 1],
    ["İş Bankası açık bankacılık alanındaki çalışmalarıyla hangi uluslararası yayından ödül aldı?", ["Financial Times", "The Banker", "Forbes", "Bloomberg"], 1],
    ["Euromoney Mükemmellik Ödülleri'nde İş Bankası hangi unvana layık görüldü?", ["Dünyanın En İyi Yenilikçi Bankası", "Avrupa'nın En Sürdürülebilir Bankası", "Orta ve Doğu Avrupa'nın En İyi Dijital Bankası", "Global En İyi Perakende Bankası"], 2],
    ["İş Bankası'nın Sabancı Üniversitesi ile tarımda yeni kuşağı desteklemek için başlattığı programın adı nedir?", ["Dijital Çiftçi Akademisi", "Geleceğin Önder Çiftçileri", "Modern Tarım Liderleri", "Toprak ve Üretim Zirvesi"], 1],
    ["KOBİ'lerin risklerini tek poliçede güvenceye alan ve İşCep'ten alınabilen sigortanın adı nedir?", ["İş'te KOBİ Sigortası", "Esnafın Güvencesi Paketi", "KOBİ Koruma Kalkanı", "Ticari Risk Sigortası"], 0],
    ["İş'te KOBİ Sigortası İş Bankası'nın hangi iştirakiyle sunuluyor?", ["Anadolu Sigorta", "Allianz", "Axa Sigorta", "Türkiye Sigorta"], 0],
    ["İş Bankası'nın seyahat ve otel kampanyalarında sıkça iş birliği yaptığı tur platformu hangisidir?", ["ETS Tur", "Tatilsepeti", "Booking.com", "Jolly Tur"], 0],
    ["İş Bankası'nın KOBİ'ler için dijitalleşme ürünlerini tek çatıda topladığı platformun adı nedir?", ["DijiKolay", "Kolay Ticaret", "E-Şirket", "Dijital Esnaf"], 0],
    ["The Banker dergisi İş Bankası'nı hangi unvana layık gördü?", ["Türkiye'de Yılın Bankası", "Dünyanın En Büyük Bankası", "Avrupa'nın En Eski Bankası", "Yılın Yatırım Bankası"], 0],
  ]),
  K("kurum", [
    ["İş Bankası'nın yüzen şubesi İş Vapur hangi limanda hizmete açıldı?", ["Haydarpaşa", "Galataport", "Kadıköy", "Pendik"], 1],
    ["İş Vapur, afet durumunda kaç kişiyi barındırabilecek şekilde tasarlandı?", ["50", "150", "300", "1.000"], 2],
  ], "2026-10-21")
);
const ISQ = ISQ_ALL.filter((q) => !q[3] || new Date() <= new Date(q[3] + "T23:59:59"));
