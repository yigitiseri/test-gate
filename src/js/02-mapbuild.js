/* =====================================================================
   NOISE + MAP BUILD
   ===================================================================== */
function hash(x,y){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y){return vnoise(x,y)*.55+vnoise(x*2.07+5.2,y*2.07+1.3)*.3+vnoise(x*4.3+9.1,y*4.3+3.7)*.15;}
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const hex2=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const lum=c=>(0.299*c[0]+0.587*c[1]+0.114*c[2])/255;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

let idMap,land,provStart,provPix,baseC,base3C,polC,polImg,hlC,hlImg,hctx,SURF=null,BED=null;
function chamfer(D){
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let v=D[i];if(!v)continue;
  if(x>0&&D[i-1]+3<v)v=D[i-1]+3;
  if(y>0){if(D[i-W]+3<v)v=D[i-W]+3;if(x>0&&D[i-W-1]+4<v)v=D[i-W-1]+4;if(x<W-1&&D[i-W+1]+4<v)v=D[i-W+1]+4;}
  D[i]=v;}
 for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;let v=D[i];if(!v)continue;
  if(x<W-1&&D[i+1]+3<v)v=D[i+1]+3;
  if(y<H-1){if(D[i+W]+3<v)v=D[i+W]+3;if(x<W-1&&D[i+W+1]+4<v)v=D[i+W+1]+4;if(x>0&&D[i+W-1]+4<v)v=D[i+W-1]+4;}
  D[i]=v;}
}
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let t=l?((px-ax)*dx+(py-ay)*dy)/l:0;t=clamp(t,0,1);const x=ax+t*dx-px,y=ay+t*dy-py;return Math.sqrt(x*x+y*y);}

function buildMap(){
 const N=W*H;
 const mc=mk(W,H),m=mc.getContext('2d');
 m.fillStyle='#000';m.fillRect(0,0,W,H);
 const fillPoly=(pts,c)=>{m.fillStyle=c;m.beginPath();pts.forEach((q,i)=>{const [x,y]=P(q[0],q[1]);i?m.lineTo(x,y):m.moveTo(x,y);});m.closePath();m.fill();};
 SEAS.forEach(p=>fillPoly(p,'#fff'));ISLES.forEach(p=>fillPoly(p,'#000'));
 const md=m.getImageData(0,0,W,H).data;
 land=new Uint8Array(N);const ox=new Int8Array(N),oy=new Int8Array(N);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const a=fbm(x/38,y/38)-.5,b=fbm(x/38+71.3,y/38+19.7)-.5,c=vnoise(x/7+13.1,y/7)-.5,d=vnoise(x/7,y/7+41.7)-.5;
  const i=y*W+x;ox[i]=Math.round(a*30+c*7);oy[i]=Math.round(b*30+d*7);
  const sx=clamp(Math.round(x+a*12+c*4),0,W-1),sy=clamp(Math.round(y+b*12+d*4),0,H-1);
  land[i]=md[(sy*W+sx)*4]<128?1:0;
 }
 // connected land masses
 const comp=new Int32Array(N).fill(-1),st=new Int32Array(N);let nc=0;
 for(let i=0;i<N;i++)if(land[i]&&comp[i]<0){let sp=0;st[sp++]=i;comp[i]=nc;
  while(sp){const k=st[--sp],x=k%W;
   if(x>0&&land[k-1]&&comp[k-1]<0){comp[k-1]=nc;st[sp++]=k-1;}
   if(x<W-1&&land[k+1]&&comp[k+1]<0){comp[k+1]=nc;st[sp++]=k+1;}
   if(k>=W&&land[k-W]&&comp[k-W]<0){comp[k-W]=nc;st[sp++]=k-W;}
   if(k<N-W&&land[k+W]&&comp[k+W]<0){comp[k+W]=nc;st[sp++]=k+W;}}
  nc++;}
 // seeds snapped to land
 PD.forEach(d=>{const [fx,fy]=P(d.lon,d.lat);const x0=Math.round(fx),y0=Math.round(fy);let bx=-1,by=-1,bd=1e9;
  for(let r=0;r<=40&&bx<0;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
   const xx=x0+dx,yy=y0+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;if(land[yy*W+xx]){const dd=dx*dx+dy*dy;if(dd<bd){bd=dd;bx=xx;by=yy;}}}
  if(bx<0){bx=clamp(x0,0,W-1);by=clamp(y0,0,H-1);}
  d.x=bx;d.y=by;d.comp=comp[by*W+bx];});
 const G=48,GC=Math.ceil(W/G),GR=Math.ceil(H/G),grid=Array.from({length:GC*GR},()=>[]);
 PD.forEach(d=>grid[Math.floor(d.y/G)*GC+Math.floor(d.x/G)].push(d.i));
 const MAXD=92,MAXD2=MAXD*MAXD;
 idMap=new Int16Array(N);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!land[i]){idMap[i]=-1;continue;}
  const px=x+ox[i],py=y+oy[i],cc=comp[i];let best=-2,bd=MAXD2;
  const gx0=Math.max(0,Math.floor((px-MAXD)/G)),gx1=Math.min(GC-1,Math.floor((px+MAXD)/G)),gy0=Math.max(0,Math.floor((py-MAXD)/G)),gy1=Math.min(GR-1,Math.floor((py+MAXD)/G));
  for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++){const cell=grid[gy*GC+gx];for(let k=0;k<cell.length;k++){const d=PD[cell[k]];if(d.comp!==cc)continue;const dx=d.x-px,dy=d.y-py,dd=dx*dx+dy*dy;if(dd<bd){bd=dd;best=d.i;}}}
  idMap[i]=best;}
 PD.forEach(d=>{for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){if(dx*dx+dy*dy>25)continue;const xx=d.x+dx,yy=d.y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const i=yy*W+xx;if(land[i]&&comp[i]===d.comp)idMap[i]=d.i;}});
 // contiguity: keep only the part connected to the seed, regrow the rest from neighbours
 const reach=new Uint8Array(N),q=new Int32Array(N);let qh=0,qt=0;
 PD.forEach(d=>{const i=d.y*W+d.x;if(idMap[i]===d.i&&!reach[i]){reach[i]=1;q[qt++]=i;}});
 while(qh<qt){const k=q[qh++],id=idMap[k],x=k%W;const nb=[x>0?k-1:-1,x<W-1?k+1:-1,k-W,k+W];
  for(const j of nb){if(j<0||j>=N||reach[j]||idMap[j]!==id)continue;reach[j]=1;q[qt++]=j;}}
 qh=0;qt=0;for(let i=0;i<N;i++)if(reach[i])q[qt++]=i;
 while(qh<qt){const k=q[qh++],id=idMap[k],x=k%W;const nb=[x>0?k-1:-1,x<W-1?k+1:-1,k-W,k+W];
  for(const j of nb){if(j<0||j>=N||reach[j]||idMap[j]<0)continue;idMap[j]=id;reach[j]=1;q[qt++]=j;}}
 for(let i=0;i<N;i++)if(idMap[i]>=0&&!reach[i])idMap[i]=-2;
 // adjacency
 const cnt=new Map();const addc=(a,b)=>{const k=a<b?a*1024+b:b*1024+a;cnt.set(k,(cnt.get(k)||0)+1);};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,a=idMap[i];if(a<0)continue;
  if(x<W-1){const b=idMap[i+1];if(b>=0&&b!==a)addc(a,b);}if(y<H-1){const b=idMap[i+W];if(b>=0&&b!==a)addc(a,b);}}
 cnt.forEach((v,k)=>{if(v<3)return;const a=k>>10,b=k&1023;PD[a].adj.push(b);PD[b].adj.push(a);});
 LANES.forEach(([a,b])=>{const A=PK[a],B=PK[b];if(A==null||B==null)return;if(!PD[A].adj.includes(B)){PD[A].adj.push(B);PD[B].adj.push(A);PD[A].lanes.push(B);}});
 // pixel lists
 const count=new Int32Array(NP+1);for(let i=0;i<N;i++)if(idMap[i]>=0)count[idMap[i]+1]++;
 provStart=new Int32Array(NP+1);for(let k=0;k<NP;k++)provStart[k+1]=provStart[k]+count[k+1];
 provPix=new Int32Array(provStart[NP]);const fillp=provStart.slice(0,NP);
 for(let i=0;i<N;i++){const id=idMap[i];if(id>=0)provPix[fillp[id]++]=i;}
 // label points via distance from province edge
 const D=new Uint16Array(N);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,id=idMap[i];
  if(id<0||x===0||y===0||x===W-1||y===H-1||idMap[i-1]!==id||idMap[i+1]!==id||idMap[i-W]!==id||idMap[i+W]!==id)D[i]=0;else D[i]=65535;}
 chamfer(D);
 PD.forEach(d=>{let best=-1,bv=-1;for(let k=provStart[d.i];k<provStart[d.i+1];k++){const i=provPix[k];
   const v=D[i]*1000-((i%W-d.x)**2+(((i/W)|0)-d.y)**2)*0.02;if(v>bv){bv=v;best=i;}}
  d.area=provStart[d.i+1]-provStart[d.i];
  if(best>=0){d.lx=best%W;d.ly=(best/W)|0;d.inr=D[best]/3;}else{d.lx=d.x;d.ly=d.y;d.inr=4;}
  let md2=1e9;MOUNTAINS.forEach(l=>{for(let k=0;k<l.length-1;k++){const [ax,ay]=P(l[k][0],l[k][1]),[bx,by]=P(l[k+1][0],l[k+1][1]);md2=Math.min(md2,segDist(d.lx,d.ly,ax,ay,bx,by));}});
  d.mtn=md2<24||d.key==='kroya';});
 // sea distance to coast
 const SD=new Uint16Array(N);for(let i=0;i<N;i++)SD[i]=land[i]?0:65535;chamfer(SD);
 const LD=new Uint16Array(N);for(let i=0;i<N;i++)LD[i]=land[i]?65535:0;chamfer(LD);
 renderBase(SD,LD,rasterLines(MOUNTAINS,3),rasterLines(RIVERS,2));
 polC=mk(W,H);polImg=polC.getContext('2d').createImageData(W,H);
 hlC=mk(W,H);hctx=hlC.getContext('2d');hlImg=hctx.createImageData(W,H);
}

function rasterLines(lines,w){const c=mk(W,H),g=c.getContext('2d');g.strokeStyle='#fff';g.lineWidth=w;g.lineCap='round';g.lineJoin='round';
 lines.forEach(l=>{g.beginPath();l.forEach((q,k)=>{const [x,y]=P(q[0],q[1]);k?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();});
 const d=g.getImageData(0,0,W,H).data,D=new Uint16Array(W*H);for(let i=0;i<W*H;i++)D[i]=d[i*4]>100?0:65535;chamfer(D);return D;}
const lerp3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
function gauss(list){return list.map(([lo,la,r,h])=>{const [x,y]=P(lo,la);return [x,y,r*K,h];});}
function bumpSum(B,x,y){let s=0;for(let k=0;k<B.length;k++){const b=B[k],dx=x-b[0],dy=y-b[1];s+=b[3]*Math.exp(-(dx*dx+dy*dy)/(b[2]*b[2]));}return s;}
const LAND_PAL=[[-9,[228,204,150]],[.1,[226,200,146]],[.28,[210,190,134]],[.45,[178,176,112]],[.62,[138,158,90]],[.8,[104,136,72]],[1.1,[82,116,60]],[9,[74,106,56]]];
function landCol(m){for(let k=0;k<LAND_PAL.length-1;k++){const a=LAND_PAL[k],b=LAND_PAL[k+1];if(m<b[0])return lerp3(a[1],b[1],clamp((m-a[0])/(b[0]-a[0]),0,1));}return LAND_PAL[LAND_PAL.length-1][1];}

function renderBase(SD,LD,MD,RD){
 const N=W*H;const E=new Float32Array(N),M=new Float32Array(N);
 const HB=gauss([[33.5,38.9,2.6,.16],[41.5,39.4,2.2,.27],[46.5,37.2,2.3,.21],[24.3,46.4,1.3,.1],[21.5,41.8,1.6,.12],[20.2,40.6,.9,.08],[36.6,33.8,1,.07],[30.5,38.3,1.4,.08],[44.5,40.3,1.2,.12]]);
 const DRY=gauss([[33.5,38.8,2.3,.32],[40.5,34.2,3.4,.55],[44.8,35.8,1.8,.2],[36.8,31.2,1.5,.35],[36,47.6,3.6,.5],[44,46.6,3,.6],[20,31,3,.4],[26,30.5,3,.5]]);
 const WET=gauss([[41.8,42.1,1.4,.45],[39,41,1.6,.25],[31.05,30.75,.75,1.6],[44.8,32.8,1.2,.45],[47.2,31.2,1,.4],[15.5,46,2,.15],[46,41.6,1.3,.15]]);
 for(let y=0;y<H;y++){const lat=LAT1-y/K;for(let x=0;x<W;x++){const i=y*W+x;if(!land[i])continue;
  const md=MD[i]/3,ridge=Math.exp(-(md*md)/(24*24));
  const rn=1-Math.abs(2*vnoise(x/15+3.3,y/15+7.1)-1),rn2=1-Math.abs(2*vnoise(x/6+11.7,y/6+5.2)-1);
  let e=.06+.2*fbm(x/110+4.1,y/110+9.3)+ridge*(.42*rn+.2*rn2+.12)+bumpSum(HB,x,y);
  const ld=LD[i]/3;e*=Math.min(1,.3+ld/30);E[i]=e;
  const rd=RD[i]/3;
  M[i]=.5+(lat-38.5)*.07+(fbm(x/90+20,y/90+40)-.5)*.55+.14*Math.exp(-ld/28)+(lat<34?1.1:.35)*Math.exp(-rd/6)-(lat<34?(34-lat)*.22:0)-bumpSum(DRY,x,y)+bumpSum(WET,x,y);}}
 SURF=new Float32Array(N);BED=new Float32Array(N);
 for(let i=0;i<N;i++){if(land[i]){const h=.9+E[i]*40;SURF[i]=h;BED[i]=h;}else{SURF[i]=.5;BED[i]=-.8-Math.min(SD[i]/3,40)*.06;}}
 baseC=mk(W,H);const b=baseC.getContext('2d');const img=b.createImageData(W,H),d=img.data;
 const SH=[186,206,186],DP=[110,148,146];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,o=i*4;let c;
  if(!land[i]){const sd=SD[i]/3,t=Math.pow(Math.min(sd/70,1),.7);c=lerp3(SH,DP,t);
   const v=(fbm(x/60+50,y/60+80)-.5)*18;c[0]+=v*.7;c[1]+=v*.8;c[2]+=v*.8;
   if(sd<1.6)c=lerp3(c,[238,228,198],.55);
   else{for(const [r0,a] of [[3.2,.36],[6,.27],[9,.2],[12.2,.14],[15.6,.08]])if(Math.abs(sd-r0)<.55){c=lerp3(c,[52,72,68],a);break;}}
   if(sd>18&&y%5===0&&hash(x>>3,y)>.5)c=lerp3(c,[70,95,90],.1);
  }else{const e=E[i],m=M[i];
   const gx=(x<W-1&&land[i+1]?E[i+1]:e)-(x>0&&land[i-1]?E[i-1]:e),gy=(y<H-1&&land[i+W]?E[i+W]:e)-(y>0&&land[i-W]?E[i-W]:e);
   const sh=clamp(1+(-gx*1.1-gy)*12,.58,1.38);
   c=landCol(m);
   if(e>.36)c=lerp3(c,[150,134,114],Math.min(1,(e-.36)/.22)*.85);
   if(e>.64)c=lerp3(c,[246,244,238],Math.min(1,(e-.64)/.1));
   if(LD[i]/3<2.6&&e<.3)c=lerp3(c,[228,210,164],.5);
   const gr=(hash(x,y)-.5)*9+(vnoise(x/3.1,y/3.1)-.5)*12;
   c=[c[0]*sh+gr,c[1]*sh+gr,c[2]*sh+gr*.8];
   {const L=c[0]*.3+c[1]*.59+c[2]*.11;c=lerp3(c,[L*1.1+8,L*.98+4,L*.78],.36);}
   if((x>0&&!land[i-1])||(x<W-1&&!land[i+1])||(y>0&&!land[i-W])||(y<H-1&&!land[i+W]))c=[c[0]*.6,c[1]*.6,c[2]*.62];}
  {const mo=.93+.11*fbm(x/150+7,y/150+3);c[0]*=mo;c[1]*=mo;c[2]*=mo*.97;}
  d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;}
 b.putImageData(img,0,0);rhumbs(b);
 b.lineJoin='round';b.lineCap='round';
 // forests
 for(let y=3;y<H;y+=5)for(let x=3;x<W;x+=5){const jx=Math.round(x+(hash(x,y*3)-.5)*5),jy=Math.round(y+(hash(y,x*7)-.5)*5);if(jx<1||jy<1||jx>=W-1||jy>=H-1)continue;
  const i=jy*W+jx;if(!land[i])continue;const m=M[i],e=E[i];if(m<.72||e>.46||LD[i]<9)continue;if(hash(x+17,y*3+1)>(m-.66)*1.5)continue;
  const g=hash(jx,jy+9)*16;
  b.fillStyle='rgba(28,40,20,.3)';b.beginPath();b.ellipse(jx+1.3,jy+1.4,2.6,1.7,0,0,7);b.fill();
  b.fillStyle=`rgb(${60+g|0},${90+g|0},${46+g*.5|0})`;b.beginPath();b.arc(jx,jy,2.3,0,7);b.fill();
  b.fillStyle='rgba(160,190,112,.55)';b.beginPath();b.arc(jx-.8,jy-.9,.95,0,7);b.fill();}
 // rivers, widening toward the mouth
 RIVERS.forEach(r=>{const pts=r.map(q=>P(q[0],q[1]));const n=pts.length;
  for(let k=0;k<n-1;k++){const w=.8+1.6*(k+1)/n;b.strokeStyle='rgba(46,104,146,.9)';b.lineWidth=w;b.beginPath();b.moveTo(pts[k][0],pts[k][1]);
   const mx=(pts[k][0]+pts[k+1][0])/2+(hash(k,n)-.5)*4,my=(pts[k][1]+pts[k+1][1])/2+(hash(n,k)-.5)*4;b.quadraticCurveTo(mx,my,pts[k+1][0],pts[k+1][1]);b.stroke();}});
 base3C=mk(W,H);base3C.getContext('2d').drawImage(baseC,0,0);
 // peaks
 for(let y=6;y<H;y+=10)for(let x=5;x<W;x+=9){const jx=x+(hash(x,y)-.5)*8,jy=y+(hash(y,x)-.5)*8;const xi=Math.round(jx),yi=Math.round(jy);if(xi<0||yi<0||xi>=W||yi>=H)continue;
  const i=yi*W+xi;if(!land[i])continue;const e=E[i];if(e<.42||hash(x*3,y*7)>.72)continue;
  const s=4+(e-.42)*16+hash(x,y+1)*2.2;
  b.fillStyle='rgba(236,228,212,.92)';b.beginPath();b.moveTo(jx-s,jy+s*.5);b.lineTo(jx,jy-s);b.lineTo(jx+s*.1,jy+s*.5);b.closePath();b.fill();
  b.fillStyle='rgba(104,90,76,.9)';b.beginPath();b.moveTo(jx,jy-s);b.lineTo(jx+s,jy+s*.5);b.lineTo(jx+s*.1,jy+s*.5);b.closePath();b.fill();
  if(e>.6){b.fillStyle='#fbfaf6';b.beginPath();b.moveTo(jx,jy-s);b.lineTo(jx-s*.38,jy-s*.3);b.lineTo(jx,jy-s*.42);b.lineTo(jx+s*.36,jy-s*.3);b.closePath();b.fill();}
  b.strokeStyle='rgba(60,46,32,.55)';b.lineWidth=.6;b.beginPath();b.moveTo(jx-s,jy+s*.5);b.lineTo(jx,jy-s);b.lineTo(jx+s,jy+s*.5);b.stroke();}
 [[P(19.8,35.6),1,0],[P(29.3,34.1),.9,1],[P(35.6,43.9),.85,0],[P(17.6,41.9),.75,1],[P(25.0,39.9),.7,0]].forEach(([[x,y],sc,fl])=>galley(b,x,y,sc,fl));
 [b,base3C.getContext('2d')].forEach(b=>{compass(b,...P(17.2,34.4),46);compass(b,...P(37.4,42.6),24);cartouche(b);
 REGION_LABELS.forEach(([t0,lon,lat,sz,k,en])=>{const t=lng(t0,en);const [x,y]=P(lon,lat);b.save();b.textAlign='center';b.textBaseline='middle';b.font=`italic 500 ${sz*1.15}px "EB Garamond", Georgia, serif`;
  if(k==='sea'){b.fillStyle='rgba(34,58,56,.62)';spaced(b,t,x,y,sz*.32);}else{b.fillStyle='rgba(92,70,40,.6)';spaced(b,t,x,y,sz*.12);}b.restore();});});
 // frame
 frame(b);frame(base3C.getContext('2d'));
}
function rhumbs(b){const mc=mk(W,H),m=mc.getContext('2d'),md=m.createImageData(W,H);for(let i=0;i<W*H;i++)md.data[i*4+3]=land[i]?0:255;m.putImageData(md,0,0);
 const rc=mk(W,H),r=rc.getContext('2d');r.lineWidth=.85;
 [[P(17.2,34.4),1],[P(37.4,42.6),.8],[P(27.4,35.6),.6]].forEach(([[cx,cy],al])=>{for(let k=0;k<32;k++){const a=k*Math.PI/16;
  r.strokeStyle=k%4===0?`rgba(40,32,22,${.45*al})`:k%2===0?`rgba(34,96,54,${.4*al})`:`rgba(150,40,28,${.36*al})`;r.beginPath();r.moveTo(cx,cy);r.lineTo(cx+Math.cos(a)*2600,cy+Math.sin(a)*2600);r.stroke();}});
 r.globalCompositeOperation='destination-in';r.drawImage(mc,0,0);b.drawImage(rc,0,0);}
function galley(b,x,y,s,fl){b.save();b.translate(x,y);b.scale(fl?-s:s,s);b.lineJoin='round';b.lineCap='round';
 b.strokeStyle='rgba(58,38,20,.75)';b.lineWidth=.9;for(let k=-15;k<=15;k+=3.8){b.beginPath();b.moveTo(k,1);b.lineTo(k-3.5,9);b.stroke();}
 b.fillStyle='rgba(74,46,22,.92)';b.beginPath();b.moveTo(-24,-4);b.quadraticCurveTo(-2,8,24,-1);b.lineTo(31,-4);b.lineTo(24,-5);b.quadraticCurveTo(0,1,-21,-7);b.closePath();b.fill();
 b.strokeStyle='rgba(58,38,20,.95)';b.lineWidth=1.4;b.beginPath();b.moveTo(1,-3);b.lineTo(1,-30);b.stroke();
 b.fillStyle='rgba(247,238,214,.97)';b.lineWidth=1;b.beginPath();b.moveTo(-17,-6);b.lineTo(20,-38);b.quadraticCurveTo(10,-14,4,-8);b.closePath();b.fill();b.stroke();
 b.strokeStyle='rgba(150,34,24,.9)';b.lineWidth=1.6;b.beginPath();b.moveTo(4,-24);b.lineTo(4,-15);b.moveTo(0,-20);b.lineTo(8,-20);b.stroke();
 b.fillStyle='rgba(160,36,24,.95)';b.beginPath();b.moveTo(20,-38);b.lineTo(29,-40);b.lineTo(21,-35);b.closePath();b.fill();b.restore();}
function cartouche(b){const [cx,cy]=P(23.4,29.5),w=392,h=64;b.save();b.translate(cx,cy);
 b.fillStyle='rgba(50,32,14,.28)';b.fillRect(-w/2+5,-h/2+6,w,h);
 for(const sx of[-1,1]){b.fillStyle='#e0cb9c';b.strokeStyle='#4a2f16';b.lineWidth=1.6;b.beginPath();b.ellipse(sx*(w/2+6),0,10,h/2+4,0,0,7);b.fill();b.stroke();b.beginPath();b.ellipse(sx*(w/2+6),0,4.5,h/2-8,0,0,7);b.stroke();}
 b.fillStyle='#efe1bd';b.strokeStyle='#4a2f16';b.lineWidth=2;b.fillRect(-w/2,-h/2,w,h);b.strokeRect(-w/2,-h/2,w,h);b.lineWidth=.8;b.strokeRect(-w/2+5,-h/2+5,w-10,h-10);
 b.fillStyle='#8e1f14';b.textBaseline='middle';b.font='700 17px Cinzel, Georgia, serif';spaced(b,lng('RUM VE ANADOLU MEMÂLİKİ','RUMELIA AND ANATOLIA'),0,-10,2.2);
 b.fillStyle='#3a2410';b.font='italic 500 14px "EB Garamond", Georgia, serif';b.textAlign='center';b.fillText(lng('Anno Domini MCDLI · Sene 855 Hicrî','Anno Domini MCDLI · Anno Hegirae 855'),0,13);b.restore();}
function frame(b){const m=12,t=7;b.save();b.fillStyle='#2e2114';b.fillRect(0,0,W,m);b.fillRect(0,H-m,W,m);b.fillRect(0,0,m,H);b.fillRect(W-m,0,m,H);
 for(let lon=LON0;lon<LON1;lon++){const x0=P(lon,0)[0],x1=P(lon+1,0)[0];b.fillStyle=lon%2?'#2e2114':'#efe2c2';b.fillRect(x0,m,x1-x0,t);b.fillRect(x0,H-m-t,x1-x0,t);}
 for(let lat=Math.floor(LAT0);lat<LAT1;lat++){const y0=P(0,Math.min(lat+1,LAT1))[1],y1=P(0,Math.max(lat,LAT0))[1];b.fillStyle=lat%2?'#2e2114':'#efe2c2';b.fillRect(m,y0,t,y1-y0);b.fillRect(W-m-t,y0,t,y1-y0);}
 b.strokeStyle='#2e2114';b.lineWidth=1;b.strokeRect(m+.5,m+.5,W-2*m-1,H-2*m-1);b.strokeRect(m+t+.5,m+t+.5,W-2*(m+t)-1,H-2*(m+t)-1);
 b.fillStyle='#e6cf98';b.font='600 9px Cinzel, Georgia, serif';b.textAlign='center';b.textBaseline='middle';
 for(let lon=LON0+2;lon<LON1;lon+=2){const x=P(lon,0)[0];b.fillText(lon+'°',x,m/2+.5);b.fillText(lon+'°',x,H-m/2);}
 for(let lat=30;lat<LAT1;lat+=2){const y=P(0,lat)[1];for(const [xx,r] of [[m/2,-1],[W-m/2,1]]){b.save();b.translate(xx,y);b.rotate(r*Math.PI/2);b.fillText(lat+'°',0,0);b.restore();}}
 b.strokeStyle='#c9a14e';b.lineWidth=1.2;b.strokeRect(m+t+3.5,m+t+3.5,W-2*(m+t+3)-1,H-2*(m+t+3)-1);b.restore();}
function compass(b,x,y,r){b.save();b.translate(x,y);
 b.strokeStyle='rgba(58,38,20,.6)';b.lineWidth=1;b.beginPath();b.arc(0,0,r*1.08,0,7);b.stroke();b.beginPath();b.arc(0,0,r*.92,0,7);b.stroke();
 for(const tier of [3,2,1])for(let k=0;k<16;k++){const t=k%4===0?1:k%2===0?2:3;if(t!==tier)continue;const a=k*Math.PI/8-Math.PI/2;const L=t===1?r:t===2?r*.64:r*.42,wd=t===1?r*.14:r*.09;
  for(const sd of[-1,1]){b.beginPath();b.moveTo(0,0);b.lineTo(Math.cos(a)*L,Math.sin(a)*L);b.lineTo(Math.cos(a+sd*Math.PI/2)*wd,Math.sin(a+sd*Math.PI/2)*wd);b.closePath();b.fillStyle=sd>0?'rgba(246,238,216,.95)':'rgba(120,34,24,.9)';b.fill();b.strokeStyle='rgba(58,38,20,.6)';b.lineWidth=.6;b.stroke();}}
 b.fillStyle='#c9a14e';b.beginPath();b.arc(0,0,r*.07,0,7);b.fill();
 b.fillStyle='#8e1f14';b.font=`700 ${Math.max(11,r*.33)}px Cinzel,Georgia,serif`;b.textAlign='center';b.textBaseline='middle';b.fillText(lng('K','N'),0,-r-10);b.restore();}
function spaced(c,t,x,y,sp){const chars=[...t];const ws=chars.map(ch=>c.measureText(ch).width);const tot=ws.reduce((a,b)=>a+b,0)+sp*(chars.length-1);
 let cx=x-tot/2;c.textAlign='left';chars.forEach((ch,k)=>{c.fillText(ch,cx,y);cx+=ws[k]+sp;});c.textAlign='center';}

