/* =====================================================================
   GAME STATE
   ===================================================================== */
const SEASONS=EN?['Spring','Summer','Autumn','Winter']:['İlkbahar','Yaz','Sonbahar','Kış'];
const START_YEAR=1451,END_TURN=(1531-1451)*4;
const RC=12,UPK=1,SAVE='kizil-elma-1451-v1';
/* Track B balance constants (armies, garrisons, economy). Tune here only. */
const BAL_B={
 garBase:500,garDev:200,garFort:400,   // garrisonMax = 500 + dev*200 + fort*400 (rounded to 100)
 garMinDev:100,                        // garrison floor after "Garnizonu azalt" = dev*100 (min 100)
 garSlack:500,                         // garrison above max by more than this spills into an army
 garUpk:.5,                            // garrison upkeep per 1k troops (field armies pay UPK=1)
 capDiv:12,capMax:4,capHard:1,         // armyCap = clamp(1+floor(provs/12),1,4) + 1 for "Zorlu" realms
 mpMax:2,                              // movement points per season on own/allied land
 disbandMp:.5,                         // share of disbanded troops returned as manpower
 fieldNoise:.1,                        // field battle roll: rnd(.9,1.1) per side
 fortRatio:1.5,fortStep:.5,             // interim assault: fort 2 needs 1.5x the defence, +0.5x per fort level above
 mtnKeys:['kroya'],                    // mountain fortresses the terrain map does not mark (combat only)
 capGarDev:200,capGarShare:.25,        // garrison left in a captured province: min(dev*200, 25% of the army)
 loot:2,                               // gold per dev on the FIRST capture of a province in a war
 moraleWin:.05,moraleLose:.2,moraleMin:.6,moraleMax:1.1,moraleRegen:.1,
 mtnRes:1.5,mtnResDef:1.2,             // "Dağ direnişi": mountain defender at home: defence x1.2, attacker losses x1.5
 cannonFort:.6,                        // with cannon only 60% of a fort's defence bonus remains
 smallAid:[0,8,6,5,4,3,2,1,.5],        // "Küçük devlet desteği" by province count (index), 0 from 9 provinces
 aiMaxStack:30000,                     // AI: no merging / recruiting an army above this size
 aiGarFill:.6,                         // AI: front garrisons are kept at >= 60% of their max
 aiOdds:.6,aiReach:3,                  // AI attacks at >= 60% odds, looks 3 steps ahead
};
let S=null;
const key=(a,b)=>a<b?a+'|'+b:b+'|'+a;
const atWar=(a,b)=>!!S.war[key(a,b)];
const isAlly=(a,b)=>!!S.ally[key(a,b)];
const inTruce=(a,b)=>(S.truce[key(a,b)]||0)>S.turn;
const getOp=(a,b)=>S.op[key(a,b)]||0;
const addOp=(a,b,v)=>{S.op[key(a,b)]=clamp(getOp(a,b)+v,-100,100);};
const dateStr=t=>`${SEASONS[t%4]} ${START_YEAR+Math.floor(t/4)}`;
const alive=f=>S.fac[f]&&S.fac[f].alive;
const fname=f=>FAC[f].s;
const fmtK=n=>{n=Math.max(0,Math.round(n));return n>=10000?Math.round(n/1000)+'k':(Math.round(n/100)/10).toFixed(1).replace('.0','')+'k';};
const rnd=(a,b)=>a+R()*(b-a);

const HIST=[['BYZ','OSM',-45],['KAR','OSM',-35],['HUN','OSM',-50],['ALB','OSM',-70],['AKK','KKY',-70],['GEN','VEN',-30],['HAB','HUN',-25],
 ['AKK','OSM',-10],['KAR','MAM',15],['DUL','MAM',45],['BYZ','VEN',30],['BYZ','GEN',20],['HUN','SRB',10],['OSM','SRB',-5],['GH','KRM',-60],
 ['KRM','OSM',20],['MOL','POL',25],['CAN','OSM',-15],['OSM','TRB',-20],['AKK','TRB',35],['GEO','KKY',-30],['ARA','VEN',-10],['PAP','VEN',10],
 ['HUN','POL',10],['CYP','MAM',-20],['MAM','RHO',-40],['OSM','RHO',-30],['AKK','KAR',30],['HUN','BOS',25]];
function baseOp(a,b){let v=FAC[a].rel===FAC[b].rel?20:-20;const h=HIST.find(x=>(x[0]===a&&x[1]===b)||(x[0]===b&&x[1]===a));if(h)v+=h[2];return clamp(v,-100,100);}

function facProvs(f){const r=[];for(let i=0;i<NP;i++)if(S.prov[i].o===f)r.push(i);return r;}
function strength(f){return garTotal(f)+armTotal(f);}
/** Troops in f's province garrisons / in f's field armies. */
function garTotal(f){let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)s+=S.prov[i].t;return s;}
function armTotal(f){let s=0;if(S.armies)for(const a of S.armies)if(a.f===f)s+=a.n;return s;}
/** Development weighted by barracks: manpower only (never gold, bug B5). */
function devSum(f){let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)s+=S.prov[i].dev*(1+S.prov[i].brk);return s;}
/** Plain development sum (no barracks bonus): use this for any gold amount. */
function devRaw(f){let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)s+=S.prov[i].dev;return s;}
function provIncome(i){const p=S.prov[i];return p.dev*(1+.5*p.mkt)*(p.un>0?.5:1);}
/** All economy rows of faction f (ECON_ROWS registry): [{l,v,k:'inc'|'exp',id?,tip?}]. */
function econRows(f){const r=[];for(const fn of ECON_ROWS){const x=fn(f);if(x)for(const e of x)r.push(e);}return r;}
function income(f){let s=0;for(const e of econRows(f))if(e.k==='inc')s+=e.v;return s;}
function upkeep(f){let s=0;for(const e of econRows(f))if(e.k==='exp')s+=e.v;return s;}
ECON_ROWS.push(f=>{let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)s+=provIncome(i);return [{id:'tax',l:lng('Eyalet vergileri','Provincial taxes'),v:s,k:'inc'}];});
ECON_ROWS.push(f=>{const n=facProvs(f).length,v=n<BAL_B.smallAid.length?BAL_B.smallAid[n]:0;
 return v>0?[{id:'small',l:lng('Küçük devlet desteği','Small realm support'),v,k:'inc',tip:lng('Küçük devletler komşu hanedanlardan, tüccarlardan ve kiliseden yardım alır. Devlet büyüdükçe bu yardım azalır ve dokuz eyaletten sonra kesilir.','Small realms receive help from neighbouring dynasties, merchants and the Church. The help shrinks as the realm grows and stops once it holds nine provinces.')}]:null;});
ECON_ROWS.push(f=>{const a=armTotal(f);return [{id:'army',l:lng(`Ordu maaşları (${fmtK(a)})`,`Army pay (${fmtK(a)})`),v:a/1000*UPK,k:'exp',tip:lng('Sahra orduları: her 1.000 asker için tur başına 1 altın.','Field armies: 1 gold per turn for every 1,000 troops.')}];});
ECON_ROWS.push(f=>{const g=garTotal(f);return [{id:'gar',l:lng(`Garnizon maaşları (${fmtK(g)})`,`Garrison pay (${fmtK(g)})`),v:g/1000*UPK*BAL_B.garUpk,k:'exp',tip:lng('Kale ve şehir muhafızları: her 1.000 asker için tur başına yarım altın.','Fortress and city guards: half a gold per turn for every 1,000 troops.')}];});
function warsOf(f){return FK.filter(g=>g!==f&&alive(g)&&atWar(f,g));}
function alliesOf(f){return FK.filter(g=>g!==f&&alive(g)&&isAlly(f,g));}
function nbrs(f){const s=new Set();for(let i=0;i<NP;i++)if(S.prov[i].o===f)for(const j of PD[i].adj){const o=S.prov[j].o;if(o!==f)s.add(o);}return [...s].filter(alive);}
/** Legacy (pre-army) helper: garrison troops of province i not yet moved this turn. Garrisons never attack. */
const avail=i=>Math.max(0,S.prov[i].t-S.prov[i].mv);

/** A fresh war record (schema v2). */
function newWar(a,b){return {t:S.turn,sc:{[a]:0,[b]:0},ex:{},goal:null};}
const newFac=()=>({gold:0,mp:0,alive:false,cap:-1,cannon:0,nextOffer:0,ruler:null,heir:null,gens:[]});
const newAi=()=>({goal:null,desire:{},nudges:[]});
function newGame(player){
 S={v:2,seq:1,turn:0,player,prov:[],fac:{},war:{},truce:{},ally:{},op:{},log:[],flags:{},battles:[],offers:[],news:[],mis:[],misDone:{},stats:{won:0,lost:0,taken:0},
  armies:[],sieges:{},chars:{},ae:{},coal:{},evs:{},chains:{},ai:{},tut:null,hist:[]};
 FK.forEach(f=>{S.fac[f]=newFac();S.ai[f]=newAi();});
 PD.forEach(d=>{const m=FAC[d.o].m;S.prov.push({o:d.o,dev:d.dev,fort:d.fort,mkt:0,brk:0,t:Math.round((d.dev*450+d.fort*250)*m/100)*100,mv:0,un:0});});
 FK.forEach(f=>{const ps=facProvs(f);if(!ps.length)return;const F=S.fac[f];F.alive=true;F.cap=PK[FAC[f].cap]??ps[0];
  S.prov[F.cap].t+=Math.round(2500*FAC[f].m/100)*100;const ds=devSum(f);F.gold=Math.round(50+ds*1.2);F.mp=ds*350;});
 for(let a=0;a<FK.length;a++)for(let b=a+1;b<FK.length;b++)S.op[key(FK[a],FK[b])]=baseOp(FK[a],FK[b]);
 [['AKK','KKY'],['OSM','ALB'],['KRM','GH']].forEach(([a,b])=>S.war[key(a,b)]=newWar(a,b));
 [['MAM','DUL'],['AKK','KAR'],['HUN','BOS'],['VEN','BYZ']].forEach(([a,b])=>S.ally[key(a,b)]=true);
 if(player)addLog(lng(`${FAC[player].n} tahtında: ${rulerName(player)}. Tarihin yeni bir sayfası açılıyor.`,`${rulerName(player)} sits on the throne of the ${FAC[player].n}. A new page of history begins.`),'cap');
 runHooks('newGame',S,player);
}
function score(f){const ps=facProvs(f);return ps.length*10+ps.reduce((a,i)=>a+S.prov[i].dev*3,0)+Object.keys(S.misDone).length*(f===S.player?60:0)+Math.floor(S.fac[f].gold/10);}

/* economy at the end of every round (roundEnd slot 10) */
hook('roundEnd',()=>{
 FK.forEach(f=>{const F=S.fac[f];if(!F.alive)return;const inc=income(f),up=upkeep(f);F.gold+=inc-up;
  const ds=devSum(f);F.mp=Math.min(ds*800,F.mp+ds*110);
  if(F.gold<0){for(let i=0;i<NP;i++){const p=S.prov[i];if(p.o===f)p.t=Math.round(p.t*.9/100)*100;}
   for(const a of armyList(f))a.n=Math.round(a.n*.9/100)*100;F.gold=0;
   if(f===S.player)news(lng('Hazine boş: maaşını alamayan askerler firar ediyor (ordular ve garnizonlar −10%).','The treasury is empty: unpaid soldiers are deserting (armies and garrisons −10%).'),'war');}});
 for(let i=0;i<NP;i++){const p=S.prov[i];if(p.un>0)p.un--;p.mv=0;}
 for(const a of S.armies){a.mp=a.mpMax;if(a.morale<1)a.morale=Math.min(1,+(a.morale+BAL_B.moraleRegen).toFixed(2));else if(a.morale>1)a.morale=Math.max(1,+(a.morale-BAL_B.moraleRegen/2).toFixed(2));}
 armTidy();
},10);

function addLog(m,k='info'){S.log.push({t:S.turn,m,k});if(S.log.length>400)S.log.shift();}
function news(m,k='info'){S.news.push({m,k});addLog(m,k);}

