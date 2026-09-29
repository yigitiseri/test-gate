/* =====================================================================
   DIPLOMACY UI (Track B): Divan, peace offers, battle report rows
   ===================================================================== */
function btlRow(r){const pl=S.player,mineAtk=r.att===pl;const won=mineAtk?r.win:!r.win,fld=r.kind==='field';
 const title=mineAtk?`${PD[r.to].name} ${fld?'meydan muharebesi':'seferi'}`:`${FAC[r.att].s} ${fld?'ordusuyla meydan muharebesi':'saldırısı'}: ${PD[r.to].name}`;
 const end=fld?(r.surrounded?'<span>Kuşatılan ordu yok edildi</span>':r.win&&r.retreat!=null?`<span>Yenilen ordu ${esc(PD[r.retreat].name)} yönüne çekildi</span>`:''):(r.win?'<span>Eyalet el değiştirdi</span>':'');
 return `<div class="btl"><span>${esc(title)}</span><span class="res2" style="color:${won?'var(--ok)':'var(--war2)'}">${won?'Zafer':'Yenilgi'}</span>
  <div class="meta"><span>Saldıran <b>${fmtK(r.n)}</b> (${FAC[r.att].s})</span><span>${fld?'Savunan ordu':'Savunan garnizon'} <b>${fmtK(r.defT)}</b></span><span>Kayıplar <b>${fmtK(r.aLoss)}</b> / <b>${fmtK(r.dLoss)}</b></span>${r.fortDmg?'<span>Kale hasar gördü</span>':''}${end}</div></div>`;}
REPORT_SECTIONS.push({id:'offers',order:10,html:()=>S.offers.length?`<div class="sec"><h3>Elçiler</h3><div class="rows">${S.offers.map((o,k)=>`<div class="row offer">${shield(o.f)}<div class="nm">${esc(FAC[o.f].n)}<small>Barış teklif ediyor · savaş skoru ${warScore(S.player,o.f)>=0?'+':''}${warScore(S.player,o.f)}</small></div><div class="ra"><button class="btn primary" data-act="off" data-k="${k}" data-v="1">Kabul</button><button class="btn" data-act="off" data-k="${k}" data-v="0">Reddet</button></div></div>`).join('')}</div></div>`:''});
REPORT_SECTIONS.push({id:'battles',order:20,html(){const rep=(S.report||[]).filter(r=>r.att!==S.player);return rep.length?`<div class="sec"><h3>Muharebeler</h3><div class="rows">${rep.map(btlRow).join('')}</div></div>`:'';}});
function showDiplo(){
 const pl=S.player;const nb=new Set(nbrs(pl));
 const list=FK.filter(f=>f!==pl&&alive(f)).sort((a,b)=>(atWar(pl,b)-atWar(pl,a))||(nb.has(b)-nb.has(a))||(strength(b)-strength(a)));
 const parts=bySlot(DIPLO_ROW),cat=(f,k)=>parts.map(x=>{try{return x[k]?x[k](f)||'':'';}catch(e){console.error('diplo '+x.id,e);return '';}}).join('');
 const rows=list.map(f=>`<div class="row">${shield(f)}<div class="nm">${esc(FAC[f].n)}<small>${esc(rulerName(f))}${nb.has(f)?' · komşu':''}</small></div><div>${relChip(f)}</div></div>
   <div class="row sub"><div class="meta">${cat(f,'meta')}</div><div class="ra" style="justify-content:flex-start;margin-top:6px">${cat(f,'buttons')}</div></div>`).join('');
 openModal(`<div class="eyebrow">Divan-ı Hümayun</div><h2>Diplomasi</h2><p class="lead" style="font-size:14px">Savaş skoru muharebe ve fetihlerle artar. Önde olduğun düşman barışa ve haraç vermeye daha yatkındır. Müttefiklerin sana savaş açan devletlere karşı yanında savaşır.</p><div class="rows">${rows}</div><div class="foot"><button class="btn primary" data-act="mclose">Kapat</button></div>`);
}
DIPLO_ROW.push({id:'core',order:10,
 meta(f){const pl=S.player,w=atWar(pl,f),op=getOp(pl,f);return `<span>Eyalet <b>${facProvs(f).length}</b></span><span>Ordu <b>${fmtK(strength(f))}</b></span><span>İlişki <b style="color:${op>=20?'var(--ok)':op<=-20?'var(--war2)':'inherit'}">${op>0?'+':''}${op}</b></span>${w?`<span>Savaş skoru <b>${warScore(pl,f)>=0?'+':''}${warScore(pl,f)}</b></span>`:''}<span>${esc(FAC[f].rel)}</span>`;},
 buttons(f){const pl=S.player,F=S.fac[pl],w=atWar(pl,f),al=isAlly(pl,f),tr=inTruce(pl,f);let b='';
  if(w){b+=`<button class="btn" data-act="dp-peace" data-f="${f}">Barış teklif et</button><button class="btn" data-act="dp-trib" data-f="${f}">Haraç iste</button>`;}
  else{if(al)b+=`<button class="btn" data-act="dp-break" data-f="${f}">İttifakı boz</button>`;else b+=`<button class="btn" data-act="dp-ally" data-f="${f}">İttifak öner</button>`;
   b+=`<button class="btn" data-act="dp-gift" data-f="${f}" ${F.gold<50?'disabled':''}>Hediye (50)</button>`;
   if(!al&&!tr)b+=`<button class="btn danger" data-act="dp-war" data-f="${f}">${confirmKey==='dw:'+f?'Emin misin?':'Savaş ilan et'}</button>`;}
  return b;}});

ACTS.diplo=()=>showDiplo();
ACTS['dp-war']=(t,f)=>{const o=t.dataset.f,ck='dw:'+o;if(confirmKey!==ck){confirmKey=ck;showDiplo();return;}confirmKey='';declareWar(f,o);SND.play('war');renderAll();showDiplo();};
ACTS['dp-peace']=(t,f)=>{const o=t.dataset.f;if(!atWar(f,o))return;if(aiAcceptPeace(o,f)){makePeace(f,o);SND.play('peace');toast(`${FAC[o].s} barışı kabul etti.`,'good');}else{toast(`${FAC[o].s} barışı reddetti.`,'war');addOp(f,o,-5);}renderAll();showDiplo();};
ACTS['dp-trib']=(t,f,F)=>{const o=t.dataset.f;if(!atWar(f,o))return;if(aiAcceptTribute(o,f)){const g=tributeAmt(o);S.fac[o].gold=Math.max(0,S.fac[o].gold-g);F.gold+=g;makePeace(f,o);SND.play('coin');news(`${FAC[o].s} barış karşılığı ${g} altın haraç ödedi.`,'good');toast(`${FAC[o].s} ${g} altın haraç ödedi.`,'good');}else toast(tributeAmt(o)<10?`${FAC[o].s} hazinesi boş, ödeyecek haracı yok.`:`${FAC[o].s} haraç vermeyi reddetti.`,'war');renderAll();showDiplo();};
ACTS['dp-ally']=(t,f)=>{const o=t.dataset.f;if(aiAcceptAlliance(o,f)){S.ally[key(f,o)]=true;SND.play('peace');addOp(f,o,10);news(`${FAC[o].s} ile ittifak kuruldu.`,'good');toast(`${FAC[o].s} ittifakı kabul etti.`,'good');}else{toast(`${FAC[o].s} ittifak teklifini geri çevirdi.`);}renderAll();showDiplo();};
ACTS['dp-gift']=(t,f,F)=>{const o=t.dataset.f;if(F.gold<50)return;F.gold-=50;addOp(f,o,20);SND.play('coin');toast(`${FAC[o].s} hediyeni memnuniyetle karşıladı (+20 ilişki).`,'good');renderAll();showDiplo();};
ACTS['dp-break']=(t,f)=>{const o=t.dataset.f;delete S.ally[key(f,o)];addOp(f,o,-30);addLog(`${FAC[o].s} ile ittifak bozuldu.`);renderAll();showDiplo();};
ACTS.off=(t,f)=>{const k=+t.dataset.k,ok=t.dataset.v==='1',of=S.offers[k];if(!of)return;S.offers.splice(k,1);if(!offerOk(of)){pruneOffers();toast('Bu teklif artık geçerli değil.');renderAll();showReport();return;}
 if(ok&&atWar(of.f,f)){makePeace(of.f,f);SND.play('peace');toast(`${FAC[of.f].s} ile barış yapıldı.`,'good');}else if(!ok)addOp(f,of.f,-5);renderAll();showReport();};
