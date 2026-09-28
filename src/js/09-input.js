/* =====================================================================
   INPUT
   ===================================================================== */
const ptrs=new Map();let drag=null,pinch=null,down=null;
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(ptrs.size===1){down={x:e.clientX,y:e.clientY,moved:false};drag={x:e.clientX,y:e.clientY};}
 else if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),s:curS(),mx:(a.x+b.x)/2,my:(a.y+b.y)/2};if(down)down.moved=true;drag=null;}});
cv.addEventListener('pointermove',e=>{
 if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&ptrs.size===2){const [a,b]=[...ptrs.values()];const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
  zoomAt(mx,my,pinch.s*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d);panBy(mx-pinch.mx,my-pinch.my);pinch.mx=mx;pinch.my=my;}
 else if(drag){if(down&&!down.moved&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>6){down.moved=true;cv.classList.add('dragging');}
  if(down&&down.moved)panBy(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;}
 if(e.pointerType==='mouse'&&!drag)hover(e.clientX,e.clientY);});
const up=e=>{ptrs.delete(e.pointerId);cv.classList.remove('dragging');
 if(ptrs.size===0){if(down&&!down.moved&&e.type==='pointerup')mapClick(e.clientX,e.clientY);drag=null;pinch=null;down=null;}
 else if(ptrs.size===1){pinch=null;const p=[...ptrs.values()][0];drag={x:p.x,y:p.y};}};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('pointerleave',()=>{$('#tip').hidden=true;});
cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,curS()*Math.exp(-e.deltaY*.0015));},{passive:false});
function pickAt(sx,sy){let x,y;if(G3.on){const m=G3.pick(sx,sy);if(!m)return -1;x=Math.floor(m[0]);y=Math.floor(m[1]);}else{x=Math.floor((sx-cam.x)/cam.s);y=Math.floor((sy-cam.y)/cam.s);}if(x<0||y<0||x>=W||y>=H)return -1;return idMap[y*W+x];}
function hover(sx,sy){const id=pickAt(sx,sy),tip=$('#tip');if(id<0||!S){tip.hidden=true;return;}const p=S.prov[id];
 tip.innerHTML=`<b>${PD[id].name}</b> · ${FAC[p.o].s} · ${fmtK(p.t)}`;tip.style.left=sx+'px';tip.style.top=sy+'px';tip.hidden=false;}
