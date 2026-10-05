/* =====================================================================
   SAVE SLOTS (Wave 3, package S)
   The autosave stays where it always was: localStorage SAVE ('kizil-elma-1451-v1'), written by save()
   after every move and read by "Kayıtlı oyuna dön / Continue". Manual slots are extra:
     SAVE+'-slot-<n>'  one game per slot, n = 1..SV.n; the state JSON, LZW-packed ('Z1:' prefix) so eight
                       late-game saves fit in Safari's ~5 MB localStorage; a plain JSON value is read too
     SAVE+'-slots'     the slot index {n:{nm,f,turn,at,kb,th}} (name, realm, game turn, real time ms,
                       stored size, thumbnail data URL), so the list never has to unpack a save
   A save file (export / import) is plain JSON {app:'age-of-dynasties',kind:'save',v:1,name,at,state};
   import also accepts a bare state (the autosave value, or a v1 save) and runs it through migrate().
   ===================================================================== */
const SV={n:8,maxName:40,thumbW:96,warned:false};
const svSlotKey=n=>SAVE+'-slot-'+n,svIdxKey=SAVE+'-slots';
let svMode='load',svEdit=0,svMsg=null;

/* ---- LZW over UTF-8 bytes, one 15-bit code per UTF-16 unit (offset 32: never a control or surrogate) ---- */
const SV_MAX=32768;
function svPack(str){const b=new TextEncoder().encode(str);if(!b.length)return 'Z1:';
 const dict=new Map(),out=[];let next=256,w=b[0],s='Z1:';
 for(let i=1;i<b.length;i++){const c=b[i],k=w*256+c,v=dict.get(k);
  if(v!==undefined){w=v;continue;}
  out.push(w+32);if(next<SV_MAX)dict.set(k,next++);else{dict.clear();next=256;}w=c;
  if(out.length>=8192){s+=String.fromCharCode.apply(null,out);out.length=0;}}
 out.push(w+32);return s+String.fromCharCode.apply(null,out);}
function svUnpack(z){if(z.slice(0,3)!=='Z1:')return z;const n=z.length-3;if(!n)return '';
 const pre=new Int32Array(SV_MAX),last=new Uint8Array(SV_MAX),first=new Uint8Array(SV_MAX),len=new Int32Array(SV_MAX);
 for(let i=0;i<256;i++){pre[i]=-1;last[i]=i;first[i]=i;len[i]=1;}
 let out=new Uint8Array(Math.max(1024,n*4)),o=0,next=256,prev=-1;
 const put=c=>{const L=len[c];if(o+L>out.length){const nb=new Uint8Array(Math.max(out.length*2,o+L));nb.set(out);out=nb;}
  for(let k=o+L-1,x=c;k>=o;k--){out[k]=last[x];x=pre[x];}o+=L;};
 for(let i=0;i<n;i++){const c=z.charCodeAt(3+i)-32;
  if(prev<0){put(c);prev=c;continue;}
  if(next>=SV_MAX){next=256;put(c);prev=c;continue;}       // the packer cleared its table after the previous code
  const fc=c<next?first[c]:first[prev];                        // c===next: the KwKwK case
  pre[next]=prev;last[next]=fc;first[next]=first[prev];len[next]=len[prev]+1;next++;
  put(c);prev=c;}
 return new TextDecoder().decode(out.subarray(0,o));}

/* ---- storage ---- */
function svQuota(e){return !!e&&(e.name==='QuotaExceededError'||e.name==='NS_ERROR_DOM_QUOTA_REACHED'||e.code===22||e.code===1014);}
function svErrText(e){return svQuota(e)
 ?lng('Tarayıcının kayıt alanı dolu. Eski bir kaydı sil ya da dosyaya aktar, sonra yeniden dene.','The browser\'s storage is full. Delete an old save or export it to a file, then try again.')
 :lng('Bu tarayıcı kayıt yapılmasına izin vermiyor (gizli pencere olabilir). Oyunu dosyaya aktararak saklayabilirsin.','This browser does not allow saving (it may be a private window). You can keep the game by exporting it to a file.');}
/** Autosave failed (called from save()): warn once per page load, never every move. */
function svAutoFail(e){if(SV.warned)return;SV.warned=true;
 toast(svQuota(e)?lng('Otomatik kayıt yapılamadı: kayıt alanı dolu. Menü → Oyun yükle bölümünden eski bir kaydı sil.','Autosave failed: storage is full. Delete an old save under Menu → Load game.'):svErrText(e),'war');}
function svIndex(){try{const o=JSON.parse(localStorage.getItem(svIdxKey)||'{}');return o&&typeof o==='object'?o:{};}catch(e){return {};}}
function svSetIndex(ix){localStorage.setItem(svIdxKey,JSON.stringify(ix));}
/** Slot list [{n, empty} | {n, nm, f, turn, at, kb, th}]; a slot whose index entry is lost is re-read once. */
function svSlots(){const ix=svIndex(),out=[];let fix=false;
 for(let n=1;n<=SV.n;n++){let raw=null;try{raw=localStorage.getItem(svSlotKey(n));}catch(e){}
  if(!raw){if(ix[n]){delete ix[n];fix=true;}out.push({n,empty:true});continue;}
  if(!ix[n]){try{const s=JSON.parse(svUnpack(raw));ix[n]={nm:lng('Kayıt ','Save ')+n,f:s.player,turn:s.turn|0,at:0,kb:Math.ceil(raw.length*2/1024),th:''};}catch(e){ix[n]={nm:lng('Bozuk kayıt','Damaged save'),bad:1};}fix=true;}
  out.push({n,...ix[n]});}
 if(fix)try{svSetIndex(ix);}catch(e){}
 return out;}
/** Realm, turn and size of the autosave, or null (cached on the raw length + head). */
let svAutoC={k:'',m:null};
function svAutoMeta(){let raw=null;try{raw=localStorage.getItem(SAVE);}catch(e){}if(!raw)return null;
 const k=raw.length+':'+raw.slice(-64);if(svAutoC.k===k)return svAutoC.m;let m=null;
 try{const s=JSON.parse(raw);if(s&&s.player&&FAC[s.player])m={f:s.player,turn:s.turn|0,kb:Math.ceil(raw.length/1024),th:Array.isArray(s.prov)&&s.prov.length===NP?svThumb(s):""};}catch(e){}
 svAutoC={k,m};return m;}

/* ---- thumbnail: the political map sampled from the province id map, PNG data URL (~2-4 KB) ---- */
function svThumb(s){try{const tw=SV.thumbW,th=Math.round(tw*H/W),c=document.createElement('canvas');c.width=tw;c.height=th;
 const g=c.getContext('2d'),im=g.createImageData(tw,th),d=im.data,col={};
 const rgb=h=>col[h]||(col[h]=[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);
 const sea=[120,152,160],nil=[196,180,140],pl=s.player;
 for(let y=0;y<th;y++)for(let x=0;x<tw;x++){const id=idMap[Math.floor((y+.5)*H/th)*W+Math.floor((x+.5)*W/tw)];
  let c3=id===-1?sea:nil;if(id>=0){const p=s.prov[id],F=p&&FAC[p.o];if(F&&/^#[0-9a-f]{6}$/i.test(F.c))c3=rgb(F.c);}
  const k=(y*tw+x)*4;d[k]=c3[0];d[k+1]=c3[1];d[k+2]=c3[2];d[k+3]=255;
  if(id>=0&&s.prov[id]&&s.prov[id].o!==pl){d[k]=d[k]*.82+30;d[k+1]=d[k+1]*.82+26;d[k+2]=d[k+2]*.82+20;}}   // the player's land stands out
 g.putImageData(im,0,0);return c.toDataURL('image/png');}catch(e){return '';}}

/* ---- save / load / rename / delete ---- */
function svDefName(s){return `${FAC[s.player].s} · ${dateStr(s.turn)}`;}
/** Store the running game in slot n. Returns null on success, or the error text. */
function svSave(n,name){if(!S||!S.player)return lng('Kaydedilecek oyun yok.','There is no game to save.');
 const ix=svIndex(),old=ix[n],raw=JSON.stringify(S),z=svPack(raw);
 const nm=String(name||(old&&!old.bad?old.nm:'')||svDefName(S)).trim().slice(0,SV.maxName)||svDefName(S);
 const meta={nm,f:S.player,turn:S.turn,at:Date.now(),kb:Math.ceil(z.length*2/1024),th:svThumb(S)};
 let prevRaw=null;try{prevRaw=localStorage.getItem(svSlotKey(n));}catch(e){}
 try{localStorage.setItem(svSlotKey(n),z);ix[n]=meta;svSetIndex(ix);}
 catch(e){// roll back so the index never points at a half-written slot
  try{if(prevRaw!=null)localStorage.setItem(svSlotKey(n),prevRaw);else localStorage.removeItem(svSlotKey(n));}catch(e2){}
  return svErrText(e);}
 return null;}
/** Parse a save from text: a save file, a bare state or a packed slot. Throws a player-facing message. */
function svParse(text){let o;try{o=JSON.parse(svUnpack(String(text||'').trim()));}catch(e){throw lng('Bu dosya bir kayıt dosyası değil.','This file is not a save file.');}
 const s=o&&o.kind==='save'&&o.state?o.state:o;
 if(!s||!Array.isArray(s.prov)||!s.fac||!s.player)throw lng('Bu dosya bir kayıt dosyası değil.','This file is not a save file.');
 if(s.prov.length!==NP||!FAC[s.player])throw lng('Bu kayıt bu oyunun başka bir sürümünden; açılamıyor.','This save comes from another version of the game and cannot be opened.');
 return s;}
/** Put a parsed state on the board: migrate, reset the UI, enter the game. The autosave follows on the next renderAll. */
function svApply(s){
 if(typeof busy!=='undefined'&&busy)throw lng('Tur hesaplanırken yüklenemez.','Cannot load while the turn is being played.');
 modalQ.length=0;closeModal();sel=-1;tgt=-1;selArmy=null;confirmKey='';$('#panel').hidden=true;
 if(S&&S.player)newGame(null);                       // in-game: reset like the start screen does before a load
 S=migrate(s);pruneOffers();$('#start').hidden=true;enterGame();}
function svLoad(n){let raw=null;try{raw=localStorage.getItem(svSlotKey(n));}catch(e){}
 if(!raw)throw lng('Bu yuva boş.','This slot is empty.');svApply(svParse(raw));}
function svDelete(n){try{localStorage.removeItem(svSlotKey(n));const ix=svIndex();delete ix[n];svSetIndex(ix);}catch(e){}}
function svRename(n,name){const ix=svIndex();if(!ix[n])return;ix[n].nm=String(name||'').trim().slice(0,SV.maxName)||ix[n].nm;try{svSetIndex(ix);}catch(e){return svErrText(e);}return null;}

/* ---- export / import ---- */
function svFileText(s,name){return JSON.stringify({app:'age-of-dynasties',kind:'save',v:1,name:name||svDefName(s),at:new Date().toISOString(),player:s.player,turn:s.turn,state:s});}
function svFileName(s){return `age-of-dynasties-${String(s.player).toLowerCase()}-${START_YEAR+Math.floor(s.turn/4)}-t${s.turn}.json`;}
/** Hand a save file to the player: the share sheet on touch devices that can share files (iOS: "Save to Files"),
    otherwise a download link. Runs synchronously inside the tap, which iOS requires for both. */
/* Inside the claude.ai viewer, plain downloads are blocked: the viewer's `downloads` capability asks the player and saves. */
let svDlNs=null;
try{if(window.claude&&typeof window.claude.use==='function')window.claude.use('downloads').then(ns=>{svDlNs=ns;},()=>{});}catch(e){}
function svDownload(s,name){const txt=svFileText(s,name),fn=svFileName(s),blob=new Blob([txt],{type:'application/json'});
 if(svDlNs){svDlNs.save({filename:fn,data:blob}).then(()=>toast(lng('Kayıt dosyası indirildi.','Save file downloaded.'))).catch(e=>{
   if(e&&e.code==='declined')return;toast(lng('Kayıt dosyası burada indirilemiyor.','The save file cannot be downloaded here.'),'war');});return;}
 const dl=()=>{const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=fn;a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(u);a.remove();},8000);toast(lng('Kayıt dosyası indirildi.','Save file downloaded.'));};
 try{const file=typeof File==='function'?new File([blob],fn,{type:'application/json'}):null;
  if(file&&navigator.canShare&&matchMedia('(pointer:coarse)').matches&&navigator.canShare({files:[file]})){
   navigator.share({files:[file],title:fn}).catch(e=>{if(!e||e.name!=='AbortError')dl();});return;}}catch(e){}
 dl();}
function svExportSlot(n){let raw=null;try{raw=localStorage.getItem(svSlotKey(n));}catch(e){}if(!raw)return;
 try{const s=JSON.parse(svUnpack(raw)),ix=svIndex();svDownload(s,ix[n]&&ix[n].nm);}catch(e){toast(lng('Bu kayıt okunamadı.','This save could not be read.'),'war');}}
function svImportText(text){const s=svParse(text);svApply(s);toast(lng(`Kayıt yüklendi: ${FAC[s.player].n}, ${dateStr(s.turn)}.`,`Save loaded: ${FAC[s.player].n}, ${dateStr(s.turn)}.`));}
function svImportFile(file){if(!file)return;if(file.size>8*1024*1024){svFail(lng('Bu dosya bir kayıt dosyası olamayacak kadar büyük.','This file is too large to be a save file.'));return;}
 const rd=new FileReader();rd.onload=()=>{try{svImportText(rd.result);}catch(e){svFail(typeof e==='string'?e:lng('Bu dosya bir kayıt dosyası değil.','This file is not a save file.'));}};
 rd.onerror=()=>svFail(lng('Dosya okunamadı.','The file could not be read.'));rd.readAsText(file);}
function svFail(m){svMsg={k:'war',m};toast(m,'war');if(!$('#modal').hidden&&$('#modal .sv'))svShow(svMode,true);}

/* ---- the Saves modal: "Oyunu kaydet / Save game" and "Oyun yükle / Load game" ---- */
function svWhen(at){if(!at)return '';try{return new Date(at).toLocaleString(EN?'en-GB':'tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){return '';}}
function svPic(x){const f=x.f&&FAC[x.f]?x.f:null;return `<div class="sv-pic">${x.th?`<img src="${x.th}" alt="" width="96" height="${Math.round(96*H/W)}">`:'<i></i>'}${f?shield(f):''}</div>`;}
function svRow(x,ingame){const n=x.n,ck=k=>confirmKey===`sv${k}:${n}`;
 if(x.empty)return svMode==='save'?`<div class="sv-row empty"><div class="sv-pic"><i></i></div><div class="sv-tx"><b>${lng('Boş yuva','Empty slot')} ${n}</b><small>${lng('Bu oyunu buraya kaydedebilirsin.','You can save this game here.')}</small></div>
  <div class="sv-ra"><button class="btn primary" data-act="sv-save" data-n="${n}">${lng('Buraya kaydet','Save here')}</button></div></div>`:'';
 if(svEdit===n)return `<div class="sv-row">${svPic(x)}<div class="sv-tx"><label class="sv-lab" for="svName">${lng('Kaydın adı','Name of the save')}</label><input id="svName" maxlength="${SV.maxName}" value="${esc(x.nm||'')}" autocomplete="off" enterkeyhint="done"></div>
  <div class="sv-ra"><button class="btn primary" data-act="sv-ren-ok" data-n="${n}">${lng('Tamam','OK')}</button><button class="btn" data-act="sv-ren-x">${lng('Vazgeç','Cancel')}</button></div></div>`;
 const sub=x.bad?lng('Bu kayıt okunamıyor.','This save cannot be read.'):`${x.f&&FAC[x.f]?esc(FAC[x.f].n)+' · ':''}${dateStr(x.turn||0)}${x.at?' · '+svWhen(x.at):''}`;
 const main=svMode==='save'
  ?`<button class="btn primary" data-act="sv-save" data-n="${n}">${ck('o')?lng('Emin misin? Üzerine yaz','Sure? Overwrite'):lng('Buraya kaydet','Save here')}</button>`
  :`<button class="btn primary" data-act="sv-load" data-n="${n}" ${x.bad?'disabled':''}>${ingame&&ck('l')?lng('Emin misin? Yükle','Sure? Load'):lng('Yükle','Load')}</button>`;
 return `<div class="sv-row" data-n="${n}">${svPic(x)}<div class="sv-tx"><b>${esc(x.nm||'')}</b><small>${sub}</small></div>
  <div class="sv-ra">${main}<button class="btn" data-act="sv-ren" data-n="${n}">${lng('Adlandır','Rename')}</button><button class="btn" data-act="sv-exp" data-n="${n}" ${x.bad?'disabled':''}>${lng('Dışa aktar','Export')}</button><button class="btn danger" data-act="sv-del" data-n="${n}">${ck('d')?lng('Emin misin? Sil','Sure? Delete'):lng('Sil','Delete')}</button></div></div>`;}
function svShow(mode,keep){svMode=mode==='save'?'save':'load';const ingame=!!(S&&S.player&&$('#start').hidden);if(!ingame)svMode='load';
 const card=$('#modal .card'),top=keep&&card?card.scrollTop:0;if(!keep){svEdit=0;svMsg=null;}
 const sl=svSlots(),used=sl.filter(x=>!x.empty).length,auto=!ingame&&svAutoMeta();
 const list=sl.map(x=>svRow(x,ingame)).join('');
 openModal(`<div class="sv"><div class="eyebrow">${lng('Kayıtlar','Saves')} · ${used}/${SV.n}</div><h2>${svMode==='save'?lng('Oyunu kaydet','Save game'):lng('Oyun yükle','Load game')}</h2>
 ${ingame?`<div class="sv-tabs" role="tablist"><button class="btn ${svMode==='save'?'on':''}" role="tab" aria-selected="${svMode==='save'}" data-act="sv-tab" data-m="save">${lng('Kaydet','Save')}</button><button class="btn ${svMode==='load'?'on':''}" role="tab" aria-selected="${svMode==='load'}" data-act="sv-tab" data-m="load">${lng('Yükle','Load')}</button></div>`:''}
 <p class="hint">${svMode==='save'
  ?lng('Oyun her hamleden sonra kendiliğinden kaydedilir (<b>Kayıtlı oyuna dön</b>). Buradaki yuvalar ek kayıtlardır: önemli bir andan önce kaydet, istersen sonra o ana dön.','The game saves itself after every move (<b>Continue</b>). These slots are extra saves: save before an important moment and come back to it later if you like.')
  :lng('Bir kayıt yüklemek, otomatik kaydı (<b>Kayıtlı oyuna dön</b>) o oyunla değiştirir. Süren oyunu saklamak istersen önce bir yuvaya kaydet.','Loading a save replaces the autosave (<b>Continue</b>) with that game. To keep the game in progress, save it to a slot first.')}</p>
 ${svMsg?`<p class="sv-msg ${svMsg.k}" role="alert">${esc(svMsg.m)}</p>`:''}
 <div class="sv-list">${auto?`<div class="sv-row auto">${svPic(auto)}<div class="sv-tx"><b>${lng('Otomatik kayıt','Autosave')}</b><small>${esc(FAC[auto.f].n)} · ${dateStr(auto.turn)}</small></div><div class="sv-ra"><button class="btn primary" data-act="continue">${lng('Kayıtlı oyuna dön','Continue saved game')}</button><button class="btn" data-act="sv-exp-auto">${lng('Dışa aktar','Export')}</button></div></div>`:''}
 ${list||(auto?'':`<p class="hint sv-none">${lng('Henüz kayıt yok. Bir oyun dosyan varsa aşağıdan içe aktarabilirsin.','No saves yet. If you have a save file, you can import it below.')}</p>`)}</div>
 <div class="sv-file"><label class="btn" for="svFile">${lng('Dosyadan içe aktar','Import from a file')}</label><input type="file" id="svFile" class="sv-in" accept=".json,application/json,text/plain">
 ${ingame?`<button class="btn" data-act="sv-exp-cur">${lng('Bu oyunu dosyaya aktar','Export this game to a file')}</button>`:''}</div>
 <p class="hint">${lng('Kayıtlar bu tarayıcıda durur. Telefonu değiştirirken ya da yedek almak için oyunu dosyaya aktar.','Saves live in this browser. To move to another device or to keep a backup, export the game to a file.')}</p>
 <div class="foot">${ingame?`<button class="btn" data-act="menu">${lng('Menü','Menu')}</button>`:''}<button class="btn primary" data-act="mclose">${lng('Kapat','Close')}</button></div></div>`);
 if(keep&&card)card.scrollTop=top;
 const fi=$('#svFile');if(fi)fi.addEventListener('change',()=>{const f=fi.files&&fi.files[0];fi.value='';svImportFile(f);});
 const nm=$('#svName');if(nm){nm.focus();nm.select();nm.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ACTS['sv-ren-ok']({dataset:{n:svEdit}});}});}}

ACTS['sv-open']=t=>svShow(t.dataset.m||'load');
ACTS['sv-tab']=t=>{confirmKey='';svEdit=0;svMsg=null;svShow(t.dataset.m,true);};
ACTS['sv-save']=t=>{const n=+t.dataset.n,ix=svIndex(),ck='svo:'+n;
 if(ix[n]&&confirmKey!==ck){confirmKey=ck;svShow('save',true);return;}confirmKey='';
 const err=svSave(n);if(err){svMsg={k:'war',m:err};toast(err,'war');}else{svMsg={k:'ok',m:lng(`Yuva ${n}: kaydedildi.`,`Slot ${n}: saved.`)};SND.play('coin');}
 svShow('save',true);};
ACTS['sv-load']=t=>{const n=+t.dataset.n,ck='svl:'+n,ingame=!!(S&&S.player&&$('#start').hidden);
 if(ingame&&confirmKey!==ck){confirmKey=ck;svShow('load',true);return;}confirmKey='';
 try{svLoad(n);const x=svIndex()[n];toast(lng(`Yüklendi: ${x?x.nm:n}`,`Loaded: ${x?x.nm:n}`));}catch(e){svFail(typeof e==='string'?e:lng('Bu kayıt okunamadı.','This save could not be read.'));}};
ACTS['sv-del']=t=>{const n=+t.dataset.n,ck='svd:'+n;if(confirmKey!==ck){confirmKey=ck;svShow(svMode,true);return;}confirmKey='';
 svDelete(n);svMsg={k:'ok',m:lng(`Yuva ${n} silindi.`,`Slot ${n} deleted.`)};svShow(svMode,true);};
ACTS['sv-ren']=t=>{confirmKey='';svEdit=+t.dataset.n;svShow(svMode,true);};
ACTS['sv-ren-x']=()=>{svEdit=0;svShow(svMode,true);};
ACTS['sv-ren-ok']=t=>{const n=+t.dataset.n,i=$('#svName');const err=svRename(n,i?i.value:'');svEdit=0;svMsg=err?{k:'war',m:err}:null;svShow(svMode,true);};
ACTS['sv-exp']=t=>svExportSlot(+t.dataset.n);
ACTS['sv-exp-cur']=()=>{if(S&&S.player)svDownload(S);};
ACTS['sv-exp-auto']=()=>{let raw=null;try{raw=localStorage.getItem(SAVE);}catch(e){}if(!raw)return;try{svDownload(JSON.parse(raw));}catch(e){toast(lng('Bu kayıt okunamadı.','This save could not be read.'),'war');}};
for(const a of ['sv-tab','sv-ren','sv-ren-x'])QUIET.add(a);

KE.sv={key:svSlotKey,idx:svIdxKey,n:SV.n,slots:()=>svSlots(),save:(n,nm)=>svSave(n,nm),load:n=>svLoad(n),del:n=>svDelete(n),rename:(n,nm)=>svRename(n,nm),
 pack:s=>svPack(s),unpack:z=>svUnpack(z),fileText:()=>svFileText(S),importText:t=>svImportText(t),show:m=>svShow(m),parse:t=>svParse(t)};
