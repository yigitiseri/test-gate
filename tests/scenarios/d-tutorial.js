'use strict';
// Track D: the tutorial engine runs its 4 W1 steps (select, recruit, Divan, end turn) with coach marks
// that never block the game, remembers that it is done, and can be restarted and skipped from the menu.
module.exports = {
  name: 'd-tutorial',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const W = ms => page.waitForTimeout(ms);
    const st = () => E(() => window.__ke.tut());
    const ui = () => E(() => { const b = document.getElementById('tutBub'), r = document.getElementById('tutRing'); return { bub: !b.hidden, ring: !r.hidden, step: b.dataset.step, txt: b.innerText }; });
    await W(300);
    let s = await st();
    check('tutorial starts on a new game at step 1 (select)', s.active && s.id === 'select', s);
    let u = await ui();
    check('coach mark shows a bubble and a ring on the capital', u.bub && u.ring && /1 \/ 4/.test(u.txt), u);
    check('the bubble lets taps through (only its skip button is tappable)', await E(() => { const b = document.getElementById('tutBub').getBoundingClientRect(); const x = b.left + 20, y = b.top + b.height / 2; const el = document.elementFromPoint(x, y); return !el.closest('#tutBub'); }));
    check('no advisor chip while the lesson runs', await E(() => document.getElementById('uiAdv').hidden));

    const cap = await E(() => window.__ke.S.fac.OSM.cap);
    await L.clickProv(page, cap); await W(300);
    s = await st(); u = await ui();
    check('selecting the capital -> step 2 (recruit), ring on the recruit button', s.id === 'recruit' && u.ring && u.step === 'recruit', { s, u });
    check('ring sits on the +1.000 button', await E(() => { const r = document.getElementById('tutRing').getBoundingClientRect(), b = document.querySelector('#panel [data-act="rec1"]').getBoundingClientRect(); return Math.abs(r.left + r.width / 2 - (b.left + b.width / 2)) < 4 && Math.abs(r.top + r.height / 2 - (b.top + b.height / 2)) < 4; }));
    await page.click('#panel [data-act="rec1"]'); await W(300);
    s = await st();
    check('recruiting -> step 3 (Divan)', s.id === 'diplo', s);
    await page.click('#navTabs [data-act="diplo"]'); await W(200);
    check('bubble hides while a modal is open', !(await ui()).bub);
    await page.click('#modal [data-act="mclose"]'); await W(250);
    s = await st(); u = await ui();
    check('opening the Divan -> step 4 (end turn), ring on the button', s.id === 'end' && u.ring, { s, u });
    await page.click('#endTurn');
    await page.waitForFunction(() => !document.getElementById('endTurn').disabled, null, { timeout: 120000 });
    await L.closeModals(page); await W(300);
    s = await st();
    check('ending the turn finishes the lessons', !s.active && (await E(() => window.__ke.S.tut.done === true)), s);
    check('finished lessons are remembered for new games', await E(() => localStorage.getItem('ke-tut') === 'done'));
    check('overlay gone', !(await ui()).bub && !(await ui()).ring);

    // menu: restart, then skip
    await page.click('#navTabs [data-act="menu"]');
    check('menu offers to restart the lessons', await E(() => !!document.querySelector('#modal [data-act="tut-restart"]')));
    await page.click('#modal [data-act="tut-restart"]'); await W(300);
    s = await st();
    check('restart -> step 1 again', s.active && s.id === 'select', s);
    await page.click('#tutBub [data-act="tut-skip"]'); await W(200);
    s = await st();
    check('skip turns the lessons off', !s.active && (await E(() => window.__ke.S.tut.off === true)) && !(await ui()).bub, s);
    check('migrate stays idempotent', await E(() => { const K = window.__ke, a = JSON.stringify(K.S); K.migrate(K.S); return JSON.stringify(K.S) === a; }));
    // a new game after finishing starts without lessons
    await E(() => window.__ke.beginGame('HUN')); await L.closeModals(page); await W(200);
    check('next new game starts without lessons', await E(() => window.__ke.S.tut === null && window.__ke.tut().active === false));
  },
};
