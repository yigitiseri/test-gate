/* ---------------- guide ---------------- */
const GUIDE_TABS=[['genel',lng('Genel','Basics')],['para',lng('Para','Money')],['savas',lng('Savaş','War')],['bina',lng('Binalar','Buildings')],['diplo',lng('Diplomasi','Diplomacy')],['olay',lng('Olaylar','Events')]];
function guideBody(t){
 const half=Math.ceil(NP*.5);
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
 <p><b>Kazanırsan</b> eyalet senin olur. Askerlerinin bir kısmı düşer ama ne kadar üstünsen o kadar az kayıp verirsin. Düşman garnizonunun çoğu ölür, kalanlar komşu eyaletlerine kaçar. Surlar hasar görür ve askerlerin şehri yağmalar.</p>
 <p><b>Kaybedersen</b> ordunun ağır kayıplar verir, sağ kalanlar geri çekilir. Düşman da biraz asker kaybeder.</p>
 <p><b>Muharebe kartı</b> savaşın neden kazanıldığını ya da kaybedildiğini gösterir: kale, arazi, kış, komutan ve talih zarları. Mevsim raporundaki satırlara dokunarak yeniden açabilirsin.</p>
 <p>Bir devletin <b>başkenti düşerse</b> hazinesinin bir kısmı yağmalanır ve başkentini başka bir şehre taşır. Son şehrini de kaybeden devlet tarihten silinir.</p>
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
 <p><b>If you win</b>, the province is yours. You lose some of your men, but the stronger you were, the fewer you lose. Most of the enemy garrison is killed and the rest flee to neighbouring provinces. The walls are damaged and your soldiers plunder the city.</p>
 <p><b>If you lose</b>, your army suffers heavy losses and the survivors fall back. The enemy loses some men too.</p>
 <p>The <b>Battle card</b> shows why a battle was won or lost: walls, terrain, winter, commander and the dice of fortune. You can open it again by tapping the lines in the Season Report.</p>
 <p>When a realm's <b>capital falls</b>, part of its treasury is plundered and it moves its capital to another city. A realm that loses its last city vanishes from history.</p>
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
