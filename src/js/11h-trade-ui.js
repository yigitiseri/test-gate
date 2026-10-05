/* =====================================================================
   TRADE AND GREAT WORKS UI (Track T, Wave 3)
   Province panel: "Ticaret yolu" (slot 62, any trade stop) and "Büyük eserler" (slot 64: the works that
   stand here, the building site with its progress, and what the player may raise here).
   Modal "Ticaret ve Büyük Eserler" (ACT trades): every road with its flow and holders, the player's works
   and sites, the famous works of the world. State book section (slot 25). Tooltips: tmode, trroute, wkt.
   Plain words and percentages only, no formulas.
   ===================================================================== */
const trdPct=v=>(v>=0?'+':'−')+lng('%'+Math.abs(Math.round(v*100)),Math.abs(Math.round(v*100))+'%');
const trdN=v=>(Math.round(v*10)/10).toLocaleString(EN?'en':'tr');
/** Status word and colour of a road's flow. */
function trdWord(fl){return fl>=1.15?[lng('Canlı','Thriving'),'var(--ok)']:fl>=.9?[lng('Olağan','Steady'),'#6e4d27']:fl>=.6?[lng('Yavaş','Sluggish'),'#a0521a']:[lng('Tıkanmış','Choked'),'var(--war2)'];}
const trdGlyphU={};
/** Small inline picture of road r's glyph (the map sprite as an image). */
function trdGlyph(r){const k=r.g;if(!trdGlyphU[k]){try{trdGlyphU[k]=trdSprite(k,18).toDataURL();}catch(e){trdGlyphU[k]='';}}return trdGlyphU[k]?`<img class="trg" src="${trdGlyphU[k]}" alt="" width="18" height="18">`:'';}
/** Plain-words explanation of road r (tooltip and modal). */
function trdRouteTip(r,cut){const F=trdFlow(r),[w,cl]=trdWord(F.flow),pl=S.player;let mine=0,n=0;
 r.stops.forEach((q,k)=>{if(ctl(q.i)===pl){mine+=trdStopVal(r,k,F.flow);n++;}});
 let h=`<b class="tt">${esc(tx(r.n))} · <span style="color:${cl}">${w}</span></b><p>${esc(tx(r.d))}</p><div class="tl"><span>${lng('Her mevsim taşınan mal','Goods carried each season')}</span><b>${lng(`~${trdN(r.v*F.flow)} altın`,`~${trdN(r.v*F.flow)} gold`)}</b>`;
 if(n)h+=`<span>${lng(`Senin payın (${n} durak)`,`Your share (${n} ${n===1?'stop':'stops'})`)}</span><b class="pos">+${trdN(mine)}</b>`;
 for(const y of F.why)h+=`<span>${esc(y.l)}</span><b class="${y.v>=0?'pos':'neg'}">${trdPct(y.v)}</b>`;
 h+='</div>';
 if(cut)h+=`<p class="neg">${lng('Burada iki düşman devletin sınırı yolu kesiyor: kervanlar geçemiyor.','Here the border of two realms at war cuts the road: the caravans cannot pass.')}</p>`;
 return h+`<p>${lng('Her durağı tutan devlet kendi payını alır. Pazarlar ve kervansaraylar yolu canlandırır; savaş, kuşatma ve işgal kervanları durdurur.','Whoever holds a stop takes its share. Markets and caravanserais bring the road to life; war, sieges and occupation stop the caravans.')}</p>`;}
/** Status line of a building site. */
function wkSiteLine(w){const p=S.prov[w.i],left=wkLeft(w),paused=p.ctl||(typeof siegeAt==='function'&&siegeAt(w.i));
 return paused?lng('İnşaat durdu: şehir düşman elinde ya da kuşatmada.','Work has stopped: the city is besieged or in enemy hands.'):lng(`İnşa ediliyor: ~${left} tur kaldı.`,`Under construction: ~${left} ${left===1?'turn':'turns'} to go.`);}
/** Tooltip for the works of one province (map medallion). */
function trdWorkTip(L){return L.map(w=>`<b class="tt">${esc(wkName(w))}</b>${w.d?`<p>${esc(wkEff(w.k))}</p>`:`<p>${esc(wkSiteLine(w))}</p><p>${lng('Bitince:','When finished:')} ${esc(wkEff(w.k))}</p>`}`).join('');}
function wkBar(w){const pc=Math.round(clamp(w.p/w.n,0,1)*100);return `<div class="wkbar" role="img" aria-label="${lng(`İnşaat yüzde ${pc} tamam`,`Construction ${pc} percent complete`)}"><i style="width:${pc}%"></i></div>`;}
/* ---- province panel ---- */
PANEL_SECTIONS.push({id:'trade',order:62,when:c=>c.tgt<0&&trdIsStop(c.i),html(c){const pl=c.f,holder=ctl(c.i);
 let h=`<div class="sec trsec"><h3>${lng('Ticaret yolu','Trade road')}</h3>`;
 for(const m of TRD_AT[c.i]){const r=m.r,F=trdFlow(r),[w,cl]=trdWord(F.flow),v=trdStopVal(r,m.k,F.flow);
  h+=`<div class="trrow" data-tip="trroute" data-r="${r.id}" tabindex="0"><span class="trn">${trdGlyph(r)}${esc(tx(r.n))}</span><span class="trw" style="color:${cl}">${w}</span></div>
   <div class="hint">${holder===pl?lng(`Bu durak her mevsim hazinene <b>${trdN(v)}</b> altın getiriyor.`,`This stop brings <b>${trdN(v)}</b> gold into your treasury every season.`):lng(`Bu durak her mevsim ${esc(FAC[holder].s)} hazinesine ${trdN(v)} altın getiriyor.`,`This stop brings ${trdN(v)} gold a season to the treasury of ${esc(FAC[holder].s)}.`)}${F.why.filter(y=>y.v<0).length?' '+F.why.filter(y=>y.v<0).map(y=>`${esc(y.l)} ${trdPct(y.v)}`).join(' · '):''}</div>`;}
 h+=`<div class="acts"><button class="btn" data-act="tmode" aria-pressed="${trdModeOn()}">${trdModeOn()?lng('Siyasi harita','Political map'):lng('Ticaret haritası','Trade map')}</button><button class="btn" data-act="trades">${lng('Bütün yollar','All roads')}</button></div>`;
 return h+'</div>';}});
PANEL_SECTIONS.push({id:'works',order:64,when:c=>c.tgt<0&&(wkAt(c.i).length>0||(c.mine&&!c.p.ctl)),html(c){const f=c.f,here=wkAt(c.i);
 let h=`<div class="sec wksec"><h3>${lng('Büyük eserler','Great works')}</h3>`;
 for(const w of here){h+=`<div class="wkrow${w.d?'':' site'}" data-tip="wkt" data-k="${w.k}" data-i="${c.i}" tabindex="0"><b>${esc(wkName(w))}</b>`;
  h+=w.d?`<div class="hint">${esc(wkEff(w.k))}</div>`:`${wkBar(w)}<div class="hint">${esc(wkSiteLine(w))}</div>`;h+='</div>';}
 if(c.mine&&!c.p.ctl){const opts=WK_ORDER.filter(k=>wkReqOk(k,c.i)&&!here.some(w=>w.k===k)&&!(WK_TYPES[k].realm&&wkList().some(w=>w.k===k&&w.f===f&&S.prov[w.i].o===f)));
  if(opts.length){h+=`<div class="wkopts">`;for(const k of opts){const T=WK_TYPES[k],r=wkCan(f,c.i,k),ck='wk:'+c.i+':'+k;
    h+=`<button class="btn wkb" data-act="wkbuild" data-k="${k}" data-i="${c.i}" data-tip="wkt" ${r.ok?'':'disabled'}><span>${confirmKey===ck?lng('Emin misin? Temel at','Sure? Lay the foundations'):esc(wkTypeName(k,f))}</span><span class="c">${T.cost} · ${lng(`${T.turns} tur`,`${T.turns} turns`)}</span></button>`;}
   h+=`</div>`;const bad=opts.map(k=>wkCan(f,c.i,k)).find(r=>!r.ok&&!r.gold);h+=`<div class="hint">${bad?esc(bad.why):lng('Büyük eserler pahalıdır ve birkaç mevsimde biter, ama etkileri kalıcıdır. Ayrıntı için düğmenin üzerinde dur.','Great works are costly and take several seasons, but their effect lasts. Hover or hold a button for details.')}</div>`;}
  else if(!here.length)h+=`<div class="hint">${lng('Bu eyalet büyük bir eser için henüz uygun değil. Pazar, gelişim, kale ya da bir ticaret yolu yeni seçenekler açar.','This province is not yet fit for a great work. A market, more development, walls or a trade road open new choices.')}</div>`;}
 return h+'</div>';}});
ACTS.wkbuild=(t,f)=>{const i=+t.dataset.i,k=t.dataset.k,ck='wk:'+i+':'+k;if(!S.prov[i]||S.prov[i].o!==f)return;
 const r=wkCan(f,i,k);if(!r.ok){toast(r.why);return;}if(confirmKey!==ck){confirmKey=ck;renderPanel();return;}confirmKey='';
 const w=wkStart(f,i,k);if(!w)return;SND.play('build');toast(lng(`${wkNameAt(w)} için temel atıldı: ${w.n} tur sürecek.`,`The foundations of the ${wkNameAt(w)} are laid: it will take ${w.n} turns.`),'good');renderAll();};
OVERBLOCK.add('wkbuild');QUIET.add('wkbuild');
/* ---- modal ---- */
function showTrade(){const pl=S.player,all=trdAll();let h=`<div class="eyebrow">${lng('Kervanlar, kadırgalar, çarşılar','Caravans, galleys, bazaars')}</div><h2>${lng('Ticaret ve Büyük Eserler','Trade and Great Works')}</h2>`;
 h+=`<p class="lead">${lng('Dönemin büyük ticaret yolları. Bir yolun durağını tutan devlet, oradan geçen maldan payını alır. Savaş yolu keser, pazarlar ve kervansaraylar canlandırır.','The great trade roads of the age. Whoever holds a stop on a road takes a share of the goods that pass. War cuts the roads; markets and caravanserais bring them to life.')}</p>`;
 h+=`<div class="sec"><h3>${lng('Ticaret yolları','Trade roads')} <span class="cap">${lng('Senin payın','Your share')} +${trdN(all.by[pl]||0)}</span></h3><div class="trlist">`;
 for(const r of TRD){const F=all.flows[r.id],[w,cl]=trdWord(F.flow),pc=Math.round(clamp(F.flow/BAL_T.flowMax,0,1)*100),hold={};
  r.stops.forEach((q,k)=>{const c=ctl(q.i);hold[c]=(hold[c]||0)+trdStopVal(r,k,F.flow);});
  const hs=Object.keys(hold).sort((a,b)=>hold[b]-hold[a]);
  h+=`<div class="trcard${hold[pl]?' mine':''}" data-tip="trroute" data-r="${r.id}" tabindex="0"><div class="trhd"><b>${trdGlyph(r)}${esc(tx(r.n))}</b><span style="color:${cl}">${w}</span></div>
   <div class="trbar" role="img" aria-label="${lng(`Akış: ${w}`,`Flow: ${w}`)}"><i style="width:${pc}%;background:${cl}"></i></div>
   <div class="trst">${r.stops.map(q=>esc(PD[q.i].name)).join(' · ')}</div>
   <div class="trhold">${hs.map(f=>`<span class="${f===pl?'me':''}">${shield(f)}${esc(FAC[f].s)} <b>${trdN(hold[f])}</b></span>`).join('')}</div></div>`;}
 h+=`</div></div>`;
 const mine=wkList().filter(w=>S.prov[w.i].o===pl||(!w.d&&w.f===pl)),others=wkList().filter(w=>w.d&&S.prov[w.i].o!==pl);
 h+=`<div class="sec"><h3>${lng('Büyük eserlerin','Your great works')}</h3>`;
 h+=mine.length?`<div class="wklist">${mine.map(w=>`<div class="wkrow${w.d?'':' site'}"><b>${esc(wkName(w))}</b> <small>${esc(PD[w.i].name)}</small>${w.d?`<div class="hint">${esc(wkEff(w.k))}</div>`:`${wkBar(w)}<div class="hint">${esc(wkSiteLine(w))}</div>`}</div>`).join('')}</div>`
  :`<div class="hint">${lng('Henüz büyük bir eserin yok. Bir eyaletini seç; panelin "Büyük eserler" bölümü orada neler yapılabileceğini gösterir.','You have no great works yet. Select one of your provinces: the "Great works" part of its panel shows what can be raised there.')}</div>`;
 h+=`</div>`;
 if(others.length){const by={};for(const w of others){const o=S.prov[w.i].o;(by[o]||(by[o]=[])).push(w);}
  h+=`<div class="sec"><h3>${lng('Dünyanın büyük eserleri','Great works of the world')}</h3><div class="wkworld">${Object.keys(by).map(o=>`<div>${shield(o)}<span>${by[o].map(w=>esc(wkName(w))).join(', ')}</span></div>`).join('')}</div></div>`;}
 h+=`<div class="foot"><button class="btn" data-act="trmap">${trdModeOn()?lng('Siyasi haritaya dön','Back to the political map'):lng('Ticaret haritasını aç','Open the trade map')}</button><button class="btn primary" data-act="mclose">${lng('Kapat','Close')}</button></div>`;
 openModal(h);}
ACTS.trades=()=>showTrade();
ACTS.trmap=()=>{closeModal();trdSetMode(!trdModeOn());renderPanel();};
STATE_SECTIONS.push({id:'trade',order:25,html(f){const v=trdIncome(f),n=TRD.reduce((s,r)=>s+r.stops.filter(q=>ctl(q.i)===f).length,0),w=wkList().filter(x=>x.d&&S.prov[x.i].o===f).length,st=wkSites(f).length;
 return `<div class="sec"><h3>${lng('Ticaret ve büyük eserler','Trade and great works')}</h3><div class="meta"><span>${lng('Ticaret durağı','Trade stops')} <b>${n}</b></span><span>${lng('Ticaret geliri','Trade income')} <b>+${trdN(v)}</b></span><span>${lng('Büyük eser','Great works')} <b>${w}</b></span>${st?`<span>${lng('İnşaatta','Being built')} <b>${st}</b></span>`:''}</div>
  <div class="acts"><button class="btn" data-act="trades">${lng('Ticaret yolları ve eserler','Trade roads and works')}</button></div></div>`;}});
/* ---- tooltips ---- */
TIPS.tmode=()=>uiTT(lng('Ticaret haritası','Trade map'),`<p>${lng('Dönemin büyük ticaret yollarını gösterir: kervan yolları noktalı, deniz yolları kesik çizgiyle. Durağın rengi onu tutan devleti, kırmızı çarpı savaşın kestiği yeri gösterir. Yakınlaştırınca yollar soluk olarak her haritada görünür.','Shows the great trade roads of the age: caravan roads dotted, sea routes dashed. A stop takes the colour of the realm that holds it; a red cross marks where war cuts the road. Zoom in close and the roads also show faintly on every map.')}</p>`);
TIPS.trroute=el=>{const r=TRD_BY[el.dataset.r];return r?trdRouteTip(r,false):'';};
TIPS.wkt=el=>{const k=el.dataset.k,T=WK_TYPES[k];if(!T)return '';const i=+el.dataset.i,w=wkAt(i).find(x=>x.k===k);
 if(w)return trdWorkTip([w]);const f=S.player,r=wkCan(f,i,k);
 return uiTT(esc(wkName({i,k,rel:wkRel(f)})),`<p>${esc(wkEff(k))}</p><div class="tl"><span>${lng('Maliyet','Cost')}</span><b>${T.cost} ${lng('altın','gold')}</b><span>${lng('Süre','Time')}</span><b>${lng(`${T.turns} tur`,`${T.turns} turns`)}</b></div>${T.realm?`<p>${lng('Devlet başına yalnız bir tane yapılabilir.','Only one may be raised per realm.')}</p>`:''}${r.ok?'':`<p class="neg">${esc(r.why)}</p>`}`);};
KE.tradeUI={show:()=>showTrade()};
