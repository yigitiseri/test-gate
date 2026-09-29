/* =====================================================================
   TOOLTIPS (Track D): any element with data-tip="key" explains itself.
   TIPS[key](el) -> HTML (null/'' = nothing to say). Any track may add providers.
   Desktop: hover (short delay). Touch: tap on a plain element, long-press on a button
   (the click after a long-press is swallowed, so peeking never fires the button).
   ===================================================================== */
const uiTipEl=document.createElement('div');uiTipEl.id='uiTip';uiTipEl.setAttribute('role','tooltip');uiTipEl.hidden=true;document.body.appendChild(uiTipEl);
let uiTipFor=null,uiTipT=0,uiLP=null,uiLPfired=false;
function uiTipShow(el){const k=el.dataset.tip,fn=TIPS[k];if(!fn||!S||!S.player)return false;let h='';
 try{h=fn(el)||'';}catch(e){console.error('tip '+k,e);return false;}if(!h)return false;
 uiTipEl.innerHTML=h;uiTipEl.hidden=false;uiTipFor=el;uiTipPos(el);return true;}
function uiTipPos(el){const r=el.getBoundingClientRect(),t=uiTipEl.getBoundingClientRect(),m=8;
 let x=r.left+r.width/2-t.width/2;x=clamp(x,m,Math.max(m,innerWidth-t.width-m));
 let y=r.bottom+m;if(y+t.height>innerHeight-m)y=r.top-t.height-m;y=clamp(y,m,Math.max(m,innerHeight-t.height-m));
 uiTipEl.style.left=Math.round(x)+'px';uiTipEl.style.top=Math.round(y)+'px';}
function uiTipHide(){clearTimeout(uiTipT);uiTipEl.hidden=true;uiTipFor=null;}
document.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const el=e.target.closest&&e.target.closest('[data-tip]');if(el===uiTipFor)return;
 clearTimeout(uiTipT);if(!el){if(uiTipFor)uiTipHide();return;}uiTipT=setTimeout(()=>{if(el.isConnected)uiTipShow(el);},260);});
document.addEventListener('pointerdown',e=>{clearTimeout(uiLP);const el=e.target.closest&&e.target.closest('[data-tip]');
 if(e.pointerType==='mouse'){if(!el||el!==uiTipFor)uiTipHide();return;}
 if(!el){uiTipHide();return;}
 if(el.closest('button,[data-act],input')){const x=e.clientX,y=e.clientY;uiLP=setTimeout(()=>{if(uiTipShow(el)){uiLPfired=true;if(navigator.vibrate)try{navigator.vibrate(8);}catch(z){}}},450);
  const cancel=ev=>{if(ev.type!=='pointermove'||Math.hypot(ev.clientX-x,ev.clientY-y)>10){clearTimeout(uiLP);removeEventListener('pointermove',cancel);removeEventListener('pointerup',cancel);}};
  addEventListener('pointermove',cancel);addEventListener('pointerup',cancel);return;}
 if(uiTipFor===el)uiTipHide();else uiTipShow(el);},true);
document.addEventListener('click',e=>{if(uiLPfired){uiLPfired=false;e.stopPropagation();e.preventDefault();}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')uiTipHide();});
document.addEventListener('focusin',e=>{const el=e.target.closest&&e.target.closest('[data-tip]');if(el&&el!==uiTipFor&&el.matches(':focus-visible'))uiTipShow(el);});
document.addEventListener('focusout',e=>{if(uiTipFor&&e.target===uiTipFor&&e.target.matches(':focus-visible'))uiTipHide();});
addEventListener('resize',uiTipHide);
hook('renderAll',()=>{if(uiTipFor){if(!uiTipFor.isConnected)uiTipHide();else uiTipShow(uiTipFor);}});

/* ---------- providers (plain words, no formulas) ---------- */
const uiN=v=>(Math.round(v*10)/10).toLocaleString(EN?'en':'tr');
const uiSign=v=>(v>=0?'+':'−')+uiN(Math.abs(v));
const uiTT=(t,body)=>`<b class="tt">${t}</b>${body}`;
const uiTipProv=el=>{const i=el&&el.dataset.i!=null?+el.dataset.i:sel;return i>=0&&i<NP?i:-1;};
TIPS.gold=()=>{const f=S.player,F=S.fac[f],rows=econRows(f);let inc=0,up=0;for(const r of rows)r.k==='inc'?inc+=r.v:up+=r.v;const net=inc-up;
 const line=r=>`<span>${esc(r.l)}</span><b class="${r.k==='inc'?'pos':'neg'}">${r.k==='inc'?'+':'−'}${uiN(r.v)}</b>`;
 const left=Math.max(1,Math.floor(F.gold/-net));
 let msg=net>=0?lng(`Her mevsim hazineye <b>${uiN(net)}</b> altın girer.`,`Every season <b>${uiN(net)}</b> gold flows into the treasury.`):F.gold+net<0?lng('<b class="neg">Hazine bu tur boşalıyor.</b> Maaşını alamayan askerler kaçar. Ordunun bir kısmını dağıt ya da pazar kur.','<b class="neg">The treasury runs dry this turn.</b> Soldiers who go unpaid will desert. Disband part of your army or build a market.')
  :lng(`Hazine her mevsim <b>${uiN(-net)}</b> altın eriyor; bu gidişle yaklaşık <b>${left}</b> mevsim dayanır.`,`The treasury loses <b>${uiN(-net)}</b> gold every season; at this rate it will last about <b>${left}</b> ${left===1?'season':'seasons'}.`);
 return uiTT(lng('Hazine · '+Math.floor(F.gold)+' altın','Treasury · '+Math.floor(F.gold)+' gold'),`<div class="tl">${rows.filter(r=>r.k==='inc').map(line).join('')}${rows.filter(r=>r.k==='exp').map(line).join('')}<span class="tot">${lng('Mevsim başına','Per season')}</span><b class="tot ${net>=0?'pos':'neg'}">${uiSign(net)}</b></div><p>${msg}</p>`);};
TIPS.mp=()=>{const f=S.player,F=S.fac[f],ds=devSum(f),cap=ds*800,reg=ds*110;
 return uiTT(lng('İnsan gücü · ','Manpower · ')+fmtK(F.mp),`<p>${lng('Askere yazılabilecek gençler. Her 1.000 asker için 1.000 kişi gerekir.','Young men ready to be enlisted. Every thousand soldiers takes a thousand of them.')}</p><div class="tl"><span>${lng('Tavan','Limit')}</span><b>${fmtK(cap)}</b><span>${lng('Her mevsim gelen','New each season')}</span><b class="pos">+${fmtK(Math.min(reg,Math.max(0,cap-F.mp)))}</b></div><p>${lng('Gelişmiş eyaletler ve kışlalar daha çok genç yetiştirir.','Developed provinces and barracks raise more young men.')}</p>`);};
TIPS.army=()=>{const f=S.player;let gar=0,fld=0,na=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)gar+=S.prov[i].t;for(const a of (S.armies||[]))if(a.f===f){fld+=a.n;na++;}
 const up=econRows(f).filter(r=>r.k==='exp').reduce((s,r)=>s+r.v,0);
 return uiTT(lng('Ordu · ','Army · ')+fmtK(gar+fld),`<div class="tl"><span>${lng('Garnizonlar (eyaletlerde)','Garrisons (in provinces)')}</span><b>${fmtK(gar)}</b><span>${lng('Sahra orduları','Field armies')}${na?' ('+na+')':''}</span><b>${fmtK(fld)}</b><span>${lng('Maaşlar, mevsim başına','Wages per season')}</span><b class="neg">−${uiN(up)}</b></div><p>${lng('Garnizon bulunduğu şehri korur. Sahra ordusu yürür, saldırır ve kuşatır.','A garrison guards the city it sits in. A field army marches, attacks and lays siege.')}</p>`);};
TIPS.provs=()=>{const f=S.player,ps=facProvs(f),un=ps.filter(i=>S.prov[i].un>0).length,need=Math.ceil(NP*.5);
 return uiTT(lng('Eyaletler · ','Provinces · ')+ps.length,`<div class="tl"><span>${lng('Zafer için gereken','Needed for victory')}</span><b>${need}</b><span>${lng('Huzursuz eyalet','Restless provinces')}</span><b class="${un?'neg':''}">${un}</b></div><p>${un?lng('Yeni fethedilen eyaletler bir süre huzursuzdur ve yarı vergi verir.','Newly conquered provinces stay restless for a while and pay half their taxes.'):lng('Bütün eyaletlerin sakin, vergisini tam veriyor.','All your provinces are calm and pay their taxes in full.')}</p>`);};
TIPS.wars=()=>{const f=S.player,ws=warsOf(f),al=alliesOf(f);
 const body=ws.length?`<div class="tl">${ws.map(g=>{const sc=warScore(f,g),w=S.war[key(f,g)];return `<span>${esc(FAC[g].s)} <small>${S.turn-w.t} ${lng('tur',S.turn-w.t===1?'turn':'turns')}</small></span><b class="${sc>=0?'pos':'neg'}">${sc>=0?'+':''}${sc}</b>`;}).join('')}</div><p>${lng('Sayılar savaş skorudur: zaferler ve fetihler artırır. Önde olduğun düşman barışa ve haraca razı olur.','These are the war scores: victories and conquests raise them. An enemy you are ahead of will agree to peace and tribute.')}</p>`:lng('<p>Şu an kimseyle savaşta değilsin.</p>','<p>You are not at war with anyone right now.</p>');
 return uiTT(ws.length?lng('Savaşlar · ','Wars · ')+ws.length:lng('Barış','Peace'),body+(al.length?`<p>${lng('Müttefikler','Allies')}: <b>${al.map(g=>esc(FAC[g].s)).join(', ')}</b></p>`:''));};
TIPS.season=()=>{const s=S.turn%4,y=START_YEAR+Math.floor(S.turn/4);
 return uiTT(`${SEASONS[s]} ${y}`,`<p>${lng(`Her tur bir mevsimdir; dört tur bir yıl eder. Oyun ${START_YEAR+END_TURN/4} yılında biter.`,`Each turn is one season; four turns make a year. The game ends in ${START_YEAR+END_TURN/4}.`)}</p>${s===3?lng('<p><b class="neg">Kış:</b> saldıran ordular yorgun düşer (saldırı −15%).</p>','<p><b class="neg">Winter:</b> attacking armies are worn out (attack −15%).</p>'):s===2?lng('<p>Kış yaklaşıyor; seferleri kıştan önce bitirmek iyidir.</p>','<p>Winter is coming; it is wise to finish your campaigns before it arrives.</p>'):''}`);};
/** A modifier line in plain words: "Kale 3 · savunma +45%". */
function uiModLine(m){const pct=Math.round((m.m-1)*100);return `<span>${esc(m.l)}</span><b class="${(m.side==='att')===(pct>=0)?'pos':'neg'}">${m.side==='att'?lng('saldırı','attack'):lng('savunma','defence')} ${pct>=0?'+':'−'}${Math.abs(pct)}%</b>`;}
TIPS.odds=el=>{if(typeof battleOdds!=='function')return '';const f=S.player,d=el.dataset;
 const to=d.to!=null?+d.to:tgt,from=d.from!=null?+d.from:sel;let n=d.n!=null?+d.n:(typeof amt==='number'&&amt>0?amt:(from>=0?avail(from):0));
 if(to<0||!(n>0))return '';let o;try{o=battleOdds({att:d.att||f,to,n,from});}catch(e){return '';}
 const pc=Math.round(o.p*100);
 return uiTT(lng(`Zafer şansı · %${pc}`,`Chance of victory · ${pc}%`),`<div class="bar"><i style="width:${pc}%"></i></div><div class="tl"><span>${lng('Senin gücün','Your strength')}</span><b>${fmtK(o.a)}</b><span>${lng('Savunma gücü','Defence strength')}</span><b>${fmtK(o.d)}</b>${o.mods.map(uiModLine).join('')}</div><p>${uiOddsWord(o.p)}. ${lng('Her muharebede biraz şans vardır; kıl payı üstün ordu da yenilebilir.','Every battle has some luck in it; an army that is only just stronger can still be beaten.')}</p>`);};
TIPS.fort=el=>{const i=uiTipProv(el);if(i<0)return '';const p=S.prov[i];const can=S.fac[S.player].cannon;
 const fb=Math.round(15*p.fort*(can?.4:1));
 return uiTT(lng('Kale · ','Fortress · ')+p.fort,`<p>${p.fort?lng(`Surlar savunanı güçlendirir: savunma <b>+${fb}%</b>${can?' (topların surları kırıyor)':''}.`,`Walls strengthen the defender: defence <b>+${fb}%</b>${can?' (your cannon are breaking them)':''}.`):lng('Bu şehrin suru yok.','This city has no walls.')} ${lng('Her kale seviyesi ayrıca şehri koruyan halkı artırır.','Each fortress level also brings more townsfolk to the city\'s defence.')}</p><p>${lng('Şehir düşerse kale bir kat zarar görür.','If the city falls, the fortress loses a level.')}</p>`);};
TIPS.dev=el=>{const i=uiTipProv(el);if(i<0)return '';const p=S.prov[i];
 return uiTT(lng('Gelişim · ','Development · ')+p.dev,lng(`<p>Şehrin büyüklüğü ve zenginliği. Vergiyi, insan gücünü ve şehri koruyan halkı artırır.</p><p>İmar ile en fazla 12'ye çıkar.</p>`,`<p>The size and wealth of the city. It raises taxes, manpower and the number of townsfolk who defend it.</p><p>Developing can raise it as high as 12.</p>`));};
TIPS.garrison=el=>{const i=uiTipProv(el);if(i<0)return '';const p=S.prov[i];
 return uiTT(lng('Garnizon · ','Garrison · ')+fmtK(p.t),`<p>${lng('Şehirde bekleyen askerler. Saldırı olursa yerel halk ve surlarla birlikte savunur.','Soldiers stationed in the city. If it is attacked, they defend it together with the townsfolk and the walls.')}</p>${p.o===S.player?'':`<p>${lng('Tahmini toplam savunma','Estimated total defence')}: <b>${fmtK(defPower(i,S.player))}</b></p>`}`);};
TIPS.pinc=el=>{const i=uiTipProv(el);if(i<0)return '';const p=S.prov[i];
 return uiTT(lng('Gelir · ','Income · ')+uiN(provIncome(i)),`<p>${lng('Bu eyaletin her mevsim ödediği vergi.','The tax this province pays every season.')}</p><div class="tl"><span>${lng('Gelişim','Development')}</span><b>${p.dev}</b><span>${lng('Pazar','Market')}</span><b>${p.mkt?lng('+%50','+50%'):lng('yok','none')}</b><span>${lng('Huzursuzluk','Unrest')}</span><b class="${p.un>0?'neg':''}">${p.un>0?lng('yarı vergi','half tax'):lng('yok','none')}</b></div>`);};
TIPS.unrest=el=>{const i=uiTipProv(el);if(i<0)return '';const p=S.prov[i];
 return uiTT(lng('Huzursuzluk','Unrest'),lng(`<p>Halk yeni hükümdarına henüz alışmadı: eyalet <b>${p.un}</b> tur daha yarı vergi verir.</p>`,`<p>The people are not yet used to their new ruler: the province pays half its taxes for <b>${p.un}</b> more ${p.un===1?'turn':'turns'}.</p>`));};
TIPS.terrain=el=>{const i=uiTipProv(el);if(i<0)return '';const d=PD[i];
 return uiTT(d.mtn?lng('Dağlık arazi','Mountains'):d.des?lng('Çöl','Desert'):lng('Ova','Plains'),`<p>${d.mtn?lng('Dağ geçitleri savunanın işine yarar: savunma <b>+30%</b>.','Mountain passes favour the defender: defence <b>+30%</b>.'):d.des?lng('Susuz çöl saldıranı yorar: savunma <b>+10%</b>.','The waterless desert wears the attacker down: defence <b>+10%</b>.'):lng('Açık arazi: kimseye üstünlük sağlamaz.','Open ground: it gives no one the advantage.')}</p>`);};
KE.uiTip=k=>{const el=document.querySelector(`[data-tip="${k}"]`);return el&&uiTipShow(el)?uiTipEl.innerText:null;};
