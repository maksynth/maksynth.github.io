import{j as a}from"./jsx-runtime.ClP7wGfN.js";import{r}from"./index.DK-fsZOb.js";import{F as k,a as v,b as L}from"./index.B1S6wAOk.js";import{W as C,T as w}from"./Tip.dLQv5x0Y.js";import{g,o as j,m as E,s as A}from"./prefs.DmYp0q7V.js";import"./index.xK5eoQS5.js";import"./react.xmuk4M4d.js";/* empty css                       */import"./use-velocity.YDYovmSm.js";/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),T=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,s,n)=>n?n.toUpperCase():s.toLowerCase()),y=t=>{const e=T(t);return e.charAt(0).toUpperCase()+e.slice(1)},x=(...t)=>t.filter((e,s,n)=>!!e&&e.trim()!==""&&n.indexOf(e)===s).join(" ").trim(),M=t=>{for(const e in t)if(e.startsWith("aria-")||e==="role"||e==="title")return!0};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var S={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W=r.forwardRef(({color:t="currentColor",size:e=24,strokeWidth:s=2,absoluteStrokeWidth:n,className:c="",children:i,iconNode:d,...m},o)=>r.createElement("svg",{ref:o,...S,width:e,height:e,stroke:t,strokeWidth:n?Number(s)*24/Number(e):s,className:x("lucide",c),...!i&&!M(m)&&{"aria-hidden":"true"},...m},[...d.map(([u,l])=>r.createElement(u,l)),...Array.isArray(i)?i:[i]]));/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=(t,e)=>{const s=r.forwardRef(({className:n,...c},i)=>r.createElement(W,{ref:i,iconNode:e,className:x(`lucide-${N(y(t))}`,`lucide-${t}`,n),...c}));return s.displayName=y(t),s};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]],F=b("moon",B);/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],_=b("sun",R);function G(){const[t,e]=r.useState("dark"),[s,n]=r.useState(!1),c=r.useRef(null);r.useEffect(()=>(e(g()),j(()=>e(g()))),[]),r.useEffect(()=>{const o=document.getElementById("mobile-nav");if(!o)return;document.documentElement.classList.toggle("nav-open",s);let u=0,l=0;if(s)o.classList.remove("is-closing"),o.hidden=!1,l=requestAnimationFrame(()=>{l=requestAnimationFrame(()=>o.classList.add("is-open"))});else{if(!o.classList.contains("is-open")){o.hidden=!0;return}o.classList.add("is-closing"),o.classList.remove("is-open");const p=()=>{o.classList.remove("is-closing"),o.classList.contains("is-open")||(o.hidden=!0)};return E()?p():u=window.setTimeout(p,430),()=>window.clearTimeout(u)}const h=p=>{p.key==="Escape"&&(n(!1),c.current?.focus())},f=()=>{c.current&&getComputedStyle(c.current).display==="none"&&n(!1)};return document.addEventListener("keydown",h),window.addEventListener("resize",f),()=>{cancelAnimationFrame(l),document.removeEventListener("keydown",h),window.removeEventListener("resize",f)}},[s]);const i=t==="dark"?"light":"dark",d=i==="light"?"Switch to light mode":"Switch to dark mode",m=s?"Close menu":"Open menu";return a.jsx(C,{children:a.jsxs("div",{className:"header-tools",children:[a.jsx(w,{text:d,side:"bottom",children:a.jsxs("button",{type:"button",className:"icon-btn theme-toggle","aria-label":d,onClick:()=>A(i),children:[a.jsx(_,{className:"i-sun lucide-icon","aria-hidden":"true",strokeWidth:1.75}),a.jsx(F,{className:"i-moon lucide-icon","aria-hidden":"true",strokeWidth:1.75})]})}),a.jsx(w,{text:m,side:"bottom",children:a.jsxs("button",{ref:c,type:"button",className:"icon-btn menu-btn","aria-label":m,"aria-expanded":s,"aria-controls":"mobile-nav",onClick:()=>n(o=>!o),children:[a.jsx(k,{icon:v,className:"i-open"}),a.jsx(k,{icon:L,className:"i-close"})]})})]})})}export{G as default};
