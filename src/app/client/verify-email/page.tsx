import ClientEmailVerification from "@/components/client/ClientEmailVerification";

export const metadata = { title: "Verify Email | TGO DevStudio" };

export default async function VerifyClientEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return <ClientEmailVerification token={params.token || ""}/>;
}
