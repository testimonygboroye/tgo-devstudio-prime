import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import PageContentEditClient from "./PageContentEditClient";
import FounderSettingsClient from "./about/FounderSettingsClient";

interface PageProps {
  params: Promise<{ type: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  about: "About Page",
  "privacy-policy": "Privacy Policy",
  "terms-of-service": "Terms of Service",
};

export default async function PageContentEditPage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanEdit(session!, "pageContent");
  const { type } = await params;

  const label = TYPE_LABELS[type];
  if (!label) {
    notFound();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">{label}</h1>
      <div className="mt-8">
        <PageContentEditClient type={type as "about" | "privacy-policy" | "terms-of-service"} />
        {type === "about" && (
          <div className="mt-8">
            <FounderSettingsClient />
          </div>
        )}
      </div>
    </div>
  );
}
