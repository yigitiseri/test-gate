/* =====================================================================
   SIEGES AND OCCUPATION (Track A, W2 A7-lite + A3-siege): what a siege looks like on the map and on a card.
   - 2D map: a siege camp around the besieged town (siege lines drawn as a serrated ring, tents in the
     besieger's colour, bombards), smoke rising from the walls, and a wall-integrity plaque (one stone per
     turn of siege still needed). At far zoom only the ring and a wisp of smoke.
   - 3D map: tents, stakes and bombards are instanced meshes and the smoke is sprites (08-render3d, G3.sgItems);
     the wall plaque is drawn over the 3D view by the same layer.
   - Occupation hatching (EU4 style) is drawn in renderPol (07) from S.prov[i].ctl.
   - Siege card (#card, shared with the battle card): wall picture with bombards and their smoke, the wall
     integrity bar, sides and the commander's portrait. Shown for the player's sieges: at once when the player's
     own march starts one, otherwise at the end of the turn (presenter 'siegecard', order 18) for the most
     important siege event of the turn (a fall first).
   Reads B's shared interface only, with guards: S.sieges[i]={i,f,a,t0,prog,need,sally}, S.prov[i].ctl, ctl(i),
   hooks siegeStart(s) / siegeTick(s) / siegeFell(i,f). Works with synthetic fixtures before B is merged.
   Animation is on demand: the smoke drifts (~15 fps) for A_SG.hot ms after a turn, a siege event or entering
   the game, then freezes; an idle map costs nothing.
   ===================================================================== */
const A_SG={hot:6000,fps:15,segMax:10,hold:4600,maxShown:40};
let aSgLay=[],aSgHotT=0,aSgTm=0,aSgT=0,aSgSig='';
/** Controller (occupier) of province i: B's ctl(i) when present, else S.prov[i].ctl || owner. */
function aCtl(i){if(typeof ctl==='function')return ctl(i);const p=S&&S.prov[i];return p?(p.ctl||p.o):null;}
/** Every siege as {i,s,f,prog,need,army}, validated (province and faction exist). */
function aSieges(){const out=[],L=S&&S.sieges;if(!L||typeof L!=='object')return out;
 for(const k in L){const s=L[k];if(!s||typeof s!=='object')continue;const i=s.i!=null?+s.i:+k;if(!PD[i]||!FAC[s.f])continue;
  const aid=s.a!=null?s.a:s.army,a=aid!=null&&typeof armyById==='function'?armyById(aid):null;
  const need=Math.max(1,+s.need||1);out.push({i,s,f:s.f,prog:clamp(+s.prog||0,0,need),need,army:a||null});}
 return out;}
/** Share of the walls still standing, 0..1. */
const aWall=g=>clamp(1-g.prog/g.need,0,1);
/** Turns of siege still needed (whole turns). */
const aSgLeft=g=>Math.max(0,Math.ceil(g.need-g.prog-1e-6));
/** Direction (radians, map space) the besieger came from: towards a neighbouring province it holds. */
function aSgSide(g){const d=PD[g.i];let best=null;
 const from=g.army&&g.army.loc!==g.i?g.army.loc:null;
 if(from!=null&&PD[from])best=from;else for(const j of d.adj){if(!PD[j])continue;if(aCtl(j)===g.f||S.prov[j].o===g.f){best=j;break;}}
 if(best==null)return 2.4+hash(g.i,7)*.8;return Math.atan2(PD[best].ly-d.ly,PD[best].lx-d.lx);}
/** Number of tents: grows with the besieging army (3..6). */
const aSgTents=g=>clamp(2+Math.round(Math.log2(Math.max(1,(g.army?g.army.n:6000))/2500)),3,6);
/** City glyph size at zoom s (as drawCity in 07). */
function aSgCitySz(i,s){const p=S.prov[i],cap=S.fac[p.o]&&S.fac[p.o].cap===i;return clamp((2.4+p.dev*.42)*Math.sqrt(s),3,12)*(cap?1.3:1);}
/** The siege an army is conducting at its own province, as {i,ang} (its token stands in the camp), or null. */
function aSgCampOf(a){const L=S&&S.sieges;if(!L||!a)return null;const s=L[a.loc];if(!s||s.f!==a.f)return null;const aid=s.a!=null?s.a:s.army;
 if(aid!=null&&aid!==a.id)return null;return {i:a.loc,ang:aSgSide({i:a.loc,f:s.f,army:a})};}
/** Screen offset of the camp centre from the town (2D). */
function aSgCampOff(cp,s){const sz=aSgCitySz(cp.i,s),r=Math.max(10,sz*2.1+7),tw=clamp(sz*1.25,8,14),rr=r+tw*.75;return [Math.cos(cp.ang)*rr,Math.sin(cp.ang)*rr*.86];}
/** Map offset of the camp centre from the town (3D, matches the tent ring in 08). */
function aSgCamp3(cp){const p=S.prov[cp.i],cap=S.fac[p.o]&&S.fac[p.o].cap===cp.i,u=(1.9+p.dev*.3)*(cap?1.25:1),rr=u*2.25+2.6+6.5;return [Math.cos(cp.ang)*rr,Math.sin(cp.ang)*rr];}
function aSgHot(ms){aSgHotT=Math.max(aSgHotT,performance.now()+(ms||A_SG.hot));req();}

/** Called by draw() once cities are placed: lays out the wall plaques greedily (aOcc) and feeds the 3D camps. */
function aSgReserve(P0,szs,s,g3){aSgLay=[];const L=aSieges();
 if(g3){const sig=L.map(g=>g.i+g.f+':'+g.prog+'/'+g.need+':'+(g.army?g.army.n:0)).join(';');
  if(sig!==aSgSig){aSgSig=sig;G3.sgItems=L.slice(0,A_SG.maxShown).map(g=>{const p=S.prov[g.i],cap=S.fac[p.o]&&S.fac[p.o].cap===g.i;
    return {i:g.i,f:g.f,lx:PD[g.i].lx,ly:PD[g.i].ly,u:(1.9+p.dev*.3)*(cap?1.25:1),ang:aSgSide(g),tents:aSgTents(g),wall:aWall(g)};});G3.sgDirty=true;}}
 else if(aSgSig){aSgSig='';}
 if(!L.length)return;
 const pl=S.player;
 for(const g of L){const d=PD[g.i];let q=P0[g.i];if(!q)continue;const p=S.prov[g.i],cap=S.fac[p.o]&&S.fac[p.o].cap===g.i;
  const sz=szs[g.i]||aSgCitySz(g.i,s);
  const it={g,i:g.i,cx:q[0],cy:q[1],sz,r:Math.max(10,sz*2.1+7),ang:aSgSide(g),mine:g.f===pl,vict:!!pl&&p.o===pl,bar:null};
  if(g3||s>=.55){const segs=Math.min(A_SG.segMax,Math.ceil(g.need)),sw=segs>7?4:5,w=15+segs*sw+2,h=12;let cand;
   if(g3){const u=(1.9+p.dev*.3)*(cap?1.25:1),t=pj(d.lx,d.ly,u*3.4);cand=[[t[0]-w/2,t[1]-h-6],[t[0]+u*s*1.9+6,t[1]+2],[t[0]-w-u*s*1.9-6,t[1]+2]];}
   else{const top=q[1]-sz*1.85;cand=[[q[0]-w/2,top-h-3],[q[0]+sz*1.1+4,q[1]-h/2-sz*.45],[q[0]-sz*1.1-4-w,q[1]-h/2-sz*.45],[q[0]-w/2,q[1]+sz*.7+4]];}
   let pos=null;for(const c of cand){const r=[c[0]-1,c[1]-1,c[0]+w+1,c[1]+h+1];if(aFree(r)){pos=c;break;}}
   if(!pos)pos=cand[0];aOcc.push(aTag([pos[0]-1,pos[1]-1,pos[0]+w+1,pos[1]+h+1],'s'));it.bar={x:pos[0],y:pos[1],w,h,segs,sw};
   if(!g3){const n=aSgTents(g),tw=clamp(sz*1.25,8,14);it.tw=tw;it.tents=[];
    // tents on an arc on the besieger's side, skipping the band under the town where its name goes
    const m=n+3,nb=[it.cx-60,it.cy+sz*.5,it.cx+60,it.cy+sz*.7+19];
    for(let k=0;k<m&&it.tents.length<n;k++){const j=k%2?(m-1)/2+Math.ceil(k/2):(m-1)/2-k/2,a=it.ang+(j/(m-1)-.5)*2.6,rr=it.r+tw*.75+(k%2)*tw*.4,x=it.cx+Math.cos(a)*rr,y=it.cy+Math.sin(a)*rr*.86;
     if(y-tw<nb[3]&&y>nb[1]&&x>nb[0]&&x<nb[2])continue;
     it.tents.push([x,y,k===1]);aOcc.push(aTag([x-tw*.55,y-tw,x+tw*.55,y+1],'c'));}
    it.tents.sort((a,b)=>a[1]-b[1]);}}
  aSgLay.push(it);}
}

/* ---- 2D drawing: manuscript siege-plan style (ink outlines, parchment highlights) ---- */
function aSgRing(c,it){const {cx,cy,r}=it,n=Math.max(18,Math.round(r*1.1))*2;
 // the line breaks where a town name, garrison chip or wall plaque sits, so labels stay readable
 const hide=[];for(const o of aOcc)if(o.k==='n'||o.k==='g'||o.k==='s')if(o[0]<cx+r+5&&o[2]>cx-r-5&&o[1]<cy+r+5&&o[3]>cy-r-5)hide.push(o);
 const runs=[];let cur=null;
 for(let k=0;k<=n;k++){const a=k/n*Math.PI*2,rr=k%2?r+3.4:r;const x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.86;
  if(hide.some(o=>x>o[0]-2&&x<o[2]+2&&y>o[1]-2&&y<o[3]+2)){cur=null;continue;}if(!cur){runs.push(cur=[]);cur.k0=k;}cur.push([x,y]);cur.k1=k;}
 if(runs.length>1&&runs[0].k0===0&&runs[runs.length-1].k1===n)runs[0]=runs.pop().concat(runs[0]);   // join across angle 0
 c.save();c.lineJoin='miter';c.beginPath();
 for(const L of runs){if(L.length<Math.max(6,n/8))continue;L.forEach((p,k)=>k?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));}
 c.strokeStyle='rgba(248,240,218,.7)';c.lineWidth=3.6;c.stroke();c.strokeStyle='rgba(125,32,16,.95)';c.lineWidth=1.6;c.stroke();c.restore();}
function aSgTent(c,x,y,w,col,big){const h=w*(big?1.05:.88);
 c.fillStyle='rgba(25,14,4,.32)';c.beginPath();c.ellipse(x+1.2,y+.6,w*.62,w*.18,0,0,7);c.fill();
 c.beginPath();c.moveTo(x-w/2,y);c.lineTo(x,y-h);c.lineTo(x+w/2,y);c.closePath();c.fillStyle=col;c.fill();
 c.fillStyle='rgba(255,248,225,.28)';c.beginPath();c.moveTo(x-w/2,y);c.lineTo(x,y-h);c.lineTo(x-w*.14,y);c.closePath();c.fill();
 c.fillStyle='rgba(0,0,0,.24)';c.beginPath();c.moveTo(x,y-h);c.lineTo(x+w/2,y);c.lineTo(x+w*.06,y);c.closePath();c.fill();
 c.fillStyle='#23150a';c.beginPath();c.moveTo(x-w*.1,y);c.lineTo(x,y-h*.42);c.lineTo(x+w*.1,y);c.closePath();c.fill();
 c.beginPath();c.moveTo(x-w/2,y);c.lineTo(x,y-h);c.lineTo(x+w/2,y);c.closePath();c.strokeStyle='#23150a';c.lineWidth=.9;c.stroke();
 if(big){c.beginPath();c.moveTo(x,y-h);c.lineTo(x,y-h-w*.6);c.stroke();c.fillStyle=col;c.beginPath();c.moveTo(x,y-h-w*.6);c.lineTo(x+w*.5,y-h-w*.48);c.lineTo(x,y-h-w*.34);c.closePath();c.fill();c.lineWidth=.6;c.stroke();}}
function aSgGun(c,x,y,an,z){c.save();c.translate(x,y);c.rotate(an);
 c.fillStyle='#5a3a1e';c.strokeStyle='#23150a';c.lineWidth=.8;c.fillRect(-4*z,.5*z,7*z,2.2*z);c.strokeRect(-4*z,.5*z,7*z,2.2*z);
 const g=c.createLinearGradient(0,-2*z,0,2*z);g.addColorStop(0,'#8c7a5a');g.addColorStop(1,'#2e2418');c.fillStyle=g;
 c.beginPath();c.moveTo(-4.5*z,-1.9*z);c.lineTo(5.5*z,-1.3*z);c.lineTo(5.5*z,1.3*z);c.lineTo(-4.5*z,1.9*z);c.closePath();c.fill();c.stroke();
 c.fillStyle='#23150a';c.beginPath();c.arc(-1*z,2.4*z,1.6*z,0,7);c.fill();c.restore();}
/** Smoke plumes over the walls: puffs rise and drift east; thicker and fire-lit as the walls fail. */
function aSgSmoke(c,it,t){const w=aWall(it.g),n=w<.34?3:w<.7?2:1,sc=clamp(it.sz/7,.75,1.8)*(it.bar?1:.7),seed=hash(it.i,3)*10;
 c.save();c.lineWidth=.8;
 for(let p=0;p<n;p++){const bx=it.cx+(p-(n-1)/2)*it.sz*.8,by=it.cy-it.sz*.8;
  if(w<.5){const fl=.55+.45*Math.sin(t*9+p*2+seed);c.fillStyle=`rgba(236,120,40,${.35+.25*fl})`;c.beginPath();c.arc(bx,by+2,2.4*sc+fl*1.3,0,7);c.fill();}
  // engraved-cloud puffs: ash body, parchment highlight, thin ink rim; oldest (highest) first
  for(let j=0;j<6;j++){const u=1-((t*.18+j/6+p*.37+seed)%1),x=bx+u*u*18*sc,y=by-u*34*sc,r=(2.4+u*6.5)*sc,a=Math.min(1,(1-u)*2.2)*(u<.08?u/.08:1)*(.6+.3*(1-w));
   c.fillStyle=`rgba(96,86,74,${a*.72})`;c.beginPath();c.arc(x,y,r,0,7);c.fill();c.strokeStyle=`rgba(42,26,12,${a*.55})`;c.stroke();
   c.fillStyle=`rgba(240,232,212,${a*.45})`;c.beginPath();c.arc(x-r*.28,y-r*.3,r*.5,0,7);c.fill();}}
 c.restore();}
function aSgCamp(c,it,t,now,hot){const col=(FAC[it.g.f]&&FAC[it.g.f].c)||'#888',far=!it.bar;
 aSgRing(c,it);if(far)return;
 const z=clamp(it.sz/6,.8,1.6);for(const p of it.tents||[])aSgTent(c,p[0],p[1],it.tw,col,p[2]);
 for(const k of[-1,1]){const a=it.ang+k*.32,gx=it.cx+Math.cos(a)*(it.r-1),gy=it.cy+Math.sin(a)*(it.r-1)*.86,an=Math.atan2(it.cy-gy,it.cx-gx);aSgGun(c,gx,gy,an,z);
  if(hot){const ph=((now/1000)*.8+(k>0?.5:0)+hash(it.i,k+5))%1.6;if(ph<.55){const u=ph/.55,mx=gx+Math.cos(an)*(6*z+u*6),my=gy+Math.sin(an)*(6*z+u*6)-u*4;
   if(u<.2){c.fillStyle=`rgba(255,200,90,${1-u*5})`;c.beginPath();c.arc(gx+Math.cos(an)*6*z,gy+Math.sin(an)*6*z,2.5*z,0,7);c.fill();}
   c.fillStyle=`rgba(244,236,218,${.85*(1-u)})`;c.beginPath();c.arc(mx,my,(2+u*5)*z,0,7);c.fill();c.strokeStyle=`rgba(72,62,52,${.5*(1-u)})`;c.lineWidth=.7;c.stroke();}}}}
/** The wall plaque: a small tower, then one stone per turn of siege needed; fallen stones turn to red rubble. */
function aSgBar(c,it){const b=it.bar;if(!b)return;const {x,y,w,h,segs,sw}=b,g=it.g,left=aWall(g)*segs;
 c.save();c.fillStyle='rgba(20,12,4,.32)';rr(x+1.2,y+1.5,w,h,2.5);c.fill();
 const gr=c.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'#fbf2d8');gr.addColorStop(1,'#e2cc98');c.fillStyle=gr;rr(x,y,w,h,2.5);c.fill();
 c.lineWidth=it.mine||it.vict?1.6:1;c.strokeStyle=it.mine?'#b8862c':it.vict?'#9d2a1b':'#5e3f1f';c.stroke();
 // tower glyph
 const tx=x+3,tb=y+h-2,th=7;c.fillStyle='#cfc3a3';c.strokeStyle='#2a1a0c';c.lineWidth=.8;c.beginPath();c.moveTo(tx,tb);c.lineTo(tx,tb-th);c.lineTo(tx+2,tb-th);c.lineTo(tx+2,tb-th+1.6);c.lineTo(tx+3.5,tb-th+1.6);c.lineTo(tx+3.5,tb-th);c.lineTo(tx+5.5,tb-th);c.lineTo(tx+5.5,tb-th+1.6);c.lineTo(tx+7,tb-th+1.6);c.lineTo(tx+7,tb-th);c.lineTo(tx+9,tb-th);c.lineTo(tx+9,tb);c.closePath();c.fill();c.stroke();
 if(left<segs){c.strokeStyle='#7d1a10';c.lineWidth=.9;c.beginPath();c.moveTo(tx+6.5,tb-th+1.8);c.lineTo(tx+5,tb-th+4);c.lineTo(tx+6.4,tb-2);c.stroke();}
 for(let k=0;k<segs;k++){const sx=x+15+k*sw,sy=y+2.5,sh=h-5,f=clamp(left-k,0,1);
  c.fillStyle='rgba(125,26,16,.55)';c.fillRect(sx,sy+sh*.45,sw-1,sh*.55);
  if(f>0){const fh=sh;c.fillStyle='#8f8166';c.fillRect(sx,sy,(sw-1)*f,fh);c.fillStyle='rgba(255,250,235,.45)';c.fillRect(sx,sy,(sw-1)*f,1.2);}
  c.strokeStyle='rgba(42,26,12,.75)';c.lineWidth=.6;c.strokeRect(sx+.3,sy+.3,sw-1.6,sh-.6);}
 c.restore();}

/* layer order: the camp and smoke go under the army tokens, the wall plaque above them */
{const arm=DRAW_LAYERS.armies;delete DRAW_LAYERS.armies;
 DRAW_LAYERS.siegeCamp=(c,now,s,g3)=>{if(!aSgLay.length&&!(g3&&G3.sgDirty))return false;const hot=now<aSgHotT;if(hot)aSgT=now/1000;
  if(!g3)for(const it of aSgLay)aSgCamp(c,it,aSgT,now,hot);
  if(hot&&aSgLay.length&&!aSgTm)aSgTm=setTimeout(()=>{aSgTm=0;if(G3.on)G3.dirty=true;req();},1000/A_SG.fps);
  return !!(g3&&G3.sgDirty);};
 if(arm)DRAW_LAYERS.armies=arm;
 DRAW_LAYERS.siegeTop=(c,now,s,g3)=>{if(!g3)for(const it of aSgLay)aSgSmoke(c,it,aSgT);for(const it of aSgLay)aSgBar(c,it);return false;};}

/* ---- siege card (#card) ---- */
const aSgQ=[];let aSgCardInfo=null;
/** The wall picture: curtain wall and towers (breached as the siege goes on), two bombards firing, smoke. */
function aWallSVG(w,fell,col){const br=fell?4:Math.round((1-w)*4),towers=[168,232,296,352],cur=[];
 const mer=(x0,x1,y)=>{let s='';for(let x=x0;x<x1-4;x+=9)s+=`<rect x="${x}" y="${y-5}" width="5" height="5"/>`;return s;};
 const gaps=[[190,214],[254,278],[318,340],[200,222]].slice(0,br);
 for(const [a,b] of gaps){const m=(a+b)/2,dp=16+br*4;cur.push(`<path class="gap" d="M${a} 44 L${a+3} ${48+dp*.4} L${m-4} ${44+dp*.7} L${m} ${44+dp} L${m+5} ${44+dp*.6} L${b-2} ${49+dp*.3} L${b} 44 Z"/><path class="rub" d="M${a-4} 86 Q${m} ${74-br} ${b+4} 86 Z"/>`);}
 const tw=towers.map((x,k)=>{const broken=fell?k===1||k===2:(k===1&&w<.35)||(k===2&&w<.15);const top=broken?`<path class="gap" d="M${x-11} 28 L${x-6} 36 L${x-2} 31 L${x+3} 39 L${x+11} 30 L${x+11} 26 L${x-11} 26 Z"/>`:'';
  return `<g class="tw"><rect x="${x-11}" y="28" width="22" height="58"/>${broken?'':mer(x-11,x+13,28)}<rect class="slit" x="${x-1.5}" y="42" width="3" height="9"/><rect class="slit" x="${x-1.5}" y="60" width="3" height="9"/>${top}</g>`;}).join('');
 const flag=fell?`<g class="flag"><line x1="232" y1="28" x2="232" y2="4"/><path d="M232 5 L256 9 L232 15 Z" style="fill:${col}"/></g>`:'';
 const gun=(x,d)=>`<g class="gun" transform="translate(${x} 74)"><rect class="car" x="-14" y="2" width="26" height="6" rx="1.5"/><path class="brl" d="M-16 -4 L16 -6.5 L16 3.5 L-16 1.5 Z"/><rect class="band" x="-6" y="-5" width="2.4" height="8"/><rect class="band" x="6" y="-6" width="2.4" height="9.4"/><circle class="whl" cx="-6" cy="9" r="5"/>
  <circle class="flash" cx="19" cy="-1.5" r="5" style="animation-delay:${d}s"/><g class="pf" style="animation-delay:${d}s"><circle cx="22" cy="-3" r="6"/><circle cx="29" cy="-8" r="5"/><circle cx="25" cy="-12" r="4"/></g>
  <g class="shotx" style="animation-delay:${d}s"><g class="shoty" style="animation-delay:${d}s"><circle class="ball" cx="19" cy="-1.5" r="2"/></g></g></g>`;
 const smoke=[0,1,2].slice(0,fell?3:br>=2?2:br?1:0).map(k=>`<g class="sm" style="animation-delay:${k*.9}s"><circle cx="${214+k*50}" cy="36" r="7"/><circle cx="${220+k*50}" cy="30" r="5"/></g>`).join('');
 return `<svg class="a-sc-pic${fell?' fell':''}" viewBox="0 0 370 96" role="img" aria-hidden="true" focusable="false">
 <path class="gnd" d="M0 86 L370 86 L370 96 L0 96 Z"/><path class="hill" d="M0 86 Q60 70 128 86 Z"/>
 <g class="wall"><rect x="150" y="44" width="220" height="42"/>${mer(150,370,44)}${cur.join('')}${tw}</g>${flag}${smoke}${gun(40,0)}${gun(92,.7)}</svg>`;}
function aSgSegs(g,fell){const segs=Math.min(A_SG.segMax,Math.ceil(g.need)),left=fell?0:aWall(g)*segs;let h='';
 for(let k=0;k<segs;k++){const f=clamp(left-k,0,1);h+=`<i class="${f>=1?'up':f>0?'part':'dn'}"${f>0&&f<1?` style="--f:${Math.round(f*100)}%"`:''}></i>`;}return h;}
/** Commander of a siege (the besieging army's general), else the besieger's ruler. -> character or null */
function aSgCmd(g){const a=g.army;let c=a&&a.gen!=null&&S.chars?S.chars[a.gen]:null;
 if(!c&&typeof chRuler==='function')try{c=chRuler(g.f);}catch(e){c=null;}return c&&c.died==null?c:null;}
function aSgCardHTML(g,o){const pl=S.player,d=PD[g.i],place=esc(d.name),own=o.def||S.prov[g.i].o,fell=o.kind==='fell',won=fell&&g.f===pl,lost=fell&&own===pl;
 const w=fell?0:aWall(g),pct=Math.round(w*100),left=aSgLeft(g),nm=f=>esc((FAC[f]&&FAC[f].s)||f),col=(FAC[g.f]&&FAC[g.f].c)||'#888';
 const cmd=aSgCmd(g),pt=cmd&&typeof aPortraitFor==='function'?aPortraitFor(cmd):'',cn=cmd?(typeof chName==='function'?chName(cmd):cmd.n):'';
 const t0=g.s&&g.s.t0!=null?g.s.t0:S.turn,turns=Math.max(1,S.turn-t0+(o.kind==='start'?1:0));
 const eye=fell?lng('Kuşatma sona erdi','The siege is over'):o.kind==='start'?lng('Kuşatma başladı','A siege begins'):lng('Kuşatma','Siege');
 const status=fell?(won?lng(`${place} düştü; artık senin işgalinde. Barışta kalıcı olarak isteyebilirsin.`,`${place} has fallen and is now under your occupation. You can demand it for good at the peace table.`)
   :lost?lng(`${place} düştü; ${nm(g.f)} işgalinde. Barış yapılana ya da geri alınana dek gelirinin yarısı onlara gider.`,`${place} has fallen and is occupied by ${nm(g.f)}. Until peace is made or you retake it, half of its income goes to them.`)
   :lng(`${place} düştü.`,`${place} has fallen.`))
  :left<=1?lng('Surlar çökmek üzere: gelecek tur düşebilir.','The walls are about to give way: it may fall next turn.')
  :lng(`Surlar dayanıyor. Tahminen ${left} tur daha sürer.`,`The walls still hold. About ${left} more turns.`);
 const note=[];if(g.s&&g.s.sally)note.push(lng('Savunanlar surlardan çıkış yaptı.','The defenders sallied out from the walls.'));
 const others=aSieges().filter(x=>x.i!==g.i&&(x.f===pl||S.prov[x.i].o===pl)).slice(0,4);
 return `<div class="band"></div><div class="a-bc-in">
 <div class="a-bc-eye">${esc(eye)} · ${esc(dateStr(S.turn))}</div>
 <h3>${lng(`${place} Kuşatması`,`Siege of ${place}`)}</h3>
 <div class="a-bc-sides"><div class="a-bc-side att${g.f===pl?' me':''}">${shield(g.f,true)}<div><b>${nm(g.f)}</b><small>${lng('Kuşatan','Besieger')}${g.army?' · '+fmtK(g.army.n):''}</small></div></div>
  <div class="a-bc-vs" aria-hidden="true">⚔</div>
  <div class="a-bc-side def${own===pl?' me':''}"><div><b>${nm(own)}</b><small>${lng('Garnizon','Garrison')} · ${fmtK(S.prov[g.i].t||0)}</small></div>${shield(own,true)}</div></div>
 ${aWallSVG(w,fell,col)}
 <div class="a-sc-int"><span>${lng('Sur sağlamlığı','Wall integrity')}</span><span class="a-sc-segs" role="img" aria-label="${lng(`Surların yüzde ${pct}'i ayakta`,`${pct} percent of the walls stand`)}">${aSgSegs(g,fell)}</span><b>${pct}%</b></div>
 ${pt?`<div class="a-sc-cmd">${pt}<div><small>${lng('Kuşatmayı yöneten','Leading the siege')}</small><b>${esc(cn)}</b></div><span class="a-sc-turn">${lng(`${turns}. tur`,`Turn ${turns}`)}</span></div>`:''}
 <div class="a-bc-res ${fell?(lost?'loss':'win'):'on'}">${fell&&(won||lost)?`<span class="a-bc-seal">${won?lng('Zafer','Victory'):lng('Yenilgi','Defeat')}</span>`:''}<small>${status}</small></div>
 ${note.length?`<div class="a-bc-note">${note.map(x=>`<div>${esc(x)}</div>`).join('')}</div>`:''}
 ${others.length?`<div class="a-sc-oth"><span>${lng('Diğer kuşatmalar','Other sieges')}</span>${others.map(x=>`<button class="btn a-sc-ob" data-act="scard" data-i="${x.i}">${esc(PD[x.i].name)} <b>${Math.round(aWall(x)*100)}%</b></button>`).join('')}</div>`:''}
 <div class="a-bc-tm"><i></i></div><button class="a-bc-x" data-act="bcard-x" aria-label="${lng('Kartı kapat','Close the card')}">×</button></div>`;}
/** Show the siege card for province i. o={kind:'start'|'tick'|'fell'|'view', snap?, def?, over?} */
function aSgCardShow(i,o={}){const el=$('#card');if(!el||!S||!PD[i])return false;
 let g=aSieges().find(x=>x.i===i)||o.snap;if(!g)return false;
 let html;try{html=aSgCardHTML(g,o);}catch(e){console.error('siege card',e);return false;}
 clearTimeout(aCardTm);cancelAnimationFrame(aCardRoll);
 el.className='a-bc a-sc settled'+(o.over||!$('#modal').hidden?' over':'');el.innerHTML=html;el.hidden=false;el.setAttribute('role','dialog');el.setAttribute('aria-label',lng('Kuşatma kartı','Siege card'));
 if(vw<760){const p=$('#panel');if(p&&!p.hidden&&!o.over){const room=p.getBoundingClientRect().top-el.getBoundingClientRect().top-8;if(el.offsetHeight>room)el.classList.add('mini');}}
 aCardHold=A_SG.hold;aCardEnd=performance.now()+aCardHold;aCardTick();
 aSgCardInfo={i,kind:o.kind||'view',wall:o.kind==='fell'?0:aWall(g),segs:Math.min(A_SG.segMax,Math.ceil(g.need)),shown:true};KE.sgCard=aSgCardInfo;return true;}
const aSgPl=g=>!!S.player&&(g.f===S.player||S.prov[g.i].o===S.player);
const aSgIdx=s=>{if(!s)return -1;if(s.i!=null&&PD[s.i])return +s.i;for(const k in (S.sieges||{}))if(S.sieges[k]===s)return +k;return -1;};
hook('turnStart',()=>{aSgQ.length=0;});
hook('siegeStart',s=>{const i=aSgIdx(s);if(i<0)return;aSgHot();const g=aSieges().find(x=>x.i===i);if(!g||!aSgPl(g))return;
 if(!busy&&!(typeof aRp!=='undefined'&&aRp.on))aSgCardShow(i,{kind:'start'});else aSgQ.push({i,kind:'start'});});
hook('siegeTick',s=>{const i=aSgIdx(s);if(i<0)return;const g=aSieges().find(x=>x.i===i);if(g&&aSgPl(g))aSgQ.push({i,kind:'tick',w:aWall(g)});});
hook('siegeFell',(i,f)=>{polDirty=true;aSgHot();if(!S||!PD[i])return;const pl=S.player,own=S.prov[i].o;if(f!==pl&&own!==pl)return;
 const g=aSieges().find(x=>x.i===i),snap=g?Object.assign({},g,{prog:g.need}):{i,s:null,f,prog:1,need:1,army:null};
 const it={i,kind:'fell',snap,def:own};if(!busy)aSgCardShow(i,it);else aSgQ.push(it);});
hook('afterRound',()=>{if(S&&S.sieges&&Object.keys(S.sieges).length)aSgHot();},60);
hook('enterGame',()=>{aSgQ.length=0;aSgHot();});
/* end of turn: the most important siege event of the turn gets the card (a fall, then a new siege, then the closest to falling) */
PRESENTERS.push({id:'siegecard',order:18,run(next){
 if(S&&S.player&&aSgQ.length){const rank=x=>(x.kind==='fell'?3:x.kind==='start'?2:1)*10+(x.kind==='tick'?1-(x.w||0):0)+(x.def===S.player?.5:0);
  const best=aSgQ.slice().sort((a,b)=>rank(b)-rank(a))[0];aSgQ.length=0;try{aSgCardShow(best.i,best);}catch(e){console.error('siege card',e);}}
 next();}});
ACTS.scard=t=>{aSgCardShow(+t.dataset.i,{kind:'view',over:!$('#modal').hidden});};
KE.sg={list:()=>aSieges().map(g=>({i:g.i,f:g.f,prog:g.prog,need:g.need,wall:aWall(g)})),lay:()=>aSgLay.map(it=>({i:it.i,x:Math.round(it.cx),y:Math.round(it.cy),r:Math.round(it.r),bar:it.bar&&{x:Math.round(it.bar.x),y:Math.round(it.bar.y),w:it.bar.w,segs:it.bar.segs}})),
 hot:ms=>{if(ms===0){aSgHotT=0;return;}aSgHot(ms);},get isHot(){return performance.now()<aSgHotT;},card:(i,kind)=>aSgCardShow(i,{kind:kind||'view'}),ctl:i=>aCtl(i),g3:()=>({items:G3.sgItems.length,dirty:G3.sgDirty,sig:aSgSig,puffs:G3.sgDebug?G3.sgDebug():null}),
 repaint:()=>{polDirty=true;hlKey='';req();},
 /** Political-layer pixels of province i painted in the occupier's (ctl) and in the owner's colour (for tests). */
 hatch:i=>{if(polDirty)renderPol();const p=S.prov[i],cc=p.ctl&&FCOL[p.ctl],oc=FCOL[p.o],d=polImg.data;let occ=0,own=0;
  const near=(o,c)=>c&&Math.abs(d[o]-c[0])+Math.abs(d[o+1]-c[1])+Math.abs(d[o+2]-c[2])<6;
  for(let q=provStart[i];q<provStart[i+1];q++){const o=provPix[q]*4;if(near(o,cc))occ++;else if(near(o,oc))own++;}return {occ,own};}};
