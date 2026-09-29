/* =====================================================================
   HISTORY (Track C): scripted historic events, Safavids, and the random
   event pool engine (EVENTS, filled by 06d-event-pool.js).
   EVENTS.push({id,w:number|(S,f)=>number,cd,once?,req?(S,f),build(ctx)->{t,d,ch:[{l,f?,dis?}]}|null})
   build() must only describe the event (no state changes); choices change state.
   ===================================================================== */
const BAL_EV={chance:.3,minCd:18};          // 30% a turn after turn 1; an event never repeats within 18 turns
const EVENTS=[];
function historic(){
 const t=S.turn;
 if(t===8&&alive('OSM')){S.fac.OSM.cannon=1;news(lng('Macar dökümcü Urban, Osmanlı için dev toplar döktü. Osmanlı ordusu kale surlarını artık çok daha kolay aşıyor.','The Hungarian gunfounder Urban has cast giant cannon for the Ottomans. The Ottoman army now breaks through fortress walls far more easily.'),'cap');
  if(S.player==='OSM')queueModal(()=>eventModal({t:lng('Urban\'ın Topları','Urban\'s Guns'),e:dateStr(t),d:lng('Macar dökümcü Urban, Edirne\'de şimdiye dek görülmemiş büyüklükte toplar döktü. Ordunun karşısında kale surları eskisi kadar güçlü değil.','The Hungarian gunfounder Urban has cast cannon at Adrianople larger than any seen before. Fortress walls no longer stand as strong against your army.'),ch:[{l:lng('Surlara karşı yürü','March on the walls')}]}));}
 if(t===20)news(lng('Gökyüzünde parlak bir kuyruklu yıldız göründü. Kimisi uğursuzluk, kimisi zafer diyor.','A bright comet has appeared in the sky. Some call it an ill omen, others a sign of victory.'));
 if(t===36){FK.forEach(f=>{if(S.fac[f].alive)S.fac[f].cannon=1;});news(lng('Barut çağı: Artık bütün ordular kuşatma topları kullanıyor.','The age of gunpowder: every army now brings siege guns.'),'cap');}
 if(t===164)news(lng('Uzak batıda Kolomb adlı bir denizci okyanusun ötesinde yeni topraklar buldu. Endülüs\'te Gırnata düştü.','Far to the west, a sailor named Columbus has found new lands beyond the ocean. In Andalusia, Granada has fallen.'));
 if(t===200)spawnSafavid();
}
function spawnSafavid(){
 const tb=PK.tebriz,old=S.prov[tb].o;if(old==='SAF')return;
 const take=new Set([tb]);let fr=[tb];for(let d=0;d<2;d++){const nx=[];fr.forEach(i=>PD[i].adj.forEach(j=>{if(S.prov[j].o===old&&!take.has(j)){take.add(j);nx.push(j);}}));fr=nx;}
 if(old===S.player){[...take].forEach(i=>{if(S.fac[old].cap===i)take.delete(i);});}
 if(!take.size)return;const F=S.fac.SAF;F.alive=true;F.gold=150;F.mp=20000;F.cannon=1;
 take.forEach(i=>{const p=S.prov[i];p.o='SAF';p.t+=3500;p.un=0;});F.cap=take.has(tb)?tb:[...take].sort((a,b)=>S.prov[b].dev-S.prov[a].dev)[0];
 if(S.c&&!chRuler('SAF'))chSeedFaction('SAF');
 FK.forEach(g=>{if(g!=='SAF')S.op[key('SAF',g)]=baseOp('SAF',g);});
 if(S.fac[old].alive&&!facProvs(old).length)eliminate(old,'SAF');
 if(S.fac[old].alive){S.fac[old].cap=facProvs(old).includes(S.fac[old].cap)?S.fac[old].cap:facProvs(old)[0];S.war[key('SAF',old)]=newWar('SAF',old);runHooks('warDeclared','SAF',old);}
 const hasTb=take.has(tb);
 news(hasTb?lng(`Şah İsmail Tebriz\'de taç giydi. Kızılbaş Safevî devleti ${fname(old)} topraklarında doğdu.`,`Shah Ismail has been crowned in Tabriz. The Qizilbash Safavid state is born in the lands of ${FAC[old].n}.`):lng(`Şah İsmail ${PD[F.cap].name} merkezli bir ayaklanmayla taç giydi. Kızılbaş Safevî devleti ${fname(old)} topraklarında doğdu; Tebriz hâlâ ${fname(old)} elinde.`,`Shah Ismail has been crowned at the head of an uprising around ${PD[F.cap].name}. The Qizilbash Safavid state is born in the lands of ${FAC[old].n}; Tabriz is still held by ${fname(old)}.`),'cap');polDirty=true;
 if(old===S.player&&S.fac[old].alive)queueModal(()=>eventModal({t:lng('Kızılbaş Ayaklanması','The Qizilbash Revolt'),e:dateStr(S.turn),d:lng(`Şah İsmail'in müritleri ${take.size} eyalette ayaklandı ve Safevî devletini kurdu. ${hasTb?'Tebriz düştü':'Tebriz surları dayandı, ama çevresindeki eyaletler elden çıktı'}; Safevîler sana savaş açtı.`,`The disciples of Shah Ismail have risen in ${take.size} provinces and founded the Safavid state. ${hasTb?'Tabriz has fallen':'The walls of Tabriz held, but the provinces around it are lost'}; the Safavids have declared war on you.`),ch:[{l:lng('Kılıçlar kınından çıksın','Draw your swords')}]}));
}

/* ---------------- event pool engine ---------------- */
/** Development for gold rewards, without the barracks multiplier (bug B5; devRaw comes from Track B). */
const evDev=f=>typeof devRaw==='function'?devRaw(f):(()=>{let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)s+=S.prov[i].dev;return s;})();
function evRng(seed){let rs=seed>>>0;return ()=>{rs=(rs+0x6D2B79F5)>>>0;let t=rs;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
/** Context handed to build(): deterministic from the seed and the current state. */
function evCtx(f,seed){const rng=evRng(seed),pick=a=>a[Math.floor(rng()*a.length)];const F=S.fac[f],mine=facProvs(f);const p=pick(mine);const d=evDev(f);
 return {f,F,rng,pick,mine,p,pn:PD[p].name,cap:F.cap,capn:PD[F.cap].name,isM:FAC[f].rel==='İslam',rel:FAC[f].rel,y:chYear(),
  small:Math.round(10+d*.15),mid:Math.round(20+d*.3),un:mine.filter(i=>S.prov[i].un>0)};}
function evWeight(e,f){const w=typeof e.w==='function'?e.w(S,f):e.w;return w>0?w:0;}
function evEligible(e,f){if(e.once&&S.evs[e.id]!=null)return false;const last=S.evs[e.id];
 if(last!=null&&S.turn-last<Math.max(e.cd||0,BAL_EV.minCd))return false;try{return !e.req||!!e.req(S,f);}catch(err){console.error('event req '+e.id,err);return false;}}
/** Fire pool event id for the player (records the cooldown; the question survives a reload). */
function evFire(id,seed){const e=EVENTS.find(x=>x.id===id);if(!e||!S.player)return false;if(seed==null)seed=Math.floor(R()*2147483647);
 const spec=CH_PEND.ev({id,seed});if(!spec)return false;S.evs[id]=S.turn;chAsk('ev',{id,seed});return true;}
CH_PEND.ev=({id,seed})=>{const e=EVENTS.find(x=>x.id===id);if(!e||!S.player||!facProvs(S.player).length)return null;
 const spec=e.build(evCtx(S.player,seed));if(!spec||!spec.ch||!spec.ch.length)return null;return spec;};
/** One random event from the pool for the player (weighted, cooldowns, requirements). */
function randomEvent(seed){delete S.pendEv;const f=S.player;if(!f||!facProvs(f).length)return;
 const L=EVENTS.filter(e=>evEligible(e,f)).map(e=>[e,evWeight(e,f)]).filter(x=>x[1]>0);if(!L.length)return;
 let r=R()*L.reduce((a,x)=>a+x[1],0);const e=(L.find(x=>(r-=x[1])<0)||L[0])[0];
 evFire(e.id,seed!=null?seed:undefined);}
hook('newTurn',()=>historic(),20);
hook('events',()=>{if(S.turn>1&&R()<BAL_EV.chance)randomEvent();},50);
KE.evFire=(id,seed)=>evFire(id,seed);
KE.EVENTS=EVENTS;
