/* =====================================================================
   TERRAIN ART: the symbols drawn over the watercolour wash: mountains, hills, broadleaf and pine woods,
   palms along the Nile, desert dunes and marsh reeds. Placed once from the height/moisture fields
   (tSymPlace) and painted with symPaint(g, sym) in map units, anchored at the symbol's foot, so the same
   drawing serves the baked low-zoom map and the crisp close-up sprites (07h).
   ===================================================================== */
let MSYM=[];   // [{x,y,t,v,sz,snow}] sorted by y; t: mtn|hill|tree|pine|palm|dune|marsh|wave; snow: 0..1 how snowy its winter is
let SNOWM=null,VEGM=null;   // per pixel 0..255: winter snow cover, greenery (seasonal tints)
const T_INK='rgba(58,40,24,.88)';
/** Place the symbols. E height, M moisture (renderBase), LD distance to sea, RD distance to a river (x3 chamfer units). */
/** How snowy a place is in winter: north of the Danube, and the high mountains further south. */
function tSnow(x,y,e){const lat=LAT1-y/K;return clamp((lat-43.6)/2.4+(e-.26)*6+(vnoise(x/40+7,y/40+3)-.5)*1.1,0,1);}
function tSeasonMasks(E,M){SNOWM=new Uint8Array(W*H);VEGM=new Uint8Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!land[i])continue;SNOWM[i]=tSnow(x,y,E[i])*255;VEGM[i]=clamp(M[i]*190,0,255);}}
function tSymPlace(E,M,LD,RD){tSeasonMasks(E,M);
 const out=[],add=(x,y,t,v,sz)=>out.push({x,y,t,v,sz,snow:tSnow(x,y,E[Math.round(y)*W+Math.round(x)])});
 const at=(x,y)=>{const xi=Math.round(x),yi=Math.round(y);return xi<14||yi<14||xi>=W-14||yi>=H-14?-1:yi*W+xi;};
 // mountains on the ridges, a second smaller peak on some
 for(let y=6;y<H;y+=10)for(let x=5;x<W;x+=9){const jx=x+(hash(x,y)-.5)*8,jy=y+(hash(y,x)-.5)*8,i=at(jx,jy);if(i<0||!land[i])continue;
  const e=E[i];if(e<.42||hash(x*3,y*7)>.74)continue;
  add(jx,jy,'mtn',(hash(x+5,y)*3)|0,Math.min(12,4.2+(e-.42)*16+hash(x,y+1)*2.2));}
 // hills on the uplands
 for(let y=9;y<H;y+=13)for(let x=7;x<W;x+=14){const jx=x+(hash(x+2,y)-.5)*9,jy=y+(hash(y+2,x)-.5)*9,i=at(jx,jy);if(i<0||!land[i]||LD[i]<12)continue;
  const e=E[i];if(e<.25||e>=.42||hash(x*5,y*3)>.5)continue;add(jx,jy,'hill',(hash(x,y+3)*3)|0,3.6+hash(x+1,y)*1.6);}
 // woods: broadleaf in the lowlands, pine in the north and on the slopes
 for(let y=3;y<H;y+=6)for(let x=3;x<W;x+=6){const jx=x+(hash(x,y*3)-.5)*5,jy=y+(hash(y,x*7)-.5)*5,i=at(jx,jy);if(i<0||!land[i])continue;
  const m=M[i],e=E[i];if(m<.72||e>.4||LD[i]<9)continue;if(hash(x+17,y*3+1)>(m-.66)*1.5)continue;
  const lat=LAT1-jy/K,pine=e>.3||lat>46.2||(lat>44.5&&hash(x,y+5)<.35);
  add(jx,jy,pine?'pine':'tree',(hash(jx,jy+9)*4)|0,2.5+hash(x+3,y)*.9);}
 // palms along the Nile and the oases
 for(let y=4;y<H;y+=7)for(let x=4;x<W;x+=7){const jx=x+(hash(x+9,y)-.5)*5,jy=y+(hash(y+9,x)-.5)*5,i=at(jx,jy);if(i<0||!land[i])continue;
  const lat=LAT1-jy/K;if(lat>34.2||RD[i]/3>5||hash(x*7,y+2)>.55)continue;add(jx,jy,'palm',(hash(x,y)*2)|0,2.6+hash(y,x)*.7);}
 // dunes in the deserts
 for(let y=8;y<H;y+=10)for(let x=6;x<W;x+=13){const jx=x+(hash(x+4,y)-.5)*10,jy=y+(hash(y+4,x)-.5)*6,i=at(jx,jy);if(i<0||!land[i]||LD[i]<15)continue;
  const lat=LAT1-jy/K;if(M[i]>.1||E[i]>.32||lat>38||RD[i]/3<8||hash(x*3,y*5)>.62)continue;add(jx,jy,'dune',(hash(x,y+7)*3)|0,4.6+hash(x+8,y)*3);}
 // reeds in the marshes and deltas
 for(let y=5;y<H;y+=8)for(let x=5;x<W;x+=9){const jx=x+(hash(x+6,y)-.5)*6,jy=y+(hash(y+6,x)-.5)*6,i=at(jx,jy);if(i<0||!land[i])continue;
  if(M[i]<1||E[i]>.16||hash(x*9,y+4)>.5)continue;add(jx,jy,'marsh',(hash(x,y+1)*2)|0,2.6+hash(x,y+2)*.8);}
 // ink waves on the open sea, in loose groups
 for(let y=10;y<H;y+=16)for(let x=10;x<W;x+=22){const jx=x+(hash(x+11,y)-.5)*14,jy=y+(hash(y+11,x)-.5)*10,i=at(jx,jy);if(i<0||land[i])continue;
  const sd=SEAD[i]/3;if(sd<16||hash(x*13,y*3)>.4)continue;add(jx,jy,'wave',(hash(x,y+13)*3)|0,3+hash(y,x+2)*1.6);}
 out.sort((a,b)=>a.y-b.y);return out;}

/** The season's tint over the wash (cached per season): spring green, summer dry, autumn russet, winter snow.
 cpu: the CPU image (to paint into CPU layers), else its GPU copy (for the screen). */
const TSEA={k:-1,c:null,g:null};   // c: the CPU image, g: its GPU copy for drawing
function seasonOf(){return S&&S.turn!=null?((S.turn%4)+4)%4:0;}
function seasonCanvas(k=seasonOf(),cpu=false){if(TSEA.k===k&&TSEA.g)return cpu?TSEA.c:TSEA.g;TSEA.k=k;const c=TSEA.c||mk(W,H),g=c.getContext('2d',CPU2D),img=g.createImageData(W,H),d=img.data;
 for(let i=0;i<W*H;i++){const o=i*4;
  if(!land[i]){if(k===3){d[o]=120;d[o+1]=136;d[o+2]=140;d[o+3]=30;}continue;}
  const v=VEGM[i]/255,sn=SNOWM[i]/255;
  if(k===0){d[o]=118;d[o+1]=160;d[o+2]=70;d[o+3]=clamp(v-.35,0,.6)*70;}
  else if(k===1){d[o]=206;d[o+1]=168;d[o+2]=96;d[o+3]=clamp(.75-v,0,.75)*60;}
  else if(k===2){const h=(i*2654435761>>>0)%997/997;d[o]=196+h*20;d[o+1]=110+h*40;d[o+2]=40;d[o+3]=clamp(v-.3,0,.7)*150;}   // russet and gold, speckled
  else{d[o]=246;d[o+1]=247;d[o+2]=250;d[o+3]=sn>0?clamp(sn*1.15,0,1)*205:0;}}
 g.putImageData(img,0,0);TSEA.c=c;TSEA.g=gpuCopy(c);return cpu?c:TSEA.g;}
/** Seasonal look of one symbol: 'w' snowy winter, 'a' autumn leaves, '' as drawn. */
function symSea(o,k){if(o.t==='wave')return '';if(k===3&&o.snow>.3&&o.t!=='palm'&&o.t!=='dune')return 'w';if(k===2&&(o.t==='tree'||o.t==='marsh'))return 'a';if(k===3&&o.t==='mtn')return 'm';return '';}

/** Box of a symbol around its foot, map units: [x0,y0,x1,y1]. */
function symBox(t,sz){const w=t==='dune'||t==='wave'?sz*1.6:t==='mtn'?sz*1.55:t==='hill'?sz*1.1:sz*1.2;
 const up=t==='mtn'?sz*1.45:t==='hill'?sz*.75:t==='dune'||t==='wave'?sz*.6:t==='marsh'?sz*1.2:sz*2.6;return [-w-1,-up-1,w+1,sz*.35+1];}

function symPaint(g,o,se=''){const t=o.t,v=o.v,sz=o.sz,win=se==='w',aut=se==='a';g.lineJoin='round';g.lineCap='round';
 if(t==='mtn'){const pk=(w,h,dx,back)=>{
   g.fillStyle='rgba(60,40,20,.16)';g.beginPath();g.ellipse(dx+w*.25,0,w*1.05,w*.16,0,0,7);g.fill();
   const px=dx-w*.06,ry=dx+w*.14;
   g.fillStyle=back?'#e2d6b8':'#efe5cb';g.beginPath();g.moveTo(dx-w,0);g.lineTo(px-w*.18,-h*.55);g.lineTo(px,-h);g.lineTo(px+w*.08,-h*.6);g.lineTo(ry,0);g.closePath();g.fill();
   g.fillStyle=back?'#9a8466':'#a68e6c';g.beginPath();g.moveTo(px,-h);g.lineTo(dx+w*.45,-h*.45);g.lineTo(dx+w,0);g.lineTo(ry,0);g.lineTo(px+w*.08,-h*.6);g.closePath();g.fill();
   g.strokeStyle='rgba(66,46,28,.5)';g.lineWidth=Math.max(.3,w*.045);g.beginPath();
   for(let k=1;k<6;k++){const f=k/6,ax=px+(ry-px)*f+w*.03,ay=-h+h*f;g.moveTo(ax,ay);g.lineTo(ax+w*(.28+.3*(1-f)),ay+h*.12);}g.stroke();
   if(win){g.fillStyle='rgba(250,250,252,.75)';g.beginPath();g.moveTo(dx-w*.8,-h*.18);g.lineTo(px,-h);g.lineTo(ry,-h*.1);g.closePath();g.fill();}
   if(h>(se?4.5:7.5)){g.fillStyle='#fbf8f0';g.beginPath();g.moveTo(px,-h);g.lineTo(px-w*.26,-h*.68);g.lineTo(px-w*.1,-h*.73);g.lineTo(px+w*.02,-h*.62);g.lineTo(px+w*.14,-h*.74);g.lineTo(px+w*.3,-h*.7);g.closePath();g.fill();}
   g.strokeStyle=T_INK;g.lineWidth=Math.max(.45,w*.075);g.beginPath();g.moveTo(dx-w,0);g.lineTo(px-w*.18,-h*.55);g.lineTo(px,-h);g.lineTo(dx+w*.45,-h*.45);g.lineTo(dx+w,0);g.stroke();
   g.lineWidth=Math.max(.3,w*.05);g.beginPath();g.moveTo(px,-h);g.lineTo(px+w*.08,-h*.6);g.lineTo(ry,0);g.stroke();};
  const h=sz*(1.15+v*.1);if(v===1)pk(sz*.62,h*.66,-sz*.62,true);if(v===2)pk(sz*.58,h*.6,sz*.66,true);pk(sz,h,0,false);return;}
 if(t==='hill'){const w=sz,h=sz*.62+v*.08*sz;
  g.fillStyle=win?'#f4f3ef':'#e6d8b3';g.beginPath();g.moveTo(-w,0);g.bezierCurveTo(-w*.6,-h*1.25,w*.5,-h*1.3,w,0);g.closePath();g.fill();
  g.fillStyle=win?'rgba(150,160,176,.45)':'rgba(150,124,88,.55)';g.beginPath();g.moveTo(w*.05,-h*.95);g.bezierCurveTo(w*.5,-h*.95,w*.85,-h*.4,w,0);g.lineTo(w*.2,0);g.closePath();g.fill();
  g.strokeStyle=T_INK;g.lineWidth=Math.max(.4,sz*.1);g.beginPath();g.moveTo(-w,0);g.bezierCurveTo(-w*.6,-h*1.25,w*.5,-h*1.3,w,0);g.stroke();
  g.strokeStyle='rgba(70,50,30,.5)';g.lineWidth=Math.max(.3,sz*.06);g.beginPath();for(let k=0;k<3;k++){const x=w*(.25+k*.22);g.moveTo(x,-h*(.7-k*.2));g.lineTo(x+w*.12,-h*(.45-k*.2));}g.stroke();return;}
 if(t==='tree'){const r=sz,G=(aut?[[184,110,44],[196,146,58],[160,88,42],[172,128,52]]:[[92,118,62],[78,110,58],[104,126,64],[86,104,54]])[v],c=`rgb(${G[0]},${G[1]},${G[2]})`;
  g.fillStyle='rgba(30,40,20,.22)';g.beginPath();g.ellipse(r*.35,0,r*.95,r*.3,0,0,7);g.fill();
  if(win){g.strokeStyle='rgba(70,50,32,.95)';g.lineWidth=r*.2;g.beginPath();g.moveTo(0,0);g.lineTo(0,-r*1.5);g.stroke();   // bare in the snow
   g.lineWidth=r*.11;g.beginPath();for(const [a,b,c2,d2] of [[0,-.7,-.7,-1.5],[0,-.95,.75,-1.6],[0,-1.3,-.35,-2.05],[0,-1.25,.3,-2.1],[-.45,-1.18,-.85,-1.25],[.5,-1.3,.9,-1.35]]){g.moveTo(a*r,b*r);g.lineTo(c2*r,d2*r);}g.stroke();
   g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.ellipse(0,-r*.05,r*.7,r*.18,0,0,7);g.fill();return;}
  g.strokeStyle='rgba(70,48,28,.9)';g.lineWidth=r*.22;g.beginPath();g.moveTo(0,0);g.lineTo(0,-r*.75);g.stroke();
  const C=[[-r*.46,-r*1.08,r*.6],[r*.46,-r*1.02,r*.58],[0,-r*1.6,r*.7]];
  g.fillStyle=c;C.forEach(([x,y,rr])=>{g.beginPath();g.arc(x,y,rr,0,7);g.fill();});
  g.strokeStyle=T_INK;g.lineWidth=Math.max(.25,r*.11);C.forEach(([x,y,rr])=>{g.beginPath();g.arc(x,y,rr,Math.PI*.15,Math.PI*1.35);g.stroke();});
  g.fillStyle='rgba(212,226,160,.55)';g.beginPath();g.arc(-r*.22,-r*1.8,r*.24,0,7);g.fill();return;}
 if(t==='pine'){const r=sz,c=['#456447','#3d5c40','#4b6a48','#41603f'][v];
  g.fillStyle='rgba(30,40,20,.22)';g.beginPath();g.ellipse(r*.3,0,r*.8,r*.26,0,0,7);g.fill();
  g.strokeStyle='rgba(70,48,28,.9)';g.lineWidth=r*.2;g.beginPath();g.moveTo(0,0);g.lineTo(0,-r*.5);g.stroke();
  for(let k=0;k<3;k++){const by=-r*(.35+k*.6),hw=r*(.82-k*.2),ty=by-r*(1.05-k*.12);
   g.fillStyle=c;g.beginPath();g.moveTo(-hw,by);g.lineTo(0,ty);g.lineTo(hw,by);g.closePath();g.fill();
   g.fillStyle='rgba(20,34,20,.3)';g.beginPath();g.moveTo(0,ty);g.lineTo(hw,by);g.lineTo(hw*.15,by);g.closePath();g.fill();
   if(win){g.fillStyle='rgba(250,251,253,.95)';g.beginPath();g.moveTo(-hw*.8,by-r*.08);g.lineTo(0,ty);g.lineTo(hw*.55,by-r*.32);g.lineTo(0,by-r*.42);g.closePath();g.fill();}
   g.strokeStyle=T_INK;g.lineWidth=Math.max(.25,r*.1);g.beginPath();g.moveTo(-hw,by);g.lineTo(0,ty);g.lineTo(hw,by);g.stroke();}return;}
 if(t==='palm'){const r=sz,lean=v?-1:1,tx=lean*r*.45,ty=-r*2.3;
  g.fillStyle='rgba(60,44,20,.2)';g.beginPath();g.ellipse(r*.3,0,r*.8,r*.25,0,0,7);g.fill();
  g.strokeStyle='#7a5a34';g.lineWidth=r*.22;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(lean*r*.05,-r*1.3,tx,ty);g.stroke();
  g.strokeStyle='rgba(58,40,24,.6)';g.lineWidth=r*.07;g.beginPath();for(let k=1;k<5;k++){const f=k/5,x=lean*r*.45*f*f,y=ty*f;g.moveTo(x-r*.1,y);g.lineTo(x+r*.1,y-r*.05);}g.stroke();
  g.strokeStyle='#5b7a3a';g.lineWidth=r*.26;g.beginPath();
  for(const [ax,ay] of [[-1.25,.35],[-.7,-.45],[.15,-.7],[.8,-.4],[1.3,.4]]){g.moveTo(tx,ty);g.quadraticCurveTo(tx+ax*r*.55,ty+ay*r*.9-r*.35,tx+ax*r,ty+ay*r+r*.25);}g.stroke();
  g.fillStyle='#6b4a26';g.beginPath();g.arc(tx,ty+r*.15,r*.18,0,7);g.fill();return;}
 if(t==='dune'){const w=sz,h=sz*(.38+v*.05);
  g.fillStyle='#e8cf98';g.beginPath();g.moveTo(-w,0);g.quadraticCurveTo(-w*.3,-h*1.5,w*.25,-h);g.quadraticCurveTo(w*.7,-h*.6,w,0);g.closePath();g.fill();
  g.fillStyle='rgba(176,132,70,.45)';g.beginPath();g.moveTo(w*.25,-h);g.quadraticCurveTo(w*.7,-h*.6,w,0);g.lineTo(-w*.1,0);g.quadraticCurveTo(w*.05,-h*.5,w*.25,-h);g.fill();
  g.strokeStyle='rgba(128,90,44,.8)';g.lineWidth=Math.max(.3,sz*.07);g.beginPath();g.moveTo(-w,0);g.quadraticCurveTo(-w*.3,-h*1.5,w*.25,-h);g.quadraticCurveTo(w*.7,-h*.6,w,0);g.stroke();
  g.lineWidth=Math.max(.25,sz*.045);g.beginPath();g.moveTo(w*.25,-h);g.quadraticCurveTo(w*.05,-h*.5,-w*.1,0);g.stroke();return;}
 if(t==='wave'){const r=sz;g.strokeStyle='rgba(40,70,72,.5)';g.lineWidth=Math.max(.3,r*.13);g.beginPath();
  for(let k=0;k<2+v%2;k++){const x=(k-1)*r*1.05+(k%2?r*.3:0),y=-(k%2)*r*.45;g.moveTo(x-r*.6,y);g.quadraticCurveTo(x-r*.2,y-r*.5,x+r*.15,y-r*.2);g.quadraticCurveTo(x,y-r*.05,x-r*.12,y-r*.02);}g.stroke();return;}
 if(t==='marsh'){const r=sz;
  g.strokeStyle='rgba(60,104,128,.7)';g.lineWidth=Math.max(.25,r*.1);g.beginPath();g.moveTo(-r*1.1,r*.1);g.lineTo(-r*.3,r*.1);g.moveTo(r*.1,r*.1);g.lineTo(r*1.1,r*.1);g.moveTo(-r*.6,r*.32);g.lineTo(r*.6,r*.32);g.stroke();
  g.strokeStyle=aut||win?'rgba(140,104,56,.95)':'rgba(66,92,48,.95)';g.lineWidth=Math.max(.25,r*.11);g.beginPath();
  for(const [dx,hh,lean] of [[-.5,.75,-.25],[-.2,1.1,-.08],[0,1.25,0],[.22,1,.12],[.5,.7,.3]]){g.moveTo(dx*r,0);g.quadraticCurveTo(dx*r,-hh*r*.6,(dx+lean)*r,-hh*r);}g.stroke();
  if(v){g.fillStyle='#6b4a26';g.beginPath();g.ellipse(-r*.2+r*.02,-r*1.05,r*.09,r*.22,0,0,7);g.fill();}return;}
}
