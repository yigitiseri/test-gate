/* =====================================================================
   3D VIEW (Three.js)
   ===================================================================== */
const G3={on:false,s:1,mx:W/2,my:H/2,texDirty:true,objDirty:true,anchor:[]};
(function(){
 let R=null,scene,camera,tex,texCv,water,sun,v3,ray,ndc,plane,I={};
 const fov=38,UPV=()=>new THREE.Vector3(0,1,0);
 const surf=(x,y)=>SURF[clamp(Math.round(y),0,H-1)*W+clamp(Math.round(x),0,W-1)];
 const lin=h=>new THREE.Color(h).convertSRGBToLinear();
 G3.init=function(){
  if(R)return true;if(!window.THREE||!SURF)return false;
  try{R=new THREE.WebGLRenderer({canvas:document.getElementById('gl'),antialias:true,powerPreference:'high-performance'});}catch(e){R=null;return false;}
  R.outputEncoding=THREE.sRGBEncoding;R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.setClearColor(0xcbb68b);
  scene=new THREE.Scene();scene.fog=new THREE.Fog(0xcbb68b,800,2600);
  camera=new THREE.PerspectiveCamera(fov,1,1,5000);
  v3=new THREE.Vector3();ray=new THREE.Raycaster();ndc=new THREE.Vector2();plane=new THREE.Plane(UPV(),0);
  scene.add(new THREE.HemisphereLight(0xfff0d4,0x5a4428,.55));
  sun=new THREE.DirectionalLight(0xffdcaa,1.0);sun.castShadow=true;const ms=Math.min(4096,R.capabilities.maxTextureSize);sun.shadow.mapSize.set(ms>=4096&&innerWidth>900?4096:2048,ms>=4096&&innerWidth>900?4096:2048);
  sun.shadow.bias=-.0005;sun.shadow.normalBias=.8;scene.add(sun);scene.add(sun.target);
  // terrain
  texCv=mk(W,H);tex=new THREE.CanvasTexture(texCv);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=R.capabilities.getMaxAnisotropy();
  const SX=Math.round(W/3),SY=Math.round(H/3);const g=new THREE.PlaneGeometry(W,H,SX,SY);g.rotateX(-Math.PI/2);const pos=g.attributes.position;
  for(let iy=0;iy<=SY;iy++)for(let ix=0;ix<=SX;ix++){const k=iy*(SX+1)+ix,mx=Math.min(W-1,Math.round(ix*W/SX)),my=Math.min(H-1,Math.round(iy*H/SY));pos.setY(k,BED[my*W+mx]);}
  g.computeVertexNormals();
  const terrain=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:tex,roughness:.95,metalness:0}));terrain.receiveShadow=true;terrain.castShadow=true;scene.add(terrain);
  // water with a tiling normal map
  const nc=mk(256,256),nx=nc.getContext('2d'),nd=nx.createImageData(256,256),TP=Math.PI*2/256;
  const hf=(x,y)=>Math.sin((x*3+y)*TP)+.6*Math.sin((-2*x+5*y)*TP)+.4*Math.sin((7*x-4*y)*TP)+.25*Math.sin((11*x+9*y)*TP)+.15*Math.sin((-13*x+17*y)*TP);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){const dx=(hf(x+1,y)-hf(x-1,y))*4,dy=(hf(x,y+1)-hf(x,y-1))*4,l=Math.hypot(dx,dy,1),o=(y*256+x)*4;nd.data[o]=(-dx/l*.5+.5)*255;nd.data[o+1]=(-dy/l*.5+.5)*255;nd.data[o+2]=(1/l*.5+.5)*255;nd.data[o+3]=255;}
  nx.putImageData(nd,0,0);const nt=new THREE.CanvasTexture(nc);nt.wrapS=nt.wrapT=THREE.RepeatWrapping;nt.repeat.set(60,44);
  water=new THREE.Mesh(new THREE.PlaneGeometry(W*4,H*4).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:lin(0x3d7c80),transparent:true,opacity:.42,roughness:.5,metalness:.1,normalMap:nt,normalScale:new THREE.Vector2(.16,.16)}));
  water.position.y=.5;water.receiveShadow=true;scene.add(water);
  const bed=new THREE.Mesh(new THREE.PlaneGeometry(W*4,H*4).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:lin(0x6a8a80)}));bed.position.y=-3.5;scene.add(bed);
  // instanced castles and soldiers
  const std=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:lin(c),roughness:.82},o));
  const mkI=(geo,mat,n)=>{const m=new THREE.InstancedMesh(geo,mat,n);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;scene.add(m);return m;};
  const N=NP;
  I.walls=mkI(new THREE.BoxGeometry(1,1,1).translate(0,.5,0),std(0xe4d8ba),N);
  I.keep=mkI(new THREE.CylinderGeometry(.5,.54,1,10).translate(0,.5,0),std(0xf0e6cc),N);
  I.roof=mkI(new THREE.ConeGeometry(.62,1,10).translate(0,.5,0),std(0xffffff,{roughness:.6}),N);
  I.tow=mkI(new THREE.CylinderGeometry(.5,.55,1,7).translate(0,.5,0),std(0xe9ddc0),N*4);
  I.troof=mkI(new THREE.ConeGeometry(.62,1,7).translate(0,.5,0),std(0xffffff,{roughness:.6}),N*4);
  I.pole=mkI(new THREE.CylinderGeometry(.05,.05,1,5).translate(0,.5,0),std(0x3a2a18),N);
  I.flag=mkI(new THREE.PlaneGeometry(1,.62).translate(.5,0,0),std(0xffffff,{side:THREE.DoubleSide,roughness:.7}),N);
  I.body=mkI(new THREE.CylinderGeometry(.3,.46,1.35,7).translate(0,.68,0),std(0xffffff,{roughness:.7}),N*6);
  I.head=mkI(new THREE.SphereGeometry(.28,8,6).translate(0,1.62,0),std(0xd9ae86),N*6);
  I.helm=mkI(new THREE.ConeGeometry(.3,.42,8).translate(0,1.95,0),std(0xc9c4b8,{metalness:.5,roughness:.4}),N*6);
  I.spear=mkI(new THREE.CylinderGeometry(.045,.045,2.9,4).translate(.42,1.35,0),std(0x5a4128),N*6);
  I.shield=mkI(new THREE.CylinderGeometry(.34,.34,.08,10).rotateZ(Math.PI/2).translate(-.36,.85,0),std(0xffffff,{roughness:.55}),N*6);
  I.dome=mkI(new THREE.SphereGeometry(.5,16,8,0,Math.PI*2,0,Math.PI/2),std(0x8e9aa5,{metalness:.35,roughness:.45}),N);
  I.minS=mkI(new THREE.CylinderGeometry(.5,.5,1,8).translate(0,.5,0),std(0xf3ecdc),N*4);
  I.minC=mkI(new THREE.ConeGeometry(.6,1,8).translate(0,.5,0),std(0x8e9aa5,{metalness:.35,roughness:.45}),N*4);
  I.crV=mkI(new THREE.BoxGeometry(1,1,1).translate(0,.5,0),std(0xd9a93a,{metalness:.6,roughness:.35}),N);
  I.crH=mkI(new THREE.BoxGeometry(1,1,1),std(0xd9a93a,{metalness:.6,roughness:.35}),N);
  flagGeo=new THREE.PlaneGeometry(1,.62,8,1).translate(.5,0,0);mkShips(std);
  return true;
 };
 const ROUTES=[[[25.2,40.2],[25.8,38.9],[25.3,37.4],[24.4,36.4],[23.9,37.5],[24.6,39.3]],[[13.4,44.6],[15.0,43.3],[17.0,42.3],[18.8,41.3],[17.9,42.3],[15.5,43.6]],
  [[29.6,43.0],[31.5,42.5],[34.0,42.9],[36.5,42.4],[34.0,43.8],[31.0,43.9]],[[33.0,33.5],[34.3,34.2],[34.2,32.8],[32.8,32.1],[31.5,32.6]],
  [[18.5,38.5],[20.0,37.3],[21.0,35.9],[19.2,36.2],[17.8,37.3]],[[23.0,34.3],[25.5,34.0],[28.0,34.5],[27.5,35.6],[24.5,34.6]],
  [[16.5,33.6],[19.5,33.3],[21.5,34.4],[18.5,34.8]],[[12.6,39.3],[14.3,39.0],[13.6,40.2]]];
 const ships=[],flagMats={},flags={};let flagGeo=null;
 function flagMat(f){if(flagMats[f])return flagMats[f];const c=mk(128,80),g=c.getContext('2d'),t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;
  const draw=()=>{g.fillStyle=FAC[f].c;g.fillRect(0,0,128,80);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,0,128,6);g.fillStyle='rgba(0,0,0,.2)';g.fillRect(0,74,128,6);
   const im=ARMSIMG[f];if(im&&im.complete&&im.naturalWidth)g.drawImage(im,42,8,44,53);t.needsUpdate=true;};
  draw();if(ARMSIMG[f]&&!ARMSIMG[f].complete)ARMSIMG[f].addEventListener('load',draw);
  return flagMats[f]=new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide,roughness:.85});}
 function mkShips(std){const hullG=new THREE.CylinderGeometry(.5,.3,4.4,10,1).rotateZ(Math.PI/2);hullG.scale(1,.55,.8);
  const hullM=std(0x5a3a1e),mastG=new THREE.CylinderGeometry(.06,.07,3.6,5).translate(0,1.8,0),mastM=std(0x3a2a18);
  const tri=(a,m)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));g.computeVertexNormals();return new THREE.Mesh(g,m);};
  const sailM=std(0xf3e8cc,{side:THREE.DoubleSide,roughness:.9}),penM=std(0xb3261e,{side:THREE.DoubleSide}),oarG=new THREE.BoxGeometry(.05,.05,2.4);
  ROUTES.forEach((r,k)=>{const g=new THREE.Group();const hull=new THREE.Mesh(hullG,hullM);hull.position.y=.35;g.add(hull);g.add(new THREE.Mesh(mastG,mastM));
   const sail=tri([-2.1,.6,0, 2.1,4.2,0, .3,.7,0],sailM);sail.rotation.y=.35;g.add(sail);g.add(tri([2.1,4.2,0, 3.1,4.05,0, 2.1,3.9,0],penM));
   for(let o=-3;o<=3;o++){const oar=new THREE.Mesh(oarG,hullM);oar.position.set(o*.52,.25,0);oar.rotation.x=.45;g.add(oar);}
   g.traverse(m=>{if(m.isMesh)m.castShadow=true;});g.scale.setScalar(1.6);scene.add(g);
   const pts=r.map(q=>{const [x,y]=P(q[0],q[1]);return [x-W/2,y-H/2];});const seg=[];let L=0;
   for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);seg.push([a,b,l,L]);L+=l;}
   ships.push({g,seg,L,off:k*97});});}
 function moveShips(now){for(const s of ships){const d=((now/1000)*5+s.off)%s.L;const sg=s.seg.find(q=>d<q[3]+q[2])||s.seg[0];const t=(d-sg[3])/sg[2];
  s.g.position.set(sg[0][0]+(sg[1][0]-sg[0][0])*t,.3+Math.sin(now/500+s.off)*.1,sg[0][1]+(sg[1][1]-sg[0][1])*t);
  s.g.rotation.y=-Math.atan2(sg[1][1]-sg[0][1],sg[1][0]-sg[0][0]);s.g.rotation.x=Math.sin(now/650+s.off)*.05;}}
 const M4=()=>new THREE.Matrix4();
 function sync(){
  const M=M4(),Q=new THREE.Quaternion(),Pv=new THREE.Vector3(),Sc=new THREE.Vector3(),C=new THREE.Color(),UP=UPV();
  const set=(m,k,x,y,z,sx,sy,sz,ry=0)=>{Pv.set(x,y,z);Q.setFromAxisAngle(UP,ry);Sc.set(sx||1e-4,sy||1e-4,sz||1e-4);M.compose(Pv,Q,Sc);m.setMatrixAt(k,M);};
  for(let i=0;i<NP;i++){const d=PD[i],p=S.prov[i],cap=S.fac[p.o]&&S.fac[p.o].cap===i;const u=(1.9+p.dev*.3)*(cap?1.25:1);
   const wx=d.lx-W/2,wz=d.ly-H/2;let h=surf(d.lx,d.ly);for(const [ox,oy] of [[-u,-u],[u,-u],[-u,u],[u,u]])h=Math.min(h,surf(d.lx+ox,d.ly+oy));h=Math.max(h,.5)-.1;
   C.copy(lin(FAC[p.o].c));
   set(I.walls,i,wx,h,wz,u*1.9,u*.72,u*1.9);
   const rel=FAC[p.o].rel,isM=rel==='İslam',isO=rel==='Ortodoks',kh=isM?1.05:isO?1.2:1.35,HID=[0,-50,0,0,0,0];
   set(I.keep,i,wx,h,wz,u*.82,u*kh,u*.82);
   if(isM||isO){set(I.roof,i,...HID);set(I.dome,i,wx,h+u*kh,wz,u*.92,u*.92,u*.92);}else{set(I.roof,i,wx,h+u*kh,wz,u*.72,u*1.75,u*.72);set(I.dome,i,...HID);}
   I.roof.setColorAt(i,C);
   const ct=h+u*kh+(isO?u*.44:u*1.72);
   if(!isM){set(I.crV,i,wx,ct,wz,u*.07,u*.55,u*.07);set(I.crH,i,wx,ct+u*.38,wz,u*.32,u*.07,u*.07);}else{set(I.crV,i,...HID);set(I.crH,i,...HID);}
   const nm=isM?(cap?(d.key==='istanbul'?4:2):(p.dev>=5?2:1)):0,MO=[[.62,.62],[-.62,-.62],[.62,-.62],[-.62,.62]];
   for(let k=0;k<4;k++){const j=i*4+k;if(k<nm){const mx=wx+MO[k][0]*u,mz=wz+MO[k][1]*u;set(I.minS,j,mx,h,mz,u*.17,u*2.6,u*.17);set(I.minC,j,mx,h+u*2.6,mz,u*.21,u*.6,u*.21);}else{set(I.minS,j,...HID);set(I.minC,j,...HID);}}
   const tv=p.dev>=3||cap;
   for(let k=0;k<4;k++){const ox=(k&1?1:-1)*u*.95,oz=(k&2?1:-1)*u*.95,j=i*4+k;
    set(I.tow,j,wx+ox,h,wz+oz,tv?u*.44:0,u*1.08,tv?u*.44:0);set(I.troof,j,wx+ox,h+u*1.08,wz+oz,tv?u*.46:0,u*.55,tv?u*.46:0);I.troof.setColorAt(j,C);}
   const fx0=wx+u*.95,fz0=wz-u*.95;set(I.pole,i,fx0,h+u*1.6,fz0,cap?u:0,u*1.7,cap?u:0);set(I.flag,i,0,-50,0,0,0,0);I.flag.setColorAt(i,C);
   if(cap){let m=flags[i];if(!m){m=new THREE.Mesh(flagGeo,flagMat(p.o));m.castShadow=true;scene.add(m);flags[i]=m;}m.material=flagMat(p.o);m.position.set(fx0,h+u*3.0,fz0);m.scale.set(u*1.6,u*1.6,1);m.visible=true;}
   else if(flags[i])flags[i].visible=false;
   const n=p.t>0?Math.min(6,Math.ceil(p.t/2500)):0;const ax=wx+u*1.25+2.8,az=wz+u*.7;
   for(let j=0;j<6;j++){const k=i*6+j;if(j<n){const fx=ax+(j%3)*1.75+(j>=3?.85:0),fz=az+(j>=3?1.9:0);const fh=Math.max(surf(fx+W/2,fz+H/2),.5)-.05;
     for(const m of [I.body,I.head,I.helm,I.spear,I.shield])set(m,k,fx,fh,fz,1.7,1.7,1.7,.35);I.body.setColorAt(k,C);I.shield.setColorAt(k,C);}
    else for(const m of [I.body,I.head,I.helm,I.spear,I.shield])set(m,k,0,-50,0,0,0,0);}
   G3.anchor[i]=[ax+W/2+1.75,az+H/2+(n>3?1.9:.2),7];
  }
  for(const m of Object.values(I)){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
 }
 function camUpdate(){
  const t=clamp((Math.log(G3.s)-Math.log(fitS*.85))/(Math.log(6)-Math.log(fitS*.85)),0,1),pitch=(66-30*t)*Math.PI/180;
  const d=vh/(2*G3.s*Math.tan(fov*Math.PI/360)),tx=G3.mx-W/2,tz=G3.my-H/2;
  camera.position.set(tx,d*Math.sin(pitch),tz+d*Math.cos(pitch));camera.lookAt(tx,0,tz);
  camera.near=Math.max(.5,d*.02);camera.far=d*8;camera.aspect=vw/vh;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  scene.fog.near=d*1.5;scene.fog.far=d*4.5;
  const span=clamp(d*1.15,80,1400);sun.position.set(tx-span*.75,span*1.25,tz-span*.55);sun.target.position.set(tx,0,tz);sun.target.updateMatrixWorld();
  const sc=sun.shadow.camera;sc.left=-span;sc.right=span;sc.top=span;sc.bottom=-span;sc.near=1;sc.far=span*5;sc.updateProjectionMatrix();
 }
 G3.render=function(now){
  if(G3.texDirty){const c=texCv.getContext('2d');c.drawImage(base3C,0,0);c.drawImage(polC,0,0);c.drawImage(hlC,0,0);tex.needsUpdate=true;G3.texDirty=false;}
  if(G3.objDirty){sync();G3.objDirty=false;}
  camUpdate();water.material.normalMap.offset.set(now*.000012,now*.000007);moveShips(now);
  for(const k in flags){const m=flags[k];if(m.visible)m.rotation.y=.5+Math.sin(now/650+ +k)*.2;}
  R.render(scene,camera);
 };
 G3.proj=(mx,my,h=0)=>{v3.set(mx-W/2,Math.max(surf(mx,my),.5)+h,my-H/2).project(camera);return [(v3.x+1)/2*vw,(1-v3.y)/2*vh,v3.z<1&&v3.z>-1];};
 function ground(sx,sy){ndc.set(sx/vw*2-1,-(sy/vh)*2+1);ray.setFromCamera(ndc,camera);const hit=new THREE.Vector3();return ray.ray.intersectPlane(plane,hit)?[hit.x+W/2,hit.z+H/2]:null;}
 G3.clamp=()=>{G3.s=clamp(G3.s,fitS*.85,6);G3.mx=clamp(G3.mx,-W*.2,W*1.2);G3.my=clamp(G3.my,-H*.2,H*1.2);};
 G3.panBy=(dx,dy)=>{camUpdate();const a=ground(vw/2,vh/2),b=ground(vw/2-dx,vh/2-dy);if(a&&b){G3.mx+=b[0]-a[0];G3.my+=b[1]-a[1];}G3.clamp();};
 G3.zoomAt=(sx,sy,ns)=>{camUpdate();const a=ground(sx,sy);G3.s=clamp(ns,fitS*.85,6);camUpdate();const b=ground(sx,sy);if(a&&b){G3.mx+=a[0]-b[0];G3.my+=a[1]-b[1];}G3.clamp();};
 G3.center=(x,y,s,off=0,th=0)=>{G3.s=s;G3.mx=x;G3.my=y;G3.clamp();if(off||th)G3.panBy((off+(vw-off)/2)-vw/2,th/2);};
 G3.pick=(sx,sy)=>{camUpdate();ndc.set(sx/vw*2-1,-(sy/vh)*2+1);ray.setFromCamera(ndc,camera);const o=ray.ray.origin,d=ray.ray.direction;if(d.y>=0)return null;
  let t=Math.max(0,(60-o.y)/d.y);const te=(.5-o.y)/d.y,st=Math.max(.3,(te-t)/700);
  for(;t<=te;t+=st){const x=o.x+d.x*t+W/2,z=o.z+d.z*t+H/2;if(x<0||z<0||x>=W||z>=H)continue;if(o.y+d.y*t<=surf(x,z))return [x,z];}
  return [o.x+d.x*te+W/2,o.z+d.z*te+H/2];};
 G3.resize=()=>{if(!R)return;R.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));R.setSize(vw,vh,false);};
 G3.label=()=>{const b=document.getElementById('v3dBtn');if(!b)return;b.textContent=G3.on?'2D':'3D';b.disabled=!!G3.fail;b.title=G3.fail?'3D bu cihazda açılamadı':G3.on?'2D haritaya geç':'3D haritaya geç';};
 G3.set=on=>{
  if(on&&!G3.init()){on=false;G3.fail=true;}
  if(on===G3.on){G3.label();return G3.on;}
  if(on){G3.s=cam.s;const c=[(vw/2-cam.x)/cam.s,(vh/2-cam.y)/cam.s];G3.mx=c[0];G3.my=c[1];G3.on=true;G3.resize();G3.clamp();G3.texDirty=true;G3.objDirty=true;}
  else{G3.on=false;cam.s=clamp(G3.s,fitS*.85,5);cam.x=vw/2-G3.mx*cam.s;cam.y=vh/2-G3.my*cam.s;clampCam();}
  document.getElementById('gl').hidden=!G3.on;try{localStorage.setItem('ke-3d',G3.on?'1':'0');}catch(e){}
  G3.label();
  polDirty=true;hlKey='';req();return G3.on;};
})();
/** Whether to start in 3D at boot (saved preference, default on). */
G3.wantOnBoot=()=>{let want3=true;try{want3=localStorage.getItem('ke-3d')!=='0';}catch(e){}return !!want3;};
function curS(){return G3.on?G3.s:cam.s;}
function pj(x,y,h=0){if(G3.on)return G3.proj(x,y,h);return [cam.x+x*cam.s,cam.y+y*cam.s,true];}
function panBy(dx,dy){if(G3.on)G3.panBy(dx,dy);else{cam.x+=dx;cam.y+=dy;clampCam();}req();}

