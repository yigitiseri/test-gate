/* =====================================================================
   UI
   ===================================================================== */
let amt=0,confirmKey='';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function shield(f,big){return `<span class="shield${big?' big':''}" title="${esc(FAC[f].n)}">${armsSVG(f)}</span>`;}
function relChip(f){const pl=S.player;if(f===pl)return '<span class="chip ally">Senin</span>';
 if(atWar(pl,f))return '<span class="chip war">Savaşta</span>';if(isAlly(pl,f))return '<span class="chip ally">Müttefik</span>';
 if(inTruce(pl,f))return `<span class="chip truce">Ateşkes · ${S.truce[key(pl,f)]-S.turn} tur</span>`;return '<span class="chip">Barış</span>';}
function toast(m,k=''){const t=document.createElement('div');t.className='toast '+k;t.textContent=m;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),3800);while($('#toasts').children.length>4)$('#toasts').firstChild.remove();}

function renderTop(){
 if(!S||!S.player)return;const f=S.player,F=S.fac[f];
 $('#pShield').outerHTML=shield(f).replace('class="shield','id="pShield" class="shield');$('#pName').textContent=FAC[f].s;
 const net=income(f)-upkeep(f);$('#gold').textContent=Math.floor(F.gold);const gd=$('#goldd');gd.textContent=(net>=0?'+':'')+net.toFixed(0);gd.className=net>=0?'pos':'neg';
 $('#mp').textContent=fmtK(F.mp);$('#army').textContent=fmtK(strength(f));$('#provs').textContent=facProvs(f).length;
 const w=warsOf(f).length;$('#wars').textContent=w;$('#wars').className=w?'neg':'';
 if(!busy)$('#endTurn').textContent=S.over?'Oyun bitti':'Turu Bitir';document.documentElement.style.setProperty('--toph',Math.round(topH())+'px');
 SND.setMood(w?'war':'peace');sndIcon();$('#season').textContent=SEASONS[S.turn%4];{const y=START_YEAR+Math.floor(S.turn/4);$('#year').textContent=`${y} · ${hijri(y)} H · tur ${S.turn+1}`;$('#year').title=`Anno Domini ${roman(y)}`;}
}
function renderPanel(){
 const pn=$('#panel'),el=$('#panelIn');if(sel<0||!S){pn.hidden=true;return;}pn.hidden=false;if(tgt>=0&&!tgtOk())tgt=-1;
 const d=PD[sel],p=S.prov[sel],f=S.player,F=S.fac[f],mine=p.o===f,isCap=S.fac[p.o].cap===sel;
 const terr=d.mtn?'Dağlık · +30% savunma':d.des?'Çöl · +10% savunma':'Ova';
 let h=`<div class="ph">${shield(p.o,true)}<div><h2>${isCap?'★ ':''}${esc(d.name)}</h2><div class="sub">${esc(FAC[p.o].n)}</div></div><button class="x" data-act="close" aria-label="Kapat">×</button></div>
 <div class="chips">${relChip(p.o)}<span class="chip">${terr}</span>${p.un>0?`<span class="chip un">Huzursuz · ${p.un} tur</span>`:''}${p.mkt?'<span class="chip">Pazar</span>':''}${p.brk?'<span class="chip">Kışla</span>':''}</div>
 <div class="grid4"><div><label>Gelişim</label><b>${p.dev}</b></div><div><label>Kale</label><b>${p.fort}</b></div><div><label>Garnizon</label><b>${fmtK(p.t)}</b></div><div><label>Gelir</label><b>${(p.dev*(1+.5*p.mkt)*(p.un>0?.5:1)).toFixed(1)}</b></div></div>`;
 if(tgt>=0){
  const td=PD[tgt],tp=S.prov[tgt],av=avail(sel),war=tp.o!==f;amt=clamp(amt,Math.min(100,av),av);
  h+=`<div class="sec"><h3>${war?'Sefer':'Asker yürüt'} → ${esc(td.name)}</h3>
   <div class="amt"><span>Gönderilecek</span><b id="amtv">${amt.toLocaleString('tr')}</b><span>/ ${av.toLocaleString('tr')}</span></div>
   <input type="range" id="amt" min="${Math.min(100,av)}" max="${av}" step="100" value="${amt}" aria-label="Asker sayısı"></div>`;
  if(war){h+=`<div class="odds" id="odds"></div><div class="hint">Savunma: ${fmtK(tp.t)} asker + yerel milis, kale ${tp.fort}${PD[tgt].mtn?', dağlık arazi':''}${F.cannon?' (topçun kale etkisini kırıyor)':''}${S.turn%4===3?'. Kış seferi: saldırı gücü −15%':''}.</div>`;}
  h+=`<div class="acts"><button class="btn ${war?'danger':'primary'}" data-act="go">${war?'Saldır':'Yürüt'}</button><button class="btn" data-act="cancel" style="justify-content:center">Vazgeç</button></div>`;
 }else if(mine){
  const av=avail(sel);
  h+=`<div class="hint">${av>0?`Hazır asker: <b>${av.toLocaleString('tr')}</b>. Yürütmek ya da saldırmak için komşu bir eyalete dokun. <span style="color:#1f6f4a;font-weight:700">Yeşil</span> kendi toprağın, <span style="color:#a3301e;font-weight:700">kırmızı</span> savaştaki düşman.`:'Bu eyaletteki askerler bu tur hareket etti.'}</div>
  <div class="sec"><h3>Asker topla</h3><div class="acts">
   <button class="btn" data-act="rec1" ${F.gold<RC||F.mp<1000?'disabled':''}>+1.000 <span class="c">${RC} altın</span></button>
   <button class="btn" data-act="rec5" ${F.gold<RC*5||F.mp<5000?'disabled':''}>+5.000 <span class="c">${RC*5} altın</span></button></div></div>
  <div class="sec"><h3>İnşa et</h3><div class="acts">
   <button class="btn" data-act="bdev" ${p.dev>=12||F.gold<25*p.dev?'disabled':''}>İmar +1 <span class="c">${25*p.dev}</span></button>
   <button class="btn" data-act="bmkt" ${p.mkt||F.gold<60?'disabled':''}>${p.mkt?'Pazar var':'Pazar'} <span class="c">${p.mkt?'✓':'60'}</span></button>
   <button class="btn" data-act="bfort" ${p.fort>=5||F.gold<40*(p.fort+1)?'disabled':''}>Kale ${p.fort+1} <span class="c">${p.fort>=5?'azami':40*(p.fort+1)}</span></button>
   <button class="btn" data-act="bbrk" ${p.brk||F.gold<50?'disabled':''}>${p.brk?'Kışla var':'Kışla'} <span class="c">${p.brk?'✓':'50'}</span></button></div>
   <div class="hint" style="margin-top:6px">Pazar geliri %50 artırır, kışla insan gücünü iki katına çıkarır. Kale ve yerel milis savunmaya katılır.</div></div>`;
 }else{
  const o=p.o,dp=defPower(sel,f);
  h+=`<div class="meta"><span>Hükümdar <b>${esc(FAC[o].r)}</b></span><span>İlişki <b>${getOp(f,o)}</b></span><span>Ordu <b>${fmtK(strength(o))}</b></span><span>Tahmini savunma <b>${fmtK(dp)}</b></span></div>`;
  if(!atWar(f,o)){const ck='war:'+o;
   if(isAlly(f,o))h+=`<div class="hint">${FAC[o].s} senin müttefikin.</div>`;
   else if(inTruce(f,o))h+=`<div class="hint">Ateşkes sürüyor, ${S.truce[key(f,o)]-S.turn} tur boyunca savaş ilan edemezsin.</div>`;
   else h+=`<div class="hint">Bu eyalete saldırmak için önce savaş ilan etmelisin.</div><button class="btn danger" data-act="dwar" data-f="${o}">${confirmKey===ck?'Emin misin? Savaş ilan et':'Savaş ilan et'}</button>`;}
  else h+=`<div class="hint">Savaştasın. Komşu eyaletini seçip buraya dokunarak saldır.</div>`;
 }
 el.innerHTML=h;
 const r=$('#amt');if(r){const upd=()=>{amt=+r.value;$('#amtv').textContent=amt.toLocaleString('tr');const od=$('#odds');if(od){const ratio=atkPower(amt,f)/defPower(tgt,f);
   const [t,c]=ratio>1.6?['Ezici üstünlük','var(--ok)']:ratio>1.15?['Üstünüz','#4f7d2a']:ratio>.9?['Başa baş','var(--brass)']:ratio>.6?['Riskli','#a0521a']:['Umutsuz','var(--war2)'];
   od.innerHTML=`<span>Güç ${fmtK(atkPower(amt,f))} : ${fmtK(defPower(tgt,f))}</span><b style="color:${c}">${t}</b>`;}};r.addEventListener('input',upd);upd();}
}

const OVERBLOCK=new Set(['go','rec1','rec5','bdev','bmkt','bbrk','bfort','dwar','dp-war','dp-peace','dp-trib','dp-ally','dp-gift','dp-break','off']);
function act(a,t){
 const f=S&&S.player,F=f&&S.fac[f];
 if(f&&S.over&&OVERBLOCK.has(a)){toast('Oyun sona erdi. Yeni bir oyun başlatmak için "Oyun bitti" düğmesine bas.');return;}
 if(f&&S.over&&a==='end'){queueModal(showEnd);return;}
 switch(a){
  case 'close':clearSel();break;
  case 'cancel':tgt=-1;renderPanel();req();break;
  case 'go':{if(!tgtOk()){tgt=-1;toast('Bu hedefe artık saldıramazsın: savaş sona erdi ya da eyalet el değiştirdi.');renderPanel();req();break;}const n=Math.min(amt,avail(sel));if(n<=0)break;const o=S.prov[tgt].o;
   if(o===f){S.prov[sel].t-=n;S.prov[tgt].t+=n;S.prov[tgt].mv+=n;addFx({type:'march',a:sel,b:tgt,dur:520,col:FAC[f].c});SND.play('march');const to=tgt;sel=to;tgt=-1;}
   else{const a0=sel,b0=tgt;const rep=battle(sel,tgt,n);if(rep){SND.play('march');const cn=!!S.fac[f].cannon,w=rep.win;setTimeout(()=>SND.play('battle',{win:w,cannon:cn||S.prov[b0].fort>=2}),420);addFx({type:'march',a:a0,b:b0,dur:460,col:FAC[f].c});addFx({type:'boom',p:b0,dur:1500,delay:440,seed:Math.random()*6,label:rep.win?'Zafer!':'Püskürtüldü',good:rep.win});toast(rep.win?`Zafer! ${PD[rep.to].name} alındı. Kayıp: ${fmtK(rep.aLoss)}`:`Hücum püskürtüldü. Kayıp ${fmtK(rep.aLoss)}, düşman kaybı ${fmtK(rep.dLoss)}`,rep.win?'good':'war');
     if(rep.win){sel=rep.to;}tgt=-1;checkMissions();if(S.over){save();renderAll();queueModal(showEnd);return;}}}
   renderAll();break;}
  case 'rec1':case 'rec5':{const n=a==='rec1'?1:5;if(F.gold<RC*n||F.mp<1000*n)break;F.gold-=RC*n;F.mp-=1000*n;S.prov[sel].t+=1000*n;S.prov[sel].mv+=1000*n;SND.play('recruit');renderAll();break;}
  case 'bdev':{const p=S.prov[sel],c=25*p.dev;if(F.gold<c||p.dev>=12)break;F.gold-=c;p.dev++;SND.play('build');renderAll();break;}
  case 'bmkt':{const p=S.prov[sel];if(p.mkt||F.gold<60)break;F.gold-=60;p.mkt=1;SND.play('build');renderAll();break;}
  case 'bbrk':{const p=S.prov[sel];if(p.brk||F.gold<50)break;F.gold-=50;p.brk=1;SND.play('build');renderAll();break;}
  case 'bfort':{const p=S.prov[sel],c=40*(p.fort+1);if(p.fort>=5||F.gold<c)break;F.gold-=c;p.fort++;SND.play('build');renderAll();break;}
  case 'dwar':{const o=t.dataset.f,ck='war:'+o;if(confirmKey!==ck){confirmKey=ck;renderPanel();break;}confirmKey='';declareWar(f,o);SND.play('war');toast(`${FAC[o].s} devletine savaş ilan ettin.`,'war');renderAll();break;}
  case 'end':endTurn();break;
  case 'diplo':showDiplo();break;
  case 'missions':showMissions();break;
  case 'chron':showChron();break;
  case 'menu':showMenu();break;
  case 'state':showState();break;
  case 'mclose':closeModal();break;
  case 'zin':zoomAt(vw/2,vh/2,curS()*1.35);break;
  case 'zout':zoomAt(vw/2,vh/2,curS()/1.35);break;
  case 'fit':if(G3.on){G3.center(W/2,H/2,fitS);}else{cam.s=fitS;clampCam();}req();break;
  case 'v3d':{const on=G3.set(!G3.on);toast(on?'3D harita':(G3.fail?'3D bu cihazda açılamadı':'2D harita'));break;}
  case 'mode':mapMode=mapMode==='pol'?'ter':'pol';t.textContent=mapMode==='pol'?'◐':'◑';t.title=mapMode==='pol'?'Arazi haritası':'Siyasi harita';toast(mapMode==='pol'?'Siyasi harita':'Arazi haritası');polDirty=true;req();break;
  case 'dp-war':{const o=t.dataset.f,ck='dw:'+o;if(confirmKey!==ck){confirmKey=ck;showDiplo();break;}confirmKey='';declareWar(f,o);SND.play('war');renderAll();showDiplo();break;}
  case 'dp-peace':{const o=t.dataset.f;if(!atWar(f,o))break;if(aiAcceptPeace(o,f)){makePeace(f,o);SND.play('peace');toast(`${FAC[o].s} barışı kabul etti.`,'good');}else{toast(`${FAC[o].s} barışı reddetti.`,'war');addOp(f,o,-5);}renderAll();showDiplo();break;}
  case 'dp-trib':{const o=t.dataset.f;if(!atWar(f,o))break;if(aiAcceptTribute(o,f)){const g=tributeAmt(o);S.fac[o].gold=Math.max(0,S.fac[o].gold-g);F.gold+=g;makePeace(f,o);SND.play('coin');news(`${FAC[o].s} barış karşılığı ${g} altın haraç ödedi.`,'good');toast(`${FAC[o].s} ${g} altın haraç ödedi.`,'good');}else toast(tributeAmt(o)<10?`${FAC[o].s} hazinesi boş, ödeyecek haracı yok.`:`${FAC[o].s} haraç vermeyi reddetti.`,'war');renderAll();showDiplo();break;}
  case 'dp-ally':{const o=t.dataset.f;if(aiAcceptAlliance(o,f)){S.ally[key(f,o)]=true;SND.play('peace');addOp(f,o,10);news(`${FAC[o].s} ile ittifak kuruldu.`,'good');toast(`${FAC[o].s} ittifakı kabul etti.`,'good');}else{toast(`${FAC[o].s} ittifak teklifini geri çevirdi.`);}renderAll();showDiplo();break;}
  case 'dp-gift':{const o=t.dataset.f;if(F.gold<50)break;F.gold-=50;addOp(f,o,20);SND.play('coin');toast(`${FAC[o].s} hediyeni memnuniyetle karşıladı (+20 ilişki).`,'good');renderAll();showDiplo();break;}
  case 'dp-break':{const o=t.dataset.f;delete S.ally[key(f,o)];addOp(f,o,-30);addLog(`${FAC[o].s} ile ittifak bozuldu.`);renderAll();showDiplo();break;}
  case 'off':{const k=+t.dataset.k,ok=t.dataset.v==='1',of=S.offers[k];if(!of)break;S.offers.splice(k,1);if(!offerOk(of)){pruneOffers();toast('Bu teklif artık geçerli değil.');renderAll();showReport();break;}
   if(ok&&atWar(of.f,f)){makePeace(of.f,f);SND.play('peace');toast(`${FAC[of.f].s} ile barış yapıldı.`,'good');}else if(!ok)addOp(f,of.f,-5);renderAll();showReport();break;}
  case 'ev':{const c=evChoices[+t.dataset.k];if(evPend){delete S.pendEv;evPend=false;}closeModal();if(c&&c.f)c.f();if(c&&c.l)addLog(`${evTitle}: ${c.l}`,'info');renderAll();break;}
  case 'pick':{startPick=t.dataset.f;renderStart();hlKey='';startCenter(startPick);break;}
  case 'begin':SND.play('fanfare');beginGame(startPick);break;
  case 'snd':SND.set('on',!SND.st.on);sndIcon();toast(SND.st.on?'Ses açık':'Ses kapalı');break;
  case 'snd-music':SND.set('music',!SND.st.music);showMenu();break;
  case 'snd-sfx':SND.set('sfx',!SND.st.sfx);showMenu();break;
  case 'continue':loadGame();break;
  case 'newgame':modalQ.length=0;closeModal();try{localStorage.removeItem(SAVE);}catch(e){}showStart();break;
  case 'help':showGuide('genel');break;
  case 'guide':showGuide(t.dataset.t);break;
 }
}
const QUIET=new Set(['go','rec1','rec5','bdev','bmkt','bbrk','bfort','end','begin','ev','dp-peace','dp-trib','dp-ally','dp-gift','off','snd']);
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t||t.disabled)return;SND.init();if(!QUIET.has(t.dataset.act))SND.play('click');act(t.dataset.act,t);});
addEventListener('pagehide',()=>{if(S&&S.player&&!busy)save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S&&S.player&&!busy)save();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#modal').hidden){if(!$('#modal .ev')&&!$('#modal .endm'))closeModal();}else clearSel();}});

function renderAll(){renderTop();renderPanel();polDirty=true;req();if(S&&S.player&&!busy)save();}

