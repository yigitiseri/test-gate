/* =====================================================================
   LONG MARCH: a player's army can be given a far destination (a.dest). It marches as far as it can at once,
   then again at the end of every turn (turnStart, before the AI moves), along the shortest legal road, until it
   arrives. Arriving at a hostile town it besieges or storms it; if an enemy army holds the destination it halts
   next to it and the player decides. The march stops (with a note in the season report) when the road closes, or
   ships cannot be paid; a manual order to the army cancels it. a.path holds the road still to go (drawn on the map).
   ===================================================================== */
/** Seasons a march of `cost` provinces takes for army a (counting what is left of this season). */
function marchSeasons(a,cost){const now=Math.max(0,a.mp||0),mx=Math.max(1,a.mpMax||2);return cost<=now?1:(now>0?1:0)+Math.ceil((cost-now)/mx);}
/** Give army a the destination `to` and march at once as far as it can. -> marchStep's result */
function marchSet(a,to){if(!a||to==null||to===a.loc)return null;a.dest=to;return marchStep(a);}
function marchEnd(a,msg,k){a.dest=null;a.path=[];if(msg&&a.f===S.player)news(msg,k||'info');}
/** One leg of the march of army a: as far as its movement points allow this season.
 -> 'arrived' | 'moved' | 'wait' (no points left) | 'halted' (enemy army at the destination) | 'stopped' | null */
function marchStep(a){if(!a||a.dest==null)return null;const to=a.dest,nm=armName(a),place=PD[to].name;
 if(a.loc===to){marchEnd(a);return 'arrived';}
 const p=armyPath(a.id,to);
 if(!p){marchEnd(a,lng(`${nm}: ${place} yolu kapandı, sefer durdu.`,`${nm}: the road to ${place} is closed; the march has stopped.`),'war');return 'stopped';}
 if(a.mp<=0){a.path=p;return 'wait';}
 let k=Math.min(a.mp,p.length);
 if(k===p.length&&armFoesAt(to,a.f).length){   // an enemy army holds the destination: halt next to it
  if(k<2){marchEnd(a,lng(`${nm}, ${place} önünde bir düşman ordusuyla karşı karşıya. Saldırı kararı senin.`,`${nm} faces an enemy army at ${place}. Whether to attack is your call.`),'war');return 'halted';}
  k--;}
 const step=p[k-1],c=armyCanMove(a.id,step);
 if(!c.ok){marchEnd(a,lng(`${nm}: sefer durdu. ${c.reason}`,`${nm}: the march has stopped. ${c.reason}`),'war');return 'stopped';}
 armyMove(a.id,step);
 if(!S.armies.includes(a)){return 'stopped';}   // lost on the way (a battle)
 if(a.loc===to||(step===to&&c.kind!=='move')){marchEnd(a,c.kind==='move'?lng(`${nm} ${place} eyaletine vardı.`,`${nm} has arrived at ${place}.`):'');return 'arrived';}
 if(step!==to&&k<p.length&&step===p[p.length-2]&&armFoesAt(to,a.f).length){marchEnd(a,lng(`${nm}, ${place} önüne vardı; orada bir düşman ordusu var. Saldırı kararı senin.`,`${nm} has reached ${place}, where an enemy army stands. Whether to attack is your call.`),'war');return 'halted';}
 a.path=armyPath(a.id,to)||[];return 'moved';}
/** At the end of the player's turn every army on a long march takes its next leg. */
hook('turnStart',()=>{if(!S||!S.player)return;for(const a of armyList(S.player).slice())if(a.dest!=null)marchStep(a);},40);
/** Keep the drawn roads current (owners and enemies change). */
hook('renderAll',()=>{if(!S||!S.player)return;for(const a of armyList(S.player))if(a.dest!=null){const p=armyPath(a.id,a.dest);a.path=p||[];}});
KE.march={set:(id,to)=>marchSet(armyById(id),to),step:id=>marchStep(armyById(id)),seasons:(id,cost)=>marchSeasons(armyById(id),cost)};
