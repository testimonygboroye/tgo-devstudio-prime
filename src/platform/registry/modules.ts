export type PlatformModuleStatus = "planned" | "available" | "maintenance";

export interface PlatformModuleDefinition {
  id: string;
  name: string;
  description: string;
  category: "foundation" | "business" | "intelligence";
  requiredPermission: string;
  status: PlatformModuleStatus;
  href?: string;
}

export const PLATFORM_MODULE_REGISTRY: readonly PlatformModuleDefinition[] = [
  {
    id: "identity-governance",
    name: "Identity & Governance",
    description: "Central access policies, roles, memberships and security controls.",
    category: "foundation",
    requiredPermission: "platform.access",
    status: "available",
  },
  {
    id: "business-ecosystem",
    name: "Business Ecosystem Directory",
    description: "Founder-managed organization records for internal units, clients, partners and vendors.",
    category: "business",
    requiredPermission: "platform.access",
    status: "available",
    href: "/businesses",
  },
  {
    id: "business-governance",
    name: "Business Roles & Permissions",
    description: "Founder-managed business roles and the central permission catalogue.",
    category: "foundation",
    requiredPermission: "governance.roles.view",
    status: "available",
    href: "/business-roles",
  },
  {
    id: "clients",
    name: "Client Management",
    description: "Client identity, CRM records, onboarding, enquiries, segmentation and account activity.",
    category: "business",
    requiredPermission: "clients.view",
    status: "available",
    href: "/clients",
  },
  {
    id: "projects",
    name: "Projects & Delivery",
    description: "Commercial projects, milestones, deliverables and approvals.",
    category: "business",
    requiredPermission: "projects.view",
    status: "available",
    href: "/commercial",
  },
  {
    id: "finance",
    name: "Finance & Commerce",
    description: "Orders, payment records, account credits and financial controls.",
    category: "business",
    requiredPermission: "finance.view",
    status: "available",
    href: "/finance",
  },
  {
    id: "workforce",
    name: "Workforce",
    description: "Departments, teams, employee records and organizational structure.",
    category: "business",
    requiredPermission: "workforce.view",
    status: "available",
    href: "/workforce",
  },
  {
    id: "workspace",
    name: "Universal Workspace",
    description: "Shared collaboration, communication, tasks and documents.",
    category: "business",
    requiredPermission: "workspace.view",
    status: "available",
    href: "/workspaces",
  },
  {
    id: "executive-intelligence",
    name: "Executive Intelligence",
    description: "Company-wide evidence-based analytics, forecasting, risk detection, recommendations, scheduled reports and decision tracking.",
    category: "intelligence",
    requiredPermission: "platform.access",
    status: "available",
    href: "/executive-intelligence",
  },
  {
    id: "ai-workforce",
    name: "AI Workforce",
    description: "AI workforce and chatbot interfaces exist, but provider-generation failures currently prevent reliable operation. Keep this module visible for diagnosis; do not present it as live until end-to-end tests pass.",
    category: "intelligence",
    requiredPermission: "ai.agents.view",
    status: "maintenance",
    href: "/ai-workforce",
  },
] as const;
