/* =====================================================================
   EVENT MINIATURES: a small painted strip at the head of every decree (eventModal, 12), chosen from what
   the event is about (its title and text, Turkish or English): a siege, plague, the court and throne,
   caravans and trade, the sea, a revolt, war, faith, the harvest; otherwise a chart with its compass rose.
   Drawn from the map's own pieces (figures 07j, towns 07i, galleys and symbols 02/02b), cached per kind
   and realm.
   ===================================================================== */
const EVA={cache:new Map(),W:388,H:84};
const EVA_KINDS=[
 ['plague',/veba|plague|salgın|hastalık|pestilence|sickness/i],
 ['revolt',/isyan|revolt|ayaklan|rebel|kazan kaldır|kettle|uprising|mutin/i],
 ['siege',/kuşat|siege|sur(lar|u)\b|walls|fetih|fethe|conquest|topları|great guns|cannon/i],
 ['court',/taht|throne|veliaht|heir|cülus|accession|doğdu|born|evlil|marri|vefat|öldü|died|death of|doj|doge|taç|crown/i],
 ['sea',/donanma|fleet|gemi|ship|korsan|pirate|liman|harbou?r|naval|tersane|arsenal/i],
 ['trade',/kervan|caravan|tüccar|merchant|ticaret|trade|pazar|market|ipek|silk|baharat|spice/i],
 ['faith',/cami|mosque|kilise|church|papa|pope|patrik|patriarch|ulema|derviş|dervish|vakıf|haçlı|crusade|faith|din\b/i],
 ['harvest',/hasat|harvest|kıtlık|famine|bereket|bounty|tahıl|grain|kuraklık|drought/i],
 ['war',/savaş|war\b|ordu|army|muharebe|battle|sefer|campaign|asker|troops|ittifak|alliance/i]];
function evaKind(ev){const t=(ev.t||'')+' '+(ev.d||'');for(const [k,re] of EVA_KINDS)if(re.test(t))return k;return 'chart';}
function evaImg(ev){const f=S&&S.player,k=evaKind(ev),key=k+'|'+(f||'');let url=EVA.cache.get(key);
 if(url==null){try{url=evaPaint(k,f).toDataURL('image/png');}catch(e){console.error('event art',e);url='';}EVA.cache.set(key,url);}
 return url?`<img class="ev-mini" data-k="${k}" src="${url}" alt="">`:'';}
function evaPaint(k,f){const sc=2,Wd=EVA.W,Hd=EVA.H,c=mk(Wd*sc,Hd*sc),g=c.getContext('2d',CPU2D);g.scale(sc,sc);
 const col=(f&&FAC[f]&&FAC[f].c)||'#8e1f14',rel=f?ctyRel(f):'m',rnd=n=>hash(n,k.length*7);
 const dark=k==='plague',sky=g.createLinearGradient(0,0,0,Hd);
 sky.addColorStop(0,dark?'#c9c2ae':'#efe3c2');sky.addColorStop(.6,dark?'#b9b096':'#e6d4a8');sky.addColorStop(1,dark?'#9c9277':'#cdb27c');g.fillStyle=sky;g.fillRect(0,0,Wd,Hd);
 const ground=(y,c2)=>{g.fillStyle=c2||'rgba(150,124,78,.55)';g.beginPath();g.moveTo(0,y);for(let x=0;x<=Wd;x+=32)g.quadraticCurveTo(x+16,y-4+rnd(x)*6,x+32,y+rnd(x+1)*3);g.lineTo(Wd,Hd);g.lineTo(0,Hd);g.closePath();g.fill();g.strokeStyle='rgba(90,66,40,.4)';g.lineWidth=.8;g.stroke();};
 const fig=(cul,x,y,s,flip,fc)=>{s*=1.45;y+=6;g.save();g.translate(x,y);g.scale(flip?-s:s,s);figPaint(g,cul,fc||col);g.restore();};
 const town=(x,y,u,o)=>{g.save();g.translate(x,y);cityPaint(g,Object.assign({tier:3,walls:2,port:0,mkt:0,cap:0,rel,col,v:1},o||{}),u);g.restore();};
 const sym=(t,x,y,sz,v)=>{g.save();g.translate(x,y);symPaint(g,{t,v:v||0,sz});g.restore();};
 const puff=(x,y,r,a)=>{g.fillStyle=`rgba(236,230,214,${a||.75})`;for(let j=0;j<4;j++){g.beginPath();g.arc(x+(rnd(j+x)-.5)*r*1.4,y+(rnd(j+y)-.5)*r*.8,r*(.55+rnd(j*3+x)*.5),0,7);g.fill();}};
 const cul=f?figCul(f):'jan';
 if(k==='siege'){ground(66);town(318,72,3.6,{noShrine:1});
  for(const [x,y] of [[78,66],[170,70]]){g.fillStyle='#4a3a2a';g.strokeStyle='#2a1a0c';g.lineWidth=.9;g.save();g.translate(x,y);g.rotate(-.16);g.fillRect(0,-4.5,36,9);g.strokeRect(0,-4.5,36,9);g.restore();
   g.fillStyle='#6b4a2a';g.beginPath();g.arc(x+6,y+4,5.5,0,7);g.fill();g.stroke();puff(x+44,y-12,9);}
  for(const x of [24,50,132,150])fig(cul,x,72,1,false);}
 else if(k==='plague'){ground(64,'rgba(120,108,84,.6)');town(194,70,3.8,{col:'#6a6458'});
  g.strokeStyle='#2a1a0c';g.lineWidth=1.1;for(let j=0;j<11;j++){const x=24+j*33+rnd(j)*16,y=10+rnd(j+5)*26;g.beginPath();g.moveTo(x-5,y);g.quadraticCurveTo(x-2,y-3,x,y);g.quadraticCurveTo(x+2,y-3,x+5,y);g.stroke();}
  g.fillStyle='rgba(60,50,40,.18)';g.fillRect(0,0,Wd,Hd);}
 else if(k==='court'){g.fillStyle='#7a1e14';g.fillRect(0,0,Wd,14);for(let x=0;x<Wd;x+=26){g.fillStyle='#8e2a1c';g.beginPath();g.moveTo(x,14);g.quadraticCurveTo(x+13,30,x+26,14);g.fill();}
  g.fillStyle='#e2b857';g.fillRect(0,13,Wd,2);g.fillStyle='rgba(140,90,40,.35)';g.fillRect(0,64,Wd,20);
  g.fillStyle='#e2b857';g.strokeStyle='#3a2410';g.lineWidth=1;g.beginPath();g.moveTo(160,22);g.quadraticCurveTo(194,8,228,22);g.lineTo(224,26);g.lineTo(164,26);g.closePath();g.fill();g.stroke();
  g.beginPath();g.moveTo(166,26);g.lineTo(166,66);g.moveTo(222,26);g.lineTo(222,66);g.stroke();g.fillStyle='#a8281c';g.fillRect(172,56,44,10);g.strokeRect(172,56,44,10);
  g.fillStyle='#8a5a22';g.strokeStyle='#3a2410';g.lineWidth=1;g.fillRect(176,30,36,36);g.strokeRect(176,30,36,36);g.fillStyle=col;g.fillRect(182,40,24,18);
  g.fillStyle='#e2b857';g.beginPath();g.moveTo(180,30);g.lineTo(184,20);g.lineTo(190,27);g.lineTo(194,17);g.lineTo(198,27);g.lineTo(204,20);g.lineTo(208,30);g.closePath();g.fill();g.stroke();
  for(let j=0;j<3;j++){fig(cul,60+j*30,74,1.05,false);fig(cul,Wd-60-j*30,74,1.05,true);}}
 else if(k==='sea'){g.fillStyle='rgba(96,138,136,.55)';g.fillRect(0,46,Wd,Hd-46);g.strokeStyle='rgba(40,70,72,.5)';g.lineWidth=.8;
  for(let y=52;y<Hd;y+=8){g.beginPath();for(let x=-10+(y%16);x<Wd;x+=20){g.moveTo(x,y);g.quadraticCurveTo(x+5,y-3,x+10,y);}g.stroke();}
  galley(g,110,58,.95,0);galley(g,270,64,1.1,1);sym('wave',40,72,5,1);sym('wave',340,52,4,0);}
 else if(k==='trade'){ground(64,'rgba(214,180,118,.6)');sym('dune',60,66,9,1);sym('dune',330,64,8,0);sym('palm',300,66,4.5,0);sym('palm',316,68,3.8,1);
  const camel=(x,y)=>{g.save();g.translate(x,y);g.scale(1.9,1.9);g.strokeStyle='#3e2412';g.fillStyle='#d7b27a';g.lineWidth=1;g.lineCap='round';
   g.beginPath();for(const [a,b] of [[-7,-8],[-4,-5],[4,3],[7,8]]){g.moveTo(a,-6);g.lineTo(b,0);}g.stroke();
   g.beginPath();g.ellipse(0,-8,8,3.6,0,0,7);g.fill();g.stroke();g.beginPath();g.ellipse(-1,-11,4,3.2,0,Math.PI,0);g.fill();g.stroke();
   g.beginPath();g.moveTo(7,-8.5);g.quadraticCurveTo(10,-11,9.6,-15);g.stroke();g.beginPath();g.ellipse(11,-15.4,2.4,1.3,0,0,7);g.fill();g.stroke();
   g.fillStyle=col;g.fillRect(-5,-15,7,4);g.strokeRect(-5,-15,7,4);g.restore();};
  for(let j=0;j<4;j++)camel(122+j*44,76-(j%2));fig('turk',84,72,1,false,'#6b4a2a');}
 else if(k==='revolt'){ground(66);town(330,72,3,{tier:2,walls:1});
  for(let j=0;j<9;j++){const x=50+j*24+rnd(j)*8;fig(j%3===0?cul:'turk',x,74-rnd(j+2)*3,1,j%2===1,j%3===0?col:'#7a5a3a');
   if(j%2===0){g.strokeStyle='#5a3a1e';g.lineWidth=1;g.beginPath();g.moveTo(x+3,58);g.lineTo(x+5,40);g.stroke();g.fillStyle='rgba(230,120,40,.9)';g.beginPath();g.ellipse(x+5,37,2,3.6,0,0,7);g.fill();}}}
 else if(k==='faith'){ground(66);town(194,72,4.2,{tier:2,walls:0,cap:0});sym('tree',120,68,4,1);sym('tree',270,68,4,2);sym('pine',96,70,3.6,0);
  g.strokeStyle='rgba(201,161,78,.6)';g.lineWidth=.8;for(let j=0;j<12;j++){const a=Math.PI+j*Math.PI/11;g.beginPath();g.moveTo(194+Math.cos(a)*42,24+Math.sin(a)*42*.2+30);g.lineTo(194+Math.cos(a)*70,30+Math.sin(a)*30);g.stroke();}}
 else if(k==='harvest'){ground(58,'rgba(200,164,84,.65)');g.strokeStyle='rgba(120,86,40,.6)';g.lineWidth=.8;for(let y=64;y<Hd;y+=5){g.beginPath();g.moveTo(0,y);g.lineTo(Wd,y+rnd(y)*4);g.stroke();}
  for(let j=0;j<8;j++){const x=30+j*46;g.fillStyle='#d8b058';g.strokeStyle='#6b4a2a';g.beginPath();g.moveTo(x-6,70);g.lineTo(x,50);g.lineTo(x+6,70);g.closePath();g.fill();g.stroke();g.beginPath();g.moveTo(x-5,60);g.lineTo(x+5,60);g.stroke();}
  sym('tree',360,60,4.5,2);town(80,58,1.6,{tier:0,walls:0});}
 else if(k==='war'){ground(66);for(let j=0;j<7;j++){fig(cul,40+j*20,74-rnd(j)*3,1.1,false);}
  g.strokeStyle='#2a1a0c';g.lineWidth=1.2;g.beginPath();g.moveTo(24,74);g.lineTo(24,30);g.stroke();g.fillStyle=col;g.beginPath();g.moveTo(24,30);g.lineTo(46,32);g.lineTo(40,38);g.lineTo(46,44);g.lineTo(24,43);g.closePath();g.fill();g.lineWidth=.7;g.stroke();
  sym('mtn',300,66,14,1);sym('mtn',350,68,10,0);puff(220,56,10,.6);}
 else{g.strokeStyle='rgba(40,32,22,.3)';g.lineWidth=.7;for(let j=0;j<16;j++){const a=j*Math.PI/8;g.beginPath();g.moveTo(Wd/2,Hd/2);g.lineTo(Wd/2+Math.cos(a)*400,Hd/2+Math.sin(a)*400);g.stroke();}
  compass(g,Wd/2,Hd/2,30);galley(g,80,54,.8,0);sym('mtn',320,62,10,2);sym('pine',290,64,3.4,1);}
 g.strokeStyle='#4a2e12';g.lineWidth=1.2;g.strokeRect(.6,.6,Wd-1.2,Hd-1.2);g.strokeStyle='rgba(201,161,78,.9)';g.lineWidth=.8;g.strokeRect(3,3,Wd-6,Hd-6);
 return c;}
