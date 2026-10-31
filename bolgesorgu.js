// Bölge Nabzı arama kuralları: bolge.html ve ana sayfadaki Açılış kartı aynı sorguyu kullansın diye tek yerde.
// S: { il, ilce, elle } (bolge.html'de seçilen yer), ILMAP: data/ililce.json (yoksa null; belirsiz ilçe adları yine de çoğunlukla yakalanır).
var BolgeSorgu = (function () {
// Bir banka müdürünün bölgesinde bilmek isteyeceği konular, dört grupta: [grup, renk, [[simge, ad, başlıkta aranacak kelimeler]]]
// Kelimeler başka anlama kaymasın diye seçildi: "çiftçi" yerine "çiftçiler" (Bakan Çiftçi); "dolu" ("coşku dolu"), "fırtına" ("fırtına gibi"),
// "otel" (otel odasında yakalandı), "sağanak" (hava tahminleri), "sezon", "birincilik", "zirve" çıkarıldı. Google ~32 kelimeyi aşan sorgunun
// sonunu kesiyor; kesilen ifade ilk kelimesine düşüyordu ("yeni başkan" → YENİ Parti). Bu yüzden her konu en fazla Atama kadar uzun
// (en uzun yer kalıbıyla, Efeler + Aydın, denendi) ve ifadeler ayırt edici bir kelimeyle başlar ("organize sanayi" → "organize suç" olmasın).
// Trafik kazası (Ekim 2026): bölgedeki yol kapanmaları, müşteri ya da çalışanı etkileyen kazalar için; "kazası" iş kazalarını da getirir.
// Afet & kesinti "ulaşıma kapandı"yı da arar (kar, sel, heyelan, yol çalışması); ayrı Yol & ulaşım düğmesi küçük ilçelerde boş kalırdı. Sorgu Atama kadar uzun.
// Dolandırıcılık: bölgede yayılan yöntemleri (sahte polis, telefon dolandırıcılığı) önceden bilmek için.
const GRUP = [
  ["İnsanlar", "#b48cf0", [
    ["👔", "Atama", 'atandı OR atama OR "göreve başladı" OR "görevine başladı" OR "göreve getirildi" OR "başkanlığına seçildi"'],
    ["🕊️", "Vefat", 'vefat OR "cenaze töreni" OR "yolculuğuna uğurlandı" OR "toprağa verildi"'],
    ["🏆", "Ödül & başarı", '"ödül aldı" OR "ödülünü aldı" OR "ödülüne layık" OR "ödülü verildi"'],
    ["🗳️", "Kongre & seçim", '"güven tazeledi" OR "yeniden seçildi" OR "başkanı seçildi" OR "genel kurulu"'],
  ]],
  ["İş dünyası", "#3fc283", [
    ["🏭", "Organize sanayi", 'OSB OR "sanayi bölgesi"'],
    ["⚙️", "Sanayi & yatırım", 'fabrika OR yatırım OR "üretim tesisi" OR kapasite'],
    ["🚢", "İhracat & ticaret", 'ihracat OR ithalat OR ihracatçı OR ihracatçılar'],
    ["💳", "Maaş promosyonu", 'promosyon OR promosyonu OR "promosyon anlaşması" OR "promosyon ihalesi"'],
    ["🏪", "Açılış", '"açılış töreni" OR "hizmete açıldı" OR "hizmete girdi" OR "açılışı yapıldı" OR "açılışını yaptı"'],
    ["⚖️", "Konkordato & iflas", 'konkordato OR iflas OR "icradan satılık"'],
  ]],
  ["Kamu & şehir", "#5aa9f0", [
    ["🏛️", "Belediye & ihale", 'belediye OR ihale OR "meclis kararı" OR altyapı'],
    ["🏗️", "İnşaat & konut", '"konut projesi" OR "kentsel dönüşüm" OR imar OR TOKİ OR "temeli atıldı"'],
    ["🤝", "Oda & borsa", '"ticaret odası" OR "ticaret borsası" OR "esnaf odası" OR "sanayi odası"'],
    ["💼", "İstihdam", 'istihdam OR İŞKUR OR "kariyer fuarı" OR "işçi alımı"'],
  ]],
  ["Bölge hayatı", "#f0c64a", [
    ["🌾", "Tarım", 'hasat OR hasadı OR rekolte OR çiftçiler OR tarımsal OR "zirai don"'],
    ["🏨", "Turizm", 'turizm OR turist OR turistler OR "turizm sezonu" OR "doluluk oranı"'],
    ["🎪", "Fuar & etkinlik", 'fuar OR festival OR şenlik OR panel OR sempozyum'],
    ["⚠️", "Afet & kesinti", 'sel OR deprem OR kesintisi OR heyelan OR hortum OR "orman yangını" OR "ulaşıma kapandı"'],
    ["🚗", "Trafik kazası", 'kaza OR kazada OR kazası OR "zincirleme kaza" OR devrildi'],
    ["🚨", "Dolandırıcılık", 'dolandırıcılık OR dolandırıcı OR dolandırıcılar OR dolandırıldı OR "sahte polis"'],
  ]],
];

// Haber sorgusu: yer de konu da BAŞLIKTA aranır (intitle:). Ekim 2026 denemelerinde görülenler:
// - Yer metinde aranınca site menüsünde ya da kaynak adında geçen ilçe ("… - Aydın Ses Gazetesi") başka yerin haberini getiriyordu.
// - Google konu kelimesini bulamayınca onu atıp yalnızca yere uyan haberleri gösteriyordu; başlık şartıyla ya ilgili haber gelir ya da liste boş kalır.
// - İl adı yalın aranınca soyadlara (Ertan Aydın), kulüplere ve kaynak adlarına ("Erzincan'da … - Bayburt Haber") takılıyordu;
//   il geneli yalnızca "-da/-de" ekiyle aranır (Aydın'da, Bayburt'ta). "Aydın'ın", "Aydınlı" da soyadlara takılıyordu (Müfit Aydın'ın, Hasan İzmirli).
// - Yer için birden çok kalıp OR ile verilince haber olmayan küçük illerde Google konuyu bırakıp alakasız haber dolduruyordu; yer hep tek kalıp.
// - Eksi işareti (-lig) süreyi bozuyor, 32 kelimeyi aşan sorgu gevşiyor; ikisi de kullanılmaz.
// - Başka bir kelime, kişi, kulüp ya da başka ilin ilçesi olan adlarda (Çay, Kale, Pazar, Güney, Efeler, Beşiktaş…) il adı da başlıkta aranır.
const SURE = { "1d": "Son 24 saat", "7d": "Son 7 gün", "30d": "Son 1 ay" }; // "30d" anahtarı kayıtlı tercihler bozulmasın diye kaldı
const AYNI = new Set(("Aladağ,Çukurova,İmamoğlu,Karataş,Seyhan,Ceyhan,Dinar,Hamur,Güzelyurt,Bala,Çubuk,Evren,Kalecik,Yenimahalle,Kepez,Elmalı,Gazipaşa,"
  + "Efeler,Köşk,Bozdoğan,Marmara,Karesi,Ulus,Söğüt,Genç,Bucak,Nilüfer,Osmangazi,Yıldırım,Orta,Eldivan,Kızılırmak,Çerkeş,Alaca,Kargı,Laçin,"
  + "Güney,Çardak,Babadağ,Bağlar,Çınar,Dicle,Eğil,Hani,Kulp,Meriç,Maden,Keban,Olur,Horasan,Aziziye,İnönü,Köse,Belen,Defne,Aralık,Atabey,"
  + "Adalar,Avcılar,Bağcılar,Beşiktaş,Başakşehir,Fatih,Kartal,Pendik,Tuzla,Sarıyer,Ümraniye,Maltepe,Konak,Karşıyaka,Menderes,Menemen,Selçuk,"
  + "Çeşme,Kiraz,Bayındır,Karaburun,Onikişubat,Afşin,Türkoğlu,Pazarcık,Ayrancı,Kazımkarabekir,Selim,Susuz,Akyaka,Araç,Küre,Talas,Hacılar,İncesu,"
  + "Çelebi,Keskin,Delice,Vize,Kaman,Akpınar,Körfez,Gölcük,Meram,Karatay,Selçuklu,Derbent,Taşkent,Çeltik,Kulu,Karapınar,Halkapınar,Gediz,"
  + "Demirci,Sarıgöl,Şehzadeler,Yunusemre,Kula,Akdeniz,Toroslar,Gülnar,Menteşe,Korkut,Bulanık,Çiftlik,Perşembe,Kumru,Kabataş,Altınordu,Bahçe,"
  + "Fındıklı,Karasu,Hendek,Erenler,Kaynarca,Kavak,Canik,Havza,İlkadım,Çarşamba,19 Mayıs,Dikmen,Durağan,Zara,Kangal,Ulaş,Akıncılar,İdil,"
  + "Muratlı,Hayrat,Ortahisar,Maçka,İpekyolu,Özalp,Muradiye,Çaldıran,Termal,Armutlu,Sarıkaya,Devrek").split(","));
const kucuk = (t) => String(t).toLocaleLowerCase("tr");
// Bulunma eki: Aydın'da, İzmir'de, Muş'ta, Tokat'ta, Rize'de
const deEk = (ad) => { const k = kucuk(ad), v = (k.match(/[aeıioöuü]/g) || ["e"]).pop(); return ad + "'" + (/[çfhkpsşt]$/.test(k) ? "t" : "d") + (/[aıou]/.test(v) ? "a" : "e"); };
const belirsiz = (c, ILMAP) => c.length <= 3 || AYNI.has(c) || (!!ILMAP && Object.values(ILMAP).filter((L) => L.includes(c)).length > 1);
function yerSorgu(S, ILMAP) {
  if (S.elle) { const e = S.elle.replace(/"/g, ""); return !S.il ? `intitle:"${e}"` : belirsiz(e, ILMAP) || (ILMAP && ILMAP[e]) ? `intitle:"${e}" intitle:"${S.il}"` : `intitle:"${e}" ${S.il}`; }
  const il = S.il, ilce = S.ilce === "Merkez" ? "" : S.ilce;
  if (ilce) return belirsiz(ilce, ILMAP) ? `intitle:"${ilce}" intitle:"${il}"` : `intitle:"${ilce}" ${il}`;
  return `intitle:"${deEk(il)}"`;
}
const baslikta = (ek) => ek.split(" OR ").map((t) => "intitle:" + t.trim()).join(" OR ");
// Haberler Google Arama'nın Haberler sekmesinde açılır (30 Ekim 2026): Google Haberler sonuçları alaka sırasıyla veriyor, tarihe göre
// sıralanamıyordu (26 gün önceki haber 3 gün öncekinin üstünde). Arama sekmesinde süre tbs=qdr:d/w/m, tarihe göre sıra sbd:1 ile verilir;
// "when:" kullanılmaz (Google Haberler'de sonda kalınca uzun sorguda kesiliyordu).
const sorgu = (S, ILMAP, ek) => yerSorgu(S, ILMAP) + (ek ? " (" + baslikta(ek) + ")" : "");
// sure: "1d" | "7d" | "30d"
const gn = (S, ILMAP, ek, sure) => `https://www.google.com/search?tbm=nws&tbs=qdr:${{ "1d": "d", "7d": "w", "30d": "m" }[sure || S.sure] || "m"},sbd:1&hl=tr&gl=tr&q=${encodeURIComponent(sorgu(S, ILMAP, ek))}`;
return { GRUP: GRUP, SURE: SURE, yer: yerSorgu, gn: gn };
})();
