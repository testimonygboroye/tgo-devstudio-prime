import { cookies } from "next/headers";
import ClientAuthForm from "@/components/client/ClientAuthForm";

export const metadata = { title: "Client Sign In | TGO DevStudio" };

export default async function ClientLoginPage() {
  const cookieStore = await cookies();
  const rememberedEmail = cookieStore.get("tgo_client_account")?.value || "";
  return <main className="flex min-h-screen items-center justify-center bg-[#080d20] px-5 py-12"><div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(104,64,220,.24),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,.12),transparent_35%)]"/><div className="relative w-full"><ClientAuthForm mode="login" rememberedEmail={rememberedEmail}/></div></main>;
}
