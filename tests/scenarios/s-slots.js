'use strict';
// Save slots (W3-S): save to a slot from the menu, overwrite (two taps), rename, load (two taps in-game), delete,
// export a slot as a file and import it back through the file picker, a damaged file, storage full (slot and
// autosave), then a reload: the start screen shows Continue (autosave) and Load game, and a slot loads from there.
const fs = require('fs');
const SAVE = 'kizil-elma-1451-v1';
module.exports = {
  name: 's-slots',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const turn = () => E(() => window.__ke.S.turn);
    const next = async () => { await E(() => { const K = window.__ke; K.aiTurn(K.S.player); }); await L.endTurn(page); await L.closeModals(page); };
    const openSaves = async m => { await page.click('#top [data-act="menu"]'); await page.click(`#modal [data-act="sv-open"][data-m="${m}"]`); await page.waitForSelector('#modal .sv'); };
    const slots = () => E(() => window.__ke.sv.slots().filter(x => !x.empty).map(x => ({ n: x.n, nm: x.nm, f: x.f, turn: x.turn, th: (x.th || '').slice(0, 22), at: x.at })));
    await next();
    const t1 = await turn();
    // --- save to slot 1 through the menu
    await openSaves('save');
    check('Saves modal lists 8 empty slots', (await E(() => document.querySelectorAll('#modal .sv-row.empty [data-act="sv-save"]').length)) === 8);
    await page.click('#modal [data-act="sv-save"][data-n="1"]');
    let s = await slots();
    check('slot 1 saved with realm, turn, time and thumbnail', s.length === 1 && s[0].f === 'OSM' && s[0].turn === t1 && s[0].th === 'data:image/png;base64,' && s[0].at > 0, s);
    check('slot is stored packed and unpacks to the game', await E(k => { const K = window.__ke, z = localStorage.getItem(k); return z.startsWith('Z1:') && JSON.parse(K.sv.unpack(z)).turn === K.S.turn; }, SAVE + '-slot-1'));
    check('row shows the save name and a confirmation', await E(() => /Osmanlı/.test(document.querySelector('#modal .sv-row[data-n="1"] .sv-tx b').textContent) && !!document.querySelector('#modal .sv-msg')));
    await page.click('#modal [data-act="mclose"]');
    // --- next turn, slot 2, overwrite slot 1 needs two taps
    await next(); await next();
    const t2 = await turn();
    await openSaves('save');
    await page.click('#modal [data-act="sv-save"][data-n="2"]');
    await page.click('#modal [data-act="sv-save"][data-n="1"]');
    s = await slots();
    check('overwrite asks first (slot 1 unchanged after one tap)', s.find(x => x.n === 1).turn === t1 && /Emin misin/.test(await E(() => document.querySelector('#modal [data-act="sv-save"][data-n="1"]').textContent)), s);
    await page.click('#modal [data-act="mclose"]');
    // --- rename slot 1 (Enter in the field)
    await openSaves('load');
    await page.click('#modal [data-act="sv-ren"][data-n="1"]');
    await page.fill('#svName', 'Kuşatmadan önce');
    await page.press('#svName', 'Enter');
    s = await slots();
    check('rename stored', s.find(x => x.n === 1).nm === 'Kuşatmadan önce', s);
    check('renamed row shown', await E(() => document.querySelector('#modal .sv-row[data-n="1"] .sv-tx b').textContent === 'Kuşatmadan önce'));
    // --- export slot 1 as a file
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#modal [data-act="sv-exp"][data-n="1"]')]);
    const file = await dl.path();
    const txt = fs.readFileSync(file, 'utf8');
    let ex = null; try { ex = JSON.parse(txt); } catch (e) {}
    check('export is a named save file', !!ex && ex.kind === 'save' && ex.name === 'Kuşatmadan önce' && ex.state.turn === t1 && /^age-of-dynasties-osm-\d{4}-t\d+\.json$/.test(dl.suggestedFilename()), { fn: dl.suggestedFilename(), name: ex && ex.name });
    // --- load slot 1 in game: two taps
    await page.click('#modal [data-act="sv-load"][data-n="1"]');
    check('in-game load asks first', (await turn()) === t2 && /Emin misin/.test(await E(() => document.querySelector('#modal [data-act="sv-load"][data-n="1"]').textContent)));
    await page.click('#modal [data-act="sv-load"][data-n="1"]');
    await page.waitForFunction(t => window.__ke.S.turn === t, t1);
    await L.closeModals(page);
    check('slot 1 loaded, autosave now holds it', await E(([k, t]) => window.__ke.S.turn === t && JSON.parse(localStorage.getItem(k)).turn === t && !document.getElementById('top').hidden, [SAVE, t1]));
    let inv = await E(L.INV); check('invariants after loading a slot', !inv.length, inv.slice(0, 5));
    await next();
    check('game goes on after loading', (await turn()) === t1 + 1);
    // --- delete slot 2: two taps
    await openSaves('load');
    await page.click('#modal [data-act="sv-del"][data-n="2"]');
    check('delete asks first', (await slots()).length === 2);
    await page.click('#modal [data-act="sv-del"][data-n="2"]');
    check('slot 2 deleted (data and index)', (await slots()).length === 1 && await E(k => localStorage.getItem(k) === null, SAVE + '-slot-2'));
    // --- import: a damaged file is refused, the exported file loads
    await page.setInputFiles('#svFile', { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
    await page.waitForSelector('#modal .sv-msg.war');
    check('damaged file refused with a message, game unchanged', (await turn()) === t1 + 1);
    await page.setInputFiles('#svFile', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from(txt) });
    await page.waitForFunction(t => window.__ke.S.turn === t, t1);
    await L.closeModals(page);
    check('exported file imported and loaded', await E(t => window.__ke.S.turn === t && window.__ke.S.player === 'OSM', t1));
    // --- storage full: a slot save reports it and leaves nothing half-written; autosave warns once
    await openSaves('save');
    await E(() => { const o = Storage.prototype.setItem; window.__svSet = o; Storage.prototype.setItem = function (k, v) { if (/-slot/.test(k) || /-v1$/.test(k)) throw new DOMException('full', 'QuotaExceededError'); return o.call(this, k, v); }; });
    await page.click('#modal [data-act="sv-save"][data-n="3"]');
    const full = await E(() => ({ msg: (document.querySelector('#modal .sv-msg.war') || {}).textContent || '', raw: localStorage.getItem('kizil-elma-1451-v1-slot-3') }));
    check('storage full: clear message, slot not written', /dolu/.test(full.msg) && full.raw === null, full);
    await page.click('#modal [data-act="mclose"]');
    await E(() => { window.__ke.save(); window.__ke.save(); window.__ke.save(); });
    const toasts1 = await E(() => [...document.querySelectorAll('#toasts .toast.war')].map(t => t.textContent).filter(t => /Otomatik kayıt/.test(t)));
    check('autosave failure warns once', toasts1.length === 1, toasts1);
    await E(() => { Storage.prototype.setItem = window.__svSet; window.__ke.save(); });
    // --- reload: start screen offers Continue (with realm and date) and Load game
    await next();
    const tNow = await turn();
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 180000 });
    await L.waitLoaded(page);
    const st = await E(() => ({ cont: (document.querySelector('#pick [data-act="continue"]') || {}).textContent || '', ld: (document.querySelector('#pick [data-act="sv-open"]') || {}).textContent || '' }));
    check('start screen: Continue shows realm and date, Load game counts saves', /Osmanlı/.test(st.cont) && /1 kayıt/.test(st.ld), st);
    await page.click('#pick [data-act="sv-open"]');
    await page.waitForSelector('#modal .sv');
    check('load list on the start screen has the autosave and slot 1, no tabs', await E(() => !!document.querySelector('#modal .sv-row.auto [data-act="continue"]') && !!document.querySelector('#modal [data-act="sv-load"][data-n="1"]') && !document.querySelector('#modal .sv-tabs')));
    await page.click('#modal [data-act="sv-load"][data-n="1"]');
    await page.waitForFunction(() => window.__ke.S && window.__ke.S.player === 'OSM' && document.getElementById('start').hidden);
    await L.closeModals(page);
    check('slot loads from the start screen with one tap', (await turn()) === t1 && tNow !== t1);
    inv = await E(L.INV); check('invariants after start-screen load', !inv.length, inv.slice(0, 5));
  },
};
