/* =====================================================================
   ANNEX: the player decides what happens to a city they take.
   When the player occupies a province (S.prov[i].ctl, Track B: a fallen siege or a won storm), a decree asks:
   "İlhak et" makes it theirs at once (capture: unrest and neighbours' alarm as for any conquest), "İşgalde tut"
   keeps the occupation (half its taxes, a bargaining chip at the Peace Table) and the province panel offers
   "İlhak et" at any later time while the war lasts. The AI keeps using treaties.
   S.prov[i].ctlT: turn the occupation was first seen; S.prov[i].ctlAsk: the player was already asked.
   ===================================================================== */
/** Turns the current occupation of province i has lasted. */
function annexHeld(i){const p=S.prov[i];return p.ctl?S.turn-(p.ctlT!=null?p.ctlT:S.turn):0;}
/** Can the player annex province i now? {ok, why} */
function annexCan(i){const p=S.prov[i],pl=S.player;
 if(!p||p.ctl!==pl||p.o===pl)return {ok:false,why:'none'};
 if(!atWar(pl,p.o))return {ok:false,why:'peace'};
 return {ok:true};}
function annexDo(i){if(!annexCan(i).ok)return false;const old=S.prov[i].o;capture(i,S.player);
 SND.play('fanfare');toast(lng(`${PD[i].name} artık bizim!`,`${PD[i].name} is ours!`),'good');
 addLog(lng(`${PD[i].name}, ${FAC[old].s} elinden alınıp ilhak edildi.`,`${PD[i].name} was taken from ${FAC[old].s} and annexed.`),'cap');
 if(S.over){save();renderAll();queueModal(showEnd);return true;}checkMissions();save();renderAll();req();return true;}
function annexStamp(){if(!S||!S.prov)return;for(const p of S.prov){if(p.ctl){if(p.ctlT==null)p.ctlT=S.turn;}else{if(p.ctlT!=null)delete p.ctlT;if(p.ctlAsk)delete p.ctlAsk;}}}
/** Ask about every new occupation of the player (once per occupation). */
function annexAsk(){if(!S||!S.player||S.over)return;annexStamp();
 for(let i=0;i<S.prov.length;i++){const p=S.prov[i];if(p.ctl!==S.player||p.o===S.player||p.ctlAsk||!annexCan(i).ok)continue;p.ctlAsk=1;
  const old=p.o,cap=S.fac[old].cap===i;
  queueModal(()=>eventModal({t:lng(`${PD[i].name} Alındı`,`${PD[i].name} Is Taken`),e:dateStr(S.turn),
   d:lng(`Ordumuz ${PD[i].name} şehrine girdi; şehir şimdilik işgalimizde. Onu hemen topraklarımıza katabilir ya da işgal altında tutup barışta pazarlık için kullanabiliriz.${cap?` Burası ${FAC[old].s} başkenti; ilhak etmek onları derinden sarsar.`:''}`,
    `Our army has entered ${PD[i].name}; for now the city is under our occupation. We can make it part of our realm at once, or keep it occupied and use it as a bargaining chip at the peace table.${cap?` This is the capital of ${FAC[old].s}; annexing it will shake them deeply.`:''}`),
   ch:[{l:lng('İşgalde tut: vergisinin yarısı bize, kararı sonra veririz','Keep it occupied: half its taxes are ours, we decide later')},
       {l:lng('İlhak et: şehir hemen bizim olsun','Annex: make the city ours now'),f:()=>annexDo(i)}]}));}}
hook('roundEnd',()=>annexStamp(),99);
hook('newTurn',()=>annexAsk(),95);
// actions during the player's turn (a storm, a march into an unwalled town): ask right after the click
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-act]'))setTimeout(annexAsk,0);});
hook('migrate',s=>{for(const p of s.prov||[])if(p.ctl&&p.ctlT==null){p.ctlT=s.turn||0;p.ctlAsk=1;}},90);
PANEL_SECTIONS.push({id:'annex',order:29,when:c=>!!S.player&&c.p.ctl===S.player&&c.p.o!==S.player,html(c){const r=annexCan(c.i);
 let h=`<div class="sec annex-sec"><h3>${lng('İlhak','Annexation')}</h3>`;
 if(r.ok)h+=`<div class="hint">${lng('Bu şehri istediğin an kalıcı olarak topraklarına katabilirsin. Komşuların biraz tedirgin olur.','You can make this city part of your realm whenever you wish. Your neighbours will grow a little uneasy.')}</div><div class="acts"><button class="btn primary" data-act="annex" data-i="${c.i}">${lng('İlhak et','Annex')}</button></div>`;
 else h+=`<div class="hint">${lng('Savaş bittiği için ilhak edilemez.','The war is over, so it can no longer be annexed.')}</div>`;
 return h+'</div>';}});
ACTS.annex=t=>annexDo(+t.dataset.i);
KE.annex={can:i=>annexCan(i),held:i=>annexHeld(i),ask:()=>annexAsk()};
