'use strict';
// Sea crossings: the whole map is one connected network (the Hafsids are reached over the Sirte-Barca coast road);
// a player without a fleet (Karaman) hires ships to cross a sea lane, the cost shows in the order and is paid on the
// march; the AI without a fleet still cannot cross (Karaman does not take Cyprus in 1451).
module.exports = {
  name: 'e-ships',
  fac: 'KAR',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const net = await E(() => { const PD = window.__ke.PD, N = PD.length, seen = new Set([0]), st = [0];
      while (st.length) { const u = st.pop(); for (const v of PD[u].adj) if (!seen.has(v)) { seen.add(v); st.push(v); } }
      return { all: seen.size === N, missing: PD.filter(d => !seen.has(d.i)).map(d => d.key) }; });
    check('every province is reachable (no cut-off realm)', net.all, net);
    const fx = await E(() => { const K = window.__ke, S = K.S, PK = k => K.PD.findIndex(d => d.key === k);
      K.declareWar('KAR', 'CYP'); const icel = PK('icel'), kib = PK('kibris');
      S.armies = S.armies.filter(a => a.loc !== kib); S.prov[icel].o = 'KAR'; delete S.prov[icel].ctl;
      const a = K.armyCreate('KAR', icel, 8000, { mp: 2 }); S.fac.KAR.gold = 100;
      return { icel, kib, id: a.id, ai: K.armLaneOk('CYP', icel, kib), aiKar: K.armLaneOk('KAR', icel, kib) }; });
    const mv = await E(f => window.__ke.armyCanMove ? window.__ke.armyCanMove(f.id, f.kib) : null, fx);
    if (mv) check('the player may cross by hiring ships; the cost is known before the march', mv.ok && mv.ship === 8, mv);
    // real clicks: select the army, tap Cyprus, read the order
    await E(f => { const K = window.__ke; K.centerOn(K.PD[f.icel].lx, K.PD[f.icel].ly, 2.4); }, fx); await page.waitForTimeout(300);
    await L.clickProv(page, fx.icel); await page.waitForTimeout(200);
    await L.clickProv(page, fx.kib); await page.waitForTimeout(200);
    const ord = await E(() => (document.querySelector('#panel [data-sheet="action"]') || {}).textContent || '');
    check('the order shows the ship hire', /Gemi kirası/.test(ord) && /8 altın/.test(ord), ord.slice(0, 200));
    await page.click('#panel [data-act="amove"]'); await page.waitForTimeout(200); await L.closeModals(page);
    const after = await E(f => { const S = window.__ke.S, a = S.armies.find(x => x.id === f.id); return { gold: S.fac.KAR.gold, siege: !!S.sieges[f.kib], loc: a && a.loc }; }, fx);
    check('the ships are paid and the army lands to besiege Nicosia', after.gold === 92 && (after.siege || after.loc === fx.kib), after);
    // the AI rule is unchanged: without a fleet it cannot cross (KAR stands here for any AI realm when it is not the player)
    const ai = await E(() => { const K = window.__ke, PK = k => K.PD.findIndex(d => d.key === k); return K.armLaneOk('MAM', PK('icel'), PK('kibris')); });
    check('an AI realm without a fleet still cannot cross the sea', ai === false, ai);
  }
};
