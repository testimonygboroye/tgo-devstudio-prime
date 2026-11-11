"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Mail, RefreshCw } from "lucide-react";

type Status="loading"|"success"|"error";
export default function UnsubscribePage(){
 const params=useParams<{id:string}>();
 const searchParams=useSearchParams();
 const token=searchParams.get("token")||"";
 const [status,setStatus]=useState<Status>("loading");
 const [message,setMessage]=useState("Please wait while we update your email preferences.");

 useEffect(()=>{
  const controller=new AbortController();
  async function unsubscribe(){
   try{
    const query=new URLSearchParams({token}).toString();
    const res=await fetch("/api/newsletter/unsubscribe/"+encodeURIComponent(params.id)+"?"+query,{method:"POST",signal:controller.signal});
    const data=await res.json();
    if(controller.signal.aborted)return;
    if(!res.ok){setStatus("error");setMessage(data.message||"We could not update your email preferences. The link may have expired.");return;}
    setStatus("success");setMessage(data.message||"Your email preferences have been updated.");
   }catch(error){
    if(error instanceof Error&&error.name==="AbortError")return;
    setStatus("error");setMessage("We could not reach the service. Check your connection and try again.");
   }
  }
  unsubscribe();
  return()=>controller.abort();
 },[params.id,token]);

 const Icon=status==="success"?CheckCircle2:status==="error"?AlertTriangle:Mail;
 return(
  <main className="unsubscribe-page"><div className="unsubscribe-card"><span className={"unsubscribe-icon "+status}><Icon size={28}/></span><span className="eyebrow-label">TGO DevStudio · Newsletter preferences</span><h1>{status==="loading"?"Updating your preferences…":status==="success"?"You’re all set.":"We couldn’t complete that request."}</h1><p>{message}</p>{status==="loading"&&<div className="unsubscribe-progress"><span/></div>}{status==="error"&&<button type="button" onClick={()=>window.location.reload()} className="unsubscribe-retry"><RefreshCw size={15}/> Try again</button>}<Link href="/" className="unsubscribe-home">Return to TGO DevStudio <span>→</span></Link></div></main>
 );
}
