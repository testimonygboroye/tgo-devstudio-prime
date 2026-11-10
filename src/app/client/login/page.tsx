import { cookies } from "next/headers";
import ClientAuthForm from "@/components/client/ClientAuthForm";
import { readRememberedClientAccounts } from "@/lib/clients/account-selector";

export const metadata = { title: "Client Sign In | TGO DevStudio" };

export default async function ClientLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; two_factor?: string }> }) {
  const cookieStore = await cookies();
  const rememberedEmails = readRememberedClientAccounts(cookieStore.get("tgo_client_accounts")?.value);
  const legacyEmail = cookieStore.get("tgo_client_account")?.value || "";
  const googleTempToken = cookieStore.get("tgo_client_temp_2fa")?.value || "";
  const params = await searchParams;
  if (!rememberedEmails.length && legacyEmail) rememberedEmails.push(legacyEmail.toLowerCase());
  return <main className="flex min-h-screen items-center justify-center bg-[#080d20] px-5 py-12"><div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(104,64,220,.24),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,.12),transparent_35%)]"/><div className="relative w-full"><ClientAuthForm mode="login" rememberedEmails={rememberedEmails.slice(0, 1)} googleTempToken={googleTempToken} oauthError={params.error || (params.two_factor === "required" && !googleTempToken ? "two_factor_expired" : "")}/></div></main>;
}
