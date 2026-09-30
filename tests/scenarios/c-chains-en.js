'use strict';
// Track C, Wave 2, English coverage: reloads the game in English and walks every stage of every history chain
// (in several world states, so both branches of state-dependent stages are built), takes every choice on a copy of
// the state and checks the news and chronicle lines it writes; then the claimant war, the Habsburg union, the
// Pressburg claim, capture flavour for every culture and every battle name. A line fails when it is empty or
// still looks Turkish once proper names (provinces, realms, characters) are stripped.
module.exports = {
  name: 'c-chains-en',
  fac: null,
  async run(page, L, check) {
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('ke-lang', 'en'); });
    await page.reload({ waitUntil: 'domcontentloaded' }); await L.waitLoaded(page);
    await L.startGame(page, 'GEN');
    await L.closeModals(page);
    const res = await page.evaluate(() => {
      const K = window.__ke, S = K.S, PD = K.PD, T = K.t2, pk = k => PD.findIndex(d => d.key === k);
      const TR_CHARS = /[çğıöşüÇĞİÖŞÜâîû]/;
      const TR_WORDS = /\b(ve|ile|bir|için|asker|ordu|ordusu|savaş|eyalet|devlet|altın|Devam|Kabul|Reddet|Kapat|değil|daha|yok|tur|Tur|Turu|Bitir|kale|garnizon|Muharebe|Muharebesi|Kuşatması|Zafer|Yenilgi|Barış|Mevsim|Rapor|al(?!-)|gelişimi|huzursuz|ilişki|davacı|Davacı|Sultan'a|surları)\b/;
      const out = { bad: [], missing: [], n: 0, stages: 0, choices: 0 };
      const names = () => { const s = new Set(); for (const d of PD) s.add(d.name); for (const f of T.FK) { s.add(T.FAC[f].n); s.add(T.FAC[f].s); try { s.add(K.rulerName(f)); } catch (e) {} }
        for (const c of Object.values(S.chars || {})) { if (c.n) s.add(c.n); if (c.rn) s.add(c.rn); try { s.add(K.chDisp(c.n, c.f)); s.add(K.chDisp(c.rn || c.n, c.f)); } catch (e) {} }
        return [...s].filter(Boolean).sort((a, b) => b.length - a.length); };
      const check = (where, s) => { out.n++; if (s == null || s === '') { out.missing.push(where); return; } s = String(s);
        if (!(TR_CHARS.test(s) || TR_WORDS.test(s))) return; let t = s; for (const nm of names()) t = t.split(nm).join('');
        if (TR_CHARS.test(t) || TR_WORDS.test(t)) out.bad.push(where + ': ' + s.slice(0, 200)); };
      // the world the late chains expect: a Safavid Shah on the eastern border
      S.fac.SAF.alive = true; S.fac.SAF.gold = 100; S.fac.SAF.ruler = K.ch.create({ n: 'İsmail', rn: 'Şah İsmail', f: 'SAF', role: 'ruler', born: 1487 }).id;
      for (const k of ['tebriz', 'hoy', 'erzurum', 'erzincan', 'bayburt', 'sebinkarahisar', 'van']) K.chn.cede(pk(k), 'SAF'); S.fac.SAF.cap = pk('tebriz');
      for (const f of T.FK) if (S.fac[f].alive) S.fac[f].gold = 900;
      S.turn = K.chn.turn(1520);
      const snap = JSON.stringify(S), restore = () => { const o = JSON.parse(snap); for (const k of Object.keys(S)) if (!(k in o)) delete S[k]; Object.assign(S, o); };
      const VARIANTS = {
        base: () => {},
        held: () => { for (const k of ['otranto', 'tebriz', 'halep', 'sam', 'kahire', 'rodos']) K.capture(pk(k), 'OSM'); },
        war: () => { for (const g of ['ARA', 'SAF', 'MAM', 'RHO', 'HUN', 'HAB', 'BYZ', 'AKK']) if (!S.war[['OSM', g].sort().join('|')]) K.declareWar('OSM', g); },
        rhoGone: () => { for (const k of ['rodos', 'bodrum']) K.capture(pk(k), 'OSM'); },
      };
      const lines = fn => { const a = S.news.length, b = S.log.length; try { fn(); } catch (e) { out.bad.push('THREW ' + (e.stack || e).toString().slice(0, 200)); }
        return [...S.news.slice(a).map(x => x.m), ...S.log.slice(b).map(x => x.m)]; };
      for (const C of K.CHAINS) C.stages.forEach((sg, k) => {
        for (const v of Object.keys(VARIANTS)) {
          restore(); lines(VARIANTS[v]);
          const osmKin = Object.values(S.chars).find(c => c.f === 'OSM' && c.role !== 'ruler' && c.died == null);
          const mk = () => ({ stage: k, t: 0, data: { t0: 0, ruler: -1, cem: osmKin && osmKin.id, zincir: 1 }, done: false, wait: false });
          let spec; try { spec = sg.fire(mk()); } catch (e) { out.bad.push(`chain ${C.id}.${k} (${v}) fire threw ${e}`); continue; }
          out.stages++; const w = `chain ${C.id}.${k} (${v})`;
          if (spec.t) { check(w + ' title', spec.t); check(w + ' text', spec.d); }
          spec.ch.forEach((c, j) => { out.choices++; if (spec.t) check(`${w} choice ${j}`, c.l);
            if (!c.f) return; restore(); lines(VARIANTS[v]); const st = mk(); st.data.cem = undefined;
            lines(() => c.f(st)).forEach(l => check(`${w} choice ${j} news`, l)); });
        }
      });
      // battle-born events of the chains (Shah wounded, the king drowned, the old sultan falls)
      restore(); S.chains.caldiran = { stage: 2, t: 0, data: { charge: S.turn + 5 }, done: false, wait: false };
      S.chains.mohac = { stage: 1, t: 0, data: { king: S.turn + 5 }, done: true, wait: false };
      S.chains.misir = { stage: 3, t: 0, data: {}, done: false, wait: false };
      for (const [att, def, key] of [['OSM', 'SAF', 'hoy'], ['OSM', 'HUN', 'pecuy'], ['OSM', 'MAM', 'halep']]) {
        const rep = { kind: 'field', att, def, win: true, to: pk(key), n: 50000, defT: 30000, aLoss: 1000, dLoss: 9000, mods: [] };
        lines(() => { for (const h of K.reg.HOOKS.battleResolved) h.fn(rep); }).forEach(l => check(`battle ${key} news`, l));
      }
      // the Habsburg union and the Pressburg claim
      restore(); lines(() => K.chn.union('HUN', 'HAB')).forEach(l => check('union news', l));
      restore(); lines(() => { K.chn.cede(pk('istolni'), 'HAB'); }).forEach(l => check('cede news', l));
      // the claimant war (when the FAC slot exists)
      out.slot = !!T.FAC.CLM;
      if (out.slot) for (const how of ['won', 'exiled', 'crushed', 'dead']) {
        restore(); let id = null; lines(() => { id = K.chn.clmSpawn('KAR'); }).forEach(l => check('claimant spawn news', l));
        check('claimant realm short name', T.FAC.CLM.s); check('claimant realm name', T.FAC.CLM.n);
        if (how === 'won') lines(() => { K.capture(S.fac.KAR.cap, 'CLM'); K.chn.clmTick(); }).forEach(l => check('claimant won news', l));
        else if (how === 'dead') lines(() => { S.chars[id].died = S.turn; K.chn.clmTick(); }).forEach(l => check('claimant dead news', l));
        else if (how === 'crushed') lines(() => { for (let i = 0; i < S.prov.length; i++) if (S.prov[i].o === 'CLM') K.capture(i, 'KAR'); }).forEach(l => check('claimant crushed news', l));
        else lines(() => { delete S.war['CLM|KAR']; K.chn.clmTick(); }).forEach(l => check('claimant exiled news', l));
      }
      // capture flavour for every captor culture and faith, and every battle name
      restore();
      const vic = { İslam: pk('korint'), Ortodoks: pk('konya'), Katolik: pk('trabzon') };
      for (const f of T.FK) for (const old of ['BYZ', 'OSM', 'VEN', 'KAR']) { if (f === old || f === 'CLM') continue; check(`flavour ${f}<-${old}`, K.chn.flav(pk('sakiz'), f, old)); }
      for (const d of PD) for (const kind of ['field', 'assault', 'sally']) check(`battle name ${d.key} ${kind}`, K.chn.bname({ to: d.i, kind }));
      restore(); S.turn = 4;   // dates were jumped without aging anybody
      return { ...out, en: T.FAC.OSM.s };
    });
    check('the game runs in English', res.en === 'Ottomans', res.en);
    check(`every chain stage built (${res.stages} stage builds, ${res.choices} choices, ${res.n} lines checked)`, res.stages > 80 && res.missing.length === 0, res.missing.slice(0, 10));
    check('no Turkish left in chain, claimant, union, flavour and battle-name text', res.bad.length === 0, [...new Set(res.bad)].slice(0, 15));
    check('claimant texts checked when the FAC slot exists', true, { slot: res.slot });
    await page.evaluate(() => localStorage.setItem('ke-lang', 'tr'));
  },
};
