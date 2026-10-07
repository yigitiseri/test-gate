/* =====================================================================
   BUILDING ICONS: small ink drawings (manuscript style) for the build tiles in the province panel:
   the four buildings (develop, market, walls, barracks) and the great works. bIcon(k, f) -> '<svg …>'.
   Lines use currentColor (ink); the soft fill uses --bi-fill so a disabled tile simply fades.
   ===================================================================== */
const BI_PATHS={
 dev:'<path d="M3 27h26"/><path d="M5 27V17l5-4 5 4v10"/><path d="M15 27V13l6-5 6 5v14"/><path class="f" d="M5 17l5-4 5 4zM15 13l6-5 6 5z"/><path d="M8 27v-4h4v4M19 27v-5h4v5M19 16h4"/>',
 mkt:'<path d="M4 27h24"/><path d="M6 27V15M26 27V15"/><path class="f" d="M3 15l3-7h20l3 7z"/><path d="M3 15c2 2 4 2 6 0 2 2 4 2 6 0 2 2 4 2 6 0 2 2 4 2 6 0"/><path d="M10 27v-6h12v6M12 21v-2M16 21v-3M20 21v-2"/>',
 fort:'<path d="M5 28h22"/><path class="f" d="M8 28V10h16v18z"/><path d="M8 10V6h3v3h3V6h4v3h3V6h3v4"/><path d="M14 28v-6a2 2 0 0 1 4 0v6"/><path d="M12 14h2M18 14h2"/>',
 brk:'<path d="M3 27h26"/><path class="f" d="M6 27L15 9l9 18z"/><path d="M15 9v18M12 27l3-6 3 6"/><path d="M26 27V5"/><path d="M26 5l-3 3 3 3"/><path d="M5 27V7"/><path class="f" d="M5 7h5l-1.5 2 1.5 2H5z"/>',
 mosque:'<path d="M3 28h26"/><path class="f" d="M9 28V19h14v9z"/><path class="f" d="M9 19a7 7 0 0 1 14 0z"/><path d="M16 12v-2M16 10a1 1 0 0 0 1-1"/><path d="M5 28V12M27 28V12"/><path d="M4 12l1-4 1 4M26 12l1-4 1 4"/><path d="M14 28v-4a2 2 0 0 1 4 0v4"/>',
 church:'<path d="M3 28h26"/><path class="f" d="M7 28V17l6-5 6 5v11z"/><path class="f" d="M19 28V12h7v16z"/><path d="M22.5 12V5M20.5 7h4"/><path d="M11 28v-5a2 2 0 0 1 4 0v5"/><path d="M13 16v-3"/>',
 bedesten:'<path d="M3 28h26"/><path class="f" d="M4 28V18h24v10z"/><path class="f" d="M4 18a4 4 0 0 1 8 0zM12 18a4 4 0 0 1 8 0zM20 18a4 4 0 0 1 8 0z"/><path d="M7 28v-5a1 1 0 0 1 2 0v5M15 28v-5a1 1 0 0 1 2 0v5M23 28v-5a1 1 0 0 1 2 0v5"/>',
 caravan:'<path d="M3 28h26"/><path class="f" d="M6 28V11h20v17z"/><path d="M6 11l2-3h16l2 3"/><path class="f" d="M12 28v-8a4 4 0 0 1 8 0v8z"/><path d="M9 15h2M21 15h2"/>',
 arsenal:'<path d="M2 25c4 2 8 2 14 2s10 0 14-2"/><path class="f" d="M5 21h22l-3 4H8z"/><path d="M16 21V5"/><path class="f" d="M16 6l8 6-8 4z"/><path d="M8 21v-3h4v3"/>',
 citadel:'<path d="M3 28h26"/><path class="f" d="M5 28V15h4v-2h3v2h8v-2h3v2h4v13z"/><path class="f" d="M12 15V8h8v7z"/><path d="M12 8V6h2v2h4V6h2v2"/><path d="M16 6V2"/><path class="f" d="M16 2h4l-1.5 1.5L20 5h-4"/><path d="M14 28v-5a2 2 0 0 1 4 0v5"/>',
 rec1:'<path d="M5 28h22"/><path d="M16 7.5a3 3 0 1 0 0 .1"/><path class="f" d="M12.5 7.5a3.5 3.5 0 0 1 7 0z"/><path class="f" d="M12 28l1-8-2-1 1-7h8l1 7-2 1 1 8z"/><path d="M23 28V4M21.5 6.5L23 3l1.5 3.5"/><path d="M20 15h3"/>',
 rec5:'<path d="M2 28h28"/><path class="f" d="M5 28l.8-6-1.5-.7.7-5h6l.7 5-1.5.7.8 6z"/><path class="f" d="M21 28l.8-6-1.5-.7.7-5h6l.7 5-1.5.7.8 6z"/><path d="M8 13.5a2.2 2.2 0 1 0 0 .1M24 13.5a2.2 2.2 0 1 0 0 .1"/><path class="f" d="M12.5 28l1-7.5-2-1 1-7h7l1 7-2 1 1 7.5z"/><path d="M16 9a2.8 2.8 0 1 0 0 .1"/><path d="M16 6V2M16 2h5l-1.5 1.5L21 5h-5"/>',
 recc:'<path d="M3 28h26"/><path class="f" d="M7 21c1-4 5-6 10-6h5l3-4 2 1-1 4 1 3-2 1-2-2c-1 3-3 4-6 4H11z"/><path d="M9 21l-2 7M12 22l1 6M19 22l-2 6M22 21l3 7"/><path class="f" d="M14 15l1-6h3l1 6z"/><path d="M16.5 9a2 2 0 1 0 0-.1"/><path d="M20 4l-7 13"/><path class="f" d="M19 4l3-1-1 3z"/>',
 reca:'<path d="M3 28h26"/><path class="f" d="M6 18l18-6 1.5 3.5-17 7.5z"/><path d="M24 12l2-.6M24.5 13.5l2.3-.4"/><path class="f" d="M11 25a4.5 4.5 0 1 0 0-.1"/><path d="M11 20.5v9M6.5 25h9M7.8 21.8l6.4 6.4M14.2 21.8l-6.4 6.4"/><path class="f" d="M24 26a2 2 0 1 0 0-.1M28 26a2 2 0 1 0 0-.1M26 22.5a2 2 0 1 0 0-.1"/>',
 grec:'<path d="M4 28h24"/><path class="f" d="M8 28V12h12v16z"/><path d="M8 12V8h2.5v2.5H13V8h2v2.5h2.5V8H20v4"/><path d="M12 28v-4a2 2 0 0 1 4 0v4"/><path d="M25 9v8M21 13h8"/>',
 gdis:'<path d="M4 28h24"/><path class="f" d="M8 28V12h12v16z"/><path d="M8 12V8h2.5v2.5H13V8h2v2.5h2.5V8H20v4"/><path d="M12 28v-4a2 2 0 0 1 4 0v4"/><path d="M21 13h8"/>',
 medrese:'<path d="M4 25c4-2 8-2 12 0 4-2 8-2 12 0"/><path class="f" d="M4 25V9c4-2 8-2 12 0v16c-4-2-8-2-12 0z"/><path class="f" d="M16 25V9c4-2 8-2 12 0v16c-4-2-8-2-12 0z"/><path d="M7 13h6M7 16h6M7 19h5M19 13h6M19 16h6M19 19h5"/>'
};
/** Icon for a building key; faith works follow the realm's faith (mosque or church). */
function bIcon(k,f){if(k==='faith')k=f&&FAC[f]&&FAC[f].rel==='İslam'?'mosque':'church';
 return `<svg class="bi" viewBox="0 0 32 32" aria-hidden="true">${BI_PATHS[k]||BI_PATHS.dev}</svg>`;}
/** One build tile: icon, name, a status line (level or "built") and the cost. */
function bTile({act,attrs='',icon,name,sub='',cost='',done=false,dis=false,tip='',coin=true}){
 return `<button class="btn btile${done?' done':''}${coin?'':' nocoin'}" data-act="${act}" ${attrs} ${dis?'disabled':''}${tip?` title="${esc(tip)}"`:''}>${icon}<span class="bt-nm">${name}</span>${sub?`<span class="bt-sub">${sub}</span>`:''}<span class="bt-c">${done?'✓':cost}</span></button>`;}
