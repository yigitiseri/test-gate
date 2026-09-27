/* ---------------- AI ---------------- */
function aiTurn(f){
 const F=S.fac[f];if(!F.alive)return;const mine=facProvs(f);if(!mine.length)return;
 aiDiplo(f);
 const enemies=new Set(warsOf(f));const front=new Set(),border=new Set();
 for(const i of mine)for(const j of PD[i].adj){const o=S.prov[j].o;if(o!==f){border.add(i);if(enemies.has(o))front.add(i);}}
 aiEconomy(f,mine,front,border,enemies.size>0);
 // attacks
 if(enemies.size){
  const order=[...front].sort((a,b)=>avail(b)-avail(a));
  for(const i of order){const av=avail(i);if(av<800)continue;let best=-1,bs=0,bd=0;
   for(const j of PD[i].adj){const q=S.prov[j];if(!enemies.has(q.o))continue;const dp=defPower(j,f),ap=atkPower(av,f);
    if(ap>dp*1.25){const sc=(q.dev+(S.fac[q.o].cap===j?5:0)+1)/(dp+800);if(sc>bs){bs=sc;best=j;bd=dp;}}}
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
  let i=spots[Math.floor(Math.random()*spots.length)];
  if(war&&Math.random()<.6){let bt=-1,bv=-1;for(const s of spots){let th=0;for(const j of PD[s].adj){const o=S.prov[j].o;if(o!==f&&atWar(f,o))th+=S.prov[j].t;}const v=th-S.prov[s].t;if(v>bv){bv=v;bt=s;}}if(bt>=0)i=bt;}
  S.prov[i].t+=1000;S.prov[i].mv+=1000;F.gold-=RC;F.mp-=1000;upk+=UPK;}
 if(F.gold>150&&Math.random()<.35){const c=mine.filter(i=>!S.prov[i].mkt).sort((a,b)=>S.prov[b].dev-S.prov[a].dev)[0];if(c!=null){S.prov[c].mkt=1;F.gold-=60;}}
 else if(F.gold>200&&Math.random()<.3){const c=F.cap;if(S.prov[c].dev<12&&F.gold>=25*S.prov[c].dev){F.gold-=25*S.prov[c].dev;S.prov[c].dev++;}}
 if(war&&F.gold>100&&front.size&&Math.random()<.25){const fr=[...front].sort((a,b)=>S.prov[b].dev-S.prov[a].dev)[0];const p=S.prov[fr];if(p.fort<4&&F.gold>=40*(p.fort+1)){F.gold-=40*(p.fort+1);p.fort++;}}
}
function aiDiplo(f){
 const my=strength(f);
 warsOf(f).forEach(g=>{
  if(g===S.player){if(S.fac[f].nextOffer<=S.turn&&aiWantsPeace(f,g)&&Math.random()<.5&&!S.offers.some(o=>o.f===f)){S.offers.push({f,type:'peace',wt:S.war[key(f,g)].t});S.fac[f].nextOffer=S.turn+4;}}
  else if(aiWantsPeace(f,g)&&aiWantsPeace(g,f)||(aiWantsPeace(f,g)&&Math.random()<.25))makePeace(f,g);
 });
 if(S.turn<3)return;
 const nw=warsOf(f).length;if(nw>=(my>70000?2:1))return;if(Math.random()>.2)return;
 let best=null,bs=0;
 for(const g of nbrs(f)){if(isAlly(f,g)||inTruce(f,g)||atWar(f,g))continue;if(g===S.player&&S.turn<6)continue;const o=getOp(f,g);if(o>5)continue;
  let th=strength(g);alliesOf(g).forEach(a=>{if(a!==f)th+=strength(a)*.5;});const ratio=my/Math.max(th,1);if(ratio<(g===S.player?1.45:1.3))continue;
  const sc=ratio*(1+(-o)/60);if(sc>bs){bs=sc;best=g;}}
 if(best&&Math.random()<.65)declareWar(f,best);
 if(Math.random()<.03){const c=nbrs(f).concat(FK).find(g=>g!==f&&alive(g)&&g!==S.player&&!isAlly(f,g)&&!atWar(f,g)&&getOp(f,g)>=45);if(c){S.ally[key(f,c)]=true;addLog(`${fname(f)} ile ${fname(c)} ittifak kurdu.`);}}
}

