// --- Separate reference-towers mode ---------------------------------------
const towerCanvas=document.createElement('canvas');
const towerCtx=towerCanvas.getContext('2d',{alpha:false});
let towerImage=null, towerOwner=null, towerMask=null, towerHotspot=null, towerCacheKey='';
let towerMeta=[];

function towerFamilyFor(index){
  const name=state.palettePreset;
  if(name==='Signal Blue') return pulseFamilies.blue;
  if(name==='Signal Magenta') return pulseFamilies.warm;
  if(name==='Grid Pulse Red' || name==='CE2600 / DF0000 / DE47B6') return pulseFamilies.red;
  if(name==='Screen Dual'){
    const order=[pulseFamilies.warm,pulseFamilies.plum,pulseFamilies.blue,pulseFamilies.blue];
    return order[index%order.length];
  }
  return state.palette;
}

function rebuildTowerCache(){
  const cellW=Math.max(12,Math.min(38,state.gridPixel*1.35));
  const cellH=Math.max(7,Math.min(24,state.gridPixel*.72*state.pixelStretch));
  const cols=Math.max(24,Math.min(96,Math.ceil(innerWidth/cellW)));
  const rows=Math.max(24,Math.min(84,Math.ceil(innerHeight/cellH)));
  const key=[cols,rows,state.seed,state.spots,state.distance,state.distanceVariance,state.connectedness,state.warp,state.palettePreset,state.palette.join(','),state.levels].join('|');
  if(key===towerCacheKey && towerImage) return;
  towerCacheKey=key;
  towerCanvas.width=cols; towerCanvas.height=rows;
  towerImage=towerCtx.createImageData(cols,rows);
  towerOwner=new Int16Array(cols*rows); towerOwner.fill(-1);
  towerMask=new Float32Array(cols*rows);
  towerHotspot=new Float32Array(cols*rows);
  towerMeta=[];

  const rnd=mulberry32(state.seed^0x71A3D9);
  const count=Math.max(3,Math.min(12,state.spots+2));
  const margin=1;
  let cursor=margin + Math.floor(rnd()*2);
  for(let i=0;i<count;i++){
    const remaining=Math.max(1,cols-cursor-margin);
    if(remaining<=2) break;
    const nominal=Math.max(2,Math.round(cols/(count*1.55)));
    const width=Math.max(2,Math.min(10,nominal + Math.round((rnd()-.5)*nominal*1.3)));
    const gap=Math.max(1,Math.round(1 + rnd()*3 + state.distance*.8));
    const grounded=rnd() < .62;
    const height=Math.max(8,Math.min(rows-3,Math.round(rows*(.22 + rnd()*.34 + state.connectedness*.08))));
    let bottom;
    if(grounded) bottom=rows-1-Math.round(rnd()*rows*.05);
    else bottom=Math.min(rows-2,Math.round(rows*(.26 + rnd()*.56)));
    const top=Math.max(1,bottom-height+1);
    const peakRow=Math.max(top,Math.min(bottom,Math.round(top + (bottom-top)*(0.42+rnd()*.44))));
    const shoulder=Math.max(0,Math.round((rnd()-.5)*2));
    const meta={x:cursor,w:width,top,bottom,peakRow,phase:rnd()*Math.PI*2,family:i,grounded};
    towerMeta.push(meta);

    for(let y=top;y<=bottom;y++){
      const rel=(y-top)/Math.max(1,bottom-top);
      const stepBand=Math.floor((y-top)/Math.max(2,Math.round(3+rnd()*2)));
      const leftStep=((stepBand+i)%4===0?-1:0) + (rel>.78?shoulder:0);
      const rightStep=((stepBand+i)%5===0?1:0) + (rel<.18?-1:0);
      const x0=Math.max(0,cursor+leftStep);
      const x1=Math.min(cols-1,cursor+width-1+rightStep);
      const sigma=Math.max(2,(bottom-top)*(.15+rnd()*.03));
      const hot=Math.exp(-Math.pow((y-peakRow)/sigma,2)*1.65);
      const base=0.12 + hot*.88;
      for(let x=x0;x<=x1;x++){
        const idx=y*cols+x;
        const edge=Math.min(x-x0,x1-x);
        const edgeFade=edge<=0 ? .78 : edge===1 ? .92 : 1;
        towerOwner[idx]=i;
        towerMask[idx]=Math.max(towerMask[idx],base*edgeFade);
        towerHotspot[idx]=hot;
      }
    }
    cursor += width+gap;
    if(cursor>=cols-margin-2) break;
  }

  if(towerMeta.length && rnd()<.8){
    const i=towerMeta.length;
    const width=Math.max(2,Math.round(cols*.045));
    const x=Math.max(1,Math.min(cols-width-1,Math.round(cols*(.48+rnd()*.18))));
    const top=1+Math.round(rnd()*3), bottom=Math.min(rows-3,top+Math.round(rows*.16));
    const peakRow=Math.round((top+bottom)*.5);
    towerMeta.push({x,w:width,top,bottom,peakRow,phase:rnd()*Math.PI*2,family:i,grounded:false});
    for(let y=top;y<=bottom;y++){
      const hot=Math.exp(-Math.pow((y-peakRow)/Math.max(2,(bottom-top)*.24),2)*1.7);
      for(let xx=x;xx<x+width;xx++){
        const idx=y*cols+xx; towerOwner[idx]=i; towerMask[idx]=.12+hot*.88; towerHotspot[idx]=hot;
      }
    }
  }
}

function drawTowerScreen(t){
  rebuildTowerCache();
  const cols=towerCanvas.width, rows=towerCanvas.height, data=towerImage.data;
  const phase=t*.0005*state.pulseSpeed;
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++){
      const idx=y*cols+x, own=towerOwner[idx];
      let r=0,g=0,b=0;
      if(own>=0){
        const meta=towerMeta[own];
        let v=towerMask[idx];
        if(state.animate){
          const travel=.5+.5*Math.sin(phase+meta.phase-y*.20);
          const breath=.5+.5*Math.sin(phase*.72+meta.phase+x*.055);
          v*=.82 + state.pulseAmount*(.10+travel*.23+breath*.08);
        }
        const levels=Math.max(5,Math.min(14,state.levels));
        v=Math.floor(Math.max(0,Math.min(.999,v))*levels)/levels;
        const pal=towerFamilyFor(meta.family);
        const c=pulseColor(pal,v);
        r=c.r;g=c.g;b=c.b;
        if((state.palettePreset==='Grid Pulse Red'||state.palettePreset==='CE2600 / DF0000 / DE47B6') && ((y+own*3)%17===0) && v>.16){
          r=Math.min(255,r+45);g=Math.min(255,g+35);b=Math.min(255,b+55);
        }
      }
      const di=idx*4; data[di]=r;data[di+1]=g;data[di+2]=b;data[di+3]=255;
    }
  }
  towerCtx.putImageData(towerImage,0,0);
  ctx.save();
  ctx.fillStyle='#000';ctx.fillRect(0,0,innerWidth,innerHeight);
  ctx.imageSmoothingEnabled=false;
  if(state.glow>0){
    ctx.globalAlpha=Math.min(.30,.07+state.glow*.10);
    ctx.filter=`blur(${Math.max(2,Math.min(12,state.blur))}px)`;
    ctx.drawImage(towerCanvas,0,0,innerWidth,innerHeight);
  }
  ctx.filter='none';
  ctx.globalAlpha=Math.max(.05,state.materialOpacity);
  ctx.drawImage(towerCanvas,0,0,innerWidth,innerHeight);
  ctx.restore();
}

let raf=0, dirty=true, lastFrame=0;
const TARGET_MS=1000/24;
function requestRender(){ dirty=true; if(!raf) raf=requestAnimationFrame(frame); }
function frame(t){
  raf=0;
  const animating=state.animate && (state.mode==='pulseScreen' || state.mode==='towerScreen') && !document.hidden;
  if(animating && t-lastFrame<TARGET_MS){ raf=requestAnimationFrame(frame); return; }
  lastFrame=t;
  if(!dirty && !animating) return;
  dirty=false;
  ctx.clearRect(0,0,innerWidth,innerHeight);
  if(state.mode==='topographic') drawTopographic(0);
  else if(state.mode==='gridMap') drawGridMode(0);
  else if(state.mode==='pulseScreen') drawPulseScreen(t);
  else drawTowerScreen(t);
  if(animating) raf=requestAnimationFrame(frame);
}

function syncUI(){
  for(const [k,v] of Object.entries(state)) if(controls[k]){ if(controls[k].type==='checkbox') controls[k].checked=v; else if(controls[k].tagName==='SELECT' || controls[k].tagName==='INPUT') controls[k].value=v; }
  for(const k in labels) labels[k].textContent = k==='gridPixel' ? `${state[k]} px` : k==='pixelStretch' ? `${fmt(state[k])}x` : fmt(state[k]);
  colorInputs.forEach((inp,i)=> inp.value = state.palette[i] || '#000000');
  syncJson();
}
function syncJson(){ controls.jsonBox.value = JSON.stringify({
  mode:state.mode,palettePreset:state.palettePreset,palette:state.palette,spots:state.spots,levels:state.levels,distance:state.distance,distanceVariance:state.distanceVariance,connectedness:state.connectedness,warp:state.warp,gridPixel:state.gridPixel,pixelStretch:state.pixelStretch,lineOpacity:state.lineOpacity,materialOpacity:state.materialOpacity,pulseSpeed:state.pulseSpeed,pulseAmount:state.pulseAmount,blur:state.blur,glow:state.glow,animate:state.animate,seed:state.seed,blobs:state.blobs
 }, null, 2)}
function applyStateFromObject(obj){
  Object.assign(state,obj);
  if(Array.isArray(obj.palette)) state.palette=obj.palette.slice(0,6);
  if(Array.isArray(obj.blobs)) state.blobs=obj.blobs;
  if(!state.blobs || !state.blobs.length) generateBlobs();
  syncUI(); requestRender();
}

function randomizeColors(){
  const keys = presetNames.filter(n=>n!=='Custom');
  const name = keys[(Math.random()*keys.length)|0];
  state.palettePreset=name; state.palette=[...presets[name]]; pulseCacheKey=''; towerCacheKey='';
  syncUI(); requestRender();
}
function randomizeForm(){ state.seed = (Math.random()*1e9)|0; generateBlobs(); towerCacheKey=''; syncUI(); requestRender(); }

for(const name of presetNames){ const o=document.createElement('option'); o.value=name; o.textContent=name; controls.palettePreset.appendChild(o); }
buildSwatches();
for(const [key,el] of Object.entries(controls)){
  if(['jsonBox','palettePreset','mode','animate'].includes(key)) continue;
  el.addEventListener('input',()=>{ state[key]=el.type==='range'||el.type==='number' ? +el.value : el.value; if(['spots','distance','distanceVariance','connectedness','warp','gridPixel','pixelStretch','levels'].includes(key)){ pulseCacheKey=''; towerCacheKey=''; } syncUI(); requestRender();});
}
controls.mode.addEventListener('change',()=>{
  state.mode=controls.mode.value;
  if(state.mode==='pulseScreen'){ state.gridPixel=Math.min(state.gridPixel,16); state.pixelStretch=Math.max(1.18,Math.min(1.55,state.pixelStretch)); state.lineOpacity=0; state.blur=Math.min(state.blur,7); state.pulseAmount=Math.min(state.pulseAmount,.36); }
  if(state.mode==='towerScreen'){ state.gridPixel=Math.max(13,Math.min(24,state.gridPixel)); state.pixelStretch=Math.max(1.05,Math.min(1.65,state.pixelStretch)); state.lineOpacity=0; state.blur=Math.min(state.blur,8); state.pulseAmount=Math.min(state.pulseAmount,.34); state.animate=true; }
  pulseCacheKey=''; towerCacheKey=''; syncUI(); requestRender();
});
controls.palettePreset.addEventListener('change',()=>{ state.palettePreset=controls.palettePreset.value; if(presets[state.palettePreset]) state.palette=[...presets[state.palettePreset]]; pulseCacheKey=''; towerCacheKey=''; syncUI(); requestRender();});
controls.animate.addEventListener('change',()=>{ state.animate=controls.animate.checked; syncUI(); requestRender();});
document.getElementById('randomizeForm').onclick=randomizeForm;
document.getElementById('randomizeColors').onclick=randomizeColors;
document.getElementById('copyJson').onclick=async()=>{syncJson(); try{await navigator.clipboard.writeText(controls.jsonBox.value);}catch(e){} };
document.getElementById('savePng').onclick=()=>{ const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download='gradient-screen.png'; a.click(); };
document.getElementById('applyJson').onclick=()=>{ try{ const obj=JSON.parse(controls.jsonBox.value); applyStateFromObject(obj);}catch(e){ alert('Invalid JSON'); } };
document.getElementById('formatJson').onclick=()=>{ try{ controls.jsonBox.value=JSON.stringify(JSON.parse(controls.jsonBox.value),null,2);}catch(e){ alert('Invalid JSON'); } };

setCanvas(); generateBlobs(); syncUI(); requestRender();