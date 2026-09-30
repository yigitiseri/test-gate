'use strict';
// Track D (Wave 2): turn-flow warnings and the world's fear.
// - Armies awaiting orders at war: chip under the top bar + badge on End Turn; a tap jumps to the army; never blocks the turn.
// - Envoys: the inbox chip opens the Season Report with the offer.
// - Aggressive expansion: the State Ledger meter; a coalition forms against a feared realm (the player too),
//   its members declare war together and hold the war for the first seasons; the Divan marks the members.
module.exports = {
  name: 'd-turnflow',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const W = ms => page.waitForTimeout(ms);
    await E(() => { const b = document.querySelector('#tutBub [data-act="tut-skip"]'); if (b && !document.getElementById('tutBub').hidden) b.click(); });
    await E(() => window.__ke.uiRender()); await W(200);
    let f = await E(() => window.__ke.uiFlow());
    check('at war (Albania) with unmoved armies: the idle chip and the End Turn badge show', f.shown && f.idle.length >= 1 && f.badge === String(f.idle.length), f);
    const box = await E(() => { const r = document.querySelector('#uiFlow .fl-idle').getBoundingClientRect(), t = document.getElementById('top').getBoundingClientRect(); return { h: r.height, top: r.top, tb: t.bottom }; });
    check('chip is a real tap target below the top bar', box.h >= 44 && box.top >= box.tb, box);
    await page.click('#uiFlow .fl-idle'); await W(250);
    const foc = await E(() => { const K = window.__ke, S = K.S, a = S.armies.find(x => x.id === K.uiFlow().idle[0]); return { panel: !document.getElementById('panel').hidden }; });
    check('tapping the chip opens the waiting army', foc.panel);
    // march every idle army one step inside its own land: the warning goes away
    await E(() => { const K = window.__ke, S = K.S; for (const id of K.uiFlow().idle) { const a = S.armies.find(x => x.id === id); const j = K.PD[a.loc].adj.find(j => S.prov[j].o === 'OSM' && !S.prov[j].ctl); if (j != null) K.armyMove(id, j); } K.uiRender(); });
    await W(150);
    f = await E(() => window.__ke.uiFlow());
    check('armies that marched no longer count', f.idle.length === 0 && !f.badge, f);
    // the warning never blocks: one press ends the turn even with idle armies
    await E(() => { const K = window.__ke; K.S.fac.OSM.gold = 900; K.uiRender(); });
    const t0 = await E(() => window.__ke.S.turn);
    await page.click('#endTurn');
    await page.waitForFunction(t => window.__ke.S.turn > t && !document.getElementById('endTurn').disabled, t0, { timeout: 120000 });
    await L.closeModals(page); await W(200);
    check('one press on End Turn ends the turn', (await E(() => window.__ke.S.turn)) === t0 + 1);

    // envoy inbox
    await E(() => { const K = window.__ke, S = K.S, w = S.war['ALB|OSM']; if (w) { S.offers.push({ f: 'ALB', type: 'peace', wt: w.t, t0: S.turn }); } K.uiRender(); });
    f = await E(() => window.__ke.uiFlow());
    const hasWar = await E(() => !!window.__ke.S.war['ALB|OSM']);
    if (hasWar) {
      check('an envoy shows in the inbox chip', f.inbox === 1 && f.shown, f);
      await page.click('#uiFlow .fl-inbox'); await W(250);
      check('the inbox opens the report with the offer', await E(() => !document.getElementById('modal').hidden && !!document.querySelector('#modal [data-act="off"]')));
      await L.closeModals(page);
    }

    // AE meter in the State Ledger
    await E(() => { window.__ke.S.ae.OSM = 42; });
    await page.click('#navTabs [data-act="state"]').catch(async () => { await E(() => window.__ke.reg.ACTS.state()); });
    await W(200);
    if (await E(() => document.getElementById('modal').hidden)) await E(() => window.__ke.reg.ACTS.state());
    const led = await E(() => { const x = document.querySelector('#modal .ui-ae'); return x ? x.innerText : null; });
    check('the State Ledger shows the neighbours\' unease', !!led && /70%/.test(led), led);
    await L.closeModals(page);

    // coalition against the player
    const r = await E(async () => {
      const K = window.__ke, S = K.S, sleep = ms => new Promise(r => setTimeout(r, ms));
      S.ae.OSM = 250; let t = 0;
      while (!(K.aiCoal().OSM && K.aiCoal().OSM.m && K.aiCoal().OSM.m.length) && t++ < 4) {
        K.endTurn(); for (let w = 0; w < 20000; w++) { await sleep(2); if (!document.getElementById('endTurn').disabled) break; }
        for (let k = 0; k < 20; k++) { const m = document.getElementById('modal'); if (m.hidden) break; const b = m.querySelector('[data-act=ev]:not([disabled])') || m.querySelector('[data-act=off][data-v="0"]') || m.querySelector('[data-act=mclose]'); if (!b) break; b.click(); }
        S.ae.OSM = Math.max(S.ae.OSM, 250);
      }
      const C = K.aiCoal().OSM;
      return C && C.m ? { m: C.m, t: C.t, war: C.m.every(g => !!S.war[[g, 'OSM'].sort().join('|')]), pl: C.m.includes(S.player), news: S.log.slice(-40).some(l => /Koalisyon/.test(l.m)) } : null;
    });
    check('a coalition forms against a feared player', !!r && r.m.length >= 2, r);
    check('its members declare war together; the player is never drafted', r && r.war && !r.pl, r);
    check('the player is told', r && r.news, r);
    await L.closeModals(page); await E(() => window.__ke.reg.ACTS.diplo()); await W(250);
    check('the Divan marks coalition members', await E(() => /Koalisyonda/.test(document.getElementById('modal').textContent)));
    await L.closeModals(page);
    const lock = await E(g => { const K = window.__ke, S = K.S; return { lock: S.turn - K.aiCoal().OSM.t < K.BAL_D.coalLock }; }, r && r.m[0]);
    check('coalition members hold the war in its first seasons (lock active)', lock.lock, lock);
    check('migrate stays idempotent', await E(() => { const K = window.__ke, a = JSON.stringify(K.S); K.migrate(K.S); return JSON.stringify(K.S) === a; }));
  },
};
