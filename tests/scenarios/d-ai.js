'use strict';
// Track D AI diplomacy: 60 turns of a passive-player world. Every AI declaration targets a faction it
// borders (land or sea lane) with a real attack chance (bug B13); the world keeps fighting; a war nudge
// (history chains) makes the nudged AI declare within a few turns; aiTargets/aiDefendNeeds are sane.
module.exports = {
  name: 'd-ai',
  fac: null,
  async run(page, L, check) {
    const E = (fn, a) => page.evaluate(fn, a);
    const r = await E(async () => {
      const K = window.__ke, sleep = ms => new Promise(r => setTimeout(r, ms));
      K.seed(7); K.beginGame('HAF');
      const bad = [], decl = [];
      K.hook('warDeclared', (a, b) => {
        const last = K.aiDecl[K.aiDecl.length - 1];
        if (!last || last.f !== a || last.g !== b || last.t !== K.S.turn) return; // allies joining, player, chains
        const S = K.S, PD = K.PD; let adj = false;
        for (let i = 0; i < S.prov.length && !adj; i++) if (S.prov[i].o === a) for (const j of PD[i].adj) if (S.prov[j].o === b) { adj = true; break; }
        decl.push(a + '>' + b); if (!adj || !(last.p >= (last.nudged ? 0.05 : 0.3))) bad.push({ t: S.turn, a, b, adj, p: last.p });
      });
      const closeAll = () => { for (let k = 0; k < 30; k++) { const m = document.getElementById('modal'); if (m.hidden) return; const b = m.querySelector('[data-act=ev]:not([disabled])') || m.querySelector('[data-act=off][data-v="0"]') || m.querySelector('[data-act=mclose]'); if (!b) return; b.click(); } };
      const wars = []; let zeroRun = 0, maxZero = 0;
      for (let t = 0; t < 60; t++) {
        K.endTurn(); for (let w = 0; w < 20000; w++) { await sleep(2); if (!document.getElementById('endTurn').disabled) break; }
        closeAll(); const n = Object.keys(K.S.war).length; wars.push(n); zeroRun = n ? 0 : zeroRun + 1; maxZero = Math.max(maxZero, zeroRun);
      }
      // nudge: OSM toward war with its most desired non-enemy neighbour that is reachable
      const S = K.S; let nud = null;
      const osmAlive = S.fac.OSM.alive;
      if (osmAlive) {
        const nb = new Set(); S.prov.forEach((q, i) => { if (q.o === 'OSM') K.PD[i].adj.forEach(j => { const o = S.prov[j].o; if (o !== 'OSM') nb.add(o); }); });
        const k2 = g => ['OSM', g].sort().join('|');
        const g = [...nb].find(g => S.fac[g].alive && !S.war[k2(g)] && !S.ally[k2(g)] && !((S.truce[k2(g)] || 0) > S.turn) && K.aiReach('OSM', g).ok);
        if (g) {
          K.aiNudge('OSM', { war: g, prio: 1, until: S.turn + 12 }); let at = null;
          for (let t = 0; t < 10 && at == null; t++) {
            K.endTurn(); for (let w = 0; w < 20000; w++) { await sleep(2); if (!document.getElementById('endTurn').disabled) break; }
            closeAll(); if (K.S.war[k2(g)]) at = t + 1;
          }
          nud = { g, at };
        }
      }
      const osmT = osmAlive ? K.aiTargets('OSM') : [], dn = osmAlive ? K.aiDefendNeeds('OSM') : [];
      return { bad, decl: decl.length, wars, mean: wars.reduce((a, b) => a + b, 0) / wars.length, maxZero, nud, tOk: osmT.every(x => x.i >= 0 && x.prio > 0), dOk: dn.every(x => x.need > 0), riv: Object.values(K.S.ai).filter(a => a.riv).length, turnMs: K.stats.turnMs };
    });
    check('AI declared wars in 60 turns', r.decl >= 3, r.decl);
    check('no declaration against an unreachable target (B13)', r.bad.length === 0, r.bad.slice(0, 5));
    check('the world keeps fighting (mean wars >= 2, never 10+ turns at 0)', r.mean >= 2 && r.maxZero < 10, { mean: r.mean, maxZero: r.maxZero, wars: r.wars.join(',') });
    // (a seeded 60-turn world: any new rule shifts its dice; 6 turns became 7 with the Divan's officers in 2026, hence 8)
    check('a war nudge makes the AI declare within 8 turns', !r.nud || (r.nud.at != null && r.nud.at <= 8), r.nud);
    check('aiTargets / aiDefendNeeds shapes', r.tOk && r.dOk);
    check('rivalries seeded', r.riv >= 10, r.riv);
  },
};
