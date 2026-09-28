'use strict';
// Track A: the end-of-turn move replay (PRESENTERS 'replay' 20) plays TURN_TRACE moves and battles before the
// season report, can be skipped, stays within its time budget, and can be switched off. Synthetic trace entries
// are pushed from an afterRound hook, so this does not depend on the army rules. Set KE_SHOTS=<dir> for screenshots.
const path = require('path');
module.exports = {
  name: 'a-replay',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const shot = async n => { if (process.env.KE_SHOTS) await page.screenshot({ path: path.join(process.env.KE_SHOTS, n + '.png') }); };
    check('core fx presenter replaced by the replay', await E(() => { const P = window.__ke.reg.PRESENTERS.map(p => p.id); return !P.includes('fx') && P.includes('replay') && P.includes('report'); }));
    await E(() => {
      const K = window.__ke, S = K.S, PD = K.PD, P = n => PD.findIndex(d => d.name === n);
      const r = { e: P('Edirne'), kk: P('Kırkkilise'), sv: P('Silivri'), ist: P('Konstantiniyye'), fl: P('Filibe'), sf: P('Sofya') };
      r.a = K.armyCreate('OSM', r.e, 20000, {}).id;
      r.b = K.armyCreate('OSM', r.sf, 8000, {}).id;
      K.centerOn(PD[r.kk].lx, PD[r.kk].ly);
      window.__rp = r;
      K.hook('afterRound', () => {
        const r = window.__rp, T = K.reg.TURN_TRACE; if (!r.on) return;
        const A = id => S.armies.find(x => x.id === id);
        const rep = { from: r.sv, to: r.ist, att: 'OSM', def: 'BYZ', n: 20000, defT: 7000, turn: S.turn - 1, win: false, aLoss: 3000, dLoss: 1200, kind: 'assault',
          mods: [{ l: 'Kale 4', m: 1.6, side: 'def', k: 'fort' }, { l: 'Kış seferi', m: .85, side: 'att', k: 'winter' }], roll: { a: .93, d: 1.12 } };
        T.push({ k: 'move', f: 'OSM', from: r.e, to: r.sv, path: [r.e, r.kk, r.sv], army: r.a, n: 20000 });
        T.push({ k: 'battle', f: 'OSM', from: r.sv, to: r.ist, path: [r.sv, r.ist], army: r.a, n: 20000, win: false, rep });
        T.push({ k: 'move', f: 'OSM', from: r.sf, to: r.fl, path: [r.sf, r.fl], army: r.b, n: 8000 });
        T.push({ k: 'battle', f: 'BYZ', from: r.ist, to: r.kk, path: [r.ist, r.kk], army: null, n: 4000, win: false, rep: { ...rep, from: r.ist, to: r.kk, att: 'BYZ', def: 'OSM', n: 4000, defT: 2000 } });
        A(r.a).loc = r.sv; A(r.b).loc = r.fl;
        S.report.push(rep);
      }, 99);
    });
    const runTurn = async (skip, tag) => {
      await E(() => { window.__rp.on = true; window.__rpT = [performance.now(), 0, 0]; window.__ke.endTurn(); });
      const saw = await page.waitForSelector('#hud .a-rpbar', { timeout: 30000 }).then(() => true, () => false);
      const t1 = await E(() => { window.__rpT[1] = performance.now(); return { on: window.__ke.replay.on, shown: window.__ke.replay.shown, modal: !document.getElementById('modal').hidden }; });
      if (tag === 'first') {
        check('replay starts with a HUD bar', saw, t1);
        check('replay shows the traced moves (>= 3)', t1.on && t1.shown >= 3, t1);
        check('season report waits for the replay', !t1.modal, t1);
      }
      if (skip) await page.click('#hud .a-rpskip', { force: true, timeout: 3000 });
      else {
        const ghost = await page.waitForFunction(() => window.__ke.tokens().some(t => t.id == null), null, { timeout: 4000 }).then(() => true, () => false);
        check('army-less battle trace drawn as a ghost token', ghost);
        await shot('replay_mid');
      }
      await page.waitForFunction(() => !document.querySelector('#hud .a-rpbar'), null, { timeout: 8000 });
      const dt = await E(() => performance.now() - window.__rpT[1]);
      await page.waitForFunction(() => !document.getElementById('endTurn').disabled, null, { timeout: 30000 });
      const rep = await E(() => { const m = document.getElementById('modal'), h = m.querySelector('h2'); return !m.hidden && h ? h.textContent : null; });
      return { saw, dt, rep };
    };
    const a = await runTurn(true, 'first');
    check('skip ends the replay at once', a.dt < 1500, a);
    check('report opens after the replay', a.rep === 'Mevsim Raporu', a);
    // the report has a battle card button (A3)
    check('report lists the battle card button', await E(() => !!document.querySelector('#modal [data-act="bcard"]')));
    await L.closeModals(page);
    const b = await runTurn(false, 'second');
    const ms = await E(() => window.__ke.replay.lastMs);
    check('unskipped replay ends within ~4 s', b.saw && ms < 4300, { ms, ...b });
    check('report opens after the full replay', b.rep === 'Mevsim Raporu', b);
    await L.closeModals(page);
    const pos = await E(() => { const r = window.__rp, S = window.__ke.S; return S.armies.find(x => x.id === r.a).loc === r.sv; });
    check('armies keep their real positions after the replay', pos);
    // switched off: no replay bar, report still appears
    await E(() => { window.__ke.replay.opt.replay = false; });
    await E(() => { window.__rp.on = true; window.__ke.endTurn(); });
    await page.waitForFunction(() => !document.getElementById('endTurn').disabled, null, { timeout: 30000 });
    const off = await E(() => ({ bar: !!document.querySelector('#hud .a-rpbar'), rep: !document.getElementById('modal').hidden }));
    check('replay can be switched off', !off.bar && off.rep, off);
    await L.closeModals(page);
    await E(() => { window.__ke.replay.opt.replay = true; window.__rp.on = false; });
  },
};
