import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ClientRegistrationCompleteForm from "@/components/client/ClientRegistrationCompleteForm";
export const metadata = { title: "Complete Client Registration | TGO DevStudio" };
export default async function ClientRegistrationCompletePage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("tgo_client_registration_token")?.value) redirect("/client/register");
  return <ClientRegistrationCompleteForm/>;
}
