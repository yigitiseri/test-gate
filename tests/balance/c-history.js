'use strict';
// Track C gates on sim metrics: G12 (the Ottoman ruler changes by t=160 in every seed, applied to runs of >= 160
// turns that did not end early) and G13 (no modal title - i.e. random event - more than 6 times per 100 turns;
// the season report is not an event).
const NOT_EVENTS = new Set(['Mevsim Raporu']);
module.exports = (metrics) => {
  const out = [];
  for (const r of metrics.runs) {
    if (r.exception) continue;
    const s = `seed ${r.seed}`, turns = r.turnsPlayed || 0;
    if (turns >= 160 && !(r.rulerChanges && r.rulerChanges.OSM >= 1)) out.push(`${s}: Ottoman ruler never changed in ${turns} turns (G12)`);
    const cap = 6 * Math.max(1, Math.ceil(turns / 100));
    for (const [t, n] of Object.entries(r.events || {})) if (!NOT_EVENTS.has(t) && n > cap) out.push(`${s}: "${t}" shown ${n} times in ${turns} turns (G13, max ${cap})`);
  }
  return out;
};
