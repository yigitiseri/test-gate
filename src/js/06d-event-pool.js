/* =====================================================================
   EVENT POOL (Track C): random events for the player's realm. Every choice
   costs something; none is a free "take the gold". Gold scales with the
   realm's development without barracks (evDev, bug B5).
   ===================================================================== */
/** Add troops the way the current rules allow: into an army when field armies exist (Track B), else the garrison. */
function evTroops(f,i,n){n=Math.round(n/100)*100;if(n<=0)return;const F=S.fac[f];
 if(typeof armyCap==='function'){const a=armyAt(i,f)[0];if(a){a.n+=n;return;}if(armyList(f).length<armyCap(f)){armyCreate(f,i,n);return;}F.mp+=n;return;}
 S.prov[i].t+=n;}
const evCut=(i,fr)=>{const p=S.prov[i];p.t=Math.max(0,Math.round(p.t*(1-fr)/100)*100);};
const evUnrest=(i,n)=>{S.prov[i].un=Math.max(S.prov[i].un,n);};
const evPay=(F,v)=>{F.gold=Math.max(0,F.gold-v);};
const evOthers=(ctx,n)=>{const L=ctx.mine.filter(i=>i!==ctx.cap);const out=[];const r=L.slice();for(let k=0;k<n&&r.length;k++)out.push(r.splice(Math.floor(ctx.rng()*r.length),1)[0]);return out;};
const evNaval=['VEN','GEN','RHO','CYP','ARA','PAP','HAF','OSM','MAM','BYZ','TRB','KRM'];
const evTurkish=['OSM','KAR','CAN','DUL','AKK','KKY','SAF'];

EVENTS.push(
 {id:'kervan',w:3,cd:20,build:c=>{const a=c.mid,k=Math.round(a*.6),[o]=evOthers(c,1);
  return {t:c.isM?lng('İpek Yolu Kervanı','A Silk Road Caravan'):lng('Levanten Tüccarlar','Levantine Merchants'),d:c.isM?lng(`Doğudan gelen zengin bir kervan ${c.capn} pazarında konakladı. Gümrük emini ne kadar vergi alınacağını soruyor.`,`A rich caravan from the East has stopped at the market of ${c.capn}. The customs officer asks how much duty to take.`):lng(`Venedikli ve Cenevizli tüccarlar ${c.capn} limanında ticaret izni istiyor.`,`Venetian and Genoese merchants ask leave to trade in the port of ${c.capn}.`),
   ch:[{l:lng(`Ağır gümrük koy (+${a} altın; tüccarlar küser, ${c.capn}${o!=null?' ve '+PD[o].name:''} 3 tur huzursuz)`,`Impose heavy duties (+${a} gold; the merchants take offence, unrest in ${c.capn}${o!=null?' and '+PD[o].name:''} for 3 turns)`),f:()=>{c.F.gold+=a;evUnrest(c.cap,3);if(o!=null)evUnrest(o,3);}},
    {l:lng(`Kervansaray yaptır (−${k} altın; ${c.capn} gelişimi +1)`,`Build a caravanserai (−${k} gold; ${c.capn} development +1)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);const p=S.prov[c.cap];if(p.dev<12)p.dev++;}}]};}},
 {id:'veba',w:2,cd:24,build:c=>{const q=c.small+10;
  return {t:lng('Veba Salgını','Plague'),d:lng(`${c.pn} eyaletinde kara ölüm baş gösterdi. Hekimler şehrin kapılarının kapatılmasını istiyor.`,`The Black Death has broken out in ${c.pn}. The physicians want the city gates shut.`),
   ch:[{l:lng(`Karantina uygula (−${q} altın; ${c.pn} garnizonu −10%)`,`Impose a quarantine (−${q} gold; ${c.pn} garrison −10%)`),dis:c.F.gold<q,f:()=>{evPay(c.F,q);evCut(c.p,.1);}},
    {l:lng(`Kaderine bırak (${c.pn} gelişimi −1, garnizonu −35%)`,`Leave it to fate (${c.pn} development −1, garrison −35%)`),f:()=>{const p=S.prov[c.p];p.dev=Math.max(1,p.dev-1);evCut(c.p,.35);}}]};}},
 {id:'hasat',w:3,cd:20,build:c=>{const a=c.mid,m=Math.max(1000,Math.round(evDev(c.f)*80/100)*100),k=Math.round(a*.4);
  return {t:lng('Bereketli Hasat','A Bountiful Harvest'),d:lng('Ambarlar doldu. Fazla buğday satılabilir ya da köylerden gelen gençler beslenip orduya yazılabilir.','The granaries are full. The surplus wheat can be sold, or it can feed the village youths who come to join the army.'),
   ch:[{l:lng(`Fazlayı tüccarlara sat (+${a} altın; köyler kışa hazırlıksız, insan gücü −15%)`,`Sell the surplus to merchants (+${a} gold; the villages face winter unprepared, manpower −15%)`),f:()=>{c.F.gold+=a;c.F.mp=Math.round(c.F.mp*.85);}},
    {l:lng(`Gönüllüleri yaz (+${fmtK(m)} insan gücü; teçhizatları −${k} altın)`,`Enlist the volunteers (+${fmtK(m)} manpower; their gear costs −${k} gold)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);c.F.mp+=m;}}]};}},
 {id:'alim',w:2,cd:24,build:c=>{const k=30+c.small;
  return {t:c.isM?lng('Gezgin Âlim','A Wandering Scholar'):lng('Hümanist Bilgin','A Humanist Scholar'),d:c.isM?lng('Semerkant\'tan gelen ünlü bir âlim başkentinde medrese açmak istiyor.','A famous scholar from Samarkand wishes to open a madrasa in your capital.'):lng('İtalya\'dan gelen bir bilgin başkentinde kütüphane kurmak istiyor.','A scholar from Italy wishes to found a library in your capital.'),
   ch:[{l:lng(`Himaye et (−${k} altın; ${c.capn} gelişimi +1)`,`Become the patron (−${k} gold; ${c.capn} development +1)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);const p=S.prov[c.cap];if(p.dev<12)p.dev++;}},
    {l:lng('Nazikçe geri çevir (hazine korunur, bilgin başka bir saraya gider)','Politely decline (the treasury is spared, the scholar goes to another court)')}]};}},
 {id:'paralı',w:2,cd:20,build:c=>{const k=40+Math.round(evDev(c.f)*.2),n=3000;
  return {t:c.isM?lng('Akıncı Beyleri','Akinji Beys'):lng('Paralı Askerler','Mercenaries'),d:c.isM?lng('Sınır boylarından akıncı beyleri hizmet teklif ediyor.','Raider beys from the frontier march offer their service.'):lng('Bir condottiere bölüğü ücret karşılığı hizmet teklif ediyor.','A company of condottieri offers its service for pay.'),
   ch:[{l:lng(`Kirala (−${k} altın; ${c.capn} yakınına +${fmtK(n)} asker)`,`Hire them (−${k} gold; +${fmtK(n)} troops near ${c.capn})`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);evTroops(c.f,c.cap,n);}},
    {l:lng('Gerek yok (hazine korunur)','No need (the treasury is spared)')}]};}},
 {id:'deprem',w:1,cd:30,build:c=>{const q=20+c.small,p=S.prov[c.p];
  return {t:lng('Deprem','Earthquake'),d:lng(`${c.pn} sarsıldı; ${p.fort>0?'kale burçlarında çatlaklar var':'evler ve çarşı yıkıldı'}.`,`${c.pn} has been shaken; ${p.fort>0?'the fortress towers are cracked':'houses and the bazaar lie in ruins'}.`),
   ch:[{l:lng(`Hemen onar (−${q} altın)`,`Repair at once (−${q} gold)`),dis:c.F.gold<q,f:()=>{evPay(c.F,q);}},
    {l:p.fort>0?lng(`Bekle (${c.pn} kalesi −1)`,`Wait (${c.pn} walls −1)`):lng(`Bekle (${c.pn} gelişimi −1)`,`Wait (${c.pn} development −1)`),f:()=>{const x=S.prov[c.p];if(x.fort>0)x.fort--;else x.dev=Math.max(1,x.dev-1);}}]};}},
 {id:'kis',w:(S)=>S.turn%4===3?3:0,cd:20,build:c=>{const q=15+c.small;
  return {t:lng('Sert Kış','A Harsh Winter'),d:lng('Yollar karla kapandı, köylerde kıtlık var.','Snow has closed the roads and the villages are going hungry.'),
   ch:[{l:lng(`Ambarları aç (−${q} altın)`,`Open the granaries (−${q} gold)`),dis:c.F.gold<q,f:()=>{evPay(c.F,q);}},{l:lng('Dayanın (insan gücü −30%)','Endure it (manpower −30%)'),f:()=>{c.F.mp=Math.round(c.F.mp*.7);}}]};}},
 {id:'ayaklanma',w:4,cd:18,req:(S,f)=>facProvs(f).some(i=>S.prov[i].un>0),build:c=>{if(!c.un.length)return null;const q=c.pick(c.un),k=30+c.small;
  return {t:lng('Ayaklanma','Revolt'),d:lng(`${PD[q].name} halkı ağır vergilere karşı ayaklandı.`,`The people of ${PD[q].name} have risen against heavy taxes.`),
   ch:[{l:lng(`Bastır (${PD[q].name} garnizonu −25%, huzursuzluk kısalır)`,`Crush it (${PD[q].name} garrison −25%, the unrest is shortened)`),f:()=>{evCut(q,.25);S.prov[q].un=Math.max(0,S.prov[q].un-3);}},
    {l:lng(`Vergi affı ilan et (−${k} altın; huzursuzluk biter)`,`Declare a tax pardon (−${k} gold; the unrest ends)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);S.prov[q].un=0;}}]};}},
 {id:'elci',w:2,cd:20,req:(S,f)=>FK.some(g=>g!==f&&alive(g)&&!atWar(f,g)),build:c=>{const L=FK.filter(g=>g!==c.f&&alive(g)&&!atWar(c.f,g));if(!L.length)return null;const g=c.pick(L),a=20+c.small,k=20;
  return {t:lng(`${FAC[g].s} Elçisi`,`An Envoy from ${FAC[g].s}`),d:lng(`${FAC[g].n} elçisi, ${rulerName(g)} adına hediyelerle sarayına geldi. Görgü kuralları karşılık vermeni gerektiriyor.`,`An envoy of the ${FAC[g].n} has come to your court with gifts in the name of ${rulerName(g)}. Custom demands that you give something in return.`),
   ch:[{l:lng(`Hediyeleri al, karşılık verme (+${a} altın; ${FAC[g].s} ile ilişki −10)`,`Keep the gifts and give nothing back (+${a} gold; relations with ${FAC[g].s} −10)`),f:()=>{c.F.gold+=a;addOp(c.f,g,-10);}},
    {l:lng(`Cömertçe karşılık ver (−${k} altın; ${FAC[g].s} ile ilişki +25)`,`Answer generously (−${k} gold; relations with ${FAC[g].s} +25)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);addOp(c.f,g,25);}}]};}},
 {id:'novobrdo',w:3,cd:30,req:(S,f)=>S.prov[PK.novobirda].o===f,build:c=>{const i=PK.novobirda,a=c.mid+20,k=25;
  return {t:lng('Novobırda Gümüş Madenleri','The Silver Mines of Novo Brdo'),d:lng('Sakson ustaların işlettiği Novobırda madenleri Balkanların en zengin gümüşünü çıkarıyor. Hazine madeni doğrudan işletmek istiyor.','Worked by Saxon miners, the mines of Novo Brdo yield the richest silver in the Balkans. The treasury wants to run the mines itself.'),
   ch:[{l:lng(`Madeni devlete bağla (+${a} altın; Novobırda 4 tur huzursuz)`,`Take the mines for the state (+${a} gold; unrest in Novo Brdo for 4 turns)`),f:()=>{c.F.gold+=a;evUnrest(i,4);}},
    {l:lng(`Madencilere imtiyaz ver (−${k} altın; Novobırda gelişimi +1)`,`Grant the miners privileges (−${k} gold; Novo Brdo development +1)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);if(S.prov[i].dev<12)S.prov[i].dev++;}}]};}},
 {id:'tolfa',w:3,cd:30,req:(S,f)=>S.prov[PK.roma].o===f&&chYear()>=1462,build:c=>{const a=c.mid+30;
  return {t:lng('Tolfa\'nın Şap Madeni','The Alum Mine of Tolfa'),d:lng('Roma yakınındaki Tolfa\'da zengin bir şap yatağı bulundu. Kumaş boyacılığının vazgeçilmezi şap, şimdiye dek Türk topraklarından geliyordu.','A rich bed of alum has been found at Tolfa near Rome. Alum, which cloth dyers cannot do without, has until now come from Turkish lands.'),
   ch:[{l:lng(`Tekel ilan et (+${a} altın; Venedik ve Ceneviz ile ilişki −15)`,`Declare a monopoly (+${a} gold; relations with Venice and Genoa −15)`),f:()=>{c.F.gold+=a;['VEN','GEN'].forEach(g=>{if(g!==c.f&&alive(g))addOp(c.f,g,-15);});}},
    {l:lng(`Madeni bankerlere kirala (+${Math.round(a/2)} altın; ilişkiler bozulmaz)`,`Lease the mine to bankers (+${Math.round(a/2)} gold; relations stay as they are)`),f:()=>{c.F.gold+=Math.round(a/2);}}]};}},
 {id:'sapboykot',w:2,cd:30,req:(S,f)=>FAC[f].rel==='Katolik'&&f!=='PAP'&&alive('PAP')&&chYear()>=1463,build:c=>{const a=c.small+10,k=c.small;
  return {t:lng('Türk Şapı Yasağı','The Ban on Turkish Alum'),d:lng('Papa, Hıristiyan tüccarların Türk şapı almasını yasakladı ve Tolfa şapını öneriyor. Ama Türk şapı çok daha ucuz.','The Pope has forbidden Christian merchants to buy Turkish alum and commends the alum of Tolfa instead. But Turkish alum is far cheaper.'),
   ch:[{l:lng(`Yasağa uy (−${k} altın; Papalık ile ilişki +20)`,`Obey the ban (−${k} gold; relations with the Papacy +20)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);addOp(c.f,'PAP',20);}},
    {l:lng(`Ucuz Türk şapını al (+${a} altın; Papalık ile ilişki −20)`,`Buy the cheap Turkish alum (+${a} gold; relations with the Papacy −20)`),f:()=>{c.F.gold+=a;addOp(c.f,'PAP',-20);}}]};}},
 {id:'bedreddin',w:2,cd:30,req:(S,f)=>evTurkish.includes(f),build:c=>{const k=20+c.small,m=Math.max(1000,Math.round(evDev(c.f)*40/100)*100);
  return {t:lng('Bedreddin\'in Mirası','The Legacy of Bedreddin'),d:lng(`${c.pn} köylerinde Şeyh Bedreddin\'in müritleri malın ortak olduğunu vaaz ediyor. Kadılar tedirgin, köylüler dervişlere akın ediyor.`,`In the villages of ${c.pn} the followers of Sheikh Bedreddin preach that all goods are held in common. The judges are uneasy, and the peasants flock to the dervishes.`),
   ch:[{l:lng(`Şeyhleri sürgün et (${c.pn} 4 tur huzursuz)`,`Exile the sheikhs (unrest in ${c.pn} for 4 turns)`),f:()=>{evUnrest(c.p,4);}},
    {l:lng(`Tekkelere vakıf bağla (−${k} altın; dervişler gaziler arasına katılır, +${fmtK(m)} insan gücü)`,`Endow the dervish lodges (−${k} gold; the dervishes join the ghazis, +${fmtK(m)} manpower)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);c.F.mp+=m;}}]};}},
 {id:'birlik',w:4,cd:40,once:1,req:(S,f)=>FAC[f].rel==='Ortodoks'&&chYear()<1461,build:c=>{const m=Math.max(1000,Math.round(evDev(c.f)*60/100)*100);
  return {t:lng('Kilise Birliği Çekişmesi','The Quarrel over Church Union'),d:lng('Floransa\'da imzalanan Kilise Birliği halkı ikiye böldü. Latinler yardım için Birliğin ilanını bekliyor; keşişler ve halk ise "Latin külahındansa Türk sarığı yeğdir" diyor.','The Church Union signed at Florence has split the people in two. The Latins will send help only once the Union is proclaimed, but the monks and the people say: "Better the Turkish turban than the Latin mitre."'),
   ch:[{l:lng(`Birliği ilan et (Venedik ve Papalık ile ilişki +20; ${c.capn} 4 tur huzursuz)`,`Proclaim the Union (relations with Venice and the Papacy +20; unrest in ${c.capn} for 4 turns)`),f:()=>{['VEN','PAP'].forEach(g=>{if(alive(g))addOp(c.f,g,20);});evUnrest(c.cap,4);}},
    {l:lng(`Ortodoks halkın yanında dur (Venedik ve Papalık ile ilişki −15; +${fmtK(m)} gönüllü insan gücü)`,`Stand with the Orthodox people (relations with Venice and the Papacy −15; +${fmtK(m)} volunteer manpower)`),f:()=>{['VEN','PAP'].forEach(g=>{if(alive(g))addOp(c.f,g,-15);});c.F.mp+=m;}}]};}},
 {id:'bahsis',w:0,cd:0,req:(S,f)=>f==='OSM',build:c=>{const k=Math.max(30,Math.round(evDev(c.f)*.4)),r=chRuler(c.f);
  return {t:lng('Cülus Bahşişi','The Accession Gift'),d:lng(`Yeniçeriler, ${r?chName(r):'yeni padişah'} tahta çıkınca âdet olan cülus bahşişini istiyor. Vermezsen kışlalarda kazan kaldırabilirler.`,`Now that ${r?chName(r):'the new sultan'} has taken the throne, the Janissaries demand the customary accession gift. Refuse, and they may overturn their cauldrons in the barracks.`),
   ch:[{l:lng(`Bahşişi dağıt (−${k} altın)`,`Hand out the gift (−${k} gold)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);}},
    {l:lng(`Reddet (${c.capn} garnizonu −25%, 4 tur huzursuz)`,`Refuse (${c.capn} garrison −25%, unrest for 4 turns)`),f:()=>{evCut(c.cap,.25);evUnrest(c.cap,4);}}]};}},
 {id:'veba64',w:5,cd:0,once:1,req:(S,f)=>{const y=chYear();return y>=1464&&y<=1467;},build:c=>evPlague(c,lng('Büyük Veba','The Great Plague'),lng('Balkanlardan Anadolu\'ya yayılan büyük veba salgını şehirleri boşaltıyor. Saray ne yapacağını tartışıyor.','A great plague spreading from the Balkans into Anatolia is emptying the cities. The court debates what to do.'))},
 {id:'veba90',w:5,cd:0,once:1,req:(S,f)=>{const y=chYear();return y>=1490&&y<=1493;},build:c=>evPlague(c,lng('Veba Yeniden','The Plague Returns'),lng('Veba bir kez daha limanlardan içerilere yayıldı. Divan başkentte mi kalmalı, yoksa yaylaya mı çekilmeli?','Once again the plague has spread inland from the ports. Should the Divan stay in the capital, or withdraw to the summer uplands?'))},
 {id:'entrika',w:2,cd:30,req:(S,f)=>{const r=chRuler(f),h=chHeir(f);return !!r&&!!h&&chAge(r)>=45&&chAge(h)>=18;},build:c=>{const r=chRuler(c.f),h=chHeir(c.f);if(!r||!h)return null;const k=20+c.small;
  return {t:lng('Saray Entrikası','Palace Intrigue'),d:lng(`Bazı vezirler ve beyler, yaşlanan ${chName(r)} yerine ${chLabel(h)} etrafında toplanıyor. Saray fısıltılarla dolu.`,`Some viziers and beys are gathering around ${chLabel(h)} instead of the ageing ${chName(r)}. The palace is full of whispers.`),
   ch:[{l:lng(`Veliahtı uzak bir sancağa gönder (−${k} altın masraf)`,`Send the heir to a distant province (−${k} gold in costs)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);}},
    {l:lng(`Hizbi dağıt, vezirleri azlet (${c.capn} 3 tur huzursuz)`,`Break up the faction and dismiss the viziers (unrest in ${c.capn} for 3 turns)`),f:()=>{evUnrest(c.cap,3);}}]};}},
 {id:'komutan',w:2,cd:24,req:(S,f)=>chGenerals(f).some(g=>g.skill<5&&g.cap==null),build:c=>{const L=chGenerals(c.f).filter(g=>g.skill<5&&g.cap==null);if(!L.length)return null;const g=c.pick(L),k=25+c.small;
  return {t:lng('Komutanın Dileği','A Commander\'s Request'),d:lng(`${chName(g)} sadakatinin karşılığında kendisine geniş bir dirlik verilmesini istiyor.`,`${chName(g)} asks for a large fief in return for his loyalty.`),
   ch:[{l:lng(`Dirliği ver (−${k} altın; ${chName(g)} kabiliyeti +1)`,`Grant the fief (−${k} gold; ${chName(g)} skill +1)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);const x=S.chars[g.id];if(x)x.skill=Math.min(5,x.skill+1);}},
    {l:lng(`Reddet (${chName(g)} küser, kabiliyeti −1)`,`Refuse (${chName(g)} is offended, skill −1)`),f:()=>{const x=S.chars[g.id];if(x)x.skill=Math.max(1,x.skill-1);}}]};}},
 {id:'evlilik',w:2,cd:30,req:(S,f)=>{const h=chHeir(f);return !!h&&chAge(h)>=14&&chAge(h)<=35&&FK.some(g=>g!==f&&alive(g)&&!atWar(f,g)&&getOp(f,g)>=0);},build:c=>{
  const h=chHeir(c.f);if(!h)return null;const L=FK.filter(g=>g!==c.f&&alive(g)&&!atWar(c.f,g)&&getOp(c.f,g)>=0);if(!L.length)return null;
  const same=L.filter(g=>FAC[g].rel===c.rel);const g=(c.f==='TRB'&&L.includes('AKK'))?'AKK':(c.f==='AKK'&&L.includes('TRB'))?'TRB':c.pick(same.length?same:L);const k=25+c.small;
  return {t:lng('Evlilik Teklifi','A Marriage Offer'),d:(c.f==='AKK'&&g==='TRB')||(c.f==='TRB'&&g==='AKK')?lng('Trabzon sarayı ile Akkoyunlular arasında bir düğün konuşuluyor; tıpkı Despina Hatun ile Uzun Hasan\'ın evliliği gibi.','A wedding is being discussed between the court of Trebizond and the Aq Qoyunlu, just like the marriage of Despina Hatun and Uzun Hasan.'):lng(`${FAC[g].n}, ${chLabel(h)} için bir evlilik teklif ediyor. Düğün pahalı, ama iki saray arasında bağ kurar.`,`The ${FAC[g].n} proposes a marriage for ${chLabel(h)}. The wedding is costly, but it binds the two courts together.`),
   ch:[{l:lng(`Düğünü yap (−${k} altın; ${FAC[g].s} ile ilişki +30)`,`Hold the wedding (−${k} gold; relations with ${FAC[g].s} +30)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);addOp(c.f,g,30);if(getOp(c.f,g)>=60&&!atWar(c.f,g)&&!isAlly(c.f,g)){S.ally[key(c.f,g)]=true;news(lng(`${FAC[g].s} ile evlilik ittifakı kuruldu.`,`A marriage alliance with ${FAC[g].s} has been sealed.`),'good');}}},
    {l:lng(`Teklifi geri çevir (${FAC[g].s} ile ilişki −15)`,`Turn the offer down (relations with ${FAC[g].s} −15)`),f:()=>{addOp(c.f,g,-15);}}]};}},
 {id:'korsan',w:2,cd:24,req:(S,f)=>evNaval.includes(f),build:c=>{const k=20+c.small;
  return {t:lng('Korsan Baskını','A Corsair Raid'),d:lng(`Korsan gemileri ${c.pn} kıyılarını yağmalıyor; köyler boşalıyor.`,`Corsair ships are plundering the coast of ${c.pn}; the villages are emptying.`),
   ch:[{l:lng(`Kadırga filosu gönder (−${k} altın)`,`Send a galley squadron (−${k} gold)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);}},
    {l:lng(`Kıyıyı kendi hâline bırak (${c.pn} gelişimi −1)`,`Leave the coast to its fate (${c.pn} development −1)`),f:()=>{const p=S.prov[c.p];p.dev=Math.max(1,p.dev-1);}}]};}},
 {id:'sinir',w:2,cd:20,req:(S,f)=>warsOf(f).length>0,build:c=>{const front=c.mine.filter(i=>PD[i].adj.some(j=>atWar(c.f,S.prov[j].o)));if(!front.length)return null;const i=c.pick(front),a=c.small+10,k=20+c.small;
  return {t:lng('Sınır Akını','A Border Raid'),d:lng(`Düşman akıncıları ${PD[i].name} köylerine baskın yaptı. Beyler karşılık vermek için izin istiyor.`,`Enemy raiders have struck the villages of ${PD[i].name}. Your beys ask leave to strike back.`),
   ch:[{l:lng(`Karşı akın düzenle (+${a} altın ganimet; ${PD[i].name} garnizonu −10%)`,`Raid them in return (+${a} gold in plunder; ${PD[i].name} garrison −10%)`),f:()=>{c.F.gold+=a;evCut(i,.1);}},
    {l:S.prov[i].fort<4?lng(`Kaleyi tahkim et (−${k} altın; ${PD[i].name} kalesi +1)`,`Strengthen the fortress (−${k} gold; ${PD[i].name} walls +1)`):lng(`Surları onar (−${k} altın)`,`Repair the walls (−${k} gold)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);if(S.prov[i].fort<4)S.prov[i].fort++;}}]};}},
 {id:'hac',w:2,cd:30,req:(S,f)=>f==='MAM'||f==='OSM'||f==='HAF',build:c=>{const k=20+c.small;
  return {t:lng('Hac Kervanı','The Pilgrim Caravan'),d:lng('Hac kervanı yola çıkıyor. Bedevi saldırılarına karşı muhafız ve su kuyuları için para gerekiyor.','The pilgrim caravan to Mecca is setting out. Guards against Bedouin raids and wells along the road will cost money.'),
   ch:[{l:lng(`Kervanı koru (−${k} altın; Müslüman devletlerle ilişki +10)`,`Protect the caravan (−${k} gold; relations with Muslim realms +10)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);FK.forEach(g=>{if(g!==c.f&&alive(g)&&FAC[g].rel==='İslam')addOp(c.f,g,10);});}},
    {l:lng(`Kervanı kendi hâline bırak (${c.capn} 2 tur huzursuz)`,`Leave the caravan to itself (unrest in ${c.capn} for 2 turns)`),f:()=>{evUnrest(c.cap,2);}}]};}},
 {id:'matbaa',w:2,cd:0,once:1,req:(S,f)=>FAC[f].rel==='Katolik'&&chYear()>=1470,build:c=>{const k=30+c.small;
  return {t:lng('Matbaacılar','The Printers'),d:lng('Alman ustalar hareketli harflerle kitap basan bir matbaa kurmak istiyor. Kâtipler loncası ise buna karşı.','German craftsmen want to set up a press that prints books with movable type. The scribes\' guild is against it.'),
   ch:[{l:lng(`Himaye et (−${k} altın; ${c.capn} gelişimi +1)`,`Become the patron (−${k} gold; ${c.capn} development +1)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);const p=S.prov[c.cap];if(p.dev<12)p.dev++;}},
    {l:lng('Loncayı dinle (hazine korunur, yenilik kaçar)','Listen to the guild (the treasury is spared, the novelty is lost)')}]};}}
);
function evPlague(c,t,d){const k=25+c.small;
 return {t,d,ch:[{l:lng(`Saray yaylaya çekilsin (−${k} altın; insan gücü −10%)`,`Let the court withdraw to the uplands (−${k} gold; manpower −10%)`),dis:c.F.gold<k,f:()=>{evPay(c.F,k);c.F.mp=Math.round(c.F.mp*.9);}},
  {l:lng(`Divan başkentte kalsın (${c.capn} gelişimi −1; hükümdar hastalanabilir)`,`Let the Divan stay in the capital (${c.capn} development −1; the ruler may fall ill)`),f:()=>{const p=S.prov[c.cap];p.dev=Math.max(1,p.dev-1);const r=chRuler(c.f);if(r&&R()<.35&&!r.traits.includes('hasta')){r.traits.push('hasta');news(lng(`${chName(r)} vebaya yakalandı; sağlığı bozuldu.`,`${chName(r)} has caught the plague; the ruler's health is broken.`),'war');}}}]};}
/* The janissaries ask their accession gift whenever an Ottoman player's sultan comes to the throne. */
hook('succession',(f,old,neu)=>{if(f===S.player&&f==='OSM'&&old)evFire('bahsis');});
/* Debug handle for the English data check (tests/i18n-data.js): build any pool event for any realm. */
KE.t2={MIS_EN,MIS_BR_EN,misTxt,FAC,FK,PK,armName,chLabel,evSpec:(f,id,seed)=>{const e=EVENTS.find(x=>x.id===id);return e?e.build(evCtx(f,seed)):null;}};
