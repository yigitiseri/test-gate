/* =====================================================================
   MAP CONTROLS (Track A): zoom, fit, map mode, 2D/3D toggle
   ===================================================================== */
ACTS.zin=()=>zoomAt(vw/2,vh/2,curS()*1.35);
ACTS.zout=()=>zoomAt(vw/2,vh/2,curS()/1.35);
ACTS.fit=()=>centerOn(W/2,H/2,fitS);
ACTS.v3d=()=>{const on=G3.set(!G3.on);toast(on?'3D harita':(G3.fail?'3D bu cihazda açılamadı':'2D harita'));};
ACTS.mode=t=>{mapMode=mapMode==='pol'?'ter':'pol';t.textContent=mapMode==='pol'?'◐':'◑';t.title=mapMode==='pol'?'Arazi haritası':'Siyasi harita';toast(mapMode==='pol'?'Siyasi harita':'Arazi haritası');polDirty=true;req();};
