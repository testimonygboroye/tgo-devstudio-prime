"use client";
import { useEffect, useRef } from "react";
type Ref={current:HTMLElement|null};
export function useSwipeSidebar(isOpen:boolean,setIsOpen:(open:boolean)=>void,edge:"left"|"right",drawerRef:Ref,_backdropRef:Ref,options:{maxWidth?:number;railWidth?:number}={}){
 const suppressClickUntil=useRef(0);
 useEffect(()=>{
  let pointerId:number|null=null,startX=0,startY=0,eligible=false;
  const openDirection=edge==="left"?1:-1;
   const onDown=(event:PointerEvent)=>{
   if(!event.isPrimary||(event.pointerType==="mouse"&&event.button!==0)||window.matchMedia("(min-width: 768px)").matches)return;
   const target=event.target as HTMLElement|null;
   const inDrawer=Boolean(target&&drawerRef.current?.contains(target));
   const nearEdge=edge==="left"?event.clientX<=Math.max(32,options.railWidth||0):event.clientX>=window.innerWidth-32;
   eligible=isOpen?inDrawer:(nearEdge||inDrawer);
   if(!eligible)return;
   pointerId=event.pointerId;startX=event.clientX;startY=event.clientY;
  };
  const onMove=(event:PointerEvent)=>{
   if(pointerId===null||event.pointerId!==pointerId)return;
   const dx=event.clientX-startX,dy=event.clientY-startY;
   if(Math.abs(dy)>Math.abs(dx)*1.15&&Math.abs(dy)>10){pointerId=null;return;}
  };
  const onUp=(event:PointerEvent)=>{
   if(pointerId===null||event.pointerId!==pointerId)return;
   const dx=event.clientX-startX,dy=event.clientY-startY;pointerId=null;
   if(Math.abs(dx)<64||Math.abs(dx)<Math.abs(dy)*1.2)return;
   const towardOpen=dx*openDirection>0;
   if(!isOpen&&towardOpen){suppressClickUntil.current=Date.now()+500;setIsOpen(true);}
   else if(isOpen&&!towardOpen){suppressClickUntil.current=Date.now()+500;setIsOpen(false);}
  };
  const onCancel=()=>{pointerId=null;};
  const onClickCapture=(event:MouseEvent)=>{if(Date.now()<suppressClickUntil.current){event.preventDefault();event.stopPropagation();}};
  window.addEventListener("pointerdown",onDown,{passive:true});
  window.addEventListener("pointermove",onMove,{passive:true});
  window.addEventListener("pointerup",onUp,{passive:true});
  window.addEventListener("pointercancel",onCancel,{passive:true});
  window.addEventListener("click",onClickCapture,true);
  return()=>{window.removeEventListener("pointerdown",onDown);window.removeEventListener("pointermove",onMove);window.removeEventListener("pointerup",onUp);window.removeEventListener("pointercancel",onCancel);window.removeEventListener("click",onClickCapture,true);};
 },[isOpen,setIsOpen,edge,drawerRef,options.railWidth]);
}
