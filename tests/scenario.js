#!/usr/bin/env node
'use strict';
/*
 * Scenario runner: runs every tests/scenarios/*.js (or those whose file name contains one of the
 * given substrings), each in its own fresh browser page.
 *
 *   node tests/scenario.js [name-substring ...]
 *
 * A scenario module exports:
 *   { name, fac, viewport?, mode?, async run(page, L, check) }
 *     fac       faction to start through the start screen before run(), or null to start at the
 *               start screen (e.g. to load a save)
 *     viewport  'desktop' (default) | 'mobile'
 *     mode      '2d' (default: three.js 404'd, fast) | '3d'
 *     run       drive the page; call check(label, ok, info?) for every assertion. L is tests/lib.js.
 * After run(), the state invariants (tests/lib.js INV) are checked if a game is running, and any
 * page error or console error fails the scenario.
 */
const fs = require('fs');
const path = require('path');
const L = require('./lib');

(async () => {
  const filt = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const dir = path.join(__dirname, 'scenarios');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && (!filt.length || filt.some(x => f.includes(x)))).sort();
  const t0 = Date.now();
  let failed = 0;
  const summary = [];
  for (const f of files) {
    const sc = require(path.join(dir, f));
    const tag = `[scenario ${sc.name || f}]`;
    const t1 = Date.now();
    const fails = [];
    let n = 0;
    const check = (name, ok, info) => { n++; if (!ok) fails.push(name + (info !== undefined ? ' :: ' + JSON.stringify(info) : '')); console.log(tag, ok ? 'ok  ' : 'FAIL', name); };
    let browser, page, errors = [];
    try {
      ({ browser, page, errors } = await L.launch({ three: sc.mode === '3d' ? 'serve' : '404', start3d: sc.mode === '3d', viewport: sc.viewport || 'desktop' }));
      if (sc.fac) await L.startGame(page, sc.fac);
      await sc.run(page, L, check);
      if (await page.evaluate(() => !!(window.__ke.S && window.__ke.S.player))) {
        const inv = await page.evaluate(L.INV);
        check('state invariants', inv.length === 0, inv.slice(0, 10));
      }
    } catch (e) {
      fails.push('exception: ' + (e.stack || e));
    }
    if (browser) await browser.close();
    const all = [...errors, ...fails];
    for (const x of all) console.log(tag, 'FAIL', x);
    const line = `${all.length ? 'FAIL' : 'PASS'}  ${sc.name || f} (${n} checks, ${Math.round((Date.now() - t1) / 1000)}s)`;
    console.log(tag, all.length ? 'FAILED' : 'PASSED');
    summary.push(line);
    if (all.length) failed++;
  }
  console.log('\n[scenario] summary');
  for (const s of summary) console.log('[scenario]', s);
  console.log('[scenario]', failed ? `FAILED ${failed}/${files.length}` : `PASSED ${files.length} scenarios`, Math.round((Date.now() - t0) / 1000) + 's');
  process.exit(failed || !files.length ? 1 : 0);
})();
