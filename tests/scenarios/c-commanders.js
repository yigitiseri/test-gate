'use strict';
// Commanders: the army panel lists the realm's free commanders and appoints one with a real click; a commander
// can be moved from another army; an army whose commander is captured gets a replacement at the end of the round.
module.exports = {
  name: 'c-commanders',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    // two Ottoman armies side by side, a fresh free general
    const fx = await E(() => {
      const K = window.__ke, S = K.S, PD = K.PD, P = k => PD.findIndex(d => d.key === k);
      for (let k = S.armies.length - 1; k >= 0; k--) if (S.armies[k].f === 'OSM') S.armies.splice(k, 1);
      const e = P('edirne'), a = K.armyCreate('OSM', e, 12000, { mp: 2 }), b = K.armyCreate('OSM', e, 6000, { mp: 2 });
      const g = K.cmd.newGeneral('OSM');
      return { e, a: a.id, b: b.id, ga: a.gen, gb: b.gen, g };
    });
    check('new armies get a commander', fx.ga != null && fx.gb != null && fx.ga !== fx.gb, fx);
    check('the free general is a candidate', await E(g => window.__ke.cmd.cands('OSM').some(x => x.id === g && x.army == null), fx.g));
    // open the panel for army a with real clicks
    await E(e => { const K = window.__ke; K.centerOn(K.PD[e].lx, K.PD[e].ly, 2.4); }, fx.e); await page.waitForTimeout(300);
    await L.clickProv(page, fx.e); await page.waitForTimeout(200);
    // selecting the province selects its largest own army (a)
    const sel = await E(() => window.__ke.S && document.querySelector('#panel [data-act="cmd-open"]') != null);
    check('army panel offers "change commander"', sel);
    if (sel) {
      await page.click('#panel [data-act="cmd-open"]'); await page.waitForTimeout(150);
      check('list shows the free general with an appoint button', await E(g => !!document.querySelector(`#panel [data-act="cmd-set"][data-g="${g}"]`), fx.g));
      await page.click(`#panel [data-act="cmd-set"][data-g="${fx.g}"]`); await page.waitForTimeout(150);
      check('appoint puts the general at the head of the army', await E(f => window.__ke.S.armies.find(x => x.id === f.a).gen === f.g, fx));
    }
    // move b's commander to a: b is left without one
    const moved = await E(f => { const K = window.__ke; const ok = K.cmd.set(f.a, f.gb); const A = id => K.S.armies.find(x => x.id === id); return { ok, a: A(f.a).gen, b: A(f.b).gen }; }, fx);
    check('a commander can be moved between armies', moved.ok && moved.a === fx.gb && moved.b == null, moved);
    // capture a's commander (as the battle rules do) and end the turn: a replacement takes over
    await E(f => { const K = window.__ke, S = K.S, a = S.armies.find(x => x.id === f.a), c = S.chars[a.gen]; c.cap = S.turn + 8; a.gen = null; }, fx);
    await L.endTurn(page); await L.closeModals(page);
    const after = await E(f => { const S = window.__ke.S, A = id => S.armies.find(x => x.id === id); const a = A(f.a), b = A(f.b); return { a: a && a.gen, b: b && b.gen, capA: a && a.gen != null && S.chars[a.gen].cap != null }; }, fx);
    check('armies without a commander get a replacement at the end of the round', after.a != null && after.b != null && !after.capA, after);
    check('a captive is never a candidate', await E(gb => !window.__ke.cmd.cands('OSM').some(x => x.id === gb), fx.gb));
  }
};
