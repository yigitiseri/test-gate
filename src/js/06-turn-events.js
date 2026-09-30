/* =====================================================================
   TURN FLOW (frozen core pipeline; only the orchestrator edits this file)
   endTurn: turnStart -> [preAI(f), aiTurn(f)] for every AI in random order -> endRound
            (roundEnd, S.turn++, newTurn) -> afterRound -> checkVictory -> events -> save/render
            -> present(PRESENTERS) -> end-turn button enabled again.
   ===================================================================== */
function endRound(){runHooks('roundEnd');S.turn++;runHooks('newTurn');}
function checkVictory(){if(S.over)return;const n=facProvs(S.player).length;if(n>=Math.ceil(NP*.5))S.over='win';else if(S.turn>=END_TURN)S.over='time';}

let busy=false;
function endTurn(){
 if(busy||!S||S.over)return;busy=true;$('#endTurn').disabled=true;clearSel();SND.play('turn');
 $('#endTurn').textContent=lng('Hamleler…','Moves…');
 setTimeout(()=>{
  const t0=performance.now();
  S.news=[];S.report=[];TURN_TRACE.length=0;pruneOffers();
  runHooks('turnStart');
  const order=FK.filter(f=>f!==S.player&&alive(f));for(let i=order.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  order.forEach(f=>{runHooks('preAI',f);aiTurn(f);});
  endRound();
  runHooks('afterRound');
  checkVictory();
  if(!S.over)runHooks('events');
  KE.stats.turnMs=performance.now()-t0;
  save();polDirty=true;renderAll();
  const fin=()=>{$('#endTurn').textContent=S.over?lng('Oyun bitti','Game over'):lng('Turu Bitir','End Turn');$('#endTurn').disabled=false;busy=false;};
  if(S.over){fin();queueModal(showEnd);return;}
  present(fin);
 },30);
}

/* default presenters: battle fx (A replaces 'fx' with a replay by id) and the season report */
PRESENTERS.push({id:'fx',order:50,run(next){
 S.battles.filter(b=>b.turn===S.turn-1).slice(-30).forEach((b,k)=>{const me=b.att===S.player||b.def===S.player;
  if(me)addFx({type:'march',a:b.from,b:b.to,dur:420,delay:k*140,col:FAC[b.att].c});
  addFx({type:'boom',p:b.to,dur:1300,delay:k*140+(me?400:0),seed:k*1.7,label:b.def===S.player?(b.win?lng('Kaybedildi','Lost'):lng('Savunuldu','Held')):'',good:b.def===S.player&&!b.win});});
 next();}});
PRESENTERS.push({id:'report',order:90,run(next){
 if(S.news.some(n=>n.k==='war'))setTimeout(()=>SND.play('war'),600);else if(S.report.length)setTimeout(()=>SND.play('battle',{}),500);
 if(S.report.length||S.news.length||S.offers.length)queueModal(showReport);
 next();}});
