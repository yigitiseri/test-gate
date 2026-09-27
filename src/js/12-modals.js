/* ---------------- modals ---------------- */
const modalQ=[];let evChoices=[],evTitle='',evPend=false;
function openModal(html){$('#modal .card').innerHTML='<div class="band"></div><div class="in">'+html+'</div>';$('#modal').hidden=false;$('#modal .card').scrollTop=0;}
function closeModal(){$('#modal').hidden=true;confirmKey='';if(modalQ.length){const m=modalQ.shift();setTimeout(()=>{if($('#modal').hidden)m();else modalQ.unshift(m);},60);}}
function queueModal(fn){if($('#modal').hidden)fn();else modalQ.push(fn);}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal'&&!$('#modal .ev')&&!$('#modal .endm'))closeModal();});
function eventModal(ev){evChoices=ev.ch;evTitle=ev.t;evPend=!!ev.pend;SND.play(/Fethedildi/.test(ev.t)?'fanfare':'event');
 {const y=START_YEAR+Math.floor(S.turn/4);ev={...ev,e:`${ev.e||''} · ${roman(y)} · ${hijri(y)} H`};}
 openModal(`${S.player?`<div class="seal">${shield(S.player)}</div>`:''}<div class="ev eyebrow">${esc(ev.e||'')}</div><h2>${esc(ev.t)}</h2><p class="lead">${esc(ev.d)}</p>
 <div class="choices">${ev.ch.map((c,k)=>`<button class="btn ${k===0?'primary':''}" style="justify-content:center" data-act="ev" data-k="${k}" ${c.dis?'disabled':''}>${esc(c.l)}</button>`).join('')}</div>`);}
function btlRow(r){const pl=S.player,mineAtk=r.att===pl;const won=mineAtk?r.win:!r.win;
 const title=mineAtk?`${PD[r.to].name} seferi`:`${FAC[r.att].s} saldırısı: ${PD[r.to].name}`;
 return `<div class="btl"><span>${esc(title)}</span><span class="res2" style="color:${won?'var(--ok)':'var(--war2)'}">${won?'Zafer':'Yenilgi'}</span>
  <div class="meta"><span>Saldıran <b>${fmtK(r.n)}</b> (${FAC[r.att].s})</span><span>Savunan <b>${fmtK(r.defT)}</b></span><span>Kayıplar <b>${fmtK(r.aLoss)}</b> / <b>${fmtK(r.dLoss)}</b></span>${r.fortDmg?'<span>Kale hasar gördü</span>':''}</div></div>`;}
function showReport(){pruneOffers();
 const rep=(S.report||[]).filter(r=>r.att!==S.player);
 let h=`<div class="eyebrow">${dateStr(S.turn)}</div><h2>Mevsim Raporu</h2>`;
 if(S.offers.length)h+=`<div class="sec"><h3>Elçiler</h3><div class="rows">${S.offers.map((o,k)=>`<div class="row offer">${shield(o.f)}<div class="nm">${esc(FAC[o.f].n)}<small>Barış teklif ediyor · savaş skoru ${warScore(S.player,o.f)>=0?'+':''}${warScore(S.player,o.f)}</small></div><div class="ra"><button class="btn primary" data-act="off" data-k="${k}" data-v="1">Kabul</button><button class="btn" data-act="off" data-k="${k}" data-v="0">Reddet</button></div></div>`).join('')}</div></div>`;
 if(rep.length)h+=`<div class="sec"><h3>Muharebeler</h3><div class="rows">${rep.map(btlRow).join('')}</div></div>`;
 if(S.news.length)h+=`<div class="sec"><h3>Haberler</h3><div class="logl">${S.news.map(n=>`<div><time>${dateStr(S.turn)}</time><span class="${n.k}">${esc(n.m)}</span></div>`).join('')}</div></div>`;
 h+=`<div class="foot"><button class="btn primary" data-act="mclose">Devam</button></div>`;openModal(h);
}
function showDiplo(){
 const pl=S.player,F=S.fac[pl];const nb=new Set(nbrs(pl));
 const list=FK.filter(f=>f!==pl&&alive(f)).sort((a,b)=>(atWar(pl,b)-atWar(pl,a))||(nb.has(b)-nb.has(a))||(strength(b)-strength(a)));
 const rows=list.map(f=>{const w=atWar(pl,f),al=isAlly(pl,f),tr=inTruce(pl,f),op=getOp(pl,f);let b='';
  if(w){b+=`<button class="btn" data-act="dp-peace" data-f="${f}">Barış teklif et</button><button class="btn" data-act="dp-trib" data-f="${f}">Haraç iste</button>`;}
  else{if(al)b+=`<button class="btn" data-act="dp-break" data-f="${f}">İttifakı boz</button>`;else b+=`<button class="btn" data-act="dp-ally" data-f="${f}">İttifak öner</button>`;
   b+=`<button class="btn" data-act="dp-gift" data-f="${f}" ${F.gold<50?'disabled':''}>Hediye (50)</button>`;
   if(!al&&!tr)b+=`<button class="btn danger" data-act="dp-war" data-f="${f}">${confirmKey==='dw:'+f?'Emin misin?':'Savaş ilan et'}</button>`;}
  return `<div class="row">${shield(f)}<div class="nm">${esc(FAC[f].n)}<small>${esc(FAC[f].r)}${nb.has(f)?' · komşu':''}</small></div><div>${relChip(f)}</div></div>
   <div class="row sub"><div class="meta"><span>Eyalet <b>${facProvs(f).length}</b></span><span>Ordu <b>${fmtK(strength(f))}</b></span><span>İlişki <b style="color:${op>=20?'var(--ok)':op<=-20?'var(--war2)':'inherit'}">${op>0?'+':''}${op}</b></span>${w?`<span>Savaş skoru <b>${warScore(pl,f)>=0?'+':''}${warScore(pl,f)}</b></span>`:''}<span>${esc(FAC[f].rel)}</span></div><div class="ra" style="justify-content:flex-start;margin-top:6px">${b}</div></div>`;}).join('');
 openModal(`<div class="eyebrow">Divan-ı Hümayun</div><h2>Diplomasi</h2><p class="lead" style="font-size:14px">Savaş skoru muharebe ve fetihlerle artar. Önde olduğun düşman barışa ve haraç vermeye daha yatkındır. Müttefiklerin sana savaş açan devletlere karşı yanında savaşır.</p><div class="rows">${rows}</div><div class="foot"><button class="btn primary" data-act="mclose">Kapat</button></div>`);
}
function showMissions(){
 const pl=S.player;const rows=S.mis.map((m,k)=>{const done=S.misDone[k]!=null;let prog='';
  if(m.own){const n=m.own.filter(x=>S.prov[PK[x]].o===pl).length;prog=`${n}/${m.own.length}`;}else if(m.count)prog=`${facProvs(pl).length}/${m.count}`;else if(m.gold)prog=`${Math.floor(S.fac[pl].gold)}/${m.gold}`;else if(m.hold)prog=S.turn>=m.until?'':`${m.until-S.turn} tur`;
  return `<div class="mis ${done?'done':''}"><span class="ck">${done?'✓':''}</span><div><div class="t">${esc(m.t)}</div><div class="d">${esc(m.d)}${!done&&prog?` · ${prog}`:''}</div></div><span class="r">${m.g?`+${m.g} altın`:''}${m.dev?' · imar':''}</span></div>`;}).join('');
 openModal(`<div class="eyebrow">${esc(FAC[pl].n)}</div><h2>Tarihî Hedefler</h2><div class="rows">${rows}</div>
  <p class="hint">Zafer: 1531 yılına kadar hayatta kal ve puanını büyüt ya da haritadaki eyaletlerin yarısına (${Math.ceil(NP*.5)}) hükmet.</p><div class="foot"><button class="btn primary" data-act="mclose">Kapat</button></div>`);
}
function showChron(){const l=S.log.slice().reverse().slice(0,160);
 openModal(`<div class="eyebrow">Tarih kaydı</div><h2>Vakayiname</h2><div class="logl">${l.map(e=>`<div><time>${dateStr(e.t)}</time><span class="${e.k}">${esc(e.m)}</span></div>`).join('')||'<div>Henüz kayıt yok.</div>'}</div><div class="foot"><button class="btn primary" data-act="mclose">Kapat</button></div>`);}
function showState(){const f=S.player,F=S.fac[f],inc=income(f),up=upkeep(f),ps=facProvs(f);
 const mk=ps.filter(i=>S.prov[i].mkt).length,un=ps.filter(i=>S.prov[i].un>0).length,ds=devSum(f);
 openModal(`<div class="ph">${shield(f,true)}<div><h2>${esc(FAC[f].n)}</h2><div class="sub">${esc(FAC[f].r)} · Başkent ${esc(PD[F.cap].name)}</div></div></div>
 <div class="ledger"><span>Eyalet vergileri</span><b class="pos">+${inc.toFixed(1)}</b><span>Ordu maaşları (${fmtK(strength(f))})</span><b class="neg">−${up.toFixed(1)}</b><span class="tot">Tur başına net</span><b class="tot ${inc-up>=0?'pos':'neg'}">${(inc-up>=0?'+':'')+(inc-up).toFixed(1)}</b></div>
 <div class="meta"><span>Eyalet <b>${ps.length}</b></span><span>Pazar <b>${mk}</b></span><span>Huzursuz <b>${un}</b></span><span>İnsan gücü <b>${fmtK(F.mp)}</b> / ${fmtK(ds*800)}</span><span>Topçu <b>${F.cannon?'var':'yok'}</b></span><span>Puan <b>${score(f)}</b></span><span>Zafer/yenilgi <b>${S.stats.won}/${S.stats.lost}</b></span></div>
 <div class="foot"><button class="btn primary" data-act="mclose">Kapat</button></div>`);}
