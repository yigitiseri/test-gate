/* =====================================================================
   AI STRATEGY (Track D): diplomacy, target selection, defence needs, nudges
   War is no longer gated by a static "opinion <= 5" filter. Every AI keeps a war desire per
   neighbour (S.ai[f].desire[g]) that grows with opportunity (strength ratio, bad relations,
   rivalry, claims from missions, nudges from history chains, a quiet world) and decays slowly.
   It declares when the desire passes a threshold AND the target is reachable: some province of
   g borders f by land or sea lane and an attack there would have a real chance (battleOdds).
   ===================================================================== */
const BAL_D={
  decay:.93,           // desire kept per turn
 thresh:100,          // desire needed to declare
 declP:.55,           // chance per turn to act once above the threshold
 gainBase:7,          // per turn at strength ratio 1.7 (scaled by ratio and personality)
 gainOp:.1,           // per point of negative opinion
 gainRival:9, gainClaim:5, gainCrusade:6,
 gainNudge:40,        // per turn per unit of nudge prio
 calmTarget:6, calmW:1, // fewer wars than calmTarget in the world -> desire grows faster
 minWar:6,            // a one-sided wish for peace is heard only after this many turns of war
 firstPeace:4,        // no peace at all in the first 4 turns of a war (sieges need time); envoys to the player too
 allyW:.8, warLoad:.5, // declaring: the target's allies count 80%, each enemy we already fight ties down half its strength of ours
 soreTurns:12, seaMul:.5, // after ceding land no new war for 12 turns; realms reached only by sea tempt half as much
 warLen:20, warLenP:.12, warLongP:.35, // AI-AI wars older than warLen turns end with this chance per turn (twice as old: warLongP)
 mercyProvs:4, mercyP:.1,            // an AI lets a foe with this few provinces off (peace) with this chance
 satisfied:8, satisfiedP:.25,       // an AI ahead by this war score takes its gains and makes peace with this chance
 bigProvs:45,                          // above this many provinces war desire shrinks (overextension)
 lastProvs:1, annexWar:2,             // a foe down to this many provinces is only finished off in a war this old
 smallProvs:3, smallMul:.9, bullyRatio:4, bullyMul:.7, // prey far weaker than us tempts less (keeps the map varied)          // desire against tiny realms grows slower (keeps the map varied)
 minRatio:1.15, minRatioPl:1.45, minRatioNudge:.9, rivalRatio:.4, // a burning desire lowers the ratio needed by up to rivalRatio
 reachP:.3,           // an attack from some border province must have at least this win chance
 reachPNudge:.05,     // history nudges only need a border and a sliver of a chance
 mobilize:.2,         // share of the whole army an AI can bring to one border in time
 desireMax:300,
 maxWars:1, maxWarsBig:2, bigStr:70000,
 graceTurns:3, gracePlayer:6,
 rivalEvery:40, allyP:.03,
 /* Wave 2: campaign goals, aggressive expansion (AE), coalitions, crusades, treaties */
 goalEvery:8, goalTgt:3, siegeTgt:4, capThreat:2, // goal re-thought every 8 turns; target weights for the goal / our sieges; capital defence weight
 goalDist:1.2, goalSiege:.8, goalLib:2, // goal cost per step of marching / per turn of siege (in "province values"); freeing our own land x2
 aeProv:2, aeDev:.4, aeCap:6,         // AE for taking a province: 2 + 0.4 per development (+6 for a capital)
 aeSameRel:1.5, aePeace:.8,           // x1.5 when the victim shares the conqueror's faith; cessions at the peace table count 80%
 aeDecay:.975, aeFloor:.25,           // AE fades 2.5% plus 0.25 points every turn
 aeOp:3,                              // neighbours of the taken province think this much less of the conqueror
 coalAE:60, coalEnd:25, coalOp:10,    // a coalition forms above 60 AE among neighbours with opinion < 10; disbands below 25
 coalPow:.55, coalMin:2,              // members' strength must reach 55% of the target's; at least 2 members
 coalLock:8, coalMaxT:40, coalCd:24,  // members make no separate peace for 8 turns; a coalition lasts <= 40 turns; 24-turn cooldown
 crusEvery:24, crusAE:30, crusCd:60, crusLen:20, // the Papacy may call a crusade every 24 turns against a Muslim realm with AE >= 30
 peaceOcc:6, peaceOccP:.3, siegeEx:50,           // an AI holding enemy land settles after 6 turns with this chance per turn; no peace while besieging below 50 exhaustion
};
/* Before Track B's sieges (walls taken by assault, land changes hands at once) conquest runs much faster:
   the Wave-1 brakes on finishing off small realms stay on. Resolved once at load (04d loads before this file). */
const AI_SIEGES=typeof siegeAt==='function';
if(!AI_SIEGES)Object.assign(BAL_D,{mercyP:.45,smallMul:.6,lastProvs:2,annexWar:6});
/** Personalities: agg scales war desire, merc makes peace easier, crus = crusade caller/answerer. */
const AI_PERS={OSM:{agg:1.6},AKK:{agg:1.3},KKY:{agg:1.1},SAF:{agg:1.5},MAM:{agg:.8},KRM:{agg:1.2},GH:{agg:1.1},KAR:{agg:1.1},
 HUN:{agg:.9,crus:1},POL:{agg:1,crus:.5},HAB:{agg:.9,crus:.5},PAP:{agg:.4,crus:1.5},VEN:{agg:.6,merc:1},GEN:{agg:.6,merc:1},
 ARA:{agg:.6,crus:.5},RHO:{agg:.5,crus:1},BYZ:{agg:.6},TRB:{agg:.6},CYP:{agg:.5,merc:.5}};
const aiPers=f=>AI_PERS[f]||{};
const aiState=f=>S.ai[f]||(S.ai[f]=newAi());
/** Local attacking force f could bring against province j (field armies within 3 steps, else
 the bordering garrison plus half of the garrisons next to it). */
function aiLocalForce(f,j){let arm=0;if(S.armies&&S.armies.length){const near=new Set([j]);let fr=[j];
  for(let k=0;k<3;k++){const nx=[];for(const a of fr)for(const b of PD[a].adj)if(!near.has(b)){near.add(b);nx.push(b);}fr=nx;}
  for(const a of S.armies)if(a.f===f&&near.has(a.loc))arm+=a.n;}
 let gar=0;for(const i of PD[j].adj){const p=S.prov[i];if(p.o!==f)continue;let s=p.t;for(const k of PD[i].adj)if(k!==j&&S.prov[k].o===f)s+=S.prov[k].t*.5;if(s>gar)gar=s;}
 return Math.max(arm,gar);}
/** Can f realistically attack g? {ok, j (best province), p}. Needs a land or lane border and a win
 chance >= minP there with the local force (or the share of the whole army it can mobilize). */
function aiReach(f,g,minP=BAL_D.reachP){let best=null;const mob=strength(f)*BAL_D.mobilize;
 for(let j=0;j<NP;j++){if(S.prov[j].o!==g)continue;let adj=false;for(const i of PD[j].adj)if(S.prov[i].o===f){adj=true;break;}if(!adj)continue;
  const n=Math.max(aiLocalForce(f,j),mob);if(n<500)continue;const p=battleOdds({att:f,to:j,n}).p;if(!best||p>best.p)best={j,p};}
 return best?{ok:best.p>=minP,j:best.j,p:best.p}:{ok:false,j:-1,p:0};}
/** Mission claims of f on g's land (count of MIS[f] target provinces held by g). */
function aiClaims(f,g){const ms=typeof MIS==='object'&&MIS[f];if(!ms)return 0;let n=0;
 for(const m of ms)for(const k of (m.own||[])){const i=PK[k];if(i!=null&&S.prov[i]&&S.prov[i].o===g)n++;}return n;}
/** Active nudges of f (expired ones are dropped). */
function aiNudges(f){const A=aiState(f);if(A.nudges.length)A.nudges=A.nudges.filter(n=>n.until==null||n.until>=S.turn);return A.nudges;}
const aiWarCount=()=>Object.keys(S.war).length;
/** Do f and g share a land border (not only a sea lane)? */
function aiLandBorder(f,g){for(let i=0;i<NP;i++){if(S.prov[i].o!==f)continue;for(const j of PD[i].adj)if(S.prov[j].o===g&&!PD[i].lanes.includes(j)&&!PD[j].lanes.includes(i))return true;}return false;}
/** Occupier of province i (Track B's ctl once sieges exist, else the owner). */
const aiCtl=i=>typeof ctl==='function'?ctl(i):(S.prov[i].ctl||S.prov[i].o);
KE.aiWhy={cap:0,rng:0,ratio:0,reach:0,decl:0}; // why candidates above the threshold did not declare (tuning aid)
KE.aiDecl=[]; // test log of AI declarations: {t,f,g,p,j}

function aiDiplo(f){
 const my=strength(f),A=aiState(f),P=aiPers(f);
 warsOf(f).forEach(g=>{if(!atWar(f,g))return; // an earlier settlement this turn may have ended it (vassals follow their overlord's peace, 04g)
  const dur0=S.turn-S.war[key(f,g)].t;if(dur0<BAL_D.firstPeace)return;
  if(g===S.player){if(S.fac[f].nextOffer<=S.turn&&warScore(f,g)<=0&&aiWantsPeace(f,g)&&R()<.5&&!S.offers.some(o=>o.f===f)){S.offers.push({f,type:'peace',wt:S.war[key(f,g)].t});S.fac[f].nextOffer=S.turn+4;}}
  else if(aiCoalLock(f,g)||aiBesieging(f,g)||aiBesieging(g,f))return;
  else if(aiWantsPeace(f,g)&&aiWantsPeace(g,f)||(S.turn-S.war[key(f,g)].t>=BAL_D.minWar&&aiWantsPeace(f,g)&&R()<.25+.15*(P.merc||0)))aiSettle(f,g);
  else if(aiPeaceSides(f,g)[0]!==f&&aiOccupied(g,f).length)return; // nobody volunteers to cede land it still hopes to free
  else{const dur=S.turn-S.war[key(f,g)].t,ng=facProvs(g).length;
   if(dur>=BAL_D.warLen&&R()<(dur>=2*BAL_D.warLen?BAL_D.warLongP:BAL_D.warLenP)*(1+(P.merc||0)))aiSettle(f,g);
   else if(warScore(f,g)>=BAL_D.satisfied&&R()<BAL_D.satisfiedP)aiSettle(f,g);
   else if(dur>=BAL_D.peaceOcc&&aiOccupied(f,g).length&&!aiSiegesOf(f,g).length&&R()<BAL_D.peaceOccP)aiSettle(f,g);
   else if(dur>=3&&ng<=BAL_D.mercyProvs&&warScore(f,g)>0&&R()<BAL_D.mercyP)aiSettle(f,g);}
 });
 // desire bookkeeping
 const nb=new Set(nbrs(f)),D=A.desire,nud=aiNudges(f),wars=aiWarCount();
 const over=clamp(BAL_D.bigProvs/Math.max(1,facProvs(f).length),.5,1);
 const calm=1+BAL_D.calmW*Math.max(0,BAL_D.calmTarget-wars);
 for(const g in D)if(!nb.has(g)||!alive(g)||atWar(f,g)||isAlly(f,g)){D[g]*=BAL_D.decay*.8;if(D[g]<1)delete D[g];}
 for(const g of nb){if(isAlly(f,g)||inTruce(f,g)||atWar(f,g))continue;
  let th=strength(g);alliesOf(g).forEach(a=>{if(a!==f)th+=strength(a)*.5;});const ratio=my/Math.max(th,1);
  const nw=nud.filter(n=>n.war===g).reduce((s,n)=>s+(n.prio||1),0);
  let gain=BAL_D.gainBase*(P.agg||1)*clamp((ratio-.8)/.9,-.5,1.5)*(ratio>BAL_D.bullyRatio?BAL_D.bullyMul:1)-getOp(f,g)*BAL_D.gainOp;
  if(A.riv===g)gain+=BAL_D.gainRival;
  gain+=Math.min(3,aiClaims(f,g))*BAL_D.gainClaim;
  if(P.crus&&FAC[g].rel==='İslam'&&FAC[f].rel!=='İslam'&&warsOf(g).some(h=>FAC[h].rel!=='İslam'))gain+=BAL_D.gainCrusade*P.crus;
  if(facProvs(g).length<=BAL_D.smallProvs)gain*=BAL_D.smallMul;
  if(gain>0&&!aiLandBorder(f,g))gain*=BAL_D.seaMul;
  if(gain>0)gain*=over;
  gain*=calm;
  if(g===S.player){if(S.turn<BAL_D.gracePlayer*difV('grace'))gain=Math.min(gain,0);else if(gain>0)gain*=difV('agg');}   // difficulty (03h)
  if(gain>0&&typeof marLink==='function'&&marLink(f,g))gain*=BAL_MR.agg;   // joined by marriage (12h)
  gain+=nw*BAL_D.gainNudge;
  D[g]=clamp((D[g]||0)*BAL_D.decay+gain,0,BAL_D.desireMax);if(D[g]<1)delete D[g];}
 if(S.turn<BAL_D.graceTurns){aiOps(f);return;}
 if(typeof vasOf==='function'&&vasOf(f)){aiOps(f);return;} // a vassal (04g) declares no wars and makes no alliances of its own
 // declare war on the most desired reachable neighbour
 const nw0=warsOf(f).length,cap=my>BAL_D.bigStr?BAL_D.maxWarsBig:BAL_D.maxWars;
 const cands=Object.keys(D).filter(g=>D[g]>=BAL_D.thresh).sort((a,b)=>D[b]-D[a]);
 const occ=cands.length&&(facProvs(f).some(i=>aiCtl(i)!==f)||(A.sore||0)>S.turn); // enemies stand in our land, or we just ceded some: no new adventures
 const busy=warsOf(f).reduce((s,e)=>s+strength(e)*BAL_D.warLoad,0);
 for(const g of cands){const nudged=nud.some(n=>n.war===g);if(nw0>=cap+(nudged?1:0)){KE.aiWhy.cap++;continue;}if(occ&&!nudged){KE.aiWhy.occ=(KE.aiWhy.occ||0)+1;break;}if(R()>BAL_D.declP){KE.aiWhy.rng++;break;}
  let th=strength(g);alliesOf(g).forEach(a=>{if(a!==f)th+=strength(a)*BAL_D.allyW;});const ratio=Math.max(my-busy,0)/Math.max(th,1);
  if(ratio<(nudged?BAL_D.minRatioNudge:g===S.player?BAL_D.minRatioPl+difV('ratio'):BAL_D.minRatio-BAL_D.rivalRatio*clamp((D[g]-BAL_D.thresh)/(BAL_D.desireMax-BAL_D.thresh),0,1))){KE.aiWhy.ratio++;continue;}
  const r=aiReach(f,g,nudged?BAL_D.reachPNudge:BAL_D.reachP);if(!r.ok){KE.aiWhy.reach++;continue;}KE.aiWhy.decl++;
  KE.aiDecl.push({t:S.turn,f,g,p:+r.p.toFixed(2),j:r.j,nudged});if(KE.aiDecl.length>200)KE.aiDecl.shift();
  declareWar(f,g);D[g]=0;break;}
 if(R()<BAL_D.allyP){const c=nbrs(f).concat(FK).find(g=>g!==f&&alive(g)&&g!==S.player&&!isAlly(f,g)&&!atWar(f,g)&&getOp(f,g)>=45);if(c){S.ally[key(f,c)]=true;addLog(lng(`${fname(f)} ile ${fname(c)} ittifak kurdu.`,`${fname(f)} and ${fname(c)} formed an alliance.`));}}
 aiOps(f); // the campaign layer (05c) moves armies before Track B's armAiOps
}

/** Strategic targets of AI faction f: [{i:province,prio}] (higher prio = more attractive).
 Every enemy province bordering f's land (scored as before: value / defence), weighted up for
 capitals, mission claims, nudge targets and the war goal; plus enemy capitals and nudge targets
 further away (with a lower weight), for army AIs that march several steps. */
function aiTargets(f){const out=[],seen=new Map(),A=aiState(f),nud=aiNudges(f);
 const mis=new Set();const ms=typeof MIS==='object'&&MIS[f];if(ms)for(const m of ms)for(const k of (m.own||[])){const i=PK[k];if(i!=null)mis.add(i);}
 const nudT=new Map();for(const n of nud)if(n.target!=null)nudT.set(n.target,(nudT.get(n.target)||0)+(n.prio||1));
 const cnt={};for(let i=0;i<NP;i++){const o=S.prov[i].o;cnt[o]=(cnt[o]||0)+1;}
 const spare=g=>cnt[g]<=BAL_D.lastProvs&&S.turn-S.war[key(f,g)].t<BAL_D.annexWar;
 const add=(j,far)=>{const q=S.prov[j];if(spare(q.o))return;let pr=(q.dev+(S.fac[q.o].cap===j?5:0)+1)/(defPower(j,f)+800);
  if(S.fac[q.o].cap===j)pr*=1.3;if(mis.has(j))pr*=1.4;if(nudT.has(j))pr*=1+nudT.get(j);if(A.goal&&A.goal.i===j)pr*=BAL_D.goalTgt;if(far)pr*=.5;
  const sg=typeof siegeAt==='function'&&siegeAt(j);if(sg&&sg.f===f)pr*=BAL_D.siegeTgt; // finish what we started
  if(A.goal&&A.goal.stage!=null&&A.goal.stage>=0&&PD[j].adj.includes(A.goal.stage))pr*=1.2;
  if(!seen.has(j)||seen.get(j).prio<pr){if(seen.has(j))seen.get(j).prio=pr;else{const e={i:j,prio:pr};seen.set(j,e);out.push(e);}}};
 for(let i=0;i<NP;i++){if(S.prov[i].o!==f)continue;
  const c=aiCtl(i);if(c!==f&&atWar(f,c)&&!seen.has(i)){const e={i,prio:(S.prov[i].dev+(S.fac[f].cap===i?8:2))/800,own:true};seen.set(i,e);out.push(e);} // retake our occupied land
  for(const j of PD[i].adj){const q=S.prov[j];if(q.o===f||!atWar(f,q.o)||aiCtl(j)===f)continue;add(j,false);}}
 for(const g of warsOf(f)){const c=S.fac[g].cap;if(c>=0&&S.prov[c]&&S.prov[c].o===g&&aiCtl(c)!==f&&!seen.has(c))add(c,true);}
 if(A.goal&&A.goal.i!=null&&S.prov[A.goal.i]&&atWar(f,S.prov[A.goal.i].o)&&aiCtl(A.goal.i)!==f&&!seen.has(A.goal.i))add(A.goal.i,true);
 for(const j of nudT.keys())if(S.prov[j]&&S.prov[j].o!==f&&atWar(f,S.prov[j].o)&&!seen.has(j))add(j,true);
 return out;}
/** Provinces AI faction f must defend: [{i,need,siege}] (need = troops missing, largest first). Threat = the
 largest enemy field army next to the province (garrisons never attack); for the capital also two marches
 away, and its need counts double. A city of ours under siege needs a relief army (siege:true). */
function aiDefendNeeds(f){const out=[],en=new Set(warsOf(f));if(!en.size)return out;const cap=S.fac[f].cap;
 const armAt=new Map();if(S.armies)for(const a of S.armies)if(en.has(a.f)&&a.st!=='siege')armAt.set(a.loc,(armAt.get(a.loc)||0)+a.n);
 const capNear=new Set();if(cap>=0)for(const j of PD[cap].adj){capNear.add(j);for(const k of PD[j].adj)capNear.add(k);}
 for(let i=0;i<NP;i++){const p=S.prov[i];if(p.o!==f)continue;let th=0;
  for(const j of PD[i].adj)if(armAt.has(j))th=Math.max(th,armAt.get(j)); // garrisons never attack: only field armies threaten
  if(i===cap)for(const j of capNear)if(armAt.has(j))th=Math.max(th,armAt.get(j)*.9); // an enemy army two marches from the capital
  const sg=typeof siegeAt==='function'&&siegeAt(i);let relief=0;
  if(sg&&en.has(sg.f)){const b=armyById(sg.a);relief=b?b.n*1.2:0;} // lift the siege of our own city
  if(!th&&!relief)continue;const dp=defPower(i,[...en][0]);let need=Math.max(th*1.1-dp,relief);if(i===cap)need*=BAL_D.capThreat;
  if(need>0)out.push({i,need:Math.round(need/100)*100,siege:!!relief});}
 return out.sort((a,b)=>b.need-a.need);}
/** Push a strategic nudge to AI faction f: spec={war?:faction, target?:province, prio?:1, until?:turn}.
 A war nudge adds strong war desire against that faction every turn (still needs a reachable target);
 a target nudge raises that province in aiTargets. Expired nudges (until < turn) are dropped. */
function aiNudge(f,spec){if(!S.ai||!spec)return;aiState(f).nudges.push({prio:1,...spec});}
KE.aiNudge=(f,s)=>aiNudge(f,s);KE.aiReach=(f,g)=>aiReach(f,g);KE.aiTargets=f=>aiTargets(f);KE.aiDefendNeeds=f=>aiDefendNeeds(f);

/* rivalries: every BAL_D.rivalEvery turns each AI picks a comparable, unfriendly neighbour */
function aiSeedRivals(){for(const f of FK){if(!alive(f)||!S.ai[f])continue;const my=strength(f);let best=null,bs=-1e9;
  for(const g of nbrs(f)){if(isAlly(f,g))continue;const r=strength(g)/Math.max(my,1);if(r<.35||r>2.5)continue;const sc=-getOp(f,g)-Math.abs(Math.log(r))*20;if(sc>bs){bs=sc;best=g;}}
  S.ai[f].riv=best;}}
hook('newGame',S=>{for(const f of FK)if(S.ai[f]&&!('riv' in S.ai[f]))S.ai[f].riv=null;if(S.player!==undefined&&S.prov.length)aiSeedRivals();},20);
hook('migrate',s=>{for(const f in s.ai)if(s.ai[f]&&!('riv' in s.ai[f]))s.ai[f].riv=null;},50);
/* opinions drift back toward their historical base; rivalries refresh (roundEnd slot 50) */
hook('roundEnd',()=>{for(let a=0;a<FK.length;a++)for(let b=a+1;b<FK.length;b++){const k=key(FK[a],FK[b]),bo=baseOp(FK[a],FK[b]),v=S.op[k]||0;if(v<bo)S.op[k]=v+1;else if(v>bo)S.op[k]=v-1;}
 if(S.turn>0&&S.turn%BAL_D.rivalEvery===0)aiSeedRivals();},50);

/* =====================================================================
   WAVE 2 (Track D): treaties between AIs, campaign goals, aggressive expansion, coalitions, crusades.
   Sieges, occupation (ctl) and the peace basket are Track B's (04d); every call is guarded so this
   runs before and after B's merge. Assumed contract (W2 brief): basket={prov:[i],gold,release:[f]} is
   what the LOSER gives; aiAcceptBasket(giver,taker,basket) -> bool; makePeace(a,b,terms) cedes terms.prov
   to the side that does not own them (the occupier) and clears ctl.
   ===================================================================== */
/** Provinces of l that w holds under occupation (empty before B's sieges: captures change owner at once). */
function aiOccupied(w,l){const out=[];for(let i=0;i<NP;i++){const p=S.prov[i];if(p.o===l&&p.ctl===w)out.push(i);}return out;}
/** Sieges f is running against g's provinces. */
function aiSiegesOf(f,g){const out=[];if(!S.sieges)return out;for(const k in S.sieges){const s=S.sieges[k],i=s&&s.i!=null?s.i:+k;if(s&&s.f===f&&S.prov[i]&&S.prov[i].o===g)out.push(s);}return out;}
/** f keeps its sieges against g going (no peace) unless its war exhaustion is high (Track B's warEx). */
function aiBesieging(f,g){if(!aiSiegesOf(f,g).length)return false;return !(typeof warEx==='function'&&warEx(f,g)>=BAL_D.siegeEx);}
/** Who is winning the war between a and b: occupied land first, then war score. -> [winner, loser] */
function aiPeaceSides(a,b){const va=aiOccupied(a,b).reduce((s,i)=>s+S.prov[i].dev+1,0),vb=aiOccupied(b,a).reduce((s,i)=>s+S.prov[i].dev+1,0);
 if(va!==vb)return va>vb?[a,b]:[b,a];return warScore(a,b)>=0?[a,b]:[b,a];}
/** The winner's demand: every province it occupies (richest first), or some gold if it holds none. */
function aiTreatyBasket(w,l){const prov=aiOccupied(w,l).sort((x,y)=>S.prov[y].dev-S.prov[x].dev);
 const gold=prov.length?0:Math.max(0,Math.min(Math.floor(S.fac[l].gold*.5),Math.max(0,warScore(w,l))*15));
 return {prov,gold,release:[]};}
/** Make peace between two AIs on the best terms the loser accepts (Track B's peace table when present,
 a plain peace otherwise). -> the basket used, or null for a plain peace. */
function aiSettle(a,b){
 if(typeof aiAcceptBasket!=='function'||typeof peaceValue!=='function'){makePeace(a,b);return null;}
 const [w,l]=aiPeaceSides(a,b),bk=aiTreatyBasket(w,l);
 if(typeof vasAiSettle==='function'&&vasAiSettle(w,l))return {prov:[],gold:0,release:[],vas:true}; // vassalage instead of land (04g)
 for(let g=0;g<40;g++){if(!bk.prov.length&&!bk.gold)break;
  let ok=false;try{ok=aiAcceptBasket(l,w,bk);}catch(e){console.error('aiAcceptBasket',e);break;}
  if(ok){makePeace(w,l,bk);return bk;}
  if(bk.prov.length)bk.prov.pop();else bk.gold=0;}
 makePeace(a,b,{prov:[],gold:0,release:[]});return null;}

/* ---------- aggressive expansion (S.ae[f] points) ---------- */
const aeOf=f=>(S.ae&&S.ae[f])||0;
let aiAeSeen=new Set(); // province+taker already counted this turn (capture and peace cession of the same land)
/** f took province i from g: the world grows wary. Same faith as the victim counts 1.5x; a capital more. */
function aiAeAdd(f,i,g,mul=1){if(!S.ae||!f||!g||f===g||!S.fac[f])return;const k=S.turn+':'+i+':'+f;if(aiAeSeen.has(k))return;aiAeSeen.add(k);
 const p=S.prov[i];let v=(BAL_D.aeProv+p.dev*BAL_D.aeDev+(S.fac[g]&&S.fac[g].cap===i?BAL_D.aeCap:0))*mul;
 if(FAC[f].rel&&FAC[f].rel===FAC[g].rel)v*=BAL_D.aeSameRel;
 S.ae[f]=Math.round(((S.ae[f]||0)+v)*10)/10;
 const seen=new Set([f]);for(const j of PD[i].adj){const o=S.prov[j].o;if(seen.has(o))continue;seen.add(o);if(alive(o))addOp(o,f,-BAL_D.aeOp);}}
hook('capture',(i,f,old)=>{if(old&&old!==f)aiAeAdd(f,i,old);},60);
hook('peace',(a,b,t)=>{if(t&&t.giver&&t.prov&&t.prov.length&&S.ai&&S.ai[t.giver])aiState(t.giver).sore=S.turn+BAL_D.soreTurns;
 if(!t||!Array.isArray(t.prov))return;for(const i of t.prov){const o=S.prov[i].o,g=o===a?b:a;if(o!==g)aiAeAdd(o,i,g,BAL_D.aePeace);}},60);
hook('turnStart',()=>{aiAeSeen=new Set();});

/* ---------- coalitions: S.coal[target]={t,m:[members],war,cd} (m empty = only a cooldown is kept) ---------- */
const aiCoal=f=>S.coal&&S.coal[f]&&S.coal[f].m&&S.coal[f].m.length?S.coal[f]:null;
/** Coalition members stay in the war together for the first coalLock turns. */
function aiCoalLock(a,b){for(const [t,m] of [[a,b],[b,a]]){const C=aiCoal(t);if(C&&C.m.includes(m)&&S.turn-C.t<BAL_D.coalLock)return true;}return false;}
function aiCoalitions(){if(!S.coal)return;
 for(const f of FK){const C=S.coal[f];
  if(C&&C.m&&C.m.length){C.m=C.m.filter(g=>alive(g));
   if(!alive(f)||!C.m.length||(aeOf(f)<BAL_D.coalEnd&&!C.m.some(g=>atWar(g,f)))||S.turn-C.t>BAL_D.coalMaxT){
    const inv=f===S.player;S.coal[f]={t:C.t,m:[],war:false,cd:S.turn+BAL_D.coalCd};
    if(alive(f)){const msg=lng(`${fname(f)} karşıtı koalisyon dağıldı.`,`The coalition against ${fname(f)} has broken up.`);inv?news(msg,'good'):addLog(msg);}}
   continue;}
  if(!alive(f)||aeOf(f)<BAL_D.coalAE||(C&&C.cd>S.turn))continue;
  const nb=new Set(nbrs(f)),my=strength(f);
  const cands=FK.filter(g=>g!==f&&g!==S.player&&alive(g)&&(nb.has(g)||atWar(g,f))&&!isAlly(g,f)&&!(inTruce(g,f)&&!atWar(g,f))&&getOp(g,f)<BAL_D.coalOp&&!(typeof vasOf==='function'&&vasOf(g)))
   .sort((x,y)=>strength(y)-strength(x));
  const pow=cands.reduce((s,g)=>s+strength(g),0);
  if(cands.length<BAL_D.coalMin||pow<my*BAL_D.coalPow)continue;
  S.coal[f]={t:S.turn,m:cands,war:true,cd:0};
  for(const g of cands){if(!atWar(g,f))declareWar(g,f);aiState(g).goal=null;}
  const names=cands.map(fname).join(', ');
  const msg=f===S.player?lng(`Koalisyon! ${names} yayılmandan korkup sana karşı birleşti ve savaş ilan etti.`,`Coalition! Fearing your expansion, ${names} have joined forces and declared war on you.`)
   :lng(`${fname(f)} karşısında koalisyon: ${names} birlikte savaş ilan etti.`,`Coalition against ${fname(f)}: ${names} declared war together.`);
  if(f===S.player){news(msg,'war');toast(msg,'war');}else addLog(msg,'war');
  runHooks('coalition',f,cands);}}

/* ---------- the Papacy's crusade call: S.d.crus={t,target,cd} ---------- */
const aiChristian=g=>FAC[g].rel==='Katolik'||FAC[g].rel==='Ortodoks';
function aiCrusade(){const d=S.d;if(!d||!alive('PAP')||S.turn<8)return;if(d.crus&&d.crus.cd>S.turn)return;
 const cand=FK.filter(m=>alive(m)&&FAC[m].rel==='İslam'&&aeOf(m)>=BAL_D.crusAE&&nbrs(m).some(aiChristian)).sort((x,y)=>aeOf(y)-aeOf(x))[0];if(!cand)return;
 d.crus={t:S.turn,target:cand,cd:S.turn+BAL_D.crusCd};const ans=[];
 for(const g of FK){if(g===S.player||!alive(g)||!aiChristian(g)||isAlly(g,cand)||inTruce(g,cand))continue;const P=aiPers(g);
  const near=nbrs(g).includes(cand);if(!near&&!(P.crus>0))continue;
  aiNudge(g,{war:cand,prio:near?1:.5*(P.crus||1),until:S.turn+BAL_D.crusLen,why:'crusade'});ans.push(g);}
 const msg=lng(`Papa, ${fname(cand)} karşısında Haçlı Seferi çağrısı yaptı. ${ans.length} Hristiyan devlet çağrıya kulak veriyor.`,`The Pope has called a crusade against ${fname(cand)}. ${ans.length} Christian realms heed the call.`);
 (cand===S.player||(S.player&&aiChristian(S.player)))?news(msg,'war'):addLog(msg,'war');
 if(cand===S.player)toast(msg,'war');
 runHooks('crusade',cand,ans);}
hook('roundEnd',()=>{if(S.turn%2===0)aiCoalitions();if(S.turn>0&&S.turn%BAL_D.crusEvery===0)aiCrusade();
 if(S.ae)for(const f in S.ae){const v=S.ae[f]*BAL_D.aeDecay-BAL_D.aeFloor;if(v<=0||!alive(f))delete S.ae[f];else S.ae[f]=Math.round(v*10)/10;}},55);

/* ---------- campaign goal: S.ai[f].goal={g,i,stage,t,prep} ---------- */
/** Choose f's campaign: the enemy province worth most for its cost (march distance, walls, siege time).
 At peace, the best province of the most desired neighbour becomes a staging plan (prep:true). */
function aiPickGoal(f){const A=aiState(f),en=warsOf(f);let foes=en,prep=false;
 if(!foes.length){const D=A.desire||{},g=Object.keys(D).filter(x=>alive(x)&&D[x]>=BAL_D.thresh*.6).sort((x,y)=>D[y]-D[x])[0];if(!g)return null;foes=[g];prep=true;}
 const fs=new Set(foes),arm=S.armies?armyList(f).sort((x,y)=>y.n-x.n)[0]:null,from=arm?arm.loc:S.fac[f].cap;if(from==null||from<0)return null;
 const dist=armDistFrom(from);
 const mis=new Set();const ms=typeof MIS==='object'&&MIS[f];if(ms)for(const m of ms)for(const k of (m.own||[])){const i=PK[k];if(i!=null)mis.add(i);}
 const nudT=new Map();for(const n of aiNudges(f))if(n.target!=null)nudT.set(n.target,(nudT.get(n.target)||0)+(n.prio||1));
 let best=null,bs=0;
 for(let j=0;j<NP;j++){const q=S.prov[j],lib=q.o===f&&fs.has(aiCtl(j));if(!(fs.has(q.o)||lib)||aiCtl(j)===f||dist[j]<0)continue;
  let stage=-1,sd=1e9;for(const i of PD[j].adj)if(S.prov[i].o===f&&aiCtl(i)===f&&dist[i]>=0&&dist[i]<sd){sd=dist[i];stage=i;}
  if(stage<0&&prep)continue;const g0=lib?aiCtl(j):q.o;
  const cap=S.fac[q.o].cap===j,v=(q.dev+1+(cap?6:0)+(mis.has(j)?3:0)+(nudT.get(j)||0)*4)*(lib?BAL_D.goalLib:1);
  const turns=typeof siegeNeed==='function'&&q.fort>0?siegeNeed(j,f):0;
  const cost=1+defPower(j,f)/4000+dist[j]*BAL_D.goalDist/2+turns*BAL_D.goalSiege;
  const sc=v/cost;if(sc>bs){bs=sc;best={g:g0,i:j,stage,t:S.turn,prep,lib};}}
 return best;}
/** Current goal of f, re-evaluated every goalEvery turns or when it no longer fits the wars. */
function aiGoal(f){const A=aiState(f),G=A.goal;
 const bad=!G||G.i==null||S.turn-G.t>=BAL_D.goalEvery||!S.prov[G.i]||aiCtl(G.i)===f||(G.lib?aiCtl(G.i)!==G.g:S.prov[G.i].o!==G.g)||!alive(G.g)||(G.prep?warsOf(f).length>0:!atWar(f,G.g));
 if(bad)A.goal=aiPickGoal(f);return A.goal;}
KE.aiGoal=f=>aiGoal(f);KE.aiCoal=()=>S.coal;KE.aiAE=()=>S.ae;

/* schema (Track D): S.ae {f:points}, S.coal {f:{t,m,war,cd}}, S.d {crus:null|{t,target,cd}} */
hook('newGame',S=>{if(!S.ae)S.ae={};if(!S.coal)S.coal={};if(!S.d)S.d={crus:null};},25);
hook('migrate',s=>{if(!s.ae||typeof s.ae!=='object')s.ae={};if(!s.coal||typeof s.coal!=='object')s.coal={};if(!s.d||typeof s.d!=='object')s.d={crus:null};if(!('crus' in s.d))s.d.crus=null;},55);
