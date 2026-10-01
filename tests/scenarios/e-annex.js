'use strict';
// Annex: an occupied enemy province the player has held for 4 turns can be annexed from its panel with a real
// click; before that the panel says how many turns are left; capitals cannot be annexed.
module.exports = {
  name: 'e-annex',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const fx = await E(() => { const K = window.__ke, S = K.S, PD = K.PD; K.declareWar('OSM', 'BYZ');
      const t = S.prov.findIndex((p, i) => p.o === 'BYZ' && S.fac.BYZ.cap !== i);
      S.prov[t].ctl = 'OSM'; S.prov[t].ctlT = S.turn; S.armies = S.armies.filter(a => a.loc !== t);
      K.centerOn(PD[t].lx, PD[t].ly, 2.4); K.uiRender(); return { t, cap: S.fac.BYZ.cap }; });
    await page.waitForTimeout(300);
    await L.clickProv(page, fx.t); await page.waitForTimeout(200);
    const p0 = await E(() => ({ sec: !!document.querySelector('#panel .annex-sec'), btn: !!document.querySelector('#panel [data-act="annex"]'), txt: (document.querySelector('#panel .annex-sec') || {}).innerText }));
    check('fresh occupation: the panel says how many turns are left, no annex button yet', p0.sec && !p0.btn && /4 tur/.test(p0.txt), p0);
    await E(t => { const K = window.__ke; K.S.prov[t].ctlT = K.S.turn - 4; K.uiRender(); }, fx.t);
    await page.keyboard.press('Escape'); await L.clickProv(page, fx.t); await page.waitForTimeout(200);
    check('after 4 turns the annex button appears', await E(() => !!document.querySelector('#panel [data-act="annex"]')));
    await page.click('#panel [data-act="annex"]'); await page.waitForTimeout(200);
    const r = await E(t => { const p = window.__ke.S.prov[t]; return { o: p.o, ctl: p.ctl || null }; }, fx.t);
    check('annex makes the province ours', r.o === 'OSM' && !r.ctl, r);
    const cap = await E(c => { const K = window.__ke, S = K.S; S.prov[c].ctl = 'OSM'; S.prov[c].ctlT = S.turn - 10; return K.annex.can(c); }, fx.cap);
    check('a capital cannot be annexed (peace table or long war)', !cap.ok && cap.why === 'capital', cap);
    await E(c => { delete window.__ke.S.prov[c].ctl; delete window.__ke.S.prov[c].ctlT; }, fx.cap);
    // save repair keeps every army of a siege camp besieging (helpers too, not only the leading army)
    const mg = await E(() => { const K = window.__ke, S = K.S, i = S.prov.findIndex((p, k) => p.o === 'BYZ' && !p.ctl && S.fac.BYZ.cap !== k);
      const a = K.armyCreate('OSM', i, 9000, {}), b = K.armyCreate('OSM', i, 5000, {}); a.st = 'siege'; b.st = 'siege';
      S.sieges[i] = { i, f: 'OSM', a: a.id, t0: S.turn, prog: 1, need: 4, sally: 0 }; K.migrate(S);
      const r = [a.st, b.st, !!S.sieges[i]]; delete S.sieges[i]; S.armies = S.armies.filter(x => x !== a && x !== b); return r; });
    check('migrate keeps helper armies in a siege camp', mg[0] === 'siege' && mg[1] === 'siege' && mg[2], mg);
  }
};
