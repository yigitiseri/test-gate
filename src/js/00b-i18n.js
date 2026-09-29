/* =====================================================================
   I18N: Turkish and English. Load order: right after 00a, before any data.
   - Code text:    lng('Türkçe metin', 'English text') -> the string for the current language.
                   Templates work too: lng(`${n} asker`, `${n} troops`). (Not L/T: those are common locals.)
   - Data text:    a field may be a string (Turkish only) or {tr:'…', en:'…'}; read it with tx(v).
                   Big data tables may instead keep Turkish in place and add an English table keyed by
                   id that is merged at load when EN (e.g. PROV_EN / FAC_EN in 01).
   - Static HTML:  data-en="English innerHTML", data-en-title, data-en-aria, data-en-ph on template nodes.
   - EN (boolean) for the rare branch that differs by more than text (word order, plural rules).
   The language is fixed for one page load: setLang() saves and reloads, so every string is rebuilt.
   Text already stored in a save (chronicle, news, report lines) stays in the language it was written in.
   ===================================================================== */
const LANGS=['tr','en'];
const LANG=(()=>{try{const v=localStorage.getItem('ke-lang');if(LANGS.includes(v))return v;}catch(e){}
 return /^tr\b/i.test((navigator.languages&&navigator.languages[0])||navigator.language||'')?'tr':'en';})();
const EN=LANG==='en';
/** Pick the string for the current language (English falls back to Turkish when missing). */
function lng(tr,en){return EN&&en!=null?en:tr;}
/** Resolve a data field: string, {tr,en}, or null. */
function tx(v){if(v==null)return '';if(typeof v==='object'&&!Array.isArray(v))return EN&&v.en!=null?v.en:(v.tr!=null?v.tr:'');return v;}
/** Switch language: save the running game, remember the choice, reload. */
function setLang(l){if(!LANGS.includes(l)||l===LANG)return;
 try{if(typeof save==='function'&&typeof S!=='undefined'&&S&&S.player)save();}catch(e){}
 try{localStorage.setItem('ke-lang',l);}catch(e){}location.reload();}
function i18nDom(root){if(!EN)return;root=root||document;
 root.querySelectorAll('[data-en]').forEach(e=>{e.innerHTML=e.dataset.en;});
 root.querySelectorAll('[data-en-title]').forEach(e=>{e.title=e.dataset.enTitle;});
 root.querySelectorAll('[data-en-aria]').forEach(e=>{e.setAttribute('aria-label',e.dataset.enAria);});
 root.querySelectorAll('[data-en-ph]').forEach(e=>{e.placeholder=e.dataset.enPh;});}
document.documentElement.lang=LANG;
i18nDom(document);
/** Two-button language switch (start screen and menu). */
function langSwitch(){return `<div class="langsw" role="group" aria-label="${lng('Dil','Language')}">${LANGS.map(l=>`<button class="btn ${l===LANG?'on':''}" data-act="lang" data-l="${l}" aria-pressed="${l===LANG}">${l==='tr'?'Türkçe':'English'}</button>`).join('')}</div>`;}
ACTS.lang=t=>setLang(t.dataset.l);
MENU_SECTIONS.push({id:'lang',order:15,html:()=>`<div class="sec"><h3>${lng('Dil','Language')}</h3>${langSwitch()}</div>`});
KE.lang=LANG;KE.setLang=l=>setLang(l);KE.lng=lng;KE.tx=tx;
{const hl=document.getElementById('heroLang');if(hl)hl.innerHTML=langSwitch();}
