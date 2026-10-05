'use strict';
// Track T, Wave 3, English coverage: reloads in English and checks every road name and description, every great-work
// name (each type, each faith, historical names), the province panel of a stop with its works, the trade modal and the
// map tooltips. A line fails when it still looks Turkish once province and realm names are stripped.
module.exports = {
  name: 't-trade-en',
  fac: null,
  async run(page, L, check) {
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('ke-lang', 'en'); });
    await page.context().addInitScript(() => { try { if (!sessionStorage.getItem('ke-en-set')) { localStorage.setItem('ke-lang', 'en'); sessionStorage.setItem('ke-en-set', '1'); } } catch (e) {} });
    await page.reload({ waitUntil: 'domcontentloaded' }); await L.waitLoaded(page);
    await L.startGame(page, 'OSM'); await L.closeModals(page);
    await page.evaluate(() => { const b = document.querySelector('[data-act="tut-skip"]'); if (b) b.click(); });
    const bi = await page.evaluate(() => { const K = window.__ke, S = K.S, i = K.PD.findIndex(d => d.key === 'bursa'); S.fac.OSM.gold = 900; S.prov[i].mkt = 1; K.works.start('OSM', i, 'caravan'); K.centerOn(K.PD[i].lx, K.PD[i].ly, 2.2); return i; });
    await page.waitForTimeout(300); await L.clickProv(page, bi); await page.waitForSelector('#panel [data-sec="works"]');
    const res = await page.evaluate(() => {
      const K = window.__ke, S = K.S, PD = K.PD;
      const TR_CHARS = /[çğıöşüÇĞİÖŞÜâîû]/, TR_WORDS = /\b(ve|ile|bir|için|altın|tur|yolu|Yolu|durak|eser|Külliye|Bedesten|Hisar|Tersane|Medrese|Kervansaray|Ticaret|Savaş|Pazar|kervan|inşa|İnşa|getiriyor|Bütün|haritası)\b/;
      const names = [...new Set([...PD.map(d => d.name), ...Object.values(K.t2 ? K.t2.FAC : {}).flatMap(f => [f.n, f.s])])].filter(Boolean).sort((a, b) => b.length - a.length);
      const facN = []; for (const f in S.fac) { const el = document.createElement('div'); }
      const out = { bad: [], n: 0 };
      const strip = s => { let t = String(s).replace(/<[^>]+>/g, ' '); for (const nm of names) t = t.split(nm).join(''); return t; };
      const chk = (where, s) => { out.n++; if (!s) { out.bad.push(where + ': empty'); return; } const t = strip(s); if (TR_CHARS.test(t) || TR_WORDS.test(t)) out.bad.push(where + ': ' + String(s).slice(0, 160)); };
      for (const r of K.trade.routes()) chk('route ' + r.id, r.name);
      const T = K.works.types, pk = k => PD.findIndex(d => d.key === k);
      for (const k in T) for (const key of ['bursa', 'budin', 'istanbul', 'venedik', 'tebriz', 'kahire', 'pojon', 'mistra']) {
        const i = pk(key); S.works.push({ i, k, f: S.prov[i].o, p: 0, n: 1, d: 1, t: 0 });
        const w = K.works.list().find(x => x.i === i && x.k === k); chk(`work ${k}@${key}`, w.name); S.works.pop(); }
      for (const sec of ['trade', 'works']) { const el = document.querySelector(`#panel [data-sec="${sec}"]`); chk('panel ' + sec, el && el.innerText); }
      K.tradeUI.show(); chk('modal', document.querySelector('#modal').innerText); document.querySelector('#modal [data-act="mclose"]').click();
      out.sample = K.works.list().map(w => w.name).slice(0, 8);
      return out; });
    check('English: roads, great works, panel and modal have no Turkish left', res.bad.length === 0 && res.n > 50, res.bad.slice(0, 12));
    check('English historical names (Hagia Sophia, Covered Market of Bursa, Venetian Arsenal)', ['Hagia Sophia', 'Covered Market of Bursa', 'Venetian Arsenal'].every(n => res.sample.includes(n)), res.sample);
    // the map tooltip of a road, in English
    await page.evaluate(() => window.__ke.tradeMap.set(true));
    await page.waitForFunction(() => window.__ke.tradeMap.legAt('silk', 4), null, { timeout: 20000 });
    const tip = await page.evaluate(() => { const m = window.__ke.tradeMap.legAt('silk', 4); return window.__ke.tradeMap.tipAt(m.x, m.y); });
    check('English road tooltip', /Silk Road/.test(tip) && /gold/.test(tip) && !/[çğışü]|altın/.test(tip.replace(/<[^>]+>/g, '')), tip.slice(0, 200));
  }
};
