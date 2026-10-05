'use strict';
// Ledger ("Defter"): per-turn history is recorded through hooks (player every turn, others staggered every 4),
// histories stay bounded (halving), wars are logged from declaration to peace / destruction with battle tallies,
// migrate is idempotent, and the modal opens from the State book and the menu with a readable chart.
module.exports = {
  name: 'l-ledger',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const s0 = await E(() => { const S = window.__ke.S; return { lg: !!S.lg, pl: S.lg && S.lg.r.OSM && S.lg.r.OSM.d.length, w: S.lg && S.lg.w.map(w => w.a + '-' + w.b) }; });
    check('new game creates S.lg with the first player sample', s0.lg && s0.pl === 5, s0);
    check('the starting wars are in the war history', s0.w && s0.w.includes('OSM-ALB'), s0.w);

    for (let t = 0; t < 6; t++) { await L.closeModals(page); await L.endTurn(page); }
    await L.closeModals(page);
    const s1 = await E(() => { const S = window.__ke.S, r = S.lg.r, o = Object.keys(r).filter(f => f !== 'OSM');
      return { turn: S.turn, pl: r.OSM.d.length / 5, s: r.OSM.s, others: o.length, strides: [...new Set(o.map(f => r[f].s))], starts: [...new Set(o.map(f => r[f].t))].sort(),
        maxOther: Math.max(...o.map(f => r[f].d.length / 5)) }; });
    check('the player is sampled every turn', s1.pl === s1.turn + 1 && s1.s === 1, s1);
    check('other realms are sampled every 4 turns, staggered', s1.others > 10 && s1.strides.join() === '4' && s1.starts.length === 4 && s1.maxOther <= 2, s1);

    // bounded: with a tiny cap the history halves and the stride doubles, samples stay on the grid
    const h = await E(() => { const K = window.__ke, S = K.S, keep = JSON.stringify(S.lg), t0 = S.turn, B = K.ledger.bal, cp = B.capPl;
      B.capPl = 8; const out = [];
      for (let k = 1; k <= 40; k++) { S.turn = t0 + k; K.ledger.record(); const r = S.lg.r.OSM; out.push([r.d.length / 5, r.s]); }
      const r = S.lg.r.OSM, ser = K.ledger.series('OSM', 'prov'), last = r.t + (r.d.length / 5 - 1) * r.s;
      B.capPl = cp; S.turn = t0; S.lg = JSON.parse(keep);
      return { max: Math.max(...out.map(x => x[0])), s: out[out.length - 1][1], last, t: t0 + 40, n: ser.length }; });
    check('history is capped: halving keeps it small and doubles the stride', h.max <= 8 && h.s >= 8 && h.last <= h.t && h.last > h.t - h.s, h);

    // war: declare, a battle, then peace
    const w = await E(() => { const K = window.__ke, S = K.S, PD = K.PD;
      const cand = Object.keys(S.fac).filter(f => f !== 'OSM' && S.fac[f].alive && !S.war[f < 'OSM' ? f + '|OSM' : 'OSM|' + f]);
      const g = cand.find(f => PD.some(d => S.prov[d.i].o === f && d.adj.some(j => S.prov[j].o === 'OSM'))) || cand[0];
      delete S.truce[g < 'OSM' ? g + '|OSM' : 'OSM|' + g];
      K.declareWar('OSM', g);
      const open = S.lg.w.filter(x => x.e == null && ((x.a === 'OSM' && x.b === g) || (x.a === g && x.b === 'OSM')));
      K.makePeace('OSM', g, { prov: [], gold: 0, release: [] });
      const done = S.lg.w.filter(x => (x.a === 'OSM' && x.b === g) && x.s === S.turn);
      return { g, open: open.length, a: open[0] && open[0].a, done: done.map(x => ({ e: x.e, r: x.r })) }; });
    check('a declared war opens one entry with the attacker first', w.open === 1 && w.a === 'OSM', w);
    check('peace closes the entry (white peace)', w.done.length === 1 && w.done[0].e != null && w.done[0].r === 'w', w);

    // battle tallies follow battleResolved
    const bt = await E(() => { const K = window.__ke, S = K.S, w = S.lg.w.find(x => x.e == null && (x.a === 'OSM' || x.b === 'OSM'));
      if (!w) return { skip: true }; const a0 = w.wa, b0 = w.wb, other = w.a === 'OSM' ? w.b : w.a;
      for (const h of K.reg.HOOKS.battleResolved) h.fn({ att: 'OSM', def: other, win: true, kind: 'field' });
      return { won: (w.a === 'OSM' ? w.wa - a0 : w.wb - b0), lost: (w.a === 'OSM' ? w.wb - b0 : w.wa - a0) }; });
    check('a battle won by the player is counted on its side', bt.skip || (bt.won === 1 && bt.lost === 0), bt);

    // destruction closes the wars of the fallen realm and marks its line
    const x = await E(() => { const K = window.__ke, S = K.S, PD = K.PD;
      const one = Object.keys(S.fac).find(f => f !== 'OSM' && S.fac[f].alive && S.prov.filter(p => p.o === f).length === 1 && S.lg.r[f]);
      if (!one) return { skip: true };
      const i = S.prov.findIndex(p => p.o === one); if (!S.war[one < 'OSM' ? one + '|OSM' : 'OSM|' + one]) { delete S.truce[one < 'OSM' ? one + '|OSM' : 'OSM|' + one]; K.declareWar('OSM', one); }
      K.capture(i, 'OSM');
      const ws = S.lg.w.filter(w => w.a === one || w.b === one);
      return { one, alive: S.fac[one].alive, x: S.lg.r[one].x, open: ws.filter(w => w.e == null).length, fell: ws.some(w => w.r === 'x' && w.q === one), last: K.ledger.series(one, 'prov').slice(-1)[0] }; });
    check('a destroyed realm: its wars close and its line ends at zero', x.skip || (!x.alive && x.x != null && x.open === 0 && x.fell && x.last[1] === 0), x);

    // migrate: an old save without S.lg gets one, and migrate is idempotent
    const m = await E(() => { const K = window.__ke, s = JSON.parse(JSON.stringify(K.S)); delete s.lg; K.migrate(s); const a = JSON.stringify(s); K.migrate(s);
      const b = JSON.stringify(K.S); K.migrate(K.S);
      return { has: !!s.lg && Array.isArray(s.lg.w), wars: s.lg.w.filter(w => w.e == null).length, nWar: Object.keys(s.war).length, same: a === JSON.stringify(s), same2: b === JSON.stringify(K.S) }; });
    check('migrate creates S.lg for an old save (open wars listed)', m.has && m.wars === m.nWar, m);
    check('migrate is idempotent', m.same && m.same2, m);

    // UI: State book -> Ledger
    await L.closeModals(page);
    await page.click('#top [data-act="state"]');
    await page.waitForSelector('#modal:not([hidden]) [data-act="ledger"]');
    await page.click('#modal [data-act="ledger"]');
    await page.waitForSelector('#lgChart svg');
    const u = await E(() => ({ lines: document.querySelectorAll('#lgChart .ln').length, leg: document.querySelectorAll('.lg-leg').length, rank: document.querySelectorAll('.lg-rank tbody tr').length,
      wars: document.querySelectorAll('.lg-war').length, h2: document.querySelector('#modal h2').textContent }));
    check('the ledger opens from the State book with player + 3 rivals', u.lines === 4 && u.leg === 4 && u.h2 === 'Defter', u);
    check('ranking and war history are listed', u.rank >= 10 && u.wars >= 1, u);
    await page.click('#modal [data-act="lg-met"][data-m="prov"]');
    const pv = await E(() => ({ on: document.querySelector('.lg-met.on').dataset.m, lab: document.querySelector('#lgChart svg').getAttribute('aria-label') }));
    check('the metric selector redraws the chart', pv.on === 'prov' && /^Eyalet/.test(pv.lab), pv);
    const b = await (await page.$('#lgChart svg')).boundingBox();
    await page.mouse.move(b.x + b.width * .5, b.y + b.height * .5);
    await page.waitForFunction(() => { const t = document.querySelector('.lg-tip'); return t && !t.hidden && t.querySelectorAll('.r').length >= 2; });
    const tip = await E(() => document.querySelector('.lg-tip').innerText);
    check('hovering the chart shows a readout with every series', /Osmanlı/.test(tip), tip);
    // add a rival from the ranking table
    const before = await E(() => document.querySelectorAll('.lg-leg').length);
    await page.click('.lg-rank tbody tr[data-act="lg-riv"]:not(.on)');
    const after = await E(() => ({ n: document.querySelectorAll('.lg-leg').length, slots: [...document.querySelectorAll('#lgChart .ln')].map(p => p.getAttribute('stroke')) }));
    check('tapping a ranking row adds the realm to the chart in its own colour', after.n === before + 1 && new Set(after.slots).size === after.slots.length, { before, after });
    await page.click('.lg-rank [data-act="lg-sort"][data-k="prov"]');
    const srt = await E(() => [...document.querySelectorAll('.lg-rank tbody tr')].slice(0, 5).map(r => +r.children[2].textContent));
    check('the ranking sorts by provinces', srt.every((v, k) => !k || srt[k - 1] >= v), srt);
    await page.click('#modal [data-act="mclose"]');
    // menu entry
    await page.click('#top [data-act="menu"]');
    await page.waitForSelector('#modal:not([hidden]) [data-act="ledger"]');
    await page.click('#modal [data-act="ledger"]');
    await page.waitForSelector('#lgChart svg');
    check('the ledger opens from the menu', true);
    await page.click('#modal [data-act="mclose"]');
    const sz = await E(() => JSON.stringify(window.__ke.S.lg).length);
    check('the ledger stays small after a few turns', sz < 12000, sz);
  }
};
