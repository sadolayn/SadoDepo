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
  ["Ekim 2026 kampanyası: Maximum anlaşmalı marketlerde tek seferde 20.000 TL alışverişe kaç TL MaxiPuan veriliyor?", ["250 TL", "500 TL", "1.000 TL", "2.000 TL"], 2, "2026-10-31"],
  ["Ekim 2026 'İş Bankası'nı Arkadaşınıza Önerin' kampanyasında davet eden ve yeni müşteri olan arkadaşı kaçar TL MaxiPuan kazanır?", ["100 TL", "250 TL", "500 TL", "1.000 TL"], 2, "2026-10-31"],
];
const ISQ = ISQ_ALL.filter((q) => !q[3] || new Date() <= new Date(q[3] + "T23:59:59"));
