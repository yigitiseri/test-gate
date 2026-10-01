# Age of Dynasties

[English](README.md) | **Türkçe**

Tarayıcıda oynanan, harita üzerinde sıra tabanlı bir tarih-strateji oyunu. Yıl 1451: genç II. Mehmed Osmanlı
tahtına yeni çıkmış, Konstantiniyye surları hâlâ ayakta. Balkanlar, Anadolu, Kafkasya, Mezopotamya, Levant,
Mısır ve Güney İtalya'yı kapsayan haritada 28 devletten birini seçip 1531'e kadar yönetiyorsun.

Oyun **Türkçe ve İngilizce** oynanabilir (açılış ekranından ya da menüden değiştirilir).

**Oyna:** https://yigitiseri.github.io/test-gate/ (ya da `index.html` dosyasını bir tarayıcıda aç: kurulum ya da sunucu gerekmez).

## Nasıl oynanır

- **Ordular ve garnizonlar.** Her devletin ordusu haritada kendi sancağıyla yürür: üstünde devletin arması,
  altında asker sayısı, kırmızı mühürde komutanın baş harfleri. Sancağa, sonra bir eyalete dokun; yol altın
  kesik çizgiyle görünür. Ordular birleştirilir, bölünür, dağıtılır. Şehirleri garnizonlar korur; garnizon
  savunur ama sefere çıkmaz.
- **Muharebe.** Meydan muharebesinde ordular çarpışır; hücumda surlar, garnizon ve yerel milis karşına çıkar.
  Kale, dağ, kış, komutan ve biraz talih hesaba girer. Muharebeden sonra **muharebe kartı** neden kazandığını ya
  da kaybettiğini zarlarıyla gösterir.
- **Kuşatma ve barış.** Surlu şehirler kuşatılmalı: surların önünde ordugâh kurulur, küçük bir taş şerit surların
  ne kadar ayakta olduğunu gösterir (Konstantiniyye topsuz altı mevsim kadar, Urban'ın toplarıyla iki mevsim
  dayanır). Bir şehri alınca karar senin: hemen **ilhak et** ya da işgalde tut (senin renginde
  taranır, vergisinin yarısı sana gelir) ve **Barış Masası**'nda pazarlık için kullan; masada savaş skoruna
  göre şehir ve altından bir sepet hazırlarsın. Uzun savaşlar devletleri yıpratır.
- **Yaşayan bir dünya.** Yapay zekâ devletleri sefer hedefi seçer, ordularını toplar, alabileceği şehirleri
  kuşatır ve barış yapar; fazla hızlı büyüyen devlet komşularını korkutup ittifaka iter.
- **Komutanlar.** Paşalar, şehzadeler, hatta sultanın kendisi ordunun başına geçebilir; her birinin yıldızları ve
  özellikleri vardır (akıncı bir bey daha uzağa yürür). Komutanı ordu panelinden atar ya da başka ordudan
  alırsın; komutanı ölen ya da esir düşen ordunun başına tur sonunda boştaki bir paşa geçer.
- **Kısayollar.** Üst çubukta **Ordu**'ya ya da **Eyalet**'e dokununca ordularını ya da eyaletlerini sırayla
  gösterir; unuttuğun bir ada ya da kaybolan bir ordu hep bir dokunuş uzağındadır.
- **Hanedanlar.** Hükümdarlar yaşlanır, ölür, yerine veliaht geçer; Venedik dojunu seçer; veliaht yoksa taht
  kavgası çıkar.
- **Ekonomi.** Gelir gelişmiş eyaletlerden gelir. Pazar, kışla, kale ve imar yaparsın; askerlerine her mevsim
  maaş ödersin.
- **Diplomasi.** Savaş ilan et, barış ya da haraç iste, ittifak kur, hediye gönder. Müttefikler savunma
  savaşlarında yardıma gelir. Yapay zekâ devletlerinin kişiliği vardır ve yaptıklarını unutmazlar.
- **1529'a kadar tarih.** 1453, Belgrad, Otlukbeli, Cem Sultan, Otranto, Çaldıran, Mercidabık ve Ridaniye, Rodos,
  Mohaç (ve Macaristan'ın Habsburglara geçişi) ile Viyana zincirleri; boş kalan tahtlar taht davacısının iç
  savaşını getirebilir; vakayiname büyük muharebeleri adlarıyla anar.
- **Hedefler ve tarih.** Her devletin tarihî hedefleri (Konstantiniyye'nin fethi, Belgrad kuşatması, Kroya
  direnişi, Tebriz …) ve olay zincirleri var: 1453, Belgrad 1456, Otlukbeli 1473, Cem Sultan 1481, Urban'ın
  topları, 1501'de Safevîlerin doğuşu, veba, kervanlar, ayaklanmalar, paralı askerler.
- **Sefer haberleri.** Her mevsim sonunda o turun yürüyüşleri ve muharebeleri haritada kısaca oynatılır;
  istediğin an atlayabilirsin.
- **Vezir.** Vezirin dikkat etmen gereken bir şey olunca kısa öğütler verir; adım adım eğitim ilk turları
  öğretir. Oyun içindeki **rehber** para, savaş, binalar ve diplomasiyi sade bir dille anlatır.
- **Zafer.** Eyaletlerin yarısına hükmet ya da 1531'de en yüksek puana sahip ol.

Oyun her hamleden sonra kendini kaydeder; açılış ekranındaki "Kayıtlı oyuna dön" ile devam edilir.

## Ses ve görünüm

Hicaz makamında ney, ud, davul ve def ile fon müziği; savaşta mehter havasına döner. Yürüyüş, kılıç, top, zafer
borusu, gong ve çan efektleri. Hepsi Web Audio ile kodla üretilir, ses dosyası yoktur.

Arayüz bir el yazması gibi tasarlandı: parşömen paneller, deri üst çubuk, balmumu mühürlü fermanlar, her devlet
için SVG arma. Harita eski bir portolan gibi: pusula gülleri, rüzgâr çizgileri ve kadırgalar. 3D'de şehirlerde
kubbe ve minare, kilise ya da çan kulesi, başkentlerde armalı bayrak ve denizde latin yelkenli kadırgalar var.

## iPhone / Android'e yükleme

Oyun bir web uygulamasıdır (PWA): ikonu, tam ekran açılışı ve çevrimdışı önbelleği vardır.

1. Oyunu HTTPS üzerinden (örneğin yukarıdaki GitHub Pages adresi) iPhone'da **Safari** ile aç.
2. **Paylaş** → **Ana Ekrana Ekle** → **Ekle**.

Oyun ana ekrandan tarayıcı çubukları olmadan açılır, ilk açılıştan sonra internet olmadan da oynanır.

## Teknik

- Tek bir HTML dosyası, `src/` altından üretilir; çalışırken CDN'den gelen three.js dışında bağımlılık yoktur.
- Harita her açılışta prosedürel üretilir: kıyılar enlem-boylam poligonlarından gürültüyle, eyaletler gerçek şehir
  koordinatlarından karaya kırpılmış bir Voronoi bölümlemesiyle; nehirler, dağlar ve deniz yollarıyla.
- 3D (three.js, WebGL): yükselti haritasından arazi, güneş ışığı ve gölgeler, dalgalanan su, kaleler ve alaylar.
  Pil için yalnız bir şey değişince çizilir; telefonlar 2D açılır. three.js yüklenemezse oyun 2D çalışır.
- İki dil: oyuncunun gördüğü metinler Türkçe/İngilizce çiftleri olarak yazılır; dil cihazdan seçilir ve her an
  değiştirilebilir.

## Geliştirme

`index.html` elle düzenlenmez: `src/` altındaki şablon, CSS ve JS parçalarından `node build.js` ile üretilir.
Testler (Playwright, başsız Chromium): `tests/run-all.sh`, İngilizce kapsamı için `node tests/i18n.js`. Dosya
düzeni ve kurallar için [CONTRIBUTING.md](CONTRIBUTING.md).
