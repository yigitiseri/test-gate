'use strict';
/*
 * Summaries of tests/sim.js metrics, used for tests/balance/baseline.json and `sim.js --compare`.
 *
 *   node tests/simstats.js out1.json [out2.json ...]   print the summary of sim outputs
 */
const KEYS = {
  turnsPlayed: r => r.turnsPlayed,
  aliveEnd: r => r.alive && r.alive[r.alive.length - 1],
  warsMean: r => r.activeWars && r.activeWars.reduce((a, b) => a + b, 0) / r.activeWars.length,
  warsMeanAfter80: r => r.warsMeanAfter80,
  playerProvsEnd: r => r.playerProvs && r.playerProvs[r.playerProvs.length - 1],
  pingPongMax: r => r.pingPong && r.pingPong.max,
  pingPongMean: r => r.pingPong && r.pingPong.mean,
  maxArmy: r => r.maxArmy,
  maxArmyBefore1480: r => r.maxArmyBefore1480,
  turnMsAvg: r => r.turnMs && r.turnMs.avg,
  turnMsMax: r => r.turnMs && r.turnMs.max,
  wallMsAvg: r => r.wallMs && r.wallMs.avg, // endTurn call -> button enabled again, incl. the 30 ms delay and rendering
  saveSize: r => r.saveSize,
  eventsTotal: r => r.events && Object.entries(r.events).filter(([k]) => k !== 'Mevsim Raporu').reduce((a, [, v]) => a + v, 0),
  eventMaxTitle: r => r.events && Math.max(0, ...Object.entries(r.events).filter(([k]) => k !== 'Mevsim Raporu').map(([, v]) => v)),
  istFallTurn: r => r.constantinople && r.constantinople.fall ? r.constantinople.fall.turn : null,
  playerGoldEnd: r => r.final && r.final.gold,
};

function stat(xs) {
  xs = xs.filter(x => typeof x === 'number' && isFinite(x));
  if (!xs.length) return null;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, xs.length - 1));
  const r = v => Math.round(v * 100) / 100;
  return { n: xs.length, mean: r(mean), sd: r(sd), min: r(Math.min(...xs)), max: r(Math.max(...xs)) };
}

function summarize(metrics) {
  const out = {};
  for (const [k, fn] of Object.entries(KEYS)) out[k] = stat(metrics.runs.map(r => { try { return fn(r); } catch (e) { return null; } }));
  out.istFallen = metrics.runs.filter(r => r.constantinople && r.constantinople.fall).length + '/' + metrics.runs.length;
  return out;
}

const configKey = m => `${m.faction}-${m.policy}-${m.turns}`;

/** Compare a summary to a baseline summary: [{k, base, now, z}] where z is the difference in baseline sds. */
function compare(now, base) {
  const rows = [];
  for (const k of Object.keys(KEYS)) {
    const a = base[k], b = now[k];
    if (!a || !b) continue;
    const sd = Math.max(a.sd, b.sd, Math.abs(a.mean) * 0.05, 1e-9);
    rows.push({ k, base: a.mean, now: b.mean, z: Math.round((b.mean - a.mean) / sd * 100) / 100 });
  }
  return rows;
}

module.exports = { summarize, compare, configKey, KEYS };

if (require.main === module) {
  for (const f of process.argv.slice(2)) {
    const m = JSON.parse(require('fs').readFileSync(f, 'utf8'));
    console.log(configKey(m), JSON.stringify(summarize(m), null, 1));
  }
}
