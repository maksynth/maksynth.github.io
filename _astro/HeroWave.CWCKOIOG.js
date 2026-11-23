import{j as y}from"./jsx-runtime.ClP7wGfN.js";import{r as m}from"./index.DK-fsZOb.js";/* empty css                       */import{T as Oe}from"./Tip.dLQv5x0Y.js";import{F as Ne,c as De,d as Ge}from"./index.B1S6wAOk.js";import{o as je,m as Ue,g as Ye}from"./prefs.DmYp0q7V.js";import"./index.xK5eoQS5.js";import"./react.xmuk4M4d.js";/* empty css                       */import"./use-velocity.YDYovmSm.js";const Xe="gradient-waves-container",Ve="gradient-waves-canvas",G=4,de=3.2,Ze=2.8,he=8,Ke=2.6,we=30,pe={low:56,medium:84,high:120},$e=`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,Qe=`#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uClock;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uHeight;
uniform float uTilt;
uniform float uZoom;
uniform vec2 uLook;
uniform float uFogDepth;
uniform float uBrightness;
uniform float uOpacity;
uniform float uGrain;
uniform vec3 uHorizon;
uniform vec3 uWave;
uniform vec3 uCrest;
uniform vec3 uBackground;
uniform float uOpaque;
uniform float uLight;
uniform vec3 uSun;
uniform float uRelief;
uniform float uSheen;
uniform float uSteps;
uniform float uStride;
uniform vec3 uIntro;
uniform vec3 uSwells[${G}];
uniform float uSwellWidth;
out vec4 outColor;

const float FAR = 4000.0;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 surface(vec2 xy) {
  vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
  vec4 tc = vec4(uTime / 0.130, uTime / 0.810, uTime / 0.200, uTime / 0.710);
  float a = xy.x + tc.x;
  float swellPhase = (xy.y + a) / 20.0 + tc.y;
  float bend = uSwell * cos(swellPhase) / 20.0;
  float mx = a + uSwell * sin(swellPhase);
  float crossPhase = xy.x / 23.0 + tc.w;
  float my = xy.y - tc.z + uTurbulence * cos(crossPhase);
  float twist = -uTurbulence * sin(crossPhase) / 23.0;
  float cx = cos(mx * freq.x);
  float cy = cos(my * freq.y);
  float rise = 1.0;
  if (uIntro.z > 0.0) rise = mix(1.0, smoothstep(uIntro.y * 0.45, uIntro.y * 1.6, xy.x), uIntro.z);
  float amp = uAmplitude * rise;
  float h = (sin(mx * freq.x) + sin(my * freq.y)) * amp + uHeight;
  float dx = amp * (freq.x * cx * (1.0 + bend) + freq.y * cy * twist);
  float dy = amp * (freq.x * cx * bend + freq.y * cy);
  for (int k = 0; k < ${G}; k++) {
    vec3 sw = uSwells[k];
    if (sw.z <= 0.0) continue;
    float u = (xy.x - sw.x) / uSwellWidth;
    float v = (xy.y - sw.y) / (uSwellWidth * 3.5);
    float bump = sw.z * exp(-u * u - v * v);
    h += bump;
    dx += bump * (-2.0 * u / uSwellWidth);
    dy += bump * (-2.0 * v / (uSwellWidth * 3.5));
  }
  return vec3(h, dx, dy);
}

float march(vec3 origin, vec3 dir) {
  float dist = 0.0;
  for (int i = 0; i < 128; i++) {
    if (float(i) >= uSteps) break;
    float gap = origin.z + dist * dir.z - surface(origin.xy + dist * dir.xy).x;
    if (abs(gap) < 0.002 * dist + 0.01) break;
    dist += uStride * gap;
    if (!(abs(dist) < FAR)) return FAR;
  }
  return dist;
}

void main() {
  float c;
  float s;
  float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
  vec3 cam = vec3(0.0, 0.0, ${we.toFixed(1)});
  vec2 uv = gl_FragCoord.xy / uResolution - 0.5;
  uv.x *= uResolution.x / uResolution.y;
  uv.y *= -1.0;

  vec3 dir = vec3(0.0, 0.0, -1.0);
  float ulen = length(uv);
  float xrot = vfov * ulen;
  c = cos(xrot);
  s = sin(xrot);
  dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  vec2 nuv = ulen > 1e-5 ? uv / ulen : vec2(1.0, 0.0);
  dir = mat3(nuv.x, -nuv.y, 0.0, nuv.y, nuv.x, 0.0, 0.0, 0.0, 1.0) * dir;
  c = cos(uTilt + uLook.y);
  s = sin(uTilt + uLook.y);
  dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;
  c = cos(uLook.x);
  s = sin(uLook.x);
  dir = mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0) * dir;

  float dist = march(cam, dir);
  vec3 pos = cam + dist * dir;
  vec3 field = surface(pos.xy);
  vec3 view = -dir;

  float crest = clamp((field.x - uHeight) / max(2.0 * uAmplitude, 0.001) * 0.5 + 0.5, 0.0, 1.0);
  vec3 body = mix(uWave, uCrest, smoothstep(0.45, 1.0, crest) * 0.5);
  vec3 normal = normalize(vec3(-field.yz * (1.0 + 1.5 * uRelief), 1.0));
  float diffuse = clamp(dot(normal, uSun) * 0.5 + 0.5, 0.0, 1.0);
  float lightness = mix(1.0, diffuse * diffuse * (3.0 - 2.0 * diffuse), uRelief);
  float sheen = pow(clamp(dot(normal, normalize(uSun + view)), 0.0, 1.0), 14.0) * uSheen * (0.4 + 0.6 * uRelief);
  float rim = pow(1.0 - clamp(dot(normal, view), 0.0, 1.0), 3.0);

  vec3 col;
  float alpha;
  float haze = 1.0 - exp(-dist / (uFogDepth * 5.0));
  float fade = 1.0 - smoothstep(0.35, 1.0, haze);
  if (uLight < 0.5) {
    vec3 lit = mix(uHorizon * 0.18, body, lightness) + uCrest * sheen;
    lit = mix(lit, uHorizon, rim * 0.15 * uRelief);
    col = mix(lit, uHorizon, smoothstep(0.0, 1.0, haze)) * 0.85 * uBrightness;
    alpha = fade;
  } else {
    vec3 hue = mix(uHorizon, body, 0.35 + 0.65 * lightness);
    float density = mix(0.16, 0.9, 1.0 - lightness);
    density *= 1.0 - clamp(sheen, 0.0, 1.0) * 0.85;
    density *= 1.0 - 0.5 * smoothstep(0.0, 1.0, haze);
    col = hue;
    alpha = fade * clamp(density * uBrightness, 0.0, 1.0);
  }

  float reveal = uIntro.x;
  col = clamp(col, 0.0, 1.0);
  float grain = (hash(gl_FragCoord.xy + fract(uClock) * 64.0) - 0.5) * uGrain;
  alpha = clamp(alpha * (1.0 + grain), 0.0, 1.0) * reveal * uOpacity;
  if (uOpaque > 0.5) {
    outColor = vec4(mix(uBackground, col, alpha), 1.0);
  } else {
    outColor = vec4(col * alpha, alpha);
  }
}`,B=(i,u,l)=>Math.min(l,Math.max(u,i)),Je=i=>i<.5?2*i*i:1-Math.pow(-2*i+2,2)/2;let H=null;const D=(i,u)=>{if(i==="transparent")return null;if(typeof document>"u"||(H||(H=document.createElement("canvas").getContext("2d")),!H))return u;H.fillStyle="#000000",H.fillStyle=i;const l=H.fillStyle;if(l.startsWith("#")){const f=parseInt(l.slice(1),16);return[(f>>16&255)/255,(f>>8&255)/255,(f&255)/255]}const r=/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(l);return r?r[4]!==void 0&&Number(r[4])===0?null:[Number(r[1])/255,Number(r[2])/255,Number(r[3])/255]:u},ve=(i,u,l)=>{const r=i.createShader(u);return r?(i.shaderSource(r,l),i.compileShader(r),i.getShaderParameter(r,i.COMPILE_STATUS)?r:(console.error(i.getShaderInfoLog(r)),i.deleteShader(r),null)):null},et=(i,u,l,r)=>{const f=(i[0]-.5)*u,g=i[1]-.5,x=Math.PI/2.3/Math.max(l.zoom,.05),h=Math.hypot(f,g),M=x*h;let s=[0,-Math.sin(M),-Math.cos(M)];const F=h>1e-5?f/h:1,S=h>1e-5?g/h:0;s=[F*s[0]+S*s[1],-S*s[0]+F*s[1],s[2]];const E=l.tilt+r[1],p=Math.cos(E),R=Math.sin(E);s=[p*s[0]-R*s[2],s[1],R*s[0]+p*s[2]];const A=Math.cos(r[0]),k=Math.sin(r[0]);return s=[A*s[0]-k*s[1],k*s[0]+A*s[1],s[2]],s},tt=(i,u,l,r)=>{const f=et(i,u,l,r);if(f[2]>-.02)return null;const g=(we-l.height)/-f[2];return[f[0]*g,f[1]*g]},ge=()=>typeof window<"u"&&(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1);function ot({horizonColor:i="#5227FF",waveColor:u="#FF9FFC",crestColor:l="#FFFFFF",backgroundColor:r="transparent",lightMode:f=!1,speed:g=.4,amplitude:x=2.5,waveScale:h=.6,waveRatio:M=.9,swell:s=35,turbulence:F=20,tilt:S=64,zoom:E=1,height:p=5.5,fogDepth:R=15,relief:A=1,lightAngle:k=120,sheen:ye=0,brightness:Se=1,opacity:be=1,grain:j=.2,quality:Me="medium",intro:Ee=!0,mouseInteraction:Re=!0,parallaxStrength:Ae=.5,mouseStrength:ke=.6,swellOnClick:Le=!0,paused:Fe=!1,dpr:Pe=2,className:Te="",style:Ce}){const ee=m.useRef(null),We=m.useMemo(()=>D(i,[.32,.15,1])??[.32,.15,1],[i]),Ie=m.useMemo(()=>D(u,[1,.62,.99])??[1,.62,.99],[u]),ze=m.useMemo(()=>D(l,[1,1,1])??[1,1,1],[l]),_e=m.useMemo(()=>D(r,null),[r]),te={horizon:We,wave:Ie,crest:ze,paper:_e,lightMode:f,speed:g,amplitude:Math.max(0,x),waveScale:Math.max(.01,h),waveRatio:Math.max(.01,M),swell:s,turbulence:F,tilt:B(S,10,85)*Math.PI/180,zoom:Math.max(.05,E),height:p,fogDepth:Math.max(.5,R),relief:B(A,0,1),lightAngle:k*Math.PI/180,sheen:Math.max(0,ye),brightness:Math.max(0,Se),opacity:B(be,0,1),grain:typeof j=="number"?Math.max(0,j):j?.05:0,steps:pe[Me]??pe.medium,intro:Ee,mouseInteraction:Re,parallaxStrength:Math.max(0,Ae),mouseStrength:B(ke,0,1),swellOnClick:Le,paused:Fe,dpr:Math.max(.5,Pe)},P=m.useRef(te);P.current=te;const U=m.useRef(null);return m.useEffect(()=>{U.current?.()}),m.useEffect(()=>{const L=ee.current;if(!L)return;const w=document.createElement("canvas");w.className=Ve,L.appendChild(w);const t=w.getContext("webgl2",{alpha:!0,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!0,powerPreference:"high-performance"});if(!t){w.remove();return}const Y=ve(t,t.VERTEX_SHADER,$e),X=ve(t,t.FRAGMENT_SHADER,Qe),v=t.createProgram();if(!Y||!X||!v){w.remove();return}if(t.attachShader(v,Y),t.attachShader(v,X),t.bindAttribLocation(v,0,"aPosition"),t.linkProgram(v),t.deleteShader(Y),t.deleteShader(X),!t.getProgramParameter(v,t.LINK_STATUS)){t.deleteProgram(v),w.remove();return}const qe=["uResolution","uTime","uClock","uAmplitude","uWaveScale","uWaveRatio","uSwell","uTurbulence","uHeight","uTilt","uZoom","uLook","uFogDepth","uBrightness","uOpacity","uGrain","uHorizon","uWave","uCrest","uBackground","uOpaque","uLight","uSun","uRelief","uSheen","uSteps","uStride","uIntro","uSwells","uSwellWidth"],n={};qe.forEach(a=>{n[a]=t.getUniformLocation(v,a)});const oe=t.createVertexArray();t.bindVertexArray(oe);const ne=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,ne),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),t.STATIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.useProgram(v);const V=new Float32Array(G*3),e={width:1,height:1,cssWidth:0,cssHeight:0,time:0,clock:0,last:0,raf:0,visible:!1,introAt:-1,pointer:[.5,.5],inside:!1,look:[0,0],steer:[0,0],swells:[],quiet:0,seen:null},Be=()=>{const a=P.current,o=Math.min(window.devicePixelRatio||1,a.dpr),c=Math.max(1,Math.round(e.cssWidth*o)),d=Math.max(1,Math.round(e.cssHeight*o));c===e.width&&d===e.height||(e.quiet=0,e.width=c,e.height=d,w.width=c,w.height=d)},ie=()=>{e.cssWidth=L.clientWidth,e.cssHeight=L.clientHeight,e.quiet=0,b()},re=(a,o)=>!a.intro||o||e.introAt<0?1:B((e.clock-e.introAt)/Ke,0,1),He=a=>{const o=P.current;t.viewport(0,0,e.width,e.height),t.uniform2f(n.uResolution,e.width,e.height),t.uniform1f(n.uTime,e.time),t.uniform1f(n.uClock,e.clock),t.uniform1f(n.uAmplitude,o.amplitude),t.uniform1f(n.uWaveScale,o.waveScale),t.uniform1f(n.uWaveRatio,o.waveRatio),t.uniform1f(n.uSwell,o.swell),t.uniform1f(n.uTurbulence,o.turbulence),t.uniform1f(n.uHeight,o.height),t.uniform1f(n.uTilt,o.tilt),t.uniform1f(n.uZoom,o.zoom),t.uniform2f(n.uLook,e.look[0],e.look[1]),t.uniform1f(n.uFogDepth,o.fogDepth),t.uniform1f(n.uBrightness,o.brightness),t.uniform1f(n.uOpacity,o.opacity),t.uniform1f(n.uGrain,o.grain),t.uniform3fv(n.uHorizon,o.horizon),t.uniform3fv(n.uWave,o.wave),t.uniform3fv(n.uCrest,o.crest);const c=o.paper??[0,0,0];t.uniform3f(n.uBackground,c[0],c[1],c[2]),t.uniform1f(n.uOpaque,o.paper?1:0),t.uniform1f(n.uLight,o.lightMode?1:0);const d=.52,T=o.lightAngle+e.steer[0]*o.mouseStrength*2,C=d-e.steer[1]*o.mouseStrength*.7;t.uniform3f(n.uSun,Math.cos(C)*Math.cos(T),Math.cos(C)*Math.sin(T),Math.sin(C)),t.uniform1f(n.uRelief,o.relief),t.uniform1f(n.uSheen,o.sheen),t.uniform1f(n.uSteps,o.steps);const N=o.amplitude*(o.waveScale/7*(1+Math.abs(o.swell)/20)+o.waveScale*o.waveRatio/3*(1+Math.abs(o.turbulence)/23)),W=re(o,a),I=Math.min(1,W/.22),K=160*Math.pow(3/160,Je(Math.max(0,(W-.1)/.9))),z=B((W-.75)/.25,0,1);t.uniform3f(n.uIntro,I*I*(3-2*I),K,1-z*z*(3-2*z)),V.fill(0);let _=0;e.swells.forEach((q,$)=>{const O=e.clock-q.at,Q=O/de,J=(1-Math.exp(-O/.25))*Math.pow(1-Q,1.6),me=o.amplitude*Ze*J;V.set([q.x-O*12,q.y,me],$*3),_=Math.max(_,me)}),t.uniform3fv(n.uSwells,V),t.uniform1f(n.uSwellWidth,he),t.uniform1f(n.uStride,.9/Math.max(1,(N+_*.86/he)/1.5)),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.drawArrays(t.TRIANGLES,0,3)},Z=a=>{if(e.raf=0,!e.visible||document.hidden)return;const o=P.current,c=e.last?Math.min((a-e.last)/1e3,.1):0;e.last=a;const d=ge();e.clock+=c,e.introAt<0&&(e.introAt=e.clock),!o.paused&&!d&&(e.time+=c*o.speed);const T=o.mouseInteraction&&e.inside&&!d,C=T?e.pointer:[.5,.5],N=1-Math.exp(-c/.45),W=(C[0]-.5)*o.parallaxStrength*.35,I=(C[1]-.5)*o.parallaxStrength*.18;e.look[0]+=(W-e.look[0])*N,e.look[1]+=(I-e.look[1])*N;const K=Math.abs(W-e.look[0])+Math.abs(I-e.look[1])>2e-4,z=1-Math.exp(-c/.6),_=T?e.pointer[0]-.5:0,q=T?.5-e.pointer[1]:0;e.steer[0]+=(_-e.steer[0])*z,e.steer[1]+=(q-e.steer[1])*z;const $=Math.abs(_-e.steer[0])+Math.abs(q-e.steer[1])>5e-4;e.swells=e.swells.filter(J=>e.clock-J.at<de);const O=o.paused||d,Q=K||$||e.swells.length>0||re(o,d)<1;e.seen!==o||Q||!O?e.quiet=0:e.quiet+=1,e.seen=o,!(e.quiet>3)&&(e.raf=requestAnimationFrame(Z),Be(),He(d))},b=()=>{e.raf||!e.visible||document.hidden||(e.last=0,e.raf=requestAnimationFrame(Z))};U.current=b;const ae=a=>{const o=L.getBoundingClientRect();return{x:(a.clientX-o.left)/Math.max(o.width,1),y:(a.clientY-o.top)/Math.max(o.height,1),inside:a.clientX>=o.left&&a.clientX<=o.right&&a.clientY>=o.top&&a.clientY<=o.bottom}},se=a=>{const o=ae(a),c=e.inside;e.inside=o.inside,o.inside&&(e.pointer=[o.x,o.y]),(o.inside||c)&&P.current.mouseInteraction&&b()},ue=()=>{e.inside=!1,b()},le=a=>{const o=P.current;if(!o.swellOnClick||a.button!==0||ge()||a.target instanceof Element&&a.target.closest('a, button, input, textarea, select, label, [role="button"]'))return;const c=ae(a);if(!c.inside)return;const d=tt([c.x,c.y],e.width/Math.max(e.height,1),o,e.look);d&&(e.swells.push({x:d[0],y:d[1],at:e.clock}),e.swells.length>G&&e.swells.shift(),b())},ce=new IntersectionObserver(a=>{e.visible=a.some(o=>o.isIntersecting),b()});ce.observe(L);const fe=new ResizeObserver(ie);return fe.observe(L),ie(),document.addEventListener("visibilitychange",b),window.addEventListener("pointermove",se,{passive:!0}),window.addEventListener("pointerdown",le),document.documentElement.addEventListener("pointerleave",ue),e.raf=requestAnimationFrame(Z),()=>{cancelAnimationFrame(e.raf),U.current=null,document.removeEventListener("visibilitychange",b),ce.disconnect(),fe.disconnect(),window.removeEventListener("pointermove",se),window.removeEventListener("pointerdown",le),document.documentElement.removeEventListener("pointerleave",ue),t.deleteProgram(v),t.deleteBuffer(ne),t.deleteVertexArray(oe),t.getExtension("WEBGL_lose_context")?.loseContext(),w.remove()}},[]),y.jsx("div",{ref:ee,className:[Xe,Te].filter(Boolean).join(" "),style:Ce})}const xe="mak-wave-paused";function nt(){try{const u=document.createElement("canvas").getContext("webgl2",{failIfMajorPerformanceCaveat:!0});if(!u)return!0;const l=u.getExtension("WEBGL_debug_renderer_info"),r=String(u.getParameter(l?l.UNMASKED_RENDERER_WEBGL:u.RENDERER));return u.getExtension("WEBGL_lose_context")?.loseContext(),/swiftshader|llvmpipe|softpipe|software|basic render/i.test(r)}catch{return!0}}function ht(){const[i,u]=m.useState(!1),[l,r]=m.useState(!0),[f,g]=m.useState(!1),[x,h]=m.useState(!1),[M,s]=m.useState(!1);m.useEffect(()=>{const p=()=>{r(Ue()),g(Ye()==="light")};p();try{h(localStorage.getItem(xe)==="1")}catch{}s(nt());const R=()=>u(!0),A=k=>"requestIdleCallback"in window?window.requestIdleCallback(k,{timeout:1500}):window.setTimeout(k,300);return document.readyState==="complete"?A(R):window.addEventListener("load",()=>A(R),{once:!0}),je(p)},[]);const F=()=>{h(p=>{try{localStorage.setItem(xe,p?"0":"1")}catch{}return!p})};m.useEffect(()=>{x?document.documentElement.dataset.heroPaused="":delete document.documentElement.dataset.heroPaused},[x]);const S=f?{horizon:"#ffffff",wave:"#b9b9b9",crest:"#4a4a4a"}:{horizon:"#0d0d0d",wave:"#3a3a3a",crest:"#d4d4d4"},E=x?"Play animation":"Pause animation";return y.jsxs(y.Fragment,{children:[y.jsx("div",{className:"hero-wave","aria-hidden":"true",children:i&&!l&&!M&&y.jsx(ot,{horizonColor:S.horizon,waveColor:S.wave,crestColor:S.crest,lightMode:f,speed:.22,amplitude:2.2,waveScale:.62,waveRatio:.9,swell:30,turbulence:14,tilt:66,zoom:1,height:5,fogDepth:16,relief:.8,sheen:0,brightness:1,opacity:f?.75:.95,grain:0,quality:"medium",intro:!0,mouseInteraction:!1,parallaxStrength:0,swellOnClick:!1,paused:x,dpr:1.5})}),i&&!l&&!M&&y.jsx("div",{className:"wave-pause",children:y.jsx(Oe,{text:E,side:"left",children:y.jsx("button",{type:"button",className:"icon-btn","aria-label":E,onClick:F,children:y.jsx(Ne,{icon:x?De:Ge})})})})]})}export{ht as default};
