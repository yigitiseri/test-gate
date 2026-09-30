'use strict';
// Track A (W2), 3D: a siege fixture builds the 3D camp (tents, stakes, bombards) and smoke sprites; regiments use a
// level of detail by zoom (one standard-bearer per army far out, the full block near); the view still idles down
// (render on demand) with a siege on screen. KE_SHOTS=<dir> saves screenshots.
const path = require('path');
module.exports = {
  name: 'a-siege3d',
  fac: 'OSM',
  mode: '3d',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const shot = async n => { if (process.env.KE_SHOTS) await page.screenshot({ path: path.join(process.env.KE_SHOTS, n + '.png'), timeout: 180000 }); };
    const frames = () => E(() => window.__ke.stats.frames);
    const fx = await E(() => {
      const K = window.__ke, S = K.S, PD = K.PD, ist = PD.findIndex(d => d.name === 'Konstantiniyye');
      if (!S.war[['BYZ', 'OSM'].sort().join('|')] && K.declareWar) K.declareWar('OSM', 'BYZ');
      for (let k = S.armies.length - 1; k >= 0; k--) if (S.armies[k].loc === ist) S.armies.splice(k, 1);
      const a = K.armyCreate('OSM', ist, 24000, {}); a.st = 'siege';
      S.sieges[ist] = { i: ist, f: 'OSM', a: a.id, t0: S.turn, prog: 4, need: 6 };
      K.centerOn(PD[ist].lx, PD[ist].ly, 3.2); K.sg.hot(3000);
      return { ist, army: a.id };
    });
    await page.waitForFunction(() => window.__ke.stats.sgTents > 0 && window.__ke.stats.sgPuffs > 0, null, { timeout: 180000 }).catch(() => {});
    const st = await E(() => ({ ...window.__ke.stats }));
    check('3D siege camp: tents and smoke sprites', st.sgTents >= 3 && st.sgPuffs >= 5, st);
    await page.waitForFunction(() => window.__ke.stats.lod === 2, null, { timeout: 120000 }).catch(() => {});
    const near = await E(() => ({ lod: window.__ke.stats.lod, fig: window.__ke.stats.fig, n: window.__ke.S.armies.length }));
    await shot('siege_3d_desktop');
    await E(() => { const K = window.__ke; K.centerOn(K.W / 2, K.H / 2, 0.6); });
    await page.waitForFunction(() => window.__ke.stats.lod === 0, null, { timeout: 120000 }).catch(() => {});
    const far = await E(() => ({ lod: window.__ke.stats.lod, fig: window.__ke.stats.fig, n: window.__ke.S.armies.length }));
    check('regiment LOD: near zoom draws full blocks, far zoom one figure per army', near.lod === 2 && far.lod === 0 && far.fig <= far.n && far.fig < near.fig, { near, far });
    await shot('siege_3d_far_lod');
    // back to the siege, then idle: <= 2 frames/s once the hot periods are over
    await E(i => { const K = window.__ke; K.centerOn(K.PD[i].lx, K.PD[i].ly, 3.2); K.sg.hot(0); }, fx.ist);
    await page.waitForTimeout(7000);
    const f0 = await frames(); await page.waitForTimeout(3000); const f1 = await frames();
    check('3D idle with a siege on screen renders <= 2 frames/s', (f1 - f0) / 3 <= 2, f1 - f0);
    await E(() => { const S = window.__ke.S; S.sieges = {}; for (let k = S.armies.length - 1; k >= 0; k--) { const a = S.armies[k]; if (a.st === 'siege') S.armies.splice(k, 1); } window.__ke.sg.repaint(); });
    await page.waitForFunction(() => window.__ke.stats.sgTents === 0, null, { timeout: 120000 }).catch(() => {});
    check('camp removed when the siege ends', await E(() => window.__ke.stats.sgTents === 0));
  },
};
