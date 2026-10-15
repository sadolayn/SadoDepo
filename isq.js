// İş Bankası soru havuzu: Batak MaxiPuan sorusu ve Oyunlar giriş sorusu ortak kullanır
// Format: [soru, şıklar, doğru şık indeksi, (opsiyonel) son geçerlilik tarihi]
// İzmir Şubesi 12 Temmuz 1925'te açıldı; yıl sayısı bugüne göre hesaplanır
function izmirQ() {
  const t = new Date();
  let y = t.getFullYear() - 1925;
  if (t < new Date(t.getFullYear(), 6, 12)) y--;
  return ["İş Bankası İzmir Şubesi kaç yıldır hizmet veriyor? (" + t.toLocaleDateString("tr-TR") + " itibarıyla)", [(y - 25) + " yıl", (y - 10) + " yıl", y + " yıl", (y + 6) + " yıl"], 2];
}
const ISQ_ALL = [
  ["Türkiye İş Bankası hangi yıl kuruldu?", ["1923", "1924", "1927", "1933"], 1],
  ["Türkiye İş Bankası'nın kurucusu kimdir?", ["Mustafa Kemal Atatürk", "İsmet İnönü", "Kâzım Karabekir", "Celâl Bayar"], 0],
  ["İş Bankası'nın ilk genel müdürü kimdir?", ["Muammer Eriş", "Celâl Bayar", "Şükrü Saracoğlu", "Hasan Saka"], 1],
  ["İş Bankası hangi tarihte kuruldu?", ["29 Ekim 1923", "26 Ağustos 1924", "23 Nisan 1920", "30 Ağustos 1922"], 1],
  ["İş Bankası hangi şehirde kuruldu?", ["İstanbul", "İzmir", "Ankara", "Bursa"], 2],
  ["İş Bankası'nın kuruluş sermayesi ne kadardı?", ["100 bin lira", "500 bin lira", "1 milyon lira", "10 milyon lira"], 2],
  ["Atatürk, İş Bankası'nın 1 milyon liralık kuruluş sermayesinin ne kadarını karşıladı?", ["100 bin lira", "250 bin lira", "500 bin lira", "Tamamını"], 1],
  ["Atatürk'ün İş Bankası hisseleri, vasiyeti gereği hangi parti tarafından temsil edilir?", ["Cumhuriyet Halk Partisi", "Demokrat Parti", "Hazine", "TBMM"], 0],
  ["Atatürk'ün İş Bankası hisselerinin kâr payları hangi kurumlara gider?", ["TÜBİTAK ve YÖK", "Türk Dil Kurumu ve Türk Tarih Kurumu", "Kızılay ve Darüşşafaka", "Milli Eğitim ve Diyanet"], 1],
  ["İş Bankası'nın kaç tane Tarım İhtisas Şubesi var?", ["40-45", "50-55", "55-60", "100 ve üzeri"], 2],
  ["İş Bankası İktisadi Bağımsızlık Müzesi, bankanın Ankara'daki tarihi genel müdürlük binasındadır. Bu bina hangi semttedir?", ["Kızılay", "Çankaya", "Ulus", "Bahçelievler"], 2],
  ["'Hasan Âli Yücel Klasikler Dizisi' hangi yayınevine aittir?", ["Yapı Kredi Yayınları", "İş Bankası Kültür Yayınları", "Can Yayınları", "Remzi Kitabevi"], 1],
  ["İşCep, hangi derginin 'En İyi Dijital Banka Ödülleri'nde birçok kez 'Dünyanın En İyi Mobil Bankacılık Uygulaması' seçildi?", ["Forbes", "Global Finance", "Time", "National Geographic"], 1],
  ["Maximum kart harcamalarında kazanılan puanın adı nedir?", ["MaxiPuan", "Bonus", "ParaPuan", "Chip-para"], 0],
  ["Telefona ya da eşyaya yapıştırılıp temassız ödeme yapılan İş Bankası kart ürününün adı nedir?", ["MaxiPara", "MaxSticker", "Maximiles Black", "İşCep Pay"], 1],
  ["MaxSticker'ın üzerinde aşağıdakilerden hangisi bulunmaz?", ["Kart numarası, son kullanma tarihi ve CVV", "Temassız ödeme çipi", "Maximum özelliği", "MaxiPuan kazanımı"], 0],
  ["MaxSticker başvurusu nereden yapılır?", ["Sadece şubeden", "İşCep'teki 'MaxSticker Kartlarım' menüsünden", "ATM'den", "Kargo ile"], 1],
  ["Maximum kartla akıllı saatten ödeme ('Saat ile Öde') hangi uygulamadan etkinleştirilir?", ["İşCep", "Maximum Mobil", "İşCep ve Maximum Mobil", "İmece Mobil"], 2],
  ["İş Bankası'na uzaktan, görüntülü görüşmeyle müşteri olmak için İşCep'teki özelliğin adı nedir?", ["Hızlı Kredi", "Müşteri Olmak İstiyorum", "Kolay Adres", "QR ile Öde"], 1],
  ["İş Bankası Gişematik'ten tek seferde en fazla kaç TL para çekilebilir?", ["20.000 TL", "50.000 TL", "120.000 TL", "250.000 TL"], 2],
  ["İş Bankası Gişematik'e tek seferde en fazla kaç TL para yatırılabilir?", ["100.000 TL", "250.000 TL", "500.000 TL", "1.000.000 TL"], 2],
  izmirQ(),
  ["İş Bankası İzmir Şubesi'nin şube kodu kaçtır?", ["1000", "3400", "3500", "4200"], 1],
  // --- Güncel ürün ve dijital hizmetler (Ekim 2026, isbank.com.tr ve basın kaynaklarıyla doğrulandı) ---
  ["İş Bankası açık bankacılık alanındaki çalışmalarıyla hangi uluslararası yayından ödül aldı?", ["Financial Times", "The Banker", "Forbes", "Bloomberg"], 1],
  ["Euromoney Mükemmellik Ödülleri'nde İş Bankası hangi unvana layık görüldü?", ["Dünyanın En İyi Yenilikçi Bankası", "Avrupa'nın En Sürdürülebilir Bankası", "Orta ve Doğu Avrupa'nın En İyi Dijital Bankası", "Global En İyi Perakende Bankası"], 2],
  ["İşCep'teki Açık Bankacılık hizmetine eklenen yeni özellik hangisidir?", ["Sadece kripto varlık takibi", "Farklı bankalardaki kartların İşCep'ten görüntülenmesi", "Yabancı borsa hisse alımı", "Araç kiralama entegrasyonu"], 1],
  ["Fiziksel kartın özelliklerini dijital ortama taşıyıp plastik kullanımını azaltan İş Bankası uygulamasının adı nedir?", ["Esnek Kart", "Dijital Kullanım", "Çevre Kart", "Yeşil Cüzdan"], 1],
  ["Akıllı saatle temassız ödeme hangi teknoloji kategorisine girer?", ["Giyilebilir teknoloji", "Blokzincir transferi", "Biyometrik göz taraması", "Sesli komutla kredi"], 0],
  ["İş Bankası ile Burgan Bank iş birliğiyle Maximum ekosistemine katılan kart hangisidir?", ["Bonus Kart", "Axess Kart", "ON Kredi Kartı", "World Card"], 2],
  ["İş Bankası'nın Sabancı Üniversitesi ile tarımda yeni kuşağı desteklemek için başlattığı programın adı nedir?", ["Dijital Çiftçi Akademisi", "Geleceğin Önder Çiftçileri", "Modern Tarım Liderleri", "Toprak ve Üretim Zirvesi"], 1],
  ["KOBİ'lerin risklerini tek poliçede güvenceye alan ve İşCep'ten alınabilen sigortanın adı nedir?", ["İş'te KOBİ Sigortası", "Esnafın Güvencesi Paketi", "KOBİ Koruma Kalkanı", "Ticari Risk Sigortası"], 0],
  ["İş'te KOBİ Sigortası İş Bankası'nın hangi iştirakiyle sunuluyor?", ["Anadolu Sigorta", "Allianz", "Axa Sigorta", "Türkiye Sigorta"], 0],
  ["İş Bankası İnternet Şubesi bilgileriyle ayrı şifre almadan giriş yapılabilen kamu platformu hangisidir?", ["Vergi Dairesi Portalı", "e-Devlet Kapısı", "e-Nabız", "UYAP Vatandaş"], 1],
  ["İşCep'ten şifre girmeden doğrudan geçiş yapılabilen iki iştirak hangisidir?", ["Anadolu Hayat Emeklilik ve Anadolu Sigorta", "Şişecam ve Türk Telekom", "İş Yatırım ve Softtech", "Arçelik ve Migros"], 0],
  ["İş Bankası'nın seyahat ve otel kampanyalarında sıkça iş birliği yaptığı tur platformu hangisidir?", ["ETS Tur", "Tatilsepeti", "Booking.com", "Jolly Tur"], 0],
  ["Farklı bankalardaki hesapların tek ekrandan izlenmesini sağlayan altyapının genel adı nedir?", ["Mobil Cüzdan", "Açık Bankacılık", "Ortak ATM Ağı", "Dijital Köprü"], 1],
  ["7/24 kesintisiz ve anlık TL transferi sağlayan, İş Bankası'nın da kullandığı sistem hangisidir?", ["SWIFT", "FAST", "EFT", "Western Union"], 1],
  ["Hesap numarası yerine telefon, e-posta ya da TCKN ile para almayı sağlayan özelliğin adı nedir?", ["Pratik Kod", "CepBank", "Kolay Adres", "Hızlı Transfer"], 2],
  ["İş Bankası'nın tarım üreticilerine girdi alımları için sunduğu kartın adı nedir?", ["Başak Kart", "İmece Kart", "Üretici Kart", "Bereket Kart"], 1],
  ["İş Bankası'nın KOBİ'ler için dijitalleşme ürünlerini tek çatıda topladığı platformun adı nedir?", ["DijiKolay", "Kolay Ticaret", "E-Şirket", "Dijital Esnaf"], 0],
  ["Kredi kartı kampanyalarını, harcama ve MaxiPuan takibini tek yerde toplayan İş Bankası uygulaması hangisidir?", ["Maximum Mobil", "İşCep Cüzdan", "Bonus Flaş", "Axess Mobil"], 0],
  ["İşCep ve Maximum Mobil'deki yapay zekâ destekli kişisel asistanın adı nedir?", ["Maxi", "Pepper", "İşbot", "Asistan İş"], 0],
  ["Kredi notu sorgulaması dijital kanallardan hangi kuruluş üzerinden yapılır?", ["Kredi Kayıt Bürosu (Findeks)", "Merkez Bankası", "BDDK", "Hazine"], 0],
  ["İş Bankası'nda kredili mevduat hesabının (KMH) yaygın adı nedir?", ["Artı Para", "Ek Hesap", "Avans Hesap", "Esnek Hesap"], 1],
  ["İşCep üzerinden de kullanılabilen uluslararası para transferi hizmeti hangisidir?", ["Western Union", "MoneyGram", "Ripple", "Wise"], 0],
  ["İş Bankası dijital kanallarından vergi, trafik cezası ve MTV dışında hangileri de ödenebilir?", ["ÖSYM sınav ücretleri", "Pasaport harcı", "Tapu harcı", "Hepsi"], 3],
  ["The Banker dergisi İş Bankası'nı hangi unvana layık gördü?", ["Türkiye'de Yılın Bankası", "Dünyanın En Büyük Bankası", "Avrupa'nın En Eski Bankası", "Yılın Yatırım Bankası"], 0],
  ["Ekim 2026 kampanyası: Maximum anlaşmalı marketlerde tek seferde 20.000 TL alışverişe kaç TL MaxiPuan veriliyor?", ["250 TL", "500 TL", "1.000 TL", "2.000 TL"], 2, "2026-10-31"],
  ["Ekim 2026 'İş Bankası'nı Arkadaşınıza Önerin' kampanyasında davet eden ve yeni müşteri olan arkadaşı kaçar TL MaxiPuan kazanır?", ["100 TL", "250 TL", "500 TL", "1.000 TL"], 2, "2026-10-31"],
];
const ISQ = ISQ_ALL.filter((q) => !q[3] || new Date() <= new Date(q[3] + "T23:59:59"));
