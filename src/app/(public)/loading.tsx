import { Sparkles } from "lucide-react";

export default function PublicLoading(){
  return (
    <main className="public-loading-state" aria-busy="true" aria-live="polite">
      <div className="public-loading-brand"><span><Sparkles size={19}/></span><div><b>TGO DEVSTUDIO PRIME</b><small>Preparing your experience</small></div></div>
      <div className="public-loading-hero">
        <div className="public-loading-copy"><i className="public-skeleton public-skeleton-label"/><i className="public-skeleton public-skeleton-title"/><i className="public-skeleton public-skeleton-title short"/><i className="public-skeleton public-skeleton-text"/><i className="public-skeleton public-skeleton-text medium"/><div className="public-loading-actions"><i className="public-skeleton public-skeleton-button"/><i className="public-skeleton public-skeleton-button secondary"/></div></div>
        <div className="public-loading-visual"><i/><i/><i/><span/></div>
      </div>
      <div className="public-loading-sections"><i/><i/><i/></div>
      <p>Loading a little more of what you came for…</p>
    </main>
  );
}
