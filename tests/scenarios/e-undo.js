'use strict';
// Undo (11k): the ↶ button (or Ctrl+Z) takes back the player's last orders this season: a march, a levy, a building.
// An order that changed nothing leaves nothing to undo; a battle, a diplomatic step or the end of the season
// clears the list, so chance can never be replayed.
module.exports = {
  name: 'e-undo',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    if (await E(() => !!document.querySelector('[data-act="tut-skip"]'))) await page.click('#tutBub [data-act="tut-skip"]');
    const fx = await E(() => { const K = window.__ke, S = K.S, PK = k => K.PD.findIndex(d => d.key === k), from = PK('edirne');
      S.armies = S.armies.filter(a => a.f !== 'OSM'); S.fac.OSM.gold = 900;
      const a = K.armyCreate('OSM', from, 6000, { mp: 2 }), to = K.PD[from].adj.find(j => S.prov[j].o === 'OSM' && !S.armies.some(x => x.loc === j));
      K.centerOn((K.PD[from].lx + K.PD[to].lx) / 2, (K.PD[from].ly + K.PD[to].ly) / 2, 1.6); K.uiRender(); return { id: a.id, from, to }; });
    const btn = () => E(() => { const b = document.getElementById('undoBtn'); return b ? { hidden: b.hidden, title: b.title } : null; });
    check('no undo before any order', (await btn()).hidden === true, await btn());
    // march
    await L.clickProv(page, fx.from); await page.waitForTimeout(150);
    await L.clickProv(page, fx.to); await page.waitForTimeout(150);
    await page.click('#panel [data-act="amove"]'); await page.waitForTimeout(200);
    const m1 = await E(f => { const a = window.__ke.S.armies.find(x => x.id === f.id); return { loc: a.loc, mp: a.mp, n: window.__ke.undo.n() }; }, fx);
    const b1 = await btn();
    check('a march can be undone: the ↶ button appears and names it', m1.loc === fx.to && m1.n === 1 && !b1.hidden && /Ordu yürüdü/.test(b1.title), { m1, b1 });
    // a levy on top of it
    if (await E(() => document.getElementById('panel').hidden)) await L.clickProv(page, fx.to);
    const g0 = await E(() => window.__ke.S.fac.OSM.gold);
    await E(() => document.querySelector('#panel [data-act="rec1"]').click()); await page.waitForTimeout(200);
    const m2 = await E(f => ({ n: window.__ke.S.armies.find(x => x.id === f.id).n, gold: window.__ke.S.fac.OSM.gold, u: window.__ke.undo.labels() }), fx);
    check('a levy stacks a second undo', m2.n === 7000 && m2.gold < g0 && m2.u.join() === 'amove,rec1', m2);
    await page.click('#undoBtn'); await page.waitForTimeout(200);
    const u1 = await E(f => { const S = window.__ke.S, a = S.armies.find(x => x.id === f.id); return { n: a.n, loc: a.loc, gold: S.fac.OSM.gold, left: window.__ke.undo.n() }; }, fx);
    check('↶ takes back the levy: men and gold return, the march stays', u1.n === 6000 && u1.gold === g0 && u1.loc === fx.to && u1.left === 1, { u1, g0 });
    await page.keyboard.press('Control+z'); await page.waitForTimeout(200);
    const u2 = await E(f => { const S = window.__ke.S, a = S.armies.find(x => x.id === f.id); return { loc: a.loc, mp: a.mp, left: window.__ke.undo.n(), hidden: document.getElementById('undoBtn').hidden }; }, fx);
    check('Ctrl+Z takes back the march: the army is home with its moves', u2.loc === fx.from && u2.mp === 2 && u2.left === 0 && u2.hidden, u2);
    // an order that changes nothing (not enough gold) leaves no undo
    await E(() => { window.__ke.S.fac.OSM.gold = 0; window.__ke.uiRender(); });
    await L.clickProv(page, fx.from); await page.waitForTimeout(150);
    const dis = await E(() => { const b = document.querySelector('#panel [data-act="bmkt"]'); if (b) { b.disabled = false; b.click(); } return !!b; });
    const n0 = await E(() => window.__ke.undo.n());
    check('an order that changed nothing leaves nothing to undo', !dis || n0 === 0, { dis, n0 });
    // a battle clears the list
    const bt = await E(f => { const K = window.__ke, S = K.S; S.fac.OSM.gold = 900; return f; }, fx);
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    await L.clickProv(page, fx.from); await page.waitForTimeout(150);
    await L.clickProv(page, fx.to); await page.waitForTimeout(150);
    await page.click('#panel [data-act="amove"]'); await page.waitForTimeout(200);
    const before = await E(() => window.__ke.undo.n());
    await E(() => { const K = window.__ke, S = K.S, a = S.armies.find(x => x.f === 'OSM'); K.runHooks('battleResolved', { att: 'OSM', def: 'BYZ', win: true }); K.uiRender(); });
    const after = await E(() => ({ n: window.__ke.undo.n(), hidden: document.getElementById('undoBtn').hidden }));
    check('a battle of the player clears the undo list', before === 1 && after.n === 0 && after.hidden, { before, after });
    // the end of the season clears it too
    if (await E(() => document.getElementById('panel').hidden)) await L.clickProv(page, fx.to);
    await E(() => document.querySelector('#panel [data-act="rec1"]').click()); await page.waitForTimeout(150);
    const pre = await E(() => window.__ke.undo.n());
    await L.endTurn(page); await L.closeModals(page);
    const post = await E(() => window.__ke.undo.n());
    check('ending the season clears the undo list', pre === 1 && post === 0, { pre, post });
  }
};
