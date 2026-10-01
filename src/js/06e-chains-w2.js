/* =====================================================================
   HISTORY, WAVE 2 (Track C): the later chains (Otranto 1480, Chaldiran 1514, Marj Dabiq and Ridaniya
   1516-17, Rhodes 1522, Mohács 1526 with the Habsburg inheritance of Hungary, Vienna 1529), the claimant
   war of a succession crisis, capture flavour by culture and battle names in the chronicle.
   Sieges, occupation and peace come from Track B (S.sieges, ctl(), siegeAt(), hooks siegeStart /
   siegeTick / siegeFell): every use is guarded, so all of this also runs on the pre-siege rules.
   Chain engine and conventions: see 06c-chains.js.
   ===================================================================== */
const BAL_CH2={
 otrGold:60,otrTroops:8000,otrCrGold:40,otrCrTroops:6000,otrMul:1.15,otrMax:40,
 calGuns:1.15,calCharge:1.15,calBurn:.85,calKeep:30,calLoot:60,
 misGift:30,misHayir:40,misHayirMul:.8,misRid:40,misRidMul:1.2,misCete:.9,misLoot:80,
 rhoGold:50,rhoTadini:40,rhoTadMul:1.15,sgLagim:.3,sgTadini:.25,
 mohGuns:1.15,mohKing:1.1,mohWait:1.2,sgMohWait:.25,pressburg:1491,
 vieWalls:40,vieMul:1.25,vieTroops:5000,sgVieWalls:.25,vieCold:.8,
 clmP:.6,clmMinProvs:5,clmGold:60,clmArmy:.2,clmArmyMin:3000,clmArmyMax:25000,clmMax:40,
 bnameBig:15000,bnameLoss:6000,bnamePerTurn:4,flavDev:5
};
const chnTurn=y=>(y-START_YEAR)*4;
/** f owns the province with key k, or holds it by occupation. */
const chnHeld=(k,f)=>{const i=PK[k];return S.prov[i].o===f||chnCtl(i)===f;};
const chnBorder=(a,b)=>alive(a)&&alive(b)&&nbrs(a).includes(b);
function chnWarOn(a,b){if(atWar(a,b))return;if(isAlly(a,b))delete S.ally[key(a,b)];declareWar(a,b);}
const chnPay=(f,v)=>{S.fac[f].gold=Math.max(0,S.fac[f].gold-v);};
const chnIs=(ctx,a,b)=>(ctx.att===a&&ctx.def===b)||(ctx.att===b&&ctx.def===a);
/** Hand province i to `to` without a battle and without loot (withdrawals, surrenders, inheritance). */
function chnCede(i,to){const p=S.prov[i],from=p.o;delete p.ctl;if(S.sieges&&S.sieges[i])delete S.sieges[i];polDirty=true;if(from===to)return;
 p.o=to;p.un=Math.max(p.un,2);chnEvict(i);
 if(S.fac[from].cap===i){const rest=facProvs(from);if(rest.length){rest.sort((a,b)=>S.prov[b].dev-S.prov[a].dev);S.fac[from].cap=rest[0];}}
 if(S.fac[from].alive&&!facProvs(from).length)eliminate(from,to);}
/** Armies left standing on ground that is no longer theirs (not the owner's, not an ally's, not besieging) walk to their nearest own province. */
function chnEvict(i){if(!S.armies)return;const o=S.prov[i].o;
 for(const a of S.armies.slice()){if(a.loc!==i||a.f===o||isAlly(a.f,o)||a.st==='siege')continue;const j=chnNearest(a.f,i);
  if(j>=0&&j!==i){a.loc=j;a.path=[];a.mp=0;}else armyRemove(a.id,'disbanded');}}
/** A scripted army (landing, relief): a field army when Track B's armies exist, else the garrison. Optionally led by a seeded
 general. A realm already at its army cap sends its nearest army instead, reinforced. */
function chnArmy(f,i,n,gk){n=Math.round(n/100)*100;if(n<=0)return null;
 if(typeof armyCreate!=='function'||!S.armies){S.prov[i].t+=n;return null;}
 let a=null;const mine=armyList(f);
 if(typeof armyCap==='function'&&mine.length>=armyCap(f)){const d=x=>{let fr=[x.loc],seen=new Set(fr);for(let k=0;k<30;k++){if(fr.includes(i))return k;const nx=[];for(const q of fr)for(const r of PD[q].adj)if(!seen.has(r)){seen.add(r);nx.push(r);}fr=nx;if(!fr.length)break;}return 99;};
  a=mine.filter(x=>x.st!=='siege').sort((x,y)=>d(x)-d(y))[0]||mine[0];a.n+=n;if(a.st!=='siege'&&(S.prov[i].o===f||isAlly(S.prov[i].o,f))){a.loc=i;a.path=[];}}
 else a=armyCreate(f,i,n);
 const g=gk&&chBySeed(f,gk);
 if(chLive(g)&&g.cap==null){for(const x of S.armies)if(x!==a&&x.gen===g.id)x.gen=null;a.gen=g.id;}
 return a;}
/** The nearest province of f to i, walking over the map (i itself if f holds it), or -1. */
function chnNearest(f,i){const seen=new Set([i]);let fr=[i];for(let d=0;d<12&&fr.length;d++){for(const j of fr)if(S.prov[j].o===f)return j;const nx=[];
  for(const j of fr)for(const k of [...PD[j].adj,...(PD[j].lanes||[])])if(!seen.has(k)){seen.add(k);nx.push(k);}fr=nx;}return -1;}
const CH2_SYRIA=['halep','antakya','ayntab','hama','humus','sam','trablus','beyrut','safed','havran','tedmur','rakka'];
const CH2_EGYPT=['kahire','iskenderiye','dimyat','behire','sarkiye','feyyum','suveys','aris'];
const chnIn=(i,keys)=>i!=null&&keys.includes(PD[i].key);

/* ---------- 1480: Otranto ---------- */
CHAINS.push({id:'otranto',abort:(S,st)=>!alive('OSM')||!alive('ARA')||(st.stage===0&&S.turn>chnTurn(1488)),stages:[
 {when:S=>S.turn>=chnTurn(1480)&&chnOwn('otranto','ARA')&&chnOwn('avlonya','OSM')&&!inTruce('OSM','ARA')&&!isAlly('OSM','ARA')&&warsOf('OSM').length<2,
  who:()=>'OSM',ai:S=>S.fac.OSM.gold>=BAL_CH2.otrGold?0:1,fire:st=>({t:lng('Otranto Seferi','The Otranto Expedition'),
   d:lng(`Gedik Ahmed Paşa, Avlonya'dan İtalya kıyısına geçmek için donanma ve asker istiyor. Otranto düşerse Roma yolu açılır; Kızıl Elma hiç bu kadar yakın olmamıştı.`,`Gedik Ahmed Pasha asks for a fleet and troops to cross from Valona to the Italian coast. If Otranto falls, the road to Rome lies open; the Red Apple has never been so close.`),
   ch:[{l:lng(`Donanmayı gönder (−${BAL_CH2.otrGold} altın; Avlonya'da ${fmtK(BAL_CH2.otrTroops)} kişilik bir çıkarma ordusu toplanır, Napoli'ye savaş açılır)`,`Send the fleet (−${BAL_CH2.otrGold} gold; a landing army of ${fmtK(BAL_CH2.otrTroops)} gathers at Valona, and war is declared on Naples)`),
     dis:S.fac.OSM.gold<BAL_CH2.otrGold,f:st=>{chnPay('OSM',BAL_CH2.otrGold);st.data.t0=S.turn;st.data.ruler=S.fac.OSM.ruler;chnWarOn('OSM','ARA');
      chnArmy('OSM',PK.avlonya,BAL_CH2.otrTroops,'gedik');chnNudge('OSM',{war:'ARA',target:PK.otranto,prio:4,until:S.turn+24});
      news(lng(`Osmanlı donanması Avlonya'da toplanıyor: hedef İtalya'nın topuğu, Otranto.`,`The Ottoman fleet is gathering at Valona: its target is Otranto, on the heel of Italy.`),S.player==='ARA'?'war':'info');}},
    {l:lng('İtalya bekleyebilir','Italy can wait'),next:'end',f:()=>{}}]})},
 {when:S=>chnHeld('otranto','OSM'),who:()=>'ARA',ai:S=>S.fac.ARA.gold>=BAL_CH2.otrCrGold?0:1,fire:st=>({t:lng('Otranto Düştü','Otranto Has Fallen'),
   d:lng(`Osmanlılar Otranto'ya girdi; başpiskopos katedralinde öldürüldü. Papa bütün İtalya'yı haçlı seferine çağırıyor. Kalabriya Dükü Alfonso, şehri geri almak için ordu istiyor.`,`The Ottomans have entered Otranto; the archbishop was killed in his cathedral. The Pope calls all Italy to a crusade. Alfonso, Duke of Calabria, asks for an army to take the city back.`),
   ch:[{l:lng(`Haçlı ordusunu topla (−${BAL_CH2.otrCrGold} altın; +${fmtK(BAL_CH2.otrCrTroops)} asker, 12 tur Otranto'ya saldırıda +15%)`,`Gather the crusading army (−${BAL_CH2.otrCrGold} gold; +${fmtK(BAL_CH2.otrCrTroops)} troops, and +15% when attacking Otranto for 12 turns)`),
     dis:S.fac.ARA.gold<BAL_CH2.otrCrGold,f:st=>{chnPay('ARA',BAL_CH2.otrCrGold);st.data.cr=S.turn+12;const at=chnNearest('ARA',PK.otranto);if(at>=0)chnArmy('ARA',at,BAL_CH2.otrCrTroops);
      chnNudge('ARA',{war:'OSM',target:PK.otranto,prio:4,until:S.turn+16});}},
    {l:lng('Papa\'nın ve İtalyan devletlerinin yardımını bekle (güneyde 2 eyalet 4 tur huzursuz; Papa 30 altın gönderir)','Wait for help from the Pope and the Italian states (2 provinces in the south restless for 4 turns; the Pope sends 30 gold)'),
     f:()=>{chnUnrest('ARA',2,4);S.fac.ARA.gold+=30;}}]})},
 {when:(S,st)=>!chnHeld('otranto','OSM')||(st.data.ruler!=null&&S.fac.OSM.ruler!==st.data.ruler)||S.turn>(st.data.t0||0)+BAL_CH2.otrMax,
  who:(S,st)=>chnHeld('otranto','OSM')?'OSM':null,ai:()=>0,fire:st=>chnHeld('otranto','OSM')?{t:lng('Sultan Öldü','The Sultan Is Dead'),
   d:lng(`Otranto'daki garnizona İstanbul'dan haber geldi: tahtta ${rulerName('OSM')} var ve yeni sultan İtalya seferini sürdürmek istemiyor. Garnizon kuşatma altında, yardım gelmiyor.`,`News from Istanbul has reached the garrison in Otranto: ${rulerName('OSM')} sits on the throne, and the new sultan has no wish to go on with the Italian campaign. The garrison is besieged and no help is coming.`),
   ch:[{l:lng('Garnizonu geri çağır (Otranto Napoli\'ye döner ve barış yapılır)','Recall the garrison (Otranto returns to Naples and peace is made)'),next:'end',f:()=>chnOtrLeave()},
    {l:lng('Otranto\'yu tut (savaş sürer; 2 eyalet 4 tur huzursuz)','Hold Otranto (the war goes on; 2 provinces restless for 4 turns)'),next:'end',f:()=>chnUnrest('OSM',2,4)}]}
   :{t:'',d:'',ch:[{l:'',next:'end',f:()=>{if(chnOwn('otranto','ARA'))news(lng('Otranto kurtarıldı; Osmanlı garnizonu teslim oldu ve İtalya\'dan çekildi.','Otranto is free again; the Ottoman garrison has surrendered and left Italy.'),S.player==='ARA'?'good':'info');}}]}}]});
function chnOtrLeave(){const i=PK.otranto;for(const a of (S.armies||[]).filter(x=>x.f==='OSM'&&x.loc===i)){const j=chnNearest('OSM',i);if(j>=0&&j!==i)a.loc=j;else armyRemove(a.id,'disbanded');}
 if(S.prov[i].o==='OSM'||chnCtl(i)==='OSM')chnCede(i,'ARA');if(atWar('OSM','ARA'))makePeace('OSM','ARA');
 news(lng('Osmanlı garnizonu Otranto\'yu bırakıp Avlonya\'ya döndü. İtalya bir nefes aldı.','The Ottoman garrison has left Otranto and sailed back to Valona. Italy breathes again.'),S.player==='ARA'?'good':'info');}

/* ---------- 1514: Chaldiran ---------- */
CHAINS.push({id:'caldiran',abort:(S,st)=>!alive('OSM')||(!alive('SAF')&&(st.stage>0||S.turn>chnTurn(1520))),stages:[
 {when:S=>S.turn>=chnTurn(1514)&&chnBorder('OSM','SAF')&&!atWar('OSM','SAF')&&!inTruce('OSM','SAF'),who:()=>'OSM',ai:()=>0,fire:st=>({t:lng('Kızılbaş Meselesi','The Qizilbash Question'),
   d:lng(`Anadolu'daki Kızılbaş Türkmenler Şah İsmail'e bağlılık yemini ediyor; Şahkulu isyanının külleri hâlâ sıcak. Sultan, Şah'ın üzerine yürümek için Divan'ı topladı.`,`The Qizilbash Turkmen of Anatolia swear loyalty to Shah Ismail, and the embers of the Shahkulu revolt are still warm. The Sultan has called the Divan to march against the Shah.`),
   ch:[{l:lng('Şah\'ın üzerine yürü (savaş ilan et; tüfek ve toplar: Safevîlere karşı meydan muharebesinde 12 tur +15%)','March against the Shah (declare war; guns and muskets: +15% in field battles against the Safavids for 12 turns)'),
     f:st=>{st.data.guns=S.turn+12;chnWarOn('OSM','SAF');chnNudge('OSM',{war:'SAF',target:S.fac.SAF.cap,prio:4});}},
    {l:lng('Sınırı tut, Kızılbaşları sürgün et (2 eyalet 6 tur huzursuz; Safevîlerle ilişki −20)','Hold the border and deport the Qizilbash (2 provinces restless for 6 turns; relations with the Safavids −20)'),next:'end',
     f:()=>{chnUnrest('OSM',2,6);addOp('OSM','SAF',-20);}}]})},
 {when:S=>atWar('OSM','SAF'),who:()=>'SAF',ai:S=>strength('SAF')>=strength('OSM')*.35?0:1,fire:st=>({t:lng('Çaldıran Ovası','The Plain of Chaldiran'),
   d:lng(`Osmanlı ordusu yakılıp yıkılmış topraklardan geçerek Çaldıran'a ulaştı. Kızılbaş beyleri ${rulerName('SAF')}'a toplar kurulmadan hemen saldırmayı öğütlüyor.`,`The Ottoman army has crossed the scorched lands and reached Chaldiran. The Qizilbash emirs urge ${rulerName('SAF')} to attack at once, before the guns can be set up.`),
   ch:[{l:lng('Süvarilerle saldır (6 tur Osmanlı\'ya saldırıda +15%; ama Şah yenilirse yaralanır ve Cengâver huyunu yitirir)','Charge with the horsemen (+15% when attacking the Ottomans for 6 turns; but if the Shah is beaten he is wounded and loses his Valiant trait)'),
     f:st=>{st.data.charge=S.turn+6;}},
    {l:lng('Yakıp yıkarak geri çekil (12 tur Osmanlı\'nın saldırıları −15%; 2 eyalet 4 tur huzursuz)','Retreat and burn the land (Ottoman attacks −15% for 12 turns; 2 provinces restless for 4 turns)'),
     f:st=>{st.data.burn=S.turn+12;chnUnrest('SAF',2,4);}}]})},
 {when:S=>chnHeld('tebriz','OSM')||!atWar('OSM','SAF'),who:()=>chnHeld('tebriz','OSM')?'OSM':null,ai:()=>1,fire:st=>chnHeld('tebriz','OSM')?{t:lng('Yeniçeriler Tebriz\'de Kışlamak İstemiyor','The Janissaries Will Not Winter in Tabriz'),
   d:lng(`Sultan Tebriz'e girdi ve Heşt Behişt Sarayı'nda konakladı. Ama yeniçeriler kışı İran yaylasında geçirmek istemiyor; "evlerimize dönelim" diye kazan kaldırmaya hazırlar.`,`The Sultan has entered Tabriz and lodges in the Hasht Behesht palace. But the Janissaries will not spend the winter on the Persian plateau; they are ready to overturn their kettles and demand to go home.`),
   ch:[{l:lng(`Tebriz'i tut (yeniçerilere bahşiş −${BAL_CH2.calKeep} altın; 3 eyalet 6 tur huzursuz)`,`Keep Tabriz (a gift of −${BAL_CH2.calKeep} gold to the Janissaries; 3 provinces restless for 6 turns)`),dis:S.fac.OSM.gold<BAL_CH2.calKeep,next:'end',
     f:()=>{chnPay('OSM',BAL_CH2.calKeep);chnUnrest('OSM',3,6);}},
    {l:lng(`Hazineyi al ve çekil (+${BAL_CH2.calLoot} altın; Tebriz Safevîlere geri döner)`,`Take the treasury and withdraw (+${BAL_CH2.calLoot} gold; Tabriz goes back to the Safavids)`),next:'end',
     f:()=>{S.fac.OSM.gold+=BAL_CH2.calLoot;const i=PK.tebriz;for(const a of (S.armies||[]).filter(x=>x.f==='OSM'&&x.loc===i)){const j=chnNearest('OSM',i);if(j>=0&&j!==i)a.loc=j;}
      if(alive('SAF'))chnCede(i,'SAF');news(lng('Osmanlı ordusu Tebriz\'in hazinesini ve zanaatkârlarını alıp batıya döndü.','The Ottoman army has turned west, taking the treasury and the craftsmen of Tabriz with it.'),'info');}}]}
   :{t:'',d:'',ch:[{l:'',next:'end',f:()=>{news(lng('Çaldıran\'dan sonra doğu sınırı yatıştı; Şah bir daha Osmanlı ile meydanda karşılaşmaktan kaçınıyor.','After Chaldiran the eastern frontier falls quiet; the Shah avoids meeting the Ottomans in the field again.'),'info');}}]}}]});

/* ---------- 1516-17: Marj Dabiq and Ridaniya ---------- */
CHAINS.push({id:'misir',abort:()=>!alive('OSM')||!alive('MAM'),stages:[
 {when:S=>S.turn>=chnTurn(1516)&&chnBorder('OSM','MAM')&&!atWar('OSM','MAM')&&!inTruce('OSM','MAM'),who:()=>'MAM',
  ai:S=>(alive('SAF')&&atWar('OSM','SAF'))||strength('MAM')>=strength('OSM')*.45?0:1,fire:st=>({t:lng('Halep\'e Yürüyüş','The March to Aleppo'),
   d:lng(`${rulerName('MAM')}, Osmanlı'nın Şah'a karşı sefere çıktığını duydu. Emirler Halep'e çıkıp iki güç arasında hakem olmayı öneriyor; kimisi de Osmanlı'yı kışkırtmamayı.`,`${rulerName('MAM')} hears that the Ottomans have gone to war against the Shah. The emirs advise marching north to Aleppo to stand as arbiter between the two powers; others warn against provoking the Ottomans.`),
   ch:[{l:lng('Halep\'e yürü ve Şah ile anlaş (Osmanlı\'ya savaş ilan et; Safevîlerle ittifak)','March to Aleppo and side with the Shah (declare war on the Ottomans; alliance with the Safavids)'),next:{stage:2,delay:0},
     f:()=>{if(alive('SAF')&&!atWar('MAM','SAF'))S.ally[key('MAM','SAF')]=true;chnWarOn('MAM','OSM');chnNudge('MAM',{war:'OSM',prio:2});}},
    {l:lng(`Sultan'a elçi ve hediye gönder (−${BAL_CH2.misGift} altın; Osmanlı ile ilişki +25)`,`Send envoys and gifts to the Sultan (−${BAL_CH2.misGift} gold; relations with the Ottomans +25)`),dis:S.fac.MAM.gold<BAL_CH2.misGift,next:{stage:1,delay:8},
     f:()=>{chnPay('MAM',BAL_CH2.misGift);addOp('MAM','OSM',25);}}]})},
 {when:S=>chnBorder('OSM','MAM')&&!inTruce('OSM','MAM'),who:()=>'OSM',ai:S=>strength('OSM')>strength('MAM')*1.3?0:1,fire:st=>({t:lng('Mısır Yolu','The Road to Egypt'),
   d:lng('Memlük elçileri hediyelerle geldi, ama Divan bölünmüş: kimisi Suriye ve Mısır\'ın zenginliğini, kutsal şehirlerin hizmetini hatırlatıyor; kimisi doğudaki Şah\'ı.','The Mamluk envoys have come bearing gifts, but the Divan is divided: some speak of the riches of Syria and Egypt and the service of the holy cities, others of the Shah in the east.'),
   ch:[{l:lng('Memlüklere savaş ilan et (hedef Halep)','Declare war on the Mamluks (target: Aleppo)'),f:()=>{if(!atWar('OSM','MAM'))declareWar('OSM','MAM');chnNudge('OSM',{war:'MAM',target:PK.halep,prio:4});}},
    {l:lng('Barışı koru','Keep the peace'),next:'end',f:()=>{}}]})},
 {when:S=>atWar('OSM','MAM'),who:()=>'OSM',ai:S=>S.fac.OSM.gold>=BAL_CH2.misHayir?0:1,fire:st=>({t:lng('Hayır Bey\'in Mektubu','A Letter from Khair Bey'),
   d:lng('Halep valisi Hayır Bey gizlice haber gönderdi: savaş günü Memlük ordusunun sol kanadıyla birlikte meydandan çekilecek. Karşılığında Mısır\'ın valiliğini istiyor.','Khair Bey, governor of Aleppo, has sent word in secret: on the day of battle he will leave the field with the Mamluk left wing. In return he wants the governorship of Egypt.'),
   ch:[{l:lng(`Pazarlığı kabul et (−${BAL_CH2.misHayir} altın; 12 tur Suriye'de Memlükler −20%)`,`Accept the bargain (−${BAL_CH2.misHayir} gold; the Mamluks fight at −20% in Syria for 12 turns)`),dis:S.fac.OSM.gold<BAL_CH2.misHayir,
     f:st=>{chnPay('OSM',BAL_CH2.misHayir);st.data.hayir=S.turn+12;chnNudge('OSM',{war:'MAM',target:PK.halep,prio:4});}},
    {l:lng('Bir haine güvenilmez','A traitor cannot be trusted'),f:()=>{chnNudge('OSM',{war:'MAM',target:PK.halep,prio:4});}}]})},
 {when:S=>atWar('OSM','MAM')&&CH2_SYRIA.some(k=>chnHeld(k,'OSM')&&k!=='rakka'),who:()=>'MAM',ai:S=>S.fac.MAM.gold>=BAL_CH2.misRid?0:1,fire:st=>({t:lng('Ridaniye','Ridaniya'),
   d:lng(`Suriye elden gidiyor ve Memlük ordusu Mercidabık'ta dağıldı. ${rulerName('MAM')}, Kahire'nin kapısında, Ridaniye'de hendek kazdırıp toplarını yerleştirmek istiyor.`,`Syria is slipping away and the Mamluk army broke at Marj Dabiq. ${rulerName('MAM')} wants to dig a trench at Ridaniya, at the gate of Cairo, and set up the guns there.`),
   ch:[{l:lng(`Ridaniye'de hendek ve top (−${BAL_CH2.misRid} altın; 12 tur Kahire'de savunma +20%)`,`A trench and guns at Ridaniya (−${BAL_CH2.misRid} gold; +20% defence at Cairo for 12 turns)`),dis:S.fac.MAM.gold<BAL_CH2.misRid,
     f:st=>{chnPay('MAM',BAL_CH2.misRid);st.data.rid=S.turn+12;}},
    {l:lng('Bedevilerle çete savaşı (12 tur Osmanlı\'nın Mısır\'daki saldırıları −10%; 2 eyalet 4 tur huzursuz)','A guerrilla war with the Bedouin (Ottoman attacks in Egypt −10% for 12 turns; 2 provinces restless for 4 turns)'),
     f:st=>{st.data.cete=S.turn+12;chnUnrest('MAM',2,4);}}]})},
 {when:S=>chnHeld('kahire','OSM'),who:()=>'OSM',ai:()=>0,fire:st=>({t:lng('Hâdimü\'l-Haremeyn','Servant of the Two Holy Sanctuaries'),
   d:lng('Kahire düştü. Son Abbasi halifesi III. Mütevekkil, Peygamber\'in hırkası ve sancağıyla İstanbul\'a gönderilecek. Mekke şerifi kutsal şehirlerin anahtarlarını yolladı.','Cairo has fallen. The last Abbasid caliph, Mutawakkil III, is to be sent to Istanbul with the Mantle and the Banner of the Prophet. The Sharif of Mecca has sent the keys of the holy cities.'),
   ch:[{l:lng(`Unvanı al (hükümdar Dindar olur; Mısır hazinesinden +${BAL_CH2.misLoot} altın)`,`Take the title (the ruler becomes Pious; +${BAL_CH2.misLoot} gold from the Egyptian treasury)`),next:'end',
     f:()=>{chnMisirEnd();S.fac.OSM.gold+=BAL_CH2.misLoot;const r=chRuler('OSM');if(r&&!r.traits.includes('dindar'))r.traits.push('dindar');}},
    {l:lng('Mısır\'ı Hayır Bey\'e bırak (Osmanlı\'nın Mısır eyaletlerinde huzursuzluk biter)','Leave Egypt to Khair Bey (the unrest ends in the Ottoman provinces of Egypt)'),next:'end',
     f:()=>{chnMisirEnd();for(const k of CH2_EGYPT){const p=S.prov[PK[k]];if(p.o==='OSM')p.un=0;}}}]})}]});
/** The fall of Cairo: the last Mamluk sultan is executed, and a Selim on the throne is remembered as "Yavuz". */
function chnMisirEnd(){const r=chRuler('OSM');if(r&&!r.ep&&/^Selim/.test(r.n))r.ep='Yavuz';
 const m=alive('MAM')&&chRuler('MAM');if(m&&!chnHeld('kahire','MAM')){news(lng(`Memlük sultanı ${chName(m)} Züveyle Kapısı'nda asıldı.`,`The Mamluk sultan ${chName(m)} was hanged at the Bab Zuwayla.`),S.player==='MAM'||S.player==='OSM'?'cap':'info');chKill(m,'executed');}}

/* ---------- 1522: Rhodes ---------- */
CHAINS.push({id:'rodos',abort:(S,st)=>!alive('OSM')||(st.stage===0&&(!alive('RHO')||S.prov[PK.rodos].o!=='RHO')),stages:[
 {when:S=>S.turn>=chnTurn(1522)&&chnOwn('rodos','RHO')&&(chnOwn('mentese','OSM')||chnOwn('bodrum','OSM')||chnOwn('kandiye','OSM'))&&!atWar('OSM','RHO')&&!inTruce('OSM','RHO'),
  who:()=>'OSM',ai:S=>S.fac.OSM.gold>=BAL_CH2.rhoGold?0:1,fire:st=>({t:lng('Rodos\'a Mektup','A Letter to Rhodes'),
   d:lng(`Sultan, Rodos Büyük Üstadı'na bir mektup yolladı: ada teslim edilirse şövalyeler canlarını ve mallarını alıp gidebilecek. Fatih Sultan Mehmed'in ordusu 1480'de bu surlarda başarısız olmuştu.`,`The Sultan has written to the Grand Master of Rhodes: if the island is surrendered, the Knights may leave with their lives and goods. The army of Mehmed the Conqueror failed before these walls in 1480.`),
   ch:[{l:lng(`Adaya çık ve lağımcıları getir (savaş ilan et; −${BAL_CH2.rhoGold} altın; Rodos kuşatması daha hızlı ilerler)`,`Land on the island and bring the sappers (declare war; −${BAL_CH2.rhoGold} gold; the siege of Rhodes goes faster)`),dis:S.fac.OSM.gold<BAL_CH2.rhoGold,
     f:st=>{chnPay('OSM',BAL_CH2.rhoGold);st.data.lagim=1;chnWarOn('OSM','RHO');chnNudge('OSM',{war:'RHO',target:PK.rodos,prio:5,until:S.turn+30});}},
    {l:lng('Adaya çık (savaş ilan et)','Land on the island (declare war)'),f:()=>{chnWarOn('OSM','RHO');chnNudge('OSM',{war:'RHO',target:PK.rodos,prio:5,until:S.turn+30});}},
    {l:lng('Şövalyeleri rahat bırak','Leave the Knights in peace'),next:'end',f:()=>{}}]})},
 {when:S=>atWar('OSM','RHO')||chnHeld('rodos','OSM'),who:()=>alive('RHO')?'RHO':null,ai:S=>S.fac.RHO.gold>=BAL_CH2.rhoTadini?0:1,fire:st=>({t:lng('Büyük Üstadın Kararı','The Grand Master\'s Decision'),
   d:lng(`${rulerName('RHO')}, Hıristiyan dünyasından yardım istedi ama yalnızca bir avuç şövalye geldi. Mühendis Gabriele Tadini, Osmanlı lağımlarına karşı lağımlar kazmayı öneriyor.`,`${rulerName('RHO')} has begged Christendom for help, but only a handful of knights have come. The engineer Gabriele Tadini proposes digging counter-mines against the Ottoman tunnels.`),
   ch:[{l:lng(`Karşı lağım kaz (−${BAL_CH2.rhoTadini} altın; Rodos'ta savunma +15%, kuşatma yavaşlar)`,`Dig counter-mines (−${BAL_CH2.rhoTadini} gold; +15% defence at Rhodes and a slower siege)`),dis:S.fac.RHO.gold<BAL_CH2.rhoTadini,
     f:st=>{chnPay('RHO',BAL_CH2.rhoTadini);st.data.tadini=1;}},
    {l:lng('Surlara ve Tanrı\'ya güven','Trust in the walls and in God'),f:()=>{}}]})},
 {when:S=>chnHeld('rodos','OSM'),who:()=>alive('RHO')?'RHO':null,ai:()=>0,fire:st=>alive('RHO')?{t:lng('Onurlu Teslim','An Honourable Surrender'),
   d:lng('Rodos surları yıkıldı, erzak tükendi. Sultan sözünü yineliyor: şövalyeler silahları ve sancaklarıyla adadan ayrılabilir; halka dokunulmayacak.','The walls of Rhodes are breached and the food is gone. The Sultan repeats his word: the Knights may leave the island with their arms and banners, and the people will be left unharmed.'),
   ch:[{l:S.player==='RHO'?lng('Şartları kabul et ve batıya yelken aç (Tarikatın bütün toprakları Osmanlı\'ya geçer; oyunun biter)','Accept the terms and sail west (all the lands of the Order pass to the Ottomans; your game ends)')
      :lng('Şartları kabul et ve batıya yelken aç (Tarikatın bütün toprakları Osmanlı\'ya geçer)','Accept the terms and sail west (all the lands of the Order pass to the Ottomans)'),next:'end',f:()=>chnRhoLeave()},
    {l:lng('Son şövalyeye kadar savaş (savaş sürer)','Fight to the last knight (the war goes on)'),next:'end',f:()=>{}}]}
   :{t:'',d:'',ch:[{l:'',next:'end',f:()=>news(lng('Rodos Osmanlı\'nın oldu; ayakta kalan şövalyeler batıya, Malta\'ya yelken açtı.','Rhodes is Ottoman now; the surviving Knights have sailed west, to Malta.'),'info')}]}}]});
function chnRhoLeave(){for(const i of facProvs('RHO'))chnCede(i,'OSM');
 news(lng('Şövalyeler sancaklarıyla Rodos\'tan ayrıldı; Sultan sözünü tuttu. Tarikat yıllar sonra Malta\'ya yerleşecek.','The Knights have left Rhodes with their banners, and the Sultan kept his word. Years later the Order will settle on Malta.'),S.player==='OSM'?'cap':'info');}

/* ---------- 1526: Mohács ---------- */
CHAINS.push({id:'mohac',abort:()=>!alive('OSM')||!alive('HUN'),stages:[
 {when:S=>S.turn>=chnTurn(1526)&&chnBorder('OSM','HUN')&&chnOwn('budin','HUN')&&!atWar('OSM','HUN')&&!inTruce('OSM','HUN'),who:()=>'OSM',ai:S=>strength('OSM')>strength('HUN')*1.2?0:1,fire:st=>({t:lng('Macaristan Seferi','The Hungarian Campaign'),
   d:lng('Macar beyleri birbirine düşmüş, genç kralın ne hazinesi ne ordusu var. Fransa kralı bile Habsburglara karşı yardım istiyor. Sultan, Budin üzerine sefere çıkmayı düşünüyor.','The Hungarian lords are at each other\'s throats, and the young king has neither treasury nor army. Even the King of France asks for help against the Habsburgs. The Sultan considers a campaign against Buda.'),
   ch:[{l:lng('Sefere çık (savaş ilan et; yeniçeri tüfekleri: Macarlara karşı meydan muharebesinde 12 tur +15%)','Set out on campaign (declare war; Janissary muskets: +15% in field battles against the Hungarians for 12 turns)'),
     f:st=>{st.data.guns=S.turn+12;chnWarOn('OSM','HUN');chnNudge('OSM',{war:'HUN',target:PK.budin,prio:5});}},
    {l:lng('Bir yıl daha bekle','Wait another year'),next:{stage:0,delay:4},f:()=>{}}]})},
 {when:S=>atWar('OSM','HUN'),who:()=>'HUN',ai:()=>0,fire:st=>({t:lng('Mohaç Ovası','The Plain of Mohács'),
   d:lng(`Osmanlı ordusu Drava'yı geçti. Başpiskopos Tomori Pál, ${rulerName('HUN')}'a Mohaç ovasında hemen savaşmayı öğütlüyor; Erdel voyvodası Zápolya'nın ordusu ise hâlâ yolda.`,`The Ottoman army has crossed the Drava. Archbishop Pál Tomori urges ${rulerName('HUN')} to give battle at once on the plain of Mohács, while the army of John Zápolya, Voivode of Transylvania, is still on the road.`),
   ch:[{l:lng('Mohaç\'ta savaş (6 tur Osmanlı\'ya karşı meydan muharebesinde +10%; kral orduyla birlikte, yenilirse ölebilir)','Give battle at Mohács (+10% in field battles against the Ottomans for 6 turns; the king rides with the army and may die if it is beaten)'),
     next:'end',f:st=>{st.data.king=S.turn+6;}},
    {l:lng('Budin\'e çekil ve Zápolya\'yı bekle (10 tur Budin\'de savunma +20%, kuşatma yavaşlar; güneyde 3 eyalet 4 tur huzursuz)','Fall back on Buda and wait for Zápolya (+20% defence at Buda and a slower siege for 10 turns; 3 provinces in the south restless for 4 turns)'),
     next:'end',f:st=>{st.data.wait=S.turn+10;chnUnrest('HUN',3,4);}}]})}]});
/* The Treaty of Pressburg (1491): if the King of Hungary dies with no heir, the Habsburgs inherit the crown. */
hook('succession',(f,old,neu,how)=>{if(f!=='HUN'||how!=='crisis'||chYear()<BAL_CH2.pressburg||!old||!alive('HUN'))return;
 if(alive('HAB')&&S.player!=='HUN'){chnUnion('HUN','HAB');return;}
 // no Habsburg union (the nobles crowned the Voivode of Transylvania, see chnRename): if Austria lives, Ferdinand claims the crown
 if(alive('HAB')&&!atWar('HAB','HUN')&&!isAlly('HAB','HUN')&&!inTruce('HAB','HUN')){declareWar('HAB','HUN');
  news(lng(`Pressburg Antlaşması'na dayanan ${rulerName('HAB')}, Macar tacını istiyor: iki kral, tek taç.`,`Citing the Treaty of Pressburg, ${rulerName('HAB')} claims the crown of Hungary: two kings, one crown.`),S.player==='HUN'||S.player==='HAB'?'war':'info');}},70);
/** A generated crisis ruler with a name history remembers (called by chSucceed before the news is written). */
function chnRename(f,neu,how){if(f==='HUN'&&how==='crisis'&&chYear()>=1515&&chYear()<=1540&&!chBySeed('HUN','zapolya')&&!(alive('HAB')&&S.player!=='HUN'&&chYear()>=BAL_CH2.pressburg)){
  neu.n='János';neu.rn='Szapolyai János';neu.sk='zapolya';}}
/** from's realm passes whole to heir: provinces, armies, treasury and wars; from leaves the map. */
function chnUnion(from,to){const Fa=S.fac[from],Fb=S.fac[to];if(!Fa||!Fa.alive||!Fb||!Fb.alive)return;
 const enemies=warsOf(from).filter(g=>g!==to);
 const joined=[];for(const g of enemies)if(!atWar(to,g)){if(isAlly(to,g))delete S.ally[key(to,g)];S.war[key(to,g)]=newWar(g,to);joined.push(g);}
 if(atWar(from,to))delete S.war[key(from,to)];
 for(const a of (S.armies||[]))if(a.f===from){const used=new Set(S.armies.filter(x=>x.f===to).map(x=>x.no));let no=1;while(used.has(no))no++;a.f=to;a.no=no;a.gen=null;chAssignGen(a);}
 if(S.sieges)for(const k in S.sieges)if(S.sieges[k].f===from)S.sieges[k].f=to;
 for(let i=0;i<NP;i++){const p=S.prov[i];if(p.ctl===from)p.ctl=to;if(p.o===from){p.o=to;p.un=Math.max(p.un,2);if(p.ctl===to)delete p.ctl;}}
 Fb.gold+=Fa.gold;Fb.mp+=Fa.mp;Fa.gold=0;
 const nm=rulerName(to);
 news(lng(`Pressburg Antlaşması uyarınca Macar tacı Habsburglara geçti: ${nm} artık Macaristan'ın da kralı.`,`Under the Treaty of Pressburg the crown of Hungary passes to the Habsburgs: ${nm} is now King of Hungary as well.`),'cap');
 if(S.player===to)queueModal(()=>eventModal({t:lng('Aziz İştvan Tacı','The Crown of Saint Stephen'),e:dateStr(S.turn),
  d:lng('Macar kralı varis bırakmadan öldü. Pressburg Antlaşması uyarınca Macar Krallığı\'nın toprakları, orduları ve savaşları artık senin. Budin\'in savunması da.','The King of Hungary has died without an heir. Under the Treaty of Pressburg the lands, armies and wars of the Kingdom of Hungary are now yours; so is the defence of Buda.'),
  ch:[{l:lng('Tacı giy','Take up the crown')}]}));
 eliminate(from,to);polDirty=true;joined.forEach(g=>runHooks('warDeclared',g,to));}

/* ---------- 1529: Vienna ---------- */
CHAINS.push({id:'viyana',abort:()=>!alive('OSM')||!alive('HAB')||S.prov[PK.viyana].o!=='HAB',stages:[
 {when:S=>S.turn>=chnTurn(1529)&&chnBorder('OSM','HAB')&&!inTruce('OSM','HAB'),who:()=>'OSM',ai:S=>atWar('OSM','HAB')||strength('OSM')>strength('HAB')*1.2?0:1,fire:st=>({t:lng('Viyana Seferi','The Vienna Campaign'),
   d:lng('Macar ovası Osmanlı atlılarına açık. Sultan, Tuna boyunca Habsburgların kapısı Viyana\'ya yürümek istiyor; ama yol uzun ve yağmurlar erken başlayabilir.','The Hungarian plain lies open to the Ottoman horsemen. The Sultan wants to march up the Danube to Vienna, the gate of the Habsburgs; but the road is long and the rains may come early.'),
   ch:[{l:atWar('OSM','HAB')?lng('Viyana\'ya yürü','March on Vienna'):lng('Viyana\'ya yürü (Avusturya\'ya savaş ilan et)','March on Vienna (declare war on Austria)'),
     f:st=>{st.data.march=S.turn;chnWarOn('OSM','HAB');chnNudge('OSM',{war:'HAB',target:PK.viyana,prio:5});}},
    {l:lng('Macaristan\'ı sağlamlaştır','Secure Hungary first'),next:'end',f:()=>{}}]})},
 {when:S=>atWar('OSM','HAB'),who:()=>'HAB',ai:S=>S.fac.HAB.gold>=BAL_CH2.vieWalls?0:1,fire:st=>({t:lng('Viyana Surları','The Walls of Vienna'),
   d:chLive(chBySeed('HAB','salm'))?lng('Yaşlı ama yılmaz Kont Niklas Salm şehrin savunmasını üstlendi. Surlar eski ve alçak; Osmanlı öncüleri şimdiden Avusturya köylerini yakıyor.','Count Niklas Salm, old but unbowed, has taken charge of the city\'s defence. The walls are old and low, and the Ottoman vanguard is already burning Austrian villages.')
    :lng('Surlar eski ve alçak; Osmanlı öncüleri şimdiden Avusturya köylerini yakıyor. Şehrin savunması hazırlanmalı.','The walls are old and low, and the Ottoman vanguard is already burning Austrian villages. The city\'s defence must be prepared.'),
   ch:[{l:lng(`Surları onar, varoşları yık (−${BAL_CH2.vieWalls} altın; 12 tur Viyana'da savunma +25%, kuşatma yavaşlar)`,`Repair the walls and clear the suburbs (−${BAL_CH2.vieWalls} gold; +25% defence at Vienna and a slower siege for 12 turns)`),dis:S.fac.HAB.gold<BAL_CH2.vieWalls,next:{stage:2,delay:2},
     f:st=>{chnPay('HAB',BAL_CH2.vieWalls);st.data.walls=S.turn+12;}},
    {l:lng(`İmparatordan yardım iste (Viyana'ya +${fmtK(BAL_CH2.vieTroops)} asker; 2 eyalet 4 tur huzursuz)`,`Ask the Emperor for help (+${fmtK(BAL_CH2.vieTroops)} troops at Vienna; 2 provinces restless for 4 turns)`),next:{stage:2,delay:2},
     f:()=>{chnArmy('HAB',PK.viyana,BAL_CH2.vieTroops,'salm');chnUnrest('HAB',2,4);}}]})},
 {when:S=>atWar('OSM','HAB')&&S.turn%4===2&&chnVieNear().length>0,who:()=>'OSM',ai:()=>1,fire:st=>({t:lng('Yağmurlar ve Kış','Rain and Winter'),
   d:lng('Yaz boyunca yağan yağmurlar ağır topları yollarda bıraktırdı; şimdi kış yaklaşıyor. Yeniçeriler hoşnutsuz, erzak azalıyor.','The rains that fell all summer forced the heavy guns to be left on the roads, and now winter is near. The Janissaries grumble and the supplies run low.'),
   ch:[{l:lng('Kuşatmayı sürdür (Viyana önündeki ordular −20% asker)','Keep up the siege (the armies before Vienna lose 20% of their troops)'),next:'end',
     f:()=>{for(const a of chnVieNear())a.n=Math.round(a.n*BAL_CH2.vieCold/100)*100;}},
    {l:lng('Kuşatmayı kaldır ve Budin\'e dön (ordular geri çekilir)','Lift the siege and return to Buda (the armies fall back)'),next:'end',f:()=>chnVieLeave()}]})}]});
/** Ottoman armies at or next to Vienna. */
function chnVieNear(){const v=PK.viyana,near=new Set([v,...PD[v].adj]);return (S.armies||[]).filter(a=>a.f==='OSM'&&near.has(a.loc));}
function chnVieLeave(){const v=PK.viyana;if(S.sieges&&S.sieges[v]&&S.sieges[v].f==='OSM')delete S.sieges[v];
 for(const a of chnVieNear()){const j=chnNearest('OSM',a.loc);if(j>=0){a.loc=j;a.path=[];a.mp=0;}}
 news(lng('Osmanlı ordusu Viyana önünden çekildi. Şehrin çanları sabaha kadar çaldı.','The Ottoman army has withdrawn from before Vienna. The city\'s bells rang until dawn.'),S.player==='HAB'?'good':'info');}

/* ---------- chain modifiers: battle and siege ---------- */
BATTLE_MODS.push(ctx=>{if(!S.chains||!ctx.att||!ctx.def)return null;const out=[],t=S.turn,C=S.chains,side=f=>ctx.att===f?'att':'def';
 const d=id=>C[id]&&C[id].data||{};
 if(ctx.to===PK.otranto&&ctx.att==='ARA'&&(d('otranto').cr||0)>t)out.push({l:lng('Haçlı ordusu','Crusading army'),m:BAL_CH2.otrMul,side:'att',k:'chain'});
 if(chnIs(ctx,'OSM','SAF')){const x=d('caldiran');
  if(ctx.kind==='field'&&(x.guns||0)>t)out.push({l:lng('Osmanlı tüfek ve topları','Ottoman guns and muskets'),m:BAL_CH2.calGuns,side:side('OSM'),k:'chain'});
  if(ctx.att==='SAF'&&(x.charge||0)>t)out.push({l:lng('Kızılbaş hücumu','Qizilbash charge'),m:BAL_CH2.calCharge,side:'att',k:'chain'});
  if(ctx.att==='OSM'&&(x.burn||0)>t)out.push({l:lng('Yakılmış topraklar','Scorched earth'),m:BAL_CH2.calBurn,side:'att',k:'chain'});}
 if(chnIs(ctx,'OSM','MAM')){const x=d('misir');
  if((x.hayir||0)>t&&chnIn(ctx.to,CH2_SYRIA))out.push({l:lng('Hayır Bey\'in ihaneti','Khair Bey\'s betrayal'),m:BAL_CH2.misHayirMul,side:side('MAM'),k:'chain'});
  if((x.rid||0)>t&&ctx.to===PK.kahire&&ctx.def==='MAM')out.push({l:lng('Ridaniye hendeği','The trench at Ridaniya'),m:BAL_CH2.misRidMul,side:'def',k:'chain'});
  if((x.cete||0)>t&&ctx.att==='OSM'&&chnIn(ctx.to,CH2_EGYPT))out.push({l:lng('Bedevi baskınları','Bedouin raids'),m:BAL_CH2.misCete,side:'att',k:'chain'});}
 if(ctx.to===PK.rodos&&ctx.def==='RHO'&&d('rodos').tadini)out.push({l:lng('Tadini\'nin karşı lağımları','Tadini\'s counter-mines'),m:BAL_CH2.rhoTadMul,side:'def',k:'chain'});
 if(chnIs(ctx,'OSM','HUN')){const x=d('mohac');
  if(ctx.kind==='field'&&(x.guns||0)>t)out.push({l:lng('Yeniçeri tüfekleri','Janissary muskets'),m:BAL_CH2.mohGuns,side:side('OSM'),k:'chain'});
  if(ctx.kind==='field'&&(x.king||0)>t)out.push({l:lng('Macar ağır süvarisi','Hungarian heavy horse'),m:BAL_CH2.mohKing,side:side('HUN'),k:'chain'});
  if((x.wait||0)>t&&ctx.to===PK.budin&&ctx.def==='HUN')out.push({l:lng('Budin\'de bekleyiş','Waiting at Buda'),m:BAL_CH2.mohWait,side:'def',k:'chain'});}
 if(ctx.to===PK.viyana&&ctx.def==='HAB'&&(d('viyana').walls||0)>t)out.push({l:lng('Salm\'ın surları','Salm\'s walls'),m:BAL_CH2.vieMul,side:'def',k:'chain'});
 return out.length?out:null;});
CHN_SIEGE.push(s=>{if(!S.chains)return 0;const C=S.chains,d=id=>C[id]&&C[id].data||{};let v=0;
 if(s.i===PK.rodos){if(s.f==='OSM'&&d('rodos').lagim)v+=BAL_CH2.sgLagim;if(d('rodos').tadini&&S.prov[s.i].o==='RHO')v-=BAL_CH2.sgTadini;}
 if(s.i===PK.budin&&S.prov[s.i].o==='HUN'&&(d('mohac').wait||0)>S.turn)v-=BAL_CH2.sgMohWait;
 if(s.i===PK.viyana&&S.prov[s.i].o==='HAB'&&(d('viyana').walls||0)>S.turn)v-=BAL_CH2.sgVieWalls;
 return v;});
/* Chaldiran: a beaten Shah never again leads in person; Mohács: the king drowns in flight; Marj Dabiq: the old sultan falls. */
hook('battleResolved',rep=>{if(!S.chains||!rep||rep.kind!=='field')return;const C=S.chains,t=S.turn;
 const lost=f=>(rep.att===f&&!rep.win)||(rep.def===f&&rep.win),vs=(a,b)=>(rep.att===a&&rep.def===b)||(rep.att===b&&rep.def===a);
 const cal=C.caldiran;if(cal&&(cal.data.charge||0)>t&&!cal.data.beaten&&vs('OSM','SAF')&&lost('SAF')){cal.data.beaten=t;const r=chRuler('SAF');
  if(r){r.traits=r.traits.filter(x=>x!=='cengaver');news(lng(`${chName(r)} Çaldıran'da yaralandı; bir daha ordusunun başında savaşmayacak.`,`${chName(r)} was wounded at Chaldiran; he will never again lead his army in person.`),S.player==='SAF'||S.player==='OSM'?'war':'info');}}
 const mo=C.mohac;if(mo&&(mo.data.king||0)>t&&!mo.data.kingDied&&vs('OSM','HUN')&&lost('HUN')){const r=chRuler('HUN');mo.data.kingDied=t;
  if(r){news(lng(`${chName(r)} Mohaç'tan kaçarken Csele deresinde boğuldu.`,`${chName(r)} drowned in the Csele stream while fleeing from Mohács.`),S.player==='HUN'||S.player==='OSM'?'cap':'info');chKill(r,'battle');}}
 const mi=C.misir;if(mi&&mi.stage>=2&&!mi.done&&!mi.data.dabik&&vs('OSM','MAM')&&lost('MAM')&&chnIn(rep.to,CH2_SYRIA)){mi.data.dabik=t;const r=chRuler('MAM');
  if(r&&chAge(r)>=60){news(lng(`Yaşlı sultan ${chName(r)}, Mercidabık'ta ordusu dağılırken atından düşüp öldü.`,`The old sultan ${chName(r)} fell from his horse and died as his army broke at Marj Dabiq.`),S.player==='MAM'||S.player==='OSM'?'cap':'info');chKill(r,'battle');}}},55);

/* ---------- succession crisis: the claimant war ----------
   A pretender rises in 1-3 provinces of a realm whose throne stood empty, using the reserved FAC slot CH_CLM
   (like the Safavid spawn). He wins the throne if he takes the old capital (or ends a war holding more than he
   started with); he flees if the war ends otherwise or drags on; he is crushed if his last province falls.
   Needs FAC[CH_CLM] (SEAM REQUEST to 01-factions-provinces.js); without it the old crisis (unrest) stays. */
const CH_CLM='CLM';
function chClmSlot(){return !!(FAC[CH_CLM]&&S&&S.fac&&S.fac[CH_CLM]);}
function chClmCan(f){if(!chClmSlot()||!S.c||S.c.clm||S.fac[CH_CLM].alive||f===CH_CLM||!alive(f))return false;
 if(f==='HUN'&&chYear()>=BAL_CH2.pressburg&&alive('HAB')&&S.player!=='HUN')return false; /* Pressburg: Austria inherits the whole realm, no pretender */
return facProvs(f).length>=BAL_CH2.clmMinProvs;}
/** A darker, greyer shade of the old realm's colour for the pretender. */
function chClmCol(h){const m=/^#?([0-9a-f]{6})$/i.exec(h||'');if(!m)return '#5a4f46';const n=parseInt(m[1],16),mix=(v,g)=>Math.round(v*.55+g*.45);
 const r=mix(n>>16&255,70),g=mix(n>>8&255,62),b=mix(n&255,56);return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);}
/** Names and faith of the claimant slot from the save (FAC entries are rebuilt at every page load). */
function chClmApply(){const x=S&&S.c&&(S.c.clm||S.c.clmKeep);if(!x||!FAC[CH_CLM])return;const F=FAC[CH_CLM],c=S.chars[x.id],nm=c?chDisp(c.n,x.f):chDisp(x.nm||'',x.f);
 F.s=lng(`Davacı ${nm}`,`${nm} the Pretender`);F.n=lng(`Davacı ${nm} Taraftarları`,`Partisans of ${nm} the Pretender`);F.r=nm;F.rel=FAC[x.f].rel;if(x.col)F.c=x.col;}
/** Raise a pretender in f. Returns the claimant character, or null. */
function chClmSpawn(f){if(!chClmCan(f))return null;const F=S.fac[f],cap=F.cap,own=new Set(facProvs(f));
 const dist={};dist[cap]=0;let fr=[cap];for(let d=1;fr.length;d++){const nx=[];for(const i of fr)for(const j of PD[i].adj)if(own.has(j)&&dist[j]==null){dist[j]=d;nx.push(j);}fr=nx;}
 // the seed: a restless province far from the capital, joined to it by land (exclaves only when nothing else is left),
 // with room to grow to n provinces
 const nOwn=i=>PD[i].adj.filter(j=>own.has(j)&&j!==cap).length;
 const cand=[...own].filter(i=>i!==cap).sort((a,b)=>((dist[b]!=null)-(dist[a]!=null))||((S.prov[b].un>0)-(S.prov[a].un>0))||(Math.min(nOwn(b),2)-Math.min(nOwn(a),2))||((dist[b]??0)-(dist[a]??0))||(S.prov[b].dev-S.prov[a].dev));
 const n=Math.min(3,1+(own.size>=10?1:0)+(own.size>=20?1:0),own.size-2);if(n<1||!cand.length)return null;
 const take=[cand[0]];for(let k=0;k<take.length&&take.length<n;k++)for(const j of PD[take[k]].adj)if(take.length<n&&own.has(j)&&j!==cap&&!take.includes(j))take.push(j);
 const sd=CH_SEED[f]||{},pool=CH_NAMES[sd.cul==='pp'?'it':sd.cul]||CH_NAMES.tr;
 const c=chCreate({n:chPick(pool)+(sd.sur?' '+chPick(sd.sur):''),f:CH_CLM,role:'ruler',born:chYear()-(24+Math.floor(R()*18)),dyn:sd.dyn||null,skill:2,traits:['cengaver'],t:'Taht davacısı'});
 c.acc=S.turn;c.keep=1;
 const C=S.fac[CH_CLM];Object.assign(C,{alive:true,gold:BAL_CH2.clmGold,mp:5000,cannon:F.cannon,ruler:c.id,heir:null,gens:[],nextOffer:0});
 for(const i of take){const p=S.prov[i];p.o=CH_CLM;p.un=0;delete p.ctl;if(S.sieges&&S.sieges[i])delete S.sieges[i];chnEvict(i);}
 C.cap=take.slice().sort((a,b)=>S.prov[b].dev-S.prov[a].dev)[0];
 if(S.ai)S.ai[CH_CLM]=newAi();
 FK.forEach(g=>{if(g!==CH_CLM)S.op[key(CH_CLM,g)]=g===f?-100:0;delete S.ally[key(CH_CLM,g)];});
 S.c.clm={f,id:c.id,nm:c.n,t0:S.turn,start:take.length,cap0:cap,col:chClmCol(FAC[f].c)};S.c.clmKeep=null;chClmApply();
 const size=Math.max(BAL_CH2.clmArmyMin,Math.min(BAL_CH2.clmArmyMax,strength(f)*BAL_CH2.clmArmy));
 const a=chnArmy(CH_CLM,C.cap,size);if(a){a.gen=c.id;}
 S.war[key(CH_CLM,f)]=newWar(CH_CLM,f);runHooks('warDeclared',CH_CLM,f);
 chnNudge(CH_CLM,{war:f,target:cap,prio:4,until:S.turn+BAL_CH2.clmMax});
 const nm=chDisp(c.n,f),where=take.map(i=>PD[i].name).join(', ');polDirty=true;
 chNews(f,lng(`${FAC[f].s}: taht davacısı ${nm}, ${where} eyaletlerinde ayaklandı ve tahtı istiyor.`,`${FAC[f].s}: the pretender ${nm} has risen in ${where} and claims the throne.`),'war');
 if(f===S.player)queueModal(()=>eventModal({t:lng('İç Savaş','Civil War'),e:dateStr(S.turn),
  d:lng(`Taht boşken beylerin bir kısmı ${nm} adında bir davacının etrafında toplandı. ${where} artık onun elinde ve ordusu ${PD[cap].name} üzerine yürüyor. Başkenti düşerse taht onun olur.`,`While the throne stood empty, some of the nobles rallied to a pretender named ${nm}. ${where} ${take.length>1?'are':'is'} now in his hands, and his army marches on ${PD[cap].name}. If the capital falls, the throne is his.`),
  ch:[{l:lng('Asileri ez','Crush the rebels')}]}));
 return c;}
/** Remove the claimant realm from the map without the elimination news of a conquered realm. */
function chClmDissolve(by){const C=S.fac[CH_CLM];if(!C||!C.alive)return;
 for(const i of facProvs(CH_CLM))chnCede0(i,by);
 for(const a of (S.armies||[]).filter(x=>x.f===CH_CLM))armyRemove(a.id,'disbanded');
 C.alive=false;C.heir=null;C.gens=[];Object.keys(S.war).forEach(k=>{if(k.split('|').includes(CH_CLM))delete S.war[k];});Object.keys(S.ally).forEach(k=>{if(k.split('|').includes(CH_CLM))delete S.ally[k];});
 S.offers=(S.offers||[]).filter(o=>o.f!==CH_CLM);if(S.sieges)for(const k in S.sieges)if(S.sieges[k].f===CH_CLM)delete S.sieges[k];
 runHooks('eliminate',CH_CLM,by);polDirty=true;}
/** Hand a claimant province back quietly (no elimination check: the slot is dissolved by the caller). */
function chnCede0(i,to){const p=S.prov[i];p.o=to;delete p.ctl;p.un=Math.max(p.un,2);if(S.sieges&&S.sieges[i])delete S.sieges[i];chnEvict(i);}
/** End the claimant war: 'won' (he takes the throne), 'exiled', 'crushed' or 'dead'. */
function chClmEnd(how){const x=S.c&&S.c.clm;if(!x)return;S.c.clm=null;const f=x.f,c=S.chars[x.id],nm=chDisp(x.nm,f);
 if(how==='won'&&alive(f)){for(const a of (S.armies||[]).filter(y=>y.f===CH_CLM)){const used=new Set(S.armies.filter(z=>z.f===f).map(z=>z.no));let no=1;while(used.has(no))no++;a.f=f;a.no=no;a.gen=null;}
  if(chLive(c)){c.f=f;c.role='heir';delete c.t;c.acc=null;S.fac[f].heir=c.id;}
  chClmDissolve(f);if(S.prov[x.cap0].o===f)S.fac[f].cap=x.cap0;chNews(f,lng(`${FAC[f].s}: davacı ${nm} başkente girdi ve tahtı ele geçirdi!`,`${FAC[f].s}: the pretender ${nm} has entered the capital and seized the throne!`),'cap');
  const old=chRuler(f);if(old&&chLive(c)&&old!==c)chKill(old,'deposed');else if(chLive(c)&&!old)chSucceed(f,null);}
 else{if(chLive(c)){c.f=f;c.role='claimant';delete c.t;for(const y of (S.armies||[]))if(y.gen===c.id)y.gen=null;}
  if(alive(f))chClmDissolve(f);
  if(chLive(c)&&how==='crushed')chKill(c,'executed');
  const m=how==='crushed'?lng(`${FAC[f].s}: davacı ${nm}'in isyanı bastırıldı.`,`${FAC[f].s}: the revolt of the pretender ${nm} has been crushed.`)
   :how==='dead'?lng(`${FAC[f].s}: davacı ${nm} öldü; taraftarları dağıldı ve eyaletleri geri döndü.`,`${FAC[f].s}: the pretender ${nm} is dead; his partisans have scattered and his provinces have returned.`)
   :lng(`${FAC[f].s}: davacı ${nm} desteğini yitirip sürgüne kaçtı; eyaletleri geri döndü.`,`${FAC[f].s}: the pretender ${nm} has lost his support and fled into exile; his provinces have returned.`);
  chNews(f,m,f===S.player?'good':'info');}}
function chClmTick(){const x=S.c&&S.c.clm;if(!x)return;
 if(!alive(CH_CLM)){chClmEnd('crushed');return;}
 if(!alive(x.f)){S.c.clmKeep=x;S.c.clm=null;return;}   // the old realm is gone: the pretender's realm lives on as it is
 if(!chLive(S.chars[x.id])){chClmEnd('dead');return;}
 if(S.prov[x.cap0].o===CH_CLM||chnCtl(x.cap0)===CH_CLM){chClmEnd('won');return;}
 if(!atWar(CH_CLM,x.f)||S.turn-x.t0>=BAL_CH2.clmMax)chClmEnd(facProvs(CH_CLM).length>x.start?'won':'exiled');}
hook('roundEnd',()=>chClmTick(),45);
hook('eliminate',f=>{if(f===CH_CLM&&S.c&&S.c.clm)chClmEnd('crushed');},40);
hook('peace',(a,b)=>{const x=S.c&&S.c.clm;if(x&&((a===CH_CLM&&b===x.f)||(b===CH_CLM&&a===x.f)))chClmTick();},60);
/* the pretender fights for one throne only */
hook('warDeclared',(a,b)=>{const x=S.c&&S.c.clm;if(x&&a===CH_CLM&&b!==x.f&&S.war[key(a,b)])delete S.war[key(a,b)];},90);
hook('enterGame',()=>chClmApply(),30);
hook('migrate',s=>{if(s.c){if(s.c.clm===undefined)s.c.clm=null;if(s.c.clmKeep===undefined)s.c.clmKeep=null;}},30);

/* ---------- capture flavour by culture ---------- */
const CH_FLAV={
 tr:[`Osmanlı sancağı {p} burçlarında; tahrir kâtipleri köyleri deftere yazıyor.`,`The Ottoman banner flies over {p}; the scribes are already entering its villages in the tax registers.`],
 tk:[`Türkmen obaları {p} yaylalarına kondu; beyler ganimeti paylaşıyor.`,`Turkmen clans pitch their tents on the pastures of {p}, and the beys share out the spoils.`],
 mm:[`Memlük emirleri {p} kalesine girdi; Kahire'ye müjdeci yola çıktı.`,`Mamluk emirs have entered the citadel of {p}, and a herald rides to Cairo with the news.`],
 ar:[`Hafsî sancağı {p} üzerinde; hutbe Tunus sultanı adına okunuyor.`,`The Hafsid banner flies over {p}; the Friday sermon is read in the name of the Sultan of Tunis.`],
 tt:[`Tatar atlıları {p} ovasını yağmaladı; han, şehrin ileri gelenlerinden haraç aldı.`,`Tatar horsemen have plundered the plain of {p}, and the khan has taken tribute from its notables.`],
 gr:[`Çift başlı kartal {p} surlarında; rahipler şükran ayini yapıyor.`,`The double-headed eagle flies over {p}, and the priests sing a liturgy of thanksgiving.`],
 sr:[`Sırp şövalyeleri {p} kalesine girdi; despot adına sikke basılacak.`,`Serbian knights have entered {p}; coins will be struck in the Despot's name.`],
 ro:[`Voyvodanın boyarları {p} şehrine girdi; manastırlara bağış sözü verildi.`,`The voivode's boyars have entered {p}, and gifts are promised to the monasteries.`],
 hu:[`Macar sancağı {p} burçlarında; kral bir Te Deum okuttu.`,`The Hungarian banner flies over {p}, and the king has a Te Deum sung.`],
 de:[`Habsburg kartalı {p} kulelerinde; paralı askerler ücretlerini istiyor.`,`The Habsburg eagle flies over {p}, and the landsknechts demand their pay.`],
 pl:[`Leh süvarileri {p} şehrine girdi; soylular yeni topraklar için kura çekiyor.`,`Polish horsemen have ridden into {p}, and the nobles draw lots for the new lands.`],
 it:[`{p} artık İtalyan tüccarların elinde; gümrük defterleri yeniden açıldı.`,`{p} is now in the hands of Italian merchants, and the customs ledgers are opened anew.`],
 es:[`Aragon sancağı {p} üzerinde; kral kaleye bir kumandan atadı.`,`The banner of Aragon flies over {p}, and the king has named a castellan.`],
 fr:[`Latin şövalyeleri {p} kalesine girdi; kilisede şükran ayini yapılıyor.`,`Latin knights have entered {p}, and a mass of thanksgiving is sung in the church.`],
 ka:[`Gürcü kralının sancağı {p} üzerinde; kiliselerde çanlar çalıyor.`,`The Georgian king's banner flies over {p}, and the church bells are ringing.`],
 sq:[`Arnavut dağlıları {p} kalesine girdi ve beşa yemini etti.`,`Albanian highlanders have entered {p} and sworn the besa.`],
 pp:[`Papalık birlikleri {p} şehrine girdi; bir kardinal vali atandı.`,`Papal troops have entered {p}, and a cardinal has been named governor.`]};
const CH_FLAV_F={
 VEN:[`Aziz Markos aslanı {p} kapısının üstüne kondu.`,`The Lion of Saint Mark is set above the gate of {p}.`],
 GEN:[`Ceneviz tüccarları {p} gümrüğünü devraldı; San Giorgio bankası defter açtı.`,`Genoese merchants have taken over the customs of {p}, and the Bank of Saint George opens a ledger.`],
 RHO:[`Hospitalier haçı {p} kalesinde dalgalanıyor.`,`The cross of the Hospitallers flies over {p}.`],
 SAF:[`Kızılbaş müritler {p} şehrine girdi; hutbe Şah adına okunuyor.`,`Qizilbash disciples have entered {p}, and the sermon is read in the Shah's name.`]};
const CH_FLAV_REL={
 mosque:[`{p} büyük kilisesinde ilk Cuma namazı kılındı; kilise artık bir cami.`,`The first Friday prayer is held in the great church of {p}, which is now a mosque.`],
 church:[`{p} büyük camisi kilise olarak kutsandı; çanlar yeniden çalıyor.`,`The great mosque of {p} has been consecrated as a church, and the bells ring once more.`]};
/** Chronicle line when nf takes province i from old (null when there is nothing to say). */
function chFlavText(i,nf,old){if(nf===CH_CLM||old===CH_CLM||!FAC[nf]||!FAC[old])return null;const rn=FAC[nf].rel,ro=FAC[old].rel;
 let e=rn==='İslam'&&ro!=='İslam'?CH_FLAV_REL.mosque:rn!=='İslam'&&ro==='İslam'?CH_FLAV_REL.church:null;
 if(!e)e=CH_FLAV_F[nf]||CH_FLAV[(CH_SEED[nf]||{}).cul||'tr'];if(!e)return null;
 return lng(e[0],e[1]).split('{p}').join(PD[i].name);}
hook('capture',(i,nf,old)=>{if(!S.player||nf===old)return;const me=nf===S.player||old===S.player;if(!me&&S.prov[i].dev<BAL_CH2.flavDev)return;
 const m=chFlavText(i,nf,old);if(m)addLog(m,'info');},60);
/* a siege that ends in occupation (Track B) */
hook('siegeFell',(i,f)=>{if(!S.player||!PD[i])return;const s=S.sieges&&S.sieges[i],n=s&&s.t0!=null?S.turn-s.t0:null,me=f===S.player||S.prov[i].o===S.player;
 if(!me&&S.prov[i].dev<BAL_CH2.flavDev)return;const nm=chBattleName({to:i,kind:'siege'});
 addLog(n?lng(`${nm}: ${n} tur süren kuşatmadan sonra şehir ${FAC[f].s} kuvvetlerine teslim oldu.`,`${nm}: after a siege of ${n} turns the city surrendered to the forces of ${FAC[f].s}.`)
  :lng(`${nm}: şehir ${FAC[f].s} kuvvetlerine teslim oldu.`,`${nm}: the city surrendered to the forces of ${FAC[f].s}.`),me?'war':'info');},60);

/* ---------- battle names in the chronicle ---------- */
/** Field battles fought where a famous battle was fought keep that battle's name. */
const CH_BNAME={pecuy:['Mohaç','Mohács'],hoy:['Çaldıran','Chaldiran'],halep:['Mercidabık','Marj Dabiq'],kahire:['Ridaniye','Ridaniya'],
 erzincan:['Otlukbeli','Otlukbeli'],novobirda:['Kosova','Kosovo'],yas:['Vaslui','Vaslui'],nigbolu:['Niğbolu','Nicopolis']};
/** "Mohaç Muharebesi" / "Battle of Mohács", "Belgrad Kuşatması" / "Siege of Belgrade". */
function chBattleName(rep){const d=PD[rep.to];if(!d)return '';const h=CH_BNAME[d.key],field=rep.kind==='field';
 const place=field&&h?lng(h[0],h[1]):d.name;
 return field?lng(`${place} Muharebesi`,`Battle of ${place}`):rep.kind==='sally'?lng(`${place} Çıkışı`,`Sortie at ${place}`):lng(`${place} Kuşatması`,`Siege of ${place}`);}
let chBnTurn=-1,chBnN=0;
hook('battleResolved',rep=>{if(!S.player||!rep||rep.to==null||!PD[rep.to])return;const nm=chBattleName(rep);rep.bname=nm;
 const me=rep.att===S.player||rep.def===S.player||(rep.defFs||[]).includes(S.player);
 const big=rep.n>=BAL_CH2.bnameBig||(rep.aLoss||0)+(rep.dLoss||0)>=BAL_CH2.bnameLoss||!!rep.genFate;
 if(!me&&!big)return;if(!me){if(chBnTurn!==S.turn){chBnTurn=S.turn;chBnN=0;}if(++chBnN>BAL_CH2.bnamePerTurn)return;}
 const W=rep.win?rep.att:rep.def,Lz=rep.win?rep.def:rep.att,a=fmtK(rep.n),d=fmtK(rep.defT||0);
 let m=lng(`${nm}: ${FAC[W].s}, ${FAC[Lz].s} karşısında zafer kazandı (${a} saldıran, ${d} savunan).`,`${nm}: ${FAC[W].s} defeated ${FAC[Lz].s} (${a} attacking, ${d} defending).`);
 if(rep.genFate&&rep.genFate.t)m+=' '+rep.genFate.t;
 addLog(m,me?'war':'info');},60);

KE.chn={tick:()=>chnTick(),state:id=>chnState(id),
 choose:(id,k)=>{const C=CHAINS.find(x=>x.id===id),st=chnState(id);if(!C||st.done||!C.stages[st.stage])return false;const spec=C.stages[st.stage].fire(st);chnChoose(C,st,k,spec);return true;},
 cede:(i,f)=>chnCede(i,f),union:(a,b)=>chnUnion(a,b),clmCan:f=>chClmCan(f),clmSpawn:f=>{const c=chClmSpawn(f);return c?c.id:null;},
 clmEnd:h=>chClmEnd(h),clmTick:()=>chClmTick(),bname:rep=>chBattleName(rep),flav:(i,nf,old)=>chFlavText(i,nf,old),turn:y=>chnTurn(y),bal:BAL_CH2,CLM:CH_CLM};
