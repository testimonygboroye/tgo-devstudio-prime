import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { SERVICE_ICON_MAP } from "@/lib/constants/serviceIcons";
import { Code } from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Services | TGO DevStudio Prime",
  description: "Full-stack software engineering services from TGO DevStudio.",
  openGraph: {
    title: "Services | TGO DevStudio Prime",
    description: "Full-stack software engineering services from TGO DevStudio.",
    type: "website",
  },
};

export default async function ServicesPage() {
  await connectToDatabase();
  const services = await Service.find({ publishStatus: "published" })
    .sort({ displayOrder: 1 })
    .lean();

  return (
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Services</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">What We Do</h1>
        <p className="mt-4 max-w-2xl text-neutral-100/70">
          Full-stack engineering services built to take your product from idea to production,
          and beyond.
        </p>

        {services.length === 0 ? (
          <p className="mt-12 text-neutral-400">Our service offerings are being finalized — check back soon.</p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const IconComp = SERVICE_ICON_MAP[service.icon] || Code;
              return (
                <div
                  key={service._id.toString()}
                  className="rounded-xl border border-base-800 bg-base-900 p-6 transition-colors hover:border-brand-cyan-400/50"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg brand-gradient-bg text-base-950">
                    <IconComp size={22} />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-neutral-100">{service.title}</h2>
                  <p className="mt-2 text-sm text-neutral-400">{service.summary}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
