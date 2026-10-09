'use strict';
// Track B W2 treaties: the "Barış Masası" (Peace Table) prices a basket of occupied provinces / gold in war score;
// the verdict follows aiAcceptBasket; a refused basket keeps the war; the best offer is accepted and cedes the
// provinces (no loot), clears every occupation and gives a truce. AI-AI peace (makePeace without terms) cedes what
// the winner occupies. Envoy offers show their terms, appear in one report only and expire after 2 turns (bug B2).
module.exports = {
  name: 'b-peace-table',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const has = sel => page.evaluate(s => !!document.querySelector(s), sel);
    const click = async sel => { await page.waitForSelector(sel, { timeout: 30000 }); await E(s => document.querySelector(s).click(), sel); await page.waitForTimeout(60); };
    await click('#top [data-act="diplo"]');
    await click('#modal [data-act="dp-war"][data-f="BYZ"]'); await click('#modal [data-act="dp-war"][data-f="BYZ"]');
    await L.closeModals(page);
    const set = await E(() => { const K = window.__ke, S = K.S, w = S.war['BYZ|OSM'];
      const ps = S.prov.map((p, i) => i).filter(i => S.prov[i].o === 'BYZ' && S.fac.BYZ.cap !== i).slice(0, 2);
      ps.forEach(i => { S.prov[i].ctl = 'OSM'; }); w.sc.OSM = 6; w.sc.BYZ = 0; S.fac.BYZ.gold = 200;
      window.__peace = []; K.hook('peace', (a, b, t) => window.__peace.push({ a, b, t }));
      return { ps, goal: w.goal, gold0: S.fac.OSM.gold, lim: K.peaceLimit('BYZ', 'OSM') }; });
    check('the war has a goal (claim on a border province)', set.goal && set.goal.k === 'claim' && set.goal.f === 'OSM' && set.goal.prov >= 0, set.goal);
    await click('#top [data-act="diplo"]');
    check('Divan shows the Peace Table button and exhaustion', await has('#modal [data-act="dp-peace"][data-f="BYZ"]') && /Yorgunluk/.test(await E(() => document.getElementById('modal').textContent)));
    await click('#modal [data-act="dp-peace"][data-f="BYZ"]');
    const t0 = await E(() => ({ eb: document.querySelector('#modal .eyebrow').textContent, items: [...document.querySelectorAll('#modal [data-act="pt-prov"]')].map(b => +b.dataset.i) }));
    check('the Peace Table opens with both occupied provinces', /Barış Masası/.test(t0.eb) && set.ps.every(i => t0.items.includes(i)), t0);
    // too greedy: all the gold they have and more than the limit
    for (let k = 0; k < 8; k++) if (await has('#modal [data-act="pt-gold"][data-d="25"]:not([disabled])')) await click('#modal [data-act="pt-gold"][data-d="25"]');
    for (const i of set.ps) await click(`#modal [data-act="pt-prov"][data-i="${i}"]`);
    const g = await E(() => ({ verdict: document.querySelector('#modal .ptsum .verdict').textContent, no: !!document.querySelector('#modal .ptsum.no') }));
    check('a greedy basket: the table predicts refusal', g.no && /Reddederler/.test(g.verdict), g);
    await click('#modal [data-act="pt-send"]');
    check('refused: still at war, the table stays open', await E(() => !!window.__ke.S.war['BYZ|OSM']) && await has('#modal [data-act="pt-send"]'));
    await click('#modal [data-act="pt-auto"]');
    const auto = await E(() => { const on = [...document.querySelectorAll('#modal [data-act="pt-prov"][aria-pressed="true"]')].map(b => +b.dataset.i); return { on, ok: !!document.querySelector('#modal .ptsum.ok') }; });
    check('"Best offer" fills an acceptable basket with occupied land', auto.ok && auto.on.length >= 1, auto);
    await click('#modal [data-act="pt-send"]');
    const done = await E(ps => { const K = window.__ke, S = K.S; const p = window.__peace[window.__peace.length - 1];
      return { war: !!S.war['BYZ|OSM'], truce: (S.truce['BYZ|OSM'] || 0) > S.turn, owners: ps.map(i => S.prov[i].o), ctl: ps.map(i => S.prov[i].ctl || null), terms: p && p.t, modal: !document.getElementById('modal').hidden }; }, set.ps);
    check('the treaty is signed: war over, truce', !done.war && done.truce, done);
    check('ceded provinces change owner; the others are handed back (no occupation left)', done.owners.filter(o => o === 'OSM').length === auto.on.length && done.ctl.every(c => !c), done);
    check('peace hook carries the terms', done.terms && done.terms.taker === 'OSM' && done.terms.prov.length === auto.on.length, done.terms);

    // AI-AI: the winner takes what it occupies
    const ai = await E(() => { const K = window.__ke, S = K.S; if (!S.war['HUN|SRB']) K.declareWar('HUN', 'SRB');
      const i = S.prov.findIndex((p, k) => p.o === 'SRB' && S.fac.SRB.cap !== k); S.prov[i].ctl = 'HUN'; S.war['HUN|SRB'].sc.HUN = 8;
      const v = K.peaceValue({ prov: [i] }, 'HUN', 'SRB'), acc = K.aiAcceptBasket('SRB', 'HUN', { prov: [i] });
      K.makePeace('SRB', 'HUN'); const p = window.__peace[window.__peace.length - 1];
      return { i, owner: S.prov[i].o, v, acc, taker: p.t.taker, prov: p.t.prov }; });
    check('AI-AI peace without terms: the winner keeps the occupied province (cession)', ai.owner === 'HUN' && ai.taker === 'HUN' && ai.prov.includes(ai.i) && ai.acc, ai);

    // envoys: terms shown, one report only, gone after 2 turns
    await E(() => { const K = window.__ke, S = K.S; K.declareWar('OSM', 'VEN'); S.fac.VEN.nextOffer = S.turn + 20; S.offers.push({ f: 'VEN', type: 'peace', wt: S.war['OSM|VEN'].t }); });
    await L.endTurn(page);
    // decrees that come before the report (e.g. "annex or keep occupied?"): keep occupied
    // (under load the decrees and the report may come late: wait for the report, answering decrees as they come)
    for (let k = 0; k < 80; k++) { const st = await E(() => { const m = document.getElementById('modal'); if (!m.hidden && m.querySelector('[data-act="off"][data-f="VEN"]')) return 'rep';
        const ev = !m.hidden && m.querySelector('[data-act="ev"][data-k="0"]:not([disabled])'); if (ev) { ev.click(); return 'ev'; } return 'wait'; });
      if (st === 'rep') break; await page.waitForTimeout(st === 'ev' ? 150 : 250); }
    const rep1 = await E(() => { const m = document.getElementById('modal'); const row = m.querySelector('[data-act="off"][data-f="VEN"]'); const t = m.querySelector('.row.offer .terms'); return { row: !!row, terms: t && t.textContent, t0: window.__ke.S.offers.map(o => o.t0) }; });
    check('the season report shows the envoy with its terms', rep1.row && !!rep1.terms, rep1);
    await L.closeModals(page);
    await L.endTurn(page);
    const rep2 = await E(() => ({ offers: window.__ke.S.offers.filter(o => o.f === 'VEN').length, row: !!document.querySelector('#modal [data-act="off"][data-f="VEN"]') }));
    check('two turns later the envoy is gone and not shown again (B2)', rep2.offers === 0 && !rep2.row, rep2);
    await L.closeModals(page);
  },
};
