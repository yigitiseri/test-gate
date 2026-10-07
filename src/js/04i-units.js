/* =====================================================================
   UNIT TYPES: every field army is a mix of infantry (i), cavalry (c) and artillery (a), kept as shares
   a.mix=[i,c,a] (sum 1) beside its head count a.n, so losses, merges and splits keep working on a.n alone.
    - Cavalry rules the open field and the desert, struggles in the mountains and is useless against walls.
    - Infantry holds the mountains and storms walls.
    - Artillery (once the realm has cannon) batters walls: faster sieges, stronger assaults, a little help in the field.
    - Each culture fields its own troops (janissaries and sipahis, Mamluk horse, Tatar riders, hussars, knights...)
      and its default mix; some are better than others.
    - Cavalry costs more to raise and to pay; artillery the most.
   ===================================================================== */
const BAL_U={
 cost:{i:.85,c:1.3,a:2.5},                   // gold to raise per man, x RC per 1,000 (a usual mix costs about what an army cost before)
 upk:{i:.85,c:1.3,a:2},                      // pay per man, x UPK per 1,000
 field:{plainsCav:.3,desCav:.4,mtnCav:-.25,mtnInf:.12,art:.4},   // field battle: +share x term
 assault:{inf:.3,cav:-.35,art:1.5},          // storming walls
 siegeArt:2.5,siegeArtCap:.5,                // siege speed: +share x 2.5, at most +50%
 artBatch:500                                // a battery is raised 500 men at a time
};
/* default mixes and troops by culture */
const UNIT_CUL={
 OSM:{mix:[.5,.45,.05],q:{i:1.15,c:1},n:{i:['Yeniçeri','Janissaries'],c:['Sipahi','Sipahis'],a:['Topçu Ocağı','Artillery Corps']}},
 TRK:{mix:[.35,.65,0],q:{i:1,c:1.05},n:{i:['Azaplar','Azaps'],c:['Türkmen atlıları','Turkmen horse'],a:['Topçular','Gunners']}},
 SAF:{mix:[.3,.7,0],q:{i:1,c:1.1},n:{i:['Piyade','Foot'],c:['Kızılbaş süvarisi','Qizilbash horse'],a:['Topçular','Gunners']}},
 MAM:{mix:[.35,.65,0],q:{i:1,c:1.15},n:{i:['Piyade','Foot'],c:['Memlük süvarisi','Mamluk horse'],a:['Topçular','Gunners']}},
 KRM:{mix:[.15,.85,0],q:{i:.95,c:1.1},n:{i:['Piyade','Foot'],c:['Tatar atlıları','Tatar riders'],a:['Topçular','Gunners']}},
 HUN:{mix:[.55,.45,0],q:{i:1,c:1.1},n:{i:['Piyade','Foot'],c:['Hafif süvari (hussar)','Hussars'],a:['Topçular','Gunners']}},
 KN:{mix:[.65,.35,0],q:{i:1,c:1.1},n:{i:['Mızraklı piyade','Pikemen'],c:['Şövalyeler','Knights'],a:['Topçular','Gunners']}},
 SEA:{mix:[.75,.25,0],q:{i:1.05,c:1},n:{i:['Arbaletçiler','Crossbowmen'],c:['Stradiotlar','Stradioti'],a:['Topçular','Gunners']}},
 ORT:{mix:[.6,.4,0],q:{i:1,c:1},n:{i:['Piyade','Foot'],c:['Süvari','Horse'],a:['Topçular','Gunners']}},
 WAL:{mix:[.45,.55,0],q:{i:1,c:1.05},n:{i:['Köylü piyade','Peasant foot'],c:['Boyar süvarisi','Boyar horse'],a:['Topçular','Gunners']}}};
const UNIT_OF={OSM:'OSM',CLM:'OSM',KAR:'TRK',CAN:'TRK',DUL:'TRK',AKK:'TRK',KKY:'TRK',SAF:'SAF',MAM:'MAM',HAF:'MAM',KRM:'KRM',HUN:'HUN',
 VEN:'SEA',GEN:'SEA',RHO:'SEA',CYP:'SEA',WAL:'WAL',MOL:'WAL'};
function unitCul(f){return UNIT_CUL[UNIT_OF[f]||(FAC[f]&&FAC[f].rel==='Ortodoks'?'ORT':FAC[f]&&FAC[f].rel==='İslam'?'TRK':'KN')];}
/** The realm's own name for a troop type ('i'|'c'|'a'). */
function unitName(f,t){const n=unitCul(f).n[t];return lng(n[0],n[1]);}
/** Default mix of realm f (artillery only once it has cannon). */
function unitDefMix(f){const m=unitCul(f).mix.slice();if(!(S.fac[f]&&S.fac[f].cannon)){m[0]+=m[2];m[2]=0;}else if(m[2]<.05){const d=.05-m[2];m[2]=.05;m[0]-=d;}return m;}
/** Mix of army a ([i,c,a], sum 1); armies from older saves get their realm's default. */
function armMix(a){if(!a.mix||a.mix.length!==3){a.mix=unitDefMix(a.f);}return a.mix;}
function mixBlend(m1,n1,m2,n2){const t=Math.max(1,n1+n2);return [0,1,2].map(k=>+((m1[k]*n1+m2[k]*n2)/t).toFixed(3));}
const UNIT_K=['i','c','a'];
/** Gold per 1,000 men of mix m, relative to infantry. */
function mixCost(m,tab){return m[0]*tab.i+m[1]*tab.c+m[2]*tab.a;}
/** Gold to raise n men of type t ('i'|'c'|'a', or none: the realm's usual mix), whole coins. */
function unitRecruitCost(f,t,n){const m=t?UNIT_K.map(k=>k===t?1:0):unitDefMix(f);return Math.max(1,Math.round(RC*n/1000*mixCost(m,BAL_U.cost)));}
/** Head-count-weighted mix of several armies. */
function mixOf(L){let n=0;const m=[0,0,0];for(const a of L){const x=armMix(a);for(let k=0;k<3;k++)m[k]+=x[k]*a.n;n+=a.n;}return n?m.map(v=>v/n):null;}

/* --- battle: the mix counts --- */
function unitFieldMods(f,m,to,side,out){const B=BAL_U.field,mtn=armMtn(to),des=!!PD[to].des,q=unitCul(f).q,cannon=S.fac[f]&&S.fac[f].cannon;
 const cav=m[1]*(mtn?B.mtnCav:des?B.desCav:B.plainsCav)*(mtn?1:q.c),inf=mtn?m[0]*B.mtnInf*q.i:0,art=cannon?m[2]*B.art:0,qual=m[0]*(q.i-1)+(mtn?0:m[1]*(q.c-1));
 if(Math.abs(cav)>=.015)out.push({l:cav>0?(des?lng('Süvari çölde at koşturuyor','Horsemen at home in the desert'):lng('Süvari açık arazide üstün','Horsemen rule the open field')):lng('Süvari dağda zorlanıyor','Horsemen struggle in the mountains'),m:1+cav,side,k:'ucav'});
 if(inf>=.015)out.push({l:lng('Piyade dağ yollarını tutuyor','Foot soldiers hold the mountain passes'),m:1+inf,side,k:'uinf'});
 if(art>=.015)out.push({l:lng('Sahra topları','Field guns'),m:1+art,side,k:'uart'});
 if(qual>=.015){const best=m[0]*(q.i-1)>=m[1]*(q.c-1)?'i':'c';out.push({l:unitName(f,best),m:1+qual,side,k:'uq'});}}
BATTLE_MODS.push(ctx=>{if(ctx.to==null||!ctx.att)return null;const out=[],kind=ctx.kind;
 const own=ctx.uA||(ctx.army!=null?[typeof ctx.army==='object'?ctx.army:armyById(ctx.army)].filter(Boolean):null);
 if(kind==='field'){if(!own||!own.length)return null;   // both sides or neither (odds without a known army stay as they were)
  const mA=mixOf(own),def=ctx.uD||armyAt(ctx.to).filter(x=>x.f!==ctx.att&&atWar(ctx.att,x.f)),mD=def.length?mixOf(def):null;
  if(mA)unitFieldMods(ctx.att,mA,ctx.to,'att',out);if(mD)unitFieldMods(def[0].f,mD,ctx.to,'def',out);return out;}
 if(kind==='assault'&&own&&own.length){const m=mixOf(own),B=BAL_U.assault,q=unitCul(ctx.att).q,cannon=S.fac[ctx.att]&&S.fac[ctx.att].cannon;
  const inf=m[0]*B.inf*q.i,cav=m[1]*B.cav,art=cannon?m[2]*B.art:0;
  if(inf>=.015)out.push({l:lng('Piyade surlara tırmanıyor','Foot soldiers scale the walls'),m:1+inf,side:'att',k:'uinf'});
  if(cav<=-.015)out.push({l:lng('Süvari surlar önünde işe yaramaz','Horsemen are of no use against walls'),m:1+cav,side:'att',k:'ucav'});
  if(art>=.015)out.push({l:lng('Toplar surları dövüyor','The guns pound the walls'),m:1+art,side:'att',k:'uart'});return out;}
 if(kind==='siege'){const s=siegeAt(ctx.to),L=own&&own.length?own:s&&s.f===ctx.att?siegeArmies(s):[];if(!L.length||!(S.fac[ctx.att]&&S.fac[ctx.att].cannon))return null;
  const art=Math.min(BAL_U.siegeArtCap,mixOf(L)[2]*BAL_U.siegeArt);if(art>=.015)out.push({l:lng('Kuşatma topları','Siege guns'),m:1+art,side:'att',k:'uart'});return out;}
 return null;});

/* --- the army panel: what the army is made of --- */
function unitBar(a){const m=armMix(a),f=a.f,cl=['#8a5a2a','#3d6b8a','#5a5a5a'],pc=m.map(v=>Math.round(v*100));
 return `<div class="ubar" role="img" aria-label="${UNIT_K.map((k,j)=>`${unitName(f,k)} ${pc[j]}%`).join(', ')}">${m.map((v,j)=>v>0?`<i style="width:${v*100}%;background:${cl[j]}"></i>`:'').join('')}</div>
  <div class="ulegend">${UNIT_K.map((k,j)=>m[j]>0?`<span><b style="background:${cl[j]}"></b>${esc(unitName(f,k))} ${pc[j]}%</span>`:'').join('')}</div>`;}
KE.units={cost:(f,t,n)=>unitRecruitCost(f,t,n),mix:id=>{const a=armyById(id);return a?armMix(a).slice():null;},def:f=>unitDefMix(f),name:(f,t)=>unitName(f,t),bal:BAL_U};
