import { connectToDatabase } from "@/lib/db";
import AvailabilityStatus from "@/models/AvailabilityStatus";
import { AVAILABILITY_LABELS, AVAILABILITY_DEFAULT } from "@/lib/constants/pageDefaults";

export default async function AvailabilityBadge() {
  await connectToDatabase();
  const saved = await AvailabilityStatus.findOne().lean();
  const availability = saved || AVAILABILITY_DEFAULT;
  const config = AVAILABILITY_LABELS[availability.state];

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-base-800 bg-base-900 px-4 py-2 text-sm text-neutral-100">
      <span className={`h-2 w-2 rounded-full ${config.color}`} />
      {availability.customMessage || config.label}
    </div>
  );
}
