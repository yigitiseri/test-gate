'use strict';
// Core sanity gates for every sim run (W0). metrics = {faction, policy, turns, runs:[...]}; returns failures.
// G10 endTurn compute (avg < 120 ms, max < 1000 ms here: headless software rendering spikes), G14 save
// size (< 400 KB), no page errors, no invariant violations, the game actually advanced.
module.exports = (metrics) => {
  const out = [];
  for (const r of metrics.runs) {
    const s = `seed ${r.seed}`;
    if (r.exception) continue; // reported by sim.js itself
    if (r.inv && r.inv.length) out.push(`${s}: invariant violations ${JSON.stringify(r.inv.slice(0, 3))}`);
    if (!(r.turnsPlayed > 0)) out.push(`${s}: no turn was played`);
    if (!r.over && r.turnsPlayed < metrics.turns) out.push(`${s}: stopped at turn ${r.turnsPlayed} of ${metrics.turns} without game over`);
    if (r.turnMs && r.turnMs.avg >= 120) out.push(`${s}: endTurn avg ${r.turnMs.avg} ms >= 120 (G10)`);
    if (r.turnMs && r.turnMs.max >= 1000) out.push(`${s}: endTurn max ${r.turnMs.max} ms >= 1000`);
    if (r.saveSize >= 400 * 1024) out.push(`${s}: save ${r.saveSize} bytes >= 400 KB (G14)`);
    if (r.alive && r.alive[r.alive.length - 1] < 2) out.push(`${s}: fewer than 2 factions alive`);
  }
  return out;
};
