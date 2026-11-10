import ClientRegistrationVerification from "@/components/client/ClientRegistrationVerification";
export const metadata = { title: "Verify Email | TGO DevStudio" };
export default async function ClientRegistrationVerifyPage({searchParams}:{searchParams:Promise<{token?:string}>}) {
  const params=await searchParams;
  return <ClientRegistrationVerification token={params.token||""}/>;
}
