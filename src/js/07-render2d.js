/* =====================================================================
   RENDERING
   ===================================================================== */
const cv=document.getElementById('map'),ctx=cv.getContext('2d');
const $=s=>document.querySelector(s);
let dpr=1,vw=0,vh=0,cam={x:0,y:0,s:1},fitS=1,polDirty=true,need=false;
let sel=-1,tgt=-1,hlKey='',startPick=null,facLabels=[];
function resize(){dpr=Math.min(window.devicePixelRatio||1,2);vw=innerWidth;vh=innerHeight;document.documentElement.style.setProperty('--toph',Math.round(topH())+'px');cv.width=vw*dpr;cv.height=vh*dpr;fitS=Math.min(vw/W,vh/H);if(G3.on){G3.resize();G3.clamp();}clampCam();req();}
function topH(){const t=document.getElementById('top');return t&&!t.hidden?t.getBoundingClientRect().bottom:0;}
/* Bug B12: the map may be panned at most min(45% of the view, 160 px) past its edge. */
function clampCam(){const minS=fitS*.85;cam.s=clamp(cam.s,minS,5);const mw=W*cam.s,mh=H*cam.s,th=topH(),vis=vh-th,px=Math.max(60,Math.min(vw*.45,160)),py=Math.max(60,Math.min(vis*.4,160));
 cam.x=mw<vw?clamp(cam.x,(vw-mw)/2-px,(vw-mw)/2+px):clamp(cam.x,vw-mw-px,px);cam.y=mh<vis?clamp(cam.y,th+(vis-mh)/2-py,th+(vis-mh)/2+py):clamp(cam.y,vh-mh-py,th+py);}
function req(){if(!need){need=true;requestAnimationFrame(draw);}}
function centerOn(x,y,s,off=0){const th=topH();if(G3.on){G3.center(x,y,s,off,th);req();return;}cam.s=s;cam.x=off+(vw-off)/2-x*s;cam.y=th+(vh-th)/2-y*s;clampCam();req();}
function zoomAt(sx,sy,ns){if(G3.on){G3.zoomAt(sx,sy,ns);req();return;}ns=clamp(ns,fitS*.85,5);const wx=(sx-cam.x)/cam.s,wy=(sy-cam.y)/cam.s;cam.s=ns;cam.x=sx-wx*ns;cam.y=sy-wy*ns;clampCam();req();}

let mapMode='pol',polDist=null;
function renderPol(){
 const N=W*H,d=polImg.data;const col=FK.map(f=>hex2(typeof vasMapCol==='function'?vasMapCol(f):FAC[f].c)); /* vassals: the overlord's colour, lighter (04g) */const fi={};FK.forEach((f,k)=>fi[f]=k);
 const oi=new Int16Array(NP);for(let i=0;i<NP;i++)oi[i]=fi[S.prov[i].o];
 // occupation (W2): an occupied province keeps its owner's colour and borders, hatched with the occupier's colour (EU4 style)
 const oc=new Int16Array(NP).fill(-1);let anyOc=false;for(let i=0;i<NP;i++){const c=S.prov[i].ctl;if(c&&c!==S.prov[i].o&&fi[c]!=null){oc[i]=fi[c];anyOc=true;}}
 if(!polDist)polDist=new Uint16Array(N);const D=polDist;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,id=idMap[i];if(id<0){D[i]=65535;continue;}const o=oi[id];let src=false;
  if(x>0){const b=idMap[i-1];if(b===-2||(b>=0&&oi[b]!==o))src=true;}
  if(!src&&x<W-1){const b=idMap[i+1];if(b===-2||(b>=0&&oi[b]!==o))src=true;}
  if(!src&&y>0){const b=idMap[i-W];if(b===-2||(b>=0&&oi[b]!==o))src=true;}
  if(!src&&y<H-1){const b=idMap[i+W];if(b===-2||(b>=0&&oi[b]!==o))src=true;}
  D[i]=src?0:65535;}
 chamfer(D);
 const pol=mapMode==='pol',baseA=pol?.3:0,grad=pol?.4:.26,soft=!G3.on,gr=VM.gran;   // 2D: borders are vector lines (07h), the wash gets a pigment grain
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,o=i*4,id=idMap[i];if(id<0){d[o+3]=0;continue;}
  const c=col[oi[id]],dist=D[i]/3;
  if(soft){let a=baseA+grad*Math.max(0,1-dist/12)+(pol&&dist<1.5?.08:0);a*=.82+gr[i]*.0014;
   if(anyOc&&oc[id]>=0){const m=(x+y)%9;if(m<4){const q=col[oc[id]],e=m===0||m===3?.72:1;d[o]=q[0]*e;d[o+1]=q[1]*e;d[o+2]=q[2]*e;d[o+3]=pol?205:170;continue;}if(a<.42)a=.42;}
   d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=a*255;continue;}
  if(dist<1){d[o]=c[0]*.34;d[o+1]=c[1]*.34;d[o+2]=c[2]*.34;d[o+3]=235;continue;}
  if(dist<2.1){d[o]=c[0]*.8;d[o+1]=c[1]*.8;d[o+2]=c[2]*.8;d[o+3]=pol?200:150;continue;}
  let a=baseA+grad*Math.max(0,1-(dist-2)/11);
  const pb=(x<W-1&&idMap[i+1]>=0&&idMap[i+1]!==id)||(y<H-1&&idMap[i+W]>=0&&idMap[i+W]!==id);
  if(pb&&((x+y)&3)<2){d[o]=c[0]*.3;d[o+1]=c[1]*.3;d[o+2]=c[2]*.3;d[o+3]=pol?120:90;continue;}
  if(anyOc&&oc[id]>=0){const m=(x+y)%9;if(m<4){const q=col[oc[id]],e=m===0||m===3?.72:1;d[o]=q[0]*e;d[o+1]=q[1]*e;d[o+2]=q[2]*e;d[o+3]=pol?205:170;continue;}if(a<.42)a=.42;}
  d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=a*255;}
 polC.getContext('2d').putImageData(polImg,0,0);
 computeFacLabels();polDirty=false;G3.texDirty=true;G3.objDirty=true;
}
function computeFacLabels(){
 facLabels=[];
 FK.forEach(f=>{if(!S.fac[f].alive)return;const ps=facProvs(f);if(!ps.length)return;const seen=new Set();let best=null,ba=0;
  for(const s of ps){if(seen.has(s))continue;const comp=[s];seen.add(s);for(let h=0;h<comp.length;h++)for(const j of PD[comp[h]].adj){if(!seen.has(j)&&S.prov[j].o===f&&!PD[comp[h]].lanes.includes(j)&&!PD[j].lanes.includes(comp[h])){seen.add(j);comp.push(j);}}
   const a=comp.reduce((t,i)=>t+PD[i].area,0);if(a>ba){ba=a;best=comp;}}
  if(!best||ba<2500)return;let cx=0,cy=0;best.forEach(i=>{cx+=PD[i].lx*PD[i].area;cy+=PD[i].ly*PD[i].area;});cx/=ba;cy/=ba;
  const id=idMap[Math.round(cy)*W+Math.round(cx)];
  if(id<0||S.prov[id].o!==f){let bd=1e9;best.forEach(i=>{const dd=(PD[i].lx-cx)**2+(PD[i].ly-cy)**2;if(dd<bd){bd=dd;cx=PD[i].lx;cy=PD[i].ly;}});}
  const cv=facCurve(best),n=[...FAC[f].s].length;
  facLabels.push({f,x:cx,y:cy,sz:cv?clamp(Math.min(cv.len/(n*1.02),Math.sqrt(ba)/5.5,cv.thick*.75),10,46):clamp(Math.sqrt(ba)/7.5,10,46),cv});});
}
/** The realm's lie of the land for its name, as on old maps: the main axis of its provinces (area-weighted), a gentle
 parabola through them in that frame, the usable length and thickness. Null for one or two provinces. */
function facCurve(L){if(L.length<3)return null;let W0=0,mx=0,my=0;L.forEach(i=>{const w=PD[i].area;W0+=w;mx+=PD[i].lx*w;my+=PD[i].ly*w;});mx/=W0;my/=W0;
 let xx=0,yy=0,xy=0;L.forEach(i=>{const w=PD[i].area,dx=PD[i].lx-mx,dy=PD[i].ly-my;xx+=w*dx*dx;yy+=w*dy*dy;xy+=w*dx*dy;});
 let th=.5*Math.atan2(2*xy,xx-yy);th=clamp(th,-.75,.75);const co=Math.cos(th),si=Math.sin(th);
 // weighted least squares v = a u^2 + b u + c
 const M=[[0,0,0],[0,0,0],[0,0,0]],R=[0,0,0];let umin=1e9,umax=-1e9,vv=0;
 L.forEach(i=>{const w=PD[i].area,dx=PD[i].lx-mx,dy=PD[i].ly-my,u=dx*co+dy*si,v=-dx*si+dy*co,r=Math.sqrt(PD[i].area)*.45,X=[u*u,u,1];
  umin=Math.min(umin,u-r);umax=Math.max(umax,u+r);vv+=w*v*v;for(let a=0;a<3;a++){R[a]+=w*X[a]*v;for(let b=0;b<3;b++)M[a][b]+=w*X[a]*X[b];}});
 const det=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
 const D=det(M);let a=0,b=0,c=0;if(Math.abs(D)>1e-9){const col=(k)=>M.map((row,r)=>row.map((x,j)=>j===k?R[r]:x));a=det(col(0))/D;b=det(col(1))/D;c=det(col(2))/D;}
 const len=(umax-umin)*.82,u0=(umin+umax)/2,lim=.9/Math.max(60,len);a=clamp(a,-lim,lim);b=clamp(b,-.35,.35);
 const cv={mx,my,th,a,b,c:clamp(c,-30,30),u0,len,thick:2*Math.sqrt(vv/W0)*1.7+18},M0=46,inside=u=>{const q=facCurveAt(cv,u);return q[0]>M0&&q[0]<W-M0&&q[1]>M0&&q[1]<H-M0;};
 for(let k=0;k<12&&!(inside(cv.u0-cv.len/2)&&inside(cv.u0+cv.len/2));k++){   // keep the name inside the frame: slide it inward, then shorten it
  const lo=inside(cv.u0-cv.len/2),hi=inside(cv.u0+cv.len/2);if(lo!==hi)cv.u0+=(lo?-1:1)*cv.len*.06;else cv.len*=.9;cv.len*=.97;}
 return cv;}
/** Point and direction of the label curve at u (map units). */
function facCurveAt(cv,u){const v=cv.a*u*u+cv.b*u+cv.c,co=Math.cos(cv.th),si=Math.sin(cv.th);return [cv.mx+u*co-v*si,cv.my+u*si+v*co,cv.th+Math.atan(2*cv.a*u+cv.b)];}
function renderHL(){
 const d=hlImg.data;d.fill(0);const paint=(k,fc,ec)=>{for(let q=provStart[k];q<provStart[k+1];q++){const i=provPix[q],o=i*4,x=i%W;
  const e=(x>0&&idMap[i-1]!==k)||(x<W-1&&idMap[i+1]!==k)||idMap[i-W]!==k||idMap[i+W]!==k||(x>1&&idMap[i-2]!==k)||(x<W-2&&idMap[i+2]!==k)||idMap[i-2*W]!==k||idMap[i+2*W]!==k;
  const c=e&&G3.on?ec:fc;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=c[3];}};
 if(startPick){facProvs(startPick).forEach(k=>paint(k,[255,248,225,70],[255,236,190,255]));}
 else if(sel>=0){
  if(S.prov[sel].o===S.player&&S.player){PD[sel].adj.forEach(j=>{const o=S.prov[j].o;if(o===S.player)paint(j,[60,190,180,60],[40,160,150,200]);else if(atWar(S.player,o))paint(j,[225,70,50,80],[200,50,35,230]);});}
  paint(sel,[255,248,225,80],[255,240,196,255]);
  if(tgt>=0)paint(tgt,S.prov[tgt].o===S.player?[60,190,180,120]:[225,70,50,130],[255,255,255,255]);
 }
 hctx.putImageData(hlImg,0,0);G3.texDirty=true;
}
function updateHL(){const k=startPick?'f'+startPick+S.turn:sel+'|'+tgt+'|'+S.turn+'|'+JSON.stringify(Object.keys(S.war).length);if(k!==hlKey||polDirty){hlKey=k;renderHL();}}

const FCOL={};FK.forEach(f=>FCOL[f]=hex2(FAC[f].c));
const fx=[];
function addFx(o){o.t0=performance.now();fx.push(o);if(!need){need=true;requestAnimationFrame(draw);}}
KE.stats.draws=0;let aHotT=0;
/* hovered province (mouse only), so its garrison chip shows even when decluttered */
let aHover=-1,aHovT=0;
cv.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||aHovT||!S)return;aHovT=setTimeout(()=>{aHovT=0;},70);const id=pickAt(e.clientX,e.clientY);if(id!==aHover){aHover=id;req();}});
cv.addEventListener('pointerleave',()=>{if(aHover>=0){aHover=-1;req();}});
/** Garrison ceiling (B's garrisonMax when present, else the planned formula). */
function aGarMax(i){if(typeof garrisonMax==='function')return garrisonMax(i);const p=S.prov[i];return Math.round((500+p.dev*200+p.fort*400)/100)*100;}
/** Greedy label placement: rects [x0,y0,x1,y1] already taken this frame. */
const aOcc=[];
function aFree(r){for(let k=0;k<aOcc.length;k++){const o=aOcc[k];if(r[0]<o[2]&&r[2]>o[0]&&r[1]<o[3]&&r[3]>o[1])return false;}return true;}
KE.aLabels=()=>aOcc.map(r=>({k:r.k,r:r.slice(0,4).map(v=>Math.round(v))}));
const aTag=(r,k)=>{r.k=k;return r;};
function draw(){
 need=false;if(!baseC||!S)return;
 if(polDirty){renderPol();hlKey='';}
 updateHL();
 const now=performance.now(),s=curS(),g3=G3.on;KE.stats.draws++;
 ctx.setTransform(1,0,0,1,0,0);
 if(g3){if(G3.needs(now))G3.render(now);ctx.clearRect(0,0,cv.width,cv.height);}
 else{ctx.fillStyle='#1c120a';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=40;ctx.fillStyle='#2e2114';ctx.fillRect(cam.x,cam.y,W*s,H*s);ctx.shadowBlur=0;
  ctx.setTransform(dpr*s,0,0,dpr*s,dpr*cam.x,dpr*cam.y);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const fm=19,f=vmF(s);vmGround(s);
  if(f<1){ctx.globalAlpha=1-f;ctx.drawImage(polC,fm,fm,W-2*fm,H-2*fm,fm,fm,W-2*fm,H-2*fm);ctx.globalAlpha=1;}if(f>0)vmPol(s,f);   // far: the raster colours; near: filled outlines (07l)
  vmLines(s);if(f<1){ctx.globalAlpha=1-f;ctx.drawImage(hlC,0,0);ctx.globalAlpha=1;}if(f>0)hrSelFill(f);vmSel(s);}   // the wash stays inside the graduated frame   // 07h: crisp coast, borders and outlines
 ctx.setTransform(dpr,0,0,dpr,0,0);
 // sea lanes
 ctx.setLineDash([6,6]);ctx.lineWidth=1.5;ctx.strokeStyle='rgba(70,44,20,.6)';
 PD.forEach(d=>d.lanes.forEach(j=>{const e=PD[j];const a=pj(d.lx,d.ly,1),b=pj(e.lx,e.ly,1);if(!a[2]||!b[2])return;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo((a[0]+b[0])/2,(a[1]+b[1])/2-18,b[0],b[1]);ctx.stroke();}));
 ctx.setLineDash([]);
 // faction names
 if(s<1.5){ctx.textBaseline='middle';
  facLabels.forEach(l=>{const fs=l.sz*s;if(fs<9)return;const q=pj(l.x,l.y,g3?14:0);if(!q[2])return;const c=FCOL[l.f];ctx.font=`800 ${fs}px "Cinzel", Georgia, serif`;
   ctx.globalAlpha=clamp((1.5-s)/.4,0,1)*.92;ctx.lineWidth=Math.max(2.5,fs*.14);ctx.strokeStyle='rgba(248,240,218,.6)';ctx.lineJoin='round';
   const txt=FAC[l.f].s.toLocaleUpperCase('tr'),sp=fs*.2,chars=[...txt],ws=chars.map(ch=>ctx.measureText(ch).width),tot=ws.reduce((a,b)=>a+b,0)+sp*(chars.length-1);
   ctx.fillStyle=`rgb(${c[0]*.3|0},${c[1]*.3|0},${c[2]*.3|0})`;
   if(l.cv){const cv=l.cv;let u=cv.u0-tot/2/s;ctx.textAlign='center';   // letters follow the curve of the realm (map units: screen px / s)
    chars.forEach((ch,k)=>{const w=(ws[k]+(k<chars.length-1?sp:0))/s,[x0,y0,ang]=facCurveAt(cv,u+ws[k]/2/s),p=pj(x0,y0,g3?14:0);u+=w/Math.sqrt(1+Math.pow(2*cv.a*u+cv.b,2));if(!p[2])return;
     ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(ang);ctx.strokeText(ch,0,0);ctx.fillText(ch,0,0);ctx.restore();});}
   else{let cx=q[0]-tot/2;ctx.textAlign='left';chars.forEach((ch,k)=>{ctx.strokeText(ch,cx,q[1]);ctx.fillText(ch,cx,q[1]);cx+=ws[k]+sp;});}
   // far zoom: the realm's total troops (garrisons + field armies) instead of hundreds of small chips
   if(s<.95&&fs>=11){const ts=clamp(fs*.42,10,15);ctx.globalAlpha=clamp((.95-s)/.2,0,1)*.9;ctx.font=`700 ${ts}px "EB Garamond", Georgia, serif`;ctx.textAlign='center';
    const tt='⚔ '+fmtK(strength(l.f)),ty=q[1]+fs*.62+ts*.2;ctx.lineWidth=3;ctx.strokeStyle='rgba(248,240,218,.75)';ctx.strokeText(tt,q[0],ty);ctx.fillText(tt,q[0],ty);}});
  ctx.globalAlpha=1;}
 // move arrow
 if(sel>=0&&tgt>=0){const a=PD[sel],b=PD[tgt];const A=pj(a.lx,a.ly,3),B=pj(b.lx,b.ly,3);const ax=A[0],ay=A[1],bx=B[0],by=B[1];const mx=(ax+bx)/2-(by-ay)*.2,my=(ay+by)/2+(bx-ax)*.2;
  const war=S.prov[tgt].o!==S.player,cl=war?'#c8321e':'#1f8f89';const an=Math.atan2(by-my,bx-mx),ex=bx-10*Math.cos(an),ey=by-10*Math.sin(an);
  ctx.lineCap='round';ctx.strokeStyle='rgba(10,8,4,.55)';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();
  ctx.strokeStyle=cl;ctx.lineWidth=5;ctx.setLineDash([12,7]);ctx.lineDashOffset=-(now/40)%19;ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=cl;ctx.strokeStyle='rgba(10,8,4,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx+4*Math.cos(an),by+4*Math.sin(an));ctx.lineTo(bx-18*Math.cos(an-.5),by-18*Math.sin(an-.5));ctx.lineTo(bx-18*Math.cos(an+.5),by-18*Math.sin(an+.5));ctx.closePath();ctx.fill();ctx.stroke();}
 // layout: army tokens are fixed first, then garrison chips and city names are placed greedily around them (A4)
 aOcc.length=0;const toks=tokLayout(s,g3,now);for(const t of toks)aOcc.push(aTag(t.r.slice(),'t'));
 const vis=[],P0={};for(const d of PD){const q=pj(d.lx,d.ly);if(!q[2]||q[0]<-70||q[1]<-50||q[0]>vw+70||q[1]>vh+50)continue;P0[d.i]=q;vis.push(d);}
 vis.sort((a,b)=>P0[a.i][1]-P0[b.i][1]);
 const nearSel=new Set(sel>=0?[sel,...PD[sel].adj]:[]);const recent=new Set(S.battles.filter(b=>b.turn>=S.turn-1).map(b=>b.to));
 const szs={},phone=vw<760;
 for(const d of vis){const p=S.prov[d.i],[sx,sy]=P0[d.i],isCap=S.fac[p.o]&&S.fac[p.o].cap===d.i;
  if(g3){szs[d.i]=(1.9+p.dev*.3)*s*1.4;continue;}
  if(s>=.55){const sz=clamp((2.4+p.dev*.42)*Math.sqrt(s),3,12)*(isCap?1.3:1);szs[d.i]=sz;cityDraw(d,p,sx,sy,sz,isCap);aOcc.push(aTag([sx-sz*.9,sy-sz*1.1,sx+sz*.9,sy+sz*.6],'c'));}
  else if(isCap){szs[d.i]=4;ctx.font='13px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(20,14,8,.7)';ctx.strokeText('★',sx,sy);ctx.fillStyle='#f1cf72';ctx.fillText('★',sx,sy);}}
 aSgReserve(P0,szs,s,g3);   // siege camps and wall plaques (07f) claim their space before chips and names
 aSgUnder(ctx,now,g3);       // ...and the camps are drawn under them
 // garrison chips: hidden under 0.1k; shown near the selection, on hover, for big stacks, or when zoomed in and the garrison is at least half full
 const chips=[],pl=S.player,zMin=phone?1.1:.75;
 for(const d of vis){const p=S.prov[d.i];if(p.t<150&&d.i!==sel)continue;const mine=p.o===pl,force=d.i===sel||d.i===aHover,near=nearSel.has(d.i);
  if(!(force||near||(s>=zMin&&p.t>=aGarMax(d.i)*.5)||p.t>=(mine?4000:8000)))continue;
  const war=!!pl&&!mine&&atWar(pl,p.o);chips.push({d,p,mine,war,force,pr:(force?4e6:near?3e6:mine?2e6:war?1e6:0)+p.t});}
 chips.sort((a,b)=>b.pr-a.pr);
 ctx.font='700 12px "EB Garamond", Georgia, serif';
 for(const c of chips){const i=c.d.i,txt=fmtK(c.p.t),w=ctx.measureText(txt).width+19,h=15,sz=szs[i]||3;let cand;
  if(g3&&G3.anchor[i]){const an=G3.anchor[i],q=pj(an[0],an[1],an[2]);cand=[[q[0],q[1]-h/2],[q[0]-w-sz*1.6,q[1]-h/2],[q[0]-w/2-sz*.8,q[1]-h-sz*1.4]];}
  else{const [x,y]=P0[i];cand=[[x+sz*.95+3,y-h/2-3],[x-sz*.95-3-w,y-h/2-3],[x-w/2,y-sz*1.25-h-1],[x+sz*.6,y+sz*.5+2]];}
  let pos=null;for(const q of cand){const r=[q[0]-1,q[1]-1,q[0]+w+1,q[1]+h+1];if(aFree(r)){pos=q;break;}}
  if(!pos){if(!c.force)continue;pos=cand[0];}
  aOcc.push(aTag([pos[0]-1,pos[1]-1,pos[0]+w+1,pos[1]+h+1],'g'));c.x=pos[0];c.y=pos[1];c.w=w;c.txt=txt;}
 // city names fade in with zoom; a name that would cover a chip, token or another name tries above the city, else waits for more zoom
 const na=clamp((s-1.1)/.3,0,1);
 if(na>0){ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.font=`700 ${s>2?13:12}px "Cinzel", Georgia, serif`;ctx.globalAlpha=na;
  const byPr=vis.slice().sort((a,b)=>((S.fac[S.prov[b.i].o].cap===b.i)-(S.fac[S.prov[a.i].o].cap===a.i))||(S.prov[b.i].dev-S.prov[a.i].dev));
  for(const d of byPr){const [sx,sy0]=P0[d.i],sz=szs[d.i]||4,w=ctx.measureText(d.name).width+4,hh=13;
   const ys=[sy0+(g3?Math.min(sz,26)*.9+10:sz*.7+9),sy0-(g3?Math.min(sz,26)*1.4+14:sz*1.4+11)];let y=null;
   for(const yy of ys){if(aFree([sx-w/2,yy-hh/2,sx+w/2,yy+hh/2])){y=yy;break;}}
   if(y==null){if(d.i!==sel&&s<2.6)continue;y=ys[0];}
   aOcc.push(aTag([sx-w/2,y-hh/2,sx+w/2,y+hh/2],'n'));
   ctx.lineWidth=3.5;ctx.strokeStyle='rgba(248,240,218,.85)';ctx.strokeText(d.name,sx,y);ctx.fillStyle='#24190e';ctx.fillText(d.name,sx,y);}
  ctx.globalAlpha=1;}
 for(const c of chips)if(c.x!=null)drawGar(c.x,c.y,c.w,c.txt,FAC[c.p.o].c,c.mine,c.war,c.mine&&c.p.mv>=c.p.t*.5,c.force);
 for(const d of vis)if(recent.has(d.i)&&P0[d.i])swords(P0[d.i][0]-(g3?12:(szs[d.i]||3)*1.2+8),P0[d.i][1]-(g3?14:4));
 let more=false;for(const id in DRAW_LAYERS){try{if(DRAW_LAYERS[id](ctx,now,s,g3))more=true;}catch(e){console.error('draw layer '+id,e);}}
 drawFx(now);
 // render on demand: keep the loop alive only for animations; a "hot" 3D view idles down at ~20 fps for 3 s, then stops
 if(fx.length||(sel>=0&&tgt>=0)||more){need=true;requestAnimationFrame(draw);}
 else if(g3&&now<G3.hot&&!aHotT)aHotT=setTimeout(()=>{aHotT=0;req();},50);
}
/** Garrison chip: a small plaque with a tower in the owner's colour and the troop count. */
function drawGar(x,y,w,txt,col,mine,war,dim,force){const h=15;
 ctx.globalAlpha=dim?.72:1;
 ctx.fillStyle='rgba(20,12,4,.32)';rr(x+1.2,y+1.6,w,h,3);ctx.fill();
 const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#fbf2d8');g.addColorStop(1,'#e2cc98');ctx.fillStyle=g;rr(x,y,w,h,3);ctx.fill();
 ctx.lineWidth=mine?1.7:1;ctx.strokeStyle=mine?'#b8862c':war?'#9d2a1b':'#5e3f1f';ctx.stroke();
 if(force){ctx.lineWidth=1;ctx.strokeStyle='rgba(255,246,214,.9)';rr(x-1.5,y-1.5,w+3,h+3,4);ctx.stroke();}
 // tower: body, three merlons, door
 const tx=x+3.5,tb=y+h-2.5,tw=8,th=8.5;ctx.fillStyle=col;ctx.strokeStyle='#2a1a0c';ctx.lineWidth=.9;
 ctx.beginPath();ctx.moveTo(tx,tb);ctx.lineTo(tx,tb-th);for(let k=0;k<3;k++){const mx=tx+k*3;ctx.lineTo(mx,tb-th-2.2);ctx.lineTo(mx+2,tb-th-2.2);ctx.lineTo(mx+2,tb-th);if(k<2)ctx.lineTo(mx+3,tb-th);}
 ctx.lineTo(tx+tw,tb-th);ctx.lineTo(tx+tw,tb);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(tx+.6,tb-th+.4,2,th-.8);
 ctx.fillStyle='#2a1a0c';ctx.beginPath();ctx.arc(tx+tw/2,tb-2.4,1.5,Math.PI,0);ctx.lineTo(tx+tw/2+1.5,tb);ctx.lineTo(tx+tw/2-1.5,tb);ctx.closePath();ctx.fill();
 ctx.font='700 12px "EB Garamond", Georgia, serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=war?'#7d1a10':'#2a1a0c';ctx.fillText(txt,x+15,y+h/2+.5);
 ctx.globalAlpha=1;
}
function drawBanner(px,base,txt,col,mine,dim,f){
 ctx.font='700 13px "EB Garamond", Georgia, serif';const ai=f&&ARMSIMG[f],ok=ai&&ai.complete&&ai.naturalWidth,tw=ctx.measureText(txt).width+13+(ok?12:0),fh=16,top=base-26;
 ctx.globalAlpha=dim?.7:1;ctx.lineJoin='miter';
 ctx.strokeStyle='#2a1d10';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(px,base);ctx.lineTo(px,top-4);ctx.stroke();
 ctx.fillStyle='#e7c46a';ctx.beginPath();ctx.arc(px,top-5,2.3,0,7);ctx.fill();
 ctx.fillStyle='rgba(20,14,8,.3)';ctx.beginPath();ctx.moveTo(px+2,top+2);ctx.lineTo(px+tw+2,top+2);ctx.lineTo(px+tw-3,top+fh/2+2);ctx.lineTo(px+tw+2,top+fh+2);ctx.lineTo(px+2,top+fh+2);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.moveTo(px,top);ctx.lineTo(px+tw,top);ctx.lineTo(px+tw-5,top+fh/2);ctx.lineTo(px+tw,top+fh);ctx.lineTo(px,top+fh);ctx.closePath();
 ctx.fillStyle=col;ctx.fill();
 const g=ctx.createLinearGradient(0,top,0,top+fh);g.addColorStop(0,'rgba(255,255,255,.3)');g.addColorStop(.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.2)');ctx.fillStyle=g;ctx.fill();
 ctx.strokeStyle=mine?'#f3d27a':'rgba(20,14,8,.85)';ctx.lineWidth=mine?2:1;ctx.stroke();
 if(ok)ctx.drawImage(ai,px+2.5,top+1.5,10.8,13);ctx.fillStyle=lum(hex2(col))>.6?'#1c160e':'#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,px+(ok?12:0)+(tw-(ok?12:0)-5)/2,top+fh/2+.5);
 ctx.globalAlpha=1;
}
function swords(x,y){ctx.save();ctx.translate(x,y);ctx.lineCap='round';
 for(const r of[-.75,.75]){ctx.save();ctx.rotate(r);ctx.strokeStyle='rgba(20,14,8,.8)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,7);ctx.stroke();
  ctx.strokeStyle='#e9e4da';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,4);ctx.stroke();ctx.strokeStyle='#b8902f';ctx.beginPath();ctx.moveTo(-3,4);ctx.lineTo(3,4);ctx.moveTo(0,4);ctx.lineTo(0,8);ctx.stroke();ctx.restore();}
 ctx.restore();}
function drawFx(now){
 for(let k=fx.length-1;k>=0;k--){const f=fx[k];const p=(now-f.t0-(f.delay||0))/f.dur;if(p>=1){fx.splice(k,1);continue;}if(p<0)continue;
  if(f.type==='march'){const a=PD[f.a],b=PD[f.b];const A=pj(a.lx,a.ly,3),B=pj(b.lx,b.ly,3),ax=A[0],ay=A[1],bx=B[0],by=B[1],mx=(ax+bx)/2-(by-ay)*.2,my=(ay+by)/2+(bx-ax)*.2;
   const e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
   for(let j=6;j>=0;j--){const t=Math.max(0,e-j*.03),u=1-t,x=u*u*ax+2*u*t*mx+t*t*bx,y=u*u*ay+2*u*t*my+t*t*by;
    ctx.globalAlpha=j?.4-j*.05:1;ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(x,y,j?4.5:8,0,7);ctx.fill();if(!j){ctx.strokeStyle='#f3d27a';ctx.lineWidth=2;ctx.stroke();}}
   ctx.globalAlpha=1;}
  else{const d=PD[f.p],q=pj(d.lx,d.ly,3),x=q[0],y=q[1];
   if(p<.22){ctx.fillStyle=`rgba(255,228,150,${(.22-p)*3.5})`;ctx.beginPath();ctx.arc(x,y,10+p*70,0,7);ctx.fill();}
   for(let j=0;j<8;j++){const an=j*.8+f.seed,r=6+p*26*(.6+hash(j,(f.seed*100)|0)*.8);ctx.fillStyle=`rgba(86,80,72,${(1-p)*.5})`;ctx.beginPath();ctx.arc(x+Math.cos(an)*r,y+Math.sin(an)*r-p*16,4+p*10,0,7);ctx.fill();}
   ctx.strokeStyle=`rgba(236,120,40,${1-p})`;ctx.lineWidth=3*(1-p)+.5;ctx.beginPath();ctx.arc(x,y,6+p*36,0,7);ctx.stroke();
   if(p<.5)for(let j=0;j<6;j++){const an=j*1.05+f.seed*2,r=4+p*40;ctx.fillStyle=`rgba(255,200,90,${1-p*2})`;ctx.beginPath();ctx.arc(x+Math.cos(an)*r,y+Math.sin(an)*r,2,0,7);ctx.fill();}
   if(f.label){const ly=y-30-p*24;ctx.font='800 16px "Cinzel", Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=4;
    ctx.strokeStyle=`rgba(20,14,8,${1-p})`;ctx.strokeText(f.label,x,ly);ctx.fillStyle=f.good?`rgba(160,238,150,${1-p})`:`rgba(255,146,112,${1-p})`;ctx.fillText(f.label,x,ly);}}
 }
}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

