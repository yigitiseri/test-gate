'use strict';
// Track V (W3) vassals in English: the Peace Table item, the Divan row, the province panel, the State book, the
// liberty tooltip, the economy rows and every news line (vassalage, joining a war, revolt, freedom, annexation)
// read in English: no line may still look Turkish once proper names are stripped.
module.exports = {
  name: 'v-vassals-en',
  fac: null,
  async run(page, L, check) {
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('ke-lang', 'en'); });
    await page.context().addInitScript(() => { try { if (!sessionStorage.getItem('ke-en-set')) { localStorage.setItem('ke-lang', 'en'); sessionStorage.setItem('ke-en-set', '1'); } } catch (e) {} });
    await page.reload({ waitUntil: 'domcontentloaded' }); await L.waitLoaded(page);
    await L.startGame(page, 'OSM');
    await L.closeModals(page);
    const E = (fn, a) => page.evaluate(fn, a);
    const click = async sel => { await page.waitForSelector(sel, { timeout: 30000 }); await E(s => document.querySelector(s).click(), sel); await page.waitForTimeout(60); };
    // a Turkish-looking test, with realm, province and ruler names stripped
    await E(() => { const K = window.__ke, T = K.t2, PD = K.PD;
      const TR_CHARS = /[çğıöşüÇĞİÖŞÜâîû]/, TR_WORDS = /\b(ve|ile|bir|için|asker|ordu|savaş|eyalet|devlet|altın|haraç|Haraç|haraçgüzar|yıl|tur|Barış|isyan|özgür|Kapat|Sadık|Hoşnutsuz)\b/;
      const names = []; for (const d of PD) names.push(d.name); for (const f of T.FK) { names.push(T.FAC[f].n, T.FAC[f].s); try { names.push(K.rulerName(f)); } catch (e) {} }
      names.sort((a, b) => b.length - a.length);
      window.__trBad = s => { if (!s) return false; let t = String(s); for (const n of names) if (n) t = t.split(n).join(''); return TR_CHARS.test(t) || TR_WORDS.test(t); }; });
    const bad = [];
    const look = async (where, sel) => { const t = await E(s => { const el = document.querySelector(s); return el ? el.innerText : null; }, sel);
      if (t == null) { bad.push(where + ': missing ' + sel); return ''; }
      for (const line of t.split('\n')) if (await E(l => window.__trBad(l), line)) bad.push(where + ': ' + line.slice(0, 160)); return t; };
    const set = await E(() => { const K = window.__ke, S = K.S; K.declareWar('OSM', 'WAL');
      const ps = S.prov.map((p, i) => i).filter(i => S.prov[i].o === 'WAL'); S.war['OSM|WAL'].sc.OSM = K.vas.cost('OSM', 'WAL') + 3; return { ps }; });
    await L.closeModals(page);
    await click('#top [data-act="diplo"]');
    await click('#modal [data-act="dp-peace"][data-f="WAL"]');
    await click('#modal [data-act="pt-vas"]');
    const pt = await look('peace table', '#modal .vas-pt');
    check('Peace Table vassal item in English', /Vassalage/.test(pt) && /becomes our vassal/.test(pt) && /fifth of their taxes/.test(pt), pt);
    await click('#modal [data-act="pt-send"]');
    check('the treaty is signed', await E(() => window.__ke.vas.of('WAL') === 'OSM'));
    await click('#top [data-act="diplo"]');
    const dv = await look('divan', '#modal');
    check('Divan shows "Our vassal" and the annex wait in English', /Our vassal/.test(dv) && /more years? before they can be annexed/.test(dv), dv.slice(0, 300));
    const tip = await E(() => window.__ke.uiTip('vas'));
    if (await E(l => window.__trBad(l), tip || '')) bad.push('tooltip: ' + tip);
    check('liberty tooltip in English', !!tip && /Liberty desire/.test(tip), tip);
    await L.closeModals(page);
    await E(i => { const K = window.__ke; K.centerOn(K.PD[i].lx, K.PD[i].ly, 2); }, set.ps[0]);
    await page.waitForTimeout(200);
    await L.clickProv(page, set.ps[0]);
    const pn = await look('province panel', '#panel [data-sec="vassal"]');
    check('province panel vassal section in English', /is our vassal/.test(pn), pn);
    await E(() => window.__ke.reg.ACTS.state());
    const st = await look('state book', '#modal .vas-state');
    check('State book vassal list in English', /Vassals/.test(st), st);
    await L.closeModals(page);
    const lines = await E(() => { const K = window.__ke, S = K.S; S.truce = {};
      K.declareWar('OSM', 'HUN'); K.makePeace('OSM', 'HUN', { prov: [], gold: 0, release: [] }); S.truce = {};
      K.declareWar('MOL', 'WAL'); K.makePeace('MOL', 'OSM', { prov: [], gold: 0, release: [] });
      for (const k of Object.keys(S.war)) if (k.includes('WAL')) delete S.war[k];
      K.vas.revolt('WAL'); K.makePeace('OSM', 'WAL', { prov: [], gold: 0, release: [] }); K.vas.make('OSM', 'WAL'); K.vas.free('WAL');
      K.vas.make('OSM', 'WAL');
      const rows = []; for (const f of ['OSM', 'WAL']) for (const r of K.econRows(f)) if (r.id === 'vasTrib') rows.push(r.l + ' ' + (r.tip || ''));
      S.vas.WAL.t = S.turn - 41; S.vas.WAL.lib = 5; S.fac.OSM.gold += 1000; K.vas.annex('OSM', 'WAL');
      const why = ['already', 'meVas', 'hasVas', 'many', 'big', 'empty', 'pretender', 'player'];
      return { news: S.log.slice(-40).map(x => x.m), rows, whys: why.map(w => K.vas.why({ why: w, f: 'HUN' })) }; });
    for (const m of [...lines.rows, ...lines.whys]) if (!m || await E(l => window.__trBad(l), m)) bad.push('text: ' + m);
    for (const m of lines.news) if (await E(l => window.__trBad(l), m)) bad.push('news: ' + m);
    check('tribute rows in English', lines.rows.length === 2, lines.rows);
    check('news lines are English (vassalage, war, revolt, freedom, annexation)', lines.news.some(m => /vassal of/.test(m)) && lines.news.some(m => /revolted/.test(m)) && lines.news.some(m => /is free/.test(m)) && lines.news.some(m => /joined the lands of/.test(m)), lines.news.slice(-12));
    check('no Turkish-looking line in any vassal text', bad.length === 0, bad.slice(0, 12));
  },
};
