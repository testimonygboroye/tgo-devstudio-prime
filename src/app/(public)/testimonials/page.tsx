import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Quote, Star } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import Review from "@/models/Review";
import ReviewForm from "@/components/public/ReviewForm";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import PublicEmptyState from "@/components/public/PublicEmptyState";

export const revalidate=300;
export const metadata:Metadata={title:"Testimonials | TGO DevStudio Prime",description:"See what people are saying about TGO DevStudio.",alternates:{canonical:"/testimonials"}};

export default async function TestimonialsPage(){
  const locale=await getServerLocale();
  const t=createTranslator(locale);
  await connectToDatabase();
  const rawReviews=await Review.find({status:"approved"}).select("submitterName rating body targetLabelSnapshot customLabel featured createdAt translations").sort({featured:-1,createdAt:-1}).lean();
  const reviews=rawReviews.map(review=>getLocalizedContent(review,locale,TRANSLATABLE_FIELDS.Review));
  return (
    <main className="testimonials-page">
      <section className="testimonials-hero"><div className="home-container"><span className="eyebrow-label">{t("nav.testimonials")} · CLIENT PERSPECTIVES</span><h1>Good work is built<br/><em>together.</em></h1><p>{t("testimonials.subtitle")}</p><div className="testimonials-hero-proof"><span><Star size={16}/> Honest experiences</span><span><Quote size={16}/> Real project perspectives</span></div></div></section>
      <section className="testimonials-content"><div className="home-container"><div className="testimonials-section-heading"><div><span className="eyebrow-label">Shared experiences</span><h2>What people remember.</h2></div><span>{reviews.length} PUBLISHED {reviews.length===1?"REVIEW":"REVIEWS"}</span></div>
        {reviews.length===0?<PublicEmptyState eyebrow="Community feedback" title="Your experience can help shape what comes next." description="There are no public testimonials to display yet. If you have worked with TGO DevStudio, you can share feedback below. Submissions are reviewed before publication." primaryHref="#review-form" primaryLabel="Share your experience"/>:
        <div className="testimonials-grid">{reviews.map(review=><Link key={review._id.toString()} href={"/testimonials/"+review._id.toString()} className="testimonials-card"><Quote size={25}/><div className="testimonials-stars">{Array.from({length:5},(_,i)=><Star key={i} size={14} fill={i<review.rating?"currentColor":"none"} />)}</div><p>{review.body}</p><div className="testimonials-author"><b>{review.submitterName}</b><small>{review.customLabel||review.targetLabelSnapshot}</small></div><span className="testimonials-read">Read full review <ArrowUpRight size={15}/></span></Link>)}</div>}
      </div></section>
      <section id="review-form" className="testimonials-submit"><div className="home-container"><div className="testimonials-submit-intro"><span className="eyebrow-label">Share your experience</span><h2>Your perspective<br/>helps us improve.</h2><p>If you have worked with TGO DevStudio, tell us what went well and where we can do better. Submissions are reviewed before publication.</p></div><div className="testimonials-form-shell"><h3>Leave a review</h3><ReviewForm/></div></div></section>
    </main>
  );
}
