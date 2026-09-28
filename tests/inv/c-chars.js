'use strict';
// Track C invariants: every alive faction has a living ruler of its own; no living character older than 95;
// heirs and generals belong to their faction; chain and pending-question state is well formed.
module.exports = `(()=>{const S=window.__ke.S,out=[];if(!S.c)return ['S.c (Track C namespace) missing'];
 const y=1451+Math.floor(S.turn/4),C=S.chars;
 for(const f in S.fac){const F=S.fac[f];if(!F.alive)continue;const r=C[F.ruler];
  if(!r||r.died!=null)out.push(f+' alive without a living ruler');else if(r.f!==f||r.role!=='ruler')out.push(f+' ruler '+r.id+' wrong faction/role '+r.f+'/'+r.role);
  if(F.heir!=null){const h=C[F.heir];if(!h||h.died!=null)out.push(f+' heir '+F.heir+' dead or missing');else if(h.f!==f||h.role!=='heir')out.push(f+' heir '+h.id+' wrong faction/role');}
  for(const g of F.gens){const c=C[g];if(!c||c.died!=null)out.push(f+' general '+g+' dead or missing');else if(c.f!==f)out.push(f+' general '+g+' of '+c.f);}}
 for(const id in C){const c=C[id];if(String(c.id)!==id)out.push('char key '+id+' != id '+c.id);if(!(c.id<S.seq))out.push('char id '+id+' >= S.seq');
  if(c.died==null&&y-c.born>95)out.push('living char '+c.n+' aged '+(y-c.born));if(typeof c.born!=='number'||!isFinite(c.born))out.push('char '+id+' bad born');
  if(!Array.isArray(c.traits))out.push('char '+id+' traits not an array');}
 for(const a of S.armies)if(a.gen!=null){const c=C[a.gen];if(!c||c.died!=null)out.push('army '+a.id+' led by dead/missing char '+a.gen);}
 for(const k in S.chains){const st=S.chains[k];if(typeof st.stage!=='number'||!st.data)out.push('chain '+k+' malformed');}
 if(!Array.isArray(S.c.pend))out.push('S.c.pend not an array');
 return out;})()`;
