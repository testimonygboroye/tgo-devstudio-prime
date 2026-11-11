import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import PublicSiteSettingsEditor from "@/components/admin/PublicSiteSettingsEditor";

export default async function PublicSiteSettingsPage() {
  const session = await getServerSession();
  guardCanEdit(session!, "pageContent");
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Website Content · Global controls</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Site Identity, Header & Footer</h1>
      <p className="mt-2 max-w-3xl text-sm text-neutral-400">Manage the public brand identity, logo, navigation, announcement strip, header actions, footer columns, contact details and social links from one place.</p>
      <div className="mt-8"><PublicSiteSettingsEditor /></div>
    </div>
  );
}
