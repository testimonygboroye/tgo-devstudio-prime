import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import ProcessStep from "@/models/ProcessStep";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import { getAdminBasePath } from "@/lib/adminPath";

export default async function ProcessListPage() {
  const session = await getServerSession();
  guardCanView(session!, "processSteps");
  await connectToDatabase();
  const steps = await ProcessStep.find().sort({ displayOrder: 1 }).lean();
  const basePath = getAdminBasePath();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
          <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Process Steps</h1>
        </div>
        <Link
          href={`${basePath}/process/new`}
          className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950"
        >
          New Step
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {steps.length === 0 && <p className="text-neutral-400">No process steps yet. Add your first one.</p>}
        {steps.map((step, index) => (
          <Link
            key={step._id.toString()}
            href={`${basePath}/process/${step._id.toString()}`}
            className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-100">
                {index + 1}. {step.title}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  step.publishStatus === "published"
                    ? "bg-brand-cyan-400/20 text-brand-cyan-300"
                    : "bg-neutral-600/30 text-neutral-400"
                }`}
              >
                {step.publishStatus}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-400">{step.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
