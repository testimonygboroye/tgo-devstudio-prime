import ProcessStepForm from "@/components/admin/ProcessStepForm";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanCreate } from "@/lib/auth/pageGuards";

export default async function NewProcessStepPage() {
  const session = await getServerSession();
  guardCanCreate(session!, "processSteps");
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">New Process Step</h1>
      <div className="mt-8">
        <ProcessStepForm mode="create" />
      </div>
    </div>
  );
}
