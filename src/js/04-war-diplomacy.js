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
function tributeAmt(ai){const g=Math.max(0,Math.floor(S.fac[ai].gold));return Math.min(g,Math.max(20,Math.round(Math.min(g*.7,30+devSum(ai)*2))));}
function aiAcceptAlliance(ai,pl){if(atWar(ai,pl)||inTruce(ai,pl)&&getOp(ai,pl)<20)return false;const o=getOp(ai,pl);
 const common=warsOf(ai).some(e=>atWar(pl,e));return o>=40||(o>=10&&common);}

/* ---------------- battles ---------------- */
/* Combat modifiers come from the BATTLE_MODS registry: ctx={kind:'assault'|'field'|'sally',att,def,from,to,n}
   -> [{l:label,m:multiplier,side:'att'|'def',k:key}]. ctx.to / ctx.n may be missing (e.g. atkMul(f)). */
function battleMods(ctx){const out=[];for(const fn of BATTLE_MODS){const r=fn(ctx);if(r)for(const m of r)out.push(m);}return out;}
function modMul(v,mods,side){for(const m of mods)if(m.side===side)v*=m.m;return v;}
BATTLE_MODS.push(ctx=>S.turn%4===3?[{l:'Kış seferi',m:.85,side:'att',k:'winter'}]:null);
BATTLE_MODS.push(ctx=>{if(ctx.to==null)return null;const p=S.prov[ctx.to],d=PD[ctx.to],r=[];
 if(p.fort>0)r.push({l:`Kale ${p.fort}`,m:1+.15*p.fort*(ctx.att&&S.fac[ctx.att].cannon?.4:1),side:'def',k:'fort'});
 if(d.mtn)r.push({l:'Dağlık arazi',m:1.3,side:'def',k:'mtn'});
 if(d.des)r.push({l:'Çöl',m:1.1,side:'def',k:'des'});
 return r;});
/** Garrison plus local militia defending province i, before modifiers. */
function defBase(i){const p=S.prov[i];return p.t+p.dev*150+p.fort*700;}
function atkMul(f,ctx){return modMul(1,battleMods(ctx||{kind:'assault',att:f}),'att');}
function atkPower(n,f,ctx){return modMul(n,battleMods(ctx||{kind:'assault',att:f,n}),'att');}
function defPower(i,att){return modMul(defBase(i),battleMods({kind:'assault',att,def:S.prov[i].o,to:i}),'def');}
/** Deterministic estimate for an attack: ctx={att,to,n,from?,kind?} -> {p (win chance 0..1), a, d, r, mods}.
 p is a logistic in log(a/d) matching the two independent rnd(.85,1.2) rolls of battle(). */
function battleOdds(ctx){const c={kind:'assault',def:S.prov[ctx.to].o,...ctx},mods=battleMods(c);
 const a=modMul(c.n,mods,'att'),d=modMul(defBase(c.to),mods,'def'),r=a/Math.max(d,1);
 return {p:1/(1+Math.exp(-Math.log(Math.max(r,1e-6))/.085)),a,d,r,mods};}
function battle(from,to,n){
 const A=S.prov[from],D=S.prov[to],att=A.o,def=D.o;if(att===def||!atWar(att,def)||!PD[from].adj.includes(to))return null;n=Math.min(n,avail(from));if(n<=0)return null;
 A.t-=n;
 const ctx={kind:'assault',att,def,from,to,n},mods=battleMods(ctx),ra=rnd(.85,1.2),rd=rnd(.85,1.2);
 const aP=modMul(n,mods,'att')*ra,dP=modMul(defBase(to),mods,'def')*rd,r=aP/dP,defT=D.t;
 const rep={from,to,att,def,n,defT,turn:S.turn,win:false,aLoss:0,dLoss:0,kind:'assault',mods,roll:{a:Math.round(ra*1e3)/1e3,d:Math.round(rd*1e3)/1e3}};
 const w=S.war[key(att,def)];
 if(r>1){
  const aLoss=Math.round(n*clamp(.3/r,.04,.3)/100)*100;const dLoss=Math.round(defT*.65/100)*100;const flee=defT-dLoss;
  if(flee>0){const ret=PD[to].adj.filter(j=>S.prov[j].o===def);if(ret.length){const j=ret[Math.floor(R()*ret.length)];S.prov[j].t+=flee;S.prov[j].mv+=flee;rep.retreat=j;}}
  const wasCap=S.fac[def].cap===to;
  D.t=0;D.mv=0;capture(to,att);D.t=n-aLoss;D.mv=D.t;
  rep.win=true;rep.aLoss=aLoss;rep.dLoss=defT;if(w){w.sc[att]=(w.sc[att]||0)+2+(wasCap?3:0);}
 }else{
  const aLoss=Math.round(n*clamp(.55-.25*r,.25,.55)/100)*100,dLoss=Math.min(defT,Math.round(defT*clamp(.3*r,.03,.3)/100)*100);
  D.t-=dLoss;const back=n-aLoss;A.t+=back;A.mv+=back;
  if(D.fort>0&&r>.8&&R()<.3){D.fort--;rep.fortDmg=true;}
  rep.aLoss=aLoss;rep.dLoss=dLoss;if(w)w.sc[def]=(w.sc[def]||0)+1;
 }
 S.battles.push(rep);if(S.battles.length>60)S.battles.shift();
 TURN_TRACE.push({k:'battle',f:att,from,to,path:[from,to],army:null,n,win:rep.win,rep});
 const mine=att===S.player||def===S.player;
 if(mine){S.report=S.report||[];S.report.push(rep);
  if(att===S.player){rep.win?S.stats.won++:S.stats.lost++;}else{rep.win?S.stats.lost++:S.stats.won++;}}
 polDirty=true;
 runHooks('battleResolved',rep);if(mine)runHooks('playerBattle',rep);
 return rep;
}
function capture(i,f){
 const p=S.prov[i],old=p.o;p.o=f;p.un=8;p.mv=0;if(p.fort>1)p.fort--;
 S.fac[f].gold+=p.dev*4;if(f===S.player)S.stats.taken++;
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

