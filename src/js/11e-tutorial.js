/* =====================================================================
   TUTORIAL ENGINE (Track D): coach marks driven by TUT_STEPS, state in S.tut={step,done,off}.
   Step: {id, text, sel?:'css selector' | at?():[screenX,screenY] (map point), done(S,x):bool,
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
TUT_STEPS.push(
 {id:'select',text:'Hoş geldin Sultanım. Önce başkentine dokun: eyaletin bilgileri ve emirlerin açılır.',at:()=>tutAtProv(tutCap())(),
  done:()=>tutOwnSel()},
 {id:'recruit',panel:true,sel:'#panel [data-act="rec1"]',text:'Buradan asker toplarsın. Her 1.000 asker biraz altın ve insan gücü ister. Şimdi bir alay topla.',
  need:()=>tutOwnSel()?null:{text:'Asker toplamak için kendi eyaletlerinden birine dokun.',at:tutAtProv(tutCap())},
  done:(S,x)=>x.seen.has('rec1')||x.seen.has('rec5')},
 {id:'diplo',sel:'#navTabs [data-act="diplo"]',text:'Divan-ı Hümayun: savaş ilan eder, barış ister, ittifak kurarsın. Bir göz at.',
  done:(S,x)=>x.seen.has('diplo')},
 {id:'end',sel:'#endTurn',text:'Hazırsan turu bitir. Diğer devletler hamlelerini yapar, mevsim değişir ve vezirin sana raporunu sunar.',
  done:(S,x)=>S.turn>x.turn0}
);
function tutActive(){return !!(S&&S.player&&S.tut&&!S.tut.done&&!S.tut.off&&!S.over);}
const tutFinished=()=>{try{return localStorage.getItem('ke-tut')==='done';}catch(e){return false;}};
const tutRemember=()=>{try{localStorage.setItem('ke-tut','done');}catch(e){}};
hook('newGame',(S,player)=>{if(player)S.tut=tutFinished()?null:{step:0,done:false,off:false};},60);
/** Advance past every finished step; returns the current step or null. */
function tutStep(){if(!tutActive())return null;
 for(let g=0;g<TUT_STEPS.length+1;g++){const k=S.tut.step;if(k>=TUT_STEPS.length){S.tut.done=true;tutRemember();tutIdx=-1;
   toast('Vezir: İlk dersler tamam. Bundan sonrası senin hikmetine kalmış; yardım gerekirse Rehber\'e bak.','good');SND.play('coin');return null;}
  const st=TUT_STEPS[k];if(tutIdx!==k){tutIdx=k;tutTurn0=S.turn;tutKey='';}
  let ok=false;try{ok=!!st.done(S,{seen:tutSeen,turn0:tutTurn0});}catch(e){console.error('tut '+st.id,e);ok=true;}
  if(!ok)return st;S.tut.step=k+1;}
 return null;}
(()=>{const h=$('#hud');if(!h)return;h.insertAdjacentHTML('beforeend',`<div id="tutRing" class="tut-ring" hidden></div><div id="tutBub" class="tut-bub" role="dialog" aria-live="polite" hidden><div class="tut-e"></div><p class="tut-t"></p><button class="tut-x" data-act="tut-skip">Dersi geç</button><i class="tut-arrow"></i></div>`);})();
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
 const k=TUT_STEPS.indexOf(st);bub.querySelector('.tut-e').textContent=`Vezirin dersi · ${k+1} / ${TUT_STEPS.length}`;bub.querySelector('.tut-t').textContent=text;
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
ACTS['tut-skip']=()=>{if(S&&S.tut){S.tut.off=true;}tutRemember();tutStop();toast('Dersler kapandı. Menüden yeniden başlatabilirsin.');if(typeof uiAdvRender==='function')uiAdvRender();save();};
ACTS['tut-restart']=()=>{S.tut={step:0,done:false,off:false};tutIdx=-1;tutSeen.clear();closeModal();try{localStorage.removeItem('ke-tut');}catch(e){}renderAll();};
MENU_SECTIONS.push({id:'tutorial',order:30,html:()=>`<div class="sec"><h3>Vezirin dersleri</h3><div class="acts">${tutActive()?'<button class="btn" data-act="tut-skip">Dersi geç</button>':'<button class="btn" data-act="tut-restart">Dersleri baştan başlat</button>'}</div></div>`});
KE.tut=()=>{const st=tutActive()?TUT_STEPS[S.tut.step]:null;return {active:tutActive(),step:S&&S.tut?S.tut.step:null,id:st?st.id:null};};
