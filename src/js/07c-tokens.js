/* =====================================================================
   ARMY TOKENS (Track A, A1): a standard-bearer token per field army (S.armies): a gonfalon with the
   realm's arms (pre-rasterised per faction), a number plate, the general's initials on a wax seal,
   stack offsets, the selected-army ring (selArmy), the planned route, and tokenAt() for map clicks.
   In 3D the same tokens float over instanced regiment blocks (G3.armyItems, see 08-render3d).
   Reads only the schema: {id,f,loc,n,gen,mp,mpMax,path,st}; every field may be missing.
   ===================================================================== */
const tokSpr={};          // f -> {c: canvas, ok: arms image was ready}
const TOK_SC=3;           // sprite supersampling (crisp on retina and when zoomed)
let tokLast=[];           // tokens laid out in the last frame (screen space), bottom-most last
/** Figures in a 3D regiment block: log-scaled (1k -> 2, 5k -> 5, 20k -> 8, 60k -> 11). */
function tokFigures(n){return clamp(Math.round(1.5*Math.log2(Math.max(1,n)/400)),1,12);}
/** Initials of a general (S.chars[id].n), e.g. "Hunyadi János" -> "HJ"; '' when unknown. */
function tokInitials(gid){const c=gid!=null&&S.chars&&S.chars[gid];if(!c||!c.n)return '';
 const w=String(c.n).split(/\s+/).filter(x=>x&&!/^[IVXLC]+\.?$/.test(x)&&/^\p{Lu}/u.test(x));
 return (w.length?w:[String(c.n)]).slice(0,2).map(x=>x[0]).join('').toLocaleUpperCase('tr');}
function tokRR(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
/** The gonfalon sprite (34x40 css px): crossbar, swallow-tailed cloth in the realm's colour with folds, gold trim, arms, tassels. */
function tokSprite(f){let e=tokSpr[f];const im=ARMSIMG[f],ok=!!(im&&im.complete&&im.naturalWidth);if(e&&(e.ok||!ok))return e;
 const k=TOK_SC,cv=mk(34*k,40*k),g=cv.getContext('2d');g.scale(k,k);const col=(FAC[f]&&FAC[f].c)||'#888';
 const cloth=()=>{g.beginPath();g.moveTo(4,5);g.lineTo(30,5);g.lineTo(30,38);g.lineTo(17,31.5);g.lineTo(4,38);g.closePath();};
 g.save();cloth();g.shadowColor='rgba(20,10,2,.45)';g.shadowBlur=2.5;g.shadowOffsetX=1;g.shadowOffsetY=1.2;g.fillStyle=col;g.fill();g.restore();
 g.save();cloth();g.clip();
 const fg=g.createLinearGradient(4,0,30,0);[[0,'rgba(0,0,0,.22)'],[.2,'rgba(255,255,255,.14)'],[.42,'rgba(0,0,0,.08)'],[.66,'rgba(255,255,255,.12)'],[.86,'rgba(0,0,0,.06)'],[1,'rgba(0,0,0,.26)']].forEach(([o,c])=>fg.addColorStop(o,c));
 g.fillStyle=fg;g.fillRect(0,0,34,40);
 const vg=g.createLinearGradient(0,5,0,38);vg.addColorStop(0,'rgba(255,255,255,.18)');vg.addColorStop(.35,'rgba(255,255,255,0)');vg.addColorStop(1,'rgba(0,0,0,.2)');g.fillStyle=vg;g.fillRect(0,0,34,40);
 g.beginPath();g.moveTo(6,7);g.lineTo(28,7);g.lineTo(28,34.6);g.lineTo(17,29.2);g.lineTo(6,34.6);g.closePath();g.strokeStyle='rgba(233,196,106,.95)';g.lineWidth=1.1;g.stroke();
 if(ok){g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=1.5;g.shadowOffsetY=.6;g.drawImage(im,9.6,9,14.8,17.8);}
 g.restore();
 cloth();g.strokeStyle='#23150a';g.lineWidth=.9;g.stroke();
 // crossbar with brass knobs, cords to the cloth corners
 const bg=g.createLinearGradient(0,2.6,0,5.4);bg.addColorStop(0,'#8a6034');bg.addColorStop(1,'#3a2410');g.fillStyle=bg;tokRR(g,1.5,2.6,31,2.8,1.2);g.fill();g.strokeStyle='#23150a';g.lineWidth=.5;g.stroke();
 for(const x of[1.6,32.4]){const kg=g.createRadialGradient(x-.5,3.4,.2,x,4,2.2);kg.addColorStop(0,'#fff0b8');kg.addColorStop(.5,'#e2b857');kg.addColorStop(1,'#8a6420');g.fillStyle=kg;g.beginPath();g.arc(x,4,2.1,0,7);g.fill();}
 g.fillStyle='#e2b857';for(const x of[4,30]){g.beginPath();g.arc(x,38.8,1.5,0,7);g.fill();g.fillRect(x-.35,36.8,.7,1.6);}
 return tokSpr[f]={c:cv,ok};}

/** Everything that should show as a token this frame: live armies (at their province, or where the replay puts them)
 plus replay ghosts (armies destroyed this turn, pre-army battle traces). */
function tokItems(){const out=[];if(!S||!Array.isArray(S.armies))return out;const byLoc={},pl=S.player;
 for(const a of S.armies){if(!(a.n>0)||!PD[a.loc]||!FAC[a.f])continue;const ov=typeof aRpPos==='function'?aRpPos(a.id):null;
  if(ov){if(!ov.hide)out.push({id:a.id,f:a.f,n:a.n,gen:a.gen,x:ov.x,y:ov.y,k:0,al:ov.al,dir:ov.dir,mp:a.mp,mpMax:a.mpMax});continue;}
  (byLoc[a.loc]||(byLoc[a.loc]=[])).push(a);}
 for(const i in byLoc){const L=byLoc[i].sort((a,b)=>((b.f===pl)-(a.f===pl))||(b.n-a.n)),d=PD[i];
  let k=0;for(const a of L){const cp=aSgCampOf(a);   // a besieging army stands in its siege camp (07f)
   out.push({id:a.id,f:a.f,n:a.n,gen:a.gen,x:d.lx,y:d.ly,k:cp?0:k++,camp:cp,al:1,mp:a.mp,mpMax:a.mpMax,path:Array.isArray(a.path)?a.path:null});}}
 if(typeof aRpGhosts==='function')for(const g of aRpGhosts())out.push(g);
 return out;}

/** Lay the tokens out in screen space (and feed the 3D regiments). Returns tokLast; each has r=[x0,y0,x1,y1]. */
function tokLayout(s,g3,now){const out=[],a3=[];
 if(S&&Array.isArray(S.armies)){const pl=S.player,z0=clamp(.68+.3*s,.86,1.2)*(g3?.86:1);
  for(const it of tokItems()){let fx,fy;const z=z0;
   if(g3){let wx=it.x-8-7.5*it.k,wy=it.y+2+2*it.k;if(it.camp){const o=aSgCamp3(it.camp);wx=it.x+o[0];wy=it.y+o[1];}if((it.al==null?1:it.al)>.3)a3.push({f:it.f,n:it.n,wx,wy,dir:it.dir});const q=pj(wx,wy,7.5);if(!q[2])continue;fx=q[0];fy=q[1];}
   else{const q=pj(it.x,it.y);if(it.camp){const o=aSgCampOff(it.camp,s);fx=q[0]+o[0];fy=q[1]+o[1]+7*z;}else{fx=q[0]-(15+26*it.k)*z;fy=q[1]+(5-4*it.k)*z;}}
   if(fx<-40||fy<-10||fx>vw+40||fy>vh+70)continue;
   const own=!!pl&&it.f===pl,war=!!pl&&!own&&alive(it.f)&&atWar(pl,it.f),id=it.id==null?null:it.id;
   out.push({id,f:it.f,n:it.n,gi:tokInitials(it.gen),fx,fy,ax:fx,ay:fy,z,al:it.al==null?1:it.al,own,war,sel:id!=null&&id===selArmy,
    mp:it.mp,mpMax:it.mpMax,path:it.path,k:it.k,moving:!!it.dir||it.al<1,pr:(id!=null&&id===selArmy?1e7:0)+(own?4e6:war?2e6:0)+it.n});}
  // tokens of neighbouring provinces must not hide each other: greedy nudge (priority: selected, own, enemies at war, size)
  const body=t=>[t.fx-14*t.z,t.fy-57*t.z,t.fx+14*t.z,t.fy-3*t.z],placed=[],hit=r=>placed.some(o=>r[0]<o[2]-2&&r[2]>o[0]+2&&r[1]<o[3]-2&&r[3]>o[1]+2);
  const NUDGE=[[0,0],[-16,-10],[16,-10],[-28,2],[28,2],[0,-30],[-34,-22],[34,-22],[0,22]];
  for(const t of out.slice().sort((a,b)=>b.pr-a.pr)){if(t.moving){placed.push(body(t));continue;}let ok=null;
   for(const [dx,dy] of NUDGE){const u={fx:t.ax+dx*t.z,fy:t.ay+dy*t.z,z:t.z};if(!hit(body(u))){ok=u;break;}}
   if(ok){t.fx=ok.fx;t.fy=ok.fy;}placed.push(body(t));}
  for(const t of out)t.r=[t.fx-17*t.z,t.fy-60*t.z,t.fx+17*t.z,t.fy+4*t.z];}
 if(g3){const sig=G3.lod()+'|'+a3.map(a=>a.f+a.n+'@'+a.wx.toFixed(1)+','+a.wy.toFixed(1)).join(';');if(sig!==G3.armySig){G3.armySig=sig;G3.armyItems=a3;G3.armyDirty=true;}}
 out.sort((a,b)=>a.fy-b.fy);return tokLast=out;}

/** Draw one token with its foot at (t.fx,t.fy). */
function tokDraw(c,t,now){const z=t.z,fx=t.fx,fy=t.fy,top=fy-52*z;if(t.al<=0)return;
 c.save();c.globalAlpha=clamp(t.al,0,1);c.lineCap='round';c.lineJoin='round';
 if(t.sel){const pu=.5+.5*Math.sin(now/260);c.fillStyle=`rgba(255,220,130,${.18+.14*pu})`;c.beginPath();c.ellipse(fx,fy,(17+3*pu)*z,(6+1.2*pu)*z,0,0,7);c.fill();
  c.strokeStyle=`rgba(243,210,122,${.6+.4*pu})`;c.lineWidth=2.2;c.beginPath();c.ellipse(fx,fy,(15+3*pu)*z,(5.2+1*pu)*z,0,0,7);c.stroke();
  c.strokeStyle='rgba(60,30,8,.55)';c.lineWidth=1;c.beginPath();c.ellipse(fx,fy,(18.5+3*pu)*z,(6.6+1.1*pu)*z,0,0,7);c.stroke();}
 c.fillStyle='rgba(25,14,4,.38)';c.beginPath();c.ellipse(fx+2.5*z,fy,11*z,3.4*z,0,0,7);c.fill();
 // pole and spear-head finial
 c.strokeStyle='#23150a';c.lineWidth=2.8*z;c.beginPath();c.moveTo(fx,fy);c.lineTo(fx,top-3*z);c.stroke();
 c.strokeStyle='#9a6c3a';c.lineWidth=1.1*z;c.beginPath();c.moveTo(fx-.5*z,fy-1.2*z);c.lineTo(fx-.5*z,top-2*z);c.stroke();
 const fg=c.createLinearGradient(fx-3*z,0,fx+3*z,0);fg.addColorStop(0,'#fff0b8');fg.addColorStop(.5,'#e2b857');fg.addColorStop(1,'#8a6420');
 c.fillStyle=fg;c.strokeStyle='#4a2e12';c.lineWidth=.8;c.beginPath();c.moveTo(fx,top-12*z);c.lineTo(fx+2.7*z,top-5*z);c.lineTo(fx,top-2.6*z);c.lineTo(fx-2.7*z,top-5*z);c.closePath();c.fill();c.stroke();
 // gonfalon
 const sp=tokSprite(t.f);if(t.sel){c.shadowColor='rgba(255,214,120,.95)';c.shadowBlur=12;}
 c.drawImage(sp.c,fx-17*z,top-4*z,34*z,40*z);c.shadowBlur=0;
 // general's seal
 if(t.gi){const gx=fx+13*z,gy=top+3*z,r=6.4*z,sg=c.createRadialGradient(gx-2*z,gy-2*z,.5,gx,gy,r);sg.addColorStop(0,'#e0563d');sg.addColorStop(.7,'#8a1a0f');sg.addColorStop(1,'#5d0f08');
  c.fillStyle=sg;c.beginPath();c.arc(gx,gy,r,0,7);c.fill();c.strokeStyle='#e2b857';c.lineWidth=1;c.stroke();
  c.fillStyle='#fbe9c0';c.font=`700 ${Math.max(6,(t.gi.length>1?5.6:7)*z)}px "Cinzel", Georgia, serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(t.gi,gx,gy+.4*z);}
 // number plate
 const fs=Math.round(12.5*z),txt=fmtK(t.n);c.font=`700 ${fs}px "EB Garamond", Georgia, serif`;const tw=c.measureText(txt).width+11*z,ph=14*z,px=fx-tw/2,py=fy-17.5*z;
 c.fillStyle='rgba(20,12,4,.35)';tokRR(c,px+1.2,py+1.5,tw,ph,3*z);c.fill();
 const pg=c.createLinearGradient(0,py,0,py+ph);pg.addColorStop(0,'#fdf5dc');pg.addColorStop(1,'#e1c992');c.fillStyle=pg;tokRR(c,px,py,tw,ph,3*z);c.fill();
 c.lineWidth=t.own?1.8:1.2;c.strokeStyle=t.own?'#b8862c':t.war?'#9d2a1b':'#4a2e12';c.stroke();
 c.fillStyle=t.war?'#7d1a10':'#23150a';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,fx,py+ph/2+.6*z);
 // movement points of the player's armies: gold pips (spent ones hollow)
 if(t.own&&t.mpMax>0){const n=Math.min(4,t.mpMax),w=5*z;for(let k=0;k<n;k++){const x=fx-(n-1)*w/2+k*w,y=fy+.5*z;c.beginPath();c.moveTo(x,y-2*z);c.lineTo(x+1.8*z,y);c.lineTo(x,y+2*z);c.lineTo(x-1.8*z,y);c.closePath();
  c.fillStyle=k<(t.mp||0)?'#e2b857':'rgba(248,240,218,.55)';c.fill();c.lineWidth=.7;c.strokeStyle='#4a2e12';c.stroke();}}
 c.restore();}

/** Planned route of one of the player's armies: dashed gold line through the path's provinces with an arrowhead. */
function tokRoute(c,t,now,g3){const pts=[[t.fx,t.fy-4*t.z]];for(const j of t.path){if(!PD[j])continue;const q=pj(PD[j].lx,PD[j].ly,g3?3:0);if(!q[2])return;pts.push([q[0],q[1]]);}
 if(pts.length<2)return;c.save();c.globalAlpha=t.sel?.95:.5;c.lineCap='round';c.lineJoin='round';
 const line=()=>{c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let k=1;k<pts.length;k++)c.lineTo(pts[k][0],pts[k][1]);};
 c.strokeStyle='rgba(20,12,4,.55)';c.lineWidth=6;line();c.stroke();
 c.strokeStyle='#f3d27a';c.lineWidth=3;c.setLineDash([9,6]);c.lineDashOffset=t.sel?-(now/45)%15:0;line();c.stroke();c.setLineDash([]);
 for(let k=1;k<pts.length-1;k++){c.fillStyle='#f3d27a';c.strokeStyle='#23150a';c.lineWidth=1;c.beginPath();c.arc(pts[k][0],pts[k][1],3.2,0,7);c.fill();c.stroke();}
 const [bx,by]=pts[pts.length-1],[ax,ay]=pts[pts.length-2],an=Math.atan2(by-ay,bx-ax);
 c.fillStyle='#f3d27a';c.strokeStyle='#23150a';c.lineWidth=1.2;c.beginPath();c.moveTo(bx+3*Math.cos(an),by+3*Math.sin(an));c.lineTo(bx-13*Math.cos(an-.5),by-13*Math.sin(an-.5));c.lineTo(bx-13*Math.cos(an+.5),by-13*Math.sin(an+.5));c.closePath();c.fill();c.stroke();
 c.restore();}

/* The armies layer (replaces B's placeholder): replay trails, planned routes, then the tokens bottom-most last. */
DRAW_LAYERS.armies=(c,now,s,g3)=>{let anim=false;
 if(typeof aRpTrails==='function'&&aRpTrails(c,now,g3))anim=true;
 for(const t of tokLast)if(t.own&&t.path&&t.path.length&&(t.sel||t.path.length))tokRoute(c,t,now,g3);
 for(const t of tokLast){tokDraw(c,t,now);if(t.sel)anim=true;}
 return anim||(g3&&G3.armyDirty);};

/** Army under screen point (sx,sy), or null. Hit box is at least 44x44 px around each token (touch). */
function tokenAt(sx,sy){let best=null,bd=1e9;
 for(const t of tokLast){if(t.id==null||t.al<.5)continue;const cx=(t.r[0]+t.r[2])/2,cy=(t.r[1]+t.r[3])/2,hw=Math.max(22,(t.r[2]-t.r[0])/2),hh=Math.max(22,(t.r[3]-t.r[1])/2);
  if(Math.abs(sx-cx)<=hw&&Math.abs(sy-cy)<=hh){const d=Math.hypot(sx-t.fx,sy-(t.fy-30*t.z))-(t.own?6:0);if(d<bd){bd=d;best=t.id;}}}
 return best;}
KE.tokenAt=(x,y)=>tokenAt(x,y);
KE.selectArmy=id=>{selArmy=id==null?null:id;req();};
KE.tokens=()=>tokLast.map(t=>({id:t.id,f:t.f,n:t.n,x:Math.round(t.fx),y:Math.round(t.fy-30*t.z),r:t.r.map(Math.round),sel:t.sel}));
