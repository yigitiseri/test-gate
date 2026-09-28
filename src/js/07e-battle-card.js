/* =====================================================================
   BATTLE CARD (Track A, A3): a side card in #card for the player's battles: both crests, a strength
   bar, the modifier list in plain Turkish (rep.mods), two dice for the luck roll (rep.roll), casualties,
   the general's fate (rep.genFate) and the outcome seal. Auto-dismiss after 3.5 s or on tap.
   Also reachable from the season report ("Muharebe kartları", ACT bcard).
   ===================================================================== */
const A_CARD={hold:3500,roll:850};
let aCardTm=0,aCardHover=false,aCardEnd=0,aCardRoll=0;
const aPct=m=>{const v=Math.round((m-1)*100);return (v>=0?'+':'−')+Math.abs(v)+'%';};
const A_KIND={assault:'Kale saldırısı',field:'Meydan muharebesi',sally:'Kuşatma çıkışı',siege:'Kuşatma'};
const A_PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
const aDie=v=>`<span class="a-die" data-v="${v}">${[0,1,2,3,4,5,6,7,8].map(k=>`<i${A_PIPS[v].includes(k)?' class="on"':''}></i>`).join('')}</span>`;
const aFace=r=>clamp(1+Math.round(((r||1)-.85)/.35*5),1,6);
/** The general's fate in words; accepts a string, {n|name|id, fate|k|type} or an array of those. */
function aGenFate(g){if(!g)return [];if(Array.isArray(g))return g.flatMap(aGenFate);if(typeof g==='string')return [g];
 const c=g.id!=null&&S.chars&&S.chars[g.id],nm=g.n||g.name||(c&&c.n)||'Komutan',k=String(g.fate||g.k||g.type||'');
 if(/die|dead|kill|death|slain/i.test(k))return [`${nm} savaş meydanında düştü.`];if(/capt/i.test(k))return [`${nm} esir düştü.`];if(/wound/i.test(k))return [`${nm} yaralandı.`];
 if(/flee|escap/i.test(k))return [`${nm} kaçmayı başardı.`];return [k?`${nm}: ${k}`:nm];}
/** Strength estimate after modifiers and luck, and the modifiers split by side, from what the report carries. */
function aCardModel(rep){const mods=Array.isArray(rep.mods)?rep.mods:[],roll=rep.roll||{},mul=side=>mods.filter(m=>m.side===side).reduce((v,m)=>v*(+m.m||1),1);
 const kind=rep.kind||'assault',defN=rep.defT!=null?rep.defT:(rep.dn!=null?rep.dn:0);let militia=0;
 if(kind==='assault'&&S.prov[rep.to]){const fm=mods.find(m=>m.k==='fort'),fl=fm?+((String(fm.l).match(/\d+/)||[0])[0]):0;militia=S.prov[rep.to].dev*150+fl*700;}
 const aP=rep.aP!=null?rep.aP:(rep.n||0)*mul('att')*(roll.a||1),dP=rep.dP!=null?rep.dP:(defN+militia)*mul('def')*(roll.d||1);
 return {mods,roll,kind,defN,militia,aP,dP,share:aP+dP>0?aP/(aP+dP):.5};}
function aCardHTML(rep,m){const pl=S.player,att=rep.att,def=rep.def,d=PD[rep.to]||{name:'?'},mineA=att===pl,mineD=def===pl,won=mineA?rep.win:mineD?!rep.win:rep.win;
 const col=f=>(FAC[f]&&FAC[f].c)||'#777',nm=f=>esc((FAC[f]&&FAC[f].s)||f);
 const side=(sd)=>{const L=m.mods.filter(x=>x.side===sd).map(x=>`<li><span>${esc(x.l)}</span><b class="${x.m>=1?'up':'dn'}">${aPct(x.m)}</b></li>`);
  if(sd==='def'&&m.militia>0)L.push(`<li><span>Yerel milis ve surlar</span><b>+${esc(fmtK(m.militia))}</b></li>`);
  const r=sd==='att'?m.roll.a:m.roll.d;if(r)L.push(`<li class="a-luck"><span>Talih</span><b data-luck="${sd}">${aPct(r)}</b></li>`);
  return L.length?`<ul>${L.join('')}</ul>`:'<ul><li class="a-none"><span>Etki yok</span></li></ul>';};
 const place=esc(d.name),res=mineA?(rep.win?`${place} alındı`:'Saldırı püskürtüldü'):mineD?(rep.win?`${place} düştü`:`${place} savunuldu`):(rep.win?`${place} el değiştirdi`:`${place} dayandı`);
 const notes=[];if(rep.fortDmg)notes.push('Surlar hasar gördü.');if(rep.retreat!=null&&PD[rep.retreat])notes.push(`Savunanlar ${esc(PD[rep.retreat].name)} eyaletine çekildi.`);
 for(const g of aGenFate(rep.genFate))notes.push(esc(g));
 const pctA=Math.round(m.share*100);
 return `<div class="band"></div><div class="a-bc-in">
 <div class="a-bc-eye">${esc(A_KIND[m.kind]||'Muharebe')} · ${esc(dateStr(rep.turn!=null?rep.turn:S.turn))}</div>
 <h3>${place} Muharebesi</h3>
 <div class="a-bc-sides"><div class="a-bc-side att${mineA?' me':''}">${shield(att,true)}<div><b>${nm(att)}</b><small>Saldıran · ${fmtK(rep.n||0)}</small></div></div>
  <div class="a-bc-vs" aria-hidden="true">⚔</div>
  <div class="a-bc-side def${mineD?' me':''}"><div><b>${nm(def)}</b><small>Savunan · ${fmtK(m.defN)}</small></div>${shield(def,true)}</div></div>
 <div class="a-bc-bar" role="img" aria-label="Güç dengesi: saldıran yüzde ${pctA}"><i class="a" style="width:${pctA}%;background-color:${col(att)}"></i><i class="d" style="background-color:${col(def)}"></i><span class="mid"></span></div>
 <div class="a-bc-pow"><span>Güç ${fmtK(m.aP)}</span><span>Güç ${fmtK(m.dP)}</span></div>
 <div class="a-bc-mods">${side('att')}<div class="a-bc-dice">${aDie(3)}${aDie(4)}</div>${side('def')}</div>
 <div class="a-bc-res ${won?'win':'loss'}"><span class="a-bc-seal">${won?'Zafer':'Yenilgi'}</span><small>${res}</small></div>
 <div class="a-bc-loss">Kayıplar <b>${nm(att)} ${fmtK(rep.aLoss||0)}</b> · <b>${nm(def)} ${fmtK(rep.dLoss||0)}</b></div>
 ${notes.length?`<div class="a-bc-note">${notes.map(x=>`<div>${x}</div>`).join('')}</div>`:''}
 <div class="a-bc-tm"><i></i></div><button class="a-bc-x" data-act="bcard-x" aria-label="Kartı kapat">×</button></div>`;}

/** Show the card for a battle report. o.over: opened from a modal (card above it, no auto-dismiss race with the modal). */
function aCardShow(rep,o={}){const el=$('#card');if(!el||!rep||!S)return;
 let m;try{m=aCardModel(rep);}catch(e){console.error('battle card',e);return;}
 clearTimeout(aCardTm);cancelAnimationFrame(aCardRoll);
 el.className='a-bc'+(o.over?' over':'');el.innerHTML=aCardHTML(rep,m);el.hidden=false;el.setAttribute('role','dialog');el.setAttribute('aria-label','Muharebe kartı');
 // phones: never cover the province panel; fall back to a one-line strip when there is no room
 if(vw<760){const p=$('#panel');if(p&&!p.hidden&&!o.over){const room=p.getBoundingClientRect().top-el.getBoundingClientRect().top-8;if(el.offsetHeight>room)el.classList.add('mini');}}
 const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,dice=el.querySelectorAll('.a-die'),fin=[aFace(m.roll.a),aFace(m.roll.d)],t0=performance.now();
 const settle=()=>{dice.forEach((d,k)=>{d.outerHTML=aDie(fin[k]);});el.classList.add('settled');aCardEnd=performance.now()+A_CARD.hold;aCardTick();};
 if(reduce||!dice.length)settle();
 else{el.classList.add('rolling');let last=0;const spin=now=>{if(el.hidden)return;if(now-t0>=A_CARD.roll){el.classList.remove('rolling');settle();return;}
   if(now-last>75){last=now;dice.forEach(d=>{const v=1+Math.floor(Math.random()*6);d.dataset.v=v;d.innerHTML=[0,1,2,3,4,5,6,7,8].map(k=>`<i${A_PIPS[v].includes(k)?' class="on"':''}></i>`).join('');});}
   aCardRoll=requestAnimationFrame(spin);};aCardRoll=requestAnimationFrame(spin);}
 KE.card={rep,mods:m.mods.length,shown:true};}
function aCardTick(){const el=$('#card');if(el.hidden)return;clearTimeout(aCardTm);
 const left=aCardEnd-performance.now(),bar=el.querySelector('.a-bc-tm i');
 if(aCardHover){aCardEnd=performance.now()+Math.max(left,1200);aCardTm=setTimeout(aCardTick,200);return;}
 if(bar)bar.style.width=Math.max(0,left/A_CARD.hold*100)+'%';
 if(left<=0){aCardHide();return;}aCardTm=setTimeout(aCardTick,100);}
function aCardHide(){const el=$('#card');clearTimeout(aCardTm);cancelAnimationFrame(aCardRoll);if(!el)return;el.hidden=true;el.innerHTML='';el.className='';if(KE.card)KE.card.shown=false;}
{const el=$('#card');if(el){el.addEventListener('click',e=>{if(!e.target.closest('[data-act]:not([data-act="bcard-x"])'))aCardHide();});
 el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')aCardHover=true;});el.addEventListener('pointerleave',()=>{aCardHover=false;});}}
ACTS['bcard-x']=()=>aCardHide();
QUIET.add('bcard-x');
/* the player's own attacks show the card at once; battles fought during the AI turns are in the season report */
hook('playerBattle',rep=>{if(!busy&&!aRp.on)aCardShow(rep);});
hook('enterGame',()=>aCardHide());
ACTS.bcard=t=>{const r=(S.report||[])[+t.dataset.k];if(r)aCardShow(r,{over:true});};
REPORT_SECTIONS.push({id:'bcards',order:22,html(){const L=S.report||[];if(!L.length)return '';const pl=S.player;
 return `<div class="sec a-bcs"><h3>Muharebe kartları</h3><div class="a-bcl">${L.map((r,k)=>{if(!PD[r.to])return '';const won=r.att===pl?r.win:!r.win,o=r.att===pl?r.def:r.att;
  return `<button class="btn a-bcb" data-act="bcard" data-k="${k}" aria-label="${esc(PD[r.to].name)} muharebe kartı">${FAC[o]?shield(o):''}<span>${esc(PD[r.to].name)}</span><b class="${won?'pos':'neg'}">${won?'Zafer':'Yenilgi'}</b></button>`;}).join('')}</div></div>`;}});
