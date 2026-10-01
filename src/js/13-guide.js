/* ---------------- guide ---------------- */
const GUIDE_TABS=[['genel',lng('Genel','Basics')],['para',lng('Para','Money')],['savas',lng('Ordular','Armies')],['kusatma',lng('Kuşatma','Sieges')],['antlasma',lng('Antlaşmalar','Treaties')],
 ['diplo',lng('Diplomasi','Diplomacy')],['koalisyon',lng('Koalisyonlar','Coalitions')],['hanedan',lng('Hanedan','Dynasty')],['bina',lng('Binalar','Buildings')],['olay',lng('Olaylar','Events')]];
function guideBody(t){
 const half=Math.ceil(NP*.5),w2=guideW2(t);if(w2)return w2;
 if(EN)return guideBodyEn(t,half);
 if(t==='para')return `<p>Devletin hazinesi eyaletlerinden gelen vergiyle dolar. Her mevsimin sonunda bütün eyaletlerin vergisini öder. Bir eyalet ne kadar gelişmişse o kadar çok vergi verir; büyük bir şehir, küçük bir kasabanın birkaç katını getirir.</p>
 <h3>Parayı ne artırır?</h3>
 <ul><li><b>Pazar kurmak.</b> Bir eyalette pazar varsa o eyaletin vergisi yarı yarıya artar.</li>
 <li><b>Fetih.</b> Yeni bir şehir aldığında askerlerin orayı yağmalar, hazineye hemen bir miktar altın girer.</li>
 <li><b>Haraç.</b> Savaşta yendiğin bir devlet, barış karşılığında hazinesinin bir kısmını sana ödeyebilir.</li>
 <li><b>Hedefler ve olaylar.</b> Tarihî hedefleri tamamlamak ya da kervan, bereketli hasat gibi olaylar da altın getirir.</li></ul>
 <h3>Para nereye gider?</h3>
 <p>Askerler maaş ister: her bin asker için her mevsim bir altın. Ordun büyüdükçe masrafın da büyür. Üst çubukta Hazine'nin yanındaki küçük sayı, her mevsim cebinde kalan parayı gösterir. <b>Yeşilse</b> kazanıyorsun, <b>kırmızıysa</b> zarardasın.</p>
 <p>Hazine tamamen boşalırsa maaşını alamayan askerler kaçmaya başlar; her eyaletteki ordunun bir kısmı dağılır.</p>
 <h3>Huzursuz topraklar</h3>
 <p>Yeni fethettiğin bir eyaletin halkı sana hemen alışmaz. İki yıl boyunca huzursuzdur ve normalde vereceği verginin yarısını verir.</p>
 <h3>İnsan gücü</h3>
 <p>Asker toplamak için sadece altın yetmez, askere yazılacak gençler de gerekir. Buna insan gücü denir. Her mevsim eyaletlerinden yeni gençler gelir, ama bir üst sınırı vardır. Kışla kurduğun eyaletler iki kat asker yetiştirir.</p>
 <p class="tip"><b>Vezirin öğüdü:</b> İlk yıllarda altınını pazarlara yatır; en zengin şehirlerinden başla. Barış zamanında gereğinden büyük ordu besleme, maaşlar hazineni eritir.</p>`;
 if(t==='savas')return `<p>Bir devletin toprağına girmek için önce ona <b>savaş ilan etmelisin</b>. Savaş ilanı Diplomasi ekranından ya da düşman eyaletine dokunarak yapılır.</p>
 <h3>Ordular ve garnizonlar</h3>
 <p>Askerlerin iki çeşittir. <b>Garnizon</b> şehrini korur ama yerinden kıpırdamaz; maaşı ucuzdur. <b>Sahra ordusu</b> ise haritada sancağıyla yürüyen, savaşan ve şehir alan kuvvettir. Asker topladığında o eyalette bir sahra ordusu kurulur ya da oradaki orduna katılır.</p>
 <p>Haritadaki <b>sancaklar</b> ordulardır: üstünde devletin arması, altında asker sayısı, kırmızı mühürde komutanın baş harfleri. Altın çerçeve senin, kırmızı çerçeve savaştığın düşmanın ordusudur. Küçük <b>kule levhaları</b> ise garnizonlardır; yakınlaştırınca ya da eyaleti seçince görünür.</p>
 <h3>Nasıl saldırılır?</h3>
 <ol><li>Ordunun sancağına dokun ya da eyaletini seçip panelden orduyu seç.</li><li>Gideceği eyalete dokun; yol haritada altın kesik çizgiyle görünür.</li><li>Paneldeki tahmine bak ve <b>Yürü</b> ya da <b>Saldır</b>'a bas.</li></ol>
 <p>Bir ordu her mevsim sınırlı yol alır; sancağın altındaki altın noktalar kalan hareketini gösterir. Haritadaki kesik mavi çizgiler gemiyle geçilen deniz yollarıdır. Orduları birleştirebilir, bölebilir ya da dağıtabilirsin.</p>
 <p><b>Komutanlar:</b> Her ordunun başında bir paşa, şehzade ya da hükümdarın kendisi olabilir; yıldızları ne kadar çoksa muharebede o kadar işe yarar. Orduyu seçip <b>Komutanı değiştir</b>'e basarak boştaki bir paşayı atayabilir ya da başka bir ordunun komutanını buraya alabilirsin. Komutanı ölen ya da esir düşen orduya, boşta paşan varsa tur sonunda o geçer.</p>
 <p class="tip"><b>Kısayol:</b> Üst çubukta <b>Ordu</b>'ya dokununca ordularını, <b>Eyalet</b>'e dokununca eyaletlerini sırayla gösterir; haritanın bir köşesinde unuttuğun bir ada ya da ordu hep bir dokunuş uzağındadır.</p>
 <p>Tur sonunda <b>Sefer haberleri</b> bu mevsimin yürüyüşlerini ve muharebelerini haritada kısaca oynatır; <b>Geç</b> ile atlayabilirsin. Menü → Görüntü'den kapatabilir ya da hızlandırabilirsin.</p>
 <h3>Kimin gücü ağır basar?</h3>
 <p>Muharebede senin ordunla şehrin savunması karşılaşır. Şehri sadece oradaki askerler korumaz; kasabanın halkı da silaha sarılır. Büyük şehirlerde ve kaleli yerlerde bu halk savunması kalabalıktır.</p>
 <ul><li><b>Kale surları</b> savunmacıları güçlendirir; kale seviyesi yükseldikçe şehri almak zorlaşır.</li>
 <li><b>Dağlar</b> savunanın işine yarar, çöl de biraz yarar.</li>
 <li><b>Kış</b> seferleri zordur; kışın saldıran ordu yorgun düşer.</li>
 <li><b>Toplar</b> surları yıkar. Osmanlı 1453'te Urban'ın dev toplarını alır, diğer devletler 1460'ta barutlu toplara kavuşur. Toplu bir ordunun karşısında kale eski gücünü büyük ölçüde kaybeder.</li>
 <li>Her muharebede biraz da <b>şans</b> vardır; kıl payı üstün bir ordu kaybedebilir.</li></ul>
 <h3>Muharebeden sonra</h3>
 <p><b>Kazanırsan</b> şehir ordunun <b>işgaline</b> girer. Askerlerinin bir kısmı düşer ama ne kadar üstünsen o kadar az kayıp verirsin. Düşman garnizonunun çoğu ölür, kalanlar komşu eyaletlerine kaçar ve askerlerin şehri yağmalar. Eyalet senin olsun istiyorsan barış masasında iste (<b>Antlaşmalar</b>).</p>
 <p><b>Surlu şehirler</b> hemen alınmaz, kuşatılır (<b>Kuşatma</b>). <b>Meydan muharebesi</b> ise iki ordu karşılaştığında olur: surlar sayılmaz, arazi, mevsim, komutan ve askerlerin morali sayılır. Yenilen ordu komşu bir eyalete çekilir; kaçacak yeri yoksa yok olur.</p>
 <p><b>Kaybedersen</b> ordunun ağır kayıplar verir, sağ kalanlar geri çekilir. Düşman da biraz asker kaybeder.</p>
 <p><b>Muharebe kartı</b> savaşın neden kazanıldığını ya da kaybedildiğini gösterir: kale, arazi, kış, komutan ve talih zarları. Mevsim raporundaki satırlara dokunarak yeniden açabilirsin.</p>
 <p>Bir devletin <b>başkenti düşerse</b> hazinesinin bir kısmı yağmalanır ve başkentini başka bir şehre taşır. Son şehrini de kaybeden devlet tarihten silinir.</p>
 <p><b>Emir bekleyen ordular:</b> savaştayken bu mevsim hiç yürümemiş ordularını üst çubuğun altındaki küçük düğme sayar; Turu Bitir düğmesinin köşesinde de sayıları görünür. Dokununca sırayla gösterir. Bekletmek istediğin ordular varsa turu yine de bitirebilirsin.</p>
 <p class="tip"><b>Vezirin öğüdü:</b> Saldırmadan önce paneldeki tahmine bak. <b>"Ezici üstünlük"</b> yazıyorsa rahat saldır, <b>"Başa baş"</b> ya da <b>"Riskli"</b> yazıyorsa sınırda birkaç mevsim daha asker biriktir. Kalın surlu şehirlere topun gelmeden ve kışın saldırma.</p>`;
 if(t==='bina')return `<p>Kendi eyaletine dokununca açılan panelde asker toplayabilir ve yapı kurabilirsin. Her düğmenin üstünde fiyatı yazar; para hemen hazineden çıkar ve yapı o anda biter.</p>
 <h3>İmar</h3><p>Şehri büyütür. Büyüyen şehir daha çok vergi verir, daha çok asker yetiştirir ve saldırıya karşı daha çok halk silaha sarılır. Şehir büyüdükçe bir sonraki imar daha pahalıya gelir.</p>
 <h3>Pazar</h3><p>Tüccarlar gelir, şehrin vergisi yarı yarıya artar. Her eyalete bir tane kurulur. Oyunun başında en hızlı kendini ödeyen yatırımdır.</p>
 <h3>Kışla</h3><p>Eyaletin asker yetiştirme gücünü iki katına çıkarır. Çok asker toplayacağın, sınıra yakın yerlere kur.</p>
 <h3>Kale</h3><p>Surları yükseltir. Saldırana karşı savunmayı güçlendirir, şehrin halkı da daha çok silaha sarılır. Beş seviyeye kadar yükselir, her seviye bir öncekinden pahalıdır. Şehir el değiştirince surları biraz hasar görür.</p>
 <h3>Asker toplama</h3><p>Bir kerede bin ya da beş bin asker toplayabilirsin. Bunun için hem altın hem insan gücü gerekir. Yeni askerler o mevsim o eyalette kalır, yola ancak sonraki mevsim çıkar.</p>
 <p class="tip"><b>Vezirin öğüdü:</b> Önce zengin şehirlerine pazar, sonra düşmana bakan sınır şehirlerine kale. İmar pahalıdır ama kalıcıdır; hazinen dolunca başkentinden başla.</p>`;
 if(t==='diplo')return `<p>Üst çubuktaki <b>⚖ Diplomasi</b> düğmesi dünyadaki bütün devletleri gösterir: ne kadar güçlü olduklarını, sana nasıl baktıklarını ve aranızdaki durumu.</p>
 <h3>İlişkiler</h3>
 <p>Her devletin sana karşı bir tavrı vardır. Aynı dinden devletler sana daha sıcak, farklı dinden devletler daha soğuk bakar; tarihten gelen dostluklar ve düşmanlıklar da buna eklenir. Hediye göndererek bir devletin gönlünü alabilirsin. Kırgınlıklar da dostluklar da zamanla yavaş yavaş eski hâline döner.</p>
 <h3>Savaş ve barış</h3>
 <ul><li><b>Savaş ilan edince</b> o devlet sana çok kırılır, onun müttefikleri de sana karşı savaşa girer.</li>
 <li><b>Barış</b> istediğinde düşman, savaşı kaybediyorsa, senden belirgin şekilde zayıfsa ya da savaş çok uzadıysa kabul eder.</li>
 <li><b>Haraç</b> ancak düşmanı iyice sıkıştırdığında alınır. Kabul ederse barış karşılığında hazinesinden sana altın öder.</li>
 <li>Barıştan sonra <b>üç yıl ateşkes</b> olur; bu sürede iki taraf birbirine yeniden savaş açamaz.</li></ul>
 <h3>Savaşı kim kazanıyor?</h3>
 <p>Diplomasi ekranında her savaşın bir skoru görünür. Kazandığın her muharebe, özellikle aldığın başkentler, skoru senin lehine çevirir; püskürttüğün saldırılar da işe yarar. Skorda öndeysen düşman barışa ve haraca daha yatkın olur.</p>
 <h3>İttifak</h3>
 <p>Seni seven ya da aynı düşmana karşı savaşan bir devlet ittifak teklifini kabul eder. Müttefikin, biri sana savaş açtığında yardımına koşar.</p>
 <p class="tip"><b>Vezirin öğüdü:</b> Büyük bir komşuyla savaşmadan önce onun müttefiklerine bak. Oyunun ilk bir buçuk yılında kimse sana savaş açmaz; bu zamanı hazırlanmak için kullan.</p>`;
 if(t==='olay')return `<h3>Beklenmedik olaylar</h3>
 <p>Bazı mevsimlerde sarayına bir haber gelir ve senden karar ister: doğudan zengin bir kervan gelir, bir şehirde veba çıkar, hasat bereketli olur, ünlü bir âlim himaye ister, paralı askerler hizmet teklif eder, deprem surları sarsar, sert bir kış bastırır, yeni fethettiğin bir şehir ayaklanır ya da yabancı bir elçi hediyelerle gelir. Verdiğin karar hazineni, ordunu ya da komşularınla ilişkini etkiler.</p>
 <h3>Tarihin akışı</h3>
 <ul><li><b>1453:</b> Macar dökümcü Urban, Osmanlı için dev toplar döker.</li>
 <li><b>1456:</b> Gökyüzünde bir kuyruklu yıldız görülür.</li>
 <li><b>1460:</b> Barut çağı başlar, herkes top kullanır.</li>
 <li><b>1492:</b> Yeni Dünya keşfedilir, Gırnata düşer.</li>
 <li><b>1501:</b> Şah İsmail Tebriz'de taç giyer ve Safevî devleti doğar.</li></ul>
 <h3>Hedefler</h3>
 <p><b>✦ Hedefler</b> ekranında devletine özel tarihî görevler bulunur: Konstantiniyye'nin fethi, Belgrad'ın savunması, Kroya direnişi gibi. Her biri hazineye altın getirir ve puanını yükseltir.</p>`;
 return `<p>Yıl 1451. Balkanlar'dan Kafkasya'ya, Tuna'dan Nil'e kadar 28 hanedan güç için yarışıyor. Birini seç ve devletini 1531 yılına kadar yönet.</p>
 <h3>Amaç</h3>
 <p>Haritadaki eyaletlerin yarısına (${half} eyalet) hükmedersen oyunu hemen kazanırsın. Buna ulaşamazsan oyun 1531'de biter ve en güçlü hanedan belirlenir. Puanın ne kadar çok ve ne kadar gelişmiş şehrin olduğuna, tamamladığın hedeflere ve hazinene göre hesaplanır. Son şehrini de kaybedersen oyun biter.</p>
 <h3>Bir mevsim nasıl geçer?</h3>
 <ol><li>Asker topla, yapı kur, ordularını yürüt, saldır, komşularınla diplomasi yap.</li>
 <li>Hazır olunca <b>Turu Bitir</b>'e bas.</li>
 <li>Diğer devletler kendi hamlelerini yapar; savaşlar ve fetihler olur.</li>
 <li>Vergiler toplanır, yeni askerler yetişir, ordular dinlenir.</li>
 <li>Bazen sarayına bir haber gelir ve senden karar ister.</li></ol>
 <p>Her tur bir mevsimdir; bir yıl dört tur sürer.</p>
 <h3>Haritayı kullanmak</h3>
 <ul><li>Bir eyaletini seçmek için üstüne dokun. Komşularından <b>yeşil</b> parlayanlar senin toprağın, <b>kırmızı</b> parlayanlar savaştığın düşman.</li>
 <li>Haritayı parmağınla ya da fareyle sürükle; iki parmakla ya da fare tekerleğiyle yakınlaş.</li>
 <li>Sol alttaki düğmelerle 3D ve 2D görünüm arasında geçiş yapabilirsin.</li>
 <li>Telefonda eyalet bilgileri alttan açılan bir çekmecede durur. Tutamağına dokunarak ya da yukarı çekerek büyüt, aşağı çekerek kapat.</li></ul>
 <h3>Vezirin yardımı</h3>
 <ul><li>Bir sayının üstünde dur ya da telefonda ona dokun: vezir o sayının nereden geldiğini anlatır. Hazine'ye bakarsan gelirini ve giderini kalem kalem görürsün.</li>
 <li>Sol altta (telefonda sağ altta) vezirin öğüdü belirir: hazine eriyorsa, ordun boş bekliyorsa ya da barış vakti geldiyse haber verir. Dokun, ne yapman gerektiğini söylesin.</li>
 <li>İlk oyununda vezir sana adım adım yol gösterir. Dersleri Menü'den yeniden başlatabilir ya da kapatabilirsin.</li>
 <li>Klavyede <b>Boşluk</b> turu bitirir, <b>Esc</b> pencereyi kapatır, <b>1–4</b> Diplomasi, Hedefler, Vakayiname ve Devlet defterini açar.</li></ul>
 <p class="tip">Oyun her hamleden sonra kendiliğinden kaydedilir. Kapatsan bile açılış ekranındaki <b>Kayıtlı oyuna dön</b> ile kaldığın yerden devam edersin.</p>`;
}
/** The English guide: same tabs and facts as the Turkish one, told in plain words. */
function guideBodyEn(t,half){
 if(t==='para')return `<p>Your treasury is filled by the taxes of your provinces. At the end of every season each province pays its share. The more developed a province is, the more it pays: a great city brings in several times what a small town does.</p>
 <h3>What brings in more gold?</h3>
 <ul><li><b>Building a market.</b> A province with a market pays half as much tax again.</li>
 <li><b>Conquest.</b> When you take a new city, your soldiers plunder it and some gold goes straight into the treasury.</li>
 <li><b>Tribute.</b> A realm you have beaten in war may pay you part of its treasury in exchange for peace.</li>
 <li><b>Goals and events.</b> Completing historical goals, or events such as a rich caravan or a bountiful harvest, also bring gold.</li></ul>
 <h3>Where does the gold go?</h3>
 <p>Soldiers want their pay: one gold every season for each thousand men. The bigger your army, the bigger the bill. In the top bar, the small number next to the Treasury shows what is left over each season. <b>Green</b> means you are earning, <b>red</b> means you are losing money.</p>
 <p>If the treasury runs completely dry, unpaid soldiers begin to desert, and part of the army in every province melts away.</p>
 <h3>Restless lands</h3>
 <p>The people of a newly conquered province do not accept you at once. For two years they stay restless and pay only half their usual taxes.</p>
 <h3>Manpower</h3>
 <p>Gold alone does not raise an army: you also need young men willing to enlist. This is your manpower. Every season new recruits come in from your provinces, up to a certain limit. Provinces with barracks train twice as many.</p>
 <p class="tip"><b>The Vizier's counsel:</b> In the early years, spend your gold on markets, starting with your richest cities. In peacetime, do not feed a larger army than you need: the wages will drain your treasury.</p>`;
 if(t==='savas')return `<p>To enter another realm's lands you must first <b>declare war</b> on it. You can do this from the Diplomacy screen, or by tapping one of the enemy's provinces.</p>
 <h3>Armies and garrisons</h3>
 <p>Your soldiers come in two kinds. A <b>garrison</b> guards its city and never moves; it is cheap to pay. A <b>field army</b> marches across the map under its banner, fights battles and takes cities. When you raise troops, they form a field army in that province, or join the army already there.</p>
 <p>The <b>banners</b> on the map are armies: the realm's arms on top, the number of troops below, and the commander's initials on a red seal. A gold frame means the army is yours; a red frame marks an enemy you are at war with. The small <b>tower plaques</b> are garrisons; they appear when you zoom in or select a province.</p>
 <h3>How to attack</h3>
 <ol><li>Tap the army's banner, or select its province and pick the army in the panel.</li><li>Tap the province you want to go to; the route appears on the map as a dashed gold line.</li><li>Look at the estimate in the panel and press <b>March</b> or <b>Attack</b>.</li></ol>
 <p>An army can only travel so far each season; the gold dots under its banner show how much movement it has left. The dashed blue lines on the map are sea routes crossed by ship. You can merge armies, split them or disband them.</p>
 <p><b>Commanders:</b> Each army can be led by a pasha, a prince or the ruler himself; the more stars he has, the more he helps in battle. Select an army and press <b>Change commander</b> to appoint a free general or bring over the commander of another army. If a commander dies or is taken prisoner, a free general takes his place at the end of the turn.</p>
 <p class="tip"><b>Shortcut:</b> Tap <b>Army</b> in the top bar to jump through your armies, or <b>Provinces</b> to jump through your provinces one by one. A forgotten island or a lost army is always one tap away.</p>
 <p>At the end of each turn, <b>Campaign news</b> briefly replays the season's marches and battles on the map; press <b>Skip</b> to pass over it. You can turn it off or speed it up under Menu → Display.</p>
 <h3>Who has the upper hand?</h3>
 <p>In battle, your army meets the city's defence. A city is not held by its soldiers alone: the townsfolk take up arms as well. In big cities and fortified places, these citizen defenders are many.</p>
 <ul><li><b>Fortress walls</b> strengthen the defenders; the higher the fortress, the harder the city is to take.</li>
 <li><b>Mountains</b> favour the defender, and desert helps a little too.</li>
 <li><b>Winter</b> campaigns are hard; an army attacking in winter is worn out.</li>
 <li><b>Cannon</b> bring walls down. The Ottomans get Urban's great guns in 1453; the other realms gain gunpowder artillery in 1460. Against an army with cannon, a fortress loses much of its old strength.</li>
 <li>Every battle has a little <b>luck</b> in it; an army that is only slightly stronger can still lose.</li></ul>
 <h3>After the battle</h3>
 <p><b>If you win</b>, the city is <b>occupied</b> by your army. You lose some of your men, but the stronger you were, the fewer you lose. Most of the enemy garrison is killed, the rest flee to neighbouring provinces, and your soldiers plunder the town. If you want to keep the province, demand it at the peace table (<b>Treaties</b>).</p>
 <p><b>Walled cities</b> are not taken at once: they are besieged (<b>Sieges</b>). A <b>field battle</b> is fought when two armies meet: walls do not count, but terrain, season, commander and the soldiers' morale do. The beaten army falls back to a neighbouring province, or is destroyed if it has nowhere to go.</p>
 <p><b>If you lose</b>, your army suffers heavy losses and the survivors fall back. The enemy loses some men too.</p>
 <p>The <b>Battle card</b> shows why a battle was won or lost: walls, terrain, winter, commander and the dice of fortune. You can open it again by tapping the lines in the Season Report.</p>
 <p>When a realm's <b>capital falls</b>, part of its treasury is plundered and it moves its capital to another city. A realm that loses its last city vanishes from history.</p>
 <p><b>Armies awaiting orders:</b> while you are at war, a small button under the top bar counts the armies that have not marched this season, and the End Turn button shows the number in its corner. Tap it to see them one by one. If some armies are meant to wait, you may still end the turn.</p>
 <p class="tip"><b>The Vizier's counsel:</b> Look at the estimate in the panel before you attack. If it says <b>"Overwhelming"</b>, attack with confidence; if it says <b>"Even odds"</b> or <b>"Risky"</b>, gather troops on the border for a few more seasons. Do not storm thick-walled cities before your cannon arrive, and not in winter.</p>`;
 if(t==='bina')return `<p>Tap one of your own provinces to open its panel: there you can raise troops and put up buildings. Each button shows its price; the gold leaves the treasury at once and the work is finished on the spot.</p>
 <h3>Develop</h3><p>Makes the city grow. A bigger city pays more tax, trains more soldiers, and more of its people take up arms when it is attacked. The bigger the city gets, the more the next round of development costs.</p>
 <h3>Market</h3><p>Merchants arrive and the city pays half as much tax again. Each province can have one. Early in the game it is the investment that pays for itself fastest.</p>
 <h3>Barracks</h3><p>Doubles the number of soldiers the province can train. Build them where you will raise many troops, close to the border.</p>
 <h3>Fortress</h3><p>Raises the walls. It strengthens the defence against attackers, and more of the townsfolk take up arms. It can be raised up to five levels, each dearer than the last. When a city changes hands, its walls take some damage.</p>
 <h3>Raising troops</h3><p>You can raise a thousand or five thousand soldiers at a time. This takes both gold and manpower. New troops stay in their province for that season and can only set out the next one.</p>
 <p class="tip"><b>The Vizier's counsel:</b> First markets in your rich cities, then fortresses in the border towns that face the enemy. Developing is costly but it lasts for ever; once your treasury is full, begin with your capital.</p>`;
 if(t==='diplo')return `<p>The <b>⚖ Diplomacy</b> button in the top bar shows every realm in the world: how strong they are, how they regard you, and where you stand with each other.</p>
 <h3>Relations</h3>
 <p>Every realm has its own attitude towards you. Realms of your own faith look on you more warmly, those of another faith more coldly; old friendships and old feuds from history add to this. You can win a realm's favour by sending gifts. Both grudges and friendships slowly fade back to how they were.</p>
 <h3>War and peace</h3>
 <ul><li><b>When you declare war</b>, that realm takes deep offence, and its allies join the war against you.</li>
 <li>When you ask for <b>peace</b>, the enemy accepts if it is losing the war, if it is clearly weaker than you, or if the war has dragged on too long.</li>
 <li><b>Tribute</b> can only be demanded once you have the enemy truly cornered. If it agrees, it pays you gold from its treasury in return for peace.</li>
 <li>After peace comes a <b>three-year truce</b>; during it neither side can declare war on the other again.</li></ul>
 <h3>Who is winning the war?</h3>
 <p>The Diplomacy screen shows a score for every war. Each battle you win, and above all each capital you take, tips the score in your favour; attacks you beat off count as well. When you are ahead, the enemy is readier to accept peace and pay tribute.</p>
 <h3>Alliances</h3>
 <p>A realm that likes you, or that is fighting the same enemy, will accept an offer of alliance. When someone declares war on you, your ally rushes to your aid.</p>
 <p class="tip"><b>The Vizier's counsel:</b> Before you go to war with a great neighbour, look at its allies. Nobody will declare war on you in the first year and a half of the game; use that time to prepare.</p>`;
 if(t==='olay')return `<h3>Unexpected events</h3>
 <p>In some seasons news reaches your palace and a decision is asked of you: a rich caravan arrives from the east, plague breaks out in a city, the harvest is bountiful, a famous scholar seeks your patronage, mercenaries offer their service, an earthquake shakes the walls, a harsh winter sets in, a newly conquered city rises in revolt, or a foreign envoy comes bearing gifts. Your choice affects your treasury, your army or your relations with your neighbours.</p>
 <h3>The course of history</h3>
 <ul><li><b>1453:</b> Urban, the Hungarian founder, casts great cannon for the Ottomans.</li>
 <li><b>1456:</b> A comet is seen in the sky.</li>
 <li><b>1460:</b> The age of gunpowder begins, and everyone uses cannon.</li>
 <li><b>1492:</b> The New World is discovered and Granada falls.</li>
 <li><b>1501:</b> Shah Ismail is crowned in Tabriz and the Safavid state is born.</li></ul>
 <h3>Goals</h3>
 <p>The <b>✦ Goals</b> screen holds historical tasks special to your realm: the conquest of Constantinople, the defence of Belgrade, the resistance of Krujë and more. Each one brings gold to the treasury and raises your score.</p>`;
 return `<p>The year is 1451. From the Balkans to the Caucasus, from the Danube to the Nile, 28 dynasties are vying for power. Choose one and rule your realm until the year 1531.</p>
 <h3>The goal</h3>
 <p>Rule half of the provinces on the map (${half} provinces) and you win at once. If you do not get there, the game ends in 1531 and the mightiest dynasty is named. Your score depends on how many cities you hold and how developed they are, on the goals you have completed and on your treasury. If you lose your last city, the game is over.</p>
 <h3>How a season passes</h3>
 <ol><li>Raise troops, put up buildings, march your armies, attack, and deal with your neighbours.</li>
 <li>When you are ready, press <b>End Turn</b>.</li>
 <li>The other realms make their moves; wars are fought and cities change hands.</li>
 <li>Taxes are collected, new soldiers are trained and armies rest.</li>
 <li>Now and then news reaches your palace and a decision is asked of you.</li></ol>
 <p>Each turn is one season; a year lasts four turns.</p>
 <h3>Using the map</h3>
 <ul><li>Tap one of your provinces to select it. Neighbours that glow <b>green</b> are your own land; those that glow <b>red</b> belong to an enemy you are at war with.</li>
 <li>Drag the map with your finger or the mouse; zoom with two fingers or the mouse wheel.</li>
 <li>The buttons at the bottom left switch between the 3D and 2D views.</li>
 <li>On a phone, province details sit in a drawer that slides up from the bottom. Tap its handle or pull it up to enlarge it, pull it down to close it.</li></ul>
 <h3>The Vizier's help</h3>
 <ul><li>Rest the pointer on a number, or tap it on a phone, and the vizier tells you where it comes from. Look at the Treasury to see your income and expenses item by item.</li>
 <li>The vizier's counsel appears at the bottom left (bottom right on a phone): he warns you when the treasury is draining, when your army sits idle or when the time for peace has come. Tap it and he will tell you what to do.</li>
 <li>In your first game the vizier guides you step by step. You can restart or turn off the lessons from the Menu.</li>
 <li>On the keyboard, <b>Space</b> ends the turn, <b>Esc</b> closes a window, and <b>1–4</b> open Diplomacy, Goals, the Chronicle and the State Ledger.</li></ul>
 <p class="tip">The game saves itself after every move. Even if you close it, <b>Continue saved game</b> on the opening screen takes you back to where you left off.</p>`;
}
function showGuide(t){t=GUIDE_TABS.some(g=>g[0]===t)?t:'genel';
 openModal(`<div class="guide"><div class="eyebrow">Age of Dynasties</div><h2>${lng('Oyun Rehberi','Game Guide')}</h2>
 <div class="gtabs" role="tablist">${GUIDE_TABS.map(([k,l])=>`<button class="gt${k===t?' on':''}" role="tab" aria-selected="${k===t}" data-act="guide" data-t="${k}">${l}</button>`).join('')}</div>
 <div class="gbody">${guideBody(t)}</div>
 <div class="foot"><button class="btn primary" data-act="mclose">${lng('Kapat','Close')}</button></div></div>`);}
ACTS.help=()=>showGuide('genel');
ACTS.guide=t=>showGuide(t.dataset.t);
/* Wave 2 guide tabs: sieges, treaties, coalitions, dynasties (plain words, no formulas). */
function guideW2(t){
 if(t==='kusatma')return EN?`<p>A city behind walls is not taken in a single blow. When your army marches into an enemy province that has walls and no enemy army inside, it <b>lays siege</b>: it pitches camp before the city and starts wearing the walls down.</p>
 <h3>How a siege goes</h3>
 <ul><li>A ring over the besieged city fills up season by season. When it is full, the walls fall and the city is <b>occupied</b> by your army.</li>
 <li>The higher the walls, the longer the siege. Mountain fortresses and great walls, such as those of Constantinople, hold out much longer.</li>
 <li><b>Cannon</b> shorten a siege a great deal, though they are hard to haul up a mountain. A big army digs faster than a small one.</li>
 <li>The besiegers lose men every season to sickness and desertion, and in <b>winter</b> even more.</li>
 <li>A strong garrison may <b>sally out</b> against the camp. If it wins, the siege loses ground.</li>
 <li>While the siege runs you may <b>storm</b> the walls; the more they have crumbled, the better your chances.</li></ul>
 <p>A town without walls does not need a siege: your army storms it at once, and if it wins, the town is occupied.</p>
 <h3>Occupied land</h3>
 <p>An occupied province does not yet belong to you. Half of its taxes come to you and your army may march through it, but its owner only gives it up <b>at the peace table</b>. Until then the enemy can win it back with a siege of its own.</p>
 <p>A realm whose every province is occupied has to surrender. A capital that stays occupied through a long war is taken outright. <b>Annexing:</b> hold an occupied province for four turns and you can make it yours for good, even while the war goes on: tap the province and press <b>Annex</b> (capitals excepted).</p>
 <h3>Relieving a siege</h3>
 <p>If an enemy army besieges one of your cities, attack it with an army of your own. Win the field battle and the besiegers fall back; the progress they made is lost.</p>
 <p class="tip"><b>The Vizier's counsel:</b> Never leave a besieging army alone. While your main army sits before a great city, keep a second army at home: the enemy likes to walk into lands left undefended. And do not begin a long siege at the start of winter.</p>`
 :`<p>Surlu bir şehir tek hamlede alınmaz. Ordun surları olan ve içinde düşman ordusu bulunmayan bir düşman eyaletine girince <b>kuşatma</b> başlar: şehrin önüne kamp kurar ve surları yıpratmaya koyulur.</p>
 <h3>Kuşatma nasıl ilerler?</h3>
 <ul><li>Kuşatılan şehrin üstündeki halka her mevsim biraz daha dolar. Halka dolunca surlar düşer ve şehir ordunun <b>işgaline</b> girer.</li>
 <li>Surlar ne kadar yüksekse kuşatma o kadar uzun sürer. Dağ kaleleri ve Konstantiniyye gibi büyük surlar çok daha uzun direnir.</li>
 <li><b>Toplar</b> kuşatmayı çok kısaltır, ama dağa zor çıkarılır. Büyük bir ordu küçük bir ordudan daha hızlı kazar.</li>
 <li>Kuşatan ordu her mevsim hastalık ve firar yüzünden asker yitirir; <b>kışın</b> daha da çok.</li>
 <li>Güçlü bir garnizon kampa karşı <b>çıkış</b> yapabilir. Kazanırsa kuşatma geriler.</li>
 <li>Kuşatma sürerken surlara <b>hücum</b> edebilirsin; surlar ne kadar yıkıldıysa şansın o kadar yüksektir.</li></ul>
 <p>Surları olmayan bir kasaba kuşatılmaz: ordun hemen saldırır, kazanırsa kasaba işgal edilir.</p>
 <h3>İşgal altındaki topraklar</h3>
 <p>İşgal ettiğin eyalet henüz senin değildir. Vergisinin yarısı sana gelir ve ordun oradan geçebilir, ama sahibi onu ancak <b>barış masasında</b> bırakır. O zamana kadar düşman kendi kuşatmasıyla onu geri alabilir.</p>
 <p>Bütün eyaletleri işgal edilen devlet teslim olmak zorunda kalır. Uzun süren bir savaşta işgal altında kalan başkent de doğrudan alınır. <b>İlhak:</b> İşgal ettiğin bir eyaleti dört tur elinde tutarsan, savaş sürerken bile eyalete dokunup <b>İlhak et</b>'e basarak kalıcı olarak topraklarına katabilirsin (başkentler hariç).</p>
 <h3>Kuşatmayı kırmak</h3>
 <p>Düşman ordusu şehirlerinden birini kuşatıyorsa, kendi ordunla ona saldır. Meydan muharebesini kazanırsan kuşatanlar geri çekilir ve o ana kadarki emekleri boşa gider.</p>
 <p class="tip"><b>Vezirin öğüdü:</b> Kuşatan orduyu yalnız bırakma. Ana ordun büyük bir şehrin önündeyken memlekette ikinci bir ordu tut: düşman boş kalan topraklara girmeyi sever. Kışın başında da uzun bir kuşatmaya girişme.</p>`;
 if(t==='antlasma')return EN?`<p>A war ends at the <b>peace table</b>. There you write down what you want from your enemy: provinces, gold, or freedom for a nation it once conquered. Every item has a price in <b>war score</b>, and the enemy signs only if the whole basket is not dearer than what the war has earned you.</p>
 <h3>What makes the enemy give in?</h3>
 <ul><li><b>War score:</b> battles won, walls taken and capitals occupied push it up; lost battles and sieges push it down.</li>
 <li><b>War exhaustion:</b> every season of war, every thousand men lost and every province occupied wears a realm down. A tired realm gives more.</li>
 <li><b>Weakness:</b> a realm far weaker than you is readier to yield.</li></ul>
 <h3>What things cost</h3>
 <ul><li>A province you <b>occupy</b> is cheap; one you have not taken costs twice as much. A rich province and a capital cost more.</li>
 <li>The province your war was declared for (your <b>claim</b>) costs only half.</li>
 <li><b>Gold</b> is cheap but the enemy can only pay what is in its treasury.</li>
 <li><b>Releasing a nation</b> gives an old realm its historical lands back, and weakens your enemy for good.</li></ul>
 <p>When peace is signed, every occupation between the two of you ends: what you did not demand goes back to its owner. Then comes a <b>three-year truce</b>.</p>
 <h3>Envoys</h3>
 <p>An enemy that is losing may send an <b>envoy</b> to ask for peace. A chip under the top bar tells you an envoy is waiting; the offer holds for two seasons. If you are the one ahead, do not wait for envoys: go to the Divan and set your own terms.</p>
 <p class="tip"><b>The Vizier's counsel:</b> Occupy first, bargain later. A basket full of provinces you already hold costs little war score. If the enemy refuses, take one province out and ask again.</p>`
 :`<p>Savaş <b>barış masasında</b> biter. Orada düşmanından ne istediğini yazarsın: eyaletler, altın ya da bir zamanlar fethettiği bir milletin özgürlüğü. Her kalemin <b>savaş skoru</b> olarak bir bedeli vardır; düşman, istediklerinin toplamı savaşta kazandığından pahalı değilse imzalar.</p>
 <h3>Düşmanı ne yola getirir?</h3>
 <ul><li><b>Savaş skoru:</b> kazanılan muharebeler, düşen surlar ve işgal edilen başkentler skoru yükseltir; kaybedilen muharebeler ve kuşatmalar düşürür.</li>
 <li><b>Savaş yorgunluğu:</b> savaşın her mevsimi, kaybedilen her bin asker ve işgal edilen her eyalet bir devleti yıpratır. Yorgun devlet daha çok verir.</li>
 <li><b>Zayıflık:</b> senden çok zayıf bir devlet boyun eğmeye daha yatkındır.</li></ul>
 <h3>Neyin bedeli ne?</h3>
 <ul><li><b>İşgal ettiğin</b> eyalet ucuzdur; almadığın bir eyalet iki kat pahalıdır. Zengin eyaletler ve başkentler daha pahalıdır.</li>
 <li>Savaşı uğruna açtığın eyalet (<b>hak iddian</b>) yarı fiyatınadır.</li>
 <li><b>Altın</b> ucuzdur ama düşman hazinesinde ne varsa ancak onu ödeyebilir.</li>
 <li><b>Bir milleti serbest bırakmak</b> eski bir devlete tarihî topraklarını geri verir ve düşmanını kalıcı olarak zayıflatır.</li></ul>
 <p>Barış imzalanınca aranızdaki bütün işgaller sona erer: istemediğin topraklar sahibine döner. Ardından <b>üç yıl ateşkes</b> gelir.</p>
 <h3>Elçiler</h3>
 <p>Kaybeden bir düşman barış istemek için <b>elçi</b> gönderebilir. Üst çubuğun altındaki küçük düğme bekleyen bir elçi olduğunu haber verir; teklif iki mevsim geçerlidir. Öndeysen elçi bekleme: Divan'a git ve şartlarını kendin koy.</p>
 <p class="tip"><b>Vezirin öğüdü:</b> Önce işgal et, sonra pazarlık yap. Zaten elinde tuttuğun eyaletlerle dolu bir sepet az savaş skoru tutar. Düşman reddederse bir eyaleti çıkar ve yeniden iste.</p>`;
 if(t==='koalisyon')return EN?`<p>The world watches every conquest. Each province you take makes your neighbours more <b>uneasy</b>; taking land from a realm of your own faith frightens them even more, and a capital most of all. Land gained at the peace table counts a little less than land taken by storm.</p>
 <h3>The coalition</h3>
 <p>When the fear grows too great, your frightened neighbours band together into a <b>coalition</b> and declare war on you all at once. In the first seasons of a coalition war its members do not make a separate peace. The State Ledger shows how uneasy the world is about you; the vizier warns you before it is too late.</p>
 <p>Fear fades slowly in years of peace. Once it has faded and the fighting is over, the coalition breaks up, and it does not come back at once.</p>
 <h3>The crusade</h3>
 <p>When a Muslim realm grows fearsome to the Christian world, the Pope may call a <b>crusade</b>. The Christian realms that border it, and those who answer such calls, grow eager for war against it for a few years.</p>
 <h3>The same rules for everyone</h3>
 <p>The other realms live by these rules too. A neighbour that swallows its neighbours quickly will soon face a coalition of its own, and that may be your chance.</p>
 <p class="tip"><b>The Vizier's counsel:</b> Conquer in waves. After a great war, rest a few years: develop your cities, fill the treasury, and let the fear fade before the next campaign.</p>`
 :`<p>Dünya her fethi izler. Aldığın her eyalet komşularını biraz daha <b>tedirgin</b> eder; aynı dinden bir devletin toprağını almak onları daha çok korkutur, bir başkenti almak hepsinden çok. Barış masasında kazanılan toprak, kılıçla alınandan biraz daha az korkutur.</p>
 <h3>Koalisyon</h3>
 <p>Korku çok büyüyünce tedirgin komşular bir <b>koalisyon</b> kurar ve sana hep birlikte savaş açar. Koalisyon savaşının ilk mevsimlerinde üyeleri ayrı barış yapmaz. Dünyanın senden ne kadar tedirgin olduğunu Devlet defteri gösterir; iş işten geçmeden vezir de seni uyarır.</p>
 <p>Barış yıllarında korku yavaş yavaş söner. Korku sönüp çarpışmalar bitince koalisyon dağılır ve hemen yeniden kurulmaz.</p>
 <h3>Haçlı Seferi</h3>
 <p>Bir Müslüman devlet Hristiyan dünyası için korkutucu hâle gelince Papa <b>Haçlı Seferi</b> çağrısı yapabilir. Ona komşu olan ve bu tür çağrılara kulak veren Hristiyan devletler birkaç yıl boyunca ona karşı savaşa hevesli olur.</p>
 <h3>Herkes için aynı kurallar</h3>
 <p>Öteki devletler de bu kurallarla yaşar. Komşularını hızla yutan bir devlet yakında kendi koalisyonuyla karşılaşır; bu senin fırsatın olabilir.</p>
 <p class="tip"><b>Vezirin öğüdü:</b> Fetihleri dalga dalga yap. Büyük bir savaştan sonra birkaç yıl dinlen: şehirlerini imar et, hazineyi doldur ve bir sonraki seferden önce korkunun sönmesini bekle.</p>`;
 if(t==='hanedan')return EN?`<p>Every realm is ruled by a living <b>ruler</b>. Rulers grow old, fall ill and die, and history does not wait for them.</p>
 <h3>Heirs and succession</h3>
 <ul><li>The <b>heir</b> is usually the ruler's eldest son. When the ruler dies, the throne passes to him and the realm carries on.</li>
 <li>If the new ruler is still a child, a <b>regent</b> governs until he comes of age.</li>
 <li>In elective realms such as Venice, the Papacy, the Knights of Rhodes or the Mamluk Sultanate, a new ruler is elected; elsewhere a related house may be invited to the throne.</li>
 <li>A realm without an heir falls into a <b>succession crisis</b>: a stranger takes the throne, and you are asked how to settle it, with gold or with patience.</li></ul>
 <h3>Commanders</h3>
 <p>Pashas, princes and the ruler himself can lead armies. The more stars a commander has, the more he helps in battle and in the field. Commanders age and die too, and a commander may fall or be captured when his army is beaten.</p>
 <p>The State Ledger shows your dynasty: the ruler, the heir and your commanders.</p>
 <p class="tip"><b>The Vizier's counsel:</b> Do not risk an old ruler without an heir in the front line. And keep a free pasha at hand: an army without a commander fights worse.</p>`
 :`<p>Her devleti yaşayan bir <b>hükümdar</b> yönetir. Hükümdarlar yaşlanır, hastalanır ve ölür; tarih onları beklemez.</p>
 <h3>Veliaht ve tahtın geçişi</h3>
 <ul><li><b>Veliaht</b> çoğunlukla hükümdarın en büyük oğludur. Hükümdar ölünce taht ona geçer ve devlet yoluna devam eder.</li>
 <li>Yeni hükümdar henüz çocuksa, reşit olana kadar devleti bir <b>naip</b> yönetir.</li>
 <li>Venedik, Papalık, Rodos Şövalyeleri ya da Memlükler gibi seçimle yönetilen devletlerde yeni hükümdar seçilir; başka yerlerde tahta akraba bir hanedan davet edilebilir.</li>
 <li>Varisi olmayan devlet bir <b>taht bunalımına</b> düşer: tahta bir yabancı çıkar ve sana bunalımı altınla mı sabırla mı çözeceğin sorulur.</li></ul>
 <h3>Komutanlar</h3>
 <p>Paşalar, şehzadeler ve hükümdarın kendisi ordu yönetebilir. Komutanın yıldızı ne kadar çoksa muharebede ve seferde o kadar işe yarar. Komutanlar da yaşlanır ve ölür; ordusu yenilen bir komutan düşebilir ya da esir alınabilir.</p>
 <p>Devlet defteri hanedanını gösterir: hükümdarı, veliahtı ve komutanlarını.</p>
 <p class="tip"><b>Vezirin öğüdü:</b> Varisi olmayan yaşlı bir hükümdarı cephenin önüne sürme. Elinde boşta bir paşa da tut: komutansız ordu daha kötü savaşır.</p>`;
 return '';}
