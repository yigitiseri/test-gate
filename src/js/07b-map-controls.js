/* =====================================================================
   MAP CONTROLS (Track A): zoom, fit, map mode, 2D/3D toggle, display settings
   ===================================================================== */
ACTS.zin=()=>zoomAt(vw/2,vh/2,curS()*1.35);
ACTS.zout=()=>zoomAt(vw/2,vh/2,curS()/1.35);
ACTS.fit=()=>centerOn(W/2,H/2,fitS);
ACTS.v3d=()=>{const on=G3.set(!G3.on,true);toast(on?'3D harita':(G3.fail?'3D bu cihazda açılamadı':'2D harita'));};
ACTS.mode=t=>{mapMode=mapMode==='pol'?'ter':'pol';t.textContent=mapMode==='pol'?'◐':'◑';t.title=mapMode==='pol'?'Arazi haritası':'Siyasi harita';toast(mapMode==='pol'?'Siyasi harita':'Arazi haritası');polDirty=true;req();};

/* Display settings (per device, localStorage 'ke-anim', never in S):
   replay = play the other realms' moves on the map before the season report; speed = animation speed; q3d = 3D quality. */
const aOpt={replay:true,speed:1,q3d:'auto'};
try{const o=JSON.parse(localStorage.getItem('ke-anim')||'{}');if(o&&typeof o==='object')Object.assign(aOpt,o);}catch(e){}
function aSaveOpt(){try{localStorage.setItem('ke-anim',JSON.stringify(aOpt));}catch(e){}}
const A_SPEEDS=[[1,'Normal'],[1.6,'Hızlı'],[2.5,'Çok hızlı']],A_Q3D=[['auto','Otomatik'],['low','Düşük'],['mid','Orta'],['high','Yüksek']];
const aLbl=(L,v)=>(L.find(x=>x[0]===v)||L[0])[1];
const aNext=(L,v)=>L[(L.findIndex(x=>x[0]===v)+1)%L.length][0];
MENU_SECTIONS.push({id:'display',order:30,html:()=>`<div class="sec a-disp"><h3>Görüntü</h3><div class="acts">
 <button class="btn" data-act="a-replay" aria-label="Hamle tekrarı">Hamle tekrarı <span class="c">${aOpt.replay?'Açık':'Kapalı'}</span></button>
 <button class="btn" data-act="a-speed" aria-label="Animasyon hızı">Animasyon <span class="c">${aLbl(A_SPEEDS,aOpt.speed)}</span></button>
 <button class="btn" data-act="a-q3d" aria-label="3D kalite">3D kalite <span class="c">${aLbl(A_Q3D,aOpt.q3d)}</span></button></div>
 <p class="hint" style="margin:8px 0 0">Hamle tekrarı, tur sonunda diğer devletlerin ordu yürüyüşlerini ve muharebelerini haritada gösterir. Düşük 3D kalite pili korur.</p></div>`});
const aMenuRefresh=()=>{if(!$('#modal').hidden&&$('#modal .a-disp'))showMenu();};
ACTS['a-replay']=()=>{aOpt.replay=!aOpt.replay;aSaveOpt();aMenuRefresh();};
ACTS['a-speed']=()=>{aOpt.speed=aNext(A_SPEEDS,aOpt.speed);aSaveOpt();aMenuRefresh();};
ACTS['a-q3d']=()=>{aOpt.q3d=aNext(A_Q3D,aOpt.q3d);aSaveOpt();if(G3.applyQ)G3.applyQ();aMenuRefresh();};

/* Bug B12: when the player's realm falls, show the whole map instead of an arbitrary corner. */
hook('eliminate',f=>{if(S&&f===S.player)setTimeout(()=>centerOn(W/2,H/2,fitS),0);});
/* Army changes outside a full render (debug API, AI) must redraw tokens. */
hook('armyCreated',()=>req());hook('armyRemoved',()=>req());
KE.centerOn=(x,y,s)=>centerOn(x,y,s==null?curS():s);
