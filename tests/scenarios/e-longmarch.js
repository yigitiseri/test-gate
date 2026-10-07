'use strict';
// Long march (04h, 11j): with an army selected, tapping a province it cannot reach this season offers a long march;
// the army marches as far as it can at once and then on its own at the end of every turn until it arrives. A manual
// order ends the march; an enemy army at the destination makes it halt next to it; a closed road stops it.
module.exports = {
  name: 'e-longmarch',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    if (await E(() => !!document.querySelector('[data-act="tut-skip"]'))) await page.click('#tutBub [data-act="tut-skip"]');
    const fx = await E(() => {
      const K = window.__ke, S = K.S, PK = k => K.PD.findIndex(d => d.key === k), from = PK('edirne');
      S.armies = S.armies.filter(a => a.f !== 'OSM');
      const a = K.armyCreate('OSM', from, 10000, { mp: 2 });
      let to = -1, len = 0;
      for (let i = 0; i < S.prov.length; i++) { if (S.prov[i].o !== 'OSM') continue; const p = K.armyPath(a.id, i); if (p && p.length >= 5 && p.length <= 8) { to = i; len = p.length; break; } }
      const mx = (K.PD[from].lx + K.PD[to].lx) / 2, my = (K.PD[from].ly + K.PD[to].ly) / 2; K.centerOn(mx, my, 1.1);
      return { id: a.id, from, to, len };
    });
    check('a destination five to eight provinces away exists', fx.to >= 0, fx);
    await L.clickProv(page, fx.from); await page.waitForTimeout(150);
    await L.clickProv(page, fx.to); await page.waitForTimeout(150);
    const offer = await E(() => { const b = document.querySelector('#panel [data-act="adest"]'), s = b && b.closest('.sec'); return { btn: !!b, text: s ? s.textContent.replace(/\s+/g, ' ') : '', far: window.__ke.farTgt() }; });
    check('tapping a far province offers a long march with its length in seasons', offer.btn && /Uzun sefer/.test(offer.text) && /mevsim/.test(offer.text) && offer.far === fx.to, offer);
    await page.click('#panel [data-act="adest"]'); await page.waitForTimeout(150);
    const s1 = await E(f => { const a = window.__ke.S.armies.find(x => x.id === f.id); return { dest: a.dest, loc: a.loc, mp: a.mp, left: (a.path || []).length }; }, fx);
    check('setting out marches as far as the army can this season', s1.dest === fx.to && s1.loc !== fx.from && s1.mp === 0 && s1.left === fx.len - 2, s1);
    const sec = await E(() => { const s = [...document.querySelectorAll('#panel .sec h3')].map(h => h.textContent).join(' | '); return s; });
    check('the panel shows the army on the march', /Seferde/.test(sec), sec);
    // two real turns: the first ends with no points left, the second marches on by itself
    await L.endTurn(page); await L.closeModals(page); await L.endTurn(page); await L.closeModals(page);
    const s2 = await E(f => { const a = window.__ke.S.armies.find(x => x.id === f.id); return a ? { dest: a.dest, loc: a.loc, left: (a.path || []).length } : null; }, fx);
    check('at the end of a turn the army marches on by itself', s2 && (s2.left < s1.left || s2.loc === fx.to), { s1, s2 });
    const s3 = await E(f => { const K = window.__ke, S = K.S, a = S.armies.find(x => x.id === f.id); let r = null;
      // the AI may have moved in meanwhile: keep the destination ours and clear of enemies for this check
      S.prov[f.to].o = 'OSM'; delete S.prov[f.to].ctl; S.armies = S.armies.filter(x => x.f === 'OSM' || x.loc !== f.to); S.news = []; if (a.dest == null && a.loc !== f.to) K.march.set(a.id, f.to);
      for (let k = 0; k < 10 && a.dest != null; k++) { a.mp = a.mpMax; r = K.march.step(a.id); }
      return { to: f.to, dest: a.dest, loc: a.loc, r, news: S.news.map(n => n.m).join(' | ') }; }, fx);
    check('the army arrives and the march ends with a note', s3.loc === fx.to && s3.dest == null && (/vardı/.test(s3.news) || s2.loc === fx.to), s3);
    // a manual order ends the march
    const nb = await E(f => { const K = window.__ke, S = K.S, a = S.armies.find(x => x.id === f.id); K.march.set(a.id, f.from); a.mp = 2;
      const n = K.PD[a.loc].adj.find(j => S.prov[j].o === 'OSM' && K.armyCanMove(a.id, j).ok); K.centerOn(K.PD[a.loc].lx, K.PD[a.loc].ly, 1.6); return { loc: a.loc, n, dest: a.dest }; }, fx);
    if (nb.n != null && nb.dest != null) {
      await L.clickProv(page, nb.loc); await page.waitForTimeout(150);
      if (!(await E(id => !!document.querySelector(`#panel .arm.on[data-id="${id}"]`), fx.id))) await page.click(`#panel .arm[data-id="${fx.id}"]`);
      await L.clickProv(page, nb.n); await page.waitForTimeout(150);
      await page.click('#panel [data-act="amove"]'); await page.waitForTimeout(150);
      const m = await E(f => { const a = window.__ke.S.armies.find(x => x.id === f.id); return { dest: a.dest, loc: a.loc }; }, fx);
      check('a manual order to the army ends its long march', m.dest == null && m.loc === nb.n, { nb, m });
    } else check('a manual order to the army ends its long march (setup)', false, nb);
    // an enemy army at the destination: halt next to it, the player decides
    const h = await E(f => { const K = window.__ke, S = K.S, a = S.armies.find(x => x.id === f.id);
      const r0 = S.prov.findIndex((p, i) => p.o === 'OSM' && i !== a.loc && (K.armyPath(a.id, i) || []).length >= 3);
      const tgt = r0; S.armies.filter(x => x.loc === tgt && x.id !== a.id).forEach(x => S.armies.splice(S.armies.indexOf(x), 1));
      if (!K.S.war || !Object.keys(K.S.war).some(k => /KAR/.test(k))) K.declareWar('OSM', 'KAR');
      const foe = K.armyCreate('KAR', tgt, 3000, { mp: 0 }); S.news = [];
      K.march.set(a.id, tgt); let r = 'x'; for (let k = 0; k < 10 && a.dest != null; k++) { a.mp = a.mpMax; r = K.march.step(a.id); }
      const adj = K.PD[tgt].adj.includes(a.loc); S.armies.splice(S.armies.indexOf(foe), 1);
      return { tgt, r, loc: a.loc, adj, dest: a.dest, news: S.news.map(n => n.m).join(' | ') }; }, fx);
    check('with an enemy army at the destination the army halts next to it and leaves the attack to the player', h.adj && h.dest == null && /karar/.test(h.news), h);
    // the road closes: the march stops with a note
    const c = await E(f => { const K = window.__ke, S = K.S, a = S.armies.find(x => x.id === f.id);
      const t = S.prov.findIndex((p, i) => p.o === 'OSM' && (K.armyPath(a.id, i) || []).length >= 3); a.mp = 0; K.march.set(a.id, t);
      const keep = S.prov[t].o; S.prov[t].o = 'VEN'; S.news = []; a.mp = a.mpMax; const r = K.march.step(a.id); S.prov[t].o = keep;
      return { r, dest: a.dest, news: S.news.map(n => n.m).join(' | ') }; }, fx);
    check('a closed road stops the march with a note', c.r === 'stopped' && c.dest == null && /yolu kapandı/.test(c.news), c);
  }
};
