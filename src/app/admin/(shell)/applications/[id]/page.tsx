import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import ApplicationDetailClient from "./ApplicationDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanView(session!, "jobApplications");
  const { id } = await params;
  return <ApplicationDetailClient id={id} />;
}
