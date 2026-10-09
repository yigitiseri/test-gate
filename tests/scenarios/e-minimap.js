'use strict';
// Minimap (07m): an overview in the corner frames the part of the map on screen; tapping it moves the view there;
// the ▣ button hides and shows it (remembered).
module.exports = {
  name: 'e-minimap',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    if (await E(() => !!document.querySelector('[data-act="tut-skip"]'))) await page.click('#tutBub [data-act="tut-skip"]');
    await E(() => { const K = window.__ke, i = K.PD.findIndex(d => d.key === 'edirne'); K.centerOn(K.PD[i].lx, K.PD[i].ly, 2.5); }); await page.waitForTimeout(300);
    const s0 = await E(() => { const m = document.getElementById('minimap'), c = m && m.querySelector('canvas'), f = m && m.querySelector('.mm-fr');
      const px = c ? c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data : null;
      return m ? { hidden: m.hidden, w: c.width, fw: parseFloat(f.style.width), cw: parseFloat(c.style.width), painted: px && px[3] > 0 } : null; });
    check('the overview shows on a desktop, painted, with a small frame when zoomed in', s0 && !s0.hidden && s0.painted && s0.fw > 3 && s0.fw < s0.cw * .75, s0);
    const before = await E(() => ({ x: window.__ke.cam ? null : null }));
    const box = await page.$eval('#minimap canvas', c => { const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    await page.mouse.click(box.x + box.w * .8, box.y + box.h * .8); await page.waitForTimeout(250);
    const fr = await E(() => { const f = document.querySelector('#minimap .mm-fr'), c = document.querySelector('#minimap canvas'); return { cx: (parseFloat(f.style.left) + parseFloat(f.style.width) / 2) / parseFloat(c.style.width), cy: (parseFloat(f.style.top) + parseFloat(f.style.height) / 2) / parseFloat(c.style.height) }; });
    check('tapping the overview moves the view there', Math.abs(fr.cx - .8) < .12 && Math.abs(fr.cy - .8) < .2, fr);
    await page.click('#mmBtn'); await page.waitForTimeout(200);
    const off = await E(() => ({ hidden: document.getElementById('minimap').hidden, pref: localStorage.getItem('aod-mm-v1') }));
    check('the ▣ button hides it and remembers', off.hidden && off.pref === '0', off);
    await page.click('#mmBtn'); await page.waitForTimeout(200);
    check('and shows it again', await E(() => !document.getElementById('minimap').hidden));
  }
};
