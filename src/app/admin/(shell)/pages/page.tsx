import Link from "next/link";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import { getAdminBasePath } from "@/lib/adminPath";

export default async function PagesHubPage() {
  const session = await getServerSession();
  guardCanView(session!, "pageContent");
  const basePath = getAdminBasePath();

  const pages = [
    { type: "about", label: "About Page", description: "Edit the studio's About page content." },
    { type: "privacy-policy", label: "Privacy Policy", description: "Edit the site's privacy policy." },
    { type: "terms-of-service", label: "Consumer Terms of Service", description: "Edit the site's terms of service." },
    { type: "usage-policy", label: "Website Usage Policy", description: "Manage acceptable use, prohibited activity and security reporting." },
    { type: "accessibility", label: "Accessibility Statement", description: "Edit the accessibility statement." },
  ];

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Site Pages</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {pages.map((page) => (
          <Link
            key={page.type}
            href={`${basePath}/pages/${page.type}`}
            className="group block rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-lg transition-all hover:-translate-y-1 hover:border-brand-cyan-400/60 hover:shadow-xl"
          >
            <span className="font-semibold text-neutral-100">{page.label}</span>
            <p className="mt-1 text-sm text-neutral-400">{page.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
