/* ---------------- turn flow ---------------- */
function endRound(){
 FK.forEach(f=>{const F=S.fac[f];if(!F.alive)return;const inc=income(f),up=upkeep(f);F.gold+=inc-up;
  const ds=devSum(f);F.mp=Math.min(ds*800,F.mp+ds*110);
  if(F.gold<0){for(let i=0;i<NP;i++){const p=S.prov[i];if(p.o===f)p.t=Math.round(p.t*.9/100)*100;}F.gold=0;
   if(f===S.player)news('Hazine boş: maaşını alamayan askerler firar ediyor (ordu −10%).','war');}});
 for(let i=0;i<NP;i++){const p=S.prov[i];if(p.un>0)p.un--;p.mv=0;}
 for(let a=0;a<FK.length;a++)for(let b=a+1;b<FK.length;b++){const k=key(FK[a],FK[b]),bo=baseOp(FK[a],FK[b]),v=S.op[k]||0;if(v<bo)S.op[k]=v+1;else if(v>bo)S.op[k]=v-1;}
 S.turn++;
 historic();
}
function historic(){
 const t=S.turn;
 if(t===8&&alive('OSM')){S.fac.OSM.cannon=1;news('Macar dökümcü Urban, Osmanlı için dev toplar döktü. Osmanlı ordusu kale surlarını artık çok daha kolay aşıyor.','cap');
  if(S.player==='OSM')queueModal(()=>eventModal({t:'Urban\'ın Topları',e:dateStr(t),d:'Macar dökümcü Urban, Edirne\'de şimdiye dek görülmemiş büyüklükte toplar döktü. Ordunun karşısında kale surları eskisi kadar güçlü değil.',ch:[{l:'Surlara karşı yürü'}]}));}
 if(t===20)news('Gökyüzünde parlak bir kuyruklu yıldız göründü. Kimisi uğursuzluk, kimisi zafer diyor.');
 if(t===36){FK.forEach(f=>{if(S.fac[f].alive)S.fac[f].cannon=1;});news('Barut çağı: Artık bütün ordular kuşatma topları kullanıyor.','cap');}
 if(t===164)news('Uzak batıda Kolomb adlı bir denizci okyanusun ötesinde yeni topraklar buldu. Endülüs\'te Gırnata düştü.');
 if(t===200)spawnSafavid();
}
function spawnSafavid(){
 const tb=PK.tebriz,old=S.prov[tb].o;if(old==='SAF')return;
 const take=new Set([tb]);let fr=[tb];for(let d=0;d<2;d++){const nx=[];fr.forEach(i=>PD[i].adj.forEach(j=>{if(S.prov[j].o===old&&!take.has(j)){take.add(j);nx.push(j);}}));fr=nx;}
 if(old===S.player){[...take].forEach(i=>{if(S.fac[old].cap===i)take.delete(i);});}
 if(!take.size)return;const F=S.fac.SAF;F.alive=true;F.gold=150;F.mp=20000;F.cannon=1;
 take.forEach(i=>{const p=S.prov[i];p.o='SAF';p.t+=3500;p.un=0;});F.cap=take.has(tb)?tb:[...take].sort((a,b)=>S.prov[b].dev-S.prov[a].dev)[0];
 FK.forEach(g=>{if(g!=='SAF')S.op[key('SAF',g)]=baseOp('SAF',g);});
 if(S.fac[old].alive&&!facProvs(old).length)eliminate(old,'SAF');
 if(S.fac[old].alive){S.fac[old].cap=facProvs(old).includes(S.fac[old].cap)?S.fac[old].cap:facProvs(old)[0];S.war[key('SAF',old)]={t:S.turn,sc:{SAF:0,[old]:0}};}
 const hasTb=take.has(tb);
 news(hasTb?`Şah İsmail Tebriz\'de taç giydi. Kızılbaş Safevî devleti ${fname(old)} topraklarında doğdu.`:`Şah İsmail ${PD[F.cap].name} merkezli bir ayaklanmayla taç giydi. Kızılbaş Safevî devleti ${fname(old)} topraklarında doğdu; Tebriz hâlâ ${fname(old)} elinde.`,'cap');polDirty=true;
 if(old===S.player&&S.fac[old].alive)queueModal(()=>eventModal({t:'Kızılbaş Ayaklanması',e:dateStr(S.turn),d:`Şah İsmail'in müritleri ${take.size} eyalette ayaklandı ve Safevî devletini kurdu. ${hasTb?'Tebriz düştü':'Tebriz surları dayandı, ama çevresindeki eyaletler elden çıktı'}; Safevîler sana savaş açtı.`,ch:[{l:'Kılıçlar kınından çıksın'}]}));
}
function checkMissions(){
 if(!S.player)return;const pl=S.player;
 S.mis.forEach((m,k)=>{if(S.misDone[k])return;let ok=false;
  if(m.own)ok=m.own.every(x=>S.prov[PK[x]].o===pl);
  else if(m.count)ok=facProvs(pl).length>=m.count;
  else if(m.gold)ok=S.fac[pl].gold>=m.gold;
  else if(m.hold)ok=S.turn>=m.until&&S.prov[PK[m.hold]].o===pl;
  if(ok){S.misDone[k]=S.turn;S.fac[pl].gold+=m.g||0;
   if(m.dev){const pi=m.dev[0]==='cap'?S.fac[pl].cap:PK[m.dev[0]];if(S.prov[pi].o===pl)S.prov[pi].dev+=m.dev[1];}
   news(`Hedef tamamlandı: ${m.t}${m.g?` (+${m.g} altın)`:''}`,'good');toast(`✦ ${m.t} tamamlandı`,'good');SND.play('fanfare');}});
}
function score(f){const ps=facProvs(f);return ps.length*10+ps.reduce((a,i)=>a+S.prov[i].dev*3,0)+Object.keys(S.misDone).length*(f===S.player?60:0)+Math.floor(S.fac[f].gold/10);}

let busy=false;
function endTurn(){
 if(busy||!S||S.over)return;busy=true;$('#endTurn').disabled=true;clearSel();SND.play('turn');
 $('#endTurn').textContent='Hamleler…';
 setTimeout(()=>{
  S.news=[];S.report=[];pruneOffers();
  const order=FK.filter(f=>f!==S.player&&alive(f));for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  order.forEach(aiTurn);
  endRound();
  checkMissions();
  if(!S.over){const n=facProvs(S.player).length;if(n>=Math.ceil(NP*.5))S.over='win';else if(S.turn>=END_TURN)S.over='time';}
  if(!S.over&&S.turn>1&&Math.random()<.3)randomEvent();
  save();polDirty=true;renderAll();
  S.battles.filter(b=>b.turn===S.turn-1).slice(-30).forEach((b,k)=>{const me=b.att===S.player||b.def===S.player;
   if(me)addFx({type:'march',a:b.from,b:b.to,dur:420,delay:k*140,col:FAC[b.att].c});
   addFx({type:'boom',p:b.to,dur:1300,delay:k*140+(me?400:0),seed:k*1.7,label:b.def===S.player?(b.win?'Kaybedildi':'Savunuldu'):'',good:b.def===S.player&&!b.win});});
  $('#endTurn').textContent=S.over?'Oyun bitti':'Turu Bitir';$('#endTurn').disabled=false;busy=false;
  if(S.over){queueModal(showEnd);return;}
  if(S.news.some(n=>n.k==='war'))setTimeout(()=>SND.play('war'),600);else if(S.report.length)setTimeout(()=>SND.play('battle',{}),500);
  if(S.report.length||S.news.length||S.offers.length)queueModal(showReport);
 },30);
}

/* ---------------- random events ---------------- */
function randomEvent(seed){
 const f=S.player,F=S.fac[f],mine=facProvs(f);if(!mine.length){delete S.pendEv;return;}if(seed==null)seed=Math.floor(Math.random()*2147483647);S.pendEv=seed;
 let rs=seed>>>0;const rng=()=>{rs=(rs+0x6D2B79F5)>>>0;let t=rs;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};const pick=a=>a[Math.floor(rng()*a.length)];
 const isM=FAC[f].rel==='İslam';const p=pick(mine),pn=PD[p].name;const un=mine.filter(i=>S.prov[i].un>0);
 const ev=[
  {w:3,t:isM?'İpek Yolu Kervanı':'Levanten Tüccarlar',d:isM?'Doğudan gelen zengin bir kervan pazarlarında konakladı. Gümrük emini seni bekliyor.':'Venedikli ve Cenevizli tüccarlar limanlarında ticaret izni istiyor.',
   ch:[{l:`Gümrük al (+${Math.round(20+devSum(f)*.3)} altın)`,f:()=>{F.gold+=Math.round(20+devSum(f)*.3);}}]},
  {w:2,t:'Veba Salgını',d:`${pn} eyaletinde kara ölüm baş gösterdi. Hekimler karantina istiyor.`,
   ch:[{l:'Karantina uygula (−30 altın, garnizon −10%)',dis:F.gold<30,f:()=>{F.gold-=30;S.prov[p].t=Math.round(S.prov[p].t*.9/100)*100;}},{l:'Kaderine bırak (gelişmişlik −1, garnizon −35%)',f:()=>{S.prov[p].dev=Math.max(1,S.prov[p].dev-1);S.prov[p].t=Math.round(S.prov[p].t*.65/100)*100;}}]},
  {w:3,t:'Bereketli Hasat',d:'Ambarlar doldu, köylerden gelen gençler orduya yazılmak istiyor.',ch:[{l:`Ambarları sat (+${Math.round(15+devSum(f)*.2)} altın)`,f:()=>{F.gold+=Math.round(15+devSum(f)*.2);}},{l:'Gönüllüleri al (+6000 insan gücü)',f:()=>{F.mp+=6000;}}]},
  {w:2,t:isM?'Gezgin Âlim':'Hümanist Bilgin',d:isM?'Semerkant\'tan gelen ünlü bir âlim başkentinde medrese açmak istiyor.':'İtalya\'dan gelen bir bilgin başkentinde kütüphane kurmak istiyor.',
   ch:[{l:'Himaye et (−40 altın, başkent +1 gelişmişlik)',dis:F.gold<40,f:()=>{F.gold-=40;S.prov[F.cap].dev++;}},{l:'Nazikçe geri çevir'}]},
  {w:2,t:isM?'Akıncı Beyleri':'Paralı Askerler',d:isM?'Sınır boylarından akıncı beyleri hizmet teklif ediyor.':'Bir condottiere bölüğü ücret karşılığı hizmet teklif ediyor.',
   ch:[{l:'Kirala (−70 altın, başkente +4000 asker)',dis:F.gold<70,f:()=>{F.gold-=70;S.prov[F.cap].t+=4000;}},{l:'Gerek yok'}]},
  {w:1,t:'Deprem',d:`${pn} sarsıldı; kale burçlarında çatlaklar var.`,ch:[{l:'Hemen onar (−35 altın)',dis:F.gold<35,f:()=>{F.gold-=35;}},{l:'Bekle (kale −1)',f:()=>{S.prov[p].fort=Math.max(0,S.prov[p].fort-1);}}]},
  {w:S.turn%4===3?3:0,t:'Sert Kış',d:'Yollar karla kapandı, köylerde kıtlık var.',ch:[{l:'Ambarları aç (−25 altın)',dis:F.gold<25,f:()=>{F.gold-=25;}},{l:'Dayanın (insan gücü −30%)',f:()=>{F.mp=Math.round(F.mp*.7);}}]}
 ];
 if(un.length){const q=pick(un);ev.push({w:4,t:'Ayaklanma',d:`Yeni fethedilen ${PD[q].name} halkı vergilere karşı ayaklandı.`,ch:[{l:'Bastır (garnizon −25%)',f:()=>{S.prov[q].t=Math.round(S.prov[q].t*.75/100)*100;S.prov[q].un=Math.max(0,S.prov[q].un-3);}},{l:'Vergi affı ilan et (−40 altın, huzursuzluk biter)',dis:F.gold<40,f:()=>{F.gold-=40;S.prov[q].un=0;}}]});}
 const fr=FK.filter(g=>g!==f&&alive(g)&&!atWar(f,g));if(fr.length){const g=pick(fr);ev.push({w:2,t:`${FAC[g].s} Elçisi`,d:`${FAC[g].n} elçisi hediyelerle sarayına geldi.`,ch:[{l:'Hediyeleri kabul et (+30 altın)',f:()=>{F.gold+=30;}},{l:'Karşılık ver (−20 altın, ilişki +25)',dis:F.gold<20,f:()=>{F.gold-=20;addOp(f,g,25);}}]});}
 let tot=ev.reduce((a,e)=>a+e.w,0),r=rng()*tot;const e=ev.find(x=>(r-=x.w)<0)||ev[0];
 queueModal(()=>eventModal({...e,e:dateStr(S.turn),pend:1}));
}

