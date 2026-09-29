'use strict';
// Track B save conversion: the real v1 fixture (OSM, turn 12) loads; every garrison is clamped to its maximum,
// the excess becomes field armies (<= armyCap per faction, ready to march), troops are conserved, the
// conversion runs once (S.b.arm) and is idempotent, and the game keeps playing.
const fs = require('fs');
const path = require('path');
const SAVE = 'kizil-elma-1451-v1';

module.exports = {
  name: 'b-migrate',
  fac: null,
  async run(page, L, check) {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'save-v1.json'), 'utf8').trim();
    const v1 = JSON.parse(raw), before = {};
    v1.prov.forEach(p => before[p.o] = (before[p.o] || 0) + p.t);
    await page.context().addInitScript(([k, raw]) => { try { if (!sessionStorage.getItem('ke-seeded-b')) { localStorage.setItem(k, raw); sessionStorage.setItem('ke-seeded-b', '1'); } } catch (e) {} }, [SAVE, raw]);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 180000 });
    await L.waitLoaded(page);
    await page.click('[data-act="continue"]');
    await page.waitForTimeout(200);
    await L.closeModals(page);
    const st = await page.evaluate(() => { const K = window.__ke, S = K.S, after = {}, cnt = {}, over = [];
      S.prov.forEach((p, i) => { after[p.o] = (after[p.o] || 0) + p.t; if (p.t > K.garrisonMax(i)) over.push(i); });
      S.armies.forEach(a => { after[a.f] = (after[a.f] || 0) + a.n; cnt[a.f] = (cnt[a.f] || 0) + 1; });
      return { turn: S.turn, b: S.b, after, cnt, over, capOk: Object.keys(cnt).every(f => cnt[f] <= K.armyCap(f)), ready: S.armies.every(a => a.mp === a.mpMax), osm: S.armies.filter(a => a.f === 'OSM').map(a => a.n) }; });
    check('v1 game loaded', st.turn === v1.turn, st.turn);
    check('conversion flagged once (S.b.arm)', st.b && st.b.arm === 1, st.b);
    check('no garrison above its maximum', st.over.length === 0, st.over.slice(0, 5));
    check('the Ottomans got field armies', st.osm.length >= 1 && st.osm.every(n => n >= 100), st.osm);
    check('army count within armyCap for every faction', st.capOk, st.cnt);
    check('converted armies are ready to march', st.ready);
    const lost = Object.keys(before).filter(f => st.after[f] !== before[f]);
    check('troops conserved per faction (garrisons + armies)', lost.length === 0, lost.map(f => [f, before[f], st.after[f]]));
    const idem = await page.evaluate(() => { const K = window.__ke, a = JSON.stringify(K.S); return a === JSON.stringify(K.migrate(JSON.parse(a))); });
    check('migrate is idempotent after the conversion', idem);
    for (let t = 0; t < 3; t++) { await page.evaluate(() => { const K = window.__ke; K.aiTurn(K.S.player); }); await L.endTurn(page); await L.closeModals(page); }
    check('played 3 turns after the conversion', (await page.evaluate(() => window.__ke.S.turn)) === v1.turn + 3);
  },
};
