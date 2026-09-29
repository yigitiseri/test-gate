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
 warLen:14, warLenP:.15, warLongP:.4, // AI-AI wars older than warLen turns end with this chance per turn (twice as old: warLongP)
 mercyProvs:4, mercyP:.6,            // an AI lets a foe with this few provinces off (peace) with this chance
 satisfied:5, satisfiedP:.5,        // an AI ahead by this war score takes its gains and makes peace with this chance
 bigProvs:45,                          // above this many provinces war desire shrinks (overextension)
 lastProvs:2, annexWar:6,             // a foe down to this many provinces is only finished off in a war this old
 smallProvs:3, smallMul:.4, bullyRatio:4, bullyMul:.7, // prey far weaker than us tempts less (keeps the map varied)          // desire against tiny realms grows slower (keeps the map varied)
 minRatio:1.15, minRatioPl:1.45, minRatioNudge:.9, rivalRatio:.4, // a burning desire lowers the ratio needed by up to rivalRatio
 reachP:.3,           // an attack from some border province must have at least this win chance
 reachPNudge:.05,     // history nudges only need a border and a sliver of a chance
 mobilize:.2,         // share of the whole army an AI can bring to one border in time
 desireMax:300,
 maxWars:1, maxWarsBig:2, bigStr:70000,
 graceTurns:3, gracePlayer:6,
 rivalEvery:40, allyP:.03
};
/** Personalities: agg scales war desire, merc makes peace easier, crus = crusade caller/answerer. */
const AI_PERS={OSM:{agg:1.5},AKK:{agg:1.3},KKY:{agg:1.3},SAF:{agg:1.5},MAM:{agg:1.1},KRM:{agg:1.2},GH:{agg:1.1},KAR:{agg:1.1},
 HUN:{agg:1.1,crus:1},POL:{agg:1,crus:.5},HAB:{agg:.9,crus:.5},PAP:{agg:.4,crus:1.5},VEN:{agg:.6,merc:1},GEN:{agg:.6,merc:1},
 ARA:{agg:.9,crus:.5},RHO:{agg:.5,crus:1},BYZ:{agg:.6},TRB:{agg:.6},CYP:{agg:.5,merc:.5}};
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
KE.aiWhy={cap:0,rng:0,ratio:0,reach:0,decl:0}; // why candidates above the threshold did not declare (tuning aid)
KE.aiDecl=[]; // test log of AI declarations: {t,f,g,p,j}

function aiDiplo(f){
 const my=strength(f),A=aiState(f),P=aiPers(f);
 warsOf(f).forEach(g=>{
  if(g===S.player){if(S.fac[f].nextOffer<=S.turn&&aiWantsPeace(f,g)&&R()<.5&&!S.offers.some(o=>o.f===f)){S.offers.push({f,type:'peace',wt:S.war[key(f,g)].t});S.fac[f].nextOffer=S.turn+4;}}
  else if(aiWantsPeace(f,g)&&aiWantsPeace(g,f)||(S.turn-S.war[key(f,g)].t>=BAL_D.minWar&&aiWantsPeace(f,g)&&R()<.25+.15*(P.merc||0)))makePeace(f,g);
  else{const dur=S.turn-S.war[key(f,g)].t,ng=facProvs(g).length;
   if(dur>=BAL_D.warLen&&R()<(dur>=2*BAL_D.warLen?BAL_D.warLongP:BAL_D.warLenP)*(1+(P.merc||0)))makePeace(f,g);
   else if(warScore(f,g)>=BAL_D.satisfied&&R()<BAL_D.satisfiedP)makePeace(f,g);
   else if(dur>=3&&ng<=BAL_D.mercyProvs&&warScore(f,g)>0&&R()<BAL_D.mercyP)makePeace(f,g);}
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
  if(gain>0)gain*=over;
  gain*=calm;
  if(g===S.player&&S.turn<BAL_D.gracePlayer)gain=Math.min(gain,0);
  gain+=nw*BAL_D.gainNudge;
  D[g]=clamp((D[g]||0)*BAL_D.decay+gain,0,BAL_D.desireMax);if(D[g]<1)delete D[g];}
 if(S.turn<BAL_D.graceTurns)return;
 // declare war on the most desired reachable neighbour
 const nw0=warsOf(f).length,cap=my>BAL_D.bigStr?BAL_D.maxWarsBig:BAL_D.maxWars;
 const cands=Object.keys(D).filter(g=>D[g]>=BAL_D.thresh).sort((a,b)=>D[b]-D[a]);
 for(const g of cands){const nudged=nud.some(n=>n.war===g);if(nw0>=cap+(nudged?1:0)){KE.aiWhy.cap++;continue;}if(R()>BAL_D.declP){KE.aiWhy.rng++;break;}
  let th=strength(g);alliesOf(g).forEach(a=>{if(a!==f)th+=strength(a)*.5;});const ratio=my/Math.max(th,1);
  if(ratio<(nudged?BAL_D.minRatioNudge:g===S.player?BAL_D.minRatioPl:BAL_D.minRatio-BAL_D.rivalRatio*clamp((D[g]-BAL_D.thresh)/(BAL_D.desireMax-BAL_D.thresh),0,1))){KE.aiWhy.ratio++;continue;}
  const r=aiReach(f,g,nudged?BAL_D.reachPNudge:BAL_D.reachP);if(!r.ok){KE.aiWhy.reach++;continue;}KE.aiWhy.decl++;
  KE.aiDecl.push({t:S.turn,f,g,p:+r.p.toFixed(2),j:r.j,nudged});if(KE.aiDecl.length>200)KE.aiDecl.shift();
  declareWar(f,g);D[g]=0;break;}
 if(R()<BAL_D.allyP){const c=nbrs(f).concat(FK).find(g=>g!==f&&alive(g)&&g!==S.player&&!isAlly(f,g)&&!atWar(f,g)&&getOp(f,g)>=45);if(c){S.ally[key(f,c)]=true;addLog(`${fname(f)} ile ${fname(c)} ittifak kurdu.`);}}
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
  if(S.fac[q.o].cap===j)pr*=1.3;if(mis.has(j))pr*=1.4;if(nudT.has(j))pr*=1+nudT.get(j);if(A.goal&&A.goal.target===j)pr*=1.5;if(far)pr*=.5;
  if(!seen.has(j)||seen.get(j).prio<pr){if(seen.has(j))seen.get(j).prio=pr;else{const e={i:j,prio:pr};seen.set(j,e);out.push(e);}}};
 for(let i=0;i<NP;i++){if(S.prov[i].o!==f)continue;
  for(const j of PD[i].adj){const q=S.prov[j];if(q.o===f||!atWar(f,q.o))continue;add(j,false);}}
 for(const g of warsOf(f)){const c=S.fac[g].cap;if(c>=0&&S.prov[c]&&S.prov[c].o===g&&!seen.has(c))add(c,true);}
 for(const j of nudT.keys())if(S.prov[j]&&S.prov[j].o!==f&&atWar(f,S.prov[j].o)&&!seen.has(j))add(j,true);
 return out;}
/** Provinces AI faction f must defend: [{i,need}] (need = troops missing, largest first). The capital
 counts double. Threat = the largest enemy force (garrison + field armies) next to the province. */
function aiDefendNeeds(f){const out=[],en=new Set(warsOf(f));if(!en.size)return out;const cap=S.fac[f].cap;
 const armAt=new Map();if(S.armies)for(const a of S.armies)if(en.has(a.f))armAt.set(a.loc,(armAt.get(a.loc)||0)+a.n);
 for(let i=0;i<NP;i++){const p=S.prov[i];if(p.o!==f)continue;let th=0;
  for(const j of PD[i].adj){const q=S.prov[j];if(!en.has(q.o)&&!armAt.has(j))continue;th=Math.max(th,(en.has(q.o)?q.t:0)+(armAt.get(j)||0));}
  if(!th)continue;const dp=defPower(i,[...en][0]);let need=th*1.1-dp;if(i===cap)need*=2;if(need>0)out.push({i,need:Math.round(need/100)*100});}
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
