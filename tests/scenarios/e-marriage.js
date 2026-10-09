'use strict';
// Deeper diplomacy (12h): a royal marriage for a dowry when relations allow (faith matters); joined houses keep good
// relations and the AI is slower to attack; war breaks the marriage. An ally answers a call to arms from relations,
// its wars and the foe's might; a refusal waits before the same request can be made again.
module.exports = {
  name: 'e-marriage',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    if (await E(() => !!document.querySelector('[data-act="tut-skip"]'))) await page.click('#tutBub [data-act="tut-skip"]');
    const fx = await E(() => { const K = window.__ke, S = K.S, key = (a, b) => a < b ? a + '|' + b : b + '|' + a; S.fac.OSM.gold = 500;
      const mus = K.FK ? null : null; const pick = ['KAR', 'DUL', 'CAN'].find(f => S.fac[f].alive && !Object.keys(S.war).includes(key('OSM', f)));
      S.op[key('OSM', pick)] = 15; S.op[key('OSM', 'VEN')] = 15; return { pick, can: K.mar.can(pick), ven: K.mar.can('VEN') }; });
    check('a fellow Muslim realm at +15 would marry; a Christian one needs warmer relations', fx.can.ok && !fx.ven.ok && fx.ven.why === 'op' && fx.ven.need === 40, fx);
    await page.click('[data-act="diplo"]'); await page.waitForTimeout(200);
    const btn = await E(f => { const b = document.querySelector(`#modal [data-act="dp-marry"][data-f="${f}"]`), v = document.querySelector('#modal [data-act="dp-marry"][data-f="VEN"]'); return { b: !!b && !b.disabled, v: !!v && v.disabled, vt: v && v.title }; }, fx.pick);
    check('the diplomacy window offers the marriage (and says why not for Venice)', btn.b && btn.v && /40/.test(btn.vt), btn);
    await page.click(`#modal [data-act="dp-marry"][data-f="${fx.pick}"]`); await page.waitForTimeout(200);
    const m = await E(f => { const K = window.__ke, S = K.S, key = (a, b) => a < b ? a + '|' + b : b + '|' + a; return { link: K.mar.link('OSM', f), gold: S.fac.OSM.gold, op: S.op[key('OSM', f)], chip: !!document.querySelector('#modal .chip.mar') }; }, fx.pick);
    check('the marriage is made: dowry paid, relations up, a chip in the window', m.link && m.gold === 460 && m.op === 40 && m.chip, m);
    const fl = await E(f => { const K = window.__ke, S = K.S, key = (a, b) => a < b ? a + '|' + b : b + '|' + a; S.op[key('OSM', f)] = 0; K.runHooks('newTurn'); const a = S.op[key('OSM', f)]; for (let k = 0; k < 20; k++) K.runHooks('newTurn'); return { a, b: S.op[key('OSM', f)] }; }, fx.pick);
    check('joined houses climb back to good relations', fl.a > 0 && fl.b >= 25, fl);
    await L.closeModals(page);
    const wr = await E(f => { const K = window.__ke; K.declareWar('OSM', f); return { link: K.mar.link('OSM', f), log: K.S.log.slice(-6).map(e => e.m).join(' | ') }; }, fx.pick);
    check('war breaks the marriage', !wr.link && /koptu/.test(wr.log), wr);
    // call to arms
    const ct = await E(f => { const K = window.__ke, S = K.S, key = (a, b) => a < b ? a + '|' + b : b + '|' + a;
      const ally = ['MAM', 'AKK', 'KKY'].find(a => S.fac[a].alive && a !== f && !Object.keys(S.war).some(k => k.split('|').includes(a)) && !S.ally[key(a, f)]);
      S.ally[key('OSM', ally)] = true; S.op[key('OSM', ally)] = 10;
      const no = K.mar.cta(ally, f); const again = K.mar.ctaCan(ally, f);
      S.cta = {}; S.op[key('OSM', ally)] = 60; const yes = K.mar.cta(ally, f);
      return { ally, no, again, yes, war: !!S.war[key(ally, f)] }; }, fx.pick);
    check('a cold ally refuses and the request must wait', !ct.no.ok && ct.no.why === 'op' && ct.again.why === 'wait', ct);
    check('a friendly ally answers the call and declares war', ct.yes.ok && ct.war, ct);
  }
};
