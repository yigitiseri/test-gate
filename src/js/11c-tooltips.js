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
const uiN=v=>(Math.round(v*10)/10).toLocaleString('tr');
const uiSign=v=>(v>=0?'+':'−')+uiN(Math.abs(v));
const uiTT=(t,body)=>`<b class="tt">${t}</b>${body}`;
const uiTipProv=el=>{const i=el&&el.dataset.i!=null?+el.dataset.i:sel;return i>=0&&i<NP?i:-1;};
TIPS.gold=()=>{const f=S.player,F=S.fac[f],rows=econRows(f);let inc=0,up=0;for(const r of rows)r.k==='inc'?inc+=r.v:up+=r.v;const net=inc-up;
 const line=r=>`<span>${esc(r.l)}</span><b class="${r.k==='inc'?'pos':'neg'}">${r.k==='inc'?'+':'−'}${uiN(r.v)}</b>`;
 let msg=net>=0?`Her mevsim hazineye <b>${uiN(net)}</b> altın girer.`:F.gold+net<0?'<b class="neg">Hazine bu tur boşalıyor.</b> Maaşını alamayan askerler kaçar. Ordunun bir kısmını dağıt ya da pazar kur.'
  :`Hazine her mevsim <b>${uiN(-net)}</b> altın eriyor; bu gidişle yaklaşık <b>${Math.max(1,Math.floor(F.gold/-net))}</b> mevsim dayanır.`;
 return uiTT('Hazine · '+Math.floor(F.gold)+' altın',`<div class="tl">${rows.filter(r=>r.k==='inc').map(line).join('')}${rows.filter(r=>r.k==='exp').map(line).join('')}<span class="tot">Mevsim başına</span><b class="tot ${net>=0?'pos':'neg'}">${uiSign(net)}</b></div><p>${msg}</p>`);};
TIPS.mp=()=>{const f=S.player,F=S.fac[f],ds=devSum(f),cap=ds*800,reg=ds*110;
 return uiTT('İnsan gücü · '+fmtK(F.mp),`<p>Askere yazılabilecek gençler. Her 1.000 asker için 1.000 kişi gerekir.</p><div class="tl"><span>Tavan</span><b>${fmtK(cap)}</b><span>Her mevsim gelen</span><b class="pos">+${fmtK(Math.min(reg,Math.max(0,cap-F.mp)))}</b></div><p>Gelişmiş eyaletler ve kışlalar daha çok genç yetiştirir.</p>`);};
TIPS.army=()=>{const f=S.player;let gar=0,fld=0,na=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)gar+=S.prov[i].t;for(const a of (S.armies||[]))if(a.f===f){fld+=a.n;na++;}
 const up=econRows(f).filter(r=>r.k==='exp').reduce((s,r)=>s+r.v,0);
 return uiTT('Ordu · '+fmtK(gar+fld),`<div class="tl"><span>Garnizonlar (eyaletlerde)</span><b>${fmtK(gar)}</b><span>Sahra orduları${na?' ('+na+')':''}</span><b>${fmtK(fld)}</b><span>Maaşlar, mevsim başına</span><b class="neg">−${uiN(up)}</b></div><p>Garnizon bulunduğu şehri korur. Sahra ordusu yürür, saldırır ve kuşatır.</p>`);};
TIPS.provs=()=>{const f=S.player,ps=facProvs(f),un=ps.filter(i=>S.prov[i].un>0).length,need=Math.ceil(NP*.5);
 return uiTT('Eyaletler · '+ps.length,`<div class="tl"><span>Zafer için gereken</span><b>${need}</b><span>Huzursuz eyalet</span><b class="${un?'neg':''}">${un}</b></div><p>${un?'Yeni fethedilen eyaletler bir süre huzursuzdur ve yarı vergi verir.':'Bütün eyaletlerin sakin, vergisini tam veriyor.'}</p>`);};
TIPS.wars=()=>{const f=S.player,ws=warsOf(f),al=alliesOf(f);
 const body=ws.length?`<div class="tl">${ws.map(g=>{const sc=warScore(f,g),w=S.war[key(f,g)];return `<span>${esc(FAC[g].s)} <small>${S.turn-w.t} tur</small></span><b class="${sc>=0?'pos':'neg'}">${sc>=0?'+':''}${sc}</b>`;}).join('')}</div><p>Sayılar savaş skorudur: zaferler ve fetihler artırır. Önde olduğun düşman barışa ve haraca razı olur.</p>`:'<p>Şu an kimseyle savaşta değilsin.</p>';
 return uiTT(ws.length?'Savaşlar · '+ws.length:'Barış',body+(al.length?`<p>Müttefikler: <b>${al.map(g=>esc(FAC[g].s)).join(', ')}</b></p>`:''));};
TIPS.season=()=>{const s=S.turn%4,y=START_YEAR+Math.floor(S.turn/4);
 return uiTT(`${SEASONS[s]} ${y}`,`<p>Her tur bir mevsimdir; dört tur bir yıl eder. Oyun ${START_YEAR+END_TURN/4} yılında biter.</p>${s===3?'<p><b class="neg">Kış:</b> saldıran ordular yorgun düşer (saldırı −15%).</p>':s===2?'<p>Kış yaklaşıyor; seferleri kıştan önce bitirmek iyidir.</p>':''}`);};
/** A modifier line in plain words: "Kale 3 · savunma +45%". */
function uiModLine(m){const pct=Math.round((m.m-1)*100);return `<span>${esc(m.l)}</span><b class="${(m.side==='att')===(pct>=0)?'pos':'neg'}">${m.side==='att'?'saldırı':'savunma'} ${pct>=0?'+':'−'}${Math.abs(pct)}%</b>`;}
TIPS.odds=el=>{if(typeof battleOdds!=='function')return '';const f=S.player,d=el.dataset;
 const to=d.to!=null?+d.to:tgt,from=d.from!=null?+d.from:sel;let n=d.n!=null?+d.n:(typeof amt==='number'&&amt>0?amt:(from>=0?avail(from):0));
 if(to<0||!(n>0))return '';let o;try{o=battleOdds({att:d.att||f,to,n,from});}catch(e){return '';}
 const pc=Math.round(o.p*100);
 return uiTT(`Zafer şansı · %${pc}`,`<div class="bar"><i style="width:${pc}%"></i></div><div class="tl"><span>Senin gücün</span><b>${fmtK(o.a)}</b><span>Savunma gücü</span><b>${fmtK(o.d)}</b>${o.mods.map(uiModLine).join('')}</div><p>${uiOddsWord(o.p)}. Her muharebede biraz şans vardır; kıl payı üstün ordu da yenilebilir.</p>`);};
TIPS.fort=el=>{const i=uiTipProv(el);if(i<0)return '';const p=S.prov[i];const can=S.fac[S.player].cannon;
 return uiTT('Kale · '+p.fort,`<p>${p.fort?`Surlar savunanı güçlendirir: savunma <b>+${Math.round(15*p.fort*(can?.4:1))}%</b>${can?' (topların surları kırıyor)':''}.`:'Bu şehrin suru yok.'} Her kale seviyesi ayrıca şehri koruyan halkı artırır.</p><p>Şehir düşerse kale bir kat zarar görür.</p>`);};
TIPS.dev=el=>{const i=uiTipProv(el);if(i<0)return '';const p=S.prov[i];
 return uiTT('Gelişim · '+p.dev,`<p>Şehrin büyüklüğü ve zenginliği. Vergiyi, insan gücünü ve şehri koruyan halkı artırır.</p><p>İmar ile en fazla 12'ye çıkar.</p>`);};
TIPS.garrison=el=>{const i=uiTipProv(el);if(i<0)return '';const p=S.prov[i];
 return uiTT('Garnizon · '+fmtK(p.t),`<p>Şehirde bekleyen askerler. Saldırı olursa yerel halk ve surlarla birlikte savunur.</p>${p.o===S.player?'':`<p>Tahmini toplam savunma: <b>${fmtK(defPower(i,S.player))}</b></p>`}`);};
TIPS.pinc=el=>{const i=uiTipProv(el);if(i<0)return '';const p=S.prov[i];
 return uiTT('Gelir · '+uiN(provIncome(i)),`<p>Bu eyaletin her mevsim ödediği vergi.</p><div class="tl"><span>Gelişim</span><b>${p.dev}</b><span>Pazar</span><b>${p.mkt?'+%50':'yok'}</b><span>Huzursuzluk</span><b class="${p.un>0?'neg':''}">${p.un>0?'yarı vergi':'yok'}</b></div>`);};
TIPS.unrest=el=>{const i=uiTipProv(el);if(i<0)return '';const p=S.prov[i];
 return uiTT('Huzursuzluk',`<p>Halk yeni hükümdarına henüz alışmadı: eyalet <b>${p.un}</b> tur daha yarı vergi verir.</p>`);};
TIPS.terrain=el=>{const i=uiTipProv(el);if(i<0)return '';const d=PD[i];
 return uiTT(d.mtn?'Dağlık arazi':d.des?'Çöl':'Ova',`<p>${d.mtn?'Dağ geçitleri savunanın işine yarar: savunma <b>+30%</b>.':d.des?'Susuz çöl saldıranı yorar: savunma <b>+10%</b>.':'Açık arazi: kimseye üstünlük sağlamaz.'}</p>`);};
KE.uiTip=k=>{const el=document.querySelector(`[data-tip="${k}"]`);return el&&uiTipShow(el)?uiTipEl.innerText:null;};
