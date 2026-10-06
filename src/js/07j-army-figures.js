/* =====================================================================
   ARMY FIGURES (2D): small soldiers at the foot of an army's standard, dressed as their realm fought:
   janissaries for the Ottomans, turbaned archers for the Turkmen and Persian realms, Mamluk lancers,
   Crimean horse-archers in fur caps, Catholic halberdiers in kettle hats, Orthodox spearmen with round
   shields; the coat takes the realm's colour. One figure for a small army, two from 3,000, three from 15,000.
   Sprites are cached per culture, colour and scale.
   ===================================================================== */
const FIG={m:new Map()};
const FIG_CUL={OSM:'jan',CLM:'jan',KAR:'turk',CAN:'turk',DUL:'turk',AKK:'turk',KKY:'turk',SAF:'qiz',MAM:'mam',HAF:'mam',KRM:'tat',
 BYZ:'orth',SRB:'orth',WAL:'orth',MOL:'orth',TRB:'orth',GEO:'orth'};
function figCul(f){return FIG_CUL[f]||(FAC[f]&&FAC[f].rel==='İslam'?'turk':FAC[f]&&FAC[f].rel==='Ortodoks'?'orth':'kn');}
/** Paint one soldier, feet at the origin, about 16 units tall, facing right. */
function figPaint(g,cul,col){const INK='#2a1a0c';g.lineJoin='round';g.lineCap='round';g.lineWidth=.7;g.strokeStyle=INK;
 const skin='#e2b98f',dark='#4a3220';
 const body=(coat,long)=>{g.fillStyle=coat;g.beginPath();g.moveTo(-2.6,-10.6);g.lineTo(2.6,-10.6);g.lineTo(long?3.6:3,long?-1.2:-4.2);g.lineTo(long?-3.6:-3,long?-1.2:-4.2);g.closePath();g.fill();g.stroke();
  g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.moveTo(.4,-10.6);g.lineTo(2.6,-10.6);g.lineTo(long?3.6:3,long?-1.2:-4.2);g.lineTo(.6,long?-1.2:-4.2);g.closePath();g.fill();};
 const legs=c=>{g.strokeStyle=c;g.lineWidth=1.5;g.beginPath();g.moveTo(-1.2,-4.4);g.lineTo(-1.6,-.3);g.moveTo(1.2,-4.4);g.lineTo(1.8,-.3);g.stroke();
  g.strokeStyle=INK;g.lineWidth=.7;g.fillStyle=dark;g.beginPath();g.ellipse(-1.5,-.3,1.2,.55,0,0,7);g.ellipse(2,-.3,1.2,.55,0,0,7);g.fill();};
 const head=()=>{g.fillStyle=skin;g.beginPath();g.arc(0,-12.4,1.9,0,7);g.fill();g.stroke();};
 const sash=c=>{g.fillStyle=c;g.fillRect(-2.9,-7.4,5.8,1.1);};
 const arm=(x1,y1)=>{g.strokeStyle=INK;g.lineWidth=1.6;g.beginPath();g.moveTo(1.6,-9.6);g.lineTo(x1,y1);g.stroke();g.lineWidth=.7;};
 if(cul==='jan'){legs('#e8dcc0');body(col,true);sash('#e2b857');head();
  g.fillStyle='#f6f1e4';g.beginPath();g.moveTo(-1.9,-13.6);g.lineTo(-1.4,-18.2);g.quadraticCurveTo(0,-19,1.4,-18);g.lineTo(1.9,-13.6);g.closePath();g.fill();g.stroke();   // börk
  g.beginPath();g.moveTo(-1.4,-18);g.quadraticCurveTo(-4.4,-16.6,-4.2,-12.6);g.lineTo(-3,-13.4);g.quadraticCurveTo(-2.8,-15.6,-1.6,-16.4);g.fill();g.stroke();               // its flap
  g.fillStyle='#e2b857';g.fillRect(-.5,-17.6,1,1.6);
  arm(3.6,-6.4);g.strokeStyle='#5a3a1e';g.lineWidth=1.1;g.beginPath();g.moveTo(1.6,-1.6);g.lineTo(5.2,-15.4);g.stroke();g.strokeStyle=INK;g.lineWidth=.6;g.beginPath();g.moveTo(5,-14.8);g.lineTo(5.8,-17.6);g.stroke();return;}   // musket
 if(cul==='turk'||cul==='qiz'||cul==='tat'){legs('#5a4030');body(col,cul!=='tat');sash(cul==='tat'?'#6b4a2a':'#e2b857');head();
  if(cul==='tat'){g.fillStyle='#6b4a2a';g.beginPath();g.ellipse(0,-14.2,2.6,1.2,0,0,7);g.fill();g.stroke();g.fillStyle='#8c3a26';g.beginPath();g.moveTo(-1.6,-14.6);g.quadraticCurveTo(0,-18.4,1.8,-14.6);g.closePath();g.fill();g.stroke();}
  else{g.fillStyle='#f6f1e4';g.beginPath();g.ellipse(0,-14.4,2.5,1.6,0,0,7);g.fill();g.stroke();
   if(cul==='qiz'){g.fillStyle='#b8261a';g.beginPath();g.moveTo(-.9,-15.6);g.lineTo(0,-19.2);g.lineTo(.9,-15.6);g.closePath();g.fill();g.stroke();}}   // the Qizilbash red baton
  arm(4.4,-9.4);g.strokeStyle='#6b4a2a';g.lineWidth=1;g.beginPath();g.arc(5,-9.4,4.6,-1.25,1.25);g.stroke();g.strokeStyle='rgba(80,60,40,.8)';g.lineWidth=.4;g.beginPath();g.moveTo(6.5,-13.8);g.lineTo(6.5,-5);g.stroke();return;}   // bow
 if(cul==='mam'){legs('#5a4030');body(col,true);g.fillStyle='#a9a9a2';g.fillRect(-2.6,-10.6,5.2,2.2);sash('#e2b857');head();
  g.fillStyle='#f6f1e4';g.beginPath();g.ellipse(0,-14.3,2.6,1.7,0,0,7);g.fill();g.stroke();g.fillStyle='#b0aea6';g.beginPath();g.moveTo(-1,-15.6);g.lineTo(0,-18);g.lineTo(1,-15.6);g.closePath();g.fill();g.stroke();
  arm(3.8,-8.2);g.strokeStyle='#5a3a1e';g.lineWidth=.9;g.beginPath();g.moveTo(3.8,0);g.lineTo(3.8,-20);g.stroke();g.fillStyle='#d8d6cc';g.beginPath();g.moveTo(3.1,-20);g.lineTo(3.8,-22.4);g.lineTo(4.5,-20);g.closePath();g.fill();g.stroke();
  g.fillStyle=col;g.beginPath();g.moveTo(3.8,-19.6);g.lineTo(7.4,-18.8);g.lineTo(3.8,-17.6);g.closePath();g.fill();g.stroke();return;}   // lance and pennon
 if(cul==='orth'){legs('#6b5040');body(col,false);head();
  g.fillStyle='#b9b7ae';g.beginPath();g.moveTo(-2.1,-13.2);g.quadraticCurveTo(-1.6,-16.4,0,-17.6);g.quadraticCurveTo(1.6,-16.4,2.1,-13.2);g.closePath();g.fill();g.stroke();
  arm(3.6,-7.6);g.strokeStyle='#5a3a1e';g.lineWidth=.9;g.beginPath();g.moveTo(3.6,0);g.lineTo(3.6,-20);g.stroke();g.fillStyle='#d8d6cc';g.beginPath();g.moveTo(3,-20);g.lineTo(3.6,-22.4);g.lineTo(4.2,-20);g.closePath();g.fill();g.stroke();
  g.fillStyle='#8c3a26';g.beginPath();g.arc(-2.6,-7.6,3.1,0,7);g.fill();g.stroke();g.fillStyle='#e2b857';g.beginPath();g.arc(-2.6,-7.6,.8,0,7);g.fill();return;}   // round shield
 // Catholic halberdier: kettle hat, breastplate, tabard in the realm's colour
 legs('#5a4a3a');body(col,false);g.fillStyle='#c4c6c8';g.beginPath();g.moveTo(-2.4,-10.6);g.lineTo(2.4,-10.6);g.lineTo(2,-7.6);g.lineTo(-2,-7.6);g.closePath();g.fill();g.stroke();head();
 g.fillStyle='#b9bbbd';g.beginPath();g.ellipse(0,-14.2,3.4,.9,0,0,7);g.fill();g.stroke();g.beginPath();g.arc(0,-14.3,1.9,Math.PI,0);g.fill();g.stroke();
 arm(3.6,-8);g.strokeStyle='#5a3a1e';g.lineWidth=.9;g.beginPath();g.moveTo(3.6,0);g.lineTo(3.6,-21);g.stroke();
 g.fillStyle='#d8d6cc';g.beginPath();g.moveTo(3.6,-21.6);g.lineTo(4.2,-19.6);g.lineTo(6.6,-19);g.quadraticCurveTo(6.8,-17.2,4.2,-16.8);g.lineTo(3.6,-16.6);g.closePath();g.fill();g.stroke();}   // halberd
function figSprite(cul,col,z){const k=cul+col+z+'|'+dpr;let sp=FIG.m.get(k);if(sp)return sp;const sc=z*dpr*1.1,c=mk(Math.ceil(20*sc),Math.ceil(26*sc)),g=c.getContext('2d',CPU2D);
 g.setTransform(sc,0,0,sc,9*sc,24*sc);figPaint(g,cul,col);sp={c,w:20*z,h:26*z};FIG.m.set(k,sp);if(FIG.m.size>200)FIG.m.delete(FIG.m.keys().next().value);return sp;}
/** Figures at the foot of token t (2D only), drawn before the standard. */
function figDraw(c,t){if(G3.on||t.n==null)return;const cul=figCul(t.f),col=(FAC[t.f]&&FAC[t.f].c)||'#888',z=Math.round(t.z*1.3*8)/8,sp=figSprite(cul,col,z);
 const n=t.n>=15000?3:t.n>=3000?2:1,spots=[[-26,2],[25,2],[-35,-2]];
 for(let k=0;k<n;k++){const [dx,dy]=spots[k],x=t.fx+dx*t.z,y=t.fy+dy*t.z;c.save();if(dx>0){c.translate(x,0);c.scale(-1,1);c.translate(-x,0);}
  c.fillStyle='rgba(25,14,4,.3)';c.beginPath();c.ellipse(x,y,5.6*t.z,1.8*t.z,0,0,7);c.fill();
  c.drawImage(sp.c,x-9*z,y-24*z,sp.w,sp.h);c.restore();}}
