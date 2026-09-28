'use strict';
// Core state invariants (pre-W0 checks). An inv module exports a JS expression string, evaluated in
// the page, that returns an array of violation strings. tests/lib.js concatenates every tests/inv/*.js.
module.exports = `(()=>{const K=window.__ke,S=K.S,PD=K.PD,out=[];const FK=Object.keys(S.fac);
 const bad=v=>typeof v!=='number'||!isFinite(v);
 S.prov.forEach((p,i)=>{for(const k of ['dev','fort','mkt','brk','t','mv','un'])if(bad(p[k]))out.push('prov '+i+' '+k+' NaN/'+p[k]);
  if(p.t<0)out.push('prov '+i+' ('+PD[i].name+') negative troops '+p.t);
  if(p.mv<0)out.push('prov '+i+' negative mv '+p.mv);
  if(p.t%100!==0)out.push('prov '+i+' non-round troops '+p.t);
  if(!S.fac[p.o])out.push('prov '+i+' invalid owner '+p.o);else if(!S.fac[p.o].alive)out.push('prov '+i+' ('+PD[i].name+') owned by dead '+p.o);
  if(p.fort<0||p.fort>5)out.push('prov '+i+' fort '+p.fort);if(p.dev<1)out.push('prov '+i+' dev '+p.dev);});
 FK.forEach(f=>{const F=S.fac[f];if(bad(F.gold))out.push(f+' gold NaN '+F.gold);if(bad(F.mp))out.push(f+' mp NaN');
  if(F.gold<0)out.push(f+' negative gold '+F.gold);if(F.mp<0)out.push(f+' negative mp '+F.mp);
  const n=S.prov.filter(p=>p.o===f).length;
  if(F.alive&&!n)out.push(f+' alive with 0 provinces');if(!F.alive&&n)out.push(f+' dead but owns '+n);
  if(F.alive&&(F.cap<0||!S.prov[F.cap]||S.prov[F.cap].o!==f))out.push(f+' capital '+F.cap+' not owned (owner '+(S.prov[F.cap]&&S.prov[F.cap].o)+')');});
 for(const k in S.war){const [a,b]=k.split('|');if(!S.fac[a]||!S.fac[b]||!S.fac[a].alive||!S.fac[b].alive)out.push('war with dead '+k);if(S.ally[k])out.push('war+ally '+k);if(a===b)out.push('self war');}
 for(const k in S.ally){const [a,b]=k.split('|');if(!S.fac[a]||!S.fac[b]||!S.fac[a].alive||!S.fac[b].alive)out.push('ally with dead '+k);}
 for(const k in S.truce)if(bad(S.truce[k]))out.push('truce NaN '+k);
 for(const k in S.op)if(bad(S.op[k]))out.push('op NaN '+k);
 (S.offers||[]).forEach(o=>{if(!S.fac[o.f]||!S.fac[o.f].alive)out.push('offer from dead '+o.f);});
 return out;})()`;
