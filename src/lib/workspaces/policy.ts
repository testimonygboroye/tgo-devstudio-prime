export type WorkspaceRole = "owner" | "admin" | "manager" | "member" | "guest" | "agent";
export type WorkspaceKind = "company" | "department" | "team" | "employee" | "client" | "project" | "direct" | "group" | "ai";
const MANAGER_ROLES: readonly WorkspaceRole[] = ["owner","admin","manager"];
export function canManageWorkspace(role: WorkspaceRole): boolean { return MANAGER_ROLES.includes(role); }
export function canInviteWorkspaceMember(role: WorkspaceRole, allowMemberInvites: boolean): boolean { return canManageWorkspace(role) || allowMemberInvites; }
export function canCreateWorkspaceKind(kind: WorkspaceKind, accountType: string, isFounder: boolean): boolean {
  if (kind === "ai") return false; // AI identities are provisioned by the governed AI-agent registry.
  if (isFounder) return true;
  if (accountType === "client") return ["client","project","direct","group"].includes(kind);
  return true;
}
export function canReadPrivateChannel(role: WorkspaceRole, isChannelMember: boolean, isCreator: boolean): boolean {
  return canManageWorkspace(role) || isChannelMember || isCreator;
}
