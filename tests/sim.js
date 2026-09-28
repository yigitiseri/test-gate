#!/usr/bin/env node
'use strict';
/*
 * Balance simulator: fast-forward a game in headless 2D and write JSON metrics.
 *
 *   node tests/sim.js --faction=OSM --turns=120 --policy=ai|passive|greedy --seed=1 [--assert] [--out=file.json] [--quiet]
 *     --seed=1..3 or --seed=1,2,3 runs several seeds (one fresh page each).
 *     --assert runs every tests/balance/*.js module on the result and exits 1 on any failure.
 *     --compare[=tests/balance/baseline.json] prints mean vs baseline (in baseline sds) for the same
 *       faction-policy-turns config, if the baseline has it.
 *     world-passive (the "AI world" sim of the design review) is --faction=HAF --policy=passive.
 *
 * Policies: ai = the player's faction is also driven by aiTurn; passive = the player does nothing
 * (declines offers); greedy = like ai, but also declares war on the weakest neighbour whenever at peace.
 *
 * Seeding: when the build exposes window.__ke.seed(n) (W0+), the game RNG is seeded, so a run is
 * reproducible. Older builds run unseeded (metrics are still comparable as distributions).
 *
 * Metrics per run (see README section in CONTRIBUTING.md): alive / wars / player provinces by
 * snapshot, owner changes per province per 20-turn window (ping-pong), max army stack, army count per
 * faction, endTurn ms (avg, max), save size, event title histogram, ruler changes, Constantinople
 * owner and fall turn, page errors and state-invariant violations.
 *
 * Balance modules: tests/balance/<name>.js exports (metrics, opts) => [failure strings], where
 * metrics = { faction, policy, turns, runs: [run, ...] } and opts = the parsed command line.
 */
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const ST = require('./simstats');

function parseSeeds(s) {
  s = String(s);
  const m = s.match(/^(\d+)\.\.(\d+)$/);
  if (m) { const r = []; for (let k = +m[1]; k <= +m[2]; k++) r.push(k); return r; }
  return s.split(',').filter(Boolean).map(Number);
}

async function runOne(o, seed) {
  const { browser, page, errors } = await L.launch({ three: '404', start3d: false });
  let res;
  try {
    res = await page.evaluate(async ({ FAC, TURNS, POL, SEED, INV }) => {
      const K = window.__ke, sleep = ms => new Promise(r => setTimeout(r, ms));
      const seeded = typeof K.seed === 'function';
      if (seeded) K.seed(SEED);
      K.beginGame(FAC);
      const S0 = () => K.S, PD = K.PD, NP = PD.length;
      const ist = PD.findIndex(d => d.key === 'istanbul');
      const out = { faction: FAC, policy: POL, seed: SEED, seeded, snap: [], events: {}, wars: [], inv: [], over: null };
      const events = out.events;
      const closeAll = () => {
        for (let k = 0; k < 30; k++) {
          const m = document.getElementById('modal'); if (m.hidden) return;
          const h2 = m.querySelector('h2'); if (h2) { const tt = h2.textContent; events[tt] = (events[tt] || 0) + 1; }
          const ev = m.querySelector('[data-act=ev]:not([disabled])'); if (ev) { ev.click(); continue; }
          const off = m.querySelector(`[data-act=off][data-v="${POL === 'passive' ? 0 : 1}"]`); if (off) { off.click(); continue; }
          const c = m.querySelector('[data-act=mclose]'); if (c) { c.click(); continue; }
          return;
        }
      };
      const facArmy = (S, f) => { let s = 0; for (const q of S.prov) if (q.o === f) s += q.t; for (const a of (S.armies || [])) if (a.f === f) s += a.n; return s; };
      const snap = () => {
        const S = S0(), c = {}; S.prov.forEach(q => c[q.o] = (c[q.o] || 0) + 1);
        const alive = Object.keys(S.fac).filter(f => S.fac[f].alive);
        const top = alive.map(f => [f, facArmy(S, f)]).sort((a, b) => b[1] - a[1]).slice(0, 4);
        out.snap.push({ turn: S.turn, alive: alive.length, wars: Object.keys(S.war).length, pl: c[FAC] || 0, gold: Math.round(S.fac[FAC].gold), topArmy: top });
      };
      const ruler = f => { const S = S0(); if (typeof K.rulerName === 'function') return K.rulerName(f); return S.fac[f] && S.fac[f].ruler != null ? S.fac[f].ruler : null; };
      const lastRuler = {}; const rulerChanges = {};
      Object.keys(S0().fac).forEach(f => lastRuler[f] = ruler(f));
      let owners = S0().prov.map(q => q.o); const changes = new Array(NP).fill(0); let pingMax = 0, pingSum = 0, pingN = 0; const pingTop = [];
      const flushPing = t => { for (let i = 0; i < NP; i++) { if (changes[i] > pingMax) pingMax = changes[i]; if (changes[i] >= 3) pingTop.push([PD[i].key, t, changes[i]]); pingSum += changes[i]; pingN++; changes[i] = 0; } };
      let maxStack = 0, maxStack1480 = 0; const armyCount = {}; const turnMs = []; const wallMs = [];
      let istFall = null;
      snap();
      closeAll();
      for (let t = 0; t < TURNS; t++) {
        let S = S0(); if (S.over) { out.over = S.over; break; }
        if (POL === 'ai' || POL === 'greedy') {
          if (POL === 'greedy' && !Object.keys(S.war).some(k => k.split('|').includes(FAC))) {
            const nb = new Set(); S.prov.forEach((q, i) => { if (q.o === FAC) PD[i].adj.forEach(j => { const o = S.prov[j].o; if (o !== FAC) nb.add(o); }); });
            const kk = g => [g, FAC].sort().join('|');
            const c = [...nb].filter(g => S.fac[g].alive && !S.ally[kk(g)] && !((S.truce[kk(g)] || 0) > S.turn)).sort((a, b) => facArmy(S, a) - facArmy(S, b));
            if (c.length) {
              document.querySelector('#top [data-act=diplo]').click();
              let b = document.querySelector(`#modal [data-act=dp-war][data-f=${c[0]}]`);
              if (b) { b.click(); b = document.querySelector(`#modal [data-act=dp-war][data-f=${c[0]}]`); b && b.click(); }
              const cl = document.querySelector('#modal [data-act=mclose]'); cl && cl.click(); out.wars.push(S.turn + ':' + c[0]);
            }
          }
          K.aiTurn(FAC);
        }
        const t0 = performance.now();
        K.endTurn();
        for (let w = 0; w < 20000; w++) { await sleep(2); if (!document.getElementById('endTurn').disabled) break; }
        const wall = performance.now() - t0; wallMs.push(wall);
        turnMs.push(K.stats && typeof K.stats.turnMs === 'number' ? K.stats.turnMs : Math.max(0, wall - 30));
        await sleep(5);
        closeAll();
        S = S0();
        for (let i = 0; i < NP; i++) if (S.prov[i].o !== owners[i]) changes[i]++;
        owners = S.prov.map(q => q.o);
        if (S.turn % 20 === 0) flushPing(S.turn);
        for (const q of S.prov) { if (q.t > maxStack) maxStack = q.t; if (S.turn < 116 && q.t > maxStack1480) maxStack1480 = q.t; }
        for (const a of (S.armies || [])) { if (a.n > maxStack) maxStack = a.n; if (S.turn < 116 && a.n > maxStack1480) maxStack1480 = a.n; }
        const ac = {}; for (const a of (S.armies || [])) ac[a.f] = (ac[a.f] || 0) + 1;
        for (const f in ac) if (!armyCount[f] || ac[f] > armyCount[f]) armyCount[f] = ac[f];
        for (const f in lastRuler) { const r = ruler(f); if (r !== lastRuler[f]) { rulerChanges[f] = (rulerChanges[f] || 0) + 1; lastRuler[f] = r; } }
        if (istFall == null && S.prov[ist].o !== 'BYZ') istFall = { turn: S.turn, to: S.prov[ist].o };
        if (S.turn % 20 === 0) snap();
        if (S.turn % 10 === 0) { const v = (0, eval)(INV); if (v.length) out.inv.push({ turn: S.turn, v: v.slice(0, 5) }); }
      }
      const S = S0();
      if (S.turn % 20 !== 0) snap();
      flushPing(S.turn);
      out.over = out.over || S.over || null;
      out.turnsPlayed = S.turn;
      const series = k => out.snap.map(s => s[k]);
      out.alive = series('alive'); out.activeWars = series('wars'); out.playerProvs = series('pl');
      const late = out.snap.filter(s => s.turn >= 80);
      out.warsMeanAfter80 = late.length ? +(late.reduce((a, s) => a + s.wars, 0) / late.length).toFixed(2) : null;
      out.pingPong = { max: pingMax, mean: +(pingSum / Math.max(1, pingN)).toFixed(3), hot: pingTop.sort((a, b) => b[2] - a[2]).slice(0, 8) };
      out.maxArmy = maxStack; out.maxArmyBefore1480 = maxStack1480; out.armyCount = armyCount;
      out.turnMs = { avg: +(turnMs.reduce((a, b) => a + b, 0) / Math.max(1, turnMs.length)).toFixed(1), max: +Math.max(0, ...turnMs).toFixed(1) };
      out.wallMs = { avg: +(wallMs.reduce((a, b) => a + b, 0) / Math.max(1, wallMs.length)).toFixed(1), max: +Math.max(0, ...wallMs).toFixed(1) };
      out.saveSize = (localStorage.getItem('kizil-elma-1451-v1') || '').length;
      out.rulerChanges = rulerChanges;
      out.constantinople = { owner: S.prov[ist].o, fall: istFall };
      out.final = { turn: S.turn, provs: S.prov.filter(q => q.o === FAC).length, gold: Math.round(S.fac[FAC].gold), stats: S.stats, misDone: Object.keys(S.misDone || {}).length };
      return out;
    }, { FAC: o.faction, TURNS: o.turns, POL: o.policy, SEED: seed, INV: L.INV });
  } catch (e) {
    res = { faction: o.faction, policy: o.policy, seed, exception: String(e.stack || e) };
  }
  res.errors = errors.slice(0, 10);
  await browser.close();
  return res;
}

function loadBalance() {
  const dir = path.join(__dirname, 'balance');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().map(f => ({ name: f, fn: require(path.join(dir, f)) }));
}

(async () => {
  const o = L.opts({ faction: 'OSM', turns: 60, policy: 'ai', seed: '1', assert: false, out: '', quiet: false, compare: '' });
  const seeds = parseSeeds(o.seed);
  const tag = `[sim ${o.faction} ${o.policy} x${o.turns} seed ${o.seed}]`;
  const t0 = Date.now();
  const runs = [];
  for (const s of seeds) {
    const r = await runOne(o, s);
    runs.push(r);
    if (!o.quiet) console.log(tag, 'seed', s, JSON.stringify({ seeded: r.seeded, over: r.over, turns: r.turnsPlayed, alive: r.alive, wars: r.activeWars, pl: r.playerProvs, ping: r.pingPong && r.pingPong.max, maxArmy: r.maxArmy, turnMs: r.turnMs, save: r.saveSize, ist: r.constantinople, err: r.errors.length, inv: r.inv && r.inv.length, exc: r.exception }));
  }
  const metrics = { faction: o.faction, policy: o.policy, turns: o.turns, runs };
  if (o.out) { fs.writeFileSync(o.out, JSON.stringify(metrics, null, 1)); console.log(tag, 'wrote', o.out); }
  const sum = ST.summarize(metrics);
  if (o.compare) {
    const bf = o.compare === true ? path.join(__dirname, 'balance', 'baseline.json') : o.compare;
    const base = JSON.parse(fs.readFileSync(bf, 'utf8')).configs[ST.configKey(metrics)];
    if (!base) console.log(tag, 'no baseline for', ST.configKey(metrics));
    else for (const r of ST.compare(sum, base.summary)) console.log(tag, 'vs baseline', r.k.padEnd(18), String(r.base).padStart(9), '->', String(r.now).padStart(9), `(${r.z >= 0 ? '+' : ''}${r.z} sd)`);
  } else if (!o.quiet) console.log(tag, 'summary', JSON.stringify(sum));
  let fails = [];
  for (const r of runs) {
    if (r.exception) fails.push(`seed ${r.seed}: exception ${r.exception}`);
    for (const e of r.errors || []) fails.push(`seed ${r.seed}: ${e}`);
  }
  if (o.assert) for (const m of loadBalance()) {
    let f;
    try { f = m.fn(metrics, o) || []; } catch (e) { f = ['threw: ' + (e.stack || e)]; }
    for (const x of f) fails.push(`${m.name}: ${x}`);
  }
  for (const f of fails) console.log(tag, 'FAIL', f);
  console.log(tag, fails.length ? 'FAILED' : 'PASSED', Math.round((Date.now() - t0) / 1000) + 's');
  process.exit(fails.length ? 1 : 0);
})();
