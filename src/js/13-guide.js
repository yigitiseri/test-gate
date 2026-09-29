/* ---------------- guide ---------------- */
const GUIDE_TABS=[['genel','Genel'],['para','Para'],['savas','Savaş'],['bina','Binalar'],['diplo','Diplomasi'],['olay','Olaylar']];
function guideBody(t){
 const half=Math.ceil(NP*.5);
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
 if(t==='savas')return `<p>Bir devletin toprağına girmek için önce ona <b>savaş ilan etmelisin</b>. Savaş ilanı Diplomasi ekranından ya da düşman eyaletine dokunarak yapılır. Ordular sadece komşu eyaletlere yürüyebilir; haritadaki kesik çizgiler gemiyle geçilen deniz yollarıdır.</p>
 <h3>Nasıl saldırılır?</h3>
 <ol><li>Kendi eyaletine dokun.</li><li>Kırmızıyla parlayan bir düşman eyaletine dokun.</li><li>Kaydırıcıyla kaç asker göndereceğini seç.</li><li>Paneldeki tahmine bak ve <b>Saldır</b>'a bas.</li></ol>
 <p>Bir asker her mevsim sadece bir kez yürüyebilir. O mevsim toplanan askerler de ancak bir sonraki mevsim yola çıkar.</p>
 <h3>Kimin gücü ağır basar?</h3>
 <p>Muharebede senin ordunla şehrin savunması karşılaşır. Şehri sadece oradaki askerler korumaz; kasabanın halkı da silaha sarılır. Büyük şehirlerde ve kaleli yerlerde bu halk savunması kalabalıktır.</p>
 <ul><li><b>Kale surları</b> savunmacıları güçlendirir; kale seviyesi yükseldikçe şehri almak zorlaşır.</li>
 <li><b>Dağlar</b> savunanın işine yarar, çöl de biraz yarar.</li>
 <li><b>Kış</b> seferleri zordur; kışın saldıran ordu yorgun düşer.</li>
 <li><b>Toplar</b> surları yıkar. Osmanlı 1453'te Urban'ın dev toplarını alır, diğer devletler 1460'ta barutlu toplara kavuşur. Toplu bir ordunun karşısında kale eski gücünü büyük ölçüde kaybeder.</li>
 <li>Her muharebede biraz da <b>şans</b> vardır; kıl payı üstün bir ordu kaybedebilir.</li></ul>
 <h3>Muharebeden sonra</h3>
 <p><b>Kazanırsan</b> eyalet senin olur. Askerlerinin bir kısmı düşer ama ne kadar üstünsen o kadar az kayıp verirsin. Düşman garnizonunun çoğu ölür, kalanlar komşu eyaletlerine kaçar. Surlar hasar görür ve askerlerin şehri yağmalar.</p>
 <p><b>Kaybedersen</b> ordunun ağır kayıplar verir, sağ kalanlar geldikleri yere geri döner. Düşman da biraz asker kaybeder.</p>
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
function showGuide(t){t=GUIDE_TABS.some(g=>g[0]===t)?t:'genel';
 openModal(`<div class="guide"><div class="eyebrow">Age of Dynasties</div><h2>Oyun Rehberi</h2>
 <div class="gtabs" role="tablist">${GUIDE_TABS.map(([k,l])=>`<button class="gt${k===t?' on':''}" role="tab" aria-selected="${k===t}" data-act="guide" data-t="${k}">${l}</button>`).join('')}</div>
 <div class="gbody">${guideBody(t)}</div>
 <div class="foot"><button class="btn primary" data-act="mclose">Kapat</button></div></div>`);}
ACTS.help=()=>showGuide('genel');
ACTS.guide=t=>showGuide(t.dataset.t);
