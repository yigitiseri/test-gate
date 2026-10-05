'use strict';
// Ledger on a 390x844 phone: the chart fits the card without sideways scrolling, a tap reads the values
// into the strip under the chart (no floating tooltip over the lines), and a drag across moves the readout.
module.exports = {
  name: 'l-ledger-mobile',
  fac: 'HUN',
  viewport: 'mobile',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    for (let t = 0; t < 8; t++) { await L.closeModals(page); await L.endTurn(page); }
    await L.closeModals(page);
    await E(() => window.__ke.ledger.show());
    await page.waitForSelector('#lgChart svg');
    const lay = await E(() => { const c = document.querySelector('#modal .card'), sv = document.querySelector('#lgChart svg'), box = document.getElementById('lgChart');
      const wide = [...c.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }).map(e => e.className && e.className.baseVal != null ? e.className.baseVal : e.className).slice(0, 5);
      return { sw: c.scrollWidth, cw: c.clientWidth, svgW: sv.getBoundingClientRect().width, boxW: box.clientWidth, wide, strip: !!document.querySelector('.lg-tip.nar') }; });
    check('the ledger fits a phone: no sideways scroll, chart as wide as its box', lay.sw <= lay.cw + 1 && lay.svgW <= lay.boxW + 2 && !lay.wide.length, lay);
    check('on a phone the readout is a strip under the chart', lay.strip, lay);
    const b = await (await page.$('#lgChart svg')).boundingBox();
    await page.touchscreen.tap(b.x + b.width * .3, b.y + b.height * .5);
    await page.waitForFunction(() => document.querySelectorAll('.lg-tip.nar .r').length >= 2);
    const r1 = await E(() => document.querySelector('.lg-tip .d').textContent);
    await page.touchscreen.tap(b.x + b.width * .95, b.y + b.height * .5);
    await page.waitForFunction(d => document.querySelector('.lg-tip .d').textContent !== d, r1);
    const r2 = await E(() => ({ d: document.querySelector('.lg-tip .d').textContent, rows: document.querySelectorAll('.lg-tip .r').length, cross: !!document.querySelector('#lgChart .cross') }));
    check('tapping reads the values at another date, with a crosshair', r2.rows >= 2 && r2.cross && r2.d !== r1, { r1, r2 });
    const tgt = await E(() => [...document.querySelectorAll('.lg-met,.lg-leg .x,.lg-sort')].map(e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); }));
    check('touch targets are at least 28px', Math.min(...tgt) >= 28, Math.min(...tgt));
    await page.click('#modal [data-act="mclose"]');
  }
};
