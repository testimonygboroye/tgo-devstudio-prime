import AdminDepartmentHub from "@/components/admin/AdminDepartmentHub";
import { getAdminBasePath } from "@/lib/adminPath";
import { KeyRound, ShieldCheck, ScrollText, Settings, HelpCircle, BookOpen, Zap } from "lucide-react";

export default function SecurityAdministrationPage() {
  return <AdminDepartmentHub
    basePath={getAdminBasePath()}
    eyebrow="Trust, security & administration"
    title="Security & Administration"
    description="A single place for account protection, privacy operations, governance records, administrative preferences and internal help resources."
    sections={[
      { title: "Trust & governance", description: "Protect accounts and maintain an accountable operational record.", items: [
        { label: "Security & Two-Factor Authentication", description: "Review account security, two-factor authentication and active sessions.", hrefSuffix: "/security", icon: KeyRound },
        { label: "Privacy Requests", description: "Review and process privacy, data access and deletion requests.", hrefSuffix: "/privacy-requests", icon: ShieldCheck },
        { label: "Audit Log", description: "Review the governance trail of human, AI and automated platform actions.", hrefSuffix: "/audit-log", icon: ScrollText },
      ]},
      { title: "Administration & help", description: "Manage your administration preferences and find operational guidance.", items: [
        { label: "Admin Settings", description: "Manage administration preferences, theme, language and notification settings.", hrefSuffix: "/settings", icon: Settings },
        { label: "Help & Guide", description: "Read guidance for using the TGO administration environment.", hrefSuffix: "/help", icon: HelpCircle },
        { label: "Knowledge Base Articles", description: "Create and manage internal help and guidance articles.", hrefSuffix: "/help-articles", icon: BookOpen },
        { label: "Availability", description: "Manage public availability and service status information.", hrefSuffix: "/availability", icon: Zap },
      ]},
    ]}
  />;
}
