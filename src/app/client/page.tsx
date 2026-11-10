import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";

export default async function ClientEntryPage() {
  const session = await getServerSession();
  if (session?.user.accountType === "client" && session.user.isEmailVerified) redirect("/client/dashboard");
  redirect("/client/login");
}
