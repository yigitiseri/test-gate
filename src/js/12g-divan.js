/* =====================================================================
   DIVAN: the player's three great officers, each with a skill of 1-5 stars.
    - sad: Grand Vizier / Chancellor: every season the other realms at peace with us think a little better of us;
    - def: Treasurer: provincial taxes +2.5% per star (a ledger row);
    - ser: Commander-in-Chief / Marshal: +2.5% per star in every battle and siege the player fights (odds card).
   S.court = {sad, def, ser: {n, sk, born, t} | null, cand: {t, L: [{o, n, sk, age}]}}
   A new game starts with two-star officers; candidates are drawn once a season (two per office) and cost gold
   to appoint (more for more stars). Officers age and may die (from 55 more likely); the office then stands empty.
   Titles follow the realm's faith. The Divan is a tab of the reforms window; the advisor points at an empty office.
   Names come from the culture's pool (03d) with a local hash, so the game's random sequence is untouched.
   ===================================================================== */
const BAL_DV={op:.4,tax:.025,bat:.025,cost:12,die:.02,dieAge:55,dieStep:.012};
const DV_K=['sad','def','ser'];
const DV_T={sad:[['Sadrazam','Grand Vizier'],['Şansölye','Chancellor']],def:[['Defterdar','Treasurer'],['Hazinedar','Treasurer']],ser:[['Serasker','Commander-in-Chief'],['Mareşal','Marshal']]};
const DV_D={sad:['Barışta olduğun devletler her mevsim sana biraz daha iyi bakar (yıldız başına).','Realms at peace with you think a little better of you every season (per star).'],
 def:['Eyalet vergileri yıldız başına %2,5 artar.','Provincial taxes +2.5% per star.'],
 ser:['Savaşlarda ve kuşatmalarda yıldız başına +%2,5 güç.','+2.5% per star in battles and sieges.']};
function dvTitle(k,f){const m=FAC[f||S.player]&&FAC[f||S.player].rel==='İslam'?0:1,t=DV_T[k][m];return lng(t[0],t[1]);}
/** Draws for names, candidates and deaths: a hash of the turn and a counter kept in the save (S.dvn), so the same
 game plays the same way and the game's own random sequence (R) is untouched. */
function dvRnd(){if(!S)return .5;S.dvn=((S.dvn||0)+1)|0;return hash(S.turn*7919+S.dvn,S.dvn*17+31);}
function dvName(f){const sd=(typeof CH_SEED!=='undefined'&&CH_SEED[f])||{cul:'tr'},pool=CH_NAMES[sd.cul==='pp'?'it':sd.cul]||CH_NAMES.tr,pick=L=>L[Math.floor(dvRnd()*L.length)%L.length];
 return sd.sur?pick(pool)+' '+pick(sd.sur):pick(pool);}
function dvYear(){return START_YEAR+Math.floor(S.turn/4);}
function dvMake(f,sk,age){return {n:dvName(f),sk,born:dvYear()-age,t:S.turn};}
/** The court record, created on first use (new games and old saves: two-star officers). */
function dvS(){if(!S.court&&S.player){const f=S.player;S.court={sad:dvMake(f,2,48),def:dvMake(f,2,42),ser:dvMake(f,2,38),cand:null};}return S.court;}
hook('newGame',s=>{s.court=null;if(s.player)dvS();});
hook('migrate',s=>{if(s.court&&typeof s.court!=='object')s.court=null;});
const dvSk=k=>{const c=S&&S.player&&dvS()[k];return c?c.sk:0;};
const dvAge=c=>dvYear()-c.born;
const dvCost=sk=>sk*sk*BAL_DV.cost;
/** Two candidates per office, drawn once a season. */
function dvCands(){const C=dvS();if(C.cand&&C.cand.t===S.turn)return C.cand.L;const f=S.player,L=[];
 for(const o of DV_K)for(let j=0;j<2;j++){const r=dvRnd(),sk=r<.35?1:r<.65?2:r<.85?3:r<.96?4:5;L.push({o,n:dvName(f),sk,age:28+Math.floor(dvRnd()*30)});}
 C.cand={t:S.turn,L};return L;}
function dvAppoint(idx){const C=dvS(),c=dvCands()[idx];if(!c||c.used)return false;const F=S.fac[S.player],cost=dvCost(c.sk);if(F.gold<cost)return false;
 F.gold-=cost;C[c.o]={n:c.n,sk:c.sk,born:dvYear()-c.age,t:S.turn};c.used=true;
 addLog(lng(`${c.n} ${dvTitle(c.o)} oldu.`,`${c.n} has become ${dvTitle(c.o)}.`),'good');runHooks('divan',c.o);return true;}
function dvDismiss(k){const C=dvS();if(!C[k])return false;addLog(lng(`${C[k].n} ${dvTitle(k)} makamından azledildi.`,`${C[k].n} has been dismissed as ${dvTitle(k)}.`),'info');C[k]=null;return true;}

/* --- effects --- */
ECON_ROWS.push(f=>{if(!S||f!==S.player)return null;const sk=dvSk('def');if(!sk)return null;let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f&&!S.prov[i].ctl)s+=provIncome(i);
 return s>0?[{id:'dv-def',l:`${dvTitle('def')} ${dvS().def.n}`,v:s*BAL_DV.tax*sk,k:'inc',tip:lng(DV_D.def[0],DV_D.def[1])}]:null;});
BATTLE_MODS.push(ctx=>{if(!S||!S.player||!ctx.att)return null;const sk=dvSk('ser');if(!sk)return null;
 const side=ctx.att===S.player?'att':ctx.def===S.player||(ctx.defFs||[]).includes(S.player)?'def':null;if(!side)return null;
 return [{l:`${dvTitle('ser')} ${dvS().ser.n}`,m:1+BAL_DV.bat*sk,side,k:'dv-ser'}];});
hook('newTurn',()=>{if(!S.player||!alive(S.player))return;const f=S.player;
 const sk=dvSk('sad');if(sk)for(const g of FK)if(g!==f&&alive(g)&&!atWar(f,g))addOp(f,g,BAL_DV.op*sk);
 if(S.turn%4===0)dvAging();});
/** Once a year: the officers may die (more likely from 55). */
function dvAging(){const C=dvS();
 for(const k of DV_K){const c=C[k];if(!c)continue;const a=dvAge(c),p=BAL_DV.die+Math.max(0,a-BAL_DV.dieAge)*BAL_DV.dieStep;
  if(dvRnd()<p){const m=lng(`${dvTitle(k)} ${c.n} ${a} yaşında öldü. Divanda bir makam boş.`,`${dvTitle(k)} ${c.n} has died at ${a}. An office of the Divan stands empty.`);news(m,'info');C[k]=null;}}}

/* --- the Divan tab --- */
const dvStars=n=>'<span class="dv-st" aria-label="'+n+'/5">'+'★'.repeat(n)+'<i>'+'★'.repeat(5-n)+'</i></span>';
function rfTabs(cur){return `<div class="rf-tabs" role="tablist"><button class="rf-tab${cur==='rf'?' on':''}" role="tab" aria-selected="${cur==='rf'}" data-act="reforms">❖ ${lng('Gelişmeler','Reforms')}</button><button class="rf-tab${cur==='dv'?' on':''}" role="tab" aria-selected="${cur==='dv'}" data-act="divan">${lng('Divan','The Divan')}${DV_K.some(k=>!dvS()[k])?' <b class="rf-dot">!</b>':''}</button></div>`;}
function showDivan(){const f=S.player;if(!f)return;const C=dvS(),cands=dvCands(),gold=Math.floor(S.fac[f].gold);
 openModal(`<div class="eyebrow">${lng('Devletin gelişimi','The growth of the realm')}</div><h2>${lng('Divan','The Divan')}</h2>${rfTabs('dv')}
 <p class="lead">${lng(`Devletin üç büyük makamı. Daha yetenekli birini atamak için altın gerekir. Hazine: <b>${gold}</b> altın.`,`The three great offices of the realm. Appointing someone abler costs gold. Treasury: <b>${gold}</b> gold.`)}</p>
 ${DV_K.map(k=>{const c=C[k],L=cands.map((x,i)=>({...x,i})).filter(x=>x.o===k);
  return `<div class="sec dv"><h3>${dvTitle(k)}</h3><div class="hint">${esc(lng(DV_D[k][0],DV_D[k][1]))}</div>
   ${c?`<div class="dv-cur"><b>${esc(c.n)}</b> ${dvStars(c.sk)}<small>${lng(`${dvAge(c)} yaşında`,`aged ${dvAge(c)}`)}</small><button class="btn" data-act="dvx" data-k="${k}">${lng('Azlet','Dismiss')}</button></div>`
     :`<div class="dv-cur dv-empty">${lng('Makam boş','The office stands empty')}</div>`}
   <div class="dv-cands">${L.map(x=>`<div class="dv-c"><span><b>${esc(x.n)}</b> ${dvStars(x.sk)}<small>${lng(`${x.age} yaşında`,`aged ${x.age}`)}</small></span>${x.used?`<span class="rf-st ok">${lng('Atandı','Appointed')}</span>`:`<button class="btn${gold>=dvCost(x.sk)&&(!c||x.sk>c.sk)?' primary':''}" data-act="dvset" data-i="${x.i}"${gold>=dvCost(x.sk)?'':' disabled'}>${lng(`Ata · ${dvCost(x.sk)} altın`,`Appoint · ${dvCost(x.sk)} gold`)}</button>`}</div>`).join('')}</div></div>`;}).join('')}
 <p class="hint">${lng('Adaylar her mevsim değişir.','The candidates change every season.')}</p>
 <div class="foot"><button class="btn primary" data-act="mclose">${lng('Kapat','Close')}</button></div>`);}
ACTS.divan=()=>showDivan();
ACTS.dvset=t=>{if(dvAppoint(+t.dataset.i)){SND.play('build');renderAll();showDivan();}};
ACTS.dvx=t=>{if(dvDismiss(t.dataset.k)){renderAll();showDivan();}};
OVERBLOCK.add('dvset');OVERBLOCK.add('dvx');
ADVICE.push({id:'divan',prio:28,when:(S,f)=>{if(S.turn<2)return null;const C=dvS(),k=DV_K.find(k=>!C[k]);return k&&S.fac[f].gold>=40?k:null;},
 t:(S,f,k)=>lng(`${dvTitle(k)} makamı boş`,`No ${dvTitle(k)} in the Divan`),
 d:(S,f,k)=>lng(`Paşam, divanda ${dvTitle(k)} makamı boş duruyor. Yerine birini ata ki işler aksamasın.`,`My lord, the office of ${dvTitle(k)} stands empty. Appoint someone before affairs suffer.`),
 go:()=>showDivan(),goL:lng('Divan','The Divan')});
KE.divan={get:()=>dvS(),cands:()=>dvCands(),appoint:i=>dvAppoint(i),dismiss:k=>dvDismiss(k),title:(k,f)=>dvTitle(k,f),aging:()=>dvAging()};
