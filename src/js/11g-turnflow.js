/* =====================================================================
   TURN FLOW (Track D, Wave 2): what still waits for the player before the season ends.
   - "Emir bekleyen ordular": at war, armies that have not marched this season and are not besieging.
     A chip under the top bar counts them; each tap jumps to the next one. The End Turn button shows the count.
     Never blocks the turn (the treasury double-tap in 11-ui-core stays the only confirm).
   - "Elçiler": envoys waiting with a peace offer (S.offers, Track B keeps them 2 turns). Tap -> the report.
   - Aggressive expansion (AE, 05b): the realm's standing in the State Ledger, the neighbours' fear in the
     Divan rows, and two vizier counsels (fear rising, coalition formed).
   ===================================================================== */
const uiFlowCfg={aeWarn:35,aeCoal:60};
let uiFlowIdx=0;
/** Armies of f waiting for orders while at war: not moved this season, not besieging, not empty. */
function uiIdleArmies(f){if(!S||!S.armies||!warsOf(f).length)return [];
 return S.armies.filter(a=>a.f===f&&a.st!=='siege'&&a.n>=500&&a.mp>0&&a.mp>=(a.mpMax||BAL_B.mpMax)).sort((x,y)=>y.n-x.n);}
/** Envoys still waiting (Track B drops them after two turns). */
function uiInbox(){if(!S||!S.offers)return [];return S.offers.filter(o=>typeof offerOk!=='function'||offerOk(o));}
(()=>{const h=$('#hud');if(!h)return;h.insertAdjacentHTML('beforeend',`<div id="uiFlow" class="ui-flow" hidden>
 <button class="fl fl-inbox" data-act="ui-inbox" hidden><span class="ic" aria-hidden="true">✉</span><span class="t"></span></button>
 <button class="fl fl-idle" data-act="ui-idle" hidden><span class="ic" aria-hidden="true">⚑</span><span class="t"></span></button></div>`);})();
function uiFlowRender(){const box=$('#uiFlow');if(!box)return;const on=S&&S.player&&!S.over&&$('#start').hidden;
 const et=$('#endTurn');
 if(!on){box.hidden=true;if(et)delete et.dataset.idle;return;}
 const f=S.player,idle=uiIdleArmies(f),inb=uiInbox();
 const bi=box.querySelector('.fl-inbox'),bd=box.querySelector('.fl-idle');
 bi.hidden=!inb.length;if(inb.length){bi.querySelector('.t').textContent=inb.length===1?lng(`${FAC[inb[0].f].s} elçisi barış istiyor`,`An envoy of ${FAC[inb[0].f].s} asks for peace`):lng(`${inb.length} elçi barış istiyor`,`${inb.length} envoys ask for peace`);
  bi.setAttribute('aria-label',bi.querySelector('.t').textContent);}
 bd.hidden=!idle.length;if(idle.length){const t=idle.length===1?lng(`${armName(idle[0])} emir bekliyor`,`The ${armName(idle[0])} awaits orders`):lng(`${idle.length} ordu emir bekliyor`,`${idle.length} armies await orders`);
  bd.querySelector('.t').textContent=t;bd.setAttribute('aria-label',t);bd.dataset.tip='idle';}
 box.hidden=!inb.length&&!idle.length;
 if(et){if(idle.length&&!busy)et.dataset.idle=idle.length;else delete et.dataset.idle;}}
ACTS['ui-idle']=()=>{const L=uiIdleArmies(S.player);if(!L.length){uiFlowRender();return;}const a=L[uiFlowIdx++%L.length];uiFocusProv(a.loc,a.id);};
ACTS['ui-inbox']=()=>{if(uiInbox().length)showReport();else uiFlowRender();};
TIPS.idle=()=>{const L=uiIdleArmies(S.player);return `<b class="tt">${lng('Emir bekleyen ordular','Armies awaiting orders')}</b>${L.slice(0,6).map(a=>`<div>${esc(armName(a))} · ${esc(PD[a.loc].name)} · ${fmtK(a.n)}</div>`).join('')}<p>${lng('Savaştayız ama bu ordular bu mevsim yürümedi. Dokun, sırayla göstereyim. Beklemeleri gerekiyorsa turu yine de bitirebilirsin.','We are at war, yet these armies have not marched this season. Tap and I will show them one by one. If they are meant to wait, you may still end the turn.')}</p>`;};
hook('renderAll',uiFlowRender);
hook('enterGame',()=>{uiFlowIdx=0;uiFlowRender();});
hook('afterRound',()=>{uiFlowIdx=0;},60);

/* ---------- aggressive expansion in the UI ---------- */
/** Word for an AE level (the world's fear of a realm). */
function uiAeWord(v){return v>=uiFlowCfg.aeCoal?lng('Korku','Dread'):v>=uiFlowCfg.aeWarn?lng('Tedirginlik','Unease'):v>=10?lng('Dikkat','Wariness'):lng('Sükûnet','Calm');}
STATE_SECTIONS.push({id:'ae',order:30,html(f){const v=Math.round(typeof aeOf==='function'?aeOf(f):0),C=typeof aiCoal==='function'&&aiCoal(f);
 const pc=Math.min(100,Math.round(v/uiFlowCfg.aeCoal*100));
 return `<div class="sec ui-ae"><h3>${lng('Komşuların gözünde','In the eyes of our neighbours')}</h3>
 <div class="ae-row"><span>${esc(uiAeWord(v))}</span><div class="bar" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pc}"><i style="width:${pc}%"></i></div><b>${pc}%</b></div>
 <p class="hint">${C?lng(`Koalisyon: ${C.m.map(g=>esc(FAC[g].s)).join(', ')} sana karşı birleşti.`,`Coalition: ${C.m.map(g=>esc(FAC[g].s)).join(', ')} have joined forces against you.`)
   :lng('Her fetih komşuları tedirgin eder; aynı dinden birinin toprağını almak daha çok. Çubuk dolarsa korkan komşular birleşip sana birlikte savaş açar. Barış yıllarında korku yavaş yavaş söner.','Every conquest makes the neighbours uneasy, and taking land from a realm of your own faith even more so. If the bar fills up, the frightened neighbours band together and declare war on you as one. In years of peace the fear slowly fades.')}</p></div>`;}});
DIPLO_ROW.push({id:'ae',order:40,meta(f){const pl=S.player,C=typeof aiCoal==='function'&&aiCoal(pl);let h='';
 if(C&&C.m.includes(f))h+=`<span class="chip war">${lng('Koalisyonda','In the coalition')}</span>`;
 const v=typeof aeOf==='function'?aeOf(f):0;if(v>=uiFlowCfg.aeWarn)h+=`<span>${lng('Komşuları tedirgin','Its neighbours are uneasy')}</span>`;
 return h;}});
ADVICE.push(
 {id:'coal',prio:95,when:(S,f)=>{const C=typeof aiCoal==='function'&&aiCoal(f);return C&&C.m.some(g=>atWar(g,f))?C:null;},
  t:()=>lng('Koalisyon savaşı','A coalition war'),d:(S,f,C)=>lng(`Sultanım, ${C.m.map(g=>FAC[g].s).join(', ')} fetihlerimizden korkup bize karşı birleşti. İlk mevsimlerde ayrı barış yapmazlar; kaleleri tut, en tehlikeli orduya karşı birlikte dur, sonra teker teker barış iste.`,
   `My lord, fearing our conquests, ${C.m.map(g=>FAC[g].s).join(', ')} have joined forces against us. They will not make a separate peace in the first seasons; hold the fortresses, stand together against the most dangerous army, then ask for peace one by one.`),
  go:()=>showDiplo(),goL:lng('Divan\'ı aç','Open the Divan')},
 {id:'ae',prio:65,when:(S,f)=>{const v=typeof aeOf==='function'?aeOf(f):0;return v>=uiFlowCfg.aeWarn&&!(typeof aiCoal==='function'&&aiCoal(f))?v:null;},
  t:()=>lng('Komşular tedirgin','The neighbours are uneasy'),d:(S,f,v)=>lng(`Hızlı fetihlerimiz komşuları korkutuyor${v>=uiFlowCfg.aeCoal*.8?'; bir koalisyon kurulmak üzere':''}. Bir süre yeni toprak almazsak korku söner. Devlet defterinde ne kadar tedirgin olduklarını görebilirsin.`,
   `Our swift conquests frighten the neighbours${v>=uiFlowCfg.aeCoal*.8?'; a coalition is about to form':''}. If we take no new land for a while, the fear will fade. The State Ledger shows how uneasy they are.`),
  go:()=>showState(),goL:lng('Devlet defteri','State Ledger')}
);
KE.uiFlow=()=>({idle:uiIdleArmies(S.player).map(a=>a.id),inbox:uiInbox().length,shown:!$('#uiFlow').hidden,badge:$('#endTurn').dataset.idle||null});
