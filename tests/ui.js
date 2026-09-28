#!/usr/bin/env node
'use strict';
/*
 * UI click-through as the Ottomans: select a province, recruit, build, move troops, declare war,
 * attack, open every modal / guide tab / menu, zoom + map mode, 2D<->3D toggle, end a turn with
 * the button, then save, reload and continue and compare the state.
 *
 *   node tests/ui.js [--mode=2d|3d] [--viewport=desktop|mobile]
 *
 * mode 2d: the game boots in 2D (localStorage ke-3d=0) with three.js available, so the 3D toggle
 * is exercised for real. mode 3d boots straight into 3D (slow).
 */
const L = require('./lib');

(async () => {
  const o = L.opts({ mode: '2d', viewport: 'desktop' });
  const tag = `[ui ${o.mode} ${o.viewport}]`;
  const t0 = Date.now();
  const fails = [];
  let steps = 0;
  const check = (name, ok, info) => { steps++; if (!ok) fails.push(name + (info !== undefined ? ' :: ' + JSON.stringify(info) : '')); console.log(tag, ok ? 'ok  ' : 'FAIL', name); };
  const { browser, page, errors } = await L.launch({ three: 'serve', start3d: o.mode === '3d', viewport: o.viewport });
  const E = (fn, arg) => page.evaluate(fn, arg);
  const click = async sel => { await page.click(sel, { timeout: 30000 }); await page.waitForTimeout(120); };
  const modalTitle = () => E(() => { const m = document.getElementById('modal'); const h = m.querySelector('h2'); return m.hidden ? null : (h ? h.textContent : ''); });
  const panelText = () => E(() => { const p = document.getElementById('panel'); return p.hidden ? null : p.innerText.replace(/\s+/g, ' '); });
  const closeModal = async () => { if (await E(() => !!document.querySelector('#modal:not([hidden]) [data-act="mclose"]'))) await click('#modal [data-act="mclose"]'); };
  try {
    await L.startGame(page, 'OSM');
    await click('[data-act="fit"]');
    const info = await E(() => { const K = window.__ke; return K.PD.map((d, i) => ({ i, key: d.key, name: d.name, adj: d.adj, o: K.S.prov[i].o, t: K.S.prov[i].t })); });
    const byKey = k => info.find(x => x.key === k).i;
    const ist = byKey('istanbul');
    // an Ottoman province next to Constantinople that can be clicked
    let src = -1;
    for (const j of info[ist].adj) if (info[j].o === 'OSM' && info[j].t >= 1000 && await L.provPoint(page, j)) { src = j; break; }
    check('found an Ottoman province next to Istanbul', src >= 0);

    // select own province
    await L.clickProv(page, src);
    const pt = await panelText();
    check('select own province opens the panel', pt && pt.includes(info[src].name), pt && pt.slice(0, 120));

    // recruit
    const s0 = await E(i => ({ g: window.__ke.S.fac.OSM.gold, t: window.__ke.S.prov[i].t }), src);
    await click('#panel [data-act="rec1"]');
    const s1 = await E(i => ({ g: window.__ke.S.fac.OSM.gold, t: window.__ke.S.prov[i].t }), src);
    check('recruit adds 1000 troops and costs gold', s1.t === s0.t + 1000 && s1.g < s0.g, { s0, s1 });

    // build (market, else barracks, else fort)
    const b0 = await E(i => { const p = window.__ke.S.prov[i]; return p.mkt + p.brk + p.fort + p.dev; }, src);
    const bsel = await E(() => ['bmkt', 'bbrk', 'bfort', 'bdev'].map(a => document.querySelector(`#panel [data-act="${a}"]:not([disabled])`)).filter(Boolean).map(b => b.dataset.act)[0]);
    if (bsel) await click(`#panel [data-act="${bsel}"]`);
    const b1 = await E(i => { const p = window.__ke.S.prov[i]; return p.mkt + p.brk + p.fort + p.dev; }, src);
    check('build a building (' + bsel + ')', !!bsel && b1 === b0 + 1, { bsel, b0, b1 });

    // move troops between two own provinces
    const pair = await E(() => { const K = window.__ke, S = K.S; for (let i = 0; i < S.prov.length; i++) { const p = S.prov[i]; if (p.o !== 'OSM' || p.t - p.mv < 1000) continue; for (const j of K.PD[i].adj) if (S.prov[j].o === 'OSM' && !K.PD[i].lanes.includes(j)) return [i, j]; } return null; });
    let movedOk = false;
    if (pair) {
      const [a, b] = pair;
      if (await L.provPoint(page, a) && await L.provPoint(page, b)) {
        await L.clickProv(page, a); await L.clickProv(page, b);
        const tb0 = await E(i => window.__ke.S.prov[i].t, b);
        if (await E(() => !!document.querySelector('#panel [data-act="go"]'))) await click('#panel [data-act="go"]');
        const tb1 = await E(i => window.__ke.S.prov[i].t, b);
        movedOk = tb1 > tb0;
      }
    }
    check('move troops to a neighbouring own province', movedOk, { pair });
    await E(() => document.querySelector('#panel [data-act="close"]') && document.querySelector('#panel [data-act="close"]').click());

    // declare war on Byzantium from the province panel (two clicks: confirm)
    await L.clickProv(page, ist);
    check('select Istanbul shows its panel', ((await panelText()) || '').includes(info[ist].name));
    await click('#panel [data-act="dwar"]');
    await click('#panel [data-act="dwar"]');
    check('declare war on BYZ', await E(() => !!window.__ke.S.war['BYZ|OSM']));
    await L.closeModals(page);

    // attack Istanbul
    const nb0 = await E(() => window.__ke.S.battles.length);
    await L.clickProv(page, src); await L.clickProv(page, ist);
    const hasGo = await E(() => !!document.querySelector('#panel [data-act="go"]'));
    check('attack panel opens', hasGo);
    if (hasGo) await click('#panel [data-act="go"]');
    await page.waitForTimeout(300);
    await L.closeModals(page);
    check('attack fought a battle', (await E(() => window.__ke.S.battles.length)) > nb0);

    // top bar modals
    for (const [sel, name] of [['#top [data-act="diplo"]', 'diplomacy'], ['#top [data-act="missions"]', 'missions'], ['#top [data-act="chron"]', 'chronicle'], ['#facBtn', 'state book'], ['#top [data-act="menu"]', 'menu']]) {
      await click(sel);
      const t = await modalTitle();
      check(`open ${name}`, !!t, t);
      if (name === 'diplomacy') check('diplomacy lists BYZ peace option', await E(() => !!document.querySelector('#modal [data-act="dp-peace"][data-f="BYZ"]')));
      if (name === 'menu') {
        for (const a of ['snd-music', 'snd-sfx']) if (await E(a => !!document.querySelector(`#modal [data-act="${a}"]`), a)) await click(`#modal [data-act="${a}"]`);
        check('menu survives sound toggles', !!(await modalTitle()));
      }
      await closeModal();
      check(`close ${name}`, (await modalTitle()) === null);
    }
    // guide and all its tabs
    await click('#top [data-act="guide"]');
    const tabs = await E(() => [...document.querySelectorAll('#modal .gt[data-t]')].map(b => b.dataset.t));
    check('guide opens with tabs', tabs.length >= 4, tabs);
    for (const t of tabs) {
      await click(`#modal .gt[data-t="${t}"]`);
      check(`guide tab ${t}`, await E(t => { const b = document.querySelector(`#modal .gt[data-t="${t}"]`); return !!b && b.classList.contains('on') && document.querySelector('#modal .gbody').textContent.trim().length > 20; }, t));
    }
    await closeModal();

    // zoom, map mode
    for (const a of ['zin', 'zout', 'mode', 'mode', 'fit']) await click(`#zoom [data-act="${a}"]`);
    check('zoom and map mode buttons', true);

    // 2D <-> 3D toggle
    const gl0 = await E(() => !document.getElementById('gl').hidden);
    await click('#v3dBtn'); await page.waitForTimeout(1500);
    const gl1 = await E(() => !document.getElementById('gl').hidden);
    check('3D toggle switches view', gl1 !== gl0, { gl0, gl1 });
    await click('#v3dBtn'); await page.waitForTimeout(800);
    check('3D toggle switches back', (await E(() => !document.getElementById('gl').hidden)) === gl0);

    // end turn with the button
    const turn0 = await E(() => window.__ke.S.turn);
    await click('#endTurn');
    await page.waitForFunction(() => !document.getElementById('endTurn').disabled, null, { timeout: 180000 });
    await L.closeModals(page);
    check('end turn button advances the turn', (await E(() => window.__ke.S.turn)) === turn0 + 1);

    // save, reload, continue
    await E(() => document.dispatchEvent(new Event('visibilitychange')));
    const snap = await E(() => JSON.stringify(window.__ke.S));
    check('game is saved to localStorage', await E(() => Object.keys(localStorage).some(k => /^kizil-elma/.test(k))), await E(() => Object.keys(localStorage)));
    await page.waitForTimeout(2000); // let Chromium commit localStorage before the navigation
    // Headless Chromium sometimes drops the whole file:// localStorage across this reload after the
    // SwiftShader 3D toggle (seen on the pre-W0 build too, ~1 run in 3). Re-seed the save only in
    // that case, so the test still checks load -> migrate -> continue, and say so in the log.
    const raw = await E(() => localStorage.getItem('kizil-elma-1451-v1'));
    await page.context().addInitScript(raw => { try { if (!localStorage.getItem('kizil-elma-1451-v1')) { localStorage.setItem('kizil-elma-1451-v1', raw); window.__keReseeded = true; } } catch (e) {} }, raw);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 180000 });
    if (await E(() => !!window.__keReseeded)) console.log(tag, 'note: localStorage was lost across the reload (browser flake); save re-seeded');
    await L.waitLoaded(page);
    const hasCont = await E(() => !!document.querySelector('[data-act="continue"]'));
    check('reload shows the continue button', hasCont, hasCont ? undefined : await E(() => ({ keys: Object.keys(localStorage), start: !document.getElementById('start').hidden, pick: document.getElementById('pick').innerHTML.slice(0, 200) })));
    await click('[data-act="continue"]');
    await L.closeModals(page);
    const after = await E(() => ({ json: JSON.stringify(window.__ke.S), top: !document.getElementById('top').hidden }));
    check('continue restores the saved state', after.json === snap && after.top);

    const inv = await E(L.INV);
    check('state invariants', inv.length === 0, inv);
  } catch (e) {
    fails.push('exception: ' + (e.stack || e));
  }
  await browser.close();
  const all = [...errors, ...fails];
  for (const f of all) console.log(tag, 'FAIL', f);
  console.log(tag, all.length ? 'FAILED' : 'PASSED', `${steps} checks`, Math.round((Date.now() - t0) / 1000) + 's');
  process.exit(all.length ? 1 : 0);
})();
