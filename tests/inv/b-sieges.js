'use strict';
// Track B W2 siege / occupation invariants: every siege refers to a live army of the besieger standing in the
// besieged province (st 'siege') at war with its controller, with sane progress; armies marked 'siege' stand in a
// siege camp of their side; an occupation (prov.ctl) exists only while the occupier is at war with the owner;
// war records carry exhaustion 0..100; envoy offers are at most 2 turns old.
module.exports = `(()=>{const S=window.__ke.S,PD=window.__ke.PD,out=[];if(!S||!S.sieges)return out;
 const key=(a,b)=>a<b?a+'|'+b:b+'|'+a,ctl=i=>S.prov[i].ctl||S.prov[i].o,camps=new Set();
 for(const k of Object.keys(S.sieges)){const s=S.sieges[k],tag='siege '+k+(PD[k]?' ('+PD[k].name+')':'');
  if(!s||+k!==s.i){out.push(tag+' bad key/i '+(s&&s.i));continue;}
  const a=S.armies.find(x=>x.id===s.a);
  if(!a)out.push(tag+' army '+s.a+' missing');
  else{if(a.f!==s.f)out.push(tag+' army faction '+a.f+' != '+s.f);if(a.loc!==s.i)out.push(tag+' army not in the camp (loc '+a.loc+')');if(a.st!=='siege')out.push(tag+' army st '+a.st);}
  const c=ctl(s.i);if(c===s.f)out.push(tag+' besieger already controls it');else if(!S.war[key(s.f,c)])out.push(tag+' besieger '+s.f+' not at war with '+c);
  if(!(s.need>=1)||!(s.prog>=0)||s.prog>s.need+1e-6)out.push(tag+' prog/need '+s.prog+'/'+s.need);
  camps.add(s.f+'|'+s.i);}
 for(const a of S.armies)if(a.st==='siege'&&!camps.has(a.f+'|'+a.loc))out.push('army '+a.id+' ('+a.f+') besieging without a siege at '+a.loc);
 S.prov.forEach((p,i)=>{if(p.ctl==null)return;if(p.ctl===p.o)out.push('prov '+PD[i].name+' occupied by its owner');
  else if(!S.war[key(p.o,p.ctl)])out.push('prov '+PD[i].name+' occupied by '+p.ctl+' without a war with '+p.o);
  if(!S.fac[p.ctl]||!S.fac[p.ctl].alive)out.push('prov '+PD[i].name+' occupied by dead '+p.ctl);});
 for(const k in S.war){const w=S.war[k];for(const f in (w.ex||{})){const v=w.ex[f];if(typeof v!=='number'||!(v>=0&&v<=100))out.push('war '+k+' ex '+f+' '+v);}}
 for(const o of S.offers||[])if(o.t0!=null&&S.turn-o.t0>=2)out.push('offer from '+o.f+' is '+(S.turn-o.t0)+' turns old');
 return out;})()`;
