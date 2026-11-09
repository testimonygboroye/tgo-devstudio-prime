"use client";
import { useCallback, useEffect, useRef, useState } from "react";
declare global { interface Window { google?: any } }
type Props={endpoint:string;payload?:Record<string,string>;onResult:(data:any)=>void;onError:(message:string)=>void};
type GoogleTokenClient={requestAccessToken:(options?:{prompt?:string})=>void};
const LAST_KEY="tgo:last-google-account";
function GoogleMark(){return <svg aria-hidden="true" viewBox="0 0 48 48" className="h-7 w-7 shrink-0"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12z"/></svg>}
export default function GoogleSignInButton({endpoint,payload={},onResult,onError}:Props){
 const hostRef=useRef<HTMLDivElement>(null);
 const initializedRef=useRef(false);
 const [lastEmail,setLastEmail]=useState("");
 const [lastName,setLastName]=useState("");
 const chooserRef=useRef<GoogleTokenClient|null>(null);
 const [ready,setReady]=useState(false);
 const [loadError,setLoadError]=useState("");
 const clientId=process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
 const payloadKey=JSON.stringify(payload);
 const handleCredential=useCallback(async(response:{credential:string})=>{
  try{
   const result=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",cache:"no-store",body:JSON.stringify({...JSON.parse(payloadKey),credential:response.credential})});
   const data=await result.json();
   if(!result.ok){onError(data.message||"Google sign-in failed.");return;}
   try{const raw=response.credential.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");const claims=JSON.parse(atob(raw));if(claims.email){const email=String(claims.email).toLowerCase();const name=String(claims.name||"").trim();localStorage.setItem(LAST_KEY,email);localStorage.setItem("tgo:last-google-name",name);setLastEmail(email);setLastName(name);}}catch{}
   onResult(data);
  }catch{onError("Could not reach TGO authentication. Check your connection and try again.");}
 },[endpoint,payloadKey,onError,onResult]);
 const initialize=useCallback(()=>{
  const gis=window.google?.accounts?.id,host=hostRef.current;
  if(!clientId||!gis||!host||initializedRef.current)return false;
  try{
   let remembered="";
   try{remembered=localStorage.getItem(LAST_KEY)||"";}catch{}
   gis.initialize({client_id:clientId,callback:handleCredential,auto_select:true,ux_mode:"popup",cancel_on_tap_outside:true,...(remembered?{login_hint:remembered}:{})});
   chooserRef.current=window.google.accounts.oauth2.initTokenClient({client_id:clientId,scope:"openid email profile",prompt:"select_account",callback:async(tokenResponse:any)=>{if(tokenResponse.error||!tokenResponse.access_token){onError("Google account selection was cancelled or could not complete.");return;}try{const result=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",cache:"no-store",body:JSON.stringify({...JSON.parse(payloadKey),accessToken:tokenResponse.access_token})});const data=await result.json();if(!result.ok){onError(data.message||"Google sign-in failed.");return;}try{const info=await fetch("https://www.googleapis.com/oauth2/v3/userinfo",{headers:{Authorization:"Bearer "+tokenResponse.access_token}});const profile=await info.json();if(profile.email){localStorage.setItem(LAST_KEY,String(profile.email).toLowerCase());localStorage.setItem("tgo:last-google-name",String(profile.name||""));}}catch{}onResult(data);}catch{onError("Could not reach TGO authentication. Try again.");}}});
   initializedRef.current=true;
   host.replaceChildren();
   gis.renderButton(host,{type:"standard",theme:"outline",size:"large",shape:"pill",text:"continue_with",logo_alignment:"left",width:Math.min(380,Math.max(260,host.clientWidth||320))});
   setReady(true);setLoadError("");return true;
  }catch{setLoadError("Google sign-in could not initialize. Check the OAuth client ID and authorized JavaScript origin.");return false;}
 },[clientId,handleCredential]);
 useEffect(()=>{
  try{setLastEmail(localStorage.getItem(LAST_KEY)||"");setLastName(localStorage.getItem("tgo:last-google-name")||"");}catch{}
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
 function continueChooser(){if(!ready||!chooserRef.current){onError("Google sign-in is still loading. Please try again.");return;}try{chooserRef.current.requestAccessToken({prompt:"select_account"});}catch{onError("Could not open the Google account chooser. Please try again.");}}
 function continueRemembered(){
  if(!ready||!window.google?.accounts?.id){onError("Google sign-in is still loading. Please try again in a moment.");return;}
  try{window.google.accounts.id.prompt((notification:any)=>{if(notification?.isNotDisplayed?.()||notification?.isSkippedMoment?.())onError("Google could not offer the remembered account automatically. Use Continue with Google to choose it.");});}
  catch{onError("Could not start remembered Google sign-in. Use Continue with Google instead.");}
 }
 return <div className="w-full space-y-3">
  {lastEmail&&<button type="button" disabled={!ready} onClick={continueRemembered} className="relative flex min-h-[76px] w-full items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 text-left text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60">
   <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b1020]"><img src="/logo.png" alt="" className="h-8 w-8 object-contain"/></span>
   <span className="min-w-0 flex-1"><span className="block text-base font-semibold leading-5">Continue as {lastName||lastEmail.split("@")[0].split(/[._-]/)[0].replace(/^./,letter=>letter.toUpperCase())}</span><span className="mt-0.5 block truncate text-sm text-neutral-500">{lastEmail}</span></span>
   <GoogleMark/>
  </button>}
  <button type="button" disabled={!ready} onClick={continueChooser} className="flex min-h-[64px] w-full items-center justify-center gap-3 rounded-full border border-neutral-300 bg-white px-5 py-3 text-base font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"><GoogleMark/><span>Continue with Google</span></button>
  {!ready&&!loadError&&<p className="text-center text-xs text-neutral-500">Loading Google sign-in…</p>}
  {loadError&&<p role="alert" className="text-center text-xs text-amber-300">{loadError}</p>}
 </div>;
}
