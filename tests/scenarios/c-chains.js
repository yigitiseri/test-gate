'use strict';
// Track C, Wave 2 chains: Otranto 1480, Chaldiran 1514, Marj Dabiq / Ridaniya 1516-17, Rhodes 1522, Mohács 1526
// with the Habsburg inheritance of Hungary (Treaty of Pressburg), Vienna 1529; the 1453 siege hooks; battle names
// and capture flavour in the chronicle. The player is Genoa, so every chain is decided by the AI; each chain is
// isolated (the others are closed), its date is set, and the world is arranged the way history had it.
module.exports = {
  name: 'c-chains',
  fac: 'GEN',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    // a helper in the page: close every chain except `ids`, jump to a year, give gold
    await E(() => {
      const K = window.__ke, S = K.S;
      window.__c = {
        only(ids, year) { for (const C of K.CHAINS) if (!ids.includes(C.id)) S.chains[C.id] = { stage: 0, t: 0, data: {}, done: true, wait: false }; else delete S.chains[C.id];
          if (year) S.turn = K.chn.turn(year); },
        st: id => { const s = S.chains[id]; return s ? { stage: s.stage, done: s.done, data: s.data } : null; },
        own: k => S.prov[K.PD.findIndex(d => d.key === k)].o,
        pk: k => K.PD.findIndex(d => d.key === k),
        give(k, f) { K.chn.cede(this.pk(k), f); },
        war: (a, b) => !!S.war[[a, b].sort().join('|')],
        nb: (a, b) => { for (let i = 0; i < S.prov.length; i++) if (S.prov[i].o === a) for (const j of K.PD[i].adj) if (S.prov[j].o === b) return true; return false; },
      };
    });

    // ---------- Otranto 1480 ----------
    const o1 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; c.only(['otranto'], 1480); S.fac.OSM.gold = 500;
      K.chn.tick(); const a = K.armyList('OSM').find(x => x.loc === c.pk('avlonya') && x.n === 8000);
      return { st: c.st('otranto'), war: c.war('OSM', 'ARA'), army: !!a, gen: a && a.gen != null && S.chars[a.gen].n }; });
    check('Otranto: the Ottomans send the fleet and declare war on Naples', o1.st.stage === 1 && o1.war && o1.st.data.t0 != null, o1);
    check('Otranto: a landing army of 8k at Valona with a commander', o1.army && !!o1.gen, o1);
    const o2 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; S.fac.ARA.gold = 500; K.capture(c.pk('otranto'), 'OSM'); K.chn.tick(); return c.st('otranto'); });
    check('Otranto: Naples gathers a crusading army after the fall', o2.stage === 2 && o2.data.cr > 0, o2);
    const o3 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; K.ch.kill(K.ch.ruler('OSM').id, 'natural'); K.chn.tick();
      return { st: c.st('otranto'), own: c.own('otranto'), war: c.war('OSM', 'ARA') }; });
    check('Otranto: a new sultan recalls the garrison, Otranto returns to Naples and peace is made', o3.st.done && o3.own === 'ARA' && !o3.war, o3);

    // ---------- Chaldiran 1514 (the Safavids are placed where history had them) ----------
    const c1 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; c.only(['caldiran'], 1514);
      S.fac.SAF.alive = true; S.fac.SAF.gold = 100; S.fac.SAF.ruler = K.ch.create({ n: 'İsmail', rn: 'Şah İsmail', f: 'SAF', role: 'ruler', born: 1487, traits: ['cengaver'] }).id; for (const k of ['tebriz', 'hoy', 'erzurum', 'erzincan', 'bayburt', 'sebinkarahisar', 'van']) c.give(k, 'SAF'); S.fac.SAF.cap = c.pk('tebriz');
      K.chn.tick(); return { st: c.st('caldiran'), war: c.war('OSM', 'SAF'), nb: c.nb('OSM', 'SAF') }; });
    check('Chaldiran: the Sultan marches against the Shah', c1.nb && c1.war && c1.st.stage === 1 && c1.st.data.guns > 0, c1);
    const c2 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; K.chn.choose('caldiran', 1);
      const odds = K.battleOdds({ att: 'OSM', to: c.pk('erzincan'), n: 20000 }); return { st: c.st('caldiran'), mods: odds.mods.map(m => m.l) }; });
    check('Chaldiran: scorched earth weakens Ottoman attacks on Safavid land', c2.st.stage === 2 && c2.mods.includes('Yakılmış topraklar'), c2);
    const c3 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; const g = S.fac.OSM.gold; K.capture(c.pk('tebriz'), 'OSM'); const g1 = S.fac.OSM.gold; K.chn.tick();
      return { st: c.st('caldiran'), own: c.own('tebriz'), gain: S.fac.OSM.gold - g1 }; });
    check('Chaldiran: the Janissaries will not winter in Tabriz; the treasury is taken and Tabriz returned', c3.st.done && c3.own === 'SAF' && c3.gain === 60, c3);

    // ---------- Marj Dabiq and Ridaniya 1516-17 ----------
    const m1 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; c.only(['misir'], 1516); c.give('maras', 'OSM'); c.give('elbistan', 'OSM');
      S.fac.MAM.gold = 0; S.fac.OSM.gold = 500; K.chn.tick(); return { st: c.st('misir'), war: c.war('OSM', 'MAM'), nb: c.nb('OSM', 'MAM') }; });
    check('Marj Dabiq: the Mamluk sultan marches to Aleppo (war)', m1.nb && m1.war && m1.st.stage === 2, m1);
    const m2 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; K.chn.tick(); const odds = K.battleOdds({ att: 'OSM', to: c.pk('halep'), n: 20000 });
      return { st: c.st('misir'), mods: odds.mods.map(m => m.l) }; });
    check('Khair Bey\'s letter: the Mamluks are weakened in Syria', m2.st.stage === 3 && m2.st.data.hayir > 0 && m2.mods.includes('Hayır Bey\'in ihaneti'), m2);
    const m3 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; const r0 = K.rulerName('MAM');
      const rep = { kind: 'field', att: 'OSM', def: 'MAM', win: true, to: c.pk('halep'), from: c.pk('maras'), n: 60000, defT: 40000, aLoss: 3000, dLoss: 12000, mods: [] };
      for (const h of K.reg.HOOKS.battleResolved) h.fn(rep);
      K.capture(c.pk('halep'), 'OSM'); K.chn.tick(); return { st: c.st('misir'), r0, r1: K.rulerName('MAM'), bname: rep.bname }; });
    check('Marj Dabiq: the battle keeps its name, the old sultan falls and a new one is chosen', m3.bname === 'Mercidabık Muharebesi' && m3.r0 !== m3.r1, m3);
    check('Ridaniya: the new sultan prepares Cairo (a guerrilla war when the treasury is empty)', m3.st.stage === 4 && m3.st.data.cete > 0, m3);
    const m4 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; K.capture(c.pk('kahire'), 'OSM'); K.chn.tick(); const r = K.ch.ruler('OSM');
      return { st: c.st('misir'), pious: r.traits.includes('dindar'), mamAlive: S.fac.MAM.alive, log: S.log.slice(-6).map(x => x.m) }; });
    check('Cairo falls: Servant of the Two Holy Sanctuaries, the ruler becomes Pious', m4.st.done && m4.pious, m4);

    // ---------- Rhodes 1522 ----------
    const r1 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; c.only(['rodos'], 1522); S.fac.OSM.gold = 500; S.fac.RHO.gold = 500;
      K.chn.tick(); const s0 = c.st('rodos'); K.chn.tick(); return { s0, st: c.st('rodos'), war: c.war('OSM', 'RHO') }; });
    check('Rhodes: the Sultan lands with sappers; the Grand Master digs counter-mines', r1.war && r1.s0.data.lagim === 1 && r1.st.stage === 2 && r1.st.data.tadini === 1, r1);
    const r2 = await E(() => { const K = window.__ke, S = K.S, c = window.__c;
      const odds = K.battleOdds({ att: 'OSM', to: c.pk('rodos'), n: 20000 }); const s = { i: c.pk('rodos'), f: 'OSM', prog: 1, need: 5 };
      for (const h of (K.reg.HOOKS.siegeTick || [])) h.fn(s);
      K.capture(c.pk('rodos'), 'OSM'); K.chn.tick();
      return { st: c.st('rodos'), alive: S.fac.RHO.alive, bodrum: c.own('bodrum'), mods: odds.mods.map(m => m.l), prog: s.prog }; });
    check('Rhodes: counter-mines on the walls (+defence) and the siege hook nets the two', r2.mods.includes('Tadini\'nin karşı lağımları') && Math.abs(r2.prog - 1.05) < 1e-9, r2);
    check('Rhodes: honourable surrender, the Order leaves the map and Bodrum is Ottoman', r2.st.done && !r2.alive && r2.bodrum === 'OSM', r2);

    // ---------- Mohács 1526 and the Treaty of Pressburg ----------
    const h1 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; c.only(['mohac'], 1526); S.fac.OSM.gold = 500;
      K.chn.tick(); const s0 = c.st('mohac'); if (s0.stage === 0) { K.chn.choose('mohac', 0); } K.chn.tick();
      return { s0, st: c.st('mohac'), war: c.war('OSM', 'HUN'), nb: c.nb('OSM', 'HUN') }; });
    check('Mohács: the Sultan sets out, the king gives battle on the plain', h1.nb && h1.war && h1.st.done && h1.st.data.king > 0, h1);
    const h2 = await E(() => { const K = window.__ke, S = K.S, c = window.__c;
      // no heir, no kin, no one left to invite: the throne will stand empty when the king dies
      for (const id in S.chars) { const x = S.chars[id]; if (x.f === 'HUN' && x.died == null && x.role !== 'ruler' && x.role !== 'gen') K.ch.kill(x.id, 'natural'); }
      const provs = S.prov.filter(p => p.o === 'HUN').length, habBefore = S.prov.filter(p => p.o === 'HAB').length;
      const rep = { kind: 'field', att: 'OSM', def: 'HUN', win: true, to: c.pk('pecuy'), from: c.pk('belgrad'), n: 60000, defT: 26000, aLoss: 2000, dLoss: 15000, mods: [] };
      for (const h of K.reg.HOOKS.battleResolved) h.fn(rep);
      return { st: c.st('mohac'), hun: S.fac.HUN.alive, budin: c.own('budin'), habGain: S.prov.filter(p => p.o === 'HAB').length - habBefore, provs, war: c.war('OSM', 'HAB'), bname: rep.bname,
        log: S.log.slice(-8).map(x => x.m) }; });
    check('Mohács: the battle keeps its name and the king drowns in flight', h2.bname === 'Mohaç Muharebesi' && h2.st.data.kingDied > 0, h2);
    check('Pressburg: Hungary passes whole to the Habsburgs, with its war', !h2.hun && h2.budin === 'HAB' && h2.habGain === h2.provs && h2.war, h2);

    // ---------- Vienna 1529 ----------
    const v1 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; c.only(['viyana'], 1529); S.fac.HAB.gold = 500;
      K.chn.tick(); K.chn.tick(); return { st: c.st('viyana'), nb: c.nb('OSM', 'HAB') }; });
    check('Vienna: the Sultan marches, Salm repairs the walls', v1.nb && v1.st.stage === 2 && v1.st.data.march != null && v1.st.data.walls > 0, v1);
    const v2 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; const v = c.pk('viyana'), nbr = K.PD[v].adj[0];
      const a = K.armyCreate('OSM', nbr, 30000); S.turn += 2; while (S.turn % 4 !== 2) S.turn++;
      const odds = K.battleOdds({ att: 'OSM', to: v, n: 30000 }); K.chn.tick();
      return { st: c.st('viyana'), loc: a.loc, own: S.prov[a.loc].o, mods: odds.mods.map(m => m.l) }; });
    check('Vienna: Salm\'s walls in the battle odds', v2.mods.includes('Salm\'ın surları'), v2.mods);
    check('Vienna: rain and winter, the siege is lifted and the army falls back to Ottoman land', v2.st.done && v2.own === 'OSM', v2);

    // ---------- 1453 against real sieges (Track B's hooks, driven by hand) ----------
    const f1 = await E(() => { const K = window.__ke, S = K.S, c = window.__c; c.only(['fetih']); S.turn = 10;
      const st = S.chains.fetih || (S.chains.fetih = { stage: 2, t: 0, data: {}, done: false, wait: false }); Object.assign(st.data, { hisar: 1, gemi: 1 });
      const i = c.pk('istanbul'); const s = { i, f: 'OSM', prog: 2, need: 6, t0: S.turn - 2 };
      for (const h of (K.reg.HOOKS.siegeTick || [])) h.fn(s);
      if (!S.war['BYZ|OSM']) K.declareWar('OSM', 'BYZ');
      for (const h of (K.reg.HOOKS.siegeFell || [])) h.fn(i, 'OSM');
      return { prog: s.prog, own: c.own('istanbul'), fetih: !!S.flags.fetih, byzRuler: K.ch.ruler('BYZ') && K.ch.ruler('BYZ').n }; });
    check('1453: the Strait-Cutter fortress and the ships over land speed the siege', Math.abs(f1.prog - 2.6) < 1e-9, f1);
    check('1453: when the siege of Constantinople succeeds the city falls to the Ottomans (not a mere occupation)', f1.own === 'OSM' && f1.fetih, f1);
    await L.closeModals(page);

    // ---------- chronicle: battle names and capture flavour ----------
    const ch = await E(() => { const K = window.__ke, S = K.S, c = window.__c;
      const nm = [K.chn.bname({ to: c.pk('pecuy'), kind: 'field' }), K.chn.bname({ to: c.pk('belgrad'), kind: 'assault' }), K.chn.bname({ to: c.pk('hoy'), kind: 'field' })];
      const fl = [K.chn.flav(c.pk('korint'), 'OSM', 'BYZ'), K.chn.flav(c.pk('izmir'), 'VEN', 'OSM'), K.chn.flav(c.pk('split'), 'HUN', 'VEN')];
      const n0 = S.log.length; K.capture(c.pk('sakiz'), 'VEN'); const cap = S.log.slice(n0).map(x => x.m);
      // a real field battle next to the player's province
      const g = c.pk('kefe'); return { nm, fl, cap }; });
    check('battle names', ch.nm[0] === 'Mohaç Muharebesi' && ch.nm[1] === 'Belgrad Kuşatması' && ch.nm[2] === 'Çaldıran Muharebesi', ch.nm);
    check('capture flavour by faith and culture', /camiye|cami/.test(ch.fl[0]) && /kilise/.test(ch.fl[1]) && /Macar sancağı/.test(ch.fl[2]), ch.fl);
    check('losing Chios to Venice writes a Venetian line in the chronicle', ch.cap.some(m => /Aziz Markos aslanı Sakız/.test(m)), ch.cap);
    await L.closeModals(page);
    await page.click('#top [data-act="chron"]'); await page.waitForSelector('#modal:not([hidden])');
    const chron = await E(() => document.getElementById('modal').innerText);
    check('the chronicle shows the named battles', /Mohaç Muharebesi/.test(chron) && /Mercidabık Muharebesi/.test(chron), chron.slice(0, 400));
    await L.closeModals(page);
  },
};
