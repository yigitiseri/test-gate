/* =====================================================================
   PROVINCE PANEL SECTIONS + ACTIONS (Track B)
   Panel order slots: 30 armies B, 35 general C, 40 orders B (data-sheet="action"),
   50 recruit B, 60 build B, 70 foreign B, 90 advisor D.
   ===================================================================== */
let amt=0; // legacy (pre-army slider); kept so old references do not break
const armPct=v=>`${v>=0?'+':'−'}${Math.abs(Math.round(v*100))}%`;
/** One battle modifier in plain Turkish, e.g. "Kale 3 · savunma +45%". */
function armModText(m){let t=`${m.l} · ${m.side==='att'?'saldırı':'savunma'} ${armPct(m.m-1)}`;if(m.loss&&m.loss!==1)t+=`, ${m.side==='def'?'saldıranın':'savunanın'} kaybı ${armPct(m.loss-1)}`;return t;}
function armOddsWord(p){return p>=.85?['Ezici üstünlük','var(--ok)']:p>=.6?['Üstünüz','#4f7d2a']:p>=.4?['Başa baş','var(--brass)']:p>=.15?['Riskli','#a0521a']:['Umutsuz','var(--war2)'];}
function armMoraleWord(m){return m>=1.1?'Coşkulu':m>=.95?'İyi':m>=.75?'Yorgun':'Dağınık';}
function armRow(a,on){const own=a.f===S.player,g=armGenName(a);
 const inner=`${shield(a.f)}<span class="an">${own?esc(armName(a)):esc(FAC[a.f].s+' ordusu')}${g?`<small>${esc(g)}</small>`:''}</span><span class="as"><b>${fmtK(a.n)}</b>${own?`<small>Yürüyüş ${a.mp}/${a.mpMax} · ${armMoraleWord(a.morale)}</small>`:''}</span>`;
 return own?`<button class="arm${on?' on':''}" data-act="asel" data-id="${a.id}" aria-pressed="${on?'true':'false'}">${inner}</button>`:`<div class="arm foe">${inner}</div>`;}

PANEL_SECTIONS.push({id:'armies',order:30,when:c=>armyAt(c.i).length>0||c.mine,html(c){
 const f=c.f,here=armyAt(c.i).sort((x,y)=>(y.f===f)-(x.f===f)||y.n-x.n),mineH=here.filter(a=>a.f===f),sa=armyById(selArmy);
 const on=sa&&sa.f===f&&sa.loc===c.i?sa:null,cnt=armyList(f).length,cap=armyCap(f);
 let h=`<div class="sec armsec"><h3>Ordular <span class="cap">${cnt}/${cap}</span></h3>`;
 if(!here.length)h+=`<div class="hint">Burada sahra ordusu yok. Aşağıdan asker toplarsan yeni bir ordu kurulur.</div>`;
 else h+=`<div class="arms">${here.map(a=>armRow(a,on&&on.id===a.id)).join('')}</div>`;
 if(on&&c.tgt<0){const others=mineH.filter(a=>a.id!==on.id).length,ck='dis:'+on.id;
  h+=`<div class="hint">${on.mp>0?`Ordunu yürütmek için gideceği eyalete dokun. Bu mevsim ${on.mp} eyalet daha yürüyebilir; düşman toprağına giren ordu orada durur.`:'Bu ordu bu mevsim yürüyüşünü tamamladı. Turu bitirince yeniden yola çıkabilir.'}</div>
  <div class="acts">${others?`<button class="btn" data-act="amerge" data-id="${on.id}">Orduları birleştir</button>`:''}
   <button class="btn" data-act="asplit" data-id="${on.id}" ${cnt>=cap||on.n<200?'disabled':''}>İkiye böl</button>
   <button class="btn danger" data-act="adisband" data-id="${on.id}">${confirmKey===ck?'Emin misin? Dağıt':'Dağıt'}</button></div>`;}
 else if(mineH.length&&c.tgt<0)h+=`<div class="hint">Emir vermek için bir ordu seç.</div>`;
 return h+'</div>';}});

PANEL_SECTIONS.push({id:'orders',order:40,when:c=>c.tgt>=0&&!!armyById(selArmy),html(c){
 const f=c.f,a=armyById(selArmy),mv=armyCanMove(a.id,tgt),td=PD[tgt],kind=mv.kind||'move';
 const title=kind==='battle'?'Meydan muharebesi':kind==='assault'?'Hücum':'Yürüyüş';
 let h=`<div class="sec orders" data-sheet="action"><h3>${title} → ${esc(td.name)}</h3>
  <div class="meta"><span>${esc(armName(a))} <b>${fmtK(a.n)}</b></span><span>Yol <b>${mv.cost||0} eyalet</b></span>${kind==='battle'?`<span>Düşman ordusu <b>${fmtK(armFoesAt(tgt,f).reduce((s,x)=>s+x.n,0))}</b></span>`:''}${kind==='assault'?`<span>Garnizon <b>${fmtK(S.prov[tgt].t)}</b> + milis</span>`:''}</div>`;
 if(kind!=='move'){const od=battleOdds({att:f,to:tgt,army:a}),[w,cl]=armOddsWord(od.p),pc=Math.round(od.p*100);
  h+=`<div class="odds armodds" data-tip="odds" data-army="${a.id}" data-to="${tgt}"><span>Zafer şansı</span><div class="obar" role="img" aria-label="Zafer şansı yüzde ${pc}"><i style="width:${pc}%;background:${cl}"></i></div><b style="color:${cl}">${w} · %${pc}</b></div>`;
  const ms=od.mods.map(armModText);if(od.need>1)ms.push(`Güçlü kale: surları ancak savunmanın ${{1.5:'bir buçuk',2:'iki',2.5:'iki buçuk',3:'üç'}[od.need]||od.need} katı güçle aşabilirsin`);
  if(ms.length)h+=`<ul class="mods">${ms.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  h+=`<div class="hint">${kind==='battle'?'Kazanırsan düşman ordusu geri çekilir ya da kuşatılıp yok olur. Kaybedersen ordun geri döner.':'Kazanırsan eyalet senin olur, ordun içeri girer ve bir kısmı garnizon olarak kalır.'}</div>`;}
 else{h+=`<div class="hint">Ordu kendi ya da müttefik topraklarında mevsimde ${a.mpMax} eyalet yürür.${armyAt(tgt,f).length?' Oradaki orduya katılmak için yürüt, sonra orduları birleştir.':''}</div>`;
  const there=armyAt(tgt,f);if(there.length)h+=`<div class="acts">${there.map(x=>`<button class="btn" data-act="asel" data-id="${x.id}">Oradaki orduyu seç: ${esc(armName(x))}</button>`).join('')}</div>`;}
 h+=`<div class="acts"><button class="btn ${kind==='move'?'primary':'danger'}" data-act="amove">${kind==='move'?'Yürü':'Saldır'}</button><button class="btn" data-act="cancel" style="justify-content:center">Vazgeç</button></div></div>`;
 return h;}});

PANEL_SECTIONS.push({id:'recruit',order:50,when:c=>c.tgt<0&&c.mine,html(c){const {F,f,i}=c,p=c.p;
 const d=armRecruitDest(f,i,{army:selArmy}),cnt=armyList(f).length,cap=armyCap(f);
 const where=d.to==='army'?`Yeni askerler <b>${esc(armName(d.army))}</b> saflarına katılır.`:d.to==='new'?`Yeni bir sahra ordusu kurulur (${cnt+1}/${cap}).`:d.to==='gar'?`Ordu sınırına ulaştın (${cnt}/${cap}): askerler garnizona yazılır.`:esc(d.reason||'');
 const gm=garrisonMax(i),room=garRoom(i),gn=Math.min(1000,room),ck='gdis:'+i;
 return `<div class="sec"><h3>Asker topla</h3><div class="hint">${where}</div><div class="acts">
   <button class="btn" data-act="rec1" ${!d.to||F.gold<RC||F.mp<1000?'disabled':''}>+1.000 <span class="c">${RC} altın</span></button>
   <button class="btn" data-act="rec5" ${!d.to||d.to==='gar'||F.gold<RC*5||F.mp<5000?'disabled':''}>+5.000 <span class="c">${RC*5} altın</span></button></div></div>
  <div class="sec garsec"><h3>Garnizon <span class="cap">${fmtK(p.t)} / ${fmtK(gm)}</span></h3>
   <div class="hint">Garnizon eyaleti korur ama sefere çıkamaz. Maaşı sahra ordusunun yarısıdır.</div><div class="acts">
   <button class="btn" data-act="grec" ${room<100||F.gold<RC*gn/1000||F.mp<gn?'disabled':''}>Garnizonu güçlendir ${gn>=100?'+'+gn.toLocaleString('tr'):''} <span class="c">${room<100?'dolu':Math.ceil(RC*gn/1000)+' altın'}</span></button>
   <button class="btn" data-act="gdisband" ${p.t<=garMin(i)?'disabled':''}>${confirmKey===ck?'Emin misin? Azalt':'Garnizonu azalt'}</button></div></div>`;}});

PANEL_SECTIONS.push({id:'build',order:60,when:c=>c.tgt<0&&c.mine,html(c){const {F,p}=c;
 return `
  <div class="sec"><h3>İnşa et</h3><div class="acts">
   <button class="btn" data-act="bdev" ${p.dev>=12||F.gold<25*p.dev?'disabled':''}>İmar +1 <span class="c">${25*p.dev}</span></button>
   <button class="btn" data-act="bmkt" ${p.mkt||F.gold<60?'disabled':''}>${p.mkt?'Pazar var':'Pazar'} <span class="c">${p.mkt?'✓':'60'}</span></button>
   <button class="btn" data-act="bfort" ${p.fort>=5||F.gold<40*(p.fort+1)?'disabled':''}>Kale ${p.fort+1} <span class="c">${p.fort>=5?'azami':40*(p.fort+1)}</span></button>
   <button class="btn" data-act="bbrk" ${p.brk||F.gold<50?'disabled':''}>${p.brk?'Kışla var':'Kışla'} <span class="c">${p.brk?'✓':'50'}</span></button></div>
   <div class="hint" style="margin-top:6px">Pazar geliri %50 artırır, kışla insan gücünü iki katına çıkarır. Kale ve yerel milis savunmaya katılır; kale ve gelişim garnizonun sığacağı asker sayısını da artırır.</div></div>`;}});
PANEL_SECTIONS.push({id:'foreign',order:70,when:c=>c.tgt<0&&!c.mine,html(c){
 const f=c.f,o=c.p.o,dp=defPower(sel,f);
 let h=`<div class="meta"><span>Hükümdar <b>${esc(rulerName(o))}</b></span><span>İlişki <b>${getOp(f,o)}</b></span><span>Ordu <b>${fmtK(strength(o))}</b></span><span>Tahmini savunma <b>${fmtK(dp)}</b></span></div>`;
 if(!atWar(f,o)){const ck='war:'+o;
  if(isAlly(f,o))h+=`<div class="hint">${FAC[o].s} senin müttefikin. Orduların bu topraklardan geçebilir.</div>`;
  else if(inTruce(f,o))h+=`<div class="hint">Ateşkes sürüyor, ${S.truce[key(f,o)]-S.turn} tur boyunca savaş ilan edemezsin.</div>`;
  else h+=`<div class="hint">Bu eyalete saldırmak için önce savaş ilan etmelisin.</div><button class="btn danger" data-act="dwar" data-f="${o}">${confirmKey===ck?'Emin misin? Savaş ilan et':'Savaş ilan et'}</button>`;}
 else h+=`<div class="hint">Savaştasın. Komşu eyaletteki ordunu seçip buraya dokunarak saldır. Garnizonlar sefere çıkmaz; saldırı için sahra ordusu gerekir.</div>`;
 return h;}});

/* ---- actions ---- */
['amove','amerge','asplit','adisband','gdisband','grec'].forEach(a=>OVERBLOCK.add(a));
['asel','amove','grec'].forEach(a=>QUIET.add(a));
ACTS.close=()=>clearSel();
ACTS.cancel=()=>{tgt=-1;renderPanel();req();};
ACTS.asel=t=>{const a=armyById(+t.dataset.id);if(!a||a.f!==S.player)return;if(selArmy===a.id&&sel===a.loc&&tgt<0){selArmy=null;}else armSelect(a.loc,a.id);SND.play('select');renderPanel();req();};
ACTS.amove=(t,f)=>{const a=armyById(selArmy);
 if(!a||!tgtOk()){tgt=-1;toast(a?armyCanMove(a.id,tgt).reason||'Bu emir artık geçerli değil.':'Önce bir ordu seç.');renderPanel();req();return;}
 const a0=a.loc,to=tgt,n0=a.n,name=armName(a),r=armyMove(a.id,to);
 if(r.kind==='none'){toast(r.reason);tgt=-1;renderPanel();req();return;}
 addFx({type:'march',a:a0,b:to,dur:r.kind==='move'?520:460,col:FAC[f].c});SND.play('march');
 if(r.kind!=='move'&&r.rep){const rep=r.rep,w=rep.win,cn=!!S.fac[f].cannon;setTimeout(()=>SND.play('battle',{win:w,cannon:cn||S.prov[to].fort>=2}),420);
  addFx({type:'boom',p:to,dur:1500,delay:440,seed:Math.random()*6,label:w?'Zafer!':'Püskürtüldü',good:w});
  if(r.kind==='assault')toast(w?`Zafer! ${PD[to].name} alındı. Kayıp: ${fmtK(rep.aLoss)}`:`Hücum püskürtüldü. Kayıp ${fmtK(rep.aLoss)}, düşman kaybı ${fmtK(rep.dLoss)}`,w?'good':'war');
  else toast(w?`Meydan muharebesi kazanıldı! Düşman kaybı ${fmtK(rep.dLoss)}, kaybımız ${fmtK(rep.aLoss)}.${rep.surrounded?' Kuşatılan düşman ordusu yok edildi.':' Düşman geri çekildi.'}`:`Meydan muharebesi kaybedildi. Kayıp ${fmtK(rep.aLoss)}, düşman kaybı ${fmtK(rep.dLoss)}.`,w?'good':'war');
  if(!armyById(a.id))toast(`${name} dağıldı.`,'war');}
 const still=armyById(a.id);if(still){sel=still.loc;selArmy=still.id;}else{sel=to;selArmy=null;}tgt=-1;
 if(r.kind!=='move'){checkMissions();if(S.over){save();renderAll();queueModal(showEnd);return;}}
 renderAll();};
ACTS.go=ACTS.amove; // pre-army name of the confirm button
ACTS.amerge=(t,f)=>{const a=armyById(+t.dataset.id);if(!a||a.f!==f)return;let k=0;for(const b of armyAt(a.loc,f))if(b.id!==a.id&&armyMerge(a,b))k++;
 if(k){SND.play('march');toast(`Ordular birleşti: ${armName(a)} artık ${fmtK(a.n)}.`,'good');}renderAll();};
ACTS.asplit=(t,f)=>{const a=armyById(+t.dataset.id);if(!a||a.f!==f)return;const b=armySplit(a.id);
 if(!b){toast(armyList(f).length>=armyCap(f)?`Ordu sınırına ulaştın (${armyCap(f)}). Yeni ordu için daha çok eyalete hükmetmelisin.`:'Bu ordu bölünemeyecek kadar küçük.');return;}
 selArmy=b.id;SND.play('march');toast(`${armName(b)} kuruldu: ${fmtK(b.n)} asker.`,'good');renderAll();};
ACTS.adisband=(t,f)=>{const a=armyById(+t.dataset.id);if(!a||a.f!==f)return;const ck='dis:'+a.id;if(confirmKey!==ck){confirmKey=ck;renderPanel();return;}confirmKey='';
 const name=armName(a),back=armyDisband(a.id);SND.play('coin');toast(`${name} dağıtıldı. ${fmtK(back)} kişi köyüne döndü ve yeniden askere yazılabilir.`,'good');renderAll();};
ACTS.gdisband=(t,f)=>{const i=sel,p=S.prov[i];if(!p||p.o!==f)return;const ck='gdis:'+i;if(confirmKey!==ck){confirmKey=ck;renderPanel();return;}confirmKey='';
 const n=garDisband(i);if(n){SND.play('coin');toast(`${PD[i].name} garnizonundan ${fmtK(n)} asker terhis edildi.`,'good');}renderAll();};
ACTS.grec=(t,f,F)=>{if(sel<0||S.prov[sel].o!==f)return;const r=armRecruit(f,sel,1000,{gar:true});if(!r.to){toast(r.reason);return;}SND.play('recruit');renderAll();};
ACTS.rec1=ACTS.rec5=(t,f,F)=>{if(sel<0)return;const n=t.dataset.act==='rec1'?1000:5000,r=armRecruit(f,sel,n,{army:selArmy});
 if(!r.to){toast(r.reason);return;}if(r.army)selArmy=r.army.id;SND.play('recruit');
 if(r.to==='new')toast(`${armName(r.army)} kuruldu. Yeni askerler bu mevsim eğitimde, gelecek mevsim yürüyebilir.`,'good');else if(r.to==='gar')toast(`${fmtK(r.n)} asker garnizona yazıldı.`);renderAll();};
ACTS.bdev=(t,f,F)=>{const p=S.prov[sel],c=25*p.dev;if(F.gold<c||p.dev>=12)return;F.gold-=c;p.dev++;SND.play('build');renderAll();};
ACTS.bmkt=(t,f,F)=>{const p=S.prov[sel];if(p.mkt||F.gold<60)return;F.gold-=60;p.mkt=1;SND.play('build');renderAll();};
ACTS.bbrk=(t,f,F)=>{const p=S.prov[sel];if(p.brk||F.gold<50)return;F.gold-=50;p.brk=1;SND.play('build');renderAll();};
ACTS.bfort=(t,f,F)=>{const p=S.prov[sel],c=40*(p.fort+1);if(p.fort>=5||F.gold<c)return;F.gold-=c;p.fort++;SND.play('build');renderAll();};
ACTS.dwar=(t,f)=>{const o=t.dataset.f,ck='war:'+o;if(confirmKey!==ck){confirmKey=ck;renderPanel();return;}confirmKey='';declareWar(f,o);SND.play('war');toast(`${FAC[o].s} devletine savaş ilan ettin.`,'war');renderAll();};
