/* =====================================================================
   UNDO: the player's last orders this season can be taken back (up to UNDO_MAX), as long as nothing left to chance
   has happened since. Before an undoable order (UNDO_OK: marches, merges, splits, recruiting, building, reforms ...)
   the whole state is kept as JSON; the ↶ button (above the zoom buttons) or Ctrl+Z puts it back.
   Anything else that changes the world (a battle, a capture, an event choice, diplomacy, peace, the end of the
   season, loading a game) clears the list, so a battle or an event can never be replayed for a better roll.
   act() (11-ui-core) runs the preAct/postAct hooks around every click.
   ===================================================================== */
const UNDO_MAX=8,UNDO=[];
const UNDO_OK=new Set(['amove','amerge','asplit','adisband','gdisband','grec','rec1','rec5','recc','reca','bdev','bmkt','bbrk','bfort','adest','adestx','wkbuild','rfbuy','cmd-set','dvset','dvx']);
/* clicks that only look or select (they neither keep nor clear the list) */
const UNDO_UI=new Set(['undo','zin','zout','fit','v3d','mode','tmode','snd','close','cancel','asel','go','help','guide','state','chron','diplo','ledger','lg-met','lg-sort','lg-all','lg-riv',
 'missions','menu','adv','adv-go','adv-mute','adv-toggle','tut-skip','tut-restart','cyc-prov','cyc-army','ui-idle','ui-inbox','trades','trmap','reforms','sgrp','bcard','bcard-x','scard',
 'a-replay','a-speed','a-q3d','a-skip','adestno','mclose','sv-open','sv-tab','sv-exp','sv-exp-cur','sv-exp-auto','sv-ren','sv-ren-x','sv-ren-ok','lang','cmd-open','pt-prov','pt-rel','pt-gold','pt-auto','pt-clear','snd-music','snd-sfx','sdif','pick','divan']);
const UNDO_L={amove:['Ordu yürüdü','The march'],amerge:['Ordular birleşti','The merge'],asplit:['Ordu bölündü','The split'],adisband:['Ordu dağıtıldı','The disbanding'],gdisband:['Garnizon azaltıldı','The garrison cut'],
 grec:['Garnizon toplandı','The garrison levy'],rec1:['Asker toplandı','The levy'],rec5:['Asker toplandı','The levy'],recc:['Süvari toplandı','The horse levy'],reca:['Topçu toplandı','The gun levy'],
 bdev:['İmar','The building'],bmkt:['Pazar kuruldu','The market'],bbrk:['Kışla kuruldu','The barracks'],bfort:['Kale yükseltildi','The walls'],adest:['Sefere çıkıldı','The long march'],adestx:['Sefer durdu','The halt'],
 wkbuild:['Eser başladı','The great work'],rfbuy:['Gelişme alındı','The reform'],dvset:['Atama','The appointment'],dvx:['Azil','The dismissal'],'cmd-set':['Komutan atandı','The new commander']};
let undoTok=null;
const undoLabel=a=>{const l=UNDO_L[a];return l?lng(l[0],l[1]):lng('Son hamle','The last order');};
function undoClear(){if(UNDO.length){UNDO.length=0;undoUi();}}
function undoUi(){const b=document.getElementById('undoBtn');if(!b)return;const u=UNDO[UNDO.length-1],on=!!u&&!!S&&!!S.player&&!S.over&&!busy;b.hidden=!on;
 if(on){const t=lng(`Geri al: ${undoLabel(u.a)} (Ctrl+Z)`,`Undo: ${undoLabel(u.a)} (Ctrl+Z)`);b.title=t;b.setAttribute('aria-label',t);b.dataset.n=UNDO.length>1?UNDO.length:'';}}
hook('preAct',(a)=>{if(!S||!S.player||S.over||busy)return;if(UNDO_OK.has(a)){undoTok={a,s:JSON.stringify(S),t:S.turn};UNDO.push(undoTok);if(UNDO.length>UNDO_MAX)UNDO.shift();return;}
 if(!UNDO_UI.has(a))undoClear();});
hook('postAct',(a)=>{const k=undoTok;undoTok=null;if(!k)return;const i=UNDO.indexOf(k);if(i<0){undoUi();return;}
 if(JSON.stringify(S)===k.s)UNDO.splice(i,1);   // the order changed nothing (not enough gold, a closed road ...)
 undoUi();});
/* chance or the world moved on: nothing before it can be undone */
for(const h of ['turnStart','newGame','enterGame','capture','siegeFell','peace','eliminate','warDeclared','succession','events'])hook(h,()=>{UNDO.length=0;undoUi();});
hook('battleResolved',rep=>{if(rep&&(rep.att===S.player||rep.def===S.player||(rep.defFs||[]).includes(S.player))){UNDO.length=0;undoUi();}});
hook('renderAll',()=>undoUi());
/** Put the state back as it was before the last undoable order. */
function undoLast(){const u=UNDO.pop();if(!u||!S||S.turn!==u.t||busy){UNDO.length=0;undoUi();return false;}
 S=migrate(JSON.parse(u.s));farTgt=-1;clearSel();polDirty=true;renderAll();
 toast(lng(`Geri alındı: ${undoLabel(u.a)}`,`Undone: ${undoLabel(u.a)}`));runHooks('undo',u.a);undoUi();return true;}
ACTS.undo=()=>{undoLast();};
hook('boot',()=>{const z=document.getElementById('zoom');if(!z||document.getElementById('undoBtn'))return;const b=document.createElement('button');
 b.id='undoBtn';b.dataset.act='undo';b.hidden=true;b.textContent='↶';b.style.fontSize='20px';z.insertBefore(b,z.firstChild);});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&(e.key==='z'||e.key==='Z')){const tag=e.target&&e.target.tagName;if(/INPUT|TEXTAREA/.test(tag||''))return;
 if(!S||!S.player||!$('#modal').hidden||!UNDO.length)return;e.preventDefault();SND.play('click');undoLast();}});
KE.undo={n:()=>UNDO.length,last:()=>undoLast(),labels:()=>UNDO.map(u=>u.a)};
