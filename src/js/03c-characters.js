/* =====================================================================
   CHARACTERS (W0 stub; Track C replaces the internals, keeps the signatures)
   S.chars={[id]:{id,n,f,role:'ruler'|'heir'|'gen'|'claimant',born,died:null,traits:[],skill,dyn,ep}}
   S.fac[f].ruler / .heir = char id or null; S.fac[f].gens = [char ids]
   ===================================================================== */
/** Display name of f's ruler. Every UI place that shows a ruler must use this (never FAC[f].r). */
function rulerName(f){return FAC[f].r;}
function chRuler(f){return null;}
function chHeir(f){return null;}
function chGenerals(f){return [];}
KE.rulerName=f=>rulerName(f);
