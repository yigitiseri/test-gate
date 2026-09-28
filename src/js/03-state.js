/* =====================================================================
   GAME STATE
   ===================================================================== */
const SEASONS=['İlkbahar','Yaz','Sonbahar','Kış'];
const START_YEAR=1451,END_TURN=(1531-1451)*4;
const RC=12,UPK=1,SAVE='kizil-elma-1451-v1';
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
function strength(f){let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)s+=S.prov[i].t;if(S.armies)for(const a of S.armies)if(a.f===f)s+=a.n;return s;}
function devSum(f){let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)s+=S.prov[i].dev*(1+S.prov[i].brk);return s;}
function provIncome(i){const p=S.prov[i];return p.dev*(1+.5*p.mkt)*(p.un>0?.5:1);}
/** All economy rows of faction f (ECON_ROWS registry): [{l,v,k:'inc'|'exp',id?,tip?}]. */
function econRows(f){const r=[];for(const fn of ECON_ROWS){const x=fn(f);if(x)for(const e of x)r.push(e);}return r;}
function income(f){let s=0;for(const e of econRows(f))if(e.k==='inc')s+=e.v;return s;}
function upkeep(f){let s=0;for(const e of econRows(f))if(e.k==='exp')s+=e.v;return s;}
ECON_ROWS.push(f=>{let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)s+=provIncome(i);return [{id:'tax',l:'Eyalet vergileri',v:s,k:'inc'}];});
ECON_ROWS.push(f=>{const st=strength(f);return [{id:'army',l:`Ordu maaşları (${fmtK(st)})`,v:st/1000*UPK,k:'exp'}];});
function warsOf(f){return FK.filter(g=>g!==f&&alive(g)&&atWar(f,g));}
function alliesOf(f){return FK.filter(g=>g!==f&&alive(g)&&isAlly(f,g));}
function nbrs(f){const s=new Set();for(let i=0;i<NP;i++)if(S.prov[i].o===f)for(const j of PD[i].adj){const o=S.prov[j].o;if(o!==f)s.add(o);}return [...s].filter(alive);}
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
 if(player)addLog(`${FAC[player].n} tahtında: ${rulerName(player)}. Tarihin yeni bir sayfası açılıyor.`,'cap');
 runHooks('newGame',S,player);
}
function score(f){const ps=facProvs(f);return ps.length*10+ps.reduce((a,i)=>a+S.prov[i].dev*3,0)+Object.keys(S.misDone).length*(f===S.player?60:0)+Math.floor(S.fac[f].gold/10);}

/* economy at the end of every round (roundEnd slot 10) */
hook('roundEnd',()=>{
 FK.forEach(f=>{const F=S.fac[f];if(!F.alive)return;const inc=income(f),up=upkeep(f);F.gold+=inc-up;
  const ds=devSum(f);F.mp=Math.min(ds*800,F.mp+ds*110);
  if(F.gold<0){for(let i=0;i<NP;i++){const p=S.prov[i];if(p.o===f)p.t=Math.round(p.t*.9/100)*100;}F.gold=0;
   if(f===S.player)news('Hazine boş: maaşını alamayan askerler firar ediyor (ordu −10%).','war');}});
 for(let i=0;i<NP;i++){const p=S.prov[i];if(p.un>0)p.un--;p.mv=0;}
},10);

function addLog(m,k='info'){S.log.push({t:S.turn,m,k});if(S.log.length>400)S.log.shift();}
function news(m,k='info'){S.news.push({m,k});addLog(m,k);}

