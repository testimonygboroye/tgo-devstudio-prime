"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

declare global { interface Window { google?: any } }
type Props = { endpoint: string; payload?: Record<string,string>; onResult: (data:any)=>void; onError:(message:string)=>void; disabled?:boolean };
export default function GoogleSignInButton({endpoint,payload={},onResult,onError,disabled=false}:Props) {
  const buttonRef=useRef<HTMLDivElement>(null);
  const [ready,setReady]=useState(false);
  const initialize=useCallback(()=>{
    const clientId=process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if(!clientId || !window.google?.accounts?.id || !buttonRef.current) return;
    window.google.accounts.id.initialize({
      client_id:clientId,
      callback:async (response:{credential:string})=>{
        try {
          const result=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,credential:response.credential})});
          const data=await result.json();
          if(!result.ok){onError(data.message||"Google sign-in failed.");return;}
          onResult(data);
        } catch { onError("Unable to complete Google sign-in. Please try again."); }
      },
      auto_select:false,
      cancel_on_tap_outside:true
    });
    buttonRef.current.innerHTML="";
    window.google.accounts.id.renderButton(buttonRef.current,{type:"standard",theme:"outline",size:"large",shape:"rectangular",text:"continue_with",width:320,logo_alignment:"left"});
    setReady(true);
  },[endpoint,payload,onError,onResult]);
  useEffect(()=>{if(ready)initialize();},[ready,initialize]);
  return <div className={disabled?"pointer-events-none opacity-50":""}>
    <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={initialize}/>
    <div ref={buttonRef} className="mt-4 flex min-h-10 justify-center" aria-label="Continue with Google"/>
  </div>;
}
