import AdminDepartmentHub from "@/components/admin/AdminDepartmentHub";
import { getAdminBasePath } from "@/lib/adminPath";
import { getServerSession } from "@/lib/auth/serverSession";
import { Network, UserCog, UserPlus, Inbox, ShieldCheck, ClipboardList, WalletCards, BookOpen, MessageCircle } from "lucide-react";

export default async function PeopleOperationsPage() {
  const session = await getServerSession();
  return <AdminDepartmentHub
    basePath={getAdminBasePath()}
    isFounder={session?.role?.isFounderRole === true}
    eyebrow="People & operations"
    title="People & Operations"
    description="A single workspace for workforce administration, access, recruitment, business operations, employee services and team collaboration."
    sections={[
      { title: "People & access", description: "Manage the people, identities and permissions that make up the organisation.", items: [
        { label: "Workforce Management", description: "Manage employee records, teams, departments, schedules and workforce activity.", hrefSuffix: "/workforce", publicHref: "/workforce", icon: Network },
        { label: "Users & Access", description: "Manage user accounts, account status and access assignments.", hrefSuffix: "/users", icon: UserCog },
        { label: "Invitations", description: "Invite staff and manage outstanding account invitations.", hrefSuffix: "/invites", icon: UserPlus },
        { label: "Recruitment & Applications", description: "Review job applications and recruitment activity.", hrefSuffix: "/applications", icon: Inbox },
        { label: "Access Roles", description: "Manage administrative roles and role assignments.", hrefSuffix: "/roles", icon: ShieldCheck },
      ]},
      { title: "Business operations", description: "Founder-managed operational tools and employee services.", items: [
        { label: "Business Operations", description: "Manage operational workflows, requests and business administration.", hrefSuffix: "/operations", icon: ClipboardList, founderOnly: true },
        { label: "Payroll & Compensation", description: "Manage payroll records, compensation and related approvals.", hrefSuffix: "/operations/payroll", icon: WalletCards, founderOnly: true },
        { label: "Training & Development", description: "Manage employee training, learning and development records.", hrefSuffix: "/operations/training", icon: BookOpen, founderOnly: true },
        { label: "Private Document Vault", description: "Manage protected workforce and business documents.", hrefSuffix: "/operations/documents", icon: ShieldCheck, founderOnly: true },
      ]},
      { title: "Collaboration", description: "Shared spaces for cross-team coordination and work.", items: [
        { label: "Universal Workspaces", description: "Manage shared workspaces, channels, tasks, milestones and documents.", hrefSuffix: "/workspaces", icon: MessageCircle },
      ]},
    ]}
  />;
}
