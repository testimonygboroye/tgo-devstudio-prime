import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import ContactListClient from "./ContactListClient";

export default async function ContactListPage() {
  const session = await getServerSession();
  guardCanView(session!, "contactSubmissions");
  return <ContactListClient />;
}
