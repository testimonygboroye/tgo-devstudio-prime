import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import FaqItem from "@/models/FaqItem";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import { getAdminBasePath } from "@/lib/adminPath";

export default async function FaqItemsListPage() {
  const session = await getServerSession();
  guardCanView(session!, "faqItems");
  await connectToDatabase();
  const items = await FaqItem.find().sort({ category: 1, displayOrder: 1 }).lean();
  const basePath = getAdminBasePath();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
          <h1 className="mt-1 text-3xl font-bold brand-gradient-text">FAQ Items</h1>
        </div>
        <Link
          href={`${basePath}/faq-items/new`}
          className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950"
        >
          New FAQ
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {items.length === 0 && <p className="text-neutral-400">No FAQ items yet. Add your first one.</p>}
        {items.map((item) => (
          <Link
            key={item._id.toString()}
            href={`${basePath}/faq-items/${item._id.toString()}`}
            className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-100">{item.question}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  item.publishStatus === "published"
                    ? "bg-brand-cyan-400/20 text-brand-cyan-300"
                    : "bg-neutral-600/30 text-neutral-400"
                }`}
              >
                {item.publishStatus}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-400">{item.category}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
