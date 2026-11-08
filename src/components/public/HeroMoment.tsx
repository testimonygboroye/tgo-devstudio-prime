"use client";
import { useEffect, useRef } from "react";
const V={r:108,g:60,b:233}, C={r:46,g:197,b:240};
export default function HeroMoment(){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext("2d");const parent=canvas.parentElement;if(!ctx||!parent)return;
 const w=parent.clientWidth,h=parent.clientHeight,dpr=Math.min(window.devicePixelRatio||1,1.5);
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.scale(dpr,dpr);
 const spacing=42,cols=Math.ceil(w/spacing)+1,rows=Math.ceil(h/spacing)+1;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const t=(x+y)/(cols+rows),r=Math.round(V.r+(C.r-V.r)*t),g=Math.round(V.g+(C.g-V.g)*t),b=Math.round(V.b+(C.b-V.b)*t);ctx.beginPath();ctx.arc(x*spacing,y*spacing,1.2,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},0.14)`;ctx.fill();}
 },[]);
 return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"/>;
}