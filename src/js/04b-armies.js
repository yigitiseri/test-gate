/* =====================================================================
   ARMIES: data-level API (W0, no rules). Track B replaces the internals freely
   but keeps these signatures. Schema (S.armies[]):
   {id,f,loc,n,gen:null|charId,mp:0,mpMax:2,path:[],morale:1,st:'idle'|'moving'|'siege'}
   ===================================================================== */
function armyCreate(f,loc,n,o={}){
 const a={id:S.seq++,f,loc,n,gen:null,mp:0,mpMax:2,path:[],morale:1,st:'idle',...o};
 S.armies.push(a);runHooks('armyCreated',a);return a;}
function armyRemove(id,reason){const k=S.armies.findIndex(a=>a.id===id);if(k<0)return null;
 const a=S.armies.splice(k,1)[0];if(selArmy===id)selArmy=null;runHooks('armyRemoved',a,reason);return a;}
function armyById(id){return S.armies.find(a=>a.id===id)||null;}
function armyList(f){return f==null?S.armies.slice():S.armies.filter(a=>a.f===f);}
function armyAt(i,f){return S.armies.filter(a=>a.loc===i&&(f==null||a.f===f));}
/** Raw teleport, no rules. */
function armySetLoc(id,i){const a=armyById(id);if(a)a.loc=i;return a;}
KE.armyCreate=(f,loc,n,o)=>armyCreate(f,loc,n,o);
KE.armyList=f=>armyList(f);
