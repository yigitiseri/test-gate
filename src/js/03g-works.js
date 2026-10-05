/* =====================================================================
   GREAT WORKS (Track T, Wave 3)
   A few grand, expensive buildings that take several seasons to raise and then give a lasting bonus:
   a mosque complex / cathedral / great church (faith), a covered market (bedesten), a caravanserai,
   an arsenal (tersane), a citadel (hisar) and a madrasa / university. Some may be raised once per realm,
   the others once per province. The player and the AI build under the same rules.
   S.works: [{i,k,f,p,n,d,t,rel}]  i province, k type, f the realm that raised it, p seasons of work done,
   n seasons needed, d 1 when finished, t the turn it was begun (finished: the turn it was finished),
   rel the faith it was consecrated to (faith works; changes when a conqueror converts it).
   A site is paused while its province is occupied or besieged and abandoned if the province changes
   hands; a finished work stays with the province and serves whoever owns it.
   ===================================================================== */
const BAL_W={
 maxSites:2,                // building sites a realm may run at once
 faithUnrest:1,             // faith: unrest fades this many extra seasons per season (twice as fast)
 faithMp:.2,                // faith: manpower recovers +20%
 bedestenTax:1.5,           // covered market: the province's taxes x1.5
 citadelSiege:1.5,citadelAssault:1.2, // citadel: sieges here take 50% longer, assaults meet +20% defence
 medreseDev:2,medreseEvery:20,medreseMax:12, // madrasa: +2 development, then +1 every 5 years (to 12)
 shipMul:.5,                // arsenal: ship hire for armies x0.5 (needs Track B's armShipCost to read wkShipMul)
 aiP:.12,aiReserve:250,aiWarReserve:400, // AI: chance per season to begin a work, gold it keeps back (at war: more)
 aiPer:8,                   // AI: at most 1 + one work per 8 provinces (great works stay rare)
};
/* Types. realm: once per realm (counting the works this realm raised and still holds), else once per province.
   n: name by faith ({tr,en}, the province name is put in front in Turkish: "Bursa Bedesteni" / "Covered Market of Bursa").
   tp: Turkish possessive form for "<place> <tp>". */
const WK_TYPES={
 faith:{realm:true,cost:250,turns:10,ico:'dome',
  n:{'İslam':{tr:'Külliye',en:'Mosque Complex',tp:'Külliyesi'},'Katolik':{tr:'Katedral',en:'Cathedral',tp:'Katedrali'},'Ortodoks':{tr:'Büyük Kilise',en:'Great Church',tp:'Büyük Kilisesi'}},
  eff:{tr:'Devletin her yerinde huzursuzluk iki kat hızlı söner, insan gücü %20 daha hızlı toplanır.',en:'Unrest fades twice as fast across the realm, and manpower gathers 20% faster.'},
  req:{tr:'Gelişimi en az 5 olan bir şehir ya da başkent',en:'A city of development 5 or more, or the capital'}},
 bedesten:{cost:180,turns:6,ico:'bazaar',
  n:{'İslam':{tr:'Bedesten',en:'Covered Market',tp:'Bedesteni'},'*':{tr:'Tüccar Hanı',en:'Merchants\' Hall',tp:'Tüccar Hanı'}},
  eff:{tr:'Bu eyaletin vergisi %50 artar; bir ticaret durağıysa oradan gelen kazanç da %50 artar.',en:'This province pays 50% more taxes; if it is a trade stop, its trade earnings also rise by 50%.'},
  req:{tr:'Pazarı olan, gelişimi en az 4 olan bir eyalet',en:'A province with a market and development 4 or more'}},
 caravan:{cost:100,turns:4,ico:'caravan',
  n:{'*':{tr:'Kervansaray',en:'Caravanserai',tp:'Kervansarayı'}},
  eff:{tr:'Bu durağın ticaret yolu %10 daha canlı akar (yoldaki herkes kazanır); durak ayrıca her mevsim 1 altın geçiş vergisi alır.',en:'The trade road through this stop flows 10% stronger (everyone on the road gains), and the stop takes a toll of 1 gold each season.'},
  req:{tr:'Bir kara ticaret yolunun durağı',en:'A stop on an overland trade road'}},
 arsenal:{realm:true,cost:200,turns:8,ico:'ship',
  n:{'İslam':{tr:'Tersane',en:'Arsenal',tp:'Tersanesi'},'*':{tr:'Tersane',en:'Arsenal',tp:'Tersanesi'}},
  eff:{tr:'Deniz yolu üzerindeki liman durakların %25 fazla kazanır.',en:'Your port stops on sea routes earn 25% more.'},
  effShip:{tr:' Donanması olmayan devletin orduları için gemi kirası yarıya iner.',en:' For a realm without a fleet, hiring ships for its armies costs half.'},
  req:{tr:'Denize kıyısı olan bir eyalet',en:'A province on the coast'}},
 citadel:{cost:180,turns:6,ico:'tower',
  n:{'*':{tr:'Hisar',en:'Citadel',tp:'Hisarı'}},
  eff:{tr:'Bu şehrin kuşatması %50 daha uzun sürer, hücumda surların savunması %20 güçlenir.',en:'A siege of this city takes 50% longer, and its walls defend 20% better against an assault.'},
  req:{tr:'Kalesi en az 2 olan bir eyalet',en:'A province with walls of 2 or more'}},
 medrese:{realm:true,cost:200,turns:8,ico:'book',
  n:{'İslam':{tr:'Medrese',en:'Madrasa',tp:'Medresesi'},'*':{tr:'Üniversite',en:'University',tp:'Üniversitesi'}},
  eff:{tr:'Bitince eyaletin gelişimi 2 artar; sonra her beş yılda bir 1 daha artar (en çok 12).',en:'When finished the province gains 2 development, then 1 more every five years (up to 12).'},
  req:{tr:'Gelişimi en az 5 olan bir eyalet',en:'A province of development 5 or more'}},
};
const WK_ORDER=['faith','bedesten','caravan','arsenal','citadel','medrese'];
/* Historical names: type:province -> {tr,en} or by faith {'İslam':{tr,en},...}. */
const WK_HIST={
 'faith:istanbul':{'Ortodoks':{tr:'Ayasofya',en:'Hagia Sophia'},'Katolik':{tr:'Ayasofya',en:'Hagia Sophia'},'İslam':{tr:'Ayasofya Camii',en:'Hagia Sophia Mosque'}},
 'faith:venedik':{'Katolik':{tr:'San Marco Bazilikası',en:'St Mark\'s Basilica'}},
 'faith:roma':{'Katolik':{tr:'Aziz Petrus Bazilikası',en:'St Peter\'s Basilica'}},
 'faith:budin':{'Katolik':{tr:'Meryem Ana Kilisesi',en:'Church of Our Lady'}},
 'faith:edirne':{'İslam':{tr:'Üç Şerefeli Cami',en:'Üç Şerefeli Mosque'}},
 'faith:bursa':{'İslam':{tr:'Ulu Cami',en:'Great Mosque of Bursa'}},
 'faith:kahire':{'İslam':{tr:'Sultan Hasan Külliyesi',en:'Complex of Sultan Hasan'}},
 'faith:tebriz':{'İslam':{tr:'Gök Mescid',en:'Blue Mosque of Tabriz'}},
 'faith:sam':{'İslam':{tr:'Emevi Camii',en:'Umayyad Mosque'}},
 'faith:kudus':{'İslam':{tr:'Kubbetü\'s-Sahra',en:'Dome of the Rock'}},
 'faith:konya':{'İslam':{tr:'Mevlana Külliyesi',en:'Complex of Rumi'}},
 'faith:viyana':{'Katolik':{tr:'Aziz Stephan Katedrali',en:'St Stephen\'s Cathedral'}},
 'faith:mistra':{'Ortodoks':{tr:'Pantanassa Manastırı',en:'Pantanassa Monastery'}},
 'faith:trabzon':{'Ortodoks':{tr:'Ayasofya (Trabzon)',en:'Hagia Sophia of Trebizond'}},
 'bedesten:istanbul':{tr:'Cevahir Bedesteni',en:'Grand Bazaar'},
 'bedesten:halep':{tr:'Halep Çarşısı',en:'Souq of Aleppo'},
 'bedesten:venedik':{tr:'Rialto Çarşısı',en:'Rialto Market'},
 'bedesten:kahire':{tr:'Han el-Halili',en:'Khan el-Khalili'},
 'arsenal:venedik':{tr:'Arsenale',en:'Venetian Arsenal'},
 'arsenal:istanbul':{tr:'Tersâne-i Âmire',en:'Imperial Arsenal'},
 'arsenal:gelibolu':{tr:'Gelibolu Tersanesi',en:'Arsenal of Gallipoli'},
 'citadel:istanbul':{tr:'Yedikule Hisarı',en:'Fortress of the Seven Towers'},
 'citadel:rodos':{tr:'Üstatlar Sarayı',en:'Palace of the Grand Master'},
 'medrese:istanbul':{'İslam':{tr:'Sahn-ı Seman Medresesi',en:'Sahn-ı Seman Madrasa'}},
 'medrese:kahire':{'İslam':{tr:'el-Ezher',en:'al-Azhar'}},
 'medrese:pojon':{'*':{tr:'Academia Istropolitana',en:'Academia Istropolitana'}},
};
/* Works standing in 1451 (raised before the game starts). */
const WK_START=[['faith','istanbul','BYZ'],['faith','venedik','VEN'],['arsenal','venedik','VEN'],['faith','roma','PAP'],['medrese','kahire','MAM'],['bedesten','bursa','OSM'],['arsenal','gelibolu','OSM']];

const wkRel=f=>FAC[f]&&FAC[f].rel||'';
const wkPick=(o,rel)=>o[rel]||o['*']||o['Katolik']||Object.values(o)[0];
/** Display name of work w (or of a planned work: {i,k,rel}). */
function wkName(w){const T=WK_TYPES[w.k],rel=w.rel||wkRel(S.prov[w.i].o),h=WK_HIST[w.k+':'+PD[w.i].key];
 if(h){const v=h.tr?h:(h[rel]||h['*']);if(v)return tx(v);}
 const n=wkPick(T.n,rel);return EN?`${n.en} of ${PD[w.i].name}`:`${PD[w.i].name} ${n.tp}`;}
/** Name with its place when a historical name does not say it (news, lists). */
function wkNameAt(w){const n=wkName(w),pl=PD[w.i].name;return n.includes(pl)?n:`${n} (${pl})`;}
/** Short type name in the current faith of realm f (for buttons). */
const wkTypeName=(k,f)=>tx(wkPick(WK_TYPES[k].n,wkRel(f)));
/** Effect text of type k (plain words). */
function wkEff(k){let t=tx(WK_TYPES[k].eff);if(k==='arsenal'&&wkShipSeam())t+=tx(WK_TYPES.arsenal.effShip);return t;}
/** Does Track B's ship hire read wkShipMul yet? (seam; until then the arsenal does not promise it) */
let wkSeam=null;function wkShipSeam(){if(wkSeam==null){try{wkSeam=typeof armShipCost==='function'&&/wkShipMul/.test(String(armShipCost));}catch(e){wkSeam=false;}}return wkSeam;}
/** Ship hire multiplier for realm f's armies (arsenal). */
function wkShipMul(f){return wkRealmHas(f,'arsenal')?BAL_W.shipMul:1;}
const wkList=()=>(S&&S.works)||[];
/** All works (finished and unfinished) in province i. */
const wkAt=i=>wkList().filter(w=>w.i===i);
/** Finished work of type k in province i? */
function wkDone(i,k){const L=S&&S.works;if(!L||!L.length)return false;for(const w of L)if(w.i===i&&w.k===k&&w.d)return true;return false;}
/** Does realm f hold a finished work of type k (in a province it owns and does not have occupied)? */
function wkRealmHas(f,k){const L=S&&S.works;if(!L||!L.length)return false;for(const w of L)if(w.k===k&&w.d){const p=S.prov[w.i];if(p.o===f&&!p.ctl)return true;}return false;}
/** Building sites (unfinished works) of realm f. */
const wkSites=f=>wkList().filter(w=>!w.d&&w.f===f);
/** Seasons left for an unfinished work. */
const wkLeft=w=>Math.max(0,w.n-w.p);
/** Is province i on the coast (touches the sea on the map)? Cached after the map is built. */
let wkCoast=null;
function wkIsCoast(i){if(!wkCoast){if(typeof provStart==='undefined'||!provStart||!idMap)return PD[i].lanes.length>0||!!(TRD_AT[i]||[]).some(m=>trdPort(m.r,m.k));
  wkCoast=new Uint8Array(NP);for(let k=0;k<NP;k++){let c=PD[k].lanes.length>0;for(let q=provStart[k];q<provStart[k+1]&&!c;q++){const p=provPix[q],x=p%W;
   if((x>0&&idMap[p-1]===-1)||(x<W-1&&idMap[p+1]===-1)||(p>=W&&idMap[p-W]===-1)||(p+W<idMap.length&&idMap[p+W]===-1))c=true;}wkCoast[k]=c?1:0;}}
 return !!wkCoast[i];}
/** Requirement of type k at province i (ignoring gold and limits). */
function wkReqOk(k,i){const p=S.prov[i],cap=S.fac[p.o]&&S.fac[p.o].cap===i;
 switch(k){case 'faith':return p.dev>=5||cap;case 'bedesten':return !!p.mkt&&p.dev>=4;
  case 'caravan':return (TRD_AT[i]||[]).some(m=>m.r.g!=='ship');case 'arsenal':return wkIsCoast(i);
  case 'citadel':return p.fort>=2;case 'medrese':return p.dev>=5;}return false;}
/** Can realm f begin work k in province i? -> {ok, why} (why: plain words) */
function wkCan(f,i,k){const T=WK_TYPES[k],p=S.prov[i];if(!T||!p)return {ok:false,why:''};
 if(p.o!==f)return {ok:false,why:lng('Bu eyalet senin değil.','This province is not yours.')};
 if(p.ctl)return {ok:false,why:lng('İşgal altındaki eyalette inşaat yapılamaz.','Nothing can be built in an occupied province.')};
 const here=wkAt(i);
 if(here.some(w=>w.k===k))return {ok:false,why:here.find(w=>w.k===k).d?lng('Bu eser burada zaten var.','This work already stands here.'):lng('Bu eser burada zaten yapılıyor.','This work is already being built here.')};
 if(here.some(w=>!w.d))return {ok:false,why:lng('Bu eyalette zaten bir inşaat sürüyor.','A building site is already at work in this province.')};
 if(T.realm&&wkList().some(w=>w.k===k&&w.f===f&&S.prov[w.i].o===f))return {ok:false,why:lng('Devlet başına yalnız bir tane yapılabilir.','Only one may be raised per realm.')};
 if(wkSites(f).length>=BAL_W.maxSites)return {ok:false,why:lng(`Aynı anda en çok ${BAL_W.maxSites} büyük eser yapılabilir.`,`At most ${BAL_W.maxSites} great works can be under construction at once.`)};
 if(!wkReqOk(k,i))return {ok:false,why:tx(T.req)};
 if(S.fac[f].gold<T.cost)return {ok:false,why:lng(`${T.cost} altın gerekiyor.`,`It costs ${T.cost} gold.`),gold:true};
 return {ok:true,why:''};}
/** Begin work k at province i for realm f (pays the cost). -> the work, or null */
function wkStart(f,i,k){if(!wkCan(f,i,k).ok)return null;const T=WK_TYPES[k];S.fac[f].gold-=T.cost;
 const w={i,k,f,p:0,n:T.turns,d:0,t:S.turn};if(k==='faith')w.rel=wkRel(f);(S.works||(S.works=[])).push(w);
 if(f===S.player)addLog(lng(`${wkNameAt(w)} için temel atıldı.`,`The foundations of the ${wkNameAt(w)} were laid.`),'info');
 runHooks('workStarted',w);return w;}
/** Finish w now (also used by the start-of-game works). */
function wkFinish(w,quiet){w.d=1;w.p=w.n;w.t=S.turn;if(w.k==='faith'&&!w.rel)w.rel=wkRel(S.prov[w.i].o);
 if(!quiet){if(w.k==='medrese'){const p=S.prov[w.i];p.dev=Math.min(Math.max(p.dev,BAL_W.medreseMax),p.dev+BAL_W.medreseDev);}const o=S.prov[w.i].o;
  if(o===S.player){news(lng(`${wkNameAt(w)} tamamlandı! ${tx(WK_TYPES[w.k].eff)}`,`The ${wkNameAt(w)} is complete! ${tx(WK_TYPES[w.k].eff)}`),'good');}
  else if(S.player&&(nbrs(S.player).includes(o)||w.k==='faith'))addLog(lng(`${FAC[o].s}: ${wkNameAt(w)} tamamlandı.`,`${FAC[o].s}: the ${wkNameAt(w)} is complete.`),'info');
  runHooks('workDone',w);}
 polDirty=true;}
/** Seasons of work: called each roundEnd. */
function wkTick(){const L=S.works;if(!L||!L.length)return;
 for(let k=L.length-1;k>=0;k--){const w=L[k];if(w.d)continue;const p=S.prov[w.i];
  if(p.o!==w.f||!alive(w.f)){L.splice(k,1);if(w.f===S.player)news(lng(`${PD[w.i].name} elden çıktı; ${wkName(w)} inşaatı yarım kaldı.`,`${PD[w.i].name} was lost; work on the ${wkName(w)} has been abandoned.`),'war');continue;}
  if(p.ctl||(typeof siegeAt==='function'&&siegeAt(w.i)))continue; // paused
  w.p++;if(w.p>=w.n)wkFinish(w);}}
hook('roundEnd',()=>{wkTick();
 for(const w of wkList())if(w.d&&w.k==='faith'){const p=S.prov[w.i];if(!p.ctl)wkConvert(w,p.o,null);} // land ceded at a peace
 // faith: unrest fades faster, manpower gathers faster
 const has={};for(const w of wkList())if(w.d&&w.k==='faith'){const p=S.prov[w.i];if(!p.ctl)has[p.o]=1;}
 for(const f in has){if(!alive(f))continue;for(let i=0;i<NP;i++){const p=S.prov[i];if(p.o===f&&p.un>0)p.un=Math.max(0,p.un-BAL_W.faithUnrest);}
  const F=S.fac[f],ds=devSum(f);F.mp=Math.min(ds*800,F.mp+ds*110*BAL_W.faithMp);}},12);
/* madrasa: the city keeps growing (every 5 years after it was finished) */
hook('newTurn',()=>{for(const w of wkList()){if(!w.d||w.k!=='medrese')continue;const p=S.prov[w.i];
 if(S.turn>w.t&&(S.turn-w.t)%BAL_W.medreseEvery===0&&p.dev<BAL_W.medreseMax&&!p.ctl){p.dev++;if(p.o===S.player)news(lng(`${wkName(w)} bilginleri yetiştiriyor: ${PD[w.i].name} gelişimi ${p.dev} oldu.`,`The scholars of the ${wkName(w)} are at work: ${PD[w.i].name} grows to development ${p.dev}.`),'good');}}},40);
/* a conqueror converts a house of another faith; an unfinished site is lost (wkTick also catches cession) */
function wkConvert(w,nf,of){if(w.k!=='faith'||!w.d||!wkRel(nf)||w.rel===wkRel(nf))return false;const old=wkName(w);w.rel=wkRel(nf);const nw=wkName(w);
 const m=wkRel(nf)==='İslam'?(old===nw?lng(`${old} camiye çevrildi.`,`The ${old} has been turned into a mosque.`):lng(`${old} camiye çevrildi: ${nw}.`,`The ${old} has been turned into a mosque: the ${nw}.`)):lng(`${old} yeni inanca adandı: ${nw}.`,`The ${old} has been rededicated to a new faith: the ${nw}.`);
 if(S.player&&(nf===S.player||of===S.player))news(m,'info');else addLog(m,'info');return true;}
hook('capture',(i,nf,of)=>{const L=S.works;if(!L)return;
 for(let k=L.length-1;k>=0;k--){const w=L[k];if(w.i!==i)continue;if(!w.d){L.splice(k,1);continue;}wkConvert(w,nf,of);}});
/* citadel */
BATTLE_MODS.push(ctx=>{if(ctx.to==null||(ctx.kind!=='siege'&&ctx.kind!=='assault')||!wkDone(ctx.to,'citadel'))return null;
 return [{l:lng('Hisar','Citadel'),m:ctx.kind==='siege'?BAL_W.citadelSiege:BAL_W.citadelAssault,side:'def',k:'citadel'}];});
/** Covered market: tax multiplier of province i (read by provIncome). */
function wkTaxMul(i){return wkDone(i,'bedesten')?BAL_W.bedestenTax:1;}
/* ---- the AI raises great works by the same rules ---- */
function wkAiScore(f,i,k){const p=S.prov[i],F=S.fac[f],cap=F.cap===i;
 switch(k){case 'faith':return cap?60:p.dev*6;case 'bedesten':return p.dev*7+(trdIsStop(i)?20:0);case 'caravan':return 18+(TRD_AT[i]||[]).reduce((t,m)=>t+m.r.v*m.r.stops[m.k].w/m.r.W,0)*8;
  case 'arsenal':return (cap?30:0)+p.dev*3+(TRD_AT[i]||[]).length*10;case 'citadel':return PD[i].adj.some(j=>S.prov[j].o!==f)?(cap?45:p.dev*4):0;
  case 'medrese':return cap?50:p.dev*5;}return 0;}
function wkAi(f){if(!S||!alive(f)||f===S.player)return;const F=S.fac[f];
 const war=warsOf(f).length>0,keep=war?BAL_W.aiWarReserve:BAL_W.aiReserve;if(F.gold<keep+100||R()>BAL_W.aiP)return;
 const L=wkList(),at=new Map();let own=0;for(const w of L){if(!w.d&&w.f===f)return;(at.get(w.i)||at.set(w.i,[]).get(w.i)).push(w);if(w.d&&S.prov[w.i].o===f)own++;}
 const ps=facProvs(f);if(own>=1+Math.floor(ps.length/BAL_W.aiPer))return;
 let best=null,bs=0;for(const i of ps){if(S.prov[i].ctl||(at.get(i)||[]).some(w=>!w.d))continue;const here=at.get(i)||[];
  for(const k of WK_ORDER){const T=WK_TYPES[k];if(F.gold-T.cost<keep||here.some(w=>w.k===k))continue;
   if(T.realm&&L.some(w=>w.k===k&&w.f===f&&S.prov[w.i].o===f))continue;if(!wkReqOk(k,i))continue;
   const sc=wkAiScore(f,i,k);if(sc>bs){bs=sc;best=[i,k];}}}
 if(best&&bs>=20)wkStart(f,best[0],best[1]);}
hook('preAI',f=>wkAi(f),40);
/* ---- state ---- */
hook('newGame',s=>{s.works=[];for(const [k,key,f] of WK_START){const i=PK[key];if(i==null||s.prov[i].o!==f)continue;const w={i,k,f,p:0,n:WK_TYPES[k].turns,d:0,t:0};if(k==='faith')w.rel=wkRel(f);s.works.push(w);wkFinish(w,true);}},30);
hook('migrate',s=>{if(!Array.isArray(s.works))s.works=[];},30);
KE.works={list:()=>wkList().map(w=>({...w,name:wkName(w)})),can:(f,i,k)=>wkCan(f,i,k),start:(f,i,k)=>wkStart(f,i,k),done:(i,k)=>wkDone(i,k),realmHas:(f,k)=>wkRealmHas(f,k),
 finish:w=>wkFinish(w),tick:()=>wkTick(),coast:i=>wkIsCoast(i),types:WK_TYPES,BAL:BAL_W,shipMul:f=>wkShipMul(f),seam:()=>wkShipSeam()};
