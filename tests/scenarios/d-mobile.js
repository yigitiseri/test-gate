'use strict';
// Track D, phone (390x844): start screen (bug B4), bottom sheet snaps and action bar, tap targets >= 44 px,
// toasts never over the sheet's buttons (bug B3), tap tooltips, top bar in two rows.
module.exports = {
  name: 'd-mobile',
  fac: null,
  viewport: 'mobile',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const W = ms => page.waitForTimeout(ms);

    // --- start screen: Zorlu anchor, Trebizond tappable with a real tap, choice bar under the list
    check('group anchors on the start screen', await E(() => document.querySelectorAll('#flist [data-act="sgrp"]').length === 3));
    await page.click('#flist [data-act="sgrp"][data-g="3"]'); await W(700);
    check('Zorlu anchor scrolls the Zorlu group into view', await E(() => { const g = document.getElementById('fg3').getBoundingClientRect(), f = document.getElementById('flist').getBoundingClientRect(); return g.top >= f.top - 2 && g.top < f.top + 120; }));
    const trb = await E(() => { const b = document.querySelector('[data-act="pick"][data-f="TRB"]'); b.scrollIntoView({ block: 'nearest' }); const r = b.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const hit = document.elementFromPoint(x, y); return { x, y, ok: !!hit && hit.closest('[data-act="pick"]') === b }; });
    check('Trebizond card is not covered (elementFromPoint)', trb.ok, trb);
    await page.touchscreen.tap(trb.x, trb.y); await W(250);
    check('Trebizond tap selects it (no fallback click)', await E(() => !!document.querySelector('#pick [data-act="begin"]') && document.querySelector('#pick h2').textContent.includes('Trabzon')));
    const pickBox = await E(() => { const p = document.getElementById('pick').getBoundingClientRect(), l = document.getElementById('flist').getBoundingClientRect(); return { pickTop: p.top, listBottom: l.bottom }; });
    check('choice bar sits under the list, not over it', pickBox.pickTop >= pickBox.listBottom - 1, pickBox);
    const scrollHint = await E(async () => { const fl = document.getElementById('flist'); fl.scrollTop = 0; fl.dispatchEvent(new Event('scroll')); await new Promise(r => setTimeout(r, 50)); const a = fl.classList.contains('more'); fl.scrollTop = fl.scrollHeight; fl.dispatchEvent(new Event('scroll')); await new Promise(r => setTimeout(r, 50)); return { top: a, end: fl.classList.contains('more') }; });
    check('scroll hint shows while more cards are below', scrollHint.top && !scrollHint.end, scrollHint);

    await L.startGame(page, 'OSM');
    if (await E(() => !!document.querySelector('[data-act="tut-skip"]'))) await page.click('#tutBub [data-act="tut-skip"]');
    await W(200);
    const topH = await E(() => document.getElementById('top').getBoundingClientRect().height);
    check('top bar is two compact rows (<= 110 px)', topH <= 110, topH);

    // --- bottom sheet: peek on selection
    const cap = await E(() => window.__ke.S.fac.OSM.cap);
    await L.clickProv(page, cap); await W(450);
    // the committed (post-transition) height: inline style when set, else the laid-out height
    const sheet = () => E(() => { const p = document.getElementById('panel'), r = p.getBoundingClientRect(), h = p.style.height ? parseFloat(p.style.height) : r.height; return { snap: p.dataset.snap, h, top: innerHeight - h, frac: h / innerHeight, hidden: p.hidden }; });
    let s = await sheet();
    check('sheet opens at peek and covers <= 30% of the screen', !s.hidden && s.snap === 'peek' && s.frac <= 0.30, s);
    check('peek shows the province name', await E(() => { const h = document.querySelector('#panel .ph h2').getBoundingClientRect(), p = document.getElementById('panel').getBoundingClientRect(); return h.top >= p.top && h.bottom <= p.bottom; }));

    // tap targets >= 44 px (visible buttons in the sheet, top bar, zoom)
    const small = await E(() => [...document.querySelectorAll('#panel .btn, #zoom button, #top button, #panel .x')].filter(b => { const r = b.getBoundingClientRect(), cs = getComputedStyle(b); return r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; })
      .map(b => { const r = b.getBoundingClientRect(); return { a: b.dataset.act || b.id || b.className, w: Math.round(r.width), h: Math.round(r.height) }; })
      .filter(x => x.h < 44 || (/zin|zout|fit|mode|v3d/.test(x.a) && x.w < 44)));
    check('tap targets are at least 44 px', small.length === 0, small);

    // grip taps cycle peek -> half -> full -> peek and are remembered
    const fr = [];
    for (let k = 0; k < 3; k++) { await page.click('#panel .sheet-grip'); await W(400); fr.push(await sheet()); }
    check('grip cycles half / full / peek', fr[0].snap === 'half' && fr[1].snap === 'full' && fr[2].snap === 'peek' && fr[0].frac > 0.45 && fr[1].frac > fr[0].frac && fr[1].top >= topH, fr.map(x => x.snap + ':' + x.frac.toFixed(2)));
    check('preferred snap is remembered', await E(() => localStorage.getItem('ke-sheet') === 'peek'));

    // drag the sheet up by the handle
    const g = await E(() => { const r = document.querySelector('#panel .sheet-grip').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await page.mouse.move(g[0], g[1]); await page.mouse.down();
    for (let k = 1; k <= 10; k++) await page.mouse.move(g[0], g[1] - k * 22);
    await page.mouse.up(); await W(400);
    s = await sheet();
    check('dragging the handle up snaps to half', s.snap === 'half', s);
    await page.click('#panel .sheet-grip'); await page.click('#panel .sheet-grip'); await W(400); // full -> peek
    check('back to peek', (await sheet()).snap === 'peek');

    // --- toasts never over the sheet's buttons, in every snap; toasts take no taps
    const toastCheck = async (label) => {
      await E(() => { const K = window.__ke; K.uiToast('Deneme: uzun bir haber satırı, vezirin divana getirdiği son haberler burada görünür.'); K.uiToast('İkinci haber'); K.uiToast('Üçüncü haber', 'war'); });
      await W(350);
      const r = await E(() => {
        const bs = [...document.querySelectorAll('#panel button, #panel .btn')].map(b => b.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
        const ts = [...document.querySelectorAll('#toasts .toast')].filter(t => getComputedStyle(t).display !== 'none').map(t => t.getBoundingClientRect());
        const hit = []; for (const t of ts) for (const b of bs) if (t.left < b.right && t.right > b.left && t.top < b.bottom && t.bottom > b.top) hit.push([Math.round(t.top), Math.round(t.bottom), Math.round(b.top)]);
        const pe = [...document.querySelectorAll('#toasts, #toasts .toast')].every(x => getComputedStyle(x).pointerEvents === 'none');
        return { n: ts.length, hit, pe };
      });
      check(`toasts clear of panel buttons (${label})`, r.n > 0 && r.hit.length === 0 && r.pe, r);
    };
    await toastCheck('peek');
    await page.click('#panel .sheet-grip'); await W(400); await toastCheck('half');
    await page.click('#panel .sheet-grip'); await W(400); await toastCheck('full');
    await page.click('#panel .sheet-grip'); await W(400);

    // --- action bar while an order is pending
    const adj = await E(c => window.__ke.PD[c].adj.filter(j => window.__ke.S.prov[j].o === 'OSM'), cap);
    let target = null;
    for (const j of adj) { const pt = await L.provPoint(page, j); if (pt) { target = pt; break; } }
    check('found a visible own neighbour', !!target);
    if (target) {
      await page.mouse.click(target[0], target[1]); await W(450);
      s = await sheet();
      check('order collapses the sheet to an action bar (<= 22%)', s.snap === 'action' && s.frac <= 0.22, s);
      const go = await E(() => { const b = document.querySelector('#panel [data-act="go"]'), p = document.getElementById('panel').getBoundingClientRect(); if (!b) return null; const r = b.getBoundingClientRect(); return { vis: r.height >= 40 && r.top >= p.top && r.bottom <= p.bottom + 1, h: r.height }; });
      check('action bar shows the order button fully', !!go && go.vis, go);
      check('action bar hides the other sections', await E(() => [...document.querySelectorAll('#panel .psec')].every(x => !!x.querySelector('[data-sheet="action"]') || x.classList.contains('sheet-off'))));
      await page.click('#panel [data-act="cancel"]'); await W(400);
      check('cancel returns to the sheet', (await sheet()).snap === 'peek');
    }

    // --- tap tooltips on the top-bar stats
    await page.tap('#top .stat[data-tip="gold"]'); await W(300);
    const tip = await E(() => { const t = document.getElementById('uiTip'); const r = t.getBoundingClientRect(); return { vis: !t.hidden, txt: t.innerText, inside: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight }; });
    check('tapping Hazine explains the treasury', tip.vis && /Eyalet vergileri/.test(tip.txt) && /Mevsim başına/.test(tip.txt) && tip.inside, tip);
    await page.tap('#top .stat[data-tip="gold"]'); await W(200);
    check('a second tap closes it', await E(() => document.getElementById('uiTip').hidden));

    // close with the handle drag down
    const g2 = await E(() => { const r = document.querySelector('#panel .sheet-grip').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await page.mouse.move(g2[0], g2[1]); await page.mouse.down();
    for (let k = 1; k <= 10; k++) await page.mouse.move(g2[0], g2[1] + k * 18);
    await page.mouse.up(); await W(400);
    check('dragging the sheet down closes it', await E(() => document.getElementById('panel').hidden));
    check('zoom sits at the bottom again', await E(() => { const z = document.getElementById('zoom').getBoundingClientRect(); return innerHeight - z.bottom < 30; }));
  },
};
