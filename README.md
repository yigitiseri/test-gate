# Kızıl Elma 1451

Tarayıcıda oynanan, harita üzerinde sıra tabanlı bir tarih-strateji oyunu. Yıl 1451: II. Mehmed tahta çıkmış, Konstantiniyye surları hâlâ ayakta. Balkanlar, Anadolu, Kafkasya, Mezopotamya, Levant, Mısır ve Güney İtalya'yı kapsayan haritada 28 devletten birini seçip 1531'e kadar yönetiyorsun.

## Nasıl oynanır

`index.html` dosyasını bir tarayıcıda açman yeterli. Kurulum ya da sunucu gerekmez.

- **Seç ve yürüt:** Kendi eyaletine dokun, sonra komşu bir eyalete dokun. Yeşil komşular kendi toprağın, kırmızılar savaştığın düşman. Asker sayısını ayarlayıp **Yürüt** ya da **Saldır**.
- **Muharebe:** Savunmaya garnizon, yerel milis ve kale katılır. Dağlık eyaletler +%30 savunur, kış seferlerinde saldırı gücü %15 düşer.
- **Topçu:** Osmanlı 1453'te (Urban'ın topları), herkes 1460'ta kuşatma topu kazanır. Toplar kale bonusunun büyük kısmını etkisiz kılar.
- **Ekonomi:** Gelir eyalet gelişiminden gelir. Pazar, kışla, kale ve imar inşa edilebilir. Her 1.000 asker tur başına 1 altın maaş ister.
- **Diplomasi:** Savaş ilan et, barış ya da haraç iste, ittifak kur, hediye gönder. Müttefikler savunma savaşlarında yardıma gelir.
- **Hedefler:** Her büyük devletin tarihî hedefleri var: Konstantiniyye'nin fethi, Belgrad kuşatması, Kroya direnişi, Tebriz gibi.
- **Olaylar:** Veba, kervanlar, ayaklanmalar, paralı askerler, Urban'ın topları, 1501'de Safevîlerin doğuşu.
- **Zafer:** Eyaletlerin yarısına hükmet ya da 1531'e kadar en yüksek puanı topla.

- **Ses:** Hicaz makamında ney, ud, davul ve def ile çalan fon müziği; savaşta mehter havasına döner. Yürüyüş, kılıç, top, zafer borusu, gong ve çan efektleri. Hepsi Web Audio ile kodla üretilir, ses dosyası yoktur. Üst çubuktaki düğmeyle kapatılır; menüde müzik, efekt ve ses düzeyi ayarları var.

Oyun her turun sonunda tarayıcıya otomatik kaydedilir.

## Teknik

Harita varsayılan olarak Three.js (WebGL) ile 3D çizilir: yükselti haritasından üretilen arazi ağı, güneş ışığı ve gölgeler, dalgalanan su, 3D kaleler ve asker figürleri. Sol alttaki **2D/3D** düğmesiyle düz haritaya geçilebilir; Three.js yüklenemezse oyun kendiliğinden 2D çalışır.


Tek bir HTML dosyası, harici kütüphane yok. Harita her açılışta prosedürel olarak üretilir: kıyı şeritleri enlem-boylam poligonlarından gürültüyle bozularak çizilir, eyalet sınırları gerçek şehir koordinatlarından türetilen ve kara kütlesiyle sınırlandırılan bir Voronoi bölümlemesidir. Nehirler, dağlar ve deniz yolları da haritada gösterilir.
