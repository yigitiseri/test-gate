'use strict';
// Difficulty (03h): picked on the start screen and kept for the next game. Hard: less gold at the start, the other
// realms' taxes +12% (ledger row), the armies the player meets +10% (odds card), the AI turns on the player sooner.
// Easy: the reverse for the player. Old saves play on normal.
module.exports = {
  name: 'e-difficulty',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    await E(() => { try { localStorage.removeItem('aod-dif-v1'); } catch (e) {} });
    await page.click('[data-act="pick"][data-f="OSM"]');
    const ui = await E(() => ({ n: document.querySelectorAll('#pick .difb').length, on: (document.querySelector('#pick .difb.on') || {}).dataset?.d }));
    check('the start screen offers three levels, normal by default', ui.n === 3 && ui.on === 'normal', ui);
    const d0 = await E(() => document.querySelector('#pick .difd').textContent);
    await page.click('#pick [data-act="sdif"][data-d="hard"]');
    const ui2 = await E(() => ({ on: document.querySelector('#pick .difb.on').dataset.d, d: document.querySelector('#pick .difd').textContent, pick: !!document.querySelector('#pick [data-act="begin"]') }));
    check('picking hard lights it and explains it, the realm stays picked', ui2.on === 'hard' && ui2.d !== d0 && ui2.pick, ui2);
    await page.click('[data-act="begin"]');
    await page.waitForSelector('#modal:not([hidden]) [data-act="ev"]', { timeout: 60000 }); await page.click('#modal [data-act="ev"]:not([disabled])'); await page.waitForTimeout(150);
    if (await E(() => !!document.querySelector('[data-act="tut-skip"]'))) await page.click('#tutBub [data-act="tut-skip"]');
    const base = 'const ds=K.S.prov.reduce((s,p,i)=>s+(p.o==="OSM"?K.PD[i].dev:0),0),base=Math.round(50+ds*1.2);';
    const h = await E(new Function(`const K=window.__ke;${base}const S=K.S,row=f=>(K.econRows(f).find(r=>r.id==='dif')||{}).v||0;
      const i=K.PD.findIndex(d=>d.key==='edirne'),to=K.PD[i].adj.find(j=>S.prov[j].o!=='OSM'),foe=S.prov[to].o;
      const a=K.armyCreate('OSM',i,8000,{mp:2});const o=K.battleOdds({att:'OSM',to,army:a,kind:'assault'});S.armies.splice(S.armies.indexOf(a),1);
      return {dif:K.dif.get(),gold:S.fac.OSM.gold,base,me:row('OSM'),them:row(foe),mod:(o.mods.find(m=>m.k==='dif')||{}).side,grace:K.dif.v('grace')};`));
    check('a hard game: less gold, the others get a tax row, the foe fights stronger, the AI turns sooner',
      h.dif === 'hard' && h.gold === Math.round(h.base * .6) && h.me === 0 && h.them > 0 && h.mod === 'def' && h.grace < 1, h);
    // the choice is kept for the next game
    // headless Chromium sometimes drops file:// localStorage across a reload (see tests/ui.js): re-seed the choice then
    const raw = await E(() => localStorage.getItem('aod-dif-v1')); await page.waitForTimeout(1000);
    await page.context().addInitScript(raw => { try { if (!localStorage.getItem('aod-dif-v1') && raw) localStorage.setItem('aod-dif-v1', raw); } catch (e) {} }, raw);
    check('the choice is stored', raw === 'hard', raw);
    await page.reload(); await L.waitLoaded(page);
    await page.click('[data-act="pick"][data-f="OSM"]');
    const kept = await E(() => document.querySelector('#pick .difb.on').dataset.d);
    check('the next game starts with the last choice', kept === 'hard', kept);
    await page.click('#pick [data-act="sdif"][data-d="easy"]');
    await page.click('[data-act="begin"]');
    await page.waitForSelector('#modal:not([hidden]) [data-act="ev"]', { timeout: 60000 }); await page.click('#modal [data-act="ev"]:not([disabled])'); await page.waitForTimeout(150);
    const e = await E(new Function(`const K=window.__ke;${base}const S=K.S,row=f=>(K.econRows(f).find(r=>r.id==='dif')||{}).v||0;
      const i=K.PD.findIndex(d=>d.key==='edirne'),to=K.PD[i].adj.find(j=>S.prov[j].o!=='OSM');
      const a=K.armyCreate('OSM',i,8000,{mp:2});const o=K.battleOdds({att:'OSM',to,army:a,kind:'assault'});S.armies.splice(S.armies.indexOf(a),1);
      const old=JSON.parse(JSON.stringify(S));delete old.dif;const m=K.migrate(old);
      return {dif:K.dif.get(),gold:S.fac.OSM.gold,base,me:row('OSM'),mod:(o.mods.find(m=>m.k==='dif')||{}).side,old:m.dif};`));
    check('an easy game: more gold, a tax row for the player, its army fights stronger', e.dif === 'easy' && e.gold === Math.round(e.base * 1.6) && e.me > 0 && e.mod === 'att', e);
    check('an old save without a difficulty plays on normal', e.old === 'normal', e);
    await E(() => window.__ke.reg.ACTS.state()); await page.waitForTimeout(200);
    const led = await E(() => document.querySelector('#modal').innerText);
    check('the state ledger shows the difficulty row', /Zorluk: Kolay|Difficulty: Easy/.test(led), led.slice(0, 200));
    await L.closeModals(page);
  }
};
