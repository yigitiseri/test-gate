#!/usr/bin/env node
'use strict';
/*
 * Static lint of the mission trees (G15), node only:
 *   node tests/missions-lint.js
 * Every faction has >= 5 missions in 2 branches; every province key exists; no mission targets a
 * province of a starting ally (or the faction's own starting province only); req ids exist and form
 * no cycle; ally/vs factions exist; hold provinces are owned at start; exactly one goal per mission.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const SRC = path.join(__dirname, '..', 'src', 'js');
const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const slice = (txt, start, end) => { const i = txt.indexOf(start); if (i < 0) throw new Error('missing ' + start); const j = txt.indexOf(end, i); return txt.slice(i, j + end.length); };

const f01 = read('01-factions-provinces.js'), f03 = read('03-state.js'), f03b = read('03b-missions.js');
const ctx = {};
vm.runInNewContext(slice(f01, 'const FAC={', '\n};\n').replace('const FAC', 'this.FAC') + slice(f01, 'const PROVS=[', '\n];\n').replace('const PROVS', 'this.PROVS')
  + slice(f03b, 'const MIS={', '\n};\n').replace('const MIS', 'this.MIS') + slice(f03b, 'const MIS_BR={', '};\n').replace('const MIS_BR', 'this.MIS_BR'), ctx);
const { FAC, PROVS, MIS, MIS_BR } = ctx;
const owner = {}; PROVS.forEach(p => owner[p[0]] = p[4]);
const allyTxt = f03.slice(f03.indexOf('[[', f03.indexOf("S.war[key(a,b)]=newWar(a,b));")), f03.indexOf('].forEach(([a,b])=>S.ally') + 1);
const allies = JSON.parse(allyTxt.replace(/'/g, '"'));
if (allies.length !== 4) throw new Error('starting allies not parsed: ' + allyTxt);
const isAlly = (a, b) => allies.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const GOALS = ['own', 'hold', 'ally', 'devAt', 'mkt', 'gold', 'count', 'won'];
const fails = []; let n = 0;
for (const f of Object.keys(FAC)) {
  const L = MIS[f];
  if (!L) { fails.push(`${f}: no missions`); continue; }
  if (L.length < 5) fails.push(`${f}: only ${L.length} missions`);
  if (!MIS_BR[f] || MIS_BR[f].length !== 2) fails.push(`${f}: branch names missing`);
  const brs = new Set(L.map(m => m.br)); if (!brs.has('A') || !brs.has('B')) fails.push(`${f}: needs branches A and B`);
  const ids = new Set();
  for (const m of L) {
    n++; const tag = `${f} "${m.t}"`;
    if (!m.id || ids.has(m.id)) fails.push(`${tag}: missing/duplicate id`); ids.add(m.id);
    const g = GOALS.filter(k => m[k] != null); if (g.length !== 1) fails.push(`${tag}: goals ${g.join(',') || 'none'}`);
    if (!m.t || !m.d) fails.push(`${tag}: title/description missing`);
    const keys = [...(m.own || []), ...(m.hold ? [m.hold] : []), ...Object.keys(m.devAt || {}), ...(m.dev && m.dev[0] !== 'cap' ? [m.dev[0]] : [])];
    for (const k of keys) if (!owner[k]) fails.push(`${tag}: unknown province key ${k}`);
    if (m.own) {
      for (const k of m.own) { const o = owner[k]; if (o && o !== f && isAlly(f, o)) fails.push(`${tag}: targets ${k} of starting ally ${o}`); }
      if (m.own.every(k => owner[k] === f)) fails.push(`${tag}: all targets already owned at start`);
    }
    if (m.hold && owner[m.hold] !== f) fails.push(`${tag}: hold province ${m.hold} not owned at start`);
    if (m.hold && (!m.vs || !FAC[m.vs] || !(m.turns > 0))) fails.push(`${tag}: hold needs vs and turns`);
    if (m.devAt) for (const k in m.devAt) if (owner[k] !== f) fails.push(`${tag}: devAt ${k} not owned at start`);
    if (m.ally && (!FAC[m.ally] || m.ally === f)) fails.push(`${tag}: bad ally ${m.ally}`);
    if (m.ally && isAlly(f, m.ally)) fails.push(`${tag}: already allied with ${m.ally} at start`);
    if (m.gold != null && m.gold !== 'auto' && !(m.gold > 0)) fails.push(`${tag}: bad gold`);
  }
  for (const m of L) for (const r of m.req || []) if (!ids.has(r)) fails.push(`${f} "${m.t}": req ${r} unknown`);
  const byId = Object.fromEntries(L.map(m => [m.id, m]));
  const depth = (m, seen = new Set()) => { if (seen.has(m.id)) return Infinity; seen.add(m.id); return 1 + Math.max(0, ...(m.req || []).map(r => byId[r] ? depth(byId[r], new Set(seen)) : 0)); };
  for (const m of L) { const d = depth(m); if (d === Infinity) fails.push(`${f}: req cycle at ${m.id}`); }
  const tiers = Math.max(...L.map(m => depth(m))); if (tiers < 2) fails.push(`${f}: only ${tiers} tier`);
}
for (const x of fails) console.log('[missions-lint] FAIL', x);
console.log('[missions-lint]', fails.length ? `FAILED (${fails.length})` : `PASSED ${Object.keys(MIS).length} factions, ${n} missions`);
process.exit(fails.length ? 1 : 0);
