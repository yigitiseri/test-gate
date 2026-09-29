/* =====================================================================
   ADVISOR (Track D): the vizier's hint chip in #hud.
   ADVICE entries (any track may push): {id, prio, when(S,f) -> falsy | data, t(S,f,data) short line,
   d(S,f,data) full sentence, go?(S,f,data) jump/open UI, goL? button label}.
   The highest-priority advice that applies is shown; "Sonra" hides one advice for a few turns
   (kept in memory only, never in S). Off switch in the menu (localStorage 'ke-adv').
   ===================================================================== */
const ADVICE=[];
const uiAdvCfg={muteTurns:6,richGold:150,peaceScore:8,smallRealm:5,unrestMany:3};
const uiAdvMute={};let uiAdvCur=null,uiAdvData=null,uiAdvOn=true;
try{uiAdvOn=localStorage.getItem('ke-adv')!=='0';}catch(e){}
const uiNet=f=>income(f)-upkeep(f);
/** Select province i (and army id, if given) and bring it into view. */
function uiFocusProv(i,armyId){if(i==null||i<0)return;closeModal();sel=i;tgt=-1;if(armyId!=null)selArmy=armyId;const d=PD[i];
 centerOn(d.lx,d.ly,Math.max(curS(),Math.min(innerWidth,innerHeight)/520),!uiPhone()&&innerWidth>900?-(Math.min(380,innerWidth*.3)):0);renderPanel();req();}
ADVICE.push(
 {id:'bank',prio:100,when:(S,f)=>{const n=uiNet(f);return n<0&&S.fac[f].gold+n<0;},t:()=>lng('Hazine bu tur boşalıyor','The treasury runs dry this turn'),
  d:(S,f)=>lng(`Paşam, hazinede ${Math.floor(S.fac[f].gold)} altın kaldı ama her mevsim ${Math.round(-uiNet(f))} altın harcıyoruz. Hazine boşalınca maaşını alamayan askerler kaçar. Ordunun bir kısmını dağıt ya da barış yap.`,
   `My lord, only ${Math.floor(S.fac[f].gold)} gold is left in the treasury, yet we spend ${Math.round(-uiNet(f))} gold every season. When the treasury is empty, unpaid soldiers desert. Disband part of the army or make peace.`),
  go:()=>showState(),goL:lng('Devlet defteri','State Ledger')},
 {id:'net',prio:80,when:(S,f)=>uiNet(f)<0,t:(S,f)=>lng(`Hazine eriyor (${Math.round(uiNet(f))})`,`The treasury is draining (${Math.round(uiNet(f))})`),
  d:(S,f)=>lng(`Her mevsim ${Math.round(-uiNet(f))} altın zarardayız. Barış zamanında gereğinden büyük ordu beslemek hazineyi eritir; fazla askeri dağıtmayı ya da pazar kurmayı düşün.`,
   `We lose ${Math.round(-uiNet(f))} gold every season. Feeding a larger army than we need in peacetime drains the treasury; consider disbanding the surplus troops or building a market.`),
  go:()=>showState(),goL:lng('Devlet defteri','State Ledger')},
 {id:'idle-army',prio:70,when:(S,f)=>{if(!warsOf(f).length||!S.armies)return null;const a=S.armies.filter(a=>a.f===f&&a.st==='idle'&&(a.mp==null||a.mp>0)).sort((x,y)=>y.n-x.n)[0];return a&&a.n>=1000?a:null;},
  t:(S,f,a)=>lng(`Ordu ${PD[a.loc].name}'de bekliyor`,`An army waits at ${PD[a.loc].name}`),d:(S,f,a)=>lng(`Savaştayız ama ${PD[a.loc].name}'deki ${fmtK(a.n)} kişilik ordumuz bu mevsim kıpırdamadı. Onu düşman sınırına yürüt ya da zayıf bir şehre saldır.`,
   `We are at war, yet our army of ${fmtK(a.n)} at ${PD[a.loc].name} has not stirred this season. March it to the enemy border or attack a weak city.`),
  go:(S,f,a)=>uiFocusProv(a.loc,a.id),goL:lng('Orduyu göster','Show the army')},
 {id:'peace',prio:60,when:(S,f)=>{let best=null,bs=uiAdvCfg.peaceScore-1;for(const g of warsOf(f)){const s=warScore(f,g);if(s>bs){bs=s;best=g;}}return best;},
  t:(S,f,g)=>lng(`${FAC[g].s} ile barış vakti`,`Time for peace with ${FAC[g].s}`),d:(S,f,g)=>lng(`${FAC[g].n} karşısında savaş skorumuz +${warScore(f,g)}. Şimdi barış ya da haraç istersen kabul etmeleri çok muhtemel; savaşı uzatmak asker ve altın yer.`,
   `Our war score against ${FAC[g].n} stands at +${warScore(f,g)}. If you ask for peace or tribute now, they will very likely accept; dragging the war out costs men and gold.`),
  go:()=>showDiplo(),goL:lng('Divan\'ı aç','Open the Divan')},
 {id:'small',prio:50,when:(S,f)=>{const n=facProvs(f).length;if(n>=uiAdvCfg.smallRealm||alliesOf(f).length)return null;const my=strength(f);
   const big=nbrs(f).filter(g=>strength(g)>my*2.5&&(atWar(f,g)||getOp(f,g)<0));return big.length?big[0]:null;},
  t:()=>lng('Önce diplomasi','Diplomacy first'),d:(S,f,g)=>lng(`Küçük bir devletiz; ${FAC[g].s} gibi güçlü komşularla tek başımıza baş edemeyiz. Divan'da bir müttefik ara: aynı dinden komşular daha yatkındır, bir hediye ilişkiyi ısıtır.`,
   `We are a small realm; we cannot stand alone against a mighty neighbour such as ${FAC[g].s}. Seek an ally in the Divan: neighbours of our own faith are more willing, and a gift warms any friendship.`),
  go:()=>showDiplo(),goL:lng('Divan\'ı aç','Open the Divan')},
 {id:'gold',prio:40,when:(S,f)=>{if(S.turn<2||S.fac[f].gold<uiAdvCfg.richGold||uiNet(f)<0)return null;const c=facProvs(f).filter(i=>!S.prov[i].mkt&&!(S.prov[i].un>0)).sort((a,b)=>S.prov[b].dev-S.prov[a].dev)[0];return c==null?null:{i:c};},
  t:()=>lng('Hazinede altın birikti','Gold is piling up in the treasury'),d:(S,f,x)=>lng(`Hazinede ${Math.floor(S.fac[f].gold)} altın boşta duruyor. En zengin şehrimiz ${PD[x.i].name}'de bir pazar kurarsak vergisi yarı yarıya artar.`,
   `${Math.floor(S.fac[f].gold)} gold lies idle in the treasury. If we build a market in ${PD[x.i].name}, our richest city, its taxes will rise by half.`),
  go:(S,f,x)=>uiFocusProv(x.i),goL:lng('Şehre git','Go to the city')},
 {id:'unrest',prio:30,when:(S,f)=>{const n=facProvs(f).filter(i=>S.prov[i].un>0).length;return n>=uiAdvCfg.unrestMany?n:null;},
  t:(S,f,n)=>lng(`${n} eyalet huzursuz`,`${n} provinces are restless`),d:(S,f,n)=>lng(`${n} eyalette halk bize henüz ısınmadı ve yarı vergi veriyor. Yeni fetihlerden önce biraz soluklanmak, orduyu toparlamak iyi olur.`,
   `In ${n} provinces the people have not yet warmed to us and pay only half their taxes. It would be wise to catch our breath and gather the army before new conquests.`)}
);
function uiAdvPick(){if(!uiAdvOn||!S||!S.player||S.over||!$('#start').hidden)return null;const f=S.player;
 for(const a of ADVICE.slice().sort((x,y)=>y.prio-x.prio)){if((uiAdvMute[a.id]||-1)>S.turn)continue;let d;try{d=a.when(S,f);}catch(e){console.error('advice '+a.id,e);continue;}
  if(d!=null&&d!==false)return {a,d};}
 return null;}
const uiVizier='<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#8e1f14" stroke="#c99a3b" stroke-width="2"/><path d="M6.6 28.4c1.3-5 5-7.4 9.4-7.4s8.1 2.4 9.4 7.4a13.6 13.6 0 0 1-18.8 0z" fill="#2f5b3c" stroke="#c99a3b" stroke-width=".6"/><path d="M12.6 17.2c0 4.3 1.5 7 3.4 7s3.4-2.7 3.4-7z" fill="#3a2414"/><circle cx="16" cy="16.3" r="3.3" fill="#e5c096"/><ellipse cx="16" cy="11.4" rx="6.8" ry="4.4" fill="#f6eedb" stroke="#bfa57a" stroke-width=".6"/><path d="M9.7 12.2c4 1.5 8.6 1.5 12.6 0M10.3 9.6c3.6 1.2 7.8 1.2 11.4 0" stroke="#bfa57a" stroke-width=".8" fill="none"/><path d="M14.1 7.6h3.8l-.5-3.4h-2.8z" fill="#b0392a" stroke="#c99a3b" stroke-width=".6"/><circle cx="16" cy="12.1" r="1.1" fill="#c99a3b"/></svg>';
(()=>{const h=$('#hud');if(!h)return;h.insertAdjacentHTML('beforeend',`<div id="uiAdv" class="ui-adv" hidden><button class="adv-chip" data-act="adv" aria-expanded="false" aria-label="${lng('Vezirin öğüdü',"The Vizier's counsel")}">${uiVizier}<span class="adv-t"></span></button>
 <div class="adv-card" hidden><div class="adv-h">${uiVizier}<b>${lng('Vezîr-i Âzam','The Grand Vizier')}</b><button class="x" data-act="adv" aria-label="${lng('Kapat','Close')}">×</button></div><p class="adv-d"></p><div class="adv-b"><button class="btn primary" data-act="adv-go"></button><button class="btn" data-act="adv-mute">${lng('Sonra','Later')}</button></div></div></div>`);})();
function uiAdvRender(){const box=$('#uiAdv');if(!box)return;const tutOn=typeof tutActive==='function'&&tutActive();
 const r=tutOn?null:uiAdvPick();if(!r){box.hidden=true;uiAdvCur=null;return;}
 const {a,d}=r,f=S.player;let t='',dd='';try{t=a.t(S,f,d);dd=a.d(S,f,d);}catch(e){console.error('advice '+a.id,e);box.hidden=true;return;}
 const changed=!uiAdvCur||uiAdvCur.id!==a.id;uiAdvCur=a;uiAdvData=d;box.hidden=false;box.dataset.id=a.id;
 box.querySelector('.adv-t').textContent=t;box.querySelector('.adv-d').textContent=dd;
 const g=box.querySelector('[data-act="adv-go"]');g.hidden=!a.go;g.textContent=a.goL||lng('Göster','Show');
 if(changed){box.classList.remove('pulse');void box.offsetWidth;box.classList.add('pulse');}}
function uiAdvOpen(o){const box=$('#uiAdv'),c=box.querySelector('.adv-card');c.hidden=!o;box.classList.toggle('open',o);box.querySelector('.adv-chip').setAttribute('aria-expanded',o?'true':'false');}
ACTS.adv=()=>{const c=$('#uiAdv .adv-card');if(c.hidden)uiAdvRender();if(!$('#uiAdv').hidden)uiAdvOpen(c.hidden);};
ACTS['adv-go']=()=>{const a=uiAdvCur;uiAdvOpen(false);if(a&&a.go)try{a.go(S,S.player,uiAdvData);}catch(e){console.error('advice '+a.id,e);}};
ACTS['adv-mute']=()=>{if(uiAdvCur)uiAdvMute[uiAdvCur.id]=S.turn+uiAdvCfg.muteTurns;uiAdvOpen(false);uiAdvRender();};
ACTS['adv-toggle']=()=>{uiAdvOn=!uiAdvOn;try{localStorage.setItem('ke-adv',uiAdvOn?'1':'0');}catch(e){}uiAdvRender();showMenu();};
QUIET.add('adv-mute');
hook('renderAll',uiAdvRender);
hook('afterRound',()=>{uiAdvOpen(false);},50);
hook('enterGame',()=>{uiAdvOpen(false);uiAdvRender();});
MENU_SECTIONS.push({id:'advisor',order:32,html:()=>`<div class="sec"><h3>${lng('Vezir','Vizier')}</h3><div class="acts"><button class="btn" data-act="adv-toggle">${lng('Öğütler','Counsel')} <span class="c">${uiAdvOn?lng('Açık','On'):lng('Kapalı','Off')}</span></button></div></div>`});

/* province panel: the vizier's word about this province (slot 90) */
function uiProvThreat(i){const f=S.player;let th=0,who=null;for(const j of PD[i].adj){const q=S.prov[j];if(q.o===f||!atWar(f,q.o))continue;let n=q.t;if(S.armies)for(const a of S.armies)if(a.loc===j&&a.f===q.o)n+=a.n;if(n>th){th=n;who=q.o;}}return {th,who};}
PANEL_SECTIONS.push({id:'advisor',order:90,when:c=>c.tgt<0&&c.mine&&uiAdvOn,html(c){const {th,who}=uiProvThreat(c.i);if(!who)return '';
 const dp=defPower(c.i,who);if(th<dp*.8)return '';
 return `<div class="vz" role="note">${uiVizier}<p>${lng(`<b>Tehlike:</b> komşu topraklarda ${fmtK(th)} ${esc(FAC[who].s)} askeri var; bu şehrin savunması ${fmtK(dp)}. Asker topla ya da kaleyi güçlendir.`,`<b>Danger:</b> ${fmtK(th)} ${esc(FAC[who].s)} troops stand on neighbouring land; this city's defence is ${fmtK(dp)}. Raise troops or strengthen the fortress.`)}</p></div>`;}});
KE.uiAdvice=()=>{const r=uiAdvPick();return r?r.a.id:null;};
