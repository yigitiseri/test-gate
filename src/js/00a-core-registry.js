/* =====================================================================
   CORE REGISTRY (frozen after Wave 0: only the orchestrator edits this file)
   Every shared mutable collection lives here, so later files can register into
   them at load time without TDZ errors. See CONTRIBUTING.md for the contracts.

   HOOKS (name(args): order slots). hook(name,fn,order=50) creates lists lazily,
   so a track may fire / listen to a NEW name without editing this file.
    newGame(S,player)          end of newGame(); create your S fields here
    migrate(S,fromV)           loadGame -> migrate(); fill the same fields (idempotent!)
    turnStart()                start of endTurn compute (after S.news/S.report/TURN_TRACE reset)
    preAI(f)                   before aiTurn(f) of every AI faction
    roundEnd()                 before S.turn++: 10 B economy, 20 B sieges, 30 B exhaustion,
                               40 C characters, 50 D AI bookkeeping (opinion drift)
    newTurn()                  after S.turn++: 20 C historic/chains
    afterRound()               after endRound: 10 C missions, 50 D advisor
    events()                   after the victory check, only if !S.over: C random events
    capture(i,newOwner,oldOwner)   end of capture()
    battleResolved(rep)        end of battle(), every battle
    playerBattle(rep)          end of battle(), when the player is attacker or defender
    warDeclared(a,b)           a declared on b (also allies joining: (c,a), Safavid spawn)
    peace(a,b,terms)           end of makePeace(); terms={silent}
    eliminate(f,by)            end of eliminate()
    armyCreated(army) / armyRemoved(army,reason)
    charDied(ch) / succession(f,old,neu)
    boot()                     end of boot(), start screen shown
    enterGame()                end of enterGame() (new game or loaded game)
    renderAll()                end of renderAll()
   ===================================================================== */
const HOOKS={};                                   // name -> [{fn,order}]
function hook(name,fn,order=50){(HOOKS[name]||(HOOKS[name]=[])).push({fn,order});HOOKS[name].sort((a,b)=>a.order-b.order);}
function runHooks(name,...a){const L=HOOKS[name];if(!L)return;for(const h of L){try{h.fn(...a);}catch(e){console.error('hook '+name,e);}}}
const ACTS={};                                    // data-act name -> (t,f,F)=>void   (t = clicked element, f = S.player, F = S.fac[f])
const OVERBLOCK=new Set(['go','rec1','rec5','bdev','bmkt','bbrk','bfort','dwar','dp-war','dp-peace','dp-trib','dp-ally','dp-gift','dp-break','off']); // blocked once S.over
const QUIET=new Set(['go','rec1','rec5','bdev','bmkt','bbrk','bfort','end','begin','ev','dp-peace','dp-trib','dp-ally','dp-gift','off','snd']); // no generic click sound
const PANEL_SECTIONS=[];   // {id,order,when(ctx),html(ctx),bind?(root,ctx)}   ctx={i,d,p,f,F,mine,isCap,tgt}
const TOP_BUTTONS=[];      // {act,icon,label?,title?,aria?,id?,order,data?:{k:v}}
const REPORT_SECTIONS=[];  // {id,order,html()}      (Mevsim Raporu)
const STATE_SECTIONS=[];   // {id,order,html(f)}     (Devlet defteri)
const DIPLO_ROW=[];        // {id,order,meta?(f),buttons?(f)}   each returns an HTML string
const MENU_SECTIONS=[];    // {id,order,html(),bind?(root)}
const BATTLE_MODS=[];      // ctx=>[{l:'Kale 3',m:1.45,side:'def'|'att',k:'fort'}]  ctx={kind,att,def,from,to,n}
const ECON_ROWS=[];        // f=>[{l,v,k:'inc'|'exp',id?,tip?}]  (v>=0; income()=sum inc, upkeep()=sum exp)
const DRAW_LAYERS={};      // id -> (ctx2d,now,s,g3)=>boolean(wantsNextFrame)   drawn after banners, before fx
const PRESENTERS=[];       // {id,order,run(next)}  sequential end-of-turn presentation (core: fx 50, report 90)
const TIPS={};             // data-tip key -> el=>html  (D renders)
const TUT_STEPS=[];        // D
const TURN_TRACE=[];       // cleared each endTurn; {k:'battle'|'move'|...,f,from,to,path,army,n,win,rep}
const KE={stats:{turnMs:0,frames:0}}; // debug/test API; 15-boot exposes window.__ke=KE
let selArmy=null;          // selected army id (B uses; A highlights)

/** Run PRESENTERS in order; each gets next(). A presenter that never calls next() is skipped after 6 s. */
function present(done){
 const L=PRESENTERS.slice().sort((a,b)=>a.order-b.order);let k=0;
 const step=()=>{if(k>=L.length){done();return;}const p=L[k++];let called=false,timer=0;
  const nx=()=>{if(called)return;called=true;clearTimeout(timer);step();};
  timer=setTimeout(()=>{console.warn('presenter '+p.id+' timed out');nx();},6000);
  try{p.run(nx);}catch(e){console.error('presenter '+p.id,e);nx();}};
 step();
}

/* Seedable RNG for game logic (03-06 and their splits). Rendering and sound keep Math.random. */
function mkRng(seed){let s=seed>>>0;
 const f=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
 f.seed=n=>{s=n>>>0;};return f;}
const R=mkRng(Math.floor(Math.random()*4294967296));
KE.seed=n=>R.seed(n);
KE.reg={HOOKS,ACTS,OVERBLOCK,QUIET,PANEL_SECTIONS,TOP_BUTTONS,REPORT_SECTIONS,STATE_SECTIONS,DIPLO_ROW,MENU_SECTIONS,BATTLE_MODS,ECON_ROWS,DRAW_LAYERS,PRESENTERS,TIPS,TUT_STEPS,TURN_TRACE};
const bySlot=L=>L.slice().sort((a,b)=>a.order-b.order); // registry entries in order
