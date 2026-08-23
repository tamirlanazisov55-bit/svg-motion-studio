// Motion + glow controls added without duplicating the editor runtime.
const SMS_EASINGS={
  smooth:'cubic-bezier(.16,.84,.18,1)',
  easeout:'cubic-bezier(.22,1,.36,1)',
  snappy:'cubic-bezier(.34,1.56,.64,1)',
  linear:'linear'
};
const smsEasing=v=>SMS_EASINGS[v]||v||SMS_EASINGS.smooth;

if(state.revealMode==null)state.revealMode='scale';
if(state.revealEasing==null)state.revealEasing='smooth';
if(state.glowStrokeThickness==null)state.glowStrokeThickness=1;
if(state.introStartScale===.82)state.introStartScale=.18;

try{
  if(window.CSS?.registerProperty){
    CSS.registerProperty({name:'--sms-reveal-angle',syntax:'<angle>',inherits:false,initialValue:'0deg'});
  }
}catch{}

const smsStyle=document.createElement('style');
smsStyle.textContent=`
.star-intro{--sms-reveal-angle:360deg}
.star-intro.sms-clockwise-reveal{
  mask-image:conic-gradient(from -90deg at 50% 50%,#000 0deg,#000 var(--sms-reveal-angle),transparent calc(var(--sms-reveal-angle) + .15deg),transparent 360deg);
  -webkit-mask-image:conic-gradient(from -90deg at 50% 50%,#000 0deg,#000 var(--sms-reveal-angle),transparent calc(var(--sms-reveal-angle) + .15deg),transparent 360deg);
}
`;
document.head.appendChild(smsStyle);

buildGlowMarkup=function(){
  const r=state.glowRadius/40,intensity=state.glowIntensity,c=state.glowColor,mesh=state.colors.slice(0,3),w=state.glowStrokeThickness||1;
  return `<div class="border-glow-star ${state.glowEnabled?'':'glow-disabled'}" id="borderGlowStar" style="--edge-sensitivity:${state.glowEdgeSensitivity};--cone-spread:${state.glowConeSpread}"><svg class="glow-mesh" viewBox="${STAR_VIEWBOX}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="meshGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mesh[0]}"/><stop offset=".52" stop-color="${mesh[1]}"/><stop offset="1" stop-color="${mesh[2]}"/></linearGradient></defs><path d="${STAR_PATH}" fill="none" stroke="url(#meshGradient)" stroke-width="${1.7*w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(1,.9*intensity)}"/><path d="${STAR_PATH}" fill="none" stroke="url(#meshGradient)" stroke-width="${4*r*w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(1,.26*intensity)}" style="filter:blur(${2.4*r*w}px)"/></svg><svg class="glow-light" viewBox="${STAR_VIEWBOX}" xmlns="http://www.w3.org/2000/svg"><path d="${STAR_PATH}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(1,intensity)}"/><path d="${STAR_PATH}" fill="none" stroke="${c}" stroke-width="${2.3*r*w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(1,.58*intensity)}" style="filter:blur(${.8*r*w}px)"/><path d="${STAR_PATH}" fill="none" stroke="${c}" stroke-width="${4.8*r*w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(1,.34*intensity)}" style="filter:blur(${2.2*r*w}px)"/><path d="${STAR_PATH}" fill="none" stroke="${c}" stroke-width="${8.5*r*w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(1,.18*intensity)}" style="filter:blur(${5*r*w}px)"/></svg></div>`;
};

replayIntro=function(){
  const intro=$('#starIntro');if(!intro)return;
  const duration=state.revealDuration*1000,delay=state.revealDelay*1000,easing=smsEasing(state.revealEasing),fromScale=Math.max(.04,Math.min(1,state.introStartScale||.18));
  intro.getAnimations().forEach(a=>a.cancel());
  intro.classList.toggle('sms-clockwise-reveal',state.revealMode==='clockwise');
  intro.style.setProperty('--sms-reveal-angle',state.revealMode==='clockwise'?'0deg':'360deg');
  if(state.revealMode==='clockwise'){
    intro.animate([
      {transform:`scale(${fromScale}) translateZ(0)`,opacity:.14,filter:'blur(6px)','--sms-reveal-angle':'0deg'},
      {transform:'scale(1.025) translateZ(0)',opacity:1,filter:'blur(0px)','--sms-reveal-angle':'345deg',offset:.9},
      {transform:'scale(1) translateZ(0)',opacity:1,filter:'blur(0px)','--sms-reveal-angle':'360deg'}
    ],{duration,delay,easing,fill:'both'});
  }else{
    intro.animate([
      {transform:`scale(${fromScale}) translateZ(0)`,opacity:0,filter:'blur(5px)'},
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
  if(summary)summary.textContent=`${fmt(state.revealDuration)}s · ${state.revealMode==='clockwise'?'clockwise':'scale'} · ${state.revealEasing}`;
};

function syncMotionEnhancements(){
  const mode=$('#revealMode'),easing=$('#revealEasing'),thickness=$('#glowStrokeThickness'),start=$('#introStartScale');
  if(mode)mode.value=state.revealMode||'scale';
  if(easing)easing.value=state.revealEasing||'smooth';
  if(thickness){thickness.value=state.glowStrokeThickness||1;updateOutput('glowStrokeThickness',state.glowStrokeThickness||1)}
  if(start){start.min='.04';start.value=state.introStartScale;updateOutput('introStartScale',state.introStartScale)}
  updateStatus();
}

$('#revealMode')?.addEventListener('change',e=>{state.revealMode=e.target.value;syncMotionEnhancements();replayIntro()});
$('#revealEasing')?.addEventListener('change',e=>{state.revealEasing=e.target.value;syncMotionEnhancements();replayIntro()});
$('#glowStrokeThickness')?.addEventListener('input',e=>{state.glowStrokeThickness=parseFloat(e.target.value);updateOutput('glowStrokeThickness',state.glowStrokeThickness);scheduleRender()});
$('#replayBtn')?.addEventListener('click',()=>requestAnimationFrame(replayIntro));
$('#previewReplayBtn')?.addEventListener('click',()=>requestAnimationFrame(replayIntro));

const smsOldApplyPreset=applyPreset;
applyPreset=function(p){
  smsOldApplyPreset(p);
  if(state.revealMode==null)state.revealMode='scale';
  if(state.revealEasing==null)state.revealEasing='smooth';
  if(state.glowStrokeThickness==null)state.glowStrokeThickness=1;
  syncMotionEnhancements();
};

const smsOldStandalone=buildStandaloneHtml;
buildStandaloneHtml=function(){
  let html=smsOldStandalone();
  const injection=`\n<style>.star-intro{--sms-reveal-angle:360deg}.star-intro.sms-clockwise-reveal{mask-image:conic-gradient(from -90deg at 50% 50%,#000 0deg,#000 var(--sms-reveal-angle),transparent calc(var(--sms-reveal-angle) + .15deg),transparent 360deg);-webkit-mask-image:conic-gradient(from -90deg at 50% 50%,#000 0deg,#000 var(--sms-reveal-angle),transparent calc(var(--sms-reveal-angle) + .15deg),transparent 360deg)}</style>\n<script>\ntry{if(window.CSS?.registerProperty){CSS.registerProperty({name:'--sms-reveal-angle',syntax:'<angle>',inherits:false,initialValue:'0deg'})}}catch{}\nconst SMS_EASINGS={smooth:'cubic-bezier(.16,.84,.18,1)',easeout:'cubic-bezier(.22,1,.36,1)',snappy:'cubic-bezier(.34,1.56,.64,1)',linear:'linear'};\nconst smsEasing=v=>SMS_EASINGS[v]||v||SMS_EASINGS.smooth;\nconst smsOldGlowMarkup=glowMarkup;\nglowMarkup=function(){const r=PRESET.glowRadius/40,intensity=PRESET.glowIntensity,c=PRESET.glowColor,mesh=PRESET.colors.slice(0,3),w=PRESET.glowStrokeThickness||1;return '<div class="border-glow-star '+(PRESET.glowEnabled?'':'glow-disabled')+'" id="borderGlowStar" style="--edge-sensitivity:'+PRESET.glowEdgeSensitivity+';--cone-spread:'+PRESET.glowConeSpread+'"><svg class="glow-mesh" viewBox="'+STAR_VIEWBOX+'" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="meshGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+mesh[0]+'"/><stop offset=".52" stop-color="'+mesh[1]+'"/><stop offset="1" stop-color="'+mesh[2]+'"/></linearGradient></defs><path d="'+STAR_PATH+'" fill="none" stroke="url(#meshGradient)" stroke-width="'+(1.7*w)+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+Math.min(1,.9*intensity)+'"/><path d="'+STAR_PATH+'" fill="none" stroke="url(#meshGradient)" stroke-width="'+(4*r*w)+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+Math.min(1,.26*intensity)+'" style="filter:blur('+(2.4*r*w)+'px)"/></svg><svg class="glow-light" viewBox="'+STAR_VIEWBOX+'" xmlns="http://www.w3.org/2000/svg"><path d="'+STAR_PATH+'" fill="none" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+Math.min(1,intensity)+'"/><path d="'+STAR_PATH+'" fill="none" stroke="'+c+'" stroke-width="'+(2.3*r*w)+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+Math.min(1,.58*intensity)+'" style="filter:blur('+(.8*r*w)+'px)"/><path d="'+STAR_PATH+'" fill="none" stroke="'+c+'" stroke-width="'+(4.8*r*w)+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+Math.min(1,.34*intensity)+'" style="filter:blur('+(2.2*r*w)+'px)"/><path d="'+STAR_PATH+'" fill="none" stroke="'+c+'" stroke-width="'+(8.5*r*w)+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+Math.min(1,.18*intensity)+'" style="filter:blur('+(5*r*w)+'px)"/></svg></div>'};\nreplayAnimation=function(){const intro=document.getElementById('starIntro');if(!intro)return;const duration=PRESET.revealDuration*1000,delay=PRESET.revealDelay*1000,easing=smsEasing(PRESET.revealEasing),fromScale=Math.max(.04,Math.min(1,PRESET.introStartScale||.18));intro.getAnimations().forEach(a=>a.cancel());intro.classList.toggle('sms-clockwise-reveal',PRESET.revealMode==='clockwise');intro.style.setProperty('--sms-reveal-angle',PRESET.revealMode==='clockwise'?'0deg':'360deg');if(PRESET.revealMode==='clockwise'){intro.animate([{transform:'scale('+fromScale+') translateZ(0)',opacity:.14,filter:'blur(6px)','--sms-reveal-angle':'0deg'},{transform:'scale(1.025) translateZ(0)',opacity:1,filter:'blur(0px)','--sms-reveal-angle':'345deg',offset:.9},{transform:'scale(1) translateZ(0)',opacity:1,filter:'blur(0px)','--sms-reveal-angle':'360deg'}],{duration,delay,easing,fill:'both'})}else{intro.animate([{transform:'scale('+fromScale+') translateZ(0)',opacity:0,filter:'blur(5px)'},{transform:'scale(1.025) translateZ(0)',opacity:1,filter:'blur(0px)',offset:.72},{transform:'scale(1) translateZ(0)',opacity:1,filter:'blur(0px)'}],{duration,delay,easing,fill:'both'})}};\n<\/script>\n`;
  return html.replace('</head>',injection+'</head>');
};

syncMotionEnhancements();
renderPreview();
requestAnimationFrame(replayIntro);
