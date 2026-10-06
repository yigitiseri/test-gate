/* =====================================================================
   CITY GLYPHS (2D): a town is drawn as what it is: a hamlet of a few roofs, a town round its mosque or church,
   a walled city, a great city with a citadel; walls follow the fortress level, a port gets its quay and boat,
   a market its striped awning, a capital its banner. Faith follows the owner (mosque, Orthodox dome, Catholic
   spire). Each look is rendered once per size step into a sprite (cached), so a frame only copies images.
   ===================================================================== */
const CTY={m:new Map(),port:null};
/** Side of the sea for a coastal town (-1 left, 1 right) or 0 inland; from the coast distance field. */
function ctyPort(i){if(!CTY.port){CTY.port=PD.map(d=>{let best=0,bd=26;
  for(let a=0;a<16;a++){const an=a*Math.PI/8,cx=Math.cos(an),cy=Math.sin(an);for(let r=3;r<bd;r+=2){const x=Math.round(d.lx+cx*r),y=Math.round(d.ly+cy*r);if(x<0||y<0||x>=W||y>=H)break;
   if(!land[y*W+x]){if(r<bd){bd=r;best=cx<0?-1:1;}break;}}}return best;});}return CTY.port[i];}
function ctyRel(f){const r=FAC[f]&&FAC[f].rel;return r==='İslam'?'m':r==='Katolik'?'c':'o';}
/** Draw the town of province d (screen px; foot at x,y; sz as the old glyph). */
function cityDraw(d,p,x,y,sz,cap){const tier=p.dev>=9||cap?3:p.dev>=6?2:p.dev>=3?1:0,walls=p.fort>=3?2:p.fort>=1||tier>=2?1:0,port=ctyPort(d.i);
 const o={tier,walls,port,mkt:p.mkt?1:0,cap:cap?1:0,rel:ctyRel(p.o),col:FAC[p.o].c,v:d.i%3},q=Math.max(3,Math.round(sz*2)/2),z=dpr;
 const k=[tier,walls,port,o.mkt,o.cap,o.rel,o.col,o.v,q,z].join('|');let sp=CTY.m.get(k);
 if(!sp||sp.e.gen!==SA.gen){const u=q/6,bw=21*u,bh=25*u,cw=Math.ceil(bw*2*z)+4,ch=Math.ceil(bh*z)+4;
  const e=saAdd(cw,ch,g=>{g.setTransform(z,0,0,z,bw*z+2,(bh-3.2*u)*z+2);cityPaint(g,o,u);});
  sp={e,ox:-bw-2/z,oy:-(bh-3.2*u)-2/z,w:cw/z,h:ch/z};CTY.m.set(k,sp);if(CTY.m.size>600)CTY.m.delete(CTY.m.keys().next().value);}
 saDraw(ctx,sp.e,x+sp.ox,y+sz*.45+sp.oy,sp.w,sp.h);}

/** Paint a town at the origin (its foot), in units u (a glyph is about 24u wide). */
function cityPaint(g,o,u){const INK='#33261a',lw=Math.max(.7,u*.38);g.lineJoin='round';g.lineCap='round';g.lineWidth=lw;g.strokeStyle=INK;
 const R=(x,y,w,h,f)=>{g.fillStyle=f;g.fillRect(x*u,y*u,w*u,h*u);g.strokeRect(x*u,y*u,w*u,h*u);};
 const house=(x,w,h,roof)=>{R(x,-h,w,h,'#ecdfc0');g.fillStyle='rgba(0,0,0,.12)';g.fillRect((x+w*.55)*u,-h*u,w*.45*u,h*u);
  g.fillStyle=roof;g.beginPath();g.moveTo((x-.6)*u,-h*u);g.lineTo((x+w/2)*u,(-h-w*.55)*u);g.lineTo((x+w+.6)*u,-h*u);g.closePath();g.fill();g.stroke();
  g.fillStyle=INK;g.fillRect((x+w/2-.5)*u,-1.6*u,1*u,1.6*u);};
 const roofs=['#b5532e','#a8482a','#bf6a3a'];
 const shrine=(x,big)=>{const s=big?1.25:1;
  if(o.rel==='m'){R(x-3.4*s,-5*s,6.8*s,5*s,'#efe4c8');g.fillStyle='#d8c9a4';g.beginPath();g.arc(x*u,-5*s*u,3.4*s*u,Math.PI,0);g.closePath();g.fill();g.stroke();
   g.fillStyle=INK;g.beginPath();g.moveTo(x*u,-8.4*s*u);g.lineTo(x*u,-9.6*s*u);g.stroke();
   for(const mx of big&&o.tier>=3?[x-5*s,x+5*s]:[x+4.6*s]){R(mx-.6*s,-11.5*s,1.2*s,11.5*s,'#f3ead2');g.fillStyle='#c9b48a';g.beginPath();g.moveTo((mx-.8*s)*u,-11.5*s*u);g.lineTo(mx*u,-13.6*s*u);g.lineTo((mx+.8*s)*u,-11.5*s*u);g.closePath();g.fill();g.stroke();
    g.beginPath();g.moveTo((mx-.9*s)*u,-8.6*s*u);g.lineTo((mx+.9*s)*u,-8.6*s*u);g.stroke();}}
  else if(o.rel==='o'){R(x-3.2*s,-5.5*s,6.4*s,5.5*s,'#efe4c8');g.fillStyle='#7f9a86';g.beginPath();g.arc(x*u,-5.5*s*u,2.5*s*u,Math.PI,0);g.closePath();g.fill();g.stroke();
   g.beginPath();g.moveTo(x*u,-8*s*u);g.lineTo(x*u,-10.4*s*u);g.moveTo((x-.9*s)*u,-9.4*s*u);g.lineTo((x+.9*s)*u,-9.4*s*u);g.stroke();}
  else{R(x-3.6*s,-4.6*s,5*s,4.6*s,'#efe4c8');g.fillStyle='#8c4a30';g.beginPath();g.moveTo((x-4.1*s)*u,-4.6*s*u);g.lineTo((x-1.1*s)*u,-6.8*s*u);g.lineTo((x+1.9*s)*u,-4.6*s*u);g.closePath();g.fill();g.stroke();
   R(x+1.4*s,-7.6*s,2.4*s,7.6*s,'#f1e7cd');g.fillStyle='#6f3a26';g.beginPath();g.moveTo((x+1.1*s)*u,-7.6*s*u);g.lineTo((x+2.6*s)*u,-12.4*s*u);g.lineTo((x+4.1*s)*u,-7.6*s*u);g.closePath();g.fill();g.stroke();
   g.beginPath();g.moveTo((x+2.6*s)*u,-12.4*s*u);g.lineTo((x+2.6*s)*u,-13.8*s*u);g.moveTo((x+2*s)*u,-13.2*s*u);g.lineTo((x+3.2*s)*u,-13.2*s*u);g.stroke();}};
 const tower=(x,h,pen)=>{R(x-1.6,-h,3.2,h,'#e6d9bb');g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x*u,-h*u,1.6*u,h*u);
  for(const mx of[x-1.6,x+.5])R(mx,-h-1,1.1,1,'#e6d9bb');
  if(pen){g.beginPath();g.moveTo(x*u,(-h-1)*u);g.lineTo(x*u,(-h-3.6)*u);g.stroke();g.fillStyle=o.col;g.beginPath();g.moveTo(x*u,(-h-3.6)*u);g.lineTo((x+2.2)*u,(-h-3.1)*u);g.lineTo(x*u,(-h-2.5)*u);g.closePath();g.fill();}};
 // ground shadow
 const span=[5,8,10,12][o.tier];g.fillStyle='rgba(25,18,8,.3)';g.beginPath();g.ellipse(1*u,.4*u,span*u,2*u,0,0,7);g.fill();
 // port: quay and a boat on the sea side
 if(o.port){const sd=o.port;g.save();g.scale(sd,1);g.strokeStyle='rgba(58,40,24,.8)';g.lineWidth=lw;
  g.beginPath();g.moveTo((span-1)*u,-.4*u);g.lineTo((span+4.5)*u,.6*u);g.stroke();
  g.fillStyle='#6b4a2a';g.beginPath();g.moveTo((span+3)*u,1.6*u);g.quadraticCurveTo((span+5.5)*u,3*u,(span+8)*u,1.4*u);g.lineTo((span+3)*u,1.4*u);g.closePath();g.fill();
  g.beginPath();g.moveTo((span+5.4)*u,1.5*u);g.lineTo((span+5.4)*u,-3*u);g.stroke();g.fillStyle='#f3ead2';g.beginPath();g.moveTo((span+5.6)*u,-2.8*u);g.lineTo((span+7.6)*u,.8*u);g.lineTo((span+5.6)*u,.8*u);g.closePath();g.fill();g.stroke();g.restore();}
 if(o.tier===0){house(-4.6,3.6,2.8,roofs[o.v]);house(.4,4,3.4,roofs[(o.v+1)%3]);if(o.v!==1)house(-2,3,2.4,roofs[(o.v+2)%3]);}
 else{
  // the town behind its walls: roofs, then the shrine above them
  const back=o.tier>=2;if(back){house(-7.4,3.6,4.6,roofs[1]);house(4.8,3.6,4.2,roofs[2]);}
  if(o.tier>=3){R(-9.5,-9.8,5,6,'#e6d9bb');for(let k=0;k<3;k++)R(-9.5+k*1.9,-10.8,1.2,1,'#e6d9bb');}   // citadel keep
  if(!o.noShrine)shrine(o.tier>=2?.5:1,o.tier>=3);else{house(-2.6,4.4,5.6,roofs[0]);R(-1,-12,4,12,'#e8dbbb');for(let k=0;k<2;k++)R(-1+k*2.4,-13,1.4,1,'#e8dbbb');}   // a plain town (event art)
  if(o.tier===1){house(-5.8,3.4,3,roofs[o.v]);house(3.8,3.2,2.8,roofs[(o.v+1)%3]);}}
 // walls: a crenellated front with towers, flying the owner's pennant
 if(o.walls){const hw=o.tier>=2?span-1:span-1.5,h=o.walls>=2?4:3;R(-hw,-h,hw*2,h,'#e2d4b2');g.fillStyle='rgba(0,0,0,.1)';g.fillRect(0,-h*u,hw*u,h*u);
  for(let mx=-hw+.2;mx<hw-.8;mx+=1.9)R(mx,-h-.9,1.1,.9,'#e2d4b2');
  g.fillStyle=INK;g.beginPath();g.arc(0,-1.4*u,1.1*u,Math.PI,0);g.lineTo(1.1*u,0);g.lineTo(-1.1*u,0);g.closePath();g.fill();
  tower(-hw,h+2.6,true);tower(hw,h+2.6,o.walls>=2);}
 else if(o.tier>=1){g.fillStyle=o.col;g.beginPath();g.moveTo(-1*u,-.2*u);g.lineTo(1*u,-.2*u);g.lineTo(1*u,-1.4*u);g.lineTo(-1*u,-1.4*u);g.closePath();g.fill();}   // the owner's colour at the gate
 // market: a striped awning in front
 if(o.mkt){const mx=o.tier?-span+1.2:-span-1.8;R(mx,-2,3.6,2,'#efe4c8');for(let k=0;k<4;k++){g.fillStyle=k%2?'#f3ead2':'#a63a26';g.fillRect((mx-.3+k*1.05)*u,-3*u,1.05*u,1*u);}g.strokeRect((mx-.3)*u,-3*u,4.2*u,1*u);}
 // capital: the banner over the town
 if(o.cap){const fx=o.tier>=3?-7:.5,fy=o.tier>=3?-10.8:-14.5;g.lineWidth=lw*1.2;g.beginPath();g.moveTo(fx*u,fy*u);g.lineTo(fx*u,(fy-5)*u);g.stroke();
  g.fillStyle=o.col;g.beginPath();g.moveTo(fx*u,(fy-5)*u);g.quadraticCurveTo((fx+2.5)*u,(fy-5.6)*u,(fx+4.6)*u,(fy-4.4)*u);g.lineTo((fx+4.6)*u,(fy-2.6)*u);g.quadraticCurveTo((fx+2.5)*u,(fy-3.6)*u,fx*u,(fy-3)*u);g.closePath();g.fill();g.lineWidth=lw*.8;g.stroke();
  g.fillStyle='#e7c46a';g.beginPath();g.arc(fx*u,(fy-5.3)*u,.6*u,0,7);g.fill();}}
