'use strict';
// Track B W2 save compatibility: a Wave 1 era save (schema v2 without occupations, with envoys that have no date,
// a stale siege and an army still marked as besieging) loads through "Devam", the migrate hook repairs it
// idempotently, and the game keeps playing with sieges.
const SAVE = 'kizil-elma-1451-v1';
module.exports = {
  name: 'b-w1save',
  fac: 'HUN',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    await L.endTurn(page); await L.closeModals(page);
    const raw = await E(() => { const K = window.__ke, S = JSON.parse(JSON.stringify(K.S));
      S.prov.forEach(p => { delete p.ctl; });
      for (const k in S.war) S.war[k].ex = {};
      const a = S.armies.find(x => x.f === 'HUN'); if (a) a.st = 'siege';
      S.sieges = { 3: { i: 3, f: 'HUN', a: 999999, t0: 0, prog: 1, need: 3, sally: 0 } };
      S.offers = [{ f: 'OSM', type: 'peace', wt: 0 }];
      if (S.b) delete S.b.pc;
      return JSON.stringify(S); });
    // the running page may save on unload: seed the W1 save before the next page's scripts run (once)
    await page.context().addInitScript(([k, r]) => { try { if (!sessionStorage.getItem('ke-seeded-w1')) { localStorage.setItem(k, r); sessionStorage.setItem('ke-seeded-w1', '1'); } } catch (e) {} }, [SAVE, raw]);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 180000 });
    await L.waitLoaded(page);
    await page.click('[data-act="continue"]');
    await page.waitForTimeout(200);
    await L.closeModals(page);
    const st = await E(() => { const S = window.__ke.S; return { v: S.v, sieges: Object.keys(S.sieges).length, besieging: S.armies.filter(a => a.st === 'siege').length, t0: S.offers.every(o => o.t0 != null), turn: S.turn }; });
    check('W1-era save loaded (schema v2)', st.v === 2 && st.turn === 1, st);
    check('stale siege dropped, no army left besieging', st.sieges === 0 && st.besieging === 0, st);
    check('envoys got a date (they will expire)', st.t0, st);
    check('migrate is idempotent', await E(() => { const K = window.__ke, a = JSON.stringify(K.S); return a === JSON.stringify(K.migrate(JSON.parse(a))); }));
    for (let t = 0; t < 3; t++) { await L.endTurn(page); await L.closeModals(page); }
    check('played 3 more turns', (await E(() => window.__ke.S.turn)) === 4);
  },
};
