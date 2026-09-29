'use strict';
// Track B army / garrison invariants: armies are valid (size, place, owner, cap, general), stand on friendly
// ground, and garrisons stay near their maximum (garrisonMax + 1000 slack).
module.exports = `(()=>{const K=window.__ke,S=K.S,PD=K.PD,out=[];if(!S||!Array.isArray(S.armies))return out;
 const key=(a,b)=>a<b?a+'|'+b:b+'|'+a,cnt={},ids=new Set();
 for(const a of S.armies){const tag='army '+a.id+' ('+a.f+')';
  if(ids.has(a.id))out.push('duplicate army id '+a.id);ids.add(a.id);
  if(!(a.n>0))out.push(tag+' size '+a.n);else if(a.n%100!==0)out.push(tag+' size not a multiple of 100: '+a.n);
  if(!(a.loc>=0&&a.loc<S.prov.length))out.push(tag+' invalid loc '+a.loc);
  else{const o=S.prov[a.loc].o;if(a.st!=='siege'&&o!==a.f&&!S.ally[key(o,a.f)])out.push(tag+' stands on foreign ground '+PD[a.loc].name+' ('+o+')');}
  if(!S.fac[a.f]||!S.fac[a.f].alive)out.push(tag+' belongs to a dead faction');
  if(a.gen!=null){const c=S.chars&&S.chars[a.gen];if(!c||c.died!=null)out.push(tag+' general '+a.gen+' missing or dead');}
  if(!(a.mp>=0&&a.mp<=a.mpMax))out.push(tag+' mp '+a.mp+'/'+a.mpMax);
  if(!(a.morale>0&&a.morale<=2))out.push(tag+' morale '+a.morale);
  cnt[a.f]=(cnt[a.f]||0)+1;}
 for(const f in cnt){const cap=K.armyCap?K.armyCap(f):4;if(cnt[f]>cap)out.push(f+' has '+cnt[f]+' armies, cap '+cap);}
 if(K.garrisonMax)S.prov.forEach((p,i)=>{const m=K.garrisonMax(i);if(p.t>m+1000)out.push('garrison '+PD[i].name+' '+p.t+' > max '+m+' + 1000');});
 return out;})()`;
