"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
declare global { interface Window { google?: any } }
type Props = { endpoint:string; payload?:Record<string,string>; onResult:(data:any)=>void; onError:(message:string)=>void };
const LAST_GOOGLE_EMAIL_KEY = "tgo:last-google-account";
export default function GoogleSignInButton({endpoint,payload={},onResult,onError}:Props) {
 const buttonRef=useRef<HTMLDivElement>(null);
 const initialized=useRef(false);
 const [lastEmail,setLastEmail]=useState("");
 const [scriptReady,setScriptReady]=useState(false);
 const [buttonReady,setButtonReady]=useState(false);
 const clientId=process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
 const initialize=useCallback(()=>{
  if(!clientId||!scriptReady||!window.google?.accounts?.id||!buttonRef.current||initialized.current)return;
  initialized.current=true;
  try{
   window.google.accounts.id.initialize({client_id:clientId,callback:async(response:{credential:string})=>{
    try{
     const result=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({...payload,credential:response.credential})});
     const data=await result.json();
     if(!result.ok){onError(data.message||"Google sign-in failed.");return;}
     try{const claims=JSON.parse(atob(response.credential.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));if(claims.email){localStorage.setItem(LAST_GOOGLE_EMAIL_KEY,String(claims.email));setLastEmail(String(claims.email));}}catch{}
     onResult(data);
    }catch{onError("Could not reach TGO authentication. Check your connection and try again.");}
   },auto_select:false,login_hint:lastEmail||undefined,ux_mode:"popup",cancel_on_tap_outside:true});
   buttonRef.current.innerHTML="";
   window.google.accounts.id.renderButton(buttonRef.current,{type:"standard",theme:"outline",size:"large",shape:"pill",text:"continue_with",logo_alignment:"left",width:Math.min(360,Math.max(260,buttonRef.current.clientWidth||320))});
   setButtonReady(true);
  }catch(error){initialized.current=false;onError("Google sign-in could not initialize. Check the OAuth client ID and authorized JavaScript origin.");}
 },[clientId,scriptReady,endpoint,payload,onResult,onError,lastEmail]);
 useEffect(()=>{try{setLastEmail(localStorage.getItem(LAST_GOOGLE_EMAIL_KEY)||"");}catch{}},[]);
 useEffect(()=>{if(scriptReady){const timer=window.setInterval(()=>{if(window.google?.accounts?.id){initialize();window.clearInterval(timer);}},150);return()=>window.clearInterval(timer);}},[scriptReady,initialize]);
 useEffect(()=>{const resize=()=>{if(initialized.current&&buttonRef.current&&window.google?.accounts?.id){initialized.current=false;initialize();}};window.addEventListener("resize",resize);return()=>window.removeEventListener("resize",resize);},[initialize]);
 function openGoogleChooser(){if(!window.google?.accounts?.id){onError("Google sign-in is still loading. Please try again.");return;}window.google.accounts.id.prompt((notification:any)=>{if(notification?.isNotDisplayed?.()||notification?.isSkippedMoment?.())onError("Google could not open the account chooser. Check that third-party sign-in is allowed in this browser.");});}
 function continueAsLastAccount(){openGoogleChooser();}
 return <div className="w-full space-y-3">
  <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={()=>setScriptReady(true)} onLoad={()=>setScriptReady(true)} onError={()=>onError("Google sign-in could not load. Check your connection or browser settings.")}/>
  {lastEmail&&<button type="button" onClick={continueAsLastAccount} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-base-700 bg-base-900 px-4 py-3 text-sm font-semibold text-neutral-100 hover:border-brand-cyan-400"><span aria-hidden="true" className="text-lg font-bold">G</span><span>Continue as {lastEmail}</span></button>}
  <div ref={buttonRef} className="flex min-h-[48px] w-full justify-center" aria-label="Continue with Google"/>
  {!buttonReady&&clientId&&<button type="button" onClick={openGoogleChooser} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-base-700 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"><span className="text-xl font-bold text-blue-600">G</span>Continue with Google</button>}
  {!clientId&&<p role="alert" className="text-center text-xs text-amber-300">Google sign-in is not configured on this deployment (missing public OAuth client ID).</p>}
  {clientId&&scriptReady&&!buttonReady&&<p className="text-center text-xs text-neutral-500">Loading Google sign-in…</p>}
 </div>;
}
