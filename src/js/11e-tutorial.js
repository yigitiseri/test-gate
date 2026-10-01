/* =====================================================================
   TUTORIAL ENGINE (Track D): coach marks driven by TUT_STEPS, state in S.tut={step,done,off}.
   Step: {id, text, sel?:'css selector' | at?():[screenX,screenY] (map point), done(S,x):bool, only?(S):bool (realm filter),
          need?(S):null|{text,sel?,at?} (what to show while the step's context is missing),
          panel?:true (target lives in the province sheet: open it far enough to be seen)}
   x = {seen:Set of data-acts clicked this session, turn0: S.turn when the step became current}.
   The overlay never takes taps except its own "Dersi geç" button. Menu: skip / restart.
   Once finished or skipped, new games start without it (localStorage 'ke-tut').
   ===================================================================== */
const tutSeen=new Set();let tutTurn0=null,tutIdx=-1,tutTimer=0,tutKey='';
const tutCap=()=>S.fac[S.player].cap;
const tutAtProv=i=>()=>{const d=PD[i];const p=pj(d.lx,d.ly);return p[2]===false?null:[p[0],p[1]];};
const tutOwnSel=()=>sel>=0&&S.prov[sel]&&S.prov[sel].o===S.player;
const tutOsm=S=>S.player==='OSM';
const tutNotOsm=S=>S.player!=='OSM';
TUT_STEPS.push(
 {id:'select',only:tutNotOsm,text:lng('Hoş geldin Sultanım. Önce başkentine dokun: eyaletin bilgileri ve emirlerin açılır.','Welcome, my lord. First, tap your capital: its details and your orders will open.'),at:()=>tutAtProv(tutCap())(),
  done:()=>tutOwnSel()},
 {id:'recruit',only:tutNotOsm,panel:true,sel:'#panel [data-act="rec1"]',text:lng('Buradan asker toplarsın. Her 1.000 asker biraz altın ve insan gücü ister. Şimdi bir alay topla.','Here you raise troops. Every thousand men costs some gold and manpower. Raise a regiment now.'),
  need:()=>tutOwnSel()?null:{text:lng('Asker toplamak için kendi eyaletlerinden birine dokun.','To raise troops, tap one of your own provinces.'),at:tutAtProv(tutCap())},
  done:(S,x)=>x.seen.has('rec1')||x.seen.has('rec5')},
 {id:'diplo',only:tutNotOsm,sel:'#navTabs [data-act="diplo"]',text:lng('Divan-ı Hümayun: savaş ilan eder, barış ister, ittifak kurarsın. Bir göz at.','The Imperial Divan: here you declare war, sue for peace and make alliances. Take a look.'),
  done:(S,x)=>x.seen.has('diplo')},
 {id:'end',only:tutNotOsm,sel:'#endTurn',text:lng('Hazırsan turu bitir. Diğer devletler hamlelerini yapar, mevsim değişir ve vezirin sana raporunu sunar.','When you are ready, end the turn. The other realms make their moves, the season changes and your vizier brings you his report.'),
  done:(S,x)=>S.turn>x.turn0}
);
/* ---------- "Fetih": the Ottoman lesson, from Edirne to the peace table (about six seasons) ---------- */
const tutIst=()=>PK.istanbul;
const tutBy='BYZ';
/** The Ottoman army to guide: the selected one, else the one closest to Constantinople (then the largest). */
function tutArmy(){const L=S.armies?S.armies.filter(a=>a.f===S.player&&a.st!=='siege'):[];const s=selArmy!=null&&L.find(a=>a.id===selArmy);if(s)return s;
 const d=a=>{const p=armyPath(a.id,tutIst());return p?p.length:99;};return L.sort((x,y)=>d(x)-d(y)||y.n-x.n)[0]||null;}
const tutArmySel=()=>{const a=selArmy!=null&&armyById(selArmy);return !!(a&&a.f===S.player);};
/** One of our armies stands next to (or inside) Constantinople. */
const tutAtWalls=()=>{const i=tutIst();return !!(S.armies&&S.armies.some(a=>a.f===S.player&&(a.loc===i||PD[i].adj.includes(a.loc))));};
/** The siege of Constantinople has begun (Track B), or the city was attacked or taken (before sieges existed). */
const tutSieged=()=>{const i=tutIst(),sg=typeof siegeAt==='function'&&siegeAt(i),c=S.prov[i].ctl||S.prov[i].o;
 return !!(sg&&sg.f===S.player)||c===S.player||S.battles.some(b=>b.att===S.player&&b.to===i);};
/** Next stop of our army on the road to Constantinople this season (the city itself when it is in reach). */
function tutWaypoint(){const a=tutArmy(),i=tutIst();if(!a)return i;const p=armyPath(a.id,i);if(!p||!p.length)return i;return p[Math.max(0,Math.min(a.mp||0,p.length)-1)];}
/** Shared hints: select an army first; an army that has marched waits for the next season. */
function tutArmyNeed(){if(!tutArmySel())return {text:lng('Önce ordunu seç (halka şehre en yakın orduyu gösteriyor): haritadaki sancağına ya da eyaletin panelindeki orduya dokun.','First select your army (the ring shows the one closest to the city): tap its banner on the map, or the army in the province panel.'),at:()=>{const a=tutArmy();return a?tutAtProv(a.loc)():null;}};
 const a=armyById(selArmy);if(a&&a.mp<=0&&a.st!=='siege')return {text:lng('Bu ordu bu mevsimlik yolunu yürüdü. Turu bitir; yeni mevsimde yürüyüşe devam eder.','This army has marched as far as it can this season. End the turn; it marches on in the new season.'),sel:'#endTurn'};
 return null;}
TUT_STEPS.push(
 {id:'f-select',only:tutOsm,text:lng('Hoş geldin Sultanım. Yıl 1451, taht Edirne\'de. Önce başkentin Edirne\'ye dokun: eyaletin bilgileri ve emirlerin açılır.','Welcome, my Sultan. The year is 1451 and the throne stands in Adrianople. First tap your capital, Adrianople: its details and your orders will open.'),at:()=>tutAtProv(tutCap())(),
  done:()=>tutOwnSel()},
 {id:'f-recruit',only:tutOsm,panel:true,sel:'#panel [data-act="rec1"]',text:lng('Konstantiniyye surları büyük bir ordu ister. Buradan asker topla: yeni alaylar bu eyaletteki orduya katılır.','The walls of Constantinople call for a great army. Raise troops here: new regiments join the army standing in this province.'),
  need:()=>tutOwnSel()?null:{text:lng('Asker toplamak için kendi eyaletlerinden birine dokun.','To raise troops, tap one of your own provinces.'),at:tutAtProv(tutCap())},
  done:(S,x)=>x.seen.has('rec1')||x.seen.has('rec5')},
 {id:'f-war',only:tutOsm,panel:true,sel:'#panel [data-act="dwar"]',text:lng('Şimdi Bizans\'a savaş ilan et. Emin misin diye sorarım: düğmeye iki kez bas.','Now declare war on Byzantium. I will ask whether you are sure: press the button twice.'),
  need:()=>sel===tutIst()?null:{text:lng('Konstantiniyye\'ye dokun: Bizans\'ın başkenti ve bin yıllık surları orada.','Tap Constantinople: the capital of Byzantium and its thousand-year-old walls are there.'),at:()=>tutAtProv(tutIst())()},
  done:()=>atWar(S.player,tutBy)||!alive(tutBy)},
 {id:'f-march',only:tutOsm,text:lng('Ordunu surlara yürüt: halkadaki eyalete dokun, sonra paneldeki Yürü düğmesine bas. Düşman toprağına giren ordu o mevsim orada durur.','March your army to the walls: tap the province in the ring, then press March in the panel. An army that enters enemy land stops there for the season.'),
  at:()=>tutAtProv(tutWaypoint())(),need:()=>tutArmyNeed(),
  done:()=>tutAtWalls()||tutSieged()||!alive(tutBy)},
 {id:'f-siege',only:tutOsm,text:lng('Konstantiniyye\'ye dokun ve Kuşat\'a bas. Ordun şehrin önüne kamp kurar; surlar her mevsim biraz daha yıkılır.','Tap Constantinople and press Besiege. Your army camps before the city, and every season the walls crumble a little more.'),
  at:()=>tutAtProv(tutIst())(),need:()=>tutArmyNeed(),
  done:()=>tutSieged()||!alive(tutBy)},
 {id:'f-hold',only:tutOsm,sel:'#endTurn',text:lng('Kuşatma sürüyor. Şehrin üstündeki halka dolunca surlar düşer ve şehir senin işgaline girer. Toplar işi hızlandırır; kışın ise ordu hastalıktan erir. Turu bitir ve sabret.','The siege goes on. When the ring over the city fills, the walls fall and the city is yours to occupy. Cannon speed the work; in winter the army wastes away from sickness. End the turn and be patient.'),
  done:(S,x)=>S.turn>=x.turn0+2||!atWar(S.player,tutBy)||(S.prov[tutIst()].ctl||S.prov[tutIst()].o)===S.player},
 {id:'f-peace',only:tutOsm,sel:'#navTabs [data-act="diplo"]',text:lng('Savaş ancak barışla kazanılır: işgal ettiğin topraklar, barış masasında istersen senin olur. Divan\'ı aç ve Bizans\'la barış masasına otur.','A war is only won at the peace: the lands you occupy become yours if you demand them at the peace table. Open the Divan and sit down with Byzantium.'),
  done:(S,x)=>x.seen.has('pt-send')||x.seen.has('dp-peace')||!atWar(S.player,tutBy)}
);
/** The lessons of this game: the steps whose `only` filter fits the player's realm. */
function tutList(){return TUT_STEPS.filter(st=>!st.only||st.only(S));}
function tutActive(){return !!(S&&S.player&&S.tut&&!S.tut.done&&!S.tut.off&&!S.over);}
const tutFinished=()=>{try{return localStorage.getItem('ke-tut')==='done';}catch(e){return false;}};
const tutRemember=()=>{try{localStorage.setItem('ke-tut','done');}catch(e){}};
hook('newGame',(S,player)=>{if(player)S.tut=tutFinished()?null:{step:0,done:false,off:false};},60);
/** Advance past every finished step; returns the current step or null. */
function tutStep(){if(!tutActive())return null;const TL=tutList();
 for(let g=0;g<TL.length+1;g++){const k=S.tut.step;if(k>=TL.length){S.tut.done=true;tutRemember();tutIdx=-1;
   toast(lng('Vezir: İlk dersler tamam. Bundan sonrası senin hikmetine kalmış; yardım gerekirse Rehber\'e bak.','Vizier: The first lessons are done. The rest is left to your wisdom; if you need help, look in the Guide.'),'good');SND.play('coin');return null;}
  const st=TL[k];if(tutIdx!==k){tutIdx=k;tutTurn0=S.turn;tutKey='';}
  let ok=false;try{ok=!!st.done(S,{seen:tutSeen,turn0:tutTurn0});}catch(e){console.error('tut '+st.id,e);ok=true;}
  if(!ok)return st;S.tut.step=k+1;}
 return null;}
(()=>{const h=$('#hud');if(!h)return;h.insertAdjacentHTML('beforeend',`<div id="tutRing" class="tut-ring" hidden></div><div id="tutBub" class="tut-bub" role="dialog" aria-live="polite" hidden><div class="tut-e"></div><p class="tut-t"></p><button class="tut-x" data-act="tut-skip">${lng('Dersi geç','Skip lesson')}</button><i class="tut-arrow"></i></div>`);})();
function tutVisible(el){if(!el||!el.isConnected)return null;const r=el.getBoundingClientRect();if(r.width<2||r.height<2)return null;
 const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')return null;return r;}
/** Draw the coach mark for the current step (or hide it). */
function tutRender(){const ring=$('#tutRing'),bub=$('#tutBub');if(!ring)return;
 const st=tutStep();const modal=!$('#modal').hidden,start=!$('#start').hidden;
 if(!st||modal||start||busy){ring.hidden=true;bub.hidden=true;if(!st)tutStop();return;}
 let text=st.text,qs=st.sel,at=st.at;const nd=st.need&&st.need(S);if(nd){text=nd.text;qs=nd.sel;at=nd.at;}
 let r=null,pt=null;
 if(qs){const el=document.querySelector(qs);
  if(el&&st.panel&&!nd&&uiPhone()){const pn=$('#panel'),pr=pn.getBoundingClientRect(),er=el.getBoundingClientRect();
   if(tutKey!==st.id&&(er.bottom>pr.bottom-4||er.top<pr.top)){tutKey=st.id;if(uiSheetCur==='peek')uiSheetSet('half');el.scrollIntoView({block:'nearest'});}}
  r=tutVisible(el);}
 else if(at){pt=at();if(pt&&(pt[0]<0||pt[1]<topH()||pt[0]>innerWidth||pt[1]>innerHeight))pt=null;if(pt)r={left:pt[0]-24,top:pt[1]-24,width:48,height:48,right:pt[0]+24,bottom:pt[1]+24};}
 const TL=tutList(),k=TL.indexOf(st);bub.querySelector('.tut-e').textContent=lng(`Vezirin dersi · ${k+1} / ${TL.length}`,`The Vizier's lesson · ${k+1} / ${TL.length}`);bub.querySelector('.tut-t').textContent=text;
 bub.hidden=false;bub.dataset.step=st.id;
 if(r){const pad=pt?0:5;ring.hidden=false;ring.classList.toggle('dot',!!pt);Object.assign(ring.style,{left:r.left-pad+'px',top:r.top-pad+'px',width:r.width+2*pad+'px',height:r.height+2*pad+'px'});}
 else ring.hidden=true;
 const bw=bub.offsetWidth,bh=bub.offsetHeight,m=10,th=topH();let x,y,below;
 const stop=uiSheetTop(),inSheet=r&&qs&&stop!=null&&!!document.querySelector(qs).closest('#panel');
 if(inSheet){x=(innerWidth-bw)/2;y=Math.max(th+m,stop-bh-12);bub.classList.remove('up','down');}
 else if(r){const cx=r.left+r.width/2;x=clamp(cx-bw/2,m,innerWidth-bw-m);below=r.top+r.height/2<(th+innerHeight)/2;
  y=below?r.bottom+14:r.top-bh-14;y=clamp(y,th+m,innerHeight-bh-m);
  const ax=clamp(cx-x,16,bw-16);bub.style.setProperty('--ax',ax+'px');bub.classList.toggle('up',below);bub.classList.toggle('down',!below);}
 else{x=(innerWidth-bw)/2;const sh=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sheeth'))||0;y=innerHeight-sh-bh-(uiPhone()?70:90);y=Math.max(th+m,y);bub.classList.remove('up','down');}
 bub.style.left=Math.round(x)+'px';bub.style.top=Math.round(y)+'px';
 if(!tutTimer)tutTimer=setInterval(tutRender,400);}
function tutStop(){clearInterval(tutTimer);tutTimer=0;const ring=$('#tutRing'),bub=$('#tutBub');if(ring){ring.hidden=true;bub.hidden=true;}}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-act]');if(!t||t.disabled)return;tutSeen.add(t.dataset.act);if(tutActive())setTimeout(tutRender,0);});
hook('renderAll',()=>{if(tutActive())tutRender();else tutStop();});
hook('enterGame',()=>{tutIdx=-1;if(tutActive())tutRender();else tutStop();});
new MutationObserver(()=>{if(tutActive())tutRender();}).observe($('#modal'),{attributes:true,attributeFilter:['hidden']});
ACTS['tut-skip']=()=>{if(S&&S.tut){S.tut.off=true;}tutRemember();tutStop();toast(lng('Dersler kapandı. Menüden yeniden başlatabilirsin.','Lessons turned off. You can restart them from the Menu.'));if(typeof uiAdvRender==='function')uiAdvRender();save();};
ACTS['tut-restart']=()=>{S.tut={step:0,done:false,off:false};tutIdx=-1;tutSeen.clear();closeModal();try{localStorage.removeItem('ke-tut');}catch(e){}renderAll();};
MENU_SECTIONS.push({id:'tutorial',order:30,html:()=>`<div class="sec"><h3>${lng('Vezirin dersleri',"The Vizier's lessons")}</h3><div class="acts">${tutActive()?`<button class="btn" data-act="tut-skip">${lng('Dersi geç','Skip lesson')}</button>`:`<button class="btn" data-act="tut-restart">${lng('Dersleri baştan başlat','Restart the lessons')}</button>`}</div></div>`});
KE.tut=()=>{const TL=S&&S.player?tutList():[],st=tutActive()?TL[S.tut.step]:null;return {active:tutActive(),step:S&&S.tut?S.tut.step:null,id:st?st.id:null,n:TL.length};};
