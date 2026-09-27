/* ---------------- war & peace ---------------- */
function declareWar(a,b){
 if(atWar(a,b)||a===b)return;
 delete S.ally[key(a,b)];
 S.war[key(a,b)]={t:S.turn,sc:{[a]:0,[b]:0}};addOp(a,b,-60);
 alliesOf(b).forEach(c=>addOp(a,c,-25));
 const msg=`${fname(a)}, ${fname(b)} devletine savaş ilan etti.`;
 if(a===S.player||b===S.player){news(msg,'war');if(b===S.player)toast(msg,'war');}else addLog(msg,'war');
 alliesOf(b).forEach(c=>{if(c===a||atWar(c,a)||isAlly(c,a)||inTruce(c,a))return;S.war[key(c,a)]={t:S.turn,sc:{[a]:0,[c]:0}};
  const m2=`${fname(c)}, müttefiki ${fname(b)} için ${fname(a)} ile savaşa girdi.`;if(c===S.player||a===S.player)news(m2,'war');else addLog(m2,'war');});
}
function makePeace(a,b,silent){delete S.war[key(a,b)];S.truce[key(a,b)]=S.turn+12;addOp(a,b,15);pruneOffers();
 const m=`${fname(a)} ile ${fname(b)} arasında barış imzalandı.`;if(a===S.player||b===S.player)news(m,'good');else if(!silent)addLog(m,'info');}
function offerOk(o){const w=alive(o.f)&&S.war[key(o.f,S.player)];return !!w&&(o.wt==null||o.wt===w.t);}
function pruneOffers(){if(S.offers)S.offers=S.offers.filter(offerOk);}
function warScore(a,b){const w=S.war[key(a,b)];return w?(w.sc[a]||0)-(w.sc[b]||0):0;}
function aiWantsPeace(ai,other){const w=S.war[key(ai,other)];if(!w)return false;const dur=S.turn-w.t,ws=warScore(ai,other);
 const ra=strength(ai),ro=strength(other);if(ws<=-2)return true;if(ra<ro*.55)return true;if(dur>=16&&ws<3)return Math.random()<.5;return false;}
function aiAcceptPeace(ai,pl){const w=S.war[key(ai,pl)];if(!w)return false;const dur=S.turn-w.t,ws=warScore(ai,pl);
 if(ws<=-1)return true;if(strength(ai)<strength(pl)*.75)return true;if(dur>=10&&ws<=2)return true;return false;}
function aiAcceptTribute(ai,pl){const ws=warScore(ai,pl);return tributeAmt(ai)>=10&&(ws<=-4||strength(ai)<strength(pl)*.4);}
function tributeAmt(ai){const g=Math.max(0,Math.floor(S.fac[ai].gold));return Math.min(g,Math.max(20,Math.round(Math.min(g*.7,30+devSum(ai)*2))));}
function aiAcceptAlliance(ai,pl){if(atWar(ai,pl)||inTruce(ai,pl)&&getOp(ai,pl)<20)return false;const o=getOp(ai,pl);
 const common=warsOf(ai).some(e=>atWar(pl,e));return o>=40||(o>=10&&common);}

/* ---------------- battles ---------------- */
function battle(from,to,n){
 const A=S.prov[from],D=S.prov[to],att=A.o,def=D.o;if(att===def||!atWar(att,def)||!PD[from].adj.includes(to))return null;n=Math.min(n,avail(from));if(n<=0)return null;
 A.t-=n;
 const aP=atkPower(n,att)*rnd(.85,1.2),dP=defPower(to,att)*rnd(.85,1.2),r=aP/dP,defT=D.t;
 const rep={from,to,att,def,n,defT,turn:S.turn,win:false,aLoss:0,dLoss:0};
 const w=S.war[key(att,def)];
 if(r>1){
  const aLoss=Math.round(n*clamp(.3/r,.04,.3)/100)*100;const dLoss=Math.round(defT*.65/100)*100;const flee=defT-dLoss;
  if(flee>0){const ret=PD[to].adj.filter(j=>S.prov[j].o===def);if(ret.length){const j=ret[Math.floor(Math.random()*ret.length)];S.prov[j].t+=flee;S.prov[j].mv+=flee;rep.retreat=j;}}
  const wasCap=S.fac[def].cap===to;
  D.t=0;D.mv=0;capture(to,att);D.t=n-aLoss;D.mv=D.t;
  rep.win=true;rep.aLoss=aLoss;rep.dLoss=defT;if(w){w.sc[att]=(w.sc[att]||0)+2+(wasCap?3:0);}
 }else{
  const aLoss=Math.round(n*clamp(.55-.25*r,.25,.55)/100)*100,dLoss=Math.min(defT,Math.round(defT*clamp(.3*r,.03,.3)/100)*100);
  D.t-=dLoss;const back=n-aLoss;A.t+=back;A.mv+=back;
  if(D.fort>0&&r>.8&&Math.random()<.3){D.fort--;rep.fortDmg=true;}
  rep.aLoss=aLoss;rep.dLoss=dLoss;if(w)w.sc[def]=(w.sc[def]||0)+1;
 }
 S.battles.push(rep);if(S.battles.length>60)S.battles.shift();
 if(att===S.player||def===S.player){S.report=S.report||[];S.report.push(rep);
  if(att===S.player){rep.win?S.stats.won++:S.stats.lost++;}else{rep.win?S.stats.lost++:S.stats.won++;}}
 polDirty=true;return rep;
}
function capture(i,f){
 const p=S.prov[i],old=p.o;p.o=f;p.un=8;p.mv=0;if(p.fort>1)p.fort--;
 S.fac[f].gold+=p.dev*4;if(f===S.player)S.stats.taken++;
 const d=PD[i];
 if(S.fac[old].cap===i){const rest=facProvs(old);if(rest.length){rest.sort((a,b)=>S.prov[b].dev-S.prov[a].dev);S.fac[old].cap=rest[0];}
  S.fac[old].gold=Math.round(S.fac[old].gold*.7);
  const m=`${fname(old)} başkenti ${d.name}, ${fname(f)} eline geçti!`;(old===S.player||f===S.player)?news(m,'cap'):addLog(m,'cap');}
 if(old===S.player&&f!==S.player)addLog(`${d.name} eyaletini ${fname(f)} kuvvetlerine kaptırdık.`,'war');
 if(!facProvs(old).length)eliminate(old,f);
 if(d.key==='istanbul'){
  if(f==='OSM'&&!S.flags.fetih){S.flags.fetih=1;S.fac.OSM.cap=i;p.dev+=1;p.un=2;
   news('Konstantiniyye fethedildi! Osmanlı başkenti İstanbul\'a taşındı.','cap');
   queueModal(()=>eventModal({t:'Konstantiniyye Fethedildi',e:`${dateStr(S.turn)}`,d:'Theodosius surları aşıldı. Bin yıllık Doğu Roma başkenti artık Osmanlı\'nın. Genç sultana "Fatih" unvanı veriliyor ve devlet merkezi İstanbul\'a taşınıyor.',ch:[{l:'Devam et'}]}));}
  else if(old!==f){news(`Konstantiniyye el değiştirdi: şehir artık ${fname(f)} elinde.`,'cap');}
 }
 polDirty=true;
}
function eliminate(f,by){const F=S.fac[f];F.alive=false;
 Object.keys(S.war).forEach(k=>{if(k.split('|').includes(f))delete S.war[k];});
 Object.keys(S.ally).forEach(k=>{if(k.split('|').includes(f))delete S.ally[k];});
 S.offers=S.offers.filter(o=>o.f!==f);
 news(`${FAC[f].n} tarih sahnesinden silindi. Son topraklarını ${fname(by)} aldı.`,'cap');
 if(f===S.player){S.over='lose';}
}

