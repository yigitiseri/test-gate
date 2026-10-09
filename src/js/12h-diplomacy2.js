/* =====================================================================
   DIPLOMACY, DEEPER: royal marriages and calling an ally to war (rows in the diplomacy window, 12b).
    - Marriage: S.mar = {pairKey: turn}. The player offers a marriage for a dowry (BAL_MR.cost) to a realm at
      peace that thinks well enough of it (faith matters). While the houses are joined, relations never sink
      below BAL_MR.floor and that realm's wish to fight the player is cut (05b reads marLink). Declaring war on
      a joined house ends the marriage. At most BAL_MR.max marriages.
    - Call to arms: during a war the player asks an ally to join it. The ally answers from relations, its own
      wars and the foe's might (no dice); a refusal waits BAL_MR.ctaWait seasons before the same request.
   ===================================================================== */
const BAL_MR={cost:40,op:25,floor:25,max:3,needSame:10,needOther:40,agg:.4,ctaOp:30,ctaWars:2,ctaRatio:.3,ctaWait:8};
function marS(){if(!S.mar)S.mar={};return S.mar;}
/** Are the houses of a and b joined by marriage? */
function marLink(a,b){return !!(S&&S.mar&&S.mar[key(a,b)]!=null);}
const marOf=f=>Object.keys((S&&S.mar)||{}).filter(k=>k.split('|').includes(f)).map(k=>k.split('|').find(x=>x!==f));
/** Would realm o accept a marriage with the player? -> {ok, why} */
function marCan(o){const pl=S.player,F=S.fac[pl];if(marLink(pl,o))return {ok:false,why:'has'};if(atWar(pl,o))return {ok:false,why:'war'};
 if(marOf(pl).length>=BAL_MR.max)return {ok:false,why:'max'};if(F.gold<BAL_MR.cost)return {ok:false,why:'gold'};
 const same=FAC[o].rel===FAC[pl].rel,need=same?BAL_MR.needSame:BAL_MR.needOther;if(getOp(o,pl)<need)return {ok:false,why:'op',need};return {ok:true};}
function marMake(o){const c=marCan(o);if(!c.ok)return c;const pl=S.player;S.fac[pl].gold-=BAL_MR.cost;marS()[key(pl,o)]=S.turn;addOp(pl,o,BAL_MR.op);
 news(lng(`${FAC[pl].s} ile ${FAC[o].s} hanedanları evlilikle birleşti.`,`The houses of ${FAC[pl].s} and ${FAC[o].s} are joined by marriage.`),'good');runHooks('marriage',pl,o);return c;}
hook('migrate',s=>{if(s.mar&&typeof s.mar!=='object')s.mar={};});
hook('newGame',s=>{s.mar={};s.cta={};});
hook('newTurn',()=>{if(!S.mar)return;for(const k in S.mar){const [a,b]=k.split('|');if(!alive(a)||!alive(b)){delete S.mar[k];continue;}if(getOp(a,b)<BAL_MR.floor)addOp(a,b,Math.min(2,BAL_MR.floor-getOp(a,b)));}});
hook('warDeclared',(a,b)=>{if(!marLink(a,b))return;delete S.mar[key(a,b)];
 const m=lng(`${fname(a)} ile ${fname(b)} arasındaki hanedan bağı savaşla koptu.`,`War has broken the marriage bond between ${fname(a)} and ${fname(b)}.`);(a===S.player||b===S.player)?news(m,'war'):addLog(m,'war');});

/* --- call to arms --- */
/** Would ally a join the player's war against e? -> {ok, why} */
function ctaCan(a,e){const pl=S.player;if(!isAlly(pl,a)||!atWar(pl,e))return {ok:false,why:'no'};if(atWar(a,e))return {ok:false,why:'in'};
 if(isAlly(a,e)||inTruce(a,e))return {ok:false,why:'bound'};const w=S.cta&&S.cta[a+'>'+e];if(w!=null&&S.turn<w)return {ok:false,why:'wait',left:w-S.turn};
 if(getOp(a,pl)<BAL_MR.ctaOp)return {ok:false,why:'op'};if(warsOf(a).length>=BAL_MR.ctaWars)return {ok:false,why:'busy'};
 if(strength(a)<strength(e)*BAL_MR.ctaRatio)return {ok:false,why:'weak'};return {ok:true};}
function ctaAsk(a,e){const c=ctaCan(a,e);if(c.why==='no'||c.why==='in'||c.why==='wait')return c;
 if(!c.ok){if(!S.cta)S.cta={};S.cta[a+'>'+e]=S.turn+BAL_MR.ctaWait;return c;}
 declareWar(a,e);addOp(a,S.player,5);news(lng(`${FAC[a].s} çağrımıza uydu ve ${FAC[e].s} devletine savaş açtı.`,`${FAC[a].s} answered our call and declared war on ${FAC[e].s}.`),'good');return c;}
const ctaWhy=(c,a,e)=>c.why==='op'?lng(`${FAC[a].s} bize yeterince yakın değil (ilişki ${BAL_MR.ctaOp} gerekir).`,`${FAC[a].s} is not close enough to us (relations of ${BAL_MR.ctaOp} needed).`)
 :c.why==='busy'?lng(`${FAC[a].s} zaten başka savaşlarla uğraşıyor.`,`${FAC[a].s} already has wars of its own.`)
 :c.why==='weak'?lng(`${FAC[a].s}, ${FAC[e].s} karşısında kendini fazla zayıf buluyor.`,`${FAC[a].s} feels too weak to face ${FAC[e].s}.`)
 :c.why==='bound'?lng(`${FAC[a].s}, ${FAC[e].s} ile antlaşmalı.`,`${FAC[a].s} is bound by a treaty with ${FAC[e].s}.`)
 :c.why==='wait'?lng(`${FAC[a].s} cevabını vermişti; ${c.left} mevsim sonra yeniden sorabilirsin.`,`${FAC[a].s} has given its answer; you may ask again in ${c.left} ${c.left===1?'season':'seasons'}.`):'';

/* --- the diplomacy window --- */
DIPLO_ROW.push({id:'dp2',order:30,
 meta(f){return marLink(S.player,f)?`<span class="chip mar">♥ ${lng('Hanedan bağı','Joined by marriage')}</span>`:'';},
 buttons(f){const pl=S.player;let b='';
  if(!atWar(pl,f)&&!marLink(pl,f)){const c=marCan(f),t=c.ok?'':c.why==='op'?lng(`İlişki en az ${c.need} olmalı`,`Relations of at least ${c.need} needed`):c.why==='max'?lng(`En fazla ${BAL_MR.max} evlilik`,`At most ${BAL_MR.max} marriages`):c.why==='gold'?lng('Yeterli altın yok','Not enough gold'):'';
   b+=`<button class="btn" data-act="dp-marry" data-f="${f}"${c.ok?'':' disabled'}${t?` title="${esc(t)}"`:''}>${lng(`Evlilik öner (${BAL_MR.cost})`,`Offer a marriage (${BAL_MR.cost})`)}</button>`;}
  if(isAlly(pl,f))for(const e of warsOf(pl).slice(0,3)){if(e===f||atWar(f,e))continue;const c=ctaCan(f,e);
   b+=`<button class="btn" data-act="dp-cta" data-f="${f}" data-e="${e}"${c.why==='wait'?' disabled':''}${c.why==='wait'?` title="${esc(ctaWhy(c,f,e))}"`:''}>${lng(`Savaşa çağır: ${FAC[e].s}`,`Call to arms: ${FAC[e].s}`)}</button>`;}
  return b;}});
ACTS['dp-marry']=t=>{const o=t.dataset.f,c=marMake(o);if(c.ok){SND.play('peace');toast(lng(`${FAC[o].s} evlilik teklifini kabul etti.`,`${FAC[o].s} accepted the marriage.`),'good');}renderAll();showDiplo();};
ACTS['dp-cta']=t=>{const a=t.dataset.f,e=t.dataset.e,c=ctaAsk(a,e);if(c.ok){SND.play('war');toast(lng(`${FAC[a].s} savaşa katıldı.`,`${FAC[a].s} joins the war.`),'good');}else{const w=ctaWhy(c,a,e);if(w)toast(lng(`Ret: ${w}`,`Refused: ${w}`),'war');}renderAll();showDiplo();};
OVERBLOCK.add('dp-marry');OVERBLOCK.add('dp-cta');
KE.mar={make:o=>marMake(o),link:(a,b)=>marLink(a,b),can:o=>marCan(o),cta:(a,e)=>ctaAsk(a,e),ctaCan:(a,e)=>ctaCan(a,e)};
