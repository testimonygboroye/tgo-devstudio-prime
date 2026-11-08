"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Share2, Copy, Check, QrCode, X, Link2, Download, ArrowLeft, MessageCircle } from "lucide-react";
type ShareMode = "choose" | "link" | "qr" | null;
export default function ShareCurrentPage() {
 const pathname=usePathname(); const [url,setUrl]=useState(""); const [title,setTitle]=useState("TGO DevStudio");
 const [mode,setMode]=useState<ShareMode>(null); const [copied,setCopied]=useState(false); const [qrData,setQrData]=useState(""); const [qrLoading,setQrLoading]=useState(false); const [error,setError]=useState("");
 useEffect(()=>{
  setUrl(window.location.href);
  setTitle(document.title||"TGO DevStudio");
  setMode(null);setQrData("");setError("");
 },[pathname]);
 useEffect(()=>{if(mode!=="qr"||!url||qrData)return;let cancelled=false;
  async function generate(){setQrLoading(true);setError("");try{const QRCode=await import("qrcode");const image=await QRCode.toDataURL(url,{width:640,margin:3,errorCorrectionLevel:"H",color:{dark:"#101426",light:"#FFFFFF"}});if(!cancelled)setQrData(image);}catch{if(!cancelled)setError("Could not generate the QR code. Please try again.");}finally{if(!cancelled)setQrLoading(false);}}
  void generate();return()=>{cancelled=true;};
 },[mode,url,qrData]);

 async function copyLink(){const currentUrl=url||window.location.href;try{await navigator.clipboard.writeText(currentUrl);}catch{const input=document.createElement("textarea");input.value=currentUrl;input.style.position="fixed";input.style.opacity="0";document.body.appendChild(input);input.select();const ok=document.execCommand("copy");input.remove();if(!ok){setError("Unable to copy the link. Please copy it manually.");return;}}setCopied(true);window.setTimeout(()=>setCopied(false),2000);}
 async function shareLink(){const currentUrl=url||window.location.href;if(navigator.share){try{await navigator.share({title,text:title,url:currentUrl});return;}catch(e){if(e instanceof Error&&e.name==="AbortError")return;}}await copyLink();}
 async function shareQrImage() {
  if (!qrData) return;
  const currentUrl = url || window.location.href;
  if (!navigator.share) {
    setError("This browser does not support the system sharing menu. Download the QR image instead.");
    return;
  }

  try {
    // Read the exact Open Graph image declared for this page. Fetch it through
    // our same-origin, allow-listed endpoint so Android can attach it as a file.
    const ogImageMeta = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
    const ogImageUrl = ogImageMeta?.content || new URL("/opengraph-image", window.location.origin).toString();
    const ogResponse = await fetch(`/api/share-og-image?url=${encodeURIComponent(ogImageUrl)}`);
    if (!ogResponse.ok) {
      throw new Error("The page preview image could not be prepared.");
    }

    const ogBlob = await ogResponse.blob();
    if (!ogBlob.type.startsWith("image/")) {
      throw new Error("The page preview is not a valid image.");
    }

    const ogExtension = ogBlob.type.includes("png") ? "png" : ogBlob.type.includes("webp") ? "webp" : "jpg";
    const ogFile = new File([ogBlob], `tgo-page-preview.${ogExtension}`, { type: ogBlob.type });
    const base64 = qrData.slice(qrData.indexOf(",") + 1);
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const qrFile = new File([bytes], "tgo-page-qr.png", { type: "image/png" });

    // File order is intentional: the page's OG preview first, QR code second.
    const files = [ogFile, qrFile];
    if (!navigator.canShare?.({ files })) {
      throw new Error("Your sharing app does not support sending both images together. Download the QR code and share the page link separately.");
    }

    // Do not repeat the URL in text: the url field supplies it once, avoiding
    // the duplicate link visible in some Android share targets.
    await navigator.share({
      title,
      text: `Open ${title} or scan the QR code.`,
      url: currentUrl,
      files,
    });
  } catch (shareError) {
    if (shareError instanceof Error && shareError.name === "AbortError") return;
    setError(shareError instanceof Error ? shareError.message : "Could not prepare the preview and QR images for sharing.");
  }
}
function downloadQr(){if(!qrData)return;const a=document.createElement("a");a.href=qrData;a.download="tgo-page-qr.png";document.body.appendChild(a);a.click();a.remove();}
 const close=()=>{setMode(null);setError("");};
 return <><section className="mx-auto max-w-4xl px-6 pb-12 sm:px-12" aria-label="Share this page"><div className="flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" style={{borderColor:"var(--border-subtle)",background:"var(--bg-surface)"}}><div><p className="text-lg font-semibold" style={{color:"var(--text-primary)"}}>Found this useful?</p><p className="mt-1 text-sm" style={{color:"var(--text-secondary)"}}>Share this page with someone who might find it helpful.</p></div><button type="button" onClick={()=>setMode("choose")} className="btn-premium-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-base-950"><Share2 size={17}/>Share page</button></div></section>
 {mode!==null&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Share this page" onClick={close}><div className="w-full max-w-md rounded-3xl p-6 shadow-2xl" style={{background:"var(--bg-surface)",color:"var(--text-primary)"}} onClick={e=>e.stopPropagation()}>
 <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest" style={{color:"var(--text-muted)"}}>TGO DevStudio</p><h2 className="mt-1 text-xl font-bold">{mode==="choose"?"How would you like to share?":mode==="link"?"Share this link":"Share this QR code"}</h2></div><button type="button" aria-label="Close sharing dialog" onClick={close} className="rounded-full p-2 hover:bg-white/10"><X size={20}/></button></div>
 {mode!=="choose"&&<button type="button" onClick={()=>{setMode("choose");setError("");}} className="mt-4 inline-flex items-center gap-2 text-sm" style={{color:"var(--text-secondary)"}}><ArrowLeft size={16}/>Back to sharing methods</button>}
 {mode==="choose"&&<div className="mt-6 space-y-3">
 <button type="button" onClick={()=>setMode("link")} className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:border-cyan-400" style={{borderColor:"var(--border-subtle)"}}><span className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400"><Link2 size={24}/></span><span className="flex-1"><span className="block font-semibold">Share as a link</span><span className="mt-1 block text-sm" style={{color:"var(--text-secondary)"}}>Send through WhatsApp, Messages, email, and more.</span></span></button>
 <button type="button" onClick={()=>setMode("qr")} className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:border-cyan-400" style={{borderColor:"var(--border-subtle)"}}><span className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400"><QrCode size={24}/></span><span className="flex-1"><span className="block font-semibold">Share as a QR code</span><span className="mt-1 block text-sm" style={{color:"var(--text-secondary)"}}>Display, download, or send the QR image.</span></span></button>
 <button type="button" onClick={copyLink} className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:border-cyan-400" style={{borderColor:"var(--border-subtle)"}}><span className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">{copied?<Check size={24}/>:<Copy size={24}/>}</span><span className="flex-1"><span className="block font-semibold">{copied?"Link copied":"Copy link"}</span><span className="mt-1 block text-sm" style={{color:"var(--text-secondary)"}}>Copy the exact URL of this page.</span></span></button></div>}
 {mode==="link"&&<div className="mt-6"><div className="break-all rounded-xl border p-3 text-sm" style={{borderColor:"var(--border-subtle)",color:"var(--text-secondary)"}}>{url}</div><button type="button" onClick={shareLink} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold brand-gradient-bg text-base-950"><MessageCircle size={18}/>Choose an app to share</button></div>}
 {mode==="qr"&&<div className="mt-5">{qrLoading&&<p className="py-10 text-center text-sm">Generating QR code…</p>}{qrData&&<><img src={qrData} alt={`QR code for ${title}`} className="mx-auto my-4 aspect-square w-64 rounded-xl bg-white p-2"/><p className="text-center text-xs" style={{color:"var(--text-muted)"}}>The QR image and page link are shared together. Receiving apps can generate the preview from the page URL.</p><p className="break-all text-center text-xs" style={{color:"var(--text-secondary)"}}>{url}</p><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={downloadQr} className="flex items-center justify-center gap-2 rounded-full border px-3 py-3 text-sm font-semibold" style={{borderColor:"var(--border-subtle)"}}><Download size={17}/>Download QR</button><button type="button" onClick={shareQrImage} className="flex items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-semibold brand-gradient-bg text-base-950 disabled:cursor-wait disabled:opacity-50"><Share2 size={17}/>Send QR + page link</button></div></>}</div>}
 {error&&<p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}</div></div>}</>;
}