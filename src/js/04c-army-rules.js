/* =====================================================================
   ARMY RULES (Track B): movement, field battles, recruitment, merge/split/disband,
   garrisons, clean-up (armTidy) and the v1 -> armies save conversion.
   The AI (05-ai.js / 05a-ai-armies.js) and the player UI (09b / 11b) use exactly these rules.
   ===================================================================== */
/** Province i is friendly ground for f (controlled by f or an ally: own and occupied land). Armies may only stand
 on friendly ground, or in a province they besiege. */
function armFriendly(f,i){const o=ctl(i);return o===f||isAlly(f,o);}
/** Armies at province i whose faction is at war with f. */
function armFoesAt(i,f){return S.armies.filter(a=>a.loc===i&&a.f!==f&&atWar(f,a.f));}
/** Provinces holding an army at war with f (one pass over S.armies). */
function armFoeLocs(f){const s=new Set();for(const a of S.armies)if(a.f!==f&&atWar(f,a.f))s.add(a.loc);return s;}
/** BFS from army a: friendly provinces without enemy armies are passable; a hostile province (controlled by a
 realm at war with a.f) or a province holding an enemy army is a terminal step (entering it ends the move: battle,
 siege or assault). Sea lanes only for seafaring realms or at the straits (armLaneOk).
 -> {dist:Int16Array (-1 unreachable), par:Int16Array, term:Uint8Array} */
function armReach(a){const f=a.f,foes=armFoeLocs(f),dist=new Int16Array(NP).fill(-1),par=new Int16Array(NP).fill(-1),term=new Uint8Array(NP);
 dist[a.loc]=0;const q=[a.loc];
 for(let h=0;h<q.length;h++){const u=q[h];if(term[u])continue;
  for(const v of PD[u].adj){if(dist[v]>=0||!armLaneOk(f,u,v))continue;const o=ctl(v),foe=foes.has(v),fr=o===f||isAlly(f,o);
   if(fr&&!foe){dist[v]=dist[u]+1;par[v]=u;q.push(v);}
   else if(foe||(o!==f&&atWar(f,o))){dist[v]=dist[u]+1;par[v]=u;term[v]=1;q.push(v);}}}
 return {dist,par,term};}
function armPathFrom(R0,to){if(R0.dist[to]<=0)return null;const p=[];for(let v=to;R0.par[v]>=0;v=R0.par[v])p.push(v);return p.reverse();}
/** Shortest legal path of army `id` to province `to` (excluding the start), or null. Any length (multi-turn). */
function armyPath(id,to){const a=armyById(id);if(!a||to==null||to<0||to>=NP)return null;return armPathFrom(armReach(a),to);}
/** Can army `id` reach `to` THIS turn? -> {ok, reason (for the player), cost (steps), path, kind:'move'|'battle'|'siege'|'assault'}
 'siege': a hostile walled province without an enemy army; 'assault': a hostile town without walls (stormed at once). */
function armyCanMove(id,to){const a=armyById(id);
 if(!a)return {ok:false,reason:lng('Ordu bulunamadı.','Army not found.'),cost:0,path:null,kind:null};
 if(to===a.loc)return {ok:false,reason:lng('Ordu zaten orada.','The army is already there.'),cost:0,path:null,kind:null};
 const path=armyPath(id,to),o=ctl(to);
 if(!path){const sea=PD[to].adj.some(u=>armLane(u,to))&&!BAL_S.naval.includes(a.f)&&!PD[to].adj.some(u=>!armLane(u,to)&&armyPath(id,u));
  const why=o!==a.f&&!isAlly(a.f,o)&&!atWar(a.f,o)?lng(`${FAC[o].s} ile savaşta değilsin; topraklarına giremezsin.`,`You are not at war with ${FAC[o].s}; you cannot enter its lands.`)
   :sea?lng('Oraya yalnızca deniz yoluyla gidilir; donanması olmayan devletler denizi geçemez.','That land lies across the sea; realms without a fleet cannot cross it.'):lng('Oraya giden bir yol yok.','There is no road there.');
  return {ok:false,reason:why,cost:0,path:null,kind:null};}
 const foes=armFoesAt(to,a.f).length>0,hostile=o!==a.f&&atWar(a.f,o),kind=foes?'battle':hostile?(S.prov[to].fort>=1?'siege':'assault'):'move',cost=path.length;
 if(kind==='siege'){const s=siegeAt(to);if(s&&s.f!==a.f&&siegeValid(s))return {ok:false,reason:lng(`${FAC[s.f].s} orada kuşatma yürütüyor.`,`${FAC[s.f].s} is already besieging it.`),cost,path,kind};
  if(s&&s.a===a.id)return {ok:false,reason:lng('Ordu zaten bu surları kuşatıyor.','The army is already besieging these walls.'),cost,path,kind};}
 const ship=armShipCost(a,[a.loc,...path]);
 if(ship>0&&S.fac[a.f].gold<ship)return {ok:false,reason:lng(`Gemi kiralamak için ${ship} altın gerekiyor; hazinede yeterli altın yok.`,`Hiring ships costs ${ship} gold; the treasury cannot pay it.`),cost,path,kind,ship};
 if(a.mp<=0)return {ok:false,reason:lng('Bu ordu bu mevsim yürüyüşünü tamamladı.','This army has finished its march for the season.'),cost,path,kind};
 if(cost>a.mp)return {ok:false,reason:lng(`Çok uzak: bu ordu bu mevsim en fazla ${a.mp} eyalet yürüyebilir (yol ${cost} eyalet).`,`Too far: this army can march at most ${a.mp} ${a.mp===1?'province':'provinces'} this season (the road is ${cost}).`),cost,path,kind};
 return {ok:true,reason:'',cost,path,kind,ship};}
/** Gold a realm without a fleet pays to ship army a along the provinces of `full` (0 for seafaring realms and land roads). */
function armShipCost(a,full){if(BAL_S.naval.includes(a.f))return 0;let n=0;for(let k=0;k+1<full.length;k++)if(armLane(full[k],full[k+1]))n++;
 return n?n*Math.max(BAL_S.shipMin,Math.ceil(a.n/1000)*BAL_S.ship):0;}
/** Move army `id` to `to` under the rules (player and AI alike). Entering a hostile province or a province with
 an enemy army ends the move with a field battle ('battle'), a siege ('siege', walls >= 1) or a storm ('assault',
 no walls). Leaving a siege lifts it. Pushes TURN_TRACE with the full path. -> {kind:'move'|'battle'|'siege'|'assault'|'none', rep?, siege?, reason?} */
function armyMove(id,to){const c=armyCanMove(id,to);if(!c.ok)return {kind:'none',reason:c.reason};
 const a=armyById(id),f=a.f,from0=a.loc,full=[from0,...c.path];if(a.st==='siege'){a.st='idle';siegeClean();}
 if(c.ship>0){S.fac[f].gold-=c.ship;if(f===S.player)toast(lng(`Gemiler kiralandı: ${c.ship} altın.`,`Ships hired: ${c.ship} gold.`));}
 if(c.kind==='move'){a.loc=to;a.mp-=c.cost;a.st='idle';polDirty=true;
  TURN_TRACE.push({k:'move',f,from:from0,to,path:full,army:id,n:a.n});return {kind:'move'};}
 if(c.kind==='siege'){const n0=a.n;a.mp=0;TURN_TRACE.push({k:'move',f,from:from0,to,path:full,army:id,n:n0});const s=siegeBegin(a,to);return {kind:'siege',siege:s};}
 const stage=full[full.length-2],n0=a.n;a.loc=stage;a.mp=0;
 const rep=c.kind==='battle'?fieldBattle(a,armFoesAt(to,f),to):armAssault(a,stage,to);
 TURN_TRACE.push({k:'battle',f,from:from0,to,path:full,army:id,n:n0,win:!!(rep&&rep.win),rep});
 return {kind:c.kind,rep};}

/** Field battle: army `att` (standing next to i) against the enemy armies `defs` in province i.
 Terrain and season modifiers apply, forts do not. The loser loses more; defeated defenders retreat to a
 neighbouring friendly province or are destroyed if surrounded. A winning attacker moves in only if i is
 friendly ground (otherwise it holds its position; storming the town is a separate attack). -> rep */
function fieldBattle(att,defs,i){
 if(att!=null&&typeof att!=='object')att=armyById(att);if(!att)return null;
 defs=(defs||[]).map(d=>d!=null&&typeof d==='object'?d:armyById(d)).filter(d=>d&&d.loc===i&&d.f!==att.f);if(!defs.length)return null;
 const big=defs.slice().sort((x,y)=>y.n-x.n)[0],from=att.loc,n=att.n,dn=defs.reduce((s,d)=>s+d.n,0);
 const ctx={kind:'field',att:att.f,def:big.f,from,to:i,n},mods=battleMods(ctx),nz=BAL_B.fieldNoise,ra=rnd(1-nz,1+nz),rd=rnd(1-nz,1+nz);
 const aP=modMul(n*att.morale,mods,'att')*ra,dP=modMul(defs.reduce((s,d)=>s+d.n*d.morale,0),mods,'def')*rd,r=aP/dP,win=r>1,q=win?r:1/r;
 const wF=clamp(.12/q,.03,.15),lF=clamp(.2*q,.2,.5),aF=(win?wF:lF)*modLoss(mods,'def'),dF=(win?lF:wF)*modLoss(mods,'att');
 const defFs=[...new Set(defs.map(d=>d.f))];
 const rep={from,to:i,att:att.f,def:big.f,defFs,n,defT:dn,turn:S.turn,win,aLoss:0,dLoss:0,kind:'field',mods,roll:{a:Math.round(ra*1e3)/1e3,d:Math.round(rd*1e3)/1e3},
  army:att.id,defArmies:defs.map(d=>d.id),destroyed:[]};
 const aLoss=Math.min(n,Math.round(n*aF/100)*100);att.n-=aLoss;rep.aLoss=aLoss;
 let dLoss=0;for(const d of defs){const l=Math.min(d.n,Math.round(d.n*dF/100)*100);d.n-=l;dLoss+=l;}rep.dLoss=dLoss;
 const up=x=>{x.morale=Math.min(BAL_B.moraleMax,+(x.morale+BAL_B.moraleWin).toFixed(2));},down=x=>{x.morale=Math.max(BAL_B.moraleMin,+(x.morale-BAL_B.moraleLose).toFixed(2));};
 if(win){up(att);
  for(const d of defs){down(d);if(d.n<100){rep.destroyed.push(d.id);armyRemove(d.id,'destroyed');continue;}
   const foes=armFoeLocs(d.f);foes.add(i);
   const ret=PD[i].adj.filter(j=>armFriendly(d.f,j)&&!foes.has(j)).sort((x,y)=>(S.prov[y].o===d.f)-(S.prov[x].o===d.f)||S.prov[y].t-S.prov[x].t);
   if(ret.length){d.loc=ret[0];d.mp=0;d.st='idle';rep.retreat=ret[0];}else{rep.destroyed.push(d.id);rep.surrounded=true;armyRemove(d.id,'destroyed');}}
  if(att.n>=100&&armFriendly(att.f,i)&&!armFoesAt(i,att.f).length)att.loc=i;
 }else{down(att);for(const d of defs)up(d);}
 if(att.n<100){rep.destroyed.push(att.id);armyRemove(att.id,'destroyed');}
 for(const d of defs)if(d.n<100&&armyById(d.id)){rep.destroyed.push(d.id);armyRemove(d.id,'destroyed');}
 const w=S.war[key(att.f,big.f)],wf=win?att.f:big.f;
 if(w)w.sc[wf]=(w.sc[wf]||0)+1+(rep.destroyed.length?1:0);
 return armBattleEnd(rep);}

/** Merge army b into army a (same faction, same province). -> a, or null */
function armyMerge(a,b){if(typeof a!=='object')a=armyById(a);if(typeof b!=='object')b=armyById(b);
 if(!a||!b||a===b||a.f!==b.f||a.loc!==b.loc)return null;
 a.morale=+((a.n*a.morale+b.n*b.morale)/Math.max(1,a.n+b.n)).toFixed(2);a.n+=b.n;a.mp=Math.min(a.mp,b.mp);
 if(a.gen==null&&b.gen!=null){a.gen=b.gen;b.gen=null;}
 armyRemove(b.id,'merged');return a;}
/** Split n troops (default: half) off army `id` into a new army in the same province (needs room under armyCap). -> new army or null */
function armySplit(id,n){const a=armyById(id);if(!a||armyList(a.f).length>=armyCap(a.f))return null;
 n=Math.round((n==null?a.n/2:n)/100)*100;if(n<100||a.n-n<100)return null;
 a.n-=n;return armyCreate(a.f,a.loc,n,{mp:a.mp,mpMax:a.mpMax,morale:a.morale});}
/** Manpower a faction may hold. */
function armMpCap(f){return devSum(f)*800;}
/** Disband army `id`: half of its troops return home as manpower, no gold. -> manpower returned */
function armyDisband(id){const a=armyById(id);if(!a)return 0;const F=S.fac[a.f],back=Math.round(a.n*BAL_B.disbandMp);
 F.mp=Math.max(F.mp,Math.min(armMpCap(a.f),F.mp+back));armyRemove(id,'disbanded');return back;}
/** Reduce the garrison of province i to its minimum (half of the released troops return as manpower). -> troops released */
function garDisband(i){const p=S.prov[i],m=garMin(i);if(p.t<=m)return 0;const n=p.t-m,F=S.fac[p.o];p.t=m;
 F.mp=Math.max(F.mp,Math.min(armMpCap(p.o),F.mp+Math.round(n*BAL_B.disbandMp)));return n;}
/** Troops that can still be added to the garrison of province i. */
function garRoom(i){return Math.max(0,Math.floor((garrisonMax(i)-S.prov[i].t)/100)*100);}
/** Where a recruit of faction f in province i goes: {to:'army',army}|{to:'new'}|{to:'gar'}|{to:null,reason}. o={army?,gar?} */
function armRecruitDest(f,i,o={}){
 if(S.prov[i].o!==f)return {to:null,reason:lng('Sadece kendi eyaletinde asker toplayabilirsin.','You can only raise troops in your own provinces.')};
 if(S.prov[i].ctl)return {to:null,reason:lng('Eyalet düşman işgalinde: burada asker toplanamaz.','The province is under enemy occupation: no troops can be raised here.')};
 if(o.gar)return garRoom(i)>=100?{to:'gar'}:{to:null,reason:lng('Garnizon dolu.','The garrison is full.')};
 const sa=o.army!=null&&armyById(o.army),here=sa&&sa.f===f&&sa.loc===i?sa:armyAt(i,f).sort((x,y)=>y.n-x.n)[0];
 if(here)return {to:'army',army:here};
 if(armyList(f).length<armyCap(f))return {to:'new'};
 return garRoom(i)>=100?{to:'gar'}:{to:null,reason:lng('Ordu sınırına ulaştın ve garnizon dolu.','You have reached the army limit and the garrison is full.')};}
/** Recruit n troops (multiple of 100) for faction f in province i, paying gold and manpower. o={army?,gar?}.
 -> {to:'army'|'new'|'gar', army?, n} or {to:null, reason} */
function armRecruit(f,i,n,o={}){const F=S.fac[f],d=armRecruitDest(f,i,o);if(!d.to)return d;
 if(d.to==='gar')n=Math.min(n,garRoom(i));n=Math.floor(n/100)*100;
 const cost=RC*n/1000;if(n<100)return {to:null,reason:lng('Garnizon dolu.','The garrison is full.')};
 if(F.gold<cost)return {to:null,reason:lng('Hazinede yeterli altın yok.','Not enough gold in the treasury.')};if(F.mp<n)return {to:null,reason:lng('Yeterli insan gücü yok.','Not enough manpower.')};
 F.gold-=cost;F.mp-=n;
 if(d.to==='gar'){S.prov[i].t+=n;return {to:'gar',n};}
 if(d.to==='army'){d.army.n+=n;return {to:'army',army:d.army,n};}
 const a=armyCreate(f,i,n,{mp:0});return {to:'new',army:a,n};}

/** Distance (steps over any land/lane) from province s to every province. */
function armDistFrom(s){const d=new Int16Array(NP).fill(-1);d[s]=0;const q=[s];
 for(let h=0;h<q.length;h++){const u=q[h];for(const v of PD[u].adj)if(d[v]<0){d[v]=d[u]+1;q.push(v);}}return d;}
/** Keep the army rules true after anything (captures, peace, events, lost provinces):
 armies stand on friendly ground (else they go home), sizes are multiples of 100, no faction keeps more armies
 than armyCap, and a garrison far above its maximum spills into a field army. -> true if anything changed. */
function armTidy(){if(!S||!S.armies)return false;let ch=siegeClean();
 for(const a of S.armies.slice()){
  if(!S.fac[a.f]||!S.fac[a.f].alive){armyRemove(a.id,'eliminated');ch=true;continue;}
  const r=Math.round(a.n/100)*100;if(r!==a.n){a.n=r;ch=true;}
  if(a.n<100){armyRemove(a.id,'destroyed');ch=true;continue;}
  if(a.st!=='siege'&&!armFriendly(a.f,a.loc)){const d=armDistFrom(a.loc),foes=armFoeLocs(a.f);let best=-1;
   for(let i=0;i<NP;i++)if(S.prov[i].o===a.f&&!S.prov[i].ctl&&!foes.has(i)&&d[i]>=0&&(best<0||d[i]<d[best]))best=i;
   if(best>=0){a.loc=best;a.mp=0;}else armyRemove(a.id,'evicted');ch=true;}}
 for(const f of FK){if(!S.fac[f].alive)continue;let L=armyList(f);const cap=armyCap(f);
  while(L.length>cap){L.sort((x,y)=>x.n-y.n);const s=L[0],mate=L.slice(1).find(x=>x.loc===s.loc);
   if(mate)armyMerge(mate,s);else{const p=S.prov[s.loc];let n=s.n;if(ctl(s.loc)===f){const g=Math.min(n,garRoom(s.loc));p.t+=g;n-=g;}
    const F=S.fac[f];F.mp=Math.max(F.mp,Math.min(armMpCap(f),F.mp+Math.round(n*BAL_B.disbandMp)));
    if(f===S.player)news(lng(`${armName(s)} dağıtıldı: devletin bu kadar orduyu besleyemiyor.`,`The ${armName(s)} was disbanded: your realm cannot feed so many armies.`),'war');armyRemove(s.id,'disbanded');}
   L=armyList(f);ch=true;}}
 for(let i=0;i<NP;i++){const p=S.prov[i],m=garrisonMax(i);if(p.t<=m+BAL_B.garSlack)continue;
  const f=ctl(i),ex=p.t-m;p.t=m;ch=true;const here=armyAt(i,f).sort((x,y)=>y.n-x.n)[0];
  if(here){here.n+=ex;continue;}
  if(armyList(f).length<armyCap(f)){armyCreate(f,i,ex,{mp:0});continue;}
  const d=armDistFrom(i),L=armyList(f).sort((x,y)=>d[x.loc]-d[y.loc]);if(L.length){L[0].n+=ex;continue;}
  const F=S.fac[f];F.mp=Math.max(F.mp,Math.min(armMpCap(f),F.mp+ex));}
 if(ch)polDirty=true;
 return ch;}

/** Pre-army states (new game, v1 saves): every garrison above garrisonMax gives its excess to field armies.
 The largest excess stacks (up to armyCap) become armies; every other excess joins the nearest of them.
 Troops are conserved. Armies start ready to march. */
function armConvertLegacy(){
 for(const f of FK){if(!S.fac[f]||!S.fac[f].alive)continue;const ex=[];
  for(let i=0;i<NP;i++){const p=S.prov[i];p.mv=0;if(p.o!==f)continue;const m=garrisonMax(i);if(p.t>m){ex.push([i,p.t-m]);p.t=m;}}
  if(!ex.length)continue;ex.sort((a,b)=>b[1]-a[1]);
  const room=Math.max(0,armyCap(f)-armyList(f).length);let seeds=ex.filter(e=>e[1]>=1000).slice(0,room);
  if(!seeds.length){if(room>0)seeds=[ex[0]];else{const L=armyList(f);if(L.length){L[0].n+=ex.reduce((s,e)=>s+e[1],0);}continue;}}
  const made=seeds.map(([i,n])=>armyCreate(f,i,n,{mp:BAL_B.mpMax})),dists=made.map(a=>armDistFrom(a.loc));
  for(const e of ex){if(seeds.includes(e))continue;let k=0;for(let j=1;j<made.length;j++){const dj=dists[j][e[0]],dk=dists[k][e[0]];if(dj>=0&&(dk<0||dj<dk))k=j;}made[k].n+=e[1];}}}

/* --- lifecycle hooks --- */
hook('newGame',(s,player)=>{const k=PK.kroya;if(k!=null&&S.prov[k].fort<4)S.prov[k].fort=4; // B10: Skanderbeg's Kroya
 armConvertLegacy();S.b={arm:1};},5);
/* v1 saves (and W0 saves without S.b): excess garrisons become field armies once. Idempotent via S.b.arm. */
hook('migrate',(s,from)=>{if(s.b&&s.b.arm)return;const keep=S;S=s;
 try{if(!Array.isArray(s.armies))s.armies=[];if(s.seq==null)s.seq=1;armConvertLegacy();armTidy();s.b=Object.assign({},s.b,{arm:1});}finally{S=keep;}},10);
hook('peace',()=>armTidy());
hook('capture',()=>armTidy());
hook('afterRound',()=>armTidy(),95);
hook('events',()=>armTidy(),95);
hook('renderAll',()=>{if(S&&S.player&&!busy&&armTidy())save();});

/* Placeholder army markers; Track A's token layer (07c) replaces DRAW_LAYERS.armies. */
if(!DRAW_LAYERS.armies)DRAW_LAYERS.armies=(c,now,s,g3)=>{if(!S||!S.armies||!S.armies.length)return false;const by={};
 for(const a of S.armies)(by[a.loc]||(by[a.loc]=[])).push(a);
 c.save();c.textAlign='center';c.textBaseline='middle';c.font='700 11px "EB Garamond", Georgia, serif';
 for(const i in by){const d=PD[i],q=pj(d.lx,d.ly,3);if(!q[2])continue;by[i].forEach((a,k)=>{const x=q[0]-14+k*16,y=q[1]-14,r=10;
  c.beginPath();c.arc(x,y,r,0,7);c.fillStyle=FAC[a.f].c;c.fill();c.lineWidth=a.id===selArmy?3:1.5;c.strokeStyle=a.id===selArmy?'#f3d27a':'#1c160e';c.stroke();
  c.fillStyle='#fff';c.fillText(fmtK(a.n),x,y+.5);});}
 c.restore();return false;};

KE.armyMove=(id,to)=>armyMove(id,to);KE.armyCanMove=(id,to)=>armyCanMove(id,to);KE.armyPath=(id,to)=>armyPath(id,to);
KE.armyCap=f=>armyCap(f);KE.garrisonMax=i=>garrisonMax(i);KE.armTidy=()=>armTidy();KE.armRecruit=(f,i,n,o)=>armRecruit(f,i,n,o);
KE.armyMerge=(a,b)=>armyMerge(a,b);KE.armySplit=(id,n)=>armySplit(id,n);KE.armyDisband=id=>armyDisband(id);KE.fieldBattle=(a,d,i)=>fieldBattle(a,d,i);
KE.devRaw=f=>devRaw(f);KE.econRows=f=>econRows(f);KE.net=f=>income(f)-upkeep(f);
