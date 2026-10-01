'use strict';
// Replacement for the pre-army steps of tests/ui.js (the troop slider is gone): as the Ottomans, select a
// province next to Konstantiniyye, recruit (joins / raises a field army), build, march an army there, declare
// war from the province panel, end the season, then attack Konstantiniyye with the army.
module.exports = {
  name: 'b-ui-flow',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const click = async sel => { await page.click(sel, { timeout: 15000 }); await page.waitForTimeout(100); };
    const panel = () => E(() => { const p = document.getElementById('panel'); return p.hidden ? null : p.textContent.replace(/\s+/g, ' '); });
    const closePanel = async () => { if (await E(() => !!document.querySelector('#panel:not([hidden]) [data-act="close"]'))) await click('#panel [data-act="close"]'); };
    await click('[data-act="fit"]');
    const info = await E(() => { const K = window.__ke, S = K.S, PD = K.PD, ist = PD.findIndex(d => d.key === 'istanbul');
      const nb = PD[ist].adj.filter(j => S.prov[j].o === 'OSM' && !PD[ist].lanes.includes(j));
      // an Ottoman army that can reach one of those provinces this season
      for (const a of S.armies.filter(a => a.f === 'OSM')) for (const j of nb) { const c = K.armyCanMove(a.id, j); if (c.ok || a.loc === j) return { ist, src: j, army: a.id, from: a.loc }; }
      return { ist, nb }; });
    check('an Ottoman army can reach a province next to Konstantiniyye', info.army != null, info);
    if (info.army == null) return;
    for (let k = 0; k < 2; k++) await click('#zoom [data-act="zin"]');
    const clickable = async i => !!(await L.provPoint(page, i));
    if (!(await clickable(info.src)) || !(await clickable(info.from)) || !(await clickable(info.ist))) await click('[data-act="fit"]');

    // select the source province: the panel opens
    await L.clickProv(page, info.src);
    check('select own province opens the panel', ((await panel()) || '').includes(await E(i => window.__ke.PD[i].name, info.src)));
    // build something there
    const b0 = await E(i => { const p = window.__ke.S.prov[i]; return p.mkt + p.brk + p.fort + p.dev; }, info.src);
    const bsel = await E(() => ['bmkt', 'bbrk', 'bfort', 'bdev'].find(a => document.querySelector(`#panel [data-act="${a}"]:not([disabled])`)));
    if (bsel) await click(`#panel [data-act="${bsel}"]`);
    check('build a building (' + bsel + ')', !!bsel && (await E(i => { const p = window.__ke.S.prov[i]; return p.mkt + p.brk + p.fort + p.dev; }, info.src)) === b0 + 1);
    await closePanel();

    // march the army next to Konstantiniyye
    if (info.from !== info.src) {
      await L.clickProv(page, info.from);
      if (!(await E(id => !!document.querySelector(`#panel .arm.on[data-id="${id}"]`), info.army))) await click(`#panel .arm[data-id="${info.army}"]`);
      await L.clickProv(page, info.src);
      await click('#panel [data-act="amove"]');
    }
    check('army marched next to Konstantiniyye', (await E(id => window.__ke.S.armies.find(a => a.id === id).loc, info.army)) === info.src);
    // recruit into it
    const n0 = await E(id => window.__ke.S.armies.find(a => a.id === id).n, info.army);
    await closePanel(); await L.clickProv(page, info.src);
    await click('#panel [data-act="rec5"]');
    check('recruit +5000 joins the army', (await E(id => window.__ke.S.armies.find(a => a.id === id).n, info.army)) === n0 + 5000);
    await closePanel();

    // declare war from Konstantiniyye's panel (two taps)
    await L.clickProv(page, info.ist);
    await click('#panel [data-act="dwar"]'); await click('#panel [data-act="dwar"]');
    check('declare war on Byzantium', await E(() => !!window.__ke.S.war['BYZ|OSM']));
    await L.closeModals(page); await closePanel();

    // end the season with the button, then attack
    const t0 = await E(() => window.__ke.S.turn);
    await click('#endTurn');
    await page.waitForFunction(() => !document.getElementById('endTurn').disabled, null, { timeout: 180000 });
    await L.closeModals(page);
    check('end turn advances the season', (await E(() => window.__ke.S.turn)) === t0 + 1);
    const alive = await E(id => { const a = window.__ke.S.armies.find(x => x.id === id); return a ? a.loc : null; }, info.army);
    check('the army is still next to Konstantiniyye', alive === info.src, alive);
    if (alive !== info.src) return;
    // D's AI garrisons its capital with a field army: clear it so this march lays siege (a field battle is covered above)
    await E(ist => { const S = window.__ke.S; S.armies = S.armies.filter(a => !(a.loc === ist && a.f !== 'OSM')); }, info.ist);
    await L.clickProv(page, info.src);
    if (!(await E(id => !!document.querySelector(`#panel .arm.on[data-id="${id}"]`), info.army))) await click(`#panel .arm[data-id="${info.army}"]`);
    await L.clickProv(page, info.ist);
    check('siege order opens with the expected length', await E(() => !!document.querySelector('#panel [data-sheet="action"] .sgodds') && !!document.querySelector('#panel [data-act="amove"]')));
    const nb0 = await E(() => window.__ke.S.battles.length);
    await click('#panel [data-act="amove"]');
    await page.waitForTimeout(300);
    await L.closeModals(page);
    check('the march laid siege to the walls', await E(ist => { const s = window.__ke.S.sieges[ist]; return !!s && s.f === 'OSM'; }, info.ist));
    check('the siege panel shows progress and an assault button', await E(() => !!document.querySelector('#panel .sgsec .sgbar') && !!document.querySelector('#panel [data-act="astorm"]')));
  },
};
