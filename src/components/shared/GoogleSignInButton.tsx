"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
declare global { interface Window { google?: any } }
type Props = { endpoint:string; payload?:Record<string,string>; onResult:(data:any)=>void; onError:(message:string)=>void };
const LAST_GOOGLE_EMAIL_KEY = "tgo:last-google-account";
export default function GoogleSignInButton({endpoint,payload={},onResult,onError}:Props) {
 const buttonRef=useRef<HTMLDivElement>(null);
 const [lastEmail,setLastEmail]=useState("");
 const [ready,setReady]=useState(false);
 useEffect(()=>{try{setLastEmail(localStorage.getItem(LAST_GOOGLE_EMAIL_KEY)||"");}catch{}},[]);
 function initialize() {
  const clientId=process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if(!clientId||!window.google?.accounts?.id||!buttonRef.current)return;
  window.google.accounts.id.initialize({client_id:clientId,callback:async (response:{credential:string})=>{
   try {
    const claims=JSON.parse(atob(response.credential.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
    if(claims.email){localStorage.setItem(LAST_GOOGLE_EMAIL_KEY,String(claims.email));setLastEmail(String(claims.email));}
    const result=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,credential:response.credential})});
    const data=await result.json();if(!result.ok){onError(data.message||"Google sign-in failed.");return;}onResult(data);
   } catch {onError("Unable to complete Google sign-in. Please try again.");}
  },auto_select:false,cancel_on_tap_outside:true});
  buttonRef.current.innerHTML="";
  window.google.accounts.id.renderButton(buttonRef.current,{type:"standard",theme:"outline",size:"large",shape:"pill",text:"continue_with",width:320,logo_alignment:"left"});
  setReady(true);
 }
 function continueAsLastAccount(){
  if(!window.google?.accounts?.id){onError("Google sign-in is still loading. Please try again.");return;}
  window.google.accounts.id.prompt();
 }
 return <div className="w-full">
  <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={initialize}/>
  {lastEmail&&<button type="button" onClick={continueAsLastAccount} disabled={!ready} className="mb-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-base-700 bg-base-900 px-4 py-3 text-sm font-semibold text-neutral-100 hover:border-brand-cyan-400 disabled:opacity-50"><span aria-hidden="true" className="text-lg">G</span><span>Continue as {lastEmail}</span></button>}
  <div ref={buttonRef} className="flex min-h-10 w-full justify-center" aria-label="Continue with Google"/>
 </div>;
}
