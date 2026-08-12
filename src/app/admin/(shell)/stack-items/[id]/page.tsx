import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import StackItem from "@/models/StackItem";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import StackItemForm from "@/components/admin/StackItemForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStackItemPage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanEdit(session!, "stackItems");
  const { id } = await params;
  await connectToDatabase();
  const item = await StackItem.findById(id).lean();

  if (!item) {
    notFound();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Edit Stack Item</h1>
      <div className="mt-8">
        <StackItemForm
          mode="edit"
          itemId={id}
          initialData={{
            category: item.category,
            title: item.title,
            description: item.description,
            displayOrder: item.displayOrder,
            publishStatus: item.publishStatus,
          }}
        />
      </div>
    </div>
  );
}
