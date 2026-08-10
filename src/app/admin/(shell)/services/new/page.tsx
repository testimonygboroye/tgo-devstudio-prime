import ServiceForm from "@/components/admin/ServiceForm";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanCreate } from "@/lib/auth/pageGuards";

export default async function NewServicePage() {
  const session = await getServerSession();
  guardCanCreate(session!, "services");
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">New Service</h1>
      <div className="mt-8">
        <ServiceForm mode="create" />
      </div>
    </div>
  );
}
