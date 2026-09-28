/* =====================================================================
   AI STRATEGY (Track D): diplomacy, target selection, defence needs, nudges
   ===================================================================== */
function aiDiplo(f){
 const my=strength(f);
 warsOf(f).forEach(g=>{
  if(g===S.player){if(S.fac[f].nextOffer<=S.turn&&aiWantsPeace(f,g)&&R()<.5&&!S.offers.some(o=>o.f===f)){S.offers.push({f,type:'peace',wt:S.war[key(f,g)].t});S.fac[f].nextOffer=S.turn+4;}}
  else if(aiWantsPeace(f,g)&&aiWantsPeace(g,f)||(aiWantsPeace(f,g)&&R()<.25))makePeace(f,g);
 });
 if(S.turn<3)return;
 const nw=warsOf(f).length;if(nw>=(my>70000?2:1))return;if(R()>.2)return;
 let best=null,bs=0;
 for(const g of nbrs(f)){if(isAlly(f,g)||inTruce(f,g)||atWar(f,g))continue;if(g===S.player&&S.turn<6)continue;const o=getOp(f,g);if(o>5)continue;
  let th=strength(g);alliesOf(g).forEach(a=>{if(a!==f)th+=strength(a)*.5;});const ratio=my/Math.max(th,1);if(ratio<(g===S.player?1.45:1.3))continue;
  const sc=ratio*(1+(-o)/60);if(sc>bs){bs=sc;best=g;}}
 if(best&&R()<.65)declareWar(f,best);
 if(R()<.03){const c=nbrs(f).concat(FK).find(g=>g!==f&&alive(g)&&g!==S.player&&!isAlly(f,g)&&!atWar(f,g)&&getOp(f,g)>=45);if(c){S.ally[key(f,c)]=true;addLog(`${fname(f)} ile ${fname(c)} ittifak kurdu.`);}}
}

/** Strategic targets of AI faction f: [{i:province,prio}] (higher prio = more attractive).
 Default: every enemy province adjacent to f's land, scored as the pre-W0 attack loop did. */
function aiTargets(f){const out=[],seen=new Set();
 for(let i=0;i<NP;i++){if(S.prov[i].o!==f)continue;
  for(const j of PD[i].adj){if(seen.has(j))continue;const q=S.prov[j];if(q.o===f||!atWar(f,q.o))continue;seen.add(j);
   out.push({i:j,prio:(q.dev+(S.fac[q.o].cap===j?5:0)+1)/(defPower(j,f)+800)});}}
 return out;}
/** Provinces AI faction f must defend: [{i,need}] (W0 default: none). */
function aiDefendNeeds(f){return [];}
/** Push a strategic nudge to AI faction f (stored; consumed by Track D): spec={war?,target?,prio?,until?}. */
function aiNudge(f,spec){(S.ai[f]||(S.ai[f]=newAi())).nudges.push(spec);}
/* opinions drift back toward their historical base (roundEnd slot 50) */
hook('roundEnd',()=>{for(let a=0;a<FK.length;a++)for(let b=a+1;b<FK.length;b++){const k=key(FK[a],FK[b]),bo=baseOp(FK[a],FK[b]),v=S.op[k]||0;if(v<bo)S.op[k]=v+1;else if(v>bo)S.op[k]=v-1;}},50);
