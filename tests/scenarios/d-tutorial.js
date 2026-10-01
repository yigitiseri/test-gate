'use strict';
// Track D: the Ottoman "Fetih" lesson (Wave 2) walked through with real taps: Edirne -> recruit -> declare war on
// Byzantium -> march on Constantinople -> siege -> wait -> peace table. Coach marks never block the game, the lessons
// are remembered once finished, can be restarted and skipped from the menu, and other realms get the 4 short lessons.
// Works before and after Track B's sieges (the siege step also accepts an assault on the city).
module.exports = {
  name: 'd-tutorial',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const W = ms => page.waitForTimeout(ms);
    const st = () => E(() => window.__ke.tut());
    const ui = () => E(() => { const b = document.getElementById('tutBub'), r = document.getElementById('tutRing'); return { bub: !b.hidden, ring: !r.hidden, step: b.dataset.step, txt: b.innerText }; });
    const waitStep = (id, ms = 8000) => page.waitForFunction(id => window.__ke.tut().id === id, id, { timeout: ms }).then(() => true, () => false);
    const endTurn = async () => { await L.endTurn(page); await L.closeModals(page); await W(250); };
    await W(300);
    let s = await st();
    check('Fetih lesson starts for the Ottomans at step 1 (f-select)', s.active && s.id === 'f-select' && s.n === 7, s);
    let u = await ui();
    check('coach mark shows a bubble and a ring on Edirne', u.bub && u.ring && /1 \/ 7/.test(u.txt), u);
    check('the bubble lets taps through (only its skip button is tappable)', await E(() => { const b = document.getElementById('tutBub').getBoundingClientRect(); const el = document.elementFromPoint(b.left + 20, b.top + b.height / 2); return !el.closest('#tutBub'); }));
    check('no advisor chip while the lesson runs', await E(() => document.getElementById('uiAdv').hidden));

    const info = await E(() => { const K = window.__ke, S = K.S, ist = K.PD.findIndex(d => d.key === 'istanbul'); return { cap: S.fac.OSM.cap, ist }; });
    await L.clickProv(page, info.cap);
    check('tapping Edirne -> recruit step, ring on +1.000', await waitStep('f-recruit') && (await ui()).ring);
    await page.click('#panel [data-act="rec1"]');
    check('recruiting -> war step', await waitStep('f-war'));
    u = await ui();
    check('war step first asks to tap Constantinople (ring on the city)', u.ring && /Konstantiniyye/.test(u.txt), u.txt);
    await page.click('#panel [data-act="close"]').catch(() => {});
    await L.clickProv(page, info.ist); await W(200);
    check('with Constantinople selected the ring sits on the war button', await E(() => { const r = document.getElementById('tutRing').getBoundingClientRect(), b = document.querySelector('#panel [data-act="dwar"]'); if (!b || document.getElementById('tutRing').hidden) return false; const q = b.getBoundingClientRect(); return Math.abs(r.left + r.width / 2 - (q.left + q.width / 2)) < 6; }));
    await page.click('#panel [data-act="dwar"]'); await page.click('#panel [data-act="dwar"]');
    await L.closeModals(page);
    check('declaring war -> march step', await E(() => !!window.__ke.S.war['BYZ|OSM']) && await waitStep('f-march'));
    u = await ui();
    check('march step first asks to select an army, ringed on the army closest to the city', u.ring && /seç|select/i.test(u.txt), u.txt);
    // select the army closest to Constantinople through the province panel
    const arm = await E(ist => { const K = window.__ke, S = K.S; const L0 = S.armies.filter(a => a.f === 'OSM').map(a => ({ id: a.id, loc: a.loc, d: (K.armyPath(a.id, ist) || []).length || 99 })).sort((x, y) => x.d - y.d); return L0[0]; }, info.ist);
    await page.click('#panel [data-act="close"]').catch(() => {});
    await L.clickProv(page, arm.loc); await W(150);
    await page.click(`#panel [data-act="asel"][data-id="${arm.id}"]`); await W(200);
    s = await st();
    check('with the army selected the ring moves to the next stop toward the city', (s.id === 'f-march' || s.id === 'f-siege') && (await ui()).ring, s);
    // march (the Bursa army reaches the walls this season)
    for (let k = 0; k < 4 && !(await E(() => ['f-hold', 'f-peace'].includes(window.__ke.tut().id))); k++) {
      const tgt = info.ist;
      await page.click('#panel [data-act="close"]').catch(() => {});
      await E(id => window.__ke.selectArmy(id), arm.id);
      await L.clickProv(page, tgt); await W(200);
      const b = await E(() => { const x = document.querySelector('#panel [data-act="amove"]'); return x ? x.textContent : null; });
      if (b) { await page.click('#panel [data-act="amove"]'); await W(300); await L.closeModals(page); }
      else await endTurn();
    }
    s = await st();
    check('marching on / besieging Constantinople -> the hold step', s.id === 'f-hold' || s.id === 'f-peace', s);
    u = await ui();
    check('hold step rings the End Turn button', s.id !== 'f-hold' || (u.ring && u.step === 'f-hold'), u);
    for (let k = 0; k < 3 && (await st()).id === 'f-hold'; k++) await endTurn();
    s = await st();
    check('two seasons later -> the peace step (Divan)', s.id === 'f-peace' || !s.active, s);
    if (s.id === 'f-peace') {
      await page.click('#navTabs [data-act="diplo"]'); await W(250);
      const pb = await E(() => !!document.querySelector('#modal [data-act="dp-peace"][data-f="BYZ"]'));
      if (pb) { await page.click('#modal [data-act="dp-peace"][data-f="BYZ"]'); await W(300); }
      for (let k = 0; k < 5 && await E(() => !document.getElementById('modal').hidden); k++) { await page.keyboard.press('Escape'); await W(150); }
      await L.closeModals(page); await W(300);
    }
    s = await st();
    check('the peace table finishes the Fetih lesson', !s.active && (await E(() => window.__ke.S.tut.done === true)), s);
    check('finished lessons are remembered for new games', await E(() => localStorage.getItem('ke-tut') === 'done'));
    check('overlay gone', !(await ui()).bub && !(await ui()).ring);

    // menu: restart, then skip
    await page.click('#navTabs [data-act="menu"]');
    check('menu offers to restart the lessons', await E(() => !!document.querySelector('#modal [data-act="tut-restart"]')));
    await page.click('#modal [data-act="tut-restart"]'); await W(300);
    s = await st();
    check('restart -> step 1 again', s.active && s.id === 'f-select', s);
    await page.click('#tutBub [data-act="tut-skip"]'); await W(200);
    s = await st();
    check('skip turns the lessons off', !s.active && (await E(() => window.__ke.S.tut.off === true)) && !(await ui()).bub, s);
    { const mg = await E(() => { const K = window.__ke, a = JSON.parse(JSON.stringify(K.S)); K.migrate(K.S); const b = JSON.parse(JSON.stringify(K.S)), out = [];
      const walk = (x, y, p) => { if (JSON.stringify(x) === JSON.stringify(y) || out.length > 8) return; if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], p + '.' + k); } else out.push(p + ': ' + String(JSON.stringify(x)).slice(0, 80) + ' -> ' + String(JSON.stringify(y)).slice(0, 80)); };
      walk(a, b, 'S'); return out; });
    check('migrate stays idempotent', mg.length === 0, mg); }
    // a new game after finishing starts without lessons
    await E(() => window.__ke.beginGame('HUN')); await L.closeModals(page); await W(200);
    check('next new game starts without lessons', await E(() => window.__ke.S.tut === null && window.__ke.tut().active === false));
    // other realms: the four short lessons
    await E(() => { localStorage.removeItem('ke-tut'); window.__ke.beginGame('HUN'); }); await L.closeModals(page); await W(300);
    s = await st();
    check('Hungary gets the 4 short lessons', s.active && s.id === 'select' && s.n === 4, s);
    const hcap = await E(() => window.__ke.S.fac.HUN.cap);
    await L.clickProv(page, hcap);
    check('select -> recruit', await waitStep('recruit'));
    await page.click('#panel [data-act="rec1"]');
    check('recruit -> Divan', await waitStep('diplo'));
    await page.click('#navTabs [data-act="diplo"]'); await W(200); await page.click('#modal [data-act="mclose"]');
    check('Divan -> end turn', await waitStep('end'));
    await page.click('#endTurn');
    await page.waitForFunction(() => !document.getElementById('endTurn').disabled, null, { timeout: 120000 });
    await L.closeModals(page); await W(300);
    check('ending the turn finishes the short lessons', !(await st()).active);
  },
};
