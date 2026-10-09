/* =====================================================================
   DIFFICULTY: easy, normal or hard, picked on the start screen (kept as the next game's default) and stored
   in the save as S.dif (old saves: normal). Every effect is visible where it applies:
    - the treasury at the start;
    - a ledger row: on easy the player's taxes +15%, on hard every other realm's taxes +12%;
    - battles the player fights: on easy its side +10%, on hard the other side +10% (shown on the odds card);
    - how soon and how readily the AI turns on the player (05b reads difV: grace, ratio, agg).
   ===================================================================== */
const DIF_STORE='aod-dif-v1';
const DIF={
 easy:{n:['Kolay','Easy'],d:['Daha çok altınla başlarsın, vergilerin %15 fazladır, savaşlarda +%10 güçlüsün ve komşuların sana daha geç ve daha isteksiz saldırır.','You start with more gold, your taxes are 15% higher, you fight 10% stronger and your neighbours turn on you later and less readily.'],
  gold:1.6,tax:.15,aiTax:0,bat:1.1,aiBat:1,grace:2,ratio:.35,agg:.6},
 normal:{n:['Normal','Normal'],d:['Tarihin kendisi kadar zor: kimseye ayrıcalık yok.','As hard as history itself: no favours for anyone.'],
  gold:1,tax:0,aiTax:0,bat:1,aiBat:1,grace:1,ratio:0,agg:1},
 hard:{n:['Zor','Hard'],d:['Daha az altınla başlarsın, öteki devletlerin vergileri %12 fazladır, karşına çıkan ordular +%10 güçlüdür ve komşuların sana daha erken saldırır.','You start with less gold, every other realm\'s taxes are 12% higher, the armies you face fight 10% stronger and your neighbours turn on you sooner.'],
  gold:.6,tax:0,aiTax:.12,bat:1,aiBat:1.1,grace:.5,ratio:-.15,agg:1.35}};
const DIF_K=['easy','normal','hard'];
let startDif=(()=>{try{const v=localStorage.getItem(DIF_STORE);return DIF[v]?v:'normal';}catch(e){return 'normal';}})();
function difKey(){return S&&DIF[S.dif]?S.dif:'normal';}
/** A difficulty knob of the current game (grace, ratio, agg ...). */
function difV(k){return DIF[difKey()][k];}
const difName=k=>lng(DIF[k].n[0],DIF[k].n[1]);
hook('newGame',(s,f)=>{s.dif=startDif;if(f&&s.fac[f])s.fac[f].gold=Math.round(s.fac[f].gold*DIF[startDif].gold);});
hook('migrate',s=>{if(!DIF[s.dif])s.dif='normal';});
ECON_ROWS.push(f=>{if(!S||!S.player)return null;const D=DIF[difKey()],r=f===S.player?D.tax:D.aiTax;if(!r)return null;
 let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f&&!S.prov[i].ctl)s+=provIncome(i);
 return [{id:'dif',l:lng(`Zorluk: ${DIF[difKey()].n[0]}`,`Difficulty: ${DIF[difKey()].n[1]}`),v:s*r,k:'inc',
  tip:f===S.player?lng('Kolay oyunda vergilerin %15 fazla gelir.','On easy your taxes bring in 15% more.'):lng('Zor oyunda öteki devletlerin vergileri %12 fazla gelir.','On hard every other realm\'s taxes bring in 12% more.')}];});
BATTLE_MODS.push(ctx=>{if(!S||!S.player||!ctx.att)return null;const D=DIF[difKey()];if(D.bat===1&&D.aiBat===1)return null;
 const pl=ctx.att===S.player?'att':ctx.def===S.player||(ctx.defFs||[]).includes(S.player)?'def':null;if(!pl)return null;
 if(D.bat!==1)return [{l:lng('Kolay oyun','Easy game'),m:D.bat,side:pl,k:'dif'}];
 return [{l:lng('Zor oyun','Hard game'),m:D.aiBat,side:pl==='att'?'def':'att',k:'dif'}];});
/** The difficulty choice on the start screen. */
function difPickHtml(){return `<div class="difrow" role="radiogroup" aria-label="${lng('Zorluk','Difficulty')}"><span class="difl">${lng('Zorluk','Difficulty')}</span>${DIF_K.map(k=>`<button class="difb${k===startDif?' on':''}" role="radio" aria-checked="${k===startDif}" data-act="sdif" data-d="${k}">${difName(k)}</button>`).join('')}</div>
 <div class="difd">${esc(lng(DIF[startDif].d[0],DIF[startDif].d[1]))}</div>`;}
ACTS.sdif=t=>{const k=t.dataset.d;if(!DIF[k])return;startDif=k;try{localStorage.setItem(DIF_STORE,k);}catch(e){}SND.play('click');renderStart();};
KE.dif={get:()=>difKey(),set:k=>{if(DIF[k])startDif=k;},v:k=>difV(k)};
