'use strict';
// Track D, desktop: every top-bar stat and province stat explains itself (hover tooltips), the odds
// tooltip lists the battle modifiers, warning chips, the vizier advisor, keyboard shortcuts and the
// end-turn guard when the treasury is about to run dry.
module.exports = {
  name: 'd-tips',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const W = ms => page.waitForTimeout(ms);
    await E(() => { const b = document.querySelector('#tutBub [data-act="tut-skip"]'); b && b.click(); });
    const tipOf = async sel => { await page.mouse.move(5, 500); await W(80); await page.hover(sel); await W(450); return E(() => { const t = document.getElementById('uiTip'); return t.hidden ? null : t.innerText; }); };

    // top bar: every stat has a tooltip with content
    const stats = await E(() => [...document.querySelectorAll('#top .stat')].map(s => s.dataset.tip || null));
    check('every top-bar stat has data-tip', stats.length === 5 && stats.every(Boolean), stats);
    for (const k of stats) {
      const t = await tipOf(`#top .stat[data-tip="${k}"]`);
      check(`tooltip ${k}`, !!t && t.length > 20, t && t.slice(0, 80));
    }
    const g = await tipOf('#top .stat[data-tip="gold"]');
    check('gold tooltip lists the ECON_ROWS and the net', /Eyalet vergileri/.test(g) && /Ordu maaşları/.test(g) && /Mevsim başına/.test(g), g);
    check('season tooltip on the date', !!(await tipOf('#top .date')));
    check('nav buttons all have aria-labels', await E(() => [...document.querySelectorAll('#navTabs .nb')].every(b => (b.getAttribute('aria-label') || '').length > 1)));
    check('nav labels visible on a wide screen', await E(() => getComputedStyle(document.querySelector('#navTabs .lbl')).display !== 'none'));

    // province panel stats
    const cap = await E(() => window.__ke.S.fac.OSM.cap);
    await L.clickProv(page, cap);
    const ps = await E(() => [...document.querySelectorAll('#panel .grid4>div')].map(d => d.dataset.tip || null));
    check('every province stat has data-tip', ps.length === 4 && ps.every(Boolean), ps);
    for (const k of ps) { const t = await tipOf(`#panel .grid4>[data-tip="${k}"]`); check(`province tooltip ${k}`, !!t && t.length > 20, t && t.slice(0, 60)); }
    check('terrain chip tooltip', !!(await tipOf('#panel .chip[data-tip="terrain"]')));

    // odds provider (B's orders section uses data-tip="odds"; here a stand-in element with data-to/data-n)
    const odds = await E(() => { const K = window.__ke, PD = K.PD, ist = PD.findIndex(d => d.key === 'istanbul'); const el = document.createElement('div'); el.dataset.tip = 'odds'; el.dataset.to = ist; el.dataset.n = 30000; return K.reg.TIPS.odds(el); });
    check('odds tooltip: percentage and modifier lines in words', /Zafer şansı · %\d+/.test(odds) && /Kale \d/.test(odds) && /savunma \+\d+%/.test(odds), odds && odds.replace(/<[^>]+>/g, ' ').slice(0, 200));

    // map hover shows the chance of victory against an enemy neighbour
    await E(() => { const K = window.__ke; if (!K.S.war['BYZ|OSM']) { document.querySelector('#panel [data-act="close"]').click(); } });
    const ist = await E(() => window.__ke.PD.findIndex(d => d.key === 'istanbul'));
    await L.clickProv(page, ist);
    await page.click('#panel [data-act="dwar"]'); await page.click('#panel [data-act="dwar"]'); await L.closeModals(page);
    const src = await E(i => window.__ke.PD[i].adj.find(j => window.__ke.S.prov[j].o === 'OSM'), ist);
    await L.clickProv(page, src);
    const pt = await L.provPoint(page, ist);
    await page.mouse.move(pt[0], pt[1]); await W(150);
    const hov = await E(() => document.getElementById('tip').innerText);
    check('map hover shows the chance of victory', /Zafer şansı: .+ · %\d+/.test(hov), hov);
    await E(() => document.querySelector('#panel [data-act="close"]').click());

    // keyboard: 1 opens diplomacy, Esc closes, 4 opens the state book
    await page.mouse.move(5, 500);
    await page.keyboard.press('1'); await W(150);
    check('key 1 opens Diplomasi', await E(() => !document.getElementById('modal').hidden && /Diplomasi/.test(document.querySelector('#modal h2').textContent)));
    await page.keyboard.press('Escape'); await W(120);
    check('Esc closes it', await E(() => document.getElementById('modal').hidden));
    await page.keyboard.press('4'); await W(150);
    check('key 4 opens the state book', await E(() => !!document.querySelector('#modal .ledger')));
    await page.keyboard.press('Escape'); await W(120);

    // advisor and warnings: push the treasury into the red
    await E(() => { const K = window.__ke, S = K.S; S.prov[S.fac.OSM.cap].t += 150000; S.fac.OSM.gold = 30; K.hook('renderAll', () => {}); });
    await E(() => document.querySelector('#top [data-act="chron"]').click()); await E(() => document.querySelector('#modal [data-act="mclose"]').click());
    await E(() => { const K = window.__ke; K.uiToast('x'); }); // any renderAll-free path: force one render below
    await page.click('#facBtn'); await page.click('#modal [data-act="mclose"]');
    await E(() => document.querySelector('#top [data-act="menu"]').click()); await E(() => document.querySelector('#modal [data-act="mclose"]').click());
    await E(() => { const b = document.querySelector('#top [data-act="snd"]'); b.click(); b.click(); });
    await E(() => { window.__ke.hook; }); await E(() => { const K = window.__ke; K.runHooks('renderAll'); });
    await W(150);
    const adv = await E(() => ({ id: window.__ke.uiAdvice(), vis: !document.getElementById('uiAdv').hidden, txt: document.querySelector('#uiAdv .adv-t').textContent }));
    check('vizier warns about the treasury', adv.id === 'bank' && adv.vis, adv);
    await page.click('#uiAdv .adv-chip'); await W(150);
    check('vizier card opens with advice text', await E(() => !document.querySelector('#uiAdv .adv-card').hidden && document.querySelector('#uiAdv .adv-d').textContent.length > 40));
    await page.click('#uiAdv [data-act="adv-go"]'); await W(150);
    check('advice button opens the state book', await E(() => !!document.querySelector('#modal .ledger')));
    await E(() => document.querySelector('#modal [data-act="mclose"]').click());
    await E(() => { const K = window.__ke; K.S.turn = K.S.turn; }); // top bar re-render happens on the next action
    await page.click('#facBtn'); await E(() => document.querySelector('#modal [data-act="mclose"]').click());
    await E(() => { window.__ke.runHooks('renderAll'); });

    // end-turn guard: the first press only warns, the second ends the turn
    const t0 = await E(() => window.__ke.S.turn);
    check('end-turn risk detected', !!(await E(() => window.__ke.uiEndRisk())));
    await page.click('#endTurn'); await W(200);
    const warned = await E(() => ({ turn: window.__ke.S.turn, lbl: document.getElementById('endTurn').textContent, toast: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).join('|') }));
    check('first press warns and does not end the turn', warned.turn === t0 && /Yine de/.test(warned.lbl) && /Hazine/.test(warned.toast), warned);
    await page.click('#endTurn');
    await page.waitForFunction(() => !document.getElementById('endTurn').disabled, null, { timeout: 120000 });
    await L.closeModals(page);
    check('second press ends the turn', (await E(() => window.__ke.S.turn)) === t0 + 1);
    check('warning chip in the top bar', await E(() => document.querySelectorAll('#uiWarn .chip').length > 0 && document.querySelector('#top .stat[data-tip="gold"]').classList.contains('warn')));

    // Space ends the turn when the treasury is fine
    await E(() => { const K = window.__ke, S = K.S; S.prov[S.fac.OSM.cap].t = 5000; S.fac.OSM.gold = 500; });
    await page.click('#facBtn'); await E(() => document.querySelector('#modal [data-act="mclose"]').click());
    await page.mouse.click(5, 500); await W(100); await E(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    const t1 = await E(() => window.__ke.S.turn);
    await page.keyboard.press('Space');
    await page.waitForFunction(t => window.__ke.S.turn > t && !document.getElementById('endTurn').disabled, t1, { timeout: 120000 });
    await L.closeModals(page);
    check('Space ends the turn', (await E(() => window.__ke.S.turn)) === t1 + 1);
    check('migrate stays idempotent', await E(() => { const K = window.__ke, a = JSON.stringify(K.S); K.migrate(K.S); return JSON.stringify(K.S) === a; }));
  },
};
