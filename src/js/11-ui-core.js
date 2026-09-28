/* =====================================================================
   UI
   ===================================================================== */
let confirmKey='';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function shield(f,big){return `<span class="shield${big?' big':''}" title="${esc(FAC[f].n)}">${armsSVG(f)}</span>`;}
function relChip(f){const pl=S.player;if(f===pl)return '<span class="chip ally">Senin</span>';
 if(atWar(pl,f))return '<span class="chip war">Savaşta</span>';if(isAlly(pl,f))return '<span class="chip ally">Müttefik</span>';
 if(inTruce(pl,f))return `<span class="chip truce">Ateşkes · ${S.truce[key(pl,f)]-S.turn} tur</span>`;return '<span class="chip">Barış</span>';}
function toast(m,k=''){const t=document.createElement('div');t.className='toast '+k;t.textContent=m;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),3800);while($('#toasts').children.length>4)$('#toasts').firstChild.remove();}

let navKey='';
/** Top-bar nav from TOP_BUTTONS (rebuilt only when the registry changes). */
function renderNav(){const L=bySlot(TOP_BUTTONS),k=L.map(b=>b.act+(b.label||'')).join();if(k===navKey)return;navKey=k;
 $('#navTabs').innerHTML=L.map(b=>`<button class="nb" data-act="${b.act}"${Object.entries(b.data||{}).map(([k,v])=>` data-${k}="${esc(v)}"`).join('')}${b.id?` id="${b.id}"`:''}${b.aria?` aria-label="${esc(b.aria)}"`:''}${b.title?` title="${esc(b.title)}"`:''}>${b.icon}${b.label?`<span class="lbl"> ${esc(b.label)}</span>`:''}</button>`).join('');sndIcon();}
TOP_BUTTONS.push({act:'diplo',icon:'⚖',label:'Diplomasi',order:10},{act:'missions',icon:'✦',label:'Hedefler',order:20},{act:'chron',icon:'❧',label:'Vakayiname',order:30},
 {act:'guide',icon:'<b style="font:700 15px var(--display)">i</b>',label:'Rehber',aria:'Oyun rehberi',title:'Oyun rehberi',data:{t:'genel'},order:40},
 {act:'snd',icon:'🔊',id:'sndBtn',aria:'Sesi aç/kapat',order:50},{act:'menu',icon:'☰',order:60});
function renderTop(){
 if(!S||!S.player)return;const f=S.player,F=S.fac[f];renderNav();
 $('#pShield').outerHTML=shield(f).replace('class="shield','id="pShield" class="shield');$('#pName').textContent=FAC[f].s;
 const net=income(f)-upkeep(f);$('#gold').textContent=Math.floor(F.gold);const gd=$('#goldd');gd.textContent=(net>=0?'+':'')+net.toFixed(0);gd.className=net>=0?'pos':'neg';
 $('#mp').textContent=fmtK(F.mp);$('#army').textContent=fmtK(strength(f));$('#provs').textContent=facProvs(f).length;
 const w=warsOf(f).length;$('#wars').textContent=w;$('#wars').className=w?'neg':'';
 if(!busy)$('#endTurn').textContent=S.over?'Oyun bitti':'Turu Bitir';document.documentElement.style.setProperty('--toph',Math.round(topH())+'px');
 SND.setMood(w?'war':'peace');sndIcon();$('#season').textContent=SEASONS[S.turn%4];{const y=START_YEAR+Math.floor(S.turn/4);$('#year').textContent=`${y} · ${hijri(y)} H · tur ${S.turn+1}`;$('#year').title=`Anno Domini ${roman(y)}`;}
}
function renderPanel(){
 const pn=$('#panel'),el=$('#panelIn');if(sel<0||!S){pn.hidden=true;return;}pn.hidden=false;if(tgt>=0&&!tgtOk())tgt=-1;
 const d=PD[sel],p=S.prov[sel],f=S.player,F=S.fac[f],mine=p.o===f,isCap=S.fac[p.o].cap===sel;
 const terr=d.mtn?'Dağlık · +30% savunma':d.des?'Çöl · +10% savunma':'Ova';
 let h=`<div class="ph">${shield(p.o,true)}<div><h2>${isCap?'★ ':''}${esc(d.name)}</h2><div class="sub">${esc(FAC[p.o].n)}</div></div><button class="x" data-act="close" aria-label="Kapat">×</button></div>
 <div class="chips">${relChip(p.o)}<span class="chip">${terr}</span>${p.un>0?`<span class="chip un">Huzursuz · ${p.un} tur</span>`:''}${p.mkt?'<span class="chip">Pazar</span>':''}${p.brk?'<span class="chip">Kışla</span>':''}</div>
 <div class="grid4"><div><label>Gelişim</label><b>${p.dev}</b></div><div><label>Kale</label><b>${p.fort}</b></div><div><label>Garnizon</label><b>${fmtK(p.t)}</b></div><div><label>Gelir</label><b>${provIncome(sel).toFixed(1)}</b></div></div>`;
 const ctx={i:sel,d,p,f,F,mine,isCap,tgt};
 const secs=bySlot(PANEL_SECTIONS).filter(x=>{try{return x.when(ctx);}catch(e){console.error('panel '+x.id,e);return false;}});
 for(const x of secs){try{h+=x.html(ctx);}catch(e){console.error('panel '+x.id,e);}}
 el.innerHTML=h;
 for(const x of secs)if(x.bind){try{x.bind(el,ctx);}catch(e){console.error('panel '+x.id,e);}}
}

/** Click dispatcher: OVERBLOCK check, then the ACTS registry. */
function act(a,t){
 const f=S&&S.player,F=f&&S.fac[f];
 if(f&&S.over&&OVERBLOCK.has(a)){toast('Oyun sona erdi. Yeni bir oyun başlatmak için "Oyun bitti" düğmesine bas.');return;}
 if(f&&S.over&&a==='end'){queueModal(showEnd);return;}
 const h=ACTS[a];if(h)h(t,f,F);
}
ACTS.end=()=>endTurn();
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t||t.disabled)return;SND.init();if(!QUIET.has(t.dataset.act))SND.play('click');act(t.dataset.act,t);});
addEventListener('pagehide',()=>{if(S&&S.player&&!busy)save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S&&S.player&&!busy)save();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#modal').hidden){if(!$('#modal .ev')&&!$('#modal .endm'))closeModal();}else clearSel();}});

function renderAll(){renderTop();renderPanel();polDirty=true;req();if(S&&S.player&&!busy)save();runHooks('renderAll');}
