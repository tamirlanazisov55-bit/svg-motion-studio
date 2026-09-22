const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const controls = {};
for (const id of ['mode','palettePreset','spots','levels','distance','distanceVariance','connectedness','warp','gridPixel','pixelStretch','lineOpacity','materialOpacity','pulseSpeed','pulseAmount','blur','glow','animate','jsonBox']) controls[id]=document.getElementById(id);
const labels = {};
for (const id of ['spots','levels','distance','distanceVariance','connectedness','warp','gridPixel','pixelStretch','lineOpacity','materialOpacity','pulseSpeed','pulseAmount','blur','glow']) labels[id]=document.getElementById(id+'Val');

const presets = {
  'Signal Blue': ['#050505','#090c2f','#18216b','#3140a9','#7e84d5','#c7c9ea'],
  'Signal Magenta': ['#050505','#2a0015','#6f173e','#a64c63','#d48074','#f6a38a'],
  'Screen Dual': ['#050505','#1f0128','#542b85','#8b1030','#90a5e8','#ffffff'],
  'Grid Pulse Red': ['#000000','#711564','#de47b6','#df0000','#ce2600','#ff6c49'],
  'CE2600 / DF0000 / DE47B6': ['#000000','#711564','#de47b6','#df0000','#ce2600','#ff6c49'],
  'Custom': ['#050505','#090c2f','#18216b','#3140a9','#7e84d5','#c7c9ea'],
};
const presetNames = Object.keys(presets);
const swatchesWrap = document.getElementById('swatches');
let colorInputs = [];
function buildSwatches(){
  swatchesWrap.innerHTML=''; colorInputs=[];
  for(let i=0;i<6;i++){
    const wrap=document.createElement('div'); wrap.className='swatchWrap';
    const inp=document.createElement('input'); inp.type='color'; inp.dataset.idx=i;
    inp.addEventListener('input',()=>{ state.palette[i]=inp.value; state.palettePreset='Custom'; controls.palettePreset.value='Custom'; pulseCacheKey=''; syncJson(); requestRender(); });
    wrap.appendChild(inp); swatchesWrap.appendChild(wrap); colorInputs.push(inp);
  }
}

const state = {
  mode:'topographic', palettePreset:'Signal Blue', palette:[...presets['Signal Blue']],
  spots:5, levels:11, distance:0.38, distanceVariance:0.54, connectedness:0.62, warp:0.18,
  gridPixel:14, pixelStretch:1.32, lineOpacity:0, materialOpacity:1, pulseSpeed:24, pulseAmount:0.28,
  blur:6, glow:0.85, animate:true, seed:Math.random()*1e9|0, blobs:[]
};

function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
function hexToRgb(h){h=h.replace('#',''); if(h.length===3) h=[...h].map(x=>x+x).join(''); const n=parseInt(h,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}}
function mix(a,b,t){return a+(b-a)*t}
function mixColor(c1,c2,t){const a=hexToRgb(c1),b=hexToRgb(c2); return `rgb(${mix(a.r,b.r,t)|0},${mix(a.g,b.g,t)|0},${mix(a.b,b.b,t)|0})`}
function lerpPalette(pal, t){t=Math.max(0,Math.min(0.9999,t)); const n=pal.length-1; const idx=Math.floor(t*n); const lt=t*n-idx; return mixColor(pal[idx],pal[Math.min(n,idx+1)],lt)}
function fmt(v,d=2){return (+v).toFixed(d).replace(/\.00$/,'').replace(/(\.\d*[1-9])0+$/,'$1')}
function setCanvas(){
  const dpr=Math.min(1.5, devicePixelRatio||1);
  canvas.width=Math.max(1,Math.floor(innerWidth*dpr));
  canvas.height=Math.max(1,Math.floor(innerHeight*dpr));
  canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener('resize',()=>{setCanvas(); pulseCacheKey=''; requestRender()});
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) requestRender(); });

const pulseFamilies = {
  blue:['#000000','#06081f','#10184f','#25359a','#6f78c8','#c9c7de'],
  warm:['#000000','#17000f','#4e0b2d','#8f284d','#d26c69','#f39a84'],
  plum:['#000000','#16001c','#43105a','#711564','#b33991','#e15bc2'],
  red:['#000000','#2c0500','#6b1300','#ce2600','#df0000','#de47b6']
};

function generateBlobs(){
  const rnd=mulberry32(state.seed);
  const arr=[];
  const count=Math.max(1,state.spots|0);
  for(let i=0;i<count;i++){
    const lane=(i+0.5)/count;
    const spread=0.14 + state.distance*0.68;
    const x=Math.max(.04,Math.min(.96, .5 + (lane-.5)*spread*1.75 + (rnd()-.5)*state.distanceVariance*.12));
    const y=Math.max(.08,Math.min(.93, .56 + (rnd()-.5)*(.66*state.distanceVariance + .18)));
    arr.push({x,y,rx:.045 + rnd()*.085,ry:.13 + rnd()*.22,amp:.72 + rnd()*.55,tilt:(rnd()-.5)*.12,bias:rnd(),phase:rnd()*Math.PI*2,family:rnd()<.46?'blue':(rnd()<.68?'warm':'plum')});
  }
  state.blobs=arr;
  pulseCacheKey='';
}

function fieldAt(nx,ny,t){
  let v=0;
  for(const b of state.blobs){
    const ct=Math.cos(b.tilt), st=Math.sin(b.tilt);
    let dx=nx-b.x, dy=ny-b.y;
    if(state.warp>0){
      dx += Math.sin((ny*3.4 + b.bias)*6.283)*0.012*state.warp;
      dy += Math.cos((nx*2.7 + b.bias)*6.283)*0.010*state.warp;
    }
    const rx = dx*ct - dy*st, ry = dx*st + dy*ct;
    const g = Math.exp(-(rx*rx/(b.rx*b.rx) + ry*ry/(b.ry*b.ry))*2.0);
    v += g * b.amp;
  }
  if(state.connectedness>0) v += Math.exp(-(((nx-.5)**2)/0.25 + ((ny-.58)**2)/0.56))*state.connectedness*.34;
  return v;
}

function sampleGrid(cols, rows, t){
  const vals=[]; let min=1e9,max=-1e9;
  for(let y=0;y<rows;y++){
    const row=[];
    for(let x=0;x<cols;x++){
      const nx=(x+0.5)/cols, ny=(y+0.5)/rows;
      let v = fieldAt(nx,ny,t);
      if(state.mode==='gridMap'){
        const wave = Math.sin(nx*5.5 + y*.16)*.5+.5;
        v *= .88 + wave*state.pulseAmount*.28;
      }
      min=Math.min(min,v); max=Math.max(max,v); row.push(v);
    }
    vals.push(row);
  }
  const span=(max-min)||1;
  for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) vals[y][x]=(vals[y][x]-min)/span;
  return vals;
}

function drawTopographic(t){
  const cols = Math.max(36, Math.min(180, Math.floor(innerWidth / Math.max(9,state.gridPixel*.95))));
  const rows = Math.max(24, Math.min(110, Math.floor(innerHeight / Math.max(9,state.gridPixel*.95))));
  const vals=sampleGrid(cols,rows,t); const cw=innerWidth/cols, ch=innerHeight/rows;
  ctx.fillStyle='#050505'; ctx.fillRect(0,0,innerWidth,innerHeight);
  ctx.globalAlpha=Math.max(.08,state.materialOpacity);
  for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){const v=vals[y][x];ctx.fillStyle=lerpPalette(state.palette, v);ctx.fillRect(x*cw, y*ch, cw+1, ch+1)}
  ctx.globalAlpha=1;
  if(state.lineOpacity>0){
    ctx.globalAlpha=state.lineOpacity;ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1;const levels=state.levels;
    for(let l=1;l<levels;l++){
      const th=l/levels; ctx.beginPath();
      for(let y=0;y<rows-1;y++) for(let x=0;x<cols-1;x++){
        const v=vals[y][x], vr=vals[y][x+1], vb=vals[y+1][x];
        if((v<th)!=(vr<th)){ const den=(vr-v)||1e-6; const px=(x+(th-v)/den)*cw; const py=y*ch; ctx.moveTo(px,py); ctx.lineTo(px,py+ch); }
        if((v<th)!=(vb<th)){ const den=(vb-v)||1e-6; const px=x*cw; const py=(y+(th-v)/den)*ch; ctx.moveTo(px,py); ctx.lineTo(px+cw,py); }
      }
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
}

function drawGridMode(t){
  const cellW=Math.max(8,state.gridPixel), cellH=Math.max(8,state.gridPixel*state.pixelStretch);
  const cols=Math.max(8,Math.ceil(innerWidth/cellW)), rows=Math.max(8,Math.ceil(innerHeight/cellH));
  const vals=sampleGrid(cols,rows,0);
  ctx.fillStyle='#000';ctx.fillRect(0,0,innerWidth,innerHeight);ctx.globalAlpha=Math.max(.04,state.materialOpacity);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let v=vals[y][x];v=Math.floor(v*(state.levels-1))/(state.levels-1);if(v<.045)continue;ctx.fillStyle=lerpPalette(state.palette,v);ctx.fillRect(x*cellW,y*cellH,cellW+.6,cellH+.6)}
  ctx.globalAlpha=1;
}

const pulseCanvas=document.createElement('canvas');
const pulseCtx=pulseCanvas.getContext('2d',{alpha:false});
let pulseImage=null, pulseBase=null, pulseOwner=null, pulseCacheKey='';

function activePulseFamily(blob,index){
  const name=state.palettePreset;
  if(name==='Signal Blue') return pulseFamilies.blue;
  if(name==='Signal Magenta') return pulseFamilies.warm;
  if(name==='Grid Pulse Red' || name==='CE2600 / DF0000 / DE47B6') return pulseFamilies.red;
  if(name==='Screen Dual'){const order=[pulseFamilies.warm,pulseFamilies.plum,pulseFamilies.blue,pulseFamilies.blue];return order[index%order.length]}
  return state.palette;
}

function rebuildPulseCache(){
  const cellW=Math.max(7,state.gridPixel), cellH=Math.max(8,state.gridPixel*state.pixelStretch);
  const cols=Math.max(10,Math.ceil(innerWidth/cellW)), rows=Math.max(8,Math.ceil(innerHeight/cellH));
  const key=[cols,rows,state.seed,state.spots,state.distance,state.distanceVariance,state.connectedness,state.warp,state.palettePreset,state.palette.join(','),state.levels].join('|');
  if(key===pulseCacheKey && pulseImage) return;
  pulseCacheKey=key;pulseCanvas.width=cols;pulseCanvas.height=rows;pulseImage=pulseCtx.createImageData(cols,rows);pulseBase=new Float32Array(cols*rows);pulseOwner=new Int16Array(cols*rows);pulseOwner.fill(-1);
  let max=0;
  for(let y=0;y<rows;y++){
    const ny=(y+.5)/rows;
    for(let x=0;x<cols;x++){
      const nx=(x+.5)/cols;let best=0,owner=-1;
      for(let i=0;i<state.blobs.length;i++){
        const b=state.blobs[i];let dx=(nx-b.x)/(b.rx*1.15),dy=(ny-b.y)/(b.ry*1.05);dx+=Math.sin((ny*3.1+b.bias)*6.283)*state.warp*.08;const ax=Math.abs(dx),ay=Math.abs(dy);const horizontal=Math.exp(-Math.pow(ax,2.8)*2.2);const vertical=Math.exp(-Math.pow(ay,2.0)*1.45);const inf=horizontal*vertical*b.amp;if(inf>best){best=inf;owner=i;}
      }
      if(state.connectedness>0&&best>0)best+=state.connectedness*.07*Math.exp(-Math.pow((ny-.62)/.5,2));const idx=y*cols+x;pulseBase[idx]=best;pulseOwner[idx]=owner;max=Math.max(max,best);
    }
  }
  max=max||1;for(let i=0;i<pulseBase.length;i++)pulseBase[i]/=max;
}

function pulseColor(pal,v){
  if(v<.075) return {r:0,g:0,b:0};
  const levels=Math.max(4,state.levels|0);const q=Math.floor(Math.min(.999,v)*levels)/levels;return hexToRgb(pal[Math.min(pal.length-1,Math.floor(q*(pal.length-1)+.5))]);
}

function drawPulseScreen(t){
  rebuildPulseCache();const cols=pulseCanvas.width,rows=pulseCanvas.height,data=pulseImage.data;const phase=t*.00045*state.pulseSpeed;
  for(let y=0;y<rows;y++){
    const rowBand=Math.sin(y*.72+phase*.65)*.5+.5;
    for(let x=0;x<cols;x++){
      const idx=y*cols+x,bidx=pulseOwner[idx];let v=pulseBase[idx];
      if(bidx>=0){const b=state.blobs[bidx];const breathe=.5+.5*Math.sin(phase+b.phase+y*.22+x*.035);v*=1-state.pulseAmount*.25+breathe*state.pulseAmount*.46;v*=.92+rowBand*.11;}
      if((state.palettePreset==='Grid Pulse Red'||state.palettePreset==='CE2600 / DF0000 / DE47B6')&&((y+(state.seed%7))%13===0)&&v>.16)v=Math.min(1,v+.18);
      const pal=bidx>=0?activePulseFamily(state.blobs[bidx],bidx):state.palette;const c=pulseColor(pal,v);const di=idx*4;data[di]=c.r;data[di+1]=c.g;data[di+2]=c.b;data[di+3]=255;
    }
  }
  pulseCtx.putImageData(pulseImage,0,0);ctx.save();ctx.fillStyle='#000';ctx.fillRect(0,0,innerWidth,innerHeight);ctx.imageSmoothingEnabled=false;
  if(state.glow>0){ctx.globalAlpha=Math.min(.42,.12+state.glow*.16);ctx.filter=`blur(${Math.max(2,state.blur)}px)`;ctx.drawImage(pulseCanvas,0,0,innerWidth,innerHeight);}
  ctx.filter='none';ctx.globalAlpha=Math.max(.04,state.materialOpacity);ctx.drawImage(pulseCanvas,0,0,innerWidth,innerHeight);ctx.restore();
}
