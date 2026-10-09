'use strict';
// Legacy (12e): achievements are earned as the game goes (with a toast and a chronicle line) and kept across
// games; the state book lists them; the end screen tells the reign's story: the ruler's epithet, a chart of the
// realm's size with a hover tooltip, the great conquests by date, the score broken down and the achievements.
module.exports = {
  name: 'e-legacy',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
  const toEnd = async () => { for (let k = 0; k < 30; k++) { const r = await page.evaluate(() => { const m = document.getElementById('modal'); if (m.hidden) return 0; if (m.querySelector('.lgc-epi')) return 2;
      const b = m.querySelector('[data-act="ev"]:not([disabled])') || m.querySelector('[data-act="off"][data-v="0"]') || m.querySelector('[data-act="mclose"]'); if (b) b.click(); return 1; }); if (r === 2) return; await page.waitForTimeout(120); } };
    if (await E(() => !!document.querySelector('[data-act="tut-skip"]'))) await page.click('#tutBub [data-act="tut-skip"]');
    const s0 = await E(() => { const K = window.__ke, g = K.lgc.get(); return { p0: g.p0, n: K.lgc.ach().length, hist: g.hist.length, cont: [K.lgc.cont(K.PD.findIndex(d => d.key === 'edirne')), K.lgc.cont(K.PD.findIndex(d => d.key === 'bursa')), K.lgc.cont(K.PD.findIndex(d => d.key === 'kahire'))] }; });
    check('a new game starts its record (provinces at the start, the first chart point)', s0.p0 > 0 && s0.hist === 1 && s0.n >= 20, s0);
    check('continents: Edirne is in Europe, Bursa in Asia, Cairo in Africa', s0.cont.join() === 'eu,as,af', s0);
    // take Constantinople in 1451: Fatih
    const a1 = await E(() => { const K = window.__ke, i = K.PD.findIndex(d => d.key === 'istanbul'); K.capture(i, 'OSM'); const g = K.lgc.get();
      return { ach: Object.keys(g.ach), gains: g.gains.length, log: K.S.log.slice(-12).map(e => e.m).join(' | '), toast: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).join(' | ') }; });
    check('taking Constantinople before 1454 earns "Fatih", with a toast and a chronicle line', a1.ach.includes('fetih') && a1.gains === 1 && /Fatih/.test(a1.toast) && /Fatih/.test(a1.log), a1);
    const past = await E(() => window.__ke.lgc.past());
    check('the achievement is kept for later games', !!past.fetih, past);
    // more: treasury and Cairo, checked at the turn
    await E(() => { const K = window.__ke; K.S.fac.OSM.gold = 1200; K.capture(K.PD.findIndex(d => d.key === 'kahire'), 'OSM'); });
    await L.endTurn(page); await L.closeModals(page);
    const a2 = await E(() => Object.keys(window.__ke.lgc.get().ach));
    check('the treasury and Cairo achievements follow', a2.includes('hazine') && a2.includes('kahire'), a2);
    // the state book
    await E(() => window.__ke.reg.ACTS.state()); await page.waitForTimeout(250);
    const sb = await E(() => { const on = document.querySelectorAll('#modal .ach.on').length, all = document.querySelectorAll('#modal .ach').length; return { on, all }; });
    check('the state book lists every achievement, the earned ones lit', sb.all >= 20 && sb.on >= 3, sb);
    await L.closeModals(page);
    // the end of the game in 1531
    await E(() => { const K = window.__ke, S = K.S; S.turn = 319; S.lgc.hist.push([300, 70]); });
    await L.endTurn(page); await toEnd();
    const end = await E(() => { const m = document.querySelector('#modal .card'); if (!m) return null;
      return { over: window.__ke.S.over, epi: (m.querySelector('.lgc-epi') || {}).textContent || '', svg: !!m.querySelector('.lgc-chart svg path.lgc-line'), hits: m.querySelectorAll('.lgc-hit').length,
        tl: m.querySelectorAll('.lgc-tl > div').length, sc: m.querySelectorAll('.lgc-sc > div').length, ach: m.querySelectorAll('.achg .ach.on').length, rows: m.querySelectorAll('.rows .row').length }; });
    check('the end screen tells the story: epithet, chart, conquests, score, achievements, powers', end && end.over === 'time' && /Tarih seni/.test(end.epi) && end.svg && end.hits >= 3 && end.tl >= 2 && end.sc === 4 && end.ach >= 3 && end.rows >= 3, end);
    const hit = await page.$('#modal .lgc-hit:last-of-type');
    if (hit) { await hit.hover(); await page.waitForTimeout(200); }
    const tip = await E(() => { const t = document.querySelector('#modal .lgc-tip'); return t ? { on: t.classList.contains('on'), txt: t.textContent } : null; });
    check('hovering the chart shows the year and the provinces', tip && tip.on && /eyalet/.test(tip.txt), tip);
    const yk = await E(() => window.__ke.lgc.get().ach.yikilmaz != null || window.__ke.lgc.get().lost > 0);
    check('"Unbroken" is judged at the end (earned unless a province was lost)', yk, yk);
  }
};
