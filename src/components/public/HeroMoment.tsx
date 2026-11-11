"use client";
import { useEffect, useRef } from "react";
interface Particle { x:number; y:number; baseX:number; baseY:number; size:number; rgb:string; }
const V={r:108,g:60,b:233}, C={r:46,g:197,b:240};
export default function HeroMoment(){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;
  const ctx=canvas.getContext("2d",{alpha:true,desynchronized:true});if(!ctx)return;
  let width=0,height=0,particles:Particle[]=[];
  let pointerX=-10000,pointerY=-10000,frame=0,lastFrame=0,visible=true,pageVisible=!document.hidden,disposed=false;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmallScreen=window.matchMedia("(max-width: 767px)").matches;\n  const frameInterval=1000/(isSmallScreen?16:24),radius=isSmallScreen?118:155,radius2=radius*radius;
  function staticFrame(){ctx!.clearRect(0,0,width,height);for(const p of particles){ctx!.beginPath();ctx!.arc(p.baseX,p.baseY,p.size,0,Math.PI*2);ctx!.fillStyle=`rgba(${p.rgb},0.14)`;ctx!.fill();}}
  function resize(){
   const parent=canvas!.parentElement;if(!parent)return;width=parent.clientWidth;height=parent.clientHeight;
   const dpr=Math.min(window.devicePixelRatio||1,1.25);
   canvas!.width=Math.round(width*dpr);canvas!.height=Math.round(height*dpr);canvas!.style.width=width+"px";canvas!.style.height=height+"px";ctx!.setTransform(dpr,0,0,dpr,0,0);
   const spacing=isSmallScreen?58:46,cols=Math.ceil(width/spacing)+1,rows=Math.ceil(height/spacing)+1;particles=[];
   for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const t=(col+row)/(cols+rows),r=Math.round(V.r+(C.r-V.r)*t),g=Math.round(V.g+(C.g-V.g)*t),b=Math.round(V.b+(C.b-V.b)*t),x=col*spacing,y=row*spacing;
    particles.push({x,y,baseX:x,baseY:y,size:1.15,rgb:`${r}, ${g}, ${b}`});
   }staticFrame();
  }
  function draw(timestamp:number){
   if(disposed||!visible||!pageVisible||reduced)return;
   if(timestamp-lastFrame<frameInterval){frame=requestAnimationFrame(draw);return;}lastFrame=timestamp;
   ctx!.clearRect(0,0,width,height);const pulse=.025*(.5+.5*Math.sin(timestamp*.00055));
   for(const p of particles){
    const dx=pointerX-p.baseX,dy=pointerY-p.baseY,d2=dx*dx+dy*dy;let tx=p.baseX,ty=p.baseY,opacity=.105+pulse,size=p.size;
    if(d2<radius2){const d=Math.sqrt(d2),strength=1-d/radius,force=strength*15,inv=d>0?1/d:0;tx-=dx*inv*force;ty-=dy*inv*force;opacity+=strength*.48;size+=strength*1.5;}
    p.x+=(tx-p.x)*.14;p.y+=(ty-p.y)*.14;ctx!.beginPath();ctx!.arc(p.x,p.y,size,0,Math.PI*2);ctx!.fillStyle=`rgba(${p.rgb},${opacity})`;ctx!.fill();
   }frame=requestAnimationFrame(draw);
  }
  function start(){cancelAnimationFrame(frame);if(!reduced&&visible&&pageVisible)frame=requestAnimationFrame(draw);else staticFrame();}
  function pointerMove(e:PointerEvent){const rect=canvas!.getBoundingClientRect();pointerX=e.clientX-rect.left;pointerY=e.clientY-rect.top;}
  function pointerLeave(){pointerX=-10000;pointerY=-10000;}
  function visibilityChange(){pageVisible=!document.hidden;start();}
  resize();const resizeObserver=new ResizeObserver(resize);if(canvas.parentElement)resizeObserver.observe(canvas.parentElement);
  const intersectionObserver=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;start();});intersectionObserver.observe(canvas);
  window.addEventListener("pointermove",pointerMove,{passive:true});window.addEventListener("pointerleave",pointerLeave,{passive:true});document.addEventListener("visibilitychange",visibilityChange);start();
  return()=>{disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();intersectionObserver.disconnect();window.removeEventListener("pointermove",pointerMove);window.removeEventListener("pointerleave",pointerLeave);document.removeEventListener("visibilitychange",visibilityChange);};
 },[]);
 return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"/>;
}