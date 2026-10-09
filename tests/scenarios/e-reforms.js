'use strict';
// Reforms (12f): the top-bar window lists eight reforms; gold buys them, some wait for a year or another reform.
// Gunpowder gives cannon, land surveys add a ledger row, arquebusiers strengthen foot in the field, bastion forts
// hold walls longer, standing corps allow one more army; the AI adopts reforms when its treasury overflows.
module.exports = {
  name: 'e-reforms',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    if (await E(() => !!document.querySelector('[data-act="tut-skip"]'))) await page.click('#tutBub [data-act="tut-skip"]');
    await E(() => { const S = window.__ke.S; S.fac.OSM.gold = 2000; S.fac.OSM.cannon = 0; });
    await page.click('[data-act="reforms"]'); await page.waitForTimeout(200);
    const w = await E(() => ({ n: document.querySelectorAll('#modal .rf').length, buy: [...document.querySelectorAll('#modal [data-act="rfbuy"]:not([disabled])')].map(b => b.dataset.r), lock: document.querySelectorAll('#modal .rf-st:not(.ok)').length }));
    check('the top bar opens the reforms window: eight reforms, some locked by year or by another reform', w.n === 8 && w.buy.includes('barut') && w.buy.includes('tahrir') && !w.buy.includes('tufek') && w.lock >= 3, w);
    await page.click('#modal [data-act="rfbuy"][data-r="barut"]'); await page.waitForTimeout(200);
    const b = await E(() => { const K = window.__ke, S = K.S; return { cannon: S.fac.OSM.cannon, gold: S.fac.OSM.gold, on: document.querySelectorAll('#modal .rf.on').length, log: S.log.slice(-3).map(e => e.m).join(' | ') }; });
    check('gunpowder gives cannon, costs 150 gold and is logged', b.cannon === 1 && b.gold === 1850 && b.on === 1 && /Barut|Gun Foundry/.test(b.log), b);
    await page.click('#modal [data-act="rfbuy"][data-r="tahrir"]'); await page.waitForTimeout(150);
    const t = await E(() => { const K = window.__ke, R = K.econRows('OSM'), tax = (R.find(r => r.id === 'tax') || {}).v, row = (R.find(r => r.id === 'rf-tahrir') || {}).v; return { tax, row }; });
    check('land surveys add 8% of the taxes as a ledger row', t.row > 0 && Math.abs(t.row - t.tax * .08) < .01, t);
    await L.closeModals(page);
    // later reforms: arquebusiers, bastion forts, standing corps
    const r = await E(() => { const K = window.__ke, S = K.S; const t0 = S.turn; S.turn = 124; S.fac.OSM.gold = 2000; const cap0 = K.armyCap ? K.armyCap('OSM') : null;
      const ok = ['tufek', 'tabya', 'ocak'].map(id => K.ref.adopt('OSM', id));
      const PK = k => K.PD.findIndex(d => d.key === k), i = PK('sofya'), to = K.PD[i].adj.find(j => S.prov[j].o !== 'OSM');
      const foe = S.prov[to].o; if (!K.S.war || !Object.keys(K.S.war).some(k => k.includes(foe))) K.declareWar('OSM', foe);
      const keep = S.armies.slice(); S.armies = S.armies.filter(a => a.loc !== to); K.armyCreate(foe, to, 6000, { mix: [.5, .5, 0] });
      const a = K.armyCreate('OSM', i, 8000, { mp: 2, mix: [1, 0, 0] }); const o = K.battleOdds({ att: 'OSM', to, army: a, kind: 'field' });
      S.armies.splice(S.armies.indexOf(a), 1);
      const own = K.PD.findIndex((d, j) => S.prov[j].o === 'OSM' && S.prov[j].fort >= 1 && d.adj.some(n => S.prov[n].o !== 'OSM'));
      const att = S.prov[K.PD[own].adj.find(n => S.prov[n].o !== 'OSM')].o;
      const sg = K.battleOdds({ att, to: own, n: 8000, kind: 'siege' }), as = K.battleOdds({ att, to: own, n: 8000, kind: 'assault' }); S.armies = keep; S.turn = t0;
      return { ok, tuf: (o.mods.find(m => m.k === 'rf-tufek') || {}).m, tabS: (sg.mods.find(m => m.k === 'rf-tabya') || {}).m, tabA: (as.mods.find(m => m.k === 'rf-tabya') || {}).m, cap: K.reg ? null : null }; });
    check('arquebusiers give an all-foot army +15% in the field', r.ok.every(Boolean) && Math.abs(r.tuf - 1.15) < 1e-6, r);
    check('bastion forts make the walls hold longer and stand assaults better', r.tabS === 1.25 && r.tabA === 1.2, r);
    const cap = await E(() => { const K = window.__ke; return { has: K.ref.has('OSM', 'ocak'), n: K.ref.count('OSM') }; });
    check('five reforms adopted', cap.has && cap.n === 5, cap);
    const ach = await E(() => { window.__ke.lgc.check(); return Object.keys(window.__ke.lgc.get().ach); });
    check('five reforms earn "The Reformer"', ach.includes('yenilik'), ach);
    // the AI
    const ai = await E(() => { const K = window.__ke, S = K.S; S.fac.VEN.gold = 5000; const t0 = S.turn; S.turn = 16; for (let k = 0; k < 80; k++) K.runHooks('preAI', 'VEN'); S.turn = t0; return { n: K.ref.count('VEN'), barut: K.ref.has('VEN', 'barut'), cannon: S.fac.VEN.cannon }; });
    check('a rich AI realm adopts reforms (but never buys gunpowder)', ai.n >= 2 && (!ai.barut || ai.cannon), ai);
    // an old save without reforms
    const mg = await E(() => { const K = window.__ke, o = JSON.parse(JSON.stringify(K.S)); delete o.ref; return K.migrate(o).ref; });
    check('old saves start with no reforms', mg && typeof mg === 'object' && !Object.keys(mg).length, mg);
  }
};
