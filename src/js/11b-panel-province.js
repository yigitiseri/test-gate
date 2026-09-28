/* =====================================================================
   PROVINCE PANEL SECTIONS + ACTIONS (Track B)
   Panel order slots: 30 armies B, 35 general C, 40 orders B (data-sheet="action"),
   50 recruit B, 60 build B, 70 foreign B, 90 advisor D.
   ===================================================================== */
let amt=0;
PANEL_SECTIONS.push({id:'orders',order:40,when:c=>c.tgt>=0,html(c){
 const {f,F}=c,td=PD[tgt],tp=S.prov[tgt],av=avail(sel),war=tp.o!==f;amt=clamp(amt,Math.min(100,av),av);
 let h=`<div class="sec" data-sheet="action"><h3>${war?'Sefer':'Asker yürüt'} → ${esc(td.name)}</h3>
   <div class="amt"><span>Gönderilecek</span><b id="amtv">${amt.toLocaleString('tr')}</b><span>/ ${av.toLocaleString('tr')}</span></div>
   <input type="range" id="amt" min="${Math.min(100,av)}" max="${av}" step="100" value="${amt}" aria-label="Asker sayısı"></div>`;
 if(war){h+=`<div class="odds" id="odds"></div><div class="hint">Savunma: ${fmtK(tp.t)} asker + yerel milis, kale ${tp.fort}${PD[tgt].mtn?', dağlık arazi':''}${F.cannon?' (topçun kale etkisini kırıyor)':''}${S.turn%4===3?'. Kış seferi: saldırı gücü −15%':''}.</div>`;}
 h+=`<div class="acts"><button class="btn ${war?'danger':'primary'}" data-act="go">${war?'Saldır':'Yürüt'}</button><button class="btn" data-act="cancel" style="justify-content:center">Vazgeç</button></div>`;
 return h;},
 bind(root,c){const f=c.f,r=$('#amt');if(!r)return;const upd=()=>{amt=+r.value;$('#amtv').textContent=amt.toLocaleString('tr');const od=$('#odds');if(od){const ratio=atkPower(amt,f)/defPower(tgt,f);
   const [t,cl]=ratio>1.6?['Ezici üstünlük','var(--ok)']:ratio>1.15?['Üstünüz','#4f7d2a']:ratio>.9?['Başa baş','var(--brass)']:ratio>.6?['Riskli','#a0521a']:['Umutsuz','var(--war2)'];
   od.innerHTML=`<span>Güç ${fmtK(atkPower(amt,f))} : ${fmtK(defPower(tgt,f))}</span><b style="color:${cl}">${t}</b>`;}};r.addEventListener('input',upd);upd();}});
PANEL_SECTIONS.push({id:'recruit',order:50,when:c=>c.tgt<0&&c.mine,html(c){const F=c.F,av=avail(sel);
 return `<div class="hint">${av>0?`Hazır asker: <b>${av.toLocaleString('tr')}</b>. Yürütmek ya da saldırmak için komşu bir eyalete dokun. <span style="color:#1f6f4a;font-weight:700">Yeşil</span> kendi toprağın, <span style="color:#a3301e;font-weight:700">kırmızı</span> savaştaki düşman.`:'Bu eyaletteki askerler bu tur hareket etti.'}</div>
  <div class="sec"><h3>Asker topla</h3><div class="acts">
   <button class="btn" data-act="rec1" ${F.gold<RC||F.mp<1000?'disabled':''}>+1.000 <span class="c">${RC} altın</span></button>
   <button class="btn" data-act="rec5" ${F.gold<RC*5||F.mp<5000?'disabled':''}>+5.000 <span class="c">${RC*5} altın</span></button></div></div>`;}});
PANEL_SECTIONS.push({id:'build',order:60,when:c=>c.tgt<0&&c.mine,html(c){const {F,p}=c;
 return `
  <div class="sec"><h3>İnşa et</h3><div class="acts">
   <button class="btn" data-act="bdev" ${p.dev>=12||F.gold<25*p.dev?'disabled':''}>İmar +1 <span class="c">${25*p.dev}</span></button>
   <button class="btn" data-act="bmkt" ${p.mkt||F.gold<60?'disabled':''}>${p.mkt?'Pazar var':'Pazar'} <span class="c">${p.mkt?'✓':'60'}</span></button>
   <button class="btn" data-act="bfort" ${p.fort>=5||F.gold<40*(p.fort+1)?'disabled':''}>Kale ${p.fort+1} <span class="c">${p.fort>=5?'azami':40*(p.fort+1)}</span></button>
   <button class="btn" data-act="bbrk" ${p.brk||F.gold<50?'disabled':''}>${p.brk?'Kışla var':'Kışla'} <span class="c">${p.brk?'✓':'50'}</span></button></div>
   <div class="hint" style="margin-top:6px">Pazar geliri %50 artırır, kışla insan gücünü iki katına çıkarır. Kale ve yerel milis savunmaya katılır.</div></div>`;}});
PANEL_SECTIONS.push({id:'foreign',order:70,when:c=>c.tgt<0&&!c.mine,html(c){
 const f=c.f,o=c.p.o,dp=defPower(sel,f);
 let h=`<div class="meta"><span>Hükümdar <b>${esc(rulerName(o))}</b></span><span>İlişki <b>${getOp(f,o)}</b></span><span>Ordu <b>${fmtK(strength(o))}</b></span><span>Tahmini savunma <b>${fmtK(dp)}</b></span></div>`;
 if(!atWar(f,o)){const ck='war:'+o;
  if(isAlly(f,o))h+=`<div class="hint">${FAC[o].s} senin müttefikin.</div>`;
  else if(inTruce(f,o))h+=`<div class="hint">Ateşkes sürüyor, ${S.truce[key(f,o)]-S.turn} tur boyunca savaş ilan edemezsin.</div>`;
  else h+=`<div class="hint">Bu eyalete saldırmak için önce savaş ilan etmelisin.</div><button class="btn danger" data-act="dwar" data-f="${o}">${confirmKey===ck?'Emin misin? Savaş ilan et':'Savaş ilan et'}</button>`;}
 else h+=`<div class="hint">Savaştasın. Komşu eyaletini seçip buraya dokunarak saldır.</div>`;
 return h;}});

ACTS.close=()=>clearSel();
ACTS.cancel=()=>{tgt=-1;renderPanel();req();};
ACTS.go=(t,f,F)=>{if(!tgtOk()){tgt=-1;toast('Bu hedefe artık saldıramazsın: savaş sona erdi ya da eyalet el değiştirdi.');renderPanel();req();return;}const n=Math.min(amt,avail(sel));if(n<=0)return;const o=S.prov[tgt].o;
 if(o===f){S.prov[sel].t-=n;S.prov[tgt].t+=n;S.prov[tgt].mv+=n;addFx({type:'march',a:sel,b:tgt,dur:520,col:FAC[f].c});SND.play('march');const to=tgt;sel=to;tgt=-1;}
 else{const a0=sel,b0=tgt;const rep=battle(sel,tgt,n);if(rep){SND.play('march');const cn=!!S.fac[f].cannon,w=rep.win;setTimeout(()=>SND.play('battle',{win:w,cannon:cn||S.prov[b0].fort>=2}),420);addFx({type:'march',a:a0,b:b0,dur:460,col:FAC[f].c});addFx({type:'boom',p:b0,dur:1500,delay:440,seed:Math.random()*6,label:rep.win?'Zafer!':'Püskürtüldü',good:rep.win});toast(rep.win?`Zafer! ${PD[rep.to].name} alındı. Kayıp: ${fmtK(rep.aLoss)}`:`Hücum püskürtüldü. Kayıp ${fmtK(rep.aLoss)}, düşman kaybı ${fmtK(rep.dLoss)}`,rep.win?'good':'war');
   if(rep.win){sel=rep.to;}tgt=-1;checkMissions();if(S.over){save();renderAll();queueModal(showEnd);return;}}}
 renderAll();};
ACTS.rec1=ACTS.rec5=(t,f,F)=>{const n=t.dataset.act==='rec1'?1:5;if(F.gold<RC*n||F.mp<1000*n)return;F.gold-=RC*n;F.mp-=1000*n;S.prov[sel].t+=1000*n;S.prov[sel].mv+=1000*n;SND.play('recruit');renderAll();};
ACTS.bdev=(t,f,F)=>{const p=S.prov[sel],c=25*p.dev;if(F.gold<c||p.dev>=12)return;F.gold-=c;p.dev++;SND.play('build');renderAll();};
ACTS.bmkt=(t,f,F)=>{const p=S.prov[sel];if(p.mkt||F.gold<60)return;F.gold-=60;p.mkt=1;SND.play('build');renderAll();};
ACTS.bbrk=(t,f,F)=>{const p=S.prov[sel];if(p.brk||F.gold<50)return;F.gold-=50;p.brk=1;SND.play('build');renderAll();};
ACTS.bfort=(t,f,F)=>{const p=S.prov[sel],c=40*(p.fort+1);if(p.fort>=5||F.gold<c)return;F.gold-=c;p.fort++;SND.play('build');renderAll();};
ACTS.dwar=(t,f)=>{const o=t.dataset.f,ck='war:'+o;if(confirmKey!==ck){confirmKey=ck;renderPanel();return;}confirmKey='';declareWar(f,o);SND.play('war');toast(`${FAC[o].s} devletine savaş ilan ettin.`,'war');renderAll();};
