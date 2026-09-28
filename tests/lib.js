'use strict';
// Shared helpers for the Playwright test scripts. No npm install: Playwright is taken from the global npm root.
const fs = require('fs');
const path = require('path');
const pw = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = process.env.KE_URL || 'file://' + path.join(ROOT, 'index.html');
const THREE = path.join(__dirname, 'vendor', 'three.min.js'); // three.js r128 (MIT), the CDN is not reachable in CI
const VIEWPORTS = {
  desktop: { viewport: { width: 1400, height: 900 }, mobile: false },
  mobile: { viewport: { width: 390, height: 844 }, mobile: true },
};

/** Parse --key=value / --flag args, falling back to env KE_<KEY>. */
function opts(defaults) {
  const o = { ...defaults };
  for (const k of Object.keys(defaults)) { const e = process.env['KE_' + k.toUpperCase()]; if (e != null) o[k] = e; }
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) o[m[1]] = m[2] == null ? true : m[2];
  }
  for (const k of Object.keys(defaults)) if (typeof defaults[k] === 'number') o[k] = +o[k];
  return o;
}

/**
 * Launch Chromium and open the game.
 *  three: 'serve' (local three.js), '404' (no three.js -> 2D fallback)
 *  start3d: value for localStorage 'ke-3d' before boot (true/false), or null to leave the default
 */
async function launch({ three = '404', start3d = null, viewport = 'desktop' } = {}) {
  const vp = VIEWPORTS[viewport] || VIEWPORTS.desktop;
  const browser = await pw.chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext({ viewport: vp.viewport, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: vp.mobile ? 2 : 1 });
  await context.route('**/three.min.js', r => three === 'serve'
    ? r.fulfill({ body: fs.readFileSync(THREE), contentType: 'application/javascript' })
    : r.fulfill({ status: 404, body: 'not found' }));
  await context.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  if (start3d != null) await context.addInitScript(v => { try { localStorage.setItem('ke-3d', v); } catch (e) {} }, start3d ? '1' : '0');
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + '\n  ' + (e.stack || '').split('\n').slice(1, 4).join('\n  ')));
  page.on('console', m => {
    if (m.type() === 'error' && !/fonts|ERR_FAILED|ERR_CERT|net::|404|three/i.test(m.text())) errors.push('CONSOLE: ' + m.text());
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await waitLoaded(page);
  return { browser, context, page, errors };
}

const waitLoaded = page => page.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 300000 });

/** Start a game through the start screen and dismiss the intro modal. */
async function startGame(page, fac) {
  await page.click(`[data-act="pick"][data-f="${fac}"]`);
  await page.click('[data-act="begin"]');
  await page.waitForSelector('#modal:not([hidden]) [data-act="ev"]', { timeout: 60000 });
  await page.click('#modal [data-act="ev"]:not([disabled])');
  await page.waitForTimeout(150);
}

/** Close whatever modals are open (events: first enabled choice; peace offers: decline). */
async function closeModals(page) {
  const seen = [];
  for (let k = 0; k < 60; k++) {
    const r = await page.evaluate(() => {
      const m = document.getElementById('modal'); if (m.hidden) return { s: 0 };
      const h = m.querySelector('h2'), title = h ? h.textContent : m.innerText.slice(0, 40);
      const ev = m.querySelector('[data-act="ev"]:not([disabled])'); if (ev) { ev.click(); return { s: 1, title }; }
      const off = m.querySelector('[data-act="off"][data-v="0"]'); if (off) { off.click(); return { s: 1, title }; }
      const c = m.querySelector('[data-act="mclose"]'); if (c) { c.click(); return { s: 1, title }; }
      return { s: 2, title };
    });
    if (r.s === 0) return null;
    seen.push(r.title);
    if (r.s === 2) return 'stuck: modal without a close button: ' + r.title;
    await page.waitForTimeout(60);
  }
  return 'stuck: modals keep opening: ' + seen.join(' / ');
}

/** End the turn through the debug hook and wait until the turn flow finishes. */
async function endTurn(page) {
  await page.evaluate(() => window.__ke.endTurn());
  await page.waitForFunction(() => !document.getElementById('endTurn').disabled, null, { timeout: 180000 });
}

// State invariants, evaluated in the page: every tests/inv/*.js exports a JS expression string that
// returns an array of violations; INV runs them all (a throwing module reports itself as a violation).
const INV_DIR = path.join(__dirname, 'inv');
const INV = '(()=>{const out=[];' + fs.readdirSync(INV_DIR).filter(f => f.endsWith('.js')).sort().map(f =>
  `try{out.push(...(${require(path.join(INV_DIR, f))}));}catch(e){out.push(${JSON.stringify('inv/' + f + ' threw: ')}+e.message);}`).join('') + 'return out;})()';

async function summary(page) {
  return page.evaluate(() => {
    const S = window.__ke.S, c = {};
    S.prov.forEach(p => c[p.o] = (c[p.o] || 0) + 1);
    return { turn: S.turn, over: S.over || null, alive: Object.keys(S.fac).filter(f => S.fac[f].alive).length, wars: Object.keys(S.war).length, player: S.player, provs: c[S.player] || 0, gold: Math.round(S.fac[S.player].gold) };
  });
}

/** Screen point that picks province i (checked through the hover tooltip), or null. */
async function provPoint(page, i) {
  return page.evaluate(i => {
    const K = window.__ke, d = K.PD[i], cv = document.getElementById('map'), tip = document.getElementById('tip');
    const hit = (x, y) => {
      if (x < 2 || y < 2 || x > innerWidth - 2 || y > innerHeight - 2 || document.elementFromPoint(x, y) !== cv) return false;
      cv.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType: 'mouse', pointerId: 1, bubbles: true }));
      const b = !tip.hidden && tip.querySelector('b'); return !!b && b.textContent === d.name;
    };
    const [sx, sy] = K.proj(d.x, d.y);
    let res = null;
    for (let r = 0; r <= 24 && !res; r += 3)
      for (let a = 0; a < (r ? 12 : 1) && !res; a++) {
        const x = Math.round(sx + r * Math.cos(a * Math.PI / 6)), y = Math.round(sy + r * Math.sin(a * Math.PI / 6));
        if (hit(x, y)) res = [x, y];
      }
    tip.hidden = true;
    return res;
  }, i);
}

/** Click province i on the map with the real mouse. */
async function clickProv(page, i) {
  const p = await provPoint(page, i);
  if (!p) throw new Error('province ' + i + ' is not clickable on screen');
  await page.mouse.click(p[0], p[1]);
  await page.waitForTimeout(120);
}

module.exports = { pw, URL, opts, launch, waitLoaded, startGame, closeModals, endTurn, INV, summary, provPoint, clickProv };
