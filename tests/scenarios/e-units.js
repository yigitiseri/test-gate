'use strict';
// Troop types (04i): armies are mixes of foot, horse and guns. Realms start with their own mix; the recruit tiles
// raise one type (guns only with cannon) at its own price; merging blends the mix and splitting keeps it. Horse wins
// in the open and loses in the mountains, foot storms walls, guns speed up sieges, and horse and guns cost more pay.
module.exports = {
  name: 'e-units',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    if (await E(() => !!document.querySelector('[data-act="tut-skip"]'))) await page.click('#tutBub [data-act="tut-skip"]');
    const d = await E(() => { const K = window.__ke; return { osm: K.units.def('OSM'), krm: K.units.def('KRM'), ven: K.units.def('VEN'), jan: K.units.name('OSM', 'i'), sip: K.units.name('OSM', 'c') }; });
    check('each realm fields its own mix (Tatars mostly horse, Venice mostly foot, no guns before cannon)', d.krm[1] > .7 && d.ven[0] > .6 && d.osm[2] === 0 && Math.abs(d.osm[0] + d.osm[1] + d.osm[2] - 1) < 1e-6, d);
    check('the Ottomans raise janissaries and sipahis', d.jan === 'Yeniçeri' && d.sip === 'Sipahi', d);
    // recruit through the tiles
    const fx = await E(() => { const K = window.__ke, S = K.S, i = K.PD.findIndex(x => x.key === 'bursa'); S.fac.OSM.gold = 900; S.fac.OSM.mp = 50000; S.fac.OSM.cannon = 0;
      S.armies = S.armies.filter(a => a.loc !== i); const a = K.armyCreate('OSM', i, 4000, { mp: 2, mix: [1, 0, 0] }); K.centerOn(K.PD[i].lx, K.PD[i].ly, 2.2); K.uiRender(); return { i, id: a.id }; });
    await L.clickProv(page, fx.i); await page.waitForTimeout(200);
    const tiles = await E(() => ({ c: !!document.querySelector('#panel [data-act="recc"]:not([disabled])'), a: !!document.querySelector('#panel [data-act="reca"][disabled]'), bar: !!document.querySelector('#panel .ubar') }));
    check('the panel shows the mix and the tiles (no guns before cannon)', tiles.c && tiles.a && tiles.bar, tiles);
    const g0 = await E(() => window.__ke.S.fac.OSM.gold);
    await page.click('#panel [data-act="recc"]'); await page.waitForTimeout(150);
    const r1 = await E(f => { const K = window.__ke, a = K.S.armies.find(x => x.id === f.id); return { n: a.n, mix: K.units.mix(a.id), gold: K.S.fac.OSM.gold, cost: K.units.cost('OSM', 'c', 1000) }; }, fx);
    check('raising 1,000 horse blends them into the army at the horse price', r1.n === 5000 && Math.abs(r1.mix[1] - .2) < .01 && Math.abs(g0 - r1.gold - r1.cost) < 1e-6 && r1.cost > await E(() => window.__ke.units.cost('OSM', 'i', 1000)), { g0, r1 });
    await E(() => { window.__ke.S.fac.OSM.cannon = 1; window.__ke.uiRender(); }); await page.waitForTimeout(150);
    if (!(await E(() => !!document.querySelector('#panel [data-act="reca"]')))) await L.clickProv(page, fx.i);
    await page.click('#panel [data-act="reca"]'); await page.waitForTimeout(150);
    const r2 = await E(f => { const K = window.__ke, a = K.S.armies.find(x => x.id === f.id); return { n: a.n, mix: K.units.mix(a.id) }; }, fx);
    check('with cannon a battery of 500 gunners can be raised', r2.n === 5500 && r2.mix[2] > .08, r2);
    // merge and split
    const ms = await E(f => { const K = window.__ke, S = K.S, a = S.armies.find(x => x.id === f.id), b = K.armyCreate('OSM', f.i, 5500, { mp: 2, mix: [0, 1, 0] });
      S.armies = S.armies.filter(x => x.f !== 'OSM' || x === a || x === b); const m0 = K.units.mix(a.id); K.armyMerge(a, b); const m1 = K.units.mix(a.id); const c = K.armySplit(a.id, 3000); return { m0, m1, m2: c ? K.units.mix(c.id) : null, keep: K.units.mix(a.id) }; }, fx);
    check('merging blends the mixes, splitting keeps them', Math.abs(ms.m1[1] - (ms.m0[1] * 5500 + 5500) / 11000) < .01 && ms.m2 && Math.abs(ms.m2[1] - ms.m1[1]) < .002 && Math.abs(ms.keep[1] - ms.m1[1]) < .002, ms);
    // the battle effects (odds of the same army size with different mixes)
    const bt = await E(() => { const K = window.__ke, S = K.S, PK = k => K.PD.findIndex(x => x.key === k);
      const plain = S.prov.findIndex((p, i) => !K.PD[i].mtn && !K.PD[i].des && p.o === 'KAR'), mtn = S.prov.findIndex((p, i) => K.PD[i].mtn && p.o === 'KAR');
      if (!K.S.war || !Object.keys(K.S.war).some(k => /KAR/.test(k))) K.declareWar('OSM', 'KAR');
      const mk = (loc, mix) => K.armyCreate('OSM', loc, 10000, { mp: 2, mix });
      const odds = (to, mix) => { S.armies = S.armies.filter(x => !(x.f === 'KAR' && x.loc === to)); const foe = K.armyCreate('KAR', to, 10000, { mix: [.5, .5, 0] });
        const a = mk(K.PD[to].adj[0], mix), o = K.battleOdds({ att: 'OSM', to, army: a, kind: 'field' }); S.armies.splice(S.armies.indexOf(a), 1); S.armies.splice(S.armies.indexOf(foe), 1); return o.p; };
      const res = { plain, mtn, horsePlain: odds(plain, [0, 1, 0]), footPlain: odds(plain, [1, 0, 0]), horseMtn: mtn >= 0 ? odds(mtn, [0, 1, 0]) : null, footMtn: mtn >= 0 ? odds(mtn, [1, 0, 0]) : null };
      // storming walls: foot vs horse, and guns
      const town = S.prov.findIndex((p, i) => p.o === 'KAR' && p.fort >= 1); S.fac.OSM.cannon = 1;
      const ao = mix => { const a = mk(K.PD[town].adj[0], mix), o = K.battleOdds({ att: 'OSM', to: town, army: a, kind: 'assault' }); S.armies.splice(S.armies.indexOf(a), 1); return o.r; };
      res.footWall = ao([1, 0, 0]); res.horseWall = ao([0, 1, 0]); res.gunsWall = ao([.7, 0, .3]);
      const so = mix => { const a = mk(K.PD[town].adj[0], mix), o = K.battleOdds({ att: 'OSM', to: town, army: a, kind: 'siege' }); const t = o.turns; S.armies.splice(S.armies.indexOf(a), 1); return t; };
      res.siegeNoGuns = so([1, 0, 0]); res.siegeGuns = so([.7, 0, .3]);
      return res; });
    check('horse beats foot in the open', bt.horsePlain > bt.footPlain, bt);
    if (bt.mtn >= 0) check('foot beats horse in the mountains', bt.footMtn > bt.horseMtn, bt);
    check('foot storms walls better than horse, and guns better still', bt.footWall > bt.horseWall && bt.gunsWall > bt.footWall, bt);
    check('guns shorten a siege', bt.siegeGuns <= bt.siegeNoGuns, bt);
    // pay
    const pay = await E(() => { const K = window.__ke, S = K.S; const keep = S.armies.slice(); S.armies = S.armies.filter(a => a.f !== 'OSM');
      const row = () => (K.econRows('OSM').find(r => r.id === 'army') || { v: 0 }).v; const a = K.armyCreate('OSM', K.PD.findIndex(x => x.key === 'bursa'), 10000, { mix: [1, 0, 0] }); const foot = row();
      a.mix = [0, 1, 0]; const horse = row(); S.armies = keep; return { foot, horse }; });
    check('horse costs more pay than foot', pay.horse > pay.foot && pay.foot > 0, pay);
  }
};
