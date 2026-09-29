/* =====================================================================
   PROVINCE PANEL SECTIONS + ACTIONS (Track B)
   Panel order slots: 30 armies B, 35 general C, 40 orders B (data-sheet="action"),
   50 recruit B, 60 build B, 70 foreign B, 90 advisor D.
   ===================================================================== */
let amt=0; // legacy (pre-army slider); kept so old references do not break
const armPct=v=>`${v>=0?'+':'−'}${Math.abs(Math.round(v*100))}%`;
/** One battle modifier in plain Turkish, e.g. "Kale 3 · savunma +45%". */
function armModText(m){let t=`${m.l} · ${m.side==='att'?lng('saldırı','attack'):lng('savunma','defence')} ${armPct(m.m-1)}`;if(m.loss&&m.loss!==1)t+=lng(`, ${m.side==='def'?'saldıranın':'savunanın'} kaybı ${armPct(m.loss-1)}`,`, ${m.side==='def'?'attacker':'defender'} losses ${armPct(m.loss-1)}`);return t;}
function armOddsWord(p){return p>=.85?[lng('Ezici üstünlük','Overwhelming'),'var(--ok)']:p>=.6?[lng('Üstünüz','Favoured'),'#4f7d2a']:p>=.4?[lng('Başa baş','Even'),'var(--brass)']:p>=.15?[lng('Riskli','Risky'),'#a0521a']:[lng('Umutsuz','Hopeless'),'var(--war2)'];}
function armMoraleWord(m){return m>=1.1?lng('Coşkulu','Eager'):m>=.95?lng('İyi','Good'):m>=.75?lng('Yorgun','Weary'):lng('Dağınık','Shaken');}
function armRow(a,on){const own=a.f===S.player,g=armGenName(a);
 const inner=`${shield(a.f)}<span class="an">${own?esc(armName(a)):esc(lng(FAC[a.f].s+' ordusu',FAC[a.f].s+' army'))}${g?`<small>${esc(g)}</small>`:''}</span><span class="as"><b>${fmtK(a.n)}</b>${own?`<small>${lng('Yürüyüş','March')} ${a.mp}/${a.mpMax} · ${armMoraleWord(a.morale)}</small>`:''}</span>`;
 return own?`<button class="arm${on?' on':''}" data-act="asel" data-id="${a.id}" aria-pressed="${on?'true':'false'}">${inner}</button>`:`<div class="arm foe">${inner}</div>`;}

PANEL_SECTIONS.push({id:'armies',order:30,when:c=>armyAt(c.i).length>0||c.mine,html(c){
 const f=c.f,here=armyAt(c.i).sort((x,y)=>(y.f===f)-(x.f===f)||y.n-x.n),mineH=here.filter(a=>a.f===f),sa=armyById(selArmy);
 const on=sa&&sa.f===f&&sa.loc===c.i?sa:null,cnt=armyList(f).length,cap=armyCap(f);
 let h=`<div class="sec armsec"><h3>${lng('Ordular','Armies')} <span class="cap">${cnt}/${cap}</span></h3>`;
 if(!here.length)h+=`<div class="hint">${lng('Burada sahra ordusu yok. Aşağıdan asker toplarsan yeni bir ordu kurulur.','No field army here. Raise troops below and a new army is formed.')}</div>`;
 else h+=`<div class="arms">${here.map(a=>armRow(a,on&&on.id===a.id)).join('')}</div>`;
 if(on&&c.tgt<0){const others=mineH.filter(a=>a.id!==on.id).length,ck='dis:'+on.id;
  h+=`<div class="hint">${on.mp>0?lng(`Ordunu yürütmek için gideceği eyalete dokun. Bu mevsim ${on.mp} eyalet daha yürüyebilir; düşman toprağına giren ordu orada durur.`,`Tap a province to march there. This army can march ${on.mp} more ${on.mp===1?'province':'provinces'} this season; an army that enters enemy land stops there.`):lng('Bu ordu bu mevsim yürüyüşünü tamamladı. Turu bitirince yeniden yola çıkabilir.','This army has finished its march for the season. It can set out again after you end the turn.')}</div>
  <div class="acts">${others?`<button class="btn" data-act="amerge" data-id="${on.id}">${lng('Orduları birleştir','Merge armies')}</button>`:''}
   <button class="btn" data-act="asplit" data-id="${on.id}" ${cnt>=cap||on.n<200?'disabled':''}>${lng('İkiye böl','Split in two')}</button>
   <button class="btn danger" data-act="adisband" data-id="${on.id}">${confirmKey===ck?lng('Emin misin? Dağıt','Sure? Disband'):lng('Dağıt','Disband')}</button></div>`;}
 else if(mineH.length&&c.tgt<0)h+=`<div class="hint">${lng('Emir vermek için bir ordu seç.','Select an army to give it orders.')}</div>`;
 return h+'</div>';}});

PANEL_SECTIONS.push({id:'orders',order:40,when:c=>c.tgt>=0&&!!armyById(selArmy),html(c){
 const f=c.f,a=armyById(selArmy),mv=armyCanMove(a.id,tgt),td=PD[tgt],kind=mv.kind||'move';
 const title=kind==='battle'?lng('Meydan muharebesi','Field battle'):kind==='assault'?lng('Hücum','Assault'):lng('Yürüyüş','March');
 let h=`<div class="sec orders" data-sheet="action"><h3>${title} → ${esc(td.name)}</h3>
  <div class="meta"><span>${esc(armName(a))} <b>${fmtK(a.n)}</b></span><span>${lng('Yol','Route')} <b>${mv.cost||0} ${lng('eyalet',(mv.cost||0)===1?'province':'provinces')}</b></span>${kind==='battle'?`<span>${lng('Düşman ordusu','Enemy army')} <b>${fmtK(armFoesAt(tgt,f).reduce((s,x)=>s+x.n,0))}</b></span>`:''}${kind==='assault'?`<span>${lng('Garnizon','Garrison')} <b>${fmtK(S.prov[tgt].t)}</b> + ${lng('milis','militia')}</span>`:''}</div>`;
 if(kind!=='move'){const od=battleOdds({att:f,to:tgt,army:a}),[w,cl]=armOddsWord(od.p),pc=Math.round(od.p*100);
  h+=`<div class="odds armodds" data-tip="odds" data-army="${a.id}" data-to="${tgt}"><span>${lng('Zafer şansı','Chance of victory')}</span><div class="obar" role="img" aria-label="${lng(`Zafer şansı yüzde ${pc}`,`Chance of victory ${pc} percent`)}"><i style="width:${pc}%;background:${cl}"></i></div><b style="color:${cl}">${w} · ${lng('%'+pc,pc+'%')}</b></div>`;
  const ms=od.mods.map(armModText);if(od.need>1)ms.push(lng(`Güçlü kale: surları ancak savunmanın ${{1.5:'bir buçuk',2:'iki',2.5:'iki buçuk',3:'üç'}[od.need]||od.need} katı güçle aşabilirsin`,`Strong fortress: you can only break the walls with ${{1.5:'one and a half times',2:'twice',2.5:'two and a half times',3:'three times'}[od.need]||od.need+' times'} the defenders' strength`));
  if(ms.length)h+=`<ul class="mods">${ms.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  h+=`<div class="hint">${kind==='battle'?lng('Kazanırsan düşman ordusu geri çekilir ya da kuşatılıp yok olur. Kaybedersen ordun geri döner.','If you win, the enemy army falls back, or is surrounded and destroyed. If you lose, your army turns back.'):lng('Kazanırsan eyalet senin olur, ordun içeri girer ve bir kısmı garnizon olarak kalır.','If you win, the province is yours: your army marches in and part of it stays as the garrison.')}</div>`;}
 else{h+=`<div class="hint">${lng(`Ordu kendi ya da müttefik topraklarında mevsimde ${a.mpMax} eyalet yürür.${armyAt(tgt,f).length?' Oradaki orduya katılmak için yürüt, sonra orduları birleştir.':''}`,`On your own or allied land an army marches ${a.mpMax} provinces a season.${armyAt(tgt,f).length?' To join the army there, march in and then merge the armies.':''}`)}</div>`;
  const there=armyAt(tgt,f);if(there.length)h+=`<div class="acts">${there.map(x=>`<button class="btn" data-act="asel" data-id="${x.id}">${lng('Oradaki orduyu seç','Select the army there')}: ${esc(armName(x))}</button>`).join('')}</div>`;}
 h+=`<div class="acts"><button class="btn ${kind==='move'?'primary':'danger'}" data-act="amove">${kind==='move'?lng('Yürü','March'):lng('Saldır','Attack')}</button><button class="btn" data-act="cancel" style="justify-content:center">${lng('Vazgeç','Cancel')}</button></div></div>`;
 return h;}});

PANEL_SECTIONS.push({id:'recruit',order:50,when:c=>c.tgt<0&&c.mine,html(c){const {F,f,i}=c,p=c.p;
 const d=armRecruitDest(f,i,{army:selArmy}),cnt=armyList(f).length,cap=armyCap(f);
 const where=d.to==='army'?lng(`Yeni askerler <b>${esc(armName(d.army))}</b> saflarına katılır.`,`New troops join the ranks of <b>${esc(armName(d.army))}</b>.`):d.to==='new'?lng(`Yeni bir sahra ordusu kurulur (${cnt+1}/${cap}).`,`A new field army is formed (${cnt+1}/${cap}).`):d.to==='gar'?lng(`Ordu sınırına ulaştın (${cnt}/${cap}): askerler garnizona yazılır.`,`You have reached the army limit (${cnt}/${cap}): troops join the garrison.`):esc(d.reason||'');
 const gm=garrisonMax(i),room=garRoom(i),gn=Math.min(1000,room),ck='gdis:'+i;
 return `<div class="sec"><h3>${lng('Asker topla','Raise troops')}</h3><div class="hint">${where}</div><div class="acts">
   <button class="btn" data-act="rec1" ${!d.to||F.gold<RC||F.mp<1000?'disabled':''}>${lng('+1.000','+1,000')} <span class="c">${RC} ${lng('altın','gold')}</span></button>
   <button class="btn" data-act="rec5" ${!d.to||d.to==='gar'||F.gold<RC*5||F.mp<5000?'disabled':''}>${lng('+5.000','+5,000')} <span class="c">${RC*5} ${lng('altın','gold')}</span></button></div></div>
  <div class="sec garsec"><h3>${lng('Garnizon','Garrison')} <span class="cap">${fmtK(p.t)} / ${fmtK(gm)}</span></h3>
   <div class="hint">${lng('Garnizon eyaleti korur ama sefere çıkamaz. Maaşı sahra ordusunun yarısıdır.','A garrison guards its province but cannot go on campaign. Its pay is half that of a field army.')}</div><div class="acts">
   <button class="btn" data-act="grec" ${room<100||F.gold<RC*gn/1000||F.mp<gn?'disabled':''}>${lng('Garnizonu güçlendir','Reinforce')} ${gn>=100?'+'+gn.toLocaleString(lng('tr','en')):''} <span class="c">${room<100?lng('dolu','full'):Math.ceil(RC*gn/1000)+lng(' altın',' gold')}</span></button>
   <button class="btn" data-act="gdisband" ${p.t<=garMin(i)?'disabled':''}>${confirmKey===ck?lng('Emin misin? Azalt','Sure? Reduce'):lng('Garnizonu azalt','Reduce')}</button></div></div>`;}});

PANEL_SECTIONS.push({id:'build',order:60,when:c=>c.tgt<0&&c.mine,html(c){const {F,p}=c;
 return `
  <div class="sec"><h3>${lng('İnşa et','Build')}</h3><div class="acts">
   <button class="btn" data-act="bdev" ${p.dev>=12||F.gold<25*p.dev?'disabled':''}>${lng('İmar','Develop')} +1 <span class="c">${25*p.dev}</span></button>
   <button class="btn" data-act="bmkt" ${p.mkt||F.gold<60?'disabled':''}>${p.mkt?lng('Pazar var','Market built'):lng('Pazar','Market')} <span class="c">${p.mkt?'✓':'60'}</span></button>
   <button class="btn" data-act="bfort" ${p.fort>=5||F.gold<40*(p.fort+1)?'disabled':''}>${lng('Kale','Walls')} ${p.fort+1} <span class="c">${p.fort>=5?lng('azami','max'):40*(p.fort+1)}</span></button>
   <button class="btn" data-act="bbrk" ${p.brk||F.gold<50?'disabled':''}>${p.brk?lng('Kışla var','Barracks built'):lng('Kışla','Barracks')} <span class="c">${p.brk?'✓':'50'}</span></button></div>
   <div class="hint" style="margin-top:6px">${lng('Pazar geliri %50 artırır, kışla insan gücünü iki katına çıkarır. Kale ve yerel milis savunmaya katılır; kale ve gelişim garnizonun sığacağı asker sayısını da artırır.','A market raises income by 50%, barracks double manpower. Walls and the local militia join the defence; walls and development also let the province hold a larger garrison.')}</div></div>`;}});
PANEL_SECTIONS.push({id:'foreign',order:70,when:c=>c.tgt<0&&!c.mine,html(c){
 const f=c.f,o=c.p.o,dp=defPower(sel,f);
 let h=`<div class="meta"><span>${lng('Hükümdar','Ruler')} <b>${esc(rulerName(o))}</b></span><span>${lng('İlişki','Relations')} <b>${getOp(f,o)}</b></span><span>${lng('Ordu','Army')} <b>${fmtK(strength(o))}</b></span><span>${lng('Tahmini savunma','Est. defence')} <b>${fmtK(dp)}</b></span></div>`;
 if(!atWar(f,o)){const ck='war:'+o;
  if(isAlly(f,o))h+=`<div class="hint">${lng(`${FAC[o].s} senin müttefikin. Orduların bu topraklardan geçebilir.`,`${FAC[o].s} is your ally. Your armies may cross these lands.`)}</div>`;
  else if(inTruce(f,o))h+=`<div class="hint">${lng(`Ateşkes sürüyor, ${S.truce[key(f,o)]-S.turn} tur boyunca savaş ilan edemezsin.`,`A truce holds: you cannot declare war for ${S.truce[key(f,o)]-S.turn} more turns.`)}</div>`;
  else h+=`<div class="hint">${lng('Bu eyalete saldırmak için önce savaş ilan etmelisin.','To attack this province you must first declare war.')}</div><button class="btn danger" data-act="dwar" data-f="${o}">${confirmKey===ck?lng('Emin misin? Savaş ilan et','Sure? Declare war'):lng('Savaş ilan et','Declare war')}</button>`;}
 else h+=`<div class="hint">${lng('Savaştasın. Komşu eyaletteki ordunu seçip buraya dokunarak saldır. Garnizonlar sefere çıkmaz; saldırı için sahra ordusu gerekir.','You are at war. Select your army in a neighbouring province and tap here to attack. Garrisons do not march; an attack needs a field army.')}</div>`;
 return h;}});

/* ---- actions ---- */
['amove','amerge','asplit','adisband','gdisband','grec'].forEach(a=>OVERBLOCK.add(a));
['asel','amove','grec'].forEach(a=>QUIET.add(a));
ACTS.close=()=>clearSel();
ACTS.cancel=()=>{tgt=-1;renderPanel();req();};
ACTS.asel=t=>{const a=armyById(+t.dataset.id);if(!a||a.f!==S.player)return;if(selArmy===a.id&&sel===a.loc&&tgt<0){selArmy=null;}else armSelect(a.loc,a.id);SND.play('select');renderPanel();req();};
ACTS.amove=(t,f)=>{const a=armyById(selArmy);
 if(!a||!tgtOk()){tgt=-1;toast(a?armyCanMove(a.id,tgt).reason||lng('Bu emir artık geçerli değil.','This order is no longer valid.'):lng('Önce bir ordu seç.','Select an army first.'));renderPanel();req();return;}
 const a0=a.loc,to=tgt,n0=a.n,name=armName(a),r=armyMove(a.id,to);
 if(r.kind==='none'){toast(r.reason);tgt=-1;renderPanel();req();return;}
 addFx({type:'march',a:a0,b:to,dur:r.kind==='move'?520:460,col:FAC[f].c});SND.play('march');
 if(r.kind!=='move'&&r.rep){const rep=r.rep,w=rep.win,cn=!!S.fac[f].cannon;setTimeout(()=>SND.play('battle',{win:w,cannon:cn||S.prov[to].fort>=2}),420);
  addFx({type:'boom',p:to,dur:1500,delay:440,seed:Math.random()*6,label:w?lng('Zafer!','Victory!'):lng('Püskürtüldü','Repulsed'),good:w});
  if(r.kind==='assault')toast(w?lng(`Zafer! ${PD[to].name} alındı. Kayıp: ${fmtK(rep.aLoss)}`,`Victory! ${PD[to].name} taken. Losses: ${fmtK(rep.aLoss)}`):lng(`Hücum püskürtüldü. Kayıp ${fmtK(rep.aLoss)}, düşman kaybı ${fmtK(rep.dLoss)}`,`Assault repulsed. Losses ${fmtK(rep.aLoss)}, enemy losses ${fmtK(rep.dLoss)}`),w?'good':'war');
  else toast(w?lng(`Meydan muharebesi kazanıldı! Düşman kaybı ${fmtK(rep.dLoss)}, kaybımız ${fmtK(rep.aLoss)}.${rep.surrounded?' Kuşatılan düşman ordusu yok edildi.':' Düşman geri çekildi.'}`,`Field battle won! Enemy losses ${fmtK(rep.dLoss)}, ours ${fmtK(rep.aLoss)}.${rep.surrounded?' The surrounded enemy army was destroyed.':' The enemy fell back.'}`):lng(`Meydan muharebesi kaybedildi. Kayıp ${fmtK(rep.aLoss)}, düşman kaybı ${fmtK(rep.dLoss)}.`,`Field battle lost. Losses ${fmtK(rep.aLoss)}, enemy losses ${fmtK(rep.dLoss)}.`),w?'good':'war');
  if(!armyById(a.id))toast(lng(`${name} dağıldı.`,`${name} has scattered.`),'war');}
 const still=armyById(a.id);if(still){sel=still.loc;selArmy=still.id;}else{sel=to;selArmy=null;}tgt=-1;
 if(r.kind!=='move'){checkMissions();if(S.over){save();renderAll();queueModal(showEnd);return;}}
 renderAll();};
ACTS.go=ACTS.amove; // pre-army name of the confirm button
ACTS.amerge=(t,f)=>{const a=armyById(+t.dataset.id);if(!a||a.f!==f)return;let k=0;for(const b of armyAt(a.loc,f))if(b.id!==a.id&&armyMerge(a,b))k++;
 if(k){SND.play('march');toast(lng(`Ordular birleşti: ${armName(a)} artık ${fmtK(a.n)}.`,`Armies merged: ${armName(a)} now ${fmtK(a.n)} strong.`),'good');}renderAll();};
ACTS.asplit=(t,f)=>{const a=armyById(+t.dataset.id);if(!a||a.f!==f)return;const b=armySplit(a.id);
 if(!b){toast(armyList(f).length>=armyCap(f)?lng(`Ordu sınırına ulaştın (${armyCap(f)}). Yeni ordu için daha çok eyalete hükmetmelisin.`,`You have reached the army limit (${armyCap(f)}). Rule more provinces to field another army.`):lng('Bu ordu bölünemeyecek kadar küçük.','This army is too small to split.'));return;}
 selArmy=b.id;SND.play('march');toast(lng(`${armName(b)} kuruldu: ${fmtK(b.n)} asker.`,`${armName(b)} formed: ${fmtK(b.n)} troops.`),'good');renderAll();};
ACTS.adisband=(t,f)=>{const a=armyById(+t.dataset.id);if(!a||a.f!==f)return;const ck='dis:'+a.id;if(confirmKey!==ck){confirmKey=ck;renderPanel();return;}confirmKey='';
 const name=armName(a),back=armyDisband(a.id);SND.play('coin');toast(lng(`${name} dağıtıldı. ${fmtK(back)} kişi köyüne döndü ve yeniden askere yazılabilir.`,`${name} disbanded. ${fmtK(back)} men went home to their villages and can be called up again.`),'good');renderAll();};
ACTS.gdisband=(t,f)=>{const i=sel,p=S.prov[i];if(!p||p.o!==f)return;const ck='gdis:'+i;if(confirmKey!==ck){confirmKey=ck;renderPanel();return;}confirmKey='';
 const n=garDisband(i);if(n){SND.play('coin');toast(lng(`${PD[i].name} garnizonundan ${fmtK(n)} asker terhis edildi.`,`${fmtK(n)} troops released from the ${PD[i].name} garrison.`),'good');}renderAll();};
ACTS.grec=(t,f,F)=>{if(sel<0||S.prov[sel].o!==f)return;const r=armRecruit(f,sel,1000,{gar:true});if(!r.to){toast(r.reason);return;}SND.play('recruit');renderAll();};
ACTS.rec1=ACTS.rec5=(t,f,F)=>{if(sel<0)return;const n=t.dataset.act==='rec1'?1000:5000,r=armRecruit(f,sel,n,{army:selArmy});
 if(!r.to){toast(r.reason);return;}if(r.army)selArmy=r.army.id;SND.play('recruit');
 if(r.to==='new')toast(lng(`${armName(r.army)} kuruldu. Yeni askerler bu mevsim eğitimde, gelecek mevsim yürüyebilir.`,`${armName(r.army)} formed. The new troops train this season and can march next season.`),'good');else if(r.to==='gar')toast(lng(`${fmtK(r.n)} asker garnizona yazıldı.`,`${fmtK(r.n)} troops joined the garrison.`));renderAll();};
ACTS.bdev=(t,f,F)=>{const p=S.prov[sel],c=25*p.dev;if(F.gold<c||p.dev>=12)return;F.gold-=c;p.dev++;SND.play('build');renderAll();};
ACTS.bmkt=(t,f,F)=>{const p=S.prov[sel];if(p.mkt||F.gold<60)return;F.gold-=60;p.mkt=1;SND.play('build');renderAll();};
ACTS.bbrk=(t,f,F)=>{const p=S.prov[sel];if(p.brk||F.gold<50)return;F.gold-=50;p.brk=1;SND.play('build');renderAll();};
ACTS.bfort=(t,f,F)=>{const p=S.prov[sel],c=40*(p.fort+1);if(p.fort>=5||F.gold<c)return;F.gold-=c;p.fort++;SND.play('build');renderAll();};
ACTS.dwar=(t,f)=>{const o=t.dataset.f,ck='war:'+o;if(confirmKey!==ck){confirmKey=ck;renderPanel();return;}confirmKey='';declareWar(f,o);SND.play('war');toast(lng(`${FAC[o].s} devletine savaş ilan ettin.`,`You declared war on ${FAC[o].s}.`),'war');renderAll();};
