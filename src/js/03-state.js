/* =====================================================================
   GAME STATE
   ===================================================================== */
const SEASONS=['İlkbahar','Yaz','Sonbahar','Kış'];
const START_YEAR=1451,END_TURN=(1531-1451)*4;
const RC=12,UPK=1,SAVE='kizil-elma-1451-v1';
let S=null;
const key=(a,b)=>a<b?a+'|'+b:b+'|'+a;
const atWar=(a,b)=>!!S.war[key(a,b)];
const isAlly=(a,b)=>!!S.ally[key(a,b)];
const inTruce=(a,b)=>(S.truce[key(a,b)]||0)>S.turn;
const getOp=(a,b)=>S.op[key(a,b)]||0;
const addOp=(a,b,v)=>{S.op[key(a,b)]=clamp(getOp(a,b)+v,-100,100);};
const dateStr=t=>`${SEASONS[t%4]} ${START_YEAR+Math.floor(t/4)}`;
const alive=f=>S.fac[f]&&S.fac[f].alive;
const fname=f=>FAC[f].s;
const fmtK=n=>{n=Math.max(0,Math.round(n));return n>=10000?Math.round(n/1000)+'k':(Math.round(n/100)/10).toFixed(1).replace('.0','')+'k';};
const rnd=(a,b)=>a+Math.random()*(b-a);

const HIST=[['BYZ','OSM',-45],['KAR','OSM',-35],['HUN','OSM',-50],['ALB','OSM',-70],['AKK','KKY',-70],['GEN','VEN',-30],['HAB','HUN',-25],
 ['AKK','OSM',-10],['KAR','MAM',15],['DUL','MAM',45],['BYZ','VEN',30],['BYZ','GEN',20],['HUN','SRB',10],['OSM','SRB',-5],['GH','KRM',-60],
 ['KRM','OSM',20],['MOL','POL',25],['CAN','OSM',-15],['OSM','TRB',-20],['AKK','TRB',35],['GEO','KKY',-30],['ARA','VEN',-10],['PAP','VEN',10],
 ['HUN','POL',10],['CYP','MAM',-20],['MAM','RHO',-40],['OSM','RHO',-30],['AKK','KAR',30],['HUN','BOS',25]];
function baseOp(a,b){let v=FAC[a].rel===FAC[b].rel?20:-20;const h=HIST.find(x=>(x[0]===a&&x[1]===b)||(x[0]===b&&x[1]===a));if(h)v+=h[2];return clamp(v,-100,100);}

const MIS={
 OSM:[{t:'Konstantiniyye\'nin Fethi',d:'Şehri al; Rumeli ile Anadolu birleşsin.',own:['istanbul'],g:150,dev:['istanbul',2]},
      {t:'Karaman Meselesi',d:'Konya ve Larende\'yi ilhak et.',own:['konya','karaman'],g:80},
      {t:'Mora Seferi',d:'Mistra ile Korint\'i ele geçir.',own:['mistra','korint'],g:60},
      {t:'Belgrad Kapısı',d:'Macarların Tuna kalesini düşür.',own:['belgrad'],g:90},
      {t:'Trabzon Seferi',d:'Komnenosların son kalesini al.',own:['trabzon'],g:60},
      {t:'Mısır\'ın Anahtarı',d:'Kahire\'yi fethet.',own:['kahire'],g:250},
      {t:'Roma Seferi',d:'Roma\'yı fethet.',own:['roma'],g:300}],
 BYZ:[{t:'Surları Tut',d:'1455 yazına kadar Konstantiniyye\'yi koru.',hold:'istanbul',until:17,g:120},
      {t:'Mora\'yı Birleştir',d:'Moton ve Anabolu\'yu al.',own:['moton','anabolu'],g:60},
      {t:'Selanik\'i Kurtar',d:'Selanik\'i geri al.',own:['selanik'],g:90},
      {t:'Edirne\'yi Geri Al',d:'Adrianopolis yeniden Roma\'nın olsun.',own:['edirne'],g:120},
      {t:'Anadolu\'ya Dönüş',d:'Bursa ve İzmit\'i al.',own:['bursa','izmit'],g:120}],
 HUN:[{t:'Belgrad\'ın Savunması',d:'Belgrad elinde kalsın, Semendire\'yi al.',own:['belgrad','semendire'],g:70},
      {t:'Tuna Hattı',d:'Vidin, Niğbolu ve Silistre\'yi al.',own:['vidin','nigbolu','silistre'],g:90},
      {t:'Haçlı Seferi',d:'Sofya ve Edirne\'yi al.',own:['sofya','edirne'],g:120},
      {t:'Konstantiniyye\'ye Yardım',d:'Konstantiniyye Hıristiyan elinde olsun; onu al.',own:['istanbul'],g:200}],
 VEN:[{t:'Ege\'nin Kraliçesi',d:'Sakız ve Midilli\'yi al.',own:['sakiz','midilli'],g:70},
      {t:'Mora Kıyıları',d:'Mistra ve Korint\'i al.',own:['mistra','korint'],g:70},
      {t:'Selanik Limanı',d:'Selanik\'i al.',own:['selanik'],g:90},
      {t:'Kıbrıs',d:'Lefkoşa ve Magosa\'yı al.',own:['kibris','magosa'],g:100}],
 MAM:[{t:'Anadolu Kapıları',d:'Maraş ve Elbistan\'ı al.',own:['maras','elbistan'],g:60},
      {t:'Bağdat',d:'Abbasi hilafetinin eski merkezini al.',own:['bagdat'],g:120},
      {t:'Rodos\'u Düşür',d:'Şövalyelerin adasını al.',own:['rodos'],g:90},
      {t:'Rum Diyarı',d:'Konya\'yı al.',own:['konya'],g:120}],
 KAR:[{t:'Selçuklu Mirası',d:'Ankara ve Kırşehir\'i al.',own:['ankara','kirsehir'],g:70},
      {t:'Akdeniz Kıyıları',d:'Teke ve Adana\'yı al.',own:['teke','adana'],g:70},
      {t:'Bursa\'ya Yürüyüş',d:'Osmanlı\'nın eski başkentini al.',own:['bursa'],g:150}],
 AKK:[{t:'Kara Koyun\'u Yık',d:'Tebriz\'i al.',own:['tebriz'],g:150},
      {t:'Bağdat',d:'Bağdat\'ı al.',own:['bagdat'],g:120},
      {t:'Erzurum Yaylası',d:'Erzurum ve Kars\'ı al.',own:['erzurum','kars'],g:70}],
 KKY:[{t:'Ak Koyun\'u Ez',d:'Diyarbakır\'ı al.',own:['diyarbakir'],g:120},
      {t:'Gürcü Seferi',d:'Tiflis\'i al.',own:['tiflis'],g:70},
      {t:'Halep',d:'Halep\'i al.',own:['halep'],g:120}],
 ALB:[{t:'Kroya Direnişi',d:'1460 yazına kadar Kroya\'yı koru.',hold:'kroya',until:37,g:100},
      {t:'Kıyıları Birleştir',d:'İşkodra, Dıraç ve Avlonya\'yı al.',own:['iskodra','drac','avlonya'],g:90},
      {t:'Üsküp',d:'Üsküp\'ü al.',own:['uskup'],g:80}]
};

function facProvs(f){const r=[];for(let i=0;i<NP;i++)if(S.prov[i].o===f)r.push(i);return r;}
function strength(f){let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)s+=S.prov[i].t;return s;}
function devSum(f){let s=0;for(let i=0;i<NP;i++)if(S.prov[i].o===f)s+=S.prov[i].dev*(1+S.prov[i].brk);return s;}
function income(f){let s=0;for(let i=0;i<NP;i++){const p=S.prov[i];if(p.o!==f)continue;s+=p.dev*(1+.5*p.mkt)*(p.un>0?.5:1);}return s;}
function upkeep(f){return strength(f)/1000*UPK;}
function warsOf(f){return FK.filter(g=>g!==f&&alive(g)&&atWar(f,g));}
function alliesOf(f){return FK.filter(g=>g!==f&&alive(g)&&isAlly(f,g));}
function nbrs(f){const s=new Set();for(let i=0;i<NP;i++)if(S.prov[i].o===f)for(const j of PD[i].adj){const o=S.prov[j].o;if(o!==f)s.add(o);}return [...s].filter(alive);}
const avail=i=>Math.max(0,S.prov[i].t-S.prov[i].mv);
function atkMul(f){return (S.turn%4===3?.85:1);}
function atkPower(n,f){return n*atkMul(f);}
function defPower(i,att){const p=S.prov[i],d=PD[i];const mil=p.dev*150+p.fort*700;const fm=1+.15*p.fort*(att&&S.fac[att].cannon?.4:1);
 return (p.t+mil)*fm*(d.mtn?1.3:1)*(d.des?1.1:1);}

function newGame(player){
 S={v:1,turn:0,player,prov:[],fac:{},war:{},truce:{},ally:{},op:{},log:[],flags:{},battles:[],offers:[],news:[],mis:[],misDone:{},stats:{won:0,lost:0,taken:0}};
 FK.forEach(f=>{S.fac[f]={gold:0,mp:0,alive:false,cap:-1,cannon:0,nextOffer:0};});
 PD.forEach(d=>{const m=FAC[d.o].m;S.prov.push({o:d.o,dev:d.dev,fort:d.fort,mkt:0,brk:0,t:Math.round((d.dev*450+d.fort*250)*m/100)*100,mv:0,un:0});});
 FK.forEach(f=>{const ps=facProvs(f);if(!ps.length)return;const F=S.fac[f];F.alive=true;F.cap=PK[FAC[f].cap]??ps[0];
  S.prov[F.cap].t+=Math.round(2500*FAC[f].m/100)*100;const ds=devSum(f);F.gold=Math.round(50+ds*1.2);F.mp=ds*350;});
 for(let a=0;a<FK.length;a++)for(let b=a+1;b<FK.length;b++)S.op[key(FK[a],FK[b])]=baseOp(FK[a],FK[b]);
 [['AKK','KKY'],['OSM','ALB'],['KRM','GH']].forEach(([a,b])=>S.war[key(a,b)]={t:0,sc:{[a]:0,[b]:0}});
 [['MAM','DUL'],['AKK','KAR'],['HUN','BOS'],['VEN','BYZ']].forEach(([a,b])=>S.ally[key(a,b)]=true);
 if(player){
  const ms=MIS[player]||genericMissions(player);S.mis=ms.map(m=>({...m}));
  addLog(`${FAC[player].n} tahtında: ${FAC[player].r}. Tarihin yeni bir sayfası açılıyor.`,'cap');
 }
}
function genericMissions(f){const n=facProvs(f).length;
 const nb=nbrs(f).filter(g=>g!=='SAF').sort((a,b)=>strength(a)-strength(b));const tgt=nb[0];
 const r=[{t:'Genişleme',d:`${n+4} eyalete ulaş.`,count:n+4,g:60},{t:'Dolu Hazine',d:'Hazinende 400 altın biriktir.',gold:400,g:0,dev:['cap',1]}];
 if(tgt)r.push({t:`${FAC[tgt].s} Seferi`,d:`${PD[S.fac[tgt].cap].name} şehrini al.`,own:[PD[S.fac[tgt].cap].key],g:100});
 r.push({t:'Bölgesel Güç',d:`${n+12} eyalete ulaş.`,count:n+12,g:150});return r;}

function addLog(m,k='info'){S.log.push({t:S.turn,m,k});if(S.log.length>400)S.log.shift();}
function news(m,k='info'){S.news.push({m,k});addLog(m,k);}

