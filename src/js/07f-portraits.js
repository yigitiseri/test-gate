/* =====================================================================
   PORTRAITS (Track A, W2 A9): layered SVG portraits drawn from a character spec, in the style of a painted
   miniature in a gilt oval: background in the realm's colour, robe or armour, face (skin by culture, pale when
   sickly), eyes and brows (a frown for the cruel), beard by culture and age (greying from 40), wrinkles, a scar
   for warriors, and the headwear of the culture (kavuk, sarık, börk, taç, kalpak, bere, mitre; a veil for women).
   spec = chPortraitSpec(c) from Track C: {seed,f,cul,hat,age,fem,role,col,traits}. Every field may be missing;
   aPortraitSpec(c) derives one from the character when C's function is absent.
   portraitSVG(spec,o?) -> '<svg class="a-pt">…</svg>' (deterministic, cached); o={size,label}.
   ===================================================================== */
const aPtCache=new Map();
const A_SKIN={tr:'#d8a47c',tk:'#cf9a70',mm:'#c48c62',ar:'#c08658',tt:'#d6a47a',gr:'#dcaa82',sr:'#e2b890',ro:'#e3b891',hu:'#e8bf9a',de:'#ecc6a4',pl:'#eac3a0',
 it:'#dfae86',es:'#dba982',fr:'#e8c09c',ka:'#dcaa84',sq:'#e0b48c',pp:'#ecc8a8'};
const A_DARKHAIR=new Set(['tr','tk','mm','ar','tt','gr','sq','ka','it','es']);
const A_FULLBEARD=new Set(['tr','tk','mm','ar','tt','ka','gr','sr']),A_MOUSTACHE=new Set(['hu','pl','ro','sq']);
const A_FUR=new Set(['de','hu','pl','fr','es','it','ka','sr','ro']);
/** Mix two #rrggbb colours: t=0 -> a, t=1 -> b. */
function aMix(a,b,t){const x=hex2(a),y=hex2(b);return '#'+x.map((v,k)=>Math.round(v+(y[k]-v)*t).toString(16).padStart(2,'0')).join('');}
function aStrHash(s){s=String(s);let h=2166136261;for(let k=0;k<s.length;k++){h^=s.charCodeAt(k);h=Math.imul(h,16777619);}return h>>>0;}
/** Spec from a character when Track C's chPortraitSpec is missing: culture from the realm's faith. */
function aPortraitSpec(c){if(!c)return null;if(typeof chPortraitSpec==='function')try{return chPortraitSpec(c);}catch(e){}
 const F=FAC[c.f]||{},rel=String(F.rel||''),cul=/slam/i.test(rel)?'tr':/Orto|Orth/i.test(rel)?'gr':'it',age=typeof chAge==='function'?chAge(c):40;
 return {seed:c.id,f:c.f,cul,hat:{tr:'kavuk',gr:'taç',it:'bere'}[cul],age,fem:!!c.fem,role:c.role,col:F.c||'#8a6a3a',traits:(c.traits||[]).slice()};}
/** Portrait of a character (C's spec when available). */
function aPortraitFor(c,o){const sp=aPortraitSpec(c);return sp?portraitSVG(sp,Object.assign({label:c.n||''},o||{})):'';}
function portraitSVG(spec,o={}){spec=spec||{};const key=JSON.stringify([spec.seed,spec.f,spec.cul,spec.hat,spec.age,spec.fem,spec.role,spec.col,spec.traits,o.size||0,o.label||'']);
 const hit=aPtCache.get(key);if(hit)return hit;const svg=aPtBuild(spec,o,aStrHash(key));if(aPtCache.size>400)aPtCache.clear();aPtCache.set(key,svg);return svg;}
function aPtBuild(sp,o,h){const R=k=>hash(h&0xffff,k*131+(h>>>16)),id='apt'+h.toString(36);
 const cul=sp.cul||'tr',age=clamp(+sp.age||40,1,99),fem=!!sp.fem,role=sp.role||'ruler',tr=new Set(sp.traits||[]);
 const col=/^#[0-9a-f]{6}$/i.test(sp.col||'')?sp.col:((FAC[sp.f]&&FAC[sp.f].c)||'#8a6a3a');
 let skin=aMix(A_SKIN[cul]||A_SKIN.tr,R(1)<.5?'#fff4e6':'#6a3a20',R(2)*.12);if(tr.has('hasta'))skin=aMix(skin,'#e6e2d6',.38);
 const skinD=aMix(skin,'#5a2e18',.32);
 let hair=A_DARKHAIR.has(cul)?(R(3)<.6?'#231810':'#3a2616'):['#4a3020','#6a4526','#8a6a3a','#3a2616','#9a5a2a'][Math.floor(R(3)*5)];
 hair=aMix(hair,'#dcd8d0',clamp((age-38)/32,0,1)*(.75+R(4)*.25));
 const hat=fem?'veil':(sp.hat||'kavuk'),gold='#e2b857',ink='#23150a';
 const P=[];
 // background medallion and bust
 P.push(`<defs><clipPath id="${id}c"><ellipse cx="32" cy="38" rx="29.5" ry="35.5"/></clipPath><radialGradient id="${id}g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="${aMix(col,'#f3e6c4',.5)}"/><stop offset="1" stop-color="${aMix(col,'#2a1a0c',.45)}"/></radialGradient><linearGradient id="${id}r" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient><radialGradient id="${id}f" cx="40%" cy="34%" r="68%"><stop offset="0" stop-color="#fff" stop-opacity=".24"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#3a1a08" stop-opacity=".3"/></radialGradient><pattern id="${id}p" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="2.2" r=".75" fill="${gold}"/><circle cx="3.4" cy="2.2" r=".75" fill="${gold}"/><circle cx="2.5" cy="3.7" r=".75" fill="${gold}"/><path d="M4.4 5.6 q.8 -.8 1.6 0" stroke="${gold}" stroke-width=".4" fill="none"/></pattern></defs>`);
 P.push(`<g clip-path="url(#${id}c)"><rect width="64" height="76" fill="url(#${id}g)"/>`);
 {const isl=['tr','tk','mm','ar','tt'].includes(cul),ac=aMix(col,'#f3e6c4',.62);   // a niche behind the sitter, as in a miniature: pointed for the East, round for the West
  P.push(isl?`<path d="M10 76 L10 30 C10 16 22 9 32 4 C42 9 54 16 54 30 L54 76 Z" fill="${ac}" fill-opacity=".38" stroke="${gold}" stroke-opacity=".55" stroke-width=".7"/>`
   :`<path d="M10 76 L10 28 A22 22 0 0 1 54 28 L54 76 Z" fill="${ac}" fill-opacity=".38" stroke="${gold}" stroke-opacity=".55" stroke-width=".7"/>`);
  P.push(`<path d="M0 0 L16 0 C13 14 15 30 10 46 C8 52 4 58 0 60 Z" fill="${aMix(col,'#1a0f06',.35)}" fill-opacity=".85"/><path d="M5 0 C4 18 6 34 2 52 M10 0 C9 14 11 28 7 44" stroke="#000" stroke-opacity=".18" stroke-width=".8" fill="none"/>`);}
 // hair behind the head (women, and European men under crowns and caps)
 if(fem)P.push(`<path d="M19 36 C17 50 18 60 22 66 L42 66 C46 60 47 50 45 36 C44 28 39 24 32 24 C25 24 20 28 19 36 Z" fill="${hair}"/>`);
 else if(hat==='taç'||hat==='bere')P.push(`<path d="M20 33 C19 42 20 48 23.5 51 L40.5 51 C44 48 45 42 44 33 C43 27 38 24 32 24 C26 24 21 27 20 33 Z" fill="${hair}"/>`);
 // robe / armour
 const bust='M4 76 C6 63 17 57.5 32 57.5 C47 57.5 58 63 60 76 Z';
 if(cul==='pp')P.push(`<path d="${bust}" fill="#f1ece0"/><path d="M12 76 C13 64 21 58.5 32 58.5 C43 58.5 51 64 52 76 L44 76 C42 68 38 64 32 64 C26 64 22 68 20 76 Z" fill="#9a1d14"/>`);
 else if(role==='gen'){P.push(`<path d="${bust}" fill="#8d9096"/><path d="${bust}" fill="url(#${id}r)"/><path d="M14 66 Q32 60 50 66 M11 71 Q32 64.5 53 71" stroke="#4a4c52" stroke-width=".8" fill="none"/>`);
  P.push(`<path d="M10 72 L48 58 L52 61 L15 76 Z" fill="${col}" stroke="${ink}" stroke-width=".5"/><circle cx="20" cy="64" r="1" fill="#e8e4da"/><circle cx="44" cy="64" r="1" fill="#e8e4da"/>`);}
 else{const robe=aMix(col,'#1a0f06',role==='ruler'?.3:.12);P.push(`<path d="${bust}" fill="${robe}"/><path d="${bust}" fill="url(#${id}r)"/>`);
  if(role==='ruler')P.push(`<path d="${bust}" fill="url(#${id}p)" opacity=".5"/>`);
  if(A_FUR.has(cul)&&role==='ruler')P.push(`<path d="M8 70 C12 61 20 58 32 58 C44 58 52 61 56 70 C50 66 42 64.5 32 64.5 C22 64.5 14 66 8 70 Z" fill="#f4efe4"/>${[14,20,26,38,44,50].map((x,k)=>`<path d="M${x} ${63+(k%3)*.6} l.6 2 l-.6 -.5 l-.6 .5 Z" fill="${ink}"/>`).join('')}`);
  else P.push(`<path d="M24 58 L32 71 L40 58" stroke="${gold}" stroke-width="1.6" fill="none"/><path d="M27 58 L32 66 L37 58 Z" fill="${aMix(col,'#f3e6c4',.55)}"/>${role==='ruler'?[66,69.5,73].map(y=>`<rect x="30.5" y="${y}" width="3" height="1.4" rx=".6" fill="${gold}"/>`).join(''):''}`);}
 // neck, ears, face
 P.push(`<path d="M27.5 49 L27.5 58.5 Q32 61 36.5 58.5 L36.5 49 Z" fill="${skinD}"/>`);
 P.push(`<ellipse cx="21.6" cy="40.5" rx="1.9" ry="3.1" fill="${skinD}"/><ellipse cx="42.4" cy="40.5" rx="1.9" ry="3.1" fill="${skinD}"/>`);
 const jaw=fem?51.5:52.5+R(5)*1.5;
 P.push(`<path d="M21.6 38 C21.6 29.5 26 25.5 32 25.5 C38 25.5 42.4 29.5 42.4 38 C42.4 46.5 38.2 ${jaw} 32 ${jaw} C25.8 ${jaw} 21.6 46.5 21.6 38 Z" fill="${skin}"/>`);
 P.push(`<path d="M32 25.5 C38 25.5 42.4 29.5 42.4 38 C42.4 46.5 38.2 ${jaw} 32 ${jaw}" fill="#5a2e18" fill-opacity=".1"/>`);
 P.push(`<path d="M21.6 38 C21.6 29.5 26 25.5 32 25.5 C38 25.5 42.4 29.5 42.4 38 C42.4 46.5 38.2 ${jaw} 32 ${jaw} C25.8 ${jaw} 21.6 46.5 21.6 38 Z" fill="url(#${id}f)"/><path d="M31.2 40 Q31 43 30.6 44.2" stroke="#fff" stroke-opacity=".35" stroke-width=".7" fill="none" stroke-linecap="round"/>`);
 P.push(`<circle cx="26.8" cy="44" r="2.4" fill="#c85a46" fill-opacity="${fem?.2:.1}"/><circle cx="37.2" cy="44" r="2.4" fill="#c85a46" fill-opacity="${fem?.2:.1}"/>`);
 if(tr.has('hasta'))P.push(`<path d="M25.5 42 Q27.5 43.4 29.5 42 M34.5 42 Q36.5 43.4 38.5 42" stroke="#7a6a8a" stroke-opacity=".45" stroke-width=".9" fill="none"/>`);
 // eyes and brows
 const cruel=tr.has('zalim'),ey=39+R(6)*.6,br=aMix(hair,'#1a0f06',.2);
 P.push(`<ellipse cx="28" cy="${ey}" rx="1.9" ry="1.05" fill="#f6efe2"/><ellipse cx="36" cy="${ey}" rx="1.9" ry="1.05" fill="#f6efe2"/><circle cx="${28.3+R(7)*.3}" cy="${ey}" r=".95" fill="#2a1a10"/><circle cx="${36.3+R(7)*.3}" cy="${ey}" r=".95" fill="#2a1a10"/>`);
 P.push(`<path d="M25.9 ${ey-.3} Q28 ${ey-1.5} 30.1 ${ey-.3} M33.9 ${ey-.3} Q36 ${ey-1.5} 38.1 ${ey-.3}" stroke="${ink}" stroke-width=".55" fill="none" stroke-linecap="round"/><circle cx="28.7" cy="${ey-.35}" r=".3" fill="#fff"/><circle cx="36.7" cy="${ey-.35}" r=".3" fill="#fff"/>`);
 P.push(cruel?`<path d="M25.4 35.4 L30.2 36.9 M38.6 35.4 L33.8 36.9" stroke="${br}" stroke-width="1.3" stroke-linecap="round"/>`:`<path d="M25.4 36.6 Q28 35.2 30.2 36.2 M38.6 36.6 Q36 35.2 33.8 36.2" stroke="${br}" stroke-width="${fem?.8:1.2}" fill="none" stroke-linecap="round"/>`);
 // nose and mouth
 const nl=R(8);P.push(`<path d="M32.4 39.5 Q${31+nl} 43.5 ${30.4-nl*.6} 45 Q32 46.2 33.6 45.2" stroke="${skinD}" stroke-width=".9" fill="none" stroke-linecap="round"/>`);
 P.push(`<path d="M29.4 48.6 Q32 ${cruel?47.7:49.5} 34.6 48.6" stroke="#8a3a2e" stroke-width="${fem?1.1:.9}" fill="none" stroke-linecap="round"/>`);
 // age lines
 if(age>=44)P.push(`<path d="M27 31.2 Q32 30.2 37 31.2" stroke="${skinD}" stroke-opacity=".55" stroke-width=".6" fill="none"/>`);
 if(age>=56)P.push(`<path d="M26.6 32.8 Q32 31.9 37.4 32.8 M24.8 41 Q25.6 42 26.8 41.6 M39.2 41 Q38.4 42 37.2 41.6 M29 46 Q28.2 47.5 28.6 49 M35 46 Q35.8 47.5 35.4 49" stroke="${skinD}" stroke-opacity=".5" stroke-width=".6" fill="none"/>`);
 if(tr.has('cengaver')||tr.has('dag'))P.push(`<path d="M35.6 40.6 L39.2 46.4" stroke="#9a4032" stroke-width=".9"/><path d="M36.2 42 l1.2 -.6 M37.1 43.5 l1.2 -.6 M38 45 l1.2 -.6" stroke="#9a4032" stroke-width=".5"/>`);
 // beard and moustache
 if(!fem&&cul!=='pp'&&age>=17){const young=age<24,bl=young?0:clamp(4+(age-24)/8+R(9)*4,4,11);
  if(A_FULLBEARD.has(cul)&&!young)P.push(`<path d="M22.2 42 C22 ${48+bl*.3} 26 ${jaw+bl*.55} 32 ${jaw+bl} C38 ${jaw+bl*.55} 42 ${48+bl*.3} 41.8 42 C40.6 46.6 37.6 49.6 32 50.2 C26.4 49.6 23.4 46.6 22.2 42 Z" fill="${hair}"/>`);
  else if(!A_MOUSTACHE.has(cul)&&!young&&R(10)<.5)P.push(`<path d="M24.5 46 C25.5 ${jaw+1} 29 ${jaw+2.5} 32 ${jaw+2.8} C35 ${jaw+2.5} 38.5 ${jaw+1} 39.5 46 C37.5 49 35 50.2 32 50.4 C29 50.2 26.5 49 24.5 46 Z" fill="${hair}"/>`);
  if(A_MOUSTACHE.has(cul))P.push(`<path d="M25.6 51 Q27 46.4 32 46.6 Q37 46.4 38.4 51 Q36 48.2 32 47.9 Q28 48.2 25.6 51 Z" fill="${hair}"/>`);
  else if(A_FULLBEARD.has(cul)||!young)P.push(`<path d="M27.2 47.9 Q32 45.4 36.8 47.9 Q32 47.1 27.2 47.9 Z" fill="${hair}" stroke="${hair}" stroke-width=".8"/>`);}
 // headwear
 const band=(y,c)=>`<path d="M19.6 ${y} Q32 ${y+3.2} 44.4 ${y} L44.4 ${y-3} Q32 ${y+.2} 19.6 ${y-3} Z" fill="${c}"/>`;
 const wraps=(x0,x1,y0,y1,c)=>{let s='';for(let k=0;k<4;k++){const y=y0+(y1-y0)*k/4;s+=`<path d="M${x0} ${y+3} Q32 ${y-2.5} ${x1} ${y+3}" stroke="${c}" stroke-width=".8" fill="none"/>`;}return s;};
 if(hat==='kavuk')P.push(`<path d="M18.6 31 C15.8 19 20 5.5 32 5 C44 5.5 48.2 19 45.4 31 C39 28.6 25 28.6 18.6 31 Z" fill="#f4efe2" stroke="#8a7a5a" stroke-width=".6"/>${wraps(19,45,10,26,'#c9bfa8')}<ellipse cx="32" cy="6.6" rx="5.5" ry="3" fill="#a8281c"/>`+(role==='ruler'?`<circle cx="32" cy="24" r="1.7" fill="${gold}" stroke="${ink}" stroke-width=".4"/><path d="M32 22.5 Q35 14 38.5 10" stroke="#f4efe2" stroke-width="1.6" fill="none"/>`:''));
 else if(hat==='sarık'){const tc=R(11)<.7?'#efe9da':'#3d6b4a';P.push(`<path d="M18.4 31.5 C16.8 22 23 14.5 32 14.5 C41 14.5 47.2 22 45.6 31.5 C39.5 29.2 24.5 29.2 18.4 31.5 Z" fill="${tc}" stroke="#6a5a3a" stroke-width=".6"/>${wraps(19,45,17,27,tc==='#efe9da'?'#c9bfa8':'#2a4a32')}`+(role==='ruler'?`<circle cx="32" cy="22.5" r="1.8" fill="${gold}" stroke="${ink}" stroke-width=".4"/><path d="M32 21 Q33.5 14 36.5 9.5" stroke="${gold}" stroke-width="1.3" fill="none"/>`:''));}
 else if(hat==='börk'){const bc=cul==='tt'?col:'#f0ead8';P.push(`<path d="M22 31 L24.5 9 Q32 5 39.5 9 L42 31 Z" fill="${bc}" stroke="#6a5a3a" stroke-width=".6"/><path d="M39.5 9 Q47 12 45 26 Q43 18 40.5 14 Z" fill="${aMix(bc,'#000',.18)}"/>`+(cul==='tt'?band(31,'#6a4a2a'):band(31,gold)));}
 else if(hat==='taç')P.push(`<path d="M20.5 30.5 L20.5 21 L24.5 25.5 L27.5 16.5 L32 23.5 L36.5 16.5 L39.5 25.5 L43.5 21 L43.5 30.5 Q32 33 20.5 30.5 Z" fill="${gold}" stroke="#6a4a12" stroke-width=".7"/><circle cx="27.5" cy="16.2" r="1.2" fill="${gold}" stroke="#6a4a12" stroke-width=".4"/><circle cx="36.5" cy="16.2" r="1.2" fill="${gold}" stroke="#6a4a12" stroke-width=".4"/><circle cx="32" cy="28.4" r="1.5" fill="#a8281c"/><circle cx="25.5" cy="28" r="1.1" fill="#2a5a8a"/><circle cx="38.5" cy="28" r="1.1" fill="#2a5a8a"/>`);
 else if(hat==='kalpak'){P.push(`<path d="M19.6 31.5 C18.6 22 22 13.5 32 13.5 C42 13.5 45.4 22 44.4 31.5 C38 29.5 26 29.5 19.6 31.5 Z" fill="#4a3222"/>${[0,1,2,3,4,5,6,7].map(k=>`<path d="M${21+k*3} ${29.5-(k%2)*1.5} l1 -3.5" stroke="#6e4e36" stroke-width=".7"/>`).join('')}`);
  if(cul==='hu'||role==='ruler'||role==='gen')P.push(`<path d="M37.5 18 C39 11 42 5 46.5 2.5" stroke="#f4efe2" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="37.6" cy="19" r="1.8" fill="${gold}" stroke="${ink}" stroke-width=".4"/>`);}
 else if(hat==='bere'){const bc=R(12)<.5?'#7d1a10':'#1f1a16';P.push(`<path d="M18.8 30.5 C17.6 22.5 25 16.6 34 17.4 C42.4 18.2 47.6 23.4 45.2 30.5 C39 28.4 25 28.4 18.8 30.5 Z" fill="${bc}"/><path d="M19.2 30.4 Q32 27.6 45 30.4" stroke="#000" stroke-opacity=".35" stroke-width="1.2" fill="none"/>`);}
 else if(hat==='mitre')P.push(`<path d="M23 30.5 L24 12.5 L32 3.5 L40 12.5 L41 30.5 Q32 32.5 23 30.5 Z" fill="#f4efe2" stroke="#8a7a5a" stroke-width=".6"/><path d="M30.6 5 L33.4 5 L33.4 31.6 L30.6 31.6 Z" fill="${gold}"/><path d="M23 30.5 Q32 32.5 41 30.5 L41 27 Q32 29 23 27 Z" fill="${gold}"/><path d="M30 14 h4 M32 12 v4" stroke="#a8281c" stroke-width=".9"/>`);
 else if(hat==='veil')P.push(`<path d="M19 38 C17 26 23 21 32 21 C41 21 47 26 45 38 C46 50 48 60 50 70 L42 70 C43 58 42.6 46 42 38 C41 30 38 27.6 32 27.6 C26 27.6 23 30 22 38 C21.4 46 21 58 22 70 L14 70 C16 60 18 50 19 38 Z" fill="#efe7d6" stroke="#b8a888" stroke-width=".5"/>`+(role==='ruler'?`<path d="M23 25.5 L23 20 L26 23 L29 17.5 L32 22 L35 17.5 L38 23 L41 20 L41 25.5 Q32 27.5 23 25.5 Z" fill="${gold}" stroke="#6a4a12" stroke-width=".6"/>`:''));
 else if(!fem)P.push(`<path d="M21 33 C21 26 26 23.5 32 23.5 C38 23.5 43 26 43 33 C40 29.5 36 28.6 32 28.6 C28 28.6 24 29.5 21 33 Z" fill="${hair}"/>`);
 P.push('</g>');
 // gilt oval frame
 P.push(`<ellipse cx="32" cy="38" rx="29.5" ry="35.5" fill="none" stroke="#b8862c" stroke-width="2.6"/><ellipse cx="32" cy="38" rx="30.9" ry="36.9" fill="none" stroke="${ink}" stroke-width=".8"/><ellipse cx="32" cy="38" rx="28" ry="34" fill="none" stroke="#f3d27a" stroke-opacity=".6" stroke-width=".5"/>`);
 P.push(`<ellipse cx="32" cy="38" rx="29.5" ry="35.5" fill="none" stroke="#fbe7a6" stroke-width="1.1" stroke-dasharray=".1 2.3" stroke-linecap="round"/>${[[32,1.6],[32,74.4]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.4" fill="${gold}" stroke="${ink}" stroke-width=".6"/><circle cx="${x}" cy="${y}" r=".9" fill="#a8281c"/>`).join('')}`);
 const sz=o.size?` width="${Math.round(o.size*64/76)}" height="${o.size}"`:'';
 return `<svg class="a-pt" viewBox="-1.5 -1.5 67 79"${sz} ${o.label?`role="img" aria-label="${esc(o.label)}"`:'aria-hidden="true"'} focusable="false">${P.join('')}</svg>`;}
KE.portraitSVG=(sp,o)=>portraitSVG(sp,o);KE.portraitFor=(id,o)=>{const c=S&&S.chars&&S.chars[id];return c?aPortraitFor(c,o):'';};
