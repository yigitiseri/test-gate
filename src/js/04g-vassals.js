/* =====================================================================
   VASSALS / HARAÇGÜZARLAR (Track V, Wave 3)
   A defeated realm can be made a vassal at the Peace Table instead of losing its land (basket field vas:true,
   priced in war score like the rest of the basket). A vassal:
    - keeps its land, ruler and AI (it defends itself), but pays its overlord a share of its provincial taxes
      every season (ECON_ROWS: 'vasTrib' on both sides);
    - is bound to its overlord as an ally (S.ally), so the overlord defends it and its armies may cross;
      it also follows the overlord into the wars the overlord starts (hook warDeclared);
    - declares no wars and makes no alliances of its own (05b guards with vasOf);
    - has a liberty desire (0..100) that drifts toward a target: higher when it is strong next to its overlord,
      when the overlord fights its fellow believers or is losing a war; lower with good relations and long years;
    - may rebel when the desire is high (it breaks free and declares war on the overlord).
   An overlord may annex a loyal vassal after BAL_V.annexTurns turns for gold (less alarm than a conquest).
   The AI uses vassalage too (aiSettle in 05b asks vasAiSettle first), mostly for the historical tributaries.
   Schema: S.vas = {vassal: {o: overlord, t: turn it began, lib: liberty desire}}. Optional; migrate fills {}.
   The player's own realm is never made a vassal (the AI does not demand it; see hand-back).
   ===================================================================== */
const BAL_V={
 price:.6,minCost:3,      // vassalage costs 60% of what all their remaining land would cost at the table (as if occupied), at least 3
 maxDev:.6,maxVas:5,      // only a realm with at most 60% of our development bows; at most 5 vassals per overlord
 trib:.2,                 // a vassal pays a fifth of its provincial taxes every season
 libBase:10,libStr:50,    // liberty target: 10 + 50 x (their strength / ours, up to 1.5)
 libFaith:20,libWeak:10,  // +20 while the overlord fights the vassal's fellow believers; +10 while it is losing a war
 libOp:.25,               // minus a quarter of the relations between them
 libYears:15,libYearT:8,  // minus one point every 8 turns of vassalage, up to 15
 libRate:.15,             // the desire moves 15% of the way to its target every turn
 loyal:35,rebel:70,       // below 35: loyal (can be annexed); from 70: ready to revolt
 rebelP:.1,rebelGrace:12,rebelRatio:.5, // revolt chance per turn when the overlord is at war or the vassal has half its strength
 annexTurns:40,annexGold:8,aeMul:.5,    // annex a loyal vassal after 10 years for 8 gold per development; half the alarm of a conquest
 aiAnnexP:.05,aiAnnexKeep:100,          // an AI overlord annexes with this chance per turn when it keeps 100 gold afterwards
 aiHistP:.7,aiP:.25,                    // an AI winner asks for vassalage: historical tributaries 70%, others 25%
 hist:{OSM:['WAL','MOL','SRB','BOS','KRM','DUL','CAN','GEO','TRB'],HUN:['WAL','MOL','BOS','SRB'],POL:['MOL','WAL'],
  MAM:['DUL'],KKY:['GEO'],AKK:['GEO'],VEN:['ALB'],HAB:['HUN']},
 col:.45,                 // map: a vassal is drawn in its overlord's colour mixed 45% with parchment
};
/** Overlord of f, or null. */
function vasOf(f){return S&&S.vas&&S.vas[f]&&S.vas[f].o||null;}
/** Living vassals of overlord o. */
function vasList(o){const out=[];if(!S||!S.vas)return out;for(const v in S.vas)if(S.vas[v].o===o&&alive(v))out.push(v);return out;}
/** Is one of a, b the vassal of the other? */
function vasLink(a,b){return vasOf(a)===b||vasOf(b)===a;}
/** Provinces v keeps after basket bk (ceded and released provinces left out). */
function vasKeeps(v,bk){const out=facProvs(v);if(!bk)return out;const gone=new Set(bk.prov||[]);
 for(const r of bk.release||[])for(const i of peaceRelProvs(r,v))gone.add(i);return out.filter(i=>!gone.has(i));}
/** Can o make v its vassal? -> {ok, why} (why: dead, self, player, pretender, already, meVas, hasVas, many, big, empty) */
function vasCan(o,v,bk){if(!S||!alive(o)||!alive(v))return {ok:false,why:'dead'};if(o===v)return {ok:false,why:'self'};
 if(v===S.player)return {ok:false,why:'player'};if(v==='CLM')return {ok:false,why:'pretender'};
 if(vasOf(v))return {ok:false,why:'already',f:vasOf(v)};if(vasOf(o))return {ok:false,why:'meVas'};
 if(vasList(v).length)return {ok:false,why:'hasVas'};if(vasList(o).length>=BAL_V.maxVas)return {ok:false,why:'many'};
 if(devRaw(v)>devRaw(o)*BAL_V.maxDev)return {ok:false,why:'big'};
 if(!vasKeeps(v,bk).length)return {ok:false,why:'empty'};
 return {ok:true};}
/** Plain words for a vasCan refusal. */
function vasWhyText(r){switch(r&&r.why){
 case 'already':return lng(`Zaten ${FAC[r.f].s} haraçgüzarılar.`,`They already pay tribute to ${FAC[r.f].s}.`);
 case 'meVas':return lng('Kendimiz haraçgüzarken haraçgüzar tutamayız.','A vassal cannot hold vassals of its own.');
 case 'hasVas':return lng('Kendi haraçgüzarları var; böyle bir devlet boyun eğmez.','They hold vassals of their own and will not bow.');
 case 'many':return lng('Daha fazla haraçgüzarı yönetemeyiz.','We cannot hold any more vassals.');
 case 'big':return lng('Boyun eğmeyecek kadar büyükler: toprakları bizimkine yakın zenginlikte.','They are too great to bow: their lands are nearly as rich as ours.');
 case 'empty':return lng('Ellerinde hiç toprak kalmıyor.','They would have no land left.');
 case 'pretender':return lng('Taht davacıları haraçgüzar olmaz.','Pretenders cannot become vassals.');
 case 'player':return lng('Bu devlet haraçgüzar yapılamaz.','This realm cannot be made a vassal.');
 default:return '';}}
/** War-score price of making v a vassal of o (the land v keeps after basket bk). */
function vasCost(o,v,bk){let s=0;for(const i of vasKeeps(v,bk)){const p=S.prov[i];s+=BAL_S.prov+p.dev*BAL_S.provDev+(S.fac[v].cap===i?BAL_S.provCap:0);}
 return Math.round(Math.max(BAL_V.minCost,s*BAL_V.price)*10)/10;}
/** peaceValue plus the price of vassalage when bk.vas (a demands from b). */
function vasPeaceValue(bk,a,b){const v=peaceValue(bk,a,b);return bk&&bk.vas?Math.round((v+vasCost(a,b,bk))*10)/10:v;}
/** aiAcceptBasket that understands bk.vas: `ai` accepts becoming other's vassal when it may and the price fits its limit. */
function vasAccept(ai,other,bk){if(!bk||!bk.vas)return aiAcceptBasket(ai,other,bk);
 if(!vasCan(other,ai,bk).ok||!aiAcceptBasket(ai,other,peaceNorm(bk)))return false;
 return vasPeaceValue(bk,other,ai)<=peaceLimit(ai,other)+1e-9;}
/** Sign basket bk (taker gets it from giver); with bk.vas the giver then becomes the taker's vassal. */
function vasTreaty(taker,giver,bk){const ok=!!(bk&&bk.vas)&&vasCan(taker,giver,bk).ok;makePeace(taker,giver,peaceNorm(bk));
 if(ok&&alive(giver)&&alive(taker)&&vasCan(taker,giver).ok)vasMake(taker,giver,'peace');return true;}
/** The player (pl) proposes basket bk (may carry vas) to ai. -> accepted */
function vasOffer(pl,ai,bk){if(!atWar(pl,ai))return false;if(!bk.vas)return offerBasket(pl,ai,bk);
 if(vasAccept(ai,pl,bk)){vasTreaty(pl,ai,bk);return true;}addOp(pl,ai,-5);return false;}
/** v becomes the vassal of o: they are bound as allies, v's other alliances and v's own vassals are let go. */
function vasMake(o,v,how){if(!S.vas)S.vas={};if(!vasCan(o,v).ok)return false;
 for(const k of Object.keys(S.ally)){const [a,b]=k.split('|');if((a===v||b===v)&&a!==o&&b!==o)delete S.ally[k];}
 S.vas[v]={o,t:S.turn,lib:0};S.vas[v].lib=Math.round(vasLibInfo(v).t);S.ally[key(o,v)]=true;
 const m=lng(`${FAC[v].n} artık ${FAC[o].s} haraçgüzarı: toprakları kendinde kalıyor, her mevsim haraç ödeyecek ve savaşlarda ${FAC[o].s} yanında yürüyecek.`,
  `The ${FAC[v].n} is now a vassal of ${FAC[o].s}: it keeps its lands, pays tribute every season and marches with ${FAC[o].s} in war.`);
 o===S.player||v===S.player?news(m,'good'):addLog(m,'cap');
 polDirty=true;runHooks('vassal',o,v,how||'peace');return true;}
/** The bond of v ends (why: 'free' given freedom, 'war' it is at war with its overlord, 'fall' the overlord fell, 'gone'). */
function vasFree(v,why){if(!S.vas||!S.vas[v])return;const o=S.vas[v].o;delete S.vas[v];if(!atWar(o,v)&&why!=='war')delete S.ally[key(o,v)];
 if(why==='free'||why==='fall'){const m=why==='free'?lng(`${FAC[v].n} artık özgür: ${FAC[o].s} haraçgüzarlığı sona erdi.`,`The ${FAC[v].n} is free: it no longer pays tribute to ${FAC[o].s}.`)
   :lng(`${FAC[o].s} düşünce ${FAC[v].s} haraçgüzarlıktan kurtuldu.`,`With the fall of ${FAC[o].s}, ${FAC[v].s} no longer pays tribute to anyone.`);
  o===S.player||v===S.player?news(m,'good'):addLog(m,'info');}
 polDirty=true;runHooks('vassalFree',o,v,why);}

/* ---------- tribute (ECON_ROWS) ---------- */
/** Provincial taxes of f (its own unoccupied provinces), the base of its tribute. */
function vasTaxBase(f){let s=0;for(let i=0;i<NP;i++){const p=S.prov[i];if(p.o===f&&!p.ctl)s+=provIncome(i);}return s;}
/** Tribute vassal v pays per season. */
function vasTrib(v){return vasOf(v)?Math.round(vasTaxBase(v)*BAL_V.trib*10)/10:0;}
ECON_ROWS.push(f=>{if(!S||!S.vas)return null;const out=[],o=vasOf(f);
 if(o){const v=vasTrib(f);if(v>0)out.push({id:'vasTrib',l:lng(`Haraç: ${FAC[o].s}`,`Tribute to ${FAC[o].s}`),v,k:'exp',tip:lng('Haraçgüzar olduğumuz devlete her mevsim vergilerimizin beşte birini öderiz.','Every season we pay a fifth of our taxes to our overlord.')});}
 const L=vasList(f);if(L.length){const v=L.reduce((s,x)=>s+vasTrib(x),0);if(v>0)out.push({id:'vasTrib',l:lng(`Haraç (${L.length} haraçgüzar)`,`Tribute (${L.length} ${L.length===1?'vassal':'vassals'})`),v,k:'inc',tip:lng('Haraçgüzarların her mevsim vergilerinin beşte birini sana öder.','Your vassals pay you a fifth of their taxes every season.')});}
 return out.length?out:null;});

/* ---------- liberty desire ---------- */
/** Target liberty desire of vassal v and the reasons behind it: {t, why:[{k,v}]} (v: its share, + or -). */
function vasLibInfo(v){const V=S.vas&&S.vas[v];if(!V)return {t:0,why:[]};const o=V.o,why=[];
 const r=strength(v)/Math.max(strength(o),1);let t=BAL_V.libBase;const sv=BAL_V.libStr*clamp(r,0,1.5);t+=sv;why.push({k:'str',v:Math.round(sv)});
 if(FAC[v].rel!==FAC[o].rel&&warsOf(o).some(g=>g!==v&&FAC[g].rel===FAC[v].rel)){t+=BAL_V.libFaith;why.push({k:'faith',v:BAL_V.libFaith});}
 if(warsOf(o).some(g=>warScore(o,g)<=-5)){t+=BAL_V.libWeak;why.push({k:'weak',v:BAL_V.libWeak});}
 const op=-getOp(v,o)*BAL_V.libOp;t+=op;if(Math.abs(op)>=2)why.push({k:'op',v:Math.round(op)});
 const yr=-Math.min(BAL_V.libYears,(S.turn-V.t)/BAL_V.libYearT);t+=yr;if(yr<=-2)why.push({k:'years',v:Math.round(yr)});
 return {t:clamp(t,0,100),why};}
/** Liberty desire of v (0..100). */
function vasLib(v){return S.vas&&S.vas[v]?Math.round(S.vas[v].lib):0;}
/** Word and colour for a liberty desire. */
function vasLibWord(l){return l>=BAL_V.rebel?[lng('İsyana hazır','Ready to revolt'),'var(--war2)']:l>=BAL_V.loyal?[lng('Hoşnutsuz','Discontented'),'var(--brass)']:[lng('Sadık','Loyal'),'var(--ok)'];}
function vasWhyLine(e,v){const o=vasOf(v);switch(e.k){
 case 'str':return e.v>=20?lng('Orduları bizimkine göre güçlü','Their army is strong next to ours'):lng('Ordumuzun gücü onları sindiriyor','Our might keeps them in awe');
 case 'faith':return lng(`${FAC[o].s}, dindaşlarıyla savaşıyor`,`${FAC[o].s} is at war with their fellow believers`);
 case 'weak':return lng(`${FAC[o].s} bir savaşı kaybediyor`,`${FAC[o].s} is losing a war`);
 case 'op':return e.v>0?lng('İlişkiler kötü','Relations are poor'):lng('İlişkiler iyi','Relations are good');
 case 'years':return lng('Uzun yıllardır haraçgüzar','Long years of vassalage');
 default:return '';}}

/* ---------- war and peace follow the overlord ---------- */
/** Vassal or overlord `v` joins the war against e (unless bound to e, in a truce with e, or an overlord allied to e). */
function vasJoin(v,e,lead){if(!alive(v)||!alive(e)||v===e||atWar(v,e)||vasLink(v,e)||inTruce(v,e))return false;
 if(isAlly(v,e)){if(vasOf(v)===lead)delete S.ally[key(v,e)];else return false;}
 S.war[key(v,e)]=newWar(e,v);
 const m=vasOf(v)===lead?lng(`${fname(v)}, haraçgüzarı olduğu ${fname(lead)} yanında ${fname(e)} ile savaşa girdi.`,`${fname(v)} joined the war against ${fname(e)} at the side of its overlord ${fname(lead)}.`)
  :lng(`${fname(v)}, haraçgüzarı ${fname(lead)} için ${fname(e)} ile savaşa girdi.`,`${fname(v)} joined the war against ${fname(e)} to protect its vassal ${fname(lead)}.`);
 v===S.player||e===S.player?news(m,'war'):addLog(m,'war');
 runHooks('warDeclared',v,e);return true;}
hook('warDeclared',(a,b)=>{if(!S||!S.vas)return;
 if(vasOf(a)===b)vasFree(a,'war');if(vasOf(b)===a)vasFree(b,'war'); // a war between them ends the bond (revolt, history)
 for(const [x,y] of [[a,b],[b,a]]){if(!atWar(x,y))continue;for(const v of vasList(x))vasJoin(v,y,x);const o=vasOf(x);if(o)vasJoin(o,y,x);}},40);
/* when an overlord makes peace, its vassals make peace with the same foe; so does an overlord whose vassal makes peace */
hook('peace',(a,b)=>{if(!S||!S.vas)return;
 for(const [x,y] of [[a,b],[b,a]])for(const v of vasList(x))if(atWar(v,y))makePeace(v,y,{prov:[],gold:0,release:[],silent:true});},45);
hook('eliminate',f=>{if(!S||!S.vas)return;if(S.vas[f])delete S.vas[f];for(const v of Object.keys(S.vas))if(S.vas[v].o===f)vasFree(v,'fall');});

/* ---------- annexation of a loyal vassal ---------- */
/** Gold needed to annex vassal v. */
function vasAnnexCost(v){return Math.round(devRaw(v)*BAL_V.annexGold);}
/** Can o annex its vassal v now? {ok, why:'not'|'years'|'lib'|'war'|'gold', left (turns), cost} */
function vasAnnexCan(o,v){const V=S.vas&&S.vas[v],cost=vasAnnexCost(v);if(!V||V.o!==o||!alive(v))return {ok:false,why:'not',cost};
 const left=V.t+BAL_V.annexTurns-S.turn;if(left>0)return {ok:false,why:'years',left,cost};
 if(V.lib>=BAL_V.loyal)return {ok:false,why:'lib',cost};if(atWar(o,v))return {ok:false,why:'war',cost};
 if(S.fac[o].gold<cost)return {ok:false,why:'gold',cost};return {ok:true,cost};}
/** o annexes its vassal v: gold is paid, every province passes peacefully (less alarm than a conquest). */
function vasAnnex(o,v){const r=vasAnnexCan(o,v);if(!r.ok)return false;S.fac[o].gold-=r.cost;
 const ps=facProvs(v),n=FAC[v].n;S.fac[o].gold+=Math.max(0,Math.floor(S.fac[v].gold));S.fac[v].gold=0;
 delete S.vas[v];delete S.ally[key(o,v)];
 for(const i of ps)if(typeof aiAeAdd==='function')aiAeAdd(o,i,v,BAL_V.aeMul);
 S.fac[v].cap=-1; // a peaceful union: no "capital has fallen" news
 for(const i of ps)if(S.prov[i].o===v)capture(i,o,{peace:true,annex:true});
 const m=lng(`${n}, ${FAC[o].s} topraklarına barış içinde katıldı.`,`The ${n} has joined the lands of ${FAC[o].s} in peace.`);
 o===S.player?news(m,'cap'):addLog(m,'cap');polDirty=true;runHooks('vassalAnnexed',o,v,ps);return true;}

/* ---------- each turn: keep the bonds sound, liberty desire, revolts, AI annexation (roundEnd slot 60) ---------- */
/** Drop bonds that no longer hold (a realm fell or was united by history, a war broke out); restore the alliance. */
function vasClean(){if(!S||!S.vas)return;
 for(const v of Object.keys(S.vas)){const V=S.vas[v],o=V&&V.o;
  if(!o||!alive(v)||!alive(o)||v===S.player||vasOf(o)){delete S.vas[v];polDirty=true;continue;}
  if(atWar(o,v)){vasFree(v,'war');continue;}
  if(!isAlly(o,v))S.ally[key(o,v)]=true;
  for(const k of Object.keys(S.ally)){const [a,b]=k.split('|');if((a===v||b===v)&&a!==o&&b!==o)delete S.ally[k];}}} // a vassal has no other allies
function vasStep(){if(!S||!S.vas)return;vasClean();
 for(const v of Object.keys(S.vas)){const V=S.vas[v];if(!V)continue;const o=V.o; // an annexation or revolt earlier in this loop may have ended it
  const t=vasLibInfo(v).t;V.lib=Math.round(clamp(V.lib+(t-V.lib)*BAL_V.libRate,0,100)*10)/10;
  if(V.lib>=BAL_V.rebel&&S.turn-V.t>=BAL_V.rebelGrace&&(warsOf(o).length||strength(v)>=strength(o)*BAL_V.rebelRatio)&&R()<BAL_V.rebelP){vasRevolt(v);continue;}
  if(o!==S.player){const a=vasAnnexCan(o,v);if(a.ok&&S.fac[o].gold-a.cost>=BAL_V.aiAnnexKeep&&R()<BAL_V.aiAnnexP)vasAnnex(o,v);}}}
/** Vassal v throws off its overlord and declares war on it. */
function vasRevolt(v){const o=vasOf(v);if(!o)return false;
 const m=lng(`${FAC[v].s} isyan etti: ${FAC[o].s} haraçgüzarlığını reddedip savaş açtı!`,`${FAC[v].s} has revolted: it refuses to pay tribute to ${FAC[o].s} and declares war!`);
 vasFree(v,'war');delete S.ally[key(o,v)];
 if(o===S.player){news(m,'war');toast(m,'war');}else addLog(m,'war');
 declareWar(v,o,{k:'indep'});runHooks('vassalRevolt',o,v);return true;}
hook('roundEnd',vasStep,60);
hook('newTurn',vasClean,96);

/* ---------- AI: ask for vassalage at the end of a won war (called by aiSettle, 05b) ---------- */
/** Does AI winner w want loser l as a vassal rather than its land? */
function vasAiWants(w,l){if(w===S.player||l===S.player||!vasCan(w,l).ok)return false;
 const cap=S.fac[l].cap;if(cap>=0&&S.prov[cap]&&S.prov[cap].ctl===w)return false; // it holds their capital: it takes land
 const nud=S.ai&&S.ai[w]&&S.ai[w].nudges;if(nud&&nud.some(n=>n.target!=null&&S.prov[n.target]&&S.prov[n.target].o===l))return false; // history wants the land
 const occ=facProvs(l).filter(i=>S.prov[i].ctl===w).length;if(occ*2>=facProvs(l).length)return false;
 return R()<((BAL_V.hist[w]||[]).includes(l)?BAL_V.aiHistP:BAL_V.aiP);}
/** AI peace between winner w and loser l as vassalage, if w wants it and l accepts. -> signed */
function vasAiSettle(w,l){if(!vasAiWants(w,l))return false;const bk={prov:[],gold:0,release:[],vas:true};
 if(!vasAccept(l,w,bk))return false;vasTreaty(w,l,bk);return true;}

/* ---------- schema ---------- */
hook('newGame',s=>{if(!s.vas)s.vas={};},30);
hook('migrate',s=>{if(!s.vas||typeof s.vas!=='object'||Array.isArray(s.vas))s.vas={};
 for(const v of Object.keys(s.vas)){const V=s.vas[v];if(!V||!s.fac[v]||!s.fac[v].alive||!V.o||!s.fac[V.o]||!s.fac[V.o].alive||v===s.player||V.o===v){delete s.vas[v];continue;}
  if(typeof V.t!=='number')V.t=s.turn||0;if(typeof V.lib!=='number'||!(V.lib>=0))V.lib=30;V.lib=clamp(V.lib,0,100);
  if(s.ally)s.ally[key(v,V.o)]=true;}},65);

/* ---------- map colour (07-render2d): a vassal in a lighter shade of its overlord's colour ---------- */
/** Fill colour (hex) of faction f on the political map. */
function vasMapCol(f){const o=vasOf(f);if(!o)return FAC[f].c;const c=hex2(FAC[o].c),p=[243,231,201],k=BAL_V.col;
 return '#'+c.map((x,j)=>Math.round(x*(1-k)+p[j]*k).toString(16).padStart(2,'0')).join('');}

/* =====================================================================
   UI: Peace Table item, Divan rows, province panel, State book, tooltip
   ===================================================================== */
/** Peace Table section: one item "make them our vassal". bk is the table's basket (ptBk). */
function vasPtSection(pl,o,bk){const r=vasCan(pl,o,bk),on=!!bk.vas&&r.ok,c=vasCost(pl,o,bk),n=vasKeeps(o,bk).length,trib=Math.round(vasTaxBase(o)*BAL_V.trib*10)/10;
 const hint=lng('Topraklarını ve hükümdarlarını korurlar; ama her mevsim vergilerinin beşte birini sana haraç olarak öderler, savaşlarında yanında yürürler ve kendi başlarına savaş açamazlar. Eflak, Sırbistan ve Kırım Hanlığı Osmanlı\'ya böyle bağlanmıştı.',
  'They keep their lands and their ruler, but every season they pay you a fifth of their taxes as tribute, march at your side in your wars and may not declare wars of their own. This is how Wallachia, Serbia and the Crimean Khanate were bound to the Sultan.');
 const item=r.ok?`<button class="ptit vas-it${on?' on':''}" data-act="pt-vas" aria-pressed="${on}"><span class="ck">${on?'✓':''}</span>${shield(o)}<span class="nm">${lng(`${FAC[o].s} haraçgüzarımız olsun`,`${FAC[o].s} becomes our vassal`)}<small>${lng(`${n} eyalet kendilerinde kalır · her mevsim yaklaşık ${trib} altın haraç`,`They keep ${n} ${n===1?'province':'provinces'} · about ${trib} gold of tribute a season`)}</small></span><b>${ptSigned(c)}</b></button>`
  :`<div class="ptit vas-it off" aria-disabled="true"><span class="ck"></span>${shield(o)}<span class="nm">${lng(`${FAC[o].s} haraçgüzarımız olsun`,`${FAC[o].s} becomes our vassal`)}<small>${esc(vasWhyText(r))}</small></span></div>`;
 return `<div class="sec vas-pt"><h3>${lng('Haraçgüzarlık','Vassalage')}</h3><div class="hint">${hint}</div><div class="ptlist">${item}</div></div>`;}
['pt-vas'].forEach(a=>QUIET.add(a));['vas-annex','vas-free'].forEach(a=>OVERBLOCK.add(a));
ACTS['pt-vas']=(t,f)=>{if(typeof ptBk==='undefined'||!ptBk)return;if(!vasCan(f,ptBk.f,ptBk).ok)return;ptBk.vas=!ptBk.vas;SND.play('select');showPeace(ptBk.f);};

/** How long v has been a vassal, in words. */
function vasYears(v){const y=Math.floor((S.turn-S.vas[v].t)/4);return y<1?lng('bu yıldan beri','since this year'):lng(`${y} yıldır`,`for ${y} ${y===1?'year':'years'}`);}
/** Liberty bar + word (HTML). */
function vasLibHtml(v){const l=vasLib(v),[w,c]=vasLibWord(l);
 return `<span class="vas-lib" data-tip="vas" data-f="${v}"><b style="color:${c}">${w}</b><span class="vas-bar" role="img" aria-label="${lng('Bağımsızlık isteği','Liberty desire')} ${Math.round(l)}%"><i style="width:${clamp(l,0,100)}%;background:${c}"></i></span></span>`;}
TIPS.vas=el=>{const v=el.dataset.f;if(!vasOf(v))return '';const o=vasOf(v),l=vasLib(v),info=vasLibInfo(v);
 const rows=info.why.map(e=>{const s=vasWhyLine(e,v);return s?`<li>${esc(s)} <b style="color:${e.v>0?'var(--war2)':'var(--ok)'}">${e.v>0?'▲':'▼'}</b></li>`:'';}).join('');
 return `<b>${lng('Bağımsızlık isteği','Liberty desire')}: ${vasLibWord(l)[0]}</b><br>${lng(`${FAC[v].s} ne kadar özgürlük isterse ${FAC[o].s} haraçgüzarlığından o kadar sıkılır. Çok yükselirse isyan edebilir.`,`The more ${FAC[v].s} longs for freedom, the more it chafes under ${FAC[o].s}. If it grows too strong, they may revolt.`)}<ul class="vas-why">${rows}</ul>`;};

/** Annex button / reason for the player's vassal v. */
function vasAnnexHtml(v){const pl=S.player,r=vasAnnexCan(pl,v);
 if(r.ok)return `<button class="btn primary" data-act="vas-annex" data-f="${v}">${lng(`İlhak et (${r.cost} altın)`,`Annex (${r.cost} gold)`)}</button>`;
 const why=r.why==='years'?lng(`İlhak için ${Math.ceil(r.left/4)} yıl daha sadık kalmalılar.`,`They must stay loyal for ${Math.ceil(r.left/4)} more ${Math.ceil(r.left/4)===1?'year':'years'} before they can be annexed.`)
  :r.why==='lib'?lng('Özgürlüğe çok hevesliler; önce sadık olmalılar.','They long for freedom too much; they must be loyal first.')
  :r.why==='gold'?lng(`İlhak için ${r.cost} altın gerekir.`,`Annexing them costs ${r.cost} gold.`):'';
 return why?`<span class="vas-note">${esc(why)}</span>`:'';}
DIPLO_ROW.push({id:'vassal',order:15,
 meta(f){if(!S.vas)return '';const pl=S.player,o=vasOf(f),L=vasList(f);let h='';
  if(o===pl)h+=`<span class="vas-chip mine">${lng('Haraçgüzarımız','Our vassal')}</span><span>${lng('Haraç','Tribute')} <b>+${vasTrib(f).toFixed(1)}</b></span>${vasLibHtml(f)}`;
  else if(o)h+=`<span class="vas-chip">${lng(`${FAC[o].s} haraçgüzarı`,`Vassal of ${FAC[o].s}`)}</span>`;
  if(L.length)h+=`<span class="vas-chip">${lng('Haraçgüzarları','Vassals')}: ${L.map(v=>esc(FAC[v].s)).join(', ')}</span>`;
  return h;},
 buttons(f){if(!S.vas||vasOf(f)!==S.player)return '';return `${vasAnnexHtml(f)}<button class="btn" data-act="vas-free" data-f="${f}">${confirmKey==='vf:'+f?lng('Emin misin?','Are you sure?'):lng('Serbest bırak','Set free')}</button>`;}});
ACTS['vas-annex']=(t,f)=>{const v=t.dataset.f;if(vasOf(v)!==f)return;const n=FAC[v].s;
 if(vasAnnex(f,v)){SND.play('fanfare');toast(lng(`${n} topraklarımıza katıldı.`,`${n} has joined our realm.`),'good');checkMissions();if(S.over){save();renderAll();queueModal(showEnd);return;}save();}
 renderAll();if(!$('#modal').hidden)showDiplo();};
ACTS['vas-free']=(t,f)=>{const v=t.dataset.f,ck='vf:'+v;if(vasOf(v)!==f)return;if(confirmKey!==ck){confirmKey=ck;showDiplo();return;}confirmKey='';
 vasFree(v,'free');addOp(f,v,30);SND.play('peace');toast(lng(`${FAC[v].s} serbest bırakıldı (+30 ilişki).`,`${FAC[v].s} has been set free (+30 relations).`),'good');renderAll();showDiplo();};

PANEL_SECTIONS.push({id:'vassal',order:27,when:c=>!!(S&&S.vas)&&c.p.o!==S.player&&(!!vasOf(c.p.o)||vasList(c.p.o).length>0),html(c){const o=c.p.o,ov=vasOf(o),L=vasList(o);
 let h=`<div class="sec vas-sec"><h3>${lng('Haraçgüzarlık','Vassalage')}</h3>`;
 if(ov){h+=`<div class="vas-line">${shield(ov)}<span>${ov===S.player?lng(`${FAC[o].s} bizim haraçgüzarımız; her mevsim ${vasTrib(o).toFixed(1)} altın haraç öder.`,`${FAC[o].s} is our vassal and pays us ${vasTrib(o).toFixed(1)} gold of tribute every season.`)
   :lng(`${FAC[o].s}, ${FAC[ov].s} haraçgüzarı. Saldırırsan ${FAC[ov].s} onu korumak için savaşa girer.`,`${FAC[o].s} is a vassal of ${FAC[ov].s}. If you attack it, ${FAC[ov].s} will go to war to protect it.`)}</span></div><div class="vas-line">${vasLibHtml(o)}</div>`;
  if(ov===S.player)h+=`<div class="acts">${vasAnnexHtml(o)}<button class="btn" data-act="diplo">${lng('Divan','Divan')}</button></div>`;}
 if(L.length)h+=`<div class="vas-line">${L.map(v=>shield(v)).join('')}<span>${lng(`${FAC[o].s} haraçgüzarları: ${L.map(v=>FAC[v].s).join(', ')}. Bu devletler savaşlarında onun yanında yürür.`,`Vassals of ${FAC[o].s}: ${L.map(v=>FAC[v].s).join(', ')}. They march at its side in war.`)}</span></div>`;
 return h+'</div>';}});
STATE_SECTIONS.push({id:'vassals',order:33,html(f){if(!S.vas)return '';const L=vasList(f);
 const rows=L.map(v=>`<div class="row">${shield(v)}<div class="nm">${esc(FAC[v].n)}<small>${lng('Haraç','Tribute')} +${vasTrib(v).toFixed(1)} · ${vasYears(v)}</small></div><div class="ra">${vasLibHtml(v)}</div></div>`).join('');
 return `<div class="sec vas-state"><h3>${lng('Haraçgüzarlar','Vassals')}</h3>${L.length?`<div class="rows">${rows}</div>`:`<div class="hint">${lng('Haraçgüzarımız yok. Yendiğin bir devleti Barış Masası\'nda haraçgüzar yapabilirsin: toprakları onlarda kalır, sana haraç öderler ve savaşlarında yanında yürürler.','We have no vassals. At the Peace Table you can make a beaten realm your vassal: it keeps its lands, pays you tribute and marches with you in war.')}</div>`}</div>`;}});

KE.vas={of:f=>vasOf(f),list:o=>vasList(o),can:(o,v,bk)=>vasCan(o,v,bk),cost:(o,v,bk)=>vasCost(o,v,bk),make:(o,v)=>vasMake(o,v,'test'),free:v=>vasFree(v,'free'),
 lib:v=>vasLib(v),libInfo:v=>vasLibInfo(v),trib:v=>vasTrib(v),annexCan:(o,v)=>vasAnnexCan(o,v),annex:(o,v)=>vasAnnex(o,v),revolt:v=>vasRevolt(v),
 accept:(ai,o,bk)=>vasAccept(ai,o,bk),offer:(p,ai,bk)=>vasOffer(p,ai,bk),treaty:(a,b,bk)=>vasTreaty(a,b,bk),aiSettle:(w,l)=>vasAiSettle(w,l),step:()=>vasStep(),col:f=>vasMapCol(f),why:r=>vasWhyText(r),BAL:BAL_V};
