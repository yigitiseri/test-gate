'use strict';
// Track B field armies through the real UI (Ottomans): select an army on the map, march it (asel -> tap a
// neighbour -> amove), recruit into it, strengthen / reduce a garrison, disband, split and merge,
// then declare war, fight a field battle and besiege walls (occupation, not ownership). Garrisons never attack; TURN_TRACE holds paths.
module.exports = {
  name: 'b-armies',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const click = async sel => { await page.click(sel, { timeout: 15000 }); await page.waitForTimeout(100); };
    const has = sel => E(s => !!document.querySelector(s), sel);
    const army = id => E(id => { const a = window.__ke.S.armies.find(x => x.id === id); return a ? { ...a } : null; }, id);
    await click('#zoom [data-act="fit"]');
    for (let k = 0; k < 3; k++) await click('#zoom [data-act="zin"]');

    // an Ottoman army whose province and an own neighbour it can reach are both clickable
    const cands = await E(() => { const K = window.__ke, S = K.S, PD = K.PD, out = [];
      for (const a of S.armies.filter(a => a.f === 'OSM')) for (const j of PD[a.loc].adj)
        if (S.prov[j].o === 'OSM' && !PD[a.loc].lanes.includes(j) && K.armyCanMove(a.id, j).ok && !S.armies.some(b => b.loc === j)) out.push([a.id, a.loc, j]);
      return out; });
    let pick = null;
    for (const [id, i, j] of cands) {
      const ci = await L.provPoint(page, i); if (!ci) continue;
      const cj = await L.provPoint(page, j); if (cj) { pick = { id, i, j }; break; }
    }
    check('found a clickable Ottoman army and neighbour', !!pick, cands.slice(0, 3));
    if (!pick) return;
    const a0 = await army(pick.id);
    check('start armies are ready to march', a0.mp === a0.mpMax && a0.mpMax === 2, a0);

    // select the army by tapping its province
    await L.clickProv(page, pick.i);
    check('province tap selects the army there', await has(`#panel .arm.on[data-id="${pick.id}"]`));
    check('armies section lists the cap', /Ordular\s*\d+\/\d+/.test(await E(() => document.querySelector('#panel .armsec h3').textContent)));

    // march to the neighbour
    await L.clickProv(page, pick.j);
    const ord = await E(() => { const s = document.querySelector('#panel [data-sheet="action"]'); return s && s.textContent; });
    check('tapping a neighbour shows the march order (data-sheet=action)', !!ord && /Yürüyüş/.test(ord) && await has('#panel [data-act="amove"]'), ord);
    await click('#panel [data-act="amove"]');
    const a1 = await army(pick.id);
    check('amove marches the army one province', a1.loc === pick.j && a1.mp === a0.mp - 1, a1);
    const tr = await E(id => window.__ke.reg.TURN_TRACE.filter(t => t.army === id).map(t => ({ k: t.k, path: t.path })), pick.id);
    check('TURN_TRACE records the move with its path', tr.some(t => t.k === 'move' && t.path[0] === pick.i && t.path[t.path.length - 1] === pick.j), tr);
    check('the army stays selected after the march', await has(`#panel .arm.on[data-id="${pick.id}"]`));

    // recruit into the selected army
    const g0 = await E(() => window.__ke.S.fac.OSM.gold);
    await click('#panel [data-act="rec1"]');
    const a2 = await army(pick.id), g1 = await E(() => window.__ke.S.fac.OSM.gold);
    const foot = await E(() => window.__ke.units.cost('OSM', 'i', 1000)); // troop types (04i): 1,000 foot
    check('recruit (1,000 foot) joins the selected army and costs the foot price', a2.n === a1.n + 1000 && Math.abs(g0 - g1 - foot) < 1e-6 && foot === 10, { n1: a1.n, n2: a2.n, g0, g1, foot });

    // garrison: reduce to its minimum (two taps), then strengthen
    const gi = await E(j => { const K = window.__ke; return { t: K.S.prov[j].t, max: K.garrisonMax(j) }; }, pick.j);
    await click('#panel [data-act="gdisband"]');
    check('garrison reduction asks for confirmation', (await E(j => window.__ke.S.prov[j].t, pick.j)) === gi.t && /Emin/.test(await E(() => document.querySelector('#panel [data-act="gdisband"]').innerText)));
    await click('#panel [data-act="gdisband"]');
    const gt1 = await E(j => window.__ke.S.prov[j].t, pick.j);
    check('garrison reduced', gt1 < gi.t || gi.t <= 100, { before: gi.t, after: gt1 });
    await click('#panel [data-act="grec"]');
    const gt2 = await E(j => window.__ke.S.prov[j].t, pick.j);
    check('garrison strengthened (up to its maximum)', gt2 === Math.min(gi.max, gt1 + 1000), { gt1, gt2, max: gi.max });

    // disband another Ottoman army (two taps), freeing a slot under the cap
    const other = await E(id => { const K = window.__ke; return K.S.armies.filter(a => a.f === 'OSM' && a.id !== id).map(a => ({ id: a.id, loc: a.loc, n: a.n })); }, pick.id);
    let freed = false;
    for (const o of other) {
      if (!(await L.provPoint(page, o.loc))) continue;
      if (await has('#panel:not([hidden]) [data-act="close"]')) await click('#panel [data-act="close"]');
      await L.clickProv(page, o.loc);
      if (!(await has(`#panel .arm[data-id="${o.id}"]`))) continue;
      await click(`#panel .arm[data-id="${o.id}"]`);
      if (!(await has(`#panel .arm.on[data-id="${o.id}"]`))) await click(`#panel .arm[data-id="${o.id}"]`);
      const mp0 = await E(() => window.__ke.S.fac.OSM.mp), c0 = await E(() => window.__ke.S.armies.filter(a => a.f === 'OSM').length);
      await click('#panel [data-act="adisband"]'); await click('#panel [data-act="adisband"]');
      const mp1 = await E(() => window.__ke.S.fac.OSM.mp), c1 = await E(() => window.__ke.S.armies.filter(a => a.f === 'OSM').length);
      check('disband removes the army and returns manpower', c1 === c0 - 1 && mp1 > mp0 - 1 && !(await army(o.id)), { c0, c1, mp0, mp1 });
      freed = true; break;
    }
    check('found another army to disband', freed);

    // split the first army in two, then merge them back
    if (await has('#panel:not([hidden]) [data-act="close"]')) await click('#panel [data-act="close"]');
    await L.clickProv(page, pick.j);
    if (!(await has(`#panel .arm.on[data-id="${pick.id}"]`))) await click(`#panel .arm[data-id="${pick.id}"]`);
    const nBefore = (await army(pick.id)).n;
    await click('#panel [data-act="asplit"]');
    const split = await E(j => window.__ke.S.armies.filter(a => a.f === 'OSM' && a.loc === j).map(a => a.n), pick.j);
    check('split makes two armies in the province', split.length === 2 && split[0] + split[1] === nBefore, split);
    await click('#panel [data-act="amerge"]');
    const merged = await E(j => window.__ke.S.armies.filter(a => a.f === 'OSM' && a.loc === j).map(a => a.n), pick.j);
    check('merge joins them again', merged.length === 1 && merged[0] === nBefore, merged);

    // war with Byzantium, a field battle and an assault
    await click('#top [data-act="diplo"]');
    await click('#modal [data-act="dp-war"][data-f="BYZ"]'); await click('#modal [data-act="dp-war"][data-f="BYZ"]');
    await L.closeModals(page);
    check('at war with Byzantium', await E(() => !!window.__ke.S.war['BYZ|OSM']));
    const fr = await E(() => { const K = window.__ke, S = K.S, PD = K.PD, out = [];
      for (let t = 0; t < S.prov.length; t++) { if (S.prov[t].o !== 'BYZ' || S.fac.BYZ.cap === t) continue;
        for (const s of PD[t].adj) if (S.prov[s].o === 'OSM' && !PD[s].lanes.includes(t) && !S.armies.some(a => a.loc === s)) out.push([s, t, S.prov[t].fort]); }
      return out.sort((a, b) => a[2] - b[2]); });
    let pair = null;
    for (const [s, t] of fr) if (await L.provPoint(page, s) && await L.provPoint(page, t)) { pair = { s, t }; break; }
    check('found an Ottoman-Byzantine border pair', !!pair, fr.slice(0, 4));
    if (!pair) return;
    const ids = await E(({ s, t }) => { const K = window.__ke; const A = K.armyCreate('OSM', s, 30000, { mp: 2 }), B = K.armyCreate('BYZ', t, 2000, { mp: 2 }); return { A: A.id, B: B.id }; }, pair);
    if (await has('#panel:not([hidden]) [data-act="close"]')) await click('#panel [data-act="close"]');
    await L.clickProv(page, pair.s);
    check('the new army is selected', await has(`#panel .arm.on[data-id="${ids.A}"]`));
    await L.clickProv(page, pair.t);
    const fo = await E(() => { const s = document.querySelector('#panel [data-sheet="action"]'); const o = s && s.querySelector('[data-tip="odds"]'); return { txt: s && s.textContent, odds: !!o, pct: o && /%\d+/.test(o.innerText) }; });
    check('enemy army: field battle order with odds word + % bar (data-tip=odds)', /Meydan muharebesi/.test(fo.txt || '') && fo.odds && fo.pct, fo);
    const nb0 = await E(() => window.__ke.S.battles.length);
    await click('#panel [data-act="amove"]');
    await page.waitForTimeout(200);
    const fb = await E(nb0 => { const K = window.__ke, r = K.S.battles[K.S.battles.length - 1]; return { n: K.S.battles.length - nb0, kind: r.kind, win: r.win, army: r.army, mods: Array.isArray(r.mods), byz: K.S.armies.filter(a => a.f === 'BYZ' && a.id === r.defArmies[0]).map(a => a.loc) }; }, nb0);
    check('field battle fought and won; the Byzantine army retreated or was destroyed', fb.n === 1 && fb.kind === 'field' && fb.win && fb.mods && (fb.byz.length === 0 || fb.byz[0] !== pair.t), fb);
    const aF = await army(ids.A);
    check('attacker holds its ground after a field win in enemy land (mp spent)', aF && aF.loc === pair.s && aF.mp === 0, aF);
    await E(id => { window.__ke.S.armies.find(a => a.id === id).mp = 2; }, ids.A);
    await L.clickProv(page, pair.t);
    const ao = await E(() => { const s = document.querySelector('#panel [data-sheet="action"]'); return s && s.textContent; });
    check('no enemy army: siege order (walls) or assault order (no walls)', /Kuşatma|Hücum/.test(ao || ''), ao);
    await click('#panel [data-act="amove"]');
    await page.waitForTimeout(200);
    const sg = await E(({ t, A }) => { const K = window.__ke, S = K.S, s = S.sieges[t], a = S.armies.find(x => x.id === A); return { fort: S.prov[t].fort, siege: !!s && s.a === A && s.f === 'OSM', st: a && a.st, loc: a && a.loc, ctl: S.prov[t].ctl || null }; }, { t: pair.t, A: ids.A });
    check('the march starts a siege (walls) or occupies at once (no walls)', sg.fort >= 1 ? sg.siege && sg.st === 'siege' && sg.loc === pair.t : sg.ctl === 'OSM', sg);
    if (sg.siege) { await E(t => { const s = window.__ke.S.sieges[t]; s.prog = Math.max(0, s.need - 0.01); }, pair.t); await L.endTurn(page); await L.closeModals(page); }
    const as = await E(({ t, A }) => { const K = window.__ke, a = K.S.armies.find(x => x.id === A); return { owner: K.S.prov[t].o, ctl: K.S.prov[t].ctl || null, loc: a && a.loc, st: a && a.st, gar: K.S.prov[t].t, siege: !!K.S.sieges[t] }; }, { t: pair.t, A: ids.A });
    check('the walls fall: occupied by the Ottomans, still owned by Byzantium; the army moves in and leaves a garrison', as.owner === 'BYZ' && as.ctl === 'OSM' && as.loc === pair.t && as.st === 'idle' && as.gar > 0 && !as.siege, as);
    check('every battle was fought by a field army (garrisons never attack)', await E(() => window.__ke.S.battles.every(b => b.army != null)));
    await L.closeModals(page);

    // end the season: movement points refresh, invariants hold
    if (!sg.siege) { await L.endTurn(page); await L.closeModals(page); }
    check('movement refreshed at the new season', await E(() => window.__ke.S.armies.filter(a => a.f === 'OSM').every(a => a.mp === a.mpMax)));
    check('AI armies exist and obey the cap', await E(() => { const K = window.__ke, c = {}; K.S.armies.forEach(a => c[a.f] = (c[a.f] || 0) + 1); return Object.keys(c).length > 5 && Object.keys(c).every(f => c[f] <= K.armyCap(f)); }));
  },
};
