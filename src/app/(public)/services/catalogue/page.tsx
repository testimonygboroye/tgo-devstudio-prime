import Link from "next/link";
import { ArrowRight, ArrowUpRight, Layers, PackageCheck, Sparkles, Clock3, RefreshCw } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import CommercialService from "@/models/CommercialService";

export const revalidate=300;
type ServicePackage={key:string;name:string;summary?:string;price:number;currency:string;deliveryDays:number;revisions:number;features:string[];enabled:boolean};
type ServiceRecord={_id:string;name:string;category:string;summary:string;description:string;packages:ServicePackage[]};
export const metadata={title:"Service Packages & Solutions | TGO DevStudio",description:"Explore TGO DevStudio service packages, delivery options and custom project solutions.",alternates:{canonical:"/services/catalogue"}};

export default async function CommercialServiceCataloguePage(){
  await connectToDatabase();
  const services=await CommercialService.find({status:"published"}).sort({category:1,name:1}).lean() as unknown as ServiceRecord[];
  const categories=[...new Set(services.map(item=>item.category))];
  return (
    <main className="catalogue-page">
      <section className="catalogue-hero"><div className="home-container"><span className="eyebrow-label"><Sparkles size={14}/> COMMERCIAL SERVICE CATALOGUE</span><h1>Clear packages.<br/><em>Thoughtful delivery.</em></h1><p>Explore available service packages and delivery options. If your requirements are unique, submit a custom project request and our team will scope the work with you.</p><div className="catalogue-hero-actions"><Link href="/client/register" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white">Create client account <ArrowRight size={16}/></Link><Link href="/book-a-call" className="catalogue-secondary-link">Book a discovery call <ArrowUpRight size={16}/></Link></div></div></section>
      <section className="catalogue-content"><div className="home-container">
        {services.length===0?<div className="catalogue-empty"><Layers size={28}/><h2>Custom solutions are available.</h2><p>Our packaged service catalogue is being curated. You can still register and submit a custom project request to discuss your requirements.</p><Link href="/contact" className="btn-premium-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white">Discuss a custom project <ArrowUpRight size={16}/></Link></div>:
        <div className="catalogue-groups">{categories.map(category=><section key={category}><div className="catalogue-category-heading"><span className="eyebrow-label">SERVICE CATEGORY</span><h2>{category}</h2><i/></div><div className="catalogue-grid">{services.filter(service=>service.category===category).map(service=><article key={String(service._id)} className="catalogue-card"><div className="catalogue-card-heading"><span><PackageCheck size={20}/></span><small>{service.category}</small></div><h3>{service.name}</h3><p className="catalogue-summary">{service.summary}</p><p className="catalogue-description">{service.description}</p>{service.packages?.filter(pkg=>pkg.enabled).length>0&&<div className="catalogue-packages">{service.packages.filter(pkg=>pkg.enabled).map(pkg=><div className="catalogue-package" key={pkg.key}><div className="catalogue-package-top"><b>{pkg.name}</b><strong>{pkg.price>0?pkg.currency+" "+Number(pkg.price).toLocaleString():"Custom quote"}</strong></div>{pkg.summary&&<p>{pkg.summary}</p>}<div className="catalogue-package-meta"><span><Clock3 size={13}/>{pkg.deliveryDays>0?pkg.deliveryDays+" delivery days":"Timeline scoped"}</span><span><RefreshCw size={13}/>{pkg.revisions} revisions</span></div>{pkg.features?.length>0&&<ul>{pkg.features.slice(0,6).map(feature=><li key={feature}>{feature}</li>)}</ul>}</div>)}</div>}<Link href="/client/register" className="catalogue-request-link">Request this service <ArrowUpRight size={16}/></Link></article>)}</div></section>)}</div>}
      </div></section>
    </main>
  );
}
