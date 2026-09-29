'use strict';
// Envoy offers in the season report: a button whose offer vanished while the report was open must not be a dead
// button (the report used to stay open forever: smoke HUN turn 80, "Mevsim Raporu" x60).
module.exports = {
  name: 'b-offers',
  fac: 'HUN',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const add = () => E(() => { const K = window.__ke, S = K.S, k = 'HUN|OSM'; K.declareWar('HUN', 'OSM'); if (!S.offers.some(o => o.f === 'OSM')) S.offers.push({ f: 'OSM', type: 'peace', wt: S.war[k].t }); window.__ke.showReport(); });
    await add();
    check('report lists the envoy', await E(() => !!document.querySelector('#modal [data-act="off"][data-f="OSM"]')));
    await E(() => { window.__ke.S.offers.length = 0; });
    await page.click('#modal [data-act="off"][data-v="0"]');
    check('a vanished offer redraws the report without its buttons', await E(() => !document.getElementById('modal').hidden && !document.querySelector('#modal [data-act="off"]')));
    await L.closeModals(page);
    // index shifted under the button: the right envoy is still answered
    await add();
    await E(() => { const S = window.__ke.S; window.__ke.declareWar('HUN', 'VEN'); S.offers.unshift({ f: 'VEN', type: 'peace', wt: S.war['HUN|VEN'].t }); });
    await page.click('#modal [data-act="off"][data-f="OSM"][data-v="0"]');
    check('reject answers the envoy on the button, not the index', await E(() => { const S = window.__ke.S; return !S.offers.some(o => o.f === 'OSM') && S.offers.some(o => o.f === 'VEN'); }));
    check('report closes', (await L.closeModals(page)) === null);
  }
};
