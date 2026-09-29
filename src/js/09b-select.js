/* =====================================================================
   MAP SELECTION (Track B): province / army click -> select, order a move, clear, target check
   - nothing selected: tap a province -> select it (and the player's largest army there, if any)
   - army selected: tap a province it can reach this season -> move order (panel "orders", confirm with amove)
   - tap an army token (tokenAt from Track A, if present) -> select that army
   ===================================================================== */
/** Select province i and (optionally) army id; with id undefined the player's largest army in i is picked. */
function armSelect(i,id){sel=i;tgt=-1;confirmKey='';
 if(id===undefined){const a=S&&S.player?armyAt(i,S.player).sort((x,y)=>y.n-x.n)[0]:null;selArmy=a?a.id:null;}else selArmy=id;}
function mapClick(sx,sy){
 if(!S||!S.player||busy||!$('#start').hidden)return;
 const tok=typeof tokenAt==='function'?tokenAt(sx,sy):null,ta=tok!=null?armyById(tok):null;
 if(ta){if(ta.f===S.player){const same=selArmy===ta.id&&tgt<0;if(same){clearSel();return;}armSelect(ta.loc,ta.id);}
  else{const a=armyById(selArmy);if(a&&a.f===S.player&&armyCanMove(a.id,ta.loc).ok){tgt=ta.loc;SND.play('select');renderPanel();req();return;}armSelect(ta.loc,null);}
  SND.play('select');renderPanel();req();return;}
 const id=pickAt(sx,sy);
 if(id<0){clearSel();return;}
 const a=armyById(selArmy);
 if(a&&a.f===S.player&&id!==a.loc){const c=armyCanMove(a.id,id);
  if(c.ok){tgt=id;sel=a.loc;SND.play('select');renderPanel();req();return;}
  if(c.path&&c.cost<=a.mpMax){toast(c.reason);return;} // in range in principle, but not this season
 }
 if(id===sel&&tgt>=0){tgt=-1;renderPanel();req();return;}
 if(id===sel){clearSel();return;}
 armSelect(id);SND.play('select');renderPanel();req();
}
function clearSel(){sel=-1;tgt=-1;selArmy=null;confirmKey='';$('#panel').hidden=true;req();}
/** The pending move order (selected player army -> tgt) is still legal. */
function tgtOk(){if(sel<0||tgt<0||!S||!S.player)return false;const a=armyById(selArmy);return !!a&&a.f===S.player&&armyCanMove(a.id,tgt).ok;}
