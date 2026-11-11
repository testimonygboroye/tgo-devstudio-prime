"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { X } from "lucide-react";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";

interface Article { title:string; bodyHtml:string; category:string; }

export default function HelpArticleViewerPage(){
  const router=useRouter();
  const params=useParams<{id:string}>();
  const [article,setArticle]=useState<Article|null>(null);
  const [isLoading,setIsLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    const controller=new AbortController();
    async function load(){
      try{
        const res=await fetch("/api/help-articles/"+params.id,{signal:controller.signal});
        if(!res.ok)throw new Error("Article request failed");
        const data=await res.json();
        if(controller.signal.aborted)return;
        if(data.status!=="ok"){setError(data.message||"Article not found.");return;}
        setArticle(data.article);
      }catch(loadError){
        if(loadError instanceof Error&&loadError.name==="AbortError")return;
        setError("Failed to load article. Please try again or contact support.");
      }finally{
        if(!controller.signal.aborted)setIsLoading(false);
      }
    }
    load();
    return()=>controller.abort();
  },[params.id]);

  function handleClose(){
    let returnPath="/help";
    try{returnPath=window.sessionStorage.getItem("help-return-path")||"/help";}catch{/* ignore unavailable storage */}
    router.push(returnPath);
  }

  return(
    <div className="help-article-overlay" role="dialog" aria-modal="true" aria-labelledby="help-article-title" onClick={handleClose}>
      <div className="help-article-dialog" onClick={event=>event.stopPropagation()}>
        <div className="help-article-dialog-inner">
          <div className="help-article-dialog-heading"><div>{article&&<span className="eyebrow-label">{article.category}</span>}<h1 id="help-article-title">{isLoading?"Loading…":article?.title||"Article unavailable"}</h1></div><button type="button" onClick={handleClose} aria-label="Close help article"><X size={22}/></button></div>
          {error&&<p className="help-article-error">{error}</p>}
          {article&&<div className="prose help-article-body" dangerouslySetInnerHTML={{__html:sanitizeBlogHtml(article.bodyHtml)}}/>}
          {isLoading&&<div className="help-article-loading" role="status">Loading article content…</div>}
        </div>
      </div>
    </div>
  );
}
