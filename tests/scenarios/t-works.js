'use strict';
// Track T, Wave 3: great works. Works standing in 1451 (Hagia Sophia, Bursa Bedesten, the Arsenale...); the player
// lays the foundations from the province panel (cost, a confirm click), the site shows its progress and finishes
// after its seasons with a lasting effect; one-per-realm and two-sites limits; a site pauses under occupation and is
// abandoned when the province is lost; a conqueror converts a church (Hagia Sophia becomes a mosque); the citadel
// slows sieges, the covered market raises taxes, faith speeds the end of unrest, the madrasa grows the city;
// the AI builds by the same rules; old saves get S.works.
module.exports = {
  name: 't-works',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    await L.closeModals(page);
    await E(() => { const b = document.querySelector('[data-act="tut-skip"]'); if (b) b.click(); });
    const st = await E(() => { const K = window.__ke, S = K.S, pk = k => K.PD.findIndex(d => d.key === k), b = pk('bursa');
      return { names: K.works.list().map(w => w.name), bursaInc: K.reg.ECON_ROWS.length && S.prov[b].dev, inc: (() => { const p = S.prov[b]; return p.dev * (1 + .5 * p.mkt) * (p.un > 0 ? .5 : 1); })(), real: (() => { let v = 0; return v; })() }; });
    check('works of 1451 stand (Hagia Sophia, Bursa Bedesten, Arsenale)', ['Ayasofya', 'Bursa Bedesteni', 'Arsenale', 'Gelibolu Tersanesi'].every(n => st.names.includes(n)), st.names);
    const tax = await E(() => { const K = window.__ke, S = K.S, b = K.PD.findIndex(d => d.key === 'bursa'), p = S.prov[b];
      let row = 0; for (const fn of K.reg.ECON_ROWS) for (const r of (fn('OSM') || [])) if (r.id === 'tax') row = r.v;
      const before = row; const keep = S.works; S.works = keep.filter(w => !(w.i === b && w.k === 'bedesten')); let row2 = 0; for (const fn of K.reg.ECON_ROWS) for (const r of (fn('OSM') || [])) if (r.id === 'tax') row2 = r.v; S.works = keep;
      return { diff: +(before - row2).toFixed(2), half: p.dev * (1 + .5 * p.mkt) * (p.un > 0 ? .5 : 1) * .5 }; });
    check('the Bursa Bedesten raises the province taxes by half', Math.abs(tax.diff - tax.half) < .01 && tax.diff > 0, tax);
    // build through the panel: Edirne (capital) -> Külliye
    const ed = await E(() => { const K = window.__ke, S = K.S, i = K.PD.findIndex(d => d.key === 'edirne'); S.fac.OSM.gold = 1000; K.centerOn(K.PD[i].lx, K.PD[i].ly, 2.2); return i; });
    await page.waitForTimeout(300); await L.clickProv(page, ed); await page.waitForSelector('#panel [data-sec="works"]');
    const btn = '#panel [data-act="wkbuild"][data-k="faith"]';
    check('the panel offers a Külliye in the capital', await E(s => { const b = document.querySelector(s); return !!b && !b.disabled && /Külliye/.test(b.textContent) && /250/.test(b.textContent); }, btn));
    await page.click(btn); await page.waitForTimeout(150);
    const conf = await E(s => document.querySelector(s).textContent, btn);
    check('a first click asks for confirmation (no gold spent yet)', /Emin misin/.test(conf) && (await E(() => window.__ke.S.fac.OSM.gold)) === 1000, conf);
    await page.click(btn); await page.waitForTimeout(200);
    const site = await E(i => { const K = window.__ke, S = K.S, w = S.works.find(x => x.i === i && x.k === 'faith');
      const sec = document.querySelector('#panel [data-sec="works"]'); return { w, gold: S.fac.OSM.gold, txt: sec ? sec.innerText : '', bar: !!document.querySelector('#panel .wkbar') }; }, ed);
    check('foundations laid: 250 gold paid, the site shows its progress', site.w && !site.w.d && site.gold === 750 && site.bar && /Edirne/.test(site.txt) && /tur kaldı/.test(site.txt), site);
    const lim = await E(i => { const K = window.__ke, S = K.S, pk = k => K.PD.findIndex(d => d.key === k);
      const second = K.works.can('OSM', pk('bursa'), 'faith'), s2 = K.works.start('OSM', pk('selanik'), 'citadel'), third = K.works.can('OSM', pk('sofya'), 'citadel');
      return { second: second.why, s2: !!s2, third: third.why }; }, ed);
    check('one Külliye per realm, at most two building sites', /bir tane/.test(lim.second) && lim.s2 && /en çok 2/.test(lim.third), lim);
    // seasons of work; pause under occupation; finish with news
    const prog = await E(i => { const K = window.__ke, S = K.S, w = S.works.find(x => x.i === i && x.k === 'faith');
      K.works.tick(); const p1 = w.p; S.prov[i].ctl = 'BYZ'; K.works.tick(); const p2 = w.p; delete S.prov[i].ctl;
      S.news = []; for (let k = 0; k < 20 && !w.d; k++) K.works.tick();
      return { p1, p2, d: w.d, news: S.news.map(n => n.m) }; }, ed);
    check('work advances each season and pauses under occupation', prog.p1 === 1 && prog.p2 === 1, prog);
    check('the Külliye is finished with news of its effect', prog.d === 1 && prog.news.some(m => /Edirne/.test(m) && /tamamlandı/.test(m) && /huzursuzluk/.test(m)), prog.news);
    // faith: unrest fades twice as fast
    const un = await E(() => { const K = window.__ke, S = K.S, i = K.PD.findIndex(d => d.key === 'sofya'); S.prov[i].un = 6; K.runHooks('roundEnd'); return S.prov[i].un; });
    check('with a Külliye unrest fades twice as fast', un === 4, un);
    // citadel slows a siege
    const cit = await E(() => { const K = window.__ke, S = K.S, i = K.PD.findIndex(d => d.key === 'selanik'), w = S.works.find(x => x.i === i && x.k === 'citadel');
      const m0 = K.battleOdds ? 0 : 0; while (!w.d) K.works.tick();
      const mods = (window.__ke.reg.BATTLE_MODS.flatMap(fn => fn({ kind: 'siege', att: 'HUN', def: 'OSM', to: i }) || [])).filter(m => m.k === 'citadel');
      return { d: w.d, mods }; });
    check('a citadel makes sieges there 50% longer', cit.d === 1 && cit.mods.length === 1 && cit.mods[0].m === 1.5 && cit.mods[0].side === 'def', cit);
    // lost province: site abandoned; conquest converts Hagia Sophia
    const lost = await E(() => { const K = window.__ke, S = K.S, pk = k => K.PD.findIndex(d => d.key === k), i = pk('sofya');
      S.prov[i].mkt = 1; S.prov[i].dev = Math.max(S.prov[i].dev, 4); const w = K.works.start('OSM', i, 'bedesten'); S.prov[i].o = 'SRB'; K.works.tick(); S.prov[i].o = 'OSM';
      const gone = !S.works.includes(w); S.news = []; K.capture(pk('istanbul'), 'OSM');
      const ay = K.works.list().find(x => x.k === 'faith' && x.i === pk('istanbul'));
      return { gone, ay: ay && ay.name, rel: ay && ay.rel, news: S.news.map(n => n.m) }; });
    check('an unfinished site is abandoned when the province is lost', lost.gone, lost);
    check('Hagia Sophia becomes a mosque when Constantinople falls', lost.ay === 'Ayasofya Camii' && lost.rel === 'İslam' && lost.news.some(m => /camiye çevrildi/.test(m)), lost);
    // madrasa: +2 development
    const med = await E(() => { const K = window.__ke, S = K.S, i = K.PD.findIndex(d => d.key === 'selanik'); const d0 = S.prov[i].dev; S.fac.OSM.gold = 500;
      const w = K.works.start('OSM', i, 'medrese'); if (!w) return { err: K.works.can('OSM', i, 'medrese') }; while (!w.d) K.works.tick(); return { d0, d1: S.prov[i].dev }; });
    check('a madrasa adds two development', med.d1 === Math.min(12, med.d0 + 2), med);
    // AI builds by the same rules
    const ai = await E(() => { const K = window.__ke, S = K.S; S.fac.MAM.gold = 3000; let n = 0; for (let k = 0; k < 60 && !S.works.some(w => w.f === 'MAM' && !w.d); k++) { K.runHooks('preAI', 'MAM'); n++; }
      const w = S.works.find(w => w.f === 'MAM' && !w.d); return { w: w && { k: w.k, i: w.i }, gold: S.fac.MAM.gold, n }; });
    check('a rich AI lays the foundations of a great work', !!ai.w && ai.gold < 3000, ai);
    // migration
    const mig = await E(() => { const K = window.__ke, s = JSON.parse(JSON.stringify(K.S)); delete s.works; K.migrate(s); return Array.isArray(s.works) && s.works.length === 0; });
    check('an old save without great works migrates (S.works = [])', mig);
    // map medallion for the works of the capital (zoomed in)
    await E(i => { const K = window.__ke; K.centerOn(K.PD[i].lx, K.PD[i].ly, 2.4); }, ed);
    await page.waitForFunction(() => window.__ke.tradeMap.medals().length > 0, null, { timeout: 20000 }).catch(() => {});
    check('great works show as medallions on the map when zoomed in', await E(() => window.__ke.tradeMap.medals().length > 0));
  }
};
