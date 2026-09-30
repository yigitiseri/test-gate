/* ---------------- war & peace ---------------- */
/** a declares war on b. goal (optional casus belli): {k:'claim',prov:i} (that province costs half at the peace
 table); without one the most valuable province of b on a's border is claimed. */
function declareWar(a,b,goal){
 if(atWar(a,b)||a===b)return;
 delete S.ally[key(a,b)];
 S.war[key(a,b)]=newWar(a,b);addOp(a,b,-60);
 {const g=goal&&goal.k?{...goal,f:a}:warAutoGoal(a,b);S.war[key(a,b)].goal=g;}
 alliesOf(b).forEach(c=>addOp(a,c,-25));
 const msg=lng(`${fname(a)}, ${fname(b)} devletine savaş ilan etti.`,`${fname(a)} declared war on ${fname(b)}.`);
 if(a===S.player||b===S.player){news(msg,'war');if(b===S.player)toast(msg,'war');}else addLog(msg,'war');
 const joined=[];
 alliesOf(b).forEach(c=>{if(c===a||atWar(c,a)||isAlly(c,a)||inTruce(c,a))return;S.war[key(c,a)]=newWar(a,c);joined.push(c);
  const m2=lng(`${fname(c)}, müttefiki ${fname(b)} için ${fname(a)} ile savaşa girdi.`,`${fname(c)} joined the war against ${fname(a)} to stand by its ally ${fname(b)}.`);if(c===S.player||a===S.player)news(m2,'war');else addLog(m2,'war');});
 runHooks('warDeclared',a,b);joined.forEach(c=>runHooks('warDeclared',c,a));
}
/** The default war goal: claim the most valuable province of b bordering a (capital first). */
function warAutoGoal(a,b){let best=-1,bv=-1;for(let i=0;i<NP;i++){if(S.prov[i].o!==b)continue;if(!PD[i].adj.some(j=>S.prov[j].o===a))continue;
  const v=S.prov[i].dev+(S.fac[b].cap===i?5:0);if(v>bv){bv=v;best=i;}}return best>=0?{k:'claim',f:a,prov:best}:null;}
/** End the war between a and b. terms: true/{silent} (legacy) or a basket {prov,gold,release,silent} that a takes
 from b (see peaceApply). Without a basket the side ahead in war score takes what the other concedes
 (aiPeaceBasket): occupied provinces, then gold. All occupations between a and b end; sieges are lifted.
 Fires hook peace(a,b,{silent,taker,giver,prov,gold,release,white}). */
function makePeace(a,b,terms){
 if(terms==null||typeof terms!=='object')terms={silent:!!terms};
 const has='prov' in terms||'gold' in terms||'release' in terms;let taker=a,giver=b,bk=null;
 if(has)bk=peaceNorm(terms);else if(S.war[key(a,b)]){if(warScore(a,b)<0){taker=b;giver=a;}bk=aiPeaceBasket(taker,giver);}
 delete S.war[key(a,b)];S.truce[key(a,b)]=S.turn+BAL_S.truce;addOp(a,b,15);
 const done=bk?peaceApply(taker,giver,bk):{prov:[],gold:0,release:[]};
 for(let i=0;i<NP;i++){const p=S.prov[i];if(p.ctl&&((p.ctl===a&&p.o===b)||(p.ctl===b&&p.o===a))){delete p.ctl;p.t=Math.min(p.t,garMin(i));polDirty=true;}}
 siegeClean();pruneOffers();
 const what=peaceWords(done,taker),silent=!!terms.silent;
 const m=what?lng(`${fname(a)} ile ${fname(b)} arasında barış imzalandı. ${fname(taker)} kazandı: ${what}.`,`Peace was signed between ${fname(a)} and ${fname(b)}. ${fname(taker)} gains: ${what}.`)
  :lng(`${fname(a)} ile ${fname(b)} arasında barış imzalandı.`,`Peace was signed between ${fname(a)} and ${fname(b)}.`);
 if(a===S.player||b===S.player)news(m,'good');else if(!silent||what)addLog(m,what?'cap':'info');
 runHooks('peace',a,b,{silent,taker,giver,prov:done.prov,gold:done.gold,release:done.release,white:!done.prov.length&&!done.gold&&!done.release.length});}
function offerOk(o){const w=alive(o.f)&&S.war[key(o.f,S.player)];return !!w&&(o.wt==null||o.wt===w.t)&&(o.t0==null||S.turn-o.t0<BAL_S.offerLife);}
function pruneOffers(){if(S.offers)S.offers=S.offers.filter(offerOk);}
/** Terms of an envoy's offer: the side ahead takes what the other concedes. -> {taker, giver, bk} */
function offerTerms(o){const pl=S.player,ws=warScore(o.f,pl),taker=ws>0?o.f:pl,giver=taker===pl?o.f:pl;return {taker,giver,bk:aiPeaceBasket(taker,giver)};}
function warScore(a,b){const w=S.war[key(a,b)];return w?(w.sc[a]||0)-(w.sc[b]||0):0;}
function aiWantsPeace(ai,other){const w=S.war[key(ai,other)];if(!w)return false;const dur=S.turn-w.t,ws=warScore(ai,other),ex=warEx(ai,other);
 const ra=strength(ai),ro=strength(other);if(ws<=-2)return true;if(ex>=60||(ex>=35&&ws<=0))return true;if(ra<ro*.55)return true;if(dur>=16&&ws<3)return R()<.5;return false;}
/** White peace (no terms) proposed by pl to ai. */
function aiAcceptPeace(ai,pl){return aiAcceptBasket(ai,pl,{prov:[],gold:0,release:[]});}
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
BATTLE_MODS.push(ctx=>S.turn%4===3?[{l:lng('Kış seferi','Winter campaign'),m:.85,side:'att',k:'winter'}]:null);
BATTLE_MODS.push(ctx=>{if(ctx.to==null||ctx.kind==='siege'||ctx.kind==='sally')return null;const p=S.prov[ctx.to],d=PD[ctx.to],r=[];
 if(p.fort>0&&ctx.kind!=='field')r.push({l:lng(`Kale ${p.fort}`,`Walls ${p.fort}`),m:1+.15*p.fort*(ctx.att&&S.fac[ctx.att].cannon?BAL_B.cannonFort:1)*(1-clamp(ctx.breach||0,0,.8)),side:'def',k:'fort'});
 if(armMtn(ctx.to))r.push({l:lng('Dağlık arazi','Mountain terrain'),m:1.3,side:'def',k:'mtn'});
 if(d.des)r.push({l:lng('Çöl','Desert'),m:1.1,side:'def',k:'des'});
 return r;});
/* B10 "Dağ direnişi": a defender fighting in its own mountain province bleeds the attacker (+50% losses). */
BATTLE_MODS.push(ctx=>{if(ctx.to==null||ctx.kind==='sally'||!armMtn(ctx.to)||!ctx.def||S.prov[ctx.to].o!==ctx.def)return null;
 return [{l:lng('Dağ direnişi','Mountain resistance'),m:BAL_B.mtnResDef,side:'def',k:'mtnres',loss:BAL_B.mtnRes}];});
/** Garrison plus local militia defending province i, before modifiers. */
function defBase(i){const p=S.prov[i];return p.t+(p.ctl?0:p.dev*150)+p.fort*700;} // occupied: no militia for the occupier
function atkMul(f,ctx){return modMul(1,battleMods(ctx||{kind:'assault',att:f}),'att');}
function atkPower(n,f,ctx){return modMul(n,battleMods(ctx||{kind:'assault',att:f,n}),'att');}
function defPower(i,att){return modMul(defBase(i),battleMods({kind:'assault',att,def:ctl(i),to:i}),'def');}
/** Mountain terrain for combat (map mountains plus BAL_B.mtnKeys). */
function armMtn(i){return !!PD[i].mtn||BAL_B.mtnKeys.includes(PD[i].key);}
/** Win threshold of an assault on province i (interim until sieges): fort 2 needs 1.5x, each level above +0.5x. */
function armAssaultNeed(i,breach){const f=S.prov[i].fort,n=f>=2?BAL_B.fortRatio+BAL_B.fortStep*(f-2):1;return 1+(n-1)*(1-clamp(breach||0,0,1));}
/** Share of the walls already breached by a siege of f at i (0..1). */
function armBreach(i,f){const s=siegeAt(i);return s&&s.f===f?clamp(s.prog/Math.max(s.need,.1),0,1):0;}
/** Deterministic estimate for an attack: ctx={att,to,n?,army?,from?,kind?} -> {p (win chance 0..1), a, d, r, mods, kind, need}.
 kind defaults to 'field' when armies at war with `att` stand in `to`, else 'assault'. n defaults to the army's size.
 p is a logistic in log(r/need) matching the random rolls of fieldBattle (rnd .9-1.1) / assault (rnd .85-1.2). */
function battleOdds(ctx){const arm=ctx.army!=null?(typeof ctx.army==='object'?ctx.army:armyById(ctx.army)):null;
 const f=ctx.att!=null?ctx.att:arm&&arm.f,to=ctx.to,n=ctx.n!=null?ctx.n:arm?arm.n:0,mor=arm?arm.morale:1;
 const foes=armyAt(to).filter(x=>x.f!==f&&atWar(f,x.f));const kind=ctx.kind||(foes.length?'field':S.prov[to].fort>=1?'siege':'assault');
 if(kind==='siege'){const c={kind,def:ctl(to),...ctx,att:f,n},mods=battleMods(c);
  const a=modMul(n*mor,mods,'att'),d=modMul(defBase(to),mods,'def'),r=a/Math.max(d,1),need=siegeNeed(to,f,n),rate=siegeRate(to,f,n);
  return {p:1/(1+Math.exp(-Math.log(Math.max(r,1e-6))/.12)),a,d,r,mods,kind,need:1,turns:Math.max(1,Math.ceil(need/rate-1e-9))};}
 if(kind==='field'&&foes.length){const big=foes.slice().sort((a,b)=>b.n-a.n)[0],c={kind,def:big.f,...ctx,att:f,n},mods=battleMods(c);
  const a=modMul(n*mor,mods,'att'),d=modMul(foes.reduce((s,x)=>s+x.n*x.morale,0),mods,'def'),r=a/Math.max(d,1);
  return {p:1/(1+Math.exp(-Math.log(Math.max(r,1e-6))/.045)),a,d,r,mods,kind,need:1};}
 const br=ctx.breach!=null?ctx.breach:armBreach(to,f),c={kind:'assault',def:ctl(to),breach:br,...ctx,att:f,n},mods=battleMods(c),need=armAssaultNeed(to,br);
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
/** Storm province `to` from `from` with army `a` (no enemy army inside): garrison + militia + walls (the walls count
 less the further a siege of a's side has breached them). On success the province is OCCUPIED (armOccupy; the
 owner changes only at peace), the army moves in and leaves a small garrison. */
function armAssault(a,from,to){
 const D=S.prov[to],att=a.f,def=ctl(to);if(att===def||!atWar(att,def))return null;
 const br=armBreach(to,att),n=a.n,ctx={kind:'assault',att,def,from,to,n,breach:br},mods=battleMods(ctx),need=armAssaultNeed(to,br),ra=rnd(.85,1.2),rd=rnd(.85,1.2);
 const aP=modMul(n*a.morale,mods,'att')*ra,dP=modMul(defBase(to),mods,'def')*rd,r=aP/dP/need,defT=D.t,lm=modLoss(mods,'def');
 const rep={from,to,att,def,n,defT,turn:S.turn,win:false,aLoss:0,dLoss:0,kind:'assault',mods,roll:{a:Math.round(ra*1e3)/1e3,d:Math.round(rd*1e3)/1e3},army:a.id,need};
 const w=S.war[key(att,def)];
 if(r>1){
  const aLoss=Math.min(n,Math.round(n*clamp(.3/r,.04,.3)*lm/100)*100),dLoss=Math.round(defT*.65/100)*100;
  if(siegeAt(to))delete S.sieges[to];
  D.t=Math.max(0,defT-dLoss);a.n=n-aLoss;a.st='idle';a.mp=0;rep.win=true;rep.aLoss=aLoss;rep.dLoss=defT;
  const o=armOccupy(a,to);rep.gar=o.gar;if(o.retreat!=null)rep.retreat=o.retreat;
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
 const att=ctl(from),a=armyAt(from,att).sort((x,y)=>y.n-x.n)[0];
 if(!a||!PD[from].adj.includes(to))return null;
 const foes=armyAt(to).filter(x=>x.f!==att&&atWar(att,x.f));
 if(!foes.length&&(ctl(to)===att||!atWar(att,ctl(to))))return null;
 const n0=a.n,rep=foes.length?fieldBattle(a,foes,to):armAssault(a,from,to);
 if(rep)TURN_TRACE.push({k:'battle',f:att,from,to,path:[from,to],army:a.id,n:n0,win:rep.win,rep});
 return rep;
}
/** Province i passes to f for good. o={peace:true} (treaty cession, capitulation, annexation): no loot, the walls
 stand and unrest is shorter. Without o (scripted conquest, KE.capture): the old instant capture. */
function capture(i,f,o){o=o||{};
 const p=S.prov[i],old=p.o;p.o=f;delete p.ctl;p.un=o.peace?4:8;p.mv=0;if(!o.peace&&p.fort>1)p.fort--;
 if(S.sieges&&S.sieges[i])siegeClean();
 if(!o.peace){const w=S.war[key(f,old)];if(w){if(!w.looted)w.looted=[];if(!w.looted.includes(i)){w.looted.push(i);S.fac[f].gold+=p.dev*BAL_B.loot;}}} // B6: loot once per war
 if(f===S.player)S.stats.taken++;
 const d=PD[i];
 if(S.fac[old].cap===i){const rest=facProvs(old);if(rest.length){rest.sort((a,b)=>S.prov[b].dev-S.prov[a].dev);S.fac[old].cap=rest[0];}
  S.fac[old].gold=Math.round(S.fac[old].gold*.7);
  const m=lng(`${fname(old)} başkenti ${d.name}, ${fname(f)} eline geçti!`,`${d.name}, capital of ${fname(old)}, has fallen to ${fname(f)}!`);(old===S.player||f===S.player)?news(m,'cap'):addLog(m,'cap');}
 if(old===S.player&&f!==S.player)addLog(lng(`${d.name} eyaletini ${fname(f)} kuvvetlerine kaptırdık.`,`We lost ${d.name} to the forces of ${fname(f)}.`),'war');
 if(!facProvs(old).length)eliminate(old,f);
 if(d.key==='istanbul'){
  if(f==='OSM'&&!S.flags.fetih){S.flags.fetih=1;S.fac.OSM.cap=i;p.dev+=1;p.un=2;
   news(lng('Konstantiniyye fethedildi! Osmanlı başkenti İstanbul\'a taşındı.','Constantinople has fallen! The Ottoman capital moves to Istanbul.'),'cap');
   queueModal(()=>eventModal({t:lng('Konstantiniyye Fethedildi','The Fall of Constantinople'),e:`${dateStr(S.turn)}`,d:lng('Theodosius surları aşıldı. Bin yıllık Doğu Roma başkenti artık Osmanlı\'nın. Genç sultana "Fatih" unvanı veriliyor ve devlet merkezi İstanbul\'a taşınıyor.','The Theodosian Walls have been breached. The thousand-year capital of the Eastern Romans now belongs to the Ottomans. The young sultan is hailed as "the Conqueror", and the seat of the state moves to Istanbul.'),ch:[{l:lng('Devam et','Continue')}]}));}
  else if(old!==f){news(lng(`Konstantiniyye el değiştirdi: şehir artık ${fname(f)} elinde.`,`Constantinople has changed hands: the city is now held by ${fname(f)}.`),'cap');}
 }
 polDirty=true;
 runHooks('capture',i,f,old,o);
}
function eliminate(f,by){const F=S.fac[f];F.alive=false;
 Object.keys(S.war).forEach(k=>{if(k.split('|').includes(f))delete S.war[k];});
 for(let i=0;i<NP;i++){const p=S.prov[i];if(p.ctl===f||(p.ctl&&!S.war[key(p.o,p.ctl)])){delete p.ctl;p.t=Math.min(p.t,garMin(i));}}
 Object.keys(S.ally).forEach(k=>{if(k.split('|').includes(f))delete S.ally[k];});
 S.offers=S.offers.filter(o=>o.f!==f);
 if(S.armies)armyList(f).forEach(a=>armyRemove(a.id,'eliminated'));
 news(lng(`${FAC[f].n} tarih sahnesinden silindi. Son topraklarını ${fname(by)} aldı.`,`The ${FAC[f].n} has passed from the stage of history. ${fname(by)} took its last lands.`),'cap');
 if(f===S.player){S.over='lose';}
 runHooks('eliminate',f,by);
}

