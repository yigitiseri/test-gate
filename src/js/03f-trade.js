/* =====================================================================
   TRADE ROUTES (Track T, Wave 3)
   The great trade roads of the age as chains of provinces (route "stops"). Every season each route
   carries goods worth `v` gold; whoever controls a stop (ctl: the occupier, else the owner) earns that
   stop's share (weight w). The flow of a whole route falls when war cuts it (two neighbouring stops
   held by realms at war), when a stop is besieged or occupied, and rises with markets and caravanserais
   at its stops and when one realm holds the whole road. Nothing is stored in the save: everything is
   computed from the provinces, wars and sieges, so old saves just work.
   Income: ECON_ROWS row id 'trade' ("Ticaret yolları"). Map layer: 07g. Panel/modal: 11h.
   ===================================================================== */
/* Track T balance constants. Tune here only. */
const BAL_T={
 warLeg:.15,       // each leg whose two stops are held by realms at war: flow −15%
 siegeStop:.2,     // each besieged stop: −20%
 occStop:.1,       // each occupied stop: −10%
 mktStop:.04,mktMax:.2,   // each market at a stop +4% (at most +20%)
 caravan:.1,caravanMax:.3,// each caravanserai (great work, 03g) +10% (at most +30%)
 whole:.2,         // one realm holds every stop: +20%
 flowMin:.25,flowMax:1.6,
 bedesten:1.5,     // a covered market (03g) at a stop: that stop earns x1.5
 arsenalSea:1.25,  // a realm with an arsenal (03g): its sea-port stops earn x1.25
 toll:1,           // a caravanserai stop also takes a flat toll of 1 gold
};
/* Routes. Stops: 'key' (weight 1), 'key*2' (weight 2: a great market or port), '~key' = reached by sea.
   [lon,lat] = a waypoint the drawn line passes (sea lanes around capes, river bends). g = map glyph.
   era: later historical shifts of the flow (turn, multiplier, news). */
const TRADE_ROUTES=[
 {id:'silk',g:'camel',v:11,n:{tr:'İpek Yolu',en:'Silk Road'},
  d:{tr:'İran ipeği Tebriz\'den kervanlarla Erzurum, Tokat ve Ankara üzerinden Bursa\'nın ipek pazarına taşınır.',en:'Persian silk travels by caravan from Tabriz through Erzurum, Tokat and Ankara to the silk market of Bursa.'},
  s:['tebriz*3','hoy','erzurum','erzincan','tokat*2','amasya','ankara','bursa*3']},
 {id:'trebizond',g:'camel',v:4,n:{tr:'Trabzon Yolu',en:'Trebizond Road'},
  d:{tr:'Tebriz kervanlarının bir kolu Erzurum ve Bayburt\'tan dağları aşıp Trabzon limanına iner; mallar oradan Karadeniz\'e açılır.',en:'A branch of the Tabriz caravans crosses the mountains by Erzurum and Bayburt down to the port of Trebizond, where the goods take ship on the Black Sea.'},
  s:['tebriz*2','erzurum','bayburt','trabzon*3']},
 {id:'spice',g:'camel',v:9,n:{tr:'Baharat Yolu',en:'Spice Route'},
  d:{tr:'Hint baharatı Kızıldeniz\'den Süveyş\'e çıkar, Kahire üzerinden İskenderiye limanına iner; Avrupalı tüccarlar onu orada alır.',en:'Indian spices come up the Red Sea to Suez and on through Cairo to the port of Alexandria, where European merchants buy them.'},
  s:['suveys*2','kahire*3','iskenderiye*3'],
  era:[{t:196,m:.75,tr:'Portekiz gemileri Ümit Burnu\'nu dolaşıp Hindistan\'a ulaştı: Baharat Yolu\'ndan geçen mal azalıyor.',en:'Portuguese ships have rounded the Cape of Good Hope and reached India: fewer spices travel the Spice Route.'}]},
 {id:'levant',g:'ship',v:9,n:{tr:'Levant Deniz Yolu',en:'Levant Sea Route'},
  d:{tr:'Venedik kadırgaları Adriyatik\'ten Korfu, Moton, Kandiye ve Rodos\'a uğrayarak Kıbrıs ve Beyrut\'a gider.',en:'Venetian galleys sail down the Adriatic, calling at Corfu, Modon, Candia and Rhodes on the way to Cyprus and Beirut.'},
  s:['venedik*3',[13.6,44.6],[15.6,43.2],'~raguza*2',[18.9,40.6],'~korfu',[20.4,38.3],'~moton',[23.2,36.1],'~kandiye*2',[26.8,35.7],'~rodos',[30.6,35.9],'~magosa',[34.6,34.4],'~beyrut*2'],
  era:[{t:196,m:.85,tr:'Okyanus yolları açıldı: Levant\'tan Venedik\'e giden gemiler azalıyor.',en:'The ocean routes have opened: fewer ships sail from the Levant to Venice.'}]},
 {id:'black',g:'ship',v:8,n:{tr:'Karadeniz Yolu',en:'Black Sea Route'},
  d:{tr:'Bozkırın tahılı, kürkü ve kölesi Azak ve Kefe\'den gemilerle Sinop ve Konstantiniyye üzerinden Ege\'ye iner.',en:'Grain, furs and slaves from the steppe sail from Azov and Caffa past Sinope and Constantinople down to the Aegean.'},
  s:['azak*2',[37.4,46.1],'~kefe*3',[35.1,43.6],'~sinop',[31.2,41.9],'~istanbul*3',[27.9,40.75],'~gelibolu',[25.9,39.7],'~sakiz*2']},
 {id:'ragusa',g:'mule',v:5,n:{tr:'Raguza Kervan Yolu',en:'Ragusan Caravan Road'},
  d:{tr:'Raguzalı tüccarlar Novobırda\'nın gümüşünü ve Balkan\'ın yününü katırlarla Sofya ve Filibe üzerinden Edirne\'ye götürür.',en:'Ragusan merchants carry the silver of Novo Brdo and the wool of the Balkans by mule through Sofia and Philippopolis to Adrianople.'},
  s:['raguza*2','hersek','yenipazar','novobirda*2','sofya','filibe','edirne*2']},
 {id:'danube',g:'boat',v:5,n:{tr:'Tuna Yolu',en:'Danube Road'},
  d:{tr:'Viyana\'dan Budin ve Belgrad\'a, oradan Demirkapı\'yı geçip Kili\'ye kadar Tuna boyunca mavnalar ve kervanlar işler.',en:'Barges and caravans work the Danube from Vienna to Buda and Belgrade, then through the Iron Gates down to Kilia.'},
  s:['viyana*2','pojon','budin*2',[18.8,46.0],'belgrad*2',[22.3,44.6],'vidin','nigbolu','silistre','kili*2']},
 {id:'aleppo',g:'camel',v:8,n:{tr:'Halep Kervan Yolu',en:'Aleppo Caravan Road'},
  d:{tr:'Basra Körfezi\'nin malları Bağdat\'tan Fırat boyunca Rahbe üzerinden Halep çarşılarına ve Antakya\'ya ulaşır.',en:'Goods from the Persian Gulf go from Baghdad up the Euphrates by way of Rahba to the bazaars of Aleppo and on to Antioch.'},
  s:['basra*2','bagdat*3','ane','rahbe','halep*3','antakya']},
];
/** Parsed routes: {id,g,v,n,d,era,stops:[{i,w,sea,via:[[lon,lat]...]}],W (sum of weights)} */
const TRD=TRADE_ROUTES.map(r=>{const stops=[];let via=[];
 for(const x of r.s){if(Array.isArray(x)){via.push(x);continue;}
  const sea=x[0]==='~',m=/^~?([a-z]+)(?:\*(\d))?$/.exec(x),i=m?PK[m[1]]:null;
  if(i==null){console.error('trade: unknown stop '+x);continue;}
  stops.push({i,w:m[2]?+m[2]:1,sea,via});via=[];}
 return {...r,stops,W:stops.reduce((s,q)=>s+q.w,0)};});
const TRD_BY={};TRD.forEach(r=>TRD_BY[r.id]=r);
/** province index -> [{r, k}] (route, stop index) */
const TRD_AT={};TRD.forEach(r=>r.stops.forEach((q,k)=>(TRD_AT[q.i]||(TRD_AT[q.i]=[])).push({r,k})));
/** Is province i a stop of any route? */
const trdIsStop=i=>!!TRD_AT[i];
/** Is stop k of route r a sea port (reached by sea, or the next leg leaves by sea)? */
const trdPort=(r,k)=>r.stops[k].sea||!!(r.stops[k+1]&&r.stops[k+1].sea);
/** Works hooks (03g) with safe fallbacks, so trade works on its own. */
const trdHas=(i,k)=>typeof wkDone==='function'&&wkDone(i,k);
const trdArsenal=f=>typeof wkRealmHas==='function'&&wkRealmHas(f,'arsenal');
/** Historical era factor of route r now (e.g. the Cape route after 1500). */
function trdEra(r){let m=1;if(r.era&&S)for(const e of r.era)if(S.turn>=e.t)m*=e.m;return m;}
/** Flow of route r now: {flow, why:[{k,l,v}], owner (one realm holding every stop, or null), cut (legs at war)}.
 why lists the plain-word reasons with their effect (v = +/- share). */
function trdFlow(r){const why=[];let f=1,cut=0,sg=0,oc=0,mk=0,cv=0;const own=new Set();
 for(let k=0;k<r.stops.length;k++){const i=r.stops[k].i,p=S.prov[i],c=p.ctl||p.o;own.add(c);
  if(typeof siegeAt==='function'&&siegeAt(i))sg++;else if(p.ctl&&p.ctl!==p.o)oc++;
  if(p.mkt)mk++;if(trdHas(i,'caravan'))cv++;
  if(k>0){const j=r.stops[k-1].i,pc=S.prov[j].ctl||S.prov[j].o;if(pc!==c&&alive(pc)&&alive(c)&&atWar(pc,c))cut++;}}
 const add=(k,l,v)=>{if(!v)return;f+=v;why.push({k,l,v});};
 add('war',lng(`Savaş yolu kesiyor (${cut} yerde)`,`War cuts the road (${cut} ${cut===1?'place':'places'})`),-cut*BAL_T.warLeg);
 add('siege',lng(`Kuşatma altında durak (${sg})`,`Stops under siege (${sg})`),-sg*BAL_T.siegeStop);
 add('occ',lng(`İşgal altında durak (${oc})`,`Stops under occupation (${oc})`),-oc*BAL_T.occStop);
 add('mkt',lng(`Duraklardaki pazarlar (${mk})`,`Markets at the stops (${mk})`),Math.min(BAL_T.mktMax,mk*BAL_T.mktStop));
 add('caravan',lng(`Kervansaraylar (${cv})`,`Caravanserais (${cv})`),Math.min(BAL_T.caravanMax,cv*BAL_T.caravan));
 const one=own.size===1?[...own][0]:null;
 if(one)add('whole',lng(`Bütün yol tek elde: ${FAC[one].s}`,`The whole road in one hand: ${FAC[one].s}`),BAL_T.whole);
 const era=trdEra(r);if(era<1)why.push({k:'era',l:lng('Okyanus yolları rakip oldu','The ocean routes compete'),v:era-1});
 f=clamp(f,BAL_T.flowMin,BAL_T.flowMax)*era;
 return {flow:f,why,owner:one,cut,sg,oc};}
/** Gold that stop k of route r brings its controller this season (with the flow fl, default: computed). */
function trdStopVal(r,k,fl){const q=r.stops[k],p=S.prov[q.i],c=p.ctl||p.o;if(fl==null)fl=trdFlow(r).flow;
 let v=r.v*fl*q.w/r.W;
 if(trdHas(q.i,'bedesten'))v*=BAL_T.bedesten;
 if(trdPort(r,k)&&trdArsenal(c))v*=BAL_T.arsenalSea;
 if(trdHas(q.i,'caravan'))v+=BAL_T.toll;
 return v;}
/** Trade income of province i (all routes through it) for whoever controls it. */
function trdProvVal(i){let s=0;for(const m of TRD_AT[i]||[])s+=trdStopVal(m.r,m.k);return s;}
/** Every route's flow and the gold per realm, in one pass: {flows:{id:flow}, by:{f:gold}, rows:{f:[{r,k,i,v}]}} */
function trdAll(){const flows={},by={},rows={};
 for(const r of TRD){const fl=trdFlow(r);flows[r.id]=fl;
  r.stops.forEach((q,k)=>{const p=S.prov[q.i],c=p.ctl||p.o,v=trdStopVal(r,k,fl.flow);by[c]=(by[c]||0)+v;(rows[c]||(rows[c]=[])).push({r,k,i:q.i,v});});}
 return {flows,by,rows};}
/** Trade income of realm f this season. */
function trdIncome(f){let s=0;for(const r of TRD){let fl=null;r.stops.forEach((q,k)=>{const p=S.prov[q.i];if((p.ctl||p.o)!==f)return;if(fl==null)fl=trdFlow(r).flow;s+=trdStopVal(r,k,fl);});}return s;}
ECON_ROWS.push(f=>{const v=trdIncome(f);return v>0.05?[{id:'trade',l:lng('Ticaret yolları','Trade routes'),v,k:'inc',
 tip:lng('Elindeki ticaret duraklarından gelen gümrük ve çarşı vergisi. Savaş ve kuşatma kervanları durdurur; pazarlar ve kervansaraylar yolu canlandırır.','Customs and bazaar dues from the trade stops you hold. War and sieges stop the caravans; markets and caravanserais bring the road to life.')}]:null;});
/* era news: the season a route's fortune turns, the realms on it hear about it */
hook('newTurn',()=>{if(!S||!S.player)return;for(const r of TRD)for(const e of r.era||[])if(S.turn===e.t&&r.stops.some(q=>ctl(q.i)===S.player))news(lng(e.tr,e.en),'info');},60);
KE.trade={routes:()=>TRD.map(r=>({id:r.id,name:tx(r.n),v:r.v,stops:r.stops.map(q=>PD[q.i].key)})),flow:id=>trdFlow(TRD_BY[id]),income:f=>trdIncome(f),all:()=>trdAll(),prov:i=>trdProvVal(i),BAL:BAL_T};
