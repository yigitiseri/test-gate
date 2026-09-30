/* =====================================================================
   AI OPERATIONS (Track D, Wave 2): the campaign layer on top of Track B's army moves.
   Runs from aiDiplo(f) at the start of aiTurn(f), so Track B's armAiOps (05a) only handles the armies
   this layer leaves free. Per AI faction:
    1. treasury plan: a rich treasury is spent on markets, development, barracks and border walls;
    2. defence: an army marches home when the capital (or a besieged city) needs it;
    3. campaign: every other army gathers at the goal's staging province (aiGoal, 05b), armies that
       meet merge, and the gathered army strikes (assault, or siege once Track B's sieges exist) when
       it is strong enough; armies waiting for a partner hold their ground (mp spent, no rule bent).
   At peace a goal with prep:true moves the main army to the border it will attack from.
   Armies that are besieging (st 'siege') are never touched: the siege is Track B's.
   ===================================================================== */
const BAL_O={
 rich:700, keep:450,       // a treasury above 700 gold is spent down to 450
 devMax:12, fortMax:3,     // development cap (same as the player's), border walls raised to 3
 attackP:.55,              // an assault needs this win chance (Track B's own AI uses .6)
 siegeRatio:1.5, siegeMin:3000, // a siege needs this multiple of the garrison, and at least 3,000 men
 joinReach:4,              // a partner army this many marches away is worth waiting for
 guardShare:.35,           // an army is sent home when the capital needs more than 35% of it
 moves:true,               // campaign moves on (off: only the treasury plan runs; tuning aid)
};
/** Is army a besieging (Track B)? */
function aiOpBusy(a){if(a.st==='siege')return true;const s=typeof siegeAt==='function'&&siegeAt(a.loc);return !!(s&&s.a===a.id);}
/** Move army a toward province `to` along its reach tree as far as it can this season, never ending on hostile ground. */
function aiOpStep(a,R0,to){if(to==null||to<0||R0.dist[to]<=0)return false;const path=armPathFrom(R0,to);if(!path)return false;
 const steps=R0.term[to]?path.slice(0,-1):path,k=Math.min(a.mp,steps.length);if(k<=0)return false;return armyMove(a.id,steps[k-1]).kind==='move';}
/** Can army a strike province t from where it stands (t is a terminal step within its reach this season)? -> 'siege'|'assault'|'' */
function aiOpStrike(f,a,R0,t){const d=R0.dist[t];if(d<=0||d>a.mp||!R0.term[t])return '';
 const foes=armFoesAt(t,f),p=S.prov[t];
 if(!foes.length&&p.fort>0&&typeof siegeAt==='function'&&typeof siegeNeed==='function'){ // Track B: walls are besieged, not stormed
  let near=0;for(const j of PD[t].adj)for(const b of armFoesAt(j,f))near+=b.n;
  return a.n>=Math.max(BAL_O.siegeMin,p.t*BAL_O.siegeRatio)&&a.n>=near*.9?'siege':'';}
 return battleOdds({att:f,to:t,army:a}).p>=BAL_O.attackP?'assault':'';}
/** Spend a rich treasury the way a player would: markets, then development, barracks and walls on the border. */
function aiOpSpend(f){const F=S.fac[f];if(F.gold<=BAL_O.rich)return;const mine=facProvs(f);if(!mine.length)return;
 const border=mine.filter(i=>PD[i].adj.some(j=>S.prov[j].o!==f));
 for(let g=0;g<24&&F.gold>BAL_O.keep;g++){
  const mk=mine.filter(i=>!S.prov[i].mkt).sort((x,y)=>S.prov[y].dev-S.prov[x].dev)[0];
  if(mk!=null&&F.gold-60>=BAL_O.keep){S.prov[mk].mkt=1;F.gold-=60;continue;}
  const bk=border.filter(i=>!S.prov[i].brk).sort((x,y)=>S.prov[y].dev-S.prov[x].dev)[0];
  if(bk!=null&&F.gold-50>=BAL_O.keep&&R()<.3){S.prov[bk].brk=1;F.gold-=50;continue;}
  const ft=border.filter(i=>S.prov[i].fort<BAL_O.fortMax).sort((x,y)=>S.prov[y].dev-S.prov[x].dev)[0];
  if(ft!=null&&R()<.3){const c=40*(S.prov[ft].fort+1);if(F.gold-c>=BAL_O.keep){S.prov[ft].fort++;F.gold-=c;continue;}}
  const dv=mine.filter(i=>S.prov[i].dev<BAL_O.devMax&&!(S.prov[i].un>0)).sort((x,y)=>S.prov[x].dev-S.prov[y].dev||y-x)[0];
  if(dv==null)break;const c=25*S.prov[dv].dev;if(F.gold-c<BAL_O.keep)break;S.prov[dv].dev++;F.gold-=c;}}
function aiOps(f){if(!S||!alive(f))return;
 aiOpSpend(f);
 if(!S.armies||!BAL_O.moves)return;
 const G=aiGoal(f);let L=armyList(f).filter(a=>a.mp>0&&!aiOpBusy(a)).sort((x,y)=>y.n-x.n);if(!L.length)return;
 const used=new Set();
 // defence: the capital (or one of our besieged cities) first
 const nd=(aiDefendNeeds(f)||[]).find(n=>n.i===S.fac[f].cap||n.siege);
 if(nd){let best=null,bd=1e9,bR=null;
  for(const a of L){if(nd.need<a.n*BAL_O.guardShare&&a!==L[0])continue;const R0=armReach(a),d=a.loc===nd.i?0:R0.dist[nd.i];if(d>=0&&d<bd){bd=d;best=a;bR=R0;}}
  if(best){used.add(best.id);if(bd===0)best.mp=0;else if(bR.term[nd.i]){if(best.mp>=bd)armyMove(best.id,nd.i);}else aiOpStep(best,bR,nd.i);}}
 if(!G)return;
 const t=G.i,stage=G.stage;
 L=L.filter(a=>!used.has(a.id)&&armyById(a.id));if(!L.length)return;
 if(G.prep){const a=L[0];if(stage>=0&&a.loc!==stage){const R0=armReach(a);aiOpStep(a,R0,stage);}return;}
 const reach=new Map(L.map(a=>[a.id,armReach(a)]));
 // 1) strike the goal with the largest army that can
 for(const a of L){const k=aiOpStrike(f,a,reach.get(a.id),t);if(k){used.add(a.id);armyMove(a.id,t);G.hit=S.turn;break;}}
 // 2) an army that can strike some other target this season is left to Track B's opportunistic AI
 const tg=(aiTargets(f)||[]).filter(x=>x.i!==t);
 L=L.filter(a=>!used.has(a.id)&&armyById(a.id)&&!tg.some(x=>aiOpStrike(f,a,reach.get(a.id),x.i)));if(!L.length)return;
 // 3) the rest gathers at the staging province; an army there waits for a partner on its way
 const meet=stage>=0&&S.prov[stage].o===f?stage:L[0].loc;
 for(const a of L){const R0=reach.get(a.id);if(a.loc!==meet){if(R0.dist[meet]>0)aiOpStep(a,R0,meet);continue;}
  const coming=L.some(b=>b!==a&&armyById(b.id)&&b.loc!==meet&&(d=>d>0&&d<=BAL_O.joinReach*b.mpMax)(reach.get(b.id).dist[meet]));
  if(coming)a.mp=0;}
 // 4) armies standing together merge (Track B's stack limit); the gathered army may strike at once
 const here=armyList(f).filter(a=>a.loc===meet&&!aiOpBusy(a)).sort((x,y)=>y.n-x.n);
 for(let k=1;k<here.length;k++)if(armyById(here[0].id)&&armyById(here[k].id)&&here[0].n+here[k].n<=BAL_B.aiMaxStack)armyMerge(here[0],here[k]);
 const m=here[0];if(m&&armyById(m.id)&&m.mp>0&&aiOpStrike(f,m,armReach(m),t)){armyMove(m.id,t);G.hit=S.turn;}}
KE.aiOps=f=>aiOps(f);KE.BAL_O=BAL_O;KE.BAL_D=BAL_D;
