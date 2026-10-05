'use strict';
// Track T, Wave 3: trade routes. Every road is a chain of real provinces; the holder of a stop earns its share
// (ECON_ROWS 'trade'); war between neighbouring stops, sieges and occupation lower the flow, markets raise it,
// the occupier collects an occupied stop; one realm holding a whole road gets a bonus; the Cape route (1500)
// weakens the Spice Route. Map: the trade map button draws the roads; the default view draws none (no clutter),
// a close zoom draws them faintly; hovering a road explains it; the panel of a stop shows its road.
module.exports = {
  name: 't-trade',
  fac: 'VEN',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    await L.closeModals(page);
    const base = await E(() => { const K = window.__ke, S = K.S, R = K.trade.routes();
      const rows = f => K.reg.ECON_ROWS.flatMap(fn => fn(f) || []);
      let world = 0; for (const f in S.fac) if (S.fac[f].alive) world += K.trade.income(f);
      const tr = rows('VEN').find(r => r.id === 'trade');
      return { n: R.length, short: R.filter(r => r.stops.length < 3).map(r => r.id), world, ven: tr ? tr.v : 0, venName: tr ? tr.l : '' }; });
    check('eight historical roads, each a chain of at least three stops', base.n === 8 && !base.short.length, base);
    check('Venice earns trade income in its ledger (Ticaret yolları)', base.ven > 3 && base.venName === 'Ticaret yolları', base);
    check('world trade stays modest (about a tenth of the taxes)', base.world > 40 && base.world < 85, base.world);
    // war cuts the Levant sea route between Candia (VEN) and Rhodes (RHO)
    const war = await E(() => { const K = window.__ke, S = K.S, f0 = K.trade.flow('levant').flow, v0 = K.trade.income('VEN');
      K.declareWar('VEN', 'RHO'); const F = K.trade.flow('levant');
      return { f0, f1: F.flow, cut: F.cut, why: F.why.map(w => w.k), v0, v1: K.trade.income('VEN') }; });
    check('war between neighbouring stops cuts the road (flow down, reason listed)', war.cut >= 1 && war.f1 < war.f0 && war.why.includes('war') && war.v1 < war.v0, war);
    // siege, occupation, market
    const st = await E(() => { const K = window.__ke, S = K.S, pk = k => K.PD.findIndex(d => d.key === k), out = {};
      const i = pk('tokat'); out.s0 = K.trade.flow('silk').flow; S.sieges[i] = { i, f: 'KKY', a: null, t0: S.turn, prog: 0, need: 4 }; out.s1 = K.trade.flow('silk').flow; delete S.sieges[i];
      const m = pk('amasya'); S.prov[m].mkt = 0; out.m0 = K.trade.flow('silk').flow; S.prov[m].mkt = 1; out.m1 = K.trade.flow('silk').flow;
      const b = pk('beyrut'); out.o0 = K.trade.income('VEN'); S.prov[b].ctl = 'VEN'; out.o1 = K.trade.income('VEN'); out.oc = K.trade.flow('levant').why.map(w => w.k); delete S.prov[b].ctl;
      out.whole = K.trade.flow('spice').why.map(w => w.k); out.e0 = K.trade.flow('spice').flow; const t = S.turn; S.turn = 200; out.e1 = K.trade.flow('spice').flow; S.turn = t;
      return out; });
    check('a besieged stop slows the road', st.s1 < st.s0, st);
    check('a market at a stop quickens the road', st.m1 > st.m0, st);
    check('the occupier collects an occupied stop (and the road suffers)', st.o1 > st.o0 && st.oc.includes('occ'), st);
    check('one realm holding the whole Spice Route gets a bonus', st.whole.includes('whole'), st.whole);
    check('after 1500 the Cape route weakens the Spice Route', st.e1 < st.e0 * .8, st);
    // map: default view draws no roads; the trade map button draws them; close zoom shows them faintly
    const pv = await E(() => { const K = window.__ke, i = K.PD.findIndex(d => d.key === 'kandiye'); return i; });
    await page.click('#zoom [data-act="fit"]'); await page.waitForTimeout(250);
    const d0 = await E(() => ({ legs: window.__ke.tradeMap.legs(), on: window.__ke.tradeMap.on() }));
    check('default view: no trade roads drawn', d0.legs === 0 && !d0.on, d0);
    await page.click('#zoom #trBtn'); await page.waitForFunction(() => window.__ke.tradeMap.legs() > 0, null, { timeout: 10000 });
    const d1 = await E(() => ({ legs: window.__ke.tradeMap.legs(), on: window.__ke.tradeMap.on(), pressed: document.getElementById('trBtn').getAttribute('aria-pressed') }));
    check('the trade map button draws every road', d1.on && d1.legs >= 40 && d1.pressed === 'true', d1);
    await E(i => { const K = window.__ke; K.centerOn(K.PD[i].lx, K.PD[i].ly, 1.6); }, pv); await page.waitForTimeout(250);
    const mid = await E(() => window.__ke.tradeMap.legAt('levant', 5));
    const tip = mid ? await E(m => window.__ke.tradeMap.tipAt(m.x, m.y), mid) : '';
    check('a road explains itself on the map (plain words)', /Levant Deniz Yolu/.test(tip) && /altın/.test(tip) && !/[=*×]/.test(tip.replace(/<[^>]+>/g, '')), tip.slice(0, 200));
    await page.mouse.move(mid.x, mid.y); await page.waitForTimeout(150); await page.mouse.move(mid.x + 1, mid.y);
    await page.waitForFunction(() => !document.getElementById('uiTip').hidden, null, { timeout: 5000 }).catch(() => {});
    check('hovering the road shows the tooltip', await E(() => !document.getElementById('uiTip').hidden && /Levant/.test(document.getElementById('uiTip').textContent)));
    await page.click('#zoom #trBtn'); await page.waitForTimeout(150);
    await E(i => { const K = window.__ke; K.centerOn(K.PD[i].lx, K.PD[i].ly, 2.6); }, pv); await page.waitForTimeout(250);
    const d2 = await E(() => ({ legs: window.__ke.tradeMap.legs(), on: window.__ke.tradeMap.on() }));
    check('zoomed in close, the roads show faintly on the political map', !d2.on && d2.legs > 0, d2);
    // the panel of a stop
    await L.clickProv(page, pv); await page.waitForTimeout(200);
    const pan = await E(() => { const s = document.querySelector('#panel [data-sec="trade"]'); return s ? s.innerText : ''; });
    check('the panel of Candia shows its road and what it earns', /Levant Deniz Yolu/.test(pan) && /altın getiriyor/.test(pan), pan.slice(0, 200));
    await page.click('#panel [data-act="trades"]'); await page.waitForSelector('#modal:not([hidden]) .trcard');
    const md = await E(() => ({ cards: document.querySelectorAll('#modal .trcard').length, mine: document.querySelectorAll('#modal .trcard.mine').length }));
    check('the trade modal lists every road and marks ours', md.cards === 8 && md.mine >= 2, md);
    await page.click('#modal [data-act="mclose"]');
  }
};
