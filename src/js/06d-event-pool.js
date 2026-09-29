/* =====================================================================
   EVENT POOL (Track C): random events for the player's realm. Every choice
   costs something; none is a free "take the gold". Gold scales with the
   realm's development without barracks (evDev, bug B5).
   ===================================================================== */
/** Add troops the way the current rules allow: into an army when field armies exist (Track B), else the garrison. */
function evTroops(f,i,n){n=Math.round(n/100)*100;if(n<=0)return;const F=S.fac[f];
 if(typeof armyCap==='function'){const a=armyAt(i,f)[0];if(a){a.n+=n;return;}if(armyList(f).length<armyCap(f)){armyCreate(f,i,n);return;}F.mp+=n;return;}
 S.prov[i].t+=n;}
const evCut=(i,fr)=>{const p=S.prov[i];p.t=Math.max(0,Math.round(p.t*(1-fr)/100)*100);};
const evUnrest=(i,n)=>{S.prov[i].un=Math.max(S.prov[i].un,n);};
const evPay=(F,v)=>{F.gold=Math.max(0,F.gold-v);};
const evOthers=(ctx,n)=>{const L=ctx.mine.filter(i=>i!==ctx.cap);const out=[];const r=L.slice();for(let k=0;k<n&&r.length;k++)out.push(r.splice(Math.floor(ctx.rng()*r.length),1)[0]);return out;};
const evNaval=['VEN','GEN','RHO','CYP','ARA','PAP','HAF','OSM','MAM','BYZ','TRB','KRM'];
const evTurkish=['OSM','KAR','CAN','DUL','AKK','KKY','SAF'];

EVENTS.push(
 {id:'kervan',w:3,cd:20,build:c=>{const a=c.mid,k=Math.round(a*.6),[o]=evOthers(c,1);
  return {t:c.isM?'İpek Yolu Kervanı':'Levanten Tüccarlar',d:c.isM?`Doğudan gelen zengin bir kervan ${c.capn} pazarında konakladı. Gümrük emini ne kadar vergi alınacağını soruyor.`:`Venedikli ve Cenevizli tüccarlar ${c.capn} limanında ticaret izni istiyor.`,
   ch:[{l:`Ağır gümrük koy (+${a} altın; tüccarlar küser, ${c.capn}${o!=null?' ve '+PD[o].name:''} 3 tur huzursuz)`,f:()=>{c.F.gold+=a;evUnrest(c.cap,3);if(o!=null)evUnrest(o,3);}},
    {l:`Kervansaray yaptır (−${k} altın; ${c.capn} gelişimi +1)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);const p=S.prov[c.cap];if(p.dev<12)p.dev++;}}]};}},
 {id:'veba',w:2,cd:24,build:c=>{const q=c.small+10;
  return {t:'Veba Salgını',d:`${c.pn} eyaletinde kara ölüm baş gösterdi. Hekimler şehrin kapılarının kapatılmasını istiyor.`,
   ch:[{l:`Karantina uygula (−${q} altın; ${c.pn} garnizonu −10%)`,dis:c.F.gold<q,f:()=>{evPay(c.F,q);evCut(c.p,.1);}},
    {l:`Kaderine bırak (${c.pn} gelişimi −1, garnizonu −35%)`,f:()=>{const p=S.prov[c.p];p.dev=Math.max(1,p.dev-1);evCut(c.p,.35);}}]};}},
 {id:'hasat',w:3,cd:20,build:c=>{const a=c.mid,m=Math.max(1000,Math.round(evDev(c.f)*80/100)*100),k=Math.round(a*.4);
  return {t:'Bereketli Hasat',d:'Ambarlar doldu. Fazla buğday satılabilir ya da köylerden gelen gençler beslenip orduya yazılabilir.',
   ch:[{l:`Fazlayı tüccarlara sat (+${a} altın; köyler kışa hazırlıksız, insan gücü −15%)`,f:()=>{c.F.gold+=a;c.F.mp=Math.round(c.F.mp*.85);}},
    {l:`Gönüllüleri yaz (+${fmtK(m)} insan gücü; teçhizatları −${k} altın)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);c.F.mp+=m;}}]};}},
 {id:'alim',w:2,cd:24,build:c=>{const k=30+c.small;
  return {t:c.isM?'Gezgin Âlim':'Hümanist Bilgin',d:c.isM?'Semerkant\'tan gelen ünlü bir âlim başkentinde medrese açmak istiyor.':'İtalya\'dan gelen bir bilgin başkentinde kütüphane kurmak istiyor.',
   ch:[{l:`Himaye et (−${k} altın; ${c.capn} gelişimi +1)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);const p=S.prov[c.cap];if(p.dev<12)p.dev++;}},
    {l:'Nazikçe geri çevir (hazine korunur, bilgin başka bir saraya gider)'}]};}},
 {id:'paralı',w:2,cd:20,build:c=>{const k=40+Math.round(evDev(c.f)*.2),n=3000;
  return {t:c.isM?'Akıncı Beyleri':'Paralı Askerler',d:c.isM?'Sınır boylarından akıncı beyleri hizmet teklif ediyor.':'Bir condottiere bölüğü ücret karşılığı hizmet teklif ediyor.',
   ch:[{l:`Kirala (−${k} altın; ${c.capn} yakınına +${fmtK(n)} asker)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);evTroops(c.f,c.cap,n);}},
    {l:'Gerek yok (hazine korunur)'}]};}},
 {id:'deprem',w:1,cd:30,build:c=>{const q=20+c.small,p=S.prov[c.p];
  return {t:'Deprem',d:`${c.pn} sarsıldı; ${p.fort>0?'kale burçlarında çatlaklar var':'evler ve çarşı yıkıldı'}.`,
   ch:[{l:`Hemen onar (−${q} altın)`,dis:c.F.gold<q,f:()=>{evPay(c.F,q);}},
    {l:p.fort>0?`Bekle (${c.pn} kalesi −1)`:`Bekle (${c.pn} gelişimi −1)`,f:()=>{const x=S.prov[c.p];if(x.fort>0)x.fort--;else x.dev=Math.max(1,x.dev-1);}}]};}},
 {id:'kis',w:(S)=>S.turn%4===3?3:0,cd:20,build:c=>{const q=15+c.small;
  return {t:'Sert Kış',d:'Yollar karla kapandı, köylerde kıtlık var.',
   ch:[{l:`Ambarları aç (−${q} altın)`,dis:c.F.gold<q,f:()=>{evPay(c.F,q);}},{l:'Dayanın (insan gücü −30%)',f:()=>{c.F.mp=Math.round(c.F.mp*.7);}}]};}},
 {id:'ayaklanma',w:4,cd:18,req:(S,f)=>facProvs(f).some(i=>S.prov[i].un>0),build:c=>{if(!c.un.length)return null;const q=c.pick(c.un),k=30+c.small;
  return {t:'Ayaklanma',d:`${PD[q].name} halkı ağır vergilere karşı ayaklandı.`,
   ch:[{l:`Bastır (${PD[q].name} garnizonu −25%, huzursuzluk kısalır)`,f:()=>{evCut(q,.25);S.prov[q].un=Math.max(0,S.prov[q].un-3);}},
    {l:`Vergi affı ilan et (−${k} altın; huzursuzluk biter)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);S.prov[q].un=0;}}]};}},
 {id:'elci',w:2,cd:20,req:(S,f)=>FK.some(g=>g!==f&&alive(g)&&!atWar(f,g)),build:c=>{const L=FK.filter(g=>g!==c.f&&alive(g)&&!atWar(c.f,g));if(!L.length)return null;const g=c.pick(L),a=20+c.small,k=20;
  return {t:`${FAC[g].s} Elçisi`,d:`${FAC[g].n} elçisi, ${rulerName(g)} adına hediyelerle sarayına geldi. Görgü kuralları karşılık vermeni gerektiriyor.`,
   ch:[{l:`Hediyeleri al, karşılık verme (+${a} altın; ${FAC[g].s} ile ilişki −10)`,f:()=>{c.F.gold+=a;addOp(c.f,g,-10);}},
    {l:`Cömertçe karşılık ver (−${k} altın; ${FAC[g].s} ile ilişki +25)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);addOp(c.f,g,25);}}]};}},
 {id:'novobrdo',w:3,cd:30,req:(S,f)=>S.prov[PK.novobirda].o===f,build:c=>{const i=PK.novobirda,a=c.mid+20,k=25;
  return {t:'Novobırda Gümüş Madenleri',d:'Sakson ustaların işlettiği Novobırda madenleri Balkanların en zengin gümüşünü çıkarıyor. Hazine madeni doğrudan işletmek istiyor.',
   ch:[{l:`Madeni devlete bağla (+${a} altın; Novobırda 4 tur huzursuz)`,f:()=>{c.F.gold+=a;evUnrest(i,4);}},
    {l:`Madencilere imtiyaz ver (−${k} altın; Novobırda gelişimi +1)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);if(S.prov[i].dev<12)S.prov[i].dev++;}}]};}},
 {id:'tolfa',w:3,cd:30,req:(S,f)=>S.prov[PK.roma].o===f&&chYear()>=1462,build:c=>{const a=c.mid+30;
  return {t:'Tolfa\'nın Şap Madeni',d:'Roma yakınındaki Tolfa\'da zengin bir şap yatağı bulundu. Kumaş boyacılığının vazgeçilmezi şap, şimdiye dek Türk topraklarından geliyordu.',
   ch:[{l:`Tekel ilan et (+${a} altın; Venedik ve Ceneviz ile ilişki −15)`,f:()=>{c.F.gold+=a;['VEN','GEN'].forEach(g=>{if(g!==c.f&&alive(g))addOp(c.f,g,-15);});}},
    {l:`Madeni bankerlere kirala (+${Math.round(a/2)} altın; ilişkiler bozulmaz)`,f:()=>{c.F.gold+=Math.round(a/2);}}]};}},
 {id:'sapboykot',w:2,cd:30,req:(S,f)=>FAC[f].rel==='Katolik'&&f!=='PAP'&&alive('PAP')&&chYear()>=1463,build:c=>{const a=c.small+10,k=c.small;
  return {t:'Türk Şapı Yasağı',d:'Papa, Hıristiyan tüccarların Türk şapı almasını yasakladı ve Tolfa şapını öneriyor. Ama Türk şapı çok daha ucuz.',
   ch:[{l:`Yasağa uy (−${k} altın; Papalık ile ilişki +20)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);addOp(c.f,'PAP',20);}},
    {l:`Ucuz Türk şapını al (+${a} altın; Papalık ile ilişki −20)`,f:()=>{c.F.gold+=a;addOp(c.f,'PAP',-20);}}]};}},
 {id:'bedreddin',w:2,cd:30,req:(S,f)=>evTurkish.includes(f),build:c=>{const k=20+c.small,m=Math.max(1000,Math.round(evDev(c.f)*40/100)*100);
  return {t:'Bedreddin\'in Mirası',d:`${c.pn} köylerinde Şeyh Bedreddin\'in müritleri malın ortak olduğunu vaaz ediyor. Kadılar tedirgin, köylüler dervişlere akın ediyor.`,
   ch:[{l:`Şeyhleri sürgün et (${c.pn} 4 tur huzursuz)`,f:()=>{evUnrest(c.p,4);}},
    {l:`Tekkelere vakıf bağla (−${k} altın; dervişler gaziler arasına katılır, +${fmtK(m)} insan gücü)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);c.F.mp+=m;}}]};}},
 {id:'birlik',w:4,cd:40,once:1,req:(S,f)=>FAC[f].rel==='Ortodoks'&&chYear()<1461,build:c=>{const m=Math.max(1000,Math.round(evDev(c.f)*60/100)*100);
  return {t:'Kilise Birliği Çekişmesi',d:'Floransa\'da imzalanan Kilise Birliği halkı ikiye böldü. Latinler yardım için Birliğin ilanını bekliyor; keşişler ve halk ise "Latin külahındansa Türk sarığı yeğdir" diyor.',
   ch:[{l:`Birliği ilan et (Venedik ve Papalık ile ilişki +20; ${c.capn} 4 tur huzursuz)`,f:()=>{['VEN','PAP'].forEach(g=>{if(alive(g))addOp(c.f,g,20);});evUnrest(c.cap,4);}},
    {l:`Ortodoks halkın yanında dur (Venedik ve Papalık ile ilişki −15; +${fmtK(m)} gönüllü insan gücü)`,f:()=>{['VEN','PAP'].forEach(g=>{if(alive(g))addOp(c.f,g,-15);});c.F.mp+=m;}}]};}},
 {id:'bahsis',w:0,cd:0,req:(S,f)=>f==='OSM',build:c=>{const k=Math.max(30,Math.round(evDev(c.f)*.4)),r=chRuler(c.f);
  return {t:'Cülus Bahşişi',d:`Yeniçeriler, ${r?r.rn||r.n:'yeni padişah'} tahta çıkınca âdet olan cülus bahşişini istiyor. Vermezsen kışlalarda kazan kaldırabilirler.`,
   ch:[{l:`Bahşişi dağıt (−${k} altın)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);}},
    {l:`Reddet (${c.capn} garnizonu −25%, 4 tur huzursuz)`,f:()=>{evCut(c.cap,.25);evUnrest(c.cap,4);}}]};}},
 {id:'veba64',w:5,cd:0,once:1,req:(S,f)=>{const y=chYear();return y>=1464&&y<=1467;},build:c=>evPlague(c,'Büyük Veba','Balkanlardan Anadolu\'ya yayılan büyük veba salgını şehirleri boşaltıyor. Saray ne yapacağını tartışıyor.')},
 {id:'veba90',w:5,cd:0,once:1,req:(S,f)=>{const y=chYear();return y>=1490&&y<=1493;},build:c=>evPlague(c,'Veba Yeniden','Veba bir kez daha limanlardan içerilere yayıldı. Divan başkentte mi kalmalı, yoksa yaylaya mı çekilmeli?')},
 {id:'entrika',w:2,cd:30,req:(S,f)=>{const r=chRuler(f),h=chHeir(f);return !!r&&!!h&&chAge(r)>=45&&chAge(h)>=18;},build:c=>{const r=chRuler(c.f),h=chHeir(c.f);if(!r||!h)return null;const k=20+c.small;
  return {t:'Saray Entrikası',d:`Bazı vezirler ve beyler, yaşlanan ${r.rn||r.n} yerine ${chLabel(h)} etrafında toplanıyor. Saray fısıltılarla dolu.`,
   ch:[{l:`Veliahtı uzak bir sancağa gönder (−${k} altın masraf)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);}},
    {l:`Hizbi dağıt, vezirleri azlet (${c.capn} 3 tur huzursuz)`,f:()=>{evUnrest(c.cap,3);}}]};}},
 {id:'komutan',w:2,cd:24,req:(S,f)=>chGenerals(f).some(g=>g.skill<5&&g.cap==null),build:c=>{const L=chGenerals(c.f).filter(g=>g.skill<5&&g.cap==null);if(!L.length)return null;const g=c.pick(L),k=25+c.small;
  return {t:'Komutanın Dileği',d:`${g.n} sadakatinin karşılığında kendisine geniş bir dirlik verilmesini istiyor.`,
   ch:[{l:`Dirliği ver (−${k} altın; ${g.n} kabiliyeti +1)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);const x=S.chars[g.id];if(x)x.skill=Math.min(5,x.skill+1);}},
    {l:`Reddet (${g.n} küser, kabiliyeti −1)`,f:()=>{const x=S.chars[g.id];if(x)x.skill=Math.max(1,x.skill-1);}}]};}},
 {id:'evlilik',w:2,cd:30,req:(S,f)=>{const h=chHeir(f);return !!h&&chAge(h)>=14&&chAge(h)<=35&&FK.some(g=>g!==f&&alive(g)&&!atWar(f,g)&&getOp(f,g)>=0);},build:c=>{
  const h=chHeir(c.f);if(!h)return null;const L=FK.filter(g=>g!==c.f&&alive(g)&&!atWar(c.f,g)&&getOp(c.f,g)>=0);if(!L.length)return null;
  const same=L.filter(g=>FAC[g].rel===c.rel);const g=(c.f==='TRB'&&L.includes('AKK'))?'AKK':(c.f==='AKK'&&L.includes('TRB'))?'TRB':c.pick(same.length?same:L);const k=25+c.small;
  return {t:'Evlilik Teklifi',d:(c.f==='AKK'&&g==='TRB')||(c.f==='TRB'&&g==='AKK')?'Trabzon sarayı ile Akkoyunlular arasında bir düğün konuşuluyor; tıpkı Despina Hatun ile Uzun Hasan\'ın evliliği gibi.':`${FAC[g].n}, ${chLabel(h)} için bir evlilik teklif ediyor. Düğün pahalı, ama iki saray arasında bağ kurar.`,
   ch:[{l:`Düğünü yap (−${k} altın; ${FAC[g].s} ile ilişki +30)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);addOp(c.f,g,30);if(getOp(c.f,g)>=60&&!atWar(c.f,g)&&!isAlly(c.f,g)){S.ally[key(c.f,g)]=true;news(`${FAC[g].s} ile evlilik ittifakı kuruldu.`,'good');}}},
    {l:`Teklifi geri çevir (${FAC[g].s} ile ilişki −15)`,f:()=>{addOp(c.f,g,-15);}}]};}},
 {id:'korsan',w:2,cd:24,req:(S,f)=>evNaval.includes(f),build:c=>{const k=20+c.small;
  return {t:'Korsan Baskını',d:`Korsan gemileri ${c.pn} kıyılarını yağmalıyor; köyler boşalıyor.`,
   ch:[{l:`Kadırga filosu gönder (−${k} altın)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);}},
    {l:`Kıyıyı kendi hâline bırak (${c.pn} gelişimi −1)`,f:()=>{const p=S.prov[c.p];p.dev=Math.max(1,p.dev-1);}}]};}},
 {id:'sinir',w:2,cd:20,req:(S,f)=>warsOf(f).length>0,build:c=>{const front=c.mine.filter(i=>PD[i].adj.some(j=>atWar(c.f,S.prov[j].o)));if(!front.length)return null;const i=c.pick(front),a=c.small+10,k=20+c.small;
  return {t:'Sınır Akını',d:`Düşman akıncıları ${PD[i].name} köylerine baskın yaptı. Beyler karşılık vermek için izin istiyor.`,
   ch:[{l:`Karşı akın düzenle (+${a} altın ganimet; ${PD[i].name} garnizonu −10%)`,f:()=>{c.F.gold+=a;evCut(i,.1);}},
    {l:S.prov[i].fort<4?`Kaleyi tahkim et (−${k} altın; ${PD[i].name} kalesi +1)`:`Surları onar (−${k} altın)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);if(S.prov[i].fort<4)S.prov[i].fort++;}}]};}},
 {id:'hac',w:2,cd:30,req:(S,f)=>f==='MAM'||f==='OSM'||f==='HAF',build:c=>{const k=20+c.small;
  return {t:'Hac Kervanı',d:'Hac kervanı yola çıkıyor. Bedevi saldırılarına karşı muhafız ve su kuyuları için para gerekiyor.',
   ch:[{l:`Kervanı koru (−${k} altın; Müslüman devletlerle ilişki +10)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);FK.forEach(g=>{if(g!==c.f&&alive(g)&&FAC[g].rel==='İslam')addOp(c.f,g,10);});}},
    {l:`Kervanı kendi hâline bırak (${c.capn} 2 tur huzursuz)`,f:()=>{evUnrest(c.cap,2);}}]};}},
 {id:'matbaa',w:2,cd:0,once:1,req:(S,f)=>FAC[f].rel==='Katolik'&&chYear()>=1470,build:c=>{const k=30+c.small;
  return {t:'Matbaacılar',d:'Alman ustalar hareketli harflerle kitap basan bir matbaa kurmak istiyor. Kâtipler loncası ise buna karşı.',
   ch:[{l:`Himaye et (−${k} altın; ${c.capn} gelişimi +1)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);const p=S.prov[c.cap];if(p.dev<12)p.dev++;}},
    {l:'Loncayı dinle (hazine korunur, yenilik kaçar)'}]};}}
);
function evPlague(c,t,d){const k=25+c.small;
 return {t,d,ch:[{l:`Saray yaylaya çekilsin (−${k} altın; insan gücü −10%)`,dis:c.F.gold<k,f:()=>{evPay(c.F,k);c.F.mp=Math.round(c.F.mp*.9);}},
  {l:`Divan başkentte kalsın (${c.capn} gelişimi −1; hükümdar hastalanabilir)`,f:()=>{const p=S.prov[c.cap];p.dev=Math.max(1,p.dev-1);const r=chRuler(c.f);if(r&&R()<.35&&!r.traits.includes('hasta')){r.traits.push('hasta');news(`${r.rn||r.n} vebaya yakalandı; sağlığı bozuldu.`,'war');}}}]};}
/* The janissaries ask their accession gift whenever an Ottoman player's sultan comes to the throne. */
hook('succession',(f,old,neu)=>{if(f===S.player&&f==='OSM'&&old)evFire('bahsis');});
