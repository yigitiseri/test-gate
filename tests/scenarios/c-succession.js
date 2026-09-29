'use strict';
// Track C: dynasties seeded for all factions, player succession (modal + janissary gift), foreign succession
// shown in the Divan, election, crisis, commanders on armies and in battle reports, the state book,
// pending questions surviving a reload, and a v1 save seeding the dynasties.
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'c-succession',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const st = await E(() => { const K = window.__ke, S = K.S; const miss = Object.keys(S.fac).filter(f => S.fac[f].alive && !K.ch.ruler(f));
      return { miss, osm: K.rulerName('OSM'), heir: K.ch.heir('OSM') && K.ch.heir('OSM').n, byz: K.rulerName('BYZ'), hun: K.rulerName('HUN'), mis: S.mis.length }; });
    check('every alive faction has a ruler', st.miss.length === 0, st.miss);
    check('historical rulers seeded', st.osm === 'II. Mehmed' && st.heir === 'Bayezid' && st.byz === 'XI. Konstantinos' && st.hun === 'Hunyadi Yanoş', st);
    check('Ottoman mission tree assigned', st.mis >= 5, st.mis);

    // the player's sultan dies: heir takes over, a modal shows, the janissaries ask their gift
    await E(() => { const K = window.__ke; K.ch.kill(K.ch.ruler('OSM').id, 'natural'); });
    await page.waitForSelector('#modal:not([hidden])');
    const t1 = await E(() => document.querySelector('#modal h2').textContent);
    check('succession modal shown', t1 === 'Taht Değişti', t1);
    check('heir took the throne', (await E(() => window.__ke.rulerName('OSM'))) === 'II. Bayezid');
    await page.click('#modal [data-act="ev"]'); await page.waitForTimeout(150);
    const t2 = await E(() => !document.getElementById('modal').hidden && document.querySelector('#modal h2').textContent);
    check('accession gift question follows', t2 === 'Cülus Bahşişi', t2);
    await L.closeModals(page);

    // foreign succession shows in the Divan
    await E(() => { const K = window.__ke; K.ch.kill(K.ch.ruler('HUN').id, 'plague'); K.ch.kill(K.ch.ruler('VEN').id, 'natural'); });
    await page.click('#top [data-act="diplo"]'); await page.waitForTimeout(150);
    const dip = await E(() => document.getElementById('modal').innerText);
    check('Divan shows the new Hungarian ruler', dip.includes('Matyas Korvin'), dip.slice(0, 200));
    check('Venice elected a new doge', (await E(() => window.__ke.rulerName('VEN'))) === 'Pasquale Malipiero');
    await L.closeModals(page);

    // no heir: crisis for an AI realm still leaves a ruler
    const cr = await E(() => { const K = window.__ke, S = K.S; for (const id in S.chars) { const c = S.chars[id]; if (c.f === 'CAN' && c.died == null && c.role !== 'ruler') K.ch.kill(c.id, 'natural'); }
      const r0 = K.rulerName('CAN'); K.ch.kill(K.ch.ruler('CAN').id, 'natural'); return { r0, r1: K.rulerName('CAN'), alive: !!K.ch.ruler('CAN') }; });
    check('crisis gives Candar a new ruler', cr.alive && cr.r1 !== cr.r0, cr);

    // commanders: a new army gets a general; battle modifiers name him
    const gb = await E(() => { const K = window.__ke, S = K.S, PD = K.PD; let from = -1, to = -1;
      for (let i = 0; i < S.prov.length && from < 0; i++) if (S.prov[i].o === 'OSM') for (const j of PD[i].adj) if (S.prov[j].o === 'BYZ') { from = i; to = j; break; }
      const a = K.armyCreate('OSM', from, 5000); const g = a.gen != null && S.chars[a.gen];
      if (!S.war[['BYZ', 'OSM'].join('|')]) S.war['BYZ|OSM'] = { t: S.turn, sc: { OSM: 0, BYZ: 0 }, ex: {}, goal: null };
      S.prov[from].t += 20000; const odds = K.battleOdds({ att: 'OSM', to, n: 20000, from });
      return { gen: g && g.n, mods: odds.mods.map(m => m.l) }; });
    check('army got a general', !!gb.gen, gb);
    check('battle modifiers include the commander', gb.mods.some(l => l.startsWith('Komutan')), gb.mods);

    // state book: dynasty section
    await page.click('#facBtn'); await page.waitForTimeout(150);
    const sb = await E(() => document.getElementById('modal').innerText);
    check('state book shows the dynasty', /Hanedan/i.test(sb) && /Veliaht/i.test(sb) && /Komutanlar/i.test(sb), sb.slice(0, 300));
    await L.closeModals(page);

    // a pending question survives a reload
    await E(() => { const K = window.__ke; K.evFire('kervan', 12345); });
    const q1 = await E(() => document.querySelector('#modal h2').textContent);
    await E(() => { const K = window.__ke; K.save(); document.getElementById('modal').hidden = true; K.loadGame(); });
    await page.waitForTimeout(300);
    const q2 = await E(() => !document.getElementById('modal').hidden && document.querySelector('#modal h2').textContent);
    check('pending event re-asked after load', q1 === q2 && !!q2, { q1, q2 });
    await L.closeModals(page);
    check('pending cleared after answering', (await E(() => window.__ke.S.c.pend.length)) === 0);

    // v1 fixture: dynasties seeded on migration, idempotent
    const raw = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'save-v1.json'), 'utf8');
    const mg = await E(raw => { const K = window.__ke; const s = K.migrate(JSON.parse(raw)); const a = JSON.stringify(s); const b = JSON.stringify(K.migrate(JSON.parse(a)));
      const alive = Object.keys(s.fac).filter(f => s.fac[f].alive); const ok = alive.every(f => { const r = s.chars[s.fac[f].ruler]; return r && r.died == null && r.f === f; });
      return { n: Object.keys(s.chars).length, ok, idem: a === b, holds: s.mis.filter(m => m.hold).map(m => m.vs + '/' + m.turns) }; }, raw);
    check('v1 save gets dynasties for every alive faction', mg.n > 50 && mg.ok, mg);
    check('v1 migration idempotent', mg.idem);
  },
};
