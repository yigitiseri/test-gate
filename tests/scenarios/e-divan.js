'use strict';
// Divan (12g): three officers from the start (two stars); the treasurer adds a ledger row, the commander a battle
// modifier; the Divan tab of the reforms window lists the offices and two candidates each; appointing costs gold,
// dismissing empties the office (and can be undone); old officers die; Christian realms use other titles.
module.exports = {
  name: 'e-divan',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    if (await E(() => !!document.querySelector('[data-act="tut-skip"]'))) await page.click('#tutBub [data-act="tut-skip"]');
    const c0 = await E(() => { const K = window.__ke, C = K.divan.get(); return { sk: ['sad', 'def', 'ser'].map(k => C[k] && C[k].sk), names: ['sad', 'def', 'ser'].map(k => C[k] && C[k].n), t: ['sad', 'def', 'ser'].map(k => K.divan.title(k)), ven: K.divan.title('sad', 'VEN') }; });
    check('a new game starts with three two-star officers under Ottoman titles', c0.sk.join() === '2,2,2' && c0.names.every(Boolean) && c0.t.join() === 'Sadrazam,Defterdar,Serasker', c0);
    check('a Christian realm calls its first minister a chancellor', c0.ven === 'Şansölye', c0);
    const fx = await E(() => { const K = window.__ke, S = K.S, R = K.econRows('OSM'), tax = (R.find(r => r.id === 'tax') || {}).v, row = (R.find(r => r.id === 'dv-def') || {}).v;
      const i = K.PD.findIndex(d => d.key === 'edirne'), to = K.PD[i].adj.find(j => S.prov[j].o !== 'OSM');
      const a = K.armyCreate('OSM', i, 8000, { mp: 2 }), o = K.battleOdds({ att: 'OSM', to, army: a, kind: 'assault' }); S.armies.splice(S.armies.indexOf(a), 1);
      return { tax, row, ser: (o.mods.find(m => m.k === 'dv-ser') || {}) }; });
    check('the treasurer adds 5% of the taxes, the commander +5% in battle (two stars)', Math.abs(fx.row - fx.tax * .05) < .01 && Math.abs(fx.ser.m - 1.05) < 1e-9 && fx.ser.side === 'att' && /Serasker/.test(fx.ser.l), fx);
    // the Divan tab
    await E(() => { window.__ke.S.fac.OSM.gold = 2000; });
    await page.click('[data-act="reforms"]'); await page.waitForTimeout(150);
    await page.click('#modal [data-act="divan"]'); await page.waitForTimeout(150);
    const w = await E(() => ({ secs: document.querySelectorAll('#modal .sec.dv').length, cands: document.querySelectorAll('#modal .dv-c').length, tab: (document.querySelector('#modal .rf-tab.on') || {}).dataset?.act }));
    check('the Divan tab shows three offices and two candidates each', w.secs === 3 && w.cands === 6 && w.tab === 'divan', w);
    const pick = await E(() => { const K = window.__ke, L = K.divan.cands(), i = L.findIndex(x => x.o === 'def'); return { i, c: L[i], gold: K.S.fac.OSM.gold }; });
    await page.click(`#modal [data-act="dvset"][data-i="${pick.i}"]`); await page.waitForTimeout(150);
    const ap = await E(() => { const K = window.__ke; return { def: K.divan.get().def, gold: K.S.fac.OSM.gold, used: !!document.querySelector('#modal .dv-c .rf-st.ok') }; });
    check('appointing a candidate makes him treasurer for gold (stars squared x 12)', ap.def.n === pick.c.n && ap.def.sk === pick.c.sk && ap.gold === pick.gold - pick.c.sk * pick.c.sk * 12 && ap.used, { pick, ap });
    await page.click('#modal [data-act="dvx"][data-k="ser"]'); await page.waitForTimeout(150);
    const dx = await E(() => ({ ser: window.__ke.divan.get().ser, empty: !!document.querySelector('#modal .dv-empty'), dot: !!document.querySelector('#modal .rf-dot'), undo: window.__ke.undo.labels() }));
    check('dismissing empties the office and marks the tab', dx.ser === null && dx.empty && dx.dot && dx.undo.includes('dvx'), dx);
    await L.closeModals(page);
    await page.keyboard.press('Control+z'); await page.waitForTimeout(150);
    const un = await E(() => window.__ke.divan.get().ser);
    check('the dismissal can be undone', un && un.sk === 2, un);
    // old age
    const dead = await E(() => { const K = window.__ke, S = K.S, C = K.divan.get(); C.sad.born = 1451 + Math.floor(S.turn / 4) - 95; let k = 0; while (C.sad && k < 60) { K.divan.aging(); k++; }
      return { gone: C.sad === null, k, news: S.log.slice(-5).map(e => e.m).join(' | ') }; });
    check('an old grand vizier dies and the office stands empty', dead.gone && /öldü/.test(dead.news), dead);
  }
};
