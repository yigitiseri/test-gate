/* =====================================================================
   CRISP MAP (2D): the map raster is only W x H, so up close it blurs and borders turn into stairs. The lines
   are traced once into smooth vector paths (coast, sea rings, province edges), cut into pieces bucketed on a
   grid, and painted into 256 px tiles at the current zoom step (cached, a few new tiles per frame), so panning
   only copies tiles. Up close the terrain symbols (02b) come from sprites rendered for that zoom step.
   Far out the baked map (wash + season tint + the same detail painted once) is used, crossfading in between.
   Seasons (02b): the tint, the symbols (bare and snowy trees, autumn leaves) and frozen rivers follow S.turn.
   ===================================================================== */
const VM={chains:[],byProv:[],cells:[],CG:96,GC:0,polSig:'',selKey:'',sel:null,tgt:null,pick:null,spr:new Map(),sprZ:0,gran:null,ms:0,ground:null,lines:null,pol:null,baked:new Map(),cam:'',camT:0};
const VM_RINGS=[[3.2,.36],[6,.27],[9,.2],[12.2,.14],[15.6,.08]];   // distance from the coast (px), ink strength

/** Douglas-Peucker on a flat [x,y,...] list; keeps the ends. */
function vmDP(p,eps){const n=p.length/2;if(n<3)return p;const keep=new Uint8Array(n);keep[0]=keep[n-1]=1;const st=[0,n-1],e2=eps*eps;
 while(st.length){const b=st.pop(),a=st.pop();const ax=p[2*a],ay=p[2*a+1],dx=p[2*b]-ax,dy=p[2*b+1]-ay,l=dx*dx+dy*dy||1;let bi=-1,bd=e2;
  for(let k=a+1;k<b;k++){const px=p[2*k]-ax,py=p[2*k+1]-ay,t=clamp((px*dx+py*dy)/l,0,1),qx=px-t*dx,qy=py-t*dy,d=qx*qx+qy*qy;if(d>bd){bd=d;bi=k;}}
  if(bi>0){keep[bi]=1;st.push(a,bi,bi,b);}}
 const o=[];for(let k=0;k<n;k++)if(keep[k])o.push(p[2*k],p[2*k+1]);return o;}
/** One Chaikin pass; open lines keep their ends (junctions stay shared between neighbours). */
function vmChaikin(p,closed){const n=p.length/2;if(n<3)return p;const o=closed?[]:[p[0],p[1]];
 for(let k=0;k<(closed?n:n-1);k++){const j=(k+1)%n,ax=p[2*k],ay=p[2*k+1],bx=p[2*j],by=p[2*j+1];o.push(ax*.75+bx*.25,ay*.75+by*.25,ax*.25+bx*.75,ay*.25+by*.75);}
 if(!closed)o.push(p[2*n-2],p[2*n-1]);return o;}
function vmAdd(path,p,closed){path.moveTo(p[0],p[1]);for(let k=2;k<p.length;k+=2)path.lineTo(p[k],p[k+1]);if(closed)path.closePath();}

/** Trace the edges between differently labelled pixels (province id, -1 sea, -2 unassigned land) into chains
 that run from junction to junction, smoothed. */
function vmTrace(){const lab=(x,y)=>idMap[y*W+x],key=(a,b)=>a<b?(a+3)*4096+b+3:(b+3)*4096+a+3;
 const hv=new Uint8Array(W*(H+1)),vv=new Uint8Array((W+1)*H),chains=[];
 // edges at corner (cx,cy): [kind, ex, ey, to-x, to-y]; H(x,y) separates (x,y-1)|(x,y), V(x,y) separates (x-1,y)|(x,y)
 const inc=(cx,cy,o)=>{o.length=0;
  if(cy>=1&&cy<=H-1){if(cx<=W-1&&lab(cx,cy-1)!==lab(cx,cy))o.push(0,cx,cy,cx+1,cy);if(cx>=1&&lab(cx-1,cy-1)!==lab(cx-1,cy))o.push(0,cx-1,cy,cx-1,cy);}
  if(cx>=1&&cx<=W-1){if(cy<=H-1&&lab(cx-1,cy)!==lab(cx,cy))o.push(1,cx,cy,cx,cy+1);if(cy>=1&&lab(cx-1,cy-1)!==lab(cx,cy-1))o.push(1,cx,cy-1,cx,cy-1);}
  return o.length/5;};
 const ek=(t,x,y)=>t?key(lab(x-1,y),lab(x,y)):key(lab(x,y-1),lab(x,y)),seen=(t,x,y)=>t?vv[y*(W+1)+x]:hv[y*W+x],mark=(t,x,y)=>{if(t)vv[y*(W+1)+x]=1;else hv[y*W+x]=1;};
 const tmp=[];
 const walk=(sx,sy,fx,fy,k,pts)=>{let cx=sx,cy=sy,px=fx,py=fy;   // from corner (cx,cy), having come from (px,py); true when the loop closes
  for(;;){if(inc(cx,cy,tmp)!==2)return false;const q=tmp[3]===px&&tmp[4]===py?5:0,t=tmp[q],ex=tmp[q+1],ey=tmp[q+2];
   if(ek(t,ex,ey)!==k)return false;if(seen(t,ex,ey))return true;mark(t,ex,ey);
   px=cx;py=cy;cx=tmp[q+3];cy=tmp[q+4];pts.push(cx,cy);}};
 const start=(t,x,y)=>{mark(t,x,y);const k=ek(t,x,y),ax=x,ay=y,bx=t?x:x+1,by=t?y+1:y;
  const fw=[ax,ay,bx,by],closed=walk(bx,by,ax,ay,k,fw);let pts=fw;
  if(!closed){const bw=[];walk(ax,ay,bx,by,k,bw);if(bw.length){const r=[];for(let q=bw.length-2;q>=0;q-=2)r.push(bw[q],bw[q+1]);pts=r.concat(fw);}}
  const a=Math.floor(k/4096)-3,b=k%4096-3,n=pts.length/2;let m;
  if(closed){m=[];for(let q=0;q<n-1;q++)m.push((pts[2*q]+pts[2*q+2])/2,(pts[2*q+1]+pts[2*q+3])/2);}
  else{m=[pts[0],pts[1]];for(let q=0;q<n-1;q++)m.push((pts[2*q]+pts[2*q+2])/2,(pts[2*q+1]+pts[2*q+3])/2);m.push(pts[2*n-2],pts[2*n-1]);}
  if(closed){m.push(m[0],m[1]);m=vmDP(m,.5);m.length-=2;}else m=vmDP(m,.5);
  chains.push({a,b,closed,p:new Float32Array(vmChaikin(m,closed))});};
 for(let y=1;y<H;y++)for(let x=0;x<W;x++)if(!hv[y*W+x]&&lab(x,y-1)!==lab(x,y))start(0,x,y);
 for(let y=0;y<H;y++)for(let x=1;x<W;x++)if(!vv[y*(W+1)+x]&&lab(x-1,y)!==lab(x,y))start(1,x,y);
 return chains;}

/** Iso-lines of a distance field (marching squares, pixel centres), chained and lightly simplified. */
function vmContour(F,lv){const segs=[],at=new Map();
 const P2=e=>{const i=e>>1,x=i%W,y=(i/W)|0,v0=F[i],v1=(e&1)?F[i+W]:F[i+1],t=v1===v0?.5:clamp((lv-v0)/(v1-v0),0,1);return (e&1)?[x+.5,y+t+.5]:[x+t+.5,y+.5];};
 const T=[null,[3,0],[0,1],[3,1],[1,2],[3,0,1,2],[0,2],[3,2],[2,3],[0,2],[0,1,2,3],[1,2],[1,3],[0,1],[3,0]];
 const add=(e1,e2)=>{const s=segs.length/2;segs.push(e1,e2);for(const e of[e1,e2]){const l=at.get(e);if(l)l.push(s);else at.set(e,[s]);}};
 for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++){const i=y*W+x,c=(F[i]>lv?1:0)|(F[i+1]>lv?2:0)|(F[i+W+1]>lv?4:0)|(F[i+W]>lv?8:0);if(!c||c===15)continue;
  const E=[2*i,2*(i+1)+1,2*(i+W),2*i+1],tb=T[c];for(let q=0;q<tb.length;q+=2)add(E[tb[q]],E[tb[q+1]]);}
 const used=new Uint8Array(segs.length/2),out=[];
 const ext=(s,from,list)=>{let e=from;for(;;){const l=at.get(e);if(!l)return false;let n=-1;for(const t of l)if(t!==s&&!used[t]){n=t;break;}
   if(n<0)return l.some(t=>t!==s&&used[t]);used[n]=1;e=segs[2*n]===e?segs[2*n+1]:segs[2*n];list.push(e);s=n;}};
 for(let s=0;s<used.length;s++){if(used[s])continue;used[s]=1;const fw=[segs[2*s],segs[2*s+1]];const closed=ext(s,fw[1],fw);
  let es=fw;if(!closed){const bw=[];ext(s,fw[0],bw);es=bw.reverse().concat(fw);}
  if(es.length<4)continue;const p=[];for(const e of es){const q=P2(e);p.push(q[0],q[1]);}out.push({closed,p:vmDP(p,.3)});}
 return out;}

/** Bucket a polyline into grid cells in pieces of at most 40 points (neighbouring pieces share an end point). */
function vmBucket(cat,k,p,closed){if(closed)p=p.concat([p[0],p[1]]);const n=p.length/2,CG=VM.CG;
 for(let a=0;a<n-1;a+=39){const b=Math.min(n-1,a+40),q=p.slice(2*a,2*b+2);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(let j=0;j<q.length;j+=2){x0=Math.min(x0,q[j]);x1=Math.max(x1,q[j]);y0=Math.min(y0,q[j+1]);y1=Math.max(y1,q[j+1]);}
  const c=VM.cells[clamp(Math.floor((y0+y1)/2/CG),0,VM.GR-1)*VM.GC+clamp(Math.floor((x0+x1)/2/CG),0,VM.GC-1)];
  c.pieces.push({cat,k,p:q});c.x0=Math.min(c.x0,x0);c.y0=Math.min(c.y0,y0);c.x1=Math.max(c.x1,x1);c.y1=Math.max(c.y1,y1);}}
function vmBuild(){const t0=performance.now();
 VM.chains=vmTrace();VM.byProv=Array.from({length:NP},()=>[]);
 VM.GC=Math.ceil(W/VM.CG);VM.GR=Math.ceil(H/VM.CG);VM.cells=Array.from({length:VM.GC*VM.GR},()=>({pieces:[],x0:1e9,y0:1e9,x1:-1e9,y1:-1e9,paths:{},sig:''}));
 VM.chains.forEach((c,k)=>{if(c.a>=0)VM.byProv[c.a].push(k);if(c.b>=0)VM.byProv[c.b].push(k);vmBucket(c.a===-1||c.b===-1?'coast':'chain',k,Array.from(c.p),c.closed);});
 VM_RINGS.forEach((r,j)=>vmContour(SEAD,r[0]*3).forEach(l=>vmBucket('r'+j,-1,l.p,l.closed)));
 // pigment granulation for the political wash (07 renderPol)
 VM.gran=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)VM.gran[y*W+x]=clamp((vnoise(x/9+31,y/9+17)*.7+vnoise(x/3.3,y/3.3+5)*.3)*255,0,255);
 // the low-zoom map: the wash with the same detail painted once
 baseC=vmBake(0);
 VM.ground=vtLayer((g,se,r,z)=>vmGroundPaint(g,se,r,z,seasonOf()));VM.lines=vtLayer((g,se,r)=>vmLinesPaint(g,se,r));VM.pol=vtLayer((g,se,r)=>hrPolPaint(g,se,r));
 VM.ms=Math.round(performance.now()-t0);KE.stats.vmMs=VM.ms;}
/** The low-zoom map of a season (the two latest kept). */
function vmBake(k){let c=VM.baked.get(k);if(c){VM.baked.delete(k);VM.baked.set(k,c);return c;}
 c=mk(W,H);const g=c.getContext('2d',CPU2D);g.drawImage(baseC0,0,0);g.drawImage(seasonCanvas(k,true),0,0);vmGroundPaint(g,1,null,0,k);c=gpuCopy(c);
 VM.baked.set(k,c);while(VM.baked.size>2)VM.baked.delete(VM.baked.keys().next().value);return c;}
/** Cells whose pieces reach into rect r (null: all). */
function vmCellsIn(r){return r?VM.cells.filter(c=>c.pieces.length&&c.x1>=r.x0&&c.x0<=r.x1&&c.y1>=r.y0&&c.y0<=r.y1):VM.cells.filter(c=>c.pieces.length);}
/** A cell's Path2D for one category (built once; 'realm'/'prov' rebuilt when the owners change). */
function vmCellPath(c,cat){if(cat==='realm'||cat==='prov'){if(c.sig!==VM.polSig){c.sig=VM.polSig;delete c.paths.realm;delete c.paths.prov;}}
 let p=c.paths[cat];if(p)return p;p=c.paths[cat]=new Path2D();
 for(const q of c.pieces){let ok=q.cat===cat;if(!ok&&q.cat==='chain'&&(cat==='realm'||cat==='prov')){const ch=VM.chains[q.k],oa=ch.a>=0?S.prov[ch.a].o:null,ob=ch.b>=0?S.prov[ch.b].o:null;ok=(oa&&ob&&oa!==ob)===(cat==='realm');}
  if(ok)vmAdd(p,q.p,false);}return p;}

/** Coast, sea rings, rivers, terrain symbols and decoration in map units. se: screen px per map unit (line widths);
 r: map rect to cover (null = everything, painted directly: baking); z: device scale for the symbol sprites. */
function vmGroundPaint(g,se,r,z,k){const cells=vmCellsIn(r),px=w=>w/se,bake=!r;
 if(!bake){g.beginPath();g.rect(0,0,W,H);g.clip();hrWash(g,r,z);const sc=seasonCanvas(k,true);g.drawImage(sc,r.x0,r.y0,r.x1-r.x0,r.y1-r.y0,r.x0,r.y0,r.x1-r.x0,r.y1-r.y0);}   // close up: the wash itself is redrawn sharp (07l)
 g.lineJoin='round';g.lineCap='round';
 VM_RINGS.forEach(([,a],j)=>{g.strokeStyle=`rgba(52,72,68,${a})`;g.lineWidth=bake?1.05:px(1);cells.forEach(c=>g.stroke(vmCellPath(c,'r'+j)));});
 g.strokeStyle='rgba(222,214,184,.55)';g.lineWidth=bake?2.2:px(clamp(2.4*se,2.4,6));cells.forEach(c=>g.stroke(vmCellPath(c,'coast')));   // foam
 g.strokeStyle='rgba(58,42,26,.85)';g.lineWidth=bake?.95:px(clamp(.95*se,1.05,2.4));cells.forEach(c=>g.stroke(vmCellPath(c,'coast')));
 mapRivers(g,k,r);
 if(bake){g.save();for(const o of MSYM){g.setTransform(1,0,0,1,o.x,o.y);symPaint(g,o,symSea(o,k));}g.restore();}
 else{const L=MSYM,y0=r.y0-16,y1=r.y1+40;let lo=0,hi=L.length;while(lo<hi){const m=(lo+hi)>>1;if(L[m].y<y0)lo=m+1;else hi=m;}
  for(let k=lo;k<L.length&&L[k].y<=y1;k++){const o=L[k];if(o.x<r.x0-20||o.x>r.x1+20)continue;const sp=vmSprite(o,z,symSea(o,k));g.drawImage(sp.c,o.x+sp.ox,o.y+sp.oy,sp.w,sp.h);}}
 mapDecor(g,true,r);}
/** Realm borders (owners differ) and province edges (same owner). */
function vmLinesPaint(g,se,r){if(!S)return;const cells=vmCellsIn(r),pol=mapMode!=='ter',k=Math.sqrt(clamp(se,.6,2.2));
 g.lineJoin='round';g.lineCap='round';
 g.setLineDash([3.5/se,2.5/se]);g.strokeStyle=pol?'rgba(46,32,18,.34)':'rgba(46,32,18,.22)';g.lineWidth=.8*k/se;cells.forEach(c=>g.stroke(vmCellPath(c,'prov')));g.setLineDash([]);
 if(pol){g.strokeStyle='rgba(36,22,12,.2)';g.lineWidth=4*k/se;cells.forEach(c=>g.stroke(vmCellPath(c,'realm')));}
 g.strokeStyle=pol?'rgba(40,26,14,.88)':'rgba(40,26,14,.5)';g.lineWidth=(pol?1.5:1)*k/se;cells.forEach(c=>g.stroke(vmCellPath(c,'realm')));}
/** Sprite of a symbol at device scale z (cached per zoom step; sizes quantised to a quarter unit). */
function vmSprite(o,z,se){if(VM.sprZ!==z){VM.spr.clear();VM.sprZ=z;}const q=Math.round(o.sz*4)/4,k=o.t+o.v+se+'|'+q;let sp=VM.spr.get(k);if(sp)return sp;
 const b=symBox(o.t,q),cw=Math.ceil((b[2]-b[0])*z)+2,ch=Math.ceil((b[3]-b[1])*z)+2,c=mk(cw,ch),g=c.getContext('2d',CPU2D);
 g.setTransform(z,0,0,z,-b[0]*z+1,-b[1]*z+1);symPaint(g,{t:o.t,v:o.v,sz:q},se);
 sp={c,ox:b[0]-1/z,oy:b[1]-1/z,w:cw/z,h:ch/z};VM.spr.set(k,sp);return sp;}

/* ---- tiles: a layer painted into 256 px tiles per zoom step (quarter octaves), kept in a GPU atlas ----
   A tile is painted with paths on a CPU scratch canvas (paths are cheap there), copied once into its slot of one
   GPU canvas per layer (80 slots, LRU), and every frame only copies slots to the screen: no per-frame uploads.
   Each slot keeps a 1 px gutter of real content so smoothing never bleeds a neighbour slot into a seam. */
const VT_T=256,VT_G=VT_T+2,VT_C=10,VT_R=8,VT_N=VT_C*VT_R,VT_SCR={c:null};
function vtLayer(paint){return {paint,sig:'',m:new Map(),atlas:null,ag:null,free:[]};}
function vtSlot(L){if(!L.atlas){L.atlas=mk(VT_C*VT_G,VT_R*VT_G);L.ag=L.atlas.getContext('2d');for(let k=VT_N-1;k>=0;k--)L.free.push(k);}
 if(L.free.length)return L.free.pop();const key=L.m.keys().next().value,t=L.m.get(key);L.m.delete(key);return t.slot;}
const vtXY=k=>[(k%VT_C)*VT_G,Math.floor(k/VT_C)*VT_G];
/** Draw layer L over the view (map transform set on ctx). Missing tiles are all painted in one go once the camera
 is still (a tile takes a few ms; spreading them over frames costs more in atlas updates than it saves), none while
 it moves (still=false); meanwhile cached tiles of another zoom step stand in (clipped) and another frame is asked for. */
function vtDraw(L,s,sig,still=true){const zd=s*dpr,z=Math.min(8,Math.pow(2,Math.round(Math.log2(zd)*4)/4)),u=VT_T/z;
 if(L.sig!==sig){L.sig=sig;for(const t of L.m.values())L.free.push(t.slot);L.m.clear();}
 const vx0=-cam.x/s,vy0=-cam.y/s,vx1=(vw-cam.x)/s,vy1=(vh-cam.y)/s;
 const tx0=Math.max(0,Math.floor(vx0/u)),ty0=Math.max(0,Math.floor(vy0/u)),tx1=Math.min(Math.ceil(W/u)-1,Math.floor(vx1/u)),ty1=Math.min(Math.ceil(H/u)-1,Math.floor(vy1/u));
 const t0=performance.now(),first=!L.m.size,want=new Set(),q0=ctx.imageSmoothingQuality;let more=false,made=0;
 ctx.imageSmoothingQuality='low';   // slots are drawn near 1:1; 'high' would rebuild the atlas mipmaps whenever a tile is added
 for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++)want.add(z+'|'+tx+'|'+ty);
 for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const key=z+'|'+tx+'|'+ty;let t=L.m.get(key);
  if(t){L.m.delete(key);L.m.set(key,t);}
  else if((first||still)&&want.size<=VT_N){made++;const t1=performance.now();
   const slot=vtSlot(L);
   const c=VT_SCR.c||(VT_SCR.c=mk(VT_G,VT_G)),g=c.getContext('2d',CPU2D);g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,VT_G,VT_G);
   g.save();g.setTransform(z,0,0,z,-tx*VT_T+1,-ty*VT_T+1);const e=1/z;L.paint(g,z/dpr,{x0:tx*u-e,y0:ty*u-e,x1:(tx+1)*u+e,y1:(ty+1)*u+e},z);g.restore();
   const [sx,sy]=vtXY(slot);L.ag.clearRect(sx,sy,VT_G,VT_G);L.ag.drawImage(c,sx,sy);
   t={slot,z,tx,ty};L.m.set(key,t);KE.stats.vtTiles=(KE.stats.vtTiles||0)+1;KE.stats.vtMs=(KE.stats.vtMs||0)+performance.now()-t1;}
  if(t){const [sx,sy]=vtXY(t.slot);ctx.drawImage(L.atlas,sx+1,sy+1,VT_T,VT_T,tx*u,ty*u,u,u);continue;}
  more=true;if(!L.atlas)continue;const x0=tx*u,y0=ty*u;ctx.save();ctx.beginPath();ctx.rect(x0,y0,u,u);ctx.clip();   // stand-in: tiles of another zoom step
  for(const o of L.m.values()){if(o.z===z)continue;const ou=VT_T/o.z,ox=o.tx*ou,oy=o.ty*ou;if(ox<x0+u&&ox+ou>x0&&oy<y0+u&&oy+ou>y0){const [sx,sy]=vtXY(o.slot);ctx.drawImage(L.atlas,sx+1,sy+1,VT_T,VT_T,ox,oy,ou,ou);}}
  ctx.restore();}
 ctx.imageSmoothingQuality=q0;L.last={n:want.size,miss:[...want].filter(k=>!L.m.has(k)).length,z};if(more)req();}

/* ---- sprite atlas: small images drawn every frame (towns, soldiers) live on one GPU canvas, shelf-packed;
   when it fills up it starts over (gen changes and callers repaint what they still need) ---- */
const SA={c:null,g:null,x:0,y:0,h:0,gen:0,S:2048,scr:null};
/** Put a w x h (device px) image painted by paint(g) on its own CPU canvas into the atlas: {gen,x,y,w,h}. */
function saAdd(w,h,paint){w=Math.min(SA.S,Math.ceil(w));h=Math.min(SA.S,Math.ceil(h));
 if(!SA.c){SA.c=mk(SA.S,SA.S);SA.g=SA.c.getContext('2d');}
 if(SA.x+w>SA.S){SA.x=0;SA.y+=SA.h+1;SA.h=0;}
 if(SA.y+h>SA.S){SA.g.clearRect(0,0,SA.S,SA.S);SA.x=SA.y=SA.h=0;SA.gen++;}
 const c=mk(w,h),g=c.getContext('2d',CPU2D);paint(g);SA.g.drawImage(c,SA.x,SA.y);
 const e={gen:SA.gen,x:SA.x,y:SA.y,w,h};SA.x+=w+1;SA.h=Math.max(SA.h,h);return e;}
/** Draw an atlas entry into the rect (dx,dy,dw,dh) of context c. */
function saDraw(c,e,dx,dy,dw,dh){const q=c.imageSmoothingQuality;c.imageSmoothingQuality='low';c.drawImage(SA.c,e.x,e.y,e.w,e.h,dx,dy,dw,dh);c.imageSmoothingQuality=q;}

/** The ground in 2D (called with the map transform set): baked map far out, crisp tiles up close. */
/** How far into the close-up look the view is (0 far: baked map and raster colours; 1 near: tiles). */
const vmF=s=>clamp((s*dpr-1.2)/.35,0,1);
function vmGround(s){const f=vmF(s),k=seasonOf(),still=vmStill(s);
 ctx.drawImage(vmBake(k),0,0);   // under the tiles: shows where tiles are still to be painted (none while the camera moves)
 if(f>0){ctx.save();ctx.globalAlpha=f;vtDraw(VM.ground,s,'g'+k,still);ctx.restore();}}
/** Political colours up close, from the province outlines (07l), inside the graduated frame. */
function vmPol(s,f){const fm=19;ctx.save();ctx.globalAlpha=f;ctx.beginPath();ctx.rect(fm,fm,W-2*fm,H-2*fm);ctx.clip();vtDraw(VM.pol,s,hrPolSig());ctx.restore();}
/** Has the camera stayed put since the last frame? While it moves (a drag, a replay) no new ground tiles are painted;
 a frame is asked for shortly after it stops, to paint them. */
function vmStill(s){const sig=cam.x.toFixed(1)+','+cam.y.toFixed(1)+','+s.toFixed(4),still=sig===VM.cam;VM.cam=sig;
 if(!still){clearTimeout(VM.camT);VM.camT=setTimeout(req,180);}return still;}
function vmLines(s){if(!S)return;const sig=S.prov.map(p=>p.o).join()+mapMode;if(sig!==VM.polSig)VM.polSig=sig;vtDraw(VM.lines,s,sig);}
/** Outline of the selected province, the target, or the realm being picked on the start screen. */
function vmSel(s){if(!S)return;const key=hlKey;if(key!==VM.selKey){VM.selKey=key;VM.sel=VM.tgt=VM.pick=null;
  const path=list=>{const p=new Path2D();list.forEach(k=>{const c=VM.chains[k];vmAdd(p,c.p,c.closed);});return p;};
  if(startPick){const own=i=>i>=0&&S.prov[i].o===startPick,L=[];VM.chains.forEach((c,k)=>{if(own(c.a)!==own(c.b))L.push(k);});VM.pick=path(L);}
  else if(sel>=0){VM.sel=path(VM.byProv[sel]);if(tgt>=0)VM.tgt=path(VM.byProv[tgt]);}}
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 for(const [p,c] of [[VM.pick,'255,240,196'],[VM.sel,'255,240,196'],[VM.tgt,'255,255,255']]){if(!p)continue;
  ctx.strokeStyle=`rgba(${c},.35)`;ctx.lineWidth=6/s;ctx.stroke(p);ctx.strokeStyle=`rgba(${c},1)`;ctx.lineWidth=2.2/s;ctx.stroke(p);
  ctx.strokeStyle='rgba(40,26,14,.55)';ctx.lineWidth=.7/s;ctx.stroke(p);}
 ctx.restore();}
KE.vm={VM,f:s=>vmF(s),tiles:L=>VM[L]?[...VM[L].m.keys()]:[]};
