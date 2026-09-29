/* =====================================================================
   AI ARMY OPERATIONS (Track B mechanics). Targets come from aiTargets(f), defence from aiDefendNeeds(f) (Track D).
   Each army: attack the best target it can reach this season with odds >= BAL_B.aiOdds, otherwise march toward
   a target (stopping short of enemy ground) or join the main army. Armies sharing a province merge.
   ===================================================================== */
/** March army a along its reach tree toward province `to`, as far as its movement allows, never entering hostile ground. */
function armAiStep(a,R0,to){const path=armPathFrom(R0,to);if(!path)return false;const steps=R0.term[to]?path.slice(0,-1):path;
 const k=Math.min(a.mp,steps.length);if(k<=0)return false;return armyMove(a.id,steps[k-1]).kind==='move';}
function armAiMergeHere(f){const L=armyList(f).sort((a,b)=>b.n-a.n);
 for(const a of L){if(!armyById(a.id))continue;for(const b of L)if(b!==a&&armyById(b.id)&&b.loc===a.loc&&a.n+b.n<=BAL_B.aiMaxStack)armyMerge(a,b);}}
function armAiOps(f,enemies,tg){
 if(!S.armies.some(a=>a.f===f))return;
 armAiMergeHere(f);
 const L=armyList(f).sort((a,b)=>b.n-a.n),held=new Set();
 // defence: the nearest army goes to the most urgent province D asks for
 const needs=(aiDefendNeeds(f)||[]).slice().sort((a,b)=>b.need-a.need);
 if(needs.length){const nd=needs[0];let best=null,bd=1e9,bR=null;
  for(const a of L){const R0=armReach(a),d=a.loc===nd.i?0:R0.dist[nd.i];if(d>=0&&!R0.term[nd.i]&&d<bd){bd=d;best=a;bR=R0;}}
  if(best){held.add(best.id);if(bd>0&&best.mp>0)armAiStep(best,bR,nd.i);}}
 if(!enemies.size||!tg.length)return;
 const main=L[0];
 for(const a of L){if(held.has(a.id)||!armyById(a.id)||a.mp<=0)continue;
  const R0=armReach(a);let best=null,bs=0,far=null,fs=0,near=null,nd=1e9;
  for(const t of tg){const d=R0.dist[t.i];if(d<=0)continue;
   if(d<=a.mp&&R0.term[t.i]){const od=battleOdds({att:f,to:t.i,army:a});if(od.p>=BAL_B.aiOdds){const sc=t.prio*od.p;if(sc>bs){bs=sc;best=t;}}}
   if(d<=BAL_B.aiReach){const sc=t.prio/d;if(sc>fs){fs=sc;far=t;}}
   if(d<nd){nd=d;near=t;}}
  if(best){armyMove(a.id,best.i);continue;}
  // not strong enough here: a secondary army joins the main army if it can reach it this season
  if(main&&a!==main&&armyById(main.id)&&main.loc!==a.loc&&a.n+main.n<=BAL_B.aiMaxStack){const d=R0.dist[main.loc];
   if(d>0&&d<=a.mp&&!R0.term[main.loc]){if(armyMove(a.id,main.loc).kind==='move')armyMerge(main,a);continue;}}
  const goal=far||near;if(goal)armAiStep(a,R0,goal.i);}
}
