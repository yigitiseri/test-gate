'use strict';
// Track V (W3) vassal invariants: every S.vas entry links two living realms, the vassal is not the player, holds no
// vassals of its own, is allied with (and not at war with) its overlord, and its liberty desire is 0..100.
module.exports = `(()=>{const S=window.__ke.S,out=[];if(!S||!S.vas)return out;
 const key=(a,b)=>a<b?a+'|'+b:b+'|'+a,al=f=>S.fac[f]&&S.fac[f].alive;
 if(typeof S.vas!=='object'||Array.isArray(S.vas))return ['S.vas is not an object'];
 for(const v in S.vas){const V=S.vas[v],o=V&&V.o,tag='vassal '+v+' of '+o;
  if(!V||!o){out.push('vassal '+v+' malformed');continue;}
  if(!al(v))out.push(tag+': vassal not alive');if(!al(o))out.push(tag+': overlord not alive');
  if(v===S.player)out.push(tag+': the player is a vassal');if(o===v)out.push(tag+': own overlord');
  if(S.vas[o])out.push(tag+': the overlord is itself a vassal');
  if(S.war[key(o,v)])out.push(tag+': at war with its overlord');
  if(!S.ally[key(o,v)])out.push(tag+': not allied with its overlord');
  if(typeof V.lib!=='number'||!(V.lib>=0&&V.lib<=100))out.push(tag+': liberty '+V.lib);
  if(typeof V.t!=='number'||V.t>S.turn)out.push(tag+': bad start turn '+V.t);}
 return out;})()`;
