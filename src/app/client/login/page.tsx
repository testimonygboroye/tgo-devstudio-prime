import { cookies } from "next/headers";
import ClientAuthForm from "@/components/client/ClientAuthForm";

export const metadata = { title: "Client Sign In | TGO DevStudio" };

export default async function ClientLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; two_factor?: string }> }) {
  const cookieStore = await cookies();
  const googleTempToken = cookieStore.get("tgo_client_temp_2fa")?.value || "";
  const params = await searchParams;
  return <main className="flex min-h-screen items-center justify-center bg-[#080d20] px-5 py-12"><div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(104,64,220,.24),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,.12),transparent_35%)]"/><div className="relative w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#10172b]/80 p-5 shadow-[0_30px_100px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-9"><ClientAuthForm mode="login" googleTempToken={googleTempToken} oauthError={params.error || (params.two_factor === "required" && !googleTempToken ? "two_factor_expired" : "")}/></div></main>;
}
