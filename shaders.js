/*
  Shader runtime for Star Shader Lab.
  GradFlow family is an original WebGL2 reimplementation inspired by the MIT-licensed GradFlow project.
  Chromatic Shadow is an original silhouette-lighting shader inspired by the VFX-JS CodePen reference supplied by the user.
*/
const VERT300=`#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;

const COMMON=`
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[4];
uniform float uSpeed;
uniform float uScale;
uniform float uIntensity;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform int uGradType;
uniform float uNoise;
const float PI=3.14159265359;
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float valueNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash21(i),b=hash21(i+vec2(1,0)),c=hash21(i+vec2(0,1)),d=hash21(i+vec2(1,1));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*valueNoise(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return v;}
vec3 palette(float t){t=fract(t)*3.;if(t<1.)return mix(uColors[0],uColors[1],t);if(t<2.)return mix(uColors[1],uColors[2],t-1.);return mix(uColors[2],uColors[3],t-2.);}
`;

const FRAG_STRANDS=`#version 300 es
${COMMON}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uResolution)/uResolution.y/max(uScale,.001);
  float env=pow(max(cos(uv.x*PI*1.22),0.),2.7);
  vec3 col=vec3(0.);
  float tt=uTime*uSpeed;
  for(int i=0;i<5;i++){
    float fi=float(i);
    float y=(sin(uv.x*(2.2+fi*.37)+tt*(1.1+fi*.42)+fi*1.7)*.62+sin(uv.x*(4.1+fi*.23)-tt*(.7+fi*.2))* .38)*(.11+.015*fi)*env;
    float d=abs(uv.y-y);
    float thick=.008+.015*uIntensity;
    float glow=thick/(d+thick*.55); glow*=glow;
    col+=palette(fi*.18+uv.x*.25+tt*.025)*glow*env;
  }
  col=1.-exp(-col*(1.4+uIntensity*1.9));
  float a=clamp(max(max(col.r,col.g),col.b),0.,1.);
  fragColor=vec4(col,a);
}`;

const FRAG_GALAXY=`#version 300 es
${COMMON}
float star(vec2 p,float seed){
  vec2 q=fract(p)-.5;
  float d=length(q);
  float s=smoothstep(.08,.005,d);
  float flare=(smoothstep(.98,.86,abs(q.x*45.))*smoothstep(.98,.86,abs(q.y*3.))+smoothstep(.98,.86,abs(q.y*45.))*smoothstep(.98,.86,abs(q.x*3.)))*.08;
  return (s+flare)*(.45+.85*hash21(floor(p)+seed));
}
void main(){
  vec2 uv=(vUv-.5)*vec2(uResolution.x/uResolution.y,1.);
  float t=uTime*uSpeed*.18;
  float rot=t*.35;mat2 r=mat2(cos(rot),-sin(rot),sin(rot),cos(rot));uv=r*uv;
  vec3 col=vec3(0.);
  for(int layer=0;layer<4;layer++){
    float l=float(layer);float z=fract(l*.247+t*.09);float scale=mix(18.,3.,z)*uScale;
    vec2 p=uv*scale+l*vec2(13.7,7.3);
    vec2 cell=floor(p);
    float sd=hash21(cell+l);
    vec2 drift=vec2(sin(t*7.+sd*9.),cos(t*5.+sd*8.))*.14;
    float s=star(p+drift,sd)*smoothstep(1.,.05,z);
    col+=palette(sd+.1*l)*s*(.6+uIntensity*.75);
  }
  float a=clamp(max(max(col.r,col.g),col.b),0.,1.);
  fragColor=vec4(col,a);
}`;

const FRAG_PRISMATIC=`#version 300 es
${COMMON}
void main(){
  vec2 uv=(vUv-.5)*vec2(uResolution.x/uResolution.y,1.);
  float t=uTime*uSpeed*.5;
  float r=length(uv);
  float a=atan(uv.y,uv.x);
  float rays=pow(max(0.,.5+.5*sin(a*9.+sin(a*3.-t)*2.+t*1.4)),4.);
  float swirl=fract(r*(5.5/uScale)-t*.22+a/PI*.27);
  vec3 col=palette(swirl*1.15+a/PI*.18+t*.04);
  float core=smoothstep(.78,.02,r);
  float bands=.38+.9*pow(max(0.,sin((r*12.-t*1.6)+a*2.)),2.);
  col*=core*(.22+rays*1.45+bands*.5)*(1.1*uIntensity);
  col+=palette(a/6.283+t*.05)*rays*core*.7;
  float alpha=clamp(max(max(col.r,col.g),col.b),0.,1.);
  fragColor=vec4(col,alpha);
}`;

const FRAG_SIDERAYS=`#version 300 es
${COMMON}
float beam(vec2 p,vec2 dir,float width,float phase){float perp=abs(p.x*dir.y-p.y*dir.x);float along=dot(p,dir);return exp(-perp*perp/width)*smoothstep(-.45,.9,along)*(.65+.35*sin(along*9.-uTime*uSpeed*2.+phase));}
void main(){
  vec2 p=(vUv-.5)*vec2(uResolution.x/uResolution.y,1.);
  p/=max(uScale,.001);
  vec2 src=vec2(-.72,.64);
  vec2 q=p-src;
  vec2 d1=normalize(vec2(.86,-.5)),d2=normalize(vec2(.7,-.72)),d3=normalize(vec2(.97,-.24));
  float b1=beam(q,d1,.006,0.),b2=beam(q,d2,.014,1.7),b3=beam(q,d3,.009,3.1);
  vec3 col=uColors[0]*b1+uColors[1]*b2+uColors[2]*b3;
  float fall=1./(1.+length(q)*1.35);col*=fall*(1.2+uIntensity*1.5);
  float a=clamp(max(max(col.r,col.g),col.b),0.,1.);
  fragColor=vec4(col,a);
}`;

const FRAG_SILK=`#version 300 es
${COMMON}
void main(){
  vec2 uv=(vUv-.5)*uScale;
  float t=uTime*uSpeed;
  uv.y+=.06*sin(uv.x*8.-t*.8);
  float f=sin((uv.x+uv.y)*7.+sin(uv.x*10.+t*.5)*1.6+cos(uv.y*8.-t*.35)*1.2);
  float f2=sin(uv.x*4.-uv.y*9.+t*.4);
  float m=.5+.5*f*.7+.15*f2;
  vec3 c1=m<.5?mix(uColors[0],uColors[1],m*2.):mix(uColors[1],uColors[2],(m-.5)*2.);
  float sheen=pow(max(0.,.5+.5*sin((uv.x-uv.y)*13.+t*.25)),5.);
  vec3 col=c1+uColors[3]*sheen*.32;
  col*=.65+uIntensity*.55;
  float grain=(hash21(gl_FragCoord.xy+uTime)-.5)*.035*uNoise;
  fragColor=vec4(clamp(col+grain,0.,1.),1.);
}`;

const FRAG_GRADFLOW=`#version 300 es
${COMMON}
vec3 triMix(float t){t=clamp(t,0.,1.);return t<.5?mix(uColors[0],uColors[1],t*2.):mix(uColors[1],uColors[2],(t-.5)*2.);}
vec3 gradLinear(vec2 uv,float t){float k=uv.y+.1*sin(uv.x*PI*2.+t);return triMix(k);}
vec3 gradConic(vec2 uv,float t){vec2 p=uv-.5;float a=atan(p.y,p.x)/6.2831853+.5;float k=fract(a*uScale+t*.08);return palette(k*.92);}
vec3 gradAnimated(vec2 uv,float t){vec2 p=uv-.5;float ang=(fbm(vec2(t*.08,p.x*p.y*3.))-.5)*6.0;mat2 r=mat2(cos(ang),-sin(ang),sin(ang),cos(ang));p=r*p;float f=sin((p.x+p.y)*9.*uScale+t*1.4)*.08;return triMix(clamp(.5+p.x*1.1+p.y*.72+f,0.,1.));}
vec3 gradWave(vec2 uv,float t){float k=uv.y+.09*sin(uv.x*PI*2.*uScale+t*.8)+.12*sin(uv.x*PI*uScale-t*.45)+.06*sin(uv.x*PI*4.*uScale+t*.35);return triMix(clamp(k,0.,1.));}
vec3 gradSilk(vec2 uv,float t){vec2 p=(uv-.5)*uScale;float a=0.,d=-t*.35;for(int i=0;i<7;i++){float fi=float(i);a+=cos(fi-d-a*p.x)*.24;d+=sin(p.y*fi+a)*.22;}float x=.5+.5*cos(p.x*d+a),y=.5+.5*cos(p.y*a+d),z=.5+.5*cos((p.x+p.y)*(d+a)*.5);vec3 c=mix(mix(uColors[0],uColors[1],x),mix(uColors[1],uColors[2],y),z);return mix(c,c*(.55+.45*z),.35);}
vec3 gradSmoke(vec2 uv,float t){vec2 p=(uv-.5)*2.*uScale;for(int i=1;i<8;i++){float fi=float(i);p.x+=.45/fi*sin(fi*p.y+t+.31*fi);p.y+=.45/fi*sin(fi*p.x+t*.83+.27*(fi+8.));}float a=.5+.5*sin(p.y),b=.5+.5*sin(p.x+p.y);return mix(mix(uColors[0],uColors[1],a),uColors[2],b);}
vec3 gradStripe(vec2 uv,float t){vec2 p=(uv-.5)*2.*uScale;float a=4.*p.y-sin(-p.x*3.+p.y-t*.7);float s=smoothstep(-.25,.7,cos(a-4.*p.y)-sin(a+3.*p.x));vec2 w=(cos(a)*p+sin(a)*vec2(-p.y,p.x))*.28+.5;vec3 c=mix(uColors[0],uColors[1],clamp(w.x,0.,1.));c=mix(c,uColors[2],clamp(w.y,0.,1.));return c*(.78+.45*s);}
vec3 gradMesh(vec2 uv,float t){float ratio=uResolution.x/uResolution.y;vec2 p=vec2(uv.x*ratio,uv.y);float tt=t*.4;vec2 c1=vec2((.28+.25*sin(tt*.9))*ratio,.42+.29*cos(tt*.7)),c2=vec2((.72+.22*cos(tt*.8))*ratio,.58+.28*sin(tt*1.1)),c3=vec2((.5+.29*sin(tt*.6+2.))*ratio,.5+.32*cos(tt*.9+4.));float fall=1.6+uScale*2.1;float w1=exp(-fall*dot(p-c1,p-c1)),w2=exp(-fall*dot(p-c2,p-c2)),w3=exp(-fall*dot(p-c3,p-c3)),wb=.08;vec3 base=mix(uColors[0],uColors[2],uv.y);return (uColors[0]*w1+uColors[1]*w2+uColors[2]*w3+base*wb)/(w1+w2+w3+wb);}
vec3 gradAurora(vec2 uv,float t){float tt=t*.28;float curve=fbm(vec2(uv.x*2.2*uScale+tt*.5,tt*.3))-.5;float y=uv.y+curve*.5;float band=smoothstep(.12,.5,y)*smoothstep(1.08,.57,y);float shimmer=fbm(vec2(uv.x*5.*uScale-tt*.8,y*3.+tt*.5));float inten=band*(.45+.95*shimmer);vec3 sky=mix(uColors[1],uColors[1]*.28,uv.y);vec3 curtain=mix(uColors[0],uColors[2],clamp(y+(shimmer-.5)*.6,0.,1.));return sky+curtain*inten;}
void main(){
  vec2 uv=vUv;float t=uTime*uSpeed;vec3 col;
  if(uGradType==0)col=gradLinear(uv,t);else if(uGradType==1)col=gradConic(uv,t);else if(uGradType==2)col=gradAnimated(uv,t);else if(uGradType==3)col=gradWave(uv,t);else if(uGradType==4)col=gradSilk(uv,t);else if(uGradType==5)col=gradSmoke(uv,t);else if(uGradType==6)col=gradStripe(uv,t);else if(uGradType==7)col=gradMesh(uv,t);else col=gradAurora(uv,t);
  if(uNoise>.001){float g=hash21(uv*vec2(233.,197.)+t*.03);col*=1.-uNoise*.32+g*uNoise*.32;}
  col*=.7+uIntensity*.45;
  fragColor=vec4(clamp(col,0.,1.),1.);
}`;

const FRAG_SHADOW=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uShape;
uniform vec2 uResolution;
uniform vec2 uLight;
uniform vec4 uShapeRect;
uniform vec3 uColors[4];
uniform float uIntensity;
uniform float uReach;
uniform float uJitter;
uniform float uTime;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float shapeAt(vec2 uv){vec2 q=(uv-uShapeRect.xy)/uShapeRect.zw;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return 0.;return texture(uShape,q).r;}
vec3 pal(float t){t=fract(t)*3.;if(t<1.)return mix(uColors[0],uColors[1],t);if(t<2.)return mix(uColors[1],uColors[2],t-1.);return mix(uColors[2],uColors[3],t-2.);}
void main(){
  vec2 uv=vUv;if(shapeAt(uv)>.18){discard;}
  vec2 asp=vec2(uResolution.x/uResolution.y,1.);vec2 p=(uv-.5)*asp;vec2 lp=(uLight-.5)*asp;
  vec2 ray=(lp-p)/52.;float occ=0.;vec2 q=uv;
  for(int i=0;i<52;i++){
    float fi=float(i);vec2 j=vec2(hash(gl_FragCoord.xy+fi+uTime),hash(gl_FragCoord.yx-fi-uTime))-.5;
    q+=ray/asp*uReach+j*(.0012*uJitter);
    occ+=shapeAt(q)/52.;
  }
  float d=length(p-lp);float fall=exp(-d*1.35);float edge=smoothstep(.015,.22,occ);float body=pow(occ,.72);
  float chroma=fract(body*2.8+d*.7+atan(p.y-lp.y,p.x-lp.x)/6.2831853+.5);
  vec3 rainbow=pal(chroma);
  vec3 white=vec3(.95,.97,1.);
  vec3 col=mix(white,rainbow,.78)*body*fall*(1.8*uIntensity);
  col-=vec3(body*body*.18);
  float grain=(hash(gl_FragCoord.xy+uTime*41.)-.5)*.025*uJitter;col+=grain;
  float alpha=clamp(edge*fall*(.42+body)*uIntensity,0.,1.);
  fragColor=vec4(max(col,0.),alpha);
}`;

const GRAD_TYPE_IDS={linear:0,conic:1,animated:2,wave:3,silk:4,smoke:5,stripe:6,mesh:7,aurora:8};

function hexRgb(hex){const h=(hex||'#fff').replace('#','');const x=h.length===3?[...h].map(c=>c+c).join(''):h;const n=parseInt(x.slice(0,6),16);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255]}
function compileGL(gl,type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(sh);gl.deleteShader(sh);throw new Error(msg||'Shader compile failed')}return sh}
function makeProgram(gl,frag){const vs=compileGL(gl,gl.VERTEX_SHADER,VERT300),fs=compileGL(gl,gl.FRAGMENT_SHADER,frag),p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const msg=gl.getProgramInfoLog(p);throw new Error(msg||'Shader link failed')}return {program:p,vs,fs}}
function bindQuad(gl,program){const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);return buf}
function paletteUniform(gl,program,colors){const packed=[];for(let i=0;i<4;i++)packed.push(...hexRgb(colors[i]||colors[colors.length-1]||'#FFFFFF'));const loc=gl.getUniformLocation(program,'uColors[0]');if(loc!==null)gl.uniform3fv(loc,new Float32Array(packed))}

function runShaderCanvas(canvas,opts={}){
  const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:false,antialias:true,powerPreference:'high-performance'});if(!gl)throw new Error('WebGL2 unavailable');
  const frag={strands:FRAG_STRANDS,galaxy:FRAG_GALAXY,prismatic:FRAG_PRISMATIC,siderays:FRAG_SIDERAYS,silk:FRAG_SILK,gradflow:FRAG_GRADFLOW}[opts.mode]||FRAG_STRANDS;
  const {program,vs,fs}=makeProgram(gl,frag);gl.useProgram(program);const buf=bindQuad(gl,program);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  const U=n=>gl.getUniformLocation(program,n),u1=(n,v)=>{const l=U(n);if(l!==null)gl.uniform1f(l,v)},ui=(n,v)=>{const l=U(n);if(l!==null)gl.uniform1i(l,v)},u2=(n,a,b)=>{const l=U(n);if(l!==null)gl.uniform2f(l,a,b)};
  paletteUniform(gl,program,opts.colors||['#ff4242','#7c3aed','#06b6d4','#eab308']);
  ui('uGradType',GRAD_TYPE_IDS[opts.gradType||'aurora']??8);u1('uNoise',opts.noise??.2);
  let raf=0,dead=false,ro=null;const target=opts.target||canvas.parentElement;let mouse=[.5,.5],active=0,targetActive=0;
  const move=e=>{if(!target)return;const r=target.getBoundingClientRect();mouse=[(e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height];targetActive=1};const leave=()=>targetActive=0;target?.addEventListener('pointermove',move);target?.addEventListener('pointerleave',leave);
  const resize=()=>{const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}gl.viewport(0,0,w,h)};ro=new ResizeObserver(resize);ro.observe(canvas);resize();const t0=performance.now();
  const frame=now=>{if(dead)return;resize();active+=(targetActive-active)*.08;gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);u1('uTime',(now-t0)/1000);u2('uResolution',canvas.width,canvas.height);u1('uSpeed',opts.speed??1);u1('uScale',opts.scale??1);u1('uIntensity',opts.intensity??1);u2('uMouse',mouse[0],mouse[1]);u1('uMouseActive',active);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);raf=requestAnimationFrame(frame)};raf=requestAnimationFrame(frame);
  return()=>{dead=true;cancelAnimationFrame(raf);ro?.disconnect();target?.removeEventListener('pointermove',move);target?.removeEventListener('pointerleave',leave);try{gl.deleteBuffer(buf);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);gl.getExtension('WEBGL_lose_context')?.loseContext()}catch{}}
}

function makeShapeTexture(gl,path,viewW,viewH){const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');ctx.clearRect(0,0,256,256);ctx.fillStyle='#fff';ctx.save();ctx.scale(256/viewW,256/viewH);ctx.fill(new Path2D(path));ctx.restore();const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);return tex}

function runVfxShadowCanvas(canvas,opts={}){
  const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:false,antialias:true,powerPreference:'high-performance'});if(!gl)throw new Error('WebGL2 unavailable');
  const {program,vs,fs}=makeProgram(gl,FRAG_SHADOW);gl.useProgram(program);const buf=bindQuad(gl,program);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  const tex=makeShapeTexture(gl,opts.path,opts.viewW||96.5049,opts.viewH||93.666);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);const shapeLoc=gl.getUniformLocation(program,'uShape');if(shapeLoc!==null)gl.uniform1i(shapeLoc,0);paletteUniform(gl,program,opts.colors||['#ff4242','#7c3aed','#06b6d4','#eab308']);
  const U=n=>gl.getUniformLocation(program,n),u1=(n,v)=>{const l=U(n);if(l!==null)gl.uniform1f(l,v)},u2=(n,a,b)=>{const l=U(n);if(l!==null)gl.uniform2f(l,a,b)},u4=(n,a,b,c,d)=>{const l=U(n);if(l!==null)gl.uniform4f(l,a,b,c,d)};
  const rect=opts.shapeRect||[.2917,.2917,.4166,.4166];u4('uShapeRect',...rect);u1('uIntensity',opts.intensity??1);u1('uReach',opts.reach??1);u1('uJitter',opts.jitter??.55);
  let raf=0,dead=false,ro=null;const target=opts.target||canvas.parentElement;let pointer=[.26,.74],pointerActive=0;const move=e=>{const r=canvas.getBoundingClientRect();pointer=[(e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height];pointerActive=1};const leave=()=>{pointerActive=0};target?.addEventListener('pointermove',move);target?.addEventListener('pointerleave',leave);
  const resize=()=>{const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.5),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}gl.viewport(0,0,w,h)};ro=new ResizeObserver(resize);ro.observe(canvas);resize();const t0=performance.now();
  const frame=now=>{if(dead)return;resize();const t=(now-t0)/1000;let light=pointer;if((opts.lightMode||'pointer')==='orbit'&&!pointerActive){light=[.5+.34*Math.cos(t*.45),.5+.34*Math.sin(t*.45)]}gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);u2('uResolution',canvas.width,canvas.height);u2('uLight',light[0],light[1]);u1('uTime',t);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);raf=requestAnimationFrame(frame)};raf=requestAnimationFrame(frame);
  return()=>{dead=true;cancelAnimationFrame(raf);ro?.disconnect();target?.removeEventListener('pointermove',move);target?.removeEventListener('pointerleave',leave);try{gl.deleteTexture(tex);gl.deleteBuffer(buf);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);gl.getExtension('WEBGL_lose_context')?.loseContext()}catch{}}
}
