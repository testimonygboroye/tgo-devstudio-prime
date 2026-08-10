import Link from "next/link";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import { getAdminBasePath } from "@/lib/adminPath";

export default async function LegalHubPage() {
  const session = await getServerSession();
  guardCanView(session!, "legalDocuments");
  const basePath = getAdminBasePath();

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Legal Documents</h1>

      <div className="mt-8 space-y-3">
        <Link
          href={`${basePath}/legal/privacy-policy`}
          className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
        >
          <span className="font-semibold text-neutral-100">Privacy Policy</span>
          <p className="mt-1 text-sm text-neutral-400">Edit the site's privacy policy content.</p>
        </Link>
        <Link
          href={`${basePath}/legal/terms-of-service`}
          className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
        >
          <span className="font-semibold text-neutral-100">Terms of Service</span>
          <p className="mt-1 text-sm text-neutral-400">Edit the site's terms of service content.</p>
        </Link>
      </div>
    </div>
  );
}
