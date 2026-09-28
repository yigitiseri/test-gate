'use strict';
// Track A: the battle card (#card) from a synthetic playerBattle report: crests, modifier list in Turkish,
// dice settle to the luck roll, general's fate, auto-dismiss, tap to close, and the phone layout never covers the panel.
const path = require('path');
const REP = `({from:0,to:0,att:'OSM',def:'BYZ',n:20000,defT:7000,turn:0,win:false,aLoss:3000,dLoss:1200,kind:'assault',fortDmg:true,
  mods:[{l:'Kale 4',m:1.6,side:'def',k:'fort'},{l:'Kış seferi',m:.85,side:'att',k:'winter'},{l:'Komutan: Mahmud Paşa',m:1.24,side:'att',k:'gen'}],
  roll:{a:.93,d:1.12},genFate:{n:'Mahmud Paşa',fate:'captured'}})`;
const fire = (page, extra = '') => page.evaluate(`(()=>{const K=window.__ke,S=K.S,PD=K.PD,r=${REP};r.to=PD.findIndex(d=>d.key==='istanbul');r.from=PD[r.to].adj[0];r.turn=S.turn;${extra}K.runHooks('playerBattle',r);return true;})()`);
async function common(page, check, tag) {
  const shot = async n => { if (process.env.KE_SHOTS) await page.screenshot({ path: path.join(process.env.KE_SHOTS, n + '.png') }); };
  await fire(page);
  await page.waitForSelector('#card:not([hidden]) .a-bc-mods', { timeout: 5000 });
  const c = await page.evaluate(() => { const el = document.getElementById('card'); return { txt: el.innerText, shields: el.querySelectorAll('.shield').length, mods: el.querySelectorAll('.a-bc-mods li').length }; });
  check(tag + ' card shows both crests', c.shields >= 2, c.shields);
  check(tag + ' card lists the modifiers in Turkish', /Kale 4/.test(c.txt) && /\+60%/.test(c.txt) && /Kış seferi/.test(c.txt) && /−15%/.test(c.txt) && /Komutan/.test(c.txt), c.txt.slice(0, 300));
  await page.waitForSelector('#card.settled', { timeout: 5000 });
  const d = await page.evaluate(() => { const el = document.getElementById('card'); return { dice: [...el.querySelectorAll('.a-die')].map(x => +x.dataset.v), txt: el.innerText }; });
  check(tag + ' dice settle on the luck roll', d.dice.length === 2 && d.dice[0] === 2 && d.dice[1] === 5, d.dice);
  check(tag + ' outcome, casualties and general fate', /Yenilgi|YENİLGİ/.test(d.txt) && /Kayıplar/.test(d.txt) && /esir düştü/.test(d.txt) && /Surlar hasar/.test(d.txt), d.txt.slice(-300));
  await shot('card_' + tag);
  return d;
}
module.exports = {
  name: 'a-card',
  fac: 'OSM',
  async run(page, L, check) {
    await common(page, check, 'desktop');
    const t0 = Date.now();
    await page.waitForSelector('#card', { state: 'hidden', timeout: 9000 }).catch(() => {});
    check('card auto-dismisses', await page.evaluate(() => document.getElementById('card').hidden), Date.now() - t0);
    await fire(page);
    await page.waitForSelector('#card:not([hidden])', { timeout: 5000 });
    await page.click('#card .a-bc-sides', { force: true });
    check('tap closes the card', await page.evaluate(() => document.getElementById('card').hidden));
    // phone: the card must not overlap the open province panel
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    await page.evaluate(() => { const K = window.__ke; K.centerOn(K.PD[K.S.fac.OSM.cap].lx, K.PD[K.S.fac.OSM.cap].ly); });
    const cap = await page.evaluate(() => window.__ke.S.fac.OSM.cap);
    await L.clickProv(page, cap).catch(() => {});
    await fire(page);
    await page.waitForSelector('#card:not([hidden])', { timeout: 5000 });
    const ov = await page.evaluate(() => { const c = document.getElementById('card').getBoundingClientRect(), p = document.getElementById('panel'); if (p.hidden) return { panel: false }; const q = p.getBoundingClientRect(); return { panel: true, cb: Math.round(c.bottom), pt: Math.round(q.top) }; });
    check('phone card never overlaps the panel', !ov.panel || ov.cb <= ov.pt, ov);
    if (process.env.KE_SHOTS) await page.screenshot({ path: path.join(process.env.KE_SHOTS, 'card_phone_panel.png') });
  },
};
