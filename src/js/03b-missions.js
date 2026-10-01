/* =====================================================================
   MISSIONS (Track C): historic goal trees for all 28 factions.
   A mission: {id,br:'A'|'B',t,d,req?:[ids],g?,dev?:[key|'cap',n], and one goal:}
     own:[province keys]          own all of them
     hold:key, vs:faction, turns  keep the province while really threatened (at war with vs,
                                  or an enemy army next to it) for that many turns; done at once if vs is gone
     ally:faction                 be allied with it
     devAt:{key:dev}              own these provinces and raise them to that development
     mkt:n                        markets in n provinces
     gold:n|'auto'                treasury (auto: scaled to the starting net income)
     count:n                      number of provinces
     won:n                        battles won
   A mission is open once every mission in req is done. MIS_BR names the two branches.
   ===================================================================== */
const MIS={
 OSM:[{id:'A1',br:'A',t:'Konstantiniyye\'nin Fethi',d:'Şehri al; Rumeli ile Anadolu birleşsin.',own:['istanbul'],g:150,dev:['istanbul',2]},
  {id:'A2',br:'A',req:['A1'],t:'Mora Seferi',d:'Despotların Mistra ve Korint kalelerini al.',own:['mistra','korint'],g:60},
  {id:'A3',br:'A',req:['A1'],t:'Sırp Gümüşü',d:'Semendire kalesi ile Novobırda madenlerini al.',own:['semendire','novobirda'],g:90},
  {id:'A4',br:'A',req:['A3'],t:'Belgrad Kapısı',d:'Macarların Tuna kalesini düşür.',own:['belgrad'],g:90},
  {id:'A5',br:'A',req:['A4'],t:'Budin\'e Doğru',d:'Macar başkentini al.',own:['budin'],g:200},
  {id:'A6',br:'A',req:['A1'],t:'Otranto Seferi',d:'İtalya kıyısında bir köprübaşı kur.',own:['otranto'],g:80},
  {id:'A7',br:'A',req:['A6'],t:'Roma Seferi',d:'Kızıl Elma: Roma\'yı fethet.',own:['roma'],g:300},
  {id:'B1',br:'B',t:'Karaman Meselesi',d:'Konya ve Larende\'yi ilhak et.',own:['konya','karaman'],g:80},
  {id:'B2',br:'B',req:['B1'],t:'Trabzon Seferi',d:'Komnenosların son kalesini al.',own:['trabzon'],g:60},
  {id:'B3',br:'B',req:['B1'],t:'Doğu Seferi',d:'Tebriz\'e yürü ve İran kapısını aç.',own:['tebriz'],g:150},
  {id:'B4',br:'B',req:['B1'],t:'Mısır\'ın Anahtarı',d:'Halep ve Kahire\'yi fethet.',own:['halep','kahire'],g:250},
  {id:'B5',br:'B',req:['B4'],t:'Kudüs ve Şam',d:'Kudüs ile Şam\'ı al; Hicaz yolu Osmanlı\'nın olsun.',own:['kudus','sam'],g:150}],
 BYZ:[{id:'A1',br:'A',t:'Surları Tut',d:'Osmanlı kuşatması sürerken Konstantiniyye\'yi 8 tur boyunca elinde tut.',hold:'istanbul',vs:'OSM',turns:8,g:120},
  {id:'A2',br:'A',req:['A1'],t:'Selanik\'i Kurtar',d:'Selanik\'i geri al.',own:['selanik'],g:90},
  {id:'A3',br:'A',req:['A2'],t:'Edirne\'yi Geri Al',d:'Adrianopolis yeniden Roma\'nın olsun.',own:['edirne'],g:120},
  {id:'B1',br:'B',t:'Mora\'yı Birleştir',d:'Thomas ile Demetrios\'un çekişmesine son ver: Mistra\'yı 4, Korint\'i 3 gelişime çıkar.',devAt:{mistra:4,korint:3},g:60},
  {id:'B2',br:'B',req:['B1'],t:'Atina\'yı Kurtar',d:'Atina\'yı Osmanlı\'dan al.',own:['atina'],g:70},
  {id:'B3',br:'B',req:['A1'],t:'Anadolu\'ya Dönüş',d:'Bursa ve İzmit\'i al.',own:['bursa','izmit'],g:120},
  {id:'B4',br:'B',req:['B2','B3'],t:'Roma\'nın Dirilişi',d:'On dört eyalete hükmet: İmparatorluk yeniden doğsun.',count:14,g:150}],
 VEN:[{id:'A1',br:'A',t:'Ege\'nin Kraliçesi',d:'Sakız ve Midilli\'yi al.',own:['sakiz','midilli'],g:70},
  {id:'A2',br:'A',req:['A1'],t:'Kıbrıs',d:'Lefkoşa ve Magosa\'yı al.',own:['kibris','magosa'],g:100},
  {id:'A3',br:'A',req:['A1'],t:'Doğu Akdeniz Ticareti',d:'8 eyalette pazar kur.',mkt:8,g:120},
  {id:'B1',br:'B',t:'Eğriboz Kalesi',d:'Osmanlı saldırırken Eğriboz\'u 8 tur elinde tut.',hold:'egriboz',vs:'OSM',turns:8,g:80},
  {id:'B2',br:'B',req:['B1'],t:'Selanik Limanı',d:'Selanik\'i al.',own:['selanik'],g:90},
  {id:'B3',br:'B',req:['B1'],t:'Arnavut Kıyıları',d:'Avlonya\'yı al.',own:['avlonya'],g:70},
  {id:'A4',br:'A',req:['A2','A3'],t:'İskenderiye Baharatı',d:'Memlük Sultanlığı ile ittifak kur; İskenderiye\'nin baharatı Venedik gemileriyle taşınsın.',ally:'MAM',g:80},
  {id:'B4',br:'B',req:['B2','B3'],t:'Çanakkale Boğazı',d:'Gelibolu\'yu al; Boğazların kapısı Cumhuriyet\'in elinde olsun.',own:['gelibolu'],g:120}],
 HUN:[{id:'A1',br:'A',t:'Belgrad\'ın Savunması',d:'Osmanlı saldırırken Belgrad\'ı 6 tur elinde tut.',hold:'belgrad',vs:'OSM',turns:6,g:70},
  {id:'A2',br:'A',req:['A1'],t:'Semendire Hattı',d:'Semendire\'yi al.',own:['semendire'],g:70},
  {id:'A3',br:'A',req:['A2'],t:'Varna\'nın İntikamı',d:'Sofya ve Vidin\'i al.',own:['sofya','vidin'],g:120},
  {id:'B1',br:'B',t:'Kara Ordu',d:'Paralı askerlere yetecek hazineyi biriktir.',gold:'auto',g:0,dev:['cap',1]},
  {id:'B2',br:'B',req:['B1'],t:'Tuna Hattı',d:'Niğbolu ve Silistre\'yi al.',own:['nigbolu','silistre'],g:90},
  {id:'B3',br:'B',req:['B1'],t:'Avusturya Tacı',d:'Viyana\'yı al.',own:['viyana'],g:150},
  {id:'B4',br:'B',req:['B2','B3'],t:'Corvina Kütüphanesi',d:'Budin\'i 10 gelişime çıkar: kral kütüphanesi bütün Avrupa\'nın gıptası olsun.',devAt:{budin:10},g:100}],
 SRB:[{id:'A1',br:'A',t:'Semendire Kalesi',d:'Osmanlı saldırırken Semendire\'yi 8 tur elinde tut.',hold:'semendire',vs:'OSM',turns:8,g:80},
  {id:'A2',br:'A',req:['A1'],t:'Novobırda Gümüşü',d:'Novobırda\'yı 4 gelişime çıkar.',devAt:{novobirda:4},g:60},
  {id:'A3',br:'A',req:['A2'],t:'Kosova\'nın Öcü',d:'Üsküp ve Köstendil\'i al.',own:['uskup','kostendil'],g:100},
  {id:'B1',br:'B',t:'Macar Dostluğu',d:'Macar Krallığı ile ittifak kur.',ally:'HUN',g:50},
  {id:'B2',br:'B',req:['B1'],t:'Bosna ile Birlik',d:'Bosna ile ittifak kur.',ally:'BOS',g:50},
  {id:'B3',br:'B',req:['B1'],t:'Niş\'ten Sofya\'ya',d:'Sofya\'yı al.',own:['sofya'],g:100},
  {id:'B4',br:'B',req:['B2','B3'],t:'Vidin Kalesi',d:'Tuna üzerindeki Vidin kalesini al.',own:['vidin'],g:90}],
 BOS:[{id:'A1',br:'A',t:'Yayçe Kalesi',d:'Osmanlı saldırırken Yayçe\'yi 8 tur elinde tut.',hold:'yayce',vs:'OSM',turns:8,g:80},
  {id:'A2',br:'A',req:['A1'],t:'Hersek\'i Bağla',d:'Hersek\'i 4 gelişime çıkar.',devAt:{hersek:4},g:60},
  {id:'A3',br:'A',req:['A2'],t:'Dalmaçya Kıyıları',d:'Split ve Zadar\'ı al.',own:['split','zadar'],g:100},
  {id:'B1',br:'B',t:'Srebrenice Madenleri',d:'Srebrenice\'yi 3 gelişime çıkar.',devAt:{srebrenice:3},g:50},
  {id:'B2',br:'B',req:['B1'],t:'Papa\'nın Tacı',d:'Papalık ile ittifak kur.',ally:'PAP',g:60},
  {id:'B3',br:'B',req:['B1'],t:'Sırp Mirası',d:'Semendire\'yi al.',own:['semendire'],g:100},
  {id:'B4',br:'B',req:['B2','B3'],t:'Kotor Limanı',d:'Krallığa denize açılan bir liman için Kotor\'u al.',own:['kotor'],g:80}],
 WAL:[{id:'A1',br:'A',t:'Tuna Seferi',d:'Niğbolu\'yu al.',own:['nigbolu'],g:80},
  {id:'A2',br:'A',req:['A1'],t:'Silistre ve Dobruca',d:'Silistre ve Dobruca\'yı al.',own:['silistre','dobruca'],g:90},
  {id:'A3',br:'A',req:['A2'],t:'Varna',d:'Varna\'yı al.',own:['varna'],g:80},
  {id:'B1',br:'B',t:'Tergovişte Sarayı',d:'Tergovişte\'yi 5 gelişime çıkar.',devAt:{tergoviste:5},g:50},
  {id:'B2',br:'B',req:['B1'],t:'Macar Dostluğu',d:'Macar Krallığı ile ittifak kur.',ally:'HUN',g:50},
  {id:'B3',br:'B',req:['B1'],t:'Boğdan\'la Birlik',d:'Boğdan ile ittifak kur.',ally:'MOL',g:50},
  {id:'B4',br:'B',req:['B2','B3'],t:'Gece Baskını',d:'Altı muharebe kazan: Kazıklı Voyvoda\'nın gece baskını dillere destan olsun.',won:6,g:90}],
 MOL:[{id:'A1',br:'A',t:'Akkerman ve Kili',d:'Osmanlı saldırırken Akkerman\'ı 8 tur elinde tut.',hold:'akkerman',vs:'OSM',turns:8,g:80},
  {id:'A2',br:'A',req:['A1'],t:'Eflak Tahtı',d:'Tergovişte\'yi al.',own:['tergoviste'],g:100},
  {id:'A3',br:'A',req:['A2'],t:'İbrail Pazarı',d:'İbrail\'i al.',own:['ibrail'],g:60},
  {id:'B1',br:'B',t:'Suçava Kalesi',d:'Suçava\'yı 5 gelişime çıkar.',devAt:{sucava:5},g:50},
  {id:'B2',br:'B',req:['B1'],t:'Lehistan\'la Barış',d:'Lehistan ile ittifak kur.',ally:'POL',g:50},
  {id:'B3',br:'B',req:['B1'],t:'Putna Manastırı',d:'Manastır ve kiliseler için hazine biriktir.',gold:'auto',g:0,dev:['cap',1]},
  {id:'B4',br:'B',req:['B2','B3'],t:'Vaslui Zaferi',d:'Beş muharebe kazan; Papa seni "İsa\'nın Atleti" diye övsün.',won:5,g:100}],
 ALB:[{id:'A1',br:'A',t:'Kroya Direnişi',d:'Osmanlı saldırırken Kroya\'yı 10 tur elinde tut.',hold:'kroya',vs:'OSM',turns:10,g:100},
  {id:'A2',br:'A',req:['A1'],t:'Kıyıları Birleştir',d:'İşkodra ve Dıraç\'ı al.',own:['iskodra','drac'],g:90},
  {id:'A3',br:'A',req:['A1'],t:'Üsküp',d:'Üsküp\'ü al.',own:['uskup'],g:80},
  {id:'B1',br:'B',t:'Venedik İttifakı',d:'Venedik ile ittifak kur.',ally:'VEN',g:60},
  {id:'B2',br:'B',req:['B1'],t:'Napoli\'nin Yardımı',d:'Napoli Krallığı ile ittifak kur (Gaeta Antlaşması).',ally:'ARA',g:60},
  {id:'B3',br:'B',req:['B2'],t:'Avlonya Limanı',d:'Avlonya\'yı al.',own:['avlonya'],g:70},
  {id:'A4',br:'A',req:['A2','A3'],t:'Makedonya Yolu',d:'Ohri ve Manastır\'ı al.',own:['ohri','manastir'],g:100}],
 KRM:[{id:'A1',br:'A',t:'Büyük Orda\'yı Yık',d:'Azak\'ı al.',own:['azak'],g:90},
  {id:'A2',br:'A',req:['A1'],t:'Kuban Bozkırı',d:'Kuban ve Çerkes\'i al.',own:['kuban','cerkes'],g:70},
  {id:'A3',br:'A',req:['A1'],t:'Deşt-i Kıpçak',d:'Kıpçak ve Don Boyu\'nu al.',own:['kipcak','don'],g:80},
  {id:'B1',br:'B',t:'Kefe\'nin Kapıları',d:'Kefe\'yi al.',own:['kefe'],g:90},
  {id:'B2',br:'B',req:['B1'],t:'Osmanlı Dostluğu',d:'Osmanlı ile ittifak kur.',ally:'OSM',g:60},
  {id:'B3',br:'B',req:['B1'],t:'Özi Kalesi',d:'Özi\'yi al.',own:['ozi'],g:60},
  {id:'A4',br:'A',req:['A2','A3'],t:'Hazar\'a Kadar',d:'Terek ve Dağıstan\'ı al; Altın Orda\'nın mirası senin olsun.',own:['terek','dagistan'],g:100},
  {id:'B4',br:'B',req:['B2','B3'],t:'Kamaniçe Akını',d:'Lehistan\'ın sınır kalesi Kamaniçe\'yi al.',own:['kamanice'],g:90}],
 GEN:[{id:'A1',br:'A',t:'Kefe\'yi Koru',d:'Osmanlı saldırırken Kefe\'yi 8 tur elinde tut.',hold:'kefe',vs:'OSM',turns:8,g:80},
  {id:'A2',br:'A',req:['A1'],t:'Karadeniz Ticareti',d:'4 eyalette pazar kur.',mkt:4,g:80},
  {id:'A3',br:'A',req:['A2'],t:'Sinop Limanı',d:'Sinop\'u al.',own:['sinop'],g:70},
  {id:'B1',br:'B',t:'Sakız Mastiği',d:'Sakız\'ı 3 gelişime çıkar.',devAt:{sakiz:3},g:50},
  {id:'B2',br:'B',req:['B1'],t:'Midilli\'nin Zenginliği',d:'Midilli\'yi 3 gelişime çıkar.',devAt:{midilli:3},g:50},
  {id:'B3',br:'B',req:['B1'],t:'Lefkoşa',d:'Lefkoşa\'yı al.',own:['kibris'],g:90},
  {id:'B4',br:'B',req:['B2','B3'],t:'San Giorgio Bankası',d:'Ceneviz bankası için hazine biriktir.',gold:'auto',g:0,dev:['cap',1]}],
 KAR:[{id:'A1',br:'A',t:'Selçuklu Mirası',d:'Ankara ve Kırşehir\'i al.',own:['ankara','kirsehir'],g:70},
  {id:'A2',br:'A',req:['A1'],t:'Bursa\'ya Yürüyüş',d:'Osmanlı\'nın eski başkentini al.',own:['bursa'],g:150},
  {id:'A3',br:'A',req:['A1'],t:'Germiyan ve Hamid',d:'Kütahya ve Hamid\'i al.',own:['kutahya','hamid'],g:80},
  {id:'B1',br:'B',t:'Akdeniz Kıyıları',d:'Teke ve Adana\'yı al.',own:['teke','adana'],g:70},
  {id:'B2',br:'B',req:['B1'],t:'Dulkadir Ovası',d:'Maraş\'ı al.',own:['maras'],g:70},
  {id:'B3',br:'B',req:['B1'],t:'Karaman Akçesi',d:'Hazinede para biriktir.',gold:'auto',g:0,dev:['cap',1]},
  {id:'A4',br:'A',req:['A2','A3'],t:'Rum Sultanlığı',d:'Amasya ve Sivas\'ı al; Selçuklu tahtı yeniden kurulsun.',own:['amasya','sivas'],g:120},
  {id:'B4',br:'B',req:['B2','B3'],t:'Antakya',d:'Antakya\'yı al; Kilikya\'nın bütün kıyısı Karaman\'ın olsun.',own:['antakya'],g:90}],
 CAN:[{id:'A1',br:'A',t:'Sinop Limanı',d:'Sinop\'u 4 gelişime çıkar.',devAt:{sinop:4},g:60},
  {id:'A2',br:'A',req:['A1'],t:'Bakır Madenleri',d:'Küre bakırından hazine biriktir.',gold:'auto',g:0,dev:['kastamonu',1]},
  {id:'A3',br:'A',req:['A2'],t:'Amasra',d:'Amasra\'yı al.',own:['amasra'],g:50},
  {id:'B1',br:'B',t:'Karaman Dostluğu',d:'Karaman ile ittifak kur.',ally:'KAR',g:40},
  {id:'B2',br:'B',req:['B1'],t:'Çankırı ve Bolu',d:'Çankırı ve Bolu\'yu al.',own:['cankiri','bolu'],g:80},
  {id:'B3',br:'B',req:['B2'],t:'Canik Beyliği',d:'Canik\'i al.',own:['canik'],g:60}],
 DUL:[{id:'A1',br:'A',t:'Elbistan Yaylası',d:'Elbistan\'ı 3 gelişime çıkar.',devAt:{elbistan:3},g:40},
  {id:'A2',br:'A',req:['A1'],t:'Kayseri',d:'Kayseri\'yi al.',own:['kayseri'],g:70},
  {id:'A3',br:'A',req:['A2'],t:'Sivas ve Bozok',d:'Sivas ve Bozok\'u al.',own:['sivas','bozok'],g:80},
  {id:'B1',br:'B',t:'Divriği Kalesi',d:'Divriği\'yi 2 gelişime çıkar.',devAt:{divrigi:2},g:40},
  {id:'B2',br:'B',req:['B1'],t:'Harput',d:'Harput\'u al.',own:['harput'],g:60},
  {id:'B3',br:'B',req:['B1'],t:'Osmanlı ile Akrabalık',d:'Osmanlı ile ittifak kur (Sitti Mükrime Hatun\'un düğünü).',ally:'OSM',g:50},
  {id:'B4',br:'B',req:['B2','B3'],t:'Erzincan Ovası',d:'Erzincan\'ı al.',own:['erzincan'],g:80}],
 MAM:[{id:'A1',br:'A',t:'Kilikya Kıyıları',d:'İçel ve Alaiye\'yi al.',own:['icel','alaiye'],g:60},
  {id:'A2',br:'A',req:['A1'],t:'Rum Diyarı',d:'Konya\'yı al.',own:['konya'],g:120},
  {id:'A3',br:'A',req:['A1'],t:'Rodos\'u Düşür',d:'Şövalyelerin adasını al.',own:['rodos'],g:90},
  {id:'B1',br:'B',t:'Fırat Hattı',d:'Ruha\'yı al.',own:['urfa'],g:70},
  {id:'B2',br:'B',req:['B1'],t:'Bağdat',d:'Abbasi hilafetinin eski merkezini al.',own:['bagdat'],g:120},
  {id:'B3',br:'B',req:['B1'],t:'Kıbrıs Haracı',d:'Lefkoşa\'yı al.',own:['kibris'],g:80},
  {id:'A4',br:'A',req:['A2','A3'],t:'Toros\'un Ötesi',d:'Kayseri ve Niğde\'yi al.',own:['kayseri','nigde'],g:100},
  {id:'B4',br:'B',req:['B2','B3'],t:'Basra Körfezi',d:'Basra\'yı al; Hint ticareti Kahire\'den geçsin.',own:['basra'],g:100}],
 AKK:[{id:'A1',br:'A',t:'Kara Koyun\'u Yık',d:'Tebriz\'i al.',own:['tebriz'],g:150},
  {id:'A2',br:'A',req:['A1'],t:'Bağdat',d:'Bağdat\'ı al.',own:['bagdat'],g:120},
  {id:'A3',br:'A',req:['A1'],t:'Azerbaycan\'ın Efendisi',d:'Revan ve Nahçıvan\'ı al.',own:['revan','nahcivan'],g:80},
  {id:'B1',br:'B',t:'Erzurum Yaylası',d:'Erzurum ve Kars\'ı al.',own:['erzurum','kars'],g:70},
  {id:'B2',br:'B',req:['B1'],t:'Trabzon Evliliği',d:'Trabzon ile ittifak kur (Despina Hatun\'un düğünü).',ally:'TRB',g:60},
  {id:'B3',br:'B',req:['B1'],t:'Venedik İttifakı',d:'Venedik ile ittifak kur; Osmanlı\'ya karşı top ve tüfek gelsin.',ally:'VEN',g:80},
  {id:'A4',br:'A',req:['A2','A3'],t:'İran Padişahlığı',d:'Kirmanşah ve Erdelan\'ı al.',own:['kirmansah','erdelan'],g:100},
  {id:'B4',br:'B',req:['B2','B3'],t:'Rum Diyarı',d:'Sivas ve Tokat\'ı al.',own:['sivas','tokat'],g:100}],
 KKY:[{id:'A1',br:'A',t:'Ak Koyun\'u Ez',d:'Diyarbakır\'ı al.',own:['diyarbakir'],g:120},
  {id:'A2',br:'A',req:['A1'],t:'Halep',d:'Halep\'i al.',own:['halep'],g:120},
  {id:'A3',br:'A',req:['A1'],t:'Anadolu Yolu',d:'Harput ve Erzincan\'ı al.',own:['harput','erzincan'],g:70},
  {id:'B1',br:'B',t:'Gürcü Seferi',d:'Tiflis\'i al.',own:['tiflis'],g:70},
  {id:'B2',br:'B',req:['B1'],t:'Kafkas Kapıları',d:'Kaheti ve Ahıska\'yı al.',own:['kaheti','ahiska'],g:70},
  {id:'B3',br:'B',req:['B1'],t:'Ticaret Şehri Tebriz',d:'5 eyalette pazar kur.',mkt:5,g:80},
  {id:'A4',br:'A',req:['A2','A3'],t:'Anadolu\'nun Kapısı',d:'Sivas\'ı al.',own:['sivas'],g:90},
  {id:'B4',br:'B',req:['B2','B3'],t:'Karadeniz Limanı',d:'Trabzon\'u al.',own:['trabzon'],g:100}],
 TRB:[{id:'A1',br:'A',t:'Akkoyunlu Evliliği',d:'Akkoyunlu ile ittifak kur (Despina Hatun\'un düğünü).',ally:'AKK',g:60},
  {id:'A2',br:'A',req:['A1'],t:'Pontus Kıyıları',d:'Canik\'i al.',own:['canik'],g:60},
  {id:'A3',br:'A',req:['A2'],t:'Kafkas Ticareti',d:'3 eyalette pazar kur.',mkt:3,g:60},
  {id:'B1',br:'B',t:'Trabzon Surları',d:'Osmanlı saldırırken Trabzon\'u 8 tur elinde tut.',hold:'trabzon',vs:'OSM',turns:8,g:80},
  {id:'B2',br:'B',req:['B1'],t:'Kerasunt\'u İmar Et',d:'Kerasunt\'u 3 gelişime çıkar.',devAt:{kerasunt:3},g:50},
  {id:'B3',br:'B',req:['B1'],t:'Gürcü Dostluğu',d:'Gürcistan ile ittifak kur.',ally:'GEO',g:50},
  {id:'B4',br:'B',req:['B2','B3'],t:'Pontus\'un İncisi',d:'Sinop\'u al.',own:['sinop'],g:90}],
 GEO:[{id:'A1',br:'A',t:'Gürcistan\'ın Birliği',d:'Tiflis\'i 5 gelişime çıkar.',devAt:{tiflis:5},g:60},
  {id:'A2',br:'A',req:['A1'],t:'Şirvan Yolu',d:'Şirvan\'ı al.',own:['sirvan'],g:80},
  {id:'A3',br:'A',req:['A1'],t:'Ermeni Yaylası',d:'Revan ve Kars\'ı al.',own:['revan','kars'],g:80},
  {id:'B1',br:'B',t:'Trabzon Dostluğu',d:'Trabzon ile ittifak kur.',ally:'TRB',g:40},
  {id:'B2',br:'B',req:['B1'],t:'Kafkas Kalkanı',d:'Karakoyunlu saldırırken Tiflis\'i 8 tur elinde tut.',hold:'tiflis',vs:'KKY',turns:8,g:80},
  {id:'B3',br:'B',req:['B2'],t:'Derbent Kapısı',d:'Derbent\'i al.',own:['derbent'],g:90},
  {id:'A4',br:'A',req:['A2','A3'],t:'Kafkas Ötesi',d:'Karabağ ve Gence\'yi al.',own:['karabag','gence'],g:90}],
 HAB:[{id:'A1',br:'A',t:'Macar Tacı',d:'Pojon ve Yanık\'ı al.',own:['pojon','yanik'],g:80},
  {id:'A2',br:'A',req:['A1'],t:'Budin',d:'Macar başkentini al.',own:['budin'],g:200},
  {id:'A3',br:'A',req:['A1'],t:'Hırvat Kıyıları',d:'Zağrep\'i al.',own:['zagrep'],g:80},
  {id:'B1',br:'B',t:'Viyana Surları',d:'Viyana\'yı 7 gelişime çıkar.',devAt:{viyana:7},g:60},
  {id:'B2',br:'B',req:['B1'],t:'Friuli',d:'Friuli\'yi al.',own:['friuli'],g:70},
  {id:'B3',br:'B',req:['B1'],t:'İmparatorluk Tacı',d:'Taç giyme töreni için hazine biriktir.',gold:'auto',g:0,dev:['viyana',1]},
  {id:'A4',br:'A',req:['A2','A3'],t:'Aziz İştvan Tacı',d:'İstolni Belgrad\'ı al; Macar kralları orada taç giyer.',own:['istolni'],g:120},
  {id:'B4',br:'B',req:['B2','B3'],t:'Adriyatik Kıyısı',d:'İstriya\'yı al.',own:['istriya'],g:80}],
 POL:[{id:'A1',br:'A',t:'Özi Limanı',d:'Özi\'yi 2 gelişime çıkar.',devAt:{ozi:2},g:40},
  {id:'A2',br:'A',req:['A1'],t:'Kili ve Akkerman',d:'Kili ve Akkerman\'ı al.',own:['kili','akkerman'],g:100},
  {id:'A3',br:'A',req:['A2'],t:'Kırım\'ın Kapısı',d:'Or Kapı\'yı al.',own:['or'],g:80},
  {id:'B1',br:'B',t:'Haliç Voyvodalığı',d:'Haliç\'i 3 gelişime çıkar.',devAt:{halic:3},g:40},
  {id:'B2',br:'B',req:['B1'],t:'Macar Tahtı',d:'Budin\'i al.',own:['budin'],g:200},
  {id:'B3',br:'B',req:['B1'],t:'Boğdan Dostluğu',d:'Boğdan ile ittifak kur.',ally:'MOL',g:50},
  {id:'B4',br:'B',req:['B2','B3'],t:'Yukarı Macaristan',d:'Kassa ve Eğri\'yi al.',own:['kassa','egri'],g:100}],
 GH:[{id:'A1',br:'A',t:'Kırım\'ı Geri Al',d:'Bahçesaray\'ı al.',own:['bahcesaray'],g:100},
  {id:'A2',br:'A',req:['A1'],t:'Kefe\'nin Hazinesi',d:'Kefe\'yi al.',own:['kefe'],g:90},
  {id:'A3',br:'A',req:['A1'],t:'Or Kapı',d:'Or Kapı\'yı al.',own:['or'],g:60},
  {id:'B1',br:'B',t:'Hazar Kıyıları',d:'Terek\'i 2 gelişime çıkar.',devAt:{terek:2},g:40},
  {id:'B2',br:'B',req:['B1'],t:'Kafkas Kapıları',d:'Derbent\'i al.',own:['derbent'],g:80},
  {id:'B3',br:'B',req:['B1'],t:'Lehistan İttifakı',d:'Lehistan ile ittifak kur.',ally:'POL',g:50},
  {id:'A4',br:'A',req:['A2','A3'],t:'Gözleve Limanı',d:'Gözleve\'yi al.',own:['gozleve'],g:60},
  {id:'B4',br:'B',req:['B2','B3'],t:'Şirvan Akını',d:'Şirvan\'ı al.',own:['sirvan'],g:80}],
 ARA:[{id:'A1',br:'A',t:'Otranto Kalesi',d:'Otranto\'yu 4 gelişime çıkar.',devAt:{otranto:4},g:50},
  {id:'A2',br:'A',req:['A1'],t:'Arnavut Kıyıları',d:'Avlonya\'yı al.',own:['avlonya'],g:80},
  {id:'A3',br:'A',req:['A1'],t:'İskender Bey İttifakı',d:'Arnavutluk ile ittifak kur (Gaeta Antlaşması).',ally:'ALB',g:50},
  {id:'B1',br:'B',t:'Abruzzo Sınırı',d:'Abruzzo\'yu 3 gelişime çıkar.',devAt:{abruzzo:3},g:40},
  {id:'B2',br:'B',req:['B1'],t:'Roma\'ya Baskı',d:'Ankona\'yı al.',own:['ankona'],g:90},
  {id:'B3',br:'B',req:['B1'],t:'Sicilya Buğdayı',d:'Palermo\'yu 5 gelişime çıkar.',devAt:{palermo:5},g:60},
  {id:'A4',br:'A',req:['A2','A3'],t:'Dıraç Kalesi',d:'Dıraç\'ı al.',own:['drac'],g:90},
  {id:'B4',br:'B',req:['B2','B3'],t:'Papalık Toprakları',d:'Umbriya ve Rimini\'yi al.',own:['umbriya','rimini'],g:120}],
 PAP:[{id:'A1',br:'A',t:'Haçlı Çağrısı',d:'Macar Krallığı ile ittifak kur.',ally:'HUN',g:60},
  {id:'A2',br:'A',req:['A1'],t:'Haçlı Donanması',d:'Venedik ile ittifak kur.',ally:'VEN',g:60},
  {id:'A3',br:'A',req:['A2'],t:'Haçlı Seferi',d:'10 muharebe kazan.',won:10,g:150},
  {id:'B1',br:'B',t:'Tolfa Şap Madenleri',d:'Şap gelirinden hazine biriktir.',gold:'auto',g:0,dev:['roma',1]},
  {id:'B2',br:'B',req:['B1'],t:'Romagna\'yı Bağla',d:'Ravenna\'yı al.',own:['ravenna'],g:70},
  {id:'B3',br:'B',req:['B1'],t:'Ankona Limanı',d:'Ankona\'yı 4 gelişime çıkar.',devAt:{ankona:4},g:50},
  {id:'B4',br:'B',req:['B2','B3'],t:'Cambrai Birliği',d:'Venedik\'ten Friuli\'yi al.',own:['friuli'],g:100}],
 CYP:[{id:'A1',br:'A',t:'Magosa\'yı Geri Al',d:'Magosa\'yı Cenevizlilerden al.',own:['magosa'],g:80},
  {id:'A2',br:'A',req:['A1'],t:'Rodos Dostluğu',d:'Rodos Şövalyeleri ile ittifak kur.',ally:'RHO',g:40},
  {id:'A3',br:'A',req:['A2'],t:'Venedik Himayesi',d:'Venedik ile ittifak kur.',ally:'VEN',g:50},
  {id:'B1',br:'B',t:'Kahire ile Barış',d:'Memlük Sultanlığı ile ittifak kur.',ally:'MAM',g:60},
  {id:'B2',br:'B',req:['B1'],t:'Şeker Kamışı',d:'Lefkoşa\'yı 4 gelişime çıkar.',devAt:{kibris:4},g:50},
  {id:'B3',br:'B',req:['B1'],t:'Korykos\'u Geri Al',d:'İçel\'i al.',own:['icel'],g:80},
  {id:'B4',br:'B',req:['B2','B3'],t:'Kilikya Kıyısı',d:'Alaiye\'yi al.',own:['alaiye'],g:80}],
 RHO:[{id:'A1',br:'A',t:'Rodos Kuşatması',d:'Osmanlı saldırırken Rodos\'u 8 tur elinde tut.',hold:'rodos',vs:'OSM',turns:8,g:100},
  {id:'A2',br:'A',req:['A1'],t:'Bodrum Kalesi',d:'Bodrum\'u 2 gelişime çıkar.',devAt:{bodrum:2},g:40},
  {id:'A3',br:'A',req:['A1'],t:'Menteşe Kıyısı',d:'Menteşe\'yi al.',own:['mentese'],g:70},
  {id:'B1',br:'B',t:'Hospitalier Hazinesi',d:'Tarikat için hazine biriktir.',gold:'auto',g:0,dev:['rodos',1]},
  {id:'B2',br:'B',req:['B1'],t:'Kıbrıs Dostluğu',d:'Kıbrıs ile ittifak kur.',ally:'CYP',g:40},
  {id:'B3',br:'B',req:['B1'],t:'Venedik İttifakı',d:'Venedik ile ittifak kur.',ally:'VEN',g:50},
  {id:'A4',br:'A',req:['A2','A3'],t:'İzmir\'i Geri Al',d:'Şövalyelerin 1402\'de kaybettiği İzmir\'i geri al.',own:['izmir'],g:110},
  {id:'B4',br:'B',req:['B2','B3'],t:'Tarikatın Kadırgaları',d:'Altı muharebe kazan.',won:6,g:100}],
 HAF:[{id:'A1',br:'A',t:'Trablusgarp Limanı',d:'Trablusgarp\'ı 4 gelişime çıkar.',devAt:{trablusgarp:4},g:50},
  {id:'A2',br:'A',req:['A1'],t:'Bingazi',d:'Bingazi\'yi al.',own:['barka'],g:70},
  {id:'A3',br:'A',req:['A2'],t:'Derne ve Tobruk',d:'Derne ve Tobruk\'u al.',own:['derne','tobruk'],g:70},
  {id:'B1',br:'B',t:'Korsan Limanları',d:'2 eyalette pazar kur.',mkt:2,g:40},
  {id:'B2',br:'B',req:['B1'],t:'Kayrevan Hazinesi',d:'Hazinede para biriktir.',gold:'auto',g:0,dev:['trablusgarp',1]},
  {id:'B3',br:'B',req:['B2'],t:'Sirt Çölü',d:'Sirt\'i 2 gelişime çıkar.',devAt:{sirt:2},g:40}],
 SAF:[{id:'A1',br:'A',t:'Tebriz Tahtı',d:'Tebriz\'i al.',own:['tebriz'],g:100},
  {id:'A2',br:'A',req:['A1'],t:'Bağdat',d:'Bağdat\'ı al.',own:['bagdat'],g:120},
  {id:'A3',br:'A',req:['A2'],t:'Anadolu Kızılbaşları',d:'Erzincan ve Sivas\'ı al.',own:['erzincan','sivas'],g:100},
  {id:'B1',br:'B',t:'Şirvan Seferi',d:'Şirvan\'ı al.',own:['sirvan'],g:80},
  {id:'B2',br:'B',req:['B1'],t:'Diyarbakır',d:'Diyarbakır\'ı al.',own:['diyarbakir'],g:100},
  {id:'B3',br:'B',req:['B1'],t:'Gürcü Haracı',d:'Tiflis\'i al.',own:['tiflis'],g:80},
  {id:'B4',br:'B',req:['B2','B3'],t:'Derbent Kapısı',d:'Derbent\'i al.',own:['derbent'],g:90}]
,
 CLM:[{id:'A1',br:'A',t:'İlk Kan',d:'İki muharebe kazan.',won:2,g:40},
  {id:'A2',br:'A',req:['A1'],t:'Taraftarlar',d:'Beş eyalete hükmet.',count:5,g:60},
  {id:'A3',br:'A',req:['A2'],t:'Taht Kavgası',d:'Altı muharebe kazan.',won:6,g:100},
  {id:'B1',br:'B',t:'Savaş Sandığı',d:'Hazinede para biriktir.',gold:'auto',g:0,dev:['cap',1]},
  {id:'B2',br:'B',req:['B1'],t:'Kasabaların Desteği',d:'2 eyalette pazar kur.',mkt:2,g:50},
  {id:'B3',br:'B',req:['B2'],t:'Yeni Bir Hanedan',d:'Sekiz eyalete hükmet.',count:8,g:120}]
};
const MIS_BR={OSM:['Rumeli ve Batı','Anadolu ve Doğu'],BYZ:['Kuşatma ve Trakya','Mora ve Anadolu'],VEN:['Ege ve Levant','Deniz Devleti'],HUN:['Tuna Savaşları','Korvin\'in Krallığı'],
 SRB:['Despotluğun Savunması','Dostlar ve Öç'],BOS:['Kaleler ve Kıyılar','Madenler ve Taç'],WAL:['Tuna Seferleri','Voyvodalık'],MOL:['Karadeniz Kaleleri','Ştefan\'ın Mirası'],
 ALB:['Dağların Direnişi','Latin Dostlar'],KRM:['Bozkırın Hâkimi','Kefe ve Dostlar'],GEN:['Kefe ve Karadeniz','Ege Adaları'],KAR:['Selçuklu Mirası','Kıyılar ve Hazine'],
 CAN:['Sinop ve Madenler','Beylik Toprakları'],DUL:['Yayla ve Şehir','Kale ve Akrabalık'],MAM:['Kuzey Sınırı','Fırat ve Deniz'],AKK:['Karakoyunlu Seferi','Dostlar ve Evlilikler'],
 KKY:['Batı Seferleri','Kafkasya ve Ticaret'],TRB:['Evlilik ve Ticaret','Surlar ve Dostlar'],GEO:['Birlik ve Genişleme','Kafkas Kalkanı'],HAB:['Macar Mirası','Viyana ve Taç'],
 POL:['Karadeniz\'e İniş','Taçlar ve Dostlar'],GH:['Kırım Davası','Hazar ve Dostlar'],ARA:['Adriyatik','İtalya'],PAP:['Haçlı Seferi','Papalık Toprakları'],
 CYP:['Ada ve Dostlar','Şeker ve Kıyı'],RHO:['Ada Kalesi','Tarikatın Dostları'],HAF:['Doğu Kıyıları','Korsanlar ve Hazine'],SAF:['Kızılbaş Tahtı','Kafkasya ve Irak'],
 CLM:['Taht Davası','Taraftarlar']};
/* English mission texts, keyed by faction and mission id. The Turkish trees above stay the source of the goals;
   the save keeps Turkish t/d copies, so the English is looked up by id whenever a mission is shown. */
const MIS_EN={
 OSM:{A1:['The Conquest of Constantinople','Take the city and join Rumelia to Anatolia.'],A2:['The Morea Campaign','Take the Despots\' fortresses of Mistra and Corinth.'],
  A3:['Serbian Silver','Take the fortress of Smederevo and the mines of Novo Brdo.'],A4:['The Gate of Belgrade','Bring down the Hungarians\' fortress on the Danube.'],
  A5:['On to Buda','Take the Hungarian capital.'],A6:['The Otranto Expedition','Win a bridgehead on the Italian coast.'],A7:['The Rome Campaign','The Red Apple: conquer Rome.'],
  B1:['The Karaman Question','Annex Konya and Larende.'],B2:['The Trebizond Campaign','Take the last stronghold of the Komnenoi.'],
  B3:['The Eastern Campaign','March on Tabriz and open the gate to Persia.'],B4:['The Key to Egypt','Conquer Aleppo and Cairo.'],B5:['Jerusalem and Damascus','Take Jerusalem and Damascus, and let the pilgrim road to the Hijaz be Ottoman.']},
 BYZ:{A1:['Hold the Walls','Keep Constantinople for 8 turns while the Ottoman siege goes on.'],A2:['Free Thessalonica','Win back Thessalonica.'],
  A3:['Win Back Adrianople','Let Adrianople belong to Rome once more.'],B1:['Unite the Morea','End the quarrel of Thomas and Demetrios: raise Mistra to development 4 and Corinth to 3.'],
  B2:['Free Athens','Take Athens from the Ottomans.'],B3:['Return to Anatolia','Take Bursa and Nicomedia.'],B4:['The Revival of Rome','Rule fourteen provinces: let the Empire be born again.']},
 VEN:{A1:['Queen of the Aegean','Take Chios and Lesbos.'],A2:['Cyprus','Take Nicosia and Famagusta.'],A3:['The Levant Trade','Build markets in 8 provinces.'],
  B1:['The Fortress of Negroponte','Hold Negroponte for 8 turns while the Ottomans attack.'],B2:['The Port of Thessalonica','Take Thessalonica.'],B3:['The Albanian Coast','Take Valona.'],A4:['The Spices of Alexandria','Form an alliance with the Mamluk Sultanate, so that the spices of Alexandria sail in Venetian ships.'],B4:['The Dardanelles','Take Gallipoli, and let the Republic hold the gate of the Straits.']},
 HUN:{A1:['The Defence of Belgrade','Hold Belgrade for 6 turns while the Ottomans attack.'],A2:['The Smederevo Line','Take Smederevo.'],
  A3:['Revenge for Varna','Take Sofia and Vidin.'],B1:['The Black Army','Save enough gold to pay the mercenaries.'],
  B2:['The Danube Line','Take Nicopolis and Silistra.'],B3:['The Crown of Austria','Take Vienna.'],B4:['The Bibliotheca Corviniana','Raise Buda to development 10: let the royal library be the envy of Europe.']},
 SRB:{A1:['The Fortress of Smederevo','Hold Smederevo for 8 turns while the Ottomans attack.'],A2:['The Silver of Novo Brdo','Raise Novo Brdo to development 4.'],
  A3:['Vengeance for Kosovo','Take Skopje and Kyustendil.'],B1:['Friendship with Hungary','Form an alliance with the Kingdom of Hungary.'],
  B2:['Union with Bosnia','Form an alliance with Bosnia.'],B3:['From Nish to Sofia','Take Sofia.'],B4:['The Fortress of Vidin','Take the fortress of Vidin on the Danube.']},
 BOS:{A1:['The Fortress of Jajce','Hold Jajce for 8 turns while the Ottomans attack.'],A2:['Bind Herzegovina','Raise Herzegovina to development 4.'],
  A3:['The Dalmatian Coast','Take Split and Zadar.'],B1:['The Mines of Srebrenica','Raise Srebrenica to development 3.'],
  B2:['The Pope\'s Crown','Form an alliance with the Papacy.'],B3:['The Serbian Inheritance','Take Smederevo.'],B4:['The Port of Cattaro','Take Cattaro, to give the kingdom a harbour on the sea.']},
 WAL:{A1:['The Danube Campaign','Take Nicopolis.'],A2:['Silistra and Dobruja','Take Silistra and Dobruja.'],A3:['Varna','Take Varna.'],
  B1:['The Court of Targoviste','Raise Targoviste to development 5.'],B2:['Friendship with Hungary','Form an alliance with the Kingdom of Hungary.'],
  B3:['Union with Moldavia','Form an alliance with Moldavia.'],B4:['The Night Attack','Win six battles, and let the night attack of the Impaler become a legend.']},
 MOL:{A1:['Cetatea Alba and Kiliya','Hold Cetatea Alba for 8 turns while the Ottomans attack.'],A2:['The Throne of Wallachia','Take Targoviste.'],
  A3:['The Market of Braila','Take Braila.'],B1:['The Fortress of Suceava','Raise Suceava to development 5.'],
  B2:['Peace with Poland','Form an alliance with Poland.'],B3:['Putna Monastery','Save gold for monasteries and churches.'],B4:['The Victory of Vaslui','Win five battles, and let the Pope hail you as the Athlete of Christ.']},
 ALB:{A1:['The Resistance of Kruja','Hold Kruja for 10 turns while the Ottomans attack.'],A2:['Unite the Coast','Take Scutari and Durazzo.'],
  A3:['Skopje','Take Skopje.'],B1:['The Venetian Alliance','Form an alliance with Venice.'],
  B2:['Help from Naples','Form an alliance with the Kingdom of Naples (the Treaty of Gaeta).'],B3:['The Port of Valona','Take Valona.'],A4:['The Road to Macedonia','Take Ohrid and Monastir.']},
 KRM:{A1:['Break the Great Horde','Take Azov.'],A2:['The Kuban Steppe','Take Kuban and Circassia.'],A3:['The Kipchak Steppe','Take the Kipchak lands and the Don.'],
  B1:['The Gates of Caffa','Take Caffa.'],B2:['Friendship with the Ottomans','Form an alliance with the Ottomans.'],B3:['The Fortress of Ochakiv','Take Ochakiv.'],A4:['To the Caspian','Take Terek and Dagestan: the legacy of the Golden Horde is yours.'],B4:['The Kamianets Raid','Take Kamianets, the border fortress of Poland.']},
 GEN:{A1:['Defend Caffa','Hold Caffa for 8 turns while the Ottomans attack.'],A2:['The Black Sea Trade','Build markets in 4 provinces.'],
  A3:['The Port of Sinope','Take Sinope.'],B1:['The Mastic of Chios','Raise Chios to development 3.'],
  B2:['The Wealth of Lesbos','Raise Lesbos to development 3.'],B3:['Nicosia','Take Nicosia.'],B4:['The Bank of Saint George','Save a treasury for the Bank of Saint George.']},
 KAR:{A1:['The Seljuk Inheritance','Take Ankara and Kirsehir.'],A2:['The March on Bursa','Take the old Ottoman capital.'],
  A3:['Germiyan and Hamid','Take Kutahya and Hamid.'],B1:['The Mediterranean Coast','Take Teke and Adana.'],
  B2:['The Dulkadir Plain','Take Marash.'],B3:['Karaman Silver','Save gold in the treasury.'],A4:['The Sultanate of Rum','Take Amasya and Sivas, and let the Seljuk throne rise again.'],B4:['Antioch','Take Antioch, and let the whole Cilician coast belong to Karaman.']},
 CAN:{A1:['The Port of Sinope','Raise Sinope to development 4.'],A2:['The Copper Mines','Fill the treasury with copper from Kure.'],
  A3:['Amasra','Take Amasra.'],B1:['Friendship with Karaman','Form an alliance with Karaman.'],
  B2:['Cankiri and Bolu','Take Cankiri and Bolu.'],B3:['The Beylik of Canik','Take Canik.']},
 DUL:{A1:['The Elbistan Uplands','Raise Elbistan to development 3.'],A2:['Kayseri','Take Kayseri.'],A3:['Sivas and Bozok','Take Sivas and Bozok.'],
  B1:['The Fortress of Divrigi','Raise Divrigi to development 2.'],B2:['Harput','Take Harput.'],
  B3:['Kinship with the Ottomans','Form an alliance with the Ottomans (the wedding of Sitti Mukrime Hatun).'],B4:['The Plain of Erzincan','Take Erzincan.']},
 MAM:{A1:['The Cilician Coast','Take Icel and Alanya.'],A2:['The Lands of Rum','Take Konya.'],A3:['Bring Down Rhodes','Take the Knights\' island.'],
  B1:['The Euphrates Line','Take Edessa.'],B2:['Baghdad','Take the old seat of the Abbasid caliphate.'],B3:['The Tribute of Cyprus','Take Nicosia.'],A4:['Beyond the Taurus','Take Kayseri and Nigde.'],B4:['The Gulf of Basra','Take Basra, so that the Indian trade passes through Cairo.']},
 AKK:{A1:['Destroy the Qara Qoyunlu','Take Tabriz.'],A2:['Baghdad','Take Baghdad.'],A3:['Master of Azerbaijan','Take Erivan and Nakhchivan.'],
  B1:['The Erzurum Uplands','Take Erzurum and Kars.'],B2:['The Trebizond Marriage','Form an alliance with Trebizond (the wedding of Despina Hatun).'],
  B3:['The Venetian Alliance','Form an alliance with Venice, and let cannon and muskets come against the Ottomans.'],A4:['Padishah of Iran','Take Kermanshah and Ardalan.'],B4:['The Lands of Rum','Take Sivas and Tokat.']},
 KKY:{A1:['Crush the Aq Qoyunlu','Take Diyarbakir.'],A2:['Aleppo','Take Aleppo.'],A3:['The Road to Anatolia','Take Harput and Erzincan.'],
  B1:['The Georgian Campaign','Take Tiflis.'],B2:['The Caucasus Gates','Take Kakheti and Akhaltsikhe.'],B3:['Tabriz, City of Trade','Build markets in 5 provinces.'],A4:['The Gate of Anatolia','Take Sivas.'],B4:['A Black Sea Port','Take Trebizond.']},
 TRB:{A1:['The Aq Qoyunlu Marriage','Form an alliance with the Aq Qoyunlu (the wedding of Despina Hatun).'],A2:['The Pontic Coast','Take Canik.'],
  A3:['The Caucasus Trade','Build markets in 3 provinces.'],B1:['The Walls of Trebizond','Hold Trebizond for 8 turns while the Ottomans attack.'],
  B2:['Develop Kerasous','Raise Kerasous to development 3.'],B3:['Friendship with Georgia','Form an alliance with Georgia.'],B4:['The Pearl of Pontus','Take Sinope.']},
 GEO:{A1:['The Union of Georgia','Raise Tiflis to development 5.'],A2:['The Road to Shirvan','Take Shirvan.'],A3:['The Armenian Highlands','Take Erivan and Kars.'],
  B1:['Friendship with Trebizond','Form an alliance with Trebizond.'],B2:['The Caucasus Shield','Hold Tiflis for 8 turns while the Qara Qoyunlu attack.'],
  B3:['The Gate of Derbent','Take Derbent.'],A4:['Beyond the Caucasus','Take Karabakh and Ganja.']},
 HAB:{A1:['The Crown of Hungary','Take Pressburg and Raab.'],A2:['Buda','Take the Hungarian capital.'],A3:['The Croatian Coast','Take Zagreb.'],
  B1:['The Walls of Vienna','Raise Vienna to development 7.'],B2:['Friuli','Take Friuli.'],B3:['The Imperial Crown','Save gold for the coronation.'],A4:['The Crown of Saint Stephen','Take Szekesfehervar, where the kings of Hungary are crowned.'],B4:['The Adriatic Shore','Take Istria.']},
 POL:{A1:['The Port of Ochakiv','Raise Ochakiv to development 2.'],A2:['Kiliya and Cetatea Alba','Take Kiliya and Cetatea Alba.'],
  A3:['The Gate of Crimea','Take Perekop.'],B1:['The Voivodeship of Halych','Raise Halych to development 3.'],
  B2:['The Throne of Hungary','Take Buda.'],B3:['Friendship with Moldavia','Form an alliance with Moldavia.'],B4:['Upper Hungary','Take Kassa and Eger.']},
 GH:{A1:['Win Back Crimea','Take Bakhchysarai.'],A2:['The Treasure of Caffa','Take Caffa.'],A3:['Perekop','Take Perekop.'],
  B1:['The Caspian Shore','Raise Terek to development 2.'],B2:['The Caucasus Gates','Take Derbent.'],B3:['The Polish Alliance','Form an alliance with Poland.'],A4:['The Port of Eupatoria','Take Eupatoria.'],B4:['The Shirvan Raid','Take Shirvan.']},
 ARA:{A1:['The Fortress of Otranto','Raise Otranto to development 4.'],A2:['The Albanian Coast','Take Valona.'],
  A3:['The Alliance with Skanderbeg','Form an alliance with Albania (the Treaty of Gaeta).'],B1:['The Abruzzo Frontier','Raise Abruzzo to development 3.'],
  B2:['Pressure on Rome','Take Ancona.'],B3:['Sicilian Wheat','Raise Palermo to development 5.'],A4:['The Fortress of Durazzo','Take Durazzo.'],B4:['The Papal States','Take Umbria and Rimini.']},
 PAP:{A1:['The Call to Crusade','Form an alliance with the Kingdom of Hungary.'],A2:['The Crusader Fleet','Form an alliance with Venice.'],
  A3:['The Crusade','Win 10 battles.'],B1:['The Alum Mines of Tolfa','Fill the treasury with the alum revenue.'],
  B2:['Bind the Romagna','Take Ravenna.'],B3:['The Port of Ancona','Raise Ancona to development 4.'],B4:['The League of Cambrai','Take Friuli from Venice.']},
 CYP:{A1:['Win Back Famagusta','Take Famagusta from the Genoese.'],A2:['Friendship with Rhodes','Form an alliance with the Knights of Rhodes.'],
  A3:['Venetian Protection','Form an alliance with Venice.'],B1:['Peace with Cairo','Form an alliance with the Mamluk Sultanate.'],
  B2:['Sugar Cane','Raise Nicosia to development 4.'],B3:['Win Back Korykos','Take Icel.'],B4:['The Cilician Coast','Take Alanya.']},
 RHO:{A1:['The Siege of Rhodes','Hold Rhodes for 8 turns while the Ottomans attack.'],A2:['The Castle of Bodrum','Raise Bodrum to development 2.'],
  A3:['The Mentese Coast','Take Mentese.'],B1:['The Hospitaller Treasury','Save gold for the Order.'],
  B2:['Friendship with Cyprus','Form an alliance with Cyprus.'],B3:['The Venetian Alliance','Form an alliance with Venice.'],A4:['Win Back Smyrna','Win back Smyrna, which the Knights lost in 1402.'],B4:['The Galleys of the Order','Win six battles.']},
 HAF:{A1:['The Port of Tripoli','Raise Tripoli to development 4.'],A2:['Benghazi','Take Benghazi.'],A3:['Derna and Tobruk','Take Derna and Tobruk.'],
  B1:['The Corsair Ports','Build markets in 2 provinces.'],B2:['The Treasure of Kairouan','Save gold in the treasury.'],B3:['The Sirte Desert','Raise Sirte to development 2.']},
 SAF:{A1:['The Throne of Tabriz','Take Tabriz.'],A2:['Baghdad','Take Baghdad.'],A3:['The Qizilbash of Anatolia','Take Erzincan and Sivas.'],
  B1:['The Shirvan Campaign','Take Shirvan.'],B2:['Diyarbakir','Take Diyarbakir.'],B3:['The Georgian Tribute','Take Tiflis.'],B4:['The Gate of Derbent','Take Derbent.']}
,
 CLM:{A1:['First Blood','Win two battles.'],A2:['Partisans','Rule five provinces.'],A3:['The Fight for the Throne','Win six battles.'],B1:['A War Chest','Save gold in the treasury.'],B2:['The Towns Stand with Us','Build markets in 2 provinces.'],B3:['A New Dynasty','Rule eight provinces.']}
};
const MIS_BR_EN={OSM:['Rumelia and the West','Anatolia and the East'],BYZ:['The Siege and Thrace','The Morea and Anatolia'],VEN:['The Aegean and the Levant','The Sea Republic'],HUN:['The Danube Wars','The Kingdom of Corvinus'],
 SRB:['Defence of the Despotate','Friends and Vengeance'],BOS:['Fortresses and Coasts','Mines and Crown'],WAL:['The Danube Campaigns','The Voivodeship'],MOL:['The Black Sea Fortresses','The Legacy of Stephen'],
 ALB:['The Mountain Resistance','Latin Friends'],KRM:['Lord of the Steppe','Caffa and Friends'],GEN:['Caffa and the Black Sea','The Aegean Islands'],KAR:['The Seljuk Inheritance','Coasts and Treasury'],
 CAN:['Sinope and the Mines','The Beylik\'s Lands'],DUL:['Uplands and City','Fortress and Kinship'],MAM:['The Northern Frontier','The Euphrates and the Sea'],AKK:['The Qara Qoyunlu War','Friends and Marriages'],
 KKY:['The Western Campaigns','The Caucasus and Trade'],TRB:['Marriage and Trade','Walls and Friends'],GEO:['Union and Growth','The Caucasus Shield'],HAB:['The Hungarian Inheritance','Vienna and the Crown'],
 POL:['Down to the Black Sea','Crowns and Friends'],GH:['The Crimean Claim','The Caspian and Friends'],ARA:['The Adriatic','Italy'],PAP:['The Crusade','The Papal States'],
 CYP:['The Island and Friends','Sugar and Coast'],RHO:['The Island Fortress','Friends of the Order'],HAF:['The Eastern Shores','Corsairs and Treasury'],SAF:['The Qizilbash Throne','The Caucasus and Iraq'],
 CLM:['The Claim','The Partisans']};
/** Title and description of mission m of faction f in the current language. English comes from MIS_EN by id,
 but only when m is that tree's own mission (same Turkish title), so a generic fallback is never mislabelled. */
function misTxt(m,f){f=f||(S&&S.player);const e=EN&&MIS_EN[f]&&MIS_EN[f][m.id],src=MIS[f]&&MIS[f].find(y=>y.id===m.id);
 return e&&src&&src.t===m.t?{t:e[0],d:e[1]}:{t:m.t,d:m.d};}
/** Fallback missions for a faction without a tree (never used for the 28 factions, kept for safety). */
function genericMissions(f){const n=facProvs(f).length;
 const nb=nbrs(f).filter(g=>g!=='SAF'&&!isAlly(f,g)).sort((a,b)=>strength(a)-strength(b));const tgt=nb[0];
 const r=[{id:'A1',br:'A',t:lng('Genişleme','Expansion'),d:lng(`${n+4} eyalete ulaş.`,`Rule ${n+4} provinces.`),count:n+4,g:60},{id:'B1',br:'B',t:lng('Dolu Hazine','A Full Treasury'),d:lng('Hazinende para biriktir.','Save gold in your treasury.'),gold:'auto',g:0,dev:['cap',1]}];
 if(tgt)r.push({id:'A2',br:'A',req:['A1'],t:lng(`${FAC[tgt].s} Seferi`,`The ${FAC[tgt].s} Campaign`),d:lng(`${PD[S.fac[tgt].cap].name} şehrini al.`,`Take the city of ${PD[S.fac[tgt].cap].name}.`),own:[PD[S.fac[tgt].cap].key],g:100});
 r.push({id:'A3',br:'A',req:['A1'],t:lng('Bölgesel Güç','Regional Power'),d:lng(`${n+12} eyalete ulaş.`,`Rule ${n+12} provinces.`),count:n+12,g:150});return r;}
/** Gold target scaled to what the realm can actually save (bug B8: Trebizond's 400 at +0 a turn). */
function misGoldTarget(f){const net=income(f)-upkeep(f);return Math.max(120,Math.round(net*12));}
function misInstantiate(f){const ms=MIS[f]||genericMissions(f);return ms.map(m=>{const c={...m};if(c.gold==='auto')c.gold=misGoldTarget(f);if(c.hold)c.prog=0;return c;});}

/* ---------------- progress ---------------- */
const misDoneId=(id)=>S.mis.some((m,k)=>m.id===id&&S.misDone[k]!=null);
function misOpen(m){return !m.req||m.req.every(misDoneId);}
/** A held province counts as threatened while at war with the named threat, or with an enemy army next to it. */
function misThreat(pl,i,vs){if(vs&&atWar(pl,vs))return true;if(!S.armies||!S.armies.length)return false;const adj=PD[i].adj;
 for(const a of S.armies)if(a.f!==pl&&atWar(pl,a.f)&&(a.loc===i||adj.includes(a.loc)))return true;return false;}
function misProgress(m,pl){
 if(m.own){const n=m.own.filter(x=>S.prov[PK[x]].o===pl).length;return {ok:n===m.own.length,p:`${n}/${m.own.length}`};}
 if(m.hold){const i=PK[m.hold],mine=S.prov[i].o===pl;if(m.vs&&!alive(m.vs)&&mine)return {ok:true,p:''};
  if(m.turns==null)return {ok:mine&&S.turn>=(m.until||0),p:''};          // pre-W1 format
  return {ok:mine&&(m.prog||0)>=m.turns,p:lng(`${m.prog||0}/${m.turns} tur`,`${m.prog||0}/${m.turns} turns`)};}
 if(m.ally){return {ok:alive(m.ally)&&isAlly(pl,m.ally),p:alive(m.ally)?'':lng('devlet yok oldu','the realm is gone')};}
 if(m.devAt){const ks=Object.keys(m.devAt),n=ks.filter(k=>S.prov[PK[k]].o===pl&&S.prov[PK[k]].dev>=m.devAt[k]).length;return {ok:n===ks.length,p:`${n}/${ks.length}`};}
 if(m.mkt){const n=facProvs(pl).filter(i=>S.prov[i].mkt).length;return {ok:n>=m.mkt,p:`${n}/${m.mkt}`};}
 if(m.count){const n=facProvs(pl).length;return {ok:n>=m.count,p:`${n}/${m.count}`};}
 if(m.gold){return {ok:S.fac[pl].gold>=m.gold,p:`${Math.floor(S.fac[pl].gold)}/${m.gold}`};}
 if(m.won){return {ok:S.stats.won>=m.won,p:`${S.stats.won}/${m.won}`};}
 return {ok:false,p:''};}
function checkMissions(){
 if(!S.player)return;const pl=S.player;
 S.mis.forEach((m,k)=>{if(S.misDone[k]!=null||!misOpen(m))return;
  if(m.hold&&m.turns!=null){const i=PK[m.hold];if(S.prov[i].o===pl&&misThreat(pl,i,m.vs))m.prog=(m.prog||0)+1;}
  if(!misProgress(m,pl).ok)return;
  S.misDone[k]=S.turn;S.fac[pl].gold+=m.g||0;
  if(m.dev){const pi=m.dev[0]==='cap'?S.fac[pl].cap:PK[m.dev[0]];if(S.prov[pi].o===pl)S.prov[pi].dev+=m.dev[1];}
  const mt=misTxt(m,pl).t;news(lng(`Hedef tamamlandı: ${m.t}${m.g?` (+${m.g} altın)`:''}`,`Goal achieved: ${mt}${m.g?` (+${m.g} gold)`:''}`),'good');toast(lng(`✦ ${m.t} tamamlandı`,`✦ ${mt} achieved`),'good');SND.play('fanfare');});
}
function showMissions(){
 const pl=S.player,br=(EN&&MIS_BR_EN[pl])||MIS_BR[pl]||lng(['Birinci yol','İkinci yol'],['First path','Second path']);
 const row=(m,k)=>{const done=S.misDone[k]!=null,open=misOpen(m),pr=done?{p:''}:misProgress(m,pl);
  const lock=!done&&!open,need=lock?m.req.map(id=>{const x=S.mis.find(y=>y.id===id);return x&&misTxt(x,pl).t;}).filter(Boolean).join(', '):'',mx=misTxt(m,pl);
  return `<div class="mis ${done?'done':''} ${lock?'locked':''}"><span class="ck">${done?'✓':lock?'🔒':''}</span><div><div class="t">${esc(mx.t)}</div><div class="d">${esc(mx.d)}${!done&&!lock&&pr.p?` · ${esc(pr.p)}`:''}${lock?` · ${lng('Önce','Requires')}: ${esc(need)}`:''}</div></div><span class="r">${m.g?lng(`+${m.g} altın`,`+${m.g} gold`):''}${m.dev?lng(' · imar',' · develop'):''}</span></div>`;};
 const grp=b=>S.mis.map((m,k)=>[m,k]).filter(([m])=>(m.br||'A')===b);
 const sec=(b,name)=>{const L=grp(b);return L.length?`<div class="sec mis-br"><h3>${esc(name)}</h3><div class="rows">${L.map(([m,k])=>row(m,k)).join('')}</div></div>`:'';};
 openModal(`<div class="eyebrow">${esc(FAC[pl].n)}</div><h2>${lng('Tarihî Hedefler','Historic Goals')}</h2>${sec('A',br[0])}${sec('B',br[1])}
  <p class="hint">${lng('Kilitli hedefler, öncesindeki hedef tamamlanınca açılır. "Elinde tut" hedeflerinde süre yalnızca düşman gerçekten tehdit ederken (savaşta ya da ordusu yakındayken) işler.','Locked goals open once the goal before them is achieved. For "hold" goals the clock only runs while an enemy truly threatens you (at war, or with an army nearby).')}</p>
  <p class="hint">${lng(`Zafer: 1531 yılına kadar hayatta kal ve puanını büyüt ya da haritadaki eyaletlerin yarısına (${Math.ceil(NP*.5)}) hükmet.`,`Victory: survive until 1531 and grow your score, or rule half of the provinces on the map (${Math.ceil(NP*.5)}).`)}</p><div class="foot"><button class="btn primary" data-act="mclose">${lng('Kapat','Close')}</button></div>`);
}
hook('newGame',(S,player)=>{if(player)S.mis=misInstantiate(player);},10);
/* Older saves: a tree that gained missions since (the W2 capstones that make every branch three tiers deep) gets
   them appended. Done flags are kept by index, so appending never shifts them. Idempotent. */
hook('migrate',(s)=>{const pl=s&&s.player,tree=pl&&MIS[pl];if(!tree||!Array.isArray(s.mis)||!s.mis.length)return;
 const a1=s.mis.find(m=>m.id===tree[0].id);if(!a1||a1.t!==tree[0].t)return;
 const have=new Set(s.mis.map(m=>m.id)),add=tree.filter(m=>!have.has(m.id));if(!add.length)return;
 const prev=S;S=s;try{for(const m of add){const c={...m};if(c.gold==='auto'){try{c.gold=misGoldTarget(pl);}catch(e){c.gold=120;}}if(c.hold)c.prog=0;s.mis.push(c);}}finally{S=prev;}},25);
hook('afterRound',()=>checkMissions(),10);
ACTS.missions=()=>showMissions();
KE.MIS=MIS;
