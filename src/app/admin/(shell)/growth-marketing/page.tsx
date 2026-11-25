import AdminDepartmentHub from "@/components/admin/AdminDepartmentHub";
import { getAdminBasePath } from "@/lib/adminPath";
import { getServerSession } from "@/lib/auth/serverSession";
import { Megaphone, SearchCheck, Gift } from "lucide-react";

export default async function GrowthMarketingPage() {
  const session = await getServerSession();
  return <AdminDepartmentHub
    basePath={getAdminBasePath()}
    isFounder={session?.role?.isFounderRole === true}
    eyebrow="Growth & marketing"
    title="Growth & Marketing"
    description="A unified workspace for demand generation, search visibility, campaign performance, customer engagement and referral growth."
    sections={[
      { title: "Growth operations", description: "Choose the growth system you want to manage.", items: [
        { label: "Marketing & Sales", description: "Manage growth campaigns, marketing activity, sales pipeline and lead-generation operations.", hrefSuffix: "/growth", icon: Megaphone, founderOnly: true },
        { label: "SEO Operations", description: "Manage search visibility, technical SEO, search performance and optimisation workflows.", hrefSuffix: "/seo", icon: SearchCheck, founderOnly: true },
        { label: "Rewards & Referrals", description: "Manage loyalty, engagement, referral programmes and customer rewards.", hrefSuffix: "/engagement", icon: Gift, founderOnly: true },
      ]},
    ]}
  />;
}
