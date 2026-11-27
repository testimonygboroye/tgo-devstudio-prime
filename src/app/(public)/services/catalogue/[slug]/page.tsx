import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import CommercialService from "@/models/CommercialService";
import { resolveCommercialPrice } from "@/lib/commercial/pricing";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
const money = (amount:number,currency:string) => currency==="NGN" ? "₦"+amount.toLocaleString("en-NG",{maximumFractionDigits:0}) : new Intl.NumberFormat("en-NG",{style:"currency",currency,maximumFractionDigits:0}).format(amount);
export default async function CommercialServiceDetail({params}:Props) {
  const {slug}=await params; await connectToDatabase();
  const service=await CommercialService.findOne({slug,status:"published"}).lean();
  if(!service) notFound();
  const packages=(service.packages||[]).filter((item:any)=>item.enabled!==false);
  return <main className="min-h-screen bg-[#080d20] pb-20 text-white">
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/services/catalogue" className="inline-flex items-center gap-2 text-sm text-cyan-300"><ArrowLeft size={16}/> All services and packages</Link>
      <header className="mt-8 max-w-4xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">{service.family} / {service.category}</p><h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{service.name}</h1><p className="mt-5 text-lg leading-8 text-slate-300">{service.summary}</p><p className="mt-4 leading-7 text-slate-400">{service.description}</p></header>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {service.problemSolved&&<section className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><h2 className="font-semibold">The problem this solves</h2><p className="mt-3 text-sm leading-7 text-slate-300">{service.problemSolved}</p></section>}
        <section className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><h2 className="font-semibold">Who this is for</h2><ul className="mt-3 space-y-2 text-sm text-slate-300">{(service.targetCustomers||[]).map((v:string)=><li key={v}>• {v}</li>)}</ul></section>
      </div>
      {[[ "Use cases",service.useCases ],["Scope and features",service.scope],["Technologies",service.technologies],["Our delivery process",service.process],["Deliverables",service.deliverables],["Exclusions",service.exclusions]].map(([title,items]:any)=>(items?.length>0?<section key={title} className="mt-8 rounded-2xl border border-white/10 bg-white/[.03] p-6"><h2 className="text-lg font-semibold">{title}</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{items.map((item:string)=><li key={item} className="flex gap-2 text-sm leading-6 text-slate-300"><CheckCircle2 className="mt-1 shrink-0 text-cyan-300" size={15}/>{item}</li>)}</ul></section>:null))}
      <section className="mt-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Choose your scope</p><h2 className="mt-2 text-3xl font-bold">Packages and pricing</h2><p className="mt-2 text-sm text-slate-400">Delivery estimate: {service.estimatedTimeline||"Confirmed after requirements review"}.</p></div><div className="text-xs text-slate-400"><ShieldCheck className="mr-1 inline" size={14}/> Secure client order workflow</div></div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">{packages.map((pkg:any)=>{const price=resolveCommercialPrice(pkg);return <article key={pkg.key} className="rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-[#141b38] to-[#0b1830] p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-semibold">{pkg.name}</h3><p className="mt-2 text-sm text-slate-400">{pkg.summary}</p></div><span className="rounded-full border border-cyan-300/20 px-3 py-1 text-xs text-cyan-200">{pkg.billingModel==="monthly"?"Monthly":pkg.billingModel==="hourly"?"Hourly":pkg.billingModel==="custom"?"Custom":"Fixed scope"}</span></div><div className="mt-6">{price.promotionActive&&<p className="text-sm text-slate-500 line-through">{money(price.currencyAmountBeforePromotion||0,pkg.currency||service.currency)}</p>}<p className="text-3xl font-bold">{price.amount>0?money(price.amount,pkg.currency||service.currency):"Custom quotation"}</p>{price.promotionActive&&<p className="mt-1 text-xs font-semibold text-emerald-300">Limited-time promotion</p>}</div><div className="mt-5 flex items-center gap-4 text-xs text-slate-400"><span className="inline-flex items-center gap-1"><Clock3 size={14}/>{pkg.deliveryDays?pkg.deliveryDays+" delivery days":"Timeline scoped"}</span><span>{pkg.revisions||0} revisions</span></div>{(pkg.features||[]).length>0&&<ul className="mt-5 space-y-2">{pkg.features.map((f:string)=><li key={f} className="text-sm text-slate-300">✓ {f}</li>)}</ul>}{(pkg.addOns||[]).length>0&&<div className="mt-5 border-t border-white/10 pt-4"><h4 className="text-sm font-semibold">Optional add-ons</h4>{pkg.addOns.map((a:any)=><p key={a.key} className="mt-2 text-sm text-slate-400">{a.name} · {money(a.price,a.currency||pkg.currency)}</p>)}</div>}<Link href="/client/register" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-semibold">Continue in client portal <ArrowUpRight size={16}/></Link></article>})}</div>
      </section>
      <section className="mt-12 rounded-3xl border border-white/10 bg-white/[.04] p-7"><h2 className="text-2xl font-bold">Need a tailored solution?</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">For complex integrations, enterprise requirements or a scope that does not fit a standard package, request a tailored assessment and quotation.</p><Link href="/contact" className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 px-5 py-3 text-sm font-semibold text-cyan-200">Request a custom quotation <ArrowUpRight size={16}/></Link></section>
    </div>
  </main>;
}
