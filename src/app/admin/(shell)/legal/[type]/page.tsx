import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import LegalDocumentEditClient from "./LegalDocumentEditClient";

interface PageProps {
  params: Promise<{ type: string }>;
}

const TYPE_LABELS: Record<string, { title: string; defaultTitle: string }> = {
  "privacy-policy": { title: "Privacy Policy", defaultTitle: "Privacy Policy" },
  "terms-of-service": { title: "Terms of Service", defaultTitle: "Terms of Service" },
};

export default async function LegalDocumentEditPage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanEdit(session!, "legalDocuments");
  const { type } = await params;

  const config = TYPE_LABELS[type];
  if (!config) {
    notFound();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">{config.title}</h1>
      <div className="mt-8">
        <LegalDocumentEditClient
          type={type as "privacy-policy" | "terms-of-service"}
          defaultTitle={config.defaultTitle}
        />
      </div>
    </div>
  );
}
