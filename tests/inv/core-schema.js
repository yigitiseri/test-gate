'use strict';
// Schema v2 shape (W0): the fields every track relies on exist with the right types.
module.exports = `(()=>{const S=window.__ke.S,out=[];
 if(S.v!==2)out.push('S.v is '+S.v+', expected 2');
 if(typeof S.seq!=='number')out.push('S.seq missing');
 for(const k of ['armies','hist'])if(!Array.isArray(S[k]))out.push('S.'+k+' not an array');
 for(const k of ['sieges','chars','ae','coal','evs','chains','ai'])if(!S[k]||typeof S[k]!=='object'||Array.isArray(S[k]))out.push('S.'+k+' not an object');
 if(!('tut' in S))out.push('S.tut missing');
 for(const f in S.fac){const F=S.fac[f];if(!('ruler' in F)||!('heir' in F)||!Array.isArray(F.gens))out.push(f+' missing ruler/heir/gens');if(!S.ai[f])out.push('S.ai.'+f+' missing');}
 for(const k in S.war){const w=S.war[k];if(!w.ex||typeof w.ex!=='object'||!('goal' in w))out.push('war '+k+' missing ex/goal');}
 const ids=new Set();for(const a of S.armies){if(ids.has(a.id))out.push('duplicate army id '+a.id);ids.add(a.id);if(!(a.id<S.seq))out.push('army id '+a.id+' >= S.seq');
  if(!S.fac[a.f])out.push('army '+a.id+' invalid faction '+a.f);if(!(a.loc>=0&&a.loc<S.prov.length))out.push('army '+a.id+' invalid loc '+a.loc);
  if(typeof a.n!=='number'||!isFinite(a.n)||a.n<0)out.push('army '+a.id+' bad n '+a.n);}
 return out;})()`;
