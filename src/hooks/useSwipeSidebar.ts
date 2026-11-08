"use client";
import { useEffect } from "react";
type Ref = { current: HTMLElement | null };
export function useSwipeSidebar(isOpen: boolean, setIsOpen: (open: boolean) => void, edge: "left" | "right", drawerRef: Ref, backdropRef: Ref, options: { maxWidth?: number; railWidth?: number } = {}) {
  useEffect(() => {
    let pointerId: number | null = null, startX = 0, startY = 0, startExtent = 0, maxWidth = options.maxWidth ?? 336, railWidth = options.railWidth ?? 0, horizontal = false, lastX = 0, lastTime = 0, velocity = 0;
    const sign = edge === "left" ? 1 : -1;
    const paint = (extent: number) => {
      const bounded = Math.max(0, Math.min(maxWidth - railWidth, extent));
      const width = railWidth + bounded;
      const drawer = drawerRef.current, backdrop = backdropRef.current;
      if (drawer) { drawer.style.transition = "none"; drawer.style.width = width + "px"; drawer.style.transform = edge === "right" ? `translate3d(${maxWidth - width}px,0,0)` : "translate3d(0,0,0)"; }
      if (backdrop) { backdrop.style.transition = "none"; backdrop.style.opacity = String(bounded / Math.max(1, maxWidth - railWidth)); }
    };
    const clear = () => requestAnimationFrame(() => {
      if (drawerRef.current) { drawerRef.current.style.transition = ""; drawerRef.current.style.width = ""; drawerRef.current.style.transform = ""; }
      if (backdropRef.current) { backdropRef.current.style.transition = ""; backdropRef.current.style.opacity = ""; }
    });
    const down = (e: PointerEvent) => {
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      if (!drawerRef.current) return;
      pointerId=e.pointerId; startX=e.clientX; startY=e.clientY; lastX=startX; lastTime=performance.now(); velocity=0; horizontal=false;
      maxWidth=options.maxWidth ?? Math.min(edge === "left" ? 304 : 336, window.innerWidth * .86);
      railWidth=options.railWidth ?? 0; startExtent=isOpen ? maxWidth-railWidth : 0;
    };
    const move = (e: PointerEvent) => {
      if (pointerId===null || e.pointerId!==pointerId) return;
      const dx=e.clientX-startX, dy=e.clientY-startY;
      if (!horizontal) { if (Math.abs(dx)<7 && Math.abs(dy)<7) return; if (Math.abs(dx)<=Math.abs(dy)*1.15) { pointerId=null; return; } horizontal=true; }
      if (e.cancelable) e.preventDefault();
      const now=performance.now(); velocity=(e.clientX-lastX)/Math.max(1,now-lastTime); lastX=e.clientX; lastTime=now;
      paint(startExtent+dx*sign);
    };
    const up = (e: PointerEvent) => {
      if(pointerId===null||e.pointerId!==pointerId)return;
      const dx=e.clientX-startX, extent=Math.max(0,Math.min(maxWidth-railWidth,startExtent+dx*sign));
      const threshold=(maxWidth-railWidth)*.24;
      let next=isOpen;
      if(!isOpen && horizontal && (extent>=threshold || velocity*sign>.55)) next=true;
      if(isOpen && horizontal && (extent<=(maxWidth-railWidth)*.76 || velocity*sign<-.55)) next=false;
      pointerId=null; if(horizontal)setIsOpen(next); clear(); horizontal=false;
    };
    const cancel=()=>{pointerId=null;horizontal=false;clear();};
    window.addEventListener("pointerdown",down,{passive:true});
    window.addEventListener("pointermove",move,{passive:false});
    window.addEventListener("pointerup",up,{passive:true});
    window.addEventListener("pointercancel",cancel,{passive:true});
    return()=>{window.removeEventListener("pointerdown",down);window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",cancel);clear();};
  },[backdropRef,drawerRef,edge,isOpen,options.maxWidth,options.railWidth,setIsOpen]);
}
