/* =====================================================================
   SIEGES, OCCUPATION, WAR EXHAUSTION AND PEACE TREATIES (Track B, Wave 2)
   - An army entering a hostile province with walls (fort >= 1) and no enemy army starts S.sieges[i]
     = {i,f,a,t0,prog,need,sally}. Progress is ticked in roundEnd slot 20. A fallen siege OCCUPIES the
     province (S.prov[i].ctl = f); the owner S.prov[i].o only changes at peace (makePeace), when the
     defender is fully occupied (capitulation) or when a capital stays occupied in a war of >= 20 turns.
   - Walls 0: the army storms at once (armAssault) and occupies on a win.
   - ctl(i) decides who may march through, who collects (half) the taxes and who pays the garrison.
   - War exhaustion S.war[k].ex[f] (0..100) grows every turn, with casualties and with occupied land.
   - Peace baskets {prov:[i], gold:n, release:[f]} are priced in war score (peaceValue); the AI accepts a
     basket worth no more than the war score plus its exhaustion allowance (aiAcceptBasket).
   - Lane rule: sea lanes are crossed only by seafaring realms (BAL_S.naval) or at the straits.
   ===================================================================== */
const BAL_S={
 perFort:1.5,skan:1,               // siege turns: 1 + fort*1.5, +1 for a mountain fortress or walls >= 3
 cannon:.4,cannonMtn:.7,           // with cannon the time is x0.4 (x0.7 up a mountain: the guns cannot be hauled up)
 sizeRef:2,sizeMin:.6,sizeMax:1.6, // x clamp(sqrt(2 / (besiegers / defence)), .6, 1.6): big armies dig faster
 rateMin:.5,rateMax:1.6,           // progress per turn = attacker / defender siege modifiers (winter, generals, chains)
 attr:.02,attrWinter:.04,          // besieger losses per turn (sickness, desertion)
 sallyRatio:.5,sallyP:.35,sallyShare:.6, // the garrison sallies when it is >= 50% of the besiegers (chance 35%), with 60% of its men
 scFall:2,scCap:3,scLib:1,scSally:1,     // war score: walls taken +2 (+3 more for a capital), liberation +1, won sally +1
 annexWar:20,                      // a capital that fell to a siege is annexed once its war is this old
 capWar:30,                        // a realm whose every province is occupied surrenders once the war is this old
 occInc:.5,                        // the occupier collects half of the province's taxes; the owner nothing
 exTurn:1,exLoss:5000,exOcc:.5,exMax:100, // exhaustion: +1 per turn, +1 per 5k dead, +0.5 per own province occupied (per turn)
 exDiv:10,weak:3,                  // the AI concedes (exhaustion / 10) war score more, +3 when far weaker
 offerLife:2,                      // envoys wait 2 turns
 prov:1,provDev:.4,provCap:3,provFree:2, // province price: 1 + dev*0.4 (+3 capital); not occupied by the demander: x2
 gold:25,release:.6,claim:.5,      // 25 gold = 1 point; releasing a nation costs 60% of its land; the war goal province half price
 goalWar:24,goalEx:40,              // an AI ahead in its war holds out for its war goal for 24 turns (or until exhaustion 40)
 truce:12,
 naval:['VEN','GEN','OSM','RHO','ARA','CYP'],
 straits:[['istanbul','izmit'],['gelibolu','biga']],
};
/** Controller of province i: the occupier, else the owner. */
const ctl=i=>S.prov[i].ctl||S.prov[i].o;
/** Siege of province i, or null. */
function siegeAt(i){return S&&S.sieges&&S.sieges[i]||null;}
/** Turns of siege work province i needs against faction f with n besiegers (default: the besieging army, else 10k). */
function siegeNeed(i,f,n){const p=S.prov[i],mtn=armMtn(i);
 if(n==null){const s=siegeAt(i);n=s&&s.f===f?siegeMen(s):10000;}
 let v=1+p.fort*BAL_S.perFort+(mtn||p.fort>=3?BAL_S.skan:0);
 if(f&&S.fac[f]&&S.fac[f].cannon)v*=mtn?BAL_S.cannonMtn:BAL_S.cannon;
 const r=Math.max(n,100)/Math.max(defBase(i),1);v*=clamp(Math.sqrt(BAL_S.sizeRef/r),BAL_S.sizeMin,BAL_S.sizeMax);
 return Math.max(1,Math.round(v*10)/10);}
/** Siege progress per turn for f at i (product of the 'siege' battle modifiers, clamped). */
function siegeRate(i,f,n){const mods=battleMods({kind:'siege',att:f,def:ctl(i),to:i,n});
 return +clamp(modMul(1,mods,'att')/modMul(1,mods,'def'),BAL_S.rateMin,BAL_S.rateMax).toFixed(2);}
/** Turns still needed (rounded up) for the siege s. */
function siegeLeft(s){return Math.max(1,Math.ceil((s.need-s.prog)/Math.max(.01,s.rate||siegeRate(s.i,s.f))-1e-9));}
/** Armies of the besieger standing in the siege camp of s (the lead army s.a and any that joined it). */
function siegeArmies(s){return S.armies.filter(a=>a.f===s.f&&a.loc===s.i&&a.st==='siege');}
/** Troops in the siege camp of s. */
function siegeMen(s){return siegeArmies(s).reduce((t,a)=>t+a.n,0);}
function siegeValid(s){let a=armyById(s.a);const c=ctl(s.i);if(!alive(s.f)||c===s.f||!atWar(s.f,c))return false;
 if(!a||a.f!==s.f||a.loc!==s.i||a.st!=='siege'){const L=siegeArmies(s).sort((x,y)=>y.n-x.n);if(!L.length)return false;s.a=L[0].id;a=L[0];} // the next army takes over the camp
 return true;}
/** End occupations that lost their war (peace or an ownership change made elsewhere, e.g. by events). -> changed */
function occClean(){let ch=false;for(let i=0;i<NP;i++){const p=S.prov[i],c=p.ctl;if(!c)continue;
  if(c===p.o||!alive(c)||!atWar(c,p.o)){delete p.ctl;p.t=Math.min(p.t,garMin(i));ch=true;}}
 if(ch)polDirty=true;return ch;}
/** Drop sieges whose armies left, died or whose war ended; armies outside a valid siege camp stop besieging. -> changed */
function siegeClean(){if(!S||!S.sieges)return false;let ch=occClean();const live=new Set();
 for(const k of Object.keys(S.sieges)){const s=S.sieges[k];if(!s||!siegeValid(s)){delete S.sieges[k];ch=true;}else live.add(s.f+'|'+s.i);}
 for(const a of S.armies||[])if(a.st==='siege'&&!live.has(a.f+'|'+a.loc)){a.st='idle';ch=true;}
 if(ch)polDirty=true;return ch;}
/** Army a (standing next to i, or in i) lays siege to province i, or joins its own side's siege camp there. */
function siegeBegin(a,i){const f=a.f;let s=siegeAt(i);
 if(s&&s.f===f&&siegeValid(s)){a.loc=i;a.st='siege';a.mp=0;s.need=siegeNeed(i,f,siegeMen(s));polDirty=true;return s;}
 a.loc=i;a.st='siege';a.mp=0;
 s=S.sieges[i]={i,f,a:a.id,t0:S.turn,prog:0,need:siegeNeed(i,f,a.n),sally:0};s.rate=siegeRate(i,f,a.n);
 polDirty=true;
 const p=S.prov[i],c=ctl(i);
 if(f===S.player||c===S.player||p.o===S.player){const m=f===S.player?lng(`${PD[i].name} kuşatması başladı: surlar yaklaşık ${siegeLeft(s)} turda düşer.`,`The siege of ${PD[i].name} has begun: the walls should fall in about ${siegeLeft(s)} ${siegeLeft(s)===1?'turn':'turns'}.`)
   :lng(`${FAC[f].s} ordusu ${PD[i].name} surlarını kuşattı!`,`The army of ${FAC[f].s} has laid siege to the walls of ${PD[i].name}!`);f===S.player?addLog(m,'war'):news(m,'war');}
 runHooks('siegeStart',s);return s;}
/** One turn of siege s: attrition, a possible sally, progress; completion occupies the province. */
function siegeStep(s){const i=s.i,p=S.prov[i],f=s.f,df=ctl(i);
 const w=S.war[key(f,df)];
 for(const b of siegeArmies(s)){const at=Math.min(b.n,Math.round(b.n*(S.turn%4===3?BAL_S.attrWinter:BAL_S.attr)/100)*100);b.n-=at;if(w)exAdd(w,f,at);if(b.n<100)armyRemove(b.id,'destroyed');}
 if(!siegeValid(s)){siegeClean();return;}
 let a=armyById(s.a),men=siegeMen(s);
 if(p.t>=500&&p.t>=men*BAL_S.sallyRatio&&R()<BAL_S.sallyP){siegeSally(s,a,df);if(!siegeAt(i)||!siegeValid(s)){siegeClean();return;}a=armyById(s.a);men=siegeMen(s);}
 s.need=siegeNeed(i,f,men);s.rate=siegeRate(i,f,men);s.prog=+Math.min(s.need,s.prog+s.rate).toFixed(2);
 TURN_TRACE.push({k:'siege',f,to:i,army:a.id,prog:s.prog,need:s.need});
 runHooks('siegeTick',s);
 if(s.prog>=s.need-1e-9)siegeFall(s);}
/** The garrison of i sallies against the besieging army a (BATTLE_MODS kind 'sally'). */
function siegeSally(s,a,df){const i=s.i,p=S.prov[i],n=Math.max(100,Math.round(p.t*BAL_S.sallyShare/100)*100);
 const ctx={kind:'sally',att:df,def:a.f,from:i,to:i,n},mods=battleMods(ctx),ra=rnd(.9,1.1),rd=rnd(.9,1.1);
 const aP=modMul(n,mods,'att')*ra,dP=modMul(a.n*a.morale,mods,'def')*rd,r=aP/Math.max(dP,1),win=r>1;
 const gLoss=Math.min(n,Math.round(n*(win?.1:clamp(.3/r,.15,.4))/100)*100),bLoss=Math.min(a.n,Math.round(a.n*(win?clamp(.12*r,.05,.2):.03)/100)*100);
 p.t-=gLoss;a.n-=bLoss;s.sally=(s.sally||0)+1;
 const w=S.war[key(a.f,df)];
 if(win){s.prog=Math.max(0,+(s.prog-1).toFixed(2));a.morale=Math.max(BAL_B.moraleMin,+(a.morale-BAL_B.moraleLose/2).toFixed(2));if(w)w.sc[df]=(w.sc[df]||0)+BAL_S.scSally;}
 const rep={from:i,to:i,att:df,def:a.f,n,defT:a.n+bLoss,turn:S.turn,win,aLoss:gLoss,dLoss:bLoss,kind:'sally',mods,roll:{a:Math.round(ra*1e3)/1e3,d:Math.round(rd*1e3)/1e3},army:a.id,destroyed:[]};
 if(a.n<100){rep.destroyed.push(a.id);armyRemove(a.id,'destroyed');}
 TURN_TRACE.push({k:'sally',f:df,from:i,to:i,path:[i],army:a.id,n,win,rep});
 armBattleEnd(rep);}
/** The besieging army `id` storms the walls now (armAssault; the breach so far weakens the walls). -> rep or null */
function siegeStorm(id){const a=armyById(id);if(!a||a.st!=='siege'||a.mp<=0)return null;const s=siegeAt(a.loc);if(!s||s.a!==a.id)return null;
 const i=a.loc,n0=a.n,rep=armAssault(a,i,i);if(rep){TURN_TRACE.push({k:'battle',f:a.f,from:i,to:i,path:[i],army:a.id,n:n0,win:!!rep.win,rep});if(!rep.win)a.mp=0;}
 siegeClean();return rep;}
/** Siege s is complete: the garrison flees or falls, the province is occupied (or liberated). */
function siegeFall(s){const i=s.i,a=armyById(s.a),f=s.f,L=siegeArmies(s);delete S.sieges[i];if(!a)return;for(const b of L)b.st='idle'; // the camp breaks up after the season's refresh: ready to march next turn
 const n0=a.n;armOccupy(a,i);
 TURN_TRACE.push({k:'siegeFell',f,to:i,army:a.id,n:n0});
 runHooks('siegeFell',i,f);}
/** Army a takes control of province i (after a siege, or a won storm of an unwalled town). The garrison flees to
 a neighbouring province of its side or is lost; part of the army stays as the new garrison. */
function armOccupy(a,i){const p=S.prov[i],f=a.f,df=ctl(i),own=p.o,lib=own===f,wasCap=!lib&&S.fac[own].cap===i;
 const w=S.war[key(f,df)];let flee=p.t,ret=null;
 if(flee>0){const js=PD[i].adj.filter(j=>ctl(j)===df&&garrisonMax(j)>S.prov[j].t);if(js.length){ret=js[Math.floor(R()*js.length)];const q=S.prov[ret];q.t+=Math.min(flee,garrisonMax(ret)-q.t);}}
 if(lib)delete p.ctl;else p.ctl=f;
 p.mv=0;a.loc=i;
 const g=Math.max(0,Math.min(Math.round(BAL_B.capGarDev*p.dev/100)*100,Math.floor(a.n*BAL_B.capGarShare/100)*100));p.t=g;a.n-=g;
 a.morale=Math.min(BAL_B.moraleMax,+(a.morale+BAL_B.moraleWin/2).toFixed(2));
 if(w){w.sc[f]=(w.sc[f]||0)+(lib?BAL_S.scLib:BAL_S.scFall+(wasCap?BAL_S.scCap:0));
  if(wasCap){if(!w.capOcc)w.capOcc=[];if(!w.capOcc.includes(i))w.capOcc.push(i);}
  if(!lib&&!w.looted)w.looted=[];if(!lib&&!w.looted.includes(i)){w.looted.push(i);S.fac[f].gold+=p.dev*BAL_B.loot;}}
 if(f===S.player&&!lib)S.stats.taken++;
 const d=PD[i];
 if(f===S.player||own===S.player||df===S.player){
  const m=lib?lng(`${d.name} kurtarıldı: ${fname(df)} işgali sona erdi.`,`${d.name} has been liberated: the occupation by ${fname(df)} is over.`)
   :wasCap?lng(`${fname(own)} başkenti ${d.name} surları düştü; şehir artık ${fname(f)} işgalinde.`,`The walls of ${d.name}, capital of ${fname(own)}, have fallen; the city is now occupied by ${fname(f)}.`)
   :lng(`${d.name} surları düştü; eyalet artık ${fname(f)} işgalinde. Kalıcı olması için barış masasında istenmeli.`,`The walls of ${d.name} have fallen; the province is now occupied by ${fname(f)}. To keep it, it must be demanded at the peace table.`);
  news(m,own===S.player&&!lib?'war':f===S.player?'good':'war');}
 else if(wasCap)addLog(lng(`${fname(own)} başkenti ${d.name}, ${fname(f)} işgaline girdi.`,`${d.name}, capital of ${fname(own)}, is occupied by ${fname(f)}.`),'war');
 if(a.n<100){if(a.n>0)p.t+=a.n;a.n=0;armyRemove(a.id,'garrisoned');}
 polDirty=true;siegeClean();
 if(!lib){warCapitulate(own);warAnnexCap(f,own);}
 return {retreat:ret,gar:g};}
/** A realm whose every province is occupied by its enemies capitulates: each occupier keeps what it holds. */
function warCapitulate(o){if(!alive(o))return false;const ps=facProvs(o);if(!ps.length)return false;
 if(!ps.every(i=>{const c=S.prov[i].ctl;return c&&c!==o&&alive(c)&&atWar(o,c)&&S.turn-S.war[key(o,c)].t>=BAL_S.capWar;}))return false;
 const m=lng(`${FAC[o].n} teslim oldu: bütün toprakları işgal altındaydı.`,`The ${FAC[o].n} has surrendered: all of its lands were occupied.`);
 o===S.player||ps.some(i=>S.prov[i].ctl===S.player)?news(m,'cap'):addLog(m,'cap');
 for(const i of ps){const c=S.prov[i].ctl;if(S.prov[i].o===o&&c&&alive(c))capture(i,c,{peace:true,annex:true});}
 return true;}
/** A capital of o that fell to f's siege (w.capOcc) and is still occupied is annexed once the war has lasted BAL_S.annexWar turns. */
function warAnnexCap(f,o){if(!alive(o)||!alive(f))return false;const w=S.war[key(f,o)];
 if(!w||!w.capOcc||S.turn-w.t<BAL_S.annexWar)return false;let done=false;
 const L=w.capOcc.filter(c=>S.prov[c].o===o);w.capOcc=w.capOcc.filter(c=>S.prov[c].o!==o&&S.prov[c].ctl);
 for(const c of L){if(S.prov[c].o===o&&S.prov[c].ctl===f&&alive(o)){capture(c,f,{peace:true,annex:true});done=true;}}
 return done;}

/* ---------------- war exhaustion ---------------- */
function exAdd(w,f,v){if(!w.ex)w.ex={};w.ex[f]=Math.min(BAL_S.exMax,+((w.ex[f]||0)+v/BAL_S.exLoss).toFixed(2));}
/** War exhaustion of f in its war with g (0..100). */
function warEx(f,g){const w=S.war[key(f,g)];return w&&w.ex?Math.round(w.ex[f]||0):0;}
hook('battleResolved',rep=>{if(!rep||!rep.att)return;const defs=rep.defFs&&rep.defFs.length?rep.defFs:[rep.def];
 for(const d of defs){const w=S.war[key(rep.att,d)];if(!w)continue;exAdd(w,rep.att,rep.aLoss||0);exAdd(w,d,(rep.dLoss||0)/defs.length);}});
/* roundEnd slot 30: exhaustion grows; occupied capitals of long wars are annexed; fully occupied realms surrender */
hook('roundEnd',()=>{const occ={};for(let i=0;i<NP;i++){const p=S.prov[i];if(p.ctl){const k=key(p.o,p.ctl);(occ[k]||(occ[k]={}))[p.o]=((occ[k]||{})[p.o]||0)+1;}}
 for(const k of Object.keys(S.war)){const w=S.war[k];if(!w)continue;if(!w.ex)w.ex={};const [a,b]=k.split('|');
  for(const f of [a,b])w.ex[f]=Math.min(BAL_S.exMax,+((w.ex[f]||0)+BAL_S.exTurn+((occ[k]&&occ[k][f])||0)*BAL_S.exOcc).toFixed(2));}
 for(const k of Object.keys(S.war)){const [a,b]=k.split('|');if(S.war[k]){warAnnexCap(a,b);if(S.war[k])warAnnexCap(b,a);}}
 for(const f of FK)if(alive(f))warCapitulate(f);
 siegeClean();},30);
/* roundEnd slot 20: sieges */
hook('roundEnd',()=>{siegeClean();for(const k of Object.keys(S.sieges)){const s=S.sieges[k];if(s&&siegeValid(s))siegeStep(s);}siegeClean();},20);

/* ---------------- peace: baskets priced in war score ---------------- */
/** War-score price of province i when faction a demands it (occupied by a: base price; otherwise double; the war goal half). */
function peaceProvCost(i,a){const p=S.prov[i];let v=BAL_S.prov+p.dev*BAL_S.provDev+(S.fac[p.o]&&S.fac[p.o].cap===i?BAL_S.provCap:0);
 if(p.ctl!==a)v*=BAL_S.provFree;const w=S.war[key(a,p.o)];if(w&&w.goal&&w.goal.k==='claim'&&w.goal.f===a&&w.goal.prov===i)v*=BAL_S.claim;
 return Math.round(v*10)/10;}
/** Provinces of `from` that would go to the released nation r (its historical lands). */
function peaceRelProvs(r,from){const out=[];for(let i=0;i<NP;i++)if(PD[i].o===r&&S.prov[i].o===from)out.push(i);return out;}
/** Nations a may release from b's land: historical owners of some of b's provinces (not a, b or the player). */
function peaceRelCands(a,b){const out=[];for(const r of FK){if(r===a||r===b||r===S.player||r==='SAF')continue;if(alive(r)&&(atWar(r,b)||isAlly(r,b)))continue;
 const ps=peaceRelProvs(r,b);if(ps.length&&ps.length<facProvs(b).length)out.push(r);}return out;}
/** Normalised basket {prov:[...],gold,release:[...]}. */
function peaceNorm(bk){bk=bk||{};return {prov:(bk.prov||[]).slice(),gold:Math.round(bk.gold||0),release:(bk.release||[]).slice()};}
/** Value of basket bk for a (demanded from b), in war score. Provinces of a in the basket (a cedes them) count negative,
 so does negative gold (a pays). */
function peaceValue(bk,a,b){bk=peaceNorm(bk);let v=0;
 for(const i of bk.prov){const o=S.prov[i].o;if(o===b)v+=peaceProvCost(i,a);else if(o===a)v-=peaceProvCost(i,b);}
 v+=bk.gold/BAL_S.gold;
 for(const r of bk.release)v+=peaceRelProvs(r,b).reduce((s,i)=>s+peaceProvCost(i,a),0)*BAL_S.release;
 return Math.round(v*10)/10;}
/** The most war score `ai` will concede to `other`: war score of other + ai's exhaustion allowance (+ weakness). */
function peaceLimit(ai,other){let v=warScore(other,ai)+warEx(ai,other)/BAL_S.exDiv;if(strength(ai)<strength(other)*.5)v+=BAL_S.weak;return Math.round(v*10)/10;}
/** Does `ai` accept the basket `other` demands from it? An AI that is ahead and still fresh does not sign away
 its war goal: while its claimed province is not in the basket it refuses (until the war is BAL_S.goalWar old). */
function aiAcceptBasket(ai,other,bk){if(!atWar(ai,other))return false;bk=peaceNorm(bk);
 if(bk.gold>0&&bk.gold>Math.floor(S.fac[ai].gold))return false;if(bk.gold<0&&-bk.gold>Math.floor(S.fac[other].gold))return false;
 const w=S.war[key(ai,other)],g=w&&w.goal;
 if(g&&g.k==='claim'&&g.f===ai&&S.prov[g.prov]&&S.prov[g.prov].o===other&&!bk.prov.includes(g.prov)&&warScore(ai,other)>0&&warEx(ai,other)<BAL_S.goalEx&&S.turn-w.t<BAL_S.goalWar)return false;
 return peaceValue(bk,other,ai)<=peaceLimit(ai,other)+1e-9;}
/** The treaty `win` can get from `lose`: occupied provinces (most valuable first) within the limit, then gold. */
function aiPeaceBasket(win,lose){const bk={prov:[],gold:0,release:[]};if(!atWar(win,lose))return bk;let lim=peaceLimit(lose,win);if(lim<=0)return bk;
 const ps=facProvs(lose).filter(i=>S.prov[i].ctl===win).map(i=>[i,peaceProvCost(i,win)]).sort((x,y)=>S.prov[y[0]].dev-S.prov[x[0]].dev||x[1]-y[1]);
 for(const [i,c] of ps)if(c<=lim+1e-9){bk.prov.push(i);lim-=c;}
 const g=Math.floor(Math.min(S.fac[lose].gold*.5,lim*BAL_S.gold)/5)*5;if(g>=10)bk.gold=g;
 return bk;}
/** The player (pl) proposes basket bk to ai. Accepted -> treaty signed. -> boolean */
function offerBasket(pl,ai,bk){if(!atWar(pl,ai))return false;bk=peaceNorm(bk);
 if(aiAcceptBasket(ai,pl,bk)){makePeace(pl,ai,bk);return true;}addOp(pl,ai,-5);return false;}
/** Carry out basket bk: taker receives from giver (provinces of taker in bk go the other way). -> what changed hands */
function peaceApply(taker,giver,bk){bk=peaceNorm(bk);const done={prov:[],gold:0,release:[]};
 for(const i of bk.prov){const o=S.prov[i].o;if(o===giver&&alive(taker)){capture(i,taker,{peace:true});done.prov.push(i);}else if(o===taker&&alive(giver)){capture(i,giver,{peace:true});done.prov.push(i);}}
 if(bk.gold>0&&alive(giver)){const g=Math.min(bk.gold,Math.floor(S.fac[giver].gold));S.fac[giver].gold-=g;S.fac[taker].gold+=g;done.gold=g;}
 else if(bk.gold<0&&alive(taker)){const g=Math.min(-bk.gold,Math.floor(S.fac[taker].gold));S.fac[taker].gold-=g;S.fac[giver].gold+=g;done.gold=-g;}
 for(const r of bk.release){if(!alive(giver))break;const ps=peaceRelProvs(r,giver);if(!ps.length||ps.length>=facProvs(giver).length)continue;peaceRelease(r,giver,ps);done.release.push(r);}
 return done;}
/** Nation r regains provinces ps from `from` (revived if it had fallen). */
function peaceRelease(r,from,ps){const F=S.fac[r],was=F.alive;
 if(!was){F.alive=true;F.gold=40;F.mp=0;F.cannon=S.fac[from].cannon||0;F.nextOffer=0;F.cap=-1;}
 for(const i of ps){const p=S.prov[i];p.o=r;delete p.ctl;p.un=4;p.mv=0;p.t=Math.max(p.t,garMin(i));}
 const cap=PK[FAC[r].cap];F.cap=cap!=null&&S.prov[cap].o===r?cap:(was&&F.cap>=0&&S.prov[F.cap].o===r?F.cap:ps.slice().sort((x,y)=>S.prov[y].dev-S.prov[x].dev)[0]);
 if(!was)F.mp=Math.round(devSum(r)*200);
 if(S.fac[from].cap>=0&&S.prov[S.fac[from].cap].o!==from){const rest=facProvs(from).sort((x,y)=>S.prov[y].dev-S.prov[x].dev);if(rest.length)S.fac[from].cap=rest[0];}
 S.truce[key(r,from)]=S.turn+BAL_S.truce;
 const m=lng(`${FAC[r].n} yeniden bağımsız: ${fname(from)} ${ps.length} eyaleti bıraktı.`,`The ${FAC[r].n} is free again: ${fname(from)} gave up ${ps.length} ${ps.length===1?'province':'provinces'}.`);
 r===S.player||from===S.player?news(m,'cap'):addLog(m,'cap');
 polDirty=true;runHooks('released',r,from,ps);}
/** Words for a basket, e.g. "Varna, Silistre · 40 altın". */
function peaceWords(bk,taker){bk=peaceNorm(bk);const parts=[];
 if(bk.prov.length)parts.push(bk.prov.map(i=>PD[i].name).join(', '));
 if(bk.gold)parts.push(lng(`${Math.abs(bk.gold)} altın`,`${Math.abs(bk.gold)} gold`));
 if(bk.release.length)parts.push(lng('serbest: ','released: ')+bk.release.map(r=>FAC[r].s).join(', '));
 return parts.join(' · ');}

/* ---------------- occupation and lanes in the army rules ---------------- */
let armLaneSet=null;
/** u-v is a sea lane (not a land border). */
function armLane(u,v){if(!armLaneSet){armLaneSet=new Set();PD.forEach(d=>d.lanes.forEach(j=>{armLaneSet.add(d.i*1024+j);armLaneSet.add(j*1024+d.i);}));}return armLaneSet.has(u*1024+v);}
/** May an army of f cross from u to v? Land: always. Sea lanes: seafaring realms, or anyone at the straits. */
function armLaneOk(f,u,v){if(!armLane(u,v))return true;if(BAL_S.naval.includes(f))return true;const a=PD[u].key,b=PD[v].key;
 return BAL_S.straits.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));}

/* ---------------- economy rows: occupation ---------------- */
ECON_ROWS.push(f=>{let s=0,n=0;for(let i=0;i<NP;i++){const p=S.prov[i];if(p.ctl===f&&p.o!==f){s+=provIncome(i)*BAL_S.occInc;n++;}}
 return n?[{id:'occ',l:lng(`İşgal gelirleri (${n})`,`Occupied lands (${n})`),v:s,k:'inc',tip:lng('İşgal ettiğin eyaletlerin vergisinin yarısı sana gelir. Barışta istemezsen eyaletler sahibine döner.','You collect half the taxes of the provinces you occupy. Unless you demand them at the peace table, they return to their owner.')}]:null;});

/* ---------------- migration and bookkeeping ---------------- */
/* W1-era saves (and v1): no occupations or sieges yet, offers without a date. Idempotent. */
hook('migrate',s=>{const keep=S;S=s;try{
 if(!s.sieges||typeof s.sieges!=='object')s.sieges={};
 for(const k of Object.keys(s.sieges)){const v=s.sieges[k],a=v&&(s.armies||[]).find(x=>x.id===v.a);if(!v||!a||a.loc!==+k){delete s.sieges[k];}}
 for(const a of s.armies||[])if(a.st==='siege'&&!Object.values(s.sieges).some(v=>v.a===a.id||(v.f===a.f&&v.i===a.loc)))a.st='idle'; // helpers in the camp keep besieging
 for(const p of s.prov)if('ctl' in p&&(!p.ctl||p.ctl===p.o||!s.war[key(p.o,p.ctl)]))delete p.ctl;
 for(const o of s.offers||[])if(o.t0==null)o.t0=s.turn;
 if(s.b&&s.b.pc&&typeof s.b.pc!=='object')delete s.b.pc;
}finally{S=keep;}},60);
/* stamp new envoys (made during the AI turns) and send away old ones after the turn (bug B2: shown once, 2 turns) */
hook('roundEnd',()=>{for(const o of S.offers||[])if(o.t0==null)o.t0=S.turn;},5);
hook('newTurn',()=>pruneOffers(),5);
hook('peace',(a,b,t)=>{S.b=S.b||{};const pc=S.b.pc||(S.b.pc={n:0,ces:0});pc.n++;if(t&&t.prov&&t.prov.length)pc.ces++;});

/* Placeholder siege / occupation markers (Track A's siege layer may replace DRAW_LAYERS.sieges). */
if(!DRAW_LAYERS.sieges)DRAW_LAYERS.sieges=(c,now,s,g3)=>{if(!S||!S.prov)return false;let any=false;
 c.save();
 for(let i=0;i<NP;i++){const p=S.prov[i],sg=S.sieges&&S.sieges[i];if(!p.ctl&&!sg)continue;const d=PD[i],q=pj(d.lx,d.ly,3);if(!q[2])continue;any=true;
  if(p.ctl){c.beginPath();c.rect(q[0]+8,q[1]+4,9,9);c.fillStyle=FAC[p.ctl].c;c.fill();c.lineWidth=1.2;c.strokeStyle='#1c160e';c.stroke();
   c.beginPath();c.moveTo(q[0]+8,q[1]+13);c.lineTo(q[0]+17,q[1]+4);c.strokeStyle=FAC[p.o].c;c.lineWidth=2;c.stroke();}
  if(sg){const fr=clamp(sg.prog/Math.max(sg.need,.1),0,1);c.beginPath();c.arc(q[0],q[1],15,0,7);c.lineWidth=3;c.strokeStyle='rgba(20,14,8,.55)';c.stroke();
   c.beginPath();c.arc(q[0],q[1],15,-Math.PI/2,-Math.PI/2+fr*Math.PI*2);c.strokeStyle=FAC[sg.f].c;c.lineWidth=3;c.stroke();}}
 c.restore();return false;};

KE.siegeAt=i=>siegeAt(i);KE.siegeNeed=(i,f,n)=>siegeNeed(i,f,n);KE.ctl=i=>ctl(i);KE.peaceValue=(b,a,c)=>peaceValue(b,a,c);KE.aiAcceptBasket=(a,o,b)=>aiAcceptBasket(a,o,b);
KE.offerBasket=(p,a,b)=>offerBasket(p,a,b);KE.makePeace=(a,b,t)=>makePeace(a,b,t);KE.aiPeaceBasket=(w,l)=>aiPeaceBasket(w,l);KE.peaceLimit=(a,o)=>peaceLimit(a,o);
KE.siegeBegin=(id,i)=>{const a=armyById(id);return a?siegeBegin(a,i):null;};KE.armLaneOk=(f,u,v)=>armLaneOk(f,u,v);KE.warEx=(f,g)=>warEx(f,g);KE.showPeace=f=>showPeace(f);
