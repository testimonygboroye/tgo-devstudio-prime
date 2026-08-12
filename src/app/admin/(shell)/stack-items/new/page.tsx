import StackItemForm from "@/components/admin/StackItemForm";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanCreate } from "@/lib/auth/pageGuards";

export default async function NewStackItemPage() {
  const session = await getServerSession();
  guardCanCreate(session!, "stackItems");
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">New Stack Item</h1>
      <div className="mt-8">
        <StackItemForm mode="create" />
      </div>
    </div>
  );
}
