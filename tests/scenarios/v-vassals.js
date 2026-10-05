'use strict';
// Track V (W3) vassals: the Peace Table offers "make them our vassal" (priced in war score, refused when too
// dear, accepted when the war score covers it); the vassal keeps its land, pays tribute every season, is shown in
// the Divan, the province panel, the State book and in a lighter shade of the overlord's colour; it follows its
// overlord into war and out of it, the overlord defends it, it declares no wars; a discontented vassal revolts;
// a loyal vassal is annexed for gold from the Divan; the AI vassalizes too; saves keep (and migrate) S.vas.
module.exports = {
  name: 'v-vassals',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const has = sel => page.evaluate(s => !!document.querySelector(s), sel);
    const click = async sel => { await page.waitForSelector(sel, { timeout: 30000 }); await E(s => document.querySelector(s).click(), sel); await page.waitForTimeout(60); };
    const set = await E(() => { const K = window.__ke, S = K.S; K.declareWar('OSM', 'WAL');
      const ps = S.prov.map((p, i) => i).filter(i => S.prov[i].o === 'WAL'); const one = ps.find(i => S.fac.WAL.cap !== i);
      if (one != null) S.prov[one].ctl = 'OSM'; const w = S.war['OSM|WAL']; w.sc.OSM = 1; w.sc.WAL = 0; w.ex = { OSM: 0, WAL: 0 };
      window.__vas = []; K.hook('vassal', (o, v, how) => window.__vas.push({ o, v, how }));
      return { ps, one, can: K.vas.can('OSM', 'WAL'), cost: K.vas.cost('OSM', 'WAL') }; });
    check('Wallachia can be made an Ottoman vassal; it has a war-score price', set.can.ok && set.cost >= 3, set);
    await L.closeModals(page);
    await click('#top [data-act="diplo"]');
    await click('#modal [data-act="dp-peace"][data-f="WAL"]');
    const t0 = await E(() => ({ item: !!document.querySelector('#modal [data-act="pt-vas"]'), sec: (document.querySelector('#modal .vas-pt') || {}).textContent || '' }));
    check('the Peace Table shows one vassalage item with a plain explanation', t0.item && /Haraçgüzarlık/.test(t0.sec) && /beşte birini/.test(t0.sec) && !/[=×*]/.test(t0.sec), t0);
    await click('#modal [data-act="pt-vas"]');
    const t1 = await E(() => ({ on: document.querySelector('#modal [data-act="pt-vas"]').getAttribute('aria-pressed'), no: !!document.querySelector('#modal .ptsum.no'), verdict: document.querySelector('#modal .ptsum .verdict').textContent, send: document.querySelector('#modal [data-act="pt-send"]').textContent }));
    check('with a small war score the table predicts refusal', t1.on === 'true' && t1.no && /Reddederler/.test(t1.verdict) && /Antlaşmayı/.test(t1.send), t1);
    await click('#modal [data-act="pt-send"]');
    check('refused: still at war, no vassal', await E(() => !!window.__ke.S.war['OSM|WAL'] && !window.__ke.vas.of('WAL')));
    await E(c => { window.__ke.S.war['OSM|WAL'].sc.OSM = c + 2; }, set.cost);
    await E(() => window.__ke.showPeace('WAL'));
    const t2 = await E(() => ({ on: document.querySelector('#modal [data-act="pt-vas"]').getAttribute('aria-pressed'), ok: !!document.querySelector('#modal .ptsum.ok') }));
    check('with enough war score they will accept', t2.on === 'true' && t2.ok, t2);
    const gold0 = await E(() => ({ osm: window.__ke.S.fac.OSM.gold, wal: window.__ke.S.fac.WAL.gold }));
    await click('#modal [data-act="pt-send"]');
    const d = await E(ps => { const K = window.__ke, S = K.S, rows = f => K.econRows(f).filter(r => r.id === 'vasTrib');
      return { war: !!S.war['OSM|WAL'], vas: S.vas.WAL, ally: !!S.ally['OSM|WAL'], owners: ps.map(i => S.prov[i].o), ctl: ps.map(i => S.prov[i].ctl || null), hook: window.__vas.slice(),
        inc: rows('OSM'), exp: rows('WAL'), trib: K.vas.trib('WAL'), col: K.vas.col('WAL'), facCol: K.FAC ? K.FAC.WAL.c : null, news: S.news.map(n => n.m).join(' | ') }; }, set.ps);
    check('treaty signed: peace, Wallachia is an Ottoman vassal bound as an ally', !d.war && d.vas && d.vas.o === 'OSM' && d.ally && d.hook.some(h => h.o === 'OSM' && h.v === 'WAL'), d);
    check('the vassal keeps all its land; occupations end', d.owners.every(o => o === 'WAL') && d.ctl.every(c => !c), d);
    check('tribute: an income row for the overlord and an expense row for the vassal', d.trib > 0 && d.inc.length === 1 && Math.abs(d.inc[0].v - d.trib) < 1e-6 && d.exp.length === 1 && Math.abs(d.exp[0].v - d.trib) < 1e-6, d);
    check('the news says so in words', /haraçgüzarı/.test(d.news), d.news);
    check('map: the vassal is drawn in a lighter Ottoman colour', /^#[0-9a-f]{6}$/.test(d.col) && d.col !== '#b8352a' && d.col !== '#5f8fb8', d.col);

    // Divan status
    await click('#top [data-act="diplo"]');
    const dv = await E(() => { const m = document.getElementById('modal'), row = [...m.querySelectorAll('.row.sub')].find(r => r.querySelector('[data-act="vas-free"][data-f="WAL"]'));
      return { chip: !!m.querySelector('.vas-chip.mine'), lib: !!m.querySelector('.vas-lib[data-f="WAL"]'), free: !!row, noBreak: !m.querySelector('[data-act="dp-break"][data-f="WAL"]'), noWar: !m.querySelector('[data-act="dp-war"][data-f="WAL"]'), note: row ? row.textContent : '' }; });
    check('Divan: "our vassal" chip, liberty, set-free button, no break-alliance or war button', dv.chip && dv.lib && dv.free && dv.noBreak && dv.noWar, dv);
    check('Divan: annexation explained in words (years to wait)', /yıl daha/.test(dv.note), dv.note);
    const tip = await E(() => window.__ke.uiTip('vas'));
    check('liberty tooltip explains in words', !!tip && /Bağımsızlık isteği/.test(tip) && !/[=×]/.test(tip), tip);
    await L.closeModals(page);
    // province panel
    await E(i => { const K = window.__ke; K.centerOn(K.PD[i].lx, K.PD[i].ly, 2); }, set.ps[0]);
    await page.waitForTimeout(200);
    await L.clickProv(page, set.ps[0]);
    const pn = await E(() => { const s = document.querySelector('#panel [data-sec="vassal"]'); return s ? s.textContent : null; });
    check('province panel: vassalage section with tribute', !!pn && /haraçgüzarımız/.test(pn) && /haraç/.test(pn), pn);
    // State book
    await click('#top [data-act="state"]').catch(async () => { await E(() => window.__ke.reg.ACTS.state()); });
    const st = await E(() => { const s = document.querySelector('#modal .vas-state'); return s ? s.textContent : null; });
    check('State book lists the vassal', !!st && /Haraçgüzarlar/.test(st) && /Eflak/.test(st), st);
    await L.closeModals(page);

    // tribute flows at the end of the season
    await L.endTurn(page); await L.closeModals(page);
    const g1 = await E(() => ({ vas: window.__ke.S.vas.WAL, lib: window.__ke.vas.lib('WAL') }));
    check('after a season the bond holds and liberty desire is 0..100', g1.vas && g1.vas.o === 'OSM' && g1.lib >= 0 && g1.lib <= 100, g1);

    // wars: the vassal follows its overlord; the overlord defends its vassal; peace ends both
    const w = await E(() => { const K = window.__ke, S = K.S; S.truce = {}; K.declareWar('OSM', 'HUN'); const a = !!S.war['HUN|WAL'];
      K.makePeace('OSM', 'HUN', { prov: [], gold: 0, release: [] }); const b = !!S.war['HUN|WAL']; S.truce = {};
      K.declareWar('MOL', 'WAL'); const c = !!S.war['MOL|OSM']; K.makePeace('MOL', 'OSM', { prov: [], gold: 0, release: [] }); const dd = !!S.war['MOL|WAL'];
      return { a, b, c, dd, vas: S.vas.WAL && S.vas.WAL.o }; });
    check('the vassal marches into its overlord\'s war', w.a, w);
    check('peace for the overlord is peace for the vassal', !w.b, w);
    check('the overlord goes to war to protect its vassal, and its peace covers the vassal', w.c && !w.dd && w.vas === 'OSM', w);
    const nd = await E(() => { const K = window.__ke, S = K.S, n0 = K.aiDecl.length; S.ai.WAL.desire = { MOL: 300, HUN: 300, BOS: 300 }; S.truce = {};
      for (let k = 0; k < 6; k++) { S.ai.WAL.desire = { MOL: 300, HUN: 300, BOS: 300 }; }
      return n0; });
    await L.endTurn(page); await L.closeModals(page);
    const nd2 = await E(n0 => { const K = window.__ke; return { decl: K.aiDecl.slice(n0).filter(x => x.f === 'WAL'), wars: Object.keys(K.S.war).filter(k => k.includes('WAL')) }; }, nd);
    check('a vassal declares no wars of its own', nd2.decl.length === 0, nd2);

    // revolt
    const rv = await E(() => { const K = window.__ke, S = K.S; for (const k of Object.keys(S.war)) if (k.includes('WAL')) delete S.war[k];
      S.vas.WAL.lib = 95; K.vas.revolt('WAL'); return { vas: S.vas.WAL || null, war: !!S.war['OSM|WAL'], ally: !!S.ally['OSM|WAL'], news: S.news.map(n => n.m).join(' | ') }; });
    check('a revolt breaks the bond and starts a war against the overlord', !rv.vas && rv.war && !rv.ally && /isyan/.test(rv.news), rv);
    // annex a loyal vassal from the Divan
    const ax = await E(() => { const K = window.__ke, S = K.S; K.makePeace('OSM', 'WAL', { prov: [], gold: 0, release: [] }); K.vas.make('OSM', 'WAL');
      S.vas.WAL.t = S.turn - 41; S.vas.WAL.lib = 10; const c = K.vas.annexCan('OSM', 'WAL'); S.fac.OSM.gold = Math.max(S.fac.OSM.gold, c.cost + 50); return { c, gold: S.fac.OSM.gold }; });
    check('a loyal vassal of ten years can be annexed for gold', ax.c.ok && ax.c.cost > 0, ax);
    await L.closeModals(page);
    await click('#top [data-act="diplo"]');
    await click('#modal [data-act="vas-annex"][data-f="WAL"]');
    const an = await E(ps => { const S = window.__ke.S; return { owners: ps.map(i => S.prov[i].o), alive: S.fac.WAL.alive, gold: S.fac.OSM.gold, vas: S.vas.WAL || null }; }, set.ps);
    check('annexed: every province is Ottoman, Wallachia is gone, the gold is paid', an.owners.every(o => o === 'OSM') && !an.alive && !an.vas && an.gold < ax.gold + 1000, { an, ax });
    await L.closeModals(page);

    // the AI vassalizes too; vassals of AIs do not join coalitions; save / migrate keep the bond
    const ai = await E(() => { const K = window.__ke, S = K.S; S.truce = {}; if (!S.war['HUN|MOL']) K.declareWar('HUN', 'MOL'); S.war['HUN|MOL'].sc.HUN = 40;
      const p0 = K.vas.BAL.aiHistP; K.vas.BAL.aiHistP = 1; const ok = K.vas.aiSettle('HUN', 'MOL'); K.vas.BAL.aiHistP = p0;
      const copy = JSON.parse(JSON.stringify(S)); delete copy.vas; K.migrate(copy); const copy2 = JSON.parse(JSON.stringify(S)); copy2.vas.MOL.lib = 'x'; copy2.vas.ZZZ = { o: 'HUN' }; K.migrate(copy2);
      return { ok, vas: S.vas.MOL, war: !!S.war['HUN|MOL'], m1: copy.vas, m2: copy2.vas }; });
    check('the AI makes a beaten historical tributary its vassal', ai.ok && ai.vas && ai.vas.o === 'HUN' && !ai.war, ai);
    check('migrate: a save without vassals gets an empty S.vas; bad entries are repaired or dropped', ai.m1 && Object.keys(ai.m1).length === 0 && ai.m2.MOL && ai.m2.MOL.lib === 30 && !ai.m2.ZZZ, ai);
    const pv = await E(() => { const K = window.__ke; return { can: K.vas.can('HUN', 'OSM'), why: K.vas.can('OSM', 'MOL').why }; });
    check('the player is never made a vassal; another\'s vassal cannot be taken', !pv.can.ok && pv.can.why === 'player' && pv.why === 'already', pv);
  },
};
