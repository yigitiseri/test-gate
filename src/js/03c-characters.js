/* =====================================================================
   CHARACTERS (Track C): rulers, heirs, kin, generals; aging, death,
   succession, regency, crisis; commanders on armies; dynasty UI.
   S.chars={[id]:{id,n,f,role:'ruler'|'heir'|'kin'|'gen'|'claimant',born,died:null,traits:[],skill,dyn,ep,
                  rn?,hd?,par?,sk?,pref?,nk?,hk?,fem?,fate?,t?,acc?,dc?,cap?}}
   S.fac[f].ruler / .heir = char id or null; S.fac[f].gens = [living general ids]
   S.c = Track C namespace (see chNewC).
   ===================================================================== */
const BAL_C={
 h0:.012,hb:.08,          // yearly death chance at age 40, and its growth per year of age (Gompertz)
 histMul:10,histWin:2,    // "soft history": hazard x10 within +-2 years of the real death year
 lateMul:8,lateMin:.3,    // after that window: hazard x8, at least 30% a year
 hastaMul:2,maxAge:90,
 birth:.18,maxKids:3,kidAge:[17,50],   // yearly chance of a son for a ruler without a heir line
 regencyTurns:8,regencyCut:.1,         // minor on the throne: -10% of provincial taxes for 8 turns
 genMul:.08,genMax:4,                  // commander: +8% per skill point; at most 4 living generals
 genDie:.15,genCap:.10,rulerDie:.05,captiveTurns:8,
 pruneAfter:40,
 crisisGold:[40,4],                    // crisis bribe: max(40, 4 x net income)
 gold:{adil:2,tuccar:3,alim:1,savurgan:2,zalim:1},
 mul:{cengaver:1.05,sebatkar:1.05,dindar:1.05,zalim:1.10,fatih:1.10,dag:1.15,topcu:1.10}
};
let chRep=[];               // this turn's dynasty news for the season report (transient)
const chYear=t=>START_YEAR+Math.floor((t==null?S.turn:t)/4);
const chLive=c=>!!c&&c.died==null;
function chNewC(){return {v:1,sp:{},el:{},alt:{},reg:{},regency:{},past:{},pend:[],hold:{},lastSucc:{}};}

/* ---------------- core API ---------------- */
/** Create a character. spec: {n,f,role,born,traits?,skill?,dyn?,...extra}. */
function chCreate(spec){const c={id:S.seq++,n:spec.n,f:spec.f,role:spec.role||'kin',born:spec.born,died:null,traits:(spec.traits||[]).slice(),skill:spec.skill||0,dyn:spec.dyn??null,ep:spec.ep??null};
 for(const k of ['rn','hd','par','sk','pref','nk','hk','fem','fate','t'])if(spec[k]!=null)c[k]=spec[k];
 S.chars[c.id]=c;return c;}
function chAge(id){const c=typeof id==='object'?id:S.chars[id];return c?chYear()-c.born:0;}
function chRuler(f){const F=S&&S.fac[f];if(!F||!S.chars)return null;const c=S.chars[F.ruler];return chLive(c)?c:null;}
function chHeir(f){const F=S&&S.fac[f];if(!F||!S.chars)return null;const c=S.chars[F.heir];return chLive(c)?c:null;}
function chGenerals(f){const F=S&&S.fac[f];if(!F||!S.chars)return [];return (F.gens||[]).map(id=>S.chars[id]).filter(chLive);}
/** Display name of f's ruler. Every UI place that shows a ruler must use this (never FAC[f].r). */
function rulerName(f){const c=chRuler(f);return c?(c.rn||c.n):FAC[f].r;}
/** Title of a character ("Sultan", "Şehzade", "Komutan", ...). */
function chTitle(c){const sd=CH_SEED[c.f]||{};
 if(c.role==='ruler')return c.t||(c.fem?'Kraliçe':sd.title||'Hükümdar');
 if(c.role==='gen')return 'Komutan';
 if(c.role==='claimant')return 'Taht davacısı';
 if(c.fem)return 'Prenses';return c.role==='heir'?(sd.ht||'Veliaht'):(sd.ht||'');}
/** Name with the role title where it reads naturally ("Şehzade Bayezid", "II. Mehmed", "Mahmud Paşa"). */
function chLabel(c){if(!c)return '';if(c.role==='ruler')return c.rn||c.n;if(c.role==='gen')return c.n;const t=chTitle(c);return (t&&c.role!=='claimant'?t+' ':'')+c.n;}
/** Portrait spec for Track A (W2): deterministic from the character. */
function chPortraitSpec(c){const sd=CH_SEED[c.f]||{};const cul=sd.cul||'tr';
 const hat={tr:'kavuk',tk:'sarık',mm:'sarık',ar:'sarık',tt:'börk',gr:'taç',sr:'taç',ro:'kalpak',hu:'kalpak',de:'taç',pl:'kalpak',it:'bere',es:'taç',fr:'bere',ka:'taç',sq:'kalpak',pp:'mitre'}[cul];
 return {seed:c.id,f:c.f,cul,hat:c.role==='ruler'?hat:(cul==='pp'?'bere':hat),age:chAge(c),fem:!!c.fem,role:c.role,col:FAC[c.f].c,traits:c.traits.slice()};}

/* ---------------- names ---------------- */
function chPick(a){return a[Math.floor(R()*a.length)];}
function chRomanVal(s){const v={I:1,V:5,X:10,L:50,C:100};let n=0;for(let k=0;k<s.length;k++){const a=v[s[k]],b=v[s[k+1]]||0;n+=a<b?-a:a;}return n;}
function chRegCount(f,name){const r=S.c.reg[f]&&S.c.reg[f][name];if(r!=null)return r;const b=CH_REGNAL[f];return b&&b[name]||0;}
/** Regnal/display name for a new ruler of f (and record the numbering). */
function chRegnal(f,c){const sd=CH_SEED[f]||{};
 if(c.rn){const m=/^([IVXLC]+)\. /.exec(c.rn);if(m)(S.c.reg[f]||(S.c.reg[f]={}))[c.n]=chRomanVal(m[1]);return c.rn;}
 let s=(sd.pre||'')+c.n+(sd.suf||'');
 if(sd.cul==='pp'||sd.num){const k=chRegCount(f,c.n)+1;(S.c.reg[f]||(S.c.reg[f]={}))[c.n]=k;return roman(k)+'. '+s;}
 if(!sd.suf&&!sd.pre&&(sd.cul==='sr'||sd.cul==='sq')&&(c.dyn||sd.dyn))s+=' '+(c.dyn||sd.dyn);
 return s;}
function chGenName(f){const sd=CH_SEED[f]||{cul:'tr'},pool=CH_NAMES[sd.cul]||CH_NAMES.tr;
 if(sd.sur)return chPick(pool)+' '+chPick(sd.sur);if(sd.cul==='pp')return chPick(CH_NAMES.it)+' '+chPick(['Orsini','Colonna','Farnese','Cibo','Carafa','Piccolomini','Barbo']);return chPick(pool);}
/** Generate a character for f. role 'ruler' makes an adult of the given age range. */
function chGenerate(f,role,age,extra){const sd=CH_SEED[f]||{};const y=chYear();
 const c=chCreate({n:chGenName(f),f,role,born:y-age,dyn:sd.dyn||null,...(extra||{})});
 if(sd.cul==='pp'&&role==='ruler'){c.rn=null;c.n=chPick(CH_NAMES.pp);}
 return c;}
function chGenGeneral(f){const sd=CH_SEED[f]||{cul:'tr'};const cul=sd.cul;const pool=CH_NAMES[cul==='pp'?'it':cul]||CH_NAMES.tr;
 const sk=R()<.5?1:R()<.7?2:3;const tr=[];const q=R();
 if(q<.1)tr.push('dag');else if(q<.2)tr.push('topcu');else if(q<.3&&['tr','tk','tt','mm'].includes(cul))tr.push('akinci');
 const n=chPick(pool)+(CH_GTITLE[cul]||'');
 const c=chCreate({n,f,role:'gen',born:chYear()-(25+Math.floor(R()*20)),skill:sk,traits:tr});S.fac[f].gens.push(c.id);return c;}

/* ---------------- seeding ---------------- */
function chFromSeed(f,e,role){const sd=CH_SEED[f]||{};
 const hk=[...(sd.kin||[]),...(sd.alt||[])].some(x=>x.par&&x.par===e.k);
 const c=chCreate({n:e.n,f,role,born:e.b,rn:e.rn,hd:e.d,sk:e.k,pref:e.pref,nk:e.nk,hk:hk?1:null,fem:e.fem,fate:e.fate,t:e.t,traits:e.tr,skill:e.sk||0,dyn:e.dyn||sd.dyn||null});
 if(e.k)S.c.sp[f+':'+e.k]=1;return c;}
function chBySeed(f,k){for(const id in S.chars){const c=S.chars[id];if(c.f===f&&c.sk===k)return c;}return null;}
/** Seed f's ruler, family and generals as of the current year (new game, v1 migration, Safavid spawn). */
function chSeedFaction(f){const sd=CH_SEED[f],F=S.fac[f],y=chYear();if(!F)return;
 S.c.el[f]=S.c.el[f]||0;S.c.alt[f]=S.c.alt[f]||0;
 if(!sd){const r=chGenerate(f,'ruler',35);r.rn=chRegnal(f,r);r.acc=S.turn;F.ruler=r.id;chPickHeir(f);return;}
 let r=null;
 const cityGone=sd.r.fate==='city'&&S.prov[PK.istanbul].o!==f;
 if(!cityGone&&(sd.r.d>=y-1||!sd.el)){r=chFromSeed(f,sd.r,'ruler');r.acc=S.turn;}
 else if(sd.el){S.c.sp[f+':'+sd.r.k]=1;}
 if(r){chRegnal(f,r);F.ruler=r.id;}
 for(const e of sd.kin||[]){if(e.b>y||e.d<y)continue;if(e.par&&!chBySeed(f,e.par)&&e.par!==sd.r.k)continue;chFromSeed(f,e,'kin');}
 for(const e of sd.gen||[]){if((e.from||0)>y||e.d<y||y-e.b<16)continue;const g=chFromSeed(f,e,'gen');F.gens.push(g.id);}
 if(!r){chSucceed(f,null,{quiet:true});}
 else chPickHeir(f);}
function chSeedAll(){FK.forEach(f=>{if(S.fac[f].alive&&!chRuler(f))chSeedFaction(f);});}

/* ---------------- heirs and succession ---------------- */
/** Best heir of f relative to ruler r (may be dead or null): r's children first (preferred, then eldest), else other kin. */
function chBestKin(f,r){const sd=CH_SEED[f]||{},femOk=sd.cul==='fr';const kin=[];
 for(const id in S.chars){const c=S.chars[id];if(c.f===f&&chLive(c)&&(c.role==='kin'||c.role==='heir')&&(!r||c.id!==r.id)&&c.cap==null)kin.push(c);}
 const kids=r?kin.filter(c=>c.par===r.id&&(!c.fem||femOk||r.fem)):[],pool=kids.length?kids:kin.filter(c=>!c.fem||femOk);
 pool.sort((a,b)=>((b.pref||0)-(a.pref||0))||(a.born-b.born)||(a.id-b.id));return pool[0]||null;}
/** Recompute f's designated heir. */
function chPickHeir(f){const F=S.fac[f],r=chRuler(f),old=chHeir(f);const best=r?chBestKin(f,r):null;
 if(old&&old!==best)old.role='kin';
 if(best)best.role='heir';F.heir=best?best.id:null;return best;}
function chElect(f){const sd=CH_SEED[f],y=chYear();const L=sd.el||[];
 for(let k=S.c.el[f]||0;k<L.length;k++){const e=L[k];if(e.d<=y||y-e.b<35||y-e.b>85)continue;S.c.el[f]=k+1;
  const c=chFromSeed(f,e,'ruler');return c;}
 const old=sd.cul==='pp'?60:50;return chGenerate(f,'ruler',old+Math.floor(R()*12));}
function chAltSucc(f){const sd=CH_SEED[f],y=chYear();const L=sd.alt||[];
 for(let k=S.c.alt[f]||0;k<L.length;k++){const e=L[k];if(e.par)continue;if(e.d<=y||y-e.b<14)continue;S.c.alt[f]=k+1;return chFromSeed(f,e,'ruler');}
 return null;}
/** The throne passes: heir, else election / invited house, else a crisis with a generated ruler. */
function chSucceed(f,old,o={}){const F=S.fac[f],sd=CH_SEED[f]||{};if(!F||!F.alive)return null;
 let neu=chHeir(f),how='heir';
 if(!neu||neu===old)neu=sd.el?null:chBestKin(f,old);
 if(!neu&&sd.el){neu=chElect(f);how='elect';}
 if(!neu&&sd.alt){neu=chAltSucc(f);if(neu)how='invite';}
 if(!neu){neu=chGenerate(f,'ruler',28+Math.floor(R()*15));how='crisis';}
 if(old){const P=S.c.past[f]||(S.c.past[f]=[]);P.push({n:old.rn||old.n,t0:old.acc??0,t1:S.turn,ep:old.ep||null});if(P.length>6)P.shift();}
 neu.role='ruler';neu.acc=S.turn;neu.rn=chRegnal(f,neu);F.ruler=neu.id;F.heir=null;
 if(!neu.hk){const sdk=[...(sd.kin||[]),...(sd.alt||[])];if(neu.sk&&sdk.some(x=>x.par===neu.sk))neu.hk=1;}
 chPickHeir(f);
 const age=chAge(neu),minor=age<16;
 if(minor)S.c.regency[f]=S.turn+BAL_C.regencyTurns;else delete S.c.regency[f];
 S.c.lastSucc[f]=S.turn;
 if(o.quiet)return neu;
 const nm=neu.rn||neu.n,ttl=chTitle(neu);
 let msg=how==='elect'?`${FAC[f].s}: ${nm} yeni ${ttl.toLowerCase()} seçildi.`:how==='invite'?`${FAC[f].s} tahtına ${nm} davet edildi.`:how==='crisis'?`${FAC[f].s} tahtı boş kaldı; beyler ${nm} adını taşıyan uzak bir akrabayı tahta çıkardı.`:`${FAC[f].s} tahtına ${nm} çıktı.`;
 if(minor)msg+=` Hükümdar henüz ${age} yaşında; devleti bir naip yönetecek.`;
 chNews(f,msg,'cap');
 if(f===S.player){try{SND.play('succession');}catch(e){}
  if(how==='crisis')chAsk('crisis',{f,id:neu.id});
  else{const hd=chHeir(f),d=(old?`${old.rn||old.n} artık yok. `:'')+msg+(hd?` Veliaht: ${chLabel(hd)}.`:' Tahtın bir varisi yok; hanedanın geleceği belirsiz.');
   queueModal(()=>eventModal({t:how==='elect'?'Yeni Seçim':'Taht Değişti',e:dateStr(S.turn),d,ch:[{l:`Yaşasın ${nm}!`}]}));}}
 else if(how==='crisis')chCrisisAI(f);
 runHooks('succession',f,old,neu);
 return neu;}
/** Crisis consequences for an AI realm: 1-3 provinces turn restless. */
function chCrisisAI(f){const ps=facProvs(f).filter(i=>i!==S.fac[f].cap);const n=Math.min(ps.length,1+Math.floor(R()*3));
 for(let k=0;k<n;k++){const i=ps.splice(Math.floor(R()*ps.length),1)[0];S.prov[i].un=Math.max(S.prov[i].un,6);}}
function chCrisisGold(f){return Math.max(BAL_C.crisisGold[0],Math.round((income(f)-upkeep(f))*BAL_C.crisisGold[1]));}
/** Kill a character; fires charDied, then succession if it was a ruler. */
function chKill(id,cause){const c=typeof id==='object'?id:S.chars[id];if(!chLive(c))return null;const f=c.f,F=S.fac[f];
 c.died=S.turn;c.dc=cause||'natural';
 for(const a of S.armies)if(a.gen===c.id){a.gen=null;if(c.traits.includes('akinci')&&a.mpMax>2)a.mpMax--;}
 if(F){F.gens=(F.gens||[]).filter(x=>x!==c.id);}
 const wasRuler=F&&F.ruler===c.id,wasHeir=F&&F.heir===c.id;
 if(!wasRuler){const who=c.role==='gen'?`${FAC[f].s} komutanı ${c.n}`:`${FAC[f].s} ${chLabel(c)}`;
  const why=cause==='battle'?'muharebede can verdi':cause==='executed'?'idam edildi':'hayatını kaybetti';
  if(f===S.player)chNews(f,`${who} ${why}.`,wasHeir?'war':'info');}
 runHooks('charDied',c);
 if(wasRuler&&F.alive){const age=chAge(c),nm=c.rn||c.n;
  const why=cause==='battle'?'muharebe meydanında düştü':cause==='fall'?'şehrinin surlarında savaşarak can verdi':cause==='plague'?'vebadan öldü':age>=70?`${age} yaşında, ihtiyarlıktan öldü`:`${age} yaşında öldü`;
  if(f===S.player){try{SND.play('bell');}catch(e){}}
  chNews(f,`${FAC[f].s} hükümdarı ${nm} ${why}.`,'cap');
  chSucceed(f,c);}
 else if(wasHeir&&F.alive)chPickHeir(f);
 return c;}
/** Dynasty news: the player's realm and its neighbours / war enemies get season news, others the chronicle. */
function chNews(f,m,k){if(!S.player)return;const pl=S.player;
 if(f===pl||atWar(pl,f)||isAlly(pl,f)||nbrs(pl).includes(f))news(m,k);else{addLog(m,'info');chRep.push({f,m});}}

/* ---------------- yearly life: births, historical arrivals, aging ---------------- */
function chHazard(c,y){const a=y-c.born;let h=BAL_C.h0*Math.exp(BAL_C.hb*(a-40));
 if(c.hd&&c.fate!=='city'){if(y>=c.hd-BAL_C.histWin&&y<=c.hd+BAL_C.histWin)h*=BAL_C.histMul;else if(y>c.hd+BAL_C.histWin)h=Math.max(h*BAL_C.lateMul,BAL_C.lateMin);}
 if(c.traits.includes('hasta'))h*=BAL_C.hastaMul;
 return 1-Math.pow(1-Math.min(h,.95),.25);}   // chance per season
function chSpawnYear(y){
 FK.forEach(f=>{const F=S.fac[f],sd=CH_SEED[f];if(!F.alive||!sd)return;
  for(const e of [...(sd.kin||[]),...(sd.alt||[]).filter(x=>x.par)]){const sk=f+':'+e.k;if(S.c.sp[sk]||e.b>y)continue;S.c.sp[sk]=1;
   const p=e.par&&chBySeed(f,e.par);if(!chLive(p)||e.d<=y)continue;
   const c=chFromSeed(f,e,'kin');if(f===S.player)chNews(f,`Sarayda bir çocuk dünyaya geldi: ${c.n}.`,'good');}
  for(const e of sd.gen||[]){const sk=f+':'+e.k;if(S.c.sp[sk]||(e.from||0)>y||y-e.b<16)continue;S.c.sp[sk]=1;if(e.d<=y)continue;
   const g=chFromSeed(f,e,'gen');F.gens.push(g.id);if(f===S.player)chNews(f,`${g.n} komutanlarının arasına katıldı.`,'good');}
  const r=chRuler(f);if(!r||r.nk||r.hk||r.fem)return;const a=y-r.born;if(a<BAL_C.kidAge[0]||a>BAL_C.kidAge[1])return;
  let kids=0;for(const id in S.chars){const c=S.chars[id];if(c.par===r.id&&chLive(c))kids++;}
  if(kids<BAL_C.maxKids&&R()<BAL_C.birth*(kids?.5:1)){const c=chCreate({n:chPick(CH_NAMES[sd.cul==='pp'?'it':sd.cul]||CH_NAMES.tr),f,role:'kin',born:y,par:r.id,dyn:r.dyn});
   if(f===S.player)chNews(f,`${r.rn||r.n} bir oğul sahibi oldu: ${c.n}.`,'good');chPickHeir(f);}
  else if(!chHeir(f))chPickHeir(f);});}
function chTick(){if(!S.c)return;const y=chYear(),dead=[];
 for(const id in S.chars){const c=S.chars[id];if(!chLive(c))continue;const F=S.fac[c.f];if(!F||!F.alive){c.died=S.turn;c.dc='exile';continue;}
  if(c.cap!=null&&S.turn>=c.cap){delete c.cap;if(c.f===S.player)chNews(c.f,`${c.n} fidye karşılığı esaretten döndü.`,'good');}
  if(y-c.born>=BAL_C.maxAge||R()<chHazard(c,y))dead.push(c);}
 for(const c of dead)chKill(c,y-c.born>=BAL_C.maxAge?'old':'natural');
 FK.forEach(f=>{const F=S.fac[f];if(!F.alive)return;if(!chRuler(f)){if(!Object.keys(S.chars).some(id=>S.chars[id].f===f))chSeedFaction(f);else chSucceed(f,null);}else if(!chHeir(f))chPickHeir(f);});
 if((S.turn+1)%4===0)chSpawnYear(y+1);
 if(S.turn%4===0)chPrune();}
function chPrune(){const keep=new Set();FK.forEach(f=>{const F=S.fac[f];keep.add(F.ruler);keep.add(F.heir);});for(const a of S.armies)if(a.gen!=null)keep.add(a.gen);
 for(const id in S.chars){const c=S.chars[id];if(c.died!=null&&S.turn-c.died>BAL_C.pruneAfter&&!keep.has(c.id)&&!c.keep)delete S.chars[id];}}

/* ---------------- generals on armies ---------------- */
/** A free commander of f: the ruler or heir if they command, then historical generals, then generated ones. */
function chFreeGen(f,gen=true){const F=S.fac[f];if(!F||!F.alive)return null;const used=new Set();for(const a of S.armies)if(a.gen!=null)used.add(a.gen);
 const c=[];const r=chRuler(f),h=chHeir(f);
 if(r&&r.skill>0&&chAge(r)>=16)c.push(r);if(h&&h.skill>0&&chAge(h)>=16)c.push(h);
 for(const g of chGenerals(f))c.push(g);
 const free=c.filter(x=>!used.has(x.id)&&x.cap==null&&chAge(x)>=16).sort((a,b)=>((b.sk?1:0)-(a.sk?1:0))||(b.skill-a.skill));
 if(free.length)return free[0];
 if(gen&&chGenerals(f).length<BAL_C.genMax)return chGenGeneral(f);return null;}
function chAssignGen(a){if(!S||!S.c||a.gen!=null||!S.armies.includes(a))return;const g=chFreeGen(a.f);if(!g)return;a.gen=g.id;
 if(g.traits.includes('akinci'))a.mpMax=(a.mpMax||2)+1;}
hook('armyCreated',a=>chAssignGen(a),50);
/** The commanding character on one side of a battle context (explicit army refs first, else the largest army there). */
function chCtxGen(ctx,side){if(!S.c)return null;
 let a=side==='att'?(ctx.attArmy??ctx.armyA??ctx.army):(ctx.defArmy??ctx.armyD);
 if(Array.isArray(a))a=a[0];if(typeof a==='number')a=armyById(a);
 if(!a){const f=side==='att'?ctx.att:ctx.def,i=side==='att'?ctx.from:ctx.to;if(f==null||i==null)return null;
  let best=null;for(const x of S.armies)if(x.loc===i&&x.f===f&&x.gen!=null&&(!best||x.n>best.n))best=x;a=best;}
 const c=a&&a.gen!=null?S.chars[a.gen]:null;return chLive(c)&&c.cap==null?c:null;}
BATTLE_MODS.push(ctx=>{if(!S.c||(ctx.from==null&&ctx.to==null&&!ctx.army&&!ctx.attArmy))return null;const out=[];
 for(const side of ['att','def']){const g=chCtxGen(ctx,side);if(!g)continue;const sk=Math.max(1,g.skill||1);
  out.push({l:`Komutan: ${g.rn||g.n}`,m:1+BAL_C.genMul*sk,side,k:'gen',gid:g.id});
  if(ctx.to!=null){if(g.traits.includes('dag')&&PD[ctx.to].mtn)out.push({l:`${g.n}: Dağ Kurdu`,m:BAL_C.mul.dag,side,k:'gtrait'});
   if(side==='att'&&g.traits.includes('topcu')&&S.prov[ctx.to].fort>0&&ctx.kind!=='field')out.push({l:`${g.n}: Topçu`,m:BAL_C.mul.topcu,side,k:'gtrait'});}}
 return out;});
/* ruler traits in battle */
BATTLE_MODS.push(ctx=>{if(!S.c)return null;const out=[];
 const ra=ctx.att&&chRuler(ctx.att),rd=ctx.def&&chRuler(ctx.def);
 if(ra){if(ra.traits.includes('cengaver'))out.push({l:'Hükümdar: Cengâver',m:BAL_C.mul.cengaver,side:'att',k:'ruler'});
  if(ra.traits.includes('fatih')&&ctx.to!=null&&S.prov[ctx.to].fort>=2)out.push({l:'Hükümdar: Fatih',m:BAL_C.mul.fatih,side:'att',k:'ruler'});}
 if(rd){if(rd.traits.includes('sebatkar'))out.push({l:'Hükümdar: Sebatkâr',m:BAL_C.mul.sebatkar,side:'def',k:'ruler'});
  if(rd.traits.includes('zalim'))out.push({l:'Hükümdar: Zalim',m:BAL_C.mul.zalim,side:'def',k:'ruler'});
  if(rd.traits.includes('dindar')&&ctx.att&&FAC[ctx.att].rel!==FAC[ctx.def].rel)out.push({l:'Hükümdar: Dindar',m:BAL_C.mul.dindar,side:'def',k:'ruler'});}
 return out.length?out:null;});
/* the losing commander may fall or be captured: rep.genFate={id,n,f,fate:'died'|'captured',t} */
hook('battleResolved',rep=>{if(!S.c||!rep||!rep.mods)return;const lose=rep.win?'def':'att';
 const m=rep.mods.find(x=>x.k==='gen'&&x.side===lose);if(!m)return;const c=S.chars[m.gid];if(!chLive(c))return;
 const ruler=S.fac[c.f]&&S.fac[c.f].ruler===c.id,q=R();let fate=null;
 if(q<(ruler?BAL_C.rulerDie:BAL_C.genDie))fate='died';else if(!ruler&&q<BAL_C.genDie+BAL_C.genCap)fate='captured';
 if(!fate)return;const nm=c.rn||c.n,where=PD[rep.to]?PD[rep.to].name:'';
 rep.genFate={id:c.id,n:nm,f:c.f,fate,t:fate==='died'?`${nm} ${where} muharebesinde can verdi.`:`${nm} ${where} muharebesinde esir düştü.`};
 if(fate==='died')chKill(c,'battle');
 else{c.cap=S.turn+BAL_C.captiveTurns;for(const a of S.armies)if(a.gen===c.id){a.gen=null;if(c.traits.includes('akinci')&&a.mpMax>2)a.mpMax--;}
  chNews(c.f,`${FAC[c.f].s} komutanı ${nm} esir düştü.`,c.f===S.player?'war':'info');}},40);

/* ---------------- ruler traits and regency in the economy ---------------- */
ECON_ROWS.push(f=>{if(!S.c)return null;const r=chRuler(f),out=[];
 if(r)for(const t of r.traits){const v=BAL_C.gold[t];if(!v)continue;out.push({id:'ch-'+t,l:`Hükümdar: ${CH_TRAITS[t].l}`,v,k:t==='savurgan'||t==='zalim'?'exp':'inc'});}
 const rg=S.c.regency[f];if(rg!=null&&S.turn<rg){let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)s+=provIncome(i);out.push({id:'ch-regency',l:`Naip yönetimi (${rg-S.turn} tur)`,v:s*BAL_C.regencyCut,k:'exp'});}
 return out;});

/* ---------------- world events touching dynasties ---------------- */
hook('capture',(i,nf,old)=>{if(!S.c||PD[i].key!=='istanbul')return;
 const r=chRuler(nf);if(r&&!r.ep&&old==='BYZ'){r.ep=nf==='OSM'?'Fatih':'Kurtarıcı';if(nf==='OSM'&&!r.traits.includes('fatih'))r.traits.push('fatih');}
 if(old!=='BYZ')return;const F=S.fac.BYZ,k=S.chars[F.ruler];if(!k||(k.died!=null&&!(k.died===S.turn&&k.dc==='exile')))return;
 if(F.alive)chKill(k,'fall');else{k.died=S.turn;k.dc='fall';chNews('BYZ',`${k.rn||k.n} şehrinin surlarında savaşarak can verdi. Doğu Roma İmparatorluğu sona erdi.`,'cap');}});
hook('eliminate',f=>{if(!S.c)return;for(const id in S.chars){const c=S.chars[id];if(c.f===f&&chLive(c)){c.died=S.turn;c.dc='exile';}}const F=S.fac[f];F.heir=null;F.gens=[];});

/* ---------------- pending decisions (survive a reload) ---------------- */
const CH_PEND={};  // kind -> data => {t,d,ch:[{l,f?,dis?}]} | null
/** Ask the player a question that must survive a reload; builders live in CH_PEND. */
function chAsk(kind,data){const p={kind,data};S.c.pend.push(p);queueModal(()=>chShowPend(p));}
function chShowPend(p){if(!S.c.pend.includes(p))return;let spec=null;try{spec=CH_PEND[p.kind]&&CH_PEND[p.kind](p.data);}catch(e){console.error('pend '+p.kind,e);}
 if(!spec){S.c.pend=S.c.pend.filter(x=>x!==p);return;}
 eventModal({...spec,e:spec.e||dateStr(S.turn),ch:spec.ch.map(c=>({...c,f:()=>{S.c.pend=S.c.pend.filter(x=>x!==p);if(c.f)c.f();}}))});}
hook('enterGame',()=>{if(S&&S.c&&S.c.pend.length)S.c.pend.forEach(p=>queueModal(()=>chShowPend(p)));});
CH_PEND.crisis=({f,id})=>{const c=S.chars[id];if(!chLive(c)||f!==S.player)return null;const F=S.fac[f],g=chCrisisGold(f),nm=c.rn||c.n;
 return {t:'Taht Boşluğu',d:`Hanedanın erkek varisi kalmadı. Divan, uzak bir akraba olan ${nm} adını öne sürdü; ama beyler bölünmüş durumda. Tahtı nasıl sağlamlaştıracaksın?`,
  ch:[{l:'Beyleri kendi hâllerine bırak (2 eyalet 6 tur huzursuz)',f:()=>chCrisisAI(f)},
   {l:`Beylere altın dağıt (−${g} altın)`,dis:F.gold<g,f:()=>{F.gold=Math.max(0,F.gold-g);}},
   {l:'Ordunun adayını destekle (hükümdar Cengâver olur, başkent garnizonu −20%)',f:()=>{if(!c.traits.includes('cengaver'))c.traits.push('cengaver');const p=S.prov[F.cap];p.t=Math.round(p.t*.8/100)*100;}}]};};

/* ---------------- lifecycle hooks ---------------- */
hook('newGame',(s)=>{s.c=chNewC();chSeedAll();},5);
hook('newGame',()=>{for(const a of S.armies)chAssignGen(a);},90);
hook('turnStart',()=>{chRep=[];});
hook('roundEnd',()=>chTick(),40);
/* v1 saves: seed the dynasties aged to the save's date; convert the old hold missions. Idempotent. */
hook('migrate',(s)=>{const prev=S;S=s;try{
  if(!s.c||typeof s.c!=='object')s.c=chNewC();const d=chNewC();for(const k in d)if(!(k in s.c))s.c[k]=d[k];
  if(!Object.keys(s.chars).length){chSeedAll();if(s.flags&&s.flags.fetih){const r=chRuler('OSM');if(r&&!r.ep){r.ep='Fatih';r.traits.push('fatih');}}
   for(const a of s.armies||[])chAssignGen(a);}
  (s.mis||[]).forEach(m=>{if(m.hold&&m.vs==null){m.vs='OSM';m.turns=8;m.prog=0;}});
 }finally{S=prev;}},20);

/* ---------------- UI ---------------- */
function chStars(n){n=Math.max(0,Math.min(5,n|0));return `<span class="ch-stars" aria-label="Kabiliyet ${n}/5">${'★'.repeat(n)}<i>${'★'.repeat(5-n)}</i></span>`;}
function chTraitChips(c){return c.traits.filter(t=>CH_TRAITS[t]).map(t=>`<span class="chip ch-tr" data-tip="ch-trait" data-tr="${t}" title="${esc(CH_TRAITS[t].d)}">${esc(CH_TRAITS[t].l)}</span>`).join('');}
TIPS['ch-trait']=el=>{const t=CH_TRAITS[el.dataset.tr];return t?`<b>${esc(t.l)}</b><br>${esc(t.d)}`:'';};
function chGenStatus(g){if(g.cap!=null)return `esir (${g.cap-S.turn} tur)`;const a=S.armies.find(x=>x.gen===g.id);return a?`ordu başında · ${PD[a.loc].name}`:'boşta';}
STATE_SECTIONS.push({id:'dynasty',order:30,html(f){if(!S.c)return '';const r=chRuler(f);if(!r)return '';const h=chHeir(f),F=S.fac[f];
 const rg=S.c.regency[f],reg=rg!=null&&S.turn<rg;
 const kin=Object.values(S.chars).filter(c=>c.f===f&&chLive(c)&&c.role==='kin').sort((a,b)=>a.born-b.born).slice(0,6);
 const gens=[...new Set([...(r.skill>0?[r]:[]),...(h&&h.skill>0?[h]:[]),...chGenerals(f)])];
 const past=(S.c.past[f]||[]).slice().reverse();
 return `<div class="sec ch-dyn"><h3>Hanedan${r.dyn?` · ${esc(r.dyn)}`:''}</h3>
  <div class="ch-card"><div class="ch-crown">♛</div><div><b>${esc(r.rn||r.n)}</b>${r.ep?` <em>“${esc(r.ep)}”</em>`:''}<small>${esc(chTitle(r))} · ${chAge(r)} yaşında · ${Math.floor((S.turn-(r.acc||0))/4)} yıldır tahtta</small>
   <div class="ch-trs">${chTraitChips(r)||'<span class="hint">Belirgin bir huyu yok.</span>'}</div></div></div>
  ${reg?`<div class="hint ch-warn">Hükümdar çocuk yaşta; ${rg-S.turn} tur daha naip yönetiyor (vergilerin %10'u kayıp).</div>`:''}
  <div class="ch-row"><span>Veliaht</span><b>${h?`${esc(chLabel(h))} (${chAge(h)})`:'<span class="neg">Yok: hükümdar ölürse taht boşluğu çıkar</span>'}</b></div>
  ${kin.length?`<div class="ch-row"><span>Aile</span><b>${kin.map(c=>`${esc(c.n)} (${chAge(c)})`).join(', ')}</b></div>`:''}
  <h3 style="margin-top:10px">Komutanlar</h3>
  <div class="ch-gens">${gens.length?gens.map(g=>`<div class="ch-gen"><b>${esc(g.rn||g.n)}</b>${chStars(g.skill)}<small>${chGenStatus(g)} · ${chAge(g)} yaşında</small><div class="ch-trs">${chTraitChips(g)}</div></div>`).join(''):'<div class="hint">Henüz tanınmış bir komutan yok. Yeni ordular kurdukça beyler öne çıkar.</div>'}</div>
  ${past.length?`<div class="ch-row ch-past"><span>Önceki hükümdarlar</span><b>${past.map(p=>`${esc(p.n)}${p.ep?` “${esc(p.ep)}”`:''} (${START_YEAR+Math.floor(p.t0/4)}–${START_YEAR+Math.floor(p.t1/4)})`).join(' · ')}</b></div>`:''}
 </div>`;}});
PANEL_SECTIONS.push({id:'general',order:35,when:c=>{if(selArmy==null||!S.c)return false;const a=armyById(selArmy);return !!a&&a.loc===c.i&&a.gen!=null&&chLive(S.chars[a.gen]);},
 html(c){const a=armyById(selArmy),g=S.chars[a.gen];const bonus=Math.round(BAL_C.genMul*Math.max(1,g.skill)*100);
  return `<div class="sec ch-cmd"><h3>Komutan</h3><div class="ch-gen"><b>${esc(g.rn||g.n)}</b>${chStars(g.skill)}<small>Muharebede +${bonus}% · ${chAge(g)} yaşında</small><div class="ch-trs">${chTraitChips(g)}</div></div></div>`;}});
REPORT_SECTIONS.push({id:'dynasty',order:40,html(){const L=chRep;if(!L.length)return '';
 return `<div class="sec"><h3>Hanedanlar</h3><div class="logl">${L.slice(0,8).map(x=>`<div><time>${esc(FAC[x.f].s)}</time><span>${esc(x.m)}</span></div>`).join('')}</div></div>`;}});
DIPLO_ROW.push({id:'dyn',order:20,meta(f){if(!S.c)return '';const r=chRuler(f);if(!r)return '';const h=chHeir(f);
 return `<span>Hükümdar <b>${chAge(r)}</b> yaşında</span>${h?'':'<span class="neg">Varisi yok</span>'}`;}});

KE.rulerName=f=>rulerName(f);
KE.ch={create:s=>chCreate(s),kill:(id,c)=>chKill(id,c),ruler:f=>chRuler(f),heir:f=>chHeir(f),gens:f=>chGenerals(f),age:id=>chAge(id),title:c=>chTitle(c),label:c=>chLabel(c),succeed:f=>chSucceed(f,chRuler(f)),tick:()=>chTick(),bal:BAL_C,portrait:c=>chPortraitSpec(c)};
