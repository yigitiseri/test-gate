/* =====================================================================
   COMMANDERS: choose who leads an army, and replacements.
   - Army panel (slot 36, after C's "Komutan" card): "Komutan ata / değiştir" lists the realm's able commanders
     (ruler, heir, generals) that are alive and not captive. A commander leading another army can be moved;
     that army is then without a commander until the next replacement.
   - Replacement: at the end of every round an army without a commander gets a free one if the realm has one
     (same pick as C's chFreeGen, but never a newly created general), for every realm. The player hears about their own.
   Akıncı commanders keep C's rule: +1 movement while in command.
   ===================================================================== */
let cmdOpen=null; // army id whose commander list is open in the panel
/** Everyone in realm f who can lead an army now, best first; each with the army they lead (or null). */
function cmdCands(f){if(!S||!S.chars||!S.fac[f])return [];const out=[],seen=new Set();
 const add=c=>{if(!c||seen.has(c.id)||!chLive(c)||c.cap!=null||chAge(c)<16)return;seen.add(c.id);out.push(c);};
 const r=chRuler(f),h=chHeir(f);if(r&&r.skill>0)add(r);if(h&&h.skill>0)add(h);for(const g of chGenerals(f))add(g);
 return out.map(c=>({c,a:S.armies.find(x=>x.gen===c.id)||null})).sort((x,y)=>((x.a?1:0)-(y.a?1:0))||(y.c.skill-x.c.skill));}
function cmdDetach(a){if(!a||a.gen==null)return;const c=S.chars[a.gen];a.gen=null;
 if(c&&c.traits&&c.traits.includes('akinci')&&a.mpMax>2){a.mpMax--;a.mp=Math.min(a.mp,a.mpMax);}}
function cmdAttach(a,c){a.gen=c.id;if(c.traits&&c.traits.includes('akinci')){const full=a.mp>=(a.mpMax||2);a.mpMax=(a.mpMax||2)+1;if(full)a.mp=a.mpMax;}}
/** Put character gid at the head of army aid (moving them from another army if needed). */
function cmdSet(aid,gid){const a=armyById(aid),c=S.chars&&S.chars[gid];
 if(!a||!c||c.f!==a.f||!chLive(c)||c.cap!=null||a.gen===gid)return false;
 const was=S.armies.find(x=>x.gen===gid);if(was)cmdDetach(was);cmdDetach(a);cmdAttach(a,c);return true;}
function cmdName(c){return chName(c);}
/* replacement for armies that lost their commander (died, captured, moved away) */
hook('roundEnd',()=>{if(!S||!S.c||!S.armies)return;
 for(const a of S.armies){if(a.gen!=null)continue;const g=chFreeGen(a.f,false);if(!g)continue;cmdAttach(a,g); // only free commanders: no new general, no dice
  if(a.gen!=null&&a.f===S.player){const c=S.chars[a.gen];news(lng(`${cmdName(c)}, ${armName(a)}'nun başına geçti.`,`${cmdName(c)} takes command of the ${armName(a)}.`),'good');}}},45);
PANEL_SECTIONS.push({id:'commander',order:36,when:c=>{if(selArmy==null||!S.c)return false;const a=armyById(selArmy);return !!a&&a.f===S.player&&a.loc===c.i;},
 html(){const a=armyById(selArmy),L0=cmdCands(a.f).filter(x=>x.c.id!==a.gen),open=cmdOpen===a.id||a.gen==null;
  let h=`<div class="sec cmd-sec">`;
  if(a.gen==null)h+=`<h3>${lng('Komutan','Commander')}</h3><p class="cmd-none">${lng('Bu ordunun komutanı yok. Komutansız ordu muharebede ek güç alamaz.','This army has no commander. Without one it gets no bonus in battle.')}</p>`;
  else h+=`<button class="btn cmd-tog" data-act="cmd-open" aria-expanded="${open}">${open?lng('Listeyi kapat','Close the list'):lng('Komutanı değiştir','Change commander')}</button>`;
  if(open){
   if(!L0.length)h+=`<p class="cmd-none">${lng('Şu an görev verebileceğin başka bir komutan yok. Yeni paşalar zamanla yetişir.','No other commander is free for now. New generals come of age in time.')}</p>`;
   else h+=`<div class="cmd-list">${L0.map(({c,a:o})=>{const role=c.id===(S.fac[a.f].ruler)?lng('Hükümdar','Ruler'):c.id===S.fac[a.f].heir?lng('Veliaht','Heir'):'';
    const st=o?lng(`${armName(o)} başında · ${PD[o.loc].name}`,`leads the ${armName(o)} · ${PD[o.loc].name}`):lng('boşta','free');
    return `<div class="cmd-row"><div class="cmd-who"><b>${esc(cmdName(c))}</b>${chStars(c.skill)}<small>${role?esc(role)+' · ':''}${esc(st)}</small><div class="ch-trs">${chTraitChips(c)}</div></div><button class="btn ${o?'':'primary'}" data-act="cmd-set" data-g="${c.id}">${o?lng('Buraya al','Bring here'):lng('Ata','Appoint')}</button></div>`;}).join('')}</div>`;
  }
  return h+`</div>`;}});
ACTS['cmd-open']=()=>{const a=armyById(selArmy);if(!a)return;cmdOpen=cmdOpen===a.id?null:a.id;renderPanel();};
ACTS['cmd-set']=t=>{const a=armyById(selArmy);if(!a||a.f!==S.player)return;const g=+t.dataset.g;
 if(cmdSet(a.id,g)){cmdOpen=null;SND.play('select');toast(lng(`${cmdName(S.chars[g])} artık ${armName(a)}'nun komutanı.`,`${cmdName(S.chars[g])} now commands the ${armName(a)}.`),'good');renderAll();req();}};
KE.cmd={cands:f=>cmdCands(f).map(x=>({id:x.c.id,army:x.a&&x.a.id})),set:(a,g)=>cmdSet(a,g),newGeneral:f=>chGenGeneral(f).id};
