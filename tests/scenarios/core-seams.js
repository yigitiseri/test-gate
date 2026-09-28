'use strict';
// The W0 seams: registries, top bar from TOP_BUTTONS, hook order, presenter watchdog, army data API,
// BATTLE_MODS in battle reports and odds, ECON_ROWS in the state book, fit button, seeded RNG.
module.exports = {
  name: 'core-seams',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    // every data-act on screen has an ACTS handler
    const acts = await E(() => [...new Set([...document.querySelectorAll('[data-act]')].map(b => b.dataset.act))].filter(a => !window.__ke.reg.ACTS[a]));
    check('every visible data-act has an ACTS handler', acts.length === 0, acts);
    const nav = await E(() => [...document.querySelectorAll('#navTabs [data-act]')].map(b => b.dataset.act).join());
    check('top bar built from TOP_BUTTONS', nav === 'diplo,missions,chron,guide,snd,menu', nav);
    check('#hud and #card slots exist', await E(() => !!document.getElementById('hud') && document.getElementById('card').hidden));

    // fit button recentres the map (bug B1)
    await page.mouse.move(700, 450); await page.mouse.down();
    for (let s = 1; s <= 8; s++) await page.mouse.move(700 + s * 60, 450 + s * 40);
    await page.mouse.up(); await page.waitForTimeout(100);
    await page.click('#zoom [data-act="fit"]'); await page.waitForTimeout(150);
    const c = await E(() => { const K = window.__ke, p = K.proj(K.W / 2, K.H / 2), th = document.getElementById('top').getBoundingClientRect().bottom; return { dx: p[0] - innerWidth / 2, dy: p[1] - (th + (innerHeight - th) / 2) }; });
    check('fit centres the map', Math.abs(c.dx) < 3 && Math.abs(c.dy) < 3, c);

    // hook order around endTurn
    await E(() => {
      const K = window.__ke; window.__log = [];
      for (const [n, o] of [['turnStart', 50], ['roundEnd', 5], ['roundEnd', 45], ['roundEnd', 99], ['newTurn', 50], ['afterRound', 50], ['events', 99]])
        K.hook(n, () => window.__log.push(n + o + '@' + K.S.turn), o);
      K.hook('preAI', f => { window.__pre = (window.__pre || 0) + 1; });
      K.reg.PRESENTERS.push({ id: 'test-stuck', order: 60, run() { window.__stuck = 1; } }); // never calls next()
    });
    const t0 = await E(() => window.__ke.S.turn);
    const ms0 = Date.now();
    await L.endTurn(page);
    const took = Date.now() - ms0;
    const log = await E(() => window.__log.join());
    const exp = [`turnStart50@${t0}`, `roundEnd5@${t0}`, `roundEnd45@${t0}`, `roundEnd99@${t0}`, `newTurn50@${t0 + 1}`, `afterRound50@${t0 + 1}`].join();
    check('hook order turnStart < roundEnd slots < newTurn < afterRound', log.startsWith(exp), log);
    check('preAI fired for every AI faction', await E(() => window.__pre === Object.keys(window.__ke.S.fac).filter(f => f !== window.__ke.S.player && window.__ke.S.fac[f].alive).length || window.__pre > 10));
    check('stuck presenter released by the 6 s watchdog', (await E(() => window.__stuck === 1)) && took >= 5500 && took < 30000, took);
    await L.closeModals(page);
    await E(() => { const P = window.__ke.reg.PRESENTERS; P.splice(P.findIndex(p => p.id === 'test-stuck'), 1); });

    // battle reports carry modifiers; TURN_TRACE holds this turn's battles
    for (let k = 0; k < 6 && !(await E(() => window.__ke.reg.TURN_TRACE.length)); k++) {
      await E(() => { const K = window.__ke; K.aiTurn(K.S.player); }); await L.endTurn(page); await L.closeModals(page);
    }
    const tr = await E(() => window.__ke.reg.TURN_TRACE.map(t => ({ k: t.k, mods: Array.isArray(t.rep.mods), roll: !!t.rep.roll, kind: t.rep.kind })));
    check('TURN_TRACE records battles with rep.mods/roll/kind', tr.length > 0 && tr.every(t => t.k === 'battle' && t.mods && t.roll && t.kind === 'assault'), tr.slice(0, 3));

    // battleOdds from BATTLE_MODS
    const od = await E(() => { const K = window.__ke, S = K.S, PD = K.PD, ist = PD.findIndex(d => d.key === 'istanbul');
      const o = K.battleOdds({ att: 'OSM', to: ist, n: 20000 }), big = K.battleOdds({ att: 'OSM', to: ist, n: 2000000 });
      return { p: o.p, big: big.p, fort: o.mods.some(m => m.k === 'fort' && m.side === 'def' && /Kale/.test(m.l)), fortLv: S.prov[ist].fort }; });
    check('battleOdds gives a probability with the fort modifier', od.p >= 0 && od.p <= 1 && od.big > .99 && (od.fort || od.fortLv === 0), od);

    // army data API
    const ar = await E(() => { const K = window.__ke, S = K.S, cap = S.fac.OSM.cap, s0 = S.armies.length, seq = S.seq;
      let fired = 0; K.hook('armyCreated', () => fired++);
      const a = K.armyCreate('OSM', cap, 3000); return { id: a.id, seq0: seq, seq: S.seq, n: S.armies.length - s0, list: K.armyList('OSM').length, fired, st: a.st, mpMax: a.mpMax }; });
    check('armyCreate/armyList + armyCreated hook', ar.n === 1 && ar.id === ar.seq0 && ar.seq === ar.seq0 + 1 && ar.list >= 1 && ar.fired === 1 && ar.st === 'idle' && ar.mpMax === 2, ar);

    // ECON_ROWS in the state book
    await page.click('#facBtn'); await page.waitForTimeout(100);
    const led = await E(() => document.querySelector('#modal .ledger') && document.querySelector('#modal .ledger').innerText);
    check('state book ledger from ECON_ROWS', !!led && /Eyalet vergileri/.test(led) && /Ordu maaşları/.test(led) && /Tur başına net/.test(led), led);
    await page.click('#modal [data-act="mclose"]');

    // seeded RNG: the same seed replays the same game
    const play = async () => {
      await E(() => { const K = window.__ke; K.seed(12345); K.beginGame('HUN'); });
      await L.closeModals(page);
      for (let t = 0; t < 4; t++) { await E(() => { const K = window.__ke; K.aiTurn(K.S.player); }); await L.endTurn(page); await L.closeModals(page); }
      return E(() => JSON.stringify(window.__ke.S));
    };
    const a = await play(), b = await play();
    check('same seed, same game (4 turns)', a === b, a.length + ' vs ' + b.length);
  },
};
