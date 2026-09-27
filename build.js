#!/usr/bin/env node
/*
 * Age of Dynasties build: src/template.html + src/css/*.css + src/js/*.js -> index.html
 *
 *   node build.js           write index.html
 *   node build.js --check   exit 1 if index.html is not what the sources would build
 *   node build.js --js out  also write the bare concatenated script (IIFE included) to <out>
 *
 * The template holds two marker lines:
 *   <!--@include css-->   replaced by every src/css/*.css, sorted by file name
 *   /*@include js*\/      replaced by every src/js/*.js,  sorted by file name
 * JS files are NOT modules: they are pasted, in order, into the single IIFE that the
 * template opens and closes, so they share one scope. No dependencies, plain Node.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'index.html');

function readDir(dir, ext) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(ext)).sort();
  if (!files.length) throw new Error('no ' + ext + ' files in ' + dir);
  return files.map(f => {
    const s = fs.readFileSync(path.join(dir, f), 'utf8');
    if (!s.endsWith('\n')) throw new Error(path.join(dir, f) + ' must end with a newline');
    return s;
  }).join('');
}

function replaceMarker(tpl, marker, content) {
  const line = marker + '\n';
  const i = tpl.indexOf(line);
  if (i < 0 || tpl.indexOf(line, i + 1) >= 0) throw new Error('template must contain exactly one line "' + marker + '"');
  return tpl.slice(0, i) + content + tpl.slice(i + line.length);
}

function build() {
  const tpl = fs.readFileSync(path.join(SRC, 'template.html'), 'utf8');
  const css = readDir(path.join(SRC, 'css'), '.css');
  const js = readDir(path.join(SRC, 'js'), '.js');
  let html = replaceMarker(tpl, '<!--@include css-->', css);
  html = replaceMarker(html, '/*@include js*/', js);
  return { html, js };
}

/** The main inline script of a built page (IIFE included), for `node --check`. */
function mainScript(html) {
  const open = '<script>\n', close = '</script>';
  const a = html.lastIndexOf(open);
  const b = html.indexOf(close, a);
  return html.slice(a + open.length, b);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const { html } = build();
  if (args.includes('--check')) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== html) {
      console.error('index.html is out of date or was hand-edited. Edit src/ and run: node build.js');
      process.exit(1);
    }
    console.log('index.html is up to date');
  } else {
    fs.writeFileSync(OUT, html);
    console.log('wrote index.html (' + Buffer.byteLength(html) + ' bytes)');
  }
  const j = args.indexOf('--js');
  if (j >= 0 && args[j + 1]) {
    fs.writeFileSync(args[j + 1], mainScript(html));
    console.log('wrote ' + args[j + 1]);
  }
}

module.exports = { build, mainScript };
