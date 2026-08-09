import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import ContactDetailClient from "./ContactDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanView(session!, "contactSubmissions");
  const { id } = await params;
  return <ContactDetailClient id={id} />;
}
