function showHelp(){openModal(EN?`<div class="eyebrow">How to play</div><h2>The Art of War</h2>
 <div class="logl">
 <div><time>Select</time><span>Tap one of your provinces. Green neighbours are your own land, red ones belong to an enemy you are at war with.</span></div>
 <div><time>March</time><span>From the selected province tap a neighbour, then <b>March</b> or <b>Attack</b>. Troops that have moved cannot move again that turn.</span></div>
 <div><time>Battle</time><span>The garrison, the local militia (by development and walls) and the walls all join the defence. Mountain provinces defend 30% better. Attacks in winter are 15% weaker.</span></div>
 <div><time>Cannon</time><span>The Ottomans gain siege cannon in 1453, everyone else in 1460. Cannon cancel most of the fortress bonus.</span></div>
 <div><time>Treasury</time><span>Income comes from province development; every 1,000 soldiers cost 1 gold in pay each turn. If the treasury goes negative, soldiers desert.</span></div>
 <div><time>Conquest</time><span>A newly taken province stays restless for 8 turns and gives half income. Losing your capital costs 30% of the treasury.</span></div>
 <div><time>Diplomacy</time><span>Declare war, ask for peace or tribute, form alliances. Allies help in defensive wars. Peace is followed by a 12-turn truce.</span></div>
 <div><time>Tips</time><span>Rest on a number or a button (press and hold on a phone): the vizier explains what it does. On a keyboard Space ends the turn, Esc closes, 1–4 open Diplomacy, Goals, Chronicle and the State book.</span></div>
 <div><time>Victory</time><span>Rule half the provinces, or gather the highest score by 1531. Drag the map; zoom with the wheel or two fingers.</span></div>
 </div><div class="foot"><button class="btn primary" data-act="mclose">Got it</button></div>`:`<div class="eyebrow">Nasıl oynanır</div><h2>Harp Usulü</h2>
 <div class="logl">
 <div><time>Seç</time><span>Kendi eyaletine dokun. Yeşil komşular kendi toprağın, kırmızılar savaşta olduğun düşmanın.</span></div>
 <div><time>Yürüt</time><span>Seçili eyaletten komşuya dokun, asker sayısını ayarla, <b>Yürüt</b> ya da <b>Saldır</b>. Hareket eden askerler o tur tekrar hareket edemez.</span></div>
 <div><time>Muharebe</time><span>Savunmaya garnizon, yerel milis (gelişim ve kaleye göre) ve kale katılır. Dağlık eyaletler +30% savunur. Kışın saldırı −15%.</span></div>
 <div><time>Topçu</time><span>Osmanlı 1453'te, herkes 1460'ta kuşatma topu kazanır. Topçu kale bonusunun büyük kısmını yok eder.</span></div>
 <div><time>Hazine</time><span>Gelir eyalet gelişiminden gelir, her 1.000 asker tur başına 1 altın maaş ister. Hazine eksiye düşerse askerler firar eder.</span></div>
 <div><time>Fetih</time><span>Yeni alınan eyalet 8 tur huzursuz kalır ve yarı gelir verir. Başkent kaybı hazinenin %30'unu götürür.</span></div>
 <div><time>Diplomasi</time><span>Savaş ilan et, barış ya da haraç iste, ittifak kur. Müttefikler savunma savaşlarında yardıma gelir. Barıştan sonra 12 tur ateşkes olur.</span></div>
 <div><time>İpuçları</time><span>Bir sayının ya da düğmenin üzerinde dur (telefonda basılı tut): vezir ne işe yaradığını anlatır. Klavyede Boşluk turu bitirir, Esc kapatır, 1–4 Diplomasi, Hedefler, Vakayiname ve Devlet defterini açar.</span></div>
 <div><time>Zafer</time><span>Eyaletlerin yarısına hükmet ya da 1531'e kadar en yüksek puanı topla. Haritayı sürükle, tekerlek ya da iki parmakla yakınlaştır.</span></div>
 </div><div class="foot"><button class="btn primary" data-act="mclose">Anladım</button></div>`);}
function showMenu(){openModal(`<div class="eyebrow">${esc(FAC[S.player].n)} · ${dateStr(S.turn)}</div><h2>${lng('Menü','Menu')}</h2>
 <p class="lead" style="font-size:14px">${lng('Oyun her hamleden sonra bu tarayıcıya otomatik kaydedilir. Sayfa kapansa bile açılış ekranındaki <b>Kayıtlı oyuna dön</b> ile kaldığın yerden devam edersin.','The game saves itself in this browser after every move. Even if the page closes, <b>Continue saved game</b> on the start screen takes you back to where you left off.')}</p>
 <div class="sv-menu"><button class="btn" data-act="sv-open" data-m="save">${lng('Oyunu kaydet','Save game')}</button><button class="btn" data-act="sv-open" data-m="load">${lng('Oyun yükle','Load game')}</button></div>
 ${bySlot(MENU_SECTIONS).map(x=>{try{return x.html()||'';}catch(e){console.error('menu '+x.id,e);return '';}}).join('')}
 <div class="choices"><button class="btn" style="justify-content:center" data-act="guide" data-t="genel">${lng('Oyun rehberi','Game guide')}</button>
 <button class="btn danger" data-act="newgame">${lng('Yeni oyun başlat','Start a new game')}</button>
 <button class="btn primary" data-act="mclose">${lng('Oyuna dön','Back to the game')}</button></div>`);
 const root=$('#modal .card');for(const x of bySlot(MENU_SECTIONS))if(x.bind){try{x.bind(root);}catch(e){console.error('menu '+x.id,e);}}}
MENU_SECTIONS.push({id:'sound',order:20,html:()=>`<div class="sec"><h3>${lng('Ses','Sound')}</h3><div class="acts"><button class="btn" data-act="snd-music">${lng('Müzik','Music')} <span class="c">${SND.st.music?lng('Açık','On'):lng('Kapalı','Off')}</span></button><button class="btn" data-act="snd-sfx">${lng('Efektler','Effects')} <span class="c">${SND.st.sfx?lng('Açık','On'):lng('Kapalı','Off')}</span></button></div>
 <div class="amt" style="margin-top:10px"><label for="vol">${lng('Ses düzeyi','Volume')}</label><b id="volv">${Math.round(SND.st.vol*100)}</b></div><input type="range" id="vol" min="0" max="100" step="5" value="${Math.round(SND.st.vol*100)}"></div>`,
 bind(){const v=$('#vol');v.addEventListener('input',()=>{$('#volv').textContent=v.value;SND.set('vol',v.value/100);if(!SND.st.on){SND.set('on',true);sndIcon();}});v.addEventListener('change',()=>SND.play('coin'));}});
function showEnd(){const pl=S.player;if(!S.over)return;SND.play(S.over==='lose'?'defeat':'fanfare');const sc=FK.filter(alive).map(f=>({f,s:score(f)})).sort((a,b)=>b.s-a.s);const rank=sc.findIndex(x=>x.f===pl)+1;
 const t=S.over==='win'?lng('Cihan Hâkimiyeti','Dominion of the World'):S.over==='lose'?lng('Devletin Sonu','The End of the Realm'):lng('1531: Bir Devrin Sonu','1531: The End of an Era');
 const d=S.over==='win'?lng(`${FAC[pl].n} haritanın yarısından fazlasına hükmediyor. Hanedanın tarihe adını altın harflerle yazdırdı.`,`${FAC[pl].n} rules more than half the map. Your dynasty has written its name into history in letters of gold.`):S.over==='lose'?lng(`${FAC[pl].n} son toprağını da kaybetti. Tarih kitapları seni bir dipnot olarak anacak.`,`${FAC[pl].n} has lost its last land. The history books will remember you as a footnote.`):lng(`Seksen yıllık hükümranlık sona erdi. Devletin güçler arasında ${rank}. sırada.`,`Eighty years of rule have come to an end. Your realm ranks ${ordEn(rank)} among the powers.`);
 openModal(`<div class="eyebrow endm">${dateStr(S.turn)}</div><h2>${t}</h2><p class="lead">${d}</p>
 <div class="rows">${sc.slice(0,8).map((x,k)=>`<div class="row" style="${x.f===pl?'background:rgba(142,31,20,.12)':''}">${shield(x.f)}<div class="nm">${k+1}. ${esc(FAC[x.f].n)}<small>${facProvs(x.f).length} ${lng('eyalet',facProvs(x.f).length===1?'province':'provinces')}</small></div><b>${x.s}</b></div>`).join('')}</div>
 <p class="hint">${lng('Oyun sona erdi. Haritaya bakabilirsin; üst çubuktaki <b>Oyun bitti</b> düğmesi bu ekranı yeniden açar.','The game is over. You can still look at the map; the <b>Game over</b> button in the top bar opens this screen again.')}</p>
 <div class="foot"><button class="btn" data-act="mclose">${lng('Haritaya bak','View the map')}</button><button class="btn primary" data-act="newgame">${lng('Yeni oyun','New game')}</button></div>`);}
/** English ordinal: 1st, 2nd, 3rd, 11th … */
function ordEn(n){const v=n%100;return n+(v>=11&&v<=13?'th':['th','st','nd','rd'][n%10]||'th');}

/* ---------------- start screen ---------------- */
/* start screen: group anchors (Güçlü / Dengeli / Zorlu) at the top of the list, a scroll hint while
   more cards are below, and the choice bar under the list (never over it). */
const uiStartGroups=[[1,lng('Güçlü başlangıç','Strong start'),lng('Güçlü','Strong')],[2,lng('Dengeli','Balanced'),lng('Dengeli','Balanced')],[3,lng('Zorlu','Hard'),lng('Zorlu','Hard')]];
function renderStart(){
 const fl=$('#flist'),top=fl.scrollTop;
 fl.innerHTML=`<div class="fjump" role="navigation" aria-label="${lng('Devlet grupları','Realm groups')}">${uiStartGroups.map(([g,,s])=>`<button class="fj" data-act="sgrp" data-g="${g}">${s}</button>`).join('')}</div>`
  +uiStartGroups.map(([g,t])=>`<div class="fgroup" id="fg${g}"><h4>${t}</h4><div class="fgrid">${FK.filter(f=>FAC[f].dif===g).sort((a,b)=>facProvs(b).length-facProvs(a).length).map(f=>`<button class="fcard ${startPick===f?'on':''}" data-act="pick" data-f="${f}">${shield(f)}<span class="nm">${esc(FAC[f].s)}<small>${facProvs(f).length} ${lng('eyalet',facProvs(f).length===1?'province':'provinces')} · ${fmtK(strength(f))}</small></span></button>`).join('')}</div></div>`).join('')
  +`<div class="fmore" aria-hidden="true">${lng('Aşağıda başka devletler de var ↓','More realms below ↓')}</div>`;
 fl.scrollTop=top;uiStartScroll();
 const f=startPick;let has=false;try{has=!!localStorage.getItem(SAVE);}catch(e){}
 $('#pick').innerHTML=f?`<div class="ph">${shield(f,true)}<div><h2>${esc(FAC[f].n)}</h2><div class="sub">${esc(rulerName(f))} · ${esc(relName(f))} · ${lng('başkent','capital')} ${esc(PD[S.fac[f].cap].name)}</div></div></div><p>${esc(FAC[f].d)}</p>
  ${svStartRow(has,false)}<div class="row2"><button class="btn primary" data-act="begin">${lng('Sefere başla','Begin the campaign')}</button></div>`
  :`<p>${lng('Soldan bir devlet seç. Haritada toprakları parlayacak.','Pick a realm on the left. Its lands will light up on the map.')}</p>${svStartRow(has,true)}`;
}
/** Start screen: "Continue" (the autosave, with its realm and date) and "Load game" (save slots and file import). */
function svStartRow(has,prim){const m=has&&typeof svAutoMeta==='function'?svAutoMeta():null,k=typeof svSlots==='function'?svSlots().filter(x=>!x.empty).length:0;
 return `<div class="row2 sv-start">${has?`<button class="btn${prim?' primary':''} sv-cont" data-act="continue">${lng('Kayıtlı oyuna dön','Continue saved game')}${m?`<small>${esc(FAC[m.f].s)} · ${dateStr(m.turn)}</small>`:''}</button>`:''}<button class="btn sv-ld" data-act="sv-open" data-m="load">${lng('Oyun yükle','Load game')}${k?`<small>${k} ${lng('kayıt',k===1?'save':'saves')}</small>`:''}</button></div>`;}
function uiStartScroll(){const fl=$('#flist');fl.classList.toggle('more',fl.scrollTop+fl.clientHeight<fl.scrollHeight-24);}
$('#flist').addEventListener('scroll',uiStartScroll,{passive:true});addEventListener('resize',()=>{if(!$('#start').hidden)uiStartScroll();});
ACTS.sgrp=t=>{const g=$('#fg'+t.dataset.g),fl=$('#flist');if(!g)return;const j=fl.querySelector('.fjump');
 fl.scrollTo({top:fl.scrollTop+g.getBoundingClientRect().top-fl.getBoundingClientRect().top-(j?j.offsetHeight:0)-4,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};
QUIET.add('sgrp');
function showStart(){newGame(null);startPick='OSM';sel=-1;tgt=-1;$('#top').hidden=true;$('#zoom').hidden=true;$('#panel').hidden=true;$('#start').hidden=false;
 polDirty=true;hlKey='';renderStart();startCenter('OSM');}
function startCenter(f){const side=vw>760?Math.min(470,vw*.45):0,ps=facProvs(f);if(!ps.length)return;
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;ps.forEach(i=>{const d=PD[i];x0=Math.min(x0,d.lx);x1=Math.max(x1,d.lx);y0=Math.min(y0,d.ly);y1=Math.max(y1,d.ly);});
 const smax=Math.max(fitS*1.25,Math.min(vw,vh)/700)*(G3.on?1.5:1),fit=Math.min((vw-side-60)/(x1-x0+90),(vh-60)/(y1-y0+90))*(G3.on?.8:1);
 centerOn((x0+x1)/2,(y0+y1)/2,clamp(fit,fitS*.9,smax),side);}
function beginGame(f){newGame(f);startPick=null;$('#start').hidden=true;enterGame();
 queueModal(()=>eventModal({t:FAC[f].n,e:dateStr(0),d:FAC[f].d+lng(' Bir eyaletine dokunarak başla; komşu eyalete dokunarak asker yürüt.',' Start by tapping one of your provinces; tap a neighbouring province to march troops there.'),ch:[{l:lng('Hükmetmeye başla','Begin your reign')}]}));save();}
function enterGame(){$('#top').hidden=false;$('#zoom').hidden=false;startPick=null;polDirty=true;hlKey='';renderTop();const c=S.fac[S.player].cap;centerOn(PD[c].lx,PD[c].ly,clamp(Math.min(vw,vh)/560,fitS,2.2)*(G3.on?1.3:1));renderAll();
 if(S.over)queueModal(showEnd);else if(S.pendEv!=null)randomEvent(S.pendEv);
 runHooks('enterGame');}
function save(){try{localStorage.setItem(SAVE,JSON.stringify(S));}catch(e){if(typeof svAutoFail==='function')svAutoFail(e);}}
/** Bring any saved state up to schema v2 (idempotent: a v2 state is left byte-identical). */
function migrate(s){const from=s.v||1;
 (s.mis||[]).forEach(m=>{if(m.t==='Kızıl Elma'){m.t='Roma Seferi';m.d='Roma\'yı fethet.';}});
 FK.forEach(f=>{if(!s.fac[f])s.fac[f]={gold:0,mp:0,alive:false,cap:-1,cannon:0,nextOffer:0};const F=s.fac[f];
  if(!('ruler' in F))F.ruler=null;if(!('heir' in F))F.heir=null;if(!Array.isArray(F.gens))F.gens=[];});
 s.offers=s.offers||[];
 if(s.seq==null)s.seq=1;
 for(const k of ['armies','hist'])if(!Array.isArray(s[k]))s[k]=[];
 for(const k of ['sieges','chars','ae','coal','evs','chains','ai'])if(!s[k]||typeof s[k]!=='object')s[k]={};
 if(!('tut' in s))s.tut=null;
 FK.forEach(f=>{if(!s.ai[f])s.ai[f]=newAi();});
 for(const k in s.war){const w=s.war[k];if(!w.ex)w.ex={};if(!('goal' in w))w.goal=null;}
 runHooks('migrate',s,from);
 s.v=2;return s;}
KE.migrate=s=>migrate(s);
function loadGame(){try{const raw=localStorage.getItem(SAVE),s=JSON.parse(raw);if(!s||!s.prov||s.prov.length!==NP)throw 0;
  if((s.v||1)<2){try{if(!localStorage.getItem(SAVE+'-backup'))localStorage.setItem(SAVE+'-backup',raw);}catch(e){}}
  S=migrate(s);pruneOffers();$('#start').hidden=true;enterGame();}
 catch(e){toast(lng('Kayıtlı oyun okunamadı. Yeni bir oyun başlat.','The saved game could not be read. Start a new game.'),'war');}}
ACTS.menu=()=>showMenu();
ACTS['snd-music']=()=>{SND.set('music',!SND.st.music);showMenu();};
ACTS['snd-sfx']=()=>{SND.set('sfx',!SND.st.sfx);showMenu();};
ACTS.pick=t=>{startPick=t.dataset.f;renderStart();hlKey='';startCenter(startPick);};
ACTS.begin=()=>{SND.play('fanfare');beginGame(startPick);};
ACTS.continue=()=>loadGame();
ACTS.newgame=()=>{modalQ.length=0;closeModal();try{localStorage.removeItem(SAVE);}catch(e){}showStart();};

