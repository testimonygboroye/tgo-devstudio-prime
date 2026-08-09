import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import ApplicationsListClient from "./ApplicationsListClient";

export default async function ApplicationsListPage() {
  const session = await getServerSession();
  guardCanView(session!, "jobApplications");
  return <ApplicationsListClient />;
}
