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
function showReport(){pruneOffers();
 let h=`<div class="eyebrow">${dateStr(S.turn)}</div><h2>Mevsim Raporu</h2>`;
 for(const x of bySlot(REPORT_SECTIONS)){try{h+=x.html()||'';}catch(e){console.error('report '+x.id,e);}}
 h+=`<div class="foot"><button class="btn primary" data-act="mclose">Devam</button></div>`;openModal(h);
}
REPORT_SECTIONS.push({id:'news',order:30,html:()=>S.news.length?`<div class="sec"><h3>Haberler</h3><div class="logl">${S.news.map(n=>`<div><time>${dateStr(S.turn)}</time><span class="${n.k}">${esc(n.m)}</span></div>`).join('')}</div></div>`:''});
function showChron(){const l=S.log.slice().reverse().slice(0,160);
 openModal(`<div class="eyebrow">Tarih kaydı</div><h2>Vakayiname</h2><div class="logl">${l.map(e=>`<div><time>${dateStr(e.t)}</time><span class="${e.k}">${esc(e.m)}</span></div>`).join('')||'<div>Henüz kayıt yok.</div>'}</div><div class="foot"><button class="btn primary" data-act="mclose">Kapat</button></div>`);}
function showState(){const f=S.player,F=S.fac[f];
 openModal(`<div class="ph">${shield(f,true)}<div><h2>${esc(FAC[f].n)}</h2><div class="sub">${esc(rulerName(f))} · Başkent ${esc(PD[F.cap].name)}</div></div></div>
 ${bySlot(STATE_SECTIONS).map(x=>{try{return x.html(f)||'';}catch(e){console.error('state '+x.id,e);return '';}}).join('')}
 <div class="foot"><button class="btn primary" data-act="mclose">Kapat</button></div>`);}
STATE_SECTIONS.push({id:'ledger',order:10,html(f){const rows=econRows(f);let inc=0,up=0;for(const e of rows){if(e.k==='inc')inc+=e.v;else if(e.k==='exp')up+=e.v;}
 return `<div class="ledger">${rows.map(e=>e.k==='inc'?`<span>${esc(e.l)}</span><b class="pos">+${e.v.toFixed(1)}</b>`:`<span>${esc(e.l)}</span><b class="neg">−${e.v.toFixed(1)}</b>`).join('')}<span class="tot">Tur başına net</span><b class="tot ${inc-up>=0?'pos':'neg'}">${(inc-up>=0?'+':'')+(inc-up).toFixed(1)}</b></div>`;}});
STATE_SECTIONS.push({id:'meta',order:20,html(f){const F=S.fac[f],ps=facProvs(f),mk=ps.filter(i=>S.prov[i].mkt).length,un=ps.filter(i=>S.prov[i].un>0).length,ds=devSum(f);
 return `<div class="meta"><span>Eyalet <b>${ps.length}</b></span><span>Pazar <b>${mk}</b></span><span>Huzursuz <b>${un}</b></span><span>İnsan gücü <b>${fmtK(F.mp)}</b> / ${fmtK(ds*800)}</span><span>Topçu <b>${F.cannon?'var':'yok'}</b></span><span>Puan <b>${score(f)}</b></span><span>Zafer/yenilgi <b>${S.stats.won}/${S.stats.lost}</b></span></div>`;}});
ACTS.ev=t=>{const c=evChoices[+t.dataset.k];if(evPend){delete S.pendEv;evPend=false;}closeModal();if(c&&c.f)c.f();if(c&&c.l)addLog(`${evTitle}: ${c.l}`,'info');renderAll();};
ACTS.mclose=()=>closeModal();
ACTS.state=()=>showState();
ACTS.chron=()=>showChron();
