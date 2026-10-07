/* =====================================================================
   LONG MARCH UI: with an army selected, tapping a province it cannot reach this season (but can reach at all)
   offers a long march there (farTgt): the road, how many seasons, what happens on arrival, and "Set out".
   An army on the march shows its destination in the panel, with a button to call the march off.
   The road is drawn on the map (07c tokRoute, from a.path; a preview while the offer is open).
   ===================================================================== */
let farTgt=-1;
/** Can the selected army march to province i over several seasons (and not this one)? -> armyCanMove's answer or null */
function farOk(a,i){if(!a||a.f!==S.player||i===a.loc)return null;const c=armyCanMove(a.id,i);if(c.ok||!c.path)return null;
 if(!(a.mp<=0||c.cost>a.mp))return null;return c;}
PANEL_SECTIONS.push({id:'longmarch',order:41,when:c=>farTgt>=0&&tgt<0&&!!armyById(selArmy),html(c){
 const a=armyById(selArmy),mv=armyCanMove(a.id,farTgt),td=PD[farTgt];if(!mv.path)return '';
 const n=marchSeasons(a,mv.cost),kind=mv.kind||'move',foe=armFoesAt(farTgt,a.f).length>0;
 const end=foe?lng('Hedefte bir düşman ordusu var: ordu yanına kadar gider ve durur, saldırı kararı senin olur.','An enemy army holds the destination: the army marches up to it and halts; whether to attack is your call.')
  :kind==='siege'?lng('Varınca surları kuşatır.','On arrival it besieges the walls.'):kind==='assault'?lng('Varınca kasabaya hücum eder.','On arrival it storms the town.'):lng('Varınca orada bekler.','On arrival it waits there.');
 return `<div class="sec orders" data-sheet="action"><h3>${lng('Uzun sefer','Long march')} → ${esc(td.name)}</h3>
  <div class="meta"><span>${esc(armName(a))} <b>${fmtK(a.n)}</b></span><span>${lng('Yol','Route')} <b>${mv.cost} ${lng('eyalet',mv.cost===1?'province':'provinces')}</b></span><span>${lng('Süre','Time')} <b>${lng(`~${n} mevsim`,`~${n} ${n===1?'season':'seasons'}`)}</b></span></div>
  <div class="hint">${lng(`Ordu bu mevsim gidebildiği kadar yürür, sonra her tur sonunda yoluna kendiliğinden devam eder. ${end} Orduya başka bir emir verirsen sefer biter.`,`The army marches as far as it can this season, then carries on by itself at the end of every turn. ${end} Give the army another order and the march ends.`)}</div>
  <div class="acts"><button class="btn primary" data-act="adest">${lng('Sefere çık','Set out')}</button><button class="btn" data-act="adestno" style="justify-content:center">${lng('Vazgeç','Cancel')}</button></div></div>`;}});
PANEL_SECTIONS.push({id:'march',order:31,when:c=>{if(selArmy==null||!S)return false;const a=armyById(selArmy);return !!a&&a.f===S.player&&a.loc===c.i&&a.dest!=null;},html(c){
 const a=armyById(selArmy),p=a.path&&a.path.length?a.path:(armyPath(a.id,a.dest)||[]),n=p.length?marchSeasons(a,p.length):0;
 return `<div class="sec"><h3>${lng('Seferde','On the march')} → ${esc(PD[a.dest].name)}</h3>
  <div class="hint">${lng(`Kalan yol ${p.length} eyalet, yaklaşık ${n} mevsim. Ordu her tur sonunda kendiliğinden yürür.`,`${p.length} ${p.length===1?'province':'provinces'} to go, about ${n} ${n===1?'season':'seasons'}. The army marches by itself at the end of every turn.`)}</div>
  <div class="acts"><button class="btn" data-act="adestx">${lng('Seferi durdur','Stop the march')}</button></div></div>`;}});
ACTS.adest=()=>{const a=armyById(selArmy),to=farTgt;farTgt=-1;if(!a||to<0||!farOk(a,to)){renderPanel();req();return;}
 const n=marchSeasons(a,armyCanMove(a.id,to).cost),r=marchSet(a,to);SND.play('march');
 if(r!=='stopped'&&a.dest!=null)toast(lng(`${armName(a)} ${PD[to].name} yolunda (~${n} mevsim).`,`${armName(a)} is on the road to ${PD[to].name} (~${n} ${n===1?'season':'seasons'}).`),'good');
 if(S.armies.includes(a))armSelect(a.loc,a.id);renderAll();};
ACTS.adestno=()=>{farTgt=-1;renderPanel();req();};
ACTS.adestx=()=>{const a=armyById(selArmy);if(a){a.dest=null;a.path=[];toast(lng(`${armName(a)} seferi durdurdu.`,`${armName(a)} has stopped its march.`));}renderAll();};
['adest','adestx'].forEach(k=>OVERBLOCK.add(k));
KE.farTgt=()=>farTgt;
