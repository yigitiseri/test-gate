# Contributing

The game ships as one file, `index.html`, but it is **built** from the sources in `src/`.

## Rules

1. Edit files in `src/` only. **Never hand-edit `index.html`**: it is generated and will be overwritten.
2. Rebuild: `node build.js` (plain Node, no dependencies). `node build.js --check` fails if `index.html` is stale or was hand-edited.
3. Test: `tests/run-all.sh` (about 15 min; build, `node --check`, duplicate names, 2D smoke 3 factions x 150 turns + mobile,
   UI click-through, scenarios, quick balance sim, 3D smoke). Quicker pass: `KE_TURNS=40 tests/run-all.sh`. Single runs:
   - `node tests/smoke.js --faction=HUN --turns=80 --mode=2d|3d --viewport=desktop|mobile [--passive]`
   - `node tests/ui.js --mode=2d [--viewport=mobile]`
   - `node tests/scenario.js [name-substring ...]`
   - `node tests/sim.js --faction=OSM --policy=ai|passive|greedy --turns=120 --seed=1..3 [--assert] [--compare] [--out=x.json]`
   - `node tests/names.js`
   Tests use the global Playwright and `tests/vendor/three.min.js` (three.js r128, MIT); no `npm install`.
4. Commit `src/` changes **together with** the rebuilt `index.html`.
5. Do not touch the `<!--ARTIFACT-START-->` marker in `src/template.html`, nor `manifest.webmanifest`, `sw.js`, `icons/`.

## How the build works

`src/template.html` is the page skeleton. Its line `<!--@include css-->` is replaced by every `src/css/*.css`
and its line `/*@include js*/` by every `src/js/*.js`, each in file-name order.

The JS files are **not ES modules**. They are pasted one after another inside a single
`(()=>{ 'use strict'; ... })();` that lives in the template, so they share one scope, exactly like the
original single script. Consequences:

- Order matters. A top-level `const`/`let` must be declared (in file order) before code that runs at load
  time uses it. Functions are hoisted, so calling a function defined in a later file is fine.
  Every shared registry is declared in `00a-core-registry.js`, which sorts right after `00-geo-data.js`
  (`-` < `a`), so any later file can register into it at load time.
- There are no imports/exports; a name defined in any file is visible in every other file.
  `node --check` does **not** catch two top-level `function x` declarations (the later wins silently):
  `node tests/names.js` does. New top-level names get your track prefix (below).
- Every source file must end with a newline.
- New file? Give it a number that places it at the right point in the order (e.g. `06c-...`).

## Who owns what (Wave 1 / Wave 2)

Tracks: **A** graphics/performance, **B** armies/war rules, **C** history/dynasties/missions/events,
**D** UX shell/AI strategy/audio, **O** orchestrator (frozen for W1 and W2: edits only through SEAM REQUESTS).

| File | Owner | Contents |
|---|---|---|
| `src/template.html` | O (frozen) | `<head>` (PWA meta, ARTIFACT marker, fonts), body: top bar with empty `nav#navTabs`, `#panel`, `#zoom`, `#hud` (overlay layer, `pointer-events:none`, children opt in), `#card` (side card slot, hidden), modal, start screen; IIFE wrapper |
| `src/js/00-geo-data.js` | O (frozen) | projection (`P`, `W`, `H`), seas, islands, rivers, mountains, region labels |
| `src/js/00a-core-registry.js` | O (frozen) | `HOOKS`/`hook`/`runHooks`, all registries, `present()`, seeded RNG `R`, `KE`, `selArmy`, `bySlot` |
| `src/js/01-factions-provinces.js` | O (frozen) | `FAC`, `PROVS`, `LANES`, `PD`/`PK`/`FK`, heraldry (`ARMS`, `armsSVG`), hijri/roman helpers |
| `src/js/02-mapbuild.js` | O (frozen) | noise, `buildMap`, `renderBase`, rhumb lines, galleys, cartouche, frame, compass |
| `src/js/03-state.js` | B | constants, `S`, relation helpers, `HIST`, economy (`provIncome`, `econRows`, `income`/`upkeep` = sums of `ECON_ROWS`, core rows "Eyalet vergileri", "Ordu maaşları"), `strength` (garrisons + `S.armies`), `newWar`, `newGame` (+ `runHooks('newGame')`), `score`, log/news, economy `roundEnd` slot 10 |
| `src/js/03b-missions.js` | C | `MIS`, `genericMissions`, `checkMissions` (`afterRound` slot 10), `showMissions`, mission assignment (`newGame` hook order 10), ACT `missions` |
| `src/js/03c-characters.js` | C | stub: `rulerName(f)` (= `FAC[f].r`), `chRuler`/`chHeir` (null), `chGenerals` ([]) |
| `src/js/04-war-diplomacy.js` | B | war/peace/offers, AI acceptance rules, `battleMods`, `defBase`, `atkMul`/`atkPower`/`defPower`, `battleOdds`, `battle` (fills `rep.kind/mods/roll`, `TURN_TRACE`), `capture`, `eliminate`; core `BATTLE_MODS` (winter, fort, mountain, desert) |
| `src/js/04b-armies.js` | B | data-level army API (no rules) |
| `src/js/05-ai.js` | B | `aiTurn` (attack scoring from `aiTargets`), `aiEconomy` |
| `src/js/05b-ai-strategy.js` | D | `aiDiplo`, `aiTargets`, `aiDefendNeeds`, `aiNudge`, opinion drift (`roundEnd` slot 50) |
| `src/js/06-turn-events.js` | O (frozen) | turn pipeline: `endTurn`, `endRound`, `checkVictory`, default presenters `fx` (50) and `report` (90) |
| `src/js/06b-history.js` | C | `historic` (`newTurn` slot 20), `spawnSafavid`, `randomEvent` (`events` hook) |
| `src/js/07-render2d.js` | A | camera, `renderPol`, labels, highlight, `draw` (runs `DRAW_LAYERS`), cities, banners, battle fx |
| `src/js/07b-map-controls.js` | A | ACTS `zin`, `zout`, `fit` (recentres, bug B1 fixed), `mode`, `v3d` |
| `src/js/08-render3d.js` | A | `G3` three.js view, `G3.wantOnBoot()`, `curS`, `pj`, `panBy` |
| `src/js/09-input.js` | D | pointer/touch/wheel gestures, `pickAt`, `hover` |
| `src/js/09b-select.js` | B | `mapClick`, `clearSel`, `tgtOk` |
| `src/js/10-sound.js` | D | `SND`, `sndIcon`, ACT `snd` |
| `src/js/11-ui-core.js` | D | `esc`, `shield`, `relChip`, `toast`, `renderNav` (from `TOP_BUTTONS`, core buttons registered here), `renderTop`, `renderPanel` shell, `act()`, ACT `end`, listeners, `renderAll` |
| `src/js/11b-panel-province.js` | B | panel sections `orders` 40, `recruit` 50, `build` 60, `foreign` 70; ACTS `go`, `cancel`, `close`, `rec1`, `rec5`, `bdev`, `bmkt`, `bbrk`, `bfort`, `dwar` |
| `src/js/12-modals.js` | D | modal queue, `eventModal`, `showReport` shell (+ `news` section 30), `showChron`, `showState` shell (+ `ledger` 10, `meta` 20); ACTS `ev`, `mclose`, `state`, `chron` |
| `src/js/12b-diplomacy.js` | B | `btlRow`, report sections `offers` 10 and `battles` 20, `showDiplo` (+ `DIPLO_ROW` `core`), ACTS `diplo`, `dp-*`, `off` |
| `src/js/13-guide.js` | D | guide text, `showGuide`; ACTS `guide`, `help` |
| `src/js/14-menus-start-save.js` | D | help, `showMenu` (+ `MENU_SECTIONS` `sound` 20), end screen, start screen, `beginGame`, `enterGame`, `save`, `migrate`, `loadGame`; ACTS `menu`, `snd-music`, `snd-sfx`, `pick`, `begin`, `continue`, `newgame` |
| `src/js/15-boot.js` | O (frozen) | `boot()`, service worker, `window.__ke = KE` |
| `src/css/00-base.css`, `03-historical-theme.css` | A | |
| `src/css/01-ui-panels.css`, `02-responsive.css`, `04-guide.css` | D | (`#hud`/`#card` base rules at the end of 01) |
| `tests/lib.js`, `tests/run-all.sh` | O (frozen) | |
| `tests/smoke.js`, `ui.js`, `scenario.js`, `sim.js`, `simstats.js`, `names.js`, `inv/core*.js`, `scenarios/core-*.js`, `balance/core.js`, `balance/baseline.json`, `fixtures/` | O | change through SEAM REQUEST |

New files each track **may add** (nothing else):

| Track | JS | CSS | Tests |
|---|---|---|---|
| A | `07c-tokens.js`, `07d-replay.js`, `07e-battle-card.js` | `css/07-anim.css` | `tests/scenarios/a-*.js`, `tests/perf.js`, `tests/inv/a-*.js` |
| B | `04c-army-rules.js`, `05a-ai-armies.js` | `css/05-armies.css` | `tests/scenarios/b-*.js`, `tests/inv/b-*.js`, `tests/balance/b-*.js` |
| C | `03d-char-data.js`, `06c-chains.js`, `06d-event-pool.js` | `css/06-chars.css` | `tests/scenarios/c-*.js`, `tests/inv/c-*.js`, `tests/balance/c-*.js`, `tests/missions-lint.js` |
| D | `11c-tooltips.js`, `11d-advisor.js`, `11e-tutorial.js` | `css/08-mobile-ux.css` | `tests/scenarios/d-*.js`, `tests/inv/d-*.js`, `tests/balance/d-*.js` |

New top-level names: A `a…`/`tok…`/`fx…`, B `arm…`/`gar…`/`sg…`/`tr…`, C `ch…`/`ev…`/`mis…`, D `ai…` (in `05b` only)/`ui…`/`tut…`.
Existing functions are never renamed.

## Registries (all in `00a-core-registry.js`)

Register at load time from your own file; never edit the consumer shell of another track.
Ordered registries are rendered with `bySlot(list)` (ascending `order`, stable).

| Registry | Entry shape | Consumer | Order slots / notes |
|---|---|---|---|
| `hook(name,fn,order=50)` / `runHooks(name,...args)` | function | pipeline, battle, army API, save | see hook table; a throwing hook is logged (`console.error`, fails tests) and the others still run |
| `ACTS[name]` | `(t,f,F)=>void` (`t` clicked element, `f`=`S.player`, `F`=`S.fac[f]`) | `11` `act()` | `OVERBLOCK.add(name)` if blocked after game over; `QUIET.add(name)` for no click sound |
| `PANEL_SECTIONS` | `{id,order,when(ctx),html(ctx),bind?(root,ctx)}`, `ctx={i,d,p,f,F,mine,isCap,tgt}` | `11` `renderPanel` (header, chips, stats grid, then sections) | 30 armies B, 35 general C, 40 orders B (`data-sheet="action"`), 50 recruit B, 60 build B, 70 foreign B, 90 advisor D |
| `TOP_BUTTONS` | `{act,icon,label?,title?,aria?,id?,order,data?:{k:v}}` | `11` `renderNav` | core: diplo 10, missions 20, chron 30, guide 40, snd 50, menu 60 |
| `REPORT_SECTIONS` | `{id,order,html()}` | `12` `showReport` | 10 offers B, 20 battles B, 25 sieges B, 30 news core, 40 dynasty C |
| `STATE_SECTIONS` | `{id,order,html(f)}` | `12` `showState` | 10 ledger (from `ECON_ROWS`), 20 meta |
| `DIPLO_ROW` | `{id,order,meta?(f),buttons?(f)}` (HTML strings) | `12b` `showDiplo` | 10 core |
| `MENU_SECTIONS` | `{id,order,html(),bind?(root)}` | `14` `showMenu` | 20 sound |
| `BATTLE_MODS` | `ctx=>[{l,m,side:'att'|'def',k}]` or null; `ctx={kind:'assault'|'field'|'sally',att,def,from,to,n}` (`to`/`n` may be missing, e.g. `atkMul(f)`) | `04` `battleMods`, `atkPower`, `defPower`, `battleOdds`, `battle` | core: `winter` (att .85), `fort`, `mtn`, `des`. Labels are player-facing Turkish |
| `ECON_ROWS` | `f=>[{l,v,k:'inc'|'exp',id?,tip?}]` (`v>=0`) | `03` `econRows`/`income`/`upkeep`, state book ledger, D tooltips | core: `tax` "Eyalet vergileri", `army` "Ordu maaşları (…)" |
| `DRAW_LAYERS[id]` | `(ctx2d,now,s,g3)=>wantsNextFrame` | `07` `draw()` after banners, before fx | A tokens; B placeholder only `if(!DRAW_LAYERS.armies)` |
| `PRESENTERS` | `{id,order,run(next)}` | `06` via `present(done)` | 20 replay A, 50 `fx` core (A may remove it by id), 90 `report` core. 6 s watchdog per presenter; the end-turn button stays disabled until all finish |
| `TURN_TRACE` | `{k,f,from,to,path,army,n,win,rep}` | A replay, D advisor | cleared at the start of each `endTurn`; W0 pushes `k:'battle'` for every battle |
| `TIPS[key]`, `TUT_STEPS`, (`ADVICE` in D's file) | D-defined | D | all tracks may add entries |
| `EVENTS`, `CHAINS` | C-defined in C files | C | D only via `aiNudge` |
| `KE` | debug/test API (`window.__ke`) | tests | everyone may add handles (`KE.x=…` in own file) |

### Hooks (names and order slots are frozen)

| Hook | Args | Fired | Slots |
|---|---|---|---|
| `newGame` | `(S,player)` | end of `newGame` (also for the start-screen `newGame(null)`) | 10 C missions |
| `migrate` | `(S,fromV)` | in `migrate()`, on every load (also v2 saves): must be idempotent | 10 B |
| `turnStart` | `()` | start of the `endTurn` compute | |
| `preAI` | `(f)` | before `aiTurn(f)` of each AI faction | |
| `roundEnd` | `()` | before `S.turn++` | 10 B economy, 20 B sieges, 30 B exhaustion, 40 C characters, 50 D AI bookkeeping (opinion drift) |
| `newTurn` | `()` | after `S.turn++` | 20 C historic/chains |
| `afterRound` | `()` | after `endRound` | 10 C missions, 50 D advisor |
| `events` | `()` | after `checkVictory`, only if `!S.over` | C random events (core rule: `turn>1`, 30%) |
| `capture` | `(i,newOwner,oldOwner)` | end of `capture` | |
| `battleResolved` | `(rep)` | end of every `battle` | |
| `playerBattle` | `(rep)` | after `battleResolved` when the player fought | |
| `warDeclared` | `(a,b)` | `declareWar` (then `(c,a)` for each ally `c` joining), Safavid spawn | |
| `peace` | `(a,b,terms)` | end of `makePeace`, `terms={silent}` | |
| `eliminate` | `(f,by)` | end of `eliminate` (its armies are removed first) | |
| `armyCreated` / `armyRemoved` | `(army)` / `(army,reason)` | `armyCreate` / `armyRemove` | |
| `charDied` / `succession` | `(ch)` / `(f,old,neu)` | C | |
| `boot`, `enterGame`, `renderAll` | `()` | end of `boot`, `enterGame`, `renderAll` | |

`endTurn` order: `turnStart` → for each AI in random order `preAI(f)`, `aiTurn(f)` → `endRound` (`roundEnd`,
`S.turn++`, `newTurn`) → `afterRound` → `checkVictory` → `events` → save, render → `present(PRESENTERS)` → button enabled.

## Public API frozen in W0 (signatures; owners may change the internals)

- Armies (`04b`, B): `armyCreate(f,loc,n,o={})→army` (fires `armyCreated`), `armyRemove(id,reason)`, `armyById(id)`,
  `armyList(f?)`, `armyAt(i,f?)`, `armySetLoc(id,i)` (raw teleport). `KE.armyCreate`, `KE.armyList`.
- Combat (`04`, B): `battleMods(ctx)`, `defBase(i)`, `atkMul(f,ctx?)`, `atkPower(n,f,ctx?)`, `defPower(i,att)`,
  `battleOdds({att,to,n,from?,kind?})→{p,a,d,r,mods}` (p: logistic in log(a/d) matching the two `rnd(.85,1.2)` rolls),
  `battle(from,to,n)→rep` with `rep.kind`, `rep.mods`, `rep.roll={a,d}`.
- Economy (`03`, B): `provIncome(i)`, `econRows(f)`, `income(f)`, `upkeep(f)`, `strength(f)`, `newWar(a,b)`.
- Characters (`03c`, C): `rulerName(f)` (use it everywhere a ruler is shown, never `FAC[f].r`), `chRuler(f)`, `chHeir(f)`, `chGenerals(f)`.
- AI strategy (`05b`, D): `aiTargets(f)→[{i,prio}]` (default: adjacent enemy provinces, the pre-W0 scoring; `aiTurn` uses it),
  `aiDefendNeeds(f)→[{i,need}]` (default `[]`), `aiNudge(f,{war?,target?,prio?,until?})` (stores in `S.ai[f].nudges`).
- Core: `present(done)`, `migrate(s)`, `R()` (seeded game RNG), `KE.seed(n)`.

## Save schema v2

`SAVE='kizil-elma-1451-v1'` is kept (no key bump). `loadGame` backs a v1 save up once to
`kizil-elma-1451-v1-backup`, then `migrate(s)` fills every missing default and runs `hook('migrate')`.
`migrate` must be idempotent: on a v2 state `JSON.stringify` must not change (`tests/ui.js` compares the JSON
across a reload; `core-migrate` checks it on the v1 fixture).

```js
S.v=2; S.seq=1;   // id counter for armies/chars
S.armies=[];      // {id,f,loc,n,gen:null|charId,mp:0,mpMax:2,path:[],morale:1,st:'idle'|'moving'|'siege'}  (B)
S.sieges={};      // {[prov]:{f,army,prog,need,t0}}                                                     (B, W2)
// S.prov[i].ctl  optional occupier (absent => owner)                                                  (B, W2)
S.chars={};       // {[id]:{id,n,f,role,born,died:null,traits:[],skill,dyn,ep}}                          (C)
S.fac[f].ruler=null; S.fac[f].heir=null; S.fac[f].gens=[];                                              (C)
S.war[k].ex={}; S.war[k].goal=null;   // every war is created by newWar(a,b)                             (B, W2)
S.ae={}; S.coal={};                    // aggressive expansion, coalitions                                (D, W2)
S.evs={}; S.chains={};                 // event cooldown/once flags, chain state                          (C)
S.ai={};          // f -> {goal:null,desire:{},nudges:[]}, created for every faction                     (D)
S.tut=null;       // {step,done,off}                                                                     (D)
S.hist=[];        // optional per-4-turn stats (keep empty in W1)
```

Any new field goes into **both** `hook('newGame')` and `hook('migrate')`. A field not listed above goes under
your track's namespace object (`S.a`, `S.b`, `S.c`, `S.d`).

## RNG

Game logic (03–06 and their splits, including new files of those tracks) uses `R()` / `rnd(a,b)`, never
`Math.random()`, so `KE.seed(n)` makes a run reproducible (`core-seams` checks it). Rendering, sound and
purely visual randomness keep `Math.random()`.

## Tests

- `tests/inv/*.js`: each exports a JS **expression string** evaluated in the page that returns an array of
  violation strings; `tests/lib.js` `INV` runs all of them (smoke, ui, scenarios, sim). Core: `core.js`, `core-schema.js`.
- `tests/scenarios/*.js`: `{name, fac, viewport?, mode?, async run(page, L, check)}`; each runs in its own page
  (2D, desktop unless set). `fac: null` starts at the start screen. Invariants are checked after `run`.
- `tests/sim.js`: metrics JSON (alive/wars/player provinces by 20-turn snapshot, ping-pong = owner changes per
  province per 20-turn window, max army stack, army count per faction, endTurn ms, save size, event title
  histogram, ruler changes, Constantinople owner and fall turn, invariants, errors). "World-passive" is
  `--faction=HAF --policy=passive`.
- `tests/balance/*.js`: `module.exports=(metrics,opts)=>[failures]` with `metrics={faction,policy,turns,runs:[…]}`;
  run by `sim.js --assert`. Each module decides which configs it applies to.
- `tests/balance/baseline.json`: pre-W0 metrics (OSM-ai-160 ×5, OSM-ai-60 ×3, HAF-passive-320 ×3, ALB-passive-40 ×5,
  BYZ-ai-120 ×3, TRB-ai-120 ×3). `sim.js --compare` prints the mean shift in baseline standard deviations.
- `tests/fixtures/save-v1.json`: a real v1 save (OSM, turn 12, at war with BYZ and VEN), loaded by `core-migrate`.
- `tests/names.js`: duplicate top-level names across `src/js`.

## Rules for Wave-1 agents

1. Work in your own worktree/branch from `main@w0`. Edit **only files you own**; add new files only with your
   allowed names/prefixes; extend shared behaviour only by registering into the registries and hooks above.
2. Never edit the frozen files (`00a`, `00-geo-data`, `01`, `02`, `06-turn-events.js`, `15-boot.js`, `template.html`,
   `tests/lib.js`, `tests/run-all.sh`) nor another track's files. No renames of existing functions.
3. **SEAM REQUEST**: if you need a change in a frozen or foreign file, work around it with a hook/registry in your own
   files, and list the request in your final report under "SEAM REQUESTS": file, exact change, why, and the workaround
   you used. The orchestrator applies it at merge.
4. Same order slot or same `ACTS` key in two tracks: the owner table decides, the other renames. Registry signatures
   are frozen; do not change the shape of another track's registry entries.
5. Balance constants live in one `BAL_<X>` object at the top of an owned file. The AI plays by the player's rules.
   Player-facing text is Turkish, plain, no formulas ("Kale: savunma +45%").
6. Gates before handing back: `node build.js && node build.js --check`, `node tests/names.js`,
   `KE_TURNS=40 tests/run-all.sh` (all PASS), `node tests/scenario.js` (all, including other tracks'), your own
   `tests/inv/` modules, no `console.error`/pageerror, plus your track's sims (`--assert`, `--compare`).
7. Commit `src/` + rebuilt `index.html` + tests. Merge conflicts in `index.html` are never resolved by hand:
   take either side, run `node build.js`, commit.
8. Merge order: W1 B → C → A → D; W2 B → D → C → A. After each merge: `node build.js && node tests/names.js &&
   KE_TURNS=40 tests/run-all.sh && node tests/scenario.js`.

`window.__ke` keeps `S`, `PD`, `endTurn`, `aiTurn`, `beginGame`, `proj` and adds `W`, `H`, `seed`, `stats`
(`turnMs` = last endTurn compute), `reg` (all registries), `hook`, `runHooks`, `battleOdds`, `migrate`, `save`,
`loadGame`, `armyCreate`, `armyList`, `rulerName`.

## W0 decisions where the plan left a choice

- The `battles` report section (20) and `btlRow` live in `12b` (B, with the offers section); `news` (30) stays in `12` (D).
- Mission assignment moved from `newGame` into a `newGame` hook in `03b` (C), so C changes missions without touching `03`.
- `endRound` economy and the province unrest/`mv` reset are B's `roundEnd` slot 10 (in `03`); opinion drift is D's slot 50 (in `05b`).
- `atkMul`/`atkPower`/`defPower` moved from `03` to `04` (both B); `defBase(i)` is the pre-modifier defence.
- `aiTurn` takes its attack scoring from `aiTargets(f)` (same formula by default), so D can steer B's AI without editing `05`.
- `score` moved from `06` to `03` (B). `ACTS` sit with the code they call (e.g. `missions` in `03b`, `snd` in `10`, `guide`/`help` in `13`).
- `MENU_SECTIONS` entries may have `bind(root)`; `TOP_BUTTONS` entries take `id`, `aria`, `title`, `data` so the existing buttons render unchanged.
- `eliminate` removes the dead faction's armies (`armyRemove(id,'eliminated')`), so no army outlives its faction.
- `tests/ui.js` re-seeds the save only if headless Chromium dropped `localStorage` across its reload (a pre-existing flake after the 3D toggle, ~1 run in 3 on the pre-W0 build too); it logs a note when that happens.
