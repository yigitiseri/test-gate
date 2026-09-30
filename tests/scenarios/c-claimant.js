'use strict';
// Track C, Wave 2: the claimant war of a succession crisis. A pretender rises in 1-3 provinces of a realm whose
// throne stood empty (the reserved FAC slot CLM, a seam in 01-factions-provinces.js). He takes the throne if he
// takes the old capital, flees if the war ends without gains, and is crushed when his last province falls.
// The player's own crisis offers the claimant war as the "leave the nobles" choice. Names survive a reload.
// Without the FAC slot the old crisis (unrest) must still work: that is checked instead.
module.exports = {
  name: 'c-claimant',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const slot = await E(() => !!window.__ke.t2.FAC.CLM);
    if (!slot) {
      const r = await E(() => { const K = window.__ke, S = K.S; const can = K.chn.clmCan('KAR');
        for (const id in S.chars) { const c = S.chars[id]; if (c.f === 'CAN' && c.died == null && c.role !== 'ruler') K.ch.kill(c.id, 'natural'); }
        const r0 = K.rulerName('CAN'); K.ch.kill(K.ch.ruler('CAN').id, 'natural');
        return { can, r0, r1: K.rulerName('CAN'), un: S.prov.filter(p => p.o === 'CAN' && p.un > 0).length }; });
      check('no claimant slot yet (seam pending): the crisis falls back to unrest', !r.can && r.r1 !== r.r0, r);
      return;
    }
    const pk = k => `window.__ke.PD.findIndex(d=>d.key==='${k}')`;
    // 1. an AI pretender who flees when the war ends without gains
    const a = await E(() => { const K = window.__ke, S = K.S; const before = S.prov.filter(p => p.o === 'KAR').length;
      const id = K.clm = K.chn.clmSpawn('KAR'); const c = S.chars[id];
      const provs = S.prov.map((p, i) => [p, i]).filter(([p]) => p.o === 'CLM').map(([, i]) => i);
      const army = K.armyList('CLM')[0];
      return { id, name: c && c.n, alive: S.fac.CLM.alive, provs: provs.length, before, war: !!S.war['CLM|KAR'], army: army && army.n, gen: army && army.gen === id,
        s: K.t2.FAC.CLM.s, ruler: K.rulerName('CLM'), cap: S.fac.CLM.cap, capOwn: S.prov[S.fac.CLM.cap].o }; });
    check('a pretender rises in Karaman: his own realm, a province, an army he leads, war', a.alive && a.provs >= 1 && a.provs <= 3 && a.war && a.army >= 3000 && a.gen && a.capOwn === 'CLM', a);
    check('the pretender realm is named after him', a.s === 'Davacı ' + a.name && a.ruler === a.name, a);
    const a2 = await E(() => { const K = window.__ke, S = K.S; delete S.war['CLM|KAR']; K.chn.clmTick();
      return { alive: S.fac.CLM.alive, back: S.prov.filter(p => p.o === 'CLM').length, kar: S.prov.filter(p => p.o === 'KAR').length, role: S.chars[K.clm].role, f: S.chars[K.clm].f,
        log: S.log.slice(-2).map(x => x.m) }; });
    check('peace without gains: the pretender flees into exile and his provinces return', !a2.alive && a2.back === 0 && a2.kar === a.before && a2.role === 'claimant' && a2.f === 'KAR', a2);

    // 2. an AI pretender who takes the old capital and the throne
    const b = await E(() => { const K = window.__ke, S = K.S; const cap = S.fac.AKK.cap; const id = K.chn.clmSpawn('AKK');
      K.capture(cap, 'CLM'); K.chn.clmTick();
      return { id, name: S.chars[id].n, ruler: K.ch.ruler('AKK') && K.ch.ruler('AKK').n, rulerId: K.ch.ruler('AKK') && K.ch.ruler('AKK').id, alive: S.fac.CLM.alive,
        capBack: S.fac.AKK.cap === cap && S.prov[cap].o === 'AKK', clmProvs: S.prov.filter(p => p.o === 'CLM').length }; });
    check('the pretender takes the capital and the throne; the realm is whole again', b.rulerId === b.id && !b.alive && b.capBack && b.clmProvs === 0, b);

    // 3. an AI pretender crushed in the field
    const c = await E(() => { const K = window.__ke, S = K.S; const id = K.chn.clmSpawn('MAM');
      const provs = S.prov.map((p, i) => [p, i]).filter(([p]) => p.o === 'CLM').map(([, i]) => i); for (const i of provs) K.capture(i, 'MAM');
      return { n: provs.length, alive: S.fac.CLM.alive, dead: S.chars[id].died != null, cause: S.chars[id].dc, clm: S.c.clm }; });
    check('the pretender\'s last province falls: the revolt is crushed', c.n >= 1 && !c.alive && c.dead && c.clm === null, c);

    // 4. the player's own empty throne: the "leave the nobles" choice raises a pretender
    await E(() => { const K = window.__ke, S = K.S; for (const id in S.chars) { const x = S.chars[id]; if (x.f === 'OSM' && x.died == null && x.role !== 'ruler' && x.role !== 'gen') K.ch.kill(x.id, 'natural'); }
      K.ch.kill(K.ch.ruler('OSM').id, 'natural'); });
    await page.waitForSelector('#modal:not([hidden])');
    const t1 = await E(() => ({ h: document.querySelector('#modal h2').textContent, b: [...document.querySelectorAll('#modal [data-act="ev"]')].map(x => x.textContent) }));
    check('empty throne: the crisis offers the pretender choice', t1.h === 'Taht Boşluğu' && /davacısı/.test(t1.b[0]), t1);
    await page.click('#modal [data-act="ev"][data-k="0"]');
    await page.waitForFunction(() => { const m = document.getElementById('modal'), h = m.querySelector('h2'); return !m.hidden && h && h.textContent === 'İç Savaş'; }, null, { timeout: 5000 }).catch(() => {});
    const t2 = await E(() => { const K = window.__ke, S = K.S, m = document.getElementById('modal');
      return { h: !m.hidden && m.querySelector('h2').textContent, war: !!S.war['CLM|OSM'], provs: S.prov.filter(p => p.o === 'CLM').length, s: K.t2.FAC.CLM.s }; });
    check('a civil war breaks out in the player\'s realm (3 provinces for a large realm)', t2.h === 'İç Savaş' && t2.war && t2.provs === 3, t2);
    await L.closeModals(page);

    // 5. names and faith of the pretender survive a reload
    await E(() => window.__ke.save());
    await page.reload({ waitUntil: 'domcontentloaded' }); await L.waitLoaded(page);
    await page.click('[data-act="continue"]');
    await page.waitForFunction(() => window.__ke.S && window.__ke.S.player === 'OSM', null, { timeout: 30000 });
    await L.closeModals(page);
    const t3 = await E(() => { const K = window.__ke; return { s: K.t2.FAC.CLM.s, rel: K.t2.FAC.CLM.rel, alive: K.S.fac.CLM.alive }; });
    check('pretender names and faith restored after a reload', t3.alive && t3.s === t2.s && t3.rel === 'İslam', { t2: t2.s, t3 });
    // the pretender fights for one throne only
    const t4 = await E(() => { const K = window.__ke, S = K.S; K.declareWar('CLM', 'VEN'); return !!S.war['CLM|VEN']; });
    check('the pretender cannot open other wars', !t4);
  },
};
