/* =====================================================================
   TOP-BAR SHORTCUTS: tap "Ordu" to jump from army to army, "Eyalet" from province to province (capital
   first, then the richest). Each tap centres the map there and opens its panel, so a last forgotten island
   or a lost army is always one tap away. A long-press (touch) or hover (mouse) still shows the tooltip.
   ===================================================================== */
let cycArmy=-1,cycProv=-1;
(()=>{for(const [s,a,tr,en] of [['#army','cyc-army','Ordularını sırayla göster','Show your armies one by one'],['#provs','cyc-prov','Eyaletlerini sırayla göster','Show your provinces one by one']]){
 const st=$(s)&&$(s).closest('.stat');if(!st)continue;st.dataset.act=a;st.setAttribute('role','button');st.setAttribute('aria-label',lng(tr,en));st.classList.add('cyc');}})();
function cycProvList(f){const cap=S.fac[f].cap;return facProvs(f).slice().sort((a,b)=>((b===cap)-(a===cap))||(S.prov[b].dev-S.prov[a].dev)||(a-b));}
function cycArmyList(f){return S.armies?S.armies.filter(a=>a.f===f&&a.n>0).sort((a,b)=>(b.n-a.n)||(a.id-b.id)):[];}
ACTS['cyc-prov']=()=>{if(!S||!S.player)return;const L0=cycProvList(S.player);if(!L0.length)return;
 cycProv=(cycProv+1)%L0.length;const i=L0[cycProv];armSelect(i);uiFocusProv(i,selArmy);
 toast(lng(`Eyalet ${cycProv+1}/${L0.length}: ${PD[i].name}`,`Province ${cycProv+1} of ${L0.length}: ${PD[i].name}`));};
ACTS['cyc-army']=()=>{if(!S||!S.player)return;const L0=cycArmyList(S.player);
 if(!L0.length){toast(lng('Sahada ordun yok. Bir eyaletinde asker toplayarak ordu kurabilirsin.','You have no army in the field. Raise troops in one of your provinces to form one.'));return;}
 cycArmy=(cycArmy+1)%L0.length;const a=L0[cycArmy];armSelect(a.loc,a.id);uiFocusProv(a.loc,a.id);
 toast(lng(`${armName(a)} (${cycArmy+1}/${L0.length}): ${fmtK(a.n)} asker, ${PD[a.loc].name}`,`${armName(a)} (${cycArmy+1} of ${L0.length}): ${fmtK(a.n)} troops, ${PD[a.loc].name}`));};
QUIET.add('cyc-prov');QUIET.add('cyc-army');
hook('enterGame',()=>{cycArmy=-1;cycProv=-1;});
KE.cyc=()=>({army:selArmy,prov:sel});
