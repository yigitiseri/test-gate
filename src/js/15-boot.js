/* ---------------- boot ---------------- */
async function boot(){
 resize();addEventListener('resize',resize);
 try{await Promise.race([Promise.all([document.fonts.load('700 20px Cinzel'),document.fonts.load('italic 500 20px "EB Garamond"'),document.fonts.load('700 13px "EB Garamond"')]),new Promise(r=>setTimeout(r,2500))]);}catch(e){}
 await new Promise(r=>setTimeout(r,30));
 buildMap();
 let want3=true;try{want3=localStorage.getItem('ke-3d')!=='0';}catch(e){}
 G3.set(!!want3);
 $('#loading').remove();
 let has=false;try{has=!!localStorage.getItem(SAVE);}catch(e){}
 showStart();
 req();
}
boot();
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')&&document.querySelector('link[rel=manifest]'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
window.__ke={get S(){return S;},PD,endTurn,aiTurn,beginGame,proj:(x,y)=>pj(x,y)};
