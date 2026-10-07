/* =====================================================================
   MOVE REPLAY (Track A, A2): before the season report, this turn's army moves and battles (TURN_TRACE)
   play on the map: at most 12 marches (the player's own, then enemies at war, then neighbours), booms on
   battles, 4 s at most, skippable with "Geç" (or Esc). Replaces the core 'fx' presenter (removed by id).
   Trace entries: {k:'move'|'battle'|'siege'|'siegeFell'|…, f, from, to, path?, army?, n, win?, rep?}; every field may be missing.
   W2 prioritisation (real army traces): the player's moves, then moves against the player's provinces, falls of
   besieged towns, enemies at war, neighbours; rear-area shuffles last; at most 4 items per other realm.
   Siege ticks do not replay (the camp is on the map); a siegeFell is a stop with a "Fallen" boom.
   ===================================================================== */
{const k=PRESENTERS.findIndex(p=>p.id==='fx');if(k>=0)PRESENTERS.splice(k,1);}
const A_RP={max:12,budget:3700,step:560,pause:430,gap:240,fade:380,booms:14,pan:420,perFac:4};
const aRp={on:false,items:[],byArmy:{},t0:0,T:0,timer:0,done:null,pan:null,bar:null};
KE.replay={get on(){return aRp.on;},get lastMs(){return aRp.lastMs;},get shown(){return aRp.items.length;},get ghosts(){return aRp.items.filter(it=>!it.live).length;},get plan(){return aRp.lastPlan||[];},skip:()=>aRpFinish(true),opt:aOpt,build:()=>aRpBuild(),rank:()=>{const a=aRpBuild();return a.length?aRpPlan(a).shown.map(aRpSum):[];}};
const aRpSum=it=>({f:it.f,army:it.army,pr:Math.round(it.pr),mine:it.mine,threat:!!it.threat,fell:it.evs.some(e=>e.fell),battles:it.evs.filter(e=>e.rep).length,pts:it.pts.length});

/** Build replay items from TURN_TRACE: one item per army (its moves chained), or per army-less battle. */
function aRpBuild(){const pl=S.player,items=[],byId={};
 TURN_TRACE.forEach((e,idx)=>{if(!e)return;const r=e.rep||null;
  let path=Array.isArray(e.path)&&e.path.length?e.path.slice():[e.from,e.to];path=path.filter(i=>i!=null&&PD[i]);if(!path.length)return;
  const f=e.f||(r&&r.att);if(!FAC[f])return;
  let it=e.army!=null?byId[e.army]:null;
  if(!it){it={army:e.army!=null?e.army:null,f,n:e.n||(r&&r.n)||0,pts:[path[0]],evs:[],idx,mine:false};items.push(it);if(e.army!=null)byId[e.army]=it;}
  for(const j of path[0]===it.pts[it.pts.length-1]?path.slice(1):path)if(j!==it.pts[it.pts.length-1])it.pts.push(j);
  const at=e.to!=null&&PD[e.to]?e.to:it.pts[it.pts.length-1];
  if(e.k==='siegeFell'){if(!it.evs.some(v=>v.fell&&v.p===at))it.evs.push({at:it.pts.length-1,p:at,fell:true,win:true,att:f,def:S.prov[at].o,rep:null});}
  else if(e.k==='siege')it.sieging=true;
  else if(e.k==='battle'||r){const win=e.win!=null?!!e.win:!!(r&&r.win);it.evs.push({at:it.pts.length-1,p:at,win,att:(r&&r.att)||f,def:r&&r.def,rep:r});}
  if(f===pl||(r&&(r.def===pl||r.att===pl)))it.mine=true;
  else if(pl&&e.to!=null&&PD[e.to]&&(S.prov[e.to].o===pl||aCtl(e.to)===pl))it.threat=true;});
 for(const it of items){const a=it.army!=null&&typeof armyById==='function'?armyById(it.army):null;
  if(a){it.live=true;if(PD[a.loc]&&a.loc!==it.pts[it.pts.length-1])it.pts.push(a.loc);}   // retreat / final position
  else{it.live=false;const ev=it.evs[it.evs.length-1];if(ev&&!ev.win&&ev.at>0&&it.pts.length===ev.at+1)it.pts.push(it.pts[ev.at-1]);} // repulsed: fall back, then fade
 }
 return items.filter(it=>it.pts.length>1||it.evs.length);}

const aOnScreen=i=>{const q=pj(PD[i].lx,PD[i].ly);return q[2]&&q[0]>=8&&q[1]>=topH()+8&&q[0]<=vw-8&&q[1]<=vh-8;};
/** Pick at most A_RP.max items (visible or the player's), schedule them in trace order within the time budget. */
function aRpPlan(all){const pl=S.player,nb=new Set(pl?nbrs(pl):[]);
 for(const it of all){it.vis=it.pts.some(aOnScreen);const fell=it.evs.some(e=>e.fell),bat=it.evs.some(e=>e.rep),rear=!it.evs.length&&it.pts.every(i=>S.prov[i].o===it.f);
  it.pr=(it.mine?1000:0)+(it.threat?600:0)+(pl&&it.f!==pl&&atWar(pl,it.f)?300:0)+(fell?250:0)+(nb.has(it.f)?150:0)+(it.vis?80:0)+(bat?60:0)+(it.sieging?40:0)+Math.min(30,it.n/2000)-(rear&&!it.mine?200:0);}
 const per={},shown=[];
 for(const it of all.filter(it=>it.vis||it.mine||it.threat).sort((a,b)=>b.pr-a.pr)){if(shown.length>=A_RP.max)break;
  if(!it.mine&&!it.threat&&(per[it.f]||0)>=A_RP.perFac)continue;per[it.f]=(per[it.f]||0)+1;shown.push(it);}
 shown.sort((a,b)=>a.idx-b.idx);
 const sp=aOpt.speed||1,step=A_RP.step/sp,pause=A_RP.pause/sp,gap=A_RP.gap/sp,fade=A_RP.fade/sp;let T=0;
 shown.forEach((it,k)=>{let t=k*gap;it.start=t;it.segs=[];
  const evAt=new Map(it.evs.map(e=>[e.at,e]));if(evAt.has(0)){evAt.get(0).t=t;t+=pause;}
  for(let s=0;s<it.pts.length-1;s++){it.segs.push({s,t0:t,t1:t+step});t+=step;const e=evAt.get(s+1);if(e&&e.t==null){e.t=t;t+=pause;}}
  if(!it.live){it.f0=t;it.f1=t+fade;t+=fade;}it.end=t;T=Math.max(T,t);});
 return {shown,T};}
function aScale(shown,k){for(const it of shown){it.start*=k;it.end*=k;if(it.f0!=null){it.f0*=k;it.f1*=k;}for(const s of it.segs){s.t0*=k;s.t1*=k;}for(const e of it.evs)if(e.t!=null)e.t*=k;}}

const aEase=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
/** Map position of an item at replay time t: quadratic bezier per step (as the old march fx), heading, alpha. */
function aRpAt(it,t){const P=i=>PD[it.pts[i]];let x=P(0).lx,y=P(0).ly,dir=null;
 for(const sg of it.segs){if(t<sg.t0)break;const a=P(sg.s),b=P(sg.s+1),u=aEase(clamp((t-sg.t0)/(sg.t1-sg.t0),0,1)),v=1-u;
  const mx=(a.lx+b.lx)/2-(b.ly-a.ly)*.16,my=(a.ly+b.ly)/2+(b.lx-a.lx)*.16;x=v*v*a.lx+2*v*u*mx+u*u*b.lx;y=v*v*a.ly+2*v*u*my+u*u*b.ly;dir=Math.atan2(b.ly-a.ly,b.lx-a.lx);}
 let al=1;if(!it.live){if(t<it.start)al=0;else if(it.f0!=null&&t>it.f0)al=1-clamp((t-it.f0)/(it.f1-it.f0),0,1);}
 return {x,y,dir,al};}
/** Replay override for a live army: its animated position (tokens and 3D regiments use it), or null. */
function aRpPos(id){if(!aRp.on)return null;const it=aRp.byArmy[id];if(!it)return null;const p=aRpAt(it,performance.now()-aRp.t0);return p;}
/** Ghost tokens: armies destroyed this turn and army-less battle traces. */
function aRpGhosts(){if(!aRp.on)return [];const t=performance.now()-aRp.t0,out=[];
 for(const it of aRp.items)if(!it.live){const p=aRpAt(it,t);if(p.al>0)out.push({id:null,f:it.f,n:it.n,gen:null,x:p.x,y:p.y,k:0,al:p.al,dir:p.dir});}
 return out;}
/** Marching trails (the part of the route already covered) and the progress bar; true while the replay runs. */
function aRpTrails(c,now,g3){if(!aRp.on)return false;
 if(aRp.pan){const p=aRp.pan,u=aEase(clamp((now-p.t0)/p.d,0,1));cam.x=p.x0+(p.x1-p.x0)*u;cam.y=p.y0+(p.y1-p.y0)*u;if(u>=1)aRp.pan=null;}
 const t=now-aRp.t0;
 for(const it of aRp.items){if(t<it.start||!it.segs.length)continue;const col=FCOL[it.f]||[120,90,60],al=clamp(1-(t-it.end)/900,0,1)*(it.live?1:.85);if(al<=0)continue;
  const pts=[];for(const sg of it.segs){if(t<sg.t0)break;const a=PD[it.pts[sg.s]],b=PD[it.pts[sg.s+1]],mx=(a.lx+b.lx)/2-(b.ly-a.ly)*.16,my=(a.ly+b.ly)/2+(b.lx-a.lx)*.16,un=clamp((t-sg.t0)/(sg.t1-sg.t0),0,1);
   for(let q=0;q<=10;q++){const u=aEase(q/10*un),v=1-u;const p=pj(v*v*a.lx+2*v*u*mx+u*u*b.lx,v*v*a.ly+2*v*u*my+u*u*b.ly,g3?3:0);if(!p[2])continue;pts.push(p);}}
  if(pts.length<2)continue;c.save();c.globalAlpha=al;c.lineCap='round';c.lineJoin='round';
  const line=()=>{c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(const p of pts)c.lineTo(p[0],p[1]);};
  c.strokeStyle='rgba(20,12,4,.5)';c.lineWidth=6.5;line();c.stroke();
  c.strokeStyle=`rgb(${col[0]},${col[1]},${col[2]})`;c.lineWidth=3.6;c.setLineDash([2,7]);line();c.stroke();c.setLineDash([]);
  c.strokeStyle='rgba(243,210,122,.9)';c.lineWidth=1.2;c.setLineDash([2,7]);c.lineDashOffset=-1;line();c.stroke();c.setLineDash([]);c.restore();}
 if(aRp.bar){const i=aRp.bar.querySelector('.a-rppg i');if(i)i.style.width=Math.round(clamp(t/aRp.T,0,1)*100)+'%';}
 return true;}

function aBoomLabel(ev){const pl=S.player;
 if(ev.fell)return ev.att===pl?{label:lng('Alındı','Taken'),good:true}:{label:lng('Düştü','Fallen'),good:false};
 if(!ev.rep)return {label:'',good:false};
 if(ev.def===pl)return {label:ev.win?lng('Kaybedildi','Lost'):lng('Savunuldu','Held'),good:!ev.win};if(ev.att===pl)return {label:ev.win?lng('Zafer','Victory'):lng('Bozgun','Rout'),good:ev.win};return {label:'',good:false};}
/** Replay off (or nothing visible): only booms on visible battles, no waiting. */
function aRpQuick(){let k=0;for(const e of TURN_TRACE){if(k>=12)break;if(!e||(e.k!=='battle'&&e.k!=='siegeFell')||e.to==null||!PD[e.to]||!aOnScreen(e.to))continue;
 const r=e.rep||{},lb=e.k==='siegeFell'?aBoomLabel({fell:true,att:e.f}):aBoomLabel({rep:r,def:r.def,att:r.att||e.f,win:e.win!=null?e.win:r.win});addFx({type:'boom',p:e.to,dur:1300,delay:k*140,seed:k*1.7,label:lb.label,good:lb.good});k++;}}

function aRpStart(shown,T,next){const pl=S.player,now=performance.now();let lead=0;
 // camera nudge: only when none of the player's moves is on screen
 const mine=shown.filter(it=>it.mine||it.threat);
 if(mine.length&&!mine.some(it=>it.vis)){const it=mine[0],p=PD[it.evs.length?it.evs[0].p:it.pts[it.pts.length-1]];lead=A_RP.pan;
  if(G3.on)G3.center(p.lx,p.ly,G3.s,0,topH());else{const c0={x:cam.x,y:cam.y};centerOn(p.lx,p.ly,cam.s);aRp.pan={x0:c0.x,y0:c0.y,x1:cam.x,y1:cam.y,t0:now,d:lead*.9};cam.x=c0.x;cam.y=c0.y;}}
 Object.assign(aRp,{on:true,items:shown,byArmy:{},t0:now+lead,T,done:next,w0:now});
 for(const it of shown)if(it.live)aRp.byArmy[it.army]=it;
 // booms: the replayed battles on arrival, plus other visible battles spread over the replay
 let k=0;for(const it of shown)for(const ev of it.evs){const lb=aBoomLabel(ev);addFx({type:'boom',p:ev.p,dur:1300,delay:lead+(ev.t||0),seed:(k++)*1.7,label:lb.label,good:lb.good,rp:1});}
 const used=new Set(shown.flatMap(it=>it.evs.map(e=>e.rep)));let extra=0;
 for(const e of TURN_TRACE){if(extra>=A_RP.booms)break;if(!e||e.k!=='battle'||used.has(e.rep)||e.to==null||!PD[e.to]||!aOnScreen(e.to))continue;
  addFx({type:'boom',p:e.to,dur:1100,delay:lead+Math.random()*T*.85,seed:(k++)*1.7,label:'',rp:1});extra++;}
 // HUD: title, progress, skip
 const hud=$('#hud');if(hud){const b=document.createElement('div');b.className='a-rpbar';b.setAttribute('role','status');
  b.innerHTML=`<span class="a-rpico" aria-hidden="true">⚔</span><span class="a-rptx"><b>${lng('Sefer haberleri','Campaign news')}</b><small>${shown.length} ${lng('hamle',shown.length===1?'move':'moves')}${pl?' · '+esc(dateStr(S.turn)):''}</small></span><span class="a-rppg"><i></i></span><button class="a-rpskip" data-act="a-skip" aria-label="${lng('Hamle tekrarını geç','Skip the move replay')}">${lng('Geç','Skip')}<span aria-hidden="true"> ›</span></button>`;
  hud.appendChild(b);aRp.bar=b;}
 if(!$('#modal').hidden)document.body.classList.add('a-rp-defer');   // an event modal waits until the moves are shown
 clearTimeout(aRp.timer);aRp.timer=setTimeout(()=>aRpFinish(false),lead+T+260);
 if(G3.on)G3.dirty=true;req();}

function aRpFinish(skipped){if(!aRp.on)return;aRp.on=false;aRp.lastMs=performance.now()-aRp.w0;clearTimeout(aRp.timer);aRp.pan=null;
 if(aRp.bar){aRp.bar.remove();aRp.bar=null;}document.body.classList.remove('a-rp-defer');
 if(skipped){const now=performance.now();for(let k=fx.length-1;k>=0;k--)if(fx[k].rp&&now-fx[k].t0<(fx[k].delay||0))fx.splice(k,1);}
 aRp.byArmy={};aRp.items=[];if(G3.on)G3.dirty=true;req();
 const d=aRp.done;aRp.done=null;if(d)d();}

PRESENTERS.push({id:'replay',order:20,run(next){
 if(!S||!S.player){next();return;}
 let plan=null;try{const all=aRpBuild();plan=all.length?aRpPlan(all):null;}catch(e){console.error('replay',e);plan=null;}
 aRp.lastPlan=plan?plan.shown.map(aRpSum):[];
 if(!aOpt.replay||!plan||!plan.shown.length||document.hidden){aRpQuick();next();return;}
 let lead=0;const mine=plan.shown.filter(it=>it.mine||it.threat);if(mine.length&&!mine.some(it=>it.vis))lead=A_RP.pan;
 const bud=A_RP.budget-lead;if(plan.T>bud)aScale(plan.shown,bud/plan.T);
 aRpStart(plan.shown,Math.min(plan.T,bud),next);}});
ACTS['a-skip']=()=>aRpFinish(true);
document.addEventListener('keydown',e=>{if(aRp.on&&e.key==='Escape')aRpFinish(true);});
