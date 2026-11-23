import{j as a}from"./jsx-runtime.ClP7wGfN.js";import{r}from"./index.DK-fsZOb.js";import{F as k,a as C,b as j}from"./index.B1S6wAOk.js";import{W as L,T as w}from"./Tip.dLQv5x0Y.js";import{g,o as E,m as A,s as N}from"./prefs.DmYp0q7V.js";import"./index.xK5eoQS5.js";import"./react.xmuk4M4d.js";/* empty css                       */import"./use-velocity.YDYovmSm.js";/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),M=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,o,n)=>n?n.toUpperCase():o.toLowerCase()),x=t=>{const e=M(t);return e.charAt(0).toUpperCase()+e.slice(1)},b=(...t)=>t.filter((e,o,n)=>!!e&&e.trim()!==""&&n.indexOf(e)===o).join(" ").trim(),W=t=>{for(const e in t)if(e.startsWith("aria-")||e==="role"||e==="title")return!0};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var S={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=r.forwardRef(({color:t="currentColor",size:e=24,strokeWidth:o=2,absoluteStrokeWidth:n,className:c="",children:i,iconNode:l,...m},s)=>r.createElement("svg",{ref:s,...S,width:e,height:e,stroke:t,strokeWidth:n?Number(o)*24/Number(e):o,className:b("lucide",c),...!i&&!W(m)&&{"aria-hidden":"true"},...m},[...l.map(([u,d])=>r.createElement(u,d)),...Array.isArray(i)?i:[i]]));/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=(t,e)=>{const o=r.forwardRef(({className:n,...c},i)=>r.createElement(B,{ref:i,iconNode:e,className:b(`lucide-${T(x(t))}`,`lucide-${t}`,n),...c}));return o.displayName=x(t),o};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]],R=y("moon",F);/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],$=y("sun",_);function H(){const[t,e]=r.useState("dark"),[o,n]=r.useState(!1),c=r.useRef(null);r.useEffect(()=>(e(g()),E(()=>e(g()))),[]),r.useEffect(()=>{const s=document.getElementById("mobile-nav");if(!s)return;document.documentElement.classList.toggle("nav-open",o);let u=0,d=0;if(o)s.hidden=!1,d=requestAnimationFrame(()=>{d=requestAnimationFrame(()=>s.classList.add("is-open"))});else return s.classList.remove("is-open"),A()?s.hidden=!0:u=window.setTimeout(()=>{s.classList.contains("is-open")||(s.hidden=!0)},320),()=>window.clearTimeout(u);const p=v=>{v.key==="Escape"&&(n(!1),c.current?.focus())},h=window.matchMedia("(min-width: 56rem)"),f=()=>h.matches&&n(!1);return document.addEventListener("keydown",p),h.addEventListener("change",f),()=>{cancelAnimationFrame(d),document.removeEventListener("keydown",p),h.removeEventListener("change",f)}},[o]);const i=t==="dark"?"light":"dark",l=i==="light"?"Switch to light mode":"Switch to dark mode",m=o?"Close menu":"Open menu";return a.jsx(L,{children:a.jsxs("div",{className:"header-tools",children:[a.jsx(w,{text:l,side:"bottom",children:a.jsxs("button",{type:"button",className:"icon-btn theme-toggle","aria-label":l,onClick:()=>N(i),children:[a.jsx($,{className:"i-sun lucide-icon","aria-hidden":"true",strokeWidth:1.75}),a.jsx(R,{className:"i-moon lucide-icon","aria-hidden":"true",strokeWidth:1.75})]})}),a.jsx(w,{text:m,side:"bottom",children:a.jsxs("button",{ref:c,type:"button",className:"icon-btn menu-btn","aria-label":m,"aria-expanded":o,"aria-controls":"mobile-nav",onClick:()=>n(s=>!s),children:[a.jsx(k,{icon:C,className:"i-open"}),a.jsx(k,{icon:j,className:"i-close"})]})})]})})}export{H as default};
