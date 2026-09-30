'use strict';
// Top-bar shortcuts and the end of a realm: with only one far province left, tapping "Eyalet" centres the map
// on it and opens its panel; "Ordu" cycles the field armies; losing that last province ends the game.
module.exports = {
  name: 'e-shortcuts',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    // keep only the Ottoman province that lies farthest from the capital (as if the rest had been conquered)
    const fx = await E(() => {
      const K = window.__ke, S = K.S, PD = K.PD, cap = S.fac.OSM.cap;
      const mine = PD.filter(d => S.prov[d.i].o === 'OSM').map(d => d.i);
      const far = mine.sort((a, b) => Math.hypot(PD[b].lx - PD[cap].lx, PD[b].ly - PD[cap].ly) - Math.hypot(PD[a].lx - PD[cap].lx, PD[a].ly - PD[cap].ly))[0];
      for (const i of mine) if (i !== far) S.prov[i].o = 'KAR';
      S.fac.OSM.cap = far; K.centerOn(PD[cap].lx, PD[cap].ly, 1.2); K.uiRender();
      return { far, name: PD[far].name };
    });
    await page.click('#top [data-act="cyc-prov"]'); await page.waitForTimeout(300);
    const r = await E(f => { const K = window.__ke, d = K.PD[f], p = K.proj(d.x, d.y), pn = document.getElementById('panel');
      return { vis: p[0] > 0 && p[0] < innerWidth && p[1] > 0 && p[1] < innerHeight, panel: !pn.hidden && pn.innerText.includes(d.name) }; }, fx.far);
    check('"Eyalet" jumps to the last province and opens its panel', r.vis && r.panel, { ...r, ...fx });
    // armies: two of them, the button cycles through both
    const ids = await E(f => { const K = window.__ke, S = K.S; for (let k = S.armies.length - 1; k >= 0; k--) if (S.armies[k].f === 'OSM') S.armies.splice(k, 1); return [K.armyCreate('OSM', f, 9000, {}).id, K.armyCreate('OSM', f, 4000, {}).id]; }, fx.far);
    const seen = [];
    for (let k = 0; k < 2; k++) { await page.click('#top [data-act="cyc-army"]'); await page.waitForTimeout(200); seen.push(await E(() => window.__ke.cyc().army)); }
    check('"Ordu" cycles through the field armies', seen.includes(ids[0]) && seen.includes(ids[1]), { seen, ids });
    // the last province falls: the realm is gone and the game is over
    await E(f => window.__ke.capture(f, 'KAR'), fx.far);
    const over = await E(() => ({ over: window.__ke.S.over, alive: window.__ke.S.fac.OSM.alive }));
    check('losing the last province ends the game', over.over === 'lose' && over.alive === false, over);
  }
};
