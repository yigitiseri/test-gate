/* =====================================================================
   FACTIONS AND PROVINCES (1451)
   ===================================================================== */
const FAC={
 OSM:{n:'Osmanlı Devleti',s:'Osmanlı',c:'#b8352a',r:'II. Mehmed',rel:'İslam',cap:'edirne',m:1.3,dif:1,d:'Genç Sultan II. Mehmed tahta çıktı. Rumeli ile Anadolu arasında tek bir engel kaldı: Konstantiniyye surları. Karaman batıdan fırsat kolluyor, Macarlar Tuna boyunda bekliyor.'},
 BYZ:{n:'Bizans İmparatorluğu',s:'Bizans',c:'#6a2c7a',r:'XI. Konstantinos',rel:'Ortodoks',cap:'istanbul',m:1,dif:3,d:'Bin yıllık imparatorluktan geriye bir şehir ve Mora kaldı. Theodosius surlarını tut, Venedik ile ittifakını koru ve kaybedilen toprakları geri al.'},
 VEN:{n:'Venedik Cumhuriyeti',s:'Venedik',c:'#2e7f73',r:'Francesco Foscari',rel:'Katolik',cap:'venedik',m:1,dif:2,d:'Adriyatik ve Ege\'nin tüccar cumhuriyeti. Kaleleri ve adaları zengin ama dağınık. Deniz yolları seni Girit\'ten Mora\'ya taşır.'},
 HUN:{n:'Macar Krallığı',s:'Macar',c:'#7d8f3c',r:'Hunyadi Yanoş',rel:'Katolik',cap:'budin',m:1.25,dif:1,d:'Varna yenilgisinin yarası taze. Hunyadi Yanoş Tuna boyunda Hıristiyan dünyasının kalkanı. Belgrad kalesi ülkenin kapısı.'},
 SRB:{n:'Sırp Despotluğu',s:'Sırbistan',c:'#a4505f',r:'Đurađ Branković',rel:'Ortodoks',cap:'semendire',m:1,dif:3,d:'Gümüş madenleriyle zengin ama iki büyük gücün arasında sıkışmış bir despotluk. Semendire kalesi son sığınak.'},
 BOS:{n:'Bosna Krallığı',s:'Bosna',c:'#35598f',r:'Stjepan Tomaš',rel:'Katolik',cap:'yayce',m:1,dif:3,d:'Dağlık ve bölünmüş bir krallık. Macar desteği olmadan ayakta kalmak zor.'},
 WAL:{n:'Eflak Voyvodalığı',s:'Eflak',c:'#5f8fb8',r:'II. Vladislav',rel:'Ortodoks',cap:'tergoviste',m:1,dif:2,d:'Tuna\'nın kuzeyinde, Macar ve Osmanlı arasında denge kuran bir voyvodalık.'},
 MOL:{n:'Boğdan Voyvodalığı',s:'Boğdan',c:'#8a6440',r:'Alexăndrel',rel:'Ortodoks',cap:'sucava',m:1,dif:2,d:'Akkerman ve Kili limanları Karadeniz ticaretinin anahtarı. Kuzeyde Lehistan, doğuda bozkır.'},
 ALB:{n:'Lezhë Birliği',s:'Arnavutluk',c:'#57504a',r:'İskender Bey',rel:'Katolik',cap:'kroya',m:1.2,dif:3,d:'İskender Bey dağlarda direniyor ve Osmanlı ile savaş hâlinde. Kroya düşmedikçe Arnavutluk yenilmez.'},
 KRM:{n:'Kırım Hanlığı',s:'Kırım',c:'#78b0a8',r:'I. Hacı Giray',rel:'İslam',cap:'bahcesaray',m:1.1,dif:2,d:'Altın Orda\'dan yeni kopmuş genç bir hanlık. Büyük Orda ile savaştasın, Kefe\'deki Cenevizliler komşun.'},
 GEN:{n:'Ceneviz Cumhuriyeti',s:'Ceneviz',c:'#9aa8bd',r:'Pietro Fregoso',rel:'Katolik',cap:'kefe',m:1,dif:3,d:'Kefe\'den Sakız\'a uzanan ticaret kolonileri. Kaleler güçlü ama topraklar birbirinden kopuk.'},
 KAR:{n:'Karamanoğulları',s:'Karaman',c:'#4f7f45',r:'İbrahim Bey',rel:'İslam',cap:'konya',m:1.1,dif:2,d:'Selçuklu mirasının iddiacısı. Konya\'dan Osmanlı\'ya meydan okumak için Akkoyunlu ile ittifakın var.'},
 CAN:{n:'Candaroğulları',s:'Candar',c:'#c08a45',r:'İsmail Bey',rel:'İslam',cap:'kastamonu',m:1,dif:3,d:'Kastamonu ve Sinop\'tan ibaret, bakır madenleriyle zengin küçük bir beylik.'},
 DUL:{n:'Dulkadiroğulları',s:'Dulkadir',c:'#a69457',r:'Süleyman Bey',rel:'İslam',cap:'maras',m:1,dif:3,d:'Memlüklerin himayesinde, Toroslar\'da bir Türkmen beyliği.'},
 MAM:{n:'Memlük Sultanlığı',s:'Memlük',c:'#dcb54f',r:'Seyfeddin Çakmak',rel:'İslam',cap:'kahire',m:1.2,dif:1,d:'Kahire\'den Halep\'e uzanan kadim sultanlık. Nil\'in bereketiyle zengin, kuzey sınırı Türkmen beylikleriyle çevrili.'},
 AKK:{n:'Akkoyunlular',s:'Akkoyunlu',c:'#f1ece0',r:'Uzun Hasan',rel:'İslam',cap:'diyarbakir',m:1.1,dif:2,d:'Diyarbakır\'ın Ak Koyunlu Türkmenleri. Doğuda ezelî düşman Karakoyunlu, batıda yükselen Osmanlı.'},
 KKY:{n:'Karakoyunlular',s:'Karakoyunlu',c:'#2e2b2a',r:'Cihan Şah',rel:'İslam',cap:'tebriz',m:1.1,dif:1,d:'Cihan Şah\'ın Tebriz\'den Bağdat\'a uzanan geniş ama gevşek devleti. Akkoyunlu ile savaştasın.'},
 TRB:{n:'Trabzon İmparatorluğu',s:'Trabzon',c:'#c29ad0',r:'IV. Yuannis',rel:'Ortodoks',cap:'trabzon',m:1,dif:3,d:'Komnenos hanedanının son kalesi. Akkoyunlu ile akrabalık bağları var.'},
 GEO:{n:'Gürcü Krallığı',s:'Gürcistan',c:'#d9826b',r:'VIII. Giorgi',rel:'Ortodoks',cap:'tiflis',m:1,dif:2,d:'Kafkasya\'nın dağlık krallığı. Karakoyunlu akınları sınırları zorluyor.'},
 HAB:{n:'Avusturya Arşidüklüğü',s:'Avusturya',c:'#b9b2a4',r:'III. Friedrich',rel:'Katolik',cap:'viyana',m:1.1,dif:2,d:'Habsburg hanedanı Viyana\'dan Macar tacına göz dikmiş durumda.'},
 POL:{n:'Lehistan-Litvanya',s:'Lehistan',c:'#b2466e',r:'IV. Kazimierz',rel:'Katolik',cap:'kamanice',m:1.1,dif:2,d:'Kuzeyin büyük birliğinin güney sınırları. Boğdan ile dost, Karadeniz\'e inmek istiyor.'},
 GH:{n:'Büyük Orda',s:'Büyük Orda',c:'#8d6f2a',r:'Seyyid Ahmed',rel:'İslam',cap:'azak',m:1.1,dif:2,d:'Altın Orda\'nın dağılan mirası. Bozkırın atlıları Kırım\'ı geri istiyor.'},
 ARA:{n:'Napoli Krallığı',s:'Napoli',c:'#d9772f',r:'V. Alfonso',rel:'Katolik',cap:'napoli',m:1.1,dif:2,d:'Aragonlu Alfonso Güney İtalya ve Sicilya\'yı birleştirdi. Otranto\'dan Arnavut kıyıları görünüyor.'},
 PAP:{n:'Papalık Devleti',s:'Papalık',c:'#efe0a1',r:'V. Nikolaus',rel:'Katolik',cap:'roma',m:1,dif:2,d:'Roma\'nın efendisi. Haçlı seferi çağrıları sende başlar.'},
 CYP:{n:'Kıbrıs Krallığı',s:'Kıbrıs',c:'#8fbf6a',r:'II. Jean',rel:'Katolik',cap:'kibris',m:1,dif:3,d:'Lüzinyan hanedanının ada krallığı. Magosa Cenevizlilerin elinde.'},
 RHO:{n:'Rodos Şövalyeleri',s:'Rodos',c:'#6b1f2a',r:'Jean de Lastic',rel:'Katolik',cap:'rodos',m:1.3,dif:3,d:'Hospitalier şövalyelerinin kale adası. Sayıca az, surları çok güçlü.'},
 HAF:{n:'Hafsîler',s:'Hafsî',c:'#a7b86a',r:'Ebû Amr Osman',rel:'İslam',cap:'trablusgarp',m:1,dif:3,d:'Tunus merkezli hanedanın doğu uç beyliği Trablusgarp.'},
 SAF:{n:'Safevîler',s:'Safevî',c:'#1d7a52',r:'Şah İsmail',rel:'İslam',cap:'tebriz',m:1.2,dif:9,d:''},
 CLM:{n:'Taht Davacıları',s:'Davacı',c:'#5a4f46',r:'Taht davacısı',rel:'İslam',cap:'edirne',m:1,dif:9,d:''}
};
/** English realm texts (n long name, s short name, r ruler at start, d description); merged into FAC when EN. */
const FAC_EN={
 OSM:{n:'Ottoman Empire',s:'Ottomans',r:'Mehmed II',d:'The young Sultan Mehmed II has taken the throne. Only one obstacle still stands between Rumelia and Anatolia: the walls of Constantinople. Karaman watches for its chance in the west, and the Hungarians wait along the Danube.'},
 BYZ:{n:'Byzantine Empire',s:'Byzantium',r:'Constantine XI',d:'Of a thousand-year empire, one city and the Morea remain. Hold the Theodosian Walls, keep your alliance with Venice and win back the lost lands.'},
 VEN:{n:'Republic of Venice',s:'Venice',r:'Francesco Foscari',d:'The merchant republic of the Adriatic and the Aegean. Its fortresses and islands are rich but scattered. The sea lanes carry you from Crete to the Morea.'},
 HUN:{n:'Kingdom of Hungary',s:'Hungary',r:'John Hunyadi',d:'The wound of Varna is still fresh. John Hunyadi is the shield of Christendom along the Danube, and the fortress of Belgrade is the gate to the realm.'},
 SRB:{n:'Serbian Despotate',s:'Serbia',r:'Đurađ Branković',d:'A despotate rich in silver mines, but squeezed between two great powers. The fortress of Smederevo is its last refuge.'},
 BOS:{n:'Kingdom of Bosnia',s:'Bosnia',r:'Stjepan Tomaš',d:'A mountainous, divided kingdom. Without Hungarian help it will struggle to stand.'},
 WAL:{n:'Principality of Wallachia',s:'Wallachia',r:'Vladislav II',d:'A principality north of the Danube that keeps the balance between Hungary and the Ottomans.'},
 MOL:{n:'Principality of Moldavia',s:'Moldavia',r:'Alexăndrel',d:'The ports of Cetatea Albă and Kilia are the keys to the Black Sea trade. Poland lies to the north, the steppe to the east.'},
 ALB:{n:'League of Lezhë',s:'Albania',r:'Skanderbeg',d:'Skanderbeg holds out in the mountains and is at war with the Ottomans. As long as Krujë stands, Albania is unbeaten.'},
 KRM:{n:'Crimean Khanate',s:'Crimea',r:'Haji I Giray',d:'A young khanate newly broken away from the Golden Horde. You are at war with the Great Horde, and the Genoese of Caffa are your neighbours.'},
 GEN:{n:'Republic of Genoa',s:'Genoa',r:'Pietro Fregoso',d:'Trading colonies that stretch from Caffa to Chios. The fortresses are strong, but the lands lie far apart.'},
 KAR:{n:'Karamanids',s:'Karaman',r:'Ibrahim Bey',d:'Claimant to the Seljuk legacy. From Konya you defy the Ottomans, with the Aq Qoyunlu as your allies.'},
 CAN:{n:'Jandarids',s:'Jandar',r:'Ismail Bey',d:'A small beylik of Kastamonu and Sinope, rich in copper mines.'},
 DUL:{n:'Dulkadirids',s:'Dulkadir',r:'Suleiman Bey',d:'A Turkmen beylik in the Taurus Mountains, under Mamluk protection.'},
 MAM:{n:'Mamluk Sultanate',s:'Mamluks',r:'Sayf al-Din Jaqmaq',d:'An ancient sultanate that stretches from Cairo to Aleppo. The bounty of the Nile makes it rich, and Turkmen beyliks line its northern border.'},
 AKK:{n:'Aq Qoyunlu',s:'Aq Qoyunlu',r:'Uzun Hasan',d:'The White Sheep Turkmens of Diyarbakir. To the east lies the old enemy, the Qara Qoyunlu; to the west, the rising Ottomans.'},
 KKY:{n:'Qara Qoyunlu',s:'Qara Qoyunlu',r:'Jahan Shah',d:'Jahan Shah rules a broad but loose realm from Tabriz to Baghdad. You are at war with the Aq Qoyunlu.'},
 TRB:{n:'Empire of Trebizond',s:'Trebizond',r:'John IV',d:'The last stronghold of the Komnenos dynasty. It is bound to the Aq Qoyunlu by marriage.'},
 GEO:{n:'Kingdom of Georgia',s:'Georgia',r:'George VIII',d:'The mountain kingdom of the Caucasus. Qara Qoyunlu raids press hard on its borders.'},
 HAB:{n:'Archduchy of Austria',s:'Austria',r:'Frederick III',d:'From Vienna, the House of Habsburg has set its eyes on the Hungarian crown.'},
 POL:{n:'Poland-Lithuania',s:'Poland',r:'Casimir IV',d:'The southern marches of the great union of the north. A friend of Moldavia, eager to reach the Black Sea.'},
 GH:{n:'Great Horde',s:'Great Horde',r:'Sayyid Ahmad',d:'The crumbling legacy of the Golden Horde. The riders of the steppe want Crimea back.'},
 ARA:{n:'Kingdom of Naples',s:'Naples',r:'Alfonso V',d:'Alfonso of Aragon has united southern Italy and Sicily. From Otranto the Albanian coast is in sight.'},
 PAP:{n:'Papal States',s:'Papacy',r:'Nicholas V',d:'The master of Rome. Every call for a crusade begins with you.'},
 CYP:{n:'Kingdom of Cyprus',s:'Cyprus',r:'John II',d:'The island kingdom of the Lusignan dynasty. Famagusta is in Genoese hands.'},
 RHO:{n:'Knights of Rhodes',s:'Rhodes',r:'Jean de Lastic',d:'The island fortress of the Knights Hospitaller. Few in number, but their walls are very strong.'},
 HAF:{n:'Hafsids',s:'Hafsids',r:'Abu Amr Uthman',d:'Tripoli, the eastern march of the dynasty that rules from Tunis.'},
 SAF:{n:'Safavids',s:'Safavids',r:'Shah Ismail',d:''},
 CLM:{n:'The Pretenders',s:'Pretender',r:'Pretender',d:''}
};
if(EN)for(const f in FAC_EN)Object.assign(FAC[f],FAC_EN[f]);
/** FAC[f].rel stays the Turkish key ('İslam', 'Ortodoks', 'Katolik') that game logic compares; show it with relName(f). */
const REL_EN={'İslam':'Islam','Ortodoks':'Orthodox','Katolik':'Catholic'};
function relName(f){const r=FAC[f]?FAC[f].rel:'';return EN&&REL_EN[r]||r;}
const PROVS=[
 // Osmanlı
 ['edirne','Edirne',26.55,41.68,'OSM',7,2],['gelibolu','Gelibolu',26.67,40.41,'OSM',3,2],['tekfurdagi','Tekfurdağı',27.5,40.98,'OSM',3,0],
 ['kirkkilise','Kırkkilise',27.22,41.73,'OSM',3,0],['filibe','Filibe',24.75,42.15,'OSM',5,1],['sofya','Sofya',23.32,42.7,'OSM',5,1],
 ['tirnova','Tırnova',25.62,43.08,'OSM',4,1],['sumnu','Şumnu',26.93,43.27,'OSM',3,0],['varna','Varna',27.9,43.2,'OSM',4,1],
 ['silistre','Silistre',27.26,44.12,'OSM',3,1],['dobruca','Dobruca',28.55,44.35,'OSM',2,0],['nigbolu','Niğbolu',24.9,43.7,'OSM',3,1],
 ['vidin','Vidin',22.88,43.99,'OSM',3,2],['kostendil','Köstendil',22.69,42.28,'OSM',3,0],['uskup','Üsküp',21.43,42.0,'OSM',4,1],
 ['selanik','Selanik',22.94,40.64,'OSM',6,2],['serez','Serez',23.55,41.09,'OSM',4,0],['drama','Drama',24.3,41.2,'OSM',2,0],
 ['gumulcine','Gümülcine',25.4,41.12,'OSM',3,0],['manastir','Manastır',21.33,41.03,'OSM',3,0],['ohri','Ohri',20.8,41.12,'OSM',2,1],
 ['avlonya','Avlonya',19.49,40.47,'OSM',3,1],['yanya','Yanya',20.85,39.67,'OSM',3,1],['tesalya','Tesalya',22.1,39.55,'OSM',4,0],
 ['izdin','İzdin',22.43,38.9,'OSM',2,0],['atina','Atina',23.73,37.98,'OSM',4,1],['bursa','Bursa',29.06,40.19,'OSM',6,1],
 ['izmit','İzmit',29.92,40.77,'OSM',3,0],['biga','Biga',26.9,40.05,'OSM',2,0],['karesi','Karesi',27.88,39.65,'OSM',3,0],
 ['saruhan','Saruhan',27.43,38.61,'OSM',3,0],['izmir','İzmir',27.14,38.42,'OSM',4,1],['aydin','Aydın',27.84,37.85,'OSM',3,0],
 ['mentese','Menteşe',28.36,37.21,'OSM',2,0],['teke','Teke',30.71,36.89,'OSM',3,1],['hamid','Hamid',30.55,37.76,'OSM',2,0],
 ['kutahya','Kütahya',29.98,39.42,'OSM',3,1],['karahisar','Karahisar',30.54,38.76,'OSM',3,0],['sultanonu','Sultanönü',30.52,39.78,'OSM',2,0],
 ['bolu','Bolu',31.6,40.73,'OSM',2,0],['ankara','Ankara',32.86,39.93,'OSM',4,1],['cankiri','Çankırı',33.6,40.6,'OSM',2,0],
 ['corum','Çorum',34.95,40.55,'OSM',2,0],['amasya','Amasya',35.83,40.65,'OSM',4,1],['canik','Canik',36.33,41.29,'OSM',2,0],
 ['tokat','Tokat',36.55,40.31,'OSM',3,0],['sivas','Sivas',37.02,39.75,'OSM',3,1],['bozok','Bozok',34.8,39.8,'OSM',2,0],
 ['kirsehir','Kırşehir',34.16,39.15,'OSM',2,0],
 // Bizans
 ['istanbul','Konstantiniyye',28.97,41.01,'BYZ',9,4],['silivri','Silivri',28.25,41.07,'BYZ',1,1],['misivri','Misivri',27.73,42.66,'BYZ',1,1],
 ['mistra','Mistra',22.37,37.07,'BYZ',3,2],['balyabadra','Balyabadra',21.73,38.25,'BYZ',2,1],['korint','Korint',22.93,37.94,'BYZ',2,2],
 // Candar, Ceneviz
 ['kastamonu','Kastamonu',33.78,41.38,'CAN',3,1],['sinop','Sinop',35.15,42.02,'CAN',3,1],
 ['kefe','Kefe',35.38,45.03,'GEN',4,2],['amasra','Amasra',32.38,41.75,'GEN',1,1],['sakiz','Sakız',26.0,38.37,'GEN',2,1],
 ['midilli','Midilli',26.3,39.15,'GEN',2,1],['magosa','Magosa',33.94,35.12,'GEN',2,2],
 // Karaman, Dulkadir
 ['konya','Konya',32.49,37.87,'KAR',5,2],['karaman','Larende',33.22,37.18,'KAR',3,1],['aksaray','Aksaray',34.03,38.37,'KAR',2,0],
 ['nigde','Niğde',34.68,37.97,'KAR',2,1],['kayseri','Kayseri',35.49,38.72,'KAR',4,1],['beysehir','Beyşehir',31.72,37.68,'KAR',2,0],
 ['alaiye','Alaiye',32.0,36.55,'KAR',2,1],['icel','İçel',33.93,36.38,'KAR',2,1],
 ['maras','Maraş',36.94,37.58,'DUL',3,1],['elbistan','Elbistan',37.19,38.2,'DUL',2,0],['divrigi','Divriği',38.12,39.37,'DUL',1,1],
 // Memlük
 ['kahire','Kahire',31.24,30.04,'MAM',9,2],['iskenderiye','İskenderiye',29.92,31.2,'MAM',6,2],['dimyat','Dimyat',31.81,31.42,'MAM',4,1],
 ['behire','Buhayra',30.47,30.93,'MAM',3,0],['sarkiye','Şarkiye',31.5,30.6,'MAM',3,0],['feyyum','Feyyum',30.84,29.31,'MAM',3,0],
 ['suveys','Süveyş',32.55,29.97,'MAM',1,0,'d'],['aris','Ariş',33.8,31.13,'MAM',1,0,'d'],['gazze','Gazze',34.46,31.5,'MAM',3,0],
 ['kudus','Kudüs',35.22,31.78,'MAM',4,1],['kerek','Kerek',35.7,31.18,'MAM',1,1,'d'],['safed','Safed',35.3,32.95,'MAM',3,1],
 ['havran','Havran',36.48,32.52,'MAM',2,0],['sam','Şam',36.29,33.51,'MAM',7,2],['beyrut','Beyrut',35.5,33.89,'MAM',3,0],
 ['trablus','Trablusşam',35.84,34.44,'MAM',3,1],['humus','Humus',36.72,34.73,'MAM',3,0],['hama','Hama',36.75,35.13,'MAM',3,0],
 ['halep','Halep',37.16,36.2,'MAM',6,2],['antakya','Antakya',36.16,36.2,'MAM',3,1],['ayntab','Ayıntab',37.38,37.06,'MAM',2,0],
 ['adana','Adana',35.32,37.0,'MAM',4,1],['malatya','Malatya',38.31,38.35,'MAM',3,1],['rakka','Rakka',39.01,35.95,'MAM',2,0],
 ['rahbe','Rahbe',40.14,35.33,'MAM',1,0,'d'],['tedmur','Tedmür',38.27,34.55,'MAM',1,0,'d'],['barka','Bingazi',20.07,32.12,'MAM',2,0],
 ['derne','Derne',22.64,32.77,'MAM',1,0],['tobruk','Tobruk',23.95,32.07,'MAM',1,0,'d'],['matruh','Matruh',27.25,31.35,'MAM',1,0,'d'],
 // Akkoyunlu
 ['diyarbakir','Diyarbakır',40.22,37.91,'AKK',5,2],['mardin','Mardin',40.74,37.31,'AKK',3,2],['urfa','Ruha',38.79,37.16,'AKK',3,1],
 ['harput','Harput',39.22,38.7,'AKK',2,1],['erzincan','Erzincan',39.49,39.75,'AKK',2,0],['bayburt','Bayburt',40.23,40.26,'AKK',1,1],
 ['hasankeyf','Hasankeyf',41.41,37.71,'AKK',2,0],['cizre','Cizre',42.19,37.33,'AKK',2,0],['sebinkarahisar','Şebinkarahisar',38.42,40.29,'AKK',1,1],
 // Karakoyunlu
 ['tebriz','Tebriz',46.29,38.08,'KKY',7,2],['meraga','Merağa',46.24,37.39,'KKY',2,0],['urmiye','Urmiye',45.07,37.55,'KKY',2,0],
 ['hoy','Hoy',44.95,38.55,'KKY',2,0],['nahcivan','Nahçıvan',45.41,39.21,'KKY',2,0],['revan','Revan',44.51,40.18,'KKY',3,1],
 ['karabag','Karabağ',46.75,39.8,'KKY',2,0],['gence','Gence',46.36,40.68,'KKY',2,0],['sirvan','Şirvan',47.6,40.9,'KKY',3,1],
 ['derbent','Derbent',47.9,42.2,'KKY',2,2],['kars','Kars',43.1,40.6,'KKY',2,1],['erzurum','Erzurum',41.27,39.9,'KKY',3,1],
 ['van','Van',43.38,38.5,'KKY',3,1],['bitlis','Bitlis',42.11,38.4,'KKY',2,1],['musul','Musul',43.13,36.34,'KKY',4,1],
 ['erbil','Erbil',44.01,36.19,'KKY',2,0],['kerkuk','Kerkük',44.39,35.47,'KKY',2,0],['sehrizor','Şehrizor',45.5,35.55,'KKY',2,0],
 ['tikrit','Tikrit',43.68,34.6,'KKY',1,0],['bagdat','Bağdat',44.36,33.31,'KKY',6,2],['hille','Hille',44.42,32.48,'KKY',3,0],
 ['vasit','Vâsıt',45.8,32.5,'KKY',2,0],['basra','Basra',47.78,30.51,'KKY',3,1],['ane','Âne',41.95,34.37,'KKY',1,0,'d'],
 ['erdelan','Erdelan',47.0,35.31,'KKY',2,0],['kirmansah','Kirmanşah',47.07,34.31,'KKY',2,0],
 // Trabzon, Gürcü
 ['trabzon','Trabzon',39.72,41.0,'TRB',4,2],['kerasunt','Kerasunt',38.39,40.91,'TRB',2,1],
 ['tiflis','Tiflis',44.79,41.72,'GEO',4,1],['kutais','Kutais',42.7,42.27,'GEO',3,1],['ahiska','Ahıska',42.98,41.64,'GEO',2,1],
 ['abhazya','Abhazya',41.0,43.0,'GEO',2,0],['kaheti','Kaheti',45.9,41.9,'GEO',2,0],['guriya','Guriya',41.9,41.95,'GEO',1,0],
 // Büyük Orda, Kırım
 ['azak','Azak',39.42,47.1,'GH',2,1],['kuban','Kuban',38.97,45.04,'GH',2,0],['kipcak','Kıpçak',35.5,47.6,'GH',1,0],
 ['don','Don Boyu',41.9,47.9,'GH',1,0],['manic','Manıç',43.2,46.3,'GH',1,0],['kabartay','Kabartay',43.6,43.5,'GH',1,0],
 ['cerkes','Çerkes',39.9,44.3,'GH',1,0],['dagistan','Dağıstan',46.9,42.8,'GH',1,0],['terek','Terek',45.6,44.2,'GH',1,0],
 ['bahcesaray','Bahçesaray',33.86,44.75,'KRM',3,1],['or','Or Kapı',33.7,46.15,'KRM',2,1],['gozleve','Gözleve',33.36,45.2,'KRM',2,0],
 // Lehistan, Boğdan, Eflak
 ['kamanice','Kamaniçe',26.58,48.68,'POL',3,2],['braslav','Braslav',28.93,48.82,'POL',2,1],['umani','Umani',30.4,48.6,'POL',1,0],
 ['ozi','Özi',31.55,46.62,'POL',1,1],['halic','Haliç',24.7,48.95,'POL',2,1],
 ['sucava','Suçava',26.25,47.65,'MOL',4,2],['yas','Yaş',27.6,47.16,'MOL',3,0],['akkerman','Akkerman',30.35,46.2,'MOL',3,2],
 ['kili','Kili',29.26,45.43,'MOL',2,1],['bender','Bender',29.47,46.83,'MOL',1,1],['bakau','Bakau',26.9,46.57,'MOL',2,0],
 ['tergoviste','Tergovişte',25.46,44.93,'WAL',4,1],['kraiova','Kraiova',23.8,44.32,'WAL',3,0],['ibrail','İbrail',27.96,45.27,'WAL',2,1],
 ['buzau','Buzău',26.82,45.15,'WAL',2,0],
 // Macar
 ['budin','Budin',19.04,47.5,'HUN',8,2],['istolni','İstolni Belgrad',18.41,47.19,'HUN',3,1],['yanik','Yanık',17.63,47.68,'HUN',3,1],
 ['pojon','Pojon',17.1,48.15,'HUN',4,1],['uyvar','Uyvar',18.16,47.99,'HUN',2,1],['egri','Eğri',20.38,47.9,'HUN',3,1],
 ['kassa','Kassa',21.26,48.72,'HUN',3,1],['segedin','Segedin',20.15,46.25,'HUN',4,0],['solnok','Solnok',20.2,47.18,'HUN',2,0],
 ['pecuy','Peçuy',18.23,46.07,'HUN',3,0],['kanije','Kanije',16.99,46.46,'HUN',2,1],['zagrep','Zağrep',15.97,45.8,'HUN',3,1],
 ['bihac','Bihaç',15.87,44.81,'HUN',2,1],['pojega','Pojega',17.68,45.33,'HUN',3,0],['belgrad','Belgrad',20.46,44.82,'HUN',4,3],
 ['temesvar','Temeşvar',21.23,45.75,'HUN',4,2],['severin','Severin',22.66,44.63,'HUN',2,1],['varad','Varad',21.93,47.06,'HUN',3,1],
 ['kolojvar','Kolojvar',23.6,46.77,'HUN',4,1],['sibin','Sibin',24.15,45.8,'HUN',3,2],['brasov','Braşov',25.6,45.65,'HUN',3,1],
 ['maramures','Maramureş',24.0,47.7,'HUN',1,0],['sekel','Sekel',25.5,46.4,'HUN',2,0],
 // Avusturya, Venedik
 ['viyana','Viyana',16.37,48.21,'HAB',6,2],['graz','Graz',15.44,47.07,'HAB',3,1],['linz','Linz',14.29,48.31,'HAB',3,1],
 ['salzburg','Salzburg',13.04,47.8,'HAB',3,1],['karintiya','Karintiya',14.3,46.62,'HAB',2,0],['lubliyana','Lubliyana',14.5,46.05,'HAB',2,0],
 ['triyeste','Triyeste',13.77,45.65,'HAB',2,1],
 ['venedik','Venedik',12.12,45.47,'VEN',8,2],['friuli','Friuli',13.23,46.06,'VEN',3,1],['ravenna','Ravenna',12.2,44.42,'VEN',2,1],
 ['istriya','İstriya',13.85,45.1,'VEN',2,0],['zadar','Zadar',15.23,44.12,'VEN',3,1],['split','Split',16.44,43.51,'VEN',2,1],
 ['raguza','Raguza',18.1,42.65,'VEN',3,2],['kotor','Kotor',18.77,42.42,'VEN',2,1],['iskodra','İşkodra',19.51,42.07,'VEN',2,2],
 ['drac','Dıraç',19.45,41.32,'VEN',2,1],['korfu','Korfu',19.92,39.62,'VEN',2,2],['moton','Moton',21.7,36.9,'VEN',2,2],
 ['anabolu','Anabolu',22.8,37.57,'VEN',2,2],['egriboz','Eğriboz',23.85,38.6,'VEN',3,2],['kandiye','Kandiye',25.13,35.3,'VEN',4,2],
 ['hanya','Hanya',24.02,35.45,'VEN',2,1],
 // Arnavut, Sırp, Bosna
 ['kroya','Kroya',19.8,41.51,'ALB',2,3],['debre','Debre',20.45,41.6,'ALB',1,1],['les','Leş',19.64,41.78,'ALB',1,1],
 ['semendire','Semendire',20.93,44.66,'SRB',4,3],['rudnik','Rudnik',20.5,44.13,'SRB',2,0],['krusevac','Kruşevaç',21.33,43.58,'SRB',3,1],
 ['nis','Niş',21.9,43.32,'SRB',3,1],['novobirda','Novobırda',21.43,42.6,'SRB',3,1],['prizren','Prizren',20.74,42.21,'SRB',2,1],
 ['yenipazar','Yenipazar',20.51,43.14,'SRB',2,0],['zeta','Zeta',19.26,42.44,'SRB',2,1],
 ['yayce','Yayçe',17.27,44.34,'BOS',3,2],['hersek','Hersek',17.81,43.34,'BOS',3,1],['vrhbosna','Vrhbosna',18.41,43.86,'BOS',2,0],
 ['srebrenice','Srebrenice',19.3,44.1,'BOS',2,1],['usora','Usora',18.67,44.54,'BOS',2,0],
 // İtalya, adalar, Kuzey Afrika
 ['napoli','Napoli',14.25,40.85,'ARA',7,2],['kapitanata','Kapitanata',15.55,41.46,'ARA',2,0],['bari','Bari',16.87,41.12,'ARA',3,1],
 ['otranto','Otranto',18.17,40.35,'ARA',3,1],['basilikata','Basilikata',15.8,40.64,'ARA',1,0],['kalabriya','Kalabriya',16.25,39.3,'ARA',2,0],
 ['abruzzo','Abruzzo',13.4,42.35,'ARA',2,1],['palermo','Palermo',13.36,37.9,'ARA',4,1],['katanya','Katanya',14.9,37.5,'ARA',3,1],
 ['roma','Roma',12.5,41.9,'PAP',6,2],['ankona','Ankona',13.51,43.62,'PAP',3,1],['umbriya','Umbriya',12.74,42.73,'PAP',2,0],
 ['rimini','Rimini',12.57,44.06,'PAP',2,1],
 ['kibris','Lefkoşa',33.2,35.05,'CYP',3,2],['rodos','Rodos',28.0,36.2,'RHO',2,3],['bodrum','Bodrum',27.43,37.03,'RHO',1,2],
 ['trablusgarp','Trablusgarp',13.19,32.89,'HAF',3,1],['misrata','Misrata',15.1,32.38,'HAF',1,0],['sirt','Sirt',16.59,31.2,'HAF',1,0,'d']
];
const LANES=[['istanbul','izmit'],['gelibolu','biga'],['palermo','kalabriya'],['katanya','kalabriya'],['hanya','mistra'],['kandiye','rodos'],
 ['rodos','mentese'],['rodos','bodrum'],['kibris','icel'],['magosa','trablus'],['midilli','karesi'],['sakiz','izmir'],['korfu','yanya'],['korfu','avlonya'],
 ['egriboz','atina'],['egriboz','izdin'],['otranto','avlonya'],['bari','drac'],['kefe','kuban'],['ankona','zadar'],['silivri','istanbul']];

/** English province names by key, used when EN (PD[i].name). Turkish names stay the reference for tests. */
const PROV_EN={
 edirne:'Adrianople',gelibolu:'Gallipoli',tekfurdagi:'Rodosto',kirkkilise:'Kirk Kilisse',filibe:'Philippopolis',sofya:'Sofia',
 tirnova:'Tarnovo',sumnu:'Shumen',varna:'Varna',silistre:'Silistra',dobruca:'Dobruja',nigbolu:'Nicopolis',
 vidin:'Vidin',kostendil:'Kyustendil',uskup:'Skopje',selanik:'Thessalonica',serez:'Serres',drama:'Drama',
 gumulcine:'Komotini',manastir:'Monastir',ohri:'Ohrid',avlonya:'Valona',yanya:'Ioannina',tesalya:'Thessaly',
 izdin:'Lamia',atina:'Athens',bursa:'Bursa',izmit:'Nicomedia',biga:'Biga',karesi:'Karasi',
 saruhan:'Saruhan',izmir:'Smyrna',aydin:'Aydin',mentese:'Menteshe',teke:'Teke',hamid:'Hamid',
 kutahya:'Kutahya',karahisar:'Karahisar',sultanonu:'Sultanonu',bolu:'Bolu',ankara:'Ankara',cankiri:'Cankiri',
 corum:'Corum',amasya:'Amasya',canik:'Canik',tokat:'Tokat',sivas:'Sivas',bozok:'Bozok',kirsehir:'Kirsehir',
 istanbul:'Constantinople',silivri:'Selymbria',misivri:'Mesembria',mistra:'Mystras',balyabadra:'Patras',korint:'Corinth',
 kastamonu:'Kastamonu',sinop:'Sinope',kefe:'Caffa',amasra:'Amastris',sakiz:'Chios',midilli:'Lesbos',magosa:'Famagusta',
 konya:'Konya',karaman:'Larende',aksaray:'Aksaray',nigde:'Nigde',kayseri:'Kayseri',beysehir:'Beysehir',alaiye:'Alanya',icel:'Icel',
 maras:'Marash',elbistan:'Elbistan',divrigi:'Divrigi',
 kahire:'Cairo',iskenderiye:'Alexandria',dimyat:'Damietta',behire:'Buhayra',sarkiye:'Sharqiya',feyyum:'Faiyum',
 suveys:'Suez',aris:'Arish',gazze:'Gaza',kudus:'Jerusalem',kerek:'Kerak',safed:'Safed',havran:'Hauran',sam:'Damascus',
 beyrut:'Beirut',trablus:'Tripoli',humus:'Homs',hama:'Hama',halep:'Aleppo',antakya:'Antioch',ayntab:'Aintab',
 adana:'Adana',malatya:'Malatya',rakka:'Raqqa',rahbe:'Rahba',tedmur:'Palmyra',barka:'Benghazi',
 derne:'Derna',tobruk:'Tobruk',matruh:'Matruh',
 diyarbakir:'Diyarbakir',mardin:'Mardin',urfa:'Edessa',harput:'Harput',erzincan:'Erzincan',bayburt:'Bayburt',
 hasankeyf:'Hasankeyf',cizre:'Cizre',sebinkarahisar:'Sebinkarahisar',
 tebriz:'Tabriz',meraga:'Maragheh',urmiye:'Urmia',hoy:'Khoy',nahcivan:'Nakhchivan',revan:'Erivan',karabag:'Karabakh',
 gence:'Ganja',sirvan:'Shirvan',derbent:'Derbent',kars:'Kars',erzurum:'Erzurum',van:'Van',bitlis:'Bitlis',musul:'Mosul',
 erbil:'Erbil',kerkuk:'Kirkuk',sehrizor:'Shahrizor',tikrit:'Tikrit',bagdat:'Baghdad',hille:'Hillah',vasit:'Wasit',
 basra:'Basra',ane:'Anah',erdelan:'Ardalan',kirmansah:'Kermanshah',
 trabzon:'Trebizond',kerasunt:'Kerasous',tiflis:'Tiflis',kutais:'Kutaisi',ahiska:'Akhaltsikhe',abhazya:'Abkhazia',
 kaheti:'Kakheti',guriya:'Guria',
 azak:'Azov',kuban:'Kuban',kipcak:'Kipchak',don:'Don',manic:'Manych',kabartay:'Kabarda',cerkes:'Circassia',
 dagistan:'Dagestan',terek:'Terek',bahcesaray:'Bakhchisaray',or:'Perekop',gozleve:'Eupatoria',
 kamanice:'Kamianets',braslav:'Bratslav',umani:'Uman',ozi:'Ochakov',halic:'Halych',
 sucava:'Suceava',yas:'Iași',akkerman:'Cetatea Albă',kili:'Kilia',bender:'Bender',bakau:'Bacău',
 tergoviste:'Târgoviște',kraiova:'Craiova',ibrail:'Brăila',buzau:'Buzău',
 budin:'Buda',istolni:'Székesfehérvár',yanik:'Győr',pojon:'Pressburg',uyvar:'Érsekújvár',egri:'Eger',
 kassa:'Kassa',segedin:'Szeged',solnok:'Szolnok',pecuy:'Pécs',kanije:'Kanizsa',zagrep:'Zagreb',
 bihac:'Bihać',pojega:'Požega',belgrad:'Belgrade',temesvar:'Temesvár',severin:'Severin',varad:'Várad',
 kolojvar:'Kolozsvár',sibin:'Hermannstadt',brasov:'Kronstadt',maramures:'Máramaros',sekel:'Székely Land',
 viyana:'Vienna',graz:'Graz',linz:'Linz',salzburg:'Salzburg',karintiya:'Carinthia',lubliyana:'Ljubljana',triyeste:'Trieste',
 venedik:'Venice',friuli:'Friuli',ravenna:'Ravenna',istriya:'Istria',zadar:'Zara',split:'Spalato',
 raguza:'Ragusa',kotor:'Cattaro',iskodra:'Scutari',drac:'Durazzo',korfu:'Corfu',moton:'Modon',
 anabolu:'Nauplia',egriboz:'Negroponte',kandiye:'Candia',hanya:'Canea',
 kroya:'Krujë',debre:'Dibër',les:'Lezhë',
 semendire:'Smederevo',rudnik:'Rudnik',krusevac:'Kruševac',nis:'Niš',novobirda:'Novo Brdo',prizren:'Prizren',
 yenipazar:'Novi Pazar',zeta:'Zeta',
 yayce:'Jajce',hersek:'Herzegovina',vrhbosna:'Vrhbosna',srebrenice:'Srebrenica',usora:'Usora',
 napoli:'Naples',kapitanata:'Capitanata',bari:'Bari',otranto:'Otranto',basilikata:'Basilicata',kalabriya:'Calabria',
 abruzzo:'Abruzzo',palermo:'Palermo',katanya:'Catania',
 roma:'Rome',ankona:'Ancona',umbriya:'Umbria',rimini:'Rimini',
 kibris:'Nicosia',rodos:'Rhodes',bodrum:'Bodrum',
 trablusgarp:'Tripolitania',misrata:'Misrata',sirt:'Sirte'
};
const PD=PROVS.map((a,i)=>({i,key:a[0],name:EN&&PROV_EN[a[0]]||a[1],lon:a[2],lat:a[3],o:a[4],dev:a[5],fort:a[6],des:a[7]==='d',adj:[],lanes:[]}));
const NP=PD.length;
const PK={};PD.forEach(d=>PK[d.key]=d.i);
const FK=Object.keys(FAC);
/* ---------------- heraldry ---------------- */
const SHP='M5 5H95V58C95 88 72 106 50 116C28 106 5 88 5 58Z';
const ARMS={OSM:['#b3261e','crescent','#f4efe3'],BYZ:['#5b2166','tetra','#e6b53c'],VEN:['#a8201a','lion','#e6b53c'],HUN:['#b3261e','patri','#f4efe3'],
 SRB:['#b3261e','eagle2','#f4efe3'],BOS:['#1f3f8f','fleur','#e6b53c'],WAL:['#2a5aa6','eagle','#e6b53c'],MOL:['#9b1e1e','bull','#e6b53c'],
 ALB:['#b3221c','eagle2','#16110c'],KRM:['#2a6f8a','tamga','#e6b53c'],GEN:['#f4efe3','cross','#b3261e'],KAR:['#e9dfc6','star6','#2b4c8c'],
 CAN:['#b07a2e','star8','#3a2412'],DUL:['#6d7a3a','crescent','#f4efe3'],MAM:['#d9ad2a','crescent','#8e1a12'],AKK:['#6d9ec7','sheep','#f7f3ea'],
 KKY:['#d8cdb4','sheep','#1a1612'],TRB:['#7d2a6e','eagle','#e6b53c'],GEO:['#f4efe3','georgian','#b3261e'],HAB:['#b3261e','fess','#f4efe3'],
 POL:['#b3261e','eagle','#f4efe3'],GH:['#b8913a','tamga','#2a1a0c'],ARA:['#e6b53c','pallets','#b3261e'],PAP:['#b3261e','keys','#e6b53c'],
 CYP:['#f4efe3','cyp','#2b5aa0'],RHO:['#b3261e','cross','#f4efe3'],HAF:['#5e7a36','crescent','#f4efe3'],SAF:['#1d7a52','sun','#e6b53c'],CLM:['#3a3330','star6','#c9a24a']};
const starPts=(cx,cy,R,r,n)=>{let s='';for(let k=0;k<n*2;k++){const a=k*Math.PI/n-Math.PI/2,q=k%2?r:R;s+=`${(cx+Math.cos(a)*q).toFixed(1)},${(cy+Math.sin(a)*q).toFixed(1)} `;}return s;};
const EAG='M50 40L30 30L10 24L15 34L8 40L17 46L10 54L23 56L18 64L35 62L43 70L39 90L46 100L50 94L54 100L61 90L57 70L65 62L82 64L77 56L90 54L83 46L92 40L85 34L90 24L70 30Z';
const LION='M38 104L44 80L36 72L33 58L25 50L29 41L38 45L43 36L39 26L48 21L59 25L63 34L58 41L67 43L75 35L80 41L71 51L64 55L66 67L75 75L71 82L62 75L58 86L64 104L56 104L52 88L48 104Z';
const CH={
 crescent:(c,f)=>`<circle cx="44" cy="60" r="27"/><circle cx="54" cy="56" r="23" fill="${f}"/><polygon points="${starPts(75,58,11,4.6,5)}"/>`,
 cross:c=>`<rect x="40" y="0" width="20" height="120"/><rect x="0" y="44" width="100" height="20"/>`,
 patri:c=>`<path d="M16 120Q28 92 40 100Q50 86 60 100Q72 92 84 120Z" fill="#3c7a3a"/><rect x="45" y="16" width="10" height="80"/><rect x="31" y="32" width="38" height="9"/><rect x="23" y="52" width="54" height="9"/>`,
 tetra:c=>`<rect x="46" y="6" width="8" height="108"/><rect x="6" y="48" width="88" height="8"/>`+[[27,40,1],[73,40,-1],[27,88,1],[73,88,-1]].map(([x,y,s])=>`<text transform="translate(${x} ${y}) scale(${s} 1)" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="28">B</text>`).join(''),
 eagle:c=>`<path d="${EAG}"/><circle cx="50" cy="33" r="7.5"/><path d="M55 30L65 33L55 37Z"/><path d="M44 86L37 97M56 86L63 97" stroke="${c}" stroke-width="3.5"/>`,
 eagle2:c=>`<path d="${EAG}"/><path d="M44 42L40 32L47 33ZM56 42L60 32L53 33Z"/><circle cx="40" cy="29" r="6.5"/><path d="M35 27L25 30L35 33Z"/><circle cx="60" cy="29" r="6.5"/><path d="M65 27L75 30L65 33Z"/><path d="M44 86L37 97M56 86L63 97" stroke="${c}" stroke-width="3.5"/>`,
 lion:c=>`<path d="${LION}"/><path d="M66 67Q88 64 82 44Q90 60 74 74" fill="none" stroke="${c}" stroke-width="4"/>`,
 fleur:c=>`<g transform="translate(0 10)"><path d="M50 18C59 31 61 44 54 58H46C39 44 41 31 50 18ZM46 58C33 56 22 46 29 35C33 44 39 48 46 48ZM54 58C67 56 78 46 71 35C67 44 61 48 54 48Z"/><rect x="33" y="60" width="34" height="7"/><path d="M46 67C44 78 40 84 33 88C44 88 48 82 50 75C52 82 56 88 67 88C60 84 56 78 54 67Z"/></g>`,
 bull:c=>`<path d="M35 50Q50 43 65 50L63 76Q57 94 50 96Q43 94 37 76Z"/><path d="M35 50Q20 46 20 28Q28 42 40 44ZM65 50Q80 46 80 28Q72 42 60 44Z"/><polygon points="${starPts(50,30,8,3.4,5)}"/><circle cx="43" cy="62" r="3" fill="#2a1a0c"/><circle cx="57" cy="62" r="3" fill="#2a1a0c"/>`,
 tamga:c=>`<path d="M46 26H54V94H46ZM28 38H37V72Q37 80 46 80V89Q28 89 28 72ZM72 38H63V72Q63 80 54 80V89Q72 89 72 72Z"/>`,
 star6:c=>`<polygon points="50,24 80,76 20,76"/><polygon points="50,94 20,42 80,42"/>`,
 star8:c=>`<rect x="28" y="36" width="44" height="44"/><rect x="28" y="36" width="44" height="44" transform="rotate(45 50 58)"/>`,
 sheep:c=>`<ellipse cx="46" cy="66" rx="27" ry="16"/><circle cx="30" cy="54" r="7"/><circle cx="42" cy="50" r="8"/><circle cx="55" cy="51" r="7"/><ellipse cx="77" cy="55" rx="9" ry="7"/><path d="M73 49L69 42L78 47Z"/><rect x="28" y="76" width="5" height="19"/><rect x="38" y="78" width="5" height="17"/><rect x="52" y="78" width="5" height="17"/><rect x="62" y="76" width="5" height="19"/>`,
 georgian:c=>`<rect x="42" y="0" width="16" height="120"/><rect x="0" y="46" width="100" height="16"/>`+[[22,24],[78,24],[22,86],[78,86]].map(([x,y])=>`<rect x="${x-2}" y="${y-8}" width="4" height="16"/><rect x="${x-8}" y="${y-2}" width="16" height="4"/>`).join(''),
 fess:c=>`<rect x="0" y="44" width="100" height="28"/>`,
 pallets:c=>[12,32,52,72].map(x=>`<rect x="${x}" y="0" width="12" height="120"/>`).join(''),
 keys:c=>[-32,32].map(r=>`<g transform="rotate(${r} 50 60)"><circle cx="50" cy="26" r="9" fill="none" stroke="${c}" stroke-width="5"/><rect x="47.5" y="34" width="5" height="60"/><rect x="52" y="80" width="11" height="5"/><rect x="52" y="89" width="8" height="5"/></g>`).join(''),
 cyp:c=>[0,24,48,72,96].map(y=>`<rect x="0" y="${y}" width="100" height="12"/>`).join('')+`<path d="${LION}" fill="#b3261e"/>`,
 sun:c=>`<circle cx="50" cy="58" r="15"/>`+Array.from({length:16},(_,k)=>`<polygon points="50,24 54,40 46,40" transform="rotate(${k*22.5} 50 58)"/>`).join('')
};
function armsSVG(f){const [fld,ch,c]=ARMS[f]||['#888','cross','#fff'];
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120" aria-hidden="true"><defs><clipPath id="shc"><path d="${SHP}"/></clipPath><linearGradient id="shg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs><g clip-path="url(#shc)"><rect width="100" height="120" fill="${fld}"/><g fill="${c}">${CH[ch](c,fld)}</g><rect width="100" height="120" fill="url(#shg)"/></g><path d="${SHP}" fill="none" stroke="#2a1a0c" stroke-width="6"/><path d="${SHP}" fill="none" stroke="#d9b45a" stroke-width="2" transform="translate(50 60) scale(.9) translate(-50 -60)"/></svg>`;}
const ARMSIMG={};FK.forEach(f=>{const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(armsSVG(f));ARMSIMG[f]=im;});
const hijri=y=>Math.round((y-622)*33/32);
const roman=n=>[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']].reduce((s,[v,r])=>{while(n>=v){s+=r;n-=v;}return s;},'');


