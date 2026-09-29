/* ---------------- AI ----------------
   The AI plays by the player's rules: garrisons defend, field armies (04c) march and attack.
   Strategy comes from Track D: aiTargets(f) (what to attack) and aiDefendNeeds(f) (what to hold). */
function aiTurn(f){
 const F=S.fac[f];if(!F.alive)return;const mine=facProvs(f);if(!mine.length)return;
 aiDiplo(f);if(!F.alive)return;
 const enemies=new Set(warsOf(f));const front=new Set(),border=new Set();
 for(const i of mine)for(const j of PD[i].adj){const o=S.prov[j].o;if(o!==f){border.add(i);if(enemies.has(o))front.add(i);}}
 const tg=enemies.size?(aiTargets(f)||[]):[];
 aiEconomy(f,mine,front,border,enemies.size>0,tg);
 armAiOps(f,enemies,tg);
}
/** Where f raises new armies: the front province next to its most attractive target, else the capital. */
function armAiStaging(f,front,tg){if(front.size&&tg.length){const pr=new Map(tg.map(t=>[t.i,t.prio]));let best=-1,bs=-1;
  for(const i of front){let s=0;for(const j of PD[i].adj)s+=pr.get(j)||0;if(s>bs){bs=s;best=i;}}if(best>=0)return best;}
 return S.prov[S.fac[f].cap].o===f?S.fac[f].cap:facProvs(f)[0];}
function aiEconomy(f,mine,front,border,war,tg){
 const F=S.fac[f];const inc=income(f);let upk=upkeep(f);const cap=inc*(war?1.05:.72);
 // in the red with an empty treasury: shed troops the way the player would (disband / thin the garrisons)
 if(inc<upk&&F.gold<(upk-inc)*4){const L=armyList(f).sort((a,b)=>a.n-b.n);
  if(L.length&&(!war||L.length>1))armyDisband(L[0].id);else for(const i of mine)if(!border.has(i))garDisband(i);upk=upkeep(f);}
 const garNeed=war?[...front].filter(i=>S.prov[i].t<garrisonMax(i)*BAL_B.aiGarFill).sort((a,b)=>S.prov[b].dev-S.prov[a].dev):[];
 const stage=armAiStaging(f,front,tg||[]);let g=0;
 while(F.gold>=RC+15&&F.mp>=1000&&g++<40){
  // 1) keep front garrisons manned (cheap), 2) reinforce / raise field armies, 3) top up border garrisons
  if(garNeed.length&&R()<.4){const i=garNeed[0],n=Math.min(1000,garRoom(i)),c=n/1000*UPK*BAL_B.garUpk;if(upk+c>cap)break;
   const r=armRecruit(f,i,n,{gar:true});if(!r.to||garRoom(i)<100||S.prov[i].t>=garrisonMax(i)*BAL_B.aiGarFill)garNeed.shift();if(r.to)upk+=c;continue;}
  if(upk+UPK>cap)break;
  const L=armyList(f).filter(a=>S.prov[a.loc].o===f&&a.n+1000<=BAL_B.aiMaxStack).sort((a,b)=>b.n-a.n);
  let r=null;
  if(armyList(f).length<armyCap(f)&&(!L.length||L[0].n>=8000||R()<.25))r=armRecruit(f,stage,1000,{army:-1});
  if(!r||!r.to){if(L.length)r=armRecruit(f,L[0].loc,1000,{army:L[0].id});}
  if(r&&r.to&&r.to!=='gar'){upk+=UPK;continue;}
  if(r&&r.to==='gar'){upk+=UPK*BAL_B.garUpk;continue;}
  const b=[...border].find(i=>garRoom(i)>=1000);if(!b)break;
  if(armRecruit(f,b,1000,{gar:true}).to)upk+=UPK*BAL_B.garUpk;else break;}
 if(F.gold>150&&R()<.35){const c=mine.filter(i=>!S.prov[i].mkt).sort((a,b)=>S.prov[b].dev-S.prov[a].dev)[0];if(c!=null){S.prov[c].mkt=1;F.gold-=60;}}
 else if(F.gold>200&&R()<.3){const c=F.cap;if(S.prov[c].dev<12&&F.gold>=25*S.prov[c].dev){F.gold-=25*S.prov[c].dev;S.prov[c].dev++;}}
 if(war&&F.gold>100&&front.size&&R()<.25){const fr=[...front].sort((a,b)=>S.prov[b].dev-S.prov[a].dev)[0];const p=S.prov[fr];if(p.fort<4&&F.gold>=40*(p.fort+1)){F.gold-=40*(p.fort+1);p.fort++;}}
}
