'use strict';
// Track B balance gates (W1): G2 ALB passive survival, G3 small realms keep a moving treasury, G6 ping-pong,
// G7 largest army before 1480. Start net income >= +3 for every faction (G1) is checked in-page by
// tests/scenarios/b-econ.js (sim metrics do not carry it).
module.exports = (metrics) => {
  const out = [], runs = metrics.runs.filter(r => !r.exception);
  if (!runs.length) return out;
  // G6: owner changes per province per 20-turn window
  for (const r of runs) if (r.pingPong && r.pingPong.max > 5) out.push(`seed ${r.seed}: ping-pong ${r.pingPong.max} owner changes in 20 turns > 5 (G6) ${JSON.stringify(r.pingPong.hot.slice(0, 3))}`);
  // G7: largest single army / garrison before 1480
  for (const r of runs) if (r.maxArmyBefore1480 > 60000) out.push(`seed ${r.seed}: largest army before 1480 is ${r.maxArmyBefore1480} > 60000 (G7)`);
  // G2: Albania, doing nothing, survives >= 12 turns in >= 80% of the seeds
  if (metrics.faction === 'ALB' && metrics.policy === 'passive' && metrics.turns >= 12) {
    const ok = runs.filter(r => (r.over === 'lose' ? r.turnsPlayed : metrics.turns) >= 12).length;
    if (ok < Math.ceil(runs.length * 0.8)) out.push(`ALB passive survived >= 12 turns in only ${ok}/${runs.length} seeds (G2: 80%): ${runs.map(r => r.over === 'lose' ? r.turnsPlayed : '-').join(',')}`);
  }
  // G3: Trebizond / Byzantium idle: the treasury grows
  if ((metrics.faction === 'TRB' || metrics.faction === 'BYZ') && metrics.policy === 'passive') {
    for (const r of runs) {
      const s16 = (r.snap || []).find(s => s.turn >= 16) || r.final;
      if (r.over !== 'lose' && s16 && s16.gold <= 60) out.push(`seed ${r.seed}: ${metrics.faction} passive treasury ${s16.gold} <= 60 by turn ${s16.turn} (G3)`);
    }
  }
  return out;
};
