import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import HomeSettingsClient from "./HomeSettingsClient";

export default async function HomeSettingsPage() {
  const session = await getServerSession();
  guardCanEdit(session!, "homeSettings");
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Homepage Settings</h1>
      <div className="mt-8">
        <HomeSettingsClient />
      </div>
    </div>
  );
}
