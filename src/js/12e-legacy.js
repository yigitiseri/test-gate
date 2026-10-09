/* =====================================================================
   LEGACY: achievements and the end-of-game story.
    - S.lgc = {p0, d0, pk, gains:[[turn,i]], lost, peace, hist:[[turn,provinces]], ach:{id:turn}}
      p0/d0: the player's provinces and development at the start; pk: the most provinces ever held;
      gains: provinces the player won for good (capture hook), lost: provinces it lost for good; works: great works it finished;
      hist: provinces held, once a year (for the end-screen chart); ach: achievements earned in this game.
    - Achievements (ACH) are checked every season and after captures and peace treaties; each one is announced.
      They are also kept across games in localStorage (ACH_STORE), so the state book shows past ones faded.
    - The end screen tells the reign's story: the ruler's epithet, a chart of the realm's size, the main
      conquests by date, the score broken down, the achievements, and the ranking of the powers.
   ===================================================================== */
const ACH_STORE='aod-ach-v1';
const LGC_AFR=new Set(['kahire','iskenderiye','dimyat','behire','sarkiye','feyyum','suveys','barka','derne','tobruk','matruh','trablusgarp','misrata','sirt']);
const LGC_THR=new Set(['edirne','gelibolu','tekfurdagi','kirkkilise','istanbul','silivri']);
/** 'eu' | 'as' | 'af': the continent of province i (the Bosphorus and the Dardanelles split Europe from Asia). */
function lgcCont(i){const d=PD[i];return LGC_AFR.has(d.key)?'af':LGC_THR.has(d.key)||d.lat>42.1||d.lon<26.2?'eu':'as';}
function lgcOwns(f,k){const i=PK[k];return i!=null&&S.prov[i].o===f;}
/** Field troops of f. */
function lgcTroops(f){let n=0;for(const a of armyList(f))n+=a.n;return n;}
const ACH_ICON={
 crown:'<path d="M3 17h18l-1.6-9-4.4 4-3-6-3 6-4.4-4z"/><path d="M4 20h16"/>',
 sword:'<path d="M14.5 3H21v6.5L10 20.5 3.5 14z"/><path d="M5 13l6 6M3 21l3-3"/>',
 tower:'<path d="M5 21V8h3V5h2v3h4V5h2v3h3v13z"/><path d="M10 21v-5h4v5"/>',
 coin:'<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 010 3.6h-3a1.8 1.8 0 000 3.6h4"/>',
 globe:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/>',
 column:'<path d="M5 6h14M6 6v13M18 6v13M10 6v13M14 6v13M4 20h16M12 2.5 4 6h16z"/>',
 scroll:'<path d="M7 4h11v13a3 3 0 01-3 3H6a3 3 0 01-3-3h11"/><path d="M7 4a2 2 0 00-2 2v11M10 9h5M10 12h5"/>',
 shield:'<path d="M12 3 4.5 6v6c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9V6z"/><path d="M9 12l2 2 4-4"/>'};
/* id, icon, name [tr,en], how [tr,en], ok(f) -> bool; end: only judged when the game ends in 1531 */
const ACH=[
 {id:'fetih',ic:'crown',n:['Fatih','The Conqueror'],d:['Konstantiniyye\'yi 1454\'ten önce al.','Take Constantinople before 1454.'],ok:f=>S.turn<12&&lgcOwns(f,'istanbul')},
 {id:'kizilelma',ic:'crown',n:['Kızıl Elma','The Red Apple'],d:['Roma\'yı al.','Take Rome.'],ok:f=>lgcOwns(f,'roma')},
 {id:'viyana',ic:'tower',n:['Viyana Kapıları','The Gates of Vienna'],d:['Viyana\'yı al.','Take Vienna.'],ok:f=>lgcOwns(f,'viyana')},
 {id:'budin',ic:'tower',n:['Budin Kalesi','The Castle of Buda'],d:['Budin\'i al.','Take Buda.'],ok:f=>lgcOwns(f,'budin')},
 {id:'belgrad',ic:'tower',n:['Macar Kapısı','The Gate of Hungary'],d:['Belgrad\'ı al.','Take Belgrade.'],ok:f=>lgcOwns(f,'belgrad')},
 {id:'kahire',ic:'crown',n:['Mısır Sultanı','Sultan of Egypt'],d:['Kahire\'yi al.','Take Cairo.'],ok:f=>lgcOwns(f,'kahire')},
 {id:'kudus',ic:'column',n:['Kudüs','Jerusalem'],d:['Kudüs\'ü al.','Take Jerusalem.'],ok:f=>lgcOwns(f,'kudus')},
 {id:'tebriz',ic:'tower',n:['Tebriz','Tabriz'],d:['Tebriz\'i al.','Take Tabriz.'],ok:f=>lgcOwns(f,'tebriz')},
 {id:'bagdat',ic:'column',n:['Bağdat','Baghdad'],d:['Bağdat\'ı al.','Take Baghdad.'],ok:f=>lgcOwns(f,'bagdat')},
 {id:'rodos',ic:'shield',n:['Şövalyeler Adası','The Knights\' Island'],d:['Rodos\'u al.','Take Rhodes.'],ok:f=>lgcOwns(f,'rodos')},
 {id:'venedik',ic:'coin',n:['Denizlerin Gelini','The Bride of the Sea'],d:['Venedik\'i al.','Take Venice.'],ok:f=>lgcOwns(f,'venedik')},
 {id:'kita',ic:'globe',n:['Üç Kıtanın Hâkimi','Lord of Three Continents'],d:['Avrupa, Asya ve Afrika\'da en az üçer eyaletin olsun.','Hold at least three provinces each in Europe, Asia and Africa.'],
  ok:f=>{const c={eu:0,as:0,af:0};for(const i of facProvs(f))c[lgcCont(i)]++;return c.eu>=3&&c.as>=3&&c.af>=3;}},
 {id:'buyuk',ic:'globe',n:['Büyüyen Devlet','A Rising Power'],d:['Başladığından 15 eyalet fazlasına ulaş.','Hold 15 more provinces than you started with.'],ok:f=>facProvs(f).length>=lgc().p0+15},
 {id:'cihan',ic:'globe',n:['Cihan Devleti','A World Empire'],d:['80 eyalete ulaş.','Reach 80 provinces.'],ok:f=>facProvs(f).length>=80},
 {id:'hazine',ic:'coin',n:['Hazine-i Âmire','The Imperial Treasury'],d:['Hazinende 1.000 altın biriktir.','Gather 1,000 gold in the treasury.'],ok:f=>S.fac[f].gold>=1000},
 {id:'ordu',ic:'sword',n:['Kalabalık Ordular','Countless Armies'],d:['Sahada toplam 60.000 asker olsun.','Have 60,000 troops in the field.'],ok:f=>lgcTroops(f)>=60000},
 {id:'gazi',ic:'sword',n:['Gazi','The Warrior'],d:['25 savaş kazan.','Win 25 battles.'],ok:()=>S.stats.won>=25},
 {id:'metbu',ic:'shield',n:['Metbu','The Overlord'],d:['Aynı anda 3 vasalın olsun.','Have 3 vassals at once.'],ok:f=>typeof vasList==='function'&&vasList(f).length>=3},
 {id:'mimar',ic:'column',n:['Mimar','The Builder'],d:['2 büyük eser bitir.','Complete 2 great works.'],ok:()=>lgc().works>=2},
 {id:'hedef',ic:'scroll',n:['Hedef Avcısı','The Achiever'],d:['10 hedef tamamla.','Complete 10 goals.'],ok:()=>Object.keys(S.misDone||{}).length>=10},
 {id:'yenilik',ic:'scroll',n:['Yenilikçi','The Reformer'],d:['5 gelişme benimse.','Adopt 5 reforms.'],ok:f=>typeof rfCount==='function'&&rfCount(f)>=5},
 {id:'diren',ic:'shield',n:['Direniş','Defiance'],d:['En fazla 3 eyaletle başlayıp 1531\'e kadar ayakta kal.','Start with 3 provinces or fewer and survive to 1531.'],end:true,ok:f=>lgc().p0<=3&&alive(f)},
 {id:'zor',ic:'sword',n:['Zor Yoldan','The Hard Way'],d:['Zor oyunda 1531\'e kadar ayakta kal.','Survive to 1531 on hard.'],end:true,ok:f=>difKey()==='hard'&&alive(f)},
 {id:'yikilmaz',ic:'shield',n:['Yıkılmaz','Unbroken'],d:['1531\'e kadar tek bir eyaletini kaybetme.','Reach 1531 without losing a single province for good.'],end:true,ok:f=>alive(f)&&!lgc().lost}];
const ACH_BY={};ACH.forEach(a=>ACH_BY[a.id]=a);
const achName=a=>lng(a.n[0],a.n[1]),achHow=a=>lng(a.d[0],a.d[1]);
function achIcon(a){return `<svg viewBox="0 0 24 24" aria-hidden="true">${ACH_ICON[a.ic]}</svg>`;}
/** Achievements earned in past games (this device): {id:{f,y}} */
function achPast(){try{return JSON.parse(localStorage.getItem(ACH_STORE))||{};}catch(e){return {};}}
function achKeep(id){try{const m=achPast();if(!m[id]){m[id]={f:S.player,y:START_YEAR+Math.floor(S.turn/4)};localStorage.setItem(ACH_STORE,JSON.stringify(m));}}catch(e){}}

/** The legacy record of the game, created on first use (old saves start it from the present). */
function lgc(){if(!S.lgc){const f=S.player,ps=f?facProvs(f):[];S.lgc={p0:ps.length,d0:ps.reduce((s,i)=>s+S.prov[i].dev,0),pk:ps.length,gains:[],lost:0,peace:0,works:0,hist:[[S.turn,ps.length]],ach:{}};}return S.lgc;}
/** Check the achievements; announce new ones. atEnd: also judge the end-of-game ones. */
function achCheck(atEnd){if(!S||!S.player||!alive(S.player)&&!atEnd)return [];const f=S.player,L=lgc(),got=[];
 L.pk=Math.max(L.pk,facProvs(f).length);
 for(const a of ACH){if(L.ach[a.id]!=null||(a.end&&!(atEnd&&S.over==='time')))continue;let ok=false;try{ok=a.ok(f);}catch(e){}
  if(!ok)continue;L.ach[a.id]=S.turn;got.push(a);achKeep(a.id);
  if(!atEnd){const m=lng(`Başarım kazanıldı: ${achName(a)}. ${achHow(a)}`,`Achievement earned: ${achName(a)}. ${achHow(a)}`);addLog(m,'cap');toast(lng(`Başarım: ${achName(a)}`,`Achievement: ${achName(a)}`),'good');}}
 if(got.length&&!atEnd)SND.play('coin');return got;}
hook('newGame',(s,f)=>{s.lgc=null;const L=lgc();L.hist=[[0,L.p0]];});
hook('migrate',s=>{if(s.lgc&&!Array.isArray(s.lgc.hist))s.lgc.hist=[];});
hook('capture',(i,f,old)=>{if(!S.player)return;const L=lgc();if(f===S.player&&old!==f){L.gains.push([S.turn,i]);achCheck();}else if(old===S.player&&f!==old)L.lost++;});
hook('workDone',w=>{if(S.player&&w.f===S.player){lgc().works=(lgc().works||0)+1;achCheck();}});
hook('peace',(a,b)=>{if(a===S.player||b===S.player){lgc().peace++;achCheck();}});
hook('newTurn',()=>{if(!S.player)return;const L=lgc();if(S.turn%4===0&&alive(S.player))L.hist.push([S.turn,facProvs(S.player).length]);achCheck();});

/* ---------------- the end of the game ---------------- */
/** The epithet history gives the ruler, from how the reign went. -> [tr,en] */
function lgcEpithet(f){const L=lgc(),g=L.gains.length,dv=facProvs(f).reduce((s,i)=>s+S.prov[i].dev,0)-L.d0;
 if(S.over==='lose')return ['Talihsiz','the Unfortunate'];
 if(g>=25)return ['Cihangir','the World-Conqueror'];
 if(g>=12)return ['Fatih','the Conqueror'];
 if(S.stats.won>=30)return ['Gazi','the Warrior'];
 if(L.works>=2||S.fac[f].gold>=800)return ['Muhteşem','the Magnificent'];
 if(dv>=20)return ['Kanuni','the Lawgiver'];
 if(!L.lost)return ['Yenilmez','the Unyielding'];
 return ['Sebatkâr','the Steadfast'];}
/** Provinces held, year by year: a small line chart (SVG) with a tooltip on every year. */
function lgcChart(f){const L=lgc(),pts=L.hist.slice();const now=[S.turn,facProvs(f).length];if(!pts.length||pts[pts.length-1][0]!==now[0])pts.push(now);
 if(pts.length<2)return '';const W=560,H=150,pl=34,pr=12,pt=12,pb=24,t0=pts[0][0],t1=Math.max(t0+1,pts[pts.length-1][0]),mx=Math.max(4,...pts.map(p=>p[1]));
 const top=Math.ceil(mx/(mx>40?20:mx>12?5:2))*(mx>40?20:mx>12?5:2),X=t=>pl+(t-t0)/(t1-t0)*(W-pl-pr),Y=v=>pt+(1-v/top)*(H-pt-pb);
 const yr=t=>START_YEAR+Math.floor(t/4),path=pts.map((p,k)=>(k?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(''),last=pts[pts.length-1];
 const ticks=[0,top/2,top].map(v=>`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" class="lgc-grid"/><text x="${pl-6}" y="${Y(v)+4}" text-anchor="end">${v}</text>`).join('');
 const yrs=[...new Set([yr(t0),yr(Math.round((t0+t1)/2)),yr(t1)])].map(y=>{const t=(y-START_YEAR)*4;return `<text x="${X(clamp(t,t0,t1))}" y="${H-6}" text-anchor="middle">${y}</text>`;}).join('');
 const hits=pts.map((p,k)=>{const x0=k?(X(pts[k-1][0])+X(p[0]))/2:pl,x1=k<pts.length-1?(X(p[0])+X(pts[k+1][0]))/2:W-pr;
  return `<rect x="${x0}" y="${pt}" width="${Math.max(1,x1-x0)}" height="${H-pt-pb}" class="lgc-hit" data-x="${X(p[0])}" data-y="${Y(p[1])}" data-l="${yr(p[0])}: ${p[1]} ${lng('eyalet',p[1]===1?'province':'provinces')}"><title>${yr(p[0])}: ${p[1]}</title></rect>`;}).join('');
 return `<div class="lgc-chart"><div class="lgc-ch-t">${lng('Toprakların yıllar içinde (eyalet sayısı)','Your lands over the years (provinces)')}</div>
  <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${lng(`Eyalet sayısı ${pts[0][1]} iken ${last[1]} oldu; en çok ${L.pk}.`,`Provinces went from ${pts[0][1]} to ${last[1]}; at most ${L.pk}.`)}">${ticks}${yrs}
  <path d="${path}" class="lgc-line"/><circle cx="${X(last[0])}" cy="${Y(last[1])}" r="4" class="lgc-dot"/><g class="lgc-cross" style="display:none"><line y1="${pt}" y2="${H-pb}" class="lgc-cl"/><circle r="4" class="lgc-dot"/></g>${hits}</svg>
  <div class="lgc-tip" role="status"></div></div>`;}
/** Score of f broken down as score() (03-state) adds it up. */
function lgcScoreRows(f){const ps=facProvs(f),dev=ps.reduce((a,i)=>a+S.prov[i].dev,0),mis=Object.keys(S.misDone).length;
 return [[lng(`Eyaletler (${ps.length} × 10)`,`Provinces (${ps.length} × 10)`),ps.length*10],[lng(`Gelişmişlik (${dev} × 3)`,`Development (${dev} × 3)`),dev*3],
  [lng(`Hedefler (${mis} × 60)`,`Goals (${mis} × 60)`),mis*60],[lng(`Hazine (${Math.floor(S.fac[f].gold)} altın ÷ 10)`,`Treasury (${Math.floor(S.fac[f].gold)} gold ÷ 10)`),Math.floor(S.fac[f].gold/10)]];}
/** The end-screen story (between the title and the ranking). */
function lgcEndHtml(f){const L=lgc();achCheck(true);const ep=lgcEpithet(f),rn=rulerName(f),ps=facProvs(f).length;
 const gains=L.gains.filter(([,i])=>S.prov[i].o===f).sort((a,b)=>a[0]-b[0]),big=gains.slice().sort((a,b)=>S.prov[b[1]].dev-S.prov[a[1]].dev).slice(0,10).sort((a,b)=>a[0]-b[0]);
 const got=ACH.filter(a=>L.ach[a.id]!=null),sc=lgcScoreRows(f),tot=sc.reduce((s,r)=>s+r[1],0);
 return `<div class="lgc-epi">${lng(`Tarih seni <b>${esc(rn)}</b> olarak değil, <b>${esc(ep[0])} ${esc(rn)}</b> olarak anacak.`,`History will remember you not as <b>${esc(rn)}</b> but as <b>${esc(rn)} ${esc(ep[1])}</b>.`)}</div>
 <div class="meta lgc-meta"><span>${lng('Eyalet','Provinces')} <b>${L.p0} → ${ps}</b></span><span>${lng('En geniş','At most')} <b>${Math.max(L.pk,ps,...L.hist.map(h=>h[1]))}</b></span><span>${lng('Fetih','Conquests')} <b>${L.gains.length}</b></span><span>${lng('Kayıp','Lost')} <b>${L.lost}</b></span><span>${lng('Savaş','Battles')} <b>${S.stats.won}–${S.stats.lost}</b></span><span>${lng('Barış','Treaties')} <b>${L.peace}</b></span><span>${lng('Zorluk','Difficulty')} <b>${difName(difKey())}</b></span></div>
 ${lgcChart(f)}
 ${big.length?`<div class="sec"><h3>${lng('Büyük fetihler','Great conquests')}</h3><div class="lgc-tl">${big.map(([t,i])=>`<div><time>${dateStr(t)}</time><span>${esc(PD[i].name)}</span></div>`).join('')}</div></div>`:''}
 <div class="sec"><h3>${lng('Puan','Score')} <span class="cap">${tot}</span></h3><div class="lgc-sc">${sc.map(([l,v])=>`<div><span>${l}</span><b>${v}</b></div>`).join('')}</div></div>
 <div class="sec"><h3>${lng('Başarımlar','Achievements')} <span class="cap">${got.length}/${ACH.length}</span></h3>${got.length?`<div class="achg">${got.map(a=>achBadge(a,'on')).join('')}</div>`:`<div class="hint">${lng('Bu oyunda başarım kazanılmadı.','No achievements this game.')}</div>`}</div>`;}
function achBadge(a,st){return `<div class="ach ${st}" title="${esc(achHow(a))}">${achIcon(a)}<div><b>${esc(achName(a))}</b><small>${esc(achHow(a))}</small></div></div>`;}
/** Hover on the end-screen chart: a crosshair on the year and its value. */
function lgcChartBind(root){const c=root&&root.querySelector('.lgc-chart');if(!c)return;const g=c.querySelector('.lgc-cross'),tip=c.querySelector('.lgc-tip'),svg=c.querySelector('svg');
 const show=r=>{const x=+r.dataset.x,y=+r.dataset.y;g.style.display='';g.querySelector('line').setAttribute('x1',x);g.querySelector('line').setAttribute('x2',x);g.querySelector('circle').setAttribute('cx',x);g.querySelector('circle').setAttribute('cy',y);
  tip.textContent=r.dataset.l;const vb=svg.viewBox.baseVal,bw=svg.getBoundingClientRect().width/vb.width;tip.style.left=Math.round(x*bw)+'px';tip.style.top=Math.round(y*bw)+'px';tip.classList.add('on');};
 c.querySelectorAll('.lgc-hit').forEach(r=>{r.addEventListener('pointerenter',()=>show(r));r.addEventListener('pointerdown',()=>show(r));});
 svg.addEventListener('pointerleave',()=>{g.style.display='none';tip.classList.remove('on');});}

/* ---------------- the state book: achievements ---------------- */
STATE_SECTIONS.push({id:'ach',order:45,html(f){if(f!==S.player)return '';const L=lgc(),past=achPast(),n=ACH.filter(a=>L.ach[a.id]!=null).length;
 return `<div class="sec"><h3>${lng('Başarımlar','Achievements')} <span class="cap">${n}/${ACH.length}</span></h3>
  <div class="hint">${lng('Parlayanlar bu oyunda kazanıldı; soluk olanlar önceki oyunlarında.','The bright ones were earned in this game; the faded ones in earlier games.')}</div>
  <div class="achg">${ACH.map(a=>achBadge(a,L.ach[a.id]!=null?'on':past[a.id]?'past':'')).join('')}</div></div>`;}});
KE.lgc={get:()=>lgc(),check:e=>achCheck(e).map(a=>a.id),ach:()=>ACH.map(a=>a.id),epithet:f=>lgcEpithet(f||S.player),cont:i=>lgcCont(i),past:()=>achPast()};
