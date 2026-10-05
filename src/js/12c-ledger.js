/* =====================================================================
   LEDGER ("Defter"): statistics over time, realm ranking, war history (Wave 3, track L)
   Schema (optional field, created by hook newGame and hook migrate):
   S.lg={r:{[f]:{t,s,d,x?}},w:[...]}
    r[f]  history of realm f: t = turn of its first sample, s = turns between samples, d = flat samples,
          LG_K whole numbers each (provinces, income per turn, troops/100, manpower/100, score),
          x = turn the realm fell (absent while it lives). The player is sampled every turn, other realms
          every BAL_L.strideAi turns (staggered so no turn pays for all of them). When a history grows past
          its cap every second sample is dropped and the stride doubles, so the save stays small for ever.
    w     wars [{a,b,s,e?,r?,q?,p?,g?,wa,wb}]: a attacker, b defender, s / e first / last turn,
          r result 'a' | 'b' (that side gained), 'w' (peace without gains), 'x' (q was destroyed), 'z' (ended
          otherwise); p provinces and g gold that changed hands; wa / wb battles won by a / b.
   Recording runs on hooks (afterRound 85, warDeclared 95, peace, battleResolved, eliminate), never in the UI.
   ===================================================================== */
const BAL_L={capPl:160,capAi:32,strideAi:4,warsKeep:90};
const LG_K=5;
const LG_COL=['#a3241a','#2c5f9e','#a8740a','#7a4aa8','#3f8a4e']; // vermilion, lapis, ochre, violet, verdigris (validated on the parchment)
const LG_MET=[
 {id:'score',k:4,l:lng('Puan','Score'),d:lng('Toprak, gelişim, hazine ve görevlerden gelen genel puan.','The overall score from land, development, treasury and goals.')},
 {id:'prov',k:0,l:lng('Eyalet','Provinces'),d:lng('Elde tutulan eyalet sayısı.','Number of provinces held.')},
 {id:'inc',k:1,l:lng('Gelir','Income'),d:lng('Tur başına gelir (altın), giderler düşülmeden.','Income per turn in gold, before expenses.')},
 {id:'army',k:2,l:lng('Asker','Troops'),m:100,d:lng('Sahra orduları ve garnizonlardaki toplam asker.','All troops in field armies and garrisons.')},
 {id:'mp',k:3,l:lng('İnsan gücü','Manpower'),m:100,d:lng('Asker yazılabilecek insan gücü.','Manpower available for recruiting.')}];
let lgMetric='score',lgRiv=null,lgSort='score',lgAll=false,lgHover=null;
const lgSlot={}; // realm -> colour slot 1..4 while it is on the chart (colour follows the realm, never its rank)

/* ---------------- recording ---------------- */
function lgNew(){return {r:{},w:[]};}
function lgSample(f){return [facProvs(f).length,Math.round(income(f)),Math.round(strength(f)/100),Math.round(S.fac[f].mp/100),score(f)];}
/** Record this turn's samples for every realm that is due. Cheap: about a quarter of the realms per turn. */
function lgRecord(){const L=S&&S.lg;if(!L||!S.player)return;const T=S.turn;
 FK.forEach((f,k)=>{if(!alive(f))return;const pl=f===S.player;let r=L.r[f];
  if(!r){if(!pl&&(T+k)%BAL_L.strideAi)return;r=L.r[f]={t:T,s:pl?1:BAL_L.strideAi,d:[]};}
  if(r.x!=null)delete r.x; // a realm that rises again keeps its old line
  if(T<r.t||(T-r.t)%r.s)return;const n=r.d.length/LG_K;if(n&&r.t+(n-1)*r.s>=T)return;
  for(const v of lgSample(f))r.d.push(v);
  if(r.d.length/LG_K>(pl?BAL_L.capPl:BAL_L.capAi)){const o=[];for(let i=0;i<r.d.length;i+=2*LG_K)for(let j=0;j<LG_K;j++)o.push(r.d[i+j]);r.d=o;r.s*=2;}});}
function lgWarOpen(a,b){const W=S.lg.w;for(let i=W.length-1;i>=0;i--){const w=W[i];if(w.e==null&&((w.a===a&&w.b===b)||(w.a===b&&w.b===a)))return w;}return null;}
function lgWarAdd(a,b,t){if(lgWarOpen(a,b))return;S.lg.w.push({a,b,s:t,wa:0,wb:0});lgPrune();}
/** Keep every war of the player; of the others only the newest BAL_L.warsKeep finished ones. */
function lgPrune(){const W=S.lg.w,pl=S.player;let n=0;for(const w of W)if(w.e!=null&&w.a!==pl&&w.b!==pl)n++;
 for(let i=0;i<W.length&&n>BAL_L.warsKeep;i++){const w=W[i];if(w.e!=null&&w.a!==pl&&w.b!==pl){W.splice(i--,1);n--;}}}
/** Bring the war list in line with S.war: wars started or ended by any code path are caught here. */
function lgWarSync(s){const L=s.lg;for(const k in s.war){const [x,y]=k.split('|'),w=s.war[k],a=Object.keys(w.sc||{})[0]||x,b=a===x?y:x;
  if(!L.w.some(v=>v.e==null&&((v.a===a&&v.b===b)||(v.a===b&&v.b===a))))L.w.push({a,b,s:w.t||0,wa:0,wb:0});}
 for(const v of L.w)if(v.e==null&&!s.war[key(v.a,v.b)]){v.e=s.turn;v.r=v.r||'z';}}
hook('newGame',(s,pl)=>{s.lg=lgNew();lgWarSync(s);if(pl)lgRecord();},95);
hook('migrate',s=>{if(!s.lg||typeof s.lg!=='object'||!s.lg.r||!Array.isArray(s.lg.w)){s.lg=lgNew();lgWarSync(s);}},95);
hook('afterRound',()=>{if(!S.lg)return;lgWarSync(S);lgPrune();lgRecord();},85);
hook('warDeclared',(a,b)=>{if(S.lg&&S.war[key(a,b)])lgWarAdd(a,b,S.turn);},95);
hook('peace',(a,b,t)=>{if(!S.lg)return;const w=lgWarOpen(a,b);if(!w)return;w.e=S.turn;t=t||{};
 const p=(t.prov||[]).length,g=Math.round(t.gold||0),rel=(t.release||[]).length;
 w.r=t.white||(!p&&!g&&!rel)?'w':(t.taker===w.a?'a':'b');if(p)w.p=p;if(g)w.g=g;});
hook('eliminate',(f,by)=>{if(!S.lg)return;const r=S.lg.r[f];if(r)r.x=S.turn;
 for(const w of S.lg.w)if(w.e==null&&(w.a===f||w.b===f)){w.e=S.turn;w.r='x';w.q=f;}});
hook('battleResolved',rep=>{if(!S.lg||!rep||!rep.att)return;const w=lgWarOpen(rep.att,rep.def);if(!w)return;
 if(!!rep.win===(rep.att===w.a))w.wa++;else w.wb++;});

/* ---------------- reading ---------------- */
/** [[turn,value]…] of metric m (an LG_MET entry) for realm f, plus today's value and the fall to zero. */
function lgSeries(f,m){const r=S.lg&&S.lg.r[f],o=[],mul=m.m||1;
 if(r)for(let i=0;i*LG_K<r.d.length;i++)o.push([r.t+i*r.s,r.d[i*LG_K+m.k]*mul]);
 if(alive(f)){const T=S.turn,v=m.k===4?score(f):m.k===0?facProvs(f).length:m.k===1?Math.round(income(f)):m.k===2?strength(f):S.fac[f].mp;
  if(o.length&&o[o.length-1][0]>=T)o[o.length-1]=[T,v];else o.push([T,v]);} // today's point is always live
 else if(r&&r.x!=null&&(!o.length||o[o.length-1][0]<r.x))o.push([r.x,0]);
 return o;}
/** Value of a series at turn T: the last sample at or before T (null before the first one). */
function lgAt(ser,T){let v=null;for(const p of ser){if(p[0]>T)break;v=p;}return v;}
const lgYear=t=>START_YEAR+Math.floor(t/4);
function lgFmt(v,m){if(v==null)return '–';return m&&m.m?(v<1000?String(Math.round(v)):fmtK(v)):String(Math.round(v));}
function lgNice(mx){if(mx<=0)return {top:4,step:1};const raw=mx/4,p=Math.pow(10,Math.floor(Math.log10(raw))),n=raw/p,st=(n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p;return {top:Math.ceil(mx/st)*st,step:st};}
/** Realms on the chart: the player first, then the chosen rivals (default: the three highest scores). */
function lgShown(){const pl=S.player;
 if(!lgRiv)lgRiv=FK.filter(f=>f!==pl&&alive(f)).sort((a,b)=>score(b)-score(a)).slice(0,3);
 lgRiv=lgRiv.filter(f=>f!==pl&&S.fac[f]&&(alive(f)||(S.lg&&S.lg.r[f])));
 const used=new Set(lgRiv.map(f=>lgSlot[f]).filter(Boolean));
 for(const f of lgRiv)if(!lgSlot[f]){let k=1;while(used.has(k))k++;lgSlot[f]=k;used.add(k);}
 for(const f in lgSlot)if(!lgRiv.includes(f))delete lgSlot[f];
 return [pl,...lgRiv];}
const lgSl=f=>f===S.player?0:lgSlot[f]||1;
/** A small marker shape per colour slot (secondary encoding next to the colour). */
function lgMark(k,x,y,r,col,ring){const st=ring?` stroke="${ring}" stroke-width="2"`:'';
 if(k===1)return `<rect x="${x-r}" y="${y-r}" width="${2*r}" height="${2*r}" rx="1" fill="${col}"${st}/>`;
 if(k===2)return `<path d="M${x} ${y-r*1.3}L${x+r*1.3} ${y}L${x} ${y+r*1.3}L${x-r*1.3} ${y}Z" fill="${col}"${st}/>`;
 if(k===3)return `<path d="M${x} ${y-r*1.3}L${x+r*1.25} ${y+r}L${x-r*1.25} ${y+r}Z" fill="${col}"${st}/>`;
 if(k===4)return `<path d="M${x} ${y+r*1.3}L${x+r*1.25} ${y-r}L${x-r*1.25} ${y-r}Z" fill="${col}"${st}/>`;
 return `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"${st}/>`;}
const lgKey=f=>{const k=lgSl(f);return `<svg class="lg-key" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6H21" stroke="${LG_COL[k]}" stroke-width="2" stroke-linecap="round"/>${lgMark(k,11,6,3.5,LG_COL[k])}</svg>`;};

/* ---------------- chart ---------------- */
let lgGeo=null; // geometry of the drawn chart, for the touch / mouse readout
function lgChart(){const box=$('#lgChart');if(!box)return;const m=LG_MET.find(x=>x.id===lgMetric)||LG_MET[0],fs=lgShown();
 const W=Math.max(260,Math.round(box.clientWidth||320)),H=W<480?210:250,ml=W<480?36:44,mr=12,mt=10,mb=24,pw=W-ml-mr,ph=H-mt-mb;
 const ser=fs.map(f=>({f,k:lgSl(f),p:lgSeries(f,m)}));
 const t1=Math.max(8,S.turn),mx=Math.max(1,...ser.map(s=>Math.max(0,...s.p.map(p=>p[1])))),ny=lgNice(mx);
 const X=t=>ml+t/t1*pw,Y=v=>mt+ph-v/ny.top*ph;
 let g='';
 for(let v=0;v<=ny.top+1e-9;v+=ny.step){const y=Y(v).toFixed(1);g+=`<line class="grid" x1="${ml}" x2="${ml+pw}" y1="${y}" y2="${y}"/><text class="yl" x="${ml-6}" y="${(+y+4).toFixed(1)}">${lgFmt(v,m)}</text>`;}
 const yrs=t1/4,ys=[1,2,5,10,20,40].find(s=>yrs/s<=(W<480?4:7))||40;
 for(let y=START_YEAR-START_YEAR%ys+(START_YEAR%ys?ys:0);4*(y-START_YEAR)<=t1;y+=ys){const x=X(4*(y-START_YEAR)).toFixed(1);g+=`<text class="xl" x="${x}" y="${H-6}">${y}</text>`;}
 g+=`<text class="xl" x="${ml}" y="${H-6}" text-anchor="start">${START_YEAR}</text>`;
 let lines='',ends='';
 for(const s of ser.slice().reverse()){if(!s.p.length)continue;const col=LG_COL[s.k];
  lines+=`<path class="ln${s.f===S.player?' me':''}" d="${s.p.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join('')}" stroke="${col}"/>`;
  const e=s.p[s.p.length-1];ends+=lgMark(s.k,X(e[0]),Y(e[1]),4,col,'#f3e7c6');}
 lgGeo={ml,mt,pw,ph,t1,X,Y,m,ser,W,H};
 box.innerHTML=`<svg class="lg-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" tabindex="0" role="img" aria-label="${esc(m.l)}: ${esc(fs.map(f=>FAC[f].s).join(', '))}">
  ${g}<line class="axis" x1="${ml}" x2="${ml+pw}" y1="${mt+ph}" y2="${mt+ph}"/>${lines}${ends}<g class="hov"></g>
  <rect class="hit" x="${ml-8}" y="0" width="${pw+16}" height="${H}" fill="transparent"/></svg><div class="lg-tip${W<480?' nar':''}" aria-live="polite"${W<480?'':' hidden'}>${W<480?lgTipIdle():''}</div>`;
 const sv=box.querySelector('svg');
 const at=e=>{const r=sv.getBoundingClientRect();return Math.round(clamp((e.clientX-r.left)*W/r.width-ml,0,pw)/pw*t1);};
 sv.addEventListener('pointerdown',e=>{lgShow(at(e));});
 sv.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons||e.pressure>0)lgShow(at(e));});
 sv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')lgShow(null);});
 sv.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();e.stopPropagation();
  const st=Math.max(1,Math.round(t1/40));lgShow(clamp((lgHover==null?S.turn:lgHover)+(e.key==='ArrowLeft'?-st:st),0,t1));});
 sv.addEventListener('blur',()=>lgShow(null));
 if(lgHover!=null)lgShow(Math.min(lgHover,t1));}
/** Show the crosshair and the readout at turn T (null hides them). */
function lgShow(T){const G=lgGeo,box=$('#lgChart');if(!G||!box)return;const hv=box.querySelector('.hov'),tip=box.querySelector('.lg-tip');if(!hv||!tip)return;
 const nar=tip.classList.contains('nar');lgHover=T;if(T==null){hv.innerHTML='';if(nar)tip.innerHTML=lgTipIdle();else tip.hidden=true;return;}
 // snap to the nearest sample of the player's (densest) line
 const mine=G.ser[0].p;let best=T,bd=1e9;for(const p of mine){const d=Math.abs(p[0]-T);if(d<bd){bd=d;best=p[0];}}if(bd<=4)T=best;
 const x=G.X(T);let h=`<line class="cross" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${G.mt}" y2="${G.mt+G.ph}"/>`;const rows=[];
 for(const s of G.ser){const v=lgAt(s.p,T);if(!v)continue;h+=lgMark(s.k,G.X(v[0]),G.Y(v[1]),4.5,LG_COL[s.k],'#f3e7c6');rows.push({f:s.f,v:v[1]});}
 hv.innerHTML=h;rows.sort((a,b)=>b.v-a.v);
 tip.innerHTML=`<div class="d">${esc(dateStr(T))}</div>${rows.map(r=>`<div class="r">${lgKey(r.f)}<b>${lgFmt(r.v,G.m)}</b><span>${esc(FAC[r.f].s)}</span></div>`).join('')||`<div class="r">${lng('Kayıt yok','No record')}</div>`}`;
 if(nar)return;tip.hidden=false;const bw=box.clientWidth,sc=bw/G.W,tw=tip.offsetWidth,px=x*sc;
 tip.style.left=Math.round(px+12+tw>bw?Math.max(0,px-12-tw):px+12)+'px';tip.style.top='4px';}
const lgTipIdle=()=>`<div class="d">${lng('Bir tarihteki değerleri okumak için grafiğe dokun.','Touch the chart to read the values at a date.')}</div>`;
function lgLegend(){const m=LG_MET.find(x=>x.id===lgMetric)||LG_MET[0];
 return lgShown().map(f=>{const s=lgSeries(f,m),v=s.length?s[s.length-1][1]:null;
  return `<span class="lg-leg${f===S.player?' me':''}">${lgKey(f)}${shield(f)}<span class="nm">${esc(FAC[f].s)}</span><b>${alive(f)?lgFmt(v,m):lng('yıkıldı','fallen')}</b>${f!==S.player?`<button class="x" data-act="lg-riv" data-f="${f}" aria-label="${esc(lng(`${FAC[f].s} grafikten çıkar`,`Remove ${FAC[f].s} from the chart`))}">×</button>`:''}</span>`;}).join('');}
function lgPicker(){const pl=S.player,sh=new Set(lgShown());
 const cand=[...new Set([...FK.filter(f=>f!==pl&&alive(f)&&atWar(pl,f)),...FK.filter(f=>f!==pl&&alive(f)).sort((a,b)=>score(b)-score(a)).slice(0,10)])].filter(f=>!sh.has(f));
 return cand.map(f=>`<button class="lg-add" data-act="lg-riv" data-f="${f}">${shield(f)}${esc(FAC[f].s)}${atWar(pl,f)?`<span class="w">${lng('savaşta','at war')}</span>`:''}</button>`).join('');}
/** The chart's table twin: one row every ten years (and today). */
function lgTable(){const m=LG_MET.find(x=>x.id===lgMetric)||LG_MET[0],fs=lgShown(),ss=fs.map(f=>lgSeries(f,m)),ts=[];
 for(let t=0;t<S.turn;t+=40)ts.push(t);ts.push(S.turn);
 return `<table class="lg-tab"><thead><tr><th>${lng('Yıl','Year')}</th>${fs.map(f=>`<th>${esc(FAC[f].s)}</th>`).join('')}</tr></thead><tbody>${ts.map(t=>`<tr><td>${lgYear(t)}</td>${ss.map(s=>{const v=lgAt(s,t);return `<td>${v?lgFmt(v[1],m):'–'}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;}
function lgChartSec(){const m=LG_MET.find(x=>x.id===lgMetric)||LG_MET[0];
 return `<div class="lg-mets" role="tablist">${LG_MET.map(x=>`<button class="lg-met${x.id===lgMetric?' on':''}" role="tab" aria-selected="${x.id===lgMetric}" data-act="lg-met" data-m="${x.id}">${esc(x.l)}</button>`).join('')}</div>
 <p class="hint lg-d">${esc(m.d)} ${lng('Okumak için grafiğe dokun ya da üzerinde gezdir.','Touch the chart, or move over it, to read a value.')}</p>
 <div id="lgChart" class="lg-chart"></div><div class="lg-legend">${lgLegend()}</div>
 <details class="lg-more"><summary>${lng('Karşılaştırılacak devlet ekle','Add a realm to compare')} <small>(${lng('en çok 4','up to 4')})</small></summary><div class="lg-pick">${lgPicker()||`<span class="hint">${lng('Eklenecek devlet kalmadı.','No realm left to add.')}</span>`}</div></details>
 <details class="lg-more"><summary>${lng('Değerleri tablo olarak göster','Show the values as a table')}</summary>${lgTable()}</details>`;}

/* ---------------- ranking ---------------- */
const LG_COLS=[{id:'prov',l:lng('Eyalet','Prov.'),v:f=>facProvs(f).length,t:v=>v},{id:'inc',l:lng('Gelir','Income'),v:f=>income(f),t:v=>v.toFixed(0)},{id:'army',l:lng('Asker','Troops'),v:f=>strength(f),t:v=>fmtK(v)},{id:'score',l:lng('Puan','Score'),v:f=>score(f),t:v=>v}];
function lgRank(){const pl=S.player,c=LG_COLS.find(x=>x.id===lgSort)||LG_COLS[3];
 const rows=FK.filter(alive).map(f=>{const o={f};for(const x of LG_COLS)o[x.id]=x.v(f);return o;}).sort((a,b)=>b[c.id]-a[c.id]||b.score-a.score);
 const lim=lgAll?rows.length:10,sh=new Set(lgShown()),rk=FK.filter(alive).sort((a,b)=>score(b)-score(a)).indexOf(pl)+1;
 const vis=rows.filter((r,k)=>k<lim||r.f===pl);
 const delta=f=>{const r=S.lg&&S.lg.r[f];if(!r||!r.d.length)return '';const n=r.d.length/LG_K,back=Math.max(0,n-1-Math.ceil(40/r.s)),d=score(f)-r.d[back*LG_K+4];
  return n>1&&d?`<small class="${d>0?'pos':'neg'}">${d>0?'+':'−'}${Math.abs(d)}</small>`:'';};
 return `<p class="hint">${!rk?lng('Devletin artık yok. Sıralama ayakta kalan devletleri gösteriyor.','Your realm is no more. The ranking shows the realms still standing.'):lng(`Puana göre ${rk}. sıradasın (${rows.length} devlet arasında). Bir satıra dokunarak devleti grafiğe ekle ya da çıkar.`,`You rank ${ordEn(rk)} of ${rows.length} realms by score. Tap a row to add the realm to the chart or take it off.`)}</p>
 <table class="lg-rank"><thead><tr><th class="n">#</th><th class="r">${lng('Devlet','Realm')}</th>${LG_COLS.map(x=>`<th><button class="lg-sort${x.id===lgSort?' on':''}" data-act="lg-sort" data-k="${x.id}" aria-pressed="${x.id===lgSort}">${esc(x.l)}${x.id===lgSort?' ▾':''}</button></th>`).join('')}</tr></thead>
 <tbody>${vis.map(r=>{const k=rows.indexOf(r);return `<tr class="${r.f===pl?'me':''}${sh.has(r.f)?' on':''}"${r.f!==pl?` data-act="lg-riv" data-f="${r.f}"`:''}><td class="n">${k+1}</td><td class="r"><div class="rn">${shield(r.f)}<span>${esc(FAC[r.f].s)}</span>${sh.has(r.f)?lgKey(r.f):''}</div></td>${LG_COLS.map(x=>`<td>${x.t(r[x.id])}${x.id==='score'?delta(r.f):''}</td>`).join('')}</tr>`;}).join('')}</tbody></table>
 ${rows.length>10?`<button class="btn lg-all" data-act="lg-all">${lgAll?lng('İlk 10 devleti göster','Show the top 10'):lng(`Bütün devletleri göster (${rows.length})`,`Show all realms (${rows.length})`)}</button>`:''}`;}

/* ---------------- war history ---------------- */
function lgWarRow(w){const pl=S.player,y0=lgYear(w.s),y1=w.e!=null?lgYear(w.e):null,A=fname(w.a),B=fname(w.b);
 let res;
 if(w.e==null)res=`<span class="on">${lng('Sürüyor','Ongoing')}</span>`;
 else if(w.r==='a'||w.r==='b'){const win=fname(w[w.r]),bits=[];if(w.p)bits.push(lng(`${w.p} eyalet`,`${w.p} ${w.p===1?'province':'provinces'}`));if(w.g)bits.push(lng(`${w.g} altın`,`${w.g} gold`));
  res=bits.length?lng(`${win} kazandı: ${bits.join(', ')}`,`${win} won: ${bits.join(', ')}`):lng(`${win} kazandı`,`${win} won`);}
 else if(w.r==='w')res=lng('Kazanansız barış','Peace without gains');
 else if(w.r==='x')res=lng(`${fname(w.q)} yıkıldı`,`${fname(w.q)} fell`);
 else res=lng('Savaş sona erdi','The war ended');
 const won=w.r==='a'||w.r==='b'?w[w.r]:w.r==='x'?(w.q===w.a?w.b:w.a):null,cls=w.e==null?'':(won===pl?'pos':(won&&(w.a===pl||w.b===pl))?'neg':'');
 const bt=w.wa+w.wb?lng(`Kazanılan muharebe: ${A} ${w.wa}, ${B} ${w.wb}`,`Battles won: ${A} ${w.wa}, ${B} ${w.wb}`):lng('Meydan muharebesi olmadı','No battles fought');
 return `<div class="lg-war"><div class="sides">${shield(w.a)}<span>${esc(A)}</span><i>${lng('–','vs')}</i><span>${esc(B)}</span>${shield(w.b)}</div>
  <div class="yrs">${y0}${y1==null?' –':y1!==y0?'–'+y1:''}</div><div class="res ${cls}">${res}</div><div class="bt">${esc(bt)}</div></div>`;}
function lgWars(){const W=S.lg?S.lg.w:[],pl=S.player,mine=W.filter(w=>w.a===pl||w.b===pl).reverse(),oth=W.filter(w=>w.a!==pl&&w.b!==pl).reverse();
 return `<div class="lg-wars">${mine.map(lgWarRow).join('')||`<p class="hint">${lng('Henüz savaşa girmedin.','You have not fought a war yet.')}</p>`}</div>
 ${oth.length?`<details class="lg-more"><summary>${lng('Öteki devletlerin savaşları','Wars between other realms')} <small>(${oth.length})</small></summary><div class="lg-wars">${oth.slice(0,30).map(lgWarRow).join('')}</div></details>`:''}`;}

/* ---------------- modal ---------------- */
function showLedger(){const f=S.player;lgHover=null;
 openModal(`<div class="lgr"><div class="eyebrow">${esc(FAC[f].n)} · ${dateStr(S.turn)}</div><h2>${lng('Defter','Ledger')}</h2>
 <p class="hint lg-lead">${lng('Devletinin yıllar içindeki gidişatı, rakiplerinle karşılaştırması ve savaşların kaydı.','How your realm has fared over the years, how it compares with its rivals, and the record of its wars.')}</p>
 <div class="sec"><h3>${lng('Zaman içinde','Over time')}</h3><div id="lgCh">${lgChartSec()}</div></div>
 <div class="sec"><h3>${lng('Devletlerin sıralaması','Ranking of the realms')}</h3><div id="lgRank">${lgRank()}</div></div>
 <div class="sec"><h3>${lng('Savaş tarihi','War history')}</h3>${lgWars()}</div>
 <div class="foot"><button class="btn" data-act="state">${lng('Devlet defteri','State book')}</button><button class="btn primary" data-act="mclose">${lng('Kapat','Close')}</button></div></div>`);
 lgChart();}
function lgRefresh(){const c=$('#lgCh');if(c){const op=[...c.querySelectorAll('details')].map(d=>d.open);c.innerHTML=lgChartSec();c.querySelectorAll('details').forEach((d,k)=>{if(op[k])d.open=true;});lgChart();}
 const r=$('#lgRank');if(r)r.innerHTML=lgRank();}
ACTS.ledger=()=>showLedger();
ACTS['lg-met']=t=>{lgMetric=t.dataset.m;lgRefresh();};
ACTS['lg-sort']=t=>{lgSort=t.dataset.k;const r=$('#lgRank');if(r)r.innerHTML=lgRank();};
ACTS['lg-all']=()=>{lgAll=!lgAll;const r=$('#lgRank');if(r)r.innerHTML=lgRank();};
ACTS['lg-riv']=t=>{const f=t.dataset.f;lgShown();if(!f||f===S.player)return;
 if(lgRiv.includes(f))lgRiv=lgRiv.filter(x=>x!==f);else if(lgRiv.length>=4){toast(lng('Grafikte en çok dört rakip olabilir. Önce birini çıkar.','The chart holds at most four rivals. Take one off first.'),'info');return;}else lgRiv=[...lgRiv,f];
 lgRefresh();};
{let tm=0;addEventListener('resize',()=>{clearTimeout(tm);tm=setTimeout(()=>{if($('#lgChart'))lgChart();},120);});}
hook('newGame',()=>{lgRiv=null;lgHover=null;for(const f in lgSlot)delete lgSlot[f];},96);
hook('enterGame',()=>{lgRiv=null;lgHover=null;for(const f in lgSlot)delete lgSlot[f];});
STATE_SECTIONS.push({id:'stats',order:15,html:()=>`<div class="sec lg-open"><button class="btn" data-act="ledger"><span>${lng('Defter: gelir, ordu, toprak ve puanın yıllar içindeki seyri, sıralama ve savaş tarihi','Ledger: income, army, land and score over the years, the ranking and the war history')}</span><span class="c">›</span></button></div>`});
MENU_SECTIONS.push({id:'ledger',order:12,html:()=>S&&S.player?`<div class="sec"><h3>${lng('Kayıtlar','Records')}</h3><div class="acts"><button class="btn" data-act="ledger">${lng('Defter','Ledger')} <span class="c">${lng('grafikler, sıralama, savaşlar','charts, ranking, wars')}</span></button></div></div>`:''});
KE.ledger={show:()=>showLedger(),record:()=>lgRecord(),series:(f,id)=>lgSeries(f,LG_MET.find(x=>x.id===(id||'score'))),shown:()=>lgShown(),hover:T=>lgShow(T),bal:BAL_L};
