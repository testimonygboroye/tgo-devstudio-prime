import Link from "next/link";
import { ArrowLeft, Compass, Home, Search } from "lucide-react";
import { getPublicSiteSettings } from "@/lib/publicSite/getPublicSiteSettings";
import { PUBLIC_SITE_SETTINGS_DEFAULTS } from "@/lib/constants/publicSiteDefaults";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const settings = await getPublicSiteSettings();
  const copy = settings || PUBLIC_SITE_SETTINGS_DEFAULTS;
  return (
    <main className="tgo-not-found ambient-glow">
      <img src="/images/illustrations/not-found.svg" alt="" aria-hidden="true" style={{ display:"block", width:"min(100%,390px)", height:"auto", borderRadius:22, margin:"0 auto 24px" }}/>
      <div className="not-found-orbit" aria-hidden="true"><span/><span/><span/><b>404</b></div>
      <div className="not-found-copy"><span className="eyebrow-label">{copy.notFoundEyebrow}</span><h1>{copy.notFoundHeadline}<br/><em>{copy.notFoundAccent}</em></h1><p>{copy.notFoundDescription}</p><div className="not-found-actions"><Link href={copy.notFoundPrimaryHref} className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white"><Home size={17}/> {copy.notFoundPrimaryLabel}</Link><Link href={copy.notFoundSecondaryHref} className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold" style={{color:"var(--text-primary)"}}>{copy.notFoundSecondaryLabel} <ArrowLeft size={16}/></Link></div><div className="not-found-shortcuts"><Link href="/services"><Compass size={15}/> Explore services</Link><Link href="/portfolio"><Search size={15}/> Browse our work</Link></div></div>
    </main>
  );
}
