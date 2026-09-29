#!/usr/bin/env node
'use strict';
/*
 * Track A performance gates (G11 and render-on-demand), counted in frames, not fps (SwiftShader is slow):
 *  - 3D: after 3 s idle (plus the 3 s "hot" water period) the view renders <= 2 frames/s (KE.stats.frames = G3.render calls)
 *  - 3D: an interaction (pan) renders again, then idles down
 *  - 2D: idle means no rAF redraw storm (KE.stats.draws)
 *  - boot default: first launch on a phone viewport or software GL starts in 2D; a saved choice wins
 *   node tests/perf.js
 */
const L = require('./lib');

(async () => {
  const t0 = Date.now(), fails = [];
  const check = (n, ok, info) => { if (!ok) fails.push(n + (info !== undefined ? ' :: ' + JSON.stringify(info) : '')); console.log('[perf]', ok ? 'ok  ' : 'FAIL', n, info !== undefined ? JSON.stringify(info) : ''); };
  let errors = [];
  // --- 3D idle ---
  {
    const r = await L.launch({ three: 'serve', start3d: true, viewport: 'desktop' }); errors.push(...r.errors);
    const { page, browser } = r;
    await L.startGame(page, 'OSM');
    check('3D is on', await page.evaluate(() => !document.getElementById('gl').hidden));
    await page.waitForTimeout(7000); // hot period (3 s) + slack for slow software frames
    const f0 = await page.evaluate(() => window.__ke.stats.frames);
    await page.waitForTimeout(3000);
    const f1 = await page.evaluate(() => window.__ke.stats.frames);
    check('3D idle renders <= 2 frames/s', (f1 - f0) / 3 <= 2, { frames: f1 - f0, seconds: 3 });
    await page.mouse.move(700, 450); await page.mouse.down(); await page.mouse.move(760, 480, { steps: 4 }); await page.mouse.up();
    await page.waitForTimeout(2500);
    const f2 = await page.evaluate(() => window.__ke.stats.frames);
    check('3D renders after an interaction', f2 > f1, { before: f1, after: f2 });
    await page.waitForTimeout(7000);
    const f3 = await page.evaluate(() => window.__ke.stats.frames); await page.waitForTimeout(3000);
    const f4 = await page.evaluate(() => window.__ke.stats.frames);
    check('3D idles down again after the interaction', (f4 - f3) / 3 <= 2, { frames: f4 - f3 });
    await browser.close();
  }
  // --- 2D idle ---
  {
    const r = await L.launch({ three: '404', viewport: 'desktop' }); errors.push(...r.errors);
    const { page, browser } = r;
    await L.startGame(page, 'OSM');
    await page.waitForTimeout(1500);
    const d0 = await page.evaluate(() => window.__ke.stats.draws); await page.waitForTimeout(3000);
    const d1 = await page.evaluate(() => window.__ke.stats.draws);
    check('2D idle: no rAF storm (<= 1 redraw in 3 s)', d1 - d0 <= 1, d1 - d0);
    const rafs = await page.evaluate(() => new Promise(res => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); }));
    check('page stays responsive (rAF runs)', rafs > 5, rafs);
    await browser.close();
  }
  // --- boot default (no saved choice) ---
  for (const [vp, want] of [['mobile', false], ['desktop', false]]) {
    const r = await L.launch({ three: 'serve', start3d: null, viewport: vp }); errors.push(...r.errors);
    const on = await r.page.evaluate(() => !document.getElementById('gl').hidden);
    check(`first launch ${vp} (SwiftShader) starts in ${want ? '3D' : '2D'}`, on === want, on);
    await r.browser.close();
  }
  {
    const r = await L.launch({ three: 'serve', start3d: true, viewport: 'mobile' }); errors.push(...r.errors);
    check('a saved 3D choice wins on a phone', await r.page.evaluate(() => !document.getElementById('gl').hidden));
    await r.browser.close();
  }
  const all = [...errors, ...fails];
  for (const f of errors) console.log('[perf] FAIL', f);
  console.log('[perf]', all.length ? 'FAILED' : 'PASSED', Math.round((Date.now() - t0) / 1000) + 's');
  process.exit(all.length ? 1 : 0);
})();
