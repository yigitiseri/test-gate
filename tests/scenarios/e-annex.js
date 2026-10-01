'use strict';
// Annex: when the player takes a city a decree asks "annex or keep occupied"; annex makes it ours at once, keep
// leaves the occupation with an "Annex" button in the province panel (also for capitals) while the war lasts.
module.exports = {
  name: 'e-annex',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const two = await E(() => { const K = window.__ke, S = K.S; K.declareWar('OSM', 'BYZ');
      const ps = S.prov.map((p, i) => i).filter(i => S.prov[i].o === 'BYZ' && S.fac.BYZ.cap !== i).slice(0, 2);
      S.prov[ps[0]].ctl = 'OSM'; K.annex.ask(); return ps; });
    await page.waitForSelector('#modal:not([hidden]) [data-act="ev"]', { timeout: 30000 }).catch(() => {});
    const m = await E(() => ({ t: (document.querySelector('#modal h2') || {}).textContent, n: document.querySelectorAll('#modal [data-act="ev"]').length }));
    check('taking a city asks: annex or keep occupied', m.n === 2 && /Alındı/.test(m.t || ''), m);
    await page.click('#modal [data-act="ev"][data-k="1"]'); await page.waitForTimeout(200);
    check('"annex" makes the city ours at once', await E(t => { const p = window.__ke.S.prov[t]; return p.o === 'OSM' && !p.ctl; }, two[0]));
    // keep the second one occupied, then annex it later from the panel
    await E(t => { const K = window.__ke, S = K.S; S.prov[t].ctl = 'OSM'; S.armies = S.armies.filter(a => a.loc !== t); K.annex.ask(); }, two[1]);
    await page.waitForSelector('#modal:not([hidden]) [data-act="ev"][data-k="0"]', { timeout: 30000 }).catch(() => {});
    await page.click('#modal [data-act="ev"][data-k="0"]'); await page.waitForTimeout(200);
    check('"keep occupied" leaves the occupation', await E(t => { const p = window.__ke.S.prov[t]; return p.o === 'BYZ' && p.ctl === 'OSM'; }, two[1]));
    check('it is not asked twice', await E(() => { window.__ke.annex.ask(); return document.getElementById('modal').hidden; }));
    await E(t => { const K = window.__ke; K.centerOn(K.PD[t].lx, K.PD[t].ly, 2.4); }, two[1]); await page.waitForTimeout(300);
    await L.clickProv(page, two[1]); await page.waitForTimeout(200);
    check('the panel of an occupied city offers "Annex"', await E(() => !!document.querySelector('#panel [data-act="annex"]')));
    await page.click('#panel [data-act="annex"]'); await page.waitForTimeout(200);
    check('annex from the panel makes it ours', await E(t => { const p = window.__ke.S.prov[t]; return p.o === 'OSM' && !p.ctl; }, two[1]));
    // capitals too, as long as the war lasts
    const cap = await E(() => { const K = window.__ke, S = K.S, c = S.fac.BYZ.cap; S.prov[c].ctl = 'OSM'; S.prov[c].ctlAsk = 1; const r = K.annex.can(c); delete S.prov[c].ctl; delete S.prov[c].ctlAsk; return r; });
    check('a capital can be annexed too while at war', cap.ok, cap);
    // save repair keeps every army of a siege camp besieging (helpers too, not only the leading army)
    const mg = await E(() => { const K = window.__ke, S = K.S, i = S.prov.findIndex((p, k) => p.o === 'BYZ' && !p.ctl && S.fac.BYZ.cap !== k);
      const a = K.armyCreate('OSM', i, 9000, {}), b = K.armyCreate('OSM', i, 5000, {}); a.st = 'siege'; b.st = 'siege';
      S.sieges[i] = { i, f: 'OSM', a: a.id, t0: S.turn, prog: 1, need: 4, sally: 0 }; K.migrate(S);
      const r = [a.st, b.st, !!S.sieges[i]]; delete S.sieges[i]; S.armies = S.armies.filter(x => x !== a && x !== b); return r; });
    check('migrate keeps helper armies in a siege camp', mg[0] === 'siege' && mg[1] === 'siege' && mg[2], mg);
  }
};
