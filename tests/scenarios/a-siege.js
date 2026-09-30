'use strict';
// Track A (W2): siege and occupation visuals from synthetic fixtures (S.sieges[i], S.prov[i].ctl), so this passes
// before and after Track B's siege rules: the camp and wall plaque are laid out, the besieging army's token stands in
// its camp, plaques never overlap chips or names, occupied provinces are hatched in the occupier's colour, the smoke
// animates only for a while (render on demand), the siege card opens at the end of the turn (siegeTick) and at once on
// a fall (siegeFell), the replay favours falls and threats to the player, and portraits are valid, deterministic SVG.
// KE_SHOTS=<dir> saves screenshots.
const path = require('path');
const FIX = `(()=>{const K=window.__ke,S=K.S,PD=K.PD,P=n=>PD.findIndex(d=>d.name===n);const ist=P('Konstantiniyye'),sil=P('Silivri');
 if(!S.war[['BYZ','OSM'].sort().join('|')]&&K.declareWar)K.declareWar('OSM','BYZ');
 for(let k=S.armies.length-1;k>=0;k--)if(S.armies[k].loc===ist||S.armies[k].f==='OSM')S.armies.splice(k,1);
 S.chars[9902]={id:9902,n:'Zağanos Paşa',f:'OSM',role:'gen',born:1415,died:null,traits:['cengaver'],skill:3};
 const a=K.armyCreate('OSM',ist,20000,{gen:9902});a.st='siege';
 S.sieges[ist]={i:ist,f:'OSM',a:a.id,t0:S.turn-1,prog:2,need:6,sally:false};
 S.prov[sil].ctl='OSM';K.sg.repaint();K.centerOn(PD[ist].lx,PD[ist].ly,2.4);
 return {ist,sil,army:a.id};})()`;
const CLEAN = `(()=>{const K=window.__ke,S=K.S;S.sieges={};S.prov.forEach(p=>{delete p.ctl;});S.armies.forEach(a=>{if(a.st==='siege')a.st='idle';});
 for(let k=S.armies.length-1;k>=0;k--){const a=S.armies[k];if(S.prov[a.loc].o!==a.f)S.armies.splice(k,1);}delete S.chars[9902];K.sg.repaint();})()`;
const overlaps = L => { const out = []; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { if (!/[gn]/.test(L[i].k + L[j].k)) continue; const a = L[i].r, b = L[j].r; if (a[0] < b[2] - 1 && a[2] > b[0] + 1 && a[1] < b[3] - 1 && a[3] > b[1] + 1) out.push([L[i].k + L[j].k, a, b]); } return out; };
module.exports = {
  name: 'a-siege',
  fac: 'OSM',
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const settle = async () => { const d = await E(() => window.__ke.stats.draws); await page.waitForFunction(d => window.__ke.stats.draws > d, d, { timeout: 30000 }).catch(() => {}); };
    const shot = async n => { if (process.env.KE_SHOTS) await page.screenshot({ path: path.join(process.env.KE_SHOTS, n + '.png'), timeout: 120000 }); };
    await E(() => { const b = [...document.querySelectorAll('#hud button, .tut button, button')].find(x => /Dersi geç/.test(x.textContent)); if (b) b.click(); });
    const fx = await page.evaluate(FIX);
    await settle(); await settle();
    const lay = await E(() => window.__ke.sg.lay());
    const me = lay.find(x => x.i === fx.ist);
    check('the besieged town gets a camp and a wall plaque', !!me && !!me.bar && me.bar.segs === 6, lay);
    check('wall integrity is read from prog/need', await E(i => { const g = window.__ke.sg.list().find(x => x.i === i); return !!g && Math.abs(g.wall - 2 / 3) < .01; }, fx.ist));
    const tok = await E(id => window.__ke.tokens().find(t => t.id === id), fx.army);
    check('the besieging army stands in its camp, off the town', !!tok && !!me && Math.hypot(tok.x - me.x, tok.y + 30 - me.y) > me.r * .6, { tok, me });
    const ov = overlaps(await E(() => window.__ke.aLabels()));
    check('plaques, tents, chips and names never overlap', ov.length === 0, ov.slice(0, 3));
    // occupation hatching (EU4 style) in the political layer
    const h1 = await E(i => window.__ke.sg.hatch(i), fx.sil);
    check('occupied province is hatched in the occupier colour over the owner colour', h1.occ > 20 && h1.own > 20, h1);
    await shot('siege_2d_desktop');
    // render on demand: the smoke drifts while "hot", then the map stops redrawing
    await E(() => window.__ke.sg.hot(4000));
    const a0 = await E(() => window.__ke.stats.draws); await page.waitForTimeout(1500);
    const a1 = await E(() => window.__ke.stats.draws);
    check('smoke animates while the siege is fresh', a1 - a0 >= 2, a1 - a0);
    await E(() => window.__ke.sg.hot(0)); await page.waitForTimeout(600);
    const b0 = await E(() => window.__ke.stats.draws); await page.waitForTimeout(1500);
    const b1 = await E(() => window.__ke.stats.draws);
    check('2D idle with a siege on screen: no redraw loop', b1 - b0 <= 1, b1 - b0);
    // siege card at the end of the turn (a synthetic siegeTick, as B's rules fire it) and a replayed fall
    await E(fx => {
      const K = window.__ke, S = K.S, T = K.reg.TURN_TRACE, PD = K.PD;
      window.__sgfx = fx;
      K.hook('afterRound', () => {
        const f = window.__sgfx; if (!f || !f.on) return;
        let a = S.armies.find(x => x.id === f.army); if (!a) { a = K.armyCreate('OSM', f.ist, 20000, {}); f.army = a.id; } a.loc = f.ist; a.st = 'siege';
        if (!S.sieges[f.ist]) S.sieges[f.ist] = { i: f.ist, f: 'OSM', a: a.id, t0: S.turn - 2, prog: 3, need: 6, sally: true };
        K.runHooks('siegeTick', S.sieges[f.ist]);
        if (f.trace) {
          T.push({ k: 'siegeFell', f: 'OSM', to: f.ist, army: a.id });
          // one realm marching a lot (capped at 4 replayed items) and a march on a province of the player
          const own = S.prov.map((p, i) => i).filter(i => S.prov[i].o === 'VEN' && PD[i].adj.some(j => S.prov[j].o === 'VEN'));
          for (let k = 0; k < 6; k++) { const i = own[k % own.length], j = PD[i].adj.find(j => S.prov[j].o === 'VEN') ?? i; T.push({ k: 'move', f: 'VEN', from: i, to: j, path: [i, j], army: 90000 + k, n: 3000 }); }
          const tgt = S.prov.map((p, i) => i).find(i => S.prov[i].o === 'OSM' && PD[i].adj.some(j => S.prov[j].o === 'BYZ'));
          const from = PD[tgt].adj.find(j => S.prov[j].o === 'BYZ');
          T.push({ k: 'move', f: 'BYZ', from, to: tgt, path: [from, tgt], army: 91000, n: 4000 });
        }
      }, 99);
    }, fx);
    await E(() => { window.__sgfx.on = true; window.__sgfx.trace = true; window.__ke.endTurn(); });
    await page.waitForSelector('#card.a-sc:not([hidden])', { timeout: 120000 }).catch(() => {});
    const card = await E(() => { const el = document.getElementById('card'); return { sc: el.classList.contains('a-sc'), hidden: el.hidden, txt: el.innerText, segs: el.querySelectorAll('.a-sc-segs i').length, pt: !!el.querySelector('.a-sc-cmd .a-pt'), pic: !!el.querySelector('svg.a-sc-pic'), info: window.__ke.sgCard }; });
    check('end of turn: the siege card opens for the player\'s siege', card.sc && !card.hidden && /Konstantiniyye Kuşatması/.test(card.txt), card);
    check('siege card: wall picture, one stone per turn needed, commander portrait', card.pic && card.segs >= 1 && card.pt, card);
    check('siege card text is Turkish and plain (no formulas)', /Sur sağlamlığı/.test(card.txt) && !/[=*/]\s*\d/.test(card.txt), card.txt.slice(0, 300));
    await shot('siege_card_desktop');
    await page.waitForFunction(() => !document.getElementById('endTurn').disabled, null, { timeout: 180000 });
    const plan = await E(() => window.__ke.replay.plan);
    check('replay: a town falling is replayed', plan.some(p => p.fell), plan);
    check('replay: a march on the player\'s province is replayed', plan.some(p => p.threat), plan);
    check('replay: at most 4 items from one other realm', plan.filter(p => p.f === 'VEN').length <= 4, plan);
    const thr = plan.find(p => p.threat), ven = plan.filter(p => p.f === 'VEN');
    check('replay: threats rank above other realms\' marches', !thr || ven.every(v => v.pr < thr.pr), { thr, ven });
    await L.closeModals(page);
    await E(() => { window.__sgfx.on = false; });
    // a fall outside the turn flow shows the card at once, with the outcome seal
    await E(i => { const K = window.__ke; K.S.prov[i].ctl = 'OSM'; K.runHooks('siegeFell', i, 'OSM'); }, fx.ist);
    await page.waitForSelector('#card.a-sc:not([hidden])', { timeout: 10000 }).catch(() => {});
    const fell = await E(() => ({ txt: document.getElementById('card').innerText, seal: !!document.querySelector('#card .a-bc-seal'), info: window.__ke.sgCard }));
    check('siegeFell: the card shows the fall and the victory seal', fell.seal && /düştü/.test(fell.txt) && /Zafer|ZAFER/.test(fell.txt), fell);
    await shot('siege_card_fell_desktop');
    // portraits: valid, deterministic SVG, different for different people
    const pt = await E(() => {
      const K = window.__ke, S = K.S, out = [], seen = new Set(); let bad = 0, det = true;
      for (const f of ['OSM', 'BYZ', 'HUN', 'VEN', 'SRB', 'ALB', 'KRM', 'MML', 'PAP', 'AQQ', 'POL', 'CRM']) {
        if (!S.fac[f]) continue; const r = K.ch.ruler(f); if (!r) continue;
        const a = K.portraitFor(r.id), b = K.portraitFor(r.id);
        if (a !== b) det = false;
        const doc = new DOMParser().parseFromString(a, 'image/svg+xml'); if (doc.querySelector('parsererror') || !doc.querySelector('svg')) bad++;
        seen.add(a); out.push(f);
      }
      const spec = { seed: 7, f: 'OSM', cul: 'tr', hat: 'kavuk', age: 20, role: 'ruler', traits: [] };
      const young = K.portraitSVG(spec), old = K.portraitSVG({ ...spec, age: 70 });
      return { n: out.length, uniq: seen.size, bad, det, ageDiff: young !== old };
    });
    check('portraits: valid SVG for every ruler', pt.n >= 6 && pt.bad === 0, pt);
    check('portraits: deterministic, distinct per person, change with age', pt.det && pt.uniq === pt.n && pt.ageDiff, pt);
    if (process.env.KE_SHOTS) {
      await E(() => {
        const K = window.__ke, S = K.S, d = document.createElement('div'); d.id = 'aPtGal';
        d.style.cssText = 'position:fixed;left:20px;top:80px;z-index:99;display:flex;flex-wrap:wrap;gap:14px;width:760px;padding:18px;background:#efe3c4;border:2px solid #5e3f1f;box-shadow:inset 0 0 0 4px rgba(240,226,191,.9),inset 0 0 0 5px #a88452';
        const specs = [];
        for (const f of Object.keys(S.fac)) { if (!S.fac[f].alive) continue; const r = K.ch.ruler(f); if (r) specs.push([K.portraitFor(r.id, { size: 96 }), K.chDisp ? K.chDisp(r.n, f) : r.n]); if (specs.length >= 14) break; }
        for (const g of Object.values(S.chars)) { if (g.role === 'gen' && g.died == null && specs.length < 18) specs.push([K.portraitFor(g.id, { size: 96 }), g.n]); }
        d.innerHTML = specs.map(([s, n]) => `<figure style="margin:0;width:88px;text-align:center;font:600 11px Georgia;color:#23150a">${s}<figcaption>${n}</figcaption></figure>`).join('');
        document.body.appendChild(d);
      });
      await shot('portraits_gallery');
      await E(() => document.getElementById('aPtGal').remove());
    }
    // clear the occupation: the hatching goes away
    await page.evaluate(CLEAN);
    const h2 = await E(i => window.__ke.sg.hatch(i), fx.sil);
    check('hatching disappears when the occupation ends', h2.occ === 0 && h2.own > 20, h2);
  },
};
