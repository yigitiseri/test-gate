'use strict';
// Track B economy (G1, B5, B6): every faction starts with net income >= +3; the ledger shows the garrison and
// small-realm rows; tribute uses plain development (barracks do not inflate gold); a province pays loot only
// on its first occupation in a war; Kroya starts with a level-4 fort.
module.exports = {
  name: 'b-econ',
  fac: null,
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const nets = await E(() => { const K = window.__ke, out = {}; for (const f of ['OSM', 'ALB', 'TRB', 'BYZ', 'RHO', 'CYP', 'KRM', 'HAF', 'POL', 'GH']) { K.beginGame(f); out[f] = +K.net(f).toFixed(2); } return out; });
    const all = await E(() => { const K = window.__ke; K.beginGame('OSM'); const S = K.S; return Object.keys(S.fac).filter(f => S.fac[f].alive).map(f => [f, +K.net(f).toFixed(2)]); });
    const low = all.filter(x => x[1] < 3);
    check('every faction starts with net income >= +3 (G1)', low.length === 0 && Object.values(nets).every(v => v >= 3), { low, nets });
    await L.closeModals(page);
    check('Kroya fort 4', await E(() => { const K = window.__ke; return K.S.prov[K.PD.findIndex(d => d.key === 'kroya')].fort === 4; }));
    await E(() => { const K = window.__ke; K.beginGame('ALB'); });
    await L.closeModals(page);
    await page.click('#facBtn'); await page.waitForTimeout(100);
    const led = await E(() => document.querySelector('#modal .ledger').textContent);
    check('ledger: small-realm aid, army and garrison pay', /Küçük devlet desteği/.test(led) && /Ordu maaşları/.test(led) && /Garnizon maaşları/.test(led), led);
    await page.click('#modal [data-act="mclose"]');
    const b5 = await E(() => { const K = window.__ke, S = K.S; const d0 = K.devRaw('OSM'); S.prov.forEach(p => { if (p.o === 'OSM') p.brk = 1; }); return { raw: K.devRaw('OSM'), d0 }; });
    check('devRaw ignores barracks (B5)', b5.raw === b5.d0, b5);
    const b6 = await E(() => { const K = window.__ke, S = K.S, PD = K.PD;
      const j = S.prov.findIndex((p, i) => p.o === 'ALB' && S.fac.ALB.cap !== i), s = PD[j].adj.find(x => S.prov[x].o === 'OSM');
      S.prov[j].fort = 0; S.prov[j].t = 100; // no walls: the army storms and occupies at once
      const g0 = S.fac.OSM.gold; const a = K.armyCreate('OSM', s, 30000, { mp: 2 }); K.armyMove(a.id, j);
      const g1 = S.fac.OSM.gold, took = S.prov[j].ctl === 'OSM';
      // hand it back and take it again: no second loot in the same war
      delete S.prov[j].ctl; S.prov[j].t = 100; const b = K.S.armies.find(x => x.id === a.id); if (b) { b.loc = s; b.mp = 2; }
      if (b) K.armyMove(b.id, j); const g2 = S.fac.OSM.gold; K.armTidy();
      return { took, first: g1 - g0, second: g2 - g1, dev: S.prov[j].dev, again: S.prov[j].ctl === 'OSM' }; });
    check('capture loot paid once per province per war (B6)', b6.took && b6.again && b6.first === b6.dev * 2 && b6.second === 0, b6);
  },
};
