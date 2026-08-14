import FaqItemForm from "@/components/admin/FaqItemForm";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanCreate } from "@/lib/auth/pageGuards";

export default async function NewFaqItemPage() {
  const session = await getServerSession();
  guardCanCreate(session!, "faqItems");
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">New FAQ</h1>
      <div className="mt-8">
        <FaqItemForm mode="create" />
      </div>
    </div>
  );
}
