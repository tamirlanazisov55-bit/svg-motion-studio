/* WebGL shader sources adapted from ReactBits reference implementations. */
  const VERT300=`#version 300 es
  in vec2 aPosition;
  out vec2 vUv;
  void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;

  const FRAG_STRANDS=`#version 300 es
  precision highp float;
  uniform float uTime;uniform vec2 uResolution;uniform vec3 uColors[8];uniform int uColorCount;uniform int uStrandCount;
  uniform float uSpeed;uniform float uAmplitude;uniform float uWaviness;uniform float uThickness;uniform float uGlow;uniform float uTaper;
  uniform float uSpread;uniform float uHueShift;uniform float uIntensity;uniform float uScale;uniform float uSaturation;
  out vec4 fragColor;const float PI=3.14159265;
  vec3 spectrum(float t){return .5+.5*cos(2.*PI*(t+vec3(0.,.33,.67)));}
  vec3 samplePalette(float t){t=fract(t);float scaled=t*float(uColorCount);int idx=int(floor(scaled));float blend=fract(scaled);int nextIdx=idx+1;if(nextIdx>=uColorCount)nextIdx=0;return mix(uColors[idx],uColors[nextIdx],blend);}
  vec3 strandColor(float t){if(uColorCount>0)return samplePalette(t);return spectrum(t);}
  void main(){vec2 uv=(gl_FragCoord.xy-.5*uResolution)/uResolution.y;uv/=max(uScale,.0001);float e=.06+uIntensity*.94;float env=pow(max(cos(uv.x*PI*1.3),0.),uTaper);vec3 col=vec3(0.);
  for(int i=0;i<12;i++){if(i>=uStrandCount)break;float fi=float(i);float ph=fi*1.7*uSpread;float freq=(2.+fi*.35)*uWaviness;float spd=1.4+fi*1.2;float tt=uTime*uSpeed;
  float w=sin(uv.x*freq+tt*spd+ph)*.60+sin(uv.x*freq*1.1-tt*spd*.7+ph*1.7)*.40;float amp=(.1+.02*e)*env*uAmplitude;float y=w*amp;float d=abs(uv.y-y);
  float thick=(.001+.05*e)*(.35+env)*uThickness;float g=thick/(d+thick*.45);g*=g;float h=fi/float(uStrandCount)+uv.x*.30+uTime*.04+uHueShift;col+=strandColor(h)*g*env;}
  col*=.45+.7*e;col=1.-exp(-col*uGlow);float gray=dot(col,vec3(.2126,.7152,.0722));col=max(mix(vec3(gray),col,uSaturation),0.);float lum=max(max(col.r,col.g),col.b);float alpha=clamp(lum,0.,1.);fragColor=vec4(col,alpha);}`;

  const FRAG_GALAXY=`#version 300 es
  precision highp float;uniform float uTime;uniform vec3 uResolution;uniform vec2 uFocal;uniform vec2 uRotation;uniform float uStarSpeed;uniform float uDensity;
  uniform float uHueShift;uniform float uSpeed;uniform vec2 uMouse;uniform float uGlowIntensity;uniform float uSaturation;uniform bool uMouseRepulsion;
  uniform float uTwinkleIntensity;uniform float uRotationSpeed;uniform float uRepulsionStrength;uniform float uMouseActiveFactor;uniform float uAutoCenterRepulsion;
  in vec2 vUv;out vec4 fragColor;
  #define NUM_LAYER 4.0
  #define STAR_COLOR_CUTOFF 0.2
  #define MAT45 mat2(0.7071,-0.7071,0.7071,0.7071)
  #define PERIOD 3.0
  float Hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
  float tri(float x){return abs(fract(x)*2.-1.);}float tris(float x){float t=fract(x);return 1.-smoothstep(0.,1.,abs(2.*t-1.));}
  float trisn(float x){float t=fract(x);return 2.*(1.-smoothstep(0.,1.,abs(2.*t-1.)))-1.;}
  vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}
  float Star(vec2 uv,float flare){float d=length(uv);float m=(.05*uGlowIntensity)/max(d,.0001);float rays=smoothstep(0.,1.,1.-abs(uv.x*uv.y*1000.));m+=rays*flare*uGlowIntensity;uv*=MAT45;rays=smoothstep(0.,1.,1.-abs(uv.x*uv.y*1000.));m+=rays*.3*flare*uGlowIntensity;m*=smoothstep(1.,.2,d);return m;}
  vec3 StarLayer(vec2 uv){vec3 col=vec3(0.);vec2 gv=fract(uv)-.5;vec2 id=floor(uv);for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){vec2 offset=vec2(float(x),float(y));vec2 si=id+offset;float seed=Hash21(si);float size=fract(seed*345.32);float glossLocal=tri(uStarSpeed/(PERIOD*seed+1.));float flareSize=smoothstep(.9,1.,size)*glossLocal;float red=smoothstep(STAR_COLOR_CUTOFF,1.,Hash21(si+1.))+STAR_COLOR_CUTOFF;float blu=smoothstep(STAR_COLOR_CUTOFF,1.,Hash21(si+3.))+STAR_COLOR_CUTOFF;float grn=min(red,blu)*seed;vec3 base=vec3(red,grn,blu);float hue=atan(base.g-base.r,base.b-base.r)/(2.*3.14159)+.5;hue=fract(hue+uHueShift/360.);float sat=length(base-vec3(dot(base,vec3(.299,.587,.114))))*uSaturation;float val=max(max(base.r,base.g),base.b);base=hsv2rgb(vec3(hue,sat,val));vec2 pad=vec2(tris(seed*34.+uTime*uSpeed/10.),tris(seed*38.+uTime*uSpeed/30.))-.5;float star=Star(gv-offset-pad,flareSize);float twinkle=trisn(uTime*uSpeed+seed*6.2831)*.5+1.;twinkle=mix(1.,twinkle,uTwinkleIntensity);star*=twinkle;col+=star*size*base;}}return col;}
  void main(){vec2 focalPx=uFocal*uResolution.xy;vec2 uv=(vUv*uResolution.xy-focalPx)/uResolution.y;vec2 mouseNorm=uMouse-vec2(.5);
  if(uAutoCenterRepulsion>0.){vec2 centerUV=vec2(0.);float centerDist=length(uv-centerUV);vec2 repulsion=normalize(uv-centerUV)*(uAutoCenterRepulsion/(centerDist+.1));uv+=repulsion*.05;}
  else if(uMouseRepulsion){vec2 mousePosUV=(uMouse*uResolution.xy-focalPx)/uResolution.y;float mouseDist=length(uv-mousePosUV);vec2 repulsion=normalize(uv-mousePosUV)*(uRepulsionStrength/(mouseDist+.1));uv+=repulsion*.05*uMouseActiveFactor;}
  else{uv+=mouseNorm*.1*uMouseActiveFactor;}float autoRotAngle=uTime*uRotationSpeed;mat2 autoRot=mat2(cos(autoRotAngle),-sin(autoRotAngle),sin(autoRotAngle),cos(autoRotAngle));uv=autoRot*uv;uv=mat2(uRotation.x,-uRotation.y,uRotation.y,uRotation.x)*uv;vec3 col=vec3(0.);
  for(float i=0.;i<1.;i+=1./NUM_LAYER){float depth=fract(i+uStarSpeed*uSpeed);float scale=mix(20.*uDensity,.5*uDensity,depth);float fade=depth*smoothstep(1.,.9,depth);col+=StarLayer(uv*scale+i*453.32)*fade;}float alpha=length(col);alpha=smoothstep(0.,.3,alpha);alpha=min(alpha,1.);fragColor=vec4(col,alpha);}`;

  const FRAG_PRISMATIC=`#version 300 es
  precision highp float;precision highp int;out vec4 fragColor;uniform vec2 uResolution;uniform float uTime;uniform float uIntensity;uniform float uSpeed;uniform int uAnimType;
  uniform vec2 uMouse;uniform int uColorCount;uniform float uDistort;uniform vec2 uOffset;uniform sampler2D uGradient;uniform float uNoiseAmount;uniform int uRayCount;
  float hash21(vec2 p){p=floor(p);float f=52.9829189*fract(dot(p,vec2(.065,.005)));return fract(f);}mat2 rot30(){return mat2(.8,-.5,.5,.8);}
  float layeredNoise(vec2 fragPx){vec2 p=mod(fragPx+vec2(uTime*30.,-uTime*21.),1024.);vec2 q=rot30()*p;float n=0.;n+=.40*hash21(q);n+=.25*hash21(q*2.+17.);n+=.20*hash21(q*4.+47.);n+=.10*hash21(q*8.+113.);n+=.05*hash21(q*16.+191.);return n;}
  vec3 rayDir(vec2 frag,vec2 res,vec2 offset,float dist){float focal=res.y*max(dist,1e-3);return normalize(vec3(2.*(frag-offset)-res,focal));}
  float edgeFade(vec2 frag,vec2 res,vec2 offset){vec2 toC=frag-.5*res-offset;float r=length(toC)/(.5*min(res.x,res.y));float x=clamp(r,0.,1.);float q=x*x*x*(x*(x*6.-15.)+10.);float s=q*.5;s=pow(s,1.5);float tail=1.-pow(1.-s,2.);s=mix(s,tail,.2);float dn=(layeredNoise(frag*.15)-.5)*.0015*s;return clamp(s+dn,0.,1.);}
  mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,-s,0.,s,c);}mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,s,0.,1.,0.,-s,0.,c);}mat3 rotZ(float a){float c=cos(a),s=sin(a);return mat3(c,-s,0.,s,c,0.,0.,0.,1.);}
  vec3 sampleGradient(float t){t=clamp(t,0.,1.);return texture(uGradient,vec2(t,.5)).rgb;}vec2 rot2(vec2 v,float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c)*v;}
  float bendAngle(vec3 q,float t){return .8*sin(q.x*.55+t*.6)+.7*sin(q.y*.50-t*.5)+.6*sin(q.z*.60+t*.7);}
  void main(){vec2 frag=gl_FragCoord.xy;float t=uTime*uSpeed;float jitterAmp=.1*clamp(uNoiseAmount,0.,1.);vec3 dir=rayDir(frag,uResolution,uOffset,1.);float marchT=0.;vec3 col=vec3(0.);float n=layeredNoise(frag);vec4 c=cos(t*.2+vec4(0.,33.,11.,0.));mat2 M2=mat2(c.x,c.y,c.z,c.w);float amp=clamp(uDistort,0.,50.)*.15;mat3 rot3dMat=mat3(1.);
  if(uAnimType==1){vec3 ang=vec3(t*.31,t*.21,t*.17);rot3dMat=rotZ(ang.z)*rotY(ang.y)*rotX(ang.x);}mat3 hoverMat=mat3(1.);if(uAnimType==2){vec2 m=uMouse*2.-1.;vec3 ang=vec3(m.y*.6,m.x*.6,0.);hoverMat=rotY(ang.y)*rotX(ang.x);}
  for(int i=0;i<44;++i){vec3 P=marchT*dir;P.z-=2.;float rad=length(P);vec3 Pl=P*(10./max(rad,1e-6));if(uAnimType==0){Pl.xz*=M2;}else if(uAnimType==1){Pl=rot3dMat*Pl;}else{Pl=hoverMat*Pl;}float stepLen=min(rad-.3,n*jitterAmp)+.1;float grow=smoothstep(.35,3.,marchT);float a1=amp*grow*bendAngle(Pl*.6,t);float a2=.5*amp*grow*bendAngle(Pl.zyx*.5+3.1,t*.9);vec3 Pb=Pl;Pb.xz=rot2(Pb.xz,a1);Pb.xy=rot2(Pb.xy,a2);
  float rayPattern=smoothstep(.5,.7,sin(Pb.x+cos(Pb.y)*cos(Pb.z))*sin(Pb.z+sin(Pb.y)*cos(Pb.x+t)));if(uRayCount>0){float ang=atan(Pb.y,Pb.x);float comb=.5+.5*cos(float(uRayCount)*ang);comb=pow(comb,3.);rayPattern*=smoothstep(.15,.95,comb);}vec3 spectralDefault=1.+vec3(cos(marchT*3.+0.),cos(marchT*3.+1.),cos(marchT*3.+2.));float saw=fract(marchT*.25);float tRay=saw*saw*(3.-2.*saw);vec3 userGradient=2.*sampleGradient(tRay);vec3 spectral=(uColorCount>0)?userGradient:spectralDefault;vec3 base=(.05/(.4+stepLen))*smoothstep(5.,0.,rad)*spectral;col+=base*rayPattern;marchT+=stepLen;}
  col*=edgeFade(frag,uResolution,uOffset);col*=uIntensity;fragColor=vec4(clamp(col,0.,1.),1.);}`;

  const FRAG_SIDERAYS=`#version 300 es
  precision highp float;uniform float iTime;uniform vec2 iResolution;uniform float iSpeed;uniform vec3 iRayColor1;uniform vec3 iRayColor2;uniform float iIntensity;uniform float iSpread;
  uniform float iFlipX;uniform float iFlipY;uniform float iTilt;uniform float iSaturation;uniform float iBlend;uniform float iFalloff;out vec4 fragColor;
  float rayStrength(vec2 raySource,vec2 rayRefDirection,vec2 coord,float seedA,float seedB,float speed){vec2 sourceToCoord=coord-raySource;float cosAngle=dot(normalize(sourceToCoord),rayRefDirection);return clamp((.45+.15*sin(cosAngle*seedA+iTime*speed))+(.3+.2*cos(-cosAngle*seedB+iTime*speed)),0.,1.)*clamp((iResolution.x-length(sourceToCoord))/iResolution.x,.5,1.);}
  void main(){vec2 fragCoord=gl_FragCoord.xy;if(iFlipX>.5)fragCoord.x=iResolution.x-fragCoord.x;if(iFlipY>.5)fragCoord.y=iResolution.y-fragCoord.y;vec2 coord=vec2(fragCoord.x,iResolution.y-fragCoord.y);vec2 rayPos=vec2(iResolution.x*1.1,-.5*iResolution.y);float tiltRad=iTilt*3.14159265/180.;float cs=cos(tiltRad),sn=sin(tiltRad);vec2 rel=coord-rayPos;vec2 tiltedCoord=vec2(rel.x*cs-rel.y*sn,rel.x*sn+rel.y*cs)+rayPos;float halfSpread=iSpread*.275;vec2 rayRefDir1=normalize(vec2(cos(.785398+halfSpread),sin(.785398+halfSpread)));vec2 rayRefDir2=normalize(vec2(cos(.785398-halfSpread),sin(.785398-halfSpread)));vec4 rays1=vec4(iRayColor1,1.)*rayStrength(rayPos,rayRefDir1,tiltedCoord,36.2214,21.11349,iSpeed);vec4 rays2=vec4(iRayColor2,1.)*rayStrength(rayPos,rayRefDir2,tiltedCoord,22.3991,18.0234,iSpeed*.2);vec4 color=rays1*(1.-iBlend)*.9+rays2*iBlend*.9;float distanceToLight=length(fragCoord.xy-vec2(rayPos.x,iResolution.y-rayPos.y))/iResolution.y;float brightness=iIntensity*.4/pow(max(distanceToLight,.001),iFalloff);color.rgb*=brightness;float gray=dot(color.rgb,vec3(.299,.587,.114));color.rgb=mix(vec3(gray),color.rgb,iSaturation);color.a=max(color.r,max(color.g,color.b));fragColor=color;}`;

  const FRAG_SILK=`#version 300 es
  precision highp float;in vec2 vUv;out vec4 fragColor;uniform float uTime;uniform vec3 uColor;uniform float uSpeed;uniform float uScale;uniform float uRotation;uniform float uNoiseIntensity;uniform float uIntensity;
  const float e=2.71828182845904523536;float noise(vec2 texCoord){float G=e;vec2 r=(G*sin(G*texCoord));return fract(r.x*r.y*(1.+texCoord.x));}
  vec2 rotateUvs(vec2 uv,float angle){float c=cos(angle),s=sin(angle);mat2 rot=mat2(c,-s,s,c);return rot*uv;}
  void main(){float rnd=noise(gl_FragCoord.xy);vec2 uv=rotateUvs(vUv*uScale,uRotation);vec2 tex=uv*uScale;float tOffset=uSpeed*uTime;tex.y+=.03*sin(8.*tex.x-tOffset);float pattern=.6+.4*sin(5.*(tex.x+tex.y+cos(3.*tex.x+5.*tex.y)+.02*tOffset)+sin(20.*(tex.x+tex.y-.1*tOffset)));vec4 col=vec4(uColor,1.)*vec4(pattern)-rnd/15.*uNoiseIntensity;col.rgb*=uIntensity;col.a=1.;fragColor=col;}`;

  const REFERENCE_PRESETS={
    strands:{colors:['#FF4242','#7C3AED','#06B6D4','#EAB308'],custom:true},
    galaxy:{colors:['#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF'],custom:false},
    prismatic:{colors:['#FF4242','#7C3AED','#06B6D4','#EAB308'],custom:false},
    siderays:{colors:['#EAB308','#96C8FF','#96C8FF','#96C8FF'],custom:true},
    silk:{colors:['#7B7481','#7B7481','#7B7481','#7B7481'],custom:true}
  };
