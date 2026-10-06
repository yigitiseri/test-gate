/* ---------------- boot (frozen core; only the orchestrator edits this file) ---------------- */
async function boot(){
 resize();addEventListener('resize',resize);
 try{await Promise.race([Promise.all([document.fonts.load('700 20px Cinzel'),document.fonts.load('italic 500 20px "EB Garamond"'),document.fonts.load('700 13px "EB Garamond"')]),new Promise(r=>setTimeout(r,2500))]);}catch(e){}
 await new Promise(r=>setTimeout(r,30));
 {const t0=performance.now();buildMap();KE.stats.mapMs=Math.round(performance.now()-t0);}
 G3.set(G3.wantOnBoot());
 $('#loading').remove();
 showStart();
 runHooks('boot');
 req();
}
boot();
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')&&document.querySelector('link[rel=manifest]'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
Object.defineProperty(KE,'S',{get(){return S;},enumerable:true});
Object.assign(KE,{PD,W,H,endTurn,aiTurn,beginGame,capture:(i,f)=>capture(i,f),proj:(x,y)=>pj(x,y),battleOdds,hook,runHooks,save,loadGame});
window.__ke=KE;
