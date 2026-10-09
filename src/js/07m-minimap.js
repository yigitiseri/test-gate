/* =====================================================================
   MINIMAP (2D): a small overview of the whole map in the bottom-right corner, with the part on screen framed.
   Tap or drag on it to move the view there. The picture (the baked map with the political colours, 07/07h)
   is redrawn only when the owners or the map mode change; the frame follows the camera every frame
   (DRAW_LAYERS.minimap). Hidden in 3D, on the start screen and while the province panel is open on a
   narrow screen; the ▣ button above the zoom buttons shows or hides it (remembered; off on phones at first).
   ===================================================================== */
const MM_STORE='aod-mm-v1',MM={el:null,c:null,fr:null,sig:'',w:0,h:0,drag:false};
function mmPref(){try{const v=localStorage.getItem(MM_STORE);if(v!=null)return v==='1';}catch(e){}return innerWidth>=720;}
let mmOn=mmPref();
function mmBuild(){if(MM.el)return;const el=document.createElement('div');el.id='minimap';el.hidden=true;el.setAttribute('role','img');
 el.setAttribute('aria-label',lng('Genel bakış haritası: dokunduğun yere gidilir','Overview map: tap to go there'));
 el.innerHTML='<canvas></canvas><i class="mm-fr"></i>';document.body.appendChild(el);MM.el=el;MM.c=el.querySelector('canvas');MM.fr=el.querySelector('.mm-fr');
 const go=e=>{const r=MM.c.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width,0,1)*W,y=clamp((e.clientY-r.top)/r.height,0,1)*H;centerOn(x,y,cam.s);mmUpdate(G3.on);};
 el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();MM.drag=true;el.setPointerCapture(e.pointerId);go(e);});
 el.addEventListener('pointermove',e=>{if(MM.drag)go(e);});
 const up=e=>{MM.drag=false;try{el.releasePointerCapture(e.pointerId);}catch(_){}};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
 el.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});}
/** Redraw the overview picture (the baked ground and the political colours). */
function mmPaint(){const w=Math.round(innerWidth<720?140:200),h=Math.round(w*H/W),d=Math.min(window.devicePixelRatio||1,2),c=MM.c;
 if(c.width!==Math.round(w*d)){c.width=Math.round(w*d);c.height=Math.round(h*d);c.style.width=w+'px';c.style.height=h+'px';}MM.w=w;MM.h=h;
 const g=c.getContext('2d');g.setTransform(c.width/W,0,0,c.height/H,0,0);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='medium';
 if(baseC)g.drawImage(baseC,0,0,W,H);if(polC)g.drawImage(polC,0,0,W,H);
 if(S&&S.player){const i=S.fac[S.player].cap;if(i>=0){g.setTransform(c.width/W,0,0,c.height/H,0,0);g.fillStyle='#fbe9c0';g.strokeStyle='#8e1f14';g.lineWidth=W/w*1.5;g.beginPath();g.arc(PD[i].lx,PD[i].ly,W/w*3.2,0,7);g.fill();g.stroke();}}}
/** Show or hide the overview and move its frame to the camera (every frame, and at once after a tap or toggle). */
function mmUpdate(g3){mmBuild();const show=mmOn&&!g3&&!!S&&!!S.player&&$('#start').hidden&&!(innerWidth<720&&!$('#panel').hidden);
 if(MM.el.hidden===show)MM.el.hidden=!show;if(!show)return;
 const sig=S.prov.map(p=>p.o+(p.ctl||'')).join()+mapMode+(S.fac[S.player].cap)+innerWidth;if(sig!==MM.sig){MM.sig=sig;mmPaint();}
 const th=topH(),x0=-cam.x/cam.s,y0=(th-cam.y)/cam.s,x1=(vw-cam.x)/cam.s,y1=(vh-cam.y)/cam.s,k=MM.w/W,
  l=clamp(x0*k,0,MM.w),t=clamp(y0*k,0,MM.h),r=clamp(x1*k,0,MM.w),b=clamp(y1*k,0,MM.h);
 const st=MM.fr.style;st.left=l+'px';st.top=t+'px';st.width=Math.max(4,r-l)+'px';st.height=Math.max(4,b-t)+'px';}
DRAW_LAYERS.minimap=(c,now,s,g3)=>{mmUpdate(g3);return false;};
function mmToggle(){mmOn=!mmOn;try{localStorage.setItem(MM_STORE,mmOn?'1':'0');}catch(e){}mmBtnUi();mmUpdate(G3.on);req();}
function mmBtnUi(){const b=document.getElementById('mmBtn');if(!b)return;b.classList.toggle('on',mmOn);const t=mmOn?lng('Genel bakışı gizle','Hide the overview'):lng('Genel bakışı göster','Show the overview');b.title=t;b.setAttribute('aria-label',t);}
ACTS.minimap=()=>mmToggle();
hook('boot',()=>{const z=document.getElementById('zoom');if(!z||document.getElementById('mmBtn'))return;const b=document.createElement('button');b.id='mmBtn';b.dataset.act='minimap';b.textContent='▣';b.style.fontSize='17px';
 const v=document.getElementById('v3dBtn');z.insertBefore(b,v||null);mmBtnUi();});
KE.mm={on:()=>mmOn,toggle:()=>mmToggle(),el:()=>MM.el};
