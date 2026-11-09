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
    id: "clients",
    name: "Client Management",
    description: "Unified client profiles, relationships and account activity.",
    category: "business",
    requiredPermission: "clients.view",
    status: "planned",
  },
  {
    id: "projects",
    name: "Projects & Delivery",
    description: "Commercial projects, milestones, deliverables and approvals.",
    category: "business",
    requiredPermission: "projects.view",
    status: "planned",
  },
  {
    id: "finance",
    name: "Finance & Commerce",
    description: "Orders, payment records, account credits and financial controls.",
    category: "business",
    requiredPermission: "finance.view",
    status: "planned",
  },
  {
    id: "workforce",
    name: "Workforce",
    description: "Departments, teams, employee records and organizational structure.",
    category: "business",
    requiredPermission: "workforce.view",
    status: "planned",
  },
  {
    id: "workspace",
    name: "Universal Workspace",
    description: "Shared collaboration, communication, tasks and documents.",
    category: "business",
    requiredPermission: "workspace.view",
    status: "planned",
  },
  {
    id: "ai-workforce",
    name: "AI Workforce",
    description: "Governed AI agents, provider connections and delegated execution.",
    category: "intelligence",
    requiredPermission: "ai.agents.view",
    status: "planned",
  },
] as const;
