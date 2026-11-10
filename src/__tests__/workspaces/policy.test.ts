import {canCreateWorkspaceKind,canInviteWorkspaceMember,canManageWorkspace,canReadPrivateChannel} from "@/lib/workspaces/policy";
describe("workspace authorization policy",()=>{
 test("only owner, admin and manager can administer a workspace",()=>{expect(canManageWorkspace("owner")).toBe(true);expect(canManageWorkspace("admin")).toBe(true);expect(canManageWorkspace("manager")).toBe(true);expect(canManageWorkspace("member")).toBe(false);expect(canManageWorkspace("guest")).toBe(false);});
 test("member invitation setting does not grant administrative privileges",()=>{expect(canInviteWorkspaceMember("member",true)).toBe(true);expect(canInviteWorkspaceMember("member",false)).toBe(false);expect(canInviteWorkspaceMember("manager",false)).toBe(true);});
 test("clients can create only client-facing workspace types",()=>{expect(canCreateWorkspaceKind("client","client",false)).toBe(true);expect(canCreateWorkspaceKind("project","client",false)).toBe(true);expect(canCreateWorkspaceKind("department","client",false)).toBe(false);});
 test("AI workspaces require the governed agent registry",()=>{expect(canCreateWorkspaceKind("ai","staff",true)).toBe(false);});
 test("private channels are visible only to managers, members or creator",()=>{expect(canReadPrivateChannel("member",false,false)).toBe(false);expect(canReadPrivateChannel("member",true,false)).toBe(true);expect(canReadPrivateChannel("manager",false,false)).toBe(true);expect(canReadPrivateChannel("member",false,true)).toBe(true);});
});
