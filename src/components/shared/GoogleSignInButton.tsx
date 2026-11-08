"use client";
import { useCallback, useEffect, useRef, useState } from "react";
declare global { interface Window { google?: any } }
type Props={endpoint:string;payload?:Record<string,string>;onResult:(data:any)=>void;onError:(message:string)=>void};
const LAST_KEY="tgo:last-google-account";
export default function GoogleSignInButton({endpoint,payload={},onResult,onError}:Props){
 const hostRef=useRef<HTMLDivElement>(null);
 const [lastEmail,setLastEmail]=useState("");
 const [ready,setReady]=useState(false);
 const [loadError,setLoadError]=useState("");
 const clientId=process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
 const payloadKey=JSON.stringify(payload);
 const handleCredential=useCallback(async(response:{credential:string})=>{
  try{
   const result=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",cache:"no-store",body:JSON.stringify({...JSON.parse(payloadKey),credential:response.credential})});
   const data=await result.json();
   if(!result.ok){onError(data.message||"Google sign-in failed.");return;}
   try{const raw=response.credential.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");const claims=JSON.parse(atob(raw));if(claims.email){const email=String(claims.email).toLowerCase();localStorage.setItem(LAST_KEY,email);setLastEmail(email);}}catch{}
   onResult(data);
  }catch{onError("Could not reach TGO authentication. Check your connection and try again.");}
 },[endpoint,payloadKey,onError,onResult]);
 const render=useCallback(()=>{
  const gis=window.google?.accounts?.id,host=hostRef.current;
  if(!clientId||!gis||!host)return false;
  try{
   gis.initialize({client_id:clientId,callback:handleCredential,auto_select:false,ux_mode:"popup",cancel_on_tap_outside:true});
   host.replaceChildren();
   gis.renderButton(host,{type:"standard",theme:"outline",size:"large",shape:"pill",text:"continue_with",logo_alignment:"left",width:Math.min(380,Math.max(260,host.clientWidth||320))});
   setReady(true);setLoadError("");return true;
  }catch{setLoadError("Google sign-in could not initialize. Verify the OAuth client ID and authorized JavaScript origin.");return false;}
 },[clientId,handleCredential]);
 useEffect(()=>{
  try{setLastEmail(localStorage.getItem(LAST_KEY)||"");}catch{}
  if(!clientId){setLoadError("Google sign-in is not configured on this deployment.");return;}
  let disposed=false,attempts=0;
  const poll=window.setInterval(()=>{
   attempts++;
   if(window.google?.accounts?.id&&hostRef.current){if(render())window.clearInterval(poll);}
   else if(attempts>80){window.clearInterval(poll);if(!disposed)setLoadError("Google sign-in could not load. Allow accounts.google.com and third-party sign-in in your browser, then reload.");}
  },150);
  if(!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')){
   const script=document.createElement("script");script.src="https://accounts.google.com/gsi/client";script.async=true;script.defer=true;
   script.onload=()=>{if(!disposed)render();};script.onerror=()=>{if(!disposed)setLoadError("Google sign-in could not load. Your browser or network may be blocking Google Identity Services.");};document.head.appendChild(script);
  }
  return()=>{disposed=true;window.clearInterval(poll);};
 },[clientId,render]);
 const renderLast=()=>{
  if(!lastEmail||!window.google?.accounts?.id){onError("Google sign-in is still loading. Please wait for the Google button to finish loading.");return;}
  try{
   const host=hostRef.current;if(!host)return;
   const gis=window.google.accounts.id;
   gis.initialize({client_id:clientId,callback:handleCredential,auto_select:false,login_hint:lastEmail,ux_mode:"popup"});
   host.replaceChildren();
   gis.renderButton(host,{type:"standard",theme:"outline",size:"large",shape:"pill",text:"continue_with",logo_alignment:"left",width:Math.min(380,Math.max(260,host.clientWidth||320)),login_hint:lastEmail});
  }catch{onError("Could not start Google sign-in for the remembered account.");}
 };
 return <div className="w-full space-y-3">
  {lastEmail&&<button type="button" onClick={renderLast} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-base-700 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"><span className="text-xl font-bold text-blue-600">G</span><span>Continue as {lastEmail}</span></button>}
  <div ref={hostRef} className="flex min-h-[48px] w-full justify-center" aria-label="Choose a Google account"/>
  {!ready&&!loadError&&<p className="text-center text-xs text-neutral-500">Loading Google sign-in…</p>}
  {loadError&&<p role="alert" className="text-center text-xs text-amber-300">{loadError}</p>}
 </div>;
}
