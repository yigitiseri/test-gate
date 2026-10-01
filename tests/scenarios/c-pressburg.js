'use strict';
// Track C, Wave 2: Mohács and the Treaty of Pressburg from the Hungarian player's side. The chain asks the player
// (modal), the king rides with the army, and when a king dies with no heir after 1491 the player's realm is NOT
// handed to the Habsburgs: the nobles crown John Zápolya and Ferdinand claims the crown by war.
module.exports = {
  name: 'c-pressburg',
  fac: 'HUN',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    await E(() => { const K = window.__ke, S = K.S; for (const C of K.CHAINS) if (C.id !== 'mohac') S.chains[C.id] = { stage: 0, t: 0, data: {}, done: true, wait: false };
      S.turn = K.chn.turn(1526); S.fac.OSM.gold = 500; K.chn.tick(); if (S.chains.mohac.stage === 0) K.chn.choose('mohac', 0); K.chn.tick(); });
    await page.waitForSelector('#modal:not([hidden])');
    const m = await E(() => ({ h: document.querySelector('#modal h2').textContent, n: document.querySelectorAll('#modal [data-act="ev"]').length, war: !!window.__ke.S.war['HUN|OSM'] }));
    check('Mohács asks the Hungarian player', m.h === 'Mohaç Ovası' && m.n === 2 && m.war, m);
    await page.click('#modal [data-act="ev"][data-k="0"]');
    const k = await E(() => window.__ke.S.chains.mohac);
    check('giving battle: the king rides with the army', k.done && k.data.king > 0, k);
    await L.closeModals(page);
    // the throne empties with nobody to inherit: Zápolya is crowned, Ferdinand claims the crown by war
    await E(() => { const K = window.__ke, S = K.S; for (const id in S.chars) { const x = S.chars[id]; if (x.f === 'HUN' && x.died == null && x.role !== 'ruler' && x.role !== 'gen') K.ch.kill(x.id, 'natural'); }
      const rep = { kind: 'field', att: 'OSM', def: 'HUN', win: true, to: K.PD.findIndex(d => d.key === 'pecuy'), n: 60000, defT: 26000, aLoss: 2000, dLoss: 15000, mods: [] };
      for (const h of K.reg.HOOKS.battleResolved) h.fn(rep); });
    const r = await E(() => { const K = window.__ke, S = K.S; return { alive: S.fac.HUN.alive, ruler: K.rulerName('HUN'), war: !!S.war['HAB|HUN'], news: S.news.map(n => n.m) }; });
    check('the player keeps Hungary; the nobles crown Szapolyai János', r.alive && r.ruler === 'Szapolyai János', r);
    check('Ferdinand claims the crown under the Treaty of Pressburg (war)', r.war && r.news.some(x => /Pressburg/.test(x)), r.news);
    await L.closeModals(page);
    // the dates were jumped without aging anybody: go back before the state invariants check the ages
    await E(() => { window.__ke.S.turn = 4; });
  },
};
