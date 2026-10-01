'use strict';
// Track B W2 sieges and occupation: Constantinople's siege length (about 6 turns without cannon, about 2 with);
// an army marching on walls starts S.sieges[i] (hooks siegeStart / siegeTick / siegeFell, TURN_TRACE 'siege' and
// 'siegeFell'); the fallen city is OCCUPIED (ctl) and still owned; the occupier collects half its taxes and the owner
// can no longer recruit there; a storm through the panel; the lane rule (Karaman cannot cross to Cyprus, the straits
// stay open, Venice sails); a realm fully occupied in a long war capitulates; a capital that fell to a siege is annexed after 20 turns of war.
module.exports = {
  name: 'b-siege',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const has = sel => page.evaluate(s => !!document.querySelector(s), sel);
    const info = await E(() => { const K = window.__ke, S = K.S, PD = K.PD, ist = PD.findIndex(d => d.key === 'istanbul');
      window.__sg = { start: 0, tick: 0, fell: [] };
      K.hook('siegeStart', () => window.__sg.start++); K.hook('siegeTick', () => window.__sg.tick++); K.hook('siegeFell', (i, f) => window.__sg.fell.push([i, f]));
      return { ist, src: PD[ist].adj.find(j => S.prov[j].o === 'OSM') }; });
    check('Constantinople has an Ottoman neighbour', info.src != null, info);
    const need = await E(ist => { const K = window.__ke, S = K.S, keep = S.fac.OSM.cannon, r = {};
      S.fac.OSM.cannon = 0; r.no = K.battleOdds({ att: 'OSM', to: ist, n: 30000, kind: 'siege' }).turns; r.noNeed = K.siegeNeed(ist, 'OSM', 30000);
      S.fac.OSM.cannon = 1; r.yes = K.battleOdds({ att: 'OSM', to: ist, n: 30000, kind: 'siege' }).turns; r.yesNeed = K.siegeNeed(ist, 'OSM', 30000);
      S.fac.OSM.cannon = keep; return r; }, info.ist);
    check('Constantinople: about 6 turns without cannon (30k)', need.no >= 5 && need.no <= 7, need);
    check('Constantinople: about 2 turns with cannon (30k)', need.yes >= 1 && need.yes <= 3, need);
    const kroya = await E(() => { const K = window.__ke, k = K.PD.findIndex(d => d.key === 'kroya'), s = K.PD.findIndex(d => d.key === 'selanik'); return { k: K.siegeNeed(k, 'OSM', 20000), plain: K.siegeNeed(s, 'OSM', 20000) }; });
    check('Kroya (mountain, walls 4) holds longer than a plain town', kroya.k > kroya.plain + 2, kroya);

    // lane rule
    const lane = await E(() => { const K = window.__ke, PK = k => K.PD.findIndex(d => d.key === k);
      return { kar: K.armLaneOk('KAR', PK('icel'), PK('kibris')), ven: K.armLaneOk('VEN', PK('icel'), PK('kibris')), strait: K.armLaneOk('KAR', PK('istanbul'), PK('izmit')), land: K.armLaneOk('KAR', PK('konya'), PK('karaman')) }; });
    check('lane rule: Karaman cannot cross to Cyprus, Venice can, the straits and land stay open', !lane.kar && lane.ven && lane.strait && lane.land, lane);
    const kc = await E(() => { const K = window.__ke, S = K.S, PK = k => K.PD.findIndex(d => d.key === k); K.declareWar('KAR', 'CYP');
      const a = K.armyCreate('KAR', PK('icel'), 20000, { mp: 2 }), r = K.armyCanMove(a.id, PK('kibris')); K.S.armies.splice(K.S.armies.indexOf(a), 1); return r; });
    check('a Karaman army at Icel cannot march on Nicosia', !kc.ok && /deniz|sea/i.test(kc.reason), kc);

    // besiege Constantinople with cannon
    await E(({ ist, src }) => { const K = window.__ke, S = K.S; S.armies = S.armies.filter(a => a.f !== 'BYZ' && a.f !== 'VEN'); S.fac.OSM.cannon = 1;
      K.declareWar('OSM', 'BYZ'); S.armies = S.armies.filter(a => !(a.f === 'OSM' && a.loc === src)); window.__A = K.armyCreate('OSM', src, 30000, { mp: 2 }).id; }, info);
    await L.clickProv(page, info.src);
    if (!(await E(id => !!document.querySelector(`#panel .arm.on[data-id="${id}"]`), await E(() => window.__A)))) await page.click(`#panel .arm[data-id="${await E(() => window.__A)}"]`);
    await L.clickProv(page, info.ist);
    const ord = await E(() => { const s = document.querySelector('#panel [data-sheet="action"]'); return s && s.textContent; });
    check('siege order for the walls with an expected length', /Kuşatma/.test(ord || '') && /tur/.test(ord || ''), ord);
    await page.click('#panel [data-act="amove"]');
    await page.waitForTimeout(150);
    const st = await E(ist => { const K = window.__ke, S = K.S, s = S.sieges[ist], a = S.armies.find(x => x.id === window.__A); return { s, st: a && a.st, loc: a && a.loc, start: window.__sg.start, ctl: S.prov[ist].ctl || null }; }, info.ist);
    check('the siege begins: army camps before the walls (siegeStart)', !!st.s && st.s.f === 'OSM' && st.st === 'siege' && st.loc === info.ist && st.start === 1 && !st.ctl, st);
    check('panel shows the siege bar', await has('#panel .sgsec .sgbar'));
    let fell = false, turns = 0, sawTrace = false;
    for (; turns < 6 && !fell; turns++) {
      await L.endTurn(page); await L.closeModals(page);
      const r = await E(ist => { const K = window.__ke; return { fell: window.__sg.fell.some(x => x[0] === ist), trace: K.reg.TURN_TRACE.some(e => (e.k === 'siege' || e.k === 'siegeFell') && e.to === ist && e.f === 'OSM' && e.army != null) }; }, info.ist);
      fell = r.fell; sawTrace = sawTrace || r.trace;
    }
    check('Constantinople falls within 4 turns with cannon (siegeTick, siegeFell)', fell && turns <= 4, { turns, sg: await E(() => window.__sg) });
    check('TURN_TRACE carries siege / siegeFell entries', sawTrace);
    const occ = await E(ist => { const K = window.__ke, S = K.S, p = S.prov[ist], rows = K.econRows('OSM'), a = S.armies.find(x => x.id === window.__A);
      return { o: p.o, ctl: p.ctl, occ: rows.some(r => r.id === 'occ' && r.v > 0), loc: a && a.loc, st: a && a.st, rec: !!K.armRecruit('BYZ', ist, 1000).to, fetih: !!S.flags.fetih }; }, info.ist);
    // the 1453 chain (06c) makes Constantinople fall outright to an Ottoman siege; ordinary towns are only occupied (below)
    check('Constantinople falls outright to the Ottomans (1453 rule): owner OSM, fetih, capital moves', occ.o === 'OSM' && !occ.ctl && occ.fetih, occ);
    check('the army entered the city and stopped besieging', occ.loc === info.ist && occ.st === 'idle', occ);

    // storm: a weak walled town, the assault button in the siege panel
    const sm = await E(() => { const K = window.__ke, S = K.S, PD = K.PD;
      for (let t = 0; t < S.prov.length; t++) { if (S.prov[t].o !== 'BYZ' || S.prov[t].ctl || S.prov[t].fort < 1 || S.fac.BYZ.cap === t) continue;
        const s = PD[t].adj.find(j => (S.prov[j].ctl || S.prov[j].o) === 'OSM' && !PD[j].lanes.includes(t) && !PD[t].lanes.includes(j)); if (s == null) continue;
        S.armies = S.armies.filter(a => a.f !== 'BYZ' && a.f !== 'VEN'); const a = K.armyCreate('OSM', s, 40000, { mp: 2 }); const r = K.armyMove(a.id, t); a.mp = 2; S.prov[t].t = 100;
        return { t, kind: r.kind, id: a.id }; } return null; });
    check('a second siege starts', sm && sm.kind === 'siege', sm);
    if (sm) {
      await L.clickProv(page, sm.t);
      check('the siege panel offers an assault', await has('#panel [data-act="astorm"]:not([disabled])'));
      if (await has('#panel [data-act="astorm"]:not([disabled])')) {
        await page.click('#panel [data-act="astorm"]'); await page.waitForTimeout(150);
        const r = await E(t => { const S = window.__ke.S; return { ctl: S.prov[t].ctl || null, siege: !!S.sieges[t], last: S.battles[S.battles.length - 1] && S.battles[S.battles.length - 1].kind }; }, sm.t);
        check('the assault took the town (occupied) and ended the siege', r.ctl === 'OSM' && !r.siege && r.last === 'assault', r);
        const oc = await E(t => { const K = window.__ke, S = K.S; return { o: S.prov[t].o, occ: K.econRows('OSM').some(x => x.id === 'occ' && x.v > 0), rec: !!K.armRecruit('BYZ', t, 1000).to }; }, sm.t);
        check('occupied, not annexed: the owner keeps the town until peace', oc.o === 'BYZ', oc);
        check('the occupier collects half the taxes (economy row)', oc.occ, oc);
        check('the owner cannot recruit in the occupied town', !oc.rec, oc);
      }
    }

    // capitulation: Albania, every province occupied
    const cap = await E(() => { const K = window.__ke, S = K.S; if (!S.war['ALB|OSM']) K.declareWar('OSM', 'ALB'); S.war['ALB|OSM'].t = S.turn - 35; // capitulation needs a long war
      S.armies = S.armies.filter(a => a.f !== 'ALB'); const ps = S.prov.map((p, i) => p.o === 'ALB' ? i : -1).filter(i => i >= 0); ps.forEach(i => { S.prov[i].ctl = 'OSM'; }); return ps; });
    await L.endTurn(page); await L.closeModals(page);
    const cp = await E(ps => { const S = window.__ke.S; return { alive: S.fac.ALB.alive, owners: ps.map(i => S.prov[i].o), ctl: ps.map(i => S.prov[i].ctl || null) }; }, cap);
    check('a fully occupied realm capitulates to its occupiers', !cp.alive && cp.owners.every(o => o === 'OSM') && cp.ctl.every(c => !c), cp);
  },
};
