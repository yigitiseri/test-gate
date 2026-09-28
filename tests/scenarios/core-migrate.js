'use strict';
// A real v1 save (captured from the pre-W0 build: OSM, turn 12, at war with BYZ and VEN) loads through
// "Kayıtlı oyuna dön", is backed up once, migrates to schema v2 idempotently and keeps playing.
const fs = require('fs');
const path = require('path');
const SAVE = 'kizil-elma-1451-v1', BACKUP = SAVE + '-backup';

module.exports = {
  name: 'core-migrate',
  fac: null,
  async run(page, L, check) {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'save-v1.json'), 'utf8').trim();
    const v1 = JSON.parse(raw);
    check('fixture is a v1 save', v1.v === 1 && v1.turn >= 10 && Object.keys(v1.war).some(k => k.includes(v1.player)), { v: v1.v, turn: v1.turn });
    // seed the save before boot (once per tab), then reload into the start screen
    await page.context().addInitScript(([k, b, raw]) => { try { if (!sessionStorage.getItem('ke-seeded')) { localStorage.setItem(k, raw); localStorage.removeItem(b); sessionStorage.setItem('ke-seeded', '1'); } } catch (e) {} }, [SAVE, BACKUP, raw]);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 180000 });
    await L.waitLoaded(page);
    check('start screen offers "continue"', await page.evaluate(() => !!document.querySelector('[data-act="continue"]')));
    await page.click('[data-act="continue"]');
    await page.waitForTimeout(200);
    await L.closeModals(page);
    const st = await page.evaluate(() => { const S = window.__ke.S; return { v: S.v, turn: S.turn, player: S.player, top: !document.getElementById('top').hidden, wars: Object.keys(S.war), ex: Object.values(S.war).every(w => w.ex && 'goal' in w), armies: Array.isArray(S.armies), ai: Object.keys(S.ai).length, fac: Object.keys(S.fac).length }; });
    check('loaded the v1 game', st.player === v1.player && st.turn === v1.turn && st.top, st);
    check('migrated to schema v2', st.v === 2 && st.armies && st.ex && st.ai === st.fac, st);
    const bk = await page.evaluate(b => localStorage.getItem(b), BACKUP);
    check('v1 save backed up before migration', bk === raw, bk && bk.slice(0, 60));
    const saved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)).v, SAVE);
    check('save key rewritten as v2', saved === 2, saved);
    const idem = await page.evaluate(() => { const K = window.__ke, a = JSON.stringify(K.S); const b = JSON.stringify(K.migrate(JSON.parse(a))); return a === b; });
    check('migrate() is idempotent on the migrated state', idem);
    const fresh = await page.evaluate(() => { const K = window.__ke; const s = JSON.parse(JSON.stringify(K.S)); const a = JSON.stringify(K.migrate(JSON.parse(JSON.stringify(s)))); return a === JSON.stringify(K.migrate(JSON.parse(a))); });
    check('migrate() twice gives the same JSON', fresh);
    // loading again (now a v2 save) must not overwrite the v1 backup
    await page.evaluate(() => window.__ke.loadGame());
    await L.closeModals(page);
    check('backup kept after a second load', (await page.evaluate(b => localStorage.getItem(b), BACKUP)) === raw);
    for (let t = 0; t < 4; t++) {
      await page.evaluate(() => { const K = window.__ke; K.aiTurn(K.S.player); });
      await L.endTurn(page);
      await L.closeModals(page);
      const inv = await page.evaluate(L.INV);
      if (inv.length) { check(`turn ${t + 1} invariants`, false, inv.slice(0, 5)); break; }
    }
    check('played 4 turns after migration', (await page.evaluate(() => window.__ke.S.turn)) === v1.turn + 4);
  },
};
