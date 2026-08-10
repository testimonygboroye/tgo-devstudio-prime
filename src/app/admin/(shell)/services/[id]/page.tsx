import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import ServiceForm from "@/components/admin/ServiceForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanEdit(session!, "services");
  const { id } = await params;
  await connectToDatabase();
  const service = await Service.findById(id).lean();

  if (!service) {
    notFound();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Edit Service</h1>
      <div className="mt-8">
        <ServiceForm
          mode="edit"
          serviceId={id}
          initialData={{
            title: service.title,
            summary: service.summary,
            icon: service.icon,
            displayOrder: service.displayOrder,
            publishStatus: service.publishStatus,
          }}
        />
      </div>
    </div>
  );
}
