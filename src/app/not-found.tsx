import Link from "next/link";
import { ArrowLeft, Compass, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="tgo-not-found ambient-glow">
      <div className="not-found-orbit" aria-hidden="true"><span/><span/><span/><b>404</b></div>
      <div className="not-found-copy"><span className="eyebrow-label">A little off course</span><h1>This page<br/><em>isn’t here.</em></h1><p>The address may have changed, the page may have moved, or the link may have taken a wrong turn. Let’s get you somewhere useful.</p><div className="not-found-actions"><Link href="/" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white"><Home size={17}/> Back to homepage</Link><Link href="/contact" className="btn-premium-secondary inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold" style={{color:"var(--text-primary)"}}>Contact the studio <ArrowLeft size={16}/></Link></div><div className="not-found-shortcuts"><Link href="/services"><Compass size={15}/> Explore services</Link><Link href="/portfolio"><Search size={15}/> Browse our work</Link></div></div>
    </main>
  );
}
