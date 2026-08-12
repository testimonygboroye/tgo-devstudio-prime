import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import AvailabilityClient from "./AvailabilityClient";

export default async function AvailabilityPage() {
  const session = await getServerSession();
  guardCanEdit(session!, "availabilityStatus");
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Availability Status</h1>
      <div className="mt-8">
        <AvailabilityClient />
      </div>
    </div>
  );
}
