# Contributing

The game ships as one file, `index.html`, but it is **built** from the sources in `src/`.

## Rules

1. Edit files in `src/` only. **Never hand-edit `index.html`**: it is generated and will be overwritten.
2. Rebuild: `node build.js` (plain Node, no dependencies). `node build.js --check` fails if `index.html` is stale or was hand-edited.
3. Test: `tests/run-all.sh` (about 13 min; build, `node --check`, 2D smoke 3 factions x 150 turns + mobile, UI click-through, 3D smoke).
   Quicker pass: `KE_TURNS=40 tests/run-all.sh`. Single runs:
   `node tests/smoke.js --faction=HUN --turns=80 --mode=2d|3d --viewport=desktop|mobile`, `node tests/ui.js --mode=2d`.
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
- There are no imports/exports; a name defined in any file is visible in every other file. Avoid new
  top-level names that could collide; prefix them if in doubt.
- Every source file must end with a newline.
- New file? Give it a number that places it at the right point in the order (e.g. `06b-...` or renumber).

## Who owns what

| File | Contents |
|---|---|
| `src/template.html` | `<head>` (PWA meta, ARTIFACT marker, fonts), HTML body (top bar, panel, zoom, modal, start screen), three.js tag, IIFE wrapper |
| `src/css/00-base.css` | colour tokens, reset, map canvases, tile band |
| `src/css/01-ui-panels.css` | top bar, shields, side panel, modal, toasts, tooltip, zoom, start screen, loading |
| `src/css/02-responsive.css` | `@media` breakpoints for the UI above, reduced motion |
| `src/css/03-historical-theme.css` | parchment / leather historical theme overriding the base look |
| `src/css/04-guide.css` | game guide (rehber) modal |
| `src/js/00-geo-data.js` | projection (`P`, `W`, `H`), seas, islands, rivers, mountains, region labels |
| `src/js/01-factions-provinces.js` | `FAC`, `PROVS`, `LANES`, `PD`/`PK`/`FK`, heraldry (`ARMS`, `armsSVG`), hijri/roman helpers |
| `src/js/02-mapbuild.js` | noise, `buildMap` (province raster), `renderBase` (terrain), rhumb lines, galleys, cartouche, frame, compass |
| `src/js/03-state.js` | constants, `S`, relation helpers, `HIST`, `MIS` missions, economy (`income`, `upkeep`, `strength`...), `newGame`, log/news |
| `src/js/04-war-diplomacy.js` | `declareWar`, `makePeace`, offers, AI acceptance rules, `battle`, `capture`, `eliminate` |
| `src/js/05-ai.js` | `aiTurn`, `aiEconomy`, `aiDiplo` |
| `src/js/06-turn-events.js` | `endRound`, `historic` events, Safavids, mission checks, `score`, `endTurn`, `randomEvent` |
| `src/js/07-render2d.js` | camera, `renderPol`, labels, highlight, `draw`, cities, banners, battle fx |
| `src/js/08-render3d.js` | `G3` three.js view, `curS`, `pj`, `panBy` |
| `src/js/09-input.js` | pointer/touch/wheel input, picking, hover tooltip, `mapClick` |
| `src/js/10-sound.js` | `SND` synthesized Web Audio music and effects |
| `src/js/11-ui-core.js` | top bar, province panel, `act()` click dispatcher, global listeners, `renderAll` |
| `src/js/12-modals.js` | modal queue, event modal, turn report, diplomacy, missions, chronicle, state book |
| `src/js/13-guide.js` | guide text (`GUIDE_TABS`, `guideBody`, `showGuide`) |
| `src/js/14-menus-start-save.js` | help, menu, end screen, start screen, `beginGame`, save/load |
| `src/js/15-boot.js` | `boot()`, service worker registration, `window.__ke` debug hook |

`window.__ke` (`S`, `PD`, `endTurn`, `aiTurn`, `beginGame`, `proj`) is used by the tests; keep it working.
