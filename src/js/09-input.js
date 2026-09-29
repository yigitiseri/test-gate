/* =====================================================================
   INPUT (Track D): pointer/touch/wheel gestures, pickAt, hover card
   ===================================================================== */
const ptrs=new Map();let drag=null,pinch=null,down=null,uiPtr='mouse';
cv.addEventListener('pointerdown',e=>{uiPtr=e.pointerType||'mouse';cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(ptrs.size===1){down={x:e.clientX,y:e.clientY,moved:false};drag={x:e.clientX,y:e.clientY};}
 else if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),s:curS(),mx:(a.x+b.x)/2,my:(a.y+b.y)/2};if(down)down.moved=true;drag=null;}});
cv.addEventListener('pointermove',e=>{
 if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&ptrs.size===2){const [a,b]=[...ptrs.values()];const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
  zoomAt(mx,my,pinch.s*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d);panBy(mx-pinch.mx,my-pinch.my);pinch.mx=mx;pinch.my=my;}
 else if(drag){if(down&&!down.moved&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>6){down.moved=true;cv.classList.add('dragging');}
  if(down&&down.moved)panBy(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;}
 if(e.pointerType==='mouse'&&!drag){uiPtr='mouse';hover(e.clientX,e.clientY);}});
const up=e=>{ptrs.delete(e.pointerId);cv.classList.remove('dragging');
 if(ptrs.size===0){if(down&&!down.moved&&e.type==='pointerup')mapClick(e.clientX,e.clientY);drag=null;pinch=null;down=null;}
 else if(ptrs.size===1){pinch=null;const p=[...ptrs.values()][0];drag={x:p.x,y:p.y};}};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('pointerleave',()=>{$('#tip').hidden=true;});
cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,curS()*Math.exp(-e.deltaY*.0015));},{passive:false});
/** Province under screen point (sx,sy), or -1. On touch, a tap within 22 px of a province centre picks
 the nearest centre's province, so small provinces are easy to hit with a finger. */
function pickAt(sx,sy){let x,y;if(G3.on){const m=G3.pick(sx,sy);if(!m)return -1;x=Math.floor(m[0]);y=Math.floor(m[1]);}else{x=Math.floor((sx-cam.x)/cam.s);y=Math.floor((sy-cam.y)/cam.s);}
 const hit=(x<0||y<0||x>=W||y>=H)?-1:idMap[y*W+x];
 if(uiPtr!=='touch'&&uiPtr!=='pen')return hit;
 const n=uiNearCentre(sx,sy,22);return n>=0?n:hit;}
/** Nearest province centre (label point) within r screen px of (sx,sy), or -1. */
function uiNearCentre(sx,sy,r){let best=-1,bd=r*r;
 for(let i=0;i<NP;i++){const d=PD[i],p=pj(d.lx,d.ly);if(p[2]===false)continue;const dx=p[0]-sx,dy=p[1]-sy,dd=dx*dx+dy*dy;if(dd<bd){bd=dd;best=i;}}
 return best;}
/** Plain word for a win chance 0..1. */
function uiOddsWord(p){return p>=.9?'Ezici üstünlük':p>=.65?'Üstünüz':p>=.4?'Başa baş':p>=.15?'Riskli':'Umutsuz';}
/** Map hover card (desktop): name, owner, garrison; with an own province selected and an enemy
 neighbour hovered, the chance of victory as a word and a percentage. */
function hover(sx,sy){const id=pickAt(sx,sy),tip=$('#tip');if(id<0||!S){tip.hidden=true;return;}const p=S.prov[id],d=PD[id];
 let h=`<b>${esc(d.name)}</b> · ${esc(FAC[p.o].s)} · ${fmtK(p.t)}`;
 if(S.player&&sel>=0&&id!==sel&&S.prov[sel].o===S.player&&p.o!==S.player&&atWar(S.player,p.o)&&PD[sel].adj.includes(id)){
  try{const n=Math.max(100,avail(sel)),o=battleOdds({att:S.player,to:id,n,from:sel});h+=`<span class="tip-odds">Zafer şansı: ${uiOddsWord(o.p)} · %${Math.round(o.p*100)}</span>`;}catch(e){}}
 tip.innerHTML=h;tip.style.left=sx+'px';tip.style.top=sy+'px';tip.hidden=false;}
