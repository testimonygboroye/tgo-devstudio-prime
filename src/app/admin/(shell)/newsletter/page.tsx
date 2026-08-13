import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import NewsletterClient from "./NewsletterClient";

export default async function NewsletterPage() {
  const session = await getServerSession();
  guardCanView(session!, "newsletterSubscribers");
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Newsletter Subscribers</h1>
      <div className="mt-8">
        <NewsletterClient />
      </div>
    </div>
  );
}
