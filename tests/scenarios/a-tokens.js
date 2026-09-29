'use strict';
// Track A: army tokens from KE.armyCreate fixtures: drawn, stacked, hit-testable with tokenAt (>= 44 px touch box),
// selection ring; garrison chips and city names never overlap each other or tokens (A4 declutter), including the
// Albania/Serbia cluster at the default phone zoom; render on demand (no redraw storm when idle).
const path = require('path');
const FIX = `(()=>{const K=window.__ke,S=K.S,PD=K.PD,P=n=>PD.findIndex(d=>d.name===n);
 S.chars[9901]={id:9901,n:'Mahmud Paşa',f:'OSM',role:'gen',born:1420,died:null,traits:[],skill:3};
 const a=K.armyCreate('OSM',P('Edirne'),24000,{gen:9901,mp:2});
 const b=K.armyCreate('OSM',P('Edirne'),6000,{mp:1});
 const c=K.armyCreate('ALB',P('Kroya'),8000,{});
 const d=K.armyCreate('SRB',P('Semendire'),5000,{});
 const e=K.armyCreate('VEN',P('Dıraç'),3000,{});
 return {ids:[a.id,b.id,c.id,d.id,e.id],e:P('Edirne'),k:P('Kroya')};})()`;
// labels (garrison chips 'g', city names 'n') must not overlap anything; tokens 't' may stand over cities 'c'
const overlaps = L => { const out = []; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { if (!/[gn]/.test(L[i].k + L[j].k)) continue; const a = L[i].r, b = L[j].r; if (a[0] < b[2] - 1 && a[2] > b[0] + 1 && a[1] < b[3] - 1 && a[3] > b[1] + 1) out.push([a, b]); } return out; };
module.exports = {
  name: 'a-tokens',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const settle = async () => { const d = await E(() => window.__ke.stats.draws); await page.waitForFunction(d => window.__ke.stats.draws > d, d, { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(300); };
    const shot = async n => { if (process.env.KE_SHOTS) await page.screenshot({ path: path.join(process.env.KE_SHOTS, n + '.png'), animations: 'disabled' }); };
    const fx = await page.evaluate(FIX);
    await E(e => { const K = window.__ke; K.centerOn(K.PD[e].lx, K.PD[e].ly, 1.6); }, fx.e);
    await page.waitForFunction(n => window.__ke.tokens().length >= n, 4, { timeout: 15000 }).catch(() => {});
    const toks = await E(() => window.__ke.tokens());
    const ids = new Set(toks.map(t => t.id));
    check('a token for every on-screen fixture army', fx.ids.every(id => ids.has(id)), { toks, ids: fx.ids });
    const a = toks.find(t => t.id === fx.ids[0]), b = toks.find(t => t.id === fx.ids[1]);
    check('stacked armies in one province are offset', a && b && Math.hypot(a.x - b.x, a.y - b.y) > 16, { a, b });
    // tokenAt: the token centre hits, a point 20 px off still hits (touch box >= 44 px), far away misses
    const hit = await E(t => [window.__ke.tokenAt(t.x, t.y), window.__ke.tokenAt(t.x + 20, t.y + 20), window.__ke.tokenAt(t.x + 200, t.y + 200)], a);
    check('tokenAt hits the token, with a 44 px touch box', hit[0] === fx.ids[0] && hit[1] != null && hit[2] !== fx.ids[0], hit);
    // selection ring + render on demand
    await E(id => window.__ke.selectArmy(id), fx.ids[0]); await settle();
    check('selected army is flagged', (await E(() => window.__ke.tokens().filter(t => t.sel).length)) === 1);
    await E(() => window.__ke.selectArmy(null)); await page.waitForTimeout(400);
    const d0 = await E(() => window.__ke.stats.draws); await page.waitForTimeout(1500);
    const d1 = await E(() => window.__ke.stats.draws);
    check('2D idle: no redraw loop', d1 - d0 <= 1, d1 - d0);
    const lab = await E(() => window.__ke.aLabels());
    check('desktop: no chip/name/token overlaps', overlaps(lab).length === 0, overlaps(lab).slice(0, 3));
    await shot('tokens_desk');
    // phone, default zoom, Albania/Serbia cluster
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
    await E(k => { const K = window.__ke; K.centerOn(K.PD[k].lx, K.PD[k].ly, Math.min(390, 844) / 560); }, fx.k);
    await settle();
    const lab2 = await E(() => window.__ke.aLabels());
    const ov2 = overlaps(lab2);
    check('phone ALB/SRB cluster: no chip/name/token overlaps', ov2.length === 0, ov2.slice(0, 3));
    await shot('tokens_phone_alb');
    await E(k => { const K = window.__ke; K.centerOn(K.PD[k].lx, K.PD[k].ly, 1.5); }, fx.k);
    await settle();
    check('phone zoomed ALB/SRB cluster: no overlaps', overlaps(await E(() => window.__ke.aLabels())).length === 0);
    await shot('tokens_phone_alb_zoom');
    // removing an army removes its token
    await E(id => { const S = window.__ke.S, k = S.armies.findIndex(a => a.id === id); S.armies.splice(k, 1); window.__ke.centerOn(0, 0, null); }, fx.ids[2]);
    await E(k => { const K = window.__ke; K.centerOn(K.PD[k].lx, K.PD[k].ly, 1.5); }, fx.k); await settle();
    check('removed army has no token', !(await E(id => window.__ke.tokens().some(t => t.id === id), fx.ids[2])));
    await E(() => { const S = window.__ke.S; S.armies.length = 0; delete S.chars[9901]; });
  },
};
