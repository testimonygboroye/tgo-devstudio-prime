import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import BookACallClient from "./BookACallClient";

export default async function BookACallSettingsPage() {
  const session = await getServerSession();
  guardCanEdit(session!, "bookACallSettings");
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Book a Call Settings</h1>
      <div className="mt-8">
        <BookACallClient />
      </div>
    </div>
  );
}
