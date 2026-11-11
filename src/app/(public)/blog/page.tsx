import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { getPubliclyVisibleFilter } from "@/lib/utils/blogVisibility";
import SmartImage from "@/components/public/SmartImage";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator, getLocalizedContent } from "@/lib/i18n/translationHelper";
import { TRANSLATABLE_FIELDS } from "@/lib/i18n/translatableFields";
import PublicEmptyState from "@/components/public/PublicEmptyState";

export const revalidate=300;
export const metadata:Metadata={title:"Blog | TGO DevStudio Prime",description:"Insights on software engineering, product, and building with TGO DevStudio.",alternates:{canonical:"/blog"}};

export default async function BlogListPage(){
  const locale=await getServerLocale();
  const t=createTranslator(locale);
  await connectToDatabase();
  const rawPosts=await BlogPost.find(getPubliclyVisibleFilter()).sort({featured:-1,createdAt:-1}).lean();
  const posts=rawPosts.map(post=>getLocalizedContent(post,locale,TRANSLATABLE_FIELDS.BlogPost));
  const allTags=Array.from(new Set(posts.flatMap(post=>post.tags||[]))).slice(0,12);
  return (
    <main className="blog-index-page">
      <section className="blog-index-hero"><div className="home-container"><span className="eyebrow-label">{t("nav.blog")} · THE TGO JOURNAL</span><h1>Ideas worth<br/><em>putting to work.</em></h1><p>{t("blog.subtitle")}</p><div className="blog-index-hero-foot"><span><BookOpen size={16}/> Practical perspectives, thoughtful guides and studio notes.</span><span><Sparkles size={16}/> Curiosity, made useful.</span></div></div></section>
      <section className="blog-index-content"><div className="home-container">
        <div className="blog-index-heading"><div><span className="eyebrow-label">Latest thinking</span><h2>Explore the journal.</h2></div><span>{posts.length} {posts.length===1?"ARTICLE":"ARTICLES"}</span></div>
        {allTags.length>0&&<div className="blog-tag-row">{allTags.map(tag=><span key={tag}>{tag}</span>)}</div>}
        {posts.length===0?<PublicEmptyState eyebrow="Studio insights" title="New perspectives are being prepared." description="Our articles explore software engineering, product decisions, practical technology and the craft of building dependable digital experiences. In the meantime, explore our capabilities or talk with the team." primaryHref="/services" primaryLabel="Explore services" secondaryHref="/contact" secondaryLabel="Talk to TGO"/>:
          <div className="blog-index-grid">{posts.map((post,index)=><Link key={post._id.toString()} href={"/blog/"+post.slug} className={"blog-index-card "+(index===0?"blog-index-featured":"")}><div className="blog-index-image"><SmartImage src={post.coverImage?.url} alt={post.coverImage?.altText||post.title} label={post.title}/><span>JOURNAL / {String(index+1).padStart(2,"0")}</span></div><div className="blog-index-card-copy"><small>{post.tags?.[0]||"Studio journal"}</small><h3>{post.title}</h3><p>{post.excerpt}</p><b>{t("blog.readArticle")} <ArrowUpRight size={16}/></b></div></Link>)}</div>}
      </div></section>
    </main>
  );
}
