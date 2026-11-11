"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Home, RefreshCw } from "lucide-react";

export default function PublicError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{console.error("Public site route error:",error);},[error]);
  return(
    <main className="public-error-state">
      <div className="public-error-mark"><AlertTriangle size={27}/><span/></div>
      <span className="eyebrow-label">A temporary interruption</span>
      <h1>We hit a small<br/><em>technical pause.</em></h1>
      <p>The page could not finish loading this time. Your work has not been changed. You can safely try again or return to another part of the site.</p>
      <div className="public-error-actions"><button type="button" onClick={()=>reset()} className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white"><RefreshCw size={16}/> Try again</button><Link href="/" className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold" style={{color:"var(--text-primary)"}}><Home size={16}/> Back home</Link></div>
      <Link href="/contact" className="public-error-contact">Still having trouble? Contact the studio <ArrowUpRight size={15}/></Link>
      {error.digest&&<small className="public-error-reference">Reference: {error.digest}</small>}
    </main>
  );
}
