/* =====================================================================
   CLOSE-UP QUALITY (2D): up close the map is no longer a magnified 1500 px picture.
    - The wash is recomputed for every ground tile (07h) from the map fields (height, moisture, signed distance to
      the coast, shading) interpolated between pixels: coasts, rock and snow lines stay sharp, a fine pigment grain
      appears, and the rhumb lines are redrawn thin. Sampled at 0.6 x the zoom (1 to 1.7 samples per map pixel), then smoothed.
    - The political colours are filled from each province's outline (rings built from the traced edges, 07h),
      with the watercolour darkening along realm borders and the occupation hatching, in their own tile layer.
    - The selection and its neighbours are filled from the same outlines.
   ===================================================================== */
const HR={rings:null,box:null,pat:new Map(),glow:[]};
/** Bilinear sample of a W x H field at map point (x,y) (pixel centres at +0.5). */
function hrBil(A,x,y){x-=.5;y-=.5;const x0=x<0?0:x>W-2?W-2:Math.floor(x),y0=y<0?0:y>H-2?H-2:Math.floor(y),fx=clamp(x-x0,0,1),fy=clamp(y-y0,0,1),i=y0*W+x0;
 const a=A[i],b=A[i+1],c=A[i+W],d=A[i+W+1];return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;}
/** Fast value noise from a 256 x 256 table (smoothstep-interpolated), for the per-pixel grain. */
const HR_NT=(()=>{const t=new Float32Array(65536);for(let i=0;i<65536;i++)t[i]=hash(i&255,i>>8);return t;})();
function hrNoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),x0=xi&255,y0=(yi&255)<<8,x1=(xi+1)&255,y1=((yi+1)&255)<<8;
 const a=HR_NT[y0|x0],b=HR_NT[y0|x1],c=HR_NT[y1|x0],d=HR_NT[y1|x1];return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
const HR_RH=[[17.2,34.4,1],[37.4,42.6,.8],[27.4,35.6,.6]];
/** Paint the wash for map rect r into g (whose transform maps map units to device pixels at scale z). */
function hrWash(g,r,z){const mw=r.x1-r.x0,mh=r.y1-r.y0,spp=clamp(z*.6,1,1.7),cw=Math.max(8,Math.ceil(mw*spp)),ch=Math.max(8,Math.ceil(mh*spp));
 const c=HR.wc&&HR.wc.width===cw&&HR.wc.height===ch?HR.wc:(HR.wc=mk(cw,ch)),wg=c.getContext('2d',CPU2D),img=wg.createImageData(cw,ch),d=img.data;
 const F=FLD,SH0=[186,206,186],DP0=[110,148,146],rh=HR_RH.map(([lo,la,al])=>{const p=P(lo,la);return [p[0],p[1],al];}),lw=.5;
 for(let py=0;py<ch;py++){const y=r.y0+(py+.5)/spp;for(let px=0;px<cw;px++){const x=r.x0+(px+.5)/spp,o=(py*cw+px)*4;let c0,c1,c2;
  const gsd=hrBil(F.G,x,y)/3,mo=.9+hrBil(F.MO,x,y)/1600;
  if(gsd>0){   // sea: depth tint, a swell of noise, the foam and pale shallows by the shore, the rhumb lines
   const t=Math.pow(Math.min(gsd/70,1),.7),v=hrBil(F.SV,x,y)/6;c0=SH0[0]+(DP0[0]-SH0[0])*t+v*.7;c1=SH0[1]+(DP0[1]-SH0[1])*t+v*.8;c2=SH0[2]+(DP0[2]-SH0[2])*t+v*.8;
   const fa=gsd<1.6?.55:gsd<4?.3*(4-gsd)/2.4:0;if(fa){const fc=gsd<1.6?[238,228,198]:[226,224,196];c0+=(fc[0]-c0)*fa;c1+=(fc[1]-c1)*fa;c2+=(fc[2]-c2)*fa;}
   for(const [cx,cy,al] of rh){const dx=x-cx,dy=y-cy,rr=Math.sqrt(dx*dx+dy*dy);if(rr<4)continue;const an=Math.atan2(dy,dx),k=Math.round(an/(Math.PI/16)),dd=rr*Math.abs(Math.sin(an-k*Math.PI/16));
    if(dd<lw){const kk=((k%32)+32)%32,a=(1-dd/lw)*(kk%4===0?.45:kk%2===0?.4:.36)*al,lc=kk%4===0?[40,32,22]:kk%2===0?[34,96,54]:[150,40,28];c0+=(lc[0]-c0)*a;c1+=(lc[1]-c1)*a;c2+=(lc[2]-c2)*a;}}}
  else{const e=hrBil(F.E,x,y),m=hrBil(F.M,x,y),sh=hrBil(F.SH,x,y)/180,ld=-gsd;let cc=landCol(m);
   if(e>.36)cc=lerp3(cc,[150,134,114],Math.min(1,(e-.36)/.22)*.85);
   if(e>.64)cc=lerp3(cc,[246,244,238],Math.min(1,(e-.64)/.1));
   if(ld<2.6&&e<.3)cc=lerp3(cc,[228,210,164],.5);
   const gr=(hrNoise(x/3.1,y/3.1)-.5)*6+(hrNoise(x/11+3,y/11+8)-.5)*14+(hrNoise(x*1.7+41,y*1.7+13)-.5)*5;   // the 1.7 octave is the close-up grain
   c0=cc[0]*sh+gr;c1=cc[1]*sh+gr;c2=cc[2]*sh+gr*.8;const L=c0*.3+c1*.59+c2*.11;c0+=(L*1.1+8-c0)*.36;c1+=(L*.98+4-c1)*.36;c2+=(L*.78-c2)*.36;}
  d[o]=c0*mo;d[o+1]=c1*mo;d[o+2]=c2*mo*.97;d[o+3]=255;}}
 wg.putImageData(img,0,0);g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(c,r.x0,r.y0,mw,mh);g.restore();}

/* ---- province outlines (rings) from the traced chains ---- */
function hrRings(){if(HR.rings)return;HR.rings=[];HR.box=[];
 for(let i=0;i<NP;i++){const path=new Path2D(),L=VM.byProv[i].map(k=>VM.chains[k]),used=new Uint8Array(L.length);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  const key=(p,j)=>p[j]+','+p[j+1];
  for(const c of L)for(let j=0;j<c.p.length;j+=2){x0=Math.min(x0,c.p[j]);x1=Math.max(x1,c.p[j]);y0=Math.min(y0,c.p[j+1]);y1=Math.max(y1,c.p[j+1]);}
  for(let s=0;s<L.length;s++){if(used[s])continue;used[s]=1;const c=L[s];
   if(c.closed){vmAdd(path,c.p,true);continue;}
   const pts=Array.from(c.p),start=key(pts,0);let end=key(pts,pts.length-2);
   for(let guard=0;guard<L.length&&end!==start;guard++){let f=-1,rev=false;
    for(let t=0;t<L.length;t++){if(used[t]||L[t].closed)continue;const q=L[t].p;if(key(q,0)===end){f=t;break;}if(key(q,q.length-2)===end){f=t;rev=true;break;}}
    if(f<0)break;used[f]=1;const q=Array.from(L[f].p);if(rev){const r=[];for(let j=q.length-2;j>=0;j-=2)r.push(q[j],q[j+1]);q.length=0;q.push(...r);}
    for(let j=2;j<q.length;j++)pts.push(q[j]);end=key(pts,pts.length-2);}
   if(end!==start)(HR.open||(HR.open=[])).push(i);vmAdd(path,pts,true);}
  HR.rings.push(path);HR.box.push([x0,y0,x1,y1]);}}
/** Chains of province i on a realm border (the neighbour has another owner, or is unassigned land). */
function hrRealmEdges(i){const o=S.prov[i].o,p=new Path2D();let any=false;
 for(const k of VM.byProv[i]){const c=VM.chains[k],j=c.a===i?c.b:c.a;if(j===-1)continue;if(j>=0&&S.prov[j].o===o)continue;vmAdd(p,c.p,c.closed);any=true;}return any?p:null;}
function hrHatch(col){let p=HR.pat.get(col);if(p)return p;const c=mk(9,9),g=c.getContext('2d',CPU2D),q=hex2(col);
 for(let y=0;y<9;y++)for(let x=0;x<9;x++){const m=(x+y)%9;if(m<4){const e=m===0||m===3?.72:1;g.fillStyle=`rgba(${q[0]*e|0},${q[1]*e|0},${q[2]*e|0},.8)`;g.fillRect(x,y,1,1);}}
 p=c;HR.pat.set(col,p);return p;}
/** Political colours for map rect r (map units on g). */
function hrPolPaint(g,se,r){if(!S)return;hrRings();const pol=mapMode==='pol',base=pol?.3:0,glow=pol?1:.65;
 g.lineJoin='round';g.lineCap='round';
 for(let i=0;i<NP;i++){const b=HR.box[i];if(b[2]<r.x0-14||b[0]>r.x1+14||b[3]<r.y0-14||b[1]>r.y1+14)continue;
  const p=S.prov[i],col=typeof vasMapCol==='function'?vasMapCol(p.o):FAC[p.o].c,q=hex2(col),ring=HR.rings[i];
  g.save();g.clip(ring,'evenodd');
  if(base){g.fillStyle=`rgba(${q[0]},${q[1]},${q[2]},${base})`;g.fill(ring,'evenodd');}
  const ed=hrRealmEdges(i);if(ed){for(const [w,a] of [[26,.07],[17,.08],[10,.1],[5,.12],[2.2,.12]]){g.strokeStyle=`rgba(${q[0]},${q[1]},${q[2]},${a*glow})`;g.lineWidth=w;g.stroke(ed);}}
  if(p.ctl&&p.ctl!==p.o&&FAC[p.ctl]){const pt=g.createPattern(hrHatch(FAC[p.ctl].c),'repeat');g.fillStyle=pt;g.fill(ring,'evenodd');}
  g.restore();}}
/** Signature of everything the political tiles show. */
function hrPolSig(){return S?S.prov.map(p=>p.o+(p.ctl||'')).join()+mapMode+(typeof vasMapCol==='function'?FK.map(f=>vasMapCol(f)).join(''):''):'';}
/** Fills of the selection (as renderHL in 07, from the outlines): the province, own and enemy neighbours, the target. */
function hrSelFill(alpha){if(!S||startPick||sel<0)return;hrRings();ctx.save();ctx.globalAlpha=alpha;
 const fill=(i,c)=>{ctx.fillStyle=c;ctx.fill(HR.rings[i],'evenodd');};
 if(S.prov[sel].o===S.player&&S.player)PD[sel].adj.forEach(j=>{const o=S.prov[j].o;if(o===S.player)fill(j,'rgba(60,190,180,.24)');else if(atWar(S.player,o))fill(j,'rgba(225,70,50,.3)');});
 fill(sel,'rgba(255,248,225,.32)');if(tgt>=0)fill(tgt,S.prov[tgt].o===S.player?'rgba(60,190,180,.45)':'rgba(225,70,50,.5)');
 ctx.restore();}
KE.vm.wash=(x,y,w,z)=>{const c=mk(258,258),g=c.getContext('2d',CPU2D);const t=performance.now();hrWash(g,{x0:x,y0:y,x1:x+w,y1:y+w},z);return performance.now()-t;};
KE.vm.rings=()=>{hrRings();return {open:(HR.open||[]).map(i=>PD[i].key+':'+VM.byProv[i].length)};};
