/* =====================================================================
   REFORMS ("Gelişmeler"): lasting advances a realm buys with gold, some only from a given year or after another.
   S.ref = {faction: {id: turn adopted}}. Every effect shows where it applies:
    - ledger rows: tahrir (taxes +8%), kervan (trade +25%), timar (army pay -15%);
    - battle cards: tufek (foot in the field), tabya (walls against sieges and assaults);
    - barut gives cannon (the realm can raise guns and batter walls), ocak one more army, sancak faster manpower.
   The AI adopts reforms too when its treasury is full (never gunpowder: that comes with history, 06b).
   The reforms window opens from the top bar; the advisor points at a reform the treasury can afford.
   ===================================================================== */
const BAL_RF={tax:.08,trade:.25,pay:.15,tufek:.15,tabyaSiege:1.25,tabyaAssault:1.2,mp:.25,aiP:.12,aiFrom:12,aiGold:2.5};
const RF=[
 {id:'barut',ic:'sword',c:150,y:1451,n:['Barut Dökümhanesi','Gun Foundry'],d:['Top dökmeyi öğrenirsin: topçu toplayabilir, surları toplarla döversin.','You learn to cast cannon: you can raise gunners and batter walls with guns.']},
 {id:'tahrir',ic:'scroll',c:160,y:1451,n:['Tahrir Defterleri','Land Surveys'],d:['Toprak ve hane sayımı: eyalet vergileri %8 artar.','Counting land and households: provincial taxes +8%.']},
 {id:'kervan',ic:'coin',c:140,y:1451,n:['Kervansaraylar','Caravanserais'],d:['Yollara hanlar: ticaret yollarından gelen gelir %25 artar.','Inns along the roads: income from trade routes +25%.']},
 {id:'timar',ic:'shield',c:180,y:1451,n:['Tımar Düzeni','The Timar System'],d:['Askerler topraktan geçinir: ordu maaşları %15 azalır.','Soldiers live off the land: army pay −15%.']},
 {id:'sancak',ic:'tower',c:170,y:1460,n:['Sancak Teşkilatı','Sanjak Administration'],d:['Eyaletler beylere bağlanır: insan gücü her mevsim %25 daha hızlı dolar.','Provinces answer to governors: manpower refills 25% faster every season.']},
 {id:'ocak',ic:'crown',c:300,y:1470,n:['Kapıkulu Ocakları','Standing Corps'],d:['Daimî ordu: bir sahra ordusu daha kurabilirsin.','A standing army: you may field one more army.']},
 {id:'tufek',ic:'sword',c:220,y:1475,req:'barut',n:['Tüfekli Piyade','Arquebusiers'],d:['Piyadeye tüfek: açık savaşta ordunun piyade payı kadar +%15 güç.','Firearms for the foot: up to +15% in field battles, by the army\'s share of foot soldiers.']},
 {id:'tabya',ic:'tower',c:240,y:1480,req:'barut',n:['Tabyalı Surlar','Bastion Forts'],d:['Topa dayanıklı alçak surlar: kalelerin kuşatmaya %25, hücuma %20 daha dayanıklı olur.','Low walls that withstand cannon: your forts resist sieges 25% and assaults 20% better.']}];
const RF_BY={};RF.forEach(r=>RF_BY[r.id]=r);
const rfName=r=>lng(r.n[0],r.n[1]),rfHow=r=>lng(r.d[0],r.d[1]);
function rfS(){if(!S.ref)S.ref={};return S.ref;}
/** Has realm f adopted reform id? (Gunpowder: any realm that already has cannon.) */
function rfHas(f,id){if(!S||!f)return false;if(id==='barut'&&S.fac[f]&&S.fac[f].cannon)return true;const m=S.ref&&S.ref[f];return !!(m&&m[id]!=null);}
const rfYear=()=>START_YEAR+Math.floor(S.turn/4);
/** Can f adopt r now? -> {ok, why} */
function rfCan(f,r){if(rfHas(f,r.id))return {ok:false,why:'has'};if(rfYear()<r.y)return {ok:false,why:'year'};if(r.req&&!rfHas(f,r.req))return {ok:false,why:'req'};
 if(S.fac[f].gold<r.c)return {ok:false,why:'gold'};return {ok:true};}
function rfAdopt(f,id){const r=RF_BY[id];if(!r||!rfCan(f,r).ok)return false;S.fac[f].gold-=r.c;const m=rfS();(m[f]||(m[f]={}))[id]=S.turn;
 if(id==='barut')S.fac[f].cannon=1;
 if(f===S.player){addLog(lng(`Yeni gelişme: ${rfName(r)}. ${rfHow(r)}`,`New reform: ${rfName(r)}. ${rfHow(r)}`),'good');}
 else if(typeof nbrs==='function'&&nbrs(S.player).includes(f))addLog(lng(`${fname(f)} ${rfName(r)} gelişmesini benimsedi.`,`${fname(f)} has adopted ${rfName(r)}.`),'info');
 runHooks('reform',f,id);return true;}
const rfCount=f=>RF.filter(r=>rfHas(f,r.id)).length;
hook('migrate',s=>{if(!s.ref||typeof s.ref!=='object')s.ref={};});
hook('newGame',s=>{s.ref={};});

/* --- effects --- */
function rfArmyPay(f){let v=0;for(const x of armyList(f))v+=x.n/1000*UPK*mixCost(armMix(x),BAL_U.upk);return v;}
ECON_ROWS.push(f=>{if(!S||!S.ref)return null;const out=[];
 if(rfHas(f,'tahrir')){let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f&&!S.prov[i].ctl)s+=provIncome(i);if(s>0)out.push({id:'rf-tahrir',l:rfName(RF_BY.tahrir),v:s*BAL_RF.tax,k:'inc',tip:rfHow(RF_BY.tahrir)});}
 if(rfHas(f,'kervan')){const v=trdIncome(f)*BAL_RF.trade;if(v>.05)out.push({id:'rf-kervan',l:rfName(RF_BY.kervan),v,k:'inc',tip:rfHow(RF_BY.kervan)});}
 if(rfHas(f,'timar')){const v=rfArmyPay(f)*BAL_RF.pay;if(v>.05)out.push({id:'rf-timar',l:rfName(RF_BY.timar),v,k:'inc',tip:rfHow(RF_BY.timar)});}
 return out.length?out:null;});
BATTLE_MODS.push(ctx=>{if(!S||!S.ref||ctx.to==null)return null;const out=[],kind=ctx.kind,def=ctx.def;
 if(kind==='field'){
  if(ctx.att&&rfHas(ctx.att,'tufek')){const own=ctx.uA||(ctx.army!=null?[typeof ctx.army==='object'?ctx.army:armyById(ctx.army)].filter(Boolean):null);const m=own&&own.length?mixOf(own):null;
   if(m&&m[0]>=.1)out.push({l:rfName(RF_BY.tufek),m:1+BAL_RF.tufek*m[0],side:'att',k:'rf-tufek'});}
  if(def&&rfHas(def,'tufek')){const L=ctx.uD||armyAt(ctx.to).filter(x=>x.f===def);const m=L.length?mixOf(L):null;
   if(m&&m[0]>=.1)out.push({l:rfName(RF_BY.tufek),m:1+BAL_RF.tufek*m[0],side:'def',k:'rf-tufek'});}}
 if((kind==='siege'||kind==='assault')&&def&&rfHas(def,'tabya')&&S.prov[ctx.to].fort>=1)
  out.push({l:rfName(RF_BY.tabya),m:kind==='siege'?BAL_RF.tabyaSiege:BAL_RF.tabyaAssault,side:'def',k:'rf-tabya'});
 return out.length?out:null;});
hook('newTurn',()=>{if(!S.ref)return;for(const f of FK){if(!alive(f)||!rfHas(f,'sancak'))continue;const F=S.fac[f],ds=devSum(f);if(F.mp<ds*800)F.mp=Math.min(ds*800,F.mp+ds*110*BAL_RF.mp);}});
/* --- the AI adopts a reform now and then when its treasury overflows --- */
hook('preAI',f=>{if(S.turn<BAL_RF.aiFrom||R()>BAL_RF.aiP)return;const F=S.fac[f];
 const c=RF.filter(r=>r.id!=='barut'&&rfCan(f,r).ok&&F.gold>=r.c*BAL_RF.aiGold).sort((a,b)=>a.c-b.c)[0];if(c)rfAdopt(f,c.id);});

/* --- the reforms window --- */
function showReforms(){const f=S.player;if(!f)return;const n=rfCount(f);
 openModal(`<div class="eyebrow">${lng('Devletin gelişimi','The growth of the realm')}</div><h2>${lng('Gelişmeler','Reforms')}</h2>${typeof rfTabs==='function'?rfTabs('rf'):''}
 <p class="lead">${lng(`Hazinedeki altınla devletine kalıcı yenilikler kazandır. Benimsediğin: <b>${n}/${RF.length}</b>. Hazine: <b>${Math.floor(S.fac[f].gold)}</b> altın.`,`Spend treasury gold on lasting advances for your realm. Adopted: <b>${n}/${RF.length}</b>. Treasury: <b>${Math.floor(S.fac[f].gold)}</b> gold.`)}</p>
 <div class="rfg">${RF.map(r=>{const has=rfHas(f,r.id),c=rfCan(f,r),others=FK.filter(g=>g!==f&&alive(g)&&rfHas(g,r.id)).length;
  const st=has?`<span class="rf-st ok">${S.ref[f]&&S.ref[f][r.id]!=null?lng(`Benimsendi · ${dateStr(S.ref[f][r.id])}`,`Adopted · ${dateStr(S.ref[f][r.id])}`):lng('Benimsendi','Adopted')}</span>`
   :c.why==='year'?`<span class="rf-st">${lng(`${r.y} yılından sonra`,`From ${r.y}`)}</span>`
   :c.why==='req'?`<span class="rf-st">${lng(`Önce: ${rfName(RF_BY[r.req])}`,`First: ${rfName(RF_BY[r.req])}`)}</span>`
   :`<button class="btn${c.ok?' primary':''}" data-act="rfbuy" data-r="${r.id}"${c.ok?'':' disabled'}>${lng(`Benimse · ${r.c} altın`,`Adopt · ${r.c} gold`)}</button>`;
  return `<div class="rf ${has?'on':''}">${typeof achIcon==='function'?achIcon(r):''}<div class="rf-b"><b>${esc(rfName(r))}</b><small>${esc(rfHow(r))}</small>
   ${others?`<small class="rf-o">${lng(`${others} devlet benimsedi`,`${others} ${others===1?'realm has':'realms have'} it`)}</small>`:''}</div><div class="rf-a">${st}</div></div>`;}).join('')}</div>
 <div class="foot"><button class="btn primary" data-act="mclose">${lng('Kapat','Close')}</button></div>`);}
ACTS.reforms=()=>showReforms();
ACTS.rfbuy=t=>{const id=t.dataset.r;if(rfAdopt(S.player,id)){SND.play('build');toast(lng(`Yeni gelişme: ${rfName(RF_BY[id])}`,`New reform: ${rfName(RF_BY[id])}`),'good');renderAll();showReforms();}};
OVERBLOCK.add('rfbuy');
TOP_BUTTONS.push({act:'reforms',icon:'❖',label:lng('Gelişmeler','Reforms'),title:lng('Gelişmeler','Reforms'),order:35});
ADVICE.push({id:'reform',prio:25,when:(S,f)=>{if(S.turn<4)return null;const r=RF.filter(r=>rfCan(f,r).ok&&S.fac[f].gold>=r.c+120).sort((a,b)=>a.c-b.c)[0];return r||null;},
 t:(S,f,r)=>lng(`Yeni gelişme: ${rfName(r)}`,`A new reform: ${rfName(r)}`),
 d:(S,f,r)=>lng(`Paşam, hazine dolu. ${r.c} altına ${rfName(r)} gelişmesini benimseyebiliriz: ${rfHow(r)}`,`My lord, the treasury is full. For ${r.c} gold we could adopt ${rfName(r)}: ${rfHow(r)}`),
 go:()=>showReforms(),goL:lng('Gelişmeler','Reforms')});
KE.ref={has:(f,id)=>rfHas(f,id),adopt:(f,id)=>rfAdopt(f,id),list:()=>RF.map(r=>r.id),count:f=>rfCount(f)};
