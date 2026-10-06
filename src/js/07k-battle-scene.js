/* =====================================================================
   BATTLE SCENE: a small miniature at the head of the battle card (07e). Field battles: the two hosts face
   each other under their banners, dust where they meet. Assaults and sieges: the walls on the right with the
   defender's flag, the attackers with a ladder (and a great gun from 1453). The losing side has its fallen.
   Soldiers are the army figures of 07j; drawn once per report into an image.
   ===================================================================== */
const SCN={cache:new WeakMap(),W:388,H:84};
function scnScene(rep,m){if(!rep)return '';let url=SCN.cache.get(rep);
 if(!url){try{url=scnPaint(rep,m).toDataURL('image/png');}catch(e){console.error('battle scene',e);url='';}SCN.cache.set(rep,url);}
 return url?`<img class="a-bc-scene" src="${url}" alt="">`:'';}
function scnPaint(rep,m){const sc=2,Wd=SCN.W,Hd=SCN.H,c=mk(Wd*sc,Hd*sc),g=c.getContext('2d',CPU2D);g.scale(sc,sc);
 const att=rep.att,def=rep.def,col=f=>(FAC[f]&&FAC[f].c)||'#888',walls=m.kind==='assault'||m.kind==='siege',attWon=!!rep.win,seed=(rep.turn||0)*31+(rep.to||0);
 const rnd=k=>hash(seed,k);
 // sky and distant hills in ink wash
 const sky=g.createLinearGradient(0,0,0,Hd);sky.addColorStop(0,'#efe3c2');sky.addColorStop(.62,'#e6d4a8');sky.addColorStop(1,'#cdb27c');g.fillStyle=sky;g.fillRect(0,0,Wd,Hd);
 g.strokeStyle='rgba(90,66,40,.45)';g.fillStyle='rgba(176,150,104,.45)';g.lineWidth=.8;g.beginPath();g.moveTo(0,46);
 for(let x=0;x<=Wd;x+=24)g.quadraticCurveTo(x+12,34+rnd(x)*12,x+24,44+rnd(x+1)*6);g.lineTo(Wd,Hd);g.lineTo(0,Hd);g.closePath();g.fill();g.stroke();
 g.fillStyle='rgba(150,124,78,.55)';g.fillRect(0,64,Wd,Hd-64);g.strokeStyle='rgba(90,66,40,.35)';g.beginPath();for(let x=6;x<Wd;x+=17){g.moveTo(x,70+rnd(x+5)*8);g.lineTo(x+6,70+rnd(x+5)*8);}g.stroke();
 const fig=(f,x,y,s,flip,fallen)=>{g.save();g.translate(x,y);if(fallen){g.rotate(flip?-1.45:1.45);g.translate(0,2);}g.scale(flip?-s:s,s);figPaint(g,figCul(f),col(f));g.restore();};
 const banner=(f,x,y,flip,h=40)=>{g.save();g.strokeStyle='#2a1a0c';g.lineWidth=1.2;g.beginPath();g.moveTo(x,y);g.lineTo(x,y-h);g.stroke();
  const d=flip?-1:1,t=y-h;g.fillStyle=col(f);g.beginPath();g.moveTo(x,t);g.lineTo(x+16*d,t+2);g.lineTo(x+12*d,t+7);g.lineTo(x+16*d,t+12);g.lineTo(x,t+11);g.closePath();g.fill();g.lineWidth=.7;g.stroke();
  g.fillStyle='#e2b857';g.beginPath();g.arc(x,t-1,1.3,0,7);g.fill();g.restore();};
 const puff=(x,y,r)=>{g.fillStyle='rgba(236,230,214,.75)';for(let k=0;k<4;k++){g.beginPath();g.arc(x+(rnd(k+x)-.5)*r*1.4,y+(rnd(k+y)-.5)*r*.8,r*(.55+rnd(k*3+x)*.5),0,7);g.fill();}};
 if(walls){const wx=262;g.fillStyle='#e2d4b2';g.strokeStyle='#33261a';g.lineWidth=.9;g.fillRect(wx,30,Wd-wx,40);g.strokeRect(wx,30,Wd-wx+2,40);
  for(let x=wx;x<Wd;x+=9){g.fillRect(x,25,5,5);g.strokeRect(x,25,5,5);}
  g.fillStyle='rgba(0,0,0,.08)';for(let y=36;y<70;y+=7)g.fillRect(wx,y,Wd-wx,1);
  for(const tx of[wx-4,wx+82]){g.fillStyle='#e8dbbb';g.fillRect(tx,14,22,56);g.strokeRect(tx,14,22,56);for(let k=0;k<3;k++){g.fillRect(tx+k*8,9,6,5);g.strokeRect(tx+k*8,9,6,5);}}
  g.fillStyle='#33261a';g.beginPath();g.arc(wx+52,70,8,Math.PI,0);g.lineTo(wx+60,70);g.lineTo(wx+44,70);g.closePath();g.fill();
  banner(def,wx+93,9,true,5);
  if(rep.fortDmg){g.fillStyle='#cdb27c';g.beginPath();g.moveTo(wx+26,25);g.lineTo(wx+34,40);g.lineTo(wx+30,48);g.lineTo(wx+40,25);g.closePath();g.fill();}
  for(let k=0;k<3;k++)fig(def,wx+22+k*20,31,1.25,true,false);
  // ladder and the storming party
  g.strokeStyle='#6b4a2a';g.lineWidth=1.3;g.beginPath();g.moveTo(232,70);g.lineTo(258,24);g.moveTo(240,72);g.lineTo(265,27);g.stroke();g.lineWidth=.8;g.beginPath();for(let k=1;k<8;k++){const t=k/8;g.moveTo(232+26*t,70-46*t);g.lineTo(240+25*t,72-45*t);}g.stroke();
  const year=1451+Math.floor((rep.turn!=null?rep.turn:S.turn)/4);
  if(year>=1453){g.fillStyle='#4a3a2a';g.strokeStyle='#2a1a0c';g.save();g.translate(60,66);g.rotate(-.18);g.fillRect(0,-4,34,8);g.strokeRect(0,-4,34,8);g.restore();
   g.fillStyle='#6b4a2a';g.beginPath();g.arc(66,70,5,0,7);g.arc(84,68,5,0,7);g.fill();g.stroke();puff(102,57,8);}
  banner(att,112,80,false);
  for(let k=0;k<5;k++){const x=128+k*22+rnd(k)*5,y=79-rnd(k+9)*3,dead=!attWon&&k%3===1;fig(att,x,y,1.55,false,dead);}if(attWon){g.fillStyle='rgba(120,30,20,.18)';g.fillRect(wx,30,Wd-wx,40);}
  puff(250,22,7);}
 else{
  banner(att,22,80,false);banner(def,Wd-22,80,true);
  for(let k=0;k<5;k++){const x=44+k*27+rnd(k)*6,y=79-rnd(k+3)*3,dead=!attWon&&(k===3||k===1);fig(att,x,y,1.65,false,dead);}
  for(let k=0;k<5;k++){const x=Wd-44-k*27-rnd(k+20)*6,y=79-rnd(k+23)*3,dead=attWon&&(k===3||k===1);fig(def,x,y,1.65,true,dead);}
  puff(Wd/2,58,11);puff(Wd/2-14,62,8);puff(Wd/2+16,61,8);
  g.strokeStyle='rgba(42,26,12,.7)';g.lineWidth=1.4;g.beginPath();g.moveTo(Wd/2-9,40);g.lineTo(Wd/2+9,56);g.moveTo(Wd/2+9,40);g.lineTo(Wd/2-9,56);g.stroke();}
 // a manuscript frame
 g.strokeStyle='#4a2e12';g.lineWidth=1.2;g.strokeRect(.6,.6,Wd-1.2,Hd-1.2);g.strokeStyle='rgba(201,161,78,.9)';g.lineWidth=.8;g.strokeRect(3,3,Wd-6,Hd-6);
 return c;}
