/* =====================================================================
   CHARACTER SEED TABLES (Track C): historical rulers, heirs, kin and
   generals of 1451 for all 28 factions, culture name pools, titles.
   Keys: k seed key, n personal name, rn regnal/display name when ruling,
   b birth year, d historical death year (drives the "soft history" death
   bias), par parent seed key, pref heir preference, nk no further children,
   fem female, sk commander skill 1-5 (commanders only), tr traits,
   from year a general enters service, t title override, fate:'city' dies
   with Constantinople rather than by the date bias.
   el: elective states (doges, popes, grand masters, Mamluk sultans, khans)
   list their historical successors in order; alt: hereditary states list
   who is invited to the throne when the line dies out.
   Where a birth year is uncertain it is marked "~" in a comment; the value
   used is the one most sources give.
   ===================================================================== */
const CH_SEED={
 OSM:{dyn:'Osmanoğlu',cul:'tr',num:1,title:'Sultan',ht:'Şehzade',
  r:{k:'mehmed2',n:'Mehmed',rn:'II. Mehmed',b:1432,d:1481,sk:3,tr:['cengaver','alim']},
  kin:[{k:'bayezid2',n:'Bayezid',rn:'II. Bayezid',b:1447,d:1512,par:'mehmed2',tr:['dindar']},
   {k:'mustafa',n:'Mustafa',b:1450,d:1474,par:'mehmed2'},
   {k:'cem',n:'Cem',b:1459,d:1495,par:'mehmed2',tr:['alim']},
   {k:'ahmed',n:'Ahmed',b:1465,d:1513,par:'bayezid2'},          // ~1465
   {k:'korkut',n:'Korkut',b:1467,d:1513,par:'bayezid2',tr:['alim']}, // ~1467
   {k:'selim1',n:'Selim',rn:'I. Selim',b:1470,d:1520,par:'bayezid2',pref:1,sk:4,tr:['cengaver','zalim']},
   {k:'suleyman1',n:'Süleyman',rn:'I. Süleyman',b:1494,d:1566,par:'selim1',pref:1,sk:3,tr:['adil']}],
  gen:[{k:'mahmudp',n:'Mahmud Paşa',b:1420,d:1474,sk:3},
   {k:'zaganos',n:'Zağanos Paşa',b:1410,d:1469,sk:2},              // birth ~1410 (uncertain)
   {k:'turahan',n:'Turahan Bey',b:1390,d:1456,sk:2,tr:['akinci']},  // birth ~1390
   {k:'gedik',n:'Gedik Ahmed Paşa',b:1430,d:1482,sk:3,tr:['topcu'],from:1461},
   {k:'mihaloglu',n:'Mihaloğlu Ali Bey',b:1440,d:1507,sk:2,tr:['akinci'],from:1462},
   {k:'hersekzade',n:'Hersekzade Ahmed Paşa',b:1459,d:1517,sk:2,from:1481}]},
 BYZ:{dyn:'Palaiologos',cul:'gr',num:1,title:'İmparator',ht:'Despot',
  r:{k:'konst11',n:'Konstantinos',rn:'XI. Konstantinos',b:1405,d:1453,fate:'city',sk:2,nk:1,tr:['sebatkar']},
  kin:[{k:'demetrios',n:'Demetrios',rn:'Demetrios Palaiologos',b:1407,d:1470},
   {k:'thomas',n:'Thomas',rn:'Thomas Palaiologos',b:1409,d:1465},
   {k:'andreas',n:'Andreas',rn:'Andreas Palaiologos',b:1453,d:1502,par:'thomas'}],
  gen:[{k:'notaras',n:'Loukas Notaras',b:1402,d:1453,sk:1}]},
 VEN:{dyn:null,cul:'it',sur:['Contarini','Mocenigo','Morosini','Dandolo','Loredan','Grimani','Barbarigo','Tron','Vendramin','Donà','Venier','Priuli','Trevisan','Corner'],title:'Doç',ht:'',
  r:{k:'foscari',n:'Francesco Foscari',b:1373,d:1457,tr:['tuccar']},
  el:[{n:'Pasquale Malipiero',b:1392,d:1462},{n:'Cristoforo Moro',b:1390,d:1471},{n:'Nicolò Tron',b:1399,d:1473,tr:['tuccar']},
   {n:'Nicolò Marcello',b:1397,d:1474},{n:'Pietro Mocenigo',b:1406,d:1476,tr:['cengaver']},{n:'Andrea Vendramin',b:1393,d:1478,tr:['tuccar']},
   {n:'Giovanni Mocenigo',b:1409,d:1485},{n:'Marco Barbarigo',b:1413,d:1486},{n:'Agostino Barbarigo',b:1419,d:1501},
   {n:'Leonardo Loredan',b:1436,d:1521,tr:['sebatkar']},{n:'Antonio Grimani',b:1434,d:1523},{n:'Andrea Gritti',b:1455,d:1538,tr:['cengaver']}],
  gen:[{k:'jloredan',n:'Jacopo Loredan',b:1396,d:1471,sk:2}]},    // birth ~1396
 HUN:{dyn:'Hunyadi',cul:'hu',num:1,title:'Kral',ht:'Prens',
  r:{k:'hunyadi',n:'Yanoş',rn:'Hunyadi Yanoş',t:'Naip',b:1406,d:1456,sk:4,tr:['cengaver','sebatkar']},  // regent for Ladislaus V
  kin:[{k:'matyas',n:'Matyas',rn:'Matyas Korvin',b:1443,d:1490,par:'hunyadi',nk:1,sk:3,tr:['alim','cengaver']}],
  alt:[{k:'ulaszlo2',n:'Ulászló',rn:'II. Ulászló',b:1456,d:1516,dyn:'Jagiello',tr:['savurgan']},
   {k:'lajos2',n:'Layoş',rn:'II. Layoş',b:1506,d:1526,par:'ulaszlo2',dyn:'Jagiello',nk:1}],
  gen:[{k:'szilagyi',n:'Szilágyi Mihály',b:1400,d:1460,sk:2},        // birth ~1400
   {k:'kinizsi',n:'Kinizsi Pál',b:1432,d:1494,sk:3,from:1467},
   {k:'bathory',n:'Báthory István',b:1430,d:1493,sk:2,from:1479},
   {k:'tomori',n:'Tomori Pál',b:1475,d:1526,sk:2,from:1520}]},
 SRB:{dyn:'Branković',cul:'sr',title:'Despot',ht:'Prens',
  r:{k:'durad',n:'Đurađ',rn:'Đurađ Branković',b:1377,d:1456},
  kin:[{k:'lazar',n:'Lazar',rn:'Lazar Branković',b:1421,d:1458,par:'durad',pref:1,nk:1},
   {k:'grgur',n:'Grgur',rn:'Grgur Branković',b:1415,d:1459,par:'durad'},
   {k:'stefanb',n:'Stefan',rn:'Stefan Branković',b:1417,d:1476,par:'durad'}],
  gen:[]},
 BOS:{dyn:'Kotromanić',cul:'sr',title:'Kral',ht:'Prens',
  r:{k:'tomas',n:'Stjepan Tomaš',b:1411,d:1461},                      // birth ~1411
  kin:[{k:'tomasevic',n:'Stjepan',rn:'Stjepan Tomašević',b:1438,d:1463,par:'tomas'}],
  gen:[{k:'kosaca',n:'Herceg Stjepan Kosača',b:1404,d:1466,sk:2,tr:['dag']}]},
 WAL:{dyn:'Basarab',cul:'ro',num:1,title:'Voyvoda',ht:'Bey',
  r:{k:'vladislav2',n:'Vladislav',rn:'II. Vladislav',b:1410,d:1456},  // birth ~1410 (uncertain)
  kin:[{k:'vlad3',n:'Vlad',rn:'III. Vlad',b:1431,d:1477,pref:1,sk:3,tr:['zalim','cengaver']},
   {k:'radu3',n:'Radu',rn:'III. Radu',b:1437,d:1475},
   {k:'mihnea',n:'Mihnea',rn:'I. Mihnea',b:1462,d:1510,par:'vlad3'}],
  gen:[]},
 MOL:{dyn:'Muşat',cul:'ro',num:1,title:'Voyvoda',ht:'Bey',
  r:{k:'alexandrel',n:'Alexăndrel',b:1437,d:1455},                    // ~1437
  kin:[{k:'stefan3',n:'Ştefan',rn:'III. Ştefan',b:1433,d:1504,pref:1,sk:4,tr:['cengaver','dindar']},
   {k:'bogdan3',n:'Bogdan',rn:'III. Bogdan',b:1479,d:1517,par:'stefan3'},
   {k:'rares',n:'Petru',rn:'IV. Petru (Rareş)',b:1487,d:1546,par:'stefan3',sk:2},
   {k:'stefanita',n:'Ştefăniţă',rn:'IV. Ştefan',b:1506,d:1527,par:'bogdan3'}],
  gen:[]},
 ALB:{dyn:'Kastrioti',cul:'sq',title:'Bey',ht:'Veliaht',
  r:{k:'skanderbeg',n:'Gjergj',rn:'İskender Bey',t:'Birlik Başkomutanı',b:1405,d:1468,sk:5,tr:['cengaver','sebatkar']},
  kin:[{k:'gjon2',n:'Gjon',rn:'II. Gjon Kastrioti',b:1456,d:1502,par:'skanderbeg'}],
  gen:[{k:'dukagjini',n:'Lekë Dukagjini',b:1410,d:1481,sk:2,tr:['dag']},
   {k:'golemi',n:'Moisi Golemi',b:1400,d:1464,sk:2,tr:['dag']}]},       // ~1400
 KRM:{dyn:'Giray',cul:'tt',num:1,suf:' Giray',title:'Han',ht:'Kalgay',
  r:{k:'haci1',n:'Hacı',rn:'I. Hacı Giray',b:1397,d:1466},             // ~1397
  kin:[{k:'nurdevlet',n:'Nur Devlet',rn:'Nur Devlet Giray',b:1427,d:1503,par:'haci1'},   // ~1427
   {k:'mengli',n:'Mengli',rn:'I. Mengli Giray',b:1445,d:1515,par:'haci1',pref:1,tr:['adil']},
   {k:'mehmedg',n:'Mehmed',rn:'I. Mehmed Giray',b:1465,d:1523,par:'mengli',sk:2},
   {k:'saadet',n:'Saadet',rn:'I. Saadet Giray',b:1492,d:1538,par:'mengli'}],
  gen:[]},
 GEN:{dyn:null,cul:'it',sur:['Fregoso','Adorno','Doria','Spinola','Grimaldi','Fieschi','Giustiniani','Lomellini','Cattaneo'],title:'Doç',ht:'',
  r:{k:'pfregoso',n:'Pietro Fregoso',b:1417,d:1459},                   // ~1417
  el:[{n:'Prospero Adorno',b:1428,d:1486},{n:'Paolo Fregoso',b:1427,d:1498},{n:'Battista Fregoso',b:1452,d:1504},
   {n:'Ottaviano Fregoso',b:1470,d:1524},{n:'Antoniotto Adorno',b:1479,d:1528}],
  gen:[]},
 KAR:{dyn:'Karamanoğlu',cul:'tr',suf:' Bey',title:'Bey',ht:'Şehzade',
  r:{k:'ibrahim',n:'İbrahim',rn:'İbrahim Bey',b:1405,d:1464},          // ~1405
  kin:[{k:'ishak',n:'İshak',rn:'İshak Bey',b:1425,d:1465,par:'ibrahim',pref:1},   // births of the sons ~1425-1432
   {k:'pirahmed',n:'Pir Ahmed',rn:'Pir Ahmed Bey',b:1430,d:1474,par:'ibrahim'},
   {k:'kasim',n:'Kasım',rn:'Kasım Bey',b:1432,d:1483,par:'ibrahim'}],
  gen:[]},
 CAN:{dyn:'Candaroğlu',cul:'tr',suf:' Bey',title:'Bey',ht:'Şehzade',
  r:{k:'ismailc',n:'İsmail',rn:'İsmail Bey',b:1410,d:1479},            // ~1410
  kin:[{k:'kizilahmed',n:'Kızıl Ahmed',rn:'Kızıl Ahmed Bey',b:1432,d:1499,par:'ismailc'}],   // ~1432
  gen:[]},
 DUL:{dyn:'Dulkadiroğlu',cul:'tr',suf:' Bey',title:'Bey',ht:'Şehzade',
  r:{k:'suleymand',n:'Süleyman',rn:'Süleyman Bey',b:1395,d:1454},      // ~1395
  kin:[{k:'melikarslan',n:'Melik Arslan',rn:'Melik Arslan Bey',b:1420,d:1465,par:'suleymand'},  // sons' births ~1420-1430
   {k:'sahbudak',n:'Şah Budak',rn:'Şah Budak Bey',b:1425,d:1492,par:'suleymand'},
   {k:'sehsuvar',n:'Şehsuvar',rn:'Şehsuvar Bey',b:1428,d:1472,par:'suleymand',sk:2},
   {k:'alaudevle',n:'Alaüddevle',rn:'Alaüddevle Bozkurt Bey',b:1430,d:1515,par:'suleymand'}],
  gen:[]},
 MAM:{dyn:null,cul:'mm',title:'Sultan',ht:'',
  r:{k:'cakmak',n:'Seyfeddin Çakmak',b:1373,d:1453},                   // ~1373
  el:[{n:'Eşref İnal',b:1381,d:1461},{n:'Zâhir Hoşkadem',b:1400,d:1467},{n:'Eşref Kayıtbay',b:1416,d:1496,tr:['sebatkar','adil']},
   {n:'Kansu Gavri',b:1441,d:1516},{n:'Eşref Tomanbay',b:1476,d:1517,tr:['cengaver']}],
  gen:[{k:'yesbek',n:'Yeşbek min Mehdi',b:1420,d:1480,sk:2,from:1468}]},   // ~1420
 AKK:{dyn:'Bayındır',cul:'tk',suf:' Bey',title:'Bey',ht:'Şehzade',
  r:{k:'uzunhasan',n:'Hasan',rn:'Uzun Hasan',b:1423,d:1478,sk:4,tr:['cengaver','adil']},   // nominal ruler until 1453 was his brother Cihangir
  kin:[{k:'halil',n:'Halil',rn:'Sultan Halil',b:1441,d:1478,par:'uzunhasan'},   // ~1441
   {k:'ugurlu',n:'Uğurlu Mehmed',b:1455,d:1477,par:'uzunhasan',sk:2},          // ~1455
   {k:'yakub',n:'Yakub',rn:'Yakub Bey',b:1463,d:1490,par:'uzunhasan',tr:['alim']},
   {k:'baysungur',n:'Baysungur',rn:'Baysungur Bey',b:1480,d:1493,par:'yakub'}], // ~1480
  gen:[]},
 KKY:{dyn:'Baharlu',cul:'tk',suf:' Bey',title:'Sultan',ht:'Şehzade',
  r:{k:'cihansah',n:'Cihan Şah',b:1397,d:1467,sk:2,tr:['alim','zalim']},       // poet "Hakikî"
  kin:[{k:'pirbudak',n:'Pir Budak',rn:'Pir Budak',b:1430,d:1466,par:'cihansah'},  // ~1430
   {k:'hasanali',n:'Hasan Ali',rn:'Hasan Ali',b:1440,d:1469,par:'cihansah'}],     // ~1440
  gen:[]},
 TRB:{dyn:'Megas Komnenos',cul:'gr',num:1,title:'İmparator',ht:'Despot',
  r:{k:'ioannes4',n:'Yuannis',rn:'IV. Yuannis',b:1403,d:1460},          // ~1403
  kin:[{k:'davidk',n:'David',rn:'David Komnenos',b:1408,d:1463,pref:1},
   {k:'alexios',n:'Alexios',rn:'V. Alexios',b:1454,d:1463,par:'ioannes4'}],
  gen:[]},
 GEO:{dyn:'Bagrationi',cul:'ka',num:1,title:'Kral',ht:'Prens',
  r:{k:'giorgi8',n:'Giorgi',rn:'VIII. Giorgi',b:1417,d:1476},
  kin:[{k:'aleksandre',n:'Aleksandre',rn:'I. Aleksandre',b:1445,d:1511,par:'giorgi8'},
   {k:'konstantine',n:'Konstantine',rn:'II. Konstantine',b:1447,d:1505}],
  gen:[]},
 HAB:{dyn:'Habsburg',cul:'de',num:1,title:'Arşidük',ht:'Arşidük',
  r:{k:'fried3',n:'Friedrich',rn:'III. Friedrich',b:1415,d:1493,tr:['sebatkar']},
  kin:[{k:'albrecht6',n:'Albrecht',rn:'VI. Albrecht',b:1418,d:1463},
   {k:'max1',n:'Maximilian',rn:'I. Maximilian',b:1459,d:1519,par:'fried3',pref:1,sk:2,tr:['cengaver']},
   {k:'philipp',n:'Philipp',rn:'I. Philipp',b:1478,d:1506,par:'max1'},
   {k:'karl5',n:'Karl',rn:'V. Karl',b:1500,d:1558,par:'philipp'},
   {k:'ferd1',n:'Ferdinand',rn:'I. Ferdinand',b:1503,d:1564,par:'philipp'}],
  gen:[{k:'salm',n:'Niklas Salm',b:1459,d:1530,sk:3,from:1500}]},
 POL:{dyn:'Jagiello',cul:'pl',num:1,title:'Kral',ht:'Prens',
  r:{k:'kaz4',n:'Kazimierz',rn:'IV. Kazimierz',b:1427,d:1492},
  kin:[{k:'olbracht',n:'Jan Olbracht',rn:'I. Jan Olbracht',b:1459,d:1501,par:'kaz4',pref:1,nk:1},
   {k:'aleksander',n:'Aleksander',rn:'Aleksander Jagiełło',b:1461,d:1506,par:'kaz4',nk:1},
   {k:'zygmunt1',n:'Zygmunt',rn:'I. Zygmunt',b:1467,d:1548,par:'kaz4'},
   {k:'zygmunt2',n:'Zygmunt August',rn:'II. Zygmunt August',b:1520,d:1572,par:'zygmunt1'}],
  gen:[{k:'ostrogski',n:'Konstanty Ostrogski',b:1460,d:1530,sk:3,from:1497},
   {k:'tarnowski',n:'Jan Tarnowski',b:1488,d:1561,sk:3,from:1515}]},
 GH:{dyn:null,cul:'tt',suf:' Han',title:'Han',ht:'',
  r:{k:'seyyidahmed',n:'Seyyid Ahmed',b:1405,d:1455},                   // khans' dates uncertain
  el:[{n:'Mahmud Han',b:1430,d:1465},{n:'Ahmed Han',b:1435,d:1481,sk:2},{n:'Şeyh Ahmed Han',b:1460,d:1528}],
  gen:[]},
 ARA:{dyn:'Trastámara',cul:'es',num:1,title:'Kral',ht:'Prens',
  r:{k:'alfonso5',n:'Alfonso',rn:'V. Alfonso',b:1396,d:1458,tr:['alim','savurgan']},
  kin:[{k:'ferrante',n:'Ferrante',rn:'I. Ferrante',b:1423,d:1494,par:'alfonso5',tr:['zalim']},
   {k:'alfonso2',n:'Alfonso',rn:'II. Alfonso',b:1448,d:1495,par:'ferrante',sk:2},
   {k:'federico',n:'Federico',rn:'Federico',b:1451,d:1504,par:'ferrante'},
   {k:'ferrandino',n:'Ferrandino',rn:'II. Ferrante',b:1469,d:1496,par:'alfonso2'}],
  gen:[]},
 PAP:{dyn:null,cul:'pp',title:'Papa',ht:'',
  r:{k:'nikolaus5',n:'Tommaso Parentucelli',rn:'V. Nikolaus',b:1397,d:1455,tr:['alim']},
  el:[{n:'Alfons de Borja',rn:'III. Callixtus',b:1378,d:1458},{n:'Enea Silvio Piccolomini',rn:'II. Pius',b:1405,d:1464,tr:['alim']},
   {n:'Pietro Barbo',rn:'II. Paulus',b:1417,d:1471},{n:'Francesco della Rovere',rn:'IV. Sixtus',b:1414,d:1484},
   {n:'Giovanni Battista Cybo',rn:'VIII. Innocentius',b:1432,d:1492},{n:'Rodrigo Borgia',rn:'VI. Alexander',b:1431,d:1503,tr:['savurgan']},
   {n:'Francesco Piccolomini',rn:'III. Pius',b:1439,d:1503},{n:'Giuliano della Rovere',rn:'II. Julius',b:1443,d:1513,tr:['cengaver']},
   {n:'Giovanni de\' Medici',rn:'X. Leo',b:1475,d:1521,tr:['savurgan','alim']},{n:'Adriaan Boeyens',rn:'VI. Hadrianus',b:1459,d:1523},
   {n:'Giulio de\' Medici',rn:'VII. Clemens',b:1478,d:1534}],
  gen:[]},
 CYP:{dyn:'Lusignan',cul:'fr',num:1,title:'Kral',ht:'Prens',
  r:{k:'jean2',n:'Jean',rn:'II. Jean',b:1418,d:1458},
  kin:[{k:'charlotte',n:'Charlotte',rn:'Charlotte',b:1444,d:1487,par:'jean2',fem:1,pref:1,nk:1},
   {k:'jacques2',n:'Jacques',rn:'II. Jacques',b:1440,d:1473,par:'jean2'}],    // ~1440, illegitimate
  alt:[{k:'cornaro',n:'Caterina',rn:'Caterina Cornaro',b:1454,d:1510,fem:1,dyn:'Cornaro',nk:1}],
  gen:[]},
 RHO:{dyn:null,cul:'fr',sur:['de Milly','d\'Aubusson','de Blanchefort','de Lastic','d\'Amboise','del Carretto','de Villiers','Zacosta','Orsini','de Heredia'],title:'Büyük Üstat',ht:'',
  r:{k:'lastic',n:'Jean de Lastic',b:1371,d:1454},
  el:[{n:'Jacques de Milly',b:1400,d:1461},{n:'Pere Ramon Zacosta',b:1400,d:1467},{n:'Giovanni Battista Orsini',b:1420,d:1476},   // ~births
   {n:'Pierre d\'Aubusson',b:1423,d:1503,tr:['sebatkar']},{n:'Emery d\'Amboise',b:1434,d:1512},{n:'Guy de Blanchefort',b:1446,d:1513},
   {n:'Fabrizio del Carretto',b:1455,d:1521},{n:'Philippe de Villiers',b:1464,d:1534,tr:['sebatkar']}],
  gen:[]},
 HAF:{dyn:'Hafsî',cul:'ar',title:'Sultan',ht:'Emir',
  r:{k:'ebuamr',n:'Osman',rn:'Ebû Amr Osman',b:1419,d:1488},           // ~1419
  kin:[{k:'ebuzekeriya',n:'Yahyâ',rn:'Ebû Zekeriyyâ Yahyâ',b:1462,d:1489,par:'ebuamr'},    // grandson in fact; dates uncertain
   {k:'mutevekkil',n:'Muhammed',rn:'Muhammed el-Mütevekkil',b:1467,d:1526,par:'ebuamr'}],
  gen:[]},
 SAF:{dyn:'Safevî',cul:'tk',pre:'Şah ',title:'Şah',ht:'Mirza',
  r:{k:'ismail1',n:'İsmail',rn:'Şah İsmail',b:1487,d:1524,sk:4,tr:['cengaver','dindar']},
  kin:[{k:'tahmasp',n:'Tahmasp',rn:'Şah Tahmasp',b:1514,d:1576,par:'ismail1'}],
  gen:[]}
};
/** Given-name pools by culture, for generated heirs, rulers and generals. */
const CH_NAMES={
 tr:['Mehmed','Ahmed','Mustafa','Murad','Süleyman','Osman','Orhan','Bayezid','Selim','Korkut','Hasan','Yusuf','Ali','İbrahim','İshak','Kasım','Hamza','Yakub','Halil','Davud','Umur','Alaeddin'],
 tk:['Hasan','Halil','Yakub','Rüstem','Maksud','Murad','Elvend','Cihangir','Pir Ali','Hasan Ali','İskender','Kasım','Sultan Ali','Baysungur','Bahram','Sam','Kılıç Arslan','Zeynel'],
 mm:['Zâhir Yalbay','Eşref Canbalat','Nâsır Muhammed','Zâhir Timurbuga','Eşref Barsbay','Seyfeddin Akbay','Müeyyed Ahmed','Zâhir Kansu','Eşref Tomanbay','Seyfeddin Özdemir'],
 ar:['Ebû Bekir','Yahyâ','Zekeriyyâ','Muhammed','Hasan','Ahmed','Abdülmümin','Osman','Ebû Fâris'],
 tt:['Mengli','Mehmed','Saadet','Sahib','Nur Devlet','Ahmed','Mahmud','Murtaza','Bahadır','Devlet','Kasım','Seyyid'],
 gr:['Konstantinos','Ioannes','Manuel','Andronikos','Demetrios','Thomas','Theodoros','Alexios','Andreas','Georgios','Mikhael','David'],
 sr:['Stefan','Lazar','Vuk','Grgur','Jovan','Stjepan','Tvrtko','Radivoj','Vladislav','Petar','Nikola','Đurađ'],
 ro:['Vlad','Radu','Mircea','Dan','Basarab','Mihnea','Ştefan','Bogdan','Petru','Iliaş','Alexandru','Neagoe'],
 hu:['János','Mátyás','László','Miklós','István','Pál','Péter','Ferenc','György','Imre','Mihály','Gáspár'],
 de:['Friedrich','Maximilian','Albrecht','Ferdinand','Karl','Sigmund','Ernst','Leopold','Rudolf','Philipp'],
 pl:['Kazimierz','Władysław','Jan','Aleksander','Zygmunt','Bolesław','Mikołaj','Stanisław'],
 it:['Francesco','Pietro','Giovanni','Niccolò','Andrea','Marco','Leonardo','Antonio','Paolo','Battista','Ottaviano','Lorenzo','Tommaso','Agostino'],
 es:['Alfonso','Ferrante','Federico','Carlo','Giovanni','Fernando','Juan','Pedro','Martín','Enrique'],
 fr:['Jean','Jacques','Pierre','Guy','Philippe','Louis','Charles','Aimery','Hugues','Henri'],
 ka:['Giorgi','Aleksandre','Konstantine','Bagrat','Davit','Vakhtang','Levan','Simon','Teimuraz','Kvarkvare'],
 sq:['Gjergj','Gjon','Lekë','Pal','Nikollë','Tanush','Moisi','Kostandin','Andrea','Gjin'],
 pp:['Pius','Paulus','Sixtus','Innocentius','Alexander','Julius','Leo','Clemens','Hadrianus','Gregorius','Martinus','Eugenius','Nicolaus','Callixtus','Urbanus']
};
/** Commander titles for generated generals, by culture. */
const CH_GTITLE={tr:' Paşa',tk:' Bey',mm:' Emir',ar:' Kaid',tt:' Mirza'};
/** How many rulers of each regnal name each numbering house had before 1451 (for generated rulers). */
const CH_REGNAL={
 OSM:{Osman:1,Orhan:1,Murad:2,Bayezid:1,Mehmed:2},
 BYZ:{Konstantinos:11,Ioannes:8,Manuel:2,Andronikos:4,Mikhael:9,Theodoros:2,Alexios:5},
 TRB:{Yuannis:4,Ioannes:4,Alexios:4,Manuel:3,Andronikos:3,Basileios:1},
 HUN:{László:5,István:5,Béla:4,András:3,Lajos:1,Ulászló:1,Károly:1,Mátyás:0,János:0},
 HAB:{Friedrich:3,Albrecht:6,Rudolf:4,Leopold:4,Ernst:1,Karl:4},
 POL:{Kazimierz:4,Władysław:3,Bolesław:5,Jan:0},
 ARA:{Alfonso:5,Ferrante:0,Carlo:3,Giovanni:2,Pedro:4,Juan:2,Fernando:1},
 CYP:{Jean:2,Jacques:1,Pierre:2,Hugues:4,Henri:2},
 GEO:{Giorgi:8,Aleksandre:1,Konstantine:1,Bagrat:5,Davit:7,Vakhtang:3},
 WAL:{Vlad:2,Radu:2,Mircea:2,Dan:2,Basarab:2,Vladislav:2},
 MOL:{Ştefan:2,Bogdan:2,Petru:3,Iliaş:1,Alexandru:1,Roman:2},
 KRM:{Hacı:1},
 PAP:{Nicolaus:5,Callixtus:2,Pius:1,Paulus:1,Sixtus:3,Innocentius:7,Alexander:5,Julius:1,Leo:9,Hadrianus:5,Clemens:6,Gregorius:12,Martinus:5,Eugenius:4,Urbanus:6}
};
/** Ruler and general traits: player-facing label and plain effect text (numbers live in BAL_C). */
const CH_TRAITS={
 adil:{l:'Adil',d:'Halk vergisini gönül rızasıyla öder: her tur +2 altın.'},
 tuccar:{l:'Tüccar',d:'Ticareti bilir: her tur +3 altın.'},
 alim:{l:'Âlim',d:'Medreseleri ve kütüphaneleri himaye eder: her tur +1 altın.'},
 savurgan:{l:'Savurgan',d:'Saray masrafları kabarık: her tur −2 altın.'},
 cengaver:{l:'Cengâver',d:'Orduya cesaret verir: saldırılarda +5%.'},
 sebatkar:{l:'Sebatkâr',d:'Sarsılmaz: savunmada +5%.'},
 dindar:{l:'Dindar',d:'Başka dinden düşmana karşı savunmada +5%.'},
 zalim:{l:'Zalim',d:'Korku salar: savunmada +10%, ama her tur −1 altın.'},
 hasta:{l:'Hastalıklı',d:'Sağlığı zayıf; ömrü kısa olabilir.'},
 fatih:{l:'Fatih',d:'Kaleleri düşürmeyi bilir: surlu şehirlere saldırıda +10%.'},
 dag:{l:'Dağ Kurdu',d:'Dağlık arazide yapılan muharebelerde +15%.'},
 topcu:{l:'Topçu',d:'Kaleli eyaletlere saldırıda +10%.'},
 akinci:{l:'Akıncı',d:'Hızlı süvari: ordusu her tur bir adım fazla yürür.'}
};
