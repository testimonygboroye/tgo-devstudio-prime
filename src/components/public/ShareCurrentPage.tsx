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
  if (!navigator.share) { setError("This browser does not support image sharing. Download the QR image instead."); return; }
  try {
    const declaredOgImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content;
    const canvas = document.createElement("canvas");
    const width = 1200, previewHeight = 630, qrSize = 560, padding = 48, gap = 32;
    canvas.width = width; canvas.height = padding + previewHeight + gap + qrSize + padding;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot compose the share image.");
    context.fillStyle = "#080d20"; context.fillRect(0,0,canvas.width,canvas.height);
    let previewDrawn = false;
    if (declaredOgImage) {
      try {
        const previewUrl = new URL("/api/share-og-image", window.location.origin);
        previewUrl.searchParams.set("url", new URL(declaredOgImage,currentUrl).toString());
        const response = await fetch(previewUrl.toString(), { cache:"no-store", credentials:"same-origin" });
        if (!response.ok) throw new Error("OG preview request returned "+response.status);
        const blob = await response.blob();
        if (!blob.type.startsWith("image/") || !blob.size) throw new Error("OG preview is not a valid image.");
        const bitmap = await createImageBitmap(blob);
        context.drawImage(bitmap,0,0,width,previewHeight);
        bitmap.close?.();
        previewDrawn = true;
      } catch (previewError) {
        console.warn("[Share] OG image unavailable; using branded preview card.",previewError);
      }
    }
    if (!previewDrawn) {
      const gradient=context.createLinearGradient(0,0,width,previewHeight);
      gradient.addColorStop(0,"#0a102a");gradient.addColorStop(1,"#17103b");
      context.fillStyle=gradient;context.fillRect(0,0,width,previewHeight);
      context.fillStyle="#22d3ee";context.fillRect(0,previewHeight-5,width,5);
      context.fillStyle="#ffffff";context.textAlign="center";context.font="bold 58px Arial";
      context.fillText(title.slice(0,38),width/2,270);
      context.font="28px Arial";context.fillStyle="#cbd5e1";
      context.fillText(new URL(currentUrl).hostname,width/2,335);
    }
    const qrResponse=await fetch(qrData);
    if(!qrResponse.ok)throw new Error("The generated QR code could not be loaded.");
    const qrBlob=await qrResponse.blob();
    const qrBitmap=await createImageBitmap(qrBlob);
    const qrY=padding+previewHeight+gap;
    context.fillStyle="#ffffff";context.fillRect((width-qrSize)/2-16,qrY-16,qrSize+32,qrSize+32);
    context.drawImage(qrBitmap,(width-qrSize)/2,qrY,qrSize,qrSize);qrBitmap.close?.();
    context.fillStyle="#ffffff";context.textAlign="center";context.font="24px Arial";
    context.fillText("Scan to open this page",width/2,qrY+qrSize+padding-10);
    const combinedBlob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Could not create the combined preview image.")),"image/png"));
    const combinedFile=new File([combinedBlob],"tgo-page-preview-and-qr.png",{type:"image/png"});
    if(typeof navigator.canShare==="function"&&!navigator.canShare({files:[combinedFile]})){setError("This sharing app does not accept image files. Download the combined image and attach it manually.");return;}
    await navigator.share({title,text:title+"\n"+currentUrl,files:[combinedFile]});
  } catch (shareError) {
    if (shareError instanceof Error && shareError.name === "AbortError") return;
    console.error("[Share] Combined QR sharing failed:",shareError);
    setError(shareError instanceof Error ? shareError.message : "Could not share the combined preview image.");
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
 {mode==="qr"&&<div className="mt-5">{qrLoading&&<p className="py-10 text-center text-sm">Generating QR code…</p>}{qrData&&<><img src={qrData} alt={`QR code for ${title}`} className="mx-auto my-4 aspect-square w-64 rounded-xl bg-white p-2"/><p className="text-center text-xs" style={{color:"var(--text-muted)"}}>One combined image containing the full page preview above the QR code, followed by your caption and page link.</p><p className="break-all text-center text-xs" style={{color:"var(--text-secondary)"}}>{url}</p><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={downloadQr} className="flex items-center justify-center gap-2 rounded-full border px-3 py-3 text-sm font-semibold" style={{borderColor:"var(--border-subtle)"}}><Download size={17}/>Download QR</button><button type="button" onClick={shareQrImage} className="flex items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-semibold brand-gradient-bg text-base-950 disabled:cursor-wait disabled:opacity-50"><Share2 size={17}/>Send one preview + QR image</button></div></>}</div>}
 {error&&<p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}</div></div>}</>;
}