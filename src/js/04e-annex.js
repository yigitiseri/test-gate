/* =====================================================================
   ANNEX: the player's occupied provinces become theirs without waiting for peace.
   An occupation (S.prov[i].ctl, Track B) that the player has held for BAL_ANNEX.turns turns while the war goes
   on can be annexed from the province panel ("İlhak et"). Capitals keep B's rules (peace table, or annexed
   once the war is 20 turns old). The AI keeps using peace treaties. Aggressive expansion follows from
   capture() as for any conquest.
   S.prov[i].ctlT: turn the current occupation was first seen (set at round end; optional, migrated).
   ===================================================================== */
const BAL_ANNEX={turns:4};
/** Turns the current occupation of province i has lasted. */
function annexHeld(i){const p=S.prov[i];return p.ctl?S.turn-(p.ctlT!=null?p.ctlT:S.turn):0;}
/** Can the player annex province i now? {ok, left, why} */
function annexCan(i){const p=S.prov[i],pl=S.player;
 if(!p||p.ctl!==pl||p.o===pl)return {ok:false,why:'none'};
 if(!atWar(pl,p.o))return {ok:false,why:'peace'};
 if(S.fac[p.o].cap===i)return {ok:false,why:'capital'};
 const left=BAL_ANNEX.turns-annexHeld(i);return left>0?{ok:false,why:'wait',left}:{ok:true};}
function annexStamp(){if(!S||!S.prov)return;for(const p of S.prov){if(p.ctl){if(p.ctlT==null)p.ctlT=S.turn;}else if(p.ctlT!=null)delete p.ctlT;}}
hook('roundEnd',()=>{annexStamp();
 if(!S.player)return;for(let i=0;i<S.prov.length;i++){const p=S.prov[i];if(p.ctl===S.player&&p.o!==S.player&&annexHeld(i)===BAL_ANNEX.turns&&annexCan(i).ok)
  news(lng(`${PD[i].name} artık ilhak edilebilir: eyalete dokun ve "İlhak et"e bas.`,`${PD[i].name} can now be annexed: tap the province and press "Annex".`),'good');}},99);
hook('siegeFell',(i,f)=>{if(!S.player||f!==S.player||S.prov[i].ctl!==f)return;S.prov[i].ctlT=S.turn;
 news(lng(`${PD[i].name} işgal edildi. ${BAL_ANNEX.turns} tur elinde tutarsan "İlhak et" ile senin olur; Barış Masası'nda da isteyebilirsin.`,`${PD[i].name} is occupied. Hold it for ${BAL_ANNEX.turns} turns and "Annex" makes it yours; you can also demand it at the Peace Table.`),'good');},70);
hook('migrate',s=>{for(const p of s.prov||[])if(p.ctl&&p.ctlT==null)p.ctlT=s.turn||0;},90);
PANEL_SECTIONS.push({id:'annex',order:29,when:c=>!!S.player&&c.p.ctl===S.player&&c.p.o!==S.player,html(c){const r=annexCan(c.i),held=annexHeld(c.i);
 let h=`<div class="sec annex-sec"><h3>${lng('İlhak','Annexation')}</h3>`;
 if(r.ok)h+=`<div class="hint">${lng(`${held} turdur elimizde. Artık kalıcı olarak topraklarımıza katabiliriz.`,`We have held it for ${held} turns. We can now make it part of our realm for good.`)}</div><div class="acts"><button class="btn primary" data-act="annex" data-i="${c.i}">${lng('İlhak et','Annex')}</button></div>`;
 else if(r.why==='wait')h+=`<div class="hint">${lng(`${r.left} tur daha elinde tutarsan ilhak edebilirsin.`,r.left===1?'Hold it for 1 more turn and you can annex it.':`Hold it for ${r.left} more turns and you can annex it.`)}</div>`;
 else if(r.why==='capital')h+=`<div class="hint">${lng('Başkentler ilhak edilemez: Barış Masası\'nda iste ya da savaş uzarsa kendiliğinden senin olur.','Capitals cannot be annexed: demand it at the Peace Table, or it becomes yours if the war drags on.')}</div>`;
 else h+=`<div class="hint">${lng('Savaş bittiği için ilhak edilemez.','The war is over, so it can no longer be annexed.')}</div>`;
 return h+'</div>';}});
ACTS.annex=t=>{const i=+t.dataset.i;if(!annexCan(i).ok)return;const old=S.prov[i].o;capture(i,S.player);
 SND.play('fanfare');toast(lng(`${PD[i].name} artık bizim!`,`${PD[i].name} is ours!`),'good');
 addLog(lng(`${PD[i].name}, ${FAC[old].s} elinden alınıp ilhak edildi.`,`${PD[i].name} was taken from ${FAC[old].s} and annexed.`),'cap');
 if(S.over){save();renderAll();queueModal(showEnd);return;}checkMissions();save();renderAll();req();};
KE.annex={can:i=>annexCan(i),held:i=>annexHeld(i),turns:BAL_ANNEX.turns};
