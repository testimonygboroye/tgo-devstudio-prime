import ClientAuthForm from "@/components/client/ClientAuthForm";

export const metadata = { title: "Create Client Account | TGO DevStudio" };

export default async function ClientRegisterPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const params = await searchParams;
  const referralCode = String(params.ref || "").trim().toUpperCase();
  return <main className="flex min-h-screen items-center justify-center bg-[#080d20] px-5 py-12"><div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(104,64,220,.24),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,.12),transparent_35%)]"/><div className="relative w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#10172b]/80 p-5 shadow-[0_30px_100px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-9"><ClientAuthForm mode="register" referralCode={referralCode}/></div></main>;
}
