"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, BookOpen, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import PublicEmptyState from "@/components/public/PublicEmptyState";
import { PUBLIC_PAGE_DEFAULTS } from "@/lib/constants/publicSiteDefaults";

interface Article { _id:string; title:string; category:string; }

export default function HelpIndexPage(){
  const router=useRouter();
  const pathname=usePathname();
  const [pageCopy,setPageCopy]=useState(PUBLIC_PAGE_DEFAULTS.help);
  const [query,setQuery]=useState("");
  const [articles,setArticles]=useState<Article[]>([]);
  const [isLoading,setIsLoading]=useState(true);
  const [isError,setIsError]=useState(false);

  const load=useCallback(async(term:string,signal:AbortSignal)=>{
    setIsLoading(true);
    setIsError(false);
    try{
      const res=await fetch("/api/help-articles"+(term?"?q="+encodeURIComponent(term):""),{signal});
      if(!res.ok)throw new Error("Help articles request failed");
      const data=await res.json();
      if(signal.aborted)return;
      if(data.status!=="ok"||!Array.isArray(data.articles))throw new Error("Invalid help response");
      setArticles(data.articles);
    }catch(error){
      if(error instanceof Error&&error.name==="AbortError")return;
      setIsError(true);
      setArticles([]);
    }finally{
      if(!signal.aborted)setIsLoading(false);
    }
  },[]);

  useEffect(()=>{
    const controller=new AbortController();
    fetch("/api/public-pages/help",{signal:controller.signal,cache:"no-store"}).then(async response=>{
      if(!response.ok)return;
      const data=await response.json();
      if(!controller.signal.aborted&&data.status==="ok"&&data.settings)setPageCopy(data.settings);
    }).catch(()=>{});
    return()=>controller.abort();
  },[]);

  useEffect(()=>{
    const controller=new AbortController();
    const timeout=window.setTimeout(()=>load(query,controller.signal),250);
    return()=>{window.clearTimeout(timeout);controller.abort();};
  },[query,load]);

  useEffect(()=>{
    if(isLoading)return;
    try{
      const savedScroll=window.sessionStorage.getItem("help-return-scroll");
      if(savedScroll){window.scrollTo({top:parseInt(savedScroll,10),behavior:"instant" as ScrollBehavior});window.sessionStorage.removeItem("help-return-scroll");}
    }catch{/* storage may be unavailable */}
  },[isLoading]);

  function handleOpenArticle(id:string){
    try{window.sessionStorage.setItem("help-return-path",pathname);window.sessionStorage.setItem("help-return-scroll",String(window.scrollY));}catch{/* storage may be unavailable */}
    router.push("/help/"+id);
  }

  const grouped=articles.reduce<Record<string,Article[]>>((acc,article)=>{if(!acc[article.category])acc[article.category]=[];acc[article.category].push(article);return acc;},{});
  return (
    <main className="help-page">
      <div className="home-container help-content">
        <span className="eyebrow-label">{pageCopy.heroEyebrow}</span>
        <h1>{pageCopy.heroHeadline}<br/><em>{pageCopy.heroAccent}</em></h1>
        <p>{pageCopy.heroDescription}</p>
        <div className="help-search-shell"><Search size={19}/><label className="sr-only" htmlFor="help-search">Search help articles</label><input id="help-search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search articles, topics and questions..." autoComplete="off"/>{query&&<button type="button" onClick={()=>setQuery("")} aria-label="Clear search">Clear</button>}</div>
        <div className="help-copy-intro"><span className="eyebrow-label">{pageCopy.introEyebrow}</span><h2>{pageCopy.introHeading}</h2><p>{pageCopy.introDescription}</p></div>
        <div className="help-quick-links"><Link href="/faq"><BookOpen size={15}/> Frequently asked questions <ArrowUpRight size={14}/></Link><Link href="/contact">Contact support <ArrowUpRight size={14}/></Link></div>
        {isLoading&&<div className="help-loading" role="status"><span/>Searching the help library…</div>}
        {!isLoading&&isError&&<PublicEmptyState eyebrow="Help centre" title="The help library is temporarily unavailable." description="We couldn't load the articles just now. Your connection may be interrupted; try again or contact the team directly." primaryHref={pageCopy.ctaPrimaryHref} primaryLabel={pageCopy.ctaPrimaryLabel} secondaryHref={pageCopy.ctaSecondaryHref || "/faq"} secondaryLabel={pageCopy.ctaSecondaryLabel || "Browse FAQs"}/>}
        {!isLoading&&!isError&&articles.length===0&&<PublicEmptyState eyebrow="Help centre" title={query?"No matching articles found.":"Our help library is being prepared."} description={query?"We could not find an article matching “"+query+"”. Try another search or send the team your question directly.":"Search the help library for guidance, or contact the team if you need help with a project, enquiry or website feature."} primaryHref="/contact" primaryLabel="Contact support" secondaryHref="/faq" secondaryLabel="Browse FAQs"/>}
        {!isLoading&&!isError&&Object.keys(grouped).length>0&&<div className="help-results">{Object.entries(grouped).map(([category,items])=><section key={category}><span className="eyebrow-label">{category}</span><div>{items.map(article=><button key={article._id} onClick={()=>handleOpenArticle(article._id)}><span><BookOpen size={17}/>{article.title}</span><ArrowUpRight size={16}/></button>)}</div></section>)}</div>}
      </div>
    </main>
  );
}
