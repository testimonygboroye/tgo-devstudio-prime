import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import GrowthOperations from "@/components/admin/platform/GrowthOperations";
export const dynamic="force-dynamic";
export default async function GrowthPage(){const session=await getServerSession();if(!session)redirect(`${getAdminBasePath()}/login`);if(!session.role.isFounderRole)redirect(`${getAdminBasePath()}/dashboard`);return <main className="mx-auto max-w-7xl pb-12"><GrowthOperations/></main>;}
