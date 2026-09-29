/* ---------------- war & peace ---------------- */
function declareWar(a,b){
 if(atWar(a,b)||a===b)return;
 delete S.ally[key(a,b)];
 S.war[key(a,b)]=newWar(a,b);addOp(a,b,-60);
 alliesOf(b).forEach(c=>addOp(a,c,-25));
 const msg=`${fname(a)}, ${fname(b)} devletine savaş ilan etti.`;
 if(a===S.player||b===S.player){news(msg,'war');if(b===S.player)toast(msg,'war');}else addLog(msg,'war');
 const joined=[];
 alliesOf(b).forEach(c=>{if(c===a||atWar(c,a)||isAlly(c,a)||inTruce(c,a))return;S.war[key(c,a)]=newWar(a,c);joined.push(c);
  const m2=`${fname(c)}, müttefiki ${fname(b)} için ${fname(a)} ile savaşa girdi.`;if(c===S.player||a===S.player)news(m2,'war');else addLog(m2,'war');});
 runHooks('warDeclared',a,b);joined.forEach(c=>runHooks('warDeclared',c,a));
}
function makePeace(a,b,silent){delete S.war[key(a,b)];S.truce[key(a,b)]=S.turn+12;addOp(a,b,15);pruneOffers();
 const m=`${fname(a)} ile ${fname(b)} arasında barış imzalandı.`;if(a===S.player||b===S.player)news(m,'good');else if(!silent)addLog(m,'info');
 runHooks('peace',a,b,{silent:!!silent});}
function offerOk(o){const w=alive(o.f)&&S.war[key(o.f,S.player)];return !!w&&(o.wt==null||o.wt===w.t);}
function pruneOffers(){if(S.offers)S.offers=S.offers.filter(offerOk);}
function warScore(a,b){const w=S.war[key(a,b)];return w?(w.sc[a]||0)-(w.sc[b]||0):0;}
function aiWantsPeace(ai,other){const w=S.war[key(ai,other)];if(!w)return false;const dur=S.turn-w.t,ws=warScore(ai,other);
 const ra=strength(ai),ro=strength(other);if(ws<=-2)return true;if(ra<ro*.55)return true;if(dur>=16&&ws<3)return R()<.5;return false;}
function aiAcceptPeace(ai,pl){const w=S.war[key(ai,pl)];if(!w)return false;const dur=S.turn-w.t,ws=warScore(ai,pl);
 if(ws<=-1)return true;if(strength(ai)<strength(pl)*.75)return true;if(dur>=10&&ws<=2)return true;return false;}
function aiAcceptTribute(ai,pl){const ws=warScore(ai,pl);return tributeAmt(ai)>=10&&(ws<=-4||strength(ai)<strength(pl)*.4);}
function tributeAmt(ai){const g=Math.max(0,Math.floor(S.fac[ai].gold));return Math.min(g,Math.max(20,Math.round(Math.min(g*.7,30+devRaw(ai)*2))));}
function aiAcceptAlliance(ai,pl){if(atWar(ai,pl)||inTruce(ai,pl)&&getOp(ai,pl)<20)return false;const o=getOp(ai,pl);
 const common=warsOf(ai).some(e=>atWar(pl,e));return o>=40||(o>=10&&common);}

/* ---------------- battles ---------------- */
/* Combat modifiers come from the BATTLE_MODS registry: ctx={kind:'assault'|'field'|'sally',att,def,from,to,n}
   -> [{l:label,m:multiplier,side:'att'|'def',k:key,loss?}]. ctx.to / ctx.n may be missing (e.g. atkMul(f)).
   Optional `loss` multiplies the casualties the OTHER side suffers (e.g. "Dağ direnişi"). */
function battleMods(ctx){const out=[];for(const fn of BATTLE_MODS){const r=fn(ctx);if(r)for(const m of r)out.push(m);}return out;}
function modMul(v,mods,side){for(const m of mods)if(m.side===side)v*=m.m;return v;}
/** Casualty multiplier inflicted by `side` (product of its mods' `loss`, capped at mtnRes). */
function modLoss(mods,side){let v=1;for(const m of mods)if(m.side===side&&m.loss)v*=m.loss;return Math.min(v,BAL_B.mtnRes);}
BATTLE_MODS.push(ctx=>S.turn%4===3?[{l:'Kış seferi',m:.85,side:'att',k:'winter'}]:null);
BATTLE_MODS.push(ctx=>{if(ctx.to==null)return null;const p=S.prov[ctx.to],d=PD[ctx.to],r=[];
 if(p.fort>0&&ctx.kind!=='field')r.push({l:`Kale ${p.fort}`,m:1+.15*p.fort*(ctx.att&&S.fac[ctx.att].cannon?BAL_B.cannonFort:1),side:'def',k:'fort'});
 if(armMtn(ctx.to))r.push({l:'Dağlık arazi',m:1.3,side:'def',k:'mtn'});
 if(d.des)r.push({l:'Çöl',m:1.1,side:'def',k:'des'});
 return r;});
/* B10 "Dağ direnişi": a defender fighting in its own mountain province bleeds the attacker (+50% losses). */
BATTLE_MODS.push(ctx=>{if(ctx.to==null||!armMtn(ctx.to)||!ctx.def||S.prov[ctx.to].o!==ctx.def)return null;
 return [{l:'Dağ direnişi',m:BAL_B.mtnResDef,side:'def',k:'mtnres',loss:BAL_B.mtnRes}];});
/** Garrison plus local militia defending province i, before modifiers. */
function defBase(i){const p=S.prov[i];return p.t+p.dev*150+p.fort*700;}
function atkMul(f,ctx){return modMul(1,battleMods(ctx||{kind:'assault',att:f}),'att');}
function atkPower(n,f,ctx){return modMul(n,battleMods(ctx||{kind:'assault',att:f,n}),'att');}
function defPower(i,att){return modMul(defBase(i),battleMods({kind:'assault',att,def:S.prov[i].o,to:i}),'def');}
/** Mountain terrain for combat (map mountains plus BAL_B.mtnKeys). */
function armMtn(i){return !!PD[i].mtn||BAL_B.mtnKeys.includes(PD[i].key);}
/** Win threshold of an assault on province i (interim until sieges): fort 2 needs 1.5x, each level above +0.5x. */
function armAssaultNeed(i){const f=S.prov[i].fort;return f>=2?BAL_B.fortRatio+BAL_B.fortStep*(f-2):1;}
/** Deterministic estimate for an attack: ctx={att,to,n?,army?,from?,kind?} -> {p (win chance 0..1), a, d, r, mods, kind, need}.
 kind defaults to 'field' when armies at war with `att` stand in `to`, else 'assault'. n defaults to the army's size.
 p is a logistic in log(r/need) matching the random rolls of fieldBattle (rnd .9-1.1) / assault (rnd .85-1.2). */
function battleOdds(ctx){const arm=ctx.army!=null?(typeof ctx.army==='object'?ctx.army:armyById(ctx.army)):null;
 const f=ctx.att!=null?ctx.att:arm&&arm.f,to=ctx.to,n=ctx.n!=null?ctx.n:arm?arm.n:0,mor=arm?arm.morale:1;
 const foes=armyAt(to).filter(x=>x.f!==f&&atWar(f,x.f));const kind=ctx.kind||(foes.length?'field':'assault');
 if(kind==='field'&&foes.length){const big=foes.slice().sort((a,b)=>b.n-a.n)[0],c={kind,def:big.f,...ctx,att:f,n},mods=battleMods(c);
  const a=modMul(n*mor,mods,'att'),d=modMul(foes.reduce((s,x)=>s+x.n*x.morale,0),mods,'def'),r=a/Math.max(d,1);
  return {p:1/(1+Math.exp(-Math.log(Math.max(r,1e-6))/.045)),a,d,r,mods,kind,need:1};}
 const c={kind:'assault',def:S.prov[to].o,...ctx,att:f,n},mods=battleMods(c),need=armAssaultNeed(to);
 const a=modMul(n*mor,mods,'att'),d=modMul(defBase(to),mods,'def'),r=a/Math.max(d,1);
 return {p:1/(1+Math.exp(-Math.log(Math.max(r/need,1e-6))/.085)),a,d,r,mods,kind:'assault',need};}
/** Book-keeping shared by every battle: history, player report and stats, map redraw, hooks. */
function armBattleEnd(rep){
 S.battles.push(rep);if(S.battles.length>60)S.battles.shift();
 const mine=rep.att===S.player||rep.def===S.player||(rep.defFs||[]).includes(S.player);
 if(mine){S.report=S.report||[];S.report.push(rep);
  if(rep.att===S.player){rep.win?S.stats.won++:S.stats.lost++;}else{rep.win?S.stats.lost++:S.stats.won++;}}
 polDirty=true;
 runHooks('battleResolved',rep);if(mine)runHooks('playerBattle',rep);
 return rep;}
/** Storm province `to` from `from` with army `a` (no enemy army inside): garrison + militia + fort.
 On success the province is captured, the army moves in and leaves a small garrison. */
function armAssault(a,from,to){
 const D=S.prov[to],att=a.f,def=D.o;if(att===def||!atWar(att,def))return null;
 const n=a.n,ctx={kind:'assault',att,def,from,to,n},mods=battleMods(ctx),need=armAssaultNeed(to),ra=rnd(.85,1.2),rd=rnd(.85,1.2);
 const aP=modMul(n*a.morale,mods,'att')*ra,dP=modMul(defBase(to),mods,'def')*rd,r=aP/dP/need,defT=D.t,lm=modLoss(mods,'def');
 const rep={from,to,att,def,n,defT,turn:S.turn,win:false,aLoss:0,dLoss:0,kind:'assault',mods,roll:{a:Math.round(ra*1e3)/1e3,d:Math.round(rd*1e3)/1e3},army:a.id,need};
 const w=S.war[key(att,def)];
 if(r>1){
  const aLoss=Math.min(n,Math.round(n*clamp(.3/r,.04,.3)*lm/100)*100),dLoss=Math.round(defT*.65/100)*100;let flee=defT-dLoss;
  if(flee>0){const ret=PD[to].adj.filter(j=>S.prov[j].o===def&&garrisonMax(j)>S.prov[j].t);
   if(ret.length){const j=ret[Math.floor(R()*ret.length)],q=S.prov[j],add=Math.min(flee,garrisonMax(j)-q.t);q.t+=add;rep.retreat=j;}}
  const wasCap=S.fac[def].cap===to;
  D.t=0;D.mv=0;a.n=n-aLoss;a.loc=to;a.mp=0;
  capture(to,att);
  const g=Math.max(0,Math.min(Math.round(BAL_B.capGarDev*D.dev/100)*100,Math.floor(a.n*BAL_B.capGarShare/100)*100));
  D.t=g;a.n-=g;rep.gar=g;
  a.morale=Math.min(BAL_B.moraleMax,+(a.morale+BAL_B.moraleWin/2).toFixed(2));
  rep.win=true;rep.aLoss=aLoss;rep.dLoss=defT;if(w){w.sc[att]=(w.sc[att]||0)+2+(wasCap?3:0);}
  if(a.n<100){if(a.n>0)D.t+=a.n;a.n=0;armyRemove(a.id,'garrisoned');}
 }else{
  const aLoss=Math.min(n,Math.round(n*clamp(.55-.25*r,.25,.55)*lm/100)*100),dLoss=Math.min(defT,Math.round(defT*clamp(.3*r,.03,.3)/100)*100);
  D.t-=dLoss;a.n=n-aLoss;a.mp=0;
  a.morale=Math.max(BAL_B.moraleMin,+(a.morale-BAL_B.moraleLose/2).toFixed(2));
  if(D.fort>0&&r>.8&&R()<.3){D.fort--;rep.fortDmg=true;}
  rep.aLoss=aLoss;rep.dLoss=dLoss;if(w)w.sc[def]=(w.sc[def]||0)+1;
  if(a.n<100){armyRemove(a.id,'destroyed');rep.destroyed=[a.id];}
 }
 return armBattleEnd(rep);
}
/** Legacy entry point: the largest army of from's owner standing in `from` attacks the adjacent province `to`
 (field battle if enemy armies stand there, else an assault). Garrisons never attack: without an army -> null.
 `n` is kept for compatibility; the whole army fights. Ignores movement points (tests / scripted use). */
function battle(from,to,n){
 const att=S.prov[from].o,a=armyAt(from,att).sort((x,y)=>y.n-x.n)[0];
 if(!a||!PD[from].adj.includes(to))return null;
 const foes=armyAt(to).filter(x=>x.f!==att&&atWar(att,x.f));
 if(!foes.length&&(S.prov[to].o===att||!atWar(att,S.prov[to].o)))return null;
 const n0=a.n,rep=foes.length?fieldBattle(a,foes,to):armAssault(a,from,to);
 if(rep)TURN_TRACE.push({k:'battle',f:att,from,to,path:[from,to],army:a.id,n:n0,win:rep.win,rep});
 return rep;
}
function capture(i,f){
 const p=S.prov[i],old=p.o;p.o=f;p.un=8;p.mv=0;if(p.fort>1)p.fort--;
 {const w=S.war[key(f,old)];if(w){if(!w.looted)w.looted=[];if(!w.looted.includes(i)){w.looted.push(i);S.fac[f].gold+=p.dev*BAL_B.loot;}}} // B6: loot once per war
 if(f===S.player)S.stats.taken++;
 const d=PD[i];
 if(S.fac[old].cap===i){const rest=facProvs(old);if(rest.length){rest.sort((a,b)=>S.prov[b].dev-S.prov[a].dev);S.fac[old].cap=rest[0];}
  S.fac[old].gold=Math.round(S.fac[old].gold*.7);
  const m=`${fname(old)} başkenti ${d.name}, ${fname(f)} eline geçti!`;(old===S.player||f===S.player)?news(m,'cap'):addLog(m,'cap');}
 if(old===S.player&&f!==S.player)addLog(`${d.name} eyaletini ${fname(f)} kuvvetlerine kaptırdık.`,'war');
 if(!facProvs(old).length)eliminate(old,f);
 if(d.key==='istanbul'){
  if(f==='OSM'&&!S.flags.fetih){S.flags.fetih=1;S.fac.OSM.cap=i;p.dev+=1;p.un=2;
   news('Konstantiniyye fethedildi! Osmanlı başkenti İstanbul\'a taşındı.','cap');
   queueModal(()=>eventModal({t:'Konstantiniyye Fethedildi',e:`${dateStr(S.turn)}`,d:'Theodosius surları aşıldı. Bin yıllık Doğu Roma başkenti artık Osmanlı\'nın. Genç sultana "Fatih" unvanı veriliyor ve devlet merkezi İstanbul\'a taşınıyor.',ch:[{l:'Devam et'}]}));}
  else if(old!==f){news(`Konstantiniyye el değiştirdi: şehir artık ${fname(f)} elinde.`,'cap');}
 }
 polDirty=true;
 runHooks('capture',i,f,old);
}
function eliminate(f,by){const F=S.fac[f];F.alive=false;
 Object.keys(S.war).forEach(k=>{if(k.split('|').includes(f))delete S.war[k];});
 Object.keys(S.ally).forEach(k=>{if(k.split('|').includes(f))delete S.ally[k];});
 S.offers=S.offers.filter(o=>o.f!==f);
 if(S.armies)armyList(f).forEach(a=>armyRemove(a.id,'eliminated'));
 news(`${FAC[f].n} tarih sahnesinden silindi. Son topraklarını ${fname(by)} aldı.`,'cap');
 if(f===S.player){S.over='lose';}
 runHooks('eliminate',f,by);
}

