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
/** Targets for f's armies: D's aiTargets minus land f (or an ally) already controls or another realm besieges,
 plus f's own occupied provinces (liberation) and its provinces under enemy siege (relief), weighted up. */
function armAiTargets(f,tg){const out=[],seen=new Set();
 for(const t of tg){const c=ctl(t.i),s=siegeAt(t.i);if(c===f||isAlly(f,c)||(s&&s.f!==f&&siegeValid(s)))continue;if(!seen.has(t.i)){seen.add(t.i);out.push(t);}}
 for(let i=0;i<NP;i++){const p=S.prov[i];if(p.o!==f&&p.ctl!==f)continue;const c=ctl(i),s=siegeAt(i);
  const lib=p.o===f&&c!==f&&atWar(f,c),rel=c===f&&s&&s.f!==f&&atWar(f,s.f);if(!lib&&!rel)continue;
  const pr=BAL_B.aiFree*(p.dev+(S.fac[f].cap===i?5:0)+1)/(defPower(i,f)+800);
  const e=out.find(x=>x.i===i);if(e)e.prio=Math.max(e.prio,pr);else out.push({i,prio:pr});}
 return out;}
/** Steps from province s to every province for f's armies, ignoring who owns the land (lanes per armLaneOk). */
function armGeoDist(f,s){const d=new Int16Array(NP).fill(-1);d[s]=0;const q=[s];
 for(let h=0;h<q.length;h++){const u=q[h];for(const v of PD[u].adj)if(d[v]<0&&armLaneOk(f,u,v)){d[v]=d[u]+1;q.push(v);}}return d;}
function armAiOps(f,enemies,tg){
 if(!S.armies.some(a=>a.f===f))return;
 armAiMergeHere(f);
 tg=armAiTargets(f,tg||[]);
 const L=armyList(f).sort((a,b)=>b.n-a.n),held=new Set(),geo=new Map(),geoOf=i=>{let d=geo.get(i);if(!d){d=armGeoDist(f,i);geo.set(i,d);}return d;};
 // besiegers hold their siege; they storm when the breach makes it a near-certain win
 for(const a of L){if(a.st!=='siege')continue;held.add(a.id);const s=siegeAt(a.loc);
  if(s&&s.a===a.id&&a.mp>0&&siegeLeft(s)>=2&&battleOdds({att:f,to:a.loc,army:a,kind:'assault'}).p>=BAL_B.aiStorm)siegeStorm(a.id);}
 // defence: the nearest army goes to the most urgent province D asks for
 const needs=(aiDefendNeeds(f)||[]).slice().sort((a,b)=>b.need-a.need);
 if(needs.length){const nd=needs[0];let best=null,bd=1e9,bR=null;
  for(const a of L){if(held.has(a.id))continue;const R0=armReach(a),d=a.loc===nd.i?0:R0.dist[nd.i];if(d>=0&&!R0.term[nd.i]&&d<bd){bd=d;best=a;bR=R0;}}
  if(best){held.add(best.id);if(bd>0&&best.mp>0)armAiStep(best,bR,nd.i);}}
 if(!enemies.size||!tg.length)return;
 const main=L[0];
 for(const a of L){if(held.has(a.id)||!armyById(a.id)||a.mp<=0)continue;
  const R0=armReach(a),terms=[];for(let v=0;v<NP;v++)if(R0.term[v]&&R0.dist[v]>0)terms.push(v);
  let best=null,bs=0,far=null,fs=0;
  for(const t of tg){let g=t.i,d=R0.dist[g];if(d===0)continue;
   if(d<0){// behind hostile land: aim at the hostile province on the way (the gateway) nearest to the target
    const gd=geoOf(t.i);let bg=-1,bd=1e9;for(const v of terms){if(gd[v]<0)continue;const x=R0.dist[v]+gd[v];if(x<bd){bd=x;bg=v;}}if(bg<0)continue;g=bg;d=bd;}
   if(R0.dist[g]<=a.mp&&R0.term[g]){const od=battleOdds({att:f,to:g,army:a});if(od.p>=BAL_B.aiOdds){const sc=t.prio*od.p*(g===t.i?1:BAL_B.aiGate);if(sc>bs){bs=sc;best={i:g};}}}
   {const sc=t.prio/Math.pow(d,BAL_B.aiDistExp);if(sc>fs){fs=sc;far={i:g};}}} // march on the best target, weighed by distance
  if(best){armyMove(a.id,best.i);continue;}
  // not strong enough here: a secondary army joins the main army if it can reach it this season (or its siege)
  if(main&&a!==main&&armyById(main.id)&&main.loc!==a.loc&&a.n+main.n<=BAL_B.aiMaxStack){const d=R0.dist[main.loc];
   if(d>0&&d<=a.mp&&main.st==='siege'&&R0.term[main.loc]&&!armFoesAt(main.loc,f).length){armyMove(a.id,main.loc);continue;}
   if(d>0&&d<=a.mp&&!R0.term[main.loc]){if(armyMove(a.id,main.loc).kind==='move')armyMerge(main,a);continue;}}
  if(far)armAiStep(a,R0,far.i);}
}
