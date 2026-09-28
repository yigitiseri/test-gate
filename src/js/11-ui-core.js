/* =====================================================================
   UI (Track D): top bar, province panel shell (+ phone bottom sheet), act() dispatcher,
   keyboard shortcuts, end-turn guard
   ===================================================================== */
let confirmKey='';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function shield(f,big){return `<span class="shield${big?' big':''}" title="${esc(FAC[f].n)}">${armsSVG(f)}</span>`;}
function relChip(f){const pl=S.player;if(f===pl)return '<span class="chip ally">Senin</span>';
 if(atWar(pl,f))return '<span class="chip war">Savaşta</span>';if(isAlly(pl,f))return '<span class="chip ally">Müttefik</span>';
 if(inTruce(pl,f))return `<span class="chip truce">Ateşkes · ${S.truce[key(pl,f)]-S.turn} tur</span>`;return '<span class="chip">Barış</span>';}
/** Short message at the top centre, under the top bar (never over the panel; never takes taps). */
function toast(m,k=''){const t=document.createElement('div');t.className='toast '+k;t.textContent=m;t.setAttribute('role','status');$('#toasts').appendChild(t);setTimeout(()=>t.remove(),3800);while($('#toasts').children.length>3)$('#toasts').firstChild.remove();}

/* UI constants (Track D, one place) */
const uiCfg={phone:760,peek:.27,half:.52,fullGap:56,endWarnTurns:2,endArmMs:5000};

let navKey='';
/** Top-bar nav from TOP_BUTTONS (rebuilt only when the registry changes). Every button gets an aria-label. */
function renderNav(){const L=bySlot(TOP_BUTTONS),k=L.map(b=>b.act+(b.label||'')).join();if(k===navKey)return;navKey=k;
 $('#navTabs').innerHTML=L.map(b=>{const aria=b.aria||b.label||b.title||b.act;
  return `<button class="nb" data-act="${b.act}"${Object.entries(b.data||{}).map(([k,v])=>` data-${k}="${esc(v)}"`).join('')}${b.id?` id="${b.id}"`:''} aria-label="${esc(aria)}" title="${esc(b.title||b.label||aria)}">${b.icon}${b.label?`<span class="lbl">${esc(b.label)}</span>`:''}</button>`;}).join('');sndIcon();}
TOP_BUTTONS.push({act:'diplo',icon:'⚖',label:'Diplomasi',title:'Diplomasi (1)',order:10},{act:'missions',icon:'✦',label:'Hedefler',title:'Hedefler (2)',order:20},{act:'chron',icon:'❧',label:'Vakayiname',title:'Vakayiname (3)',order:30},
 {act:'guide',icon:'<b style="font:700 15px var(--display)">i</b>',label:'Rehber',aria:'Oyun rehberi',title:'Oyun rehberi',data:{t:'genel'},order:40},
 {act:'snd',icon:'🔊',id:'sndBtn',aria:'Sesi aç/kapat',title:'Ses',order:50},{act:'menu',icon:'☰',aria:'Menü',title:'Menü',order:60});

/* top-bar stats and date get tooltips; warning chips live next to the stats */
(()=>{const T=[['#gold','gold'],['#mp','mp'],['#army','army'],['#provs','provs'],['#wars','wars']];
 for(const [s,k] of T){const st=$(s)&&$(s).closest('.stat');if(st){st.dataset.tip=k;st.tabIndex=0;}}
 const dt=$('#top .date');if(dt)dt.dataset.tip='season';
 const res=$('#top .res');if(res&&!$('#uiWarn'))res.insertAdjacentHTML('afterend','<div id="uiWarn" class="ui-warn" aria-live="polite"></div>');})();

/** Warnings for the player's realm: [{k,l,tip,cls}] (negative net, bankrupt next turn, unrest). */
function uiWarnings(f){const F=S.fac[f],net=income(f)-upkeep(f),out=[];
 if(net<0&&F.gold+net<0)out.push({k:'bank',l:'İflas yakın',tip:'gold',cls:'war'});
 else if(net<0)out.push({k:'net',l:'Zarar '+Math.round(net),tip:'gold',cls:'war'});
 let un=0;for(let i=0;i<NP;i++){const p=S.prov[i];if(p.o===f&&p.un>0)un++;}
 if(un)out.push({k:'un',l:'Huzursuz '+un,tip:'provs',cls:'un'});
 return out;}
function renderTop(){
 if(!S||!S.player)return;const f=S.player,F=S.fac[f];renderNav();
 $('#pShield').outerHTML=shield(f).replace('class="shield','id="pShield" class="shield');$('#pName').textContent=FAC[f].s;
 const net=income(f)-upkeep(f);$('#gold').textContent=Math.floor(F.gold);const gd=$('#goldd');gd.textContent=(net>=0?'+':'')+net.toFixed(0);gd.className=net>=0?'pos':'neg';
 $('#mp').textContent=fmtK(F.mp);$('#army').textContent=fmtK(strength(f));$('#provs').textContent=facProvs(f).length;
 const w=warsOf(f).length;$('#wars').textContent=w;$('#wars').className=w?'neg':'';
 const warn=uiWarnings(f);$('#gold').closest('.stat').classList.toggle('warn',warn.some(x=>x.tip==='gold'));$('#provs').closest('.stat').classList.toggle('warn',warn.some(x=>x.k==='un'));
 const wk=warn.map(x=>x.k+x.l).join();const we=$('#uiWarn');if(we&&we.dataset.k!==wk){we.dataset.k=wk;we.innerHTML=warn.map(x=>`<span class="chip ${x.cls}" data-tip="${x.tip}" tabindex="0">${esc(x.l)}</span>`).join('');}
 const y=START_YEAR+Math.floor(S.turn/4);
 if(!busy)$('#endTurn').textContent=S.over?'Oyun bitti':uiEndArmed()?'Yine de bitir':'Turu Bitir';
 $('#endTurn').dataset.date=`${SEASONS[S.turn%4]} ${y}`;$('#endTurn').setAttribute('aria-label',`Turu bitir (${SEASONS[S.turn%4]} ${y})`);
 document.documentElement.style.setProperty('--toph',Math.round(topH())+'px');
 SND.setMood(w?'war':'peace');sndIcon();$('#season').textContent=SEASONS[S.turn%4];{$('#year').textContent=`${y} · ${hijri(y)} H · tur ${S.turn+1}`;$('#year').title=`Anno Domini ${roman(y)}`;}
}

let uiLastSel=-1,uiSheetCur='peek';
function renderPanel(){
 const pn=$('#panel'),el=$('#panelIn');if(sel<0||!S){pn.hidden=true;return;}pn.hidden=false;if(tgt>=0&&!tgtOk())tgt=-1;
 const fresh=sel!==uiLastSel;if(fresh){uiLastSel=sel;uiSheetCur=uiSheet;}
 const d=PD[sel],p=S.prov[sel],f=S.player,F=S.fac[f],mine=p.o===f,isCap=S.fac[p.o].cap===sel;
 const terr=d.mtn?'Dağlık · +30% savunma':d.des?'Çöl · +10% savunma':'Ova';
 let h=`<div class="ph">${shield(p.o,true)}<div><h2>${isCap?'★ ':''}${esc(d.name)}</h2><div class="sub">${esc(FAC[p.o].n)}</div></div><button class="x" data-act="close" aria-label="Kapat">×</button></div>
 <div class="chips">${relChip(p.o)}<span class="chip" data-tip="terrain" data-i="${sel}">${terr}</span>${p.un>0?`<span class="chip un" data-tip="unrest" data-i="${sel}">Huzursuz · ${p.un} tur</span>`:''}${p.mkt?'<span class="chip">Pazar</span>':''}${p.brk?'<span class="chip">Kışla</span>':''}</div>
 <div class="grid4"><div data-tip="dev" data-i="${sel}"><label>Gelişim</label><b>${p.dev}</b></div><div data-tip="fort" data-i="${sel}"><label>Kale</label><b>${p.fort}</b></div><div data-tip="garrison" data-i="${sel}"><label>Garnizon</label><b>${fmtK(p.t)}</b></div><div data-tip="pinc" data-i="${sel}"><label>Gelir</label><b>${provIncome(sel).toFixed(1)}</b></div></div>`;
 const ctx={i:sel,d,p,f,F,mine,isCap,tgt};
 const secs=bySlot(PANEL_SECTIONS).filter(x=>{try{return x.when(ctx);}catch(e){console.error('panel '+x.id,e);return false;}});
 for(const x of secs){try{h+=`<div class="psec" data-sec="${esc(x.id)}">${x.html(ctx)||''}</div>`;}catch(e){console.error('panel '+x.id,e);}}
 el.innerHTML=h;if(fresh)el.scrollTop=0;
 for(const x of secs)if(x.bind){try{x.bind(el,ctx);}catch(e){console.error('panel '+x.id,e);}}
 uiSheetFit();
}

/* ---------- phone bottom sheet (≤ uiCfg.phone px) ----------
   #panel becomes a sheet with a drag handle and three snap points (peek / half / full). While an
   order is pending (any section renders [data-sheet="action"]) it collapses to a compact action
   bar that shows only that section. The user's last snap is remembered (localStorage 'ke-sheet'). */
let uiSheet='peek';try{const v=localStorage.getItem('ke-sheet');if(v==='peek'||v==='half'||v==='full')uiSheet=v;}catch(e){}
const uiPhone=()=>innerWidth<=uiCfg.phone;
function uiSheetH(m){const max=Math.max(160,innerHeight-topH()-uiCfg.fullGap);return Math.round(m==='full'?max:Math.min(max,innerHeight*(m==='half'?uiCfg.half:uiCfg.peek)));}
/** --sheeth = how much of the screen bottom the sheet covers (the target height, not a mid-transition one). */
function uiSheetVar(){const pn=$('#panel');let h=0;if(!pn.hidden&&uiPhone())h=pn.style.height?parseFloat(pn.style.height):pn.getBoundingClientRect().height;
 document.documentElement.style.setProperty('--sheeth',Math.round(h)+'px');}
/** Top edge of the sheet on screen (phone), or null. */
function uiSheetTop(){const pn=$('#panel');if(pn.hidden||!uiPhone())return null;return innerHeight-(pn.style.height?parseFloat(pn.style.height):pn.getBoundingClientRect().height);}
/** Apply the sheet layout to #panel (no-op on wide screens). */
function uiSheetFit(){
 const pn=$('#panel'),inn=$('#panelIn');if(!pn)return;
 const act=!pn.hidden&&!!inn.querySelector('[data-sheet="action"]');
 for(const s of inn.querySelectorAll('.psec'))s.classList.toggle('sheet-off',act&&!s.querySelector('[data-sheet="action"]'));
 pn.classList.toggle('sheet-action',act);
 if(pn.hidden||!uiPhone()){pn.style.height='';delete pn.dataset.snap;uiSheetVar();return;}
 pn.dataset.snap=act?'action':uiSheetCur;
 if(act){pn.style.height='';}
 else{const g=pn.querySelector('.sheet-grip'),b=pn.querySelector('.band');const nat=(g?g.offsetHeight:0)+(b?b.offsetHeight:0)+inn.scrollHeight+4;
  pn.style.height=Math.min(uiSheetH(uiSheetCur),nat)+'px';}
 uiSheetVar();}
/** Snap the sheet to 'peek' | 'half' | 'full' (remember=true stores it as the preferred snap). */
function uiSheetSet(m,remember){uiSheetCur=m;if(remember){uiSheet=m;try{localStorage.setItem('ke-sheet',m);}catch(e){}}uiSheetFit();}
(()=>{const pn=$('#panel');
 pn.insertAdjacentHTML('afterbegin','<div class="sheet-grip" role="button" tabindex="0" aria-label="Paneli büyüt ya da küçült"><i></i></div>');
 let dr=null;const SN=['peek','half','full'];
 pn.addEventListener('pointerdown',e=>{if(!uiPhone()||pn.classList.contains('sheet-action'))return;const g=e.target.closest('.sheet-grip,.ph');if(!g||e.target.closest('button,[data-act]'))return;
  dr={y:e.clientY,h:pn.getBoundingClientRect().height,moved:false,grip:!!e.target.closest('.sheet-grip'),id:e.pointerId};try{pn.setPointerCapture(e.pointerId);}catch(x){}});
 pn.addEventListener('pointermove',e=>{if(!dr||e.pointerId!==dr.id)return;const dy=e.clientY-dr.y;if(!dr.moved&&Math.abs(dy)>6){dr.moved=true;pn.classList.add('dragging');}
  if(dr.moved){pn.style.height=clamp(dr.h-dy,70,uiSheetH('full'))+'px';uiSheetVar();}});
 const end=e=>{if(!dr||e.pointerId!==dr.id)return;const d=dr;dr=null;pn.classList.remove('dragging');
  if(!d.moved){if(d.grip&&e.type==='pointerup')uiSheetSet(SN[(SN.indexOf(uiSheetCur)+1)%3],true);return;}
  const h=pn.getBoundingClientRect().height;if(h<uiSheetH('peek')*.62&&e.type==='pointerup'){clearSel();return;}
  let best='peek',bd=1e9;for(const m of SN){const dd=Math.abs(uiSheetH(m)-h);if(dd<bd){bd=dd;best=m;}}uiSheetSet(best,true);};
 pn.addEventListener('pointerup',end);pn.addEventListener('pointercancel',end);
 pn.querySelector('.sheet-grip').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();uiSheetSet(SN[(SN.indexOf(uiSheetCur)+1)%3],true);}});
 new MutationObserver(()=>{if(pn.hidden){uiLastSel=-1;}uiSheetVar();}).observe(pn,{attributes:true,attributeFilter:['hidden']});
 addEventListener('resize',()=>{uiSheetFit();});})();

/** Click dispatcher: OVERBLOCK check, then the ACTS registry. */
function act(a,t){
 const f=S&&S.player,F=f&&S.fac[f];
 if(f&&S.over&&OVERBLOCK.has(a)){toast('Oyun sona erdi. Yeni bir oyun başlatmak için "Oyun bitti" düğmesine bas.');return;}
 if(f&&S.over&&a==='end'){queueModal(showEnd);return;}
 const h=ACTS[a];if(h)h(t,f,F);
}

/* end turn: a second tap is needed when the treasury would run dry within uiCfg.endWarnTurns turns */
let uiEndArm=0;
const uiEndArmed=()=>performance.now()-uiEndArm<uiCfg.endArmMs;
function uiEndRisk(){if(!S||!S.player||S.over)return null;const f=S.player,F=S.fac[f],net=income(f)-upkeep(f);
 return net<0&&F.gold<-net*uiCfg.endWarnTurns?{net,gold:F.gold}:null;}
ACTS.end=()=>{const r=uiEndRisk();
 if(r&&!uiEndArmed()){uiEndArm=performance.now();SND.play('click');
  toast(`Hazine ${r.gold<-r.net?'bu tur':'iki tur içinde'} boşalıyor, maaşsız askerler kaçar. Yine de bitirmek için bir daha bas.`,'war');
  renderTop();setTimeout(()=>{if(!busy)renderTop();},uiCfg.endArmMs+50);return;}
 uiEndArm=0;endTurn();};
KE.uiEndRisk=()=>uiEndRisk();KE.uiToast=(m,k)=>toast(m,k);

document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t||t.disabled)return;SND.init();if(!QUIET.has(t.dataset.act))SND.play('click');act(t.dataset.act,t);});
addEventListener('pagehide',()=>{if(S&&S.player&&!busy)save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S&&S.player&&!busy)save();});

/* keyboard: Esc closes / cancels, Space ends the turn, 1-4 open Diplomasi / Hedefler / Vakayiname / Devlet defteri */
const uiKeys={'1':'diplo','2':'missions','3':'chron','4':'state'};
document.addEventListener('keydown',e=>{
 const tag=e.target&&e.target.tagName;if(/INPUT|TEXTAREA|SELECT/.test(tag||'')&&e.key!=='Escape')return;
 const modalOpen=!$('#modal').hidden;
 if(e.key==='Escape'){if(modalOpen){if(!$('#modal .ev')&&!$('#modal .endm'))closeModal();}else if(tgt>=0&&ACTS.cancel)ACTS.cancel();else clearSel();return;}
 if(!S||!S.player||!$('#start').hidden||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key===' '||e.code==='Space'){const ae=document.activeElement;if(modalOpen||(ae&&ae!==document.body&&ae!==cv&&ae.closest&&ae.closest('button,a,[tabindex]')))return;
  e.preventDefault();if(!$('#endTurn').disabled)act('end',$('#endTurn'));return;}
 const a=uiKeys[e.key];if(a&&ACTS[a]&&!modalOpen){e.preventDefault();SND.init();SND.play('click');act(a,$('#top'));}});

function renderAll(){renderTop();renderPanel();polDirty=true;req();if(S&&S.player&&!busy)save();runHooks('renderAll');}
