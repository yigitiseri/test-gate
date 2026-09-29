/* =====================================================================
   ARMIES: data-level API (Track B). Rules live in 04c-army-rules.js.
   Schema (S.armies[]): {id,f,loc,n,gen:null|charId,mp:0,mpMax:2,path:[],morale:1,st:'idle'|'moving'|'siege'}
   Province garrisons are S.prov[i].t: static, capped by garrisonMax(i), they never attack.
   ===================================================================== */
function armyCreate(f,loc,n,o={}){
 const used=new Set(S.armies.filter(x=>x.f===f).map(x=>x.no));let no=1;while(used.has(no))no++;
 const a={id:S.seq++,f,loc,n,gen:null,mp:0,mpMax:BAL_B.mpMax,path:[],morale:1,st:'idle',no,...o};
 S.armies.push(a);runHooks('armyCreated',a);return a;}
function armyRemove(id,reason){const k=S.armies.findIndex(a=>a.id===id);if(k<0)return null;
 const a=S.armies.splice(k,1)[0];if(selArmy===id)selArmy=null;runHooks('armyRemoved',a,reason);return a;}
function armyById(id){if(id==null||!S||!S.armies)return null;return S.armies.find(a=>a.id===id)||null;}
function armyList(f){return f==null?S.armies.slice():S.armies.filter(a=>a.f===f);}
function armyAt(i,f){return S.armies.filter(a=>a.loc===i&&(f==null||a.f===f));}
/** Raw teleport, no rules. */
function armySetLoc(id,i){const a=armyById(id);if(a)a.loc=i;return a;}

/** Most field armies faction f may keep: 1 + 1 per 12 provinces (at most 4), +1 for "Zorlu" realms. */
function armyCap(f){return clamp(1+Math.floor(facProvs(f).length/BAL_B.capDiv),1,BAL_B.capMax)+(FAC[f]&&FAC[f].dif===3?BAL_B.capHard:0);}
/** Largest garrison province i can hold (rounded to 100). */
function garrisonMax(i){const p=S.prov[i];return Math.round((BAL_B.garBase+p.dev*BAL_B.garDev+p.fort*BAL_B.garFort)/100)*100;}
/** Smallest garrison "Garnizonu azalt" leaves behind. */
function garMin(i){return Math.min(garrisonMax(i),Math.max(100,Math.round(S.prov[i].dev*BAL_B.garMinDev/100)*100));}
/** Player-facing army name: "Birinci Ordu", ... (a.no is the faction-wide ordinal given at creation). */
function armName(a){const k=(a.no||1)-1;return `${ARM_ORD[k]||a.no+'.'} Ordu`;}
/** Name of the army's general (Track C character), or ''. */
function armGenName(a){const c=a&&a.gen!=null&&S.chars&&S.chars[a.gen];return c&&c.n?chDisp(c.n,c.f):'';}
const ARM_ORD=['Birinci','İkinci','Üçüncü','Dördüncü','Beşinci','Altıncı'];
KE.armyCreate=(f,loc,n,o)=>armyCreate(f,loc,n,o);
KE.armyList=f=>armyList(f);
