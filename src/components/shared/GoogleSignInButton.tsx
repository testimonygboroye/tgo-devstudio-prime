"use client";
import { useCallback, useEffect, useRef, useState } from "react";
declare global { interface Window { google?: any } }
type Props={endpoint:string;payload?:Record<string,string>;onResult:(data:any)=>void;onError:(message:string)=>void};
type TokenClient={requestAccessToken:(options?:{prompt?:string;login_hint?:string})=>void};
const LAST_KEY="tgo:last-google-account";
const NAME_KEY="tgo:last-google-name";
const PHOTO_KEY="tgo:last-google-picture";
function GoogleMark(){return <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12z"/></svg>}
function readRememberedEmail(){try{const saved=localStorage.getItem(LAST_KEY);if(saved)return saved;}catch{}try{const match=document.cookie.match(/(?:^|;\s*)tgo_last_google_account=([^;]+)/);return match?decodeURIComponent(match[1]):"";}catch{return "";}}
function saveRememberedAccount(profile:any){const email=String(profile?.email||"").trim().toLowerCase();if(!email)return;const name=String(profile?.name||"").trim(),picture=String(profile?.picture||"");try{localStorage.setItem(LAST_KEY,email);localStorage.setItem(NAME_KEY,name);if(picture)localStorage.setItem(PHOTO_KEY,picture);else localStorage.removeItem(PHOTO_KEY);}catch{}try{document.cookie="tgo_last_google_account="+encodeURIComponent(email)+"; Path=/; Max-Age=31536000; SameSite=Lax"+(location.protocol==="https:"?"; Secure":"");}catch{}return {email,name,picture};}
export default function GoogleSignInButton({endpoint,payload={},onResult,onError}:Props){
 const [lastEmail,setLastEmail]=useState(""),[lastName,setLastName]=useState(""),[lastPicture,setLastPicture]=useState(""),[ready,setReady]=useState(false),[loadError,setLoadError]=useState("");
 const chooserRef=useRef<TokenClient|null>(null);
 const clientId=process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,payloadKey=JSON.stringify(payload);
 const persistAccount=useCallback((profile:any)=>{
  const saved=saveRememberedAccount(profile);if(!saved)return;
  setLastEmail(saved.email);setLastName(saved.name);setLastPicture(saved.picture);
 },[]);
 const completeLogin=useCallback(async(credential:{credential?:string;accessToken?:string})=>{
  try{
   const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",cache:"no-store",body:JSON.stringify({...JSON.parse(payloadKey),...credential})});
   const data=await response.json();if(!response.ok){onError(data.message||"Google sign-in failed.");return;}
   // Persist only the profile returned by our server after Google token verification.
   if(data.googleAccount?.email)persistAccount(data.googleAccount);
   onResult(data);
  }catch(error){onError(error instanceof Error?error.message:"Google sign-in failed. Please try again.");}
 },[endpoint,payloadKey,onError,onResult,persistAccount]);
 const initialize=useCallback(()=>{
  const oauth=window.google?.accounts?.oauth2,id=window.google?.accounts?.id;if(!clientId||!oauth||!id)return false;
  if(!chooserRef.current){
   id.initialize({client_id:clientId,callback:(response:any)=>{if(response.credential)void completeLogin({credential:response.credential});},auto_select:true,ux_mode:"popup",cancel_on_tap_outside:true});
   chooserRef.current=oauth.initTokenClient({client_id:clientId,scope:"openid email profile",callback:(response:any)=>{if(response.error||!response.access_token){if(remembered){id.prompt((notification:any)=>{if(notification?.isNotDisplayed?.()||notification?.isSkippedMoment?.())onError("Google could not silently verify the remembered account. Make sure that account is signed in to this browser, then use Continue with Google once to re-authorize it.");});return;}onError(response.error==="popup_failed_to_open"?"Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.":"Google account selection was cancelled or could not complete.");return;}void completeLogin({accessToken:response.access_token});}});
  }
  setReady(true);setLoadError("");return true;
 },[clientId,completeLogin,onError]);
 useEffect(()=>{
  try{const email=readRememberedEmail();setLastEmail(email);setLastName(localStorage.getItem(NAME_KEY)||"");setLastPicture(localStorage.getItem(PHOTO_KEY)||"");}catch{setLastEmail(readRememberedEmail());}
  if(!clientId){setLoadError("Google sign-in is not configured on this deployment.");return;}
  let disposed=false,attempts=0;
  const init=()=>{if(!disposed)initialize();};
  let script=document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
  if(!script){script=document.createElement("script");script.src="https://accounts.google.com/gsi/client";script.async=true;script.defer=true;script.addEventListener("error",()=>{if(!disposed)setLoadError("Google sign-in could not load. Check your connection or browser settings.");},{once:true});document.head.appendChild(script);}
  const poll=window.setInterval(()=>{attempts++;if(window.google?.accounts?.oauth2&&window.google?.accounts?.id){init();window.clearInterval(poll);}else if(attempts>=100){window.clearInterval(poll);if(!disposed)setLoadError("Google sign-in could not load. Allow accounts.google.com and reload.");}},150);
  if(window.google?.accounts?.oauth2&&window.google?.accounts?.id)init();
  return()=>{disposed=true;window.clearInterval(poll);};
 },[clientId,initialize]);
 function continueRemembered(){
  if(!ready||!lastEmail||!window.google?.accounts?.id)return;
  // Prefer the previously authorized OAuth session for this exact email.
  // prompt:"" suppresses the account chooser/consent screen when Google can
  // silently issue a token; the hint pins the request to the remembered user.
  if(chooserRef.current){
   try{chooserRef.current.requestAccessToken({prompt:"",login_hint:lastEmail});return;}
   catch{/* Fall through to Google Identity Services One Tap. */}
  }
  try{
   window.google.accounts.id.prompt((notification:any)=>{
    if(notification?.isNotDisplayed?.()||notification?.isSkippedMoment?.()){
     onError("Google could not silently verify the remembered account. Make sure that account is signed in to this browser, then use Continue with Google once to re-authorize it.");
    }
   });
  }catch{onError("Google could not start remembered-account sign-in. Please try again.");}
 }
 function continueChooser(){if(!ready||!chooserRef.current)return;try{chooserRef.current.requestAccessToken({prompt:"select_account"});}catch{onError("Could not open the Google account chooser. Please try again.");}}
 const button="flex min-h-[48px] w-full items-center gap-3 rounded-full border border-neutral-200 bg-white px-3 py-2 text-left text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60";
 return <div className="mx-auto w-full max-w-[360px] space-y-2">
  {lastEmail&&<button type="button" disabled={!ready} onClick={continueRemembered} className={button}>
   <GoogleMark/>
   <span className="min-w-0 flex-1 text-center"><span className="block text-sm font-semibold leading-5">Continue as {lastName||lastEmail.split("@")[0].split(/[._-]/)[0].replace(/^./,x=>x.toUpperCase())}</span><span className="block truncate text-xs leading-4 text-neutral-500">{lastEmail}</span></span>
   <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
    {lastPicture?<img src={lastPicture} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover"/>:<span className="flex h-full w-full items-center justify-center rounded-full bg-[#4285F4] text-sm font-semibold text-white">{(lastName||lastEmail.split("@")[0]||"G").trim().charAt(0).toUpperCase()}</span>}
   </span>
  </button>}
  <button type="button" disabled={!ready} onClick={continueChooser} className={button+" justify-start"}>
   <GoogleMark/><span className="flex-1 text-center text-sm font-semibold">Continue with Google</span><span className="w-5 shrink-0" aria-hidden="true"/>
  </button>
  {loadError&&<p role="alert" className="text-center text-xs text-amber-300">{loadError}</p>}
 </div>;
}
