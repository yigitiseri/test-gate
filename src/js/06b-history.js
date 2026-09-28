/* =====================================================================
   HISTORY (Track C): scripted historic events, Safavids, random events
   ===================================================================== */
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
 if(S.fac[old].alive){S.fac[old].cap=facProvs(old).includes(S.fac[old].cap)?S.fac[old].cap:facProvs(old)[0];S.war[key('SAF',old)]=newWar('SAF',old);runHooks('warDeclared','SAF',old);}
 const hasTb=take.has(tb);
 news(hasTb?`Şah İsmail Tebriz\'de taç giydi. Kızılbaş Safevî devleti ${fname(old)} topraklarında doğdu.`:`Şah İsmail ${PD[F.cap].name} merkezli bir ayaklanmayla taç giydi. Kızılbaş Safevî devleti ${fname(old)} topraklarında doğdu; Tebriz hâlâ ${fname(old)} elinde.`,'cap');polDirty=true;
 if(old===S.player&&S.fac[old].alive)queueModal(()=>eventModal({t:'Kızılbaş Ayaklanması',e:dateStr(S.turn),d:`Şah İsmail'in müritleri ${take.size} eyalette ayaklandı ve Safevî devletini kurdu. ${hasTb?'Tebriz düştü':'Tebriz surları dayandı, ama çevresindeki eyaletler elden çıktı'}; Safevîler sana savaş açtı.`,ch:[{l:'Kılıçlar kınından çıksın'}]}));
}
/* ---------------- random events ---------------- */
function randomEvent(seed){
 const f=S.player,F=S.fac[f],mine=facProvs(f);if(!mine.length){delete S.pendEv;return;}if(seed==null)seed=Math.floor(R()*2147483647);S.pendEv=seed;
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

hook('newTurn',()=>historic(),20);
hook('events',()=>{if(S.turn>1&&R()<.3)randomEvent();},50);
