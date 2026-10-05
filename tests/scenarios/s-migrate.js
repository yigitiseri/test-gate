'use strict';
// Save slots (W3-S) and old saves: an autosave written before slots existed (a Wave 1 era game) still shows as
// Continue and in the load list; slots holding a v1 save (tests/fixtures/save-v1.json) and a W1-era save as plain
// JSON with no slot index (the index is rebuilt) load and migrate to schema v2 without touching the slot itself;
// the v1 file also imports through the file picker.
const fs = require('fs');
const path = require('path');
const SAVE = 'kizil-elma-1451-v1';
module.exports = {
  name: 's-migrate',
  fac: 'HUN',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const v1raw = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'save-v1.json'), 'utf8').trim();
    const v1 = JSON.parse(v1raw);
    await L.endTurn(page); await L.closeModals(page);
    // a Wave 1 era save (as in b-w1save): no occupations, envoys without a date, a stale siege, an army marked besieging
    const w1raw = await E(() => { const S = JSON.parse(JSON.stringify(window.__ke.S));
      S.prov.forEach(p => { delete p.ctl; }); for (const k in S.war) S.war[k].ex = {};
      const a = S.armies.find(x => x.f === 'HUN'); if (a) a.st = 'siege';
      S.sieges = { 3: { i: 3, f: 'HUN', a: 999999, t0: 0, prog: 1, need: 3, sally: 0 } };
      S.offers = [{ f: 'OSM', type: 'peace', wt: 0 }]; if (S.b) delete S.b.pc;
      return JSON.stringify(S); });
    await page.context().addInitScript(([k, w1, v1]) => { try { if (!sessionStorage.getItem('ke-seeded-s')) {
      localStorage.setItem(k, w1); localStorage.setItem(k + '-slot-1', v1); localStorage.setItem(k + '-slot-2', w1);
      localStorage.removeItem(k + '-slots'); localStorage.removeItem(k + '-backup'); sessionStorage.setItem('ke-seeded-s', '1'); } } catch (e) {} }, [SAVE, w1raw, v1raw]);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 180000 });
    await L.waitLoaded(page);
    const st = await E(() => ({ cont: (document.querySelector('#pick [data-act="continue"] small') || {}).textContent || '', ld: (document.querySelector('#pick [data-act="sv-open"]') || {}).textContent || '' }));
    check('old autosave shows as Continue with realm and date', /Macar/.test(st.cont) && /1451/.test(st.cont), st);
    check('Load game counts the two slots', /2 kayıt/.test(st.ld), st);
    await page.click('#pick [data-act="sv-open"]');
    await page.waitForSelector('#modal .sv');
    const rows = await E(() => [...document.querySelectorAll('#modal .sv-row')].map(r => r.querySelector('.sv-tx').innerText.replace(/\s+/g, ' ')));
    check('load list: autosave + both slots (index rebuilt)', rows.length === 3 && /Otomatik/.test(rows[0]) && /Kayıt 1/.test(rows[1]) && /Osmanlı/.test(rows[1]) && /Macar/.test(rows[2]), rows);
    check('autosave untouched by opening the list', await E(([k, r]) => localStorage.getItem(k) === r, [SAVE, w1raw]));
    // v1 save in slot 1
    await page.click('#modal [data-act="sv-load"][data-n="1"]');
    await page.waitForFunction(() => window.__ke.S && window.__ke.S.player === 'OSM' && document.getElementById('start').hidden);
    await L.closeModals(page);
    const a = await E(() => { const S = window.__ke.S; return { v: S.v, turn: S.turn, ai: Object.keys(S.ai).length, fac: Object.keys(S.fac).length, ex: Object.values(S.war).every(w => w.ex && 'goal' in w) }; });
    check('v1 slot loaded and migrated to v2', a.v === 2 && a.turn === v1.turn && a.ai === a.fac && a.ex, a);
    check('the slot itself is left as it was', await E(([k, r]) => localStorage.getItem(k + '-slot-1') === r, [SAVE, v1raw]));
    check('migrate idempotent after a slot load', await E(() => { const K = window.__ke, x = JSON.stringify(K.S); return x === JSON.stringify(K.migrate(JSON.parse(x))); }));
    for (let t = 0; t < 2; t++) { await L.endTurn(page); await L.closeModals(page); }
    check('v1 game plays on', (await E(() => window.__ke.S.turn)) === v1.turn + 2);
    let inv = await E(L.INV); check('invariants (v1 slot)', !inv.length, inv.slice(0, 5));
    // W1-era save in slot 2, loaded in game (two taps)
    await page.click('#top [data-act="menu"]'); await page.click('#modal [data-act="sv-open"][data-m="load"]');
    await page.click('#modal [data-act="sv-load"][data-n="2"]'); await page.click('#modal [data-act="sv-load"][data-n="2"]');
    await page.waitForFunction(() => window.__ke.S.player === 'HUN');
    await L.closeModals(page);
    const b = await E(() => { const S = window.__ke.S; return { v: S.v, turn: S.turn, sieges: Object.keys(S.sieges).length, besieging: S.armies.filter(a => a.st === 'siege').length, t0: S.offers.every(o => o.t0 != null) }; });
    check('W1-era slot loaded: stale siege dropped, envoys dated', b.v === 2 && b.turn === 1 && b.sieges === 0 && b.besieging === 0 && b.t0, b);
    await L.endTurn(page); await L.closeModals(page);
    inv = await E(L.INV); check('invariants (W1 slot)', !inv.length, inv.slice(0, 5));
    // the v1 fixture as a file
    await page.click('#top [data-act="menu"]'); await page.click('#modal [data-act="sv-open"][data-m="load"]');
    await page.setInputFiles('#svFile', { name: 'save-v1.json', mimeType: 'application/json', buffer: Buffer.from(v1raw) });
    await page.waitForFunction(() => window.__ke.S.player === 'OSM');
    await L.closeModals(page);
    check('v1 file imports, migrates and becomes the autosave', await E(([k, t]) => { const S = window.__ke.S, A = JSON.parse(localStorage.getItem(k)); return S.v === 2 && S.turn === t && A.player === 'OSM' && A.v === 2; }, [SAVE, v1.turn]));
  },
};
