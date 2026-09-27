/* =====================================================================
   RENDERING
   ===================================================================== */
const cv=document.getElementById('map'),ctx=cv.getContext('2d');
const $=s=>document.querySelector(s);
let dpr=1,vw=0,vh=0,cam={x:0,y:0,s:1},fitS=1,polDirty=true,need=false;
let sel=-1,tgt=-1,hlKey='',startPick=null,facLabels=[];
function resize(){dpr=Math.min(window.devicePixelRatio||1,2);vw=innerWidth;vh=innerHeight;document.documentElement.style.setProperty('--toph',Math.round(topH())+'px');cv.width=vw*dpr;cv.height=vh*dpr;fitS=Math.min(vw/W,vh/H);if(G3.on){G3.resize();G3.clamp();}clampCam();req();}
function topH(){const t=document.getElementById('top');return t&&!t.hidden?t.getBoundingClientRect().bottom:0;}
function clampCam(){const minS=fitS*.85;cam.s=clamp(cam.s,minS,5);const mw=W*cam.s,mh=H*cam.s,th=topH(),vis=vh-th,px=Math.max(80,vw*.45),py=Math.max(80,vis*.4);
 cam.x=mw<vw?clamp(cam.x,(vw-mw)/2-px,(vw-mw)/2+px):clamp(cam.x,vw-mw-px,px);cam.y=mh<vis?clamp(cam.y,th+(vis-mh)/2-py,th+(vis-mh)/2+py):clamp(cam.y,vh-mh-py,th+py);}
function req(){if(!need){need=true;requestAnimationFrame(draw);}}
function centerOn(x,y,s,off=0){const th=topH();if(G3.on){G3.center(x,y,s,off,th);req();return;}cam.s=s;cam.x=off+(vw-off)/2-x*s;cam.y=th+(vh-th)/2-y*s;clampCam();req();}
function zoomAt(sx,sy,ns){if(G3.on){G3.zoomAt(sx,sy,ns);req();return;}ns=clamp(ns,fitS*.85,5);const wx=(sx-cam.x)/cam.s,wy=(sy-cam.y)/cam.s;cam.s=ns;cam.x=sx-wx*ns;cam.y=sy-wy*ns;clampCam();req();}

let mapMode='pol',polDist=null;
function renderPol(){
 const N=W*H,d=polImg.data;const col=FK.map(f=>hex2(FAC[f].c));const fi={};FK.forEach((f,k)=>fi[f]=k);
 const oi=new Int16Array(NP);for(let i=0;i<NP;i++)oi[i]=fi[S.prov[i].o];
 if(!polDist)polDist=new Uint16Array(N);const D=polDist;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,id=idMap[i];if(id<0){D[i]=65535;continue;}const o=oi[id];let src=false;
  if(x>0){const b=idMap[i-1];if(b===-2||(b>=0&&oi[b]!==o))src=true;}
  if(!src&&x<W-1){const b=idMap[i+1];if(b===-2||(b>=0&&oi[b]!==o))src=true;}
  if(!src&&y>0){const b=idMap[i-W];if(b===-2||(b>=0&&oi[b]!==o))src=true;}
  if(!src&&y<H-1){const b=idMap[i+W];if(b===-2||(b>=0&&oi[b]!==o))src=true;}
  D[i]=src?0:65535;}
 chamfer(D);
 const pol=mapMode==='pol',baseA=pol?.3:0,grad=pol?.4:.26;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,o=i*4,id=idMap[i];if(id<0){d[o+3]=0;continue;}
  const c=col[oi[id]],dist=D[i]/3;
  if(dist<1){d[o]=c[0]*.34;d[o+1]=c[1]*.34;d[o+2]=c[2]*.34;d[o+3]=235;continue;}
  if(dist<2.1){d[o]=c[0]*.8;d[o+1]=c[1]*.8;d[o+2]=c[2]*.8;d[o+3]=pol?200:150;continue;}
  let a=baseA+grad*Math.max(0,1-(dist-2)/11);
  const pb=(x<W-1&&idMap[i+1]>=0&&idMap[i+1]!==id)||(y<H-1&&idMap[i+W]>=0&&idMap[i+W]!==id);
  if(pb&&((x+y)&3)<2){d[o]=c[0]*.3;d[o+1]=c[1]*.3;d[o+2]=c[2]*.3;d[o+3]=pol?120:90;continue;}
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
  facLabels.push({f,x:cx,y:cy,sz:clamp(Math.sqrt(ba)/7.5,10,46)});});
}
function renderHL(){
 const d=hlImg.data;d.fill(0);const paint=(k,fc,ec)=>{for(let q=provStart[k];q<provStart[k+1];q++){const i=provPix[q],o=i*4,x=i%W;
  const e=(x>0&&idMap[i-1]!==k)||(x<W-1&&idMap[i+1]!==k)||idMap[i-W]!==k||idMap[i+W]!==k||(x>1&&idMap[i-2]!==k)||(x<W-2&&idMap[i+2]!==k)||idMap[i-2*W]!==k||idMap[i+2*W]!==k;
  const c=e?ec:fc;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=c[3];}};
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
function draw(){
 need=false;if(!baseC||!S)return;
 if(polDirty){renderPol();hlKey='';}
 updateHL();
 const now=performance.now(),s=curS(),g3=G3.on;
 ctx.setTransform(1,0,0,1,0,0);
 if(g3){G3.render(now);ctx.clearRect(0,0,cv.width,cv.height);}
 else{ctx.fillStyle='#1c120a';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=40;ctx.fillStyle='#2e2114';ctx.fillRect(cam.x,cam.y,W*s,H*s);ctx.shadowBlur=0;
  ctx.setTransform(dpr*s,0,0,dpr*s,dpr*cam.x,dpr*cam.y);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(baseC,0,0);ctx.drawImage(polC,0,0);ctx.drawImage(hlC,0,0);}
 ctx.setTransform(dpr,0,0,dpr,0,0);
 // sea lanes
 ctx.setLineDash([6,6]);ctx.lineWidth=1.5;ctx.strokeStyle='rgba(70,44,20,.6)';
 PD.forEach(d=>d.lanes.forEach(j=>{const e=PD[j];const a=pj(d.lx,d.ly,1),b=pj(e.lx,e.ly,1);if(!a[2]||!b[2])return;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo((a[0]+b[0])/2,(a[1]+b[1])/2-18,b[0],b[1]);ctx.stroke();}));
 ctx.setLineDash([]);
 // faction names
 if(s<1.5){ctx.textBaseline='middle';
  facLabels.forEach(l=>{const fs=l.sz*s;if(fs<9)return;const q=pj(l.x,l.y,g3?14:0);if(!q[2])return;const c=FCOL[l.f];ctx.font=`800 ${fs}px "Cinzel", Georgia, serif`;
   ctx.globalAlpha=clamp((1.5-s)/.4,0,1)*.92;ctx.lineWidth=Math.max(2.5,fs*.14);ctx.strokeStyle='rgba(248,240,218,.6)';ctx.lineJoin='round';
   const txt=FAC[l.f].s.toLocaleUpperCase('tr'),sp=fs*.2,chars=[...txt],ws=chars.map(ch=>ctx.measureText(ch).width),tot=ws.reduce((a,b)=>a+b,0)+sp*(chars.length-1);let cx=q[0]-tot/2;
   ctx.textAlign='left';ctx.fillStyle=`rgb(${c[0]*.3|0},${c[1]*.3|0},${c[2]*.3|0})`;chars.forEach((ch,k)=>{ctx.strokeText(ch,cx,q[1]);ctx.fillText(ch,cx,q[1]);cx+=ws[k]+sp;});});
  ctx.globalAlpha=1;}
 // move arrow
 if(sel>=0&&tgt>=0){const a=PD[sel],b=PD[tgt];const A=pj(a.lx,a.ly,3),B=pj(b.lx,b.ly,3);const ax=A[0],ay=A[1],bx=B[0],by=B[1];const mx=(ax+bx)/2-(by-ay)*.2,my=(ay+by)/2+(bx-ax)*.2;
  const war=S.prov[tgt].o!==S.player,cl=war?'#c8321e':'#1f8f89';const an=Math.atan2(by-my,bx-mx),ex=bx-10*Math.cos(an),ey=by-10*Math.sin(an);
  ctx.lineCap='round';ctx.strokeStyle='rgba(10,8,4,.55)';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();
  ctx.strokeStyle=cl;ctx.lineWidth=5;ctx.setLineDash([12,7]);ctx.lineDashOffset=-(now/40)%19;ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=cl;ctx.strokeStyle='rgba(10,8,4,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx+4*Math.cos(an),by+4*Math.sin(an));ctx.lineTo(bx-18*Math.cos(an-.5),by-18*Math.sin(an-.5));ctx.lineTo(bx-18*Math.cos(an+.5),by-18*Math.sin(an+.5));ctx.closePath();ctx.fill();ctx.stroke();}
 // cities, names, banners
 const vis=[],P0={};for(const d of PD){const q=pj(d.lx,d.ly);if(!q[2]||q[0]<-70||q[1]<-50||q[0]>vw+70||q[1]>vh+50)continue;P0[d.i]=q;vis.push(d);}
 vis.sort((a,b)=>P0[a.i][1]-P0[b.i][1]);
 const nearSel=new Set(sel>=0?[sel,...PD[sel].adj]:[]);const recent=new Set(S.battles.filter(b=>b.turn>=S.turn-1).map(b=>b.to));
 const szs={};
 for(const d of vis){const p=S.prov[d.i],[sx,sy]=P0[d.i],isCap=S.fac[p.o]&&S.fac[p.o].cap===d.i;
  if(g3){szs[d.i]=(1.9+p.dev*.3)*s*1.4;continue;}
  if(s>=.55){const sz=clamp((2.4+p.dev*.42)*Math.sqrt(s),3,12)*(isCap?1.3:1);szs[d.i]=sz;drawCity(sx,sy,sz,FAC[p.o].c,isCap);}
  else if(isCap){szs[d.i]=4;ctx.font='13px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(20,14,8,.7)';ctx.strokeText('★',sx,sy);ctx.fillStyle='#f1cf72';ctx.fillText('★',sx,sy);}}
 if(s>=1.3){ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  for(const d of vis){const [sx,sy0]=P0[d.i],sy=sy0+(g3?Math.min(szs[d.i],26)*.9+10:(szs[d.i]||4)*.7+9);ctx.font=`700 ${s>2?13:12}px "Cinzel", Georgia, serif`;
   ctx.lineWidth=3.5;ctx.strokeStyle='rgba(248,240,218,.85)';ctx.strokeText(d.name,sx,sy);ctx.fillStyle='#24190e';ctx.fillText(d.name,sx,sy);}}
 for(const d of vis){const p=S.prov[d.i],mine=p.o===S.player;if(p.t<=0)continue;
  if(!(s>=(vw<760?1.3:.8)||nearSel.has(d.i)||p.t>=(mine?4000:8000)))continue;
  let bx,by;if(g3&&G3.anchor[d.i]){const an=G3.anchor[d.i],q=pj(an[0],an[1],an[2]);bx=q[0];by=q[1];}else{bx=P0[d.i][0]+(szs[d.i]||3)*.95+2;by=P0[d.i][1]+(szs[d.i]||3)*.45;}
  drawBanner(bx,by,fmtK(p.t),FAC[p.o].c,mine,mine&&p.mv>=p.t*.5,p.o);
  if(recent.has(d.i))swords(P0[d.i][0]-(g3?12:(szs[d.i]||3)*1.2+8),P0[d.i][1]-(g3?14:4));}
 drawFx(now);
 if(g3||fx.length||(sel>=0&&tgt>=0)){need=true;requestAnimationFrame(draw);}
}
function drawCity(x,y,sz,col,cap){
 const w=sz*1.8,h=sz*.85,x0=x-w/2,yb=y+sz*.45;
 ctx.fillStyle='rgba(25,18,8,.35)';ctx.beginPath();ctx.ellipse(x+1.5,yb+1,w*.62,sz*.32,0,0,7);ctx.fill();
 ctx.lineWidth=Math.max(.8,sz*.09);ctx.strokeStyle='#33261a';ctx.lineJoin='miter';
 ctx.fillStyle='#e6d9bb';ctx.fillRect(x0,yb-h,w,h);
 const mw=w/7;ctx.fillStyle='#e6d9bb';for(let k=0;k<4;k++){const mx=x0+k*(w-mw)/3;ctx.fillRect(mx,yb-h-sz*.22,mw,sz*.22);ctx.strokeRect(mx,yb-h-sz*.22,mw,sz*.22);}
 ctx.fillStyle='rgba(0,0,0,.14)';ctx.fillRect(x,yb-h,w/2,h);ctx.strokeRect(x0,yb-h,w,h);
 const tw=w*.42,th=h*1.6,tx=x-tw/2,ty=yb-th;
 ctx.fillStyle='#f1e7cd';ctx.fillRect(tx,ty,tw,th);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x,ty,tw/2,th);ctx.strokeRect(tx,ty,tw,th);
 ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(tx-sz*.12,ty);ctx.lineTo(x,ty-sz*.8);ctx.lineTo(tx+tw+sz*.12,ty);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#33261a';ctx.beginPath();ctx.arc(x,yb-sz*.22,sz*.15,Math.PI,0);ctx.lineTo(x+sz*.15,yb);ctx.lineTo(x-sz*.15,yb);ctx.closePath();ctx.fill();
 if(cap){const py=ty-sz*.8;ctx.lineWidth=Math.max(1,sz*.1);ctx.beginPath();ctx.moveTo(x,py);ctx.lineTo(x,py-sz*.95);ctx.stroke();
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x,py-sz*.95);ctx.lineTo(x+sz*.85,py-sz*.78);ctx.lineTo(x,py-sz*.55);ctx.closePath();ctx.fill();ctx.lineWidth=.8;ctx.stroke();}
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

