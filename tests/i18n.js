#!/usr/bin/env node
'use strict';
/*
 * English coverage: boot with ke-lang=en, walk the start screen, every top-bar modal, every guide tab, the
 * province/army panel, tooltips and the advisor, map labels, then play N turns and read every report / event
 * before closing it. Any visible text that still looks Turkish is listed with the screen it was seen on.
 *
 *   node tests/i18n.js [--faction=OSM] [--turns=12] [--viewport=desktop|mobile] [--assert]
 *
 * "Looks Turkish" = a Turkish-only letter (ç ğ ı ö ş ü İ …) or a common Turkish word. Proper names that are
 * legitimately written with those letters in English go in ALLOW.
 */
const L = require('./lib');
const TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/;
const TR_WORDS = /\b(ve|ile|bir|için|asker|ordu|ordusu|savaş|eyalet|devlet|altın|Devam|Kabul|Reddet|Kapat|değil|daha|yok|Tur|Turu|Bitir|kale|garnizon|Muharebe|Zafer|Yenilgi|Barış|Mevsim|Rapor|İlkbahar|Yaz|Sonbahar|Kış)\b/;
const ALLOW = [/Türkçe/, /Đurađ/, /Alexăndrel/, /Ștefan/, /Mircea/]; // the language switch names itself

(async () => {
  const o = L.opts({ faction: 'OSM', turns: 12, viewport: 'desktop', assert: false });
  const tag = `[i18n en ${o.faction} ${o.viewport}]`;
  const t0 = Date.now();
  const hits = new Map(); // snippet -> first screen
  const { browser, page, errors } = await L.launch({ three: 'serve', viewport: o.viewport, lang: 'en' });
  const E = (fn, a) => page.evaluate(fn, a);
  const scan = async (where, sel) => {
    const txt = await E(sel => { const out = []; for (const el of document.querySelectorAll(sel)) { if (el.hidden || el.closest('[hidden]')) continue; out.push(el.innerText || ''); for (const a of el.querySelectorAll('[title],[aria-label],[placeholder]')) for (const k of ['title', 'aria-label', 'placeholder']) { const v = a.getAttribute(k); if (v) out.push(v); } } return out.join('\n'); }, sel);
    for (let line of txt.split(/\n+/)) {
      line = line.trim(); if (!line) continue;
      let l2 = line; for (const a of ALLOW) l2 = l2.replace(new RegExp(a.source, 'g'), '');
      if (TR_CHARS.test(l2) || TR_WORDS.test(l2)) { const k = line.slice(0, 140); if (!hits.has(k)) hits.set(k, where); }
    }
  };
  const scanStr = (where, s) => { for (const line of String(s).split(/\n+/)) { const l = line.trim(); if (l && (TR_CHARS.test(l) || TR_WORDS.test(l)) && !hits.has(l)) hits.set(l.slice(0, 140), where); } };
  const click = async sel => { await page.click(sel, { timeout: 30000 }); await page.waitForTimeout(120); };
  const modalOpen = () => E(() => !document.getElementById('modal').hidden);
  const drain = async where => { for (let k = 0; k < 40 && await modalOpen(); k++) { await scan(where, '#modal'); if (await L.closeModals(page) === null) break; } };
  try {
    const lang = await E(() => [window.__ke.lang, document.documentElement.lang]);
    if (lang[0] !== 'en' || lang[1] !== 'en') errors.push('game did not boot in English: ' + lang);
    await scan('start screen', '#start');
    for (const f of await E(() => [...document.querySelectorAll('[data-act="pick"]')].map(b => b.dataset.f))) { await click(`[data-act="pick"][data-f="${f}"]`); await scan('start pick ' + f, '#pick'); }
    await click(`[data-act="pick"][data-f="${o.faction}"]`);
    await click('[data-act="begin"]');
    await page.waitForSelector('#modal:not([hidden])', { timeout: 60000 });
    await drain('intro');
    if (await E(() => !!document.querySelector('#tutBub'))) await scan('tutorial', '#tutBub');
    await scan('top bar', '#top'); await scan('zoom', '#zoom'); await scan('advisor', '#uiAdv');
    // province + army panel, and an order to a neighbour
    const cap = await E(() => window.__ke.S.fac[window.__ke.S.player].cap);
    await E(c => { const K = window.__ke; K.centerOn(K.PD[c].lx, K.PD[c].ly, 2.2); }, cap); await page.waitForTimeout(300);
    if (await L.provPoint(page, cap)) { await L.clickProv(page, cap); await scan('panel own province', '#panel'); }
    for (const j of await E(c => window.__ke.PD[c].adj, cap)) { const p = await L.provPoint(page, j); if (p) { await page.mouse.click(p[0], p[1]); await page.waitForTimeout(200); await scan('panel order/foreign', '#panel'); } }
    await page.keyboard.press('Escape');
    // tooltips on everything that has one
    const tips = await E(() => [...document.querySelectorAll('[data-tip]')].filter(e => e.offsetParent).length);
    for (let k = 0; k < Math.min(tips, 40); k++) {
      await E(k => { const el = [...document.querySelectorAll('[data-tip]')].filter(e => e.offsetParent)[k]; if (el) { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, clientX: r.left + 2, clientY: r.top + 2 })); el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: r.left + 2, clientY: r.top + 2 })); } }, k);
      await page.waitForTimeout(60); await scan('tooltip', '#tip, .tip, [role="tooltip"]');
    }
    // top-bar modals, menu, guide tabs
    for (const sel of ['#top [data-act="diplo"]', '#top [data-act="missions"]', '#top [data-act="chron"]', '#facBtn', '#top [data-act="menu"]']) {
      if (!await E(s => !!document.querySelector(s), sel)) continue;
      await click(sel); await scan('modal ' + sel, '#modal'); await L.closeModals(page);
    }
    await click('#top [data-act="guide"]');
    for (const t of await E(() => [...document.querySelectorAll('#modal .gt[data-t]')].map(b => b.dataset.t))) { await click(`#modal .gt[data-t="${t}"]`); await scan('guide ' + t, '#modal'); }
    await L.closeModals(page);
    if (await E(() => typeof window.__ke.aLabels === 'function')) scanStr('map labels', (await E(() => window.__ke.aLabels().map(x => x.t || x.text || x.s || '').join('\n'))));
    // play: every report / event / toast
    for (let t = 0; t < o.turns; t++) {
      await E(() => window.__ke.endTurn());
      await page.waitForFunction(() => !document.getElementById('endTurn').disabled, null, { timeout: 180000 });
      await scan('toasts', '#toasts'); await drain('turn ' + (t + 1)); await scan('top bar', '#top'); await scan('advisor', '#uiAdv');
      if (await E(() => !!document.querySelector('#card:not([hidden])'))) await scan('battle card', '#card');
    }
    await click('#top [data-act="chron"]'); await scan('chronicle after play', '#modal'); await L.closeModals(page);
  } catch (e) { errors.push('exception: ' + (e.stack || e)); }
  await browser.close();
  const list = [...hits].map(([k, w]) => `  [${w}] ${k}`);
  console.log(tag, `${hits.size} Turkish-looking lines`);
  for (const l of list.slice(0, 400)) console.log(l);
  for (const e of errors) console.log(tag, 'FAIL', e);
  const bad = errors.length || (o.assert && hits.size);
  console.log(tag, bad ? 'FAILED' : 'PASSED', Math.round((Date.now() - t0) / 1000) + 's');
  process.exit(bad ? 1 : 0);
})();
