// Motion + glow controls layered onto the existing editor runtime.
const SMS_EASINGS={
  smooth:'cubic-bezier(.16,.84,.18,1)',
  easeout:'cubic-bezier(.22,1,.36,1)',
  snappy:'cubic-bezier(.34,1.56,.64,1)',
  linear:'linear',
  quint:'cubic-bezier(0.83,0,0.17,1)'
};
const smsEasing=v=>SMS_EASINGS[v]||v||SMS_EASINGS.smooth;

if(state.revealMode==null)state.revealMode='scale';
if(state.revealEasing==null)state.revealEasing='smooth';
if(state.revealRotationDegrees==null)state.revealRotationDegrees=220;
if(state.revealStartOpacity==null)state.revealStartOpacity=0;
if(state.glowStrokeThickness==null)state.glowStrokeThickness=1;
if(state.introStartScale===.82)state.introStartScale=.18;

// Keep enhancement UI self-contained so older index.html builds still receive new controls.
const smsEasingSelect=$('#revealEasing');
if(smsEasingSelect&&!smsEasingSelect.querySelector('option[value="quint"]')){
  const option=document.createElement('option');option.value='quint';option.textContent='easeInOutQuint';smsEasingSelect.appendChild(option);
}
if(!$('#revealRotationDegrees')){
  const startScale=$('#introStartScale');
  const stack=startScale?.closest('.slider-stack');
  if(stack){
    const row=document.createElement('label');
    row.className='slider-row';row.id='revealRotationRow';row.hidden=true;
    row.innerHTML='<span>Spin amount</span><output id="revealRotationDegreesVal"></output><input id="revealRotationDegrees" type="range" min="0" max="1080" step="5" value="220">';
    stack.appendChild(row);
  }
}
if(!$('#revealStartOpacity')){
  const startScale=$('#introStartScale');
  const stack=startScale?.closest('.slider-stack');
  if(stack){
    const row=document.createElement('label');
    row.className='slider-row';
    row.innerHTML='<span>Start opacity</span><output id="revealStartOpacityVal"></output><input id="revealStartOpacity" type="range" min="0" max="100" step="1" value="0">';
    stack.appendChild(row);
  }
}

const smsStyle=document.createElement('style');
smsStyle.textContent=`
.star-intro{overflow:visible!important}
.border-glow-star{left:-100%!important;top:-100%!important;width:300%!important;height:300%!important;overflow:visible!important}
.glow-mesh,.glow-light{overflow:visible!important;transform:scale(.33333333)!important;transform-origin:center!important}
`;
document.head.appendChild(smsStyle);

buildGlowMarkup=function(){
  const r=state.glowRadius/40,intensity=state.glowIntensity,c=state.glowColor,mesh=state.colors.slice(0,3),w=state.glowStrokeThickness||1;
  return `<div class="border-glow-star ${state.glowEnabled?'':'glow-disabled'}" id="borderGlowStar" style="--edge-sensitivity:${state.glowEdgeSensitivity};--cone-spread:${state.glowConeSpread}"><svg class="glow-mesh" viewBox="${STAR_VIEWBOX}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="meshGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mesh[0]}"/><stop offset=".52" stop-color="${mesh[1]}"/><stop offset="1" stop-color="${mesh[2]}"/></linearGradient></defs><path d="${STAR_PATH}" fill="none" stroke="url(#meshGradient)" stroke-width="${1.7*w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(1,.9*intensity)}"/><path d="${STAR_PATH}" fill="none" stroke="url(#meshGradient)" stroke-width="${4*r*w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(1,.26*intensity)}" style="filter:blur(${2.4*r*w}px)"/></svg><svg class="glow-light" viewBox="${STAR_VIEWBOX}" xmlns="http://www.w3.org/2000/svg"><path d="${STAR_PATH}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(1,intensity)}"/><path d="${STAR_PATH}" fill="none" stroke="${c}" stroke-width="${2.3*r*w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(1,.58*intensity)}" style="filter:blur(${.8*r*w}px)"/><path d="${STAR_PATH}" fill="none" stroke="${c}" stroke-width="${4.8*r*w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(1,.34*intensity)}" style="filter:blur(${2.2*r*w}px)"/><path d="${STAR_PATH}" fill="none" stroke="${c}" stroke-width="${8.5*r*w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(1,.18*intensity)}" style="filter:blur(${5*r*w}px)"/></svg></div>`;
};

replayIntro=function(){
  const intro=$('#starIntro');if(!intro)return;
  const duration=state.revealDuration*1000,delay=state.revealDelay*1000,easing=smsEasing(state.revealEasing),fromScale=Math.max(.04,Math.min(1,state.introStartScale||.18)),spin=Math.max(0,Math.min(1080,state.revealRotationDegrees??220)),startOpacity=Math.max(0,Math.min(1,(state.revealStartOpacity??0)/100));
  intro.getAnimations().forEach(a=>a.cancel());
  if(state.revealMode==='clockwise'){
    intro.animate([
      {transform:`scale(${fromScale}) rotate(${-spin}deg) translateZ(0)`,opacity:startOpacity,filter:'blur(6px)'},
      {transform:`scale(1.04) rotate(${Math.min(10,spin*.045)}deg) translateZ(0)`,opacity:1,filter:'blur(0px)',offset:.78},
      {transform:'scale(1) rotate(0deg) translateZ(0)',opacity:1,filter:'blur(0px)'}
    ],{duration,delay,easing,fill:'both'});
  }else{
    intro.animate([
      {transform:`scale(${fromScale}) translateZ(0)`,opacity:startOpacity,filter:'blur(5px)'},
      {transform:'scale(1.025) translateZ(0)',opacity:1,filter:'blur(0px)',offset:.72},
      {transform:'scale(1) translateZ(0)',opacity:1,filter:'blur(0px)'}
    ],{duration,delay,easing,fill:'both'});
  }
  if(state.shaderRole==='reveal'){
    const base=$('[data-base="1"]',intro);
    base?.getAnimations().forEach(a=>a.cancel());
    base?.animate([{opacity:0},{opacity:state.opacity,offset:.58},{opacity:0}],{duration,delay,easing:'ease-in-out',fill:'both'});
  }
};

const smsOldUpdateStatus=updateStatus;
updateStatus=function(){
  smsOldUpdateStatus();
  const summary=$('#motionSummary');
  if(summary)summary.textContent=`${fmt(state.revealDuration)}s · ${state.revealMode==='clockwise'?`${Math.round(state.revealRotationDegrees||0)}° spin`:'scale'} · ${state.revealEasing}`;
};

function syncMotionEnhancements(){
  const mode=$('#revealMode'),easing=$('#revealEasing'),rotation=$('#revealRotationDegrees'),rotationRow=$('#revealRotationRow'),startOpacity=$('#revealStartOpacity'),thickness=$('#glowStrokeThickness'),start=$('#introStartScale');
  if(mode)mode.value=state.revealMode||'scale';
  if(easing)easing.value=state.revealEasing||'smooth';
  if(rotation){rotation.value=state.revealRotationDegrees??220;updateOutput('revealRotationDegrees',state.revealRotationDegrees??220,'°')}
  if(rotationRow)rotationRow.hidden=state.revealMode!=='clockwise';
  if(startOpacity){startOpacity.value=state.revealStartOpacity??0;updateOutput('revealStartOpacity',state.revealStartOpacity??0,'%')}
  if(thickness){thickness.value=state.glowStrokeThickness||1;updateOutput('glowStrokeThickness',state.glowStrokeThickness||1)}
  if(start){start.min='.04';start.value=state.introStartScale;updateOutput('introStartScale',state.introStartScale)}
  updateStatus();
}

const smsOldSyncUi=syncUi;
syncUi=function(){smsOldSyncUi();syncMotionEnhancements()};

$('#revealMode')?.addEventListener('change',e=>{state.revealMode=e.target.value;syncMotionEnhancements();replayIntro()});
$('#revealEasing')?.addEventListener('change',e=>{state.revealEasing=e.target.value;syncMotionEnhancements();replayIntro()});
$('#revealRotationDegrees')?.addEventListener('input',e=>{state.revealRotationDegrees=parseFloat(e.target.value);updateOutput('revealRotationDegrees',state.revealRotationDegrees,'°');updateStatus();replayIntro()});
$('#revealStartOpacity')?.addEventListener('input',e=>{state.revealStartOpacity=parseFloat(e.target.value);updateOutput('revealStartOpacity',state.revealStartOpacity,'%');replayIntro()});
$('#glowStrokeThickness')?.addEventListener('input',e=>{state.glowStrokeThickness=parseFloat(e.target.value);updateOutput('glowStrokeThickness',state.glowStrokeThickness);scheduleRender()});

function rebindReplay(id){
  const old=$('#'+id);if(!old)return;
  const fresh=old.cloneNode(true);old.replaceWith(fresh);fresh.addEventListener('click',replayIntro);
}
rebindReplay('replayBtn');
rebindReplay('previewReplayBtn');

const smsOldApplyPreset=applyPreset;
applyPreset=function(p){
  smsOldApplyPreset(p);
  if(state.revealMode==null)state.revealMode='scale';
  if(state.revealEasing==null)state.revealEasing='smooth';
  if(state.revealRotationDegrees==null)state.revealRotationDegrees=220;
  if(state.revealStartOpacity==null)state.revealStartOpacity=0;
  if(state.glowStrokeThickness==null)state.glowStrokeThickness=1;
  syncMotionEnhancements();
};

const smsOldStandalone=buildStandaloneHtml;
buildStandaloneHtml=function(){
  let html=smsOldStandalone();
  const injection=`
<style>
.border-glow-star{left:-100%!important;top:-100%!important;width:300%!important;height:300%!important;overflow:visible!important}
.glow-mesh,.glow-light{overflow:visible!important;transform:scale(.33333333)!important;transform-origin:center!important}
.star-intro{overflow:visible!important}
</style>
<script>
const SMS_EASINGS={smooth:'cubic-bezier(.16,.84,.18,1)',easeout:'cubic-bezier(.22,1,.36,1)',snappy:'cubic-bezier(.34,1.56,.64,1)',linear:'linear',quint:'cubic-bezier(0.83,0,0.17,1)'};
const smsEasing=v=>SMS_EASINGS[v]||v||SMS_EASINGS.smooth;
replayAnimation=function(){const intro=document.getElementById('starIntro');if(!intro)return;const duration=PRESET.revealDuration*1000,delay=PRESET.revealDelay*1000,easing=smsEasing(PRESET.revealEasing),fromScale=Math.max(.04,Math.min(1,PRESET.introStartScale||.18)),spin=Math.max(0,Math.min(1080,PRESET.revealRotationDegrees??220)),startOpacity=Math.max(0,Math.min(1,(PRESET.revealStartOpacity??0)/100));intro.getAnimations().forEach(a=>a.cancel());if(PRESET.revealMode==='clockwise'){intro.animate([{transform:'scale('+fromScale+') rotate('+(-spin)+'deg) translateZ(0)',opacity:startOpacity,filter:'blur(6px)'},{transform:'scale(1.04) rotate('+Math.min(10,spin*.045)+'deg) translateZ(0)',opacity:1,filter:'blur(0px)',offset:.78},{transform:'scale(1) rotate(0deg) translateZ(0)',opacity:1,filter:'blur(0px)'}],{duration,delay,easing,fill:'both'})}else{intro.animate([{transform:'scale('+fromScale+') translateZ(0)',opacity:startOpacity,filter:'blur(5px)'},{transform:'scale(1.025) translateZ(0)',opacity:1,filter:'blur(0px)',offset:.72},{transform:'scale(1) translateZ(0)',opacity:1,filter:'blur(0px)'}],{duration,delay,easing,fill:'both'})}};
const w=PRESET.glowStrokeThickness||1;document.querySelectorAll('#borderGlowStar path').forEach(p=>{const sw=parseFloat(p.getAttribute('stroke-width'));if(Number.isFinite(sw))p.setAttribute('stroke-width',String(sw*w))});
requestAnimationFrame(replayAnimation);
<\/script>`;
  return html.replace('</body>',injection+'</body>');
};

syncMotionEnhancements();
renderPreview();
requestAnimationFrame(replayIntro);
