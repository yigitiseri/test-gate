/* =====================================================================
   MAP SELECTION (Track B): province click -> select / target, clear, target check
   ===================================================================== */
function mapClick(sx,sy){
 if(!S||!S.player||busy||!$('#start').hidden)return;
 const id=pickAt(sx,sy);
 if(id<0){clearSel();return;}
 if(sel>=0&&S.prov[sel].o===S.player&&id!==sel&&PD[sel].adj.includes(id)){
  const o=S.prov[id].o;
  if(o===S.player||atWar(S.player,o)){if(avail(sel)<100){toast('Bu eyaletteki askerler bu tur zaten hareket etti.');return;}tgt=id;amt=Math.round(avail(sel)/100)*100;SND.play('select');renderPanel();req();return;}
 }
 if(id===sel&&tgt<0){clearSel();return;}
 sel=id;tgt=-1;confirmKey='';SND.play('select');renderPanel();req();
}
function clearSel(){sel=-1;tgt=-1;confirmKey='';$('#panel').hidden=true;req();}
function tgtOk(){if(sel<0||tgt<0||!S||!S.player)return false;const f=S.player,o=S.prov[tgt].o;return S.prov[sel].o===f&&PD[sel].adj.includes(tgt)&&(o===f||atWar(f,o));}

