/* =====================================================================
   HISTORICAL CHAINS (Track C): soft-scripted, conditional event chains.
   CHAINS.push({id,abort?(S,st),stages:[{when(S,st),who?(S,st)->faction|null,
     fire(st)->{t,d,ch:[{l,dis?,f?(st),next?:{stage,delay}|'end'}]},ai?(S,st)->choice index}]})
   State: S.chains[id]={stage,t,data,done,wait}. A stage fires when S.turn>=st.t and when() holds.
   If the deciding faction is the player, a modal asks (and survives a reload); otherwise
   the AI picks ai() (default 0; a disabled choice falls back to the first enabled one).
   A choice without next goes to the following stage; 'end' closes the chain.
   ===================================================================== */
const BAL_CHN={fetihFrom:4,fetihWar:7,hisar:40,hisarMul:1.10,gemi:30,gemiMul:1.15,giust:50,giustMul:1.20,zincir:25,zincirMul:1.10,
 belgradFrom:20,kapMul:1.15,kapGold:40,otlukFrom:84,otlukGold:40,otlukMul:1.15,cemPay:3};
const CHAINS=[];
function chnState(id){return S.chains[id]||(S.chains[id]={stage:0,t:0,data:{},done:false,wait:false});}
const chnNudge=(f,spec)=>{if(typeof aiNudge==='function'&&alive(f))aiNudge(f,{prio:3,until:S.turn+40,...spec});};
const chnOwn=(k,f)=>S.prov[PK[k]].o===f;
function chnUnrest(f,n,turns){const ps=facProvs(f).filter(i=>i!==S.fac[f].cap);for(let k=0;k<n&&ps.length;k++){const i=ps.splice(Math.floor(R()*ps.length),1)[0];S.prov[i].un=Math.max(S.prov[i].un,turns);}}
function chnTick(){if(!S.chains)return;
 for(const C of CHAINS){const st=chnState(C.id);if(st.done||st.wait)continue;
  let ab=false;try{ab=!!(C.abort&&C.abort(S,st));}catch(e){console.error('chain '+C.id,e);ab=true;}
  if(ab){st.done=true;continue;}
  const sg=C.stages[st.stage];if(!sg){st.done=true;continue;}if(S.turn<st.t)continue;
  let ok=false;try{ok=!!sg.when(S,st);}catch(e){console.error('chain '+C.id,e);}
  if(ok)chnFire(C,st);}}
function chnFire(C,st){const sg=C.stages[st.stage],who=sg.who?sg.who(S,st):null;
 if(who&&who===S.player){st.wait=true;chAsk('chain',{id:C.id,stage:st.stage});return;}
 const spec=sg.fire(st);let k=sg.ai?sg.ai(S,st):0;if(!spec.ch[k]||spec.ch[k].dis){k=spec.ch.findIndex(c=>!c.dis);if(k<0)k=spec.ch.length-1;}
 chnChoose(C,st,k,spec);}
function chnChoose(C,st,k,spec){const c=spec.ch[k]||spec.ch[0];st.wait=false;
 try{if(c.f)c.f(st);}catch(e){console.error('chain '+C.id,e);}
 const nx=c.next||{stage:st.stage+1,delay:0};
 if(nx==='end'||!C.stages[nx.stage]){st.done=true;return;}st.stage=nx.stage;st.t=S.turn+(nx.delay||0);}
CH_PEND.chain=({id,stage})=>{const C=CHAINS.find(x=>x.id===id),st=S.chains[id];if(!C||!st||st.done||st.stage!==stage){if(st)st.wait=false;return null;}
 const spec=C.stages[stage].fire(st);return {t:spec.t,d:spec.d,ch:spec.ch.map((c,k)=>({l:c.l,dis:c.dis,f:()=>chnChoose(C,st,k,spec)}))};};
hook('newTurn',()=>chnTick(),21);

/* ---------- 1453: Konstantiniyye ---------- */
CHAINS.push({id:'fetih',abort:S=>!alive('OSM')||!alive('BYZ')||!chnOwn('istanbul','BYZ'),stages:[
 {when:S=>S.turn>=BAL_CHN.fetihFrom,who:()=>'OSM',ai:S=>S.fac.OSM.gold>=BAL_CHN.hisar?0:1,fire:st=>({t:'Boğazkesen Hisarı',
   d:'Sultan, Boğaz\'ın Avrupa yakasında, Anadolu Hisarı\'nın karşısına bir hisar yaptırmak istiyor. Hisar bitince Karadeniz\'den Konstantiniyye\'ye gelecek yardım kesilecek.',
   ch:[{l:`Hisarı yaptır (−${BAL_CHN.hisar} altın; Konstantiniyye\'ye saldırıda +10%)`,dis:S.fac.OSM.gold<BAL_CHN.hisar,next:{stage:1,delay:2},f:st=>{S.fac.OSM.gold-=BAL_CHN.hisar;st.data.hisar=1;chnNudge('OSM',{war:'BYZ',target:PK.istanbul});
      news('Osmanlı, Boğaz\'ın Avrupa yakasında Boğazkesen Hisarı\'nı yükseltiyor. Konstantiniyye\'nin Karadeniz yolu kesildi.',S.player==='BYZ'?'war':'info');}},
    {l:'Acele etme (kuşatma bir yıl gecikir)',next:{stage:0,delay:6},f:()=>{}}]})},
 {when:S=>S.turn>=BAL_CHN.fetihWar&&!inTruce('OSM','BYZ'),who:()=>'OSM',fire:st=>({t:'Konstantiniyye Seferi',
   d:'Urban\'ın dev topları Edirne\'den yola çıkmaya hazır. Divan, bin yıllık şehrin surlarına yürümek için sultanın emrini bekliyor.',
   ch:[{l:'Savaş ilan et ve surlara yürü',next:{stage:2,delay:0},f:st=>{if(!atWar('OSM','BYZ'))declareWar('OSM','BYZ');st.data.war=S.turn;chnNudge('OSM',{war:'BYZ',target:PK.istanbul,prio:5});}},
    {l:'Bir yıl daha bekle',next:{stage:1,delay:4},f:()=>{}}]})},
 {when:S=>atWar('OSM','BYZ'),who:()=>'BYZ',ai:S=>S.fac.BYZ.gold>=BAL_CHN.giust?0:S.fac.BYZ.gold>=BAL_CHN.zincir?1:2,fire:st=>({t:'Cenevizli Giustiniani',
   d:'Cenevizli kumandan Giovanni Giustiniani Longo, 700 askerle Haliç\'e geldi. Surların savunmasını üstlenmeye hazır, ama ücret istiyor. Haliç\'in ağzına demir bir zincir germek de mümkün.',
   ch:[{l:`Giustiniani\'yi tut (−${BAL_CHN.giust} altın; o yaşadıkça surlarda savunma +20%)`,dis:S.fac.BYZ.gold<BAL_CHN.giust,f:st=>{S.fac.BYZ.gold-=BAL_CHN.giust;
      const g=chCreate({n:'Giovanni Giustiniani',f:'BYZ',role:'gen',born:1418,hd:1453,skill:3,dyn:'Giustiniani'});S.fac.BYZ.gens.push(g.id);st.data.giust=g.id;news('Giustiniani, Theodosius surlarının savunmasını üstlendi.',S.player==='OSM'?'war':'info');}},
    {l:`Haliç\'e zincir ger (−${BAL_CHN.zincir} altın; surlarda savunma +10%)`,dis:S.fac.BYZ.gold<BAL_CHN.zincir,f:st=>{S.fac.BYZ.gold-=BAL_CHN.zincir;st.data.zincir=1;news('Haliç\'in ağzına demir zincir gerildi.',S.player==='OSM'?'war':'info');}},
    {l:'Hazineyi koru, surlara güven',f:()=>{}}]})},
 {when:S=>atWar('OSM','BYZ'),who:()=>'OSM',ai:S=>S.fac.OSM.gold>=BAL_CHN.gemi?0:1,fire:st=>({t:'Gemiler Karadan Yürüdü',
   d:st.data.zincir?'Zincir Haliç\'i kapatıyor. Mimarlar, gemileri yağlanmış kızaklarla Galata sırtlarından aşırıp Haliç\'e indirmeyi öneriyor.':'Haliç\'in surları zayıf. Mimarlar, gemileri kızaklarla Galata sırtlarından aşırıp Haliç\'e indirmeyi öneriyor.',
   ch:[{l:`Gemileri karadan yürüt (−${BAL_CHN.gemi} altın; Konstantiniyye\'ye saldırıda +15%, zincir işe yaramaz)`,dis:S.fac.OSM.gold<BAL_CHN.gemi,f:st=>{S.fac.OSM.gold-=BAL_CHN.gemi;st.data.gemi=1;
      news('Osmanlı gemileri bir gecede karadan yürüyerek Haliç\'e indi!',S.player==='BYZ'?'war':'cap');}},
    {l:'Kara surlarına yüklen',f:()=>{}}]})},
 {when:S=>!atWar('OSM','BYZ'),fire:st=>({t:'',d:'',ch:[{l:'',next:{stage:1,delay:12},f:st=>{st.data.tries=(st.data.tries||0)+1;if(st.data.tries>=3)st.done=true;
   news('Osmanlı kuşatması kaldırıldı; Konstantiniyye bir kez daha ayakta kaldı.',S.player==='BYZ'||S.player==='OSM'?'good':'info');}}]})}]});

/* ---------- 1456: Belgrad ---------- */
CHAINS.push({id:'belgrad',abort:S=>!alive('OSM')||!alive('HUN')||!chnOwn('belgrad','HUN'),stages:[
 {when:S=>S.turn>=BAL_CHN.belgradFrom&&!inTruce('OSM','HUN')&&!atWar('OSM','BYZ'),who:()=>'OSM',ai:S=>strength('OSM')>strength('HUN')*1.2?0:1,fire:st=>({t:'Belgrad Seferi',
   d:'Sultan, Macarların Tuna\'daki kilidi Belgrad\'a yürümek istiyor. Kale düşerse Macar ovası açılacak.',
   ch:[{l:'Belgrad\'a yürü (Macarlara savaş ilan et)',next:{stage:1,delay:0},f:()=>{if(!atWar('OSM','HUN'))declareWar('OSM','HUN');chnNudge('OSM',{war:'HUN',target:PK.belgrad});}},
    {l:'Tuna\'yı şimdilik rahat bırak',next:{stage:0,delay:8},f:()=>{}}]})},
 {when:S=>atWar('OSM','HUN'),who:()=>'HUN',fire:st=>({t:'Kapistran\'ın Haçlıları',
   d:'Yaşlı rahip Giovanni da Capistrano, vaazlarıyla binlerce köylüyü Belgrad\'ı savunmak için topladı. Kaleye alınabilirler; ama silahsız ve disiplinsizler. Ya da paralı askerler tutulabilir.',
   ch:[{l:'Haçlıları kaleye al (Belgrad\'a +3.000 asker; 2 eyalet 4 tur huzursuz)',next:{stage:2,delay:3},f:st=>{evTroops('HUN',PK.belgrad,3000);chnUnrest('HUN',2,4);}},
    {l:`Paralı asker tut (−${BAL_CHN.kapGold} altın; Belgrad\'da savunma +15%, 8 tur)`,dis:S.fac.HUN.gold<BAL_CHN.kapGold,next:{stage:2,delay:3},f:st=>{S.fac.HUN.gold-=BAL_CHN.kapGold;st.data.par=S.turn+8;}},
    {l:'Kalenin surlarına güven',next:{stage:2,delay:3},f:()=>{}}]})},
 {when:()=>true,fire:st=>({t:'',d:'',ch:[{l:'',next:'end',f:()=>{const h=chBySeed('HUN','hunyadi');
   news('Papa\'nın emriyle öğle çanları Belgrad\'ın savunucuları için çalıyor.','info');if(chLive(h)&&R()<.6)chKill(h,'plague');}}]})}]});

/* ---------- 1473: Otlukbeli ---------- */
CHAINS.push({id:'otlukbeli',abort:S=>!alive('OSM')||!alive('AKK'),stages:[
 {when:S=>S.turn>=BAL_CHN.otlukFrom&&!inTruce('OSM','AKK')&&!atWar('OSM','AKK'),who:()=>'AKK',ai:S=>strength('AKK')>=strength('OSM')*.35?0:1,fire:st=>({t:'Venedik Elçileri',
   d:`Venedik elçisi Caterino Zeno, ${rulerName('AKK')}\'ın sarayında: Cumhuriyet, Osmanlı\'ya karşı birlikte savaşmayı ve top göndermeyi teklif ediyor.`,
   ch:[{l:'İttifakı kabul et, Osmanlı\'ya savaş aç (Venedik topları gelir)',next:{stage:1,delay:2},f:()=>{S.fac.AKK.cannon=1;
      if(alive('VEN')&&!atWar('AKK','VEN')&&!isAlly('AKK','VEN')){S.ally[key('AKK','VEN')]=true;addLog('Akkoyunlu ile Venedik Osmanlı\'ya karşı ittifak kurdu.');}
      declareWar('AKK','OSM');chnNudge('AKK',{war:'OSM'});}},
    {l:'Osmanlı ile barışı koru (−20 altın hediye; ilişki +20)',dis:S.fac.AKK.gold<20,next:'end',f:()=>{S.fac.AKK.gold-=20;addOp('AKK','OSM',20);}}]})},
 {when:S=>atWar('OSM','AKK'),who:()=>'OSM',ai:S=>S.fac.OSM.gold>=BAL_CHN.otlukGold?0:1,fire:st=>({t:'Otlukbeli',
   d:`${rulerName('AKK')}\'ın Türkmen süvarileri Fırat boyunda. Sultan ordusunu toplar ve tüfekli yeniçerilerle doğuya sürebilir ya da sınırı tutup düşmanı yıpratabilir.`,
   ch:[{l:`Topları ve tüfekleri öne sür (−${BAL_CHN.otlukGold} altın; Akkoyunlu\'ya saldırıda +15%, 8 tur)`,dis:S.fac.OSM.gold<BAL_CHN.otlukGold,next:'end',f:st=>{S.fac.OSM.gold-=BAL_CHN.otlukGold;st.data.top=S.turn+8;chnNudge('OSM',{war:'AKK',target:S.fac.AKK.cap});}},
    {l:'Sınırı tut, onları yıprat (Akkoyunlu\'ya karşı savunmada +15%, 8 tur)',next:'end',f:st=>{st.data.def=S.turn+8;}}]})}]});

/* ---------- 1481: Cem Sultan (armed by the Ottoman succession when two sons live) ---------- */
function chnHost(){for(const g of ['RHO','PAP','MAM','VEN'])if(alive(g))return g;return null;}
CHAINS.push({id:'cem',abort:S=>!alive('OSM'),stages:[
 {when:(S,st)=>st.data.cem!=null&&chLive(S.chars[st.data.cem])&&S.chars[st.data.cem].role!=='claimant',who:()=>'OSM',fire:st=>{const c=S.chars[st.data.cem]||{n:'Şehzade'},h=chnHost();
   return {t:'Cem Sultan Meselesi',d:`Şehzade ${c.n}, kardeşi ${rulerName('OSM')}\'a karşı tahta göz dikti; Bursa\'da kendi adına hutbe okutuyor. Anadolu beyleri ikiye bölündü.`,
    ch:[{l:`Kardeşini yen ve sürgüne gönder (${h?FAC[h].s+' onu rehin tutar, her tur nafaka ödersin; ':''}2 eyalet 4 tur huzursuz)`,next:'end',f:st=>{const x=S.chars[st.data.cem];if(x){x.role='claimant';x.host=h;}st.data.host=h;chnUnrest('OSM',2,4);
       news(h?`Şehzade ${c.n} yenildi ve ${FAC[h].s} elinde rehin kaldı.`:`Şehzade ${c.n} yenildi ve sürgüne gitti.`,S.player==='OSM'?'war':'info');}},
     {l:'Taht için kardeşini feda et (3 eyalet 8 tur huzursuz)',next:'end',f:st=>{const x=S.chars[st.data.cem];chnUnrest('OSM',3,8);if(x)chKill(x,'executed');}}]};}}]});
hook('succession',(f,old,neu)=>{if(f!=='OSM'||!old||!S.chains)return;const st=chnState('cem');if(st.done||st.data.cem!=null)return;
 const L=Object.values(S.chars).filter(c=>c.f==='OSM'&&chLive(c)&&c.par===old.id&&c.id!==neu.id&&chAge(c)>=16&&(c.role==='kin'||c.role==='heir'));
 if(!L.length)return;L.sort((a,b)=>((b.sk==='cem')-(a.sk==='cem'))||(a.born-b.born));st.data.cem=L[0].id;st.t=S.turn;},60);
ECON_ROWS.push(f=>{if(!S.chains||!S.chains.cem)return null;const d=S.chains.cem.data,c=d&&S.chars[d.cem];
 if(!d.host||!chLive(c)||c.role!=='claimant'||!alive(d.host)||!alive('OSM'))return null;
 if(f==='OSM')return [{id:'ch-cem',l:`Cem Sultan\'ın nafakası (${FAC[d.host].s})`,v:BAL_CHN.cemPay,k:'exp'}];
 if(f===d.host)return [{id:'ch-cem',l:'Rehin şehzadenin nafakası',v:BAL_CHN.cemPay,k:'inc'}];return null;});

/* ---------- chain modifiers in battle ---------- */
BATTLE_MODS.push(ctx=>{if(!S.chains||ctx.to==null)return null;const out=[];
 if(ctx.to===PK.istanbul&&S.chains.fetih){const d=S.chains.fetih.data;
  if(ctx.att==='OSM'){if(d.hisar)out.push({l:'Boğazkesen Hisarı',m:BAL_CHN.hisarMul,side:'att',k:'chain'});if(d.gemi)out.push({l:'Gemiler Haliç\'te',m:BAL_CHN.gemiMul,side:'att',k:'chain'});}
  if(S.prov[ctx.to].o==='BYZ'){const g=d.giust!=null&&S.chars[d.giust];if(chLive(g)&&g.cap==null)out.push({l:'Giustiniani surlarda',m:BAL_CHN.giustMul,side:'def',k:'chain'});
   if(d.zincir&&!d.gemi)out.push({l:'Haliç zinciri',m:BAL_CHN.zincirMul,side:'def',k:'chain'});}}
 if(ctx.to===PK.belgrad&&S.chains.belgrad&&S.prov[ctx.to].o==='HUN'&&(S.chains.belgrad.data.par||0)>S.turn)out.push({l:'Paralı askerler',m:BAL_CHN.kapMul,side:'def',k:'chain'});
 const o=S.chains.otlukbeli;if(o){const def=S.prov[ctx.to].o;
  if(ctx.att==='OSM'&&def==='AKK'&&(o.data.top||0)>S.turn)out.push({l:'Osmanlı topçusu',m:BAL_CHN.otlukMul,side:'att',k:'chain'});
  if(ctx.att==='AKK'&&def==='OSM'&&(o.data.def||0)>S.turn)out.push({l:'Sınır boyu savunması',m:BAL_CHN.otlukMul,side:'def',k:'chain'});}
 return out.length?out:null;});
KE.CHAINS=CHAINS;
