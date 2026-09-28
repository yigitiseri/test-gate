/* =====================================================================
   MISSIONS (historic goals of the player's faction)
   ===================================================================== */
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
function genericMissions(f){const n=facProvs(f).length;
 const nb=nbrs(f).filter(g=>g!=='SAF').sort((a,b)=>strength(a)-strength(b));const tgt=nb[0];
 const r=[{t:'Genişleme',d:`${n+4} eyalete ulaş.`,count:n+4,g:60},{t:'Dolu Hazine',d:'Hazinende 400 altın biriktir.',gold:400,g:0,dev:['cap',1]}];
 if(tgt)r.push({t:`${FAC[tgt].s} Seferi`,d:`${PD[S.fac[tgt].cap].name} şehrini al.`,own:[PD[S.fac[tgt].cap].key],g:100});
 r.push({t:'Bölgesel Güç',d:`${n+12} eyalete ulaş.`,count:n+12,g:150});return r;}

function checkMissions(){
 if(!S.player)return;const pl=S.player;
 S.mis.forEach((m,k)=>{if(S.misDone[k])return;let ok=false;
  if(m.own)ok=m.own.every(x=>S.prov[PK[x]].o===pl);
  else if(m.count)ok=facProvs(pl).length>=m.count;
  else if(m.gold)ok=S.fac[pl].gold>=m.gold;
  else if(m.hold)ok=S.turn>=m.until&&S.prov[PK[m.hold]].o===pl;
  if(ok){S.misDone[k]=S.turn;S.fac[pl].gold+=m.g||0;
   if(m.dev){const pi=m.dev[0]==='cap'?S.fac[pl].cap:PK[m.dev[0]];if(S.prov[pi].o===pl)S.prov[pi].dev+=m.dev[1];}
   news(`Hedef tamamlandı: ${m.t}${m.g?` (+${m.g} altın)`:''}`,'good');toast(`✦ ${m.t} tamamlandı`,'good');SND.play('fanfare');}});
}
function showMissions(){
 const pl=S.player;const rows=S.mis.map((m,k)=>{const done=S.misDone[k]!=null;let prog='';
  if(m.own){const n=m.own.filter(x=>S.prov[PK[x]].o===pl).length;prog=`${n}/${m.own.length}`;}else if(m.count)prog=`${facProvs(pl).length}/${m.count}`;else if(m.gold)prog=`${Math.floor(S.fac[pl].gold)}/${m.gold}`;else if(m.hold)prog=S.turn>=m.until?'':`${m.until-S.turn} tur`;
  return `<div class="mis ${done?'done':''}"><span class="ck">${done?'✓':''}</span><div><div class="t">${esc(m.t)}</div><div class="d">${esc(m.d)}${!done&&prog?` · ${prog}`:''}</div></div><span class="r">${m.g?`+${m.g} altın`:''}${m.dev?' · imar':''}</span></div>`;}).join('');
 openModal(`<div class="eyebrow">${esc(FAC[pl].n)}</div><h2>Tarihî Hedefler</h2><div class="rows">${rows}</div>
  <p class="hint">Zafer: 1531 yılına kadar hayatta kal ve puanını büyüt ya da haritadaki eyaletlerin yarısına (${Math.ceil(NP*.5)}) hükmet.</p><div class="foot"><button class="btn primary" data-act="mclose">Kapat</button></div>`);
}
hook('newGame',(S,player)=>{if(player){const ms=MIS[player]||genericMissions(player);S.mis=ms.map(m=>({...m}));}},10);
hook('afterRound',()=>checkMissions(),10);
ACTS.missions=()=>showMissions();
