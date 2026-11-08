"use client";
import { useCallback, useEffect, useRef, useState } from "react";
declare global { interface Window { google?: any } }
type Props={endpoint:string;payload?:Record<string,string>;onResult:(data:any)=>void;onError:(message:string)=>void};
const LAST_KEY="tgo:last-google-account";
export default function GoogleSignInButton({endpoint,payload={},onResult,onError}:Props){
 const hostRef=useRef<HTMLDivElement>(null);
 const initializedRef=useRef(false);
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
 const initialize=useCallback(()=>{
  const gis=window.google?.accounts?.id,host=hostRef.current;
  if(!clientId||!gis||!host||initializedRef.current)return false;
  try{
   let remembered="";
   try{remembered=localStorage.getItem(LAST_KEY)||"";}catch{}
   gis.initialize({client_id:clientId,callback:handleCredential,auto_select:false,ux_mode:"popup",cancel_on_tap_outside:true,...(remembered?{login_hint:remembered}:{})});
   initializedRef.current=true;
   host.replaceChildren();
   gis.renderButton(host,{type:"standard",theme:"outline",size:"large",shape:"pill",text:"continue_with",logo_alignment:"left",width:Math.min(380,Math.max(260,host.clientWidth||320))});
   setReady(true);setLoadError("");return true;
  }catch{setLoadError("Google sign-in could not initialize. Check the OAuth client ID and authorized JavaScript origin.");return false;}
 },[clientId,handleCredential]);
 useEffect(()=>{
  try{setLastEmail(localStorage.getItem(LAST_KEY)||"");}catch{}
  if(!clientId){setLoadError("Google sign-in is not configured on this deployment.");return;}
  let disposed=false,attempts=0;
  const onLoad=()=>{if(!disposed)initialize();};
  const existing=document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
  let script=existing;
  if(!script){script=document.createElement("script");script.src="https://accounts.google.com/gsi/client";script.async=true;script.defer=true;script.addEventListener("load",onLoad,{once:true});script.addEventListener("error",()=>{if(!disposed)setLoadError("Google sign-in could not load. Your browser, network, or content blocker may be blocking accounts.google.com.");},{once:true});document.head.appendChild(script);}
  const poll=window.setInterval(()=>{attempts++;if(window.google?.accounts?.id){initialize();if(initializedRef.current)window.clearInterval(poll);}else if(attempts>=100){window.clearInterval(poll);if(!disposed)setLoadError("Google sign-in could not load. Allow accounts.google.com and third-party sign-in, then reload.");}},150);
  if(window.google?.accounts?.id)initialize();
  return()=>{disposed=true;window.clearInterval(poll);};
 },[clientId,initialize]);
 function continueRemembered(){
  if(!ready||!window.google?.accounts?.id){onError("Google sign-in is still loading. Please try again in a moment.");return;}
  try{window.google.accounts.id.prompt((notification:any)=>{if(notification?.isNotDisplayed?.()||notification?.isSkippedMoment?.())onError("Google could not offer the remembered account automatically. Use Continue with Google to choose it.");});}
  catch{onError("Could not start remembered Google sign-in. Use Continue with Google instead.");}
 }
 return <div className="w-full space-y-3">
  {lastEmail&&<button type="button" disabled={!ready} onClick={continueRemembered} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-base-700 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 disabled:cursor-wait disabled:opacity-60"><span className="text-xl font-bold text-blue-600">G</span><span>Continue as {lastEmail}</span></button>}
  <div ref={hostRef} className="flex min-h-[48px] w-full justify-center" aria-label="Choose a different Google account"/>
  {!ready&&!loadError&&<p className="text-center text-xs text-neutral-500">Loading Google sign-in…</p>}
  {loadError&&<p role="alert" className="text-center text-xs text-amber-300">{loadError}</p>}
 </div>;
}