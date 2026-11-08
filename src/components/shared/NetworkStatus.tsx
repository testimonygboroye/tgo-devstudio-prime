"use client";
import { useCallback, useEffect, useRef, useState } from "react";
type ConnectionState = "online" | "offline" | "restored";
export default function NetworkStatus() {
  const [state,setState]=useState<ConnectionState>("online");
  const [visible,setVisible]=useState(false);
  const verifyTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const hideTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const wasOffline=useRef(false);
  const dismissedDuringOutage=useRef(false);
  const clearTimers=useCallback(()=>{
    if(verifyTimer.current)clearTimeout(verifyTimer.current);
    if(hideTimer.current)clearTimeout(hideTimer.current);
    verifyTimer.current=null;hideTimer.current=null;
  },[]);
  const confirmConnection=useCallback(async()=>{
    if(!navigator.onLine)return;
    try{
      const response=await fetch(`/favicon.png?network-check=${Date.now()}`,{method:"HEAD",cache:"no-store",credentials:"same-origin"});
      if(!response.ok)throw new Error("Connection check failed");
      clearTimers();
      if(!wasOffline.current)return;
      wasOffline.current=false;dismissedDuringOutage.current=false;
      setState("restored");setVisible(true);
      hideTimer.current=setTimeout(()=>{setVisible(false);setState("online");},2200);
    }catch{/* Wait until a real connection is verified. */}
  },[clearTimers]);
  useEffect(()=>{
    if(!navigator.onLine){wasOffline.current=true;setState("offline");setVisible(true);}
    const handleOffline=()=>{
      clearTimers();wasOffline.current=true;setState("offline");
      if(!dismissedDuringOutage.current)setVisible(true);
    };
    const handleOnline=()=>{
      if(!wasOffline.current)return;
      if(verifyTimer.current)clearTimeout(verifyTimer.current);
      verifyTimer.current=setTimeout(()=>void confirmConnection(),300);
    };
    const handleVisibility=()=>{
      if(document.visibilityState==="visible"&&navigator.onLine&&wasOffline.current)void confirmConnection();
    };
    const interval=window.setInterval(()=>{
      if(!navigator.onLine&&!wasOffline.current)handleOffline();
      else if(navigator.onLine&&wasOffline.current)void confirmConnection();
    },12000);
    window.addEventListener("offline",handleOffline);window.addEventListener("online",handleOnline);
    document.addEventListener("visibilitychange",handleVisibility);
    return()=>{
      clearTimers();window.clearInterval(interval);
      window.removeEventListener("offline",handleOffline);window.removeEventListener("online",handleOnline);
      document.removeEventListener("visibilitychange",handleVisibility);
    };
  },[clearTimers,confirmConnection]);
  const retry=()=>{if(navigator.onLine)void confirmConnection();};
  const dismiss=()=>{setVisible(false);if(state==="offline")dismissedDuringOutage.current=true;};
  if(!visible||state==="online")return null;
  const restored=state==="restored";
  return <div className={`tgo-network-toast ${restored?"is-restored":"is-offline"}`} role="status" aria-live="polite" aria-atomic="true">
    <span className="tgo-network-icon" aria-hidden="true">{restored?"✓":"⌁"}</span>
    <span className="tgo-network-copy"><strong>{restored?"Connection restored":"You're offline"}</strong>
    <span>{restored?"You're back online. Everything is ready.":"Some features may be unavailable until you reconnect."}</span></span>
    {!restored&&<button type="button" className="tgo-network-retry" onClick={retry} disabled={!navigator.onLine}>Retry</button>}
    <button type="button" className="tgo-network-close" onClick={dismiss} aria-label="Dismiss connection notice">×</button>
  </div>;
}
