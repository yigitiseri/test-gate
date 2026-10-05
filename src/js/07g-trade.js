/* =====================================================================
   TRADE MAP LAYER (Track T, Wave 3): the trade roads in the manuscript / portolan style.
   Dotted caravan roads (sepia ink) and dashed sea lanes (teal ink) with small camel, mule, ship and
   barge glyphs, plus a medallion for every great work. Shown
    - in the trade map mode (the scales button under the zoom buttons, or the province panel): every
      road, its stops in their holder's colour, its name, and a red cross where war cuts it;
    - otherwise only when zoomed in close (faint roads, no names), so the default view stays clean.
   Static: the layer never asks for another frame (render on demand), and it does no work at all in the
   default view except the great-work medallions (zoomed in only).
   Hovering a road (mouse) explains it in plain words in the shared tooltip.
   ===================================================================== */
const TRD_V={zoomShow:2.05,zoomWorks:1.25,glyphMin:44,hoverPx:9};
let trdScr=[],trdWk=[],trdTipOn=false,trdHovT=0;
/** Trade map mode on? (07's mapMode; 'trade' draws the political colours light, like the terrain map) */
const trdModeOn=()=>mapMode==='trade';
let trdPrev='pol';
function trdSetMode(on){if(on===trdModeOn()){trdBtnSync();polDirty=true;req();return;}if(on)trdPrev=mapMode==='ter'?'ter':'pol';mapMode=on?'trade':trdPrev;const mb=document.querySelector('#zoom [data-act="mode"]');if(mb){const p=mapMode!=='ter';mb.textContent=p?'◐':'◑';mb.title=p?lng('Arazi haritası','Terrain map'):lng('Siyasi harita','Political map');}
 trdBtnSync();polDirty=true;req();}
function trdBtnSync(){const b=document.getElementById('trBtn');if(b){const on=trdModeOn();if(b.getAttribute('aria-pressed')!==String(on))b.setAttribute('aria-pressed',String(on));}}
/* world-space geometry of every leg (built once, after the map exists) */
let trdGeo=null;
function trdBuildGeo(){trdGeo=[];for(const r of TRD)for(let k=1;k<r.stops.length;k++){const a=PD[r.stops[k-1].i],b=PD[r.stops[k].i];
 const pts=[[a.lx,a.ly],...r.stops[k].via.map(v=>P(v[0],v[1])),[b.lx,b.ly]];trdGeo.push({r,k,sea:r.stops[k].sea,pts});}}
/* ---- glyph sprites (ink drawings, cached per kind and size) ---- */
const trdSpr={};
function trdSprite(kind,sz){const key=kind+sz;if(trdSpr[key])return trdSpr[key];const sc=2,c=document.createElement('canvas');c.width=c.height=Math.ceil(sz*sc);
 const g=c.getContext('2d');g.scale(sc*sz/24,sc*sz/24);g.lineCap='round';g.lineJoin='round';g.strokeStyle='#3e2412';g.fillStyle='#f4e7c6';g.lineWidth=1.5;
 const legs=xs=>{g.beginPath();for(const [x0,x1] of xs){g.moveTo(x0,14);g.lineTo(x1,21);}g.stroke();};
 if(kind==='camel'){legs([[7,6],[9,10],[14,15],[16,18]]);
  g.beginPath();g.ellipse(11.5,12.5,7,3.4,0,0,7);g.fill();g.stroke();g.beginPath();g.ellipse(10.5,9.6,3.6,3,0,Math.PI,0);g.fill();g.stroke();
  g.beginPath();g.moveTo(17.5,12);g.quadraticCurveTo(20,10,19.5,6);g.stroke();g.beginPath();g.ellipse(21,5.6,2.3,1.3,0,0,7);g.fill();g.stroke();
  g.beginPath();g.moveTo(4.6,12);g.lineTo(3.2,15);g.stroke();}
 else if(kind==='mule'){legs([[7,6.5],[9,9.5],[14.5,15],[16.5,17.5]]);
  g.beginPath();g.ellipse(12,12.5,6.6,3.2,0,0,7);g.fill();g.stroke();g.fillStyle='#c9a46a';g.fillRect(8.5,7.4,6.5,4);g.strokeRect(8.5,7.4,6.5,4);g.fillStyle='#f4e7c6';
  g.beginPath();g.moveTo(17.8,11.5);g.lineTo(19.8,7.6);g.stroke();g.beginPath();g.ellipse(21,7.6,2.2,1.4,.5,0,7);g.fill();g.stroke();g.beginPath();g.moveTo(19.6,6.3);g.lineTo(19,3.8);g.stroke();
  g.beginPath();g.moveTo(5.4,12);g.lineTo(4,15.5);g.stroke();}
 else if(kind==='ship'){g.beginPath();g.moveTo(2.5,14);g.lineTo(21.5,14);g.quadraticCurveTo(20,19,16,19.5);g.lineTo(7,19.5);g.quadraticCurveTo(3.5,18.5,2.5,14);g.closePath();g.fill();g.stroke();
  g.beginPath();g.moveTo(12,14);g.lineTo(12,2.5);g.stroke();g.beginPath();g.moveTo(6.5,4.5);g.quadraticCurveTo(12,6.5,17.5,4.5);g.lineTo(17,12);g.quadraticCurveTo(12,13.2,7,12);g.closePath();g.fill();g.stroke();
  g.fillStyle='#9a2b18';g.beginPath();g.moveTo(12,2.5);g.lineTo(15.5,3.4);g.lineTo(12,4.3);g.closePath();g.fill();}
 else{g.beginPath();g.moveTo(3.5,15);g.lineTo(20.5,15);g.quadraticCurveTo(19,19,15,19);g.lineTo(8,19);g.quadraticCurveTo(4.5,18.6,3.5,15);g.closePath();g.fill();g.stroke(); // barge with a lateen sail
  g.beginPath();g.moveTo(11,15);g.lineTo(11,6);g.stroke();g.beginPath();g.moveTo(7,13.5);g.lineTo(15.5,4.5);g.lineTo(15,13.5);g.closePath();g.fill();g.stroke();}
 return trdSpr[key]=c;}
/* ---- great-work medallions ---- */
function trdMedal(c,x,y,r,k,done,frac,col){c.save();c.translate(x,y);
 c.fillStyle='rgba(30,18,8,.3)';c.beginPath();c.arc(.8,1.1,r,0,7);c.fill();
 c.fillStyle=done?'#f6ead0':'#e8dcc0';c.beginPath();c.arc(0,0,r,0,7);c.fill();
 c.lineWidth=done?1.6:1.2;c.strokeStyle=done?'#b8862c':'#6e4d27';if(!done)c.setLineDash([2,1.6]);c.stroke();c.setLineDash([]);
 if(!done&&frac>0){c.strokeStyle=col||'#b8862c';c.lineWidth=2.2;c.beginPath();c.arc(0,0,r+1.6,-Math.PI/2,-Math.PI/2+Math.PI*2*frac);c.stroke();}
 const s=r/8;c.scale(s,s);c.strokeStyle='#3e2412';c.fillStyle='#3e2412';c.lineWidth=1.1;c.lineJoin='round';c.lineCap='round';
 if(!done){c.beginPath();for(const xx of [-4,0,4]){c.moveTo(xx,4.5);c.lineTo(xx,-4.5);}c.moveTo(-5,-1.5);c.lineTo(5,-1.5);c.moveTo(-5,2);c.lineTo(5,2);c.moveTo(-4,4.5);c.lineTo(4,-4.5);c.stroke();c.restore();return;}
 c.beginPath();
 if(k==='faith'){c.moveTo(-5,4.5);c.lineTo(5,4.5);c.lineTo(5,1);c.lineTo(-5,1);c.closePath();c.moveTo(-4,1);c.arc(0,1,4,Math.PI,0);c.moveTo(0,-3);c.lineTo(0,-5.5);c.fill();c.stroke();}
 else if(k==='bedesten'){c.rect(-5.5,0,11,4.5);c.moveTo(-3.5,0);c.arc(-3.2,0,2,Math.PI,0);c.moveTo(1.2,0);c.arc(3.2,0,2,Math.PI,0);c.moveTo(-1,0);c.arc(0,-.4,1.6,Math.PI,0);c.stroke();}
 else if(k==='caravan'){c.rect(-5,-3.5,10,8);c.moveTo(-1.6,4.5);c.lineTo(-1.6,1.2);c.arc(0,1.2,1.6,Math.PI,0);c.lineTo(1.6,4.5);c.moveTo(-5,-3.5);c.lineTo(-5,-5);c.moveTo(5,-3.5);c.lineTo(5,-5);c.stroke();}
 else if(k==='arsenal'){c.moveTo(-5.5,1.5);c.lineTo(5.5,1.5);c.quadraticCurveTo(4.5,4.8,2,5);c.lineTo(-2.5,5);c.quadraticCurveTo(-5,4.6,-5.5,1.5);c.moveTo(0,1.5);c.lineTo(0,-5.5);c.moveTo(-3.5,-4);c.lineTo(3.5,-4);c.lineTo(3,0);c.lineTo(-3,0);c.closePath();c.stroke();}
 else if(k==='citadel'){c.moveTo(-3.5,5);c.lineTo(-3.5,-3);c.lineTo(-3.5,-5);c.lineTo(-2,-5);c.lineTo(-2,-3.6);c.lineTo(-.7,-3.6);c.lineTo(-.7,-5);c.lineTo(.7,-5);c.lineTo(.7,-3.6);c.lineTo(2,-3.6);c.lineTo(2,-5);c.lineTo(3.5,-5);c.lineTo(3.5,5);c.closePath();c.fill();}
 else{c.moveTo(0,-2.5);c.quadraticCurveTo(-3,-4.2,-5.5,-3);c.lineTo(-5.5,4);c.quadraticCurveTo(-3,2.8,0,4.3);c.quadraticCurveTo(3,2.8,5.5,4);c.lineTo(5.5,-3);c.quadraticCurveTo(3,-4.2,0,-2.5);c.lineTo(0,4.3);c.stroke();}
 c.restore();}
/** Smooth path through screen points (quadratic through midpoints). */
function trdPath(c,q){c.beginPath();c.moveTo(q[0][0],q[0][1]);if(q.length===2){c.lineTo(q[1][0],q[1][1]);return;}
 for(let k=1;k<q.length-1;k++){const mx=(q[k][0]+q[k+1][0])/2,my=(q[k][1]+q[k+1][1])/2;c.quadraticCurveTo(q[k][0],q[k][1],k===q.length-2?q[k+1][0]:mx,k===q.length-2?q[k+1][1]:my);}}
/** Point at the middle of a projected polyline (by length) and its direction. */
function trdMid(q){let L=0;for(let k=1;k<q.length;k++)L+=Math.hypot(q[k][0]-q[k-1][0],q[k][1]-q[k-1][1]);let h=L/2;
 for(let k=1;k<q.length;k++){const d=Math.hypot(q[k][0]-q[k-1][0],q[k][1]-q[k-1][1]);if(h<=d||k===q.length-1){const t=d?Math.min(1,h/d):0;return {x:q[k-1][0]+(q[k][0]-q[k-1][0])*t,y:q[k-1][1]+(q[k][1]-q[k-1][1])*t,dx:q[k][0]-q[k-1][0],len:L};}h-=d;}
 return {x:q[0][0],y:q[0][1],dx:1,len:0};}
DRAW_LAYERS.trade=(c,now,s,g3)=>{trdBtnSync();trdScr=[];trdWk=[];if(!S)return false;
 const mode=trdModeOn(),show=mode||s>=TRD_V.zoomShow;
 if(show){if(!trdGeo)trdBuildGeo();const fa=mode?1:clamp((s-TRD_V.zoomShow)/.35,0,1)*.85;if(fa>0.02){
  const flows={};for(const r of TRD)flows[r.id]=trdFlow(r);
  c.save();c.lineCap='round';c.lineJoin='round';
  for(const L of trdGeo){const q=[];let ok=true,on=false;for(const p of L.pts){const z=pj(p[0],p[1],0);if(!z[2]){ok=false;break;}q.push(z);if(z[0]>-40&&z[1]>-40&&z[0]<vw+40&&z[1]<vh+40)on=true;}
   if(!ok)continue;const fl=flows[L.r.id],a=L.r.stops[L.k-1].i,b=L.r.stops[L.k].i,ca=ctl(a),cb=ctl(b),cut=ca!==cb&&atWar(ca,cb);
   trdScr.push({r:L.r,k:L.k,q,cut});if(!on)continue;
   const ink=L.sea?'24,70,84':'112,36,14',w=mode?1.8+fl.flow*1.2:1.6;
   if(mode){c.globalAlpha=.8;c.strokeStyle='rgba(250,240,214,.85)';c.lineWidth=w+3.2;c.setLineDash([]);trdPath(c,q);c.stroke();}
   c.globalAlpha=fa;c.strokeStyle=`rgba(${ink},${mode?.92:.8})`;c.lineWidth=w;c.setLineDash(L.sea?[8,5]:[.5,4.6]);trdPath(c,q);c.stroke();c.setLineDash([]);
   const m=trdMid(q);
   if(cut&&mode){c.globalAlpha=1;c.strokeStyle='#b0261a';c.lineWidth=2.4;c.beginPath();c.moveTo(m.x-5,m.y-5);c.lineTo(m.x+5,m.y+5);c.moveTo(m.x+5,m.y-5);c.lineTo(m.x-5,m.y+5);c.stroke();}
   else if(m.len>=TRD_V.glyphMin*(mode?1:1.3)){const sz=mode?22:17,img=trdSprite(L.sea&&L.r.g!=='boat'?'ship':L.r.g,sz);c.globalAlpha=mode?1:fa;
    c.save();c.translate(m.x,m.y-sz*.35);if(m.dx<0)c.scale(-1,1);c.drawImage(img,-sz/2,-sz/2,sz,sz);c.restore();}}
  if(mode){c.globalAlpha=1;
   for(const r of TRD){r.stops.forEach((st,k)=>{const d=PD[st.i],z=pj(d.lx,d.ly,0);if(!z[2])return;const col=FAC[ctl(st.i)].c,rad=2.2+st.w*1.1;
     c.fillStyle=col;c.strokeStyle='#2a1a0c';c.lineWidth=1.2;c.beginPath();c.arc(z[0],z[1],rad,0,7);c.fill();c.stroke();});}
   // road names, in italic ink, at the middle leg of each road
   c.font='italic 600 14px "EB Garamond", Georgia, serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
   for(const r of TRD){const legs=trdScr.filter(x=>x.r===r);if(!legs.length)continue;const L=legs[Math.floor((legs.length-1)/2)],m=trdMid(L.q),fl=flows[r.id].flow;
    const t=tx(r.n),w=c.measureText(t).width+6;let y=null;for(const yy of [m.y+17,m.y-19,m.y+31]){if(aFree([m.x-w/2,yy-8,m.x+w/2,yy+8])){y=yy;break;}}if(y==null)y=m.y+17;aOcc.push(aTag([m.x-w/2,y-8,m.x+w/2,y+8],'tr'));
    c.lineWidth=3.5;c.strokeStyle='rgba(250,240,214,.92)';c.strokeText(t,m.x,y);c.fillStyle=fl<.8?'#8e1f14':'#3e2412';c.fillText(t,m.x,y);}}
  c.restore();}}
 // great-work medallions (zoomed in, or the trade map)
 if((mode||s>=TRD_V.zoomWorks)&&S.works&&S.works.length){const seen=new Set();
  for(const w of S.works){if(seen.has(w.i))continue;const here=S.works.filter(x=>x.i===w.i);seen.add(w.i);const d=PD[w.i];
   const z=g3&&G3.anchor&&G3.anchor[w.i]?pj(G3.anchor[w.i][0],G3.anchor[w.i][1],G3.anchor[w.i][2]):pj(d.lx,d.ly,0);if(!z[2]||z[0]<-20||z[1]<-20||z[0]>vw+20||z[1]>vh+20)continue;
   const r=mode||s>2?7.5:6,site=here.find(x=>!x.d),top=site||here[0],n=here.length,ext=(n-1)*r*1.5;let x=0,y=0,rc=null;
   for(const [ox,oy] of [[-16-r-ext,0],[-12-r-ext,r+6],[-12-r-ext,-r-8],[14+r,r+4],[14+r,-r-6]]){const t=[z[0]+ox-r-1,z[1]+oy-r-1,z[0]+ox+r+1+ext,z[1]+oy+r+1];if(aFree(t)){rc=t;x=z[0]+ox;y=z[1]+oy;break;}}
   if(!rc){if(!(mode||site))continue;x=z[0]-16-r-ext;y=z[1];rc=[x-r-1,y-r-1,x+r+1+ext,y+r+1];}aOcc.push(aTag(rc,'w'));
   here.slice().sort((p,q)=>(p===top?-1:q===top?1:0)).forEach((v,k)=>{trdMedal(c,x+k*r*1.5,y,r,v.k,!!v.d,v.d?1:v.p/v.n,FAC[v.f]?FAC[v.f].c:null);});
   trdWk.push({i:w.i,x:x,y:y,r,w:here});}}
 return false;};
/* ---- hover tooltips on the map (mouse): a road or a great-work medallion ---- */
function trdSegDist(px,py,q){let best=1e9;for(let k=1;k<q.length;k++){const ax=q[k-1][0],ay=q[k-1][1],bx=q[k][0],by=q[k][1],dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;
 const t=l?clamp(((px-ax)*dx+(py-ay)*dy)/l,0,1):0;best=Math.min(best,Math.hypot(px-ax-dx*t,py-ay-dy*t));}return best;}
function trdTipAt(x,y){
 for(const m of trdWk)if(Math.hypot(x-m.x,y-m.y)<=m.r+3)return trdWorkTip(m.w);
 let best=null,bd=TRD_V.hoverPx;for(const L of trdScr){const d=trdSegDist(x,y,L.q);if(d<bd){bd=d;best=L;}}
 return best?trdRouteTip(best.r,best.cut):'';}
function trdTipShow(h,x,y){if(!h){if(trdTipOn){uiTipEl.hidden=true;trdTipOn=false;}return;}
 uiTipEl.innerHTML=h;uiTipEl.hidden=false;trdTipOn=true;const t=uiTipEl.getBoundingClientRect(),m=8;
 uiTipEl.style.left=Math.round(clamp(x+14,m,Math.max(m,innerWidth-t.width-m)))+'px';uiTipEl.style.top=Math.round(clamp(y+16,m,Math.max(m,innerHeight-t.height-m)))+'px';}
cv.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||trdHovT||!S||!S.player)return;if(!trdScr.length&&!trdWk.length){if(trdTipOn)trdTipShow('');return;}
 trdHovT=setTimeout(()=>{trdHovT=0;},60);if(e.buttons){trdTipShow('');return;}trdTipShow(trdTipAt(e.clientX,e.clientY),e.clientX,e.clientY);});
cv.addEventListener('pointerleave',()=>trdTipShow(''));
cv.addEventListener('pointerdown',()=>trdTipShow(''));
/* ---- the trade map button, under the map-mode button ---- */
(()=>{const z=document.getElementById('zoom');if(!z||document.getElementById('trBtn'))return;const mb=z.querySelector('[data-act="mode"]');
 const b=document.createElement('button');b.id='trBtn';b.dataset.act='tmode';b.dataset.tip='tmode';b.setAttribute('aria-pressed','false');
 b.setAttribute('aria-label',lng('Ticaret yolları haritası','Trade routes map'));
 b.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 17c3-1 4-5 8-5s5 4 10 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="1 2.6" stroke-linecap="round"/><path d="M9.5 9.8c0-2 1.2-3.3 2.6-3.3S14.7 7.8 14.7 9.8M8 10h8.5M12.2 6.5V4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="4" cy="17" r="1.8" fill="currentColor"/><circle cx="20.5" cy="15" r="1.8" fill="currentColor"/></svg>';
 if(mb&&mb.nextSibling)z.insertBefore(b,mb.nextSibling);else z.appendChild(b);})();
ACTS.tmode=()=>{const on=!trdModeOn();trdSetMode(on);toast(on?lng('Ticaret yolları haritası','Trade routes map'):mapMode==='ter'?lng('Arazi haritası','Terrain map'):lng('Siyasi harita','Political map'));};
QUIET.add('tmode');
KE.tradeMap={on:()=>trdModeOn(),set:v=>trdSetMode(!!v),legs:()=>trdScr.length,medals:()=>trdWk.map(m=>({i:m.i,x:Math.round(m.x),y:Math.round(m.y)})),
 legAt:(id,k)=>{const L=trdScr.find(x=>x.r.id===id&&x.k===k);return L?trdMid(L.q):null;},tipAt:(x,y)=>trdTipAt(x,y)};
