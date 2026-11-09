# Phase 1 — Data Domain Map

## Ownership and compatibility

The existing public CMS collections remain owned by the public-site administration. The Business Operating System introduces separate collections for its own authorization, audit, event and notification concerns. New commercial records must not reuse the existing public portfolio `Project`, public `Service`, CMS `Role` or CMS `Message` models.

## New platform collections

| Collection | Owner | Purpose | Key indexes |
|---|---|---|---|
| `businessroles` | Governance | Reusable scoped permission grants and explicit denies | Unique slug |
| `businessmemberships` | Identity / Workforce | Link an existing authenticated user to business roles and organizational scopes | Unique userId; status + updatedAt |
| `platformauditevents` | Governance | Append-oriented human, AI and system activity records | createdAt; actor + createdAt; module + action + createdAt; correlationId |
| `platformevents` | Event infrastructure | Durable outbox records for asynchronous business events | status + availableAt + createdAt; aggregate + createdAt; unique sparse idempotencyKey |
| `platformnotifications` | Notifications | User-scoped in-app notification records | recipient + createdAt; recipient + readAt; partial unique recipient + dedupeKey |

## Existing shared infrastructure

- `User` remains the authenticated identity record.
- `Role` remains the public CMS administration role.
- `connectToDatabase()` remains the single Mongoose connection entry point.
- Existing JWT cookies and server-session verification remain the authentication boundary.
- Existing `AuditLog` and `Message` collections remain operational for CMS administration.

## Data modeling rules for later phases

1. Every business record receives a stable MongoDB ObjectId and timestamps.
2. Every record that belongs to a client, project, workspace, department or team must include an explicit ownership/scope field.
3. All list endpoints must apply authorization scope in the database query, not fetch broad data and filter only in the UI.
4. Financial values use integer minor units (kobo/cents) plus an ISO currency code. Never use floating-point arithmetic for money.
5. Ledger entries are append-only business facts. Corrections use compensating entries, not edits to posted entries.
6. Provider webhook IDs and external operation IDs receive unique idempotency constraints.
7. File metadata is stored separately from file bytes. Private file delivery must authorize every download and use short-lived signed access.
8. Event payloads carry schema versions and stable aggregate identifiers.
9. PII, credentials and payment secrets are excluded from general-purpose event payloads and audit metadata.
10. Retention and deletion policies are defined per domain before production data is collected.

## Transaction boundaries

MongoDB multi-document transactions will be used only after confirming the Atlas topology supports them and the transaction is necessary. The event-outbox write must be in the same transaction as the business-state change for workflows that require atomic event publication. If a transaction is not available, use an explicitly designed idempotent recovery process; never claim atomicity.

## Tenant and organization model

The initial system represents one TGO business with organizational departments and teams. Client organizations are distinct from TGO departments. If TGO later operates multiple legal entities or business tenants, add an explicit organization boundary and compound indexes before sharing records across those entities. Do not infer tenancy from email domains or role names.
