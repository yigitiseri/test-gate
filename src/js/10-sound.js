/* =====================================================================
   SOUND (Web Audio, fully synthesized)
   ===================================================================== */
const SND=(()=>{
 const st={on:true,music:true,sfx:true,vol:.7};
 try{Object.assign(st,JSON.parse(localStorage.getItem('ke-snd')||'{}'));}catch(e){}
 const saveSt=()=>{try{localStorage.setItem('ke-snd',JSON.stringify(st));}catch(e){}};
 let ac=null,master,mus,sfx,rev,nb,mood='peace',timer=null,next=0,step=0,ph=null,rest=2,drone=false;
 const T=()=>ac.currentTime;
 function impulse(sec,decay){const r=ac.sampleRate,l=r*sec|0,b=ac.createBuffer(2,l,r);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<l;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/l,decay);}return b;}
 function init(){
  if(ac){if(ac.state==='suspended')ac.resume();return;}
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  try{ac=new C();}catch(e){return;}
  master=ac.createGain();master.gain.value=st.on?st.vol:0;
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;master.connect(comp);comp.connect(ac.destination);
  rev=ac.createConvolver();rev.buffer=impulse(2.4,2.8);const rg=ac.createGain();rg.gain.value=.3;rev.connect(rg);rg.connect(master);
  mus=ac.createGain();mus.gain.value=st.music?.5:0;mus.connect(master);const ms=ac.createGain();ms.gain.value=.7;mus.connect(ms);ms.connect(rev);
  sfx=ac.createGain();sfx.gain.value=st.sfx?.9:0;sfx.connect(master);const ss=ac.createGain();ss.gain.value=.3;sfx.connect(ss);ss.connect(rev);
  nb=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  document.addEventListener('visibilitychange',()=>{if(!ac)return;if(document.hidden)ac.suspend();else ac.resume();});
  apply();
 }
 function env(g,t,a,d,peak){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);}
 function osc(type,f,t,dur,peak,{a=.005,dest=sfx,f2=null,filt=null,detune=0}={}){const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);o.detune.value=detune;
  const g=ac.createGain();env(g,t,a,dur,peak);let n=o;if(filt){const bf=ac.createBiquadFilter();bf.type=filt[0];bf.frequency.value=filt[1];bf.Q.value=filt[2]||.7;o.connect(bf);n=bf;}n.connect(g);g.connect(dest);o.start(t);o.stop(t+a+dur+.05);}
 function noise(t,dur,peak,type,freq,Q=1,dest=sfx,a=.002){const s=ac.createBufferSource();s.buffer=nb;s.loop=true;const f=ac.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=Q;const g=ac.createGain();env(g,t,a,dur,peak);s.connect(f);f.connect(g);g.connect(dest);s.start(t,Math.random()*1.5);s.stop(t+a+dur+.05);}
 function davul(t,g=.5,dest=sfx){osc('sine',95,t,.45,g,{f2:42,dest});noise(t,.08,g*.5,'lowpass',400,1,dest);}
 function tek(t,g=.3,dest=sfx){osc('triangle',250,t,.08,g*.6,{f2:170,dest});noise(t,.05,g*.6,'bandpass',2300,1.2,dest);}
 function clash(t,g=.25){[523,811,1237,1789,2417].forEach((f,k)=>osc('square',f*(.97+Math.random()*.06),t,.16+k*.03,g*.1,{filt:['highpass',700]}));noise(t,.12,g*.7,'highpass',2600,.7);}
 function cannon(t,g=.8){osc('sine',70,t,.9,g,{f2:28});noise(t,1.1,g*.9,'lowpass',520,.8);noise(t,.05,g*.5,'bandpass',1500,1);}
 function horn(f,t,d,g=.16,dest=sfx,bright=2600){const o=ac.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f*.97,t);o.frequency.linearRampToValueAtTime(f,t+.05);
  const v=ac.createOscillator();v.frequency.value=6;const vg=ac.createGain();vg.gain.value=f*.008;v.connect(vg);vg.connect(o.frequency);
  const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(800,t);lp.frequency.linearRampToValueAtTime(bright,t+.08);lp.Q.value=2;
  const g2=ac.createGain();g2.gain.setValueAtTime(.0001,t);g2.gain.linearRampToValueAtTime(g,t+.04);g2.gain.setValueAtTime(g*.9,t+d*.8);g2.gain.linearRampToValueAtTime(.0001,t+d+.1);
  o.connect(lp);lp.connect(g2);g2.connect(dest);o.start(t);v.start(t);o.stop(t+d+.2);v.stop(t+d+.2);}
 function bell(f,t,g=.25,dur=2.4,dest=sfx){[1,2.76,5.4,8.93].forEach((m,k)=>osc('sine',f*m,t,dur/(k+1),g/(k+1.2),{a:.002,dest}));}
 const N=s=>293.66*Math.pow(2,s/12);
 const sounds={
  click:t=>{osc('triangle',1500,t,.035,.05);},
  select:t=>{osc('sine',520,t,.08,.12,{f2:360});noise(t,.03,.05,'bandpass',1800,2);},
  coin:t=>{osc('sine',1900,t,.25,.09);osc('sine',2530,t+.07,.35,.08);osc('sine',3100,t+.13,.3,.05);},
  recruit:t=>{davul(t,.45);davul(t+.22,.35);tek(t+.33,.25);},
  build:t=>{for(let k=0;k<3;k++){noise(t+k*.17,.06,.35,'bandpass',1400,3);osc('sine',310,t+k*.17,.07,.18,{f2:220});}},
  march:t=>{for(let k=0;k<4;k++){davul(t+k*.14,.26+k*.04);noise(t+k*.14+.07,.05,.08,'lowpass',900);}},
  battle:(t,o={})=>{for(let k=0;k<7;k++)clash(t+k*.11+Math.random()*.06,.3);noise(t,.9,.1,'bandpass',700,.6);if(o.cannon)cannon(t+.05,.7);
   const r=t+.95;if(o.win===true){horn(N(0),r,.16);horn(N(4),r+.18,.16);horn(N(7),r+.36,.55,.18);horn(N(-5),r+.36,.55,.1);davul(r,.4);davul(r+.36,.45);}
   else if(o.win===false){horn(N(7),r,.3,.13);horn(N(5),r+.32,.3,.13);horn(N(1),r+.64,.8,.13);}},
  turn:t=>{bell(146.8,t,.22,3);},
  war:t=>{for(let k=0;k<8;k++)davul(t+k*.11,.2+k*.05);horn(N(-12),t+.9,1.2,.18);horn(N(-5),t+.9,1.2,.12);cannon(t+.9,.5);},
  peace:t=>{[0,4,7,12].forEach((s,k)=>osc('triangle',N(s+12),t+k*.12,1.2,.07));},
  event:t=>{noise(t,.35,.07,'bandpass',3000,.8,sfx,.12);bell(587.3,t+.2,.1,1.6);},
  fanfare:t=>{const sq=[[0,.16],[0,.16],[4,.16],[7,.5],[5,.2],[7,.9]];let c=t;sq.forEach(([s,d])=>{horn(N(s),c,d,.17);horn(N(s-12),c,d,.1);c+=d+.02;});for(let k=0;k<6;k++)davul(t+k*.3,.45);noise(c-.9,1.5,.1,'highpass',5000,.5,sfx,.01);},
  defeat:t=>{horn(N(-5),t,.8,.14);horn(N(-7),t+.8,.8,.14);horn(N(-11),t+1.6,1.8,.14);davul(t,.4);davul(t+1.6,.4);}
 };
 function play(name,o){if(!ac||!st.on||!st.sfx)return;try{sounds[name](T()+.01,o);}catch(e){}}
 // ---- music: Hicaz on D, düyek usul ----
 const SC=[0,1,4,5,7,8,10,12,13,16,17,19];
 function newPhrase(){const len=5+Math.floor(Math.random()*5);let dg=3+Math.floor(Math.random()*3);const notes=[];
  for(let k=0;k<len;k++){const r=Math.random();dg+=r<.35?-1:r<.7?1:r<.82?-2:r<.92?2:0;dg=clamp(dg,0,SC.length-1);notes.push({dg,L:[1,1,2,2,2,3,4][Math.floor(Math.random()*7)]});}
  notes.push({dg:Math.random()<.6?0:4,L:5+Math.floor(Math.random()*3)});return {notes,i:0,rem:0};}
 function ney(f,t,d,g){const o=ac.createOscillator();o.type='sine';o.frequency.setValueAtTime(f*.985,t);o.frequency.linearRampToValueAtTime(f,t+.07);
  const o2=ac.createOscillator();o2.type='triangle';o2.frequency.setValueAtTime(f*2,t);const g2=ac.createGain();g2.gain.value=.12;
  const v=ac.createOscillator();v.frequency.value=5.2;const vg=ac.createGain();vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(f*.012,t+Math.min(d*.6,.45));v.connect(vg);vg.connect(o.frequency);
  const e=ac.createGain();e.gain.setValueAtTime(.0001,t);e.gain.linearRampToValueAtTime(g,t+.09);e.gain.setValueAtTime(g*.85,t+d*.75);e.gain.linearRampToValueAtTime(.0001,t+d+.15);
  const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;o.connect(e);o2.connect(g2);g2.connect(e);e.connect(lp);lp.connect(mus);
  [o,o2,v].forEach(x=>{x.start(t);x.stop(t+d+.3);});noise(t,Math.max(.1,d*.5),g*.09,'bandpass',f*3,1.4,mus,.05);}
 function oud(f,t,g){osc('triangle',f,t,.8,g,{a:.003,dest:mus});osc('sawtooth',f*1.004,t,.35,g*.35,{a:.003,dest:mus,filt:['lowpass',1500]});}
 function tick(){if(!ac)return;const e8=60/(mood==='war'?96:80)/2;if(next<T())next=T()+.05;
  while(next<T()+.5){const t=next,p=step%8,war=mood==='war';
   const dv=war?.3:.16,tk=war?.2:.1;
   if(p===0||p===4)davul(t,p===0?dv:dv*.8,mus);if(p===2||p===3||p===6)tek(t,tk,mus);if(war&&p===7)tek(t,tk*.7,mus);
   if(p===0)oud(146.83,t,.07);if(p===4)oud(110,t,.05);if(!war&&p===6&&Math.random()<.4)oud(N(SC[2+Math.floor(Math.random()*3)])/2,t,.04);
   if(rest>0){if(p===0)rest--;}
   else{if(!ph)ph=newPhrase();if(ph.rem<=0){if(ph.i>=ph.notes.length){ph=null;rest=1+Math.floor(Math.random()*3);}
     else{const n=ph.notes[ph.i++];ph.rem=n.L;const f=N(SC[n.dg]);if(war)horn(f,t,n.L*e8*.95,.055,mus,2000);else ney(f,t,n.L*e8*1.05,.12);}}
    if(ph)ph.rem--;}
   next+=e8;step++;}}
 function startMusic(){if(!ac||timer)return;next=T()+.15;
  if(!drone){drone=true;const dg=ac.createGain();dg.gain.value=.04;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=420;
   const lfo=ac.createOscillator();lfo.frequency.value=.07;const lg=ac.createGain();lg.gain.value=170;lfo.connect(lg);lg.connect(lp.frequency);lfo.start();
   [73.42,110,146.83].forEach((f,k)=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=(k-1)*5;o.connect(lp);o.start();});lp.connect(dg);dg.connect(mus);}
  timer=setInterval(tick,120);tick();}
 function stopMusic(){clearInterval(timer);timer=null;}
 function apply(){if(!ac)return;const t=T();master.gain.setTargetAtTime(st.on?st.vol:0,t,.05);mus.gain.setTargetAtTime(st.music?.5:0,t,.3);sfx.gain.setTargetAtTime(st.sfx?.9:0,t,.05);
  if(st.music&&st.on)startMusic();else stopMusic();}
 return {init,play,st,set(k,v){st[k]=v;saveSt();apply();},setMood(m){mood=m;}};
})();
document.addEventListener('pointerdown',()=>SND.init(),{passive:true});
document.addEventListener('keydown',()=>SND.init());
function sndIcon(){const b=$('#sndBtn');if(b)b.textContent=SND.st.on?'🔊':'🔇';}
ACTS.snd=()=>{SND.set('on',!SND.st.on);sndIcon();toast(SND.st.on?'Ses açık':'Ses kapalı');};
