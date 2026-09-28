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
  {id:'A7',br:'A',req:['A6'],t:'Kızıl Elma',d:'Roma\'yı fethet.',own:['roma'],g:300},
  {id:'B1',br:'B',t:'Karaman Meselesi',d:'Konya ve Larende\'yi ilhak et.',own:['konya','karaman'],g:80},
  {id:'B2',br:'B',req:['B1'],t:'Trabzon Seferi',d:'Komnenosların son kalesini al.',own:['trabzon'],g:60},
  {id:'B3',br:'B',req:['B1'],t:'Doğu Seferi',d:'Tebriz\'e yürü ve İran kapısını aç.',own:['tebriz'],g:150},
  {id:'B4',br:'B',req:['B1'],t:'Mısır\'ın Anahtarı',d:'Halep ve Kahire\'yi fethet.',own:['halep','kahire'],g:250}],
 BYZ:[{id:'A1',br:'A',t:'Surları Tut',d:'Osmanlı kuşatması sürerken Konstantiniyye\'yi 8 tur boyunca elinde tut.',hold:'istanbul',vs:'OSM',turns:8,g:120},
  {id:'A2',br:'A',req:['A1'],t:'Selanik\'i Kurtar',d:'Selanik\'i geri al.',own:['selanik'],g:90},
  {id:'A3',br:'A',req:['A2'],t:'Edirne\'yi Geri Al',d:'Adrianopolis yeniden Roma\'nın olsun.',own:['edirne'],g:120},
  {id:'B1',br:'B',t:'Mora\'yı Birleştir',d:'Thomas ile Demetrios\'un çekişmesine son ver: Mistra\'yı 4, Korint\'i 3 gelişime çıkar.',devAt:{mistra:4,korint:3},g:60},
  {id:'B2',br:'B',req:['B1'],t:'Atina\'yı Kurtar',d:'Atina\'yı Osmanlı\'dan al.',own:['atina'],g:70},
  {id:'B3',br:'B',req:['A1'],t:'Anadolu\'ya Dönüş',d:'Bursa ve İzmit\'i al.',own:['bursa','izmit'],g:120}],
 VEN:[{id:'A1',br:'A',t:'Ege\'nin Kraliçesi',d:'Sakız ve Midilli\'yi al.',own:['sakiz','midilli'],g:70},
  {id:'A2',br:'A',req:['A1'],t:'Kıbrıs',d:'Lefkoşa ve Magosa\'yı al.',own:['kibris','magosa'],g:100},
  {id:'A3',br:'A',req:['A1'],t:'Doğu Akdeniz Ticareti',d:'8 eyalette pazar kur.',mkt:8,g:120},
  {id:'B1',br:'B',t:'Eğriboz Kalesi',d:'Osmanlı saldırırken Eğriboz\'u 8 tur elinde tut.',hold:'egriboz',vs:'OSM',turns:8,g:80},
  {id:'B2',br:'B',req:['B1'],t:'Selanik Limanı',d:'Selanik\'i al.',own:['selanik'],g:90},
  {id:'B3',br:'B',req:['B1'],t:'Arnavut Kıyıları',d:'Avlonya\'yı al.',own:['avlonya'],g:70}],
 HUN:[{id:'A1',br:'A',t:'Belgrad\'ın Savunması',d:'Osmanlı saldırırken Belgrad\'ı 6 tur elinde tut.',hold:'belgrad',vs:'OSM',turns:6,g:70},
  {id:'A2',br:'A',req:['A1'],t:'Semendire Hattı',d:'Semendire\'yi al.',own:['semendire'],g:70},
  {id:'A3',br:'A',req:['A2'],t:'Varna\'nın İntikamı',d:'Sofya ve Vidin\'i al.',own:['sofya','vidin'],g:120},
  {id:'B1',br:'B',t:'Kara Ordu',d:'Paralı askerlere yetecek hazineyi biriktir.',gold:'auto',g:0,dev:['cap',1]},
  {id:'B2',br:'B',req:['B1'],t:'Tuna Hattı',d:'Niğbolu ve Silistre\'yi al.',own:['nigbolu','silistre'],g:90},
  {id:'B3',br:'B',req:['B1'],t:'Avusturya Tacı',d:'Viyana\'yı al.',own:['viyana'],g:150}],
 SRB:[{id:'A1',br:'A',t:'Semendire Kalesi',d:'Osmanlı saldırırken Semendire\'yi 8 tur elinde tut.',hold:'semendire',vs:'OSM',turns:8,g:80},
  {id:'A2',br:'A',req:['A1'],t:'Novobırda Gümüşü',d:'Novobırda\'yı 4 gelişime çıkar.',devAt:{novobirda:4},g:60},
  {id:'A3',br:'A',req:['A2'],t:'Kosova\'nın Öcü',d:'Üsküp ve Köstendil\'i al.',own:['uskup','kostendil'],g:100},
  {id:'B1',br:'B',t:'Macar Dostluğu',d:'Macar Krallığı ile ittifak kur.',ally:'HUN',g:50},
  {id:'B2',br:'B',req:['B1'],t:'Bosna ile Birlik',d:'Bosna ile ittifak kur.',ally:'BOS',g:50},
  {id:'B3',br:'B',req:['B1'],t:'Niş\'ten Sofya\'ya',d:'Sofya\'yı al.',own:['sofya'],g:100}],
 BOS:[{id:'A1',br:'A',t:'Yayçe Kalesi',d:'Osmanlı saldırırken Yayçe\'yi 8 tur elinde tut.',hold:'yayce',vs:'OSM',turns:8,g:80},
  {id:'A2',br:'A',req:['A1'],t:'Hersek\'i Bağla',d:'Hersek\'i 4 gelişime çıkar.',devAt:{hersek:4},g:60},
  {id:'A3',br:'A',req:['A2'],t:'Dalmaçya Kıyıları',d:'Split ve Zadar\'ı al.',own:['split','zadar'],g:100},
  {id:'B1',br:'B',t:'Srebrenice Madenleri',d:'Srebrenice\'yi 3 gelişime çıkar.',devAt:{srebrenice:3},g:50},
  {id:'B2',br:'B',req:['B1'],t:'Papa\'nın Tacı',d:'Papalık ile ittifak kur.',ally:'PAP',g:60},
  {id:'B3',br:'B',req:['B1'],t:'Sırp Mirası',d:'Semendire\'yi al.',own:['semendire'],g:100}],
 WAL:[{id:'A1',br:'A',t:'Tuna Seferi',d:'Niğbolu\'yu al.',own:['nigbolu'],g:80},
  {id:'A2',br:'A',req:['A1'],t:'Silistre ve Dobruca',d:'Silistre ve Dobruca\'yı al.',own:['silistre','dobruca'],g:90},
  {id:'A3',br:'A',req:['A2'],t:'Varna',d:'Varna\'yı al.',own:['varna'],g:80},
  {id:'B1',br:'B',t:'Tergovişte Sarayı',d:'Tergovişte\'yi 5 gelişime çıkar.',devAt:{tergoviste:5},g:50},
  {id:'B2',br:'B',req:['B1'],t:'Macar Dostluğu',d:'Macar Krallığı ile ittifak kur.',ally:'HUN',g:50},
  {id:'B3',br:'B',req:['B1'],t:'Boğdan\'la Birlik',d:'Boğdan ile ittifak kur.',ally:'MOL',g:50}],
 MOL:[{id:'A1',br:'A',t:'Akkerman ve Kili',d:'Osmanlı saldırırken Akkerman\'ı 8 tur elinde tut.',hold:'akkerman',vs:'OSM',turns:8,g:80},
  {id:'A2',br:'A',req:['A1'],t:'Eflak Tahtı',d:'Tergovişte\'yi al.',own:['tergoviste'],g:100},
  {id:'A3',br:'A',req:['A2'],t:'İbrail Pazarı',d:'İbrail\'i al.',own:['ibrail'],g:60},
  {id:'B1',br:'B',t:'Suçava Kalesi',d:'Suçava\'yı 5 gelişime çıkar.',devAt:{sucava:5},g:50},
  {id:'B2',br:'B',req:['B1'],t:'Lehistan\'la Barış',d:'Lehistan ile ittifak kur.',ally:'POL',g:50},
  {id:'B3',br:'B',req:['B1'],t:'Putna Manastırı',d:'Manastır ve kiliseler için hazine biriktir.',gold:'auto',g:0,dev:['cap',1]}],
 ALB:[{id:'A1',br:'A',t:'Kroya Direnişi',d:'Osmanlı saldırırken Kroya\'yı 10 tur elinde tut.',hold:'kroya',vs:'OSM',turns:10,g:100},
  {id:'A2',br:'A',req:['A1'],t:'Kıyıları Birleştir',d:'İşkodra ve Dıraç\'ı al.',own:['iskodra','drac'],g:90},
  {id:'A3',br:'A',req:['A1'],t:'Üsküp',d:'Üsküp\'ü al.',own:['uskup'],g:80},
  {id:'B1',br:'B',t:'Venedik İttifakı',d:'Venedik ile ittifak kur.',ally:'VEN',g:60},
  {id:'B2',br:'B',req:['B1'],t:'Napoli\'nin Yardımı',d:'Napoli Krallığı ile ittifak kur (Gaeta Antlaşması).',ally:'ARA',g:60},
  {id:'B3',br:'B',req:['B2'],t:'Avlonya Limanı',d:'Avlonya\'yı al.',own:['avlonya'],g:70}],
 KRM:[{id:'A1',br:'A',t:'Büyük Orda\'yı Yık',d:'Azak\'ı al.',own:['azak'],g:90},
  {id:'A2',br:'A',req:['A1'],t:'Kuban Bozkırı',d:'Kuban ve Çerkes\'i al.',own:['kuban','cerkes'],g:70},
  {id:'A3',br:'A',req:['A1'],t:'Deşt-i Kıpçak',d:'Kıpçak ve Don Boyu\'nu al.',own:['kipcak','don'],g:80},
  {id:'B1',br:'B',t:'Kefe\'nin Kapıları',d:'Kefe\'yi al.',own:['kefe'],g:90},
  {id:'B2',br:'B',req:['B1'],t:'Osmanlı Dostluğu',d:'Osmanlı ile ittifak kur.',ally:'OSM',g:60},
  {id:'B3',br:'B',req:['B1'],t:'Özi Kalesi',d:'Özi\'yi al.',own:['ozi'],g:60}],
 GEN:[{id:'A1',br:'A',t:'Kefe\'yi Koru',d:'Osmanlı saldırırken Kefe\'yi 8 tur elinde tut.',hold:'kefe',vs:'OSM',turns:8,g:80},
  {id:'A2',br:'A',req:['A1'],t:'Karadeniz Ticareti',d:'4 eyalette pazar kur.',mkt:4,g:80},
  {id:'A3',br:'A',req:['A2'],t:'Sinop Limanı',d:'Sinop\'u al.',own:['sinop'],g:70},
  {id:'B1',br:'B',t:'Sakız Mastiği',d:'Sakız\'ı 3 gelişime çıkar.',devAt:{sakiz:3},g:50},
  {id:'B2',br:'B',req:['B1'],t:'Midilli\'nin Zenginliği',d:'Midilli\'yi 3 gelişime çıkar.',devAt:{midilli:3},g:50},
  {id:'B3',br:'B',req:['B1'],t:'Lefkoşa',d:'Lefkoşa\'yı al.',own:['kibris'],g:90}],
 KAR:[{id:'A1',br:'A',t:'Selçuklu Mirası',d:'Ankara ve Kırşehir\'i al.',own:['ankara','kirsehir'],g:70},
  {id:'A2',br:'A',req:['A1'],t:'Bursa\'ya Yürüyüş',d:'Osmanlı\'nın eski başkentini al.',own:['bursa'],g:150},
  {id:'A3',br:'A',req:['A1'],t:'Germiyan ve Hamid',d:'Kütahya ve Hamid\'i al.',own:['kutahya','hamid'],g:80},
  {id:'B1',br:'B',t:'Akdeniz Kıyıları',d:'Teke ve Adana\'yı al.',own:['teke','adana'],g:70},
  {id:'B2',br:'B',req:['B1'],t:'Dulkadir Ovası',d:'Maraş\'ı al.',own:['maras'],g:70},
  {id:'B3',br:'B',req:['B1'],t:'Karaman Akçesi',d:'Hazinede para biriktir.',gold:'auto',g:0,dev:['cap',1]}],
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
  {id:'B3',br:'B',req:['B1'],t:'Osmanlı ile Akrabalık',d:'Osmanlı ile ittifak kur (Sitti Mükrime Hatun\'un düğünü).',ally:'OSM',g:50}],
 MAM:[{id:'A1',br:'A',t:'Kilikya Kıyıları',d:'İçel ve Alaiye\'yi al.',own:['icel','alaiye'],g:60},
  {id:'A2',br:'A',req:['A1'],t:'Rum Diyarı',d:'Konya\'yı al.',own:['konya'],g:120},
  {id:'A3',br:'A',req:['A1'],t:'Rodos\'u Düşür',d:'Şövalyelerin adasını al.',own:['rodos'],g:90},
  {id:'B1',br:'B',t:'Fırat Hattı',d:'Ruha\'yı al.',own:['urfa'],g:70},
  {id:'B2',br:'B',req:['B1'],t:'Bağdat',d:'Abbasi hilafetinin eski merkezini al.',own:['bagdat'],g:120},
  {id:'B3',br:'B',req:['B1'],t:'Kıbrıs Haracı',d:'Lefkoşa\'yı al.',own:['kibris'],g:80}],
 AKK:[{id:'A1',br:'A',t:'Kara Koyun\'u Yık',d:'Tebriz\'i al.',own:['tebriz'],g:150},
  {id:'A2',br:'A',req:['A1'],t:'Bağdat',d:'Bağdat\'ı al.',own:['bagdat'],g:120},
  {id:'A3',br:'A',req:['A1'],t:'Azerbaycan\'ın Efendisi',d:'Revan ve Nahçıvan\'ı al.',own:['revan','nahcivan'],g:80},
  {id:'B1',br:'B',t:'Erzurum Yaylası',d:'Erzurum ve Kars\'ı al.',own:['erzurum','kars'],g:70},
  {id:'B2',br:'B',req:['B1'],t:'Trabzon Evliliği',d:'Trabzon ile ittifak kur (Despina Hatun\'un düğünü).',ally:'TRB',g:60},
  {id:'B3',br:'B',req:['B1'],t:'Venedik İttifakı',d:'Venedik ile ittifak kur; Osmanlı\'ya karşı top ve tüfek gelsin.',ally:'VEN',g:80}],
 KKY:[{id:'A1',br:'A',t:'Ak Koyun\'u Ez',d:'Diyarbakır\'ı al.',own:['diyarbakir'],g:120},
  {id:'A2',br:'A',req:['A1'],t:'Halep',d:'Halep\'i al.',own:['halep'],g:120},
  {id:'A3',br:'A',req:['A1'],t:'Anadolu Yolu',d:'Harput ve Erzincan\'ı al.',own:['harput','erzincan'],g:70},
  {id:'B1',br:'B',t:'Gürcü Seferi',d:'Tiflis\'i al.',own:['tiflis'],g:70},
  {id:'B2',br:'B',req:['B1'],t:'Kafkas Kapıları',d:'Kaheti ve Ahıska\'yı al.',own:['kaheti','ahiska'],g:70},
  {id:'B3',br:'B',req:['B1'],t:'Ticaret Şehri Tebriz',d:'5 eyalette pazar kur.',mkt:5,g:80}],
 TRB:[{id:'A1',br:'A',t:'Akkoyunlu Evliliği',d:'Akkoyunlu ile ittifak kur (Despina Hatun\'un düğünü).',ally:'AKK',g:60},
  {id:'A2',br:'A',req:['A1'],t:'Pontus Kıyıları',d:'Canik\'i al.',own:['canik'],g:60},
  {id:'A3',br:'A',req:['A2'],t:'Kafkas Ticareti',d:'3 eyalette pazar kur.',mkt:3,g:60},
  {id:'B1',br:'B',t:'Trabzon Surları',d:'Osmanlı saldırırken Trabzon\'u 8 tur elinde tut.',hold:'trabzon',vs:'OSM',turns:8,g:80},
  {id:'B2',br:'B',req:['B1'],t:'Kerasunt\'u İmar Et',d:'Kerasunt\'u 3 gelişime çıkar.',devAt:{kerasunt:3},g:50},
  {id:'B3',br:'B',req:['B1'],t:'Gürcü Dostluğu',d:'Gürcistan ile ittifak kur.',ally:'GEO',g:50}],
 GEO:[{id:'A1',br:'A',t:'Gürcistan\'ın Birliği',d:'Tiflis\'i 5 gelişime çıkar.',devAt:{tiflis:5},g:60},
  {id:'A2',br:'A',req:['A1'],t:'Şirvan Yolu',d:'Şirvan\'ı al.',own:['sirvan'],g:80},
  {id:'A3',br:'A',req:['A1'],t:'Ermeni Yaylası',d:'Revan ve Kars\'ı al.',own:['revan','kars'],g:80},
  {id:'B1',br:'B',t:'Trabzon Dostluğu',d:'Trabzon ile ittifak kur.',ally:'TRB',g:40},
  {id:'B2',br:'B',req:['B1'],t:'Kafkas Kalkanı',d:'Karakoyunlu saldırırken Tiflis\'i 8 tur elinde tut.',hold:'tiflis',vs:'KKY',turns:8,g:80},
  {id:'B3',br:'B',req:['B2'],t:'Derbent Kapısı',d:'Derbent\'i al.',own:['derbent'],g:90}],
 HAB:[{id:'A1',br:'A',t:'Macar Tacı',d:'Pojon ve Yanık\'ı al.',own:['pojon','yanik'],g:80},
  {id:'A2',br:'A',req:['A1'],t:'Budin',d:'Macar başkentini al.',own:['budin'],g:200},
  {id:'A3',br:'A',req:['A1'],t:'Hırvat Kıyıları',d:'Zağrep\'i al.',own:['zagrep'],g:80},
  {id:'B1',br:'B',t:'Viyana Surları',d:'Viyana\'yı 7 gelişime çıkar.',devAt:{viyana:7},g:60},
  {id:'B2',br:'B',req:['B1'],t:'Friuli',d:'Friuli\'yi al.',own:['friuli'],g:70},
  {id:'B3',br:'B',req:['B1'],t:'İmparatorluk Tacı',d:'Taç giyme töreni için hazine biriktir.',gold:'auto',g:0,dev:['viyana',1]}],
 POL:[{id:'A1',br:'A',t:'Özi Limanı',d:'Özi\'yi 2 gelişime çıkar.',devAt:{ozi:2},g:40},
  {id:'A2',br:'A',req:['A1'],t:'Kili ve Akkerman',d:'Kili ve Akkerman\'ı al.',own:['kili','akkerman'],g:100},
  {id:'A3',br:'A',req:['A2'],t:'Kırım\'ın Kapısı',d:'Or Kapı\'yı al.',own:['or'],g:80},
  {id:'B1',br:'B',t:'Haliç Voyvodalığı',d:'Haliç\'i 3 gelişime çıkar.',devAt:{halic:3},g:40},
  {id:'B2',br:'B',req:['B1'],t:'Macar Tahtı',d:'Budin\'i al.',own:['budin'],g:200},
  {id:'B3',br:'B',req:['B1'],t:'Boğdan Dostluğu',d:'Boğdan ile ittifak kur.',ally:'MOL',g:50}],
 GH:[{id:'A1',br:'A',t:'Kırım\'ı Geri Al',d:'Bahçesaray\'ı al.',own:['bahcesaray'],g:100},
  {id:'A2',br:'A',req:['A1'],t:'Kefe\'nin Hazinesi',d:'Kefe\'yi al.',own:['kefe'],g:90},
  {id:'A3',br:'A',req:['A1'],t:'Or Kapı',d:'Or Kapı\'yı al.',own:['or'],g:60},
  {id:'B1',br:'B',t:'Hazar Kıyıları',d:'Terek\'i 2 gelişime çıkar.',devAt:{terek:2},g:40},
  {id:'B2',br:'B',req:['B1'],t:'Kafkas Kapıları',d:'Derbent\'i al.',own:['derbent'],g:80},
  {id:'B3',br:'B',req:['B1'],t:'Lehistan İttifakı',d:'Lehistan ile ittifak kur.',ally:'POL',g:50}],
 ARA:[{id:'A1',br:'A',t:'Otranto Kalesi',d:'Otranto\'yu 4 gelişime çıkar.',devAt:{otranto:4},g:50},
  {id:'A2',br:'A',req:['A1'],t:'Arnavut Kıyıları',d:'Avlonya\'yı al.',own:['avlonya'],g:80},
  {id:'A3',br:'A',req:['A1'],t:'İskender Bey İttifakı',d:'Arnavutluk ile ittifak kur (Gaeta Antlaşması).',ally:'ALB',g:50},
  {id:'B1',br:'B',t:'Abruzzo Sınırı',d:'Abruzzo\'yu 3 gelişime çıkar.',devAt:{abruzzo:3},g:40},
  {id:'B2',br:'B',req:['B1'],t:'Roma\'ya Baskı',d:'Ankona\'yı al.',own:['ankona'],g:90},
  {id:'B3',br:'B',req:['B1'],t:'Sicilya Buğdayı',d:'Palermo\'yu 5 gelişime çıkar.',devAt:{palermo:5},g:60}],
 PAP:[{id:'A1',br:'A',t:'Haçlı Çağrısı',d:'Macar Krallığı ile ittifak kur.',ally:'HUN',g:60},
  {id:'A2',br:'A',req:['A1'],t:'Haçlı Donanması',d:'Venedik ile ittifak kur.',ally:'VEN',g:60},
  {id:'A3',br:'A',req:['A2'],t:'Haçlı Seferi',d:'10 muharebe kazan.',won:10,g:150},
  {id:'B1',br:'B',t:'Tolfa Şap Madenleri',d:'Şap gelirinden hazine biriktir.',gold:'auto',g:0,dev:['roma',1]},
  {id:'B2',br:'B',req:['B1'],t:'Romagna\'yı Bağla',d:'Ravenna\'yı al.',own:['ravenna'],g:70},
  {id:'B3',br:'B',req:['B1'],t:'Ankona Limanı',d:'Ankona\'yı 4 gelişime çıkar.',devAt:{ankona:4},g:50}],
 CYP:[{id:'A1',br:'A',t:'Magosa\'yı Geri Al',d:'Magosa\'yı Cenevizlilerden al.',own:['magosa'],g:80},
  {id:'A2',br:'A',req:['A1'],t:'Rodos Dostluğu',d:'Rodos Şövalyeleri ile ittifak kur.',ally:'RHO',g:40},
  {id:'A3',br:'A',req:['A2'],t:'Venedik Himayesi',d:'Venedik ile ittifak kur.',ally:'VEN',g:50},
  {id:'B1',br:'B',t:'Kahire ile Barış',d:'Memlük Sultanlığı ile ittifak kur.',ally:'MAM',g:60},
  {id:'B2',br:'B',req:['B1'],t:'Şeker Kamışı',d:'Lefkoşa\'yı 4 gelişime çıkar.',devAt:{kibris:4},g:50},
  {id:'B3',br:'B',req:['B1'],t:'Korykos\'u Geri Al',d:'İçel\'i al.',own:['icel'],g:80}],
 RHO:[{id:'A1',br:'A',t:'Rodos Kuşatması',d:'Osmanlı saldırırken Rodos\'u 8 tur elinde tut.',hold:'rodos',vs:'OSM',turns:8,g:100},
  {id:'A2',br:'A',req:['A1'],t:'Bodrum Kalesi',d:'Bodrum\'u 2 gelişime çıkar.',devAt:{bodrum:2},g:40},
  {id:'A3',br:'A',req:['A1'],t:'Menteşe Kıyısı',d:'Menteşe\'yi al.',own:['mentese'],g:70},
  {id:'B1',br:'B',t:'Hospitalier Hazinesi',d:'Tarikat için hazine biriktir.',gold:'auto',g:0,dev:['rodos',1]},
  {id:'B2',br:'B',req:['B1'],t:'Kıbrıs Dostluğu',d:'Kıbrıs ile ittifak kur.',ally:'CYP',g:40},
  {id:'B3',br:'B',req:['B1'],t:'Venedik İttifakı',d:'Venedik ile ittifak kur.',ally:'VEN',g:50}],
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
  {id:'B3',br:'B',req:['B1'],t:'Gürcü Haracı',d:'Tiflis\'i al.',own:['tiflis'],g:80}]
};
const MIS_BR={OSM:['Rumeli ve Batı','Anadolu ve Doğu'],BYZ:['Kuşatma ve Trakya','Mora ve Anadolu'],VEN:['Ege ve Levant','Deniz Devleti'],HUN:['Tuna Savaşları','Korvin\'in Krallığı'],
 SRB:['Despotluğun Savunması','Dostlar ve Öç'],BOS:['Kaleler ve Kıyılar','Madenler ve Taç'],WAL:['Tuna Seferleri','Voyvodalık'],MOL:['Karadeniz Kaleleri','Ştefan\'ın Mirası'],
 ALB:['Dağların Direnişi','Latin Dostlar'],KRM:['Bozkırın Hâkimi','Kefe ve Dostlar'],GEN:['Kefe ve Karadeniz','Ege Adaları'],KAR:['Selçuklu Mirası','Kıyılar ve Hazine'],
 CAN:['Sinop ve Madenler','Beylik Toprakları'],DUL:['Yayla ve Şehir','Kale ve Akrabalık'],MAM:['Kuzey Sınırı','Fırat ve Deniz'],AKK:['Karakoyunlu Seferi','Dostlar ve Evlilikler'],
 KKY:['Batı Seferleri','Kafkasya ve Ticaret'],TRB:['Evlilik ve Ticaret','Surlar ve Dostlar'],GEO:['Birlik ve Genişleme','Kafkas Kalkanı'],HAB:['Macar Mirası','Viyana ve Taç'],
 POL:['Karadeniz\'e İniş','Taçlar ve Dostlar'],GH:['Kırım Davası','Hazar ve Dostlar'],ARA:['Adriyatik','İtalya'],PAP:['Haçlı Seferi','Papalık Toprakları'],
 CYP:['Ada ve Dostlar','Şeker ve Kıyı'],RHO:['Ada Kalesi','Tarikatın Dostları'],HAF:['Doğu Kıyıları','Korsanlar ve Hazine'],SAF:['Kızılbaş Tahtı','Kafkasya ve Irak']};
/** Fallback missions for a faction without a tree (never used for the 28 factions, kept for safety). */
function genericMissions(f){const n=facProvs(f).length;
 const nb=nbrs(f).filter(g=>g!=='SAF'&&!isAlly(f,g)).sort((a,b)=>strength(a)-strength(b));const tgt=nb[0];
 const r=[{id:'A1',br:'A',t:'Genişleme',d:`${n+4} eyalete ulaş.`,count:n+4,g:60},{id:'B1',br:'B',t:'Dolu Hazine',d:'Hazinende para biriktir.',gold:'auto',g:0,dev:['cap',1]}];
 if(tgt)r.push({id:'A2',br:'A',req:['A1'],t:`${FAC[tgt].s} Seferi`,d:`${PD[S.fac[tgt].cap].name} şehrini al.`,own:[PD[S.fac[tgt].cap].key],g:100});
 r.push({id:'A3',br:'A',req:['A1'],t:'Bölgesel Güç',d:`${n+12} eyalete ulaş.`,count:n+12,g:150});return r;}
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
  return {ok:mine&&(m.prog||0)>=m.turns,p:`${m.prog||0}/${m.turns} tur`};}
 if(m.ally){return {ok:alive(m.ally)&&isAlly(pl,m.ally),p:alive(m.ally)?'':'devlet yok oldu'};}
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
  news(`Hedef tamamlandı: ${m.t}${m.g?` (+${m.g} altın)`:''}`,'good');toast(`✦ ${m.t} tamamlandı`,'good');SND.play('fanfare');});
}
function showMissions(){
 const pl=S.player,br=MIS_BR[pl]||['Birinci yol','İkinci yol'];
 const row=(m,k)=>{const done=S.misDone[k]!=null,open=misOpen(m),pr=done?{p:''}:misProgress(m,pl);
  const lock=!done&&!open,need=lock?m.req.map(id=>(S.mis.find(x=>x.id===id)||{}).t).filter(Boolean).join(', '):'';
  return `<div class="mis ${done?'done':''} ${lock?'locked':''}"><span class="ck">${done?'✓':lock?'🔒':''}</span><div><div class="t">${esc(m.t)}</div><div class="d">${esc(m.d)}${!done&&!lock&&pr.p?` · ${esc(pr.p)}`:''}${lock?` · Önce: ${esc(need)}`:''}</div></div><span class="r">${m.g?`+${m.g} altın`:''}${m.dev?' · imar':''}</span></div>`;};
 const grp=b=>S.mis.map((m,k)=>[m,k]).filter(([m])=>(m.br||'A')===b);
 const sec=(b,name)=>{const L=grp(b);return L.length?`<div class="sec mis-br"><h3>${esc(name)}</h3><div class="rows">${L.map(([m,k])=>row(m,k)).join('')}</div></div>`:'';};
 openModal(`<div class="eyebrow">${esc(FAC[pl].n)}</div><h2>Tarihî Hedefler</h2>${sec('A',br[0])}${sec('B',br[1])}
  <p class="hint">Kilitli hedefler, öncesindeki hedef tamamlanınca açılır. "Elinde tut" hedeflerinde süre yalnızca düşman gerçekten tehdit ederken (savaşta ya da ordusu yakındayken) işler.</p>
  <p class="hint">Zafer: 1531 yılına kadar hayatta kal ve puanını büyüt ya da haritadaki eyaletlerin yarısına (${Math.ceil(NP*.5)}) hükmet.</p><div class="foot"><button class="btn primary" data-act="mclose">Kapat</button></div>`);
}
hook('newGame',(S,player)=>{if(player)S.mis=misInstantiate(player);},10);
hook('afterRound',()=>checkMissions(),10);
ACTS.missions=()=>showMissions();
KE.MIS=MIS;
