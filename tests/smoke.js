#!/usr/bin/env node
'use strict';
/*
 * Smoke test: start a game through the UI, play N turns with window.__ke.endTurn(),
 * check state invariants after every turn, fail on any page error.
 *
 *   node tests/smoke.js [--faction=OSM] [--turns=150] [--mode=2d|3d] [--viewport=desktop|mobile] [--passive]
 *   (or env KE_FACTION, KE_TURNS, KE_MODE, KE_VIEWPORT)
 *
 * mode 2d: three.js is 404'd, so the game runs its no-WebGL 2D fallback (fast).
 * mode 3d: three.js is served from tests/vendor and SwiftShader renders it (slow, ~1-2 fps).
 * By default the player's own faction is also driven by the AI (aiTurn) so wars and captures
 * happen on every side; --passive leaves the player idle.
 */
const L = require('./lib');

(async () => {
  const o = L.opts({ faction: 'OSM', turns: 150, mode: '2d', viewport: 'desktop', passive: false });
  const tag = `[smoke ${o.faction} ${o.mode} ${o.viewport} x${o.turns}]`;
  const t0 = Date.now();
  const fails = [];
  const { browser, page, errors } = await L.launch({ three: o.mode === '3d' ? 'serve' : '404', start3d: o.mode === '3d', viewport: o.viewport });
  try {
    await L.startGame(page, o.faction);
    const pl = await page.evaluate(() => window.__ke.S.player);
    if (pl !== o.faction) fails.push('player is ' + pl + ', expected ' + o.faction);
    if (o.mode === '3d') {
      const gl = await page.evaluate(() => !document.getElementById('gl').hidden);
      if (!gl) fails.push('3D mode requested but the WebGL canvas is hidden');
    }
    const seen = new Map();
    let t = 0;
    for (; t < o.turns; t++) {
      const stuck = await L.closeModals(page);
      if (stuck) { fails.push(`turn ${t}: ${stuck}`); break; }
      if (await page.evaluate(() => !!window.__ke.S.over)) break;
      if (!o.passive) await page.evaluate(() => { const K = window.__ke; K.aiTurn(K.S.player); });
      await L.endTurn(page);
      for (const v of await page.evaluate(L.INV)) {
        const k = v.replace(/\d+/g, '#');
        if (!seen.has(k)) { seen.set(k, 1); fails.push(`turn ${t + 1}: ${v}`); } else seen.set(k, seen.get(k) + 1);
      }
      if (errors.length) break;
      if ((t + 1) % 50 === 0) console.log(tag, JSON.stringify(await L.summary(page)), Math.round((Date.now() - t0) / 1000) + 's');
    }
    await L.closeModals(page);
    const s = await L.summary(page);
    console.log(tag, 'final', JSON.stringify(s), 'turns played', t);
    if (s.turn < Math.min(o.turns, 1) && !s.over) fails.push('no turn was played');
  } catch (e) {
    fails.push('exception: ' + (e.stack || e));
  }
  await browser.close();
  const all = [...errors, ...fails];
  for (const f of all) console.log(tag, 'FAIL', f);
  console.log(tag, all.length ? 'FAILED' : 'PASSED', Math.round((Date.now() - t0) / 1000) + 's');
  process.exit(all.length ? 1 : 0);
})();
