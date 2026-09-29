'use strict';
// Track D world gates (world-passive = --faction=HAF --policy=passive, >= 160 turns).
// G4: active wars averaged over the snapshots at t=80..320 >= 2, and no 40-turn window (two consecutive
// 20-turn snapshots) with zero wars. G5 (W2 gate, checked from 320 turns): 8..16 factions alive at the end.
module.exports = (metrics) => {
  const out = [];
  if (metrics.faction !== 'HAF' || metrics.policy !== 'passive' || metrics.turns < 160) return out;
  for (const r of metrics.runs) {
    if (r.exception || !r.snap) continue;
    const s = `seed ${r.seed}`;
    const late = r.snap.filter(x => x.turn >= 80 && x.turn <= 320);
    if (late.length) {
      const mean = late.reduce((a, x) => a + x.wars, 0) / late.length;
      if (mean < 2) out.push(`${s}: mean active wars t=80..320 is ${mean.toFixed(2)} < 2 (G4)`);
    }
    for (let k = 1; k < r.snap.length; k++) if (r.snap[k].turn >= 40 && r.snap[k].wars === 0 && r.snap[k - 1].wars === 0) out.push(`${s}: no war at t=${r.snap[k - 1].turn} and t=${r.snap[k].turn} (G4)`);
    if (metrics.turns >= 320 && r.turnsPlayed >= 320) {
      const a = r.alive[r.alive.length - 1];
      if (a < 8 || a > 16) out.push(`${s}: ${a} factions alive at t=320, want 8..16 (G5)`);
    }
  }
  return out;
};
