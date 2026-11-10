# Phase 6 — Universal Workspace & Communication

## Shared ownership
The collaboration domain is shared by client, employee and founder accounts through the existing authenticated User identity. It does not create a second authentication system. Every read and write is scoped to an active WorkspaceMembership record.

## Core collections
- Workspace: purpose, workspace kind, owner, visibility, linked organization/department/team/client/project and configurable member/AI policies.
- WorkspaceMembership: user, member type, role, scoped permissions and invitation/access lifecycle.
- WorkspaceChannel: public/private/announcement channels, creator and private membership list.
- WorkspaceMessage: direct/group/channel messages, thread roots, mentions, edit/deletion markers and attachment metadata.
- WorkspaceTask: assignees, priority, workflow state, due date, parent task and milestone.
- WorkspaceMilestone: planned/active/at-risk/completed delivery markers.
- WorkspaceDocument: versioned shared content and review state.
- WorkspaceComment: auditable comments on documents, tasks, milestones and messages.
- WorkspaceApproval: reviewer-scoped document approval requests and decisions.
- WorkspaceActivity: actor, action, target and structured metadata.

## Authorization
All endpoints use the shared server session and require active workspace membership. Owner/admin/manager roles can administer membership and approve documents. Private channel reads are limited to workspace managers, channel members and the channel creator. Task updates are limited to the task creator, assignees or workspace managers. Client accounts can create client-facing, project, direct and group workspace types; AI workspaces are not created until an AI agent identity exists in the governed agent registry.

## Workflows
1. A signed-in user creates a workspace. The creator becomes owner and a General channel is created.
2. A workspace manager invites an existing account by email. The recipient receives an in-app notification and must explicitly accept the invitation.
3. Members create messages and thread replies. Mention and workspace message notifications use the shared notification collection.
4. Members create tasks, subtasks and milestones. Assignees and managers can update task status.
5. Members create shared documents and comments. An approval request creates a reviewer-scoped approval record; authorized reviewers record approve/reject decisions.
6. File attachments are uploaded to the configured Cloudinary account only after session and membership checks. MIME types and file size are restricted.
7. Search is scoped to the workspace and excludes private-channel messages unless the user has channel access.

## Traceability and operations
Important collaboration actions create WorkspaceActivity records and shared PlatformAuditEvent records. Notifications use PlatformNotification. MongoDB indexes cover workspace membership lookups, channel/message timelines, task assignments, due dates, document status and activity history.

## Explicit integration dependencies
- Meeting-provider synchronization (Google Calendar, Zoom, Microsoft Teams) requires approved OAuth applications, callback URLs and secret storage. No meeting is claimed to be synchronized until those credentials and provider adapters are configured.
- AI workspace assistance and AI-agent membership require the governed AI provider/model/agent registry and scoped agent identity. No simulated assistant or fake AI member is exposed.
- Workspace files require Cloudinary credentials. If missing, upload returns a clear 503 rather than pretending a file was stored.

## Current user surface
The responsive /workspaces route provides workspace discovery/creation, message and thread composition, file uploads, task status changes, channel creation, document creation, search, approval requests, membership visibility, activity history and explicit meeting/AI integration readiness states.
