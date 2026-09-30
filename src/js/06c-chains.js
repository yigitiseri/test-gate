/* =====================================================================
   HISTORICAL CHAINS (Track C): soft-scripted, conditional event chains.
   CHAINS.push({id,abort?(S,st),stages:[{when(S,st),who?(S,st)->faction|null,
     fire(st)->{t,d,ch:[{l,dis?,f?(st),next?:{stage,delay}|'end'}]},ai?(S,st)->choice index}]})
   State: S.chains[id]={stage,t,data,done,wait}. A stage fires when S.turn>=st.t and when() holds.
   If the deciding faction is the player, a modal asks (and survives a reload); otherwise
   the AI picks ai() (default 0; a disabled choice falls back to the first enabled one).
   A choice without next goes to the following stage; 'end' closes the chain.
   ===================================================================== */
const BAL_CHN={fetihFrom:4,fetihWar:7,hisar:40,hisarMul:1.10,gemi:30,gemiMul:1.15,giust:50,giustMul:1.20,zincir:25,zincirMul:1.10,
 belgradFrom:20,kapMul:1.15,kapGold:40,otlukFrom:84,otlukGold:40,otlukMul:1.15,cemPay:3,
 /* W2 sieges (Track B): extra siege progress per turn (in turns of progress) from the 1453 choices, and how often
    the Ottoman target nudge on the city is renewed while the war lasts */
 sgHisar:.25,sgGemi:.35,sgGiust:.3,sgZincir:.2,fetihRenew:8};
const CHAINS=[];
function chnState(id){return S.chains[id]||(S.chains[id]={stage:0,t:0,data:{},done:false,wait:false});}
const chnNudge=(f,spec)=>{if(typeof aiNudge==='function'&&alive(f))aiNudge(f,{prio:3,until:S.turn+40,...spec});};
const chnOwn=(k,f)=>S.prov[PK[k]].o===f;
function chnUnrest(f,n,turns){const ps=facProvs(f).filter(i=>i!==S.fac[f].cap);for(let k=0;k<n&&ps.length;k++){const i=ps.splice(Math.floor(R()*ps.length),1)[0];S.prov[i].un=Math.max(S.prov[i].un,turns);}}
function chnTick(){if(!S.chains)return;
 for(const C of CHAINS){const st=chnState(C.id);if(st.done||st.wait)continue;
  let ab=false;try{ab=!!(C.abort&&C.abort(S,st));}catch(e){console.error('chain '+C.id,e);ab=true;}
  if(ab){st.done=true;continue;}
  const sg=C.stages[st.stage];if(!sg){st.done=true;continue;}if(S.turn<st.t)continue;
  let ok=false;try{ok=!!sg.when(S,st);}catch(e){console.error('chain '+C.id,e);}
  if(ok)chnFire(C,st);}}
function chnFire(C,st){const sg=C.stages[st.stage],who=sg.who?sg.who(S,st):null;
 if(who&&who===S.player){st.wait=true;chAsk('chain',{id:C.id,stage:st.stage});return;}
 const spec=sg.fire(st);let k=sg.ai?sg.ai(S,st):0;if(!spec.ch[k]||spec.ch[k].dis){k=spec.ch.findIndex(c=>!c.dis);if(k<0)k=spec.ch.length-1;}
 chnChoose(C,st,k,spec);}
function chnChoose(C,st,k,spec){const c=spec.ch[k]||spec.ch[0];st.wait=false;
 try{if(c.f)c.f(st);}catch(e){console.error('chain '+C.id,e);}
 const nx=c.next||{stage:st.stage+1,delay:0};
 if(nx==='end'||!C.stages[nx.stage]){st.done=true;return;}st.stage=nx.stage;st.t=S.turn+(nx.delay||0);}
CH_PEND.chain=({id,stage})=>{const C=CHAINS.find(x=>x.id===id),st=S.chains[id];if(!C||!st||st.done||st.stage!==stage){if(st)st.wait=false;return null;}
 const spec=C.stages[stage].fire(st);return {t:spec.t,d:spec.d,ch:spec.ch.map((c,k)=>({l:c.l,dis:c.dis,f:()=>chnChoose(C,st,k,spec)}))};};
hook('newTurn',()=>chnTick(),21);

/* ---------- 1453: Konstantiniyye ---------- */
CHAINS.push({id:'fetih',abort:S=>!alive('OSM')||!alive('BYZ')||!chnOwn('istanbul','BYZ'),stages:[
 {when:S=>S.turn>=BAL_CHN.fetihFrom,who:()=>'OSM',ai:S=>S.fac.OSM.gold>=BAL_CHN.hisar?0:1,fire:st=>({t:lng('Boğazkesen Hisarı','The Strait-Cutter Fortress'),
   d:lng('Sultan, Boğaz\'ın Avrupa yakasında, Anadolu Hisarı\'nın karşısına bir hisar yaptırmak istiyor. Hisar bitince Karadeniz\'den Konstantiniyye\'ye gelecek yardım kesilecek.','The Sultan wants a fortress built on the European shore of the Bosphorus, facing the old Anatolian castle. Once it stands, no help can reach Constantinople from the Black Sea.'),
   ch:[{l:lng(`Hisarı yaptır (−${BAL_CHN.hisar} altın; Konstantiniyye\'ye saldırıda +10%, kuşatma daha hızlı)`,`Build the fortress (−${BAL_CHN.hisar} gold; +10% when attacking Constantinople, a faster siege)`),dis:S.fac.OSM.gold<BAL_CHN.hisar,next:{stage:1,delay:2},f:st=>{S.fac.OSM.gold-=BAL_CHN.hisar;st.data.hisar=1;chnNudge('OSM',{war:'BYZ',target:PK.istanbul});
      news(lng('Osmanlı, Boğaz\'ın Avrupa yakasında Boğazkesen Hisarı\'nı yükseltiyor. Konstantiniyye\'nin Karadeniz yolu kesildi.','The Ottomans are raising the Strait-Cutter fortress on the European shore of the Bosphorus. Constantinople\'s road to the Black Sea is cut.'),S.player==='BYZ'?'war':'info');}},
    {l:lng('Acele etme (kuşatma bir yıl gecikir)','Do not hurry (the siege is delayed by a year)'),next:{stage:0,delay:6},f:()=>{}}]})},
 {when:S=>S.turn>=BAL_CHN.fetihWar&&!inTruce('OSM','BYZ'),who:()=>'OSM',fire:st=>({t:lng('Konstantiniyye Seferi','The Constantinople Campaign'),
   d:lng('Urban\'ın dev topları Edirne\'den yola çıkmaya hazır. Divan, bin yıllık şehrin surlarına yürümek için sultanın emrini bekliyor.','Urban\'s great guns are ready to roll out of Adrianople. The Divan awaits the Sultan\'s order to march on the walls of the thousand-year city.'),
   ch:[{l:lng('Savaş ilan et ve surlara yürü','Declare war and march on the walls'),next:{stage:2,delay:0},f:st=>{if(!atWar('OSM','BYZ'))declareWar('OSM','BYZ');st.data.war=S.turn;chnNudge('OSM',{war:'BYZ',target:PK.istanbul,prio:5});}},
    {l:lng('Bir yıl daha bekle','Wait another year'),next:{stage:1,delay:4},f:()=>{}}]})},
 {when:S=>atWar('OSM','BYZ'),who:()=>'BYZ',ai:S=>S.fac.BYZ.gold>=BAL_CHN.giust?0:S.fac.BYZ.gold>=BAL_CHN.zincir?1:2,fire:st=>({t:lng('Cenevizli Giustiniani','Giustiniani the Genoese'),
   d:lng('Cenevizli kumandan Giovanni Giustiniani Longo, 700 askerle Haliç\'e geldi. Surların savunmasını üstlenmeye hazır, ama ücret istiyor. Haliç\'in ağzına demir bir zincir germek de mümkün.','The Genoese captain Giovanni Giustiniani Longo has reached the Golden Horn with 700 men. He is ready to take charge of the walls, but he wants to be paid. An iron chain could also be stretched across the mouth of the Golden Horn.'),
   ch:[{l:lng(`Giustiniani\'yi tut (−${BAL_CHN.giust} altın; o yaşadıkça surlarda savunma +20%, kuşatma yavaşlar)`,`Hire Giustiniani (−${BAL_CHN.giust} gold; +20% defence on the walls and a slower siege while he lives)`),dis:S.fac.BYZ.gold<BAL_CHN.giust,f:st=>{S.fac.BYZ.gold-=BAL_CHN.giust;
      const g=chCreate({n:'Giovanni Giustiniani',f:'BYZ',role:'gen',born:1418,hd:1453,skill:3,dyn:'Giustiniani'});S.fac.BYZ.gens.push(g.id);st.data.giust=g.id;news(lng('Giustiniani, Theodosius surlarının savunmasını üstlendi.','Giustiniani has taken command of the Theodosian Walls.'),S.player==='OSM'?'war':'info');}},
    {l:lng(`Haliç\'e zincir ger (−${BAL_CHN.zincir} altın; surlarda savunma +10%, kuşatma yavaşlar)`,`Chain the Golden Horn (−${BAL_CHN.zincir} gold; +10% defence on the walls and a slower siege)`),dis:S.fac.BYZ.gold<BAL_CHN.zincir,f:st=>{S.fac.BYZ.gold-=BAL_CHN.zincir;st.data.zincir=1;news(lng('Haliç\'in ağzına demir zincir gerildi.','An iron chain now closes the mouth of the Golden Horn.'),S.player==='OSM'?'war':'info');}},
    {l:lng('Hazineyi koru, surlara güven','Save the treasury and trust the walls'),f:()=>{}}]})},
 {when:S=>atWar('OSM','BYZ'),who:()=>'OSM',ai:S=>S.fac.OSM.gold>=BAL_CHN.gemi?0:1,fire:st=>({t:lng('Gemiler Karadan Yürüdü','Ships over Land'),
   d:st.data.zincir?lng('Zincir Haliç\'i kapatıyor. Mimarlar, gemileri yağlanmış kızaklarla Galata sırtlarından aşırıp Haliç\'e indirmeyi öneriyor.','The chain closes the Golden Horn. The engineers propose hauling the ships on greased slipways over the hills of Galata and down into the Horn.'):lng('Haliç\'in surları zayıf. Mimarlar, gemileri kızaklarla Galata sırtlarından aşırıp Haliç\'e indirmeyi öneriyor.','The walls along the Golden Horn are weak. The engineers propose hauling the ships on slipways over the hills of Galata and down into the Horn.'),
   ch:[{l:lng(`Gemileri karadan yürüt (−${BAL_CHN.gemi} altın; Konstantiniyye\'ye saldırıda +15%, kuşatma hızlanır, zincir işe yaramaz)`,`Haul the ships over land (−${BAL_CHN.gemi} gold; +15% when attacking Constantinople, a faster siege, and the chain is useless)`),dis:S.fac.OSM.gold<BAL_CHN.gemi,f:st=>{S.fac.OSM.gold-=BAL_CHN.gemi;st.data.gemi=1;
      news(lng('Osmanlı gemileri bir gecede karadan yürüyerek Haliç\'e indi!','In a single night the Ottoman ships crossed over land and slid into the Golden Horn!'),S.player==='BYZ'?'war':'cap');}},
    {l:lng('Kara surlarına yüklen','Press the land walls'),f:()=>{}}]})},
 {when:S=>!atWar('OSM','BYZ'),fire:st=>({t:'',d:'',ch:[{l:'',next:{stage:1,delay:12},f:st=>{st.data.tries=(st.data.tries||0)+1;if(st.data.tries>=3)st.done=true;
   news(lng('Osmanlı kuşatması kaldırıldı; Konstantiniyye bir kez daha ayakta kaldı.','The Ottoman siege is lifted; Constantinople still stands once more.'),S.player==='BYZ'||S.player==='OSM'?'good':'info');}}]})}]});

/* ---------- 1456: Belgrad ---------- */
CHAINS.push({id:'belgrad',abort:S=>!alive('OSM')||!alive('HUN')||!chnOwn('belgrad','HUN'),stages:[
 {when:S=>S.turn>=BAL_CHN.belgradFrom&&!inTruce('OSM','HUN')&&!atWar('OSM','BYZ'),who:()=>'OSM',ai:S=>strength('OSM')>strength('HUN')*1.2?0:1,fire:st=>({t:lng('Belgrad Seferi','The Belgrade Campaign'),
   d:lng('Sultan, Macarların Tuna\'daki kilidi Belgrad\'a yürümek istiyor. Kale düşerse Macar ovası açılacak.','The Sultan wants to march on Belgrade, the Hungarians\' lock on the Danube. If the fortress falls, the Hungarian plain lies open.'),
   ch:[{l:lng('Belgrad\'a yürü (Macarlara savaş ilan et)','March on Belgrade (declare war on Hungary)'),next:{stage:1,delay:0},f:()=>{if(!atWar('OSM','HUN'))declareWar('OSM','HUN');chnNudge('OSM',{war:'HUN',target:PK.belgrad});}},
    {l:lng('Tuna\'yı şimdilik rahat bırak','Leave the Danube in peace for now'),next:{stage:0,delay:8},f:()=>{}}]})},
 {when:S=>atWar('OSM','HUN'),who:()=>'HUN',fire:st=>({t:lng('Kapistran\'ın Haçlıları','Capistrano\'s Crusaders'),
   d:lng('Yaşlı rahip Giovanni da Capistrano, vaazlarıyla binlerce köylüyü Belgrad\'ı savunmak için topladı. Kaleye alınabilirler; ama silahsız ve disiplinsizler. Ya da paralı askerler tutulabilir.','The old friar Giovanni da Capistrano has preached thousands of peasants into coming to defend Belgrade. They can be taken into the fortress, but they are unarmed and undisciplined. Or mercenaries can be hired instead.'),
   ch:[{l:lng('Haçlıları kaleye al (Belgrad\'a +3.000 asker; 2 eyalet 4 tur huzursuz)','Take the crusaders in (+3,000 troops at Belgrade; unrest in 2 provinces for 4 turns)'),next:{stage:2,delay:3},f:st=>{evTroops('HUN',PK.belgrad,3000);chnUnrest('HUN',2,4);}},
    {l:lng(`Paralı asker tut (−${BAL_CHN.kapGold} altın; Belgrad\'da savunma +15%, 8 tur)`,`Hire mercenaries (−${BAL_CHN.kapGold} gold; +15% defence at Belgrade for 8 turns)`),dis:S.fac.HUN.gold<BAL_CHN.kapGold,next:{stage:2,delay:3},f:st=>{S.fac.HUN.gold-=BAL_CHN.kapGold;st.data.par=S.turn+8;}},
    {l:lng('Kalenin surlarına güven','Trust the fortress walls'),next:{stage:2,delay:3},f:()=>{}}]})},
 {when:()=>true,fire:st=>({t:'',d:'',ch:[{l:'',next:'end',f:()=>{const h=chBySeed('HUN','hunyadi');
   news(lng('Papa\'nın emriyle öğle çanları Belgrad\'ın savunucuları için çalıyor.','By order of the Pope, the noon bells ring for the defenders of Belgrade.'),'info');if(chLive(h)&&R()<.6)chKill(h,'plague');}}]})}]});

/* ---------- 1473: Otlukbeli ---------- */
CHAINS.push({id:'otlukbeli',abort:S=>!alive('OSM')||!alive('AKK'),stages:[
 {when:S=>S.turn>=BAL_CHN.otlukFrom&&!inTruce('OSM','AKK')&&!atWar('OSM','AKK'),who:()=>'AKK',ai:S=>strength('AKK')>=strength('OSM')*.35?0:1,fire:st=>({t:lng('Venedik Elçileri','The Venetian Envoys'),
   d:lng(`Venedik elçisi Caterino Zeno, ${rulerName('AKK')}\'ın sarayında: Cumhuriyet, Osmanlı\'ya karşı birlikte savaşmayı ve top göndermeyi teklif ediyor.`,`The Venetian envoy Caterino Zeno is at the court of ${rulerName('AKK')}: the Republic offers to fight the Ottomans together and to send cannon.`),
   ch:[{l:lng('İttifakı kabul et, Osmanlı\'ya savaş aç (Venedik topları gelir)','Accept the alliance and declare war on the Ottomans (Venetian cannon arrive)'),next:{stage:1,delay:2},f:()=>{S.fac.AKK.cannon=1;
      if(alive('VEN')&&!atWar('AKK','VEN')&&!isAlly('AKK','VEN')){S.ally[key('AKK','VEN')]=true;addLog(lng('Akkoyunlu ile Venedik Osmanlı\'ya karşı ittifak kurdu.','The Aq Qoyunlu and Venice formed an alliance against the Ottomans.'));}
      declareWar('AKK','OSM');chnNudge('AKK',{war:'OSM'});}},
    {l:lng('Osmanlı ile barışı koru (−20 altın hediye; ilişki +20)','Keep the peace with the Ottomans (−20 gold in gifts; relations +20)'),dis:S.fac.AKK.gold<20,next:'end',f:()=>{S.fac.AKK.gold-=20;addOp('AKK','OSM',20);}}]})},
 {when:S=>atWar('OSM','AKK'),who:()=>'OSM',ai:S=>S.fac.OSM.gold>=BAL_CHN.otlukGold?0:1,fire:st=>({t:lng('Otlukbeli','Otlukbeli'),
   d:lng(`${rulerName('AKK')}\'ın Türkmen süvarileri Fırat boyunda. Sultan ordusunu toplar ve tüfekli yeniçerilerle doğuya sürebilir ya da sınırı tutup düşmanı yıpratabilir.`,`The Turkmen horsemen of ${rulerName('AKK')} are on the Euphrates. The Sultan can gather his army and drive east with his musket-armed Janissaries, or hold the border and wear the enemy down.`),
   ch:[{l:lng(`Topları ve tüfekleri öne sür (−${BAL_CHN.otlukGold} altın; Akkoyunlu\'ya saldırıda +15%, 8 tur)`,`Bring the guns and muskets forward (−${BAL_CHN.otlukGold} gold; +15% when attacking the Aq Qoyunlu for 8 turns)`),dis:S.fac.OSM.gold<BAL_CHN.otlukGold,next:'end',f:st=>{S.fac.OSM.gold-=BAL_CHN.otlukGold;st.data.top=S.turn+8;chnNudge('OSM',{war:'AKK',target:S.fac.AKK.cap});}},
    {l:lng('Sınırı tut, onları yıprat (Akkoyunlu\'ya karşı savunmada +15%, 8 tur)','Hold the border and wear them down (+15% defence against the Aq Qoyunlu for 8 turns)'),next:'end',f:st=>{st.data.def=S.turn+8;}}]})}]});

/* ---------- 1481: Cem Sultan (armed by the Ottoman succession when two sons live) ---------- */
function chnHost(){for(const g of ['RHO','PAP','MAM','VEN'])if(alive(g))return g;return null;}
CHAINS.push({id:'cem',abort:S=>!alive('OSM'),stages:[
 {when:(S,st)=>st.data.cem!=null&&chLive(S.chars[st.data.cem])&&S.chars[st.data.cem].role!=='claimant',who:()=>'OSM',fire:st=>{const c=S.chars[st.data.cem]||{n:lng('Şehzade','Prince')},h=chnHost();
   return {t:lng('Cem Sultan Meselesi','The Question of Prince Cem'),d:lng(`Şehzade ${c.n}, kardeşi ${rulerName('OSM')}\'a karşı tahta göz dikti; Bursa\'da kendi adına hutbe okutuyor. Anadolu beyleri ikiye bölündü.`,`Prince ${c.n} has set his eyes on the throne against his brother ${rulerName('OSM')}; in Bursa the Friday sermon is read in his name. The beys of Anatolia are split in two.`),
    ch:[{l:lng(`Kardeşini yen ve sürgüne gönder (${h?FAC[h].s+' onu rehin tutar, her tur nafaka ödersin; ':''}2 eyalet 4 tur huzursuz)`,`Defeat your brother and send him into exile (${h?FAC[h].s+' keeps him hostage and you pay for his upkeep every turn; ':''}unrest in 2 provinces for 4 turns)`),next:'end',f:st=>{const x=S.chars[st.data.cem];if(x){x.role='claimant';x.host=h;}st.data.host=h;chnUnrest('OSM',2,4);
       news(h?lng(`Şehzade ${c.n} yenildi ve ${FAC[h].s} elinde rehin kaldı.`,`Prince ${c.n} was defeated and is now a hostage of ${FAC[h].s}.`):lng(`Şehzade ${c.n} yenildi ve sürgüne gitti.`,`Prince ${c.n} was defeated and went into exile.`),S.player==='OSM'?'war':'info');}},
     {l:lng('Taht için kardeşini feda et (3 eyalet 8 tur huzursuz)','Sacrifice your brother for the throne (unrest in 3 provinces for 8 turns)'),next:'end',f:st=>{const x=S.chars[st.data.cem];chnUnrest('OSM',3,8);if(x)chKill(x,'executed');}}]};}}]});
hook('succession',(f,old,neu)=>{if(f!=='OSM'||!old||!S.chains)return;const st=chnState('cem');if(st.done||st.data.cem!=null)return;
 const L=Object.values(S.chars).filter(c=>c.f==='OSM'&&chLive(c)&&c.par===old.id&&c.id!==neu.id&&chAge(c)>=16&&(c.role==='kin'||c.role==='heir'));
 if(!L.length)return;L.sort((a,b)=>((b.sk==='cem')-(a.sk==='cem'))||(a.born-b.born));st.data.cem=L[0].id;st.t=S.turn;},60);
ECON_ROWS.push(f=>{if(!S.chains||!S.chains.cem)return null;const d=S.chains.cem.data,c=d&&S.chars[d.cem];
 if(!d.host||!chLive(c)||c.role!=='claimant'||!alive(d.host)||!alive('OSM'))return null;
 if(f==='OSM')return [{id:'ch-cem',l:lng(`Cem Sultan\'ın nafakası (${FAC[d.host].s})`,`Upkeep of Prince Cem (${FAC[d.host].s})`),v:BAL_CHN.cemPay,k:'exp'}];
 if(f===d.host)return [{id:'ch-cem',l:lng('Rehin şehzadenin nafakası','Upkeep of the hostage prince'),v:BAL_CHN.cemPay,k:'inc'}];return null;});

/* ---------- 1453 against real sieges (Track B's S.sieges; every hook is a no-op until B is merged) ---------- */
/** Who holds province i now: the occupier while a siege has fallen, else the owner (B's ctl(), or p.o before B). */
function chnCtl(i){return typeof ctl==='function'?ctl(i):(S.prov[i].ctl||S.prov[i].o);}
/** Extra siege progress per turn from chain choices at the besieged province (positive: faster for the besieger). */
function chnSiegeBonus(s){if(!s||!S.chains)return 0;let d=0;
 if(s.i===PK.istanbul&&S.chains.fetih&&S.prov[s.i].o==='BYZ'){const x=S.chains.fetih.data;
  if(s.f==='OSM'){if(x.hisar)d+=BAL_CHN.sgHisar;if(x.gemi)d+=BAL_CHN.sgGemi;}
  const g=x.giust!=null&&S.chars[x.giust];if(chLive(g)&&g.cap==null)d-=BAL_CHN.sgGiust;if(x.zincir&&!x.gemi)d-=BAL_CHN.sgZincir;}
 for(const fn of CHN_SIEGE)d+=fn(s)||0;
 return d;}
const CHN_SIEGE=[];   // more (s)=>delta rows from the W2 chains (06e)
hook('siegeTick',s=>{const d=chnSiegeBonus(s);if(d&&typeof s.prog==='number')s.prog=Math.max(0,s.prog+d);},60);
hook('siegeStart',s=>{if(!s||s.i!==PK.istanbul||s.f!=='OSM'||!S.chains||!S.chains.fetih||S.chains.fetih.data.sg)return;S.chains.fetih.data.sg=S.turn;
 news(lng('Urban\'ın dev topu Theodosius surlarını dövmeye başladı: Konstantiniyye kuşatması başladı.','Urban\'s great bombard has begun to pound the Theodosian Walls: the siege of Constantinople has begun.'),S.player==='BYZ'?'war':S.player==='OSM'?'cap':'info');});
/* The walls are breached: the city is not merely occupied, it falls and the empire ends with it. */
hook('siegeFell',(i,f)=>{if(i!==PK.istanbul||f!=='OSM'||S.prov[i].o!=='BYZ'||!alive('BYZ'))return;capture(i,'OSM');delete S.prov[i].ctl;polDirty=true;},30);
/* while the war lasts, keep the Ottoman AI's eyes on the city (the nudge expires otherwise) */
hook('newTurn',()=>{const st=S.chains&&S.chains.fetih;if(!st||st.done||st.data.war==null||!atWar('OSM','BYZ')||S.prov[PK.istanbul].o!=='BYZ')return;
 if((S.turn-st.data.war)%BAL_CHN.fetihRenew===0&&typeof aiNudges==='function'&&!aiNudges('OSM').some(n=>n.target===PK.istanbul))chnNudge('OSM',{war:'BYZ',target:PK.istanbul,prio:5,until:S.turn+BAL_CHN.fetihRenew+2});},22);

/* ---------- chain modifiers in battle ---------- */
BATTLE_MODS.push(ctx=>{if(!S.chains||ctx.to==null)return null;const out=[];
 if(ctx.to===PK.istanbul&&S.chains.fetih){const d=S.chains.fetih.data;
  if(ctx.att==='OSM'){if(d.hisar)out.push({l:lng('Boğazkesen Hisarı','The Strait-Cutter Fortress'),m:BAL_CHN.hisarMul,side:'att',k:'chain'});if(d.gemi)out.push({l:lng('Gemiler Haliç\'te','Ships in the Golden Horn'),m:BAL_CHN.gemiMul,side:'att',k:'chain'});}
  if(S.prov[ctx.to].o==='BYZ'){const g=d.giust!=null&&S.chars[d.giust];if(chLive(g)&&g.cap==null)out.push({l:lng('Giustiniani surlarda','Giustiniani on the walls'),m:BAL_CHN.giustMul,side:'def',k:'chain'});
   if(d.zincir&&!d.gemi)out.push({l:lng('Haliç zinciri','Golden Horn chain'),m:BAL_CHN.zincirMul,side:'def',k:'chain'});}}
 if(ctx.to===PK.belgrad&&S.chains.belgrad&&S.prov[ctx.to].o==='HUN'&&(S.chains.belgrad.data.par||0)>S.turn)out.push({l:lng('Paralı askerler','Mercenaries'),m:BAL_CHN.kapMul,side:'def',k:'chain'});
 const o=S.chains.otlukbeli;if(o){const def=S.prov[ctx.to].o;
  if(ctx.att==='OSM'&&def==='AKK'&&(o.data.top||0)>S.turn)out.push({l:lng('Osmanlı topçusu','Ottoman artillery'),m:BAL_CHN.otlukMul,side:'att',k:'chain'});
  if(ctx.att==='AKK'&&def==='OSM'&&(o.data.def||0)>S.turn)out.push({l:lng('Sınır boyu savunması','Border defence'),m:BAL_CHN.otlukMul,side:'def',k:'chain'});}
 return out.length?out:null;});
KE.CHAINS=CHAINS;
