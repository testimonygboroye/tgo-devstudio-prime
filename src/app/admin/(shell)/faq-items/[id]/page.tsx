import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import FaqItem from "@/models/FaqItem";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import FaqItemForm from "@/components/admin/FaqItemForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFaqItemPage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanEdit(session!, "faqItems");
  const { id } = await params;
  await connectToDatabase();
  const item = await FaqItem.findById(id).lean();

  if (!item) {
    notFound();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Edit FAQ</h1>
      <div className="mt-8">
        <FaqItemForm
          mode="edit"
          itemId={id}
          initialData={{
            question: item.question,
            answer: item.answer,
            category: item.category,
            displayOrder: item.displayOrder,
            publishStatus: item.publishStatus,
          }}
        />
      </div>
    </div>
  );
}
