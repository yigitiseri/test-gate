#!/usr/bin/env node
'use strict';
/*
 * English data check (T2): mission, event and chain text only shows when it fires, so this walks the data
 * directly in an English page (ke-lang=en):
 *   - every mission of every realm (title, description) and both branch names,
 *   - every pool event built for every living realm with several seeds (title, text, choice labels), then
 *     every choice is taken and the news / log lines it writes are checked,
 *   - every stage of every history chain (title, text, choices, and the news of each choice),
 *   - economy rows, battle modifier labels, army names and army-move reasons.
 * A field is reported when it is missing or still looks Turkish. Proper names coming from data owned by other
 * translators (province, realm, character names) are stripped first and counted separately.
 *
 *   node tests/i18n-data.js [--assert]
 */
const L = require('./lib');

(async () => {
  const o = L.opts({ assert: false });
  const { browser, page, errors } = await L.launch({ lang: 'en' });
  let res;
  try {
    await L.startGame(page, 'OSM');
    res = await page.evaluate(() => {
      const K = window.__ke, T = K.t2, S = K.S;
      const TR_CHARS = /[çğıöşüÇĞİÖŞÜâîû]/;
      const TR_WORDS = /\b(ve|ile|bir|için|asker|ordu|ordusu|savaş|eyalet|devlet|altın|Devam|Kabul|Reddet|Kapat|değil|daha|yok|tur|Tur|Turu|Bitir|kale|garnizon|Muharebe|Zafer|Yenilgi|Barış|Mevsim|Rapor|al|ile|gelişimi|huzursuz|ilişki)\b/;
      // names that come from other translators' data (T1): strip before judging our own text
      const names = new Set();
      for (const d of K.PD) names.add(d.name);
      for (const f of T.FK) { names.add(T.FAC[f].n); names.add(T.FAC[f].s); try { names.add(K.rulerName(f)); } catch (e) {} }
      for (const c of Object.values(S.chars || {})) { if (c.n) names.add(c.n); if (c.rn) names.add(c.rn); try { names.add(T.chLabel(c)); } catch (e) {} }
      const NAMES = [...names].filter(Boolean).sort((a, b) => b.length - a.length);
      const out = { bad: [], nameOnly: [], other: [], n: 0, missing: [] };
      // lines produced by other translators' code (03c characters: ruler traits, regency, deaths / successions)
      const OTHER = [/^econ \w+ ch-(?!cem\b)/, /^chain belgrad\.2 choice 0 news: (?!By order)/];
      const check = (where, s) => {
        out.n++;
        if (s == null || s === '') { out.missing.push(where); return; }
        s = String(s);
        if (!(TR_CHARS.test(s) || TR_WORDS.test(s))) return;
        let t = s; for (const nm of NAMES) t = t.split(nm).join('');
        if (TR_CHARS.test(t) || TR_WORDS.test(t)) (OTHER.some(r => r.test(where + ': ' + s)) ? out.other : out.bad).push(where + ': ' + s.slice(0, 160));
        else out.nameOnly.push(where + ': ' + s.slice(0, 160));
      };
      const newLines = (fn) => { const a = S.news.length, b = S.log.length; try { fn(); } catch (e) { out.bad.push('THREW ' + e.message); }
        return [...S.news.slice(a).map(x => x.m), ...S.log.slice(b).map(x => x.m)]; };
      // missions
      let nm = 0;
      for (const f of Object.keys(K.MIS)) {
        const br = T.MIS_BR_EN[f]; if (!br || br.length !== 2) out.missing.push('branches ' + f); else br.forEach((b, k) => check(`branch ${f}.${k}`, b));
        for (const m of K.MIS[f]) { nm++; const e = T.MIS_EN[f] && T.MIS_EN[f][m.id]; if (!e) { out.missing.push(`mission ${f}.${m.id}`); continue; }
          const x = T.misTxt(m, f); check(`mission ${f}.${m.id} title`, x.t); check(`mission ${f}.${m.id} desc`, x.d);
          if (x.t !== e[0]) out.bad.push(`mission ${f}.${m.id}: misTxt did not return the English title`); }
        for (const id of Object.keys(T.MIS_EN[f] || {})) if (!K.MIS[f].some(m => m.id === id)) out.bad.push(`MIS_EN ${f}.${id} has no mission`);
      }
      // pool events, every realm, several seeds, every choice
      let ne = 0; const evSeen = new Set();
      for (const f of T.FK) {
        if (!S.fac[f].alive) continue;
        const mine = []; for (let i = 0; i < K.PD.length; i++) if (S.prov[i].o === f) mine.push(i);
        if (mine.length > 1) S.prov[mine[1]].un = 3;
        for (const ev of K.EVENTS) for (let seed = 1; seed <= 6; seed++) {
          let spec; try { spec = T.evSpec(f, ev.id, seed * 7919); } catch (e) { continue; }
          if (!spec) continue; ne++; evSeen.add(ev.id);
          const w = `event ${ev.id} (${f})`;
          check(w + ' title', spec.t); check(w + ' text', spec.d);
          spec.ch.forEach((c, k) => { check(`${w} choice ${k}`, c.l);
            if (seed === 1 && c.f) { const g = S.fac[f].gold; S.fac[f].gold = 9999; newLines(c.f).forEach(l => check(`${w} choice ${k} news`, l)); S.fac[f].gold = g; } });
        }
      }
      for (const ev of K.EVENTS) if (!evSeen.has(ev.id)) out.missing.push('event never built: ' + ev.id);
      // chains: every stage with a few states; take every choice on a throwaway copy of the chain state
      let nc = 0; const osmChar = Object.values(S.chars).find(c => c.f === 'OSM' && c.role !== 'ruler');
      for (const C of K.CHAINS) C.stages.forEach((sg, k) => {
        for (const data of [{}, { zincir: 1 }, { cem: osmChar && osmChar.id }]) {
          const st = { stage: k, t: 0, data: { ...data }, done: false, wait: false };
          let spec; try { spec = sg.fire(st); } catch (e) { continue; } nc++;
          const w = `chain ${C.id}.${k}`;
          if (spec.t) { check(w + ' title', spec.t); check(w + ' text', spec.d); }
          spec.ch.forEach((c, j) => { if (spec.t) check(`${w} choice ${j}`, c.l);
            if (c.f && !data.zincir) { const keep = JSON.stringify({ war: S.war, ally: S.ally, gold: T.FK.map(f => S.fac[f].gold) });
              newLines(() => c.f({ ...st, data: { ...st.data } })).forEach(l => check(`${w} choice ${j} news`, l));
              const kp = JSON.parse(keep); S.war = kp.war; S.ally = kp.ally; T.FK.forEach((f, i) => S.fac[f].gold = kp.gold[i]); } });
        }
      });
      // economy rows, army names, move reasons, war news
      for (const f of T.FK) if (S.fac[f].alive) for (const r of K.econRows(f)) { check(`econ ${f} ${r.id}`, r.l); if (r.tip) check(`econ tip ${f} ${r.id}`, r.tip); }
      for (let no = 1; no <= 7; no++) check('army name ' + no, T.armName({ no }));
      check('move reason', K.armyCanMove(-1, 0).reason);
      const a = K.armyList('OSM')[0]; if (a) { check('move reason same', K.armyCanMove(a.id, a.loc).reason); const far = K.PD.findIndex((d, i) => S.prov[i].o === 'VEN'); check('move reason far', K.armyCanMove(a.id, far).reason); }
      check('recruit reason', K.armRecruit('OSM', K.PD.findIndex((d, i) => S.prov[i].o === 'VEN'), 1000).reason);
      newLines(() => K.declareWar('OSM', 'HUN')).forEach(l => check('declare war news', l));
      return { ...out, nm, ne, nc };
    });
  } catch (e) { errors.push('exception: ' + (e.stack || e)); }
  await browser.close();
  if (res) {
    console.log(`[i18n-data] ${res.nm} missions, ${res.ne} event builds, ${res.nc} chain stages, ${res.n} fields checked`);
    console.log(`[i18n-data] missing: ${res.missing.length}`); res.missing.forEach(x => console.log('  MISSING ' + x));
    console.log(`[i18n-data] still Turkish: ${res.bad.length}`); [...new Set(res.bad)].forEach(x => console.log('  TR ' + x));
    console.log(`[i18n-data] Turkish from other translators' code (03c, not T2): ${new Set(res.other).size}`); [...new Set(res.other)].forEach(x => console.log('  other ' + x));
    console.log(`[i18n-data] Turkish only through names from other files (T1 data): ${new Set(res.nameOnly).size}`);
    [...new Set(res.nameOnly)].slice(0, 8).forEach(x => console.log('  name ' + x));
  }
  errors.forEach(e => console.log('[i18n-data] ' + e));
  const fail = !res || res.missing.length || res.bad.length || errors.length;
  console.log('[i18n-data]', fail ? 'FAILED' : 'PASSED');
  process.exit(o.assert && fail ? 1 : 0);
})();
