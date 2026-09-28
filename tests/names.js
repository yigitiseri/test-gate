#!/usr/bin/env node
'use strict';
/*
 * Duplicate top-level names across src/js/*.js.
 * All JS files share one scope (one IIFE), and `node --check` does not catch two top-level
 * `function x` declarations (the later one silently wins). This finds duplicate top-level
 * function / const / let / var / class names, i.e. declarations that start at column 0.
 *
 *   node tests/names.js
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'src', 'js');

/** Identifiers declared by a `const|let|var a=..., b=...;` statement starting at text[i] (after the keyword). */
function declarators(text, i) {
  const names = [];
  let depth = 0, expectName = true;
  while (i < text.length) {
    const c = text[i];
    if (expectName) {
      const m = /^\s*([A-Za-z_$][\w$]*)/.exec(text.slice(i, i + 200));
      if (m) { names.push(m[1]); i += m[0].length; expectName = false; continue; }
      const d = /^\s*[[{]/.exec(text.slice(i, i + 10)); // destructuring: skip it
      if (d) { expectName = false; continue; }
      break;
    }
    if (c === '"' || c === "'" || c === '`') { // skip strings / template literals (no nested ${`...`} support needed here)
      const q = c; i++;
      while (i < text.length && text[i] !== q) { if (text[i] === '\\') i++; else if (q === '`' && text[i] === '$' && text[i + 1] === '{') { let dd = 1; i += 2; while (i < text.length && dd) { if (text[i] === '{') dd++; else if (text[i] === '}') dd--; i++; } continue; } i++; }
      i++; continue;
    }
    if (c === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (c === '/' && text[i + 1] === '*') { i = text.indexOf('*/', i + 2) + 2; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (depth === 0 && c === ',') expectName = true;
    else if (depth === 0 && (c === ';' || (c === '\n' && !/[,=(\[{+\-*/?:.&|]\s*$/.test(text.slice(Math.max(0, i - 40), i))))) break;
    i++;
  }
  return names;
}

function topLevelNames(file) {
  const text = fs.readFileSync(file, 'utf8');
  const out = [];
  const re = /^(?:async\s+)?(function\s*\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)?/gm;
  let m;
  while ((m = re.exec(text))) {
    const kind = m[1].replace(/\s|\*/g, '');
    const line = text.slice(0, m.index).split('\n').length;
    if (kind === 'function' || kind === 'class') { if (m[2]) out.push({ name: m[2], kind, line }); }
    else for (const n of declarators(text, m.index + m[0].length - (m[2] || '').length)) out.push({ name: n, kind, line });
  }
  return out;
}

const seen = new Map();
const dups = [];
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.js')).sort()) {
  for (const d of topLevelNames(path.join(DIR, f))) {
    const where = `${f}:${d.line} (${d.kind})`;
    if (seen.has(d.name)) dups.push(`${d.name}: ${seen.get(d.name)} and ${where}`);
    else seen.set(d.name, where);
  }
}
for (const d of dups) console.log('[names] FAIL duplicate top-level name', d);
console.log('[names]', dups.length ? 'FAILED' : 'PASSED', seen.size, 'top-level names');
process.exit(dups.length ? 1 : 0);
