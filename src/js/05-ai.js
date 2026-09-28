/* ---------------- AI ---------------- */
function aiTurn(f){
 const F=S.fac[f];if(!F.alive)return;const mine=facProvs(f);if(!mine.length)return;
 aiDiplo(f);
 const enemies=new Set(warsOf(f));const front=new Set(),border=new Set();
 for(const i of mine)for(const j of PD[i].adj){const o=S.prov[j].o;if(o!==f){border.add(i);if(enemies.has(o))front.add(i);}}
 aiEconomy(f,mine,front,border,enemies.size>0);
 // attacks
 if(enemies.size){
  const order=[...front].sort((a,b)=>avail(b)-avail(a));const prio=new Map();for(const t of aiTargets(f))prio.set(t.i,t.prio);
  for(const i of order){const av=avail(i);if(av<800)continue;let best=-1,bs=0,bd=0;
   for(const j of PD[i].adj){const q=S.prov[j];if(!enemies.has(q.o))continue;const dp=defPower(j,f),ap=atkPower(av,f);
    if(ap>dp*1.25){const sc=prio.get(j)||0;if(sc>bs){bs=sc;best=j;bd=dp;}}}
   if(best>=0){const need=Math.ceil(bd*1.7/atkMul(f)/100)*100;const send=Math.min(av,Math.max(need,Math.round(av*.6/100)*100));battle(i,best,send);}
  }
  // concentrate: front provinces that face a strong target pull from front neighbours
  for(const i of front){const av=avail(i);if(av<500)continue;
   let weak=Infinity;for(const j of PD[i].adj)if(enemies.has(S.prov[j].o))weak=Math.min(weak,defPower(j,f));
   for(const k of PD[i].adj){if(S.prov[k].o!==f||!front.has(k)||k===i)continue;const ak=avail(k);if(ak<500)continue;
    let wk=Infinity;for(const j of PD[k].adj)if(enemies.has(S.prov[j].o))wk=Math.min(wk,defPower(j,f));
    if(weak<wk*.8&&S.prov[i].t>=S.prov[k].t*.5){const mv=Math.round(ak*.6/100)*100;S.prov[k].t-=mv;S.prov[i].t+=mv;S.prov[i].mv+=mv;}}}
 }
 // march toward the front (or border in peace)
 const goal=front.size?front:border;if(!goal.size)return;
 const dist=new Map(),q=[];goal.forEach(i=>{dist.set(i,0);q.push(i);});
 for(let h=0;h<q.length;h++){const i=q[h];for(const j of PD[i].adj){if(S.prov[j].o!==f||dist.has(j))continue;dist.set(j,dist.get(i)+1);q.push(j);}}
 const share=front.size?.85:.5;
 for(const i of mine){if(goal.has(i)||!dist.has(i))continue;const av=avail(i);if(av<400)continue;
  let nx=-1,nd=dist.get(i);for(const j of PD[i].adj){if(S.prov[j].o===f&&dist.has(j)&&dist.get(j)<nd){nd=dist.get(j);nx=j;}}
  if(nx>=0){const mv=Math.round(av*share/100)*100;S.prov[i].t-=mv;S.prov[nx].t+=mv;S.prov[nx].mv+=mv;}}
}
function aiEconomy(f,mine,front,border,war){
 const F=S.fac[f];const inc=income(f);let upk=upkeep(f);const cap=inc*(war?1.05:.72);
 const spots=front.size?[...front]:border.size?[...border]:[F.cap];let g=0;
 while(F.gold>=RC+15&&F.mp>=1000&&upk+UPK<=cap&&g++<40){
  let i=spots[Math.floor(R()*spots.length)];
  if(war&&R()<.6){let bt=-1,bv=-1;for(const s of spots){let th=0;for(const j of PD[s].adj){const o=S.prov[j].o;if(o!==f&&atWar(f,o))th+=S.prov[j].t;}const v=th-S.prov[s].t;if(v>bv){bv=v;bt=s;}}if(bt>=0)i=bt;}
  S.prov[i].t+=1000;S.prov[i].mv+=1000;F.gold-=RC;F.mp-=1000;upk+=UPK;}
 if(F.gold>150&&R()<.35){const c=mine.filter(i=>!S.prov[i].mkt).sort((a,b)=>S.prov[b].dev-S.prov[a].dev)[0];if(c!=null){S.prov[c].mkt=1;F.gold-=60;}}
 else if(F.gold>200&&R()<.3){const c=F.cap;if(S.prov[c].dev<12&&F.gold>=25*S.prov[c].dev){F.gold-=25*S.prov[c].dev;S.prov[c].dev++;}}
 if(war&&F.gold>100&&front.size&&R()<.25){const fr=[...front].sort((a,b)=>S.prov[b].dev-S.prov[a].dev)[0];const p=S.prov[fr];if(p.fort<4&&F.gold>=40*(p.fort+1)){F.gold-=40*(p.fort+1);p.fort++;}}
}
